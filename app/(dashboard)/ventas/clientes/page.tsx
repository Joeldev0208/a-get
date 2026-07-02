"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { listarClientes, crearCliente } from "@/lib/services/facturacion";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { Cliente } from "@/lib/types/facturacion";

export default function VentasClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empresaId, setEmpresaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", direccion: "", rnc_cedula: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const perfil = await obtenerPerfilActual();
    if (!perfil) return;
    setEmpresaId(perfil.empresa_id);
    setClientes(await listarClientes(perfil.empresa_id));
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await crearCliente(empresaId, form);
    setShowForm(false);
    setForm({ nombre: "", email: "", telefono: "", direccion: "", rnc_cedula: "" });
    loadData();
  }

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div>
      <PageHeader
        title="Clientes"
        actions={
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? "Cancelar" : "Nuevo Cliente"}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre *</label>
              <input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div>
              <label className="label">RNC/Cédula</label>
              <input className="input" value={form.rnc_cedula} onChange={(e) => setForm({ ...form, rnc_cedula: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Dirección</label>
              <textarea className="input" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} rows={2} />
            </div>
          </div>
          <div className="mt-4">
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>RNC/Cédula</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.nombre}</td>
                <td>{c.email || "-"}</td>
                <td>{c.telefono || "-"}</td>
                <td>{c.rnc_cedula || "-"}</td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr><td colSpan={4} className="text-center text-gray-500 py-4">No hay clientes registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}