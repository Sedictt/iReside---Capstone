"use client";

import { useSyncExternalStore, useCallback, useEffect } from "react";
import {
  translate,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
  type TranslationParams,
} from "@/lib/i18n";

export const LANGUAGE_STORAGE_KEY = "ireside_language";
export const LANGUAGE_CHANGE_EVENT = "ireside-language-change";

// Module-level state to survive storage interruptions and provide instant updates
let currentLanguage: SupportedLanguage = DEFAULT_LANGUAGE;
let isInitialized = false;

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error("[useLanguage] listener error:", e);
    }
  });
}

function readStoredLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === "fil" || stored === "en" ? stored : DEFAULT_LANGUAGE;
  } catch {
    return currentLanguage;
  }
}

function getSnapshot(): SupportedLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "fil" || stored === "en") {
      currentLanguage = stored;
    } else if (!stored && isInitialized) {
      currentLanguage = DEFAULT_LANGUAGE;
    }
  } catch {}
  isInitialized = true;
  return currentLanguage;
}

function getServerSnapshot(): SupportedLanguage {
  return DEFAULT_LANGUAGE;
}

function syncDocumentAttributes(lang: SupportedLanguage) {
  if (typeof document === "undefined") return;
  try {
    document.documentElement.lang = lang;
    document.documentElement.setAttribute("data-language", lang);
  } catch {}
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === LANGUAGE_STORAGE_KEY) {
      const next: SupportedLanguage = e.newValue === "fil" ? "fil" : "en";
      if (currentLanguage !== next) {
        currentLanguage = next;
        syncDocumentAttributes(next);
        notifyListeners();
      }
    }
  };

  const handleCustomEvent = () => {
    const next = readStoredLanguage();
    if (currentLanguage !== next) {
      currentLanguage = next;
      syncDocumentAttributes(next);
      notifyListeners();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleCustomEvent);
  }

  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleCustomEvent);
    }
  };
}

export function setLanguageDirect(lang: SupportedLanguage) {
  currentLanguage = lang;
  syncDocumentAttributes(lang);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.warn("[useLanguage] Failed to persist language to localStorage:", e);
    }
    try {
      window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
    } catch {}
  }
  notifyListeners();
}

export function useLanguage() {
  const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    syncDocumentAttributes(language);
  }, [language]);

  const setLanguage = useCallback((nextLang: SupportedLanguage) => {
    setLanguageDirect(nextLang);
  }, []);

  const toggleLanguage = useCallback(() => {
    const next = language === "fil" ? "en" : "fil";
    setLanguageDirect(next);
  }, [language]);

  const t = useCallback(
    (keyOrPhrase: string, params?: TranslationParams, fallback?: string): string => {
      return translate(keyOrPhrase, language, params, fallback);
    },
    [language]
  );

  const getLanguageLabel = useCallback((lang: SupportedLanguage = language) => {
    const found = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
    return found ? found.name : "English";
  }, [language]);

  return {
    language,
    isFilipino: language === "fil",
    isEnglish: language === "en",
    setLanguage,
    toggleLanguage,
    t,
    getLanguageLabel,
  };
}
