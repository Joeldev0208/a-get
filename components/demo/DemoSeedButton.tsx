"use client";

import React, { useState, useEffect } from "react";
import { seedDemoData } from "@/lib/services/demo.service";
import { obtenerPerfilActual } from "@/lib/services/empresa";
import SubmitButton from "@/components/ui/SubmitButton";
import Loading from "@/components/ui/Loading";

type SeedStatus = "idle" | "success" | "error" | null;

interface DemoSeedButtonProps {
  empresaId?: string;
}

export default function DemoSeedButton({ empresaId: empresaIdProp }: DemoSeedButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<SeedStatus>(null);
  const [message, setMessage] = useState("");
  const [empresaId, setEmpresaId] = useState<string | null>(empresaIdProp ?? null);

  useEffect(() => {
    if (empresaIdProp) {
      setEmpresaId(empresaIdProp);
      return;
    }
    const fetchEmpresaId = async () => {
      try {
        const perfil = await obtenerPerfilActual();
        if (perfil) {
          setEmpresaId(perfil.empresa_id);
        }
      } catch {
        // Silently fail — button will show disabled state
      }
    };
    fetchEmpresaId();
  }, [empresaIdProp]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!empresaId) {
      setStatus("error");
      setMessage("No active company was found. Please log in and select a company first.");
      return;
    }

    setLoading(true);
    setStatus(null);
    setMessage("");

    try {
      await seedDemoData(empresaId);
      setStatus("success");
      setMessage("Demonstration data successfully loaded.");
    } catch {
      setStatus("error");
      setMessage("The demo data could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "success") {
    return (
      <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
        {message}
      </div>
    );
  }

  return (
    <div>
      {status === "error" && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <SubmitButton
          loading={loading}
          text={empresaId ? "Load demo data" : "Loading company..."}
          disabled={!empresaId}
        />
        {loading && <Loading />}
      </form>
    </div>
  );
}
