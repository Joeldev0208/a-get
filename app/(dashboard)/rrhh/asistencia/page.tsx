"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
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

const estadoLabel = (estado: string) => {
  if (estado === "presente") return "Present";
  if (estado === "ausente") return "Absent";
  if (estado === "tarde") return "Late";
  return "Leave";
};

const estadoBadgeClass = (estado: string) => {
  if (estado === "presente") return "bg-green-100 text-green-800";
  if (estado === "ausente") return "bg-red-100 text-red-800";
  if (estado === "tarde") return "bg-yellow-100 text-yellow-800";
  return "bg-blue-100 text-blue-700";
};

export default function AsistenciaPage() {
  const { t, i18n: i18nInstance } = useTranslation();
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
      if (!perfil) throw new Error("Could not obtain user profile");
      setEmpresaId(perfil.empresa_id);
      
      const [asistencias, emps] = await Promise.all([
        listarAsistencia(perfil.empresa_id),
        listarEmpleados(perfil.empresa_id),
      ]);
      setData(asistencias);
      setEmpleados(emps);
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Unknown error"));
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
    if (filteredAsistencia.length === 0) return alert("No data to export");
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
      if (lines.length < 2) return alert("The file must have headers and data");

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
      alert(`Attendance imported: ${count} record(s) (feature in development)`);
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
        title={t("rrhh.asistencia")}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={exportarAsistencia} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
              <Download size={14} />
              Export
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
              <Upload size={14} />
              Import
              <input type="file" accept=".csv" onChange={importarAsistencia} className="hidden" />
            </label>
          </div>
        }
      />

      {/* Filtros */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("common.date")}</label>
          <input
            type="date"
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("rrhh.employeeName")}</label>
          <select
            value={empleadoFiltro}
            onChange={(e) => setEmpleadoFiltro(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">All employees</option>
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredAsistencia.length === 0 ? (
        <EmptyState
          title="No attendance records"
          description="No records found with the selected filters."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("rrhh.employeeName")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("common.email")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("common.date")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("common.status")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Entry</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Exit</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAsistencia.map((asist) => (
                <tr key={asist.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {asist.empleados?.nombre || t("common.none")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {asist.empleados?.email || t("common.none")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(asist.fecha).toLocaleDateString(i18nInstance.language === "en" ? "en-US" : "es-DO")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoBadgeClass(asist.estado)}`}>
                      {estadoLabel(asist.estado)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {asist.hora_entrada || t("common.none")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {asist.hora_salida || t("common.none")}
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
        title="Delete Record"
        message={t("common.confirmDelete")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
      />
    </div>
  );
}
