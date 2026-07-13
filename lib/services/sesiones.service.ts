// ============================================================
// Servicio: Sesiones (Caja / Trabajo)
// CRUD: Sesiones
// ============================================================

import { supabase } from "@/lib/supabase";
import { fromSupabaseSingle, fromSupabaseList } from "./supabase-service";
import type { Sesion, SesionInput, SesionCierreInput, SesionConUsuario } from "@/lib/types/sesiones";

export async function listarSesiones(empresaId: string): Promise<SesionConUsuario[]> {
  return fromSupabaseList(
    supabase
      .from("sesiones")
      .select("*, perfiles_usuario(rol, usuarios(email))")
      .eq("empresa_id", empresaId)
      .order("fecha_apertura", { ascending: false })
  );
}

export async function obtenerSesion(id: string, empresaId: string): Promise<SesionConUsuario> {
  return fromSupabaseSingle(
    supabase
      .from("sesiones")
      .select("*, perfiles_usuario(rol, usuarios(email))")
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .single()
  );
}

export async function abrirSesion(empresaId: string, input: Omit<SesionInput, "empresa_id">): Promise<Sesion> {
  return fromSupabaseSingle(
    supabase.from("sesiones").insert({ ...input, empresa_id: empresaId }).select("*").single()
  );
}

export async function cerrarSesion(
  id: string,
  empresaId: string,
  input: SesionCierreInput
): Promise<Sesion> {
  return fromSupabaseSingle(
    supabase
      .from("sesiones")
      .update({
        ...input,
        estado: "cerrada",
        fecha_cierre: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .select("*")
      .single()
  );
}

export async function eliminarSesion(id: string, empresaId: string): Promise<void> {
  const { error } = await supabase
    .from("sesiones")
    .delete()
    .eq("id", id)
    .eq("empresa_id", empresaId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function obtenerSesionAbierta(empresaId: string): Promise<SesionConUsuario | null> {
  const { data, error } = await supabase
    .from("sesiones")
    .select("*, perfiles_usuario(rol, usuarios(email))")
    .eq("empresa_id", empresaId)
    .eq("estado", "abierta")
    .order("fecha_apertura", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  return data || null;
}