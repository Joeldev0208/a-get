"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { obtenerPerfilActual, actualizarEmpresa } from "@/lib/services/empresa";
import type { Empresa } from "@/lib/types/empresa";

export default function EmpresaPage() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const perfil = await obtenerPerfilActual();
    if (!perfil?.empresas) return;
    setEmpresa(perfil.empresas as any);
    setNombre((perfil.empresas as any).nombre);
    setLoading(false);
  }

  async function handleSave() {
    if (!empresa) return;
    setSaving(true);
    await actualizarEmpresa(empresa.id, { nombre });
    setSaving(false);
    alert("Empresa actualizada");
  }

  if (loading) return <div className="p-8 text-center">Cargando...</div>;
  if (!empresa) return <div className="p-8 text-center">No tienes una empresa asignada</div>;

  return (
    <div>
      <PageHeader title="Mi Empresa" />

      <div className="card max-w-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="label">Nombre de la Empresa</label>
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="label">Código Único</label>
            <input className="input bg-gray-50" value={empresa.codigo_unico} disabled />
            <p className="text-xs text-gray-500 mt-1">
              Este código se usa para que los empleados se vinculen a tu empresa
            </p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}