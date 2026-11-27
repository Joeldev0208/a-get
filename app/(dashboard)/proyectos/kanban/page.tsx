"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import {
  listarTareasPorColumna,
  crearTarea,
} from "@/lib/services/tareas.service";
import { listarEmpleados as listarRrhhEmpleados } from "@/lib/services/rrhh.service";
import { listarProyectos } from "@/lib/services/tareas.service";
import { ServiceError } from "@/lib/services/supabase-service";
import type { TareaConAsignado, TareaInput } from "@/lib/types/tareas";
import { KanbanBoard, KanbanColumnaConfig } from "@/components/kanban";

/* =========================
   EJEMPLO: KanbanBoard en otra sección (ej. Proyectos)
   ========================= */

const PROYECTO_COLUMNAS: KanbanColumnaConfig[] = [
  { id: "pendientes", tituloKey: "pending", color: "border-t-gray-400" },
  { id: "en_progreso", tituloKey: "inProgress", color: "border-t-blue-500" },
  { id: "en_revision", tituloKey: "review", color: "border-t-yellow-500" },
  { id: "completadas", tituloKey: "completed", color: "border-t-green-500" },
];

export default function ProyectoKanbanPage() {
  const { t } = useTranslation();
  const [proyectos, setProyectos] = useState<{ id: string; nombre: string }[]>([]);
  const [empleados, setEmpleados] = useState<{ id: string; nombre: string }[]>([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [empresaId, setEmpresaId] = useState<string>("");

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const perfil = await obtenerPerfilActual();
      if (!perfil) throw new Error("Could not get user profile");
      if (!perfil.empresa_id) throw new Error("User has no company assigned");
      setEmpresaId(perfil.empresa_id);

      const [proys, emps] = await Promise.all([
        listarProyectos(perfil.empresa_id),
        listarRrhhEmpleados(perfil.empresa_id),
      ]);
      setProyectos(proys.map((p: any) => ({ id: p.id, nombre: p.nombre })));
      setEmpleados(emps.map((e: any) => ({ id: e.id, nombre: e.nombre })));
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  if (loading) return null;
  if (error) return <ServiceErrorBox error={error} onRetry={cargarDatos} />;
  if (!empresaId) return null;

  /* ── Callbacks del Kanban ── */

  const cargarTareas = async (columnaId: string): Promise<TareaConAsignado[]> => {
    // Filtrar también por proyecto si hay uno seleccionado
    return listarTareasPorColumna(empresaId, columnaId, proyectoSeleccionado || undefined);
  };

  const onCrearTarea = async (payload: Record<string, any>) => {
    await crearTarea(empresaId, payload as TareaInput);
  };

  const onActualizarTarea = async (id: string, payload: Record<string, any>) => {
    const { actualizarTarea } = await import("@/lib/services/tareas.service");
    await actualizarTarea(id, empresaId, payload);
  };

  const onMoverTarea = async (id: string, columna: string, orden: number) => {
    const { moverTarea } = await import("@/lib/services/tareas.service");
    await moverTarea(id, empresaId, columna, orden);
  };

  const onEliminarTarea = async (id: string) => {
    const { eliminarTarea } = await import("@/lib/services/tareas.service");
    await eliminarTarea(id, empresaId);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">{t("proyectos.kanban")}</h1>

      {/* Selector de proyecto */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-slate-700">{t("proyectos.selectProject")}</label>
        <select
          value={proyectoSeleccionado || ""}
          onChange={(e) => setProyectoSeleccionado(e.target.value || null)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        >
          <option value="">{t("proyectos.allProjects")}</option>
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* KanbanBoard reutilizable */}
      <KanbanBoard
        columnas={PROYECTO_COLUMNAS}
        empresaId={empresaId}
        proyectos={proyectos}
        empleados={empleados}
        cargarTareas={cargarTareas}
        onCrearTarea={onCrearTarea}
        onActualizarTarea={onActualizarTarea}
        onMoverTarea={onMoverTarea}
        onEliminarTarea={onEliminarTarea}
        i18nPrefix="tareas"
        emptyTitleKey="tareas.noTasks"
        emptyDescription="No tasks found for this project."
        addTaskLabelKey="tareas.addTask"
      />
    </div>
  );
}

/* ── Componente auxiliar para errores ── */
function ServiceErrorBox({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-red-700 shadow-sm">
        <h3 className="text-sm font-semibold">{error.message}</h3>
      </div>
      <button
        onClick={onRetry}
        className="mt-4 text-sm text-blue-600 hover:underline"
      >
        Retry
      </button>
    </div>
  );
}
