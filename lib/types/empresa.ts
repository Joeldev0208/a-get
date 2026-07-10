// ============================================================
// Empresa y Roles
// ============================================================

export type RolUsuario =
  | "gerente"
  | "contador"
  | "cajero_vendedor"
  | "inventario"
  | "rrhh"
  | "empleado_general";

export interface Empresa {
  id: string;
  nombre: string;
  codigo_unico: string;
  created_at: string;
  updated_at: string;
}

export interface EmpresaInput {
  nombre: string;
}

export interface PerfilUsuario {
  id: string;
  user_id: string;
  empresa_id: string;
  rol: RolUsuario;
  activo: boolean;
  nombre?: string;
  created_at: string;
  updated_at: string;
  empresas?: { nombre: string; codigo_unico: string } | null;
}

export interface PerfilUsuarioInput {
  user_id: string;
  empresa_id: string;
  rol: RolUsuario;
  activo?: boolean;
}

export const ROLES_LABELS: Record<RolUsuario, string> = {
  gerente: "Gerente",
  contador: "Contador",
  cajero_vendedor: "Cajero / Vendedor",
  inventario: "Inventario",
  rrhh: "RR.HH.",
  empleado_general: "Empleado General",
};