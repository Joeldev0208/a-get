"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Building2, KeyRound, ArrowRight, LogIn } from "lucide-react";
import Auth from "@/components/ui/Auth";
import { useAuth } from "@/components/ui/AuthProvider";
import EmpresaSelector from "@/components/empresa/EmpresaSelector";

export default function LoginPage() {
  const { t } = useTranslation();
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
          <p className="text-sm text-slate-600">{t("common.loading")}</p>
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
          <h1 className="text-3xl font-bold text-slate-900">{t("dashboard.ag")}</h1>
          <p className="mt-2 text-sm text-slate-600">{t("login.subtitle")}</p>
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
