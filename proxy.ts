import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  // Si no hay usuario autenticado, redirigir al landing
  if (!user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/(inicio|rrhh|tareas|ventas|inventario|sesiones|configuracion)/:path*",
  ],
};