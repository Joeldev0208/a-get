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

// ---- Empleados ----

export async function listarEmpleados(empresaId: string): Promise<EmpleadoConDepartamento[]> {
  return fromSupabaseList(
    supabase
      .from("empleados")
      .select("*, departamentos(nombre)")
      .eq("empresa_id", empresaId)
      .order("nombre")
  );
}

export async function obtenerEmpleado(id: string, empresaId: string): Promise<EmpleadoConDepartamento> {
  return fromSupabaseSingle(
    supabase
      .from("empleados")
      .select("*, departamentos(nombre)")
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .single()
  );
}

export async function crearEmpleado(empresaId: string, input: EmpleadoInput): Promise<Empleado> {
  return fromSupabaseSingle(
    supabase.from("empleados").insert({ ...input, empresa_id: empresaId }).select("*").single()
  );
}

export async function actualizarEmpleado(
  id: string,
  empresaId: string,
  input: Partial<EmpleadoInput>
): Promise<Empleado> {
  return fromSupabaseSingle(
    supabase.from("empleados").update(input).eq("id", id).eq("empresa_id", empresaId).select("*").single()
  );
}

export async function eliminarEmpleado(id: string, empresaId: string): Promise<void> {
  const { error } = await supabase.from("empleados").delete().eq("id", id).eq("empresa_id", empresaId);
  if (error) {
    throw new Error(error.message);
  }
}

// ---- Departamentos ----

export async function listarDepartamentos(empresaId: string): Promise<Departamento[]> {
  return fromSupabaseList(
    supabase.from("departamentos").select("*").eq("empresa_id", empresaId).order("nombre")
  );
}

export async function crearDepartamento(empresaId: string, input: DepartamentoInput): Promise<Departamento> {
  return fromSupabaseSingle(
    supabase.from("departamentos").insert({ ...input, empresa_id: empresaId }).select("*").single()
  );
}

export async function actualizarDepartamento(
  id: string,
  empresaId: string,
  input: Partial<DepartamentoInput>
): Promise<Departamento> {
  return fromSupabaseSingle(
    supabase.from("departamentos").update(input).eq("id", id).eq("empresa_id", empresaId).select("*").single()
  );
}

export async function eliminarDepartamento(id: string, empresaId: string): Promise<void> {
  const { error } = await supabase.from("departamentos").delete().eq("id", id).eq("empresa_id", empresaId);
  if (error) {
    throw new Error(error.message);
  }
}

// ---- Asistencia ----

export async function listarAsistencia(empresaId: string): Promise<AsistenciaConEmpleado[]> {
  return fromSupabaseList(
    supabase
      .from("asistencia")
      .select("*, empleados(nombre, email)")
      .eq("empresa_id", empresaId)
      .order("fecha", { ascending: false })
  );
}

export async function obtenerAsistencia(id: string, empresaId: string): Promise<AsistenciaConEmpleado> {
  return fromSupabaseSingle(
    supabase
      .from("asistencia")
      .select("*, empleados(nombre, email)")
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .single()
  );
}

export async function registrarAsistencia(empresaId: string, input: AsistenciaInput): Promise<Asistencia> {
  return fromSupabaseSingle(
    supabase.from("asistencia").insert({ ...input, empresa_id: empresaId }).select("*").single()
  );
}

export async function actualizarAsistencia(
  id: string,
  empresaId: string,
  input: Partial<AsistenciaInput>
): Promise<Asistencia> {
  return fromSupabaseSingle(
    supabase.from("asistencia").update(input).eq("id", id).eq("empresa_id", empresaId).select("*").single()
  );
}

export async function eliminarAsistencia(id: string, empresaId: string): Promise<void> {
  const { error } = await supabase.from("asistencia").delete().eq("id", id).eq("empresa_id", empresaId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listarAsistenciaPorEmpleado(
  empleadoId: string,
  empresaId: string
): Promise<AsistenciaConEmpleado[]> {
  return fromSupabaseList(
    supabase
      .from("asistencia")
      .select("*, empleados(nombre, email)")
      .eq("empleado_id", empleadoId)
      .eq("empresa_id", empresaId)
      .order("fecha", { ascending: false })
  );
}
