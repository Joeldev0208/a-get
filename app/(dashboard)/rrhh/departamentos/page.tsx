"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import { listarDepartamentos, crearDepartamento, actualizarDepartamento, eliminarDepartamento } from "@/lib/services/rrhh.service";
import { ServiceError } from "@/lib/services/supabase-service";
import type { Departamento } from "@/lib/types/rrhh";
import { Plus, Pencil, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// ── Formulario Departamento ─────────────────────────────────────
function DepartamentoForm({ isOpen, onClose, onSuccess, departamento }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; departamento?: Departamento | null }) {
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
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }
    try {
      setLoading(true);
      setError(null);
      if (esEdicion) {
        await actualizarDepartamento(departamento!.id, { nombre: nombre.trim(), descripcion: descripcion.trim() || null });
      } else {
        await crearDepartamento({ nombre: nombre.trim(), descripcion: descripcion.trim() || null });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar departamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esEdicion ? "Editar Departamento" : "Nuevo Departamento"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nombre" name="nombre" value={nombre} onChange={setNombre} required placeholder="Ej: Tecnología" />
        <FormField label="Descripción" name="descripcion" type="textarea" value={descripcion} onChange={setDescripcion} placeholder="Descripción (opcional)" />
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text={esEdicion ? "Actualizar" : "Crear"} />
      </form>
    </Modal>
  );
}

// ── Página principal ────────────────────────────────────────────
export default function DepartamentosPage() {
  const [data, setData] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Departamento | null>(null);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmSkipKey, setConfirmSkipKey] = useState("");
  const [deptoToDelete, setDeptoToDelete] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const deptos = await listarDepartamentos();
      setData(deptos);
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  const handleNuevo = () => { setEditing(null); setIsOpen(true); };
  const handleEditar = (d: Departamento) => { setEditing(d); setIsOpen(true); };
  const handleClose = () => { setIsOpen(false); setEditing(null); };
  const handleSuccess = () => { cargarDatos(); };

  const handleEliminar = async (id: string) => {
    const skipKey = "aget_confirm_skip_departamento";
    if (localStorage.getItem(skipKey) === "true") {
      await eliminarDepartamento(id);
      cargarDatos();
      return;
    }
    setConfirmTitle("Eliminar Departamento");
    setConfirmMessage("¿Estás seguro de eliminar este departamento? Esta acción no se puede deshacer.");
    setConfirmSkipKey(skipKey);
    setDeptoToDelete(id);
    setConfirmOpen(true);
  };

  const confirmarEliminar = async () => {
    if (deptoToDelete) {
      await eliminarDepartamento(deptoToDelete);
      cargarDatos();
      setDeptoToDelete(null);
    }
  };

  return (
    <div>
      <PageHeader title="Departamentos" actions={
        <button onClick={handleNuevo} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
          <Plus size={16} /> Nuevo Departamento
        </button>
      } />

      {data.length === 0 ? (
        <EmptyState title="No hay departamentos" description="Crea tu primer departamento para organizar tu equipo." action={
          <button onClick={handleNuevo} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><Plus size={16} /> Nuevo Departamento</button>
        } />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Descripción</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{d.nombre}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{d.descripcion || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button onClick={() => handleEditar(d)} className="mr-2 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"><Pencil size={16} /></button>
                    <button onClick={() => handleEliminar(d.id)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"><Trash2 size={16} /></button>
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
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        skipKey={confirmSkipKey}
      />

      <DepartamentoForm isOpen={isOpen} onClose={handleClose} onSuccess={handleSuccess} departamento={editing} />
    </div>
  );
}