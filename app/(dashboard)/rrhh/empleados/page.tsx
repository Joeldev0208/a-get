"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import { listarEmpleados, crearEmpleado, listarDepartamentos } from "@/lib/services/rrhh.service";
import { ServiceError } from "@/lib/services/supabase-service";
import type { Departamento, EmpleadoConDepartamento } from "@/lib/types/rrhh";
import { Plus, Pencil, Trash2, ClipboardCheck } from "lucide-react";
import { useRouter } from "next/navigation";

// ── Formulario de Empleado ──────────────────────────────────────
interface EmpleadoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departamentos: Departamento[];
}

function EmpleadoForm({ isOpen, onClose, onSuccess, departamentos }: EmpleadoFormProps) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [puesto, setPuesto] = useState("");
  const [salario, setSalario] = useState("");
  const [activo, setActivo] = useState("true");
  const [departamentoId, setDepartamentoId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setNombre("");
    setEmail("");
    setPuesto("");
    setSalario("");
    setActivo("true");
    setDepartamentoId("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }
    if (!email.trim()) { setError("El email es obligatorio"); return; }
    if (!puesto.trim()) { setError("El puesto es obligatorio"); return; }

    try {
      setLoading(true);
      setError(null);
      await crearEmpleado({
        nombre: nombre.trim(),
        email: email.trim(),
        puesto: puesto.trim(),
        salario: Number(salario) || 0,
        activo: activo === "true",
        departamento_id: departamentoId || null,
      });
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Error al crear empleado");
    } finally {
      setLoading(false);
    }
  };

  const deptoOptions = departamentos.map((d) => ({ value: d.id, label: d.nombre }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Empleado" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Nombre" name="nombre" value={nombre} onChange={setNombre} required placeholder="Nombre completo" />
          <FormField label="Email" name="email" type="email" value={email} onChange={setEmail} required placeholder="correo@ejemplo.com" />
          <FormField label="Puesto" name="puesto" value={puesto} onChange={setPuesto} required placeholder="Ej: Desarrollador" />
          <FormField label="Salario" name="salario" type="number" value={salario} onChange={setSalario} placeholder="0.00" min={0} step={0.01} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Departamento
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <FormField label="" name="departamentoId" type="select" value={departamentoId} onChange={setDepartamentoId} options={deptoOptions} />
              </div>
              <button
                type="button"
                onClick={() => router.push("/rrhh/departamentos")}
                className="mt-0 inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                title="Ir a Departamentos"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Nuevo</span>
              </button>
            </div>
          </div>
          <FormField label="Estado" name="activo" type="select" value={activo} onChange={setActivo} options={[{ value: "true", label: "Activo" }, { value: "false", label: "Inactivo" }]} />
        </div>
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text="Crear Empleado" />
      </form>
    </Modal>
  );
}

// ── Botón wrapper ───────────────────────────────────────────────
function NuevoEmpleadoBtn({ onSuccess, departamentos }: { onSuccess: () => void; departamentos: Departamento[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
        <Plus size={16} />
        Nuevo Empleado
      </button>
      <EmpleadoForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} departamentos={departamentos} />
    </>
  );
}

// ── Página principal ────────────────────────────────────────────
export default function EmpleadosPage() {
  const router = useRouter();
  const [data, setData] = useState<EmpleadoConDepartamento[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [empleados, deptos] = await Promise.all([listarEmpleados(), listarDepartamentos()]);
      setData(empleados);
      setDepartamentos(deptos);
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
      <PageHeader
        title="Empleados"
        actions={
          <div className="flex items-center gap-2">
            <NuevoEmpleadoBtn onSuccess={handleNuevo} departamentos={departamentos} />
            <button
              onClick={() => router.push("/rrhh/asistencia")}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50"
            >
              <ClipboardCheck size={16} />
              Asistencia
            </button>
          </div>
        }
      />

      {data.length === 0 ? (
        <EmptyState
          title="No hay empleados registrados"
          description="Crea tu primer empleado para comenzar a gestionar tu equipo."
          action={<NuevoEmpleadoBtn onSuccess={handleNuevo} departamentos={departamentos} />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Puesto</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Departamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Salario</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((empleado) => (
                <tr key={empleado.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{empleado.nombre}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{empleado.email}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{empleado.puesto}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{empleado.departamentos?.nombre || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">${empleado.salario.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${empleado.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {empleado.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button className="mr-2 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"><Pencil size={16} /></button>
                    <button className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}