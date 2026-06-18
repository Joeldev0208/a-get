// ============================================================
// RR.HH. - Tipos del módulo de Recursos Humanos
// ============================================================

// ---- Empleados ----
export interface Empleado {
  id: string;
  nombre: string;
  email: string;
  puesto: string;
  salario: number;
  activo: boolean;
  departamento_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmpleadoInput {
  nombre: string;
  email: string;
  puesto: string;
  salario: number;
  activo?: boolean;
  departamento_id?: string | null;
}

export interface EmpleadoConDepartamento extends Empleado {
  departamentos: { nombre: string } | null;
}

// ---- Departamentos ----
export interface Departamento {
  id: string;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

export interface DepartamentoInput {
  nombre: string;
  descripcion?: string | null;
}

// ---- Asistencia ----
export type EstadoAsistencia = "presente" | "ausente" | "tarde" | "permiso";

export interface Asistencia {
  id: string;
  empleado_id: string;
  fecha: string;
  estado: EstadoAsistencia;
  hora_entrada: string | null;
  hora_salida: string | null;
  created_at: string;
  updated_at: string;
}

export interface AsistenciaInput {
  empleado_id: string;
  fecha: string;
  estado: EstadoAsistencia;
  hora_entrada?: string | null;
  hora_salida?: string | null;
}

export interface AsistenciaConEmpleado extends Asistencia {
  empleados: { nombre: string; email: string } | null;
}