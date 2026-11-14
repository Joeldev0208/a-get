"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, KeyRound, ArrowRight, LogIn } from "lucide-react";
import Auth from "@/components/ui/Auth";
import { crearEmpresa, unirseAEmpresa } from "@/lib/services/empresa";
import { useAuth } from "@/components/ui/AuthProvider";

type Modo = "unirse" | "crear";

function EmpresaModal({ user }: { user: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>("unirse");
  const [codigoEmpresa, setCodigoEmpresa] = useState("");
  const [nombreEmpresa, setNombreEmpresa] = useState("");

  const handleUnirse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !codigoEmpresa.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await unirseAEmpresa(codigoEmpresa.trim().toUpperCase(), user.id);
      router.push("/inicio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !nombreEmpresa.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const empresa = await crearEmpresa({ nombre: nombreEmpresa.trim() });
      const { crearPerfil } = await import("@/lib/services/empresa");
      await crearPerfil({
        user_id: user.id, empresa_id: empresa.id, rol: "gerente", activo: true,
        nombre: user.email || `Usuario ${user.id.slice(0, 8)}`
      });
      router.push("/inicio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200">
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <Building2 size={28} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Bienvenido a AGET</h2>
          <p className="mt-1 text-sm text-gray-500">
            {modo === "unirse" ? "Ingresa el código de tu empresa" : "Crea una empresa nueva"}
          </p>
        </div>
        <div className="px-6 pb-6">
          {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

          {modo === "unirse" ? (
            <form onSubmit={handleUnirse} className="space-y-4">
              <div className="relative">
                <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={codigoEmpresa} onChange={(e) => setCodigoEmpresa(e.target.value.toUpperCase())}
                  placeholder="AGET-XXXXXX" disabled={loading}
                  className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={loading || !codigoEmpresa.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {loading ? "Uniendo..." : <>Unirse <ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCrear} className="space-y-4">
              <div className="relative">
                <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={nombreEmpresa} onChange={(e) => setNombreEmpresa(e.target.value)}
                  placeholder="Ej: Mi Empresa SRL" disabled={loading}
                  className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={loading || !nombreEmpresa.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {loading ? "Creando..." : <>Crear empresa <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          <div className="mt-4 text-center">
            <button type="button" onClick={() => { setModo(modo === "unirse" ? "crear" : "unirse"); setError(null); }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium" disabled={loading}>
              {modo === "unirse" ? "¿Quieres o tienes una empresa sin organizar? Presiona aquí" : "¿Ya tienes una empresa? Únete con el código"}
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <button type="button" onClick={() => router.push("/inicio")}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium">
              <LogIn size={16} /> Ya tengo empresa, ir al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  if (autenticado) {
    return <EmpresaModal user={user} />;
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
