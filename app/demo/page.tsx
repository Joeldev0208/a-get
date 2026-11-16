"use client";

import { useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ShoppingCart,
  Package,
  Settings,
  ChevronDown,
  ChevronRight,



  Search,
} from "lucide-react";

/* =========================
   DATOS ESTÁTICOS DEMO
   ========================= */

const EMPRESA_DEMO = {
  nombre: "Distribuidora Demo S.A.",
  ruc: "1234567890001",
  direccion: "Av. Principal 123, Quito",
  telefono: "099 123 456",
  email: "contacto@demo.com",
};

const USUARIO_DEMO = {
  nombre: "Bob Demo",
  email: "Bob@demo.com",
  rol: "gerente",
};

const CATEGORIAS = [
  { id: "cat1", nombre: "Computación" },
  { id: "cat2", nombre: "Oficina" },
  { id: "cat3", nombre: "Muebles" },
  { id: "cat4", nombre: "Accesorios" },
  { id: "cat5", nombre: "Papelería" },
];

const PRODUCTOS = [
  {
    id: "p1",
    codigo: "PROD-001",
    nombre: "Laptop Dell Latitude 5420",
    descripcion: "Laptop corporativa i5 16GB RAM 512GB SSD",
    categoria_id: "cat1",
    precio_venta: 850,
    costo: 700,
    stock: 12,
    estado: "Activo",
  },
  {
    id: "p2",
    codigo: "PROD-002",
    nombre: "Impresora HP LaserJet Pro",
    descripcion: "Impresora láser blanco y negro",
    categoria_id: "cat2",
    precio_venta: 320,
    costo: 280,
    stock: 5,
    estado: "Activo",
  },
  {
    id: "p3",
    codigo: "PROD-003",
    nombre: "Silla Ergonómica Oficina",
    descripcion: "Silla de oficina con soporte lumbar",
    categoria_id: "cat3",
    precio_venta: 140,
    costo: 110,
    stock: 20,
    estado: "Activo",
  },
  {
    id: "p4",
    codigo: "PROD-004",
    nombre: "Monitor 24 pulgadas LED",
    descripcion: "Monitor Full HD 24 pulgadas",
    categoria_id: "cat1",
    precio_venta: 180,
    costo: 150,
    stock: 8,
    estado: "Activo",
  },
  {
    id: "p5",
    codigo: "PROD-005",
    nombre: "Teclado Inalámbrico",
    descripcion: "Teclado Bluetooth compacto",
    categoria_id: "cat4",
    precio_venta: 25,
    costo: 15,
    stock: 0,
    estado: "Agotado",
  },
  {
    id: "p6",
    codigo: "PROD-006",
    nombre: "Mouse Optical USB",
    descripcion: "Mouse con cable USB",
    categoria_id: "cat4",
    precio_venta: 12,
    costo: 8,
    stock: 35,
    estado: "Activo",
  },
  {
    id: "p7",
    codigo: "PROD-007",
    nombre: "Resma Papel A4",
    descripcion: "Resma de papel blanco A4 75g",
    categoria_id: "cat5",
    precio_venta: 5,
    costo: 3.5,
    stock: 50,
    estado: "Activo",
  },
  {
    id: "p8",
    codigo: "PROD-008",
    nombre: "Archivador Metálico",
    descripcion: "Archivador de metales para documentos",
    categoria_id: "cat3",
    precio_venta: 45,
    costo: 35,
    stock: 6,
    estado: "Activo",
  },
];

const CLIENTES = [
  { id: "c1", nombre: "Ferretería Central", ruc: "1001", telefono: "098 111 222", ciudad: "Quito" },
  { id: "c2", nombre: "Oficinas Norte S.R.L.", ruc: "1002", telefono: "098 333 444", ciudad: "Guayaquil" },
  { id: "c3", nombre: "Librería del Este", ruc: "1003", telefono: "098 555 666", ciudad: "Cuenca" },
  { id: "c4", nombre: "Constructora Paz", ruc: "1004", telefono: "098 777 888", ciudad: "Ambato" },
  { id: "c5", nombre: "Café del Centro", ruc: "1005", telefono: "098 999 000", ciudad: "Loja" },
];

