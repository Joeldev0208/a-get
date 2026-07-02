"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { listarFacturas } from "@/lib/services/facturacion";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { FacturaConCliente } from "@/lib/types/facturacion";

const estadoStyles: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  pagada: "bg-green-100 text-green-800",
  vencida: "bg-red-100 text-red-800",
  cancelada: "bg-gray-100 text-gray-800",
};

export default function VentasFacturasPage() {
  const [facturas, setFacturas] = useState<FacturaConCliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const perfil = await obtenerPerfilActual();
    if (!perfil) return;
    setFacturas(await listarFacturas(perfil.empresa_id));
    setLoading(false);
  }

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div>
      <PageHeader title="Facturas" />

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Cliente</th>
              <th>RNC/Cédula</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha Emisión</th>
            </tr>
          </thead>
          <tbody>
            {facturas.map((f) => (
              <tr key={f.id}>
                <td className="font-medium">{f.numero}</td>
                <td>{f.clientes?.nombre || "-"}</td>
                <td>{f.clientes?.rnc_cedula || "-"}</td>
                <td>${f.total.toFixed(2)}</td>
                <td>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoStyles[f.estado]}`}>
                    {f.estado}
                  </span>
                </td>
                <td>{new Date(f.fecha_emision).toLocaleDateString()}</td>
              </tr>
            ))}
            {facturas.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-500 py-4">No hay facturas registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}