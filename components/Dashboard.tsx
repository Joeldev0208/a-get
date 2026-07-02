"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import styles from "@/components/layout/layout.module.css";

const pageTitles: Record<string, string> = {
  "/inicio": "Inicio",
  // RR.HH.
  "/rrhh/empleados": "Empleados",
  "/rrhh/departamentos": "Departamentos",
  "/rrhh/asistencia": "Asistencia",
  // Inventario
  "/inventario/productos": "Productos",
  "/inventario/csv": "Importar / Exportar CSV",
  // Ventas
  "/ventas/pos": "Punto de Venta",
  "/ventas/clientes": "Clientes",
  "/ventas/facturas": "Facturas",
  "/ventas/pagos": "Pagos",
  // Tareas
  "/tareas/proyectos": "Proyectos",
  "/tareas/tablero": "Tablero Kanban",
  // Configuración
  "/configuracion/empresa": "Mi Empresa",
  "/configuracion/usuarios": "Usuarios y Roles",
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