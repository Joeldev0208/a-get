"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, KeyRound, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/ui/AuthProvider";
import { buscarPerfilActual, crearEmpresa, unirseAEmpresa } from "@/lib/services/empresa";

type Modo = "unirse" | "crear";

export default function EmpresaSelector() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>("unirse");

  // Campos
  const [codigoEmpresa, setCodigoEmpresa] = useState("");
  const [nombreEmpresa, setNombreEmpresa] = useState("");

  // Verificar si el usuario ya tiene perfil/empresa
  useEffect(() => {
    const verificarPerfil = async () => {
      if (!user || authLoading) return;

      try {
        const perfil = await buscarPerfilActual();
        if (perfil) {
          // Usuario ya tiene empresa, redirigir
          router.push("/inicio");
        }
      } catch (err) {
        console.error("Error al verificar perfil:", err);
      }
    };

    verificarPerfil();
  }, [user, authLoading, router]);

  const cambiarModo = () => {
    setModo(modo === "unirse" ? "crear" : "unirse");
    setError(null);
  };

  const handleUnirse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !codigoEmpresa.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const codigo = codigoEmpresa.trim().toUpperCase();
      await unirseAEmpresa(codigo, user.id);

      const perfil = await buscarPerfilActual();
      if (!perfil) {
        setError("Perfil creado pero no se pudo verificar. Intenta iniciar sesión de nuevo.");
        return;
      }

      router.push("/inicio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al unirse a la empresa");
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
        user_id: user.id,
        empresa_id: empresa.id,
        rol: "gerente",
        activo: true,
        nombre: user.email || `Usuario ${user.id.slice(0, 8)}`
      });

      const perfil = await buscarPerfilActual();
      if (!perfil) {
        setError("Empresa creada pero el perfil no se pudo verificar. Intenta iniciar sesión de nuevo.");
        return;
      }

      router.push("/inicio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la empresa");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <Building2 size={28} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Bienvenido a AGET
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {modo === "unirse"
              ? "Ingresa el código de tu empresa para comenzar"
              : "Crea una empresa nueva para tu organización"}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Formulario */}
          {modo === "unirse" ? (
            <form onSubmit={handleUnirse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Código de empresa
                </label>
                <div className="relative">
                  <KeyRound
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={codigoEmpresa}
                    onChange={(e) => setCodigoEmpresa(e.target.value.toUpperCase())}
                    placeholder="AGET-XXXXXX"
                    className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !codigoEmpresa.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uniendo...
                  </>
                ) : (
                  <>
                    Unirse a la empresa
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCrear} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre de la empresa
                </label>
                <div className="relative">
                  <Building2
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={nombreEmpresa}
                    onChange={(e) => setNombreEmpresa(e.target.value)}
                    placeholder="Ej: Mi Empresa SRL"
                    className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !nombreEmpresa.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creando...
                  </>
                ) : (
                  <>
                    Crear empresa
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Toggle modo */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={cambiarModo}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              disabled={loading}
            >
              {modo === "unirse"
                ? "¿No tienes una empresa? Crea una nueva"
                : "¿Ya tienes una empresa? Únete con el código"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
