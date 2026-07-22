import { supabase } from "@/lib/supabase";
import { fromSupabaseSingle, fromSupabaseList } from "./supabase-service";
import type {
  Proyecto,
  ProyectoInput,
  Tarea,
  TareaInput,
  TareaConAsignado,
  Comentario,
  ComentarioInput,
} from "@/lib/types/tareas";

// ---- Proyectos ----

export async function listarProyectos(empresaId: string): Promise<Proyecto[]> {
  return fromSupabaseList(
    supabase
      .from("proyectos")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
  );
}

export async function obtenerProyecto(id: string, empresaId: string): Promise<Proyecto> {
  return fromSupabaseSingle(
    supabase
      .from("proyectos")
      .select("*")
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .single()
  );
}

export async function crearProyecto(empresaId: string, input: ProyectoInput): Promise<Proyecto> {
  return fromSupabaseSingle(
    supabase.from("proyectos").insert({ ...input, empresa_id: empresaId }).select("*").single()
  );
}

export async function actualizarProyecto(
  id: string,
  empresaId: string,
  input: Partial<ProyectoInput>
): Promise<Proyecto> {
  return fromSupabaseSingle(
    supabase
      .from("proyectos")
      .update(input)
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .select("*")
      .single()
  );
}

export async function eliminarProyecto(id: string, empresaId: string): Promise<void> {
  const { error } = await supabase
    .from("proyectos")
    .delete()
    .eq("id", id)
    .eq("empresa_id", empresaId);

  if (error) {
    throw new Error(error.message);
  }
}

// ---- Tareas (Kanban) ----

export async function listarTareas(empresaId: string, proyectoId?: string): Promise<TareaConAsignado[]> {
  let query = supabase
    .from("tareas")
    .select("*, empleados(nombre), proyectos(nombre)")
    .eq("empresa_id", empresaId)
    .order("orden");

  if (proyectoId) {
    query = query.eq("proyecto_id", proyectoId);
  }

  return fromSupabaseList(query);
}

export async function listarTareasPorColumna(
  empresaId: string,
  columna: string,
  proyectoId?: string
): Promise<TareaConAsignado[]> {
  let query = supabase
    .from("tareas")
    .select("*, empleados(nombre), proyectos(nombre)")
    .eq("empresa_id", empresaId)
    .eq("columna", columna)
    .order("orden");

  if (proyectoId) {
    query = query.eq("proyecto_id", proyectoId);
  }

  return fromSupabaseList(query);
}

export async function obtenerTarea(id: string, empresaId: string): Promise<TareaConAsignado> {
  return fromSupabaseSingle(
    supabase
      .from("tareas")
      .select("*, empleados(nombre), proyectos(nombre)")
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .single()
  );
}

export async function crearTarea(empresaId: string, input: TareaInput): Promise<Tarea> {
  return fromSupabaseSingle(
    supabase.from("tareas").insert({ ...input, empresa_id: empresaId }).select("*").single()
  );
}

export async function actualizarTarea(
  id: string,
  empresaId: string,
  input: Partial<TareaInput>
): Promise<Tarea> {
  return fromSupabaseSingle(
    supabase
      .from("tareas")
      .update(input)
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .select("*")
      .single()
  );
}

export async function moverTarea(
  id: string,
  empresaId: string,
  columna: string,
  orden: number
): Promise<Tarea> {
  return fromSupabaseSingle(
    supabase
      .from("tareas")
      .update({ columna, orden })
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .select("*")
      .single()
  );
}

export async function eliminarTarea(id: string, empresaId: string): Promise<void> {
  const { error } = await supabase
    .from("tareas")
    .delete()
    .eq("id", id)
    .eq("empresa_id", empresaId);

  if (error) {
    throw new Error(error.message);
  }
}

// ---- Comentarios ----

export async function listarComentarios(tareaId: string): Promise<Comentario[]> {
  return fromSupabaseList(
    supabase
      .from("comentarios")
      .select("*")
      .eq("tarea_id", tareaId)
      .order("created_at", { ascending: true })
  );
}

export async function crearComentario(input: ComentarioInput): Promise<Comentario> {
  return fromSupabaseSingle(
    supabase.from("comentarios").insert(input).select("*").single()
  );
}

export async function eliminarComentario(id: string): Promise<void> {
  const { error } = await supabase
    .from("comentarios")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
