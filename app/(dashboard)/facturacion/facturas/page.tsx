"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ServiceError } from "@/lib/services/supabase-service";
import {
  listarFacturas, crearFactura, actualizarFactura, eliminarFactura,
  crearDetalle, eliminarDetalle, listarDetalles, listarClientes
} from "@/lib/services/facturacion.service";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { FacturaConCliente, Cliente, DetalleFactura, EstadoFactura } from "@/lib/types/facturacion";
import { Plus, Pencil, Trash2, Search, Printer, X } from "lucide-react";

const estadoStyles: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  pagada: "bg-green-100 text-green-800",
  vencida: "bg-red-100 text-red-800",
  cancelada: "bg-gray-100 text-gray-800",
};

const TASA_IMPUESTO = 0.18;

// ── Imprimir ticket de factura ───────────────────────────────────
function imprimirFactura(factura: FacturaConCliente, detalles: DetalleFactura[]) {
  const printWindow = window.open("", "_blank", "width=320,height=600");
  if (!printWindow) return;

  const itemsHtml = detalles
    .map(
      (d) =>
        `<tr>
          <td style="text-align:left">${d.descripcion.substring(0, 20)}</td>
          <td style="text-align:center">${d.cantidad}</td>
          <td style="text-align:right">$${d.precio_unitario.toFixed(2)}</td>
          <td style="text-align:right">$${d.total.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 11px; width: 76mm; margin: 0; padding: 5mm; }
          h2 { text-align: center; margin: 0 0 5px; font-size: 15px; }
          .center { text-align: center; }
          hr { border: none; border-top: 1px dashed #333; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { font-size: 10px; text-align: left; border-bottom: 1px solid #333; padding: 3px 0; }
          td { padding: 2px 0; font-size: 11px; }
          .total-row td { font-weight: bold; border-top: 1px solid #333; padding-top: 4px; }
          .gracias { text-align: center; margin-top: 8px; font-size: 10px; }
        </style>
      </head>
      <body>
        <h2>AGET</h2>
        <p class="center" style="margin:0;font-size:10px">Factura: ${factura.numero}</p>
        <p class="center" style="margin:0;font-size:10px">Cliente: ${factura.clientes?.nombre || "—"}</p>
        <p class="center" style="margin:0;font-size:10px">RNC: ${factura.clientes?.rnc_cedula || "—"}</p>
        <p class="center" style="margin:0;font-size:10px">Emisión: ${new Date(factura.fecha_emision).toLocaleDateString("es-DO")}</p>
        <hr/>
        <table>
          <tr><th>Producto</th><th style="text-align:center">Qty</th><th style="text-align:right">Precio</th><th style="text-align:right">Total</th></tr>
          ${itemsHtml}
          <tr class="total-row">
            <td colspan="3" style="text-align:right">Subtotal:</td>
            <td style="text-align:right">$${Number(factura.subtotal).toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align:right">ITBIS (${(TASA_IMPUESTO * 100).toFixed(0)}%):</td>
            <td style="text-align:right">$${Number(factura.impuesto).toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td colspan="3" style="text-align:right">TOTAL:</td>
            <td style="text-align:right">$${Number(factura.total).toFixed(2)}</td>
          </tr>
        </table>
        <hr/>
        <p class="gracias">¡Gracias por su preferencia!</p>
        <script>window.print(); window.close();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// ── Formulario de Factura (Crear / Editar) ─────────────────────
interface FacturaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientes: Cliente[];
  empresaId: string;
  factura?: FacturaConCliente | null;
}

interface LineaDetalle {
  id: string;
  detalle_id?: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

function FacturaForm({ isOpen, onClose, onSuccess, clientes, factura, empresaId }: FacturaFormProps) {
  const [numero, setNumero] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [fechaEmision, setFechaEmision] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [estado, setEstado] = useState("pendiente");
  const [lineas, setLineas] = useState<LineaDetalle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esEdicion = !!factura;

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen) {
      if (factura) {
        setNumero(factura.numero);
        setClienteId(factura.cliente_id);
        setFechaEmision(factura.fecha_emision.split("T")[0]);
        setFechaVencimiento(factura.fecha_vencimiento.split("T")[0]);
        setEstado(factura.estado);
        // Cargar detalles
        listarDetalles(factura.id).then((dets) => {
          setLineas(
            dets.map((d) => ({
              id: crypto.randomUUID(),
              detalle_id: d.id,
              descripcion: d.descripcion,
              cantidad: d.cantidad,
              precio_unitario: d.precio_unitario,
            }))
          );
        });
      } else {
        resetForm();
      }
      setError(null);
    }
  }, [isOpen, factura]);

  const resetForm = () => {
    setNumero("");
    setClienteId("");
    setFechaEmision(new Date().toISOString().split("T")[0]);
    const d = new Date(); d.setDate(d.getDate() + 30);
    setFechaVencimiento(d.toISOString().split("T")[0]);
    setEstado("pendiente");
    setLineas([{ id: crypto.randomUUID(), descripcion: "", cantidad: 1, precio_unitario: 0 }]);
    setError(null);
  };

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

      if (esEdicion && factura) {
        // Actualizar cabecera
        await actualizarFactura(factura.id, empresaId, {
          numero: numero.trim(),
          cliente_id: clienteId,
          subtotal: Math.round(subtotal * 100) / 100,
          impuesto: Math.round(impuesto * 100) / 100,
          total: Math.round(total * 100) / 100,
          estado: estado as EstadoFactura,
          fecha_emision: fechaEmision,
          fecha_vencimiento: fechaVencimiento,
        });

        // Eliminar detalles viejos y crear nuevos
        for (const linea of lineas) {
          if (linea.detalle_id) {
            await eliminarDetalle(linea.detalle_id);
          }
        }
        for (const linea of lineas) {
          if (!linea.descripcion.trim()) continue;
          await crearDetalle({
            factura_id: factura.id,
            descripcion: linea.descripcion.trim(),
            cantidad: linea.cantidad,
            precio_unitario: linea.precio_unitario,
          });
        }
      } else {
        const newFactura = await crearFactura(empresaId, {
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
            factura_id: newFactura.id,
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
  const estadoOptions = [
    { value: "pendiente", label: "Pendiente" },
    { value: "pagada", label: "Pagada" },
    { value: "vencida", label: "Vencida" },
    { value: "cancelada", label: "Cancelada" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esEdicion ? `Editar Factura ${factura?.numero}` : "Nueva Factura"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Número" name="numero" value={numero} onChange={setNumero} required placeholder="FAC-0001" />
          <FormField label="Cliente" name="clienteId" type="select" value={clienteId} onChange={setClienteId} required options={clienteOptions} />
          <FormField label="Fecha Emisión" name="fechaEmision" type="date" value={fechaEmision} onChange={setFechaEmision} required />
          <FormField label="Fecha Vencimiento" name="fechaVencimiento" type="date" value={fechaVencimiento} onChange={setFechaVencimiento} required />
          {esEdicion && (
            <FormField label="Estado" name="estado" type="select" value={estado} onChange={setEstado} options={estadoOptions} />
          )}
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
            {lineas.map((linea) => (
              <div key={linea.id} className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex-1">
                  <input type="text" placeholder="Descripción" value={linea.descripcion}
                    onChange={(e) => actualizarLinea(linea.id, "descripcion", e.target.value)}
                    className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div className="w-20">
                  <input type="number" placeholder="Cant." value={linea.cantidad || ""}
                    onChange={(e) => actualizarLinea(linea.id, "cantidad", e.target.value ? Number(e.target.value) : 0)}
                    min={1} className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div className="w-28">
                  <input type="number" placeholder="Precio" value={linea.precio_unitario || ""}
                    onChange={(e) => actualizarLinea(linea.id, "precio_unitario", e.target.value ? Number(e.target.value) : 0)}
                    min={0} step={0.01} className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div className="w-24 pt-1.5 text-right text-sm font-medium text-gray-700">
                  ${(linea.cantidad * linea.precio_unitario).toFixed(2)}
                </div>
                <button type="button" onClick={() => eliminarLinea(linea.id)} disabled={lineas.length === 1}
                  className="mt-1 rounded p-1 text-gray-400 hover:text-red-600 disabled:opacity-30">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Totales */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal:</span><span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Impuesto ({(TASA_IMPUESTO * 100).toFixed(0)}%):</span><span>${impuesto.toFixed(2)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-gray-300 pt-2 text-base font-bold text-gray-900">
            <span>Total:</span><span>${total.toFixed(2)}</span>
          </div>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text={esEdicion ? "Actualizar Factura" : "Crear Factura"} />
      </form>
    </Modal>
  );
}

// ── Botón Nueva Factura ─────────────────────────────────────────
function NuevaFacturaBtn({ onSuccess, clientes, empresaId }: { onSuccess: () => void; clientes: Cliente[]; empresaId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
        <Plus size={16} /> Nueva Factura
      </button>
      <FacturaForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} clientes={clientes} empresaId={empresaId} />
    </>
  );
}

// ── Botón Editar Factura ────────────────────────────────────────
function EditarFacturaBtn({ factura, onSuccess, clientes, empresaId, onEdit }: {
  factura: FacturaConCliente; onSuccess: () => void; clientes: Cliente[]; empresaId: string;
  onEdit: (f: FacturaConCliente) => void;
}) {
  return (
    <button onClick={() => onEdit(factura)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600">
      <Pencil size={16} />
    </button>
  );
}

// ── Página principal ────────────────────────────────────────────
export default function FacturasPage() {
  const [data, setData] = useState<FacturaConCliente[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [empresaId, setEmpresaId] = useState<string>("");

  // Búsqueda
  const [searchTerm, setSearchTerm] = useState("");

  // Modal edición
  const [editFactura, setEditFactura] = useState<FacturaConCliente | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Confirm delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [facturaToDelete, setFacturaToDelete] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const perfil = await obtenerPerfilActual();
      if (!perfil) throw new Error("No se pudo obtener el perfil de usuario");
      setEmpresaId(perfil.empresa_id);
      const [facturas, clts] = await Promise.all([listarFacturas(perfil.empresa_id), listarClientes(perfil.empresa_id)]);
      setData(facturas);
      setClientes(clts);
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Error desconocido"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // Filtro
  const filteredData = data.filter((f) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.numero.toLowerCase().includes(term) ||
      (f.clientes?.nombre || "").toLowerCase().includes(term)
    );
  });

  const handleSearchKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && filteredData.length > 0) {
      const first = filteredData[0];
      setEditFactura(first);
      setEditModalOpen(true);
    }
  };

  // ── Reimprimir ──────────────────────────────────────────────
  const handleReimprimir = async (factura: FacturaConCliente) => {
    const detalles = await listarDetalles(factura.id);
    imprimirFactura(factura, detalles);
  };

  // ── Eliminar ────────────────────────────────────────────────
  const handleEliminar = async (id: string) => {
    setFacturaToDelete(id);
    setConfirmOpen(true);
  };

  const confirmarEliminar = async () => {
    if (facturaToDelete) {
      await eliminarFactura(facturaToDelete, empresaId);
      cargarDatos();
      setFacturaToDelete(null);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  return (
    <div>
      <PageHeader
        title="Facturas"
        actions={<NuevaFacturaBtn onSuccess={cargarDatos} clientes={clientes} empresaId={empresaId} />}
      />

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por número de factura o nombre del cliente... (Enter para editar)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
        {searchTerm && filteredData.length > 0 && (
          <p className="mt-1 text-xs text-gray-400">
            {filteredData.length} resultado(s) — Presiona Enter para editar el primero
          </p>
        )}
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="No hay facturas registradas"
          description="Crea tu primera factura para comenzar."
          action={<NuevaFacturaBtn onSuccess={cargarDatos} clientes={clientes} empresaId={empresaId} />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Emisión</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Vencimiento</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                    No se encontraron facturas con "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredData.map((factura) => (
                  <tr key={factura.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{factura.numero}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{factura.clientes?.nombre || "—"}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{new Date(factura.fecha_emision).toLocaleDateString("es-DO")}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{new Date(factura.fecha_vencimiento).toLocaleDateString("es-DO")}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900">${factura.total.toLocaleString()}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoStyles[factura.estado]}`}>
                        {factura.estado}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => handleReimprimir(factura)}
                        className="mr-1 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-green-600"
                        title="Reimprimir ticket"
                      >
                        <Printer size={16} />
                      </button>
                      <EditarFacturaBtn
                        factura={factura}
                        onSuccess={cargarDatos}
                        clientes={clientes}
                        empresaId={empresaId}
                        onEdit={(f) => { setEditFactura(f); setEditModalOpen(true); }}
                      />
                      <button
                        onClick={() => handleEliminar(factura.id)}
                        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de edición */}
      <FacturaForm
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditFactura(null); }}
        onSuccess={cargarDatos}
        clientes={clientes}
        empresaId={empresaId}
        factura={editFactura}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setFacturaToDelete(null); }}
        onConfirm={confirmarEliminar}
        title="Eliminar Factura"
        message="¿Estás seguro de eliminar esta factura? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        skipKey="aget_confirm_skip_factura"
      />
    </div>
  );
}