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
   STATIC DEMO DATA
   ========================= */

const EMPRESA_DEMO = {
  nombre: "Demo S.A. Distributor",
  ruc: "1234567890001",
  direccion: "123 Main Ave, Quito",
  telefono: "099 123 456",
  email: "contact@demo.com",
};

const USUARIO_DEMO = {
  nombre: "Bob Demo",
  email: "Bob@demo.com",
  rol: "Manager",
};

const CATEGORIAS = [
  { id: "cat1", nombre: "Computing" },
  { id: "cat2", nombre: "Office" },
  { id: "cat3", nombre: "Furniture" },
  { id: "cat4", nombre: "Accessories" },
  { id: "cat5", nombre: "Stationery" },
];

const PRODUCTOS = [
  {
    id: "p1",
    codigo: "PROD-001",
    nombre: "Laptop Dell Latitude 5420",
    descripcion: "Corporate laptop i5 16GB RAM 512GB SSD",
    categoria_id: "cat1",
    precio_venta: 850,
    costo: 700,
    stock: 12,
    estado: "Active",
  },
  {
    id: "p2",
    codigo: "PROD-002",
    nombre: "Printer HP LaserJet Pro",
    descripcion: "Black and white laser printer",
    categoria_id: "cat2",
    precio_venta: 320,
    costo: 280,
    stock: 5,
    estado: "Active",
  },
  {
    id: "p3",
    codigo: "PROD-003",
    nombre: "Ergonomic Chair",
    descripcion: "Office chair with lumbar support",
    categoria_id: "cat3",
    precio_venta: 140,
    costo: 110,
    stock: 20,
    estado: "Active",
  },
  {
    id: "p4",
    codigo: "PROD-004",
    nombre: "24-inch LED Monitor",
    descripcion: "Full HD 24-inch monitor",
    categoria_id: "cat1",
    precio_venta: 180,
    costo: 150,
    stock: 8,
    estado: "Active",
  },
  {
    id: "p5",
    codigo: "PROD-005",
    nombre: "Wireless Keyboard",
    descripcion: "Compact Bluetooth keyboard",
    categoria_id: "cat4",
    precio_venta: 25,
    costo: 15,
    stock: 0,
    estado: "Out of Stock",
  },
  {
    id: "p6",
    codigo: "PROD-006",
    nombre: "USB Optical Mouse",
    descripcion: "USB wired mouse",
    categoria_id: "cat4",
    precio_venta: 12,
    costo: 8,
    stock: 35,
    estado: "Active",
  },
  {
    id: "p7",
    codigo: "PROD-007",
    nombre: "A4 Paper Ream",
    descripcion: "A4 white paper ream 75g",
    categoria_id: "cat5",
    precio_venta: 5,
    costo: 3.5,
    stock: 50,
    estado: "Active",
  },
  {
    id: "p8",
    codigo: "PROD-008",
    nombre: "Metal Filing Cabinet",
    descripcion: "Metal document filing cabinet",
    categoria_id: "cat3",
    precio_venta: 45,
    costo: 35,
    stock: 6,
    estado: "Active",
  },
];

const CLIENTES = [
  { id: "c1", nombre: "Central Hardware Store", ruc: "1001", telefono: "098 111 222", ciudad: "Quito" },
  { id: "c2", nombre: "North Offices S.R.L.", ruc: "1002", telefono: "098 333 444", ciudad: "Guayaquil" },
  { id: "c3", nombre: "East Bookstore", ruc: "1003", telefono: "098 555 666", ciudad: "Cuenca" },
  { id: "c4", nombre: "Paz Construction", ruc: "1004", telefono: "098 777 888", ciudad: "Ambato" },
  { id: "c5", nombre: "Center Café", ruc: "1005", telefono: "098 999 000", ciudad: "Loja" },
];

const VENTAS = [
  { id: "v101", fecha: "2026-11-10", cliente_id: "c1", total: 1700, estado: "Paid", metodo: "Cash" },
  { id: "v102", fecha: "2026-11-09", cliente_id: "c2", total: 960, estado: "Pending", metodo: "Transfer" },
  { id: "v103", fecha: "2026-11-08", cliente_id: "c3", total: 210, estado: "Paid", metodo: "Card" },
  { id: "v104", fecha: "2026-11-07", cliente_id: "c4", total: 2800, estado: "Pending", metodo: "Transfer" },
  { id: "v105", fecha: "2026-11-06", cliente_id: "c5", total: 140, estado: "Paid", metodo: "Cash" },
];

