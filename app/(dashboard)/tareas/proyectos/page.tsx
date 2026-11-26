"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
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
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { Proyecto, TareaConAsignado, ColumnaKanban, Comentario } from "@/lib/types/tareas";
import type { Empleado } from "@/lib/types/rrhh";
import { Pencil, Trash2, MessageSquare, Send } from "lucide-react";

// ── Formulario de Proyecto (Crear/Editar) ──────────────────────
interface ProyectoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  empresaId: string;
  proyecto?: Proyecto | null;
}

function ProyectoForm({ isOpen, onClose, onSuccess, empresaId, proyecto }: ProyectoFormProps) {
  const { t } = useTranslation();
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
    if (!nombre.trim()) { setError("The name is required"); return; }

    try {
      setLoading(true);
      setError(null);

      if (esEdicion && proyecto) {
        await actualizarProyecto(proyecto.id, empresaId, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          estado: estado as any,
        });
      } else {
        await crearProyecto(empresaId, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          fecha_inicio: new Date().toISOString().split("T")[0],
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error saving project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esEdicion ? "Edit Project" : t("tareas.addProject")} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={`${t("common.name")} *`} name="nombre" value={nombre} onChange={setNombre} required placeholder={t("tareas.projectName")} />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">{t("tareas.description")}</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Optional description..."
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {esEdicion && (
          <FormField label={t("tareas.status")} name="estado" type="select" value={estado} onChange={setEstado}
            options={[
              { value: "activo", label: t("common.active") },
              { value: "pausado", label: "Paused" },
              { value: "completado", label: "Completed" },
              { value: "cancelado", label: "Canceled" },
            ]}
          />
        )}
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text={esEdicion ? "Update Project" : "Create Project"} />
      </form>
    </Modal>
  );
}

// ── Formulario de Tarea (Crear/Editar) ─────────────────────────
interface TareaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  empresaId: string;
  proyectoId: string;
  empleados: Empleado[];
  tarea?: TareaConAsignado | null;
}

