"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import { listarProyectos, crearProyecto, actualizarProyecto, eliminarProyecto } from "@/lib/services/tareas.service";
import { listarEmpleados } from "@/lib/services/rrhh.service";
import { ServiceError } from "@/lib/services/supabase-service";
import type { Proyecto } from "@/lib/types/tareas";
import { Plus, Pencil, Trash2, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const estadoStyles: Record<string, string> = {
  activo: "bg-green-100 text-green-800",
  pausado: "bg-yellow-100 text-yellow-800",
  completado: "bg-blue-100 text-blue-800",
  cancelado: "bg-red-100 text-red-800",
};

const prioridadStyles: Record<string, string> = {
  baja: "bg-gray-100 text-gray-600",
  media: "bg-blue-100 text-blue-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
};

// ── Formulario de Proyecto (Crear / Editar) ─────────────────────
interface ProyectoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  empleados: { id: string; nombre: string }[];
  proyecto?: Proyecto | null;
}

function ProyectoForm({ isOpen, onClose, onSuccess, empleados, proyecto }: ProyectoFormProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState("activo");
  const [prioridad, setPrioridad] = useState("media");
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split("T")[0]);
  const [fechaFin, setFechaFin] = useState("");
  const [responsableId, setResponsableId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esEdicion = !!proyecto;

  useEffect(() => {
    if (isOpen) {
      setNombre(proyecto?.nombre || "");
      setDescripcion(proyecto?.descripcion || "");
      setEstado(proyecto?.estado || "activo");
      setPrioridad(proyecto?.prioridad || "media");
      setFechaInicio(proyecto?.fecha_inicio || new Date().toISOString().split("T")[0]);
      setFechaFin(proyecto?.fecha_fin || "");
      setResponsableId(proyecto?.responsable_id || "");
      setError(null);
    }
  }, [isOpen, proyecto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }

    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      estado: estado as any,
      prioridad: prioridad as any,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin || null,
      responsable_id: responsableId || null,
    };

    try {
      setLoading(true);
      setError(null);
      if (esEdicion) {
        await actualizarProyecto(proyecto!.id, payload);
      } else {
        await crearProyecto(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar proyecto");
    } finally {
      setLoading(false);
    }
  };

  const empleadoOptions = empleados.map((e) => ({ value: e.id, label: e.nombre }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esEdicion ? "Editar Proyecto" : "Nuevo Proyecto"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nombre" name="nombre" value={nombre} onChange={setNombre} required placeholder="Nombre del proyecto" />
        <FormField label="Descripción" name="descripcion" type="textarea" value={descripcion} onChange={setDescripcion} placeholder="Descripción del proyecto (opcional)" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Estado" name="estado" type="select" value={estado} onChange={setEstado}
            options={[{ value: "activo", label: "Activo" }, { value: "pausado", label: "Pausado" }, { value: "completado", label: "Completado" }, { value: "cancelado", label: "Cancelado" }]}
          />
          <FormField label="Prioridad" name="prioridad" type="select" value={prioridad} onChange={setPrioridad}
            options={[{ value: "baja", label: "Baja" }, { value: "media", label: "Media" }, { value: "alta", label: "Alta" }, { value: "urgente", label: "Urgente" }]}
          />
          <FormField label="Fecha Inicio" name="fechaInicio" type="date" value={fechaInicio} onChange={setFechaInicio} required />
          <FormField label="Fecha Fin" name="fechaFin" type="date" value={fechaFin} onChange={setFechaFin} />
          <FormField label="Responsable" name="responsableId" type="select" value={responsableId} onChange={setResponsableId} options={empleadoOptions} />
        </div>
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text={esEdicion ? "Actualizar Proyecto" : "Crear Proyecto"} />
      </form>
    </Modal>
  );
}

// ── Botón wrapper: Nuevo ────────────────────────────────────────
function NuevoProyectoBtn({ onSuccess, empleados }: { onSuccess: () => void; empleados: { id: string; nombre: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
        <Plus size={16} />
        Nuevo Proyecto
      </button>
      <ProyectoForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} empleados={empleados} />
    </>
  );
}

// ── Botón de editar ─────────────────────────────────────────────
function EditarProyectoBtn({ proyecto, onSuccess, empleados }: { proyecto: Proyecto; onSuccess: () => void; empleados: { id: string; nombre: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600">
        <Pencil size={16} />
      </button>
      <ProyectoForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} empleados={empleados} proyecto={proyecto} />
    </>
  );
}

// ── Página principal ────────────────────────────────────────────
export default function ProyectosPage() {
  const router = useRouter();
  const [data, setData] = useState<Proyecto[]>([]);
  const [empleados, setEmpleados] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmSkipKey, setConfirmSkipKey] = useState("");
  const [proyectoToDelete, setProyectoToDelete] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const proyectos = await listarProyectos();
      setData(proyectos);
      try { const emps = await listarEmpleados(); setEmpleados(emps.map((e: any) => ({ id: e.id, nombre: e.nombre }))); } catch {}
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

  const handleEliminar = async (id: string) => {
    const skipKey = "aget_confirm_skip_proyecto";
    if (localStorage.getItem(skipKey) === "true") {
      await eliminarProyecto(id);
      cargarDatos();
      return;
    }
    setConfirmTitle("Eliminar Proyecto");
    setConfirmMessage("¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.");
    setConfirmSkipKey(skipKey);
    setProyectoToDelete(id);
    setConfirmOpen(true);
  };

  const confirmarEliminar = async () => {
    if (proyectoToDelete) {
      await eliminarProyecto(proyectoToDelete);
      cargarDatos();
      setProyectoToDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Proyectos"
        actions={
          <div className="flex items-center gap-2">
            <NuevoProyectoBtn onSuccess={handleNuevo} empleados={empleados} />
            <button onClick={() => router.push("/tareas/tablero")} className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50">
              <ClipboardList size={16} />
              Tablero
            </button>
          </div>
        }
      />

      {data.length === 0 ? (
        <EmptyState title="No hay proyectos registrados" description="Crea tu primer proyecto." action={<NuevoProyectoBtn onSuccess={handleNuevo} empleados={empleados} />} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((proyecto) => (
            <div key={proyecto.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{proyecto.nombre}</h3>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${prioridadStyles[proyecto.prioridad]}`}>{proyecto.prioridad}</span>
                  </div>
                  {proyecto.descripcion && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{proyecto.descripcion}</p>}
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoStyles[proyecto.estado]}`}>{proyecto.estado}</span>
                    {proyecto.fecha_fin && <span className="text-xs text-gray-400">Fin: {new Date(proyecto.fecha_fin).toLocaleDateString("es-DO")}</span>}
                  </div>
                </div>
                <div className="ml-4 flex gap-1">
                  <EditarProyectoBtn proyecto={proyecto} onSuccess={handleNuevo} empleados={empleados} />
                  <button onClick={() => handleEliminar(proyecto.id)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setProyectoToDelete(null); }}
        onConfirm={confirmarEliminar}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        skipKey={confirmSkipKey}
      />
    </div>
  );
}