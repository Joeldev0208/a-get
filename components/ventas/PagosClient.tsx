"use client";

import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { crearPago, eliminarPago, listarPagos, listarFacturas } from "@/lib/services/facturacion.service";
import type { PagoConFactura, Factura } from "@/lib/types/facturacion";
import { Plus, Trash2 } from "lucide-react";

const metodoStyles: Record<string, string> = {
  efectivo: "bg-green-100 text-green-800",
  transferencia: "bg-blue-100 text-blue-800",
  tarjeta: "bg-purple-100 text-purple-800",
  cheque: "bg-yellow-100 text-yellow-800",
};

interface PagosClientProps {
  initialData: PagoConFactura[];
  initialFacturas: Factura[];
  empresaId: string;
}

function PagoForm({ isOpen, onClose, onSuccess, facturas, empresaId }: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void;
  facturas: Factura[]; empresaId: string;
}) {
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
      await crearPago(empresaId, {
        factura_id: facturaId,
        monto: Number(monto),
        metodo: metodo as any,
        referencia: referencia.trim() || null,
        fecha_pago: fechaPago,
      });
      onSuccess();
      onClose();
      setFacturaId(""); setMonto(""); setMetodo("efectivo"); setReferencia("");
    } catch (err: any) {
      setError(err.message || "Error al registrar pago");
    } finally {
      setLoading(false);
    }
  };

  const facturaOptions = facturas.map((f) => ({
    value: f.id,
    label: `${f.numero} - $${f.total.toLocaleString()} (${f.estado})`,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pago" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Factura" name="facturaId" type="select" value={facturaId} onChange={setFacturaId} required options={facturaOptions} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Monto" name="monto" type="number" value={monto} onChange={setMonto} required placeholder="0.00" min={0.01} step={0.01} />
          <FormField label="Fecha de Pago" name="fechaPago" type="date" value={fechaPago} onChange={setFechaPago} required />
          <FormField label="Método" name="metodo" type="select" value={metodo} onChange={setMetodo}
            options={[
              { value: "efectivo", label: "Efectivo" },
              { value: "transferencia", label: "Transferencia" },
              { value: "tarjeta", label: "Tarjeta" },
              { value: "cheque", label: "Cheque" },
            ]}
          />
          <FormField label="Referencia" name="referencia" value={referencia} onChange={setReferencia} placeholder="Nº de referencia (opcional)" />
        </div>
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text="Registrar Pago" />
      </form>
    </Modal>
  );
}

function NuevoPagoBtn({ onSuccess, facturas, empresaId }: {
  onSuccess: () => void; facturas: Factura[]; empresaId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
        <Plus size={16} /> Registrar Pago
      </button>
      <PagoForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} facturas={facturas} empresaId={empresaId} />
    </>
  );
}

export default function PagosClient({ initialData, initialFacturas, empresaId }: PagosClientProps) {
  const [data, setData] = useState(initialData);
  const [facturas, setFacturas] = useState(initialFacturas);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pagoToDelete, setPagoToDelete] = useState<string | null>(null);

  const refresh = async () => {
    const [pagos, facs] = await Promise.all([
      listarPagos(empresaId),
      listarFacturas(empresaId),
    ]);
    setData(pagos);
    setFacturas(facs);
  };

  const handleEliminar = (id: string) => {
    setPagoToDelete(id);
    setConfirmOpen(true);
  };

  const confirmarEliminar = async () => {
    if (pagoToDelete) {
      try {
        await eliminarPago(pagoToDelete, empresaId);
        refresh();
      } catch (e: any) {
        alert(`Error al eliminar: ${e.message}`);
      }
      setPagoToDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Pagos"
        actions={<NuevoPagoBtn onSuccess={refresh} facturas={facturas} empresaId={empresaId} />}
      />

      {data.length === 0 ? (
        <EmptyState
          title="No hay pagos registrados"
          description="Registra pagos asociados a las facturas."
          action={<NuevoPagoBtn onSuccess={refresh} facturas={facturas} empresaId={empresaId} />}
        />
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
              {data.map((pago) => (
                <tr key={pago.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{pago.facturas?.numero || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{new Date(pago.fecha_pago).toLocaleDateString("es-DO")}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${metodoStyles[pago.metodo]}`}>{pago.metodo}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900">${pago.monto.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{pago.referencia || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => handleEliminar(pago.id)}
                      className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPagoToDelete(null); }}
        onConfirm={confirmarEliminar}
        title="Eliminar Pago"
        message="¿Estás seguro de eliminar este pago? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
