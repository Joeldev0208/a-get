"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import { crearDepartamento } from "@/lib/services/rrhh.service";
import type { Departamento } from "@/lib/types/rrhh";

interface DepartamentoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (depto: Departamento) => void;
  empresaId: string;
}

export default function DepartamentoForm({
  isOpen,
  onClose,
  onSuccess,
  empresaId,
}: DepartamentoFormProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const depto = await crearDepartamento(empresaId, { nombre: nombre.trim(), descripcion: descripcion.trim() || null });
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
        <FormField
          label="Nombre"
          name="nombre"
          value={nombre}
          onChange={setNombre}
          required
          placeholder="Ej: Recursos Humanos"
        />
        <FormField
          label="Descripción"
          name="descripcion"
          type="textarea"
          value={descripcion}
          onChange={setDescripcion}
          placeholder="Descripción del departamento (opcional)"
        />
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}
        <SubmitButton loading={loading} text="Crear Departamento" />
      </form>
    </Modal>
  );
}