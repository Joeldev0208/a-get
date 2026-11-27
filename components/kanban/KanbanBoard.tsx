"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
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
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import { Plus, Pencil, Trash2, FolderOpen, GripVertical } from "lucide-react";
import type { TareaConAsignado, Prioridad } from "@/lib/types/tareas";

/* =========================
   TIPOS
   ========================= */

export interface KanbanColumnaConfig {
  id: string;
  tituloKey: string;
  color: string;
}

export interface KanbanBoardProps {
  columnas: KanbanColumnaConfig[];
  empresaId: string;
  proyectos: { id: string; nombre: string }[];
  empleados: { id: string; nombre: string }[];
  cargarTareas: (columnaId: string) => Promise<TareaConAsignado[]>;
  onCrearTarea: (payload: Record<string, any>) => Promise<void>;
  onActualizarTarea: (id: string, payload: Record<string, any>) => Promise<void>;
  onMoverTarea: (id: string, columna: string, orden: number) => Promise<void>;
  onEliminarTarea: (id: string) => Promise<void>;
  i18nPrefix?: string;
  emptyTitleKey?: string;
  emptyDescriptionKey?: string;
  addTaskLabelKey?: string;
  onChange?: () => void;
}

/* =========================
   COMPONENTE KANBAN BOARD
   ========================= */

