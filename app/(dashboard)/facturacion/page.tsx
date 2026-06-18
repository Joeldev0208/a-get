"use client";

import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import {
  listarClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
} from "@/lib/services/facturacion.service";
import {
  listarFacturas,
  crearFactura,
  crearDetalle,
  actualizarFactura,
  eliminarFactura,
  eliminarDetalle,
} from "@/lib/services/facturacion.service";
import {
  listarPagos,
  crearPago,
  eliminarPago,
  listarFacturas as listarFacturasParaPagos,
} from "@/lib/services/facturacion.service";
import type {
  Cliente,
  FacturaConCliente,
  PagoConFactura,
  Factura,
  DetalleFactura,
} from "@/lib/types/facturacion";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  Receipt,
  Users,
  CreditCard,
} from "lucide-react";
import { ServiceError } from "@/lib/services/supabase-service";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Tab = "clientes" | "facturas" | "pagos";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "clientes", label: "Clientes", icon: <Users size={18} /> },
  { id: "facturas", label: "Facturas", icon: <Receipt size={18} /> },
  { id: "pagos", label: "Pagos", icon: <CreditCard size={18} /> },
];

const estadoStyles: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  pagada: "bg-green-100 text-green-800",
  vencida: "bg-red-100 text-red-800",
  cancelada: "bg-gray-100 text-gray-800",
};

const TASA_IMPUESTO = 0.18;

