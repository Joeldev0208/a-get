import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para usar en el navegador (Client Components).
 * Crea el cliente de forma lazy para no fallar durante el prerenderizado
 * en Vercel (donde las variables de entorno no están disponibles en build).
 */
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url && typeof window !== "undefined") {
    console.warn("[Supabase] NEXT_PUBLIC_SUPABASE_URL no está definida");
  }
  return url || "https://placeholder.supabase.co";
}

function getSupabaseKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key && typeof window !== "undefined") {
    console.warn("[Supabase] NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no está definida");
  }
  return key || "placeholder-key";
}

export const supabase = createBrowserClient(getSupabaseUrl(), getSupabaseKey());
