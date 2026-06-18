import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { supabaseResponse } = await updateSession(request);
  return supabaseResponse;
}

export const config = {
  matcher: [
    // Solo ejecutar en rutas del dashboard protegidas
    // NO en API, static files, _next, etc.
    "/(inicio|rrhh|tareas|facturacion)/:path*",
  ],
};