"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Modal from "./Modal";
import FormField from "./FormField";
import SubmitButton from "./SubmitButton";

type Modo = "login" | "registro";

interface AuthProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function Auth({ isOpen, onClose, onSuccess }: AuthProps) {
  const [modo, setModo] = useState<Modo>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setNombre("");
    setError(null);
  };

  const cambiarModo = (nuevoModo: Modo) => {
    setModo(nuevoModo);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) { setError("El email es obligatorio"); return; }
    if (!password || password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (modo === "registro" && !nombre.trim()) { setError("El nombre es obligatorio"); return; }

    try {
      setLoading(true);

      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        onSuccess();
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              nombre: nombre.trim(),
            },
          },
        });
        if (error) throw error;
        alert("Registro exitoso. Ahora puedes iniciar sesión.");
        cambiarModo("login");
      }
    } catch (err: any) {
      setError(err.message || "Error en la autenticación");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión con Google");
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modo === "login" ? "Iniciar Sesión" : "Crear Cuenta"} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {modo === "registro" && (
          <FormField label="Nombre" name="nombre" value={nombre} onChange={setNombre} required placeholder="Tu nombre completo" />
        )}
        <FormField label="Email" name="email" type="email" value={email} onChange={setEmail} required placeholder="correo@ejemplo.com" />
        <FormField label="Contraseña" name="password" type="text" value={password} onChange={setPassword} required placeholder="••••••" />
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text={modo === "login" ? "Iniciar Sesión" : "Registrarse"} />

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">O continúa con</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

        <div className="text-center text-sm">
          {modo === "login" ? (
            <p className="text-gray-600">
              ¿No tienes cuenta?{" "}
              <button type="button" onClick={() => cambiarModo("registro")} className="font-medium text-blue-600 hover:text-blue-500">
                Regístrate
              </button>
            </p>
          ) : (
            <p className="text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <button type="button" onClick={() => cambiarModo("login")} className="font-medium text-blue-600 hover:text-blue-500">
                Inicia sesión
              </button>
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}