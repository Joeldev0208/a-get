"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
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
  Clock,
} from "lucide-react";
import { useState } from "react";

interface NavChild {
  href: string;
  labelKey: string;
}

interface NavSection {
  labelKey: string;
  href?: string;
  icon: any;
  children: NavChild[];
}

const navSections: NavSection[] = [
  {
    labelKey: "nav.inicio",
    href: "/inicio",
    icon: LayoutDashboard,
    children: [],
  },
  {
    labelKey: "nav.rrhh",
    icon: Users,
    children: [
      { href: "/rrhh/empleados", labelKey: "nav.empleados" },
    ],
  },
  {
    labelKey: "nav.inventario",
    icon: Package,
    children: [
      { href: "/inventario/productos", labelKey: "nav.productos" },
      { href: "/inventario/csv", labelKey: "nav.csv" },
    ],
  },
  {
    labelKey: "nav.ventas",
    icon: ShoppingCart,
    children: [
      { href: "/ventas/pos", labelKey: "nav.pos" },
      { href: "/ventas/clientes", labelKey: "nav.clientes" },
      { href: "/ventas/facturas", labelKey: "nav.facturas" },
      { href: "/ventas/pagos", labelKey: "nav.pagos" },
    ],
  },
  {
    labelKey: "nav.sesiones",
    icon: Clock,
    children: [
      { href: "/sesiones", labelKey: "nav.gestionSesiones" },
    ],
  },
  {
    labelKey: "nav.tareas",
    icon: ClipboardList,
    children: [
      { href: "/tareas/proyectos", labelKey: "nav.proyectos" },
    ],
  },
  {
    labelKey: "nav.configuracion",
    icon: Settings,
    children: [
      { href: "/configuracion/empresa", labelKey: "nav.miEmpresa" },
    ],
  },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const expanded: Record<string, boolean> = {};
    navSections.forEach((section) => {
      const hasActiveChild = section.children.some((child) => pathname.startsWith(child.href));
      if (hasActiveChild) expanded[section.labelKey] = true;
    });
    return expanded;
  });

  const toggleSection = (labelKey: string) => {
    setExpandedSections((prev) => ({ ...prev, [labelKey]: !prev[labelKey] }));
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
          const isExpanded = expandedSections[section.labelKey] ?? hasChildren;

          if (!hasChildren && section.href) {
            return (
              <Link
                key={section.labelKey}
                href={section.href}
                className={cn(
                  styles.navItem,
                  isActive(section.href) && styles.navItemActive
                )}
              >
                <span className={styles.navIcon}>
                  <section.icon size={18} />
                </span>
                <span>{t(section.labelKey)}</span>
              </Link>
            );
          }

          return (
            <div key={section.labelKey} className={styles.navSection}>
              <button
                onClick={() => toggleSection(section.labelKey)}
                className={cn(styles.navItem, styles.navSectionToggle)}
              >
                <span className={styles.navIcon}>
                  <section.icon size={18} />
                </span>
                <span>{t(section.labelKey)}</span>
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
                      {t(child.labelKey)}
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
