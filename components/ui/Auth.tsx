"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import Modal from "./Modal";
import FormField from "./FormField";
import SubmitButton from "./SubmitButton";

type Modo = "login" | "registro";

interface AuthProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: Modo;
}

export default function Auth({ isOpen, onClose, onSuccess, initialMode = "login" }: AuthProps) {
  const { t } = useTranslation();
  const [modo, setModo] = useState<Modo>(initialMode);
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

    if (!email.trim()) { setError(t("auth.emailRequired")); return; }
    if (!password || password.length < 6) { setError(t("auth.passwordMin")); return; }
    if (modo === "registro" && !nombre.trim()) { setError(t("auth.nameRequired")); return; }

    try {
      setLoading(true);
      setError(null);

      // Timeout de seguridad para evitar "carga infinita"
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(t("auth.error.timeout"))), 15000)
      );

      if (modo === "login") {
        const loginPromise = supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        const { error } = await Promise.race([loginPromise, timeoutPromise]);
        if (error) throw error;
        onSuccess();
      } else {
        const signupPromise = supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              nombre: nombre.trim(),
            },
          },
        });
        const { error } = await Promise.race([signupPromise, timeoutPromise]);
        if (error) throw error;
        alert(t("auth.successRegister"));
        cambiarModo("login");
      }
    } catch (err: any) {
      // Manejo detallado de errores
      const errorMsg = err?.message || "";
      const errorCode = err?.code || "";
      const errorStatus = err?.status || "";

      if (err?.name === "TimeoutError" || errorMsg.includes(t("auth.error.timeout"))) {
        setError(t("auth.error.timeout"));
      } else if (err?.name === "AuthRetryableFetchError" || errorMsg.includes("fetch") || errorMsg.includes("network") || errorMsg.includes("ERR_NAME_NOT_RESOLVED")) {
        setError(t("auth.error.network"));
      } else if (errorMsg.includes("Invalid login credentials")) {
        setError(t("auth.error.invalidCredentials"));
      } else if (errorMsg.includes("Email not confirmed")) {
        setError(t("auth.error.emailNotConfirmed"));
      } else if (errorMsg.includes("rate_limit") || errorMsg.includes("429") || errorStatus === 429) {
        setError(t("auth.error.rateLimit"));
      } else if (errorCode === "validation_failed") {
        setError(t("auth.error.validation"));
      } else {
        setError(err?.message || t("auth.error.unexpected"));
      }
      console.error("Auth error detallado:", err);
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
      setError(err.message || t("auth.error.google"));
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modo === "login" ? t("auth.loginTitle") : t("auth.registerTitle")} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {modo === "registro" && (
          <FormField label={t("auth.name")} name="nombre" value={nombre} onChange={setNombre} required placeholder={t("auth.namePlaceholder")} />
        )}
        <FormField label={t("auth.email")} name="email" type="email" value={email} onChange={setEmail} required placeholder={t("auth.emailPlaceholder")} />
        <FormField label={t("auth.password")} name="password" type="password" value={password} onChange={setPassword} required placeholder={t("auth.passwordPlaceholder")} />
        {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <SubmitButton loading={loading} text={modo === "login" ? t("auth.loginButton") : t("auth.registerButton")} />

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">{t("auth.orContinue")}</span>
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
          {t("auth.googleButton")}
        </button>

        <div className="text-center text-sm">
          {modo === "login" ? (
            <p className="text-gray-600">
              {t("auth.noAccount")}{" "}
              <button type="button" onClick={() => cambiarModo("registro")} className="font-medium text-blue-600 hover:text-blue-500">
                {t("auth.registerLink")}
              </button>
            </p>
          ) : (
            <p className="text-gray-600">
              {t("auth.haveAccount")}{" "}
              <button type="button" onClick={() => cambiarModo("login")} className="font-medium text-blue-600 hover:text-blue-500">
                {t("auth.loginLink")}
              </button>
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
