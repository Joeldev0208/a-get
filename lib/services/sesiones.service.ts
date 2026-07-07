// ============================================================
// Servicio: Sesiones (Caja / Trabajo)
// CRUD: Sesiones
// ============================================================

import { supabase } from "@/lib/supabase";
import { fromSupabaseSingle, fromSupabaseList } from "./supabase-service";
import type { Sesion, SesionInput, SesionCierreInput, SesionConUsuario } from "@/lib/types/sesiones";

export async function listarSesiones(): Promise<SesionConUsuario[]> {
  return fromSupabaseList(
    supabase
      .from("sesiones")
      .select("*, perfiles_usuario(rol, usuarios(email))")
      .order("fecha_apertura", { ascending: false })
  );
}

export async function obtenerSesion(id: string): Promise<SesionConUsuario> {
  return fromSupabaseSingle(
    supabase
      .from("sesiones")
      .select("*, perfiles_usuario(rol, usuarios(email))")
      .eq("id", id)
      .single()
  );
}

export async function abrirSesion(input: SesionInput): Promise<Sesion> {
  return fromSupabaseSingle(
    supabase.from("sesiones").insert(input).select("*").single()
  );
}

export async function cerrarSesion(
  id: string,
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
      .select("*")
      .single()
  );
}

export async function eliminarSesion(id: string): Promise<void> {
  const { error } = await supabase.from("sesiones").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function obtenerSesionAbierta(): Promise<SesionConUsuario | null> {
  const { data, error } = await supabase
    .from("sesiones")
    .select("*, perfiles_usuario(rol, usuarios(email))")
    .eq("estado", "abierta")
    .order("fecha_apertura", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  return data || null;
}