const VENTAS = [
  { id: "v101", fecha: "2026-11-10", cliente_id: "c1", total: 1700, estado: "Pagada", metodo: "Efectivo" },
  { id: "v102", fecha: "2026-11-09", cliente_id: "c2", total: 960, estado: "Pendiente", metodo: "Transferencia" },
  { id: "v103", fecha: "2026-11-08", cliente_id: "c3", total: 210, estado: "Pagada", metodo: "Tarjeta" },
  { id: "v104", fecha: "2026-11-07", cliente_id: "c4", total: 2800, estado: "Pendiente", metodo: "Transferencia" },
  { id: "v105", fecha: "2026-11-06", cliente_id: "c5", total: 140, estado: "Pagada", metodo: "Efectivo" },
];

const EMPLEADOS = [
  { id: "e1", nombre: "Carlos Mendoza", cargo: "Gerente", departamento: "Dirección", email: "carlos@demo.com", estado: "Activo" },
  { id: "e2", nombre: "Ana García", cargo: "Contador", departamento: "Finanzas", email: "ana@demo.com", estado: "Activo" },
  { id: "e3", nombre: "Luis Rodríguez", cargo: "Vendedor", departamento: "Ventas", email: "luis@demo.com", estado: "Activo" },
  { id: "e4", nombre: "María López", cargo: "Inventario", departamento: "Almacén", email: "maria@demo.com", estado: "Activo" },
];

const TAREAS = [
  { id: "t1", titulo: "Revisar stock de computación", estado: "Pendiente", asignado: "María López", prioridad: "Alta", fecha: "2026-11-16" },
  { id: "t2", titulo: "Emisión de factura noviembre", estado: "En curso", asignado: "Ana García", prioridad: "Media", fecha: "2026-11-15" },
  { id: "t3", titulo: "Capacitación nuevo POS", estado: "Completada", asignado: "Luis Rodríguez", prioridad: "Baja", fecha: "2026-11-10" },
  { id: "t4", titulo: "Auditoría de almacén", estado: "Pendiente", asignado: "Carlos Mendoza", prioridad: "Alta", fecha: "2026-11-18" },
];

const NAV_SECTIONS = [
  { label: "Inicio", href: "/demo/inicio", icon: LayoutDashboard, children: [] },
  {
    label: "RR.HH.",
    icon: Users,
    children: [
      { href: "/demo/rrhh/empleados", label: "Empleados" },
    ],
  },
  {
    label: "Inventario",
    icon: Package,
    children: [
      { href: "/demo/inventario/productos", label: "Productos" },
    ],
  },
  {
    label: "Ventas",
    icon: ShoppingCart,
    children: [
      { href: "/demo/ventas/pos", label: "Punto de Venta" },
      { href: "/demo/ventas/clientes", label: "Clientes" },
      { href: "/demo/ventas/facturas", label: "Facturas" },
    ],
  },
  {
    label: "Tareas",
    icon: ClipboardList,
    children: [
      { href: "/demo/tareas/tablero", label: "Tablero Kanban" },
    ],
  },
  {
    label: "Configuración",
    icon: Settings,
    children: [
      { href: "/demo/configuracion/empresa", label: "Mi Empresa" },
    ],
  },
];

/* =========================
   COMPONENTES BASE DE UI
   ========================= */

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function PageHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">AGET - Modo Demostración</p>
      </div>
    </div>
  );
}

/* =========================
   SIDEBAR (replica del original)
   ========================= */

