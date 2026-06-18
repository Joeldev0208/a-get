"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import { listarTareasPorColumna, crearTarea, listarProyectos } from "@/lib/services/tareas.service";
import { listarEmpleados } from "@/lib/services/rrhh.service";
import { ServiceError } from "@/lib/services/supabase-service";
import type { TareaConAsignado, ColumnaKanban, Tarea } from "@/lib/types/tareas";
import { Plus } from "lucide-react";

interface Columna {
  id: ColumnaKanban;
  titulo: string;
  color: string;
}

const columnas: Columna[] = [
  { id: "pendientes", titulo: "Pendientes", color: "border-t-gray-400" },
  { id: "en_progreso", titulo: "En Progreso", color: "border-t-blue-500" },
  { id: "en_revision", titulo: "En Revisión", color: "border-t-yellow-500" },
  { id: "completadas", titulo: "Completadas", color: "border-t-green-500" },
];

const prioridadStyles: Record<string, string> = {
  baja: "bg-gray-100 text-gray-600",
  media: "bg-blue-100 text-blue-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
};

// ── Formulario de Tarea ─────────────────────────────────────────
interface TareaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  proyectos: { id: string; nombre: string }[];
  empleados: { id: string; nombre: string }[];
}

function TareaForm({ isOpen, onClose, onSuccess, proyectos, empleados }: TareaFormProps) {
  const [proyectoId, setProyectoId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [columna, setColumna] = useState("pendientes");
  const [prioridad, setPrioridad] = useState("media");
  const [asignadoId, setAsignadoId] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setProyectoId("");
    setTitulo("");
    setDescripcion("");
    setColumna("pendientes");
    setPrioridad("media");
    setAsignadoId("");
    setFechaLimite("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyectoId) { setError("Debes seleccionar un proyecto"); return; }
    if (!titulo.trim()) { setError("El título es obligatorio"); return; }

    try {
      setLoading(true);
      setError(null);
      await crearTarea({
        proyecto_id: proyectoId,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        columna: columna as any,
        prioridad: prioridad as any,
        asignado_id: asignadoId || null,
        fecha_limite: fechaLimite || null,
      });
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Error al crear tarea");
    } finally {
      setLoading(false);
    }
  };

  const proyectoOptions = proyectos.map((p) => ({ value: p.id, label: p.nombre }));
  const empleadoOptions = empleados.map((e) => ({ value: e.id, label: e.nombre }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Tarea" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Proyecto" name="proyectoId" type="select" value={proyectoId} onChange={setProyectoId} required options={proyectoOptions} />
        <FormField label="Título" name="titulo" value={titulo} onChange={setTitulo} required placeholder="Título de la tarea" />
        <FormField label="Descripción" name="descripcion" type="textarea" value={descripcion} onChange={setDescripcion} placeholder="Descripción (opcional)" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Columna" name="columna" type="select" value={columna} onChange={setColumna}
            options={[
              { value: "pendientes", label: "Pendientes" },
              { value: "en_progreso", label: "En Progreso" },
              { value: "en_revision", label: "En Revisión" },
              { value: "completadas", label: "Completadas" },
            ]}
          />
          <FormField label="Prioridad" name="prioridad" type="select" value={prioridad} onChange={setPrioridad}
            options={[
              { value: "baja", label: "Baja" },
              { value: "media", label: "Media" },
              { value: "alta", label: "Alta" },
              { value: "urgente", label: "Urgente" },
            ]}
          />
          <FormField label="Asignado a" name="asignadoId" type="select" value={asignadoId} onChange={setAsignadoId} options={empleadoOptions} />
          <FormField label="Fecha Límite" name="fechaLimite" type="date" value={fechaLimite} onChange={setFechaLimite} />
        </div>
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text="Crear Tarea" />
      </form>
    </Modal>
  );
}

// ── Botón wrapper ───────────────────────────────────────────────
function NuevaTareaBtn({ onSuccess, proyectos, empleados }: { onSuccess: () => void; proyectos: { id: string; nombre: string }[]; empleados: { id: string; nombre: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
        <Plus size={16} />
        Nueva Tarea
      </button>
      <TareaForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} proyectos={proyectos} empleados={empleados} />
    </>
  );
}

// ── Página principal ────────────────────────────────────────────
export default function TableroPage() {
  const [columnData, setColumnData] = useState<Record<string, TareaConAsignado[]>>({
    pendientes: [],
    en_progreso: [],
    en_revision: [],
    completadas: [],
  });
  const [proyectos, setProyectos] = useState<{ id: string; nombre: string }[]>([]);
  const [empleados, setEmpleados] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const results = await Promise.all(columnas.map((col) => listarTareasPorColumna(col.id)));
      const nuevoEstado: Record<string, TareaConAsignado[]> = {};
      columnas.forEach((col, index) => { nuevoEstado[col.id] = results[index]; });
      setColumnData(nuevoEstado);
      try {
        const [proys, emps] = await Promise.all([listarProyectos(), listarEmpleados()]);
        setProyectos(proys.map((p: any) => ({ id: p.id, nombre: p.nombre })));
        setEmpleados(emps.map((e: any) => ({ id: e.id, nombre: e.nombre })));
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  const totalTareas = Object.values(columnData).reduce((sum, arr) => sum + arr.length, 0);
  const handleNuevo = () => cargarDatos();

  if (totalTareas === 0) {
    return (
      <div>
        <PageHeader title="Tablero Kanban" actions={<NuevaTareaBtn onSuccess={handleNuevo} proyectos={proyectos} empleados={empleados} />} />
        <EmptyState title="No hay tareas en el tablero" description="Crea tareas desde los proyectos para visualizarlas aquí." action={<NuevaTareaBtn onSuccess={handleNuevo} proyectos={proyectos} empleados={empleados} />} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Tablero Kanban" actions={<NuevaTareaBtn onSuccess={handleNuevo} proyectos={proyectos} empleados={empleados} />} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {columnas.map((columna) => (
          <div key={columna.id} className="flex flex-col">
            <div className={`mb-3 rounded-t-xl border-t-4 ${columna.color} bg-white p-4 shadow-sm`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">{columna.titulo}</h3>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">{columnData[columna.id].length}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {columnData[columna.id].map((tarea) => (
                <div key={tarea.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-medium text-gray-900">{tarea.titulo}</h4>
                    <span className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${prioridadStyles[tarea.prioridad]}`}>{tarea.prioridad}</span>
                  </div>
                  {tarea.descripcion && <p className="mt-1 text-xs text-gray-500 line-clamp-2">{tarea.descripcion}</p>}
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <span>{tarea.proyectos?.nombre || "—"}</span>
                    <span>{tarea.empleados?.nombre || "Sin asignar"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}