// ── Formulario Cliente (Crear / Editar) ────────────────────────
function ClienteForm({
  isOpen,
  onClose,
  onSuccess,
  cliente,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cliente?: Cliente | null;
}) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [rncCedula, setRncCedula] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esEdicion = !!cliente;

  useEffect(() => {
    if (isOpen && cliente) {
      setNombre(cliente.nombre);
      setEmail(cliente.email || "");
      setTelefono(cliente.telefono || "");
      setDireccion(cliente.direccion || "");
      setRncCedula(cliente.rnc_cedula || "");
    } else if (isOpen && !cliente) {
      setNombre("");
      setEmail("");
      setTelefono("");
      setDireccion("");
      setRncCedula("");
    }
    setError(null);
  }, [isOpen, cliente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }
    try {
      setLoading(true);
      setError(null);
      if (esEdicion) {
        await actualizarCliente(cliente!.id, {
          nombre: nombre.trim(),
          email: email.trim() || null,
          telefono: telefono.trim() || null,
          direccion: direccion.trim() || null,
          rnc_cedula: rncCedula.trim() || null,
        });
      } else {
        await crearCliente({
          nombre: nombre.trim(),
          email: email.trim() || null,
          telefono: telefono.trim() || null,
          direccion: direccion.trim() || null,
          rnc_cedula: rncCedula.trim() || null,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esEdicion ? "Editar Cliente" : "Nuevo Cliente"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nombre" name="nombre" value={nombre} onChange={setNombre} required placeholder="Nombre completo o empresa" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Email" name="email" type="email" value={email} onChange={setEmail} placeholder="correo@ejemplo.com" />
          <FormField label="Teléfono" name="telefono" value={telefono} onChange={setTelefono} placeholder="809-000-0000" />
          <FormField label="RNC/Cédula" name="rncCedula" value={rncCedula} onChange={setRncCedula} placeholder="000-0000000-0" />
        </div>
        <FormField label="Dirección" name="direccion" type="textarea" value={direccion} onChange={setDireccion} placeholder="Dirección (opcional)" />
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text={esEdicion ? "Actualizar Cliente" : "Crear Cliente"} />
      </form>
    </Modal>
  );
}

// ── Formulario Factura (Crear / Editar) ────────────────────────
interface LineaDetalle {
  id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

function FacturaForm({
  isOpen,
  onClose,
  onSuccess,
  clientes,
  factura,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientes: Cliente[];
  factura?: FacturaConCliente | null;
}) {
  const [numero, setNumero] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split("T")[0]);
  const [fechaVencimiento, setFechaVencimiento] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [lineas, setLineas] = useState<LineaDetalle[]>([
    { id: crypto.randomUUID(), descripcion: "", cantidad: 1, precio_unitario: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esEdicion = !!factura;

  useEffect(() => {
    if (isOpen && factura) {
      setNumero(factura.numero);
      setClienteId(factura.cliente_id);
      setFechaEmision(factura.fecha_emision);
      setFechaVencimiento(factura.fecha_vencimiento);
      // Cargar detalles existentes
      setLineas(
        factura.detalles_factura?.map((d) => ({
          id: d.id,
          descripcion: d.descripcion,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
        })) || [{ id: crypto.randomUUID(), descripcion: "", cantidad: 1, precio_unitario: 0 }]
      );
    } else if (isOpen && !factura) {
      setNumero("");
      setClienteId("");
      setFechaEmision(new Date().toISOString().split("T")[0]);
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setFechaVencimiento(d.toISOString().split("T")[0]);
      setLineas([{ id: crypto.randomUUID(), descripcion: "", cantidad: 1, precio_unitario: 0 }]);
    }
    setError(null);
  }, [isOpen, factura]);

  const subtotal = lineas.reduce((sum, l) => sum + l.cantidad * l.precio_unitario, 0);
  const impuesto = subtotal * TASA_IMPUESTO;
  const total = subtotal + impuesto;

  const actualizarLinea = (id: string, campo: keyof LineaDetalle, valor: string | number) => {
    setLineas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [campo]: campo === "descripcion" ? String(valor) : Number(valor) } : l))
    );
  };
  const agregarLinea = () => setLineas((prev) => [...prev, { id: crypto.randomUUID(), descripcion: "", cantidad: 1, precio_unitario: 0 }]);
  const eliminarLinea = (id: string) => setLineas((prev) => prev.filter((l) => l.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim()) { setError("El número es obligatorio"); return; }
    if (!clienteId) { setError("Debes seleccionar un cliente"); return; }
    if (lineas.every((l) => !l.descripcion.trim())) { setError("Agrega al menos un detalle"); return; }

    try {
      setLoading(true);
      setError(null);

      if (esEdicion) {
        // Actualizar factura
        await actualizarFactura(factura!.id, {
          numero: numero.trim(),
          cliente_id: clienteId,
          subtotal: Math.round(subtotal * 100) / 100,
          impuesto: Math.round(impuesto * 100) / 100,
          total: Math.round(total * 100) / 100,
          fecha_emision: fechaEmision,
          fecha_vencimiento: fechaVencimiento,
        });
        // Eliminar detalles antiguos y crear nuevos
        const detallesViejos: DetalleFactura[] = factura!.detalles_factura || [];
        for (const d of detallesViejos) {
          await eliminarDetalle(d.id);
        }
        for (const linea of lineas) {
          if (!linea.descripcion.trim()) continue;
          await crearDetalle({
            factura_id: factura!.id,
            descripcion: linea.descripcion.trim(),
            cantidad: linea.cantidad,
            precio_unitario: linea.precio_unitario,
          });
        }
      } else {
        // Crear factura nueva
        const facturaCreada = await crearFactura({
          numero: numero.trim(),
          cliente_id: clienteId,
          subtotal: Math.round(subtotal * 100) / 100,
          impuesto: Math.round(impuesto * 100) / 100,
          total: Math.round(total * 100) / 100,
          estado: "pendiente",
          fecha_emision: fechaEmision,
          fecha_vencimiento: fechaVencimiento,
        });
        for (const linea of lineas) {
          if (!linea.descripcion.trim()) continue;
          await crearDetalle({
            factura_id: facturaCreada.id,
            descripcion: linea.descripcion.trim(),
            cantidad: linea.cantidad,
            precio_unitario: linea.precio_unitario,
          });
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar factura");
    } finally {
      setLoading(false);
    }
  };

  const clienteOptions = clientes.map((c) => ({ value: c.id, label: `${c.nombre}${c.rnc_cedula ? ` - ${c.rnc_cedula}` : ""}` }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esEdicion ? "Editar Factura" : "Nueva Factura"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Número" name="numero" value={numero} onChange={setNumero} required placeholder="FAC-0001" />
          <FormField label="Cliente" name="clienteId" type="select" value={clienteId} onChange={setClienteId} required options={clienteOptions} />
          <FormField label="Emisión" name="fechaEmision" type="date" value={fechaEmision} onChange={setFechaEmision} required />
          <FormField label="Vencimiento" name="fechaVencimiento" type="date" value={fechaVencimiento} onChange={setFechaVencimiento} required />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Detalles</label>
            <button type="button" onClick={agregarLinea} className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"><Plus size={14} /> Agregar línea</button>
          </div>
          <div className="space-y-2">
            {lineas.map((linea) => (
              <div key={linea.id} className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex-1"><input type="text" placeholder="Descripción" value={linea.descripcion} onChange={(e) => actualizarLinea(linea.id, "descripcion", e.target.value)} className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none" /></div>
                <div className="w-20"><input type="number" placeholder="Cant." value={linea.cantidad || ""} onChange={(e) => actualizarLinea(linea.id, "cantidad", e.target.value ? Number(e.target.value) : 0)} min={1} className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none" /></div>
                <div className="w-28"><input type="number" placeholder="Precio" value={linea.precio_unitario || ""} onChange={(e) => actualizarLinea(linea.id, "precio_unitario", e.target.value ? Number(e.target.value) : 0)} min={0} step={0.01} className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none" /></div>
                <div className="w-24 pt-1.5 text-right text-sm font-medium text-gray-700">${(linea.cantidad * linea.precio_unitario).toFixed(2)}</div>
                <button type="button" onClick={() => eliminarLinea(linea.id)} disabled={lineas.length === 1} className="mt-1 rounded p-1 text-gray-400 hover:text-red-600 disabled:opacity-30"><X size={16} /></button>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex justify-between text-sm text-gray-600"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm text-gray-600"><span>Impuesto (18%):</span><span>${impuesto.toFixed(2)}</span></div>
          <div className="mt-1 flex justify-between border-t border-gray-300 pt-2 text-base font-bold text-gray-900"><span>Total:</span><span>${total.toFixed(2)}</span></div>
        </div>
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text={esEdicion ? "Actualizar Factura" : "Crear Factura"} />
      </form>
    </Modal>
  );
}

// ── Formulario Pago (Crear) ─────────────────────────────────────
function PagoForm({ isOpen, onClose, onSuccess, facturas }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; facturas: Factura[] }) {
  const [facturaId, setFacturaId] = useState("");
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("efectivo");
  const [referencia, setReferencia] = useState("");
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facturaId) { setError("Debes seleccionar una factura"); return; }
    if (!monto || Number(monto) <= 0) { setError("El monto debe ser mayor a 0"); return; }
    try {
      setLoading(true);
      setError(null);
      await crearPago({ factura_id: facturaId, monto: Number(monto), metodo: metodo as any, referencia: referencia.trim() || null, fecha_pago: fechaPago });
      onSuccess();
      onClose();
      setFacturaId(""); setMonto(""); setMetodo("efectivo"); setReferencia("");
    } catch (err: any) { setError(err.message || "Error al registrar pago"); } finally { setLoading(false); }
  };

  const facturaOptions = facturas.map((f) => ({ value: f.id, label: `${f.numero} - $${f.total.toLocaleString()} (${f.estado})` }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pago" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Factura" name="facturaId" type="select" value={facturaId} onChange={setFacturaId} required options={facturaOptions} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Monto" name="monto" type="number" value={monto} onChange={setMonto} required placeholder="0.00" min={0.01} step={0.01} />
          <FormField label="Fecha" name="fechaPago" type="date" value={fechaPago} onChange={setFechaPago} required />
          <FormField label="Método" name="metodo" type="select" value={metodo} onChange={setMetodo} options={[{ value: "efectivo", label: "Efectivo" }, { value: "transferencia", label: "Transferencia" }, { value: "tarjeta", label: "Tarjeta" }, { value: "cheque", label: "Cheque" }]} />
          <FormField label="Referencia" name="referencia" value={referencia} onChange={setReferencia} placeholder="Nº referencia (opcional)" />
        </div>
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text="Registrar Pago" />
      </form>
    </Modal>
  );
}

// ── Página principal unificada ──────────────────────────────────
export default function FacturacionPage() {
  const [tab, setTab] = useState<Tab>("clientes");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [facturas, setFacturas] = useState<FacturaConCliente[]>([]);
  const [pagos, setPagos] = useState<PagoConFactura[]>([]);
  const [facturasParaPago, setFacturasParaPago] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Modales
  const [showModalCliente, setShowModalCliente] = useState(false);
  const [showModalFactura, setShowModalFactura] = useState(false);
  const [showModalPago, setShowModalPago] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [editingFactura, setEditingFactura] = useState<FacturaConCliente | null>(null);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmSkipKey, setConfirmSkipKey] = useState("");
  const confirmActionRef = useRef<() => Promise<void>>(async () => {});

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [clts, facs, pgs, facsPago] = await Promise.all([listarClientes(), listarFacturas(), listarPagos(), listarFacturasParaPagos()]);
      setClientes(clts);
      setFacturas(facs);
      setPagos(pgs);
      setFacturasParaPago(facsPago);
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Error al cargar facturación"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  const handleEliminarCliente = async (id: string) => {
    const skipKey = "aget_confirm_skip_cliente";
    if (localStorage.getItem(skipKey) === "true") {
      await eliminarCliente(id);
      cargarDatos();
      return;
    }
    setConfirmTitle("Eliminar Cliente");
    setConfirmMessage("¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.");
    setConfirmSkipKey(skipKey);
    confirmActionRef.current = async () => {
      try {
        await eliminarCliente(id);
        cargarDatos();
      } catch (err) {
        alert("Error al eliminar cliente");
      }
    };
    setConfirmOpen(true);
  };

  const handleEliminarFactura = async (id: string) => {
    const skipKey = "aget_confirm_skip_factura";
    if (localStorage.getItem(skipKey) === "true") {
      await eliminarFactura(id);
      cargarDatos();
      return;
    }
    setConfirmTitle("Eliminar Factura");
    setConfirmMessage("¿Estás seguro de eliminar esta factura? Se eliminarán también sus detalles y pagos asociados.");
    setConfirmSkipKey(skipKey);
    confirmActionRef.current = async () => {
      try {
        await eliminarFactura(id);
        cargarDatos();
      } catch (err) {
        alert("Error al eliminar factura");
      }
    };
    setConfirmOpen(true);
  };

  const handleEliminarPago = async (id: string) => {
    const skipKey = "aget_confirm_skip_pago";
    if (localStorage.getItem(skipKey) === "true") {
      await eliminarPago(id);
      cargarDatos();
      return;
    }
    setConfirmTitle("Eliminar Pago");
    setConfirmMessage("¿Estás seguro de eliminar este pago?");
    setConfirmSkipKey(skipKey);
    confirmActionRef.current = async () => {
      try {
        await eliminarPago(id);
        cargarDatos();
      } catch (err) {
        alert("Error al eliminar pago");
      }
    };
    setConfirmOpen(true);
  };

  return (
    <div>
      <PageHeader title="Facturación" />

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Clientes */}
      {tab === "clientes" && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => { setEditingCliente(null); setShowModalCliente(true); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              <Plus size={16} /> Nuevo Cliente
            </button>
          </div>
          {clientes.length === 0 ? (
            <EmptyState title="No hay clientes" description="Agrega clientes para empezar a facturar." action={<button onClick={() => { setEditingCliente(null); setShowModalCliente(true); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><Plus size={16} /> Nuevo Cliente</button>} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Teléfono</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">RNC/Cédula</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{cliente.nombre}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{cliente.email || "—"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{cliente.telefono || "—"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{cliente.rnc_cedula || "—"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <button onClick={() => { setEditingCliente(cliente); setShowModalCliente(true); }} className="mr-2 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"><Pencil size={16} /></button>
                        <button onClick={() => handleEliminarCliente(cliente.id)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Facturas */}
      {tab === "facturas" && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => { setEditingFactura(null); setShowModalFactura(true); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              <Plus size={16} /> Nueva Factura
            </button>
          </div>
          {facturas.length === 0 ? (
            <EmptyState title="No hay facturas" description="Crea tu primera factura." action={<button onClick={() => { setEditingFactura(null); setShowModalFactura(true); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><Plus size={16} /> Nueva Factura</button>} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Número</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Vencimiento</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {facturas.map((factura) => (
                    <tr key={factura.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{factura.numero}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{factura.clientes?.nombre || "—"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{new Date(factura.fecha_emision).toLocaleDateString("es-DO")}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{new Date(factura.fecha_vencimiento).toLocaleDateString("es-DO")}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900">${factura.total.toLocaleString()}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoStyles[factura.estado]}`}>{factura.estado}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <button onClick={() => { setEditingFactura(factura); setShowModalFactura(true); }} className="mr-2 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"><Pencil size={16} /></button>
                        <button onClick={() => handleEliminarFactura(factura.id)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagos */}
      {tab === "pagos" && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => setShowModalPago(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              <Plus size={16} /> Registrar Pago
            </button>
          </div>
          {pagos.length === 0 ? (
            <EmptyState title="No hay pagos" description="Registra pagos asociados a facturas." action={<button onClick={() => setShowModalPago(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><Plus size={16} /> Registrar Pago</button>} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Factura</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Método</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Referencia</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pagos.map((pago) => (
                    <tr key={pago.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{pago.facturas?.numero || "—"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{new Date(pago.fecha_pago).toLocaleDateString("es-DO")}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoStyles[pago.metodo]}`}>{pago.metodo}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900">${pago.monto.toLocaleString()}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{pago.referencia || "—"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <button onClick={() => handleEliminarPago(pago.id)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => { 
          const action = confirmActionRef.current;
          if (typeof action === "function") {
            await action();
          }
        }}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        skipKey={confirmSkipKey}
      />

      {/* Modales */}
      <ClienteForm
        isOpen={showModalCliente}
        onClose={() => { setShowModalCliente(false); setEditingCliente(null); }}
        onSuccess={cargarDatos}
        cliente={editingCliente}
      />
      <FacturaForm
        isOpen={showModalFactura}
        onClose={() => { setShowModalFactura(false); setEditingFactura(null); }}
        onSuccess={cargarDatos}
        clientes={clientes}
        factura={editingFactura}
      />
      <PagoForm isOpen={showModalPago} onClose={() => setShowModalPago(false)} onSuccess={cargarDatos} facturas={facturasParaPago} />
    </div>
  );
}