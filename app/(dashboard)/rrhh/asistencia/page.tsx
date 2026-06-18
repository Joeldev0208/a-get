"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import { listarAsistencia, registrarAsistencia, actualizarAsistencia, eliminarAsistencia, listarEmpleados } from "@/lib/services/rrhh.service";
import { ServiceError } from "@/lib/services/supabase-service";
import type { Asistencia, Empleado, EstadoAsistencia } from "@/lib/types/rrhh";
import { Plus, Pencil, Trash2, ClipboardCheck } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// ── Formulario Asistencia ──────────────────────────────────────
function AsistenciaForm({ isOpen, onClose, onSuccess, asistencia, empleados }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; asistencia?: Asistencia | null; empleados: Empleado[] }) {
  const [empleadoId, setEmpleadoId] = useState("");
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState<EstadoAsistencia>("presente");
  const handleEstadoChange = (value: string) => setEstado(value as EstadoAsistencia);
  const [horaEntrada, setHoraEntrada] = useState("");
  const [horaSalida, setHoraSalida] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esEdicion = !!asistencia;

  useEffect(() => {
    if (isOpen) {
      setEmpleadoId(asistencia?.empleado_id || "");
      setFecha(asistencia?.fecha || "");
      setEstado(asistencia?.estado || "presente");
      setHoraEntrada(asistencia?.hora_entrada || "");
      setHoraSalida(asistencia?.hora_salida || "");
      setError(null);
    }
  }, [isOpen, asistencia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleadoId) { setError("Selecciona un empleado"); return; }
    if (!fecha) { setError("La fecha es obligatoria"); return; }
    try {
      setLoading(true);
      setError(null);
      const payload = {
        empleado_id: empleadoId,
        fecha,
        estado,
        hora_entrada: horaEntrada || null,
        hora_salida: horaSalida || null,
      };
      if (esEdicion) {
        await actualizarAsistencia(asistencia!.id, payload);
      } else {
        await registrarAsistencia(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar asistencia");
    } finally {
      setLoading(false);
    }
  };

  const empleadoOptions = empleados.map((e) => ({ value: e.id, label: e.nombre }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esEdicion ? "Editar Asistencia" : "Registrar Asistencia"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Empleado" name="empleadoId" type="select" value={empleadoId} onChange={setEmpleadoId} required options={empleadoOptions} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Fecha" name="fecha" type="date" value={fecha} onChange={setFecha} required />
          <FormField label="Estado" name="estado" type="select" value={estado} onChange={handleEstadoChange} options={[
            { value: "presente", label: "Presente" },
            { value: "ausente", label: "Ausente" },
            { value: "tarde", label: "Tarde" },
            { value: "permiso", label: "Permiso" },
          ]} />
          <FormField label="Hora Entrada" name="horaEntrada" type="text" value={horaEntrada} onChange={setHoraEntrada} placeholder="HH:MM" />
          <FormField label="Hora Salida" name="horaSalida" type="text" value={horaSalida} onChange={setHoraSalida} placeholder="HH:MM" />
        </div>
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text={esEdicion ? "Actualizar" : "Registrar"} />
      </form>
    </Modal>
  );
}

// ── Página principal ────────────────────────────────────────────
export default function AsistenciaPage() {
  const [data, setData] = useState<Asistencia[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Asistencia | null>(null);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmSkipKey, setConfirmSkipKey] = useState("");
  const [asistenciaToDelete, setAsistenciaToDelete] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [asistencias, emps] = await Promise.all([listarAsistencia(), listarEmpleados()]);
      setData(asistencias);
      setEmpleados(emps);
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  const handleNuevo = () => { setEditing(null); setIsOpen(true); };
  const handleEditar = (a: Asistencia) => { setEditing(a); setIsOpen(true); };
  const handleClose = () => { setIsOpen(false); setEditing(null); };
  const handleSuccess = () => { cargarDatos(); };

  const handleEliminar = async (id: string) => {
    const skipKey = "aget_confirm_skip_asistencia";
    if (localStorage.getItem(skipKey) === "true") {
      await eliminarAsistencia(id);
      cargarDatos();
      return;
    }
    setConfirmTitle("Eliminar Asistencia");
    setConfirmMessage("¿Estás seguro de eliminar este registro de asistencia?");
    setConfirmSkipKey(skipKey);
    setAsistenciaToDelete(id);
    setConfirmOpen(true);
  };

  const confirmarEliminar = async () => {
    if (asistenciaToDelete) {
      await eliminarAsistencia(asistenciaToDelete);
      cargarDatos();
      setAsistenciaToDelete(null);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      presente: "bg-green-100 text-green-800",
      ausente: "bg-red-100 text-red-800",
      tarde: "bg-yellow-100 text-yellow-800",
      permiso: "bg-blue-100 text-blue-800",
    };
    return styles[estado] || "bg-gray-100 text-gray-800";
  };

  const getEmpleadoNombre = (empleadoId: string) => empleados.find((e) => e.id === empleadoId)?.nombre || "—";

  return (
    <div>
      <PageHeader title="Asistencia" actions={
        <button onClick={handleNuevo} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
          <Plus size={16} /> Registrar Asistencia
        </button>
      } />

      {data.length === 0 ? (
        <EmptyState title="No hay registros de asistencia" description="Registra la asistencia diaria de tus empleados." action={
          <button onClick={handleNuevo} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><Plus size={16} /> Registrar</button>
        } />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Empleado</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Entrada</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Salida</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{getEmpleadoNombre(a.empleado_id)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{new Date(a.fecha).toLocaleDateString("es-DO")}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getEstadoBadge(a.estado)}`}>{a.estado}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{a.hora_entrada || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{a.hora_salida || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button onClick={() => handleEditar(a)} className="mr-2 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"><Pencil size={16} /></button>
                    <button onClick={() => handleEliminar(a.id)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setAsistenciaToDelete(null); }}
        onConfirm={confirmarEliminar}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        skipKey={confirmSkipKey}
      />

      <AsistenciaForm isOpen={isOpen} onClose={handleClose} onSuccess={handleSuccess} asistencia={editing} empleados={empleados} />
    </div>
  );
}