function TareaForm({ isOpen, onClose, onSuccess, empresaId, proyectoId, empleados, tarea }: TareaFormProps) {
  const { t, i18n: i18nInstance } = useTranslation();
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
    if (!titulo.trim()) { setError("The title is required"); return; }

    try {
      setLoading(true);
      setError(null);

      if (esEdicion && tarea) {
        await actualizarTarea(tarea.id, empresaId, {
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || null,
          prioridad: prioridad as any,
          columna: columna as ColumnaKanban,
          asignado_id: asignadoId || null,
          fecha_limite: fechaLimite || null,
        });
      } else {
        await crearTarea(empresaId, {
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
      setError(err.message || "Error saving task");
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
      alert(`Error adding comment: ${e.message}`);
    }
  };

  const empOptions = empleados
    .filter((e) => e.activo)
    .map((e) => ({ value: e.id, label: e.nombre }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esEdicion ? "Edit Task" : t("tareas.addTask")} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={`${t("tareas.taskTitle")} *`} name="titulo" value={titulo} onChange={setTitulo} required placeholder={t("tareas.taskTitle")} />
        <FormField label={t("tareas.description")} name="descripcion" value={descripcion} onChange={setDescripcion} placeholder="Optional description" />
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t("tareas.priority")} name="prioridad" type="select" value={prioridad} onChange={setPrioridad}
            options={[
              { value: "baja", label: t("tareas.low") },
              { value: "media", label: t("tareas.medium") },
              { value: "alta", label: t("tareas.high") },
              { value: "urgente", label: t("tareas.urgent") },
            ]}
          />
          {esEdicion && (
            <FormField label={t("tareas.column")} name="columna" type="select" value={columna} onChange={setColumna}
              options={[
                { value: "pendientes", label: t("tareas.pending") },
                { value: "en_progreso", label: t("tareas.inProgress") },
                { value: "en_revision", label: t("tareas.review") },
                { value: "completadas", label: t("tareas.completed") },
              ]}
            />
          )}
          <FormField label="Assigned to" name="asignadoId" type="select" value={asignadoId} onChange={setAsignadoId}
            options={[{ value: "", label: "Unassigned" }, ...empOptions]}
          />
          <FormField label="Due Date" name="fechaLimite" type="date" value={fechaLimite} onChange={setFechaLimite} />
        </div>
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text={esEdicion ? "Update Task" : "Create Task"} />
      </form>

      {/* Sección de comentarios (solo en edición) */}
      {esEdicion && tarea && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <MessageSquare size={16} />
            Comments ({comentarios.length})
          </h4>

          <div className="mb-3 max-h-40 space-y-2 overflow-y-auto">
            {comentarios.length === 0 ? (
              <p className="text-xs text-gray-400">No comments</p>
            ) : (
              comentarios.map((c) => (
                <div key={c.id} className="rounded-lg bg-gray-50 p-2.5">
                  <p className="text-sm text-gray-700">{c.contenido}</p>
                  <p className="mt-1 text-[10px] text-gray-400">
                    {new Date(c.created_at).toLocaleDateString(i18nInstance.language === "en" ? "en-US" : "es-DO", {
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
              placeholder="Add comment..."
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
  const { t } = useTranslation();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [tareas, setTareas] = useState<TareaConAsignado[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [selectedProyectoId, setSelectedProyectoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTareas, setLoadingTareas] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [empresaId, setEmpresaId] = useState<string>("");

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
       
      const perfil = await obtenerPerfilActual();
      if (!perfil) throw new Error("Could not get user profile");
      setEmpresaId(perfil.empresa_id);
      
      const [proys, emps] = await Promise.all([
        listarProyectos(perfil.empresa_id),
        listarEmpleados(perfil.empresa_id)
      ]);
      
      setProyectos(proys);
      setEmpleados(emps);
      if (proys.length > 0 && !selectedProyectoId) {
        setSelectedProyectoId(proys[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Error loading projects"));
    } finally {
      setLoading(false);
    }
  }, [selectedProyectoId]);

  useEffect(() => { cargarProyectos(); }, []);

  const recargarTareas = useCallback(async () => {
    if (!selectedProyectoId) return;
    setLoadingTareas(true);
    
    const ts = await listarTareas(empresaId, selectedProyectoId);
    setTareas(ts);
    setLoadingTareas(false);
  }, [selectedProyectoId]);

  useEffect(() => { recargarTareas(); }, [recargarTareas]);

  const handleMoverTarea = async (tareaId: string, nuevaColumna: ColumnaKanban) => {
    await moverTarea(tareaId, empresaId, nuevaColumna, 0);
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
      await eliminarProyecto(deleteProyectoId, empresaId);
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
      await eliminarTarea(deleteTareaId, empresaId);
      recargarTareas();
      setDeleteTareaId(null);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarProyectos} />;

  return (
    <div>
      <PageHeader title={t("tareas.proyectos")} />

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
        empresaId={empresaId}
        proyecto={proyectoEditando}
      />

      {/* Modal Tarea (crear/editar) */}
      <TareaForm
        isOpen={tareaModalOpen}
        onClose={() => { setTareaModalOpen(false); setTareaEditando(null); }}
        onSuccess={recargarTareas}
        empresaId={empresaId}
        proyectoId={selectedProyectoId || ""}
        empleados={empleados}
        tarea={tareaEditando}
      />

      {/* Confirm eliminar proyecto */}
      <ConfirmDialog
        isOpen={confirmProyectoOpen}
        onClose={() => { setConfirmProyectoOpen(false); setDeleteProyectoId(null); }}
        onConfirm={confirmarEliminarProyecto}
        title="Delete Project"
        message="Are you sure? All associated tasks and comments will be deleted."
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
      />

      {/* Confirm eliminar tarea */}
      <ConfirmDialog
        isOpen={confirmTareaOpen}
        onClose={() => { setConfirmTareaOpen(false); setDeleteTareaId(null); }}
        onConfirm={confirmarEliminarTarea}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
      />
    </div>
  );
}
