// ============================================================
// Empresa y Roles
// ============================================================

import type { TFunction } from "i18next";

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
  idioma?: string;
  created_at: string;
  updated_at: string;
  empresas?: { nombre: string; codigo_unico: string } | null;
}

export interface PerfilUsuarioInput {
  user_id: string;
  empresa_id: string;
  rol: RolUsuario;
  activo?: boolean;
  nombre?: string;
}

export function getRolesLabels(t: TFunction): Record<RolUsuario, string> {
  return {
    gerente: t("configuracion.roles.gerente"),
    contador: t("configuracion.roles.contador"),
    cajero_vendedor: t("configuracion.roles.cajero_vendedor"),
    inventario: t("configuracion.roles.inventario"),
    rrhh: t("configuracion.roles.rrhh"),
    empleado_general: t("configuracion.roles.empleado_general"),
  };
}