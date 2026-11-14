"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import {
  listarTareasPorColumna,
  crearTarea,
  actualizarTarea,
  moverTarea,
  eliminarTarea,
  listarProyectos,
} from "@/lib/services/tareas.service";
import { listarEmpleados } from "@/lib/services/rrhh.service";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import { ServiceError } from "@/lib/services/supabase-service";
import type { TareaConAsignado, ColumnaKanban, Tarea } from "@/lib/types/tareas";
import { Plus, Pencil, Trash2, FolderOpen, GripVertical } from "lucide-react";

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

// ── Columna Droppable ───────────────────────────────────────────
function ColumnaKanbanDroppable({
  columna,
  tareas,
  onEdit,
  onDelete,
}: {
  columna: Columna;
  tareas: TareaConAsignado[];
  onEdit: (tarea: TareaConAsignado) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columna.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl transition-colors ${
        isOver ? "bg-blue-50" : ""
      }`}
    >
      <div className={`mb-3 rounded-t-xl border-t-4 ${columna.color} bg-white p-4 shadow-sm`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{columna.titulo}</h3>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
            {tareas.length}
          </span>
        </div>
      </div>
      <SortableContext
        items={tareas.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3 p-2">
          {tareas.map((tarea) => (
            <TareaCard key={tarea.id} tarea={tarea} onEdit={() => onEdit(tarea)} onDelete={() => onDelete(tarea.id)} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// ── Tarjeta de tarea (draggable) ────────────────────────────────
function TareaCard({ tarea, onEdit, onDelete }: { tarea: TareaConAsignado; onEdit: () => void; onDelete: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarea.id });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab rounded p-0.5 text-gray-400 hover:text-gray-600 active:cursor-grabbing"
            >
              <GripVertical size={14} />
            </button>
            <h4 className="text-sm font-medium text-gray-900">{tarea.titulo}</h4>
          </div>
          {tarea.descripcion && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{tarea.descripcion}</p>
          )}
          <div className="mt-3 flex items-center gap-2">
            {tarea.proyectos?.nombre && (
              <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                <FolderOpen size={12} />
                {tarea.proyectos.nombre}
              </span>
            )}
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                prioridadStyles[tarea.prioridad]
              }`}
            >
              {tarea.prioridad}
            </span>
          </div>
        </div>
        <div className="ml-2 flex gap-1">
          <button
            onClick={onEdit}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>{tarea.empleados?.nombre || "Sin asignar"}</span>
        {tarea.fecha_limite && (
          <span>{new Date(tarea.fecha_limite).toLocaleDateString("es-DO")}</span>
        )}
      </div>
    </div>
  );
}

// ── Formulario de Tarea (Crear / Editar) ────────────────────────
interface TareaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  empresaId: string;
  proyectos: { id: string; nombre: string }[];
  empleados: { id: string; nombre: string }[];
  tarea?: TareaConAsignado | null;
}