const EMPLEADOS = [
  { id: "e1", nombre: "Carlos Mendoza", cargo: "Manager", departamento: "Management", email: "carlos@demo.com", estado: "Active" },
  { id: "e2", nombre: "Ana García", cargo: "Accountant", departamento: "Finance", email: "ana@demo.com", estado: "Active" },
  { id: "e3", nombre: "Luis Rodríguez", cargo: "Salesperson", departamento: "Sales", email: "luis@demo.com", estado: "Active" },
  { id: "e4", nombre: "María López", cargo: "Inventory", departamento: "Warehouse", email: "maria@demo.com", estado: "Active" },
];

const TAREAS = [
  { id: "t1", titulo: "Review computing stock", estado: "Pending", asignado: "María López", prioridad: "High", fecha: "2026-11-16" },
  { id: "t2", titulo: "November invoicing", estado: "In Progress", asignado: "Ana García", prioridad: "Medium", fecha: "2026-11-15" },
  { id: "t3", titulo: "New POS training", estado: "Completed", asignado: "Luis Rodríguez", prioridad: "Low", fecha: "2026-11-10" },
  { id: "t4", titulo: "Warehouse audit", estado: "Pending", asignado: "Carlos Mendoza", prioridad: "High", fecha: "2026-11-18" },
];

const NAV_SECTIONS = [
  { label: "Home", href: "/demo/home", icon: LayoutDashboard, children: [] },
  {
    label: "HR",
    icon: Users,
    children: [
      { href: "/demo/hr/employees", label: "Employees" },
    ],
  },
  {
    label: "Inventory",
    icon: Package,
    children: [
      { href: "/demo/inventory/products", label: "Products" },
    ],
  },
  {
    label: "Sales",
    icon: ShoppingCart,
    children: [
      { href: "/demo/sales/pos", label: "Point of Sale" },
      { href: "/demo/sales/customers", label: "Customers" },
      { href: "/demo/sales/invoices", label: "Invoices" },
    ],
  },
  {
    label: "Tasks",
    icon: ClipboardList,
    children: [
      { href: "/demo/tasks/kanban", label: "Kanban Board" },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { href: "/demo/settings/company", label: "My Company" },
    ],
  },
];

/* =========================
   BASE UI COMPONENTS
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
        <p className="text-sm text-slate-500">AGET - Demo Mode</p>
      </div>
    </div>
  );
}

/* =========================
   SIDEBAR (replica of the original)
   ========================= */

