import { createClient } from "@/lib/supabase/server";
import type { Empresa, EmpresaInput, PerfilUsuario, PerfilUsuarioInput, RolUsuario } from "@/lib/types/empresa";

function generarCodigoUnico(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let codigo = "";
  for (let i = 0; i < 6; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AGET-${codigo}`;
}

export async function crearEmpresa(data: EmpresaInput): Promise<Empresa> {
  const supabase = await createClient();
  const codigo_unico = generarCodigoUnico();

  const { data: empresa, error } = await supabase
    .from("empresas")
    .insert({ nombre: data.nombre, codigo_unico })
    .select()
    .single();

  if (error) throw new Error(`Error al crear empresa: ${error.message}`);
  return empresa;
}

export async function obtenerEmpresa(id: string): Promise<Empresa | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("empresas").select("*").eq("id", id).single();
  return data;
}

export async function obtenerEmpresaPorCodigo(codigo: string): Promise<Empresa | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("empresas").select("*").eq("codigo_unico", codigo).single();
  return data;
}

export async function crearPerfil(data: PerfilUsuarioInput): Promise<PerfilUsuario> {
  const supabase = await createClient();
  const { data: perfil, error } = await supabase
    .from("perfiles_usuario")
    .insert(data)
    .select("*, empresas(nombre, codigo_unico)")
    .single();

  if (error) throw new Error(`Error al crear perfil: ${error.message}`);
  return perfil;
}

export async function obtenerPerfilActual(): Promise<PerfilUsuario | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("perfiles_usuario")
    .select("*, empresas(nombre, codigo_unico)")
    .eq("user_id", user.id)
    .eq("activo", true)
    .single();

  return data;
}

export async function listarPerfiles(empresaId: string): Promise<PerfilUsuario[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfiles_usuario")
    .select("*, empresas(nombre, codigo_unico)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function actualizarRol(perfilId: string, rol: RolUsuario): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("perfiles_usuario")
    .update({ rol })
    .eq("id", perfilId);

  if (error) throw new Error(`Error al actualizar rol: ${error.message}`);
}

export async function actualizarEmpresa(id: string, data: Partial<EmpresaInput>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("empresas").update(data).eq("id", id);
  if (error) throw new Error(`Error al actualizar empresa: ${error.message}`);
}