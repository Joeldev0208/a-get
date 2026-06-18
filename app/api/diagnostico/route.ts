import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const resultados: Record<string, any> = {
    estado: "iniciando",
    timestamp: new Date().toISOString(),
    tests: {},
  };

  try {
    // ============================================================
    // TEST 1: Verificar variables de entorno
    // ============================================================
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    resultados.tests.env = {
      titulo: "Variables de Entorno",
      status: supabaseUrl && supabaseKey ? "✅ OK" : "❌ FALLO",
      detalles: {
        supabaseUrl: supabaseUrl
          ? `Presente (${supabaseUrl.substring(0, 20)}...)`
          : "NO DEFINIDA",
        supabaseKey: supabaseKey
          ? `Presente (${supabaseKey.substring(0, 15)}...)`
          : "NO DEFINIDA",
      },
    };

    if (!supabaseUrl || !supabaseKey) {
      resultados.estado = "error";
      return NextResponse.json(resultados, { status: 500 });
    }

    // ============================================================
    // TEST 2: Crear cliente Supabase SSR
    // ============================================================
    let supabase;
    try {
      supabase = await createClient();
      resultados.tests.cliente = {
        titulo: "Cliente Supabase SSR",
        status: "✅ OK",
        detalles: "Cliente creado exitosamente",
      };
    } catch (err: any) {
      resultados.tests.cliente = {
        titulo: "Cliente Supabase SSR",
        status: "❌ FALLO",
        detalles: err.message,
      };
      resultados.estado = "error";
      return NextResponse.json(resultados, { status: 500 });
    }

    // ============================================================
    // TEST 3: Listar tablas (verificar que existen)
    // ============================================================
    const tablasEsperadas = [
      "empleados",
      "departamentos",
      "asistencia",
      "proyectos",
      "tareas",
      "comentarios",
      "clientes",
      "facturas",
      "detalles_factura",
      "pagos",
    ];

    const tablasResultados: Record<string, string> = {};

    for (const tabla of tablasEsperadas) {
      try {
        const { data, error } = await supabase
          .from(tabla)
          .select("*", { count: "exact", head: true });

        if (error) {
          tablasResultados[tabla] = `❌ ${error.message}`;
        } else {
          const count = Array.isArray(data) ? data.length : 0;
          tablasResultados[tabla] = `✅ OK (${count} registros)`;
        }
      } catch (err: any) {
        tablasResultados[tabla] = `❌ ${err.message}`;
      }
    }

    const tablasOK = Object.values(tablasResultados).filter((v) =>
      v.startsWith("✅")
    ).length;
    const tablasTotal = tablasEsperadas.length;

    resultados.tests.tablas = {
      titulo: "Tablas en Supabase",
      status: `${tablasOK === tablasTotal ? "✅" : "⚠️"} ${tablasOK}/${tablasTotal} tablas OK`,
      detalles: tablasResultados,
    };

    // ============================================================
    // TEST 4: Probar autenticación (sin sesión esperada)
    // ============================================================
    try {
      const { data } = await supabase.auth.getSession();
      resultados.tests.auth = {
        titulo: "Autenticación Supabase",
        status: data.session ? "✅ Sesión activa" : "ℹ️ Sin sesión (esperado)",
        detalles: data.session
          ? `Usuario: ${data.session.user.email}`
          : "No hay sesión iniciada - es normal sin login",
      };
    } catch (err: any) {
      resultados.tests.auth = {
        titulo: "Autenticación Supabase",
        status: "⚠️ Error al verificar sesión",
        detalles: err.message,
      };
    }

    // ============================================================
    // FINAL
    // ============================================================
    const todosOK = Object.values(resultados.tests).every(
      (t: any) => t.status.startsWith("✅") || t.status.includes("ℹ️")
    );

    resultados.estado = todosOK ? "✅ TODO OK" : "⚠️ Con problemas";

    return NextResponse.json(resultados);
  } catch (err: any) {
    resultados.estado = "error";
    resultados.error = err.message;
    return NextResponse.json(resultados, { status: 500 });
  }
}