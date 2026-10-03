import { enDictionary } from "./dictionaries/en";
import { filDictionary } from "./dictionaries/fil";
import type { SupportedLanguage, LanguageInfo, TranslationParams } from "./types";

export * from "./types";
export { enDictionary } from "./dictionaries/en";
export { filDictionary } from "./dictionaries/fil";

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    description: "Standard English interface",
  },
  {
    code: "fil",
    name: "Filipino",
    nativeName: "Filipino (Taglish)",
    description: "Everyday conversational Filipino used in daily life",
    badge: "Pang-araw-araw",
  },
];

const DICTIONARIES: Record<SupportedLanguage, Record<string, string>> = {
  en: enDictionary,
  fil: filDictionary,
};

/**
 * Translates a key or English phrase into the target language.
 * If language is 'fil' and a direct phrase or dot-notated key is found,
 * it returns the conversational Filipino equivalent.
 * 
 * Supports template substitution via params:
 * translate("Kamusta, {name}!", "fil", { name: "Juan" })
 */
export function translate(
  keyOrPhrase: string,
  lang: SupportedLanguage = DEFAULT_LANGUAGE,
  params?: TranslationParams,
  fallback?: string
): string {
  if (!keyOrPhrase) return "";

  const dict = DICTIONARIES[lang] || DICTIONARIES.en;
  let translated = dict[keyOrPhrase];

  // If not found in target dictionary and not English, check English dict for key lookup
  if (translated === undefined && lang !== "en") {
    // If keyOrPhrase was a dot notation (e.g. "nav.dashboard"), fallback to English translation
    if (DICTIONARIES.en[keyOrPhrase] !== undefined) {
      translated = DICTIONARIES.en[keyOrPhrase];
    }
  }

  // If still not found, use fallback or the original string
  if (translated === undefined) {
    translated = fallback !== undefined ? fallback : keyOrPhrase;
  }

  // Handle variable substitutions if provided
  if (params && Object.keys(params).length > 0) {
    return Object.entries(params).reduce((str, [paramKey, paramVal]) => {
      return str.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
    }, translated);
  }

  return translated;
}
