"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import ErrorBox from "@/components/ui/ErrorBox";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import { crearDepartamento } from "@/lib/services/rrhh.service";
import { ServiceError } from "@/lib/services/supabase-service";
import { listarDepartamentos } from "@/lib/services/rrhh.service";
import type { Departamento } from "@/lib/types/rrhh";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";

// ── Form (sin cambios) ──────────────────────────────────────────────
interface DepartamentoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (depto: Departamento) => void;
}

function DepartamentoForm({ isOpen, onClose, onSuccess }: DepartamentoFormProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }
    try {
      setLoading(true);
      setError(null);
      const depto = await crearDepartamento({ nombre: nombre.trim(), descripcion: descripcion.trim() || null });
      onSuccess(depto);
      onClose();
      setNombre("");
      setDescripcion("");
    } catch (err: any) {
      setError(err.message || "Error al crear departamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Departamento" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nombre" name="nombre" value={nombre} onChange={setNombre} required placeholder="Ej: Recursos Humanos" />
        <FormField label="Descripción" name="descripcion" type="textarea" value={descripcion} onChange={setDescripcion} placeholder="Descripción del departamento (opcional)" />
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text="Crear Departamento" />
      </form>
    </Modal>
  );
}

// ── Botón wrapper: maneja su propio estado ──────────────────────────
function NuevoDepartamentoBtn({ onSuccess }: { onSuccess: (depto: Departamento) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* El botón solo abre el modal */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        <Plus size={16} />
        Nuevo Departamento
      </button>

      {/* El form vive aquí, invisible hasta que isOpen=true */}
      <DepartamentoForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(depto) => {
          onSuccess(depto);
          setIsOpen(false);
        }}
      />
    </>
  );
}

// ── Página principal ────────────────────────────────────────────────
export default function DepartamentosPage() {
  const [data, setData] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const departamentos = await listarDepartamentos();
      setData(departamentos);
    } catch (err) {
      setError(err instanceof Error ? err : new ServiceError("UNKNOWN", "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={cargarDatos} />;

  const handleNuevo = (depto: Departamento) => setData((prev) => [...prev, depto]);

  return (
    <div>
      <PageHeader
        title="Departamentos"
        actions={
          // 👇 Solo el componente wrapper, nada más
          <NuevoDepartamentoBtn onSuccess={handleNuevo} />
        }
      />

      {data.length === 0 ? (
        <EmptyState
          title="No hay departamentos registrados"
          description="Crea departamentos para organizar a tu equipo."
          action={
            // 👇 Reutilizas el mismo componente aquí también
            <NuevoDepartamentoBtn onSuccess={handleNuevo} />
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((departamento) => (
            <div key={departamento.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{departamento.nombre}</h3>
                  {departamento.descripcion && (
                    <p className="mt-1 text-sm text-gray-500">{departamento.descripcion}</p>
                  )}
                </div>
                <div className="ml-4 flex gap-1">
                  <button className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600">
                    <Pencil size={16} />
                  </button>
                  <button className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}