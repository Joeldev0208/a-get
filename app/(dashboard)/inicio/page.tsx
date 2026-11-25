"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/layout/PageHeader";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import DemoSeedButton from "@/components/demo/DemoSeedButton";
import Loading from "@/components/ui/Loading";
import { supabase } from "@/lib/supabase";
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

async function obtenerDatos(supabaseClient: any, empresaId: string) {
  const [empleados, proyectos, facturas, clientes, productos] = await Promise.all([
    supabaseClient.from("empleados").select("*").eq("empresa_id", empresaId),
    supabaseClient.from("proyectos").select("*").eq("empresa_id", empresaId),
    supabaseClient.from("facturas").select("*").eq("empresa_id", empresaId),
    supabaseClient.from("clientes").select("*").eq("empresa_id", empresaId),
    supabaseClient.from("productos").select("*").eq("empresa_id", empresaId),
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

export default function InicioPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Estadisticas | null>(null);
  const [analisis, setAnalisis] = useState<AnalisisVentas | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError(new Error(t("inicio.notAuthenticated")));
          setLoading(false);
          return;
        }

        const { data: perfil } = await supabase
          .from("perfiles_usuario")
          .select("*, empresas(nombre, codigo_unico)")
          .eq("user_id", user.id)
          .eq("activo", true)
          .single();

        if (!perfil) {
          if (mounted) setError(new Error(t("inicio.noProfile")));
          setLoading(false);
          return;
        }

        if (!mounted) return;

        setEmpresaId(perfil.empresa_id);
        const { stats, analisis } = await obtenerDatos(supabase, perfil.empresa_id);
        if (mounted) {
          setStats(stats);
          setAnalisis(analisis);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(t("common.unexpected")));
          setLoading(false);
        }
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Loading />;
  if (error) return <div className="p-8 text-center text-red-600">{error.message}</div>;
  if (!stats || !analisis || !empresaId) return <div className="p-8 text-center text-gray-500">{t("inicio.noProfile")}</div>;

  const cards = [
    {
      label: t("dashboard.empleados"),
      value: stats.empleados,
      sub: `${stats.empleadosActivos} ${t("common.active")}`,
      color: "border-l-blue-500",
      bg: "bg-blue-50",
      icon: Users,
      iconBg: "bg-blue-100 text-blue-600",
      href: "/rrhh/empleados",
    },
    {
      label: t("dashboard.proyectos"),
      value: stats.proyectos,
      sub: `${stats.proyectosActivos} ${t("common.active")}`,
      color: "border-l-green-500",
      bg: "bg-green-50",
      icon: ClipboardList,
      iconBg: "bg-green-100 text-green-600",
      href: "/tareas/proyectos",
    },
    {
      label: t("dashboard.facturas"),
      value: stats.facturas,
      sub: `${stats.facturasPendientes} ${t("inicio.sub.pending")}`,
      color: "border-l-purple-500",
      bg: "bg-purple-50",
      icon: Receipt,
      iconBg: "bg-purple-100 text-purple-600",
      href: "/ventas/facturas",
    },
    {
      label: t("dashboard.clientes"),
      value: stats.clientes,
      sub: t("inicio.sub.registered"),
      color: "border-l-amber-500",
      bg: "bg-amber-50",
      icon: UserCheck,
      iconBg: "bg-amber-100 text-amber-600",
      href: "/ventas/clientes",
    },
  ];

  return (
    <div>
      <PageHeader title={t("dashboard.inicio")} />
      <LanguageSwitcher />

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
          {t("inicio.salesAnalysis")}
        </h3>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">{t("inicio.earningsPeriod")}</p>
                <p className="mt-1 text-2xl font-bold text-green-800">
                  ${analisis.gananciasTotales.toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs text-green-600">{t("inicio.invoicesPaid")}</p>
              </div>
              <div className="rounded-full bg-green-100 p-3 text-green-600">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">{t("inicio.estimatedLosses")}</p>
                <p className="mt-1 text-2xl font-bold text-red-800">
                  ${analisis.perdidasEstimadas.toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs text-red-600">{t("inicio.invoicesOverdue")}</p>
              </div>
              <div className="rounded-full bg-red-100 p-3 text-red-600">
                <TrendingDown size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">{t("inicio.netBalance")}</p>
                <p className={`mt-1 text-2xl font-bold ${analisis.gananciasTotales - analisis.perdidasEstimadas >= 0 ? "text-green-700" : "text-red-700"}`}>
                  ${(analisis.gananciasTotales - analisis.perdidasEstimadas).toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs text-blue-600">{t("inicio.netBalanceSub")}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                <DollarSign size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">{t("inicio.avgInvoice")}</p>
                <p className="mt-1 text-2xl font-bold text-purple-800">
                  ${stats.facturas ? (analisis.gananciasTotales / Math.max(1, stats.facturas)).toFixed(2) : "0.00"}
                </p>
                <p className="mt-0.5 text-xs text-purple-600">{t("inicio.avgInvoiceSub")}</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3 text-purple-600">
                <Receipt size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h4 className="mb-3 text-sm font-semibold text-gray-700">{t("inicio.topProducts")}</h4>
            {analisis.productosMasVendidos.length === 0 ? (
              <p className="text-sm text-gray-400">{t("inicio.noSalesData")}</p>
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
                      <span className="text-sm font-semibold text-gray-900">{p.cantidad} {t("inicio.units")}</span>
                      <span className="ml-2 text-xs text-gray-400">${p.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h4 className="mb-3 text-sm font-semibold text-gray-700">{t("inicio.priceVariation")}</h4>
            {analisis.productosConCambioPrecio.length === 0 ? (
              <p className="text-sm text-gray-400">{t("inicio.noVariationData")}</p>
            ) : (
              <div className="space-y-3">
                {analisis.productosConCambioPrecio.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{p.nombre}</p>
                      <p className="text-xs text-gray-400">
                        {t("inicio.cost")}: ${p.precioAnterior.toFixed(2)} &rarr; {t("inicio.sale")}: ${p.precioActual.toFixed(2)}
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
        <h3 className="mb-4 text-lg font-semibold text-gray-800">{t("inicio.quickAccess")}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/rrhh/empleados"
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{t("inicio.newEmployee")}</p>
              <p className="text-xs text-gray-500">{t("inicio.newEmployeeSub")}</p>
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
              <p className="text-sm font-semibold text-gray-900">{t("inicio.newProject")}</p>
              <p className="text-xs text-gray-500">{t("inicio.newProjectSub")}</p>
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
              <p className="text-sm font-semibold text-gray-900">{t("inicio.newInvoice")}</p>
              <p className="text-xs text-gray-500">{t("inicio.newInvoiceSub")}</p>
            </div>
          </Link>
        </div>
      </div>
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">{t("inicio.demoData")}</h3>
        <p className="mb-4 text-sm text-gray-600">{t("inicio.demoDataSub")}</p>
        <DemoSeedButton empresaId={empresaId} />
      </div>
    </div>
  );
}
