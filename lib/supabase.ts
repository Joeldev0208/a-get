import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para usar en el navegador (Client Components).
 * Cuando implementemos Server Components, usaremos lib/supabase/server.ts
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (typeof window !== "undefined") {
  console.log("[Supabase] URL:", supabaseUrl);
  console.log("[Supabase] Key starts with:", supabaseKey?.substring(0, 20) + "...");
}

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY deben estar definidas en .env.local"
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
