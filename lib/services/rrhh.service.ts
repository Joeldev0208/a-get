import { supabase } from "@/lib/supabase";
import { fromSupabaseSingle, fromSupabaseList } from "./supabase-service";
import type {
  Empleado,
  EmpleadoInput,
  EmpleadoConDepartamento,
  Departamento,
  DepartamentoInput,
  Asistencia,
  AsistenciaInput,
  AsistenciaConEmpleado,
} from "@/lib/types/rrhh";

// ============================================================
// Servicio: RR.HH.
// CRUD: Empleados, Departamentos, Asistencia
// ============================================================

// ---- Empleados ----

export async function listarEmpleados(): Promise<EmpleadoConDepartamento[]> {
  return fromSupabaseList(
    supabase
      .from("empleados")
      .select("*, departamentos(nombre)")
      .order("nombre")
  );
}

export async function obtenerEmpleado(id: string): Promise<EmpleadoConDepartamento> {
  return fromSupabaseSingle(
    supabase
      .from("empleados")
      .select("*, departamentos(nombre)")
      .eq("id", id)
      .single()
  );
}

export async function crearEmpleado(input: EmpleadoInput): Promise<Empleado> {
  return fromSupabaseSingle(
    supabase.from("empleados").insert(input).select("*").single()
  );
}

export async function actualizarEmpleado(
  id: string,
  input: Partial<EmpleadoInput>
): Promise<Empleado> {
  return fromSupabaseSingle(
    supabase.from("empleados").update(input).eq("id", id).select("*").single()
  );
}

export async function eliminarEmpleado(id: string): Promise<void> {
  const { error } = await supabase.from("empleados").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

// ---- Departamentos ----

export async function listarDepartamentos(): Promise<Departamento[]> {
  return fromSupabaseList(
    supabase.from("departamentos").select("*").order("nombre")
  );
}

export async function crearDepartamento(input: DepartamentoInput): Promise<Departamento> {
  return fromSupabaseSingle(
    supabase.from("departamentos").insert(input).select("*").single()
  );
}

export async function actualizarDepartamento(
  id: string,
  input: Partial<DepartamentoInput>
): Promise<Departamento> {
  return fromSupabaseSingle(
    supabase.from("departamentos").update(input).eq("id", id).select("*").single()
  );
}

export async function eliminarDepartamento(id: string): Promise<void> {
  const { error } = await supabase.from("departamentos").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

// ---- Asistencia ----

export async function listarAsistencia(): Promise<AsistenciaConEmpleado[]> {
  return fromSupabaseList(
    supabase
      .from("asistencia")
      .select("*, empleados(nombre, email)")
      .order("fecha", { ascending: false })
  );
}

export async function obtenerAsistencia(id: string): Promise<AsistenciaConEmpleado> {
  return fromSupabaseSingle(
    supabase
      .from("asistencia")
      .select("*, empleados(nombre, email)")
      .eq("id", id)
      .single()
  );
}

export async function registrarAsistencia(input: AsistenciaInput): Promise<Asistencia> {
  return fromSupabaseSingle(
    supabase.from("asistencia").insert(input).select("*").single()
  );
}

export async function actualizarAsistencia(
  id: string,
  input: Partial<AsistenciaInput>
): Promise<Asistencia> {
  return fromSupabaseSingle(
    supabase.from("asistencia").update(input).eq("id", id).select("*").single()
  );
}

export async function eliminarAsistencia(id: string): Promise<void> {
  const { error } = await supabase.from("asistencia").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listarAsistenciaPorEmpleado(
  empleadoId: string
): Promise<AsistenciaConEmpleado[]> {
  return fromSupabaseList(
    supabase
      .from("asistencia")
      .select("*, empleados(nombre, email)")
      .eq("empleado_id", empleadoId)
      .order("fecha", { ascending: false })
  );
}