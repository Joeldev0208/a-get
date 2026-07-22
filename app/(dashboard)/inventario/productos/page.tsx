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
import { listarProductos, crearProducto, actualizarProducto, eliminarProducto, listarCategorias, crearCategoria } from "@/lib/services/inventario";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import { ServiceError } from "@/lib/services/supabase-service";
import type { Producto, Categoria } from "@/lib/types/inventario";
import type { RolUsuario } from "@/lib/types/empresa";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

// ── Formulario de Producto (Crear / Editar) ─────────────────
interface ProductoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categorias: Categoria[];
  empresaId: string;
  producto?: Producto | null;
}

function ProductoForm({ isOpen, onClose, onSuccess, categorias, empresaId, producto }: ProductoFormProps) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [costo, setCosto] = useState("");
  const [stock, setStock] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [newCategoria, setNewCategoria] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esEdicion = !!producto;

  useEffect(() => {
    if (isOpen) {
      setCodigo(producto?.codigo || "");
      setNombre(producto?.nombre || "");
      setDescripcion(producto?.descripcion || "");
      setPrecioVenta(producto?.precio_venta ? String(producto.precio_venta) : "");
      setCosto(producto?.costo ? String(producto.costo) : "");
      setStock(producto?.stock ? String(producto.stock) : "0");
      setCategoriaId(producto?.categoria_id || "");
      setNewCategoria("");
      setError(null);
    }
  }, [isOpen, producto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) { setError("El código es obligatorio"); return; }
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }

    try {
      setLoading(true);
      setError(null);

      // Crear categoría nueva si se especificó
      let finalCategoriaId = categoriaId;
      if (newCategoria.trim()) {
        const cat = await crearCategoria(empresaId, { nombre: newCategoria.trim() });
        finalCategoriaId = cat.id;
      }

      const payload = {
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        precio_venta: Number(precioVenta) || 0,
        costo: Number(costo) || 0,
        stock: parseInt(stock) || 0,
        categoria_id: finalCategoriaId || null,
      };

      if (esEdicion) {
        await actualizarProducto(producto!.id, empresaId, payload);
      } else {
        await crearProducto(empresaId, payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar producto");
    } finally {
      setLoading(false);
    }
  };

  const catOptions = categorias.map((c) => ({ value: c.id, label: c.nombre }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esEdicion ? "Editar Producto" : "Nuevo Producto"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Código *" name="codigo" value={codigo} onChange={setCodigo} required placeholder="Ej: PRO-001" />
          <FormField label="Nombre *" name="nombre" value={nombre} onChange={setNombre} required placeholder="Nombre del producto" />
          <div className="sm:col-span-2">
            <FormField label="Descripción" name="descripcion" value={descripcion} onChange={setDescripcion} placeholder="Descripción opcional" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Categoría</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                value={newCategoria}
                onChange={(e) => setNewCategoria(e.target.value)}
                placeholder="Nueva categoría..."
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <FormField label="Precio Venta *" name="precioVenta" type="number" value={precioVenta} onChange={setPrecioVenta} required placeholder="0.00" min={0} step={0.01} />
          <FormField label="Costo" name="costo" type="number" value={costo} onChange={setCosto} placeholder="0.00" min={0} step={0.01} />
          <FormField label="Stock" name="stock" type="number" value={stock} onChange={setStock} placeholder="0" min={0} />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
        )}

        <SubmitButton loading={loading} text={esEdicion ? "Actualizar Producto" : "Crear Producto"} />
      </form>
    </Modal>
  );
}

// ── Botón Nuevo ────────────────────────────────────────────────
function NuevoProductoBtn({ onSuccess, categorias, empresaId }: { onSuccess: () => void; categorias: Categoria[]; empresaId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
        <Plus size={16} />
        Nuevo Producto
      </button>
      <ProductoForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} categorias={categorias} empresaId={empresaId} />
    </>
  );
}

// ── Botón Editar ────────────────────────────────────────────────
function EditarProductoBtn({ producto, onSuccess, categorias, empresaId }: { producto: Producto; onSuccess: () => void; categorias: Categoria[]; empresaId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600">
        <Pencil size={16} />
      </button>
      <ProductoForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} categorias={categorias} empresaId={empresaId} producto={producto} />
    </>
  );
}

