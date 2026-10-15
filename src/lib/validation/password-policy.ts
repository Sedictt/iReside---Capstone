/**
 * Password Policy & Strength Estimation
 *
 * Single source of truth for every flow that SETS a password (account claim,
 * settings, reset, recovery). Pure and dependency-free so it is safe on both
 * the client (live meter / inline errors) and the server (final gate).
 *
 * Two layers:
 *  - `getPasswordPolicyError` — the hard rules a password must pass.
 *  - `evaluatePasswordStrength` — an entropy-style estimate for the meter that
 *    penalises repetition, sequences, common passwords and personal info, so
 *    length alone can never produce a "Good" or "Strong" rating.
 *
 * @module lib/validation/password-policy
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt input limit used by Supabase Auth
/** Fewer distinct characters than this is treated as repetitive (e.g. "aabb11"). */
export const PASSWORD_MIN_DISTINCT_CHARS = 4;
/** A single repeated/sequential run at least this long (or covering most of the password) is rejected. */
const MAX_RUN_LENGTH = 6;
const MAX_RUN_SHARE = 0.6;

/** Personal details a password must not be built from. */
export interface PasswordContext {
  name?: string | null;
  email?: string | null;
}

export type PasswordStrengthLabel = "Weak" | "Fair" | "Good" | "Strong";

export interface PasswordStrength {
  /** 0 (empty / trivially guessable) to 4 (strong). */
  score: 0 | 1 | 2 | 3 | 4;
  label: PasswordStrengthLabel;
  /** Tailwind text + bg classes for the meter. */
  color: string;
  /** Estimated guess-entropy in bits after penalties. */
  bits: number;
  checks: {
    hasMinLength: boolean;
    hasLetter: boolean;
    hasNumberOrSymbol: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
    /** Not in the common-password list (after leet/suffix normalisation). */
    isNotCommon: boolean;
    /** Not dominated by repeated characters or keyboard/alphabet sequences. */
    isNotRepetitive: boolean;
    /** Does not contain the user's name or email. */
    isNotPersonal: boolean;
  };
  /** First hard-policy failure, if any. Undefined when the password is acceptable or empty. */
  error?: string;
}

// ---------------------------------------------------------------------------
// Common passwords (lower-case, base form). Checked after stripping a trailing
// run of digits/symbols and decoding leetspeak, so "P@ssw0rd123!" still matches.
// ---------------------------------------------------------------------------
const COMMON_PASSWORDS = new Set([
  "password", "passwort", "passw0rd", "pass", "pwd", "secret", "letmein", "welcome", "admin",
  "administrator", "root", "user", "guest", "login", "default", "changeme", "test", "temp",
  "qwerty", "qwertyuiop", "asdfgh", "asdfghjkl", "zxcvbn", "zxcvbnm", "qazwsx", "1q2w3e4r",
  "123qwe", "iloveyou", "loveyou", "love",
  "monkey", "dragon", "master", "shadow", "sunshine", "princess", "superman", "batman",
  "baseball", "football", "soccer", "basketball", "hockey", "starwars", "pokemon", "trustno",
  "whatever", "freedom", "summer", "winter", "spring", "autumn", "flower", "hunter", "buster",
  "killer", "ranger", "harley", "mustang", "corvette", "ferrari", "cheese", "pepper", "computer",
  "internet", "hello", "hello world", "helloworld", "welcome back", "charlie", "michael",
  "jennifer", "jessica", "ashley", "amanda", "nicole", "daniel", "thomas", "robert", "andrew",
  "matthew", "george", "maggie", "bailey", "tigger", "chelsea", "hannah", "jordan", "access",
  // Product / locale specific
  "ireside", "landlord", "tenant", "renter", "property", "apartment", "condo", "dorm",
  "manila", "philippines", "pilipinas", "pinoy", "mahal", "mahalkita", "mahal kita",
]);

/** Sequences that count as predictable runs (checked forwards and backwards). */
const SEQUENCE_ALPHABETS = [
  "abcdefghijklmnopqrstuvwxyz",
  "0123456789",
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
  "1qaz2wsx3edc4rfv5tgb6yhn7ujm",
];

const LEET_MAP: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b",
  "@": "a", "$": "s", "!": "i", "|": "l", "+": "t", "(": "c",
};

