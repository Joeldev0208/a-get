"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ServiceError } from "@/lib/services/supabase-service";
import { listarClientes, crearCliente } from "@/lib/services/facturacion.service";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { Cliente } from "@/lib/types/facturacion";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

// ── Formulario de Cliente ───────────────────────────────────────
interface ClienteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  empresaId: string;
  cliente?: Cliente | null;
}

function ClienteForm({ isOpen, onClose, onSuccess, empresaId, cliente }: ClienteFormProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [rncCedula, setRncCedula] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esEdicion = !!cliente;

  useEffect(() => {
    if (isOpen) {
      setNombre(cliente?.nombre || "");
      setEmail(cliente?.email || "");
      setTelefono(cliente?.telefono || "");
      setDireccion(cliente?.direccion || "");
      setRncCedula(cliente?.rnc_cedula || "");
      setError(null);
    }
  }, [isOpen, cliente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }

    try {
      setLoading(true);
      setError(null);

      if (esEdicion && cliente) {
        const { actualizarCliente } = await import("@/lib/services/facturacion.service");
        await actualizarCliente(cliente.id, empresaId, {
          nombre: nombre.trim(),
          email: email.trim() || null,
          telefono: telefono.trim() || null,
          direccion: direccion.trim() || null,
          rnc_cedula: rncCedula.trim() || null,
        });
      } else {
        await crearCliente(empresaId, {
          nombre: nombre.trim(),
          email: email.trim() || null,
          telefono: telefono.trim() || null,
          direccion: direccion.trim() || null,
          rnc_cedula: rncCedula.trim() || null,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={esEdicion ? "Editar Cliente" : "Nuevo Cliente"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nombre" name="nombre" value={nombre} onChange={setNombre} required placeholder="Nombre completo o empresa" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Email" name="email" type="email" value={email} onChange={setEmail} placeholder="correo@ejemplo.com" />
          <FormField label="Teléfono" name="telefono" value={telefono} onChange={setTelefono} placeholder="809-000-0000" />
          <FormField label="RNC/Cédula" name="rncCedula" value={rncCedula} onChange={setRncCedula} placeholder="000-0000000-0" />
        </div>
        <FormField label="Dirección" name="direccion" type="textarea" value={direccion} onChange={setDireccion} placeholder="Dirección (opcional)" />
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text={esEdicion ? "Actualizar Cliente" : "Crear Cliente"} />
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

// ── Botón Editar ────────────────────────────────────────────────
function EditarClienteBtn({ cliente, onSuccess, empresaId }: { cliente: Cliente; onSuccess: () => void; empresaId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600">
        <Pencil size={16} />
      </button>
      <ClienteForm isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onSuccess} empresaId={empresaId} cliente={cliente} />
    </>
  );
}

// ── Página principal ────────────────────────────────────────────
export default function VentasClientesPage() {
  const [data, setData] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [empresaId, setEmpresaId] = useState<string>("");

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
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
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // Filtro de búsqueda por nombre
  const filteredData = data.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return c.nombre.toLowerCase().includes(term);
  });

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && filteredData.length > 0) {
      const first = filteredData[0];
      const btn = document.querySelector(`[data-cliente-id="${first.id}"]`) as HTMLButtonElement;
      btn?.click();
    }
  };

  const handleEliminar = (id: string) => {
    setClienteToDelete(id);
    setConfirmOpen(true);
  };

  const confirmarEliminar = async () => {
    if (clienteToDelete) {
      try {
        const { eliminarCliente } = await import("@/lib/services/facturacion.service");
        await eliminarCliente(clienteToDelete, empresaId);
        cargarDatos();
      } catch (e: any) {
        alert(`Error al eliminar: ${e.message}`);
      }
      setClienteToDelete(null);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  return (
    <div>
      <PageHeader title="Clientes" actions={<NuevoClienteBtn onSuccess={cargarDatos} empresaId={empresaId} />} />

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nombre... (Enter para editar)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
        {searchTerm && filteredData.length > 0 && (
          <p className="mt-1 text-xs text-gray-400">
            {filteredData.length} resultado(s) — Presiona Enter para editar el primero
          </p>
        )}
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="No hay clientes registrados"
          description="Agrega clientes para empezar a facturar."
          action={<NuevoClienteBtn onSuccess={cargarDatos} empresaId={empresaId} />}
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
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                    No se encontraron clientes con "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredData.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{cliente.nombre}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{cliente.email || "—"}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{cliente.telefono || "—"}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{cliente.rnc_cedula || "—"}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <EditarClienteBtn cliente={cliente} onSuccess={cargarDatos} empresaId={empresaId} />
                      <button
                        data-cliente-id={cliente.id}
                        onClick={() => handleEliminar(cliente.id)}
                        className="ml-1 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setClienteToDelete(null); }}
        onConfirm={confirmarEliminar}
        title="Eliminar Cliente"
        message="¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}