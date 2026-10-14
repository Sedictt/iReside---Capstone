import type { TranslationDictionary } from "./types";

/**
 * Sentence templates for messages assembled at runtime (validation errors, API errors),
 * e.g. `${label} is required.` — these can't be looked up as exact phrases.
 *
 * Keys are the English template with `{name}` captures; values are the Filipino template.
 * Each captured value is itself translated before substitution, so "Full name is required."
 * becomes "Kailangan ang buong pangalan." when "Full name" is in a dictionary.
 * Use `{name|lower}` in the Filipino value to lowercase the first letter of a translated
 * capture that lands mid-sentence (acronyms such as "OTP" are left alone).
 */
export type PatternDictionary = TranslationDictionary;

interface CompiledPattern {
  regex: RegExp;
  names: string[];
  target: string;
}

const PLACEHOLDER = /\{(\w+)\}/g;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function compilePatterns(patterns: PatternDictionary): CompiledPattern[] {
  const compiled: CompiledPattern[] = [];
  for (const [en, fil] of Object.entries(patterns)) {
    const names: string[] = [];
    let source = "";
    let lastIndex = 0;
    for (const match of en.matchAll(PLACEHOLDER)) {
      source += escapeRegex(en.slice(lastIndex, match.index));
      source += "(.+?)";
      names.push(match[1]);
      lastIndex = (match.index ?? 0) + match[0].length;
    }
    source += escapeRegex(en.slice(lastIndex));
    // A template that is only placeholders would match everything.
    if (names.length === 0 || en.replace(PLACEHOLDER, "").trim() === "") continue;
    compiled.push({ regex: new RegExp(`^${source}$`), names, target: fil });
  }
  // Most specific (longest literal text) first so "{label} is required." loses to longer templates.
  return compiled.sort(
    (a, b) => b.regex.source.replace(/\(\.\+\?\)/g, "").length - a.regex.source.replace(/\(\.\+\?\)/g, "").length,
  );
}

function lowerFirst(value: string): string {
  if (value.length > 1 && value[1] === value[1].toUpperCase() && /[A-Z]/.test(value[1])) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

export function applyPatterns(
  text: string,
  patterns: CompiledPattern[],
  translateCapture: (value: string) => string,
): string | undefined {
  for (const pattern of patterns) {
    const match = pattern.regex.exec(text);
    if (!match) continue;
    const values = new Map<string, string>();
    pattern.names.forEach((name, i) => values.set(name, translateCapture(match[i + 1])));
    return pattern.target.replace(/\{(\w+)(\|lower)?\}/g, (whole, name: string, modifier?: string) => {
      const value = values.get(name);
      if (value === undefined) return whole;
      return modifier ? lowerFirst(value) : value;
    });
  }
  return undefined;
}
