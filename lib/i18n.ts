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
export const defaultLanguage: SupportedLanguage = "es";

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
