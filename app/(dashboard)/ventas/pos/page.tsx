"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { listarProductos } from "@/lib/services/inventario";
import { listarClientes } from "@/lib/services/facturacion";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { Producto } from "@/lib/types/inventario";
import type { Cliente } from "@/lib/types/facturacion";
import { Search, Plus, Minus, Trash2, ShoppingCart, Printer } from "lucide-react";

interface CarritoItem {
  producto: Producto;
  cantidad: number;
  total: number;
}

// ── Generar código de carrito ───────────────────────────────────
function generarCodigoCarrito(): string {
  const prefix = "CLI3103";
  const ultimoNumero = parseInt(localStorage.getItem("ultimo_codigo_pos") || "139", 10);
  const nuevoNumero = ultimoNumero + 3;
  localStorage.setItem("ultimo_codigo_pos", nuevoNumero.toString());
  return `${prefix}${nuevoNumero}`;
}

// ── Imprimir ticket ────────────────────────────────────────────
function imprimirTicket(factura: any, carritoItems: CarritoItem[], clienteNombre: string) {
  const printWindow = window.open("", "_blank", "width=320,height=600");
  if (!printWindow) return;

  const fecha = new Date().toLocaleString("es-DO");
  const subtotal = carritoItems.reduce((s, i) => s + i.total, 0);
  const impuesto = subtotal * 0.18;
  const total = subtotal + impuesto;

  const itemsHtml = carritoItems
    .map(
      (i) =>
        `<tr>
          <td style="text-align:left">${i.producto.codigo}</td>
          <td style="text-align:left">${i.producto.nombre}</td>
          <td style="text-align:center">${i.cantidad}</td>
          <td style="text-align:right">$${i.total.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 76mm; margin: 0; padding: 5mm; }
          h2 { text-align: center; margin: 0 0 5px; font-size: 16px; }
          .center { text-align: center; }
          hr { border: none; border-top: 1px dashed #333; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { font-size: 10px; text-align: left; border-bottom: 1px solid #333; padding: 4px 0; }
          td { padding: 2px 0; }
          .total-row td { font-weight: bold; border-top: 1px solid #333; padding-top: 4px; }
          .gracias { text-align: center; margin-top: 10px; font-size: 11px; }
        </style>
      </head>
      <body>
        <h2>AGET - EMPRESA</h2>
        <p class="center" style="margin:0;font-size:10px">Factura: ${factura?.numero || "N/A"}</p>
        <p class="center" style="margin:0;font-size:10px">Cliente: ${clienteNombre}</p>
        <p class="center" style="margin:0;font-size:10px">Fecha: ${fecha}</p>
        <hr/>
        <table>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Total</th>
          </tr>
          ${itemsHtml}
          <tr class="total-row">
            <td colspan="3" style="text-align:right">Subtotal:</td>
            <td style="text-align:right">$${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align:right">ITBIS (18%):</td>
            <td style="text-align:right">$${impuesto.toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td colspan="3" style="text-align:right">TOTAL:</td>
            <td style="text-align:right">$${total.toFixed(2)}</td>
          </tr>
        </table>
        <hr/>
        <p class="gracias">¡Gracias por su compra!</p>
        <script>window.print(); window.close();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export default function PosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [codigoCarrito, setCodigoCarrito] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const perfil = await obtenerPerfilActual();
      if (!perfil) return;
      setEmpresaId(perfil.empresa_id);
      const [prods, clts] = await Promise.all([
        listarProductos(perfil.empresa_id),
        listarClientes(perfil.empresa_id),
      ]);
      setProductos(prods);
      setClientes(clts);
      setCodigoCarrito(generarCodigoCarrito());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filteredProductos = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(producto: Producto) {
    setCarrito((prev) => {
      const exist = prev.find((item) => item.producto.id === producto.id);
      if (exist) {
        return prev.map((item) =>
          item.producto.id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                total: (item.cantidad + 1) * item.producto.precio_venta,
              }
            : item
        );
      }
      return [
        ...prev,
        { producto, cantidad: 1, total: producto.precio_venta },
      ];
    });
  }

  function updateCantidad(productoId: string, delta: number) {
    setCarrito((prev) =>
      prev
        .map((item) =>
          item.producto.id === productoId
            ? {
                ...item,
                cantidad: Math.max(1, item.cantidad + delta),
                total:
                  Math.max(1, item.cantidad + delta) * item.producto.precio_venta,
              }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  }

  function removeFromCart(productoId: string) {
    setCarrito((prev) => prev.filter((item) => item.producto.id !== productoId));
  }

  const subtotal = carrito.reduce((sum, item) => sum + item.total, 0);
  const impuesto = subtotal * 0.18;
  const total = subtotal + impuesto;

  async function handleCheckout() {
    if (carrito.length === 0) return alert("Agrega productos al carrito");
    if (!clienteId) return alert("Selecciona un cliente");

    try {
      const { crearFactura } = await import("@/lib/services/facturacion");
      const factura = await crearFactura(empresaId, {
        cliente_id: clienteId,
        subtotal,
        impuesto,
        total,
        detalles: carrito.map((item) => ({
          producto_id: item.producto.id,
          descripcion: item.producto.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.producto.precio_venta,
          total: item.total,
        })),
      });

      // Obtener nombre del cliente para el ticket
      const clienteSel = clientes.find((c) => c.id === clienteId);

      // Imprimir ticket
      imprimirTicket(factura, carrito, clienteSel?.nombre || "Cliente");

      alert(`Factura #${factura.numero} creada exitosamente`);

      // Reset carrito y generar nuevo código
      setCarrito([]);
      setClienteId("");
      setCodigoCarrito(generarCodigoCarrito());
    } catch (e: any) {
      alert(`Error al crear factura: ${e.message}`);
    }
  }

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
      {/* Panel izquierdo - Productos */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              className="input pl-10"
              placeholder="Buscar producto por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-3 content-start">
          {filteredProductos.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="card p-3 text-left hover:border-blue-400 hover:shadow-md transition-all cursor-pointer text-center"
            >
              <div className="text-xs text-gray-400 mb-1">{p.codigo}</div>
              <div className="font-medium text-sm mb-1 line-clamp-2">{p.nombre}</div>
              <div className="text-lg font-bold text-blue-600">${p.precio_venta.toFixed(2)}</div>
              <div className="text-xs text-gray-400 mt-1">Stock: {p.stock}</div>
            </button>
          ))}
          {filteredProductos.length === 0 && (
            <div className="col-span-3 text-center text-gray-400 py-8">
              No se encontraron productos
            </div>
          )}
        </div>
      </div>

      {/* Panel derecho - Carrito */}
      <div className="w-96 flex flex-col bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart size={20} />
          <h3 className="font-semibold text-lg">Carrito</h3>
          <span className="text-sm text-gray-500 ml-auto">
            {carrito.length} items
          </span>
        </div>

        {/* Código de carrito */}
        {codigoCarrito && (
          <div className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-center text-sm font-mono font-bold text-blue-700">
            Código: {codigoCarrito}
          </div>
        )}

        {/* Selector de cliente */}
        <select
          className="input mb-4"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
        >
          <option value="">Seleccionar cliente...</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        {/* Items del carrito */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {carrito.map((item) => (
            <div
              key={item.producto.id}
              className="flex items-center gap-2 p-2 rounded bg-gray-50"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.producto.nombre}</div>
                <div className="text-xs text-gray-500">
                  ${item.producto.precio_venta.toFixed(2)} c/u
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateCantidad(item.producto.id, -1)}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-medium text-sm">
                  {item.cantidad}
                </span>
                <button
                  onClick={() => updateCantidad(item.producto.id, 1)}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="w-20 text-right text-sm font-medium">
                ${item.total.toFixed(2)}
              </div>
              <button
                onClick={() => removeFromCart(item.producto.id)}
                className="p-1 rounded hover:bg-red-100 text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {carrito.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              Carrito vacío. Selecciona productos.
            </div>
          )}
        </div>

        {/* Totales */}
        <div className="border-t pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">ITBIS (18%)</span>
            <span>${impuesto.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-blue-600">${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={carrito.length === 0}
          className="btn btn-primary w-full mt-4 py-3 text-lg disabled:opacity-50"
        >
          Cobrar ${total.toFixed(2)}
        </button>
      </div>
    </div>
  );
}