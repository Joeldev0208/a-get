"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { SupportedLanguage } from "@/lib/i18n";

const LANGUAGE_STORAGE_KEY = "aget-language";

/**
 * LanguageSwitcher
 *
 * Segmented control (button group) to switch the UI language between
 * Spanish (es) and English (en). Persists the choice in localStorage so it
 * survives page reloads.
 */
export default function LanguageSwitcher() {
  const { t, i18n: i18nInstance } = useTranslation();

  const currentLanguage = (i18nInstance.language ??
    "es") as SupportedLanguage;

  // Restore saved language on mount (only on client)
  useEffect(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "es" || saved === "en") {
      i18nInstance.changeLanguage(saved);
    }
  }, [i18nInstance]);

  const handleChangeLanguage = async (language: SupportedLanguage) => {
    try {
      await i18nInstance.changeLanguage(language);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (err) {
      console.error("[LanguageSwitcher] Failed to change language:", err);
    }
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1">
      <button
        type="button"
        onClick={() => handleChangeLanguage("es")}
        aria-pressed={currentLanguage === "es"}
        className={cn(
          "rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
          currentLanguage === "es"
            ? "bg-blue-600 text-white shadow-sm"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        )}
      >
        {t("language.spanish")}
      </button>
      <button
        type="button"
        onClick={() => handleChangeLanguage("en")}
        aria-pressed={currentLanguage === "en"}
        className={cn(
          "rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
          currentLanguage === "en"
            ? "bg-blue-600 text-white shadow-sm"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        )}
      >
        {t("language.english")}
      </button>
    </div>
  );
}
