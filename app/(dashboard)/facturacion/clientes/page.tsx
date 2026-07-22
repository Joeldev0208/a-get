"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import { ServiceError } from "@/lib/services/supabase-service";
import { listarClientes, crearCliente } from "@/lib/services/facturacion.service";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { Cliente } from "@/lib/types/facturacion";
import { Plus, Pencil, Trash2 } from "lucide-react";

// ── Formulario de Cliente ───────────────────────────────────────
interface ClienteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  empresaId: string;
}

function ClienteForm({ isOpen, onClose, onSuccess, empresaId }: ClienteFormProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [rncCedula, setRncCedula] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setNombre("");
    setEmail("");
    setTelefono("");
    setDireccion("");
    setRncCedula("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }

    try {
      setLoading(true);
      setError(null);
      await crearCliente(empresaId, {
        nombre: nombre.trim(),
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        direccion: direccion.trim() || null,
        rnc_cedula: rncCedula.trim() || null,
      });
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Error al crear cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Cliente" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nombre" name="nombre" value={nombre} onChange={setNombre} required placeholder="Nombre completo o empresa" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Email" name="email" type="email" value={email} onChange={setEmail} placeholder="correo@ejemplo.com" />
          <FormField label="Teléfono" name="telefono" value={telefono} onChange={setTelefono} placeholder="809-000-0000" />
          <FormField label="RNC/Cédula" name="rncCedula" value={rncCedula} onChange={setRncCedula} placeholder="000-0000000-0" />
        </div>
        <FormField label="Dirección" name="direccion" type="textarea" value={direccion} onChange={setDireccion} placeholder="Dirección (opcional)" />
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text="Crear Cliente" />
      </form>
    </Modal>
  );
}

// ── Botón wrapper ───────────────────────────────────────────────
function NuevoClienteBtn({ onSuccess, empresaId }: { onSuccess: () => void; empresaId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
        <Plus size={16} />
        Nuevo Cliente
      </button>
      <ClienteForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} empresaId={empresaId} />
    </>
  );
}

// ── Página principal ────────────────────────────────────────────
export default function ClientesPage() {
  const [data, setData] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [empresaId, setEmpresaId] = useState<string>("");

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const perfil = await obtenerPerfilActual();
      if (!perfil) throw new Error("No se pudo obtener el perfil de usuario");
      setEmpresaId(perfil.empresa_id);
      const clientes = await listarClientes(perfil.empresa_id);
      setData(clientes);
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  const handleNuevo = () => cargarDatos();

  return (
    <div>
      <PageHeader title="Clientes" actions={<NuevoClienteBtn onSuccess={handleNuevo} empresaId={empresaId} />} />

      {data.length === 0 ? (
        <EmptyState
          title="No hay clientes registrados"
          description="Agrega clientes para empezar a facturar."
          action={<NuevoClienteBtn onSuccess={handleNuevo} empresaId={empresaId} />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">RNC/Cédula</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{cliente.nombre}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{cliente.email || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{cliente.telefono || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{cliente.rnc_cedula || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button className="mr-2 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"><Pencil size={16} /></button>
                    <button className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}