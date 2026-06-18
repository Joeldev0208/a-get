import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Crea un cliente de Supabase para usar en Server Components,
 * Route Handlers y Server Actions.
 *
 * Usa cookies para mantener la sesión del usuario.
 * Llama a getSession() o getUser() para inicializar la sesión.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // El método setAll fue llamado desde un Server Component.
            // Esto puede ignorarse si tienes middleware actualizando las
            // cookies de sesión.
          }
        },
      },
    }
  );
}