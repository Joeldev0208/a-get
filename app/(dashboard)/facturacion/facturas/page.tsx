"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import { ServiceError } from "@/lib/services/supabase-service";
import { listarFacturas, crearFactura, crearDetalle, listarClientes } from "@/lib/services/facturacion.service";
import type { FacturaConCliente, Cliente, DetalleFacturaInput } from "@/lib/types/facturacion";
import { Plus, Eye, Trash2, X } from "lucide-react";

const estadoStyles: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  pagada: "bg-green-100 text-green-800",
  vencida: "bg-red-100 text-red-800",
  cancelada: "bg-gray-100 text-gray-800",
};

const TASA_IMPUESTO = 0.18; // 18%

// ── Formulario de Factura con Detalles ──────────────────────────
interface FacturaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientes: Cliente[];
}

interface LineaDetalle {
  id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

function FacturaForm({ isOpen, onClose, onSuccess, clientes }: FacturaFormProps) {
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

  const resetForm = () => {
    setNumero("");
    setClienteId("");
    setFechaEmision(new Date().toISOString().split("T")[0]);
    const d = new Date(); d.setDate(d.getDate() + 30);
    setFechaVencimiento(d.toISOString().split("T")[0]);
    setLineas([{ id: crypto.randomUUID(), descripcion: "", cantidad: 1, precio_unitario: 0 }]);
    setError(null);
  };

  // Calcular totales
  const subtotal = lineas.reduce((sum, l) => sum + l.cantidad * l.precio_unitario, 0);
  const impuesto = subtotal * TASA_IMPUESTO;
  const total = subtotal + impuesto;

  const actualizarLinea = (id: string, campo: keyof LineaDetalle, valor: string | number) => {
    setLineas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [campo]: campo === "descripcion" ? String(valor) : Number(valor) } : l))
    );
  };

  const agregarLinea = () => {
    setLineas((prev) => [...prev, { id: crypto.randomUUID(), descripcion: "", cantidad: 1, precio_unitario: 0 }]);
  };

  const eliminarLinea = (id: string) => {
    setLineas((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim()) { setError("El número de factura es obligatorio"); return; }
    if (!clienteId) { setError("Debes seleccionar un cliente"); return; }
    if (lineas.length === 0 || lineas.every((l) => !l.descripcion.trim())) {
      setError("Debes agregar al menos un detalle con descripción");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Crear la factura
      const factura = await crearFactura({
        numero: numero.trim(),
        cliente_id: clienteId,
        subtotal: Math.round(subtotal * 100) / 100,
        impuesto: Math.round(impuesto * 100) / 100,
        total: Math.round(total * 100) / 100,
        estado: "pendiente",
        fecha_emision: fechaEmision,
        fecha_vencimiento: fechaVencimiento,
      });

      // 2. Crear cada detalle
      for (const linea of lineas) {
        if (!linea.descripcion.trim()) continue;
        await crearDetalle({
          factura_id: factura.id,
          descripcion: linea.descripcion.trim(),
          cantidad: linea.cantidad,
          precio_unitario: linea.precio_unitario,
        });
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Error al crear factura");
    } finally {
      setLoading(false);
    }
  };

  const clienteOptions = clientes.map((c) => ({ value: c.id, label: `${c.nombre}${c.rnc_cedula ? ` - ${c.rnc_cedula}` : ""}` }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Factura" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cabecera */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Número de Factura" name="numero" value={numero} onChange={setNumero} required placeholder="FAC-0001" />
          <FormField label="Cliente" name="clienteId" type="select" value={clienteId} onChange={setClienteId} required options={clienteOptions} />
          <FormField label="Fecha Emisión" name="fechaEmision" type="date" value={fechaEmision} onChange={setFechaEmision} required />
          <FormField label="Fecha Vencimiento" name="fechaVencimiento" type="date" value={fechaVencimiento} onChange={setFechaVencimiento} required />
        </div>

        {/* Líneas de detalle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Detalles</label>
            <button type="button" onClick={agregarLinea} className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">
              <Plus size={14} /> Agregar línea
            </button>
          </div>
          <div className="space-y-2">
            {lineas.map((linea, idx) => (
              <div key={linea.id} className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Descripción"
                    value={linea.descripcion}
                    onChange={(e) => actualizarLinea(linea.id, "descripcion", e.target.value)}
                    className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    placeholder="Cant."
                    value={linea.cantidad || ""}
                    onChange={(e) => actualizarLinea(linea.id, "cantidad", e.target.value ? Number(e.target.value) : 0)}
                    min={1}
                    className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    placeholder="Precio"
                    value={linea.precio_unitario || ""}
                    onChange={(e) => actualizarLinea(linea.id, "precio_unitario", e.target.value ? Number(e.target.value) : 0)}
                    min={0}
                    step={0.01}
                    className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="w-24 pt-1.5 text-right text-sm font-medium text-gray-700">
                  ${(linea.cantidad * linea.precio_unitario).toFixed(2)}
                </div>
                <button type="button" onClick={() => eliminarLinea(linea.id)} disabled={lineas.length === 1} className="mt-1 rounded p-1 text-gray-400 hover:text-red-600 disabled:opacity-30">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Totales */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Impuesto ({(TASA_IMPUESTO * 100).toFixed(0)}%):</span>
            <span>${impuesto.toFixed(2)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-gray-300 pt-2 text-base font-bold text-gray-900">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text="Crear Factura" />
      </form>
    </Modal>
  );
}

// ── Botón wrapper ───────────────────────────────────────────────
function NuevaFacturaBtn({ onSuccess, clientes }: { onSuccess: () => void; clientes: Cliente[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
        <Plus size={16} />
        Nueva Factura
      </button>
      <FacturaForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} clientes={clientes} />
    </>
  );
}

// ── Página principal ────────────────────────────────────────────
export default function FacturasPage() {
  const [data, setData] = useState<FacturaConCliente[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [facturas, clts] = await Promise.all([listarFacturas(), listarClientes()]);
      setData(facturas);
      setClientes(clts);
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  const handleNuevo = () => cargarDatos();

  return (
    <div>
      <PageHeader title="Facturas" actions={<NuevaFacturaBtn onSuccess={handleNuevo} clientes={clientes} />} />

      {data.length === 0 ? (
        <EmptyState
          title="No hay facturas registradas"
          description="Crea tu primera factura para comenzar."
          action={<NuevaFacturaBtn onSuccess={handleNuevo} clientes={clientes} />}
        />
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
              {data.map((factura) => (
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
                    <button className="mr-2 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"><Eye size={16} /></button>
                    <button className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}