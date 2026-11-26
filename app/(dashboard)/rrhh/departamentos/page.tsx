"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import {
  listarDepartamentos, crearDepartamento, actualizarDepartamento, eliminarDepartamento
} from "@/lib/services/rrhh.service";
import { ServiceError } from "@/lib/services/supabase-service";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { Departamento } from "@/lib/types/rrhh";
import { Plus, Pencil, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// ── Formulario de Departamento (Crear / Editar) ─────────────────
interface DepartamentoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  empresaId: string;
  departamento?: Departamento | null;
}

function DepartamentoForm({ isOpen, onClose, onSuccess, empresaId, departamento }: DepartamentoFormProps) {
  const { t } = useTranslation();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esEdicion = !!departamento;

  useEffect(() => {
    if (isOpen) {
      setNombre(departamento?.nombre || "");
      setDescripcion(departamento?.descripcion || "");
      setError(null);
    }
  }, [isOpen, departamento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError(t("auth.nameRequired")); return; }

    try {
      setLoading(true);
      setError(null);
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
      };

      if (esEdicion && departamento) {
        await actualizarDepartamento(departamento.id, empresaId, payload);
      } else {
        await crearDepartamento(empresaId, payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error saving department");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esEdicion ? "Edit Department" : t("rrhh.addDepartment")} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={t("common.name")} name="nombre" value={nombre} onChange={setNombre} required placeholder="Department name" />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Optional description..."
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text={esEdicion ? "Update Department" : "Create Department"} />
      </form>
    </Modal>
  );
}

// ── Botón wrapper: Nuevo ────────────────────────────────────────
function NuevoDeptoBtn({ onSuccess, empresaId }: { onSuccess: () => void; empresaId: string }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
        <Plus size={16} />
        {t("rrhh.addDepartment")}
      </button>
      <DepartamentoForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} empresaId={empresaId} />
    </>
  );
}

// ── Botón de editar ─────────────────────────────────────────────
function EditarDeptoBtn({ departamento, onSuccess, empresaId }: { departamento: Departamento; onSuccess: () => void; empresaId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600">
        <Pencil size={16} />
      </button>
      <DepartamentoForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} empresaId={empresaId} departamento={departamento} />
    </>
  );
}

// ── Página principal ────────────────────────────────────────────
export default function DepartamentosPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [empresaId, setEmpresaId] = useState<string>("");

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deptoToDelete, setDeptoToDelete] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const perfil = await obtenerPerfilActual();
      if (!perfil) {
        throw new Error("Could not obtain user profile");
      }
      setEmpresaId(perfil.empresa_id);
      
      const deptos = await listarDepartamentos(perfil.empresa_id);
      setData(deptos);
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleEliminar = (id: string) => {
    setDeptoToDelete(id);
    setConfirmOpen(true);
  };

  const confirmarEliminar = async () => {
    if (deptoToDelete) {
      await eliminarDepartamento(deptoToDelete, empresaId);
      cargarDatos();
      setDeptoToDelete(null);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  return (
    <div>
      <PageHeader
        title={t("rrhh.departamentos")}
        actions={
          <NuevoDeptoBtn onSuccess={cargarDatos} empresaId={empresaId} />
        }
      />

      {data.length === 0 ? (
        <EmptyState
          title={t("rrhh.noDepartments")}
          description="Create your first department to start organizing your team."
          action={<NuevoDeptoBtn onSuccess={cargarDatos} empresaId={empresaId} />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("common.name")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((depto) => (
                <tr key={depto.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{depto.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{depto.descripcion || t("common.none")}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <EditarDeptoBtn departamento={depto} onSuccess={cargarDatos} empresaId={empresaId} />
                    <button
                      onClick={() => handleEliminar(depto.id)}
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
        onClose={() => { setConfirmOpen(false); setDeptoToDelete(null); }}
        onConfirm={confirmarEliminar}
        title="Delete Department"
        message={t("common.confirmDelete")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
      />
    </div>
  );
}
