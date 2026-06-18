"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import ErrorBox from "@/components/ui/ErrorBox";
import { ServiceError } from "@/lib/services/supabase-service";
import { listarEmpleados } from "@/lib/services/rrhh.service";
import { listarProyectos } from "@/lib/services/tareas.service";
import { listarFacturas, listarClientes } from "@/lib/services/facturacion.service";
import { Users, ClipboardList, Receipt, UserCheck } from "lucide-react";
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

export default function InicioPage() {
  const [stats, setStats] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const [empleados, proyectos, facturas, clientes] = await Promise.all([
        listarEmpleados(),
        listarProyectos(),
        listarFacturas(),
        listarClientes(),
      ]);

      setStats({
        empleados: empleados.length,
        empleadosActivos: empleados.filter((e) => e.activo).length,
        proyectos: proyectos.length,
        proyectosActivos: proyectos.filter((p) => p.estado === "activo").length,
        facturas: facturas.length,
        facturasPendientes: facturas.filter((f) => f.estado === "pendiente" || f.estado === "vencida").length,
        clientes: clientes.length,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err : new ServiceError("UNKNOWN", "Error al cargar el dashboard")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  const cards = [
    {
      label: "Empleados",
      value: stats?.empleados ?? 0,
      sub: `${stats?.empleadosActivos ?? 0} activos`,
      color: "border-l-blue-500 bg-blue-50",
      icon: Users,
      iconBg: "bg-blue-100 text-blue-600",
      href: "/rrhh/empleados",
    },
    {
      label: "Proyectos",
      value: stats?.proyectos ?? 0,
      sub: `${stats?.proyectosActivos ?? 0} activos`,
      color: "border-l-green-500 bg-green-50",
      icon: ClipboardList,
      iconBg: "bg-green-100 text-green-600",
      href: "/tareas/proyectos",
    },
    {
      label: "Facturas",
      value: stats?.facturas ?? 0,
      sub: `${stats?.facturasPendientes ?? 0} pendientes`,
      color: "border-l-purple-500 bg-purple-50",
      icon: Receipt,
      iconBg: "bg-purple-100 text-purple-600",
      href: "/facturacion/facturas",
    },
    {
      label: "Clientes",
      value: stats?.clientes ?? 0,
      sub: "registrados",
      color: "border-l-amber-500 bg-amber-50",
      icon: UserCheck,
      iconBg: "bg-amber-100 text-amber-600",
      href: "/facturacion/clientes",
    },
  ];

  return (
    <div>
      <PageHeader title="Inicio" />

      {/* Tarjetas de estadísticas */}
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

      {/* Accesos rápidos */}
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
            href="/facturacion/facturas"
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