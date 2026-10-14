"use client";

import React, { createContext, useContext } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import type { SupportedLanguage, TranslationParams } from "@/lib/i18n";

interface LanguageContextType {
  language: SupportedLanguage;
  /** Locale for Intl/toLocale* calls, e.g. "fil-PH". */
  locale: string;
  isFilipino: boolean;
  isEnglish: boolean;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
  t: (keyOrPhrase: string, params?: TranslationParams, fallback?: string) => string;
  getLanguageLabel: (lang?: SupportedLanguage) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const languageState = useLanguage();

  return (
    <LanguageContext.Provider value={languageState}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Translates its text child. Lets server components render translated text:
 *   <T>Monthly rent</T>   or   <T params={{ count }}>{"{count} units"}</T>
 */
export function T({ children, params }: { children: string; params?: TranslationParams }) {
  const { t } = useLanguageContext();
  return <>{t(children, params)}</>;
}

/** Shorthand for components that only need the translator. */
export function useT() {
  return useLanguageContext().t;
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  const hookFallback = useLanguage();
  return context || hookFallback;
}
