import PageHeader from "@/components/layout/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { Users, ClipboardList, Receipt, UserCheck, TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import Link from "next/link";

interface Estadisticas {
  empleados: number;
  empleadosActivos: number;
  proyectos: number;
  proyectosActivos: number;
  facturas: number;
  facturasPendientes: number;
  clientes: number;
}

interface AnalisisVentas {
  gananciasTotales: number;
  perdidasEstimadas: number;
  productosMasVendidos: { nombre: string; cantidad: number; total: number }[];
  productosConCambioPrecio: { nombre: string; precioAnterior: number; precioActual: number; variacion: number }[];
}

async function obtenerDatos(empresaId: string) {
  const supabase = await createClient();

  const [empleados, proyectos, facturas, clientes, productos] = await Promise.all([
    supabase.from("empleados").select("*").eq("empresa_id", empresaId),
    supabase.from("proyectos").select("*").eq("empresa_id", empresaId),
    supabase.from("facturas").select("*").eq("empresa_id", empresaId),
    supabase.from("clientes").select("*").eq("empresa_id", empresaId),
    supabase.from("productos").select("*").eq("empresa_id", empresaId),
  ]);

  const empleadosData = empleados.data || [];
  const proyectosData = proyectos.data || [];
  const facturasData = facturas.data || [];
  const clientesData = clientes.data || [];
  const productosData = productos.data || [];

  const stats: Estadisticas = {
    empleados: empleadosData.length,
    empleadosActivos: empleadosData.filter((e: any) => e.activo).length,
    proyectos: proyectosData.length,
    proyectosActivos: proyectosData.filter((p: any) => p.estado === "activo").length,
    facturas: facturasData.length,
    facturasPendientes: facturasData.filter((f: any) => f.estado === "pendiente" || f.estado === "vencida").length,
    clientes: clientesData.length,
  };

  const facturasPagadas = facturasData.filter((f: any) => f.estado === "pagada");
  const facturasVencidas = facturasData.filter((f: any) => f.estado === "vencida");
  const gananciasTotales = facturasPagadas.reduce((sum: number, f: any) => sum + Number(f.total), 0);
  const perdidasEstimadas = facturasVencidas.reduce((sum: number, f: any) => sum + Number(f.total), 0);

  const productosMasVendidos = productosData
    .sort((a: any, b: any) => b.stock - a.stock)
    .slice(0, 5)
    .map((p: any) => ({
      nombre: p.nombre,
      cantidad: Math.max(0, 50 - p.stock),
      total: Math.max(0, 50 - p.stock) * p.precio_venta,
    }))
    .filter((p: any) => p.cantidad > 0);

  const productosConCambioPrecio = productosData
    .filter((p: any) => p.costo > 0 && p.precio_venta > 0)
    .slice(0, 5)
    .map((p: any) => {
      const margen = ((p.precio_venta - p.costo) / p.costo) * 100;
      return {
        nombre: p.nombre,
        precioAnterior: p.costo,
        precioActual: p.precio_venta,
        variacion: Math.round(margen * 100) / 100,
      };
    });

  const analisis: AnalisisVentas = {
    gananciasTotales,
    perdidasEstimadas,
    productosMasVendidos,
    productosConCambioPrecio,
  };

  return { stats, analisis };
}

