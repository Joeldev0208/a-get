import { supabase } from "@/lib/supabase";
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
  const { data } = await supabase.from("empresas").select("*").eq("id", id).single();
  return data;
}

export async function obtenerEmpresaPorCodigo(codigo: string): Promise<Empresa | null> {
  const { data } = await supabase.from("empresas").select("*").eq("codigo_unico", codigo).single();
  return data;
}

export async function crearPerfil(data: PerfilUsuarioInput): Promise<PerfilUsuario> {
  const { data: perfil, error } = await supabase
    .from("perfiles_usuario")
    .insert(data)
    .select("*, empresas(nombre, codigo_unico)")
    .single();

  if (error) throw new Error(`Error al crear perfil: ${error.message}`);
  return perfil;
}

export async function obtenerPerfilActual(): Promise<PerfilUsuario | null> {
  console.log("[obtenerPerfilActual] Iniciando...");

  // Primero intentar con getSession()
  let userId: string | null = null;
  let email: string | null = null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log("[obtenerPerfilActual] getSession:", session ? `Usuario ${session.user.id}` : "Sin sesión");
    userId = session?.user?.id || null;
    email = session?.user?.email || null;
  } catch (e) {
    console.warn("[obtenerPerfilActual] getSession falló:", e);
  }

  // Si getSession() no funcionó, usar getUser()
  if (!userId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("[obtenerPerfilActual] getUser:", user ? `Usuario ${user.id}` : "Sin usuario");
      userId = user?.id || null;
      email = user?.email || null;
    } catch (e) {
      console.error("[obtenerPerfilActual] getUser() también falló:", e);
      return null;
    }
  }

  if (!userId) {
    console.warn("[obtenerPerfilActual] No hay usuario autenticado");
    return null;
  }

  // Buscar perfil existente
  console.log("[obtenerPerfilActual] Buscando perfil para:", { userId, email });
  const { data, error } = await supabase
    .from("perfiles_usuario")
    .select("*, empresas(nombre, codigo_unico)")
    .eq("user_id", userId)
    .eq("activo", true)
    .single();

  // Si existe, retornarlo
  if (data && !error) {
    console.log("[obtenerPerfilActual] Perfil encontrado:", data);
    return data;
  }

  // Si no existe (PGRST116 = no rows found), crear perfil automáticamente
  if (error?.code === "PGRST116") {
    console.warn("[obtenerPerfilActual] Perfil no encontrado, creando automáticamente...");

    // Obtener el email del usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email || email || "usuario@example.com";

    // Crear empresa por defecto
    const { data: empresa, error: empresaError } = await supabase
      .from("empresas")
      .insert({
        nombre: "Mi Empresa",
        codigo_unico: `AGET-${Date.now().toString(36).toUpperCase()}`
      })
      .select()
      .single();

    if (empresaError || !empresa) {
      console.error("[obtenerPerfilActual] Error al crear empresa:", empresaError);
      return null;
    }

    console.log("[obtenerPerfilActual] Empresa creada:", empresa);

    // Crear perfil con rol de gerente
    const { data: perfil, error: perfilError } = await supabase
      .from("perfiles_usuario")
      .insert({
        user_id: userId,
        empresa_id: empresa.id,
        rol: "gerente",
        activo: true,
        nombre: email || `Usuario ${userId.slice(0, 8)}`
      })
      .select("*, empresas(nombre, codigo_unico)")
      .single();

    if (perfilError || !perfil) {
      console.error("[obtenerPerfilActual] Error al crear perfil:", perfilError);
      return null;
    }

    console.log("[obtenerPerfilActual] Perfil creado automáticamente:", perfil);
    return perfil;
  }

  // Otro tipo de error
  console.error("[obtenerPerfilActual] Error al buscar perfil:", error);
  return null;
}

export async function listarPerfiles(empresaId: string): Promise<PerfilUsuario[]> {
  const { data } = await supabase
    .from("perfiles_usuario")
    .select("*, empresas(nombre, codigo_unico)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function actualizarRol(perfilId: string, rol: RolUsuario): Promise<void> {
  const { error } = await supabase
    .from("perfiles_usuario")
    .update({ rol })
    .eq("id", perfilId);

  if (error) throw new Error(`Error al actualizar rol: ${error.message}`);
}

export async function buscarPerfilActual(): Promise<PerfilUsuario | null> {
  // Obtener userId
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  // Buscar perfil existente SIN crear automáticamente
  const { data } = await supabase
    .from("perfiles_usuario")
    .select("*, empresas(nombre, codigo_unico)")
    .eq("user_id", userId)
    .eq("activo", true)
    .single();

  return data || null;
}

export async function actualizarEmpresa(id: string, data: Partial<EmpresaInput>): Promise<void> {
  const { error } = await supabase.from("empresas").update(data).eq("id", id);
  if (error) throw new Error(`Error al actualizar empresa: ${error.message}`);
}

export async function unirseAEmpresa(codigo: string, userId: string): Promise<PerfilUsuario> {
  // Buscar empresa por código
  const empresa = await obtenerEmpresaPorCodigo(codigo);
  if (!empresa) {
    throw new Error("Código de empresa inválido. Verifica el código e intenta de nuevo.");
  }

  // Verificar si el usuario ya tiene un perfil en esta empresa
  const { data: perfilExistente } = await supabase
    .from("perfiles_usuario")
    .select("id")
    .eq("user_id", userId)
    .eq("empresa_id", empresa.id)
    .single();

  if (perfilExistente) {
    throw new Error("Ya eres miembro de esta empresa.");
  }

  // Obtener email del usuario
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email || "usuario@example.com";

  // Crear perfil con rol de empleado general
  return crearPerfil({
    user_id: userId,
    empresa_id: empresa.id,
    rol: "empleado_general",
    activo: true,
    nombre: userEmail || `Usuario ${userId.slice(0, 8)}`
  });
}
