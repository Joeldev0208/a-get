"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { obtenerPerfilActual, listarPerfiles, actualizarRol } from "@/lib/services/empresa";
import { ROLES_LABELS, type PerfilUsuario, type RolUsuario } from "@/lib/types/empresa";

export default function UsuariosPage() {
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

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  const isGerente = miRol === "gerente";

  return (
    <div>
      <PageHeader title="Usuarios y Roles" />

      {!isGerente && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-yellow-800 text-sm">
          Solo los usuarios con rol <strong>Gerente</strong> pueden modificar roles.
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Usuario ID</th>
              <th>Empresa</th>
              <th>Rol</th>
              <th>Estado</th>
              {isGerente && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {perfiles.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-sm">{p.user_id.slice(0, 8)}...</td>
                <td>{p.empresas?.nombre || "-"}</td>
                <td>
                  {isGerente ? (
                    <select
                      className="input text-sm py-1"
                      value={p.rol}
                      onChange={(e) => handleChangeRol(p.id, e.target.value)}
                    >
                      {Object.entries(ROLES_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="capitalize">{ROLES_LABELS[p.rol]}</span>
                  )}
                </td>
                <td>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {p.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                {isGerente && (
                  <td>
                    <span className="text-xs text-gray-400">Click en el rol para cambiar</span>
                  </td>
                )}
              </tr>
            ))}
            {perfiles.length === 0 && (
              <tr><td colSpan={isGerente ? 5 : 4} className="text-center text-gray-500 py-4">No hay usuarios registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}