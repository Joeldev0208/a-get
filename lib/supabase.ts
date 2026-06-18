import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para usar en el navegador (Client Components).
 * Cuando implementemos Server Components, usaremos lib/supabase/server.ts
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);