// ── Página principal ────────────────────────────────────────────
export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [empresaId, setEmpresaId] = useState("");
  const [rol, setRol] = useState<RolUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Búsqueda
  const [searchTerm, setSearchTerm] = useState("");

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState<string | null>(null);

  const puedeEditar = rol === "inventario" || rol === "gerente";

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const perfil = await obtenerPerfilActual();
      if (!perfil) return;
      setEmpresaId(perfil.empresa_id);
      setRol(perfil.rol);
      const [prods, cats] = await Promise.all([
        listarProductos(perfil.empresa_id),
        listarCategorias(perfil.empresa_id),
      ]);
      setProductos(prods);
      setCategorias(cats);
    } catch (err) {
      setError(
        err instanceof Error ? err : new ServiceError("UNKNOWN", "Error al cargar productos")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // Filtro de búsqueda
  const filteredProductos = productos.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(term) ||
      p.codigo.toLowerCase().includes(term)
    );
  });

  // Enter abre modal de edición del primer resultado
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && filteredProductos.length > 0) {
      // Disparar click en el botón de editar del primer resultado
      const firstResult = filteredProductos[0];
      // Buscamos el botón y lo clickeamos
      const btn = document.querySelector(`[data-product-id="${firstResult.id}"]`) as HTMLButtonElement;
      btn?.click();
    }
  };

  const handleEliminar = async (id: string) => {
    setProductoToDelete(id);
    setConfirmOpen(true);
  };

  const confirmarEliminar = async () => {
    if (productoToDelete) {
      await eliminarProducto(productoToDelete, empresaId);
      cargarDatos();
      setProductoToDelete(null);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  return (
    <div>
      <PageHeader
        title="Productos"
        actions={
          puedeEditar ? (
            <NuevoProductoBtn onSuccess={cargarDatos} categorias={categorias} empresaId={empresaId} />
          ) : undefined
        }
      />

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nombre o código del producto... (Enter para editar)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
        {searchTerm && filteredProductos.length > 0 && (
          <p className="mt-1 text-xs text-gray-400">
            {filteredProductos.length} resultado(s) — Presiona Enter para editar el primero
          </p>
        )}
      </div>

      {productos.length === 0 ? (
        <EmptyState
          title="No hay productos registrados"
          description="Crea tu primer producto para comenzar a gestionar tu inventario."
          action={
            puedeEditar ? (
              <NuevoProductoBtn onSuccess={cargarDatos} categorias={categorias} empresaId={empresaId} />
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Vista Desktop: Tabla */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Categoría</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Precio Venta</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Costo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Stock</th>
                  {puedeEditar && (
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProductos.length === 0 ? (
                  <tr>
                    <td colSpan={puedeEditar ? 7 : 6} className="px-6 py-12 text-center text-sm text-gray-400">
                      No se encontraron productos con "{searchTerm}"
                    </td>
                  </tr>
                ) : (
                  filteredProductos.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{p.codigo}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{p.nombre}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{p.categorias?.nombre || "—"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">${p.precio_venta.toFixed(2)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">${p.costo.toFixed(2)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <span className={p.stock <= 5 ? "font-medium text-red-600" : "text-gray-900"}>
                          {p.stock}
                        </span>
                      </td>
                      {puedeEditar && (
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                          <EditarProductoBtn producto={p} onSuccess={cargarDatos} categorias={categorias} empresaId={empresaId} />
                          <button
                            data-product-id={p.id}
                            onClick={() => handleEliminar(p.id)}
                            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Vista Mobile: Cards */}
          <div className="sm:hidden space-y-3">
            {filteredProductos.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
                No se encontraron productos con "{searchTerm}"
              </div>
            ) : (
              filteredProductos.map((p) => (
                <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{p.nombre}</p>
                      <p className="text-xs text-gray-400">{p.codigo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">${p.precio_venta.toFixed(2)}</p>
                      <p className={`text-xs ${p.stock <= 5 ? "text-red-500 font-medium" : "text-gray-400"}`}>
                        Stock: {p.stock}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                    <span className="text-xs text-gray-500">{p.categorias?.nombre || "Sin categoría"}</span>
                    {puedeEditar && (
                      <div className="flex items-center gap-1">
                        <EditarProductoBtn producto={p} onSuccess={cargarDatos} categorias={categorias} empresaId={empresaId} />
                        <button
                          onClick={() => handleEliminar(p.id)}
                          className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          style={{ minHeight: 44, minWidth: 44 }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setProductoToDelete(null); }}
        onConfirm={confirmarEliminar}
        title="Eliminar Producto"
        message="¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}