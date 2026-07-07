"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import { abrirSesion, cerrarSesion } from "@/lib/services/sesiones.service";
import type { SesionConUsuario } from "@/lib/types/sesiones";

interface SesionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sesion?: SesionConUsuario | null;
}

export default function SesionForm({ isOpen, onClose, onSuccess, sesion }: SesionFormProps) {
  const [totalInicial, setTotalInicial] = useState("");
  const [totalFinal, setTotalFinal] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esCierre = sesion?.estado === "abierta" && !!sesion;
  const esApertura = !sesion;

  useEffect(() => {
    if (isOpen) {
      setTotalInicial(sesion?.total_inicial ? String(sesion.total_inicial) : "0");
      setTotalFinal("");
      setObservaciones(sesion?.observaciones || "");
      setError(null);
    }
  }, [isOpen, sesion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (esApertura) {
        await abrirSesion({
          total_inicial: Number(totalInicial) || 0,
          observaciones: observaciones.trim() || null,
        });
      } else if (esCierre) {
        await cerrarSesion(sesion.id, {
          total_final: Number(totalFinal) || 0,
          observaciones: observaciones.trim() || null,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al procesar la sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esApertura ? "Abrir Sesión" : "Cerrar Sesión"}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {esApertura && (
          <FormField
            label="Total Inicial"
            name="totalInicial"
            type="number"
            value={totalInicial}
            onChange={setTotalInicial}
            placeholder="0.00"
            min={0}
            step={0.01}
          />
        )}

        {esCierre && (
          <>
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              <p className="font-medium">Sesión iniciada:</p>
              <p className="mt-1">
                {new Date(sesion.fecha_apertura).toLocaleString("es-DO", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </p>
              <p className="mt-1">
                Total inicial: <strong>${Number(sesion.total_inicial).toFixed(2)}</strong>
              </p>
            </div>

            <FormField
              label="Total Final"
              name="totalFinal"
              type="number"
              value={totalFinal}
              onChange={setTotalFinal}
              required
              placeholder="0.00"
              min={0}
              step={0.01}
            />
          </>
        )}

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Observaciones
          </label>
          <textarea
            name="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas opcionales..."
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <SubmitButton
          loading={loading}
          text={esApertura ? "Abrir Sesión" : "Cerrar Sesión"}
        />
      </form>
    </Modal>
  );
}