function decodeLeet(value: string): string {
  return value.replace(/[0134578@$!|+(]/g, (ch) => LEET_MAP[ch] ?? ch);
}

function stripAffixes(value: string): string {
  // Remove a trailing run of digits/symbols ("password123!") and leading symbols ("!!admin").
  return value.replace(/[\d\W_]+$/, "").replace(/^[\W_]+/, "");
}

/** Tokens (3+ chars) derived from the user's name and email that a password must not contain. */
function personalTokens(context?: PasswordContext): string[] {
  const tokens = new Set<string>();
  const name = (context?.name ?? "").toLowerCase().trim();
  const email = (context?.email ?? "").toLowerCase().trim();
  if (name) {
    tokens.add(name.replace(/\s+/g, ""));
    for (const part of name.split(/[\s.,'-]+/)) if (part.length >= 3) tokens.add(part);
  }
  if (email) {
    tokens.add(email);
    const local = email.split("@")[0] ?? "";
    if (local.length >= 3) tokens.add(local);
    for (const part of local.split(/[._+-]+/)) if (part.length >= 3) tokens.add(part);
  }
  return [...tokens].filter((t) => t.length >= 3);
}

// ---------------------------------------------------------------------------
// Pattern analysis
// ---------------------------------------------------------------------------

interface RunInfo {
  /** Length of the longest repeated-character or sequential run. */
  longestRun: number;
  /** Characters remaining after collapsing runs (each run counts as 1 + log2(len)). */
  effectiveLength: number;
}

function sequenceStep(a: string, b: string): boolean {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  for (const alphabet of SEQUENCE_ALPHABETS) {
    const ia = alphabet.indexOf(la);
    const ib = alphabet.indexOf(lb);
    if (ia !== -1 && ib !== -1 && Math.abs(ia - ib) === 1) return true;
  }
  return false;
}

function analyseRuns(password: string): RunInfo {
  const chars = [...password];
  if (chars.length === 0) return { longestRun: 0, effectiveLength: 0 };

  let longestRun = 1;
  let effectiveLength = 0;
  let i = 0;
  while (i < chars.length) {
    // Repeated-character run
    let j = i + 1;
    while (j < chars.length && chars[j] === chars[i]) j++;
    let runLength = j - i;
    let kind: "repeat" | "sequence" | "none" = runLength > 1 ? "repeat" : "none";

    if (kind === "none") {
      // Sequential run (abcd, 4321, qwer)
      j = i + 1;
      while (j < chars.length && sequenceStep(chars[j - 1], chars[j])) j++;
      runLength = j - i;
      if (runLength >= 3) kind = "sequence";
      else {
        runLength = 1;
        j = i + 1;
      }
    }

    if (kind === "none") {
      effectiveLength += 1;
    } else {
      // A run of n predictable characters is worth roughly 1 + log2(n) characters of guessing effort.
      effectiveLength += 1 + Math.log2(runLength);
      longestRun = Math.max(longestRun, runLength);
    }
    i = j;
  }
  return { longestRun, effectiveLength };
}

function isRepeatedPattern(password: string): boolean {
  // "abababab" / "123123123": the string is a whole-number repeat of a shorter block.
  if (password.length < 4) return false;
  const doubled = (password + password).slice(1, -1);
  return doubled.includes(password);
}

function isCommonPassword(password: string): boolean {
  const lower = password.toLowerCase();
  const candidates = new Set([
    lower,
    stripAffixes(lower),
    decodeLeet(lower),
    stripAffixes(decodeLeet(lower)),
    decodeLeet(stripAffixes(lower)),
  ]);
  for (const candidate of candidates) {
    if (candidate.length >= 3 && COMMON_PASSWORDS.has(candidate)) return true;
  }
  return false;
}

function containsPersonalInfo(password: string, context?: PasswordContext): boolean {
  const lower = password.toLowerCase();
  const decoded = decodeLeet(lower);
  return personalTokens(context).some((token) => lower.includes(token) || decoded.includes(token));
}

function isRepetitive(password: string): boolean {
  const distinct = new Set([...password]).size;
  if (distinct < PASSWORD_MIN_DISTINCT_CHARS) return true;
  if (isRepeatedPattern(password)) return true;
  const { longestRun } = analyseRuns(password);
  return longestRun >= MAX_RUN_LENGTH || longestRun / password.length >= MAX_RUN_SHARE;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PasswordPolicyOptions {
  label?: string;
  context?: PasswordContext;
}

/**
 * Hard policy. Returns the first failing rule as a user-facing message, or
 * `undefined` when the password is acceptable.
 */
export function getPasswordPolicyError(
  value: unknown,
  { label = "Password", context }: PasswordPolicyOptions = {}
): string | undefined {
  if (value === null || value === undefined || String(value).length === 0) return `${label} is required.`;
  const password = String(value);

  if (password.length < PASSWORD_MIN_LENGTH) return `${label} must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (password.length > PASSWORD_MAX_LENGTH) return `${label} cannot exceed ${PASSWORD_MAX_LENGTH} characters.`;
  if (!/[a-zA-Z]/.test(password) || !/[\d\W_]/.test(password)) {
    return `${label} must include letters and at least one number or symbol.`;
  }
  if (isCommonPassword(password)) {
    return `${label} is too common and easy to guess. Choose something more unique.`;
  }
  if (isRepetitive(password)) {
    return `${label} is too predictable. Avoid repeated characters and runs like "abcdef" or "123456".`;
  }
  if (containsPersonalInfo(password, context)) {
    return `${label} must not contain your name or email address.`;
  }
  return undefined;
}

/**
 * Strength estimate for the live meter. Score is derived from estimated
 * guess-entropy (character variety × effective length after collapsing
 * repeats and sequences), then capped by any policy failure so a password
 * that would be rejected can never display as Good/Strong.
 */
export function evaluatePasswordStrength(
  password: string,
  context?: PasswordContext
): PasswordStrength {
  const value = password ?? "";
  const hasMinLength = value.length >= PASSWORD_MIN_LENGTH;
  const hasLetter = /[a-zA-Z]/.test(value);
  const hasNumberOrSymbol = /[\d\W_]/.test(value);
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^a-zA-Z0-9]/.test(value);
  const isNotCommon = value.length === 0 || !isCommonPassword(value);
  const isNotRepetitive = value.length === 0 || !isRepetitive(value);
  const isNotPersonal = value.length === 0 || !containsPersonalInfo(value, context);

  let bits = 0;
  if (value.length > 0) {
    let charset = 0;
    if (hasLowercase) charset += 26;
    if (hasUppercase) charset += 26;
    if (hasNumber) charset += 10;
    if (hasSymbol) charset += 33;
    const { effectiveLength } = analyseRuns(value);
    bits = effectiveLength * Math.log2(Math.max(charset, 2));

    // Low character diversity means the "charset" is overstated.
    const diversity = new Set([...value]).size / value.length;
    if (diversity < 0.5) bits *= 0.75;

    if (!isNotCommon) bits = Math.min(bits, 10);
    if (!isNotPersonal) bits = Math.min(bits, 20);
    if (!isNotRepetitive) bits = Math.min(bits, 27);
  }

  let score: PasswordStrength["score"];
  if (value.length === 0 || bits < 28) score = 0;
  else if (bits < 36) score = 1;
  else if (bits < 50) score = 2;
  else if (bits < 64) score = 3;
  else score = 4;

  const error = value.length > 0 ? getPasswordPolicyError(value, { context }) : undefined;
  // Anything that fails the hard policy is at best "Weak".
  if (error && score > 1) score = 1;

  let label: PasswordStrengthLabel = "Weak";
  let color = "text-rose-500 bg-rose-500";
  if (score >= 4) {
    label = "Strong";
    color = "text-emerald-500 bg-emerald-500";
  } else if (score === 3) {
    label = "Good";
    color = "text-blue-500 bg-blue-500";
  } else if (score === 2) {
    label = "Fair";
    color = "text-amber-500 bg-amber-500";
  }

  return {
    score,
    label,
    color,
    bits: Math.round(bits),
    checks: {
      hasMinLength,
      hasLetter,
      hasNumberOrSymbol,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSymbol,
      isNotCommon,
      isNotRepetitive,
      isNotPersonal,
    },
    error,
  };
}
