"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Auth from "@/components/ui/Auth";
import EmpresaSelector from "@/components/empresa/EmpresaSelector";
import { useAuth } from "@/components/ui/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setAutenticado(true);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si ya está autenticado, mostrar el selector de empresa
  if (autenticado) {
    return <EmpresaSelector />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">AGET</h1>
          <p className="mt-2 text-sm text-slate-600">Sistema de Gestión PYME</p>
        </div>
        <Auth
          isOpen={true}
          onClose={() => router.push("/")}
          onSuccess={() => setAutenticado(true)}
        />
      </div>
    </div>
  );
}
