import { createBrowserClient } from "@supabase/ssr";

/**
 * Crea un cliente de Supabase para usar en el navegador (Client Components).
 * La sesión se maneja automáticamente via cookies.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}