function DemoSidebar({ pathname, onNavigate }: { pathname: string; onNavigate: (href: string) => void }) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => {
    if (href === "/demo/home") {
      return pathname === "/demo/home" || pathname === "/demo";
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
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Demo user</p>
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
   NAVBAR (replica of the original)
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
          Demo mode
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
                Close demo session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* =========================
   STATISTICS
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
   MODULES (UI identical to the original, static data, read-only)
   ========================= */

// ---- Home ----
function ModuloHome() {
  const totalVentas = VENTAS.reduce((a, b) => a + b.total, 0);
  const ventasPendientes = VENTAS.filter((v) => v.estado === "Pending").length;
  const stockBajo = PRODUCTOS.filter((p) => p.stock <= 5 && p.stock > 0).length;
  const outOfStock = PRODUCTOS.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Home" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Sales" value={`${totalVentas}`} subtitle="USD" color="blue" />
        <StatCard title="Pending Sales" value={ventasPendientes} subtitle="invoices" color="orange" />
        <StatCard title="Low Stock" value={stockBajo} subtitle="products" color="red" />
        <StatCard title="Out of Stock Products" value={outOfStock} subtitle="items" color="red" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Recent Sales</h3>
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
                    <Badge className={v.estado === "Paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                      {v.estado}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Low Stock Products</h3>
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
              <div className="text-center py-4 text-xs text-slate-400">No products with low stock</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Inventory / Products (exact replica of the original, read-only) ----
function ModuloProductos() {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = PRODUCTOS.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoriaNombre = (id: string) => CATEGORIAS.find((c) => c.id === id)?.nombre || "—";

  return (
    <div className="space-y-6">
      <PageHeader title="Products" />

      {/* Search (replica of the original) */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search by product name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {searchTerm && filtered.length > 0 && (
          <p className="mt-1 text-xs text-slate-400">
            {filtered.length} result(s)
          </p>
        )}
      </div>

      {PRODUCTOS.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
          No products registered
        </div>
      ) : (
        <>
          {/* Desktop view: Table (exact replica of the original) */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Sale Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      No products found with {searchTerm}
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

          {/* Mobile view: Cards */}
          <div className="sm:hidden space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
                No products found with {searchTerm}
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

// ---- Sales / POS ----
function ModuloVentas() {
  const total = VENTAS.reduce((a, b) => a + b.total, 0);
  const pagadas = VENTAS.filter((v) => v.estado === "Paid").length;
  const pendientes = VENTAS.filter((v) => v.estado === "Pending").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Sales / POS" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Sales" value={VENTAS.length} subtitle="transactions" color="blue" />
        <StatCard title="Revenue" value={`${total}`} subtitle="USD" color="green" />
        <StatCard title="Paid" value={pagadas} subtitle="invoices" color="green" />
        <StatCard title="Pending" value={pendientes} subtitle="invoices" color="orange" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Sales History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"># Sale</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Method</th>
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
                      <Badge className={v.estado === "Paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
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

// ---- Sales / Customers ----
function ModuloClientes() {
  return (
    <div className="space-y-6">
      <PageHeader title="Customers" />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Customer Directory</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Tax ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">City</th>
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

// ---- HR / Employees ----
function ModuloEmpleados() {
  const activos = EMPLEADOS.filter((e) => e.estado === "Active").length;
  const departamentos = new Set(EMPLEADOS.map((e) => e.departamento)).size;

  return (
    <div className="space-y-6">
      <PageHeader title="HR - Employees" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Employees" value={EMPLEADOS.length} subtitle="registered" color="blue" />
        <StatCard title="Active" value={activos} subtitle="employees" color="green" />
        <StatCard title="Departments" value={departamentos} subtitle="areas" color="purple" />
        <StatCard title="Salespeople" value={EMPLEADOS.filter((e) => e.cargo === "Salesperson").length} subtitle="staff" color="orange" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Employee Roster</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Email</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
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

// ---- Tasks / Kanban ----
function ModuloTareas() {
  const estadoColor: Record<string, string> = {
    Pending: "text-red-500",
    "In Progress": "text-yellow-600",
    Completed: "text-green-600",
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks / Kanban" />
      <div className="flex gap-4">
        {["Pending", "In Progress", "Completed"].map((estado) => (
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
                  <p className="text-xs text-slate-500 mb-2">Assigned to: {t.asignado}</p>
                  <span className="text-xs text-slate-400">{t.fecha}</span>
                </div>
              ))}
              {TAREAS.filter((t) => t.estado === estado).length === 0 && (
                <div className="text-center py-4 text-xs text-slate-400">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Sales / Invoices ----
function ModuloFacturas() {
  return (
    <div className="space-y-6">
      <PageHeader title="Invoicing" />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Issued Invoices</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
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
                      <Badge className={v.estado === "Paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
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

// ---- Settings / Company ----
function ModuloConfiguracion() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Company</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Name</span>
              <span className="text-sm font-medium text-slate-900">{EMPRESA_DEMO.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Tax ID</span>
              <span className="text-sm font-medium text-slate-900 font-mono">{EMPRESA_DEMO.ruc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Address</span>
              <span className="text-sm text-slate-600">{EMPRESA_DEMO.direccion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Phone</span>
              <span className="text-sm text-slate-600 font-mono">{EMPRESA_DEMO.telefono}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Email</span>
              <span className="text-sm text-slate-600 font-mono">{EMPRESA_DEMO.email}</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Current User (demo)</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Name</span>
              <span className="text-sm font-medium text-slate-900">{USUARIO_DEMO.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Email</span>
              <span className="text-sm font-medium text-slate-900 font-mono">{USUARIO_DEMO.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Role</span>
              <span className="text-sm font-medium text-slate-900 capitalize">{USUARIO_DEMO.rol}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <p className="text-sm text-blue-800">
          This is a <strong>static data demo</strong>. All data is displayed directly
          on the page and is not saved to a database. To use the system with real
          data, sign up from the home page.
        </p>
      </div>
    </div>
  );
}

/* =========================
   MAIN DEMO PAGE
   ========================= */

const MODULE_ROUTES: Record<string, ReactElement> = {
  "/demo/home": <ModuloHome />,
  "/demo/hr/employees": <ModuloEmpleados />,
  "/demo/inventory/products": <ModuloProductos />,
  "/demo/sales/pos": <ModuloVentas />,
  "/demo/sales/customers": <ModuloClientes />,
  "/demo/sales/invoices": <ModuloFacturas />,
  "/demo/tasks/kanban": <ModuloTareas />,
  "/demo/settings/company": <ModuloConfiguracion />,
};

export default function DemoPage() {
  const [pathname, setPathname] = useState("/demo/home");

  const onNavigate = (href: string) => {
    setPathname(href);
    window.scrollTo(0, 0);
  };

  const ModuleContent = MODULE_ROUTES[pathname] || <ModuloHome />;

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
