"use client";

import { useState, useRef } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { importarProductosCSV } from "@/lib/services/inventario";
import { listarProductos } from "@/lib/services/inventario";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { Producto } from "@/lib/types/inventario";

export default function CsvPage() {
  const [empresaId, setEmpresaId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ insertados: number; errores: string[] } | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) return alert("Selecciona un archivo CSV");

    const perfil = await obtenerPerfilActual();
    if (!perfil) return;
    setEmpresaId(perfil.empresa_id);

    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return alert("El archivo debe tener encabezados y al menos un producto");

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const data = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const obj: any = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] || "";
      });
      return {
        codigo: obj.codigo || obj.código || "",
        nombre: obj.nombre || "",
        descripcion: obj.descripcion || "",
        categoria: obj.categoria || obj.categoría || "",
        precio_venta: parseFloat(obj.precio_venta || obj["precio venta"] || "0"),
        costo: parseFloat(obj.costo || "0"),
        stock: parseInt(obj.stock || "0"),
      };
    });

    setLoading(true);
    const res = await importarProductosCSV(perfil.empresa_id, data);
    setResultado(res);
    setProductos(await listarProductos(perfil.empresa_id));
    setLoading(false);
  }

  function exportCSV() {
    if (productos.length === 0) return alert("No hay productos para exportar");
    const headers = ["codigo,nombre,descripcion,categoria,precio_venta,costo,stock"];
    const rows = productos.map((p) =>
      `${p.codigo},"${p.nombre}","${p.descripcion || ""}","${p.categorias?.nombre || ""}",${p.precio_venta},${p.costo},${p.stock}`
    );
    const csv = [...headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "productos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader title="Importar / Exportar CSV" />

      <div className="grid grid-cols-2 gap-6">
        {/* Importar */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Importar Productos</h3>
          <p className="text-sm text-gray-500 mb-4">
            El archivo CSV debe tener las columnas: <code>codigo, nombre, descripcion, categoria, precio_venta, costo, stock</code>
          </p>
          <input ref={fileRef} type="file" accept=".csv" className="mb-4 block w-full text-sm" />
          <button onClick={handleImport} disabled={loading} className="btn btn-primary">
            {loading ? "Importando..." : "Importar CSV"}
          </button>

          {resultado && (
            <div className="mt-4 p-3 rounded bg-gray-50">
              <p className="text-green-600 font-medium">✓ {resultado.insertados} productos insertados</p>
              {resultado.errores.length > 0 && (
                <div className="mt-2">
                  <p className="text-red-600 font-medium">Errores ({resultado.errores.length}):</p>
                  <ul className="text-sm text-red-500 list-disc pl-4">
                    {resultado.errores.slice(0, 5).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Exportar */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Exportar Productos</h3>
          <p className="text-sm text-gray-500 mb-4">
            Descarga todos los productos en formato CSV para editarlos o respaldarlos.
          </p>
          <button onClick={exportCSV} className="btn btn-secondary">
            Exportar CSV
          </button>
        </div>
      </div>
    </div>
  );
}