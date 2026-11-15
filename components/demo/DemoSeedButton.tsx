"use client";

import React, { useState } from "react";
import { seedDemoData } from "@/lib/services/demo.service";
import SubmitButton from "@/components/ui/SubmitButton";
import Loading from "@/components/ui/Loading";

type SeedStatus = "idle" | "success" | "error" | null;

interface DemoSeedButtonProps {
  empresaId: string;
}

export default function DemoSeedButton({ empresaId }: DemoSeedButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<SeedStatus>(null);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setStatus(null);
    setMessage("");

    try {
      await seedDemoData(empresaId);
      setStatus("success");
      setMessage("Datos de demostración cargados correctamente.");
    } catch {
      setStatus("error");
      setMessage("No se pudieron cargar los datos de demostración. Inténtalo de nuevo.");
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
        <SubmitButton loading={loading} text="Cargar datos de demo" />
        {loading && <Loading />}
      </form>
    </div>
  );
}