function TareaForm({ isOpen, onClose, onSuccess, empresaId, proyectos, empleados, tarea }: TareaFormProps) {
  const [proyectoId, setProyectoId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [columna, setColumna] = useState("pendientes");
  const [prioridad, setPrioridad] = useState("media");
  const [asignadoId, setAsignadoId] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esEdicion = !!tarea;

  useEffect(() => {
    if (isOpen) {
      setProyectoId(tarea?.proyecto_id || "");
      setTitulo(tarea?.titulo || "");
      setDescripcion(tarea?.descripcion || "");
      setColumna(tarea?.columna || "pendientes");
      setPrioridad(tarea?.prioridad || "media");
      setAsignadoId(tarea?.asignado_id || "");
      setFechaLimite(tarea?.fecha_limite || "");
      setError(null);
    }
  }, [isOpen, tarea]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyectoId) { setError("Debes seleccionar un proyecto"); return; }
    if (!titulo.trim()) { setError("El título es obligatorio"); return; }

    const payload = {
      proyecto_id: proyectoId,
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      columna: columna as any,
      prioridad: prioridad as any,
      asignado_id: asignadoId || null,
      fecha_limite: fechaLimite || null,
    };

    try {
      setLoading(true);
      setError(null);
      if (esEdicion) {
        await actualizarTarea(tarea!.id, empresaId, payload);
      } else {
        await crearTarea(empresaId, payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar tarea");
    } finally {
      setLoading(false);
    }
  };

  const proyectoOptions = proyectos.map((p) => ({ value: p.id, label: p.nombre }));
  const empleadoOptions = empleados.map((e) => ({ value: e.id, label: e.nombre }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esEdicion ? "Editar Tarea" : "Nueva Tarea"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Proyecto" name="proyectoId" type="select" value={proyectoId} onChange={setProyectoId} required options={proyectoOptions} />
        <FormField label="Título" name="titulo" value={titulo} onChange={setTitulo} required placeholder="Título de la tarea" />
        <FormField label="Descripción" name="descripcion" type="textarea" value={descripcion} onChange={setDescripcion} placeholder="Descripción (opcional)" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Columna" name="columna" type="select" value={columna} onChange={setColumna}
            options={[{ value: "pendientes", label: "Pendientes" }, { value: "en_progreso", label: "En Progreso" }, { value: "en_revision", label: "En Revisión" }, { value: "completadas", label: "Completadas" }]}
          />
          <FormField label="Prioridad" name="prioridad" type="select" value={prioridad} onChange={setPrioridad}
            options={[{ value: "baja", label: "Baja" }, { value: "media", label: "Media" }, { value: "alta", label: "Alta" }, { value: "urgente", label: "Urgente" }]}
          />
          <FormField label="Asignado a" name="asignadoId" type="select" value={asignadoId} onChange={setAsignadoId} options={empleadoOptions} />
          <FormField label="Fecha Límite" name="fechaLimite" type="date" value={fechaLimite} onChange={setFechaLimite} />
        </div>
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text={esEdicion ? "Actualizar Tarea" : "Crear Tarea"} />
      </form>
    </Modal>
  );
}

// ── Botón wrapper: Nueva Tarea ──────────────────────────────────
function NuevaTareaBtn({ onSuccess, proyectos, empleados, empresaId }: { onSuccess: () => void; proyectos: { id: string; nombre: string }[]; empleados: { id: string; nombre: string }[]; empresaId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
        <Plus size={16} />
        Nueva Tarea
      </button>
      <TareaForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} empresaId={empresaId} proyectos={proyectos} empleados={empleados} />
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingTarea, setEditingTarea] = useState<TareaConAsignado | null>(null);
  const [empresaId, setEmpresaId] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const perfil = await obtenerPerfilActual();
      if (!perfil) throw new Error("No se pudo obtener el perfil de usuario");
      setEmpresaId(perfil.empresa_id);
      const results = await Promise.all(columnas.map((col) => listarTareasPorColumna(perfil.empresa_id, col.id)));
      const nuevoEstado: Record<string, TareaConAsignado[]> = {};
      columnas.forEach((col, index) => { nuevoEstado[col.id] = results[index]; });
      setColumnData(nuevoEstado);
      try {
        const [proys, emps] = await Promise.all([listarProyectos(perfil.empresa_id), listarEmpleados(perfil.empresa_id)]);
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

  const handleNuevo = () => cargarDatos();

  const findTarea = (id: string): TareaConAsignado | undefined => {
    for (const col of columnas) {
      const found = columnData[col.id].find((t) => t.id === id);
      if (found) return found;
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Buscar la tarea arrastrada
    const tarea = findTarea(activeId);
    if (!tarea) return;

    // Determinar columna destino
    let nuevaColumna: ColumnaKanban | undefined;

    // Verificar si se soltó sobre una columna
    const columnaDestino = columnas.find((col) => col.id === overId);
    if (columnaDestino) {
      nuevaColumna = columnaDestino.id;
    } else {
      // Verificar si se soltó sobre otra tarea
      for (const col of columnas) {
        if (columnData[col.id].some((t) => t.id === overId)) {
          nuevaColumna = col.id;
          break;
        }
      }
    }

    if (!nuevaColumna || nuevaColumna === tarea.columna) return;

    // Actualizar UI optimistamente
    setColumnData((prev) => {
      const sourceCol = tarea.columna;
      const sourceTasks = prev[sourceCol].filter((t) => t.id !== activeId);
      const targetTasks = [...prev[nuevaColumna!], { ...tarea, columna: nuevaColumna! }];
      return {
        ...prev,
        [sourceCol]: sourceTasks,
        [nuevaColumna!]: targetTasks,
      };
    });

    // Persistir en Supabase
    try {
      await moverTarea(activeId, empresaId, nuevaColumna, 0);
    } catch (err) {
      console.error("Error al mover tarea:", err);
      cargarDatos(); // Rollback
    }
  };

  const handleEdit = (tarea: TareaConAsignado) => {
    setEditingTarea(tarea);
  };

  const handleCloseEdit = () => {
    setEditingTarea(null);
  };

  const handleEliminar = async (id: string) => {
    try {
      await eliminarTarea(id, empresaId);
      cargarDatos();
    } catch (err) {
      console.error("Error al eliminar tarea:", err);
    }
  };

  const totalTareas = Object.values(columnData).reduce((sum, arr) => sum + arr.length, 0);

  if (totalTareas === 0) {
    return (
      <div>
        <PageHeader title="Tablero Kanban" actions={<NuevaTareaBtn onSuccess={handleNuevo} proyectos={proyectos} empleados={empleados} empresaId={empresaId} />} />
        <EmptyState title="No hay tareas en el tablero" description="Crea tareas desde los proyectos." action={<NuevaTareaBtn onSuccess={handleNuevo} proyectos={proyectos} empleados={empleados} empresaId={empresaId} />} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Tablero Kanban" actions={<NuevaTareaBtn onSuccess={handleNuevo} proyectos={proyectos} empleados={empleados} empresaId={empresaId} />} />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {columnas.map((columna) => (
            <ColumnaKanbanDroppable
              key={columna.id}
              columna={columna}
              tareas={columnData[columna.id]}
              onEdit={handleEdit}
              onDelete={handleEliminar}
            />
          ))}
        </div>
        <DragOverlay>
          {activeId ? (() => {
            const tarea = findTarea(activeId);
            if (!tarea) return null;
            return (
              <div className="rounded-lg border border-blue-300 bg-white p-4 shadow-lg opacity-80">
                <div className="flex items-center gap-2">
                  <GripVertical size={14} className="text-gray-400" />
                  <h4 className="text-sm font-medium text-gray-900">{tarea.titulo}</h4>
                </div>
                {tarea.proyectos?.nombre && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    <FolderOpen size={12} />
                    {tarea.proyectos.nombre}
                  </span>
                )}
              </div>
            );
          })() : null}
        </DragOverlay>
      </DndContext>

      {/* Modal de edición */}
      {editingTarea && (
        <TareaForm
          isOpen={!!editingTarea}
          onClose={handleCloseEdit}
          onSuccess={() => { handleCloseEdit(); cargarDatos(); }}
          empresaId={empresaId}
          proyectos={proyectos}
          empleados={empleados}
          tarea={editingTarea}
        />
      )}
    </div>
  );
}