"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SesionForm from "@/components/sesiones/SesionForm";
import { listarSesiones, eliminarSesion, obtenerSesionAbierta } from "@/lib/services/sesiones.service";
import { ServiceError } from "@/lib/services/supabase-service";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { SesionConUsuario } from "@/lib/types/sesiones";
import { Plus, XCircle, Trash2, Clock } from "lucide-react";

export default function SesionesPage() {
  const [data, setData] = useState<SesionConUsuario[]>([]);
  const [sesionAbierta, setSesionAbierta] = useState<SesionConUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [empresaId, setEmpresaId] = useState<string>("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSesion, setModalSesion] = useState<SesionConUsuario | null>(null);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sesionToDelete, setSesionToDelete] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const perfil = await obtenerPerfilActual();
      if (!perfil) {
        throw new Error("No se pudo obtener el perfil de usuario");
      }
      setEmpresaId(perfil.empresa_id);
      
      const [sesiones, abierta] = await Promise.all([
        listarSesiones(perfil.empresa_id),
        obtenerSesionAbierta(perfil.empresa_id),
      ]);
      setData(sesiones);
      setSesionAbierta(abierta);
    } catch (err) {
      setError(
        err instanceof Error ? err : new ServiceError("UNKNOWN", "Error al cargar sesiones")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  const handleAbrirSesion = () => {
    setModalSesion(null);
    setModalOpen(true);
  };

  const handleCerrarSesion = (sesion: SesionConUsuario) => {
    setModalSesion(sesion);
    setModalOpen(true);
  };

  const handleEliminar = async (id: string) => {
    setSesionToDelete(id);
    setConfirmOpen(true);
  };

  const confirmarEliminar = async () => {
    if (sesionToDelete) {
      await eliminarSesion(sesionToDelete, empresaId);
      cargarDatos();
      setSesionToDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Sesiones"
        actions={
          <div className="flex items-center gap-2">
            {sesionAbierta ? (
              <button
                onClick={() => handleCerrarSesion(sesionAbierta)}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                <XCircle size={16} />
                Cerrar Sesión
              </button>
            ) : (
              <button
                onClick={handleAbrirSesion}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Plus size={16} />
                Abrir Sesión
              </button>
            )}
          </div>
        }
      />

      {/* Sesión activa banner */}
      {sesionAbierta && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2 text-green-600">
              <Clock size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Sesión Activa</p>
              <p className="text-xs text-green-600">
                Abierta: {new Date(sesionAbierta.fecha_apertura).toLocaleString("es-DO")}
                {" · "}
                Total inicial: ${Number(sesionAbierta.total_inicial).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {data.length === 0 ? (
        <EmptyState
          title="No hay sesiones registradas"
          description="Abre una sesión de trabajo o caja para comenzar."
          action={
            <button
              onClick={handleAbrirSesion}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={16} />
              Abrir Sesión
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Apertura</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cierre</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total Inicial</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total Final</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Observaciones</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((sesion) => (
                <tr key={sesion.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        sesion.estado === "abierta"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {sesion.estado === "abierta" ? "Abierta" : "Cerrada"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {new Date(sesion.fecha_apertura).toLocaleString("es-DO")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {sesion.fecha_cierre
                      ? new Date(sesion.fecha_cierre).toLocaleString("es-DO")
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                    ${Number(sesion.total_inicial).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                    {sesion.total_final !== null
                      ? `$${Number(sesion.total_final).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="max-w-[200px] truncate px-6 py-4 text-sm text-gray-500">
                    {sesion.observaciones || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    {sesion.estado === "cerrada" && (
                      <button
                        onClick={() => handleEliminar(sesion.id)}
                        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SesionForm
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setModalSesion(null); }}
        onSuccess={cargarDatos}
        sesion={modalSesion}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setSesionToDelete(null); }}
        onConfirm={confirmarEliminar}
        title="Eliminar Sesión"
        message="¿Estás seguro de eliminar esta sesión? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}