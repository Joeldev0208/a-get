"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import ErrorBox from "@/components/ui/ErrorBox";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import ProyectoSidebar from "@/components/tareas/ProyectoSidebar";
import KanbanBoard from "@/components/tareas/KanbanBoard";
import {
  listarProyectos, crearProyecto,
  listarTareas, crearTarea, moverTarea,
} from "@/lib/services/tareas.service";
import { listarEmpleados } from "@/lib/services/rrhh.service";
import { ServiceError } from "@/lib/services/supabase-service";
import type { Proyecto, TareaConAsignado, ColumnaKanban } from "@/lib/types/tareas";
import type { Empleado } from "@/lib/types/rrhh";
import { Plus } from "lucide-react";

// ── Formulario de Proyecto ──────────────────────────────────────
interface ProyectoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function ProyectoForm({ isOpen, onClose, onSuccess }: ProyectoFormProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNombre("");
      setDescripcion("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }

    try {
      setLoading(true);
      setError(null);
      await crearProyecto({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        fecha_inicio: new Date().toISOString().split("T")[0],
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al crear proyecto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Proyecto" size="sm">
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
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text="Crear Proyecto" />
      </form>
    </Modal>
  );
}

// ── Formulario de Tarea ─────────────────────────────────────────
interface TareaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  proyectoId: string;
  empleados: Empleado[];
}

function TareaForm({ isOpen, onClose, onSuccess, proyectoId, empleados }: TareaFormProps) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState("media");
  const [asignadoId, setAsignadoId] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitulo("");
      setDescripcion("");
      setPrioridad("media");
      setAsignadoId("");
      setFechaLimite("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) { setError("El título es obligatorio"); return; }

    try {
      setLoading(true);
      setError(null);
      await crearTarea({
        proyecto_id: proyectoId,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        prioridad: prioridad as any,
        asignado_id: asignadoId || null,
        fecha_limite: fechaLimite || null,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al crear tarea");
    } finally {
      setLoading(false);
    }
  };

  const empOptions = empleados
    .filter((e) => e.activo)
    .map((e) => ({ value: e.id, label: e.nombre }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Tarea" size="md">
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
          <FormField label="Asignado a" name="asignadoId" type="select" value={asignadoId} onChange={setAsignadoId}
            options={[{ value: "", label: "Sin asignar" }, ...empOptions]}
          />
          <FormField label="Fecha Límite" name="fechaLimite" type="date" value={fechaLimite} onChange={setFechaLimite} />
        </div>
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text="Crear Tarea" />
      </form>
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
  const [tareaModalOpen, setTareaModalOpen] = useState(false);

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

  // Cargar tareas cuando cambia el proyecto seleccionado
  useEffect(() => {
    if (!selectedProyectoId) return;
    const cargarTareas = async () => {
      setLoadingTareas(true);
      const ts = await listarTareas(selectedProyectoId);
      setTareas(ts);
      setLoadingTareas(false);
    };
    cargarTareas();
  }, [selectedProyectoId]);

  const handleMoverTarea = async (tareaId: string, nuevaColumna: ColumnaKanban) => {
    await moverTarea(tareaId, nuevaColumna, 0);
    setTareas((prev) =>
      prev.map((t) => (t.id === tareaId ? { ...t, columna: nuevaColumna } : t))
    );
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarProyectos} />;

  return (
    <div>
      <PageHeader title="Proyectos y Tareas" />

      <div className="flex gap-6 h-[calc(100vh-160px)]">
        {/* Sidebar de proyectos (250px) */}
        <div className="w-64 shrink-0">
          <ProyectoSidebar
            proyectos={proyectos}
            selectedId={selectedProyectoId}
            onSelect={setSelectedProyectoId}
            onNew={() => setProyectoModalOpen(true)}
          />
        </div>

        {/* Kanban (resto del espacio) */}
        <div className="flex-1 min-w-0">
          <KanbanBoard
            tareas={tareas}
            proyectoId={selectedProyectoId || ""}
            onMoverTarea={handleMoverTarea}
            onNuevaTarea={() => setTareaModalOpen(true)}
            loading={loadingTareas}
          />
        </div>
      </div>

      <ProyectoForm
        isOpen={proyectoModalOpen}
        onClose={() => setProyectoModalOpen(false)}
        onSuccess={cargarProyectos}
      />

      <TareaForm
        isOpen={tareaModalOpen}
        onClose={() => setTareaModalOpen(false)}
        onSuccess={() => {
          if (selectedProyectoId) {
            listarTareas(selectedProyectoId).then(setTareas);
          }
        }}
        proyectoId={selectedProyectoId || ""}
        empleados={empleados}
      />
    </div>
  );
}