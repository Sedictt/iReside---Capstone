"use client";

import React, { createContext, useContext } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import type { SupportedLanguage, TranslationParams } from "@/lib/i18n";

interface LanguageContextType {
  language: SupportedLanguage;
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

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  const hookFallback = useLanguage();
  return context || hookFallback;
}
