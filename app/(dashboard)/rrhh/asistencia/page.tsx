"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import { listarAsistencia, registrarAsistencia, listarEmpleados } from "@/lib/services/rrhh.service";
import { ServiceError } from "@/lib/services/supabase-service";
import type { AsistenciaConEmpleado, Empleado } from "@/lib/types/rrhh";
import { Plus } from "lucide-react";

const estadoStyles: Record<string, string> = {
  presente: "bg-green-100 text-green-800",
  ausente: "bg-red-100 text-red-800",
  tarde: "bg-yellow-100 text-yellow-800",
  permiso: "bg-blue-100 text-blue-800",
};

const estadoLabels: Record<string, string> = {
  presente: "Presente",
  ausente: "Ausente",
  tarde: "Tarde",
  permiso: "Permiso",
};

// ── Formulario de Asistencia ────────────────────────────────────
interface AsistenciaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  empleados: Empleado[];
}

function AsistenciaForm({ isOpen, onClose, onSuccess, empleados }: AsistenciaFormProps) {
  const [empleadoId, setEmpleadoId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [estado, setEstado] = useState("presente");
  const [horaEntrada, setHoraEntrada] = useState("");
  const [horaSalida, setHoraSalida] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEmpleadoId("");
    setFecha(new Date().toISOString().split("T")[0]);
    setEstado("presente");
    setHoraEntrada("");
    setHoraSalida("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleadoId) { setError("Debes seleccionar un empleado"); return; }
    if (!fecha) { setError("La fecha es obligatoria"); return; }

    try {
      setLoading(true);
      setError(null);
      await registrarAsistencia({
        empleado_id: empleadoId,
        fecha,
        estado: estado as any,
        hora_entrada: horaEntrada || null,
        hora_salida: horaSalida || null,
      });
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Error al registrar asistencia");
    } finally {
      setLoading(false);
    }
  };

  const empleadoOptions = empleados
    .filter((e) => e.activo)
    .map((e) => ({ value: e.id, label: e.nombre }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Asistencia" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Empleado" name="empleadoId" type="select" value={empleadoId} onChange={setEmpleadoId} required options={empleadoOptions} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Fecha" name="fecha" type="date" value={fecha} onChange={setFecha} required />
          <FormField label="Estado" name="estado" type="select" value={estado} onChange={setEstado}
            options={[
              { value: "presente", label: "Presente" },
              { value: "ausente", label: "Ausente" },
              { value: "tarde", label: "Tarde" },
              { value: "permiso", label: "Permiso" },
            ]}
          />
          <FormField label="Hora Entrada" name="horaEntrada" type="text" value={horaEntrada} onChange={setHoraEntrada} placeholder="08:00" />
          <FormField label="Hora Salida" name="horaSalida" type="text" value={horaSalida} onChange={setHoraSalida} placeholder="17:00" />
        </div>
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text="Registrar Asistencia" />
      </form>
    </Modal>
  );
}

// ── Botón wrapper ───────────────────────────────────────────────
function NuevaAsistenciaBtn({ onSuccess, empleados }: { onSuccess: () => void; empleados: Empleado[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
        <Plus size={16} />
        Registrar Asistencia
      </button>
      <AsistenciaForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} empleados={empleados} />
    </>
  );
}

// ── Página principal ────────────────────────────────────────────
export default function AsistenciaPage() {
  const [data, setData] = useState<AsistenciaConEmpleado[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [asistencia, empleadosList] = await Promise.all([listarAsistencia(), listarEmpleados()]);
      setData(asistencia);
      setEmpleados(empleadosList);
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  const handleNuevo = () => cargarDatos();

  return (
    <div>
      <PageHeader title="Asistencia" actions={<NuevaAsistenciaBtn onSuccess={handleNuevo} empleados={empleados} />} />

      {data.length === 0 ? (
        <EmptyState
          title="No hay registros de asistencia"
          description="Registra la asistencia diaria de los empleados."
          action={<NuevaAsistenciaBtn onSuccess={handleNuevo} empleados={empleados} />}
        />
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((registro) => (
                <tr key={registro.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{registro.empleados?.nombre || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{new Date(registro.fecha).toLocaleDateString("es-DO")}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoStyles[registro.estado] || "bg-gray-100 text-gray-800"}`}>
                      {estadoLabels[registro.estado] || registro.estado}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{registro.hora_entrada || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{registro.hora_salida || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}