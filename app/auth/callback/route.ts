import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/inicio";

  if (code) {
    // Crear la respuesta inicial para poder setear cookies en ella
    const response = NextResponse.redirect(new URL(next, requestUrl.origin));
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            // Leer cookies del request original
            const cookieHeader = request.headers.get("cookie") ?? "";
            return cookieHeader.split("; ").filter(Boolean).map(c => {
              const idx = c.indexOf("=");
              if (idx === -1) return { name: c.trim(), value: "" };
              return {
                name: c.substring(0, idx).trim(),
                value: c.substring(idx + 1).trim(),
              };
            });
          },
          setAll(cookiesToSet) {
            // Escribir TODAS las cookies de sesión en la respuesta de redirect
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
  }

  // Si no hay código o hubo error, redirigir al login
  return NextResponse.redirect(new URL("/login?error=session_error", requestUrl.origin));
}
