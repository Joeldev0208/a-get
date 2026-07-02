"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { listarPagos } from "@/lib/services/facturacion";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { PagoConFactura } from "@/lib/types/facturacion";

export default function VentasPagosPage() {
  const [pagos, setPagos] = useState<PagoConFactura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const perfil = await obtenerPerfilActual();
    if (!perfil) return;
    setPagos(await listarPagos(perfil.empresa_id));
    setLoading(false);
  }

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div>
      <PageHeader title="Pagos" />

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Factura</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Referencia</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.facturas?.numero || "-"}</td>
                <td>${p.monto.toFixed(2)}</td>
                <td className="capitalize">{p.metodo}</td>
                <td>{p.referencia || "-"}</td>
                <td>{new Date(p.fecha_pago).toLocaleDateString()}</td>
              </tr>
            ))}
            {pagos.length === 0 && (
              <tr><td colSpan={5} className="text-center text-gray-500 py-4">No hay pagos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}