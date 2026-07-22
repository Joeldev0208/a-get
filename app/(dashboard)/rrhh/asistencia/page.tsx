"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import {
  listarAsistencia, listarEmpleados
} from "@/lib/services/rrhh.service";
import { ServiceError } from "@/lib/services/supabase-service";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { AsistenciaConEmpleado, EmpleadoConDepartamento } from "@/lib/types/rrhh";
import { Download, Upload, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function AsistenciaPage() {
  const [data, setData] = useState<AsistenciaConEmpleado[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoConDepartamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [empresaId, setEmpresaId] = useState<string>("");

  // Filtros
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split("T")[0]);
  const [empleadoFiltro, setEmpleadoFiltro] = useState("");

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [asistenciaToDelete, setAsistenciaToDelete] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const perfil = await obtenerPerfilActual();
      if (!perfil) throw new Error("No se pudo obtener el perfil de usuario");
      setEmpresaId(perfil.empresa_id);
      
      const [asistencias, emps] = await Promise.all([
        listarAsistencia(perfil.empresa_id),
        listarEmpleados(perfil.empresa_id),
      ]);
      setData(asistencias);
      setEmpleados(emps);
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Error desconocido"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // Filtro de asistencia
  const filteredAsistencia = data.filter((a) => {
    if (fechaFiltro && a.fecha !== fechaFiltro) return false;
    if (empleadoFiltro && a.empleado_id !== empleadoFiltro) return false;
    return true;
  });

  const handleEliminar = (id: string) => {
    setAsistenciaToDelete(id);
    setConfirmOpen(true);
  };

  const confirmarEliminar = async () => {
    if (asistenciaToDelete) {
      // Nota: eliminarAsistencia no está implementado en el servicio, pero debería existir
      // Por ahora solo recargamos
      cargarDatos();
      setAsistenciaToDelete(null);
    }
  };

  // ── Exportar Asistencia CSV ───────────────────────────────────
  const exportarAsistencia = () => {
    if (filteredAsistencia.length === 0) return alert("No hay datos para exportar");
    const headers = ["empleado,email,fecha,estado,hora_entrada,hora_salida"];
    const rows = filteredAsistencia.map((a) =>
      `"${a.empleados?.nombre || ""}","${a.empleados?.email || ""}",${a.fecha},${a.estado},${a.hora_entrada || ""},${a.hora_salida || ""}`
    );
    const csv = [...headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asistencia_${fechaFiltro || 'todas'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Importar Asistencia CSV ───────────────────────────────────
  const importarAsistencia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) return alert("El archivo debe tener encabezados y datos");

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
      let count = 0;
      for (const line of lines.slice(1)) {
        const values = line.split(",").map((v) => v.trim().replace(/['"]/g, ""));
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ""; });

        if (obj.empleado && obj.fecha && obj.estado) {
          const emp = empleados.find((e) => e.nombre.toLowerCase() === obj.empleado.toLowerCase());
          if (emp) {
            // Nota: Necesitamos registrarAsistencia con empresa_id
            // Por ahora solo contamos
            count++;
          }
        }
      }
      alert(`Asistencia importada: ${count} registros (función en desarrollo)`);
      cargarDatos();
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  return (
    <div>
      <PageHeader
        title="Asistencia"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={exportarAsistencia} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
              <Download size={14} />
              Exportar
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
              <Upload size={14} />
              Importar
              <input type="file" accept=".csv" onChange={importarAsistencia} className="hidden" />
            </label>
          </div>
        }
      />

      {/* Filtros */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input
            type="date"
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
          <select
            value={empleadoFiltro}
            onChange={(e) => setEmpleadoFiltro(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todos los empleados</option>
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredAsistencia.length === 0 ? (
        <EmptyState
          title="No hay registros de asistencia"
          description="No se encontraron registros con los filtros seleccionados."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Empleado</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Entrada</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Salida</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAsistencia.map((asist) => (
                <tr key={asist.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {asist.empleados?.nombre || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {asist.empleados?.email || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(asist.fecha).toLocaleDateString("es-DO")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      asist.estado === "presente" ? "bg-green-100 text-green-800" :
                      asist.estado === "ausente" ? "bg-red-100 text-red-800" :
                      asist.estado === "tarde" ? "bg-yellow-100 text-yellow-800" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {asist.estado}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {asist.hora_entrada || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {asist.hora_salida || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => handleEliminar(asist.id)}
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
        onClose={() => { setConfirmOpen(false); setAsistenciaToDelete(null); }}
        onConfirm={confirmarEliminar}
        title="Eliminar Registro"
        message="¿Estás seguro de eliminar este registro de asistencia?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}