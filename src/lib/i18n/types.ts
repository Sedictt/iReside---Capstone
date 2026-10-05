export type SupportedLanguage = "en" | "fil";

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  description: string;
  badge?: string;
}

export type TranslationDictionary = Record<string, string>;

export interface TranslationParams {
  [key: string]: string | number;
}
