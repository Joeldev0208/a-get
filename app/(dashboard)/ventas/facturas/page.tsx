"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ServiceError } from "@/lib/services/supabase-service";
import { listarFacturas } from "@/lib/services/facturacion.service";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { FacturaConCliente } from "@/lib/types/facturacion";
import { Search, Printer, Trash2 } from "lucide-react";

const estadoStyles: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  pagada: "bg-green-100 text-green-800",
  vencida: "bg-red-100 text-red-800",
  cancelada: "bg-gray-100 text-gray-800",
};

export default function VentasFacturasPage() {
  const [data, setData] = useState<FacturaConCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [empresaId, setEmpresaId] = useState<string>("");

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [facturaToDelete, setFacturaToDelete] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const perfil = await obtenerPerfilActual();
      if (!perfil) throw new Error("No se pudo obtener el perfil de usuario");
      setEmpresaId(perfil.empresa_id);
      const facturas = await listarFacturas(perfil.empresa_id);
      setData(facturas);
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Error desconocido"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // Filtro por número de factura o nombre del cliente
  const filteredData = data.filter((f) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.numero.toLowerCase().includes(term) ||
      (f.clientes?.nombre || "").toLowerCase().includes(term)
    );
  });

  // ── Reimprimir ──────────────────────────────────────────────
  const handleReimprimir = async (factura: FacturaConCliente) => {
    try {
      const { listarDetalles } = await import("@/lib/services/facturacion.service");
      const detalles = await listarDetalles(factura.id);

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
                <td colspan="3" style="text-align:right">ITBIS (18%):</td>
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
    } catch (e: any) {
      alert(`Error al reimprimir: ${e.message}`);
    }
  };

  // ── Eliminar ────────────────────────────────────────────────
  const handleEliminar = (id: string) => {
    setFacturaToDelete(id);
    setConfirmOpen(true);
  };

  const confirmarEliminar = async () => {
    if (facturaToDelete) {
      try {
        const { eliminarFactura } = await import("@/lib/services/facturacion.service");
        await eliminarFactura(facturaToDelete, empresaId);
        cargarDatos();
      } catch (e: any) {
        alert(`Error al eliminar: ${e.message}`);
      }
      setFacturaToDelete(null);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  return (
    <div>
      <PageHeader title="Facturas" />

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por número de factura o nombre del cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="No hay facturas registradas"
          description="Las facturas se generan desde el Punto de Venta."
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

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setFacturaToDelete(null); }}
        onConfirm={confirmarEliminar}
        title="Eliminar Factura"
        message="¿Estás seguro de eliminar esta factura? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}