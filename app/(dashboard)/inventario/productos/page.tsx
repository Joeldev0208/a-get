"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { listarProductos, crearProducto, actualizarProducto, eliminarProducto } from "@/lib/services/inventario";
import { listarCategorias, crearCategoria } from "@/lib/services/inventario";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { Producto, Categoria } from "@/lib/types/inventario";

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [empresaId, setEmpresaId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    precio_venta: 0,
    costo: 0,
    stock: 0,
    categoria_id: "",
  });
  const [newCategoria, setNewCategoria] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const perfil = await obtenerPerfilActual();
      if (!perfil) return;
      setEmpresaId(perfil.empresa_id);
      const [prods, cats] = await Promise.all([
        listarProductos(perfil.empresa_id),
        listarCategorias(perfil.empresa_id),
      ]);
      setProductos(prods);
      setCategorias(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ codigo: "", nombre: "", descripcion: "", precio_venta: 0, costo: 0, stock: 0, categoria_id: "" });
    setEditId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editId) {
        await actualizarProducto(editId, { ...form, categoria_id: form.categoria_id || null });
      } else {
        await crearProducto(empresaId, { ...form, categoria_id: form.categoria_id || null });
      }
      resetForm();
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function handleEdit(p: Producto) {
    setForm({
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion || "",
      precio_venta: p.precio_venta,
      costo: p.costo,
      stock: p.stock,
      categoria_id: p.categoria_id || "",
    });
    setEditId(p.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    await eliminarProducto(id);
    loadData();
  }

  async function handleAddCategoria() {
    if (!newCategoria.trim()) return;
    await crearCategoria(empresaId, { nombre: newCategoria });
    setNewCategoria("");
    setCategorias(await listarCategorias(empresaId));
  }

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div>
      <PageHeader
        title="Productos"
        actions={
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn btn-primary">
            {showForm ? "Cancelar" : "Nuevo Producto"}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Código *</label>
              <input className="input" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required />
            </div>
            <div>
              <label className="label">Nombre *</label>
              <input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </div>
            <div className="col-span-2">
              <label className="label">Descripción</label>
              <textarea className="input" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} />
            </div>
            <div>
              <label className="label">Categoría</label>
              <div className="flex gap-2">
                <select className="input flex-1" value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}>
                  <option value="">Sin categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                <input className="input w-32" placeholder="Nueva..." value={newCategoria} onChange={(e) => setNewCategoria(e.target.value)} />
                <button type="button" onClick={handleAddCategoria} className="btn btn-secondary">+</button>
              </div>
            </div>
            <div>
              <label className="label">Precio Venta *</label>
              <input className="input" type="number" step="0.01" value={form.precio_venta} onChange={(e) => setForm({ ...form, precio_venta: parseFloat(e.target.value) })} required />
            </div>
            <div>
              <label className="label">Costo</label>
              <input className="input" type="number" step="0.01" value={form.costo} onChange={(e) => setForm({ ...form, costo: parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className="label">Stock</label>
              <input className="input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="btn btn-primary">{editId ? "Actualizar" : "Guardar"}</button>
            <button type="button" onClick={resetForm} className="btn btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio Venta</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.codigo}</td>
                  <td>{p.nombre}</td>
                  <td>{p.categorias?.nombre || "-"}</td>
                  <td>${p.precio_venta.toFixed(2)}</td>
                  <td>{p.stock}</td>
                  <td className="flex gap-2">
                    <button onClick={() => handleEdit(p)} className="btn btn-sm btn-secondary">Editar</button>
                    <button onClick={() => handleDelete(p.id)} className="btn btn-sm btn-danger">Eliminar</button>
                  </td>
                </tr>
              ))}
              {productos.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-500 py-4">No hay productos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}