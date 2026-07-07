"use client";

import { useState, useRef } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { importarProductosCSV } from "@/lib/services/inventario";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { ProductoCSV } from "@/lib/types/inventario";
import { Upload, FileSpreadsheet, Check, AlertTriangle, Loader2 } from "lucide-react";

// ── Función para convertir CSV a JSON ────────────────────────
function csvToJson(csvContent: string): ProductoCSV[] {
  const lines = csvContent.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/['"]/g, ""));
    const obj: Record<string, string> = {};
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
      stock: parseInt(obj.stock || "0", 10),
    };
  });
}

type Paso = "subir" | "preview" | "resultado";

export default function CsvPage() {
  const [paso, setPaso] = useState<Paso>("subir");
  const [data, setData] = useState<ProductoCSV[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ insertados: number; errores: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Paso 1: Subir archivo ──────────────────────────────────
  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setError(null);
    setNombreArchivo(file.name);

    try {
      const text = await file.text();
      const parsed = csvToJson(text);

      if (parsed.length === 0) {
        setError("El archivo no contiene datos válidos. Verifica que tenga encabezados y al menos una fila.");
        return;
      }

      // Validar campos obligatorios
      const invalidos = parsed.filter((p) => !p.codigo || !p.nombre);
      if (invalidos.length > 0) {
        setError(`Hay ${invalidos.length} filas sin código o nombre. Todos los productos deben tener al menos código y nombre.`);
        return;
      }

      setData(parsed);
      setPaso("preview");
    } catch (e: any) {
      setError(`Error al leer el archivo: ${e.message}`);
    }
  };

  // ── Paso 3: Confirmar importación ───────────────────────────
  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

      const perfil = await obtenerPerfilActual();
      if (!perfil) {
        setError("No se pudo obtener el perfil del usuario. Inicia sesión nuevamente.");
        return;
      }

      const res = await importarProductosCSV(perfil.empresa_id, data);
      setResultado(res);
      setPaso("resultado");
    } catch (e: any) {
      setError(`Error al importar: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Reset ──────────────────────────────────────────────────
  const handleReset = () => {
    setPaso("subir");
    setData([]);
    setResultado(null);
    setError(null);
    setNombreArchivo("");
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Editar celda en preview ────────────────────────────────
  const updateField = (index: number, field: keyof ProductoCSV, value: string) => {
    setData((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === "precio_venta" || field === "costo") {
        (item as any)[field] = parseFloat(value) || 0;
      } else if (field === "stock") {
        item.stock = parseInt(value, 10) || 0;
      } else {
        (item as any)[field] = value;
      }

      updated[index] = item;
      return updated;
    });
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Importar Productos (CSV → JSON)" />

      {/* Barra de progreso */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        {(["subir", "preview", "resultado"] as Paso[]).map((p, i) => (
          <div key={p} className="flex items-center gap-2">
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                paso === p
                  ? "bg-blue-600 text-white"
                  : ["subir", "preview"].includes(paso) && i < ["subir", "preview", "resultado"].indexOf(paso)
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {["subir", "preview", "resultado"].indexOf(paso) > i ? <Check size={14} /> : i + 1}
            </span>
            <span className={paso === p ? "font-medium text-gray-900" : "text-gray-400"}>
              {p === "subir" ? "Subir archivo" : p === "preview" ? "Vista previa" : "Resultado"}
            </span>
            {i < 2 && <span className="text-gray-300">→</span>}
          </div>
        ))}
      </div>

      {/* ── PASO 1: Subir ──────────────────────────────────── */}
      {paso === "subir" && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Upload size={28} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Sube tu archivo CSV</h3>
          <p className="mt-1 text-sm text-gray-500">
            El archivo debe tener las columnas:{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">
              codigo, nombre, descripcion, categoria, precio_venta, costo, stock
            </code>
          </p>

          <div className="mt-6 flex flex-col items-center gap-4">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="block w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-400">Formatos aceptados: .csv</p>
          </div>

          {error && (
            <div className="mx-auto mt-4 max-w-md rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PASO 2: Vista Previa ──────────────────────────── */}
      {paso === "preview" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-blue-600" />
              <span className="text-sm font-medium text-gray-700">{nombreArchivo}</span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {data.length} productos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleReset} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Confirmar Importación
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">#</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Código</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Nombre</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Descripción</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Categoría</th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Precio Venta</th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Costo</th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2">
                      <input
                        value={item.codigo}
                        onChange={(e) => updateField(i, "codigo", e.target.value)}
                        className="w-24 rounded border border-gray-200 px-1.5 py-1 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={item.nombre}
                        onChange={(e) => updateField(i, "nombre", e.target.value)}
                        className="w-36 rounded border border-gray-200 px-1.5 py-1 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={item.descripcion}
                        onChange={(e) => updateField(i, "descripcion", e.target.value)}
                        className="w-32 rounded border border-gray-200 px-1.5 py-1 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={item.categoria}
                        onChange={(e) => updateField(i, "categoria", e.target.value)}
                        className="w-28 rounded border border-gray-200 px-1.5 py-1 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.precio_venta}
                        onChange={(e) => updateField(i, "precio_venta", e.target.value)}
                        className="w-20 rounded border border-gray-200 px-1.5 py-1 text-right text-sm focus:border-blue-500 focus:outline-none"
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.costo}
                        onChange={(e) => updateField(i, "costo", e.target.value)}
                        className="w-20 rounded border border-gray-200 px-1.5 py-1 text-right text-sm focus:border-blue-500 focus:outline-none"
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.stock}
                        onChange={(e) => updateField(i, "stock", e.target.value)}
                        className="w-16 rounded border border-gray-200 px-1.5 py-1 text-right text-sm focus:border-blue-500 focus:outline-none"
                        min="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            Puedes editar los valores directamente en la tabla antes de confirmar la importación.
          </p>
        </div>
      )}

      {/* ── PASO 3: Resultado ──────────────────────────────── */}
      {paso === "resultado" && resultado && (
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check size={28} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Importación Completada</h3>
            <p className="mt-1 text-sm text-gray-500">
              Se procesaron {resultado.insertados + resultado.errores.length} productos
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{resultado.insertados}</p>
              <p className="text-sm text-green-600">Insertados correctamente</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{resultado.errores.length}</p>
              <p className="text-sm text-red-600">Con errores</p>
            </div>
          </div>

          {resultado.errores.length > 0 && (
            <div className="mt-4 rounded-lg bg-red-50 p-4">
              <p className="mb-2 text-sm font-medium text-red-700">Detalles de errores:</p>
              <ul className="max-h-32 space-y-1 overflow-y-auto">
                {resultado.errores.map((e, i) => (
                  <li key={i} className="text-xs text-red-600">
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 text-center">
            <button onClick={handleReset} className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Importar otro archivo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}