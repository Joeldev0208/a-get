"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import ErrorBox from "@/components/ui/ErrorBox";
import { ServiceError } from "@/lib/services/supabase-service";
import { obtenerPerfilActual, actualizarEmpresa, obtenerEmpresa, listarPerfiles, actualizarRol } from "@/lib/services/empresa";
import { ROLES_LABELS, type Empresa, type PerfilUsuario, type RolUsuario } from "@/lib/types/empresa";
import { Save, Building2, Users, ShieldCheck } from "lucide-react";

export default function EmpresaPage() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [perfiles, setPerfiles] = useState<PerfilUsuario[]>([]);
  const [nombre, setNombre] = useState("");
  const [miRol, setMiRol] = useState<RolUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const perfil = await obtenerPerfilActual();
      if (!perfil) {
        setError(new ServiceError("NO_PROFILE", "No se encontró un perfil de usuario. Inicia sesión nuevamente."));
        return;
      }

      setMiRol(perfil.rol);

      if (!perfil.empresa_id) {
        setError(new ServiceError("NO_EMPRESA", "No tienes una empresa asignada. Contacta al administrador."));
        return;
      }

      const [empresaData, perfilesData] = await Promise.all([
        obtenerEmpresa(perfil.empresa_id),
        listarPerfiles(perfil.empresa_id),
      ]);

      if (!empresaData) {
        setError(new ServiceError("NO_EMPRESA", "No se encontró la empresa en la base de datos."));
        return;
      }

      setEmpresa(empresaData);
      setPerfiles(perfilesData);
      setNombre(empresaData.nombre);
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Error al cargar datos de la empresa"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSave() {
    if (!empresa) return;
    if (!nombre.trim()) {
      setSaveError("El nombre de la empresa no puede estar vacío");
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);
      setSuccess(false);
      await actualizarEmpresa(empresa.id, { nombre: nombre.trim() });
      setEmpresa({ ...empresa, nombre: nombre.trim() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeRol(perfilId: string, rol: string) {
    await actualizarRol(perfilId, rol as RolUsuario);
    loadData();
  }

  if (loading) return <Loading />;

  const isGerente = miRol === "gerente";

  return (
    <div>
      <PageHeader title="Mi Empresa" />

      {error ? (
        <ErrorBox error={error} onRetry={loadData} />
      ) : !empresa ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-8 text-center">
          <p className="text-sm text-yellow-700">No tienes una empresa asignada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ── Columna izquierda: Datos de Empresa ────────────── */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Building2 size={20} className="text-blue-600" />
              <h3 className="text-base font-semibold text-gray-800">Datos de la Empresa</h3>
            </div>

            <div className="space-y-5">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre de tu empresa"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Código Único */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Código Único
                </label>
                <input
                  type="text"
                  value={empresa.codigo_unico}
                  disabled
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                />
                <p className="text-xs text-gray-400">
                  Este código se usa para que los empleados se vinculen a tu empresa
                </p>
              </div>

              {/* Info de creación */}
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-400">
                  Creada el {new Date(empresa.created_at).toLocaleDateString("es-DO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Mensaje de error al guardar */}
              {saveError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {saveError}
                </div>
              )}

              {/* Mensaje de éxito */}
              {success && (
                <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
                  Empresa actualizada correctamente
                </div>
              )}

              {/* Botón guardar */}
              <button
                onClick={handleSave}
                disabled={saving || !nombre.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>

          {/* ── Columna derecha: Usuarios y Roles ──────────────── */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              <h3 className="text-base font-semibold text-gray-800">Usuarios y Roles</h3>
              <span className="ml-auto rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {perfiles.length}
              </span>
            </div>

            {!isGerente && (
              <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                Solo los usuarios con rol <strong>Gerente</strong> pueden modificar roles.
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Rol</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {perfiles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">
                        No hay usuarios registrados
                      </td>
                    </tr>
                  ) : (
                    perfiles.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                          {p.nombre || 'Sin nombre'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {isGerente ? (
                            <select
                              value={p.rol}
                              onChange={(e) => handleChangeRol(p.id, e.target.value)}
                              className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                            >
                              {Object.entries(ROLES_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-sm capitalize text-gray-700">{ROLES_LABELS[p.rol]}</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            p.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {p.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {isGerente && perfiles.length > 0 && (
              <p className="mt-2 text-xs text-gray-400">
                Haz clic en el rol de un usuario para cambiarlo
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}