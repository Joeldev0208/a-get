"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import {
  listarEmpleados, crearEmpleado, actualizarEmpleado, eliminarEmpleado,
  listarDepartamentos, listarAsistencia, registrarAsistencia
} from "@/lib/services/rrhh.service";
import { ServiceError } from "@/lib/services/supabase-service";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { Departamento, EmpleadoConDepartamento, AsistenciaConEmpleado, EstadoAsistencia } from "@/lib/types/rrhh";
import { Plus, Pencil, Trash2, Search, Download, Upload, ClipboardCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// ── Formulario de Empleado (Crear / Editar) ─────────────────────
interface EmpleadoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  empresaId: string;
  departamentos: Departamento[];
  empleado?: EmpleadoConDepartamento | null;
}

function EmpleadoForm({ isOpen, onClose, onSuccess, empresaId, departamentos, empleado }: EmpleadoFormProps) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [puesto, setPuesto] = useState("");
  const [salario, setSalario] = useState("");
  const [activo, setActivo] = useState("true");
  const [departamentoId, setDepartamentoId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esEdicion = !!empleado;

  useEffect(() => {
    if (isOpen) {
      setNombre(empleado?.nombre || "");
      setEmail(empleado?.email || "");
      setPuesto(empleado?.puesto || "");
      setSalario(empleado?.salario ? String(empleado.salario) : "");
      setActivo(empleado?.activo !== undefined ? String(empleado.activo) : "true");
      setDepartamentoId(empleado?.departamento_id || "");
      setError(null);
    }
  }, [isOpen, empleado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }
    if (!email.trim()) { setError("El email es obligatorio"); return; }
    if (!puesto.trim()) { setError("El puesto es obligatorio"); return; }

    const payload = {
      nombre: nombre.trim(),
      email: email.trim(),
      puesto: puesto.trim(),
      salario: Number(salario) || 0,
      activo: activo === "true",
      departamento_id: departamentoId || null,
    };

    try {
      setLoading(true);
      setError(null);
      if (esEdicion) {
        await actualizarEmpleado(empleado!.id, empresaId, payload);
      } else {
        await crearEmpleado(empresaId, payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar empleado");
    } finally {
      setLoading(false);
    }
  };

  const deptoOptions = departamentos.map((d) => ({ value: d.id, label: d.nombre }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esEdicion ? "Editar Empleado" : "Nuevo Empleado"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Nombre" name="nombre" value={nombre} onChange={setNombre} required placeholder="Nombre completo" />
          <FormField label="Email" name="email" type="email" value={email} onChange={setEmail} required placeholder="correo@ejemplo.com" />
          <FormField label="Puesto" name="puesto" value={puesto} onChange={setPuesto} required placeholder="Ej: Desarrollador" />
          <FormField label="Salario" name="salario" type="number" value={salario} onChange={setSalario} placeholder="0.00" min={0} step={0.01} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Departamento</label>
            <select
              value={departamentoId}
              onChange={(e) => setDepartamentoId(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Sin departamento</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </div>
          <FormField label="Estado" name="activo" type="select" value={activo} onChange={setActivo} options={[{ value: "true", label: "Activo" }, { value: "false", label: "Inactivo" }]} />
        </div>
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text={esEdicion ? "Actualizar Empleado" : "Crear Empleado"} />
      </form>
    </Modal>
  );
}

// ── Botón wrapper: Nuevo ────────────────────────────────────────
function NuevoEmpleadoBtn({ onSuccess, empresaId, departamentos }: { onSuccess: () => void; empresaId: string; departamentos: Departamento[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
        <Plus size={16} />
        Nuevo Empleado
      </button>
      <EmpleadoForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} empresaId={empresaId} departamentos={departamentos} />
    </>
  );
}

// ── Botón de editar ─────────────────────────────────────────────
function EditarEmpleadoBtn({ empleado, onSuccess, empresaId, departamentos }: { empleado: EmpleadoConDepartamento; onSuccess: () => void; empresaId: string; departamentos: Departamento[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600">
        <Pencil size={16} />
      </button>
      <EmpleadoForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} empresaId={empresaId} departamentos={departamentos} empleado={empleado} />
    </>
  );
}

// ── Página principal ────────────────────────────────────────────
export default function EmpleadosPage() {
  const router = useRouter();
  const [data, setData] = useState<EmpleadoConDepartamento[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [asistencia, setAsistencia] = useState<AsistenciaConEmpleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [empresaId, setEmpresaId] = useState<string>("");

  // Búsqueda
  const [searchTerm, setSearchTerm] = useState("");

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [empleadoToDelete, setEmpleadoToDelete] = useState<string | null>(null);

  // Asistencia
  const [asistenciaEditando, setAsistenciaEditando] = useState<Record<string, EstadoAsistencia>>({});
  const [asistenciaFecha, setAsistenciaFecha] = useState(new Date().toISOString().split("T")[0]);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const perfil = await obtenerPerfilActual();
      if (!perfil) throw new Error("No se pudo obtener el perfil de usuario");
      setEmpresaId(perfil.empresa_id);
      
      const [empleados, deptos, asistencias] = await Promise.all([
        listarEmpleados(perfil.empresa_id),
        listarDepartamentos(perfil.empresa_id),
        listarAsistencia(perfil.empresa_id),
      ]);
      setData(empleados);
      setDepartamentos(deptos);
      setAsistencia(asistencias);
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Error desconocido"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // Filtro de búsqueda
  const filteredEmpleados = data.filter((e) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(term) ||
      (e.departamentos?.nombre || "").toLowerCase().includes(term)
    );
  });

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && filteredEmpleados.length > 0) {
      const first = filteredEmpleados[0];
      const btn = document.querySelector(`[data-emp-id="${first.id}"]`) as HTMLButtonElement;
      btn?.click();
    }
  };

  const handleEliminar = async (id: string) => {
    setEmpleadoToDelete(id);
    setConfirmOpen(true);
  };

  const confirmarEliminar = async () => {
    if (empleadoToDelete) {
      await eliminarEmpleado(empleadoToDelete, empresaId);
      cargarDatos();
      setEmpleadoToDelete(null);
    }
  };

  // ── Asistencia: Marcar ────────────────────────────────────────
  const handleMarcarAsistencia = async (empleadoId: string, estado: EstadoAsistencia) => {
    setAsistenciaEditando((prev) => ({ ...prev, [empleadoId]: estado }));
  };

  const handleGuardarAsistencia = async () => {
    try {
      for (const [empleadoId, estado] of Object.entries(asistenciaEditando)) {
        await registrarAsistencia(empresaId, {
          empleado_id: empleadoId,
          fecha: asistenciaFecha,
          estado,
        });
      }
      setAsistenciaEditando({});
      cargarDatos();
    } catch (e: any) {
      alert(`Error al guardar asistencia: ${e.message}`);
    }
  };

  // ── Exportar Asistencia CSV ───────────────────────────────────
  const exportarAsistencia = () => {
    if (asistencia.length === 0) return alert("No hay datos de asistencia para exportar");
    const headers = ["empleado,email,fecha,estado,hora_entrada,hora_salida"];
    const rows = asistencia.map((a) =>
      `"${a.empleados?.nombre || ""}","${a.empleados?.email || ""}",${a.fecha},${a.estado},${a.hora_entrada || ""},${a.hora_salida || ""}`
    );
    const csv = [...headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asistencia_${asistenciaFecha}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Importar Asistencia CSV ───────────────────────────────────
  const importarAsistencia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) return alert("El archivo debe tener encabezados y datos");

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
      let count = 0;
      for (const line of lines.slice(1)) {
        const values = line.split(",").map((v) => v.trim().replace(/['"]/g, ""));
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ""; });

        if (obj.empleado && obj.fecha && obj.estado) {
          const emp = data.find((e) => e.nombre.toLowerCase() === obj.empleado.toLowerCase());
          if (emp) {
            await registrarAsistencia(empresaId, {
              empleado_id: emp.id,
              fecha: obj.fecha,
              estado: obj.estado as EstadoAsistencia,
              hora_entrada: obj.hora_entrada || null,
              hora_salida: obj.hora_salida || null,
            });
            count++;
          }
        }
      }
      alert(`Asistencia importada: ${count} registros`);
      cargarDatos();
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  return (
    <div>
      <PageHeader
        title="Empleados"
        actions={
          <div className="flex items-center gap-2">
            <NuevoEmpleadoBtn onSuccess={cargarDatos} empresaId={empresaId} departamentos={departamentos} />
            <button onClick={() => router.push("/rrhh/departamentos")} className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50">
              Departamentos
            </button>
          </div>
        }
      />

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nombre o departamento... (Enter para editar)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
        {searchTerm && filteredEmpleados.length > 0 && (
          <p className="mt-1 text-xs text-gray-400">
            {filteredEmpleados.length} resultado(s) — Presiona Enter para editar el primero
          </p>
        )}
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="No hay empleados registrados"
          description="Crea tu primer empleado para comenzar a gestionar tu equipo."
          action={<NuevoEmpleadoBtn onSuccess={cargarDatos} empresaId={empresaId} departamentos={departamentos} />}
        />
      ) : (
        <>
          {/* Tabla de empleados */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Puesto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Departamento</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Salario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmpleados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                      No se encontraron empleados con "{searchTerm}"
                    </td>
                  </tr>
                ) : (
                  filteredEmpleados.map((empleado) => (
                    <tr key={empleado.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{empleado.nombre}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{empleado.email}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{empleado.puesto}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{empleado.departamentos?.nombre || "—"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">${empleado.salario.toLocaleString()}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${empleado.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {empleado.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <EditarEmpleadoBtn empleado={empleado} onSuccess={cargarDatos} empresaId={empresaId} departamentos={departamentos} />
                        <button
                          data-emp-id={empleado.id}
                          onClick={() => handleEliminar(empleado.id)}
                          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Sección de Asistencia Integrada ────────────────── */}
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={20} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Asistencia</h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={asistenciaFecha}
                  onChange={(e) => setAsistenciaFecha(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                />
                <button onClick={exportarAsistencia} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                  <Download size={14} />
                  Exportar
                </button>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                  <Upload size={14} />
                  Importar
                  <input type="file" accept=".csv" onChange={importarAsistencia} className="hidden" />
                </label>
              </div>
            </div>

            {/* Tabla de marcado rápido de asistencia */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Empleado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Última Asistencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmpleados.map((emp) => {
                    const ultimaAsistencia = asistencia
                      .filter((a) => a.empleado_id === emp.id)
                      .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];

                    return (
                      <tr key={`asistencia-${emp.id}`} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {emp.nombre}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={asistenciaEditando[emp.id] || ""}
                            onChange={(e) => handleMarcarAsistencia(emp.id, e.target.value as EstadoAsistencia)}
                            className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">—</option>
                            <option value="presente">Presente</option>
                            <option value="ausente">Ausente</option>
                            <option value="tarde">Tarde</option>
                            <option value="permiso">Permiso</option>
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
                          {ultimaAsistencia ? (
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              ultimaAsistencia.estado === "presente" ? "bg-green-100 text-green-700" :
                              ultimaAsistencia.estado === "ausente" ? "bg-red-100 text-red-700" :
                              ultimaAsistencia.estado === "tarde" ? "bg-yellow-100 text-yellow-700" :
                              "bg-blue-100 text-blue-700"
                            }`}>
                              {ultimaAsistencia.estado} · {new Date(ultimaAsistencia.fecha).toLocaleDateString("es-DO")}
                            </span>
                          ) : "Sin registro"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {Object.keys(asistenciaEditando).length > 0 && (
              <div className="mt-3 text-right">
                <button
                  onClick={handleGuardarAsistencia}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <ClipboardCheck size={16} />
                  Guardar Asistencia ({Object.keys(asistenciaEditando).length} registro(s))
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setEmpleadoToDelete(null); }}
        onConfirm={confirmarEliminar}
        title="Eliminar Empleado"
        message="¿Estás seguro de eliminar este empleado? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}