function DemoSidebar({ pathname, onNavigate }: { pathname: string; onNavigate: (href: string) => void }) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => {
    if (href === "/demo/inicio") {
      return pathname === "/demo/inicio" || pathname === "/demo";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-slate-300 flex flex-col shadow-lg z-20">
      <div className="flex items-center gap-3 p-5 border-b border-slate-800">
        <ClipboardList size={24} className="text-blue-400" />
        <span className="font-bold text-xl text-white tracking-tight">AGET</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {NAV_SECTIONS.map((section) => {
          const hasChildren = section.children.length > 0;
          const isExpanded = expandedSections[section.label] ?? hasChildren;

          if (!hasChildren && section.href) {
            const active = isActive(section.href);
            return (
              <button
                key={section.label}
                onClick={() => onNavigate(section.href)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <section.icon size={18} />
                <span>{section.label}</span>
              </button>
            );
          }

          return (
            <div key={section.label}>
              <button
                onClick={() => toggleSection(section.label)}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
              >
                <section.icon size={18} />
                <span>{section.label}</span>
                <span className="ml-auto text-slate-500">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              </button>
              {isExpanded && (
                <div className="ml-8 space-y-0.5 border-l border-slate-800 pl-2 py-1">
                  {section.children.map((child) => {
                    const active = isActive(child.href);
                    return (
                      <button
                        key={child.href}
                        onClick={() => onNavigate(child.href)}
                        className={`flex items-center px-2 py-2 text-xs rounded-lg transition-colors ${
                          active
                            ? "bg-blue-600/30 text-blue-300"
                            : "text-slate-500 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <span>{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        <div className="mt-6 px-3 py-2 border-t border-slate-800">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Usuario demo</p>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
              C
            </div>
            <div>
              <div className="text-xs font-medium text-white">{USUARIO_DEMO.nombre}</div>
              <div className="text-[10px] text-slate-400">{USUARIO_DEMO.rol}</div>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}

/* =========================
   NAVBAR (replica del original)
   ========================= */

function DemoNavbar({ title }: { title: string }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-slate-600 hover:text-slate-900">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-sm text-slate-600">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Modo demostración
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {USUARIO_DEMO.nombre.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-700">{USUARIO_DEMO.nombre}</span>
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50">
              <button
                onClick={() => router.push("/")}
                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                Cerrar sesión demo
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* =========================
   ESTADÍSTICAS
   ========================= */

function StatCard({ title, value, subtitle, color }: { title: string; value: string | number; subtitle: string; color: "blue" | "green" | "orange" | "purple" | "red" }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[color]}`}>
      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-80">{subtitle}</p>
    </div>
  );
}

/* =========================
   MÓDULOS (UI idéntica al original, datos estáticos, solo lectura)
   ========================= */

// ---- Inicio ----
function ModuloInicio() {
  const totalVentas = VENTAS.reduce((a, b) => a + b.total, 0);
  const ventasPendientes = VENTAS.filter((v) => v.estado === "Pendiente").length;
  const stockBajo = PRODUCTOS.filter((p) => p.stock <= 5 && p.stock > 0).length;
  const agotados = PRODUCTOS.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Inicio" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Ventas" value={`${totalVentas}`} subtitle="USD" color="blue" />
        <StatCard title="Ventas Pendientes" value={ventasPendientes} subtitle="facturas" color="orange" />
        <StatCard title="Stock Bajo" value={stockBajo} subtitle="productos" color="red" />
        <StatCard title="Productos Agotados" value={agotados} subtitle="items" color="red" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Ventas recientes</h3>
          <div className="space-y-3">
            {VENTAS.slice(0, 4).map((v) => {
              const cliente = CLIENTES.find((c) => c.id === v.cliente_id);
              return (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div>
                    <div className="text-sm font-medium text-slate-900">#{v.id}</div>
                    <div className="text-xs text-slate-500">{cliente?.nombre}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">${v.total}</div>
                    <Badge className={v.estado === "Pagada" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                      {v.estado}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Productos con stock bajo</h3>
          <div className="space-y-3">
            {PRODUCTOS.filter((p) => p.stock <= 5 && p.stock > 0).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-orange-50">
                <div>
                  <div className="text-sm font-medium text-slate-900">{p.nombre}</div>
                  <div className="text-xs text-slate-500">{p.codigo}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-orange-700">{p.stock}</div>
                </div>
              </div>
            ))}
            {PRODUCTOS.filter((p) => p.stock <= 5 && p.stock > 0).length === 0 && (
              <div className="text-center py-4 text-xs text-slate-400">Sin productos con stock bajo</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Inventario / Productos (replica exacta de la original, solo lectura) ----
function ModuloProductos() {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = PRODUCTOS.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoriaNombre = (id: string) => CATEGORIAS.find((c) => c.id === id)?.nombre || "—";

  return (
    <div className="space-y-6">
      <PageHeader title="Productos" />

      {/* Buscador (replica de la original) */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nombre o código del producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {searchTerm && filtered.length > 0 && (
          <p className="mt-1 text-xs text-slate-400">
            {filtered.length} resultado(s)
          </p>
        )}
      </div>

      {PRODUCTOS.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
          No hay productos registrados
        </div>
      ) : (
        <>
          {/* Vista Desktop: Tabla (replica exacta de la original) */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Categoría</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Precio Venta</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Costo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      No se encontraron productos con {searchTerm}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{p.codigo}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">{p.nombre}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{categoriaNombre(p.categoria_id)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-900">${p.precio_venta}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-500">${p.costo}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <span className={p.stock <= 5 ? "font-medium text-red-600" : "text-slate-900"}>
                          {p.stock}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Vista Mobile: Cards */}
          <div className="sm:hidden space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
                No se encontraron productos con {searchTerm}
              </div>
            ) : (
              filtered.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{p.nombre}</p>
                      <p className="text-xs text-slate-400">{p.codigo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">${p.precio_venta}</p>
                      <p className={`text-xs ${p.stock <= 5 ? "text-red-500 font-medium" : "text-slate-400"}`}>
                        Stock: {p.stock}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-xs text-slate-500">{categoriaNombre(p.categoria_id)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---- Ventas / POS ----
function ModuloVentas() {
  const total = VENTAS.reduce((a, b) => a + b.total, 0);
  const pagadas = VENTAS.filter((v) => v.estado === "Pagada").length;
  const pendientes = VENTAS.filter((v) => v.estado === "Pendiente").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Ventas / POS" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Ventas" value={VENTAS.length} subtitle="transacciones" color="blue" />
        <StatCard title="Ingresos" value={`${total}`} subtitle="USD" color="green" />
        <StatCard title="Pagadas" value={pagadas} subtitle="facturas" color="green" />
        <StatCard title="Pendientes" value={pendientes} subtitle="facturas" color="orange" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Historial de ventas</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"># Venta</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Fecha</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Método</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {VENTAS.map((v) => {
                const cliente = CLIENTES.find((c) => c.id === v.cliente_id);
                return (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 font-mono">#{v.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{cliente?.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{v.fecha}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">${v.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge className={v.estado === "Pagada" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                        {v.estado}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">{v.metodo}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- Ventas / Clientes ----
function ModuloClientes() {
  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Directorio de clientes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">RUC</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Ciudad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {CLIENTES.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{c.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">{c.ruc}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{c.telefono}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{c.ciudad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- RR.HH. / Empleados ----
function ModuloEmpleados() {
  const activos = EMPLEADOS.filter((e) => e.estado === "Activo").length;
  const departamentos = new Set(EMPLEADOS.map((e) => e.departamento)).size;

  return (
    <div className="space-y-6">
      <PageHeader title="RR.HH. - Empleados" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Empleados" value={EMPLEADOS.length} subtitle="registrados" color="blue" />
        <StatCard title="Activos" value={activos} subtitle="empleados" color="green" />
        <StatCard title="Departamentos" value={departamentos} subtitle="áreas" color="purple" />
        <StatCard title="Vendedores" value={EMPLEADOS.filter((e) => e.cargo === "Vendedor").length} subtitle="personal" color="orange" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Plantilla de empleados</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Cargo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Departamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Email</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {EMPLEADOS.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{e.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{e.cargo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{e.departamento}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">{e.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge className="bg-green-100 text-green-700">{e.estado}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- Tareas / Kanban ----
function ModuloTareas() {
  const estadoColor: Record<string, string> = {
    Pendiente: "text-red-500",
    "En curso": "text-yellow-600",
    Completada: "text-green-600",
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Tareas / Kanban" />
      <div className="flex gap-4">
        {["Pendiente", "En curso", "Completada"].map((estado) => (
          <div
            key={estado}
            className="flex-1 min-w-[240px] bg-slate-100 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase">{estado}</h3>
              <span className={`text-xs font-medium ${estadoColor[estado]}`}>
                {TAREAS.filter((t) => t.estado === estado).length}
              </span>
            </div>
            <div className="space-y-3">
              {TAREAS.filter((t) => t.estado === estado).map((t) => (
                <div key={t.id} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-medium text-slate-900">{t.titulo}</h4>
                    <Badge className="bg-slate-200 text-slate-700">{t.prioridad}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Asignado a: {t.asignado}</p>
                  <span className="text-xs text-slate-400">{t.fecha}</span>
                </div>
              ))}
              {TAREAS.filter((t) => t.estado === estado).length === 0 && (
                <div className="text-center py-4 text-xs text-slate-400">Sin tareas</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Ventas / Facturas ----
function ModuloFacturas() {
  return (
    <div className="space-y-6">
      <PageHeader title="Facturación" />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Facturas emitidas</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Factura</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Fecha</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Monto</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {VENTAS.map((v) => {
                const cliente = CLIENTES.find((c) => c.id === v.cliente_id);
                return (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 font-mono">F-{v.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{cliente?.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{v.fecha}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">${v.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge className={v.estado === "Pagada" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                        {v.estado}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- Configuración / Empresa ----
function ModuloConfiguracion() {
  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Empresa</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Nombre</span>
              <span className="text-sm font-medium text-slate-900">{EMPRESA_DEMO.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">RUC</span>
              <span className="text-sm font-medium text-slate-900 font-mono">{EMPRESA_DEMO.ruc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Dirección</span>
              <span className="text-sm text-slate-600">{EMPRESA_DEMO.direccion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Teléfono</span>
              <span className="text-sm text-slate-600 font-mono">{EMPRESA_DEMO.telefono}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Email</span>
              <span className="text-sm text-slate-600 font-mono">{EMPRESA_DEMO.email}</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Usuario actual (demo)</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Nombre</span>
              <span className="text-sm font-medium text-slate-900">{USUARIO_DEMO.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Email</span>
              <span className="text-sm font-medium text-slate-900 font-mono">{USUARIO_DEMO.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Rol</span>
              <span className="text-sm font-medium text-slate-900 capitalize">{USUARIO_DEMO.rol}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <p className="text-sm text-blue-800">
          Esta es una <strong>demostración con datos estáticos</strong>. Todos los datos se muestran
          directamente en la página y no se guardan en una base de datos. Para usar el sistema con datos
          reales, regístrese desde el inicio.
        </p>
      </div>
    </div>
  );
}

/* =========================
   PÁGINA PRINCIPAL DEMO
   ========================= */

const MODULE_ROUTES: Record<string, ReactElement> = {
  "/demo/inicio": <ModuloInicio />,
  "/demo/rrhh/empleados": <ModuloEmpleados />,
  "/demo/inventario/productos": <ModuloProductos />,
  "/demo/ventas/pos": <ModuloVentas />,
  "/demo/ventas/clientes": <ModuloClientes />,
  "/demo/ventas/facturas": <ModuloFacturas />,
  "/demo/tareas/tablero": <ModuloTareas />,
  "/demo/configuracion/empresa": <ModuloConfiguracion />,
};

export default function DemoPage() {
  const [pathname, setPathname] = useState("/demo/inicio");

  const onNavigate = (href: string) => {
    setPathname(href);
    window.scrollTo(0, 0);
  };

  const ModuleContent = MODULE_ROUTES[pathname] || <ModuloInicio />;

  return (
    <div className="min-h-screen bg-slate-50">
      <DemoSidebar pathname={pathname} onNavigate={onNavigate} />
      <div className="ml-64">
        <DemoNavbar title="AGET Demo" />
        <main className="max-w-7xl mx-auto py-8 px-6">
          {ModuleContent}
        </main>
      </div>
    </div>
  );
}
