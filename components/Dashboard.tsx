"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import styles from "@/components/layout/layout.module.css";
import { buscarPerfilActual } from "@/lib/services/empresa";
import Loading from "@/components/ui/Loading";

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
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const title = pageTitles[pathname] || "AGET";

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