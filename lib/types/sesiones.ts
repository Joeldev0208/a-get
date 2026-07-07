// ============================================================
// Sesiones - Tipos del módulo de Sesiones (Caja / Trabajo)
// ============================================================

export type EstadoSesion = "abierta" | "cerrada";

export interface Sesion {
  id: string;
  empresa_id: string;
  usuario_id: string | null;
  fecha_apertura: string;
  fecha_cierre: string | null;
  estado: EstadoSesion;
  total_inicial: number;
  total_final: number | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface SesionInput {
  usuario_id?: string | null;
  total_inicial?: number;
  observaciones?: string | null;
}

export interface SesionCierreInput {
  total_final: number;
  observaciones?: string | null;
}

export interface SesionConUsuario extends Sesion {
  perfiles_usuario?: {
    rol: string;
    usuarios?: { email: string } | null;
  } | null;
}