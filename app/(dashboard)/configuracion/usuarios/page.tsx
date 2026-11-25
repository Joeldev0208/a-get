"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/layout/PageHeader";
import { obtenerPerfilActual, listarPerfiles, actualizarRol } from "@/lib/services/empresa";
import { getRolesLabels, type PerfilUsuario, type RolUsuario } from "@/lib/types/empresa";

export default function UsuariosPage() {
  const { t } = useTranslation();
  const rolesLabels = getRolesLabels(t);
  const [perfiles, setPerfiles] = useState<PerfilUsuario[]>([]);
  const [miRol, setMiRol] = useState<RolUsuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const perfil = await obtenerPerfilActual();
    if (!perfil) return;
    setMiRol(perfil.rol);
    setPerfiles(await listarPerfiles(perfil.empresa_id));
    setLoading(false);
  }

  async function handleChangeRol(perfilId: string, rol: string) {
    await actualizarRol(perfilId, rol as RolUsuario);
    loadData();
  }

  if (loading) return <div className="p-8 text-center">{t("common.loading")}</div>;

  const isGerente = miRol === "gerente";

  return (
    <div>
      <PageHeader title={t("configuracion.users")} />

      {!isGerente && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-yellow-800 text-sm">
          {t("configuracion.onlyManager", { role: <strong>{t("configuracion.roles.gerente")}</strong> })}
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{t("common.name")}</th>
              <th>{t("common.company")}</th>
              <th>{t("common.role")}</th>
              <th>{t("common.status")}</th>
              {isGerente && <th>{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody>
            {perfiles.map((p) => (
              <tr key={p.id}>
                <td className="text-sm">{p.nombre || t("configuracion.noName")}</td>
                <td>{p.empresas?.nombre || t("common.none")}</td>
                <td>
                  {isGerente ? (
                    <select
                      className="input text-sm py-1"
                      value={p.rol}
                      onChange={(e) => handleChangeRol(p.id, e.target.value)}
                    >
                      {Object.entries(rolesLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="capitalize">{rolesLabels[p.rol]}</span>
                  )}
                </td>
                <td>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {p.activo ? t("common.active") : t("common.inactive")}
                  </span>
                </td>
                {isGerente && (
                  <td>
                    <span className="text-xs text-gray-400">{t("configuracion.clickRole")}</span>
                  </td>
                )}
              </tr>
            ))}
            {perfiles.length === 0 && (
              <tr><td colSpan={isGerente ? 5 : 4} className="text-center text-gray-500 py-4">{t("configuracion.noUsers")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