export default async function InicioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-8 text-center text-gray-500">No autenticado</div>;
  }

  const { data: perfil } = await supabase
    .from("perfiles_usuario")
    .select("*, empresas(nombre, codigo_unico)")
    .eq("user_id", user.id)
    .eq("activo", true)
    .single();

  if (!perfil) {
    return <div className="p-8 text-center text-gray-500">No se encontró perfil de usuario</div>;
  }

  const { stats, analisis } = await obtenerDatos(perfil.empresa_id);

  const cards = [
    {
      label: "Empleados",
      value: stats.empleados,
      sub: `${stats.empleadosActivos} activos`,
      color: "border-l-blue-500",
      bg: "bg-blue-50",
      icon: Users,
      iconBg: "bg-blue-100 text-blue-600",
      href: "/rrhh/empleados",
    },
    {
      label: "Proyectos",
      value: stats.proyectos,
      sub: `${stats.proyectosActivos} activos`,
      color: "border-l-green-500",
      bg: "bg-green-50",
      icon: ClipboardList,
      iconBg: "bg-green-100 text-green-600",
      href: "/tareas/proyectos",
    },
    {
      label: "Facturas",
      value: stats.facturas,
      sub: `${stats.facturasPendientes} pendientes`,
      color: "border-l-purple-500",
      bg: "bg-purple-50",
      icon: Receipt,
      iconBg: "bg-purple-100 text-purple-600",
      href: "/ventas/facturas",
    },
    {
      label: "Clientes",
      value: stats.clientes,
      sub: "registrados",
      color: "border-l-amber-500",
      bg: "bg-amber-50",
      icon: UserCheck,
      iconBg: "bg-amber-100 text-amber-600",
      href: "/ventas/clientes",
    },
  ];

  return (
    <div>
      <PageHeader title="Inicio" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-xl border-l-4 ${card.color} bg-white p-5 shadow-sm transition-shadow hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">{card.sub}</p>
              </div>
              <div className={`rounded-lg ${card.iconBg} p-3`}>
                <card.icon size={24} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <BarChart3 size={20} className="text-blue-600" />
          Análisis de Ventas
        </h3>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Ganancias del Período</p>
                <p className="mt-1 text-2xl font-bold text-green-800">
                  ${analisis.gananciasTotales.toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs text-green-600">Facturas pagadas</p>
              </div>
              <div className="rounded-full bg-green-100 p-3 text-green-600">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Pérdidas Estimadas</p>
                <p className="mt-1 text-2xl font-bold text-red-800">
                  ${analisis.perdidasEstimadas.toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs text-red-600">Facturas vencidas</p>
              </div>
              <div className="rounded-full bg-red-100 p-3 text-red-600">
                <TrendingDown size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Balance Neto</p>
                <p className={`mt-1 text-2xl font-bold ${analisis.gananciasTotales - analisis.perdidasEstimadas >= 0 ? "text-green-700" : "text-red-700"}`}>
                  ${(analisis.gananciasTotales - analisis.perdidasEstimadas).toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs text-blue-600">Ganancias - Pérdidas</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                <DollarSign size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Facturación Promedio</p>
                <p className="mt-1 text-2xl font-bold text-purple-800">
                  ${stats.facturas ? (analisis.gananciasTotales / Math.max(1, stats.facturas)).toFixed(2) : "0.00"}
                </p>
                <p className="mt-0.5 text-xs text-purple-600">Por factura emitida</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3 text-purple-600">
                <Receipt size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h4 className="mb-3 text-sm font-semibold text-gray-700">Top Productos Vendidos</h4>
            {analisis.productosMasVendidos.length === 0 ? (
              <p className="text-sm text-gray-400">Sin datos de ventas</p>
            ) : (
              <div className="space-y-3">
                {analisis.productosMasVendidos.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-700">{p.nombre}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">{p.cantidad} uds</span>
                      <span className="ml-2 text-xs text-gray-400">${p.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h4 className="mb-3 text-sm font-semibold text-gray-700">Productos con Variación de Precio</h4>
            {analisis.productosConCambioPrecio.length === 0 ? (
              <p className="text-sm text-gray-400">Sin datos de variación</p>
            ) : (
              <div className="space-y-3">
                {analisis.productosConCambioPrecio.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{p.nombre}</p>
                      <p className="text-xs text-gray-400">
                        Costo: ${p.precioAnterior.toFixed(2)} &rarr; Venta: ${p.precioActual.toFixed(2)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.variacion > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {p.variacion > 0 ? "+" : ""}{p.variacion}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Accesos Rápidos</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/rrhh/empleados"
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Nuevo Empleado</p>
              <p className="text-xs text-gray-500">Agregar persona al equipo</p>
            </div>
          </Link>

          <Link
            href="/tareas/proyectos"
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-green-300 hover:shadow-md"
          >
            <div className="rounded-lg bg-green-100 p-2.5 text-green-600">
              <ClipboardList size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Nuevo Proyecto</p>
              <p className="text-xs text-gray-500">Crear proyecto y tareas</p>
            </div>
          </Link>

          <Link
            href="/ventas/facturas"
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-purple-300 hover:shadow-md"
          >
            <div className="rounded-lg bg-purple-100 p-2.5 text-purple-600">
              <Receipt size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Nueva Factura</p>
              <p className="text-xs text-gray-500">Facturar a un cliente</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
