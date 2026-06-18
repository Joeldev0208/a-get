"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import styles from "./layout.module.css";
import { LayoutDashboard, Users, ClipboardList, Receipt } from "lucide-react";

const navItems = [
  { href: "/inicio", label: "Inicio", icon: LayoutDashboard },
  { href: "/rrhh/empleados", label: "RR.HH.", icon: Users },
  { href: "/tareas/proyectos", label: "Tareas", icon: ClipboardList },
  { href: "/facturacion", label: "Facturación", icon: Receipt },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/inicio") {
      return pathname === "/inicio" || pathname === "/";
    }
    return pathname.startsWith(href.split("/").slice(0, 2).join("/"));
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarLogo}>
        <ClipboardList size={24} />
        <span>AGET</span>
      </div>
      <nav className={styles.sidebarNav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              styles.navItem,
              isActive(item.href) && styles.navItemActive
            )}
          >
            <span className={styles.navIcon}>
              <item.icon size={18} />
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}