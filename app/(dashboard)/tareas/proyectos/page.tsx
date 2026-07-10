"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import ErrorBox from "@/components/ui/ErrorBox";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ProyectoSidebar from "@/components/tareas/ProyectoSidebar";
import KanbanBoard from "@/components/tareas/KanbanBoard";
import {
  listarProyectos, crearProyecto, actualizarProyecto, eliminarProyecto,
  listarTareas, crearTarea, actualizarTarea, eliminarTarea, moverTarea,
  listarComentarios, crearComentario,
} from "@/lib/services/tareas.service";
import { listarEmpleados } from "@/lib/services/rrhh.service";
import { ServiceError } from "@/lib/services/supabase-service";
import type { Proyecto, TareaConAsignado, ColumnaKanban, Comentario } from "@/lib/types/tareas";
import type { Empleado } from "@/lib/types/rrhh";
import { Pencil, Trash2, MessageSquare, Send } from "lucide-react";

// ── Formulario de Proyecto (Crear/Editar) ──────────────────────
interface ProyectoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  proyecto?: Proyecto | null;
}

function ProyectoForm({ isOpen, onClose, onSuccess, proyecto }: ProyectoFormProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState("activo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esEdicion = !!proyecto;

  useEffect(() => {
    if (isOpen) {
      setNombre(proyecto?.nombre || "");
      setDescripcion(proyecto?.descripcion || "");
      setEstado(proyecto?.estado || "activo");
      setError(null);
    }
  }, [isOpen, proyecto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }

    try {
      setLoading(true);
      setError(null);

      if (esEdicion && proyecto) {
        await actualizarProyecto(proyecto.id, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          estado: estado as any,
        });
      } else {
        await crearProyecto({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          fecha_inicio: new Date().toISOString().split("T")[0],
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar proyecto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esEdicion ? "Editar Proyecto" : "Nuevo Proyecto"} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nombre *" name="nombre" value={nombre} onChange={setNombre} required placeholder="Nombre del proyecto" />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción opcional..."
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {esEdicion && (
          <FormField label="Estado" name="estado" type="select" value={estado} onChange={setEstado}
            options={[
              { value: "activo", label: "Activo" },
              { value: "pausado", label: "Pausado" },
              { value: "completado", label: "Completado" },
              { value: "cancelado", label: "Cancelado" },
            ]}
          />
        )}
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text={esEdicion ? "Actualizar Proyecto" : "Crear Proyecto"} />
      </form>
    </Modal>
  );
}

// ── Formulario de Tarea (Crear/Editar) ─────────────────────────
interface TareaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  proyectoId: string;
  empleados: Empleado[];
  tarea?: TareaConAsignado | null;
}

function TareaForm({ isOpen, onClose, onSuccess, proyectoId, empleados, tarea }: TareaFormProps) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState("media");
  const [columna, setColumna] = useState("pendientes");
  const [asignadoId, setAsignadoId] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esEdicion = !!tarea;

  useEffect(() => {
    if (isOpen) {
      setTitulo(tarea?.titulo || "");
      setDescripcion(tarea?.descripcion || "");
      setPrioridad(tarea?.prioridad || "media");
      setColumna(tarea?.columna || "pendientes");
      setAsignadoId(tarea?.asignado_id || "");
      setFechaLimite(tarea?.fecha_limite?.split("T")[0] || "");
      setError(null);

      // Cargar comentarios si es edición
      if (tarea) {
        listarComentarios(tarea.id).then(setComentarios);
      } else {
        setComentarios([]);
      }
    }
  }, [isOpen, tarea]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) { setError("El título es obligatorio"); return; }

    try {
      setLoading(true);
      setError(null);

      if (esEdicion && tarea) {
        await actualizarTarea(tarea.id, {
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || null,
          prioridad: prioridad as any,
          columna: columna as ColumnaKanban,
          asignado_id: asignadoId || null,
          fecha_limite: fechaLimite || null,
        });
      } else {
        await crearTarea({
          proyecto_id: proyectoId,
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || null,
          prioridad: prioridad as any,
          columna: columna as ColumnaKanban,
          asignado_id: asignadoId || null,
          fecha_limite: fechaLimite || null,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar tarea");
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarComentario = async () => {
    if (!nuevoComentario.trim() || !tarea) return;
    try {
      await crearComentario({
        tarea_id: tarea.id,
        contenido: nuevoComentario.trim(),
      });
      setNuevoComentario("");
      const updated = await listarComentarios(tarea.id);
      setComentarios(updated);
    } catch (e: any) {
      alert(`Error al agregar comentario: ${e.message}`);
    }
  };

  const empOptions = empleados
    .filter((e) => e.activo)
    .map((e) => ({ value: e.id, label: e.nombre }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esEdicion ? "Editar Tarea" : "Nueva Tarea"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Título *" name="titulo" value={titulo} onChange={setTitulo} required placeholder="Título de la tarea" />
        <FormField label="Descripción" name="descripcion" value={descripcion} onChange={setDescripcion} placeholder="Descripción opcional" />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Prioridad" name="prioridad" type="select" value={prioridad} onChange={setPrioridad}
            options={[
              { value: "baja", label: "Baja" },
              { value: "media", label: "Media" },
              { value: "alta", label: "Alta" },
              { value: "urgente", label: "Urgente" },
            ]}
          />
          {esEdicion && (
            <FormField label="Columna" name="columna" type="select" value={columna} onChange={setColumna}
              options={[
                { value: "pendientes", label: "Pendientes" },
                { value: "en_progreso", label: "En Progreso" },
                { value: "en_revision", label: "En Revisión" },
                { value: "completadas", label: "Completadas" },
              ]}
            />
          )}
          <FormField label="Asignado a" name="asignadoId" type="select" value={asignadoId} onChange={setAsignadoId}
            options={[{ value: "", label: "Sin asignar" }, ...empOptions]}
          />
          <FormField label="Fecha Límite" name="fechaLimite" type="date" value={fechaLimite} onChange={setFechaLimite} />
        </div>
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text={esEdicion ? "Actualizar Tarea" : "Crear Tarea"} />
      </form>

      {/* Sección de comentarios (solo en edición) */}
      {esEdicion && tarea && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <MessageSquare size={16} />
            Comentarios ({comentarios.length})
          </h4>

          <div className="mb-3 max-h-40 space-y-2 overflow-y-auto">
            {comentarios.length === 0 ? (
              <p className="text-xs text-gray-400">Sin comentarios</p>
            ) : (
              comentarios.map((c) => (
                <div key={c.id} className="rounded-lg bg-gray-50 p-2.5">
                  <p className="text-sm text-gray-700">{c.contenido}</p>
                  <p className="mt-1 text-[10px] text-gray-400">
                    {new Date(c.created_at).toLocaleDateString("es-DO", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              placeholder="Agregar comentario..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleAgregarComentario()}
            />
            <button
              type="button"
              onClick={handleAgregarComentario}
              disabled={!nuevoComentario.trim()}
              className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Página principal ────────────────────────────────────────────
export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [tareas, setTareas] = useState<TareaConAsignado[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [selectedProyectoId, setSelectedProyectoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTareas, setLoadingTareas] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Modales
  const [proyectoModalOpen, setProyectoModalOpen] = useState(false);
  const [proyectoEditando, setProyectoEditando] = useState<Proyecto | null>(null);
  const [tareaModalOpen, setTareaModalOpen] = useState(false);
  const [tareaEditando, setTareaEditando] = useState<TareaConAsignado | null>(null);

  // Confirm dialogs
  const [deleteProyectoId, setDeleteProyectoId] = useState<string | null>(null);
  const [deleteTareaId, setDeleteTareaId] = useState<string | null>(null);
  const [confirmProyectoOpen, setConfirmProyectoOpen] = useState(false);
  const [confirmTareaOpen, setConfirmTareaOpen] = useState(false);

  const cargarProyectos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [proys, emps] = await Promise.all([listarProyectos(), listarEmpleados()]);
      setProyectos(proys);
      setEmpleados(emps);
      if (proys.length > 0 && !selectedProyectoId) {
        setSelectedProyectoId(proys[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Error al cargar proyectos"));
    } finally {
      setLoading(false);
    }
  }, [selectedProyectoId]);

  useEffect(() => { cargarProyectos(); }, []);

  const recargarTareas = useCallback(async () => {
    if (!selectedProyectoId) return;
    setLoadingTareas(true);
    const ts = await listarTareas(selectedProyectoId);
    setTareas(ts);
    setLoadingTareas(false);
  }, [selectedProyectoId]);

  useEffect(() => { recargarTareas(); }, [recargarTareas]);

  const handleMoverTarea = async (tareaId: string, nuevaColumna: ColumnaKanban) => {
    await moverTarea(tareaId, nuevaColumna, 0);
    setTareas((prev) =>
      prev.map((t) => (t.id === tareaId ? { ...t, columna: nuevaColumna } : t))
    );
  };

  // ── Editar proyecto ────────────────────────────────────────
  const handleEditarProyecto = (proyecto: Proyecto) => {
    setProyectoEditando(proyecto);
    setProyectoModalOpen(true);
  };

  // ── Eliminar proyecto ──────────────────────────────────────
  const handleEliminarProyecto = (id: string) => {
    setDeleteProyectoId(id);
    setConfirmProyectoOpen(true);
  };

  const confirmarEliminarProyecto = async () => {
    if (deleteProyectoId) {
      await eliminarProyecto(deleteProyectoId);
      if (selectedProyectoId === deleteProyectoId) {
        setSelectedProyectoId(null);
      }
      cargarProyectos();
      setDeleteProyectoId(null);
    }
  };

  // ── Editar tarea ───────────────────────────────────────────
  const handleEditarTarea = (tarea: TareaConAsignado) => {
    setTareaEditando(tarea);
    setTareaModalOpen(true);
  };

  // ── Eliminar tarea ─────────────────────────────────────────
  const handleEliminarTarea = (id: string) => {
    setDeleteTareaId(id);
    setConfirmTareaOpen(true);
  };

  const confirmarEliminarTarea = async () => {
    if (deleteTareaId) {
      await eliminarTarea(deleteTareaId);
      recargarTareas();
      setDeleteTareaId(null);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarProyectos} />;

  return (
    <div>
      <PageHeader title="Proyectos y Tareas" />

      <div className="flex gap-6 h-[calc(100vh-160px)]">
        {/* Sidebar de proyectos (280px) */}
        <div className="w-72 shrink-0">
          <ProyectoSidebar
            proyectos={proyectos}
            selectedId={selectedProyectoId}
            onSelect={setSelectedProyectoId}
            onNew={() => { setProyectoEditando(null); setProyectoModalOpen(true); }}
            onEdit={handleEditarProyecto}
            onDelete={handleEliminarProyecto}
          />
        </div>

        {/* Kanban (resto del espacio) */}
        <div className="flex-1 min-w-0">
          <KanbanBoard
            tareas={tareas}
            proyectoId={selectedProyectoId || ""}
            onMoverTarea={handleMoverTarea}
            onNuevaTarea={() => { setTareaEditando(null); setTareaModalOpen(true); }}
            onEditarTarea={handleEditarTarea}
            onEliminarTarea={handleEliminarTarea}
            loading={loadingTareas}
          />
        </div>
      </div>

      {/* Modal Proyecto (crear/editar) */}
      <ProyectoForm
        isOpen={proyectoModalOpen}
        onClose={() => { setProyectoModalOpen(false); setProyectoEditando(null); }}
        onSuccess={cargarProyectos}
        proyecto={proyectoEditando}
      />

      {/* Modal Tarea (crear/editar) */}
      <TareaForm
        isOpen={tareaModalOpen}
        onClose={() => { setTareaModalOpen(false); setTareaEditando(null); }}
        onSuccess={recargarTareas}
        proyectoId={selectedProyectoId || ""}
        empleados={empleados}
        tarea={tareaEditando}
      />

      {/* Confirm eliminar proyecto */}
      <ConfirmDialog
        isOpen={confirmProyectoOpen}
        onClose={() => { setConfirmProyectoOpen(false); setDeleteProyectoId(null); }}
        onConfirm={confirmarEliminarProyecto}
        title="Eliminar Proyecto"
        message="¿Estás seguro? Se eliminarán todas las tareas y comentarios asociados."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Confirm eliminar tarea */}
      <ConfirmDialog
        isOpen={confirmTareaOpen}
        onClose={() => { setConfirmTareaOpen(false); setDeleteTareaId(null); }}
        onConfirm={confirmarEliminarTarea}
        title="Eliminar Tarea"
        message="¿Estás seguro de eliminar esta tarea? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}