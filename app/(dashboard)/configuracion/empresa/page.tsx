"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/layout/PageHeader";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import Loading from "@/components/ui/Loading";
import ErrorBox from "@/components/ui/ErrorBox";
import { ServiceError } from "@/lib/services/supabase-service";
import { obtenerPerfilActual, actualizarEmpresa, obtenerEmpresa, listarPerfiles, actualizarRol } from "@/lib/services/empresa";
import { getRolesLabels, type Empresa, type PerfilUsuario, type RolUsuario } from "@/lib/types/empresa";
import { Save, Building2, Users, ShieldCheck } from "lucide-react";

export default function EmpresaPage() {
  const { t, i18n } = useTranslation();
  const rolesLabels = getRolesLabels(t);
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
        setError(new ServiceError("NO_PROFILE", t("configuracion.noProfile")));
        return;
      }

      setMiRol(perfil.rol);

      if (!perfil.empresa_id) {
        setError(new ServiceError("NO_EMPRESA", t("configuracion.noCompany")));
        return;
      }

      const [empresaData, perfilesData] = await Promise.all([
        obtenerEmpresa(perfil.empresa_id),
        listarPerfiles(perfil.empresa_id),
      ]);

      if (!empresaData) {
        setError(new ServiceError("NO_EMPRESA", t("configuracion.companyNotFound")));
        return;
      }

      setEmpresa(empresaData);
      setPerfiles(perfilesData);
      setNombre(empresaData.nombre);
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", t("configuracion.errorSave")));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSave() {
    if (!empresa) return;
    if (!nombre.trim()) {
      setSaveError(t("configuracion.errorEmptyName"));
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
      setSaveError(err.message || t("configuracion.errorSave"));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeRol(perfilId: string, rol: string) {
    await actualizarRol(perfilId, rol as RolUsuario);
    loadData();
  }

  const dateLocale = (i18n.language ?? "es") === "en" ? "en" : "es";

  if (loading) return <Loading />;

  const isGerente = miRol === "gerente";

  return (
    <div>
      <PageHeader title={t("nav.miEmpresa")} />
      <LanguageSwitcher />

      {error ? (
        <ErrorBox error={error} onRetry={loadData} />
      ) : !empresa ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-8 text-center">
          <p className="text-sm text-yellow-700">{t("configuracion.noCompany")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ── Columna izquierda: Datos de Empresa ────────────── */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Building2 size={20} className="text-blue-600" />
              <h3 className="text-base font-semibold text-gray-800">{t("configuracion.companyData")}</h3>
            </div>

            <div className="space-y-5">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  {t("configuracion.companyNameLabel")}
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder={t("configuracion.companyNamePlaceholder")}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Código Único */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  {t("configuracion.uniqueCode")}
                </label>
                <input
                  type="text"
                  value={empresa.codigo_unico}
                  disabled
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                />
                <p className="text-xs text-gray-400">
                  {t("configuracion.uniqueCodeDescription")}
                </p>
              </div>

              {/* Info de creación */}
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-400">
                  {t("configuracion.createdAt")} {new Date(empresa.created_at).toLocaleDateString(dateLocale, {
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
                  {t("configuracion.companyUpdatedSuccess")}
                </div>
              )}

              {/* Botón guardar */}
              <button
                onClick={handleSave}
                disabled={saving || !nombre.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>

          {/* ── Columna derecha: Usuarios y Roles ──────────────── */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              <h3 className="text-base font-semibold text-gray-800">
                {t("configuracion.users")}
              </h3>
              <span className="ml-auto rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {perfiles.length}
              </span>
            </div>

            {!isGerente && (
              <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                {t("configuracion.onlyManager", { role: <strong>{t("configuracion.roles.gerente")}</strong> })}
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t("common.name")}
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t("common.role")}
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t("common.status")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {perfiles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">
                        {t("configuracion.noUsers")}
                      </td>
                    </tr>
                  ) : (
                    perfiles.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                          {p.nombre || t("configuracion.noName")}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {isGerente ? (
                            <select
                              value={p.rol}
                              onChange={(e) => handleChangeRol(p.id, e.target.value)}
                              className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                            >
                              {Object.entries(rolesLabels).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-sm capitalize text-gray-700">{rolesLabels[p.rol]}</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            p.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {p.activo ? t("common.active") : t("common.inactive")}
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
                {t("configuracion.clickRole")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
