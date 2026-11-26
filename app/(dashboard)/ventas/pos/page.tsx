"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import ErrorBox from "@/components/ui/ErrorBox";
import EmptyState from "@/components/ui/EmptyState";
import { listarProductos } from "@/lib/services/inventario";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { Producto } from "@/lib/types/inventario";
import { Search, Plus, Minus, Trash2, ShoppingCart, AlertCircle } from "lucide-react";

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
function imprimirTicket(factura: any, carritoItems: CarritoItem[], lang: string) {
  const printWindow = window.open("", "_blank", "width=320,height=600");
  if (!printWindow) {
    alert("Could not open the print window. Check browser permissions.");
    return;
  }

  const isEn = lang === "en";
  const fecha = new Date().toLocaleString(isEn ? "en-US" : "es-DO");
  const subtotal = carritoItems.reduce((s, i) => s + i.total, 0);
  const impuesto = subtotal * 0.18;
  const total = subtotal + impuesto;

  const itemsHtml = carritoItems
    .map(
      (i) =>
        `<tr>
          <td style="text-align:left">${i.producto.codigo}</td>
          <td style="text-align:left">${isEn ? i.producto.nombre : i.producto.nombre}</td>
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
        <h2>${isEn ? "AGET - COMPANY" : "AGET - EMPRESA"}</h2>
        <p class="center" style="margin:0;font-size:10px">${isEn ? "Invoice:" : "Factura:"} ${factura?.numero || "N/A"}</p>
        <p class="center" style="margin:0;font-size:10px">${isEn ? "Date:" : "Fecha:"} ${fecha}</p>
        <hr/>
        <table>
          <tr>
            <th>${isEn ? "Code" : "Código"}</th>
            <th>${isEn ? "Product" : "Producto"}</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Total</th>
          </tr>
          ${itemsHtml}
          <tr class="total-row">
            <td colspan="3" style="text-align:right">${isEn ? "Subtotal:" : "Subtotal:"}</td>
            <td style="text-align:right">$${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align:right">${isEn ? "Tax (18%):" : "ITBIS (18%):"}</td>
            <td style="text-align:right">$${impuesto.toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td colspan="3" style="text-align:right">${isEn ? "TOTAL:" : "TOTAL:"}</td>
            <td style="text-align:right">$${total.toFixed(2)}</td>
          </tr>
        </table>
        <hr/>
        <p class="gracias">${isEn ? "Thank you for your purchase!" : "¡Gracias por su compra!"}</p>
        <script>window.print(); window.close();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export default function PosPage() {
  const { t, i18n: i18nInstance } = useTranslation();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [search, setSearch] = useState("");
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [empresaId, setEmpresaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [codigoCarrito, setCodigoCarrito] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const perfil = await obtenerPerfilActual();
      if (!perfil) {
        setError("No user profile found. Sign in again.");
        return;
      }

      if (!perfil.empresa_id) {
        setError("You don't have a company assigned.");
        return;
      }

      setEmpresaId(perfil.empresa_id);
      const prods = await listarProductos(perfil.empresa_id);
      setProductos(prods);
      setCodigoCarrito(generarCodigoCarrito());
    } catch (e: any) {
      setError(e.message || "Error loading products");
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
    // Validar que el producto esté activo
    if (!producto.activo) {
      alert("This product is not available");
      return;
    }

    // Validar stock disponible
    if (producto.stock <= 0) {
      alert("Product without stock available");
      return;
    }

    // Validar que no se exceda el stock en el carrito
    const enCarrito = carrito.find((item) => item.producto.id === producto.id);
    const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;

    if (cantidadEnCarrito >= producto.stock) {
      alert(`Maximum stock available: ${producto.stock} units`);
      return;
    }

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
        .map((item) => {
          if (item.producto.id !== productoId) return item;

          const nuevaCantidad = item.cantidad + delta;

          // Validar stock máximo
          if (nuevaCantidad > item.producto.stock) {
            alert(`Maximum stock available: ${item.producto.stock} units`);
            return item;
          }

          // Validar cantidad mínima de 1
          if (nuevaCantidad < 1) return item;

          return {
            ...item,
            cantidad: nuevaCantidad,
            total: nuevaCantidad * item.producto.precio_venta,
          };
        })
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
    if (carrito.length === 0) {
      alert("Add products to cart");
      return;
    }

    if (!empresaId) {
      alert("Error: Company not loaded. Reload the page.");
      return;
    }

    const confirmacion = confirm(`Confirm sale for $${total.toFixed(2)}?`);
    if (!confirmacion) return;

    try {
      setCheckoutLoading(true);

      const { crearFacturaConDetalles, obtenerClientePorDefecto } = await import("@/lib/services/facturacion.service");

      // Obtener o crear cliente "Consumidor Final"
      const cliente = await obtenerClientePorDefecto(empresaId);
      if (!cliente) {
        alert("Error getting default customer");
        return;
      }

      const factura = await crearFacturaConDetalles(empresaId, {
        cliente_id: cliente.id,
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

      // Imprimir ticket
      imprimirTicket(factura, carrito, i18nInstance.language);

      alert(`Invoice #${factura.numero} created successfully`);

      // Reset carrito y generar nuevo código
      setCarrito([]);
      setCodigoCarrito(generarCodigoCarrito());
    } catch (e: any) {
      alert(`Error creating invoice: ${e.message}`);
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading) return <Loading />;

  if (error) {
    return (
      <div>
        <PageHeader title={t("ventas.pos")} />
        <ErrorBox error={new Error(error)} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
      {/* Panel izquierdo - Productos en lista */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Search product by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("inventario.code")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("common.name")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t("inventario.salePrice")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t("inventario.stock")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProductos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-400">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProductos.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="cursor-pointer transition-colors hover:bg-blue-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">{p.codigo}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-blue-600">
                      ${p.precio_venta.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">{p.stock}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel derecho - Carrito */}
      <div className="w-96 flex flex-col bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart size={20} />
          <h3 className="font-semibold text-lg">{t("ventas.cart")}</h3>
          <span className="text-sm text-gray-500 ml-auto">
            {carrito.length} items
          </span>
        </div>

        {/* Código de carrito */}
        {codigoCarrito && (
          <div className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-center text-sm font-mono font-bold text-blue-700">
            {t("inventario.code")}: {codigoCarrito}
          </div>
        )}

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
                  ${item.producto.precio_venta.toFixed(2)} each
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
              Empty cart. Select products.
            </div>
          )}
        </div>

        {/* Totales */}
        <div className="border-t pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t("ventas.subtotal")}</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t("ventas.tax")} (18%)</span>
            <span>${impuesto.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>{t("common.total")}</span>
            <span className="text-blue-600">${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={carrito.length === 0 || checkoutLoading}
          className="w-full mt-4 py-3 text-lg rounded-lg bg-blue-600 font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {checkoutLoading ? "Processing..." : `Charge $${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
