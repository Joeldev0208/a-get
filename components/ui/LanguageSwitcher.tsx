"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { SupportedLanguage } from "@/lib/i18n";
import { obtenerPerfilActual, actualizarIdiomaUsuario } from "@/lib/services/empresa";

const LANGUAGE_STORAGE_KEY = "aget-language";

const languageOptions: { value: SupportedLanguage; labelKey: string }[] = [
  { value: "es", labelKey: "language.spanish" },
  { value: "en", labelKey: "language.english" },
];

/**
 * LanguageSwitcher
 *
 * Dropdown para cambiar el idioma de la UI entre español (es) e inglés (en).
 * Persiste la elección en localStorage y, cuando hay sesión, también en la
 * base de datos (columna `idioma` de `perfiles_usuario`) para que el idioma
 * viaje con el usuario y se aplique desde el inicio.
 */
export default function LanguageSwitcher() {
  const { t, i18n: i18nInstance } = useTranslation();

  const currentLanguage = (i18nInstance.language ?? "en") as SupportedLanguage;

  // Restaurar idioma guardado al montar (cliente only)
  useEffect(() => {
    let cancelled = false;

    const initLanguage = async () => {
      try {
        const perfil = await obtenerPerfilActual();
        const dbLanguage = perfil?.idioma;
        const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);

        // Prioridad: idioma guardado con el usuario (BD) > localStorage > default "en"
        const language: SupportedLanguage =
          dbLanguage === "es" || dbLanguage === "en"
            ? dbLanguage
            : saved === "es" || saved === "en"
              ? saved
              : "en";

        if (!cancelled) {
          await i18nInstance.changeLanguage(language);
          localStorage.setItem(LANGUAGE_STORAGE_KEY, language);

          // Persistir "desde el principio" con el usuario si aún no tiene idioma en BD
          if (perfil && !perfil.idioma) {
            await actualizarIdiomaUsuario(perfil.id, language);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[LanguageSwitcher] Failed to init language:", err);
        }
      }
    };

    initLanguage();
    return () => {
      cancelled = true;
    };
  }, [i18nInstance]);

  const handleChangeLanguage = async (language: SupportedLanguage) => {
    try {
      await i18nInstance.changeLanguage(language);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);

      // Guardar con el usuario
      const perfil = await obtenerPerfilActual();
      if (perfil) {
        await actualizarIdiomaUsuario(perfil.id, language);
      }
    } catch (err) {
      console.error("[LanguageSwitcher] Failed to change language:", err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {t("language.label")}
      </span>
      <select
        value={currentLanguage}
        onChange={(e) =>
          handleChangeLanguage(e.target.value as SupportedLanguage)
        }
        className={cn(
          "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 transition-colors",
          currentLanguage === "en" ? "text-blue-600" : ""
        )}
      >
        {languageOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
}
