import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import esTranslations from "@/locales/es/common.json";
import enTranslations from "@/locales/en/common.json";

/**
 * Idiomas soportados por AGET.
 * - es: español (predeterminado)
 * - en: inglés
 */
export const supportedLanguages = ["es", "en"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];
export const defaultLanguage: SupportedLanguage = "en";

const resources = {
  es: { translation: esTranslations },
  en: { translation: enTranslations },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: defaultLanguage,
  supportedLngs: supportedLanguages,
  interpolation: {
    escapeValue: false, // React ya escanea XSS
  },
});

export { i18n };

/**
 * Synchronous translation helper for Server Components (no useTranslation).
 * Resources are loaded at module init, so i18n.t resolves immediately.
 */
export const t = (key: string, options?: any): string => i18n.t(key, options) as string;
