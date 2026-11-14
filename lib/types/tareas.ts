// ============================================================
// Tareas - Tipos del módulo de Tareas y Proyectos
// ============================================================

// ---- Proyectos ----
export type EstadoProyecto = "activo" | "pausado" | "completado" | "cancelado";
export type Prioridad = "baja" | "media" | "alta" | "urgente";

export interface Proyecto {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion: string | null;
  estado: EstadoProyecto;
  prioridad: Prioridad;
  fecha_inicio: string;
  fecha_fin: string | null;
  responsable_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProyectoInput {
  nombre: string;
  descripcion?: string | null;
  estado?: EstadoProyecto;
  prioridad?: Prioridad;
  fecha_inicio: string;
  fecha_fin?: string | null;
  responsable_id?: string | null;
}

// ---- Tareas (Kanban) ----
export type ColumnaKanban = "pendientes" | "en_progreso" | "en_revision" | "completadas";

export interface Tarea {
  id: string;
  empresa_id: string;
  proyecto_id: string;
  titulo: string;
  descripcion: string | null;
  columna: ColumnaKanban;
  prioridad: Prioridad;
  orden: number;
  asignado_id: string | null;
  fecha_limite: string | null;
  created_at: string;
  updated_at: string;
}

export interface TareaInput {
  proyecto_id: string;
  titulo: string;
  descripcion?: string | null;
  columna?: ColumnaKanban;
  prioridad?: Prioridad;
  orden?: number;
  asignado_id?: string | null;
  fecha_limite?: string | null;
}

export interface TareaConAsignado extends Tarea {
  empleados: { nombre: string } | null;
  proyectos: { nombre: string } | null;
}

// ---- Comentarios ----
export interface Comentario {
  id: string;
  empresa_id: string;
  tarea_id: string;
  contenido: string;
  autor_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComentarioInput {
  tarea_id: string;
  contenido: string;
  autor_id?: string | null;
}