"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import styles from "@/components/layout/layout.module.css";
import { buscarPerfilActual } from "@/lib/services/empresa";
import Loading from "@/components/ui/Loading";

const pageTitleKeys: Record<string, string> = {
  "/inicio": "dashboard.inicio",
  // RR.HH.
  "/rrhh/empleados": "dashboard.empleados",
  "/rrhh/departamentos": "dashboard.departamentos",
  "/rrhh/asistencia": "dashboard.asistencia",
  // Inventario
  "/inventario/productos": "dashboard.productos",
  "/inventario/csv": "dashboard.csv",
  // Ventas
  "/ventas/pos": "dashboard.pos",
  "/ventas/clientes": "dashboard.clientes",
  "/ventas/facturas": "dashboard.facturas",
  "/ventas/pagos": "dashboard.pagos",
  // Tareas
  "/tareas/proyectos": "dashboard.proyectos",
  "/tareas/tablero": "dashboard.kanban",
  // Configuración
  "/configuracion/empresa": "dashboard.miEmpresa",
  "/configuracion/usuarios": "dashboard.usuarios",
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const title = t(pageTitleKeys[pathname] || "dashboard.ag");

  useEffect(() => {
    const verificarPerfil = async () => {
      try {
        const perfil = await buscarPerfilActual();
        if (!perfil) {
          router.replace("/login");
          return;
        }
      } catch (err) {
        console.error("[Dashboard] Error verificando perfil:", err);
        router.replace("/login");
        return;
      } finally {
        setChecking(false);
      }
    };

    verificarPerfil();
  }, [router]);

  if (checking) return <Loading />;

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />
      <div className={styles.mainArea}>
        <Navbar title={title} />
        <main className={styles.pageContent}>{children}</main>
      </div>
    </div>
  );
}