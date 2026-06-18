"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import styles from "@/components/layout/layout.module.css";

const pageTitles: Record<string, string> = {
  "/inicio": "Inicio",
  "/rrhh/empleados": "Empleados",
  "/rrhh/departamentos": "Departamentos",
  "/rrhh/asistencia": "Asistencia",
  "/tareas/proyectos": "Proyectos",
  "/tareas/tablero": "Tablero Kanban",
  "/facturacion/clientes": "Clientes",
  "/facturacion/facturas": "Facturas",
  "/facturacion/pagos": "Pagos",
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "AGET";

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