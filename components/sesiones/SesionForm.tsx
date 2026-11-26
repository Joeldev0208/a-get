"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import SubmitButton from "@/components/ui/SubmitButton";
import { abrirSesion, cerrarSesion } from "@/lib/services/sesiones.service";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import type { SesionConUsuario } from "@/lib/types/sesiones";

interface SesionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sesion?: SesionConUsuario | null;
}

export default function SesionForm({ isOpen, onClose, onSuccess, sesion }: SesionFormProps) {
  const { t, i18n: i18nInstance } = useTranslation();
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

      const perfil = await obtenerPerfilActual();
      if (!perfil) {
        throw new Error(t("configuracion.noProfile"));
      }

      if (esApertura) {
        await abrirSesion(perfil.empresa_id, {
          total_inicial: Number(totalInicial) || 0,
          observaciones: observaciones.trim() || null,
        });
      } else if (esCierre) {
        await cerrarSesion(sesion.id, perfil.empresa_id, {
          total_final: Number(totalFinal) || 0,
          observaciones: observaciones.trim() || null,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || t("common.unexpected"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esApertura ? t("sesiones.openSession") : t("sesiones.closeSession")}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {esApertura && (
          <FormField
            label={t("sesiones.initialAmount")}
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
              <p className="font-medium">Session started:</p>
              <p className="mt-1">
                {new Date(sesion.fecha_apertura).toLocaleString(
                  i18nInstance.language === "en" ? "en-US" : "es-DO",
                  {
                    dateStyle: "long",
                    timeStyle: "short",
                  }
                )}
              </p>
              <p className="mt-1">
                {t("sesiones.initialAmount")}:{" "}
                <strong>${Number(sesion.total_inicial).toFixed(2)}</strong>
              </p>
            </div>

            <FormField
              label={t("sesiones.finalAmount")}
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
            {t("sesiones.observations")}
          </label>
          <textarea
            name="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Optional notes..."
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
          text={esApertura ? t("sesiones.openSession") : t("sesiones.closeSession")}
        />
      </form>
    </Modal>
  );
}