export function KanbanBoard({
  columnas,
  empresaId,
  proyectos,
  empleados,
  cargarTareas,
  onCrearTarea,
  onActualizarTarea,
  onMoverTarea,
  onEliminarTarea,
  i18nPrefix = "tareas",
  emptyTitleKey = `${i18nPrefix}.noTasks`,
  emptyDescriptionKey = `${i18nPrefix}.emptyDescription`,
  addTaskLabelKey = `${i18nPrefix}.addTask`,
  onChange,
}: KanbanBoardProps) {
  const { t, i18n: i18nInstance } = useTranslation();
  const [columnData, setColumnData] = useState<Record<string, TareaConAsignado[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingTarea, setEditingTarea] = useState<TareaConAsignado | null>(null);
  const isMovingRef = useRef(false);

  const prioridadStyles: Record<string, string> = {
    baja: "bg-gray-100 text-gray-600",
    media: "bg-blue-100 text-blue-700",
    alta: "bg-orange-100 text-orange-700",
    urgente: "bg-red-100 text-red-700",
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  /* ── Carga de datos ── */
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const results = await Promise.all(
        columnas.map((col) => cargarTareas(col.id))
      );
      const nuevoEstado: Record<string, TareaConAsignado[]> = {};
      columnas.forEach((col, index) => {
        nuevoEstado[col.id] = results[index];
      });
      setColumnData(nuevoEstado);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [columnas, cargarTareas]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  const totalTareas = Object.values(columnData).reduce((sum, arr) => sum + arr.length, 0);

  /* ── Helpers ── */
  const findTarea = useCallback((id: string): TareaConAsignado | undefined => {
    for (const col of columnas) {
      const found = columnData[col.id]?.find((t) => t.id === id);
      if (found) return found;
    }
    return undefined;
  }, [columnas, columnData]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;
    if (isMovingRef.current) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const tarea = findTarea(activeId);
    if (!tarea) return;

    // Determinar columna destino
    let nuevaColumna: string | undefined;

    const columnaDestino = columnas.find((col) => col.id === overId);
    if (columnaDestino) {
      nuevaColumna = columnaDestino.id;
    } else {
      // Verificar si se soltó sobre otra tarea
      for (const col of columnas) {
        if (columnData[col.id]?.some((t) => t.id === overId)) {
          nuevaColumna = col.id;
          break;
        }
      }
    }

    if (!nuevaColumna || nuevaColumna === tarea.columna) return;

    // Calcular nuevo orden (al final de la columna destino)
    const orden = (columnData[nuevaColumna] || []).length;

    // Guardar estado anterior para rollback
    const prevColumnData = { ...columnData };

    isMovingRef.current = true;

    // Actualizar UI optimistamente
    setColumnData((prev) => {
      const sourceCol = tarea.columna as string;
      const sourceTasks = prev[sourceCol]?.filter((t) => t.id !== activeId) || [];
      const targetTasks = [
        ...(prev[nuevaColumna] || []),
        { ...tarea, columna: nuevaColumna as TareaConAsignado["columna"] },
      ];
      return {
        ...prev,
        [sourceCol]: sourceTasks,
        [nuevaColumna]: targetTasks,
      };
    });

    // Persistir en Supabase
    try {
      await onMoverTarea(activeId, nuevaColumna, orden);
      onChange?.();
    } catch (err) {
      console.error("Error moving task:", err);
      // Rollback al estado anterior
      setColumnData(prevColumnData);
      cargarDatos();
    } finally {
      isMovingRef.current = false;
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
      await onEliminarTarea(id);
      onChange?.();
      cargarDatos();
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  /* ── Componentes internos ── */

  // Tarjeta de tarea (draggable)
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
                {t(`${i18nPrefix}.${tarea.prioridad}`)}
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
          <span>{tarea.empleados?.nombre || t(`${i18nPrefix}.unassigned`)}</span>
          {tarea.fecha_limite && (
            <span>{new Date(tarea.fecha_limite).toLocaleDateString(i18nInstance.language === "en" ? "en-US" : "es-DO")}</span>
          )}
        </div>
      </div>
    );
  }

  // Columna droppable
  function ColumnaKanbanDroppable({
    columna,
    tareas,
    onEdit,
    onDelete,
  }: {
    columna: KanbanColumnaConfig;
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
            <h3 className="text-sm font-semibold text-gray-700">
              {t(`${i18nPrefix}.${columna.tituloKey}`)}
            </h3>
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
              <TareaCard
                key={tarea.id}
                tarea={tarea}
                onEdit={() => onEdit(tarea)}
                onDelete={() => onDelete(tarea.id)}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    );
  }

  /* ── Formulario de Tarea ── */

  interface TareaFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tarea?: TareaConAsignado | null;
  }

  function TareaForm({
    isOpen,
    onClose,
    onSuccess,
    tarea,
  }: TareaFormProps) {
    const [proyectoId, setProyectoId] = useState("");
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [columna, setColumna] = useState(columnas[0]?.id || "");
    const [prioridad, setPrioridad] = useState<Prioridad>("media");
    const [asignadoId, setAsignadoId] = useState("");
    const [fechaLimite, setFechaLimite] = useState("");
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const esEdicion = !!tarea;

    useEffect(() => {
      if (isOpen) {
        setProyectoId(tarea?.proyecto_id || "");
        setTitulo(tarea?.titulo || "");
        setDescripcion(tarea?.descripcion || "");
        setColumna(tarea?.columna || columnas[0]?.id || "");
        setPrioridad(tarea?.prioridad || "media");
        setAsignadoId(tarea?.asignado_id || "");
        setFechaLimite(tarea?.fecha_limite || "");
        setFormError(null);
      }
    }, [isOpen, tarea, columnas]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!proyectoId) { setFormError(t(`${i18nPrefix}.errorSelectProject`)); return; }
      if (!titulo.trim()) { setFormError(t(`${i18nPrefix}.errorTitleRequired`)); return; }

      const payload = {
        proyecto_id: proyectoId,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        columna,
        prioridad,
        asignado_id: asignadoId || null,
        fecha_limite: fechaLimite || null,
      };

      try {
        setFormLoading(true);
        setFormError(null);
        if (esEdicion) {
          await onActualizarTarea(tarea!.id, payload);
        } else {
          await onCrearTarea(payload);
        }
        onSuccess();
        onClose();
      } catch (err: any) {
        setFormError(err.message || t(`${i18nPrefix}.errorSaveTask`));
      } finally {
        setFormLoading(false);
      }
    };

    const proyectoOptions = proyectos.map((p) => ({ value: p.id, label: p.nombre }));
    const empleadoOptions = empleados.map((e) => ({ value: e.id, label: e.nombre }));

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={esEdicion ? t(`${i18nPrefix}.editTask`) : t(addTaskLabelKey)}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label={t(`${i18nPrefix}.project`)}
            name="proyectoId"
            type="select"
            value={proyectoId}
            onChange={(v: string) => setProyectoId(v)}
            required
            options={proyectoOptions}
          />
          <FormField
            label={t(`${i18nPrefix}.taskTitle`)}
            name="titulo"
            value={titulo}
            onChange={(v: string) => setTitulo(v)}
            required
            placeholder={t(`${i18nPrefix}.taskTitle`)}
          />
          <FormField
            label={t(`${i18nPrefix}.description`)}
            name="descripcion"
            type="textarea"
            value={descripcion}
            onChange={(v: string) => setDescripcion(v)}
            placeholder="Optional description"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label={t(`${i18nPrefix}.column`)}
              name="columna"
              type="select"
              value={columna}
              onChange={(v: string) => setColumna(v)}
              options={columnas.map((c) => ({ value: c.id, label: t(`${i18nPrefix}.${c.tituloKey}`) }))}
            />
            <FormField
              label={t(`${i18nPrefix}.priority`)}
              name="prioridad"
              type="select"
              value={prioridad}
              onChange={(v: string) => setPrioridad(v as Prioridad)}
              options={[
                { value: "baja", label: t(`${i18nPrefix}.low`) },
                { value: "media", label: t(`${i18nPrefix}.medium`) },
                { value: "alta", label: t(`${i18nPrefix}.high`) },
                { value: "urgente", label: t(`${i18nPrefix}.urgent`) },
              ]}
            />
            <FormField
              label="Assigned to"
              name="asignadoId"
              type="select"
              value={asignadoId}
              onChange={(v: string) => setAsignadoId(v)}
              options={empleadoOptions}
            />
            <FormField
              label="Due Date"
              name="fechaLimite"
              type="date"
              value={fechaLimite}
              onChange={(v: string) => setFechaLimite(v)}
            />
          </div>
          {formError && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{formError}</div>}
          <SubmitButton loading={formLoading} text={esEdicion ? "Update Task" : "Create Task"} />
        </form>
      </Modal>
    );
  }

  /* ── Botón Nueva Tarea ── */

  function NuevaTareaBtn({ onSuccess }: { onSuccess: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={16} />
          {t(addTaskLabelKey)}
        </button>
        <TareaForm
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSuccess={onSuccess}
        />
      </>
    );
  }

  /* ── Render ── */

  const handleNuevo = () => cargarDatos();

  if (totalTareas === 0) {
    return (
      <div>
        <PageHeader
          title={t(`${i18nPrefix}.kanban`)}
          actions={<NuevaTareaBtn onSuccess={handleNuevo} />}
        />
        <EmptyState
          title={t(emptyTitleKey)}
          description={t(emptyDescriptionKey)}
          action={<NuevaTareaBtn onSuccess={handleNuevo} />}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t(`${i18nPrefix}.kanban`)}
        actions={<NuevaTareaBtn onSuccess={handleNuevo} />}
      />
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
              tareas={columnData[columna.id] || []}
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

      {editingTarea && (
        <TareaForm
          isOpen={!!editingTarea}
          onClose={handleCloseEdit}
          onSuccess={() => { handleCloseEdit(); cargarDatos(); }}
          tarea={editingTarea}
        />
      )}
    </div>
  );
}
