"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import styles from "./layout.module.css";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ShoppingCart,
  Package,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface NavChild {
  href: string;
  label: string;
}

interface NavSection {
  label: string;
  href?: string;
  icon: any;
  children: NavChild[];
}

const navSections: NavSection[] = [
  {
    label: "Inicio",
    href: "/inicio",
    icon: LayoutDashboard,
    children: [],
  },
  {
    label: "RR.HH.",
    icon: Users,
    children: [
      { href: "/rrhh/empleados", label: "Empleados" },
      { href: "/rrhh/departamentos", label: "Departamentos" },
      { href: "/rrhh/asistencia", label: "Asistencia" },
    ],
  },
  {
    label: "Inventario",
    icon: Package,
    children: [
      { href: "/inventario/productos", label: "Productos" },
      { href: "/inventario/csv", label: "Importar / Exportar CSV" },
    ],
  },
  {
    label: "Ventas",
    icon: ShoppingCart,
    children: [
      { href: "/ventas/pos", label: "Punto de Venta" },
      { href: "/ventas/clientes", label: "Clientes" },
      { href: "/ventas/facturas", label: "Facturas" },
      { href: "/ventas/pagos", label: "Pagos" },
    ],
  },
  {
    label: "Tareas",
    icon: ClipboardList,
    children: [
      { href: "/tareas/proyectos", label: "Proyectos" },
      { href: "/tareas/tablero", label: "Tablero Kanban" },
    ],
  },
  {
    label: "Configuración",
    icon: Settings,
    children: [
      { href: "/configuracion/empresa", label: "Mi Empresa" },
      { href: "/configuracion/usuarios", label: "Usuarios y Roles" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const expanded: Record<string, boolean> = {};
    navSections.forEach((section) => {
      const hasActiveChild = section.children.some((child) => pathname.startsWith(child.href));
      if (hasActiveChild) expanded[section.label] = true;
    });
    return expanded;
  });

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => {
    if (href === "/inicio") {
      return pathname === "/inicio" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarLogo}>
        <ClipboardList size={24} />
        <span>AGET</span>
      </div>
      <nav className={styles.sidebarNav}>
        {navSections.map((section) => {
          const hasChildren = section.children.length > 0;
          const isExpanded = expandedSections[section.label] ?? hasChildren;

          if (!hasChildren && section.href) {
            return (
              <Link
                key={section.label}
                href={section.href}
                className={cn(
                  styles.navItem,
                  isActive(section.href) && styles.navItemActive
                )}
              >
                <span className={styles.navIcon}>
                  <section.icon size={18} />
                </span>
                <span>{section.label}</span>
              </Link>
            );
          }

          return (
            <div key={section.label} className={styles.navSection}>
              <button
                onClick={() => toggleSection(section.label)}
                className={cn(styles.navItem, styles.navSectionToggle)}
              >
                <span className={styles.navIcon}>
                  <section.icon size={18} />
                </span>
                <span>{section.label}</span>
                <span className={styles.navChevron}>
                  {isExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </span>
              </button>
              {isExpanded && (
                <div className={styles.navChildren}>
                  {section.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        styles.navChildItem,
                        isActive(child.href) && styles.navChildItemActive
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}