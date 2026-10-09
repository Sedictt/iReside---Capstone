/**
 * Shared Field Rules
 *
 * Pure, framework-agnostic field validators used by both client forms
 * (inline validation) and server routes (via the Zod builders in
 * `./zod-fields`). Every rule returns an error message string when the
 * value is invalid, or `undefined` when it is valid, so they compose
 * directly with `useFormValidation`.
 *
 * Limits mirror the database: money columns are numeric(12,2) / numeric(10,2),
 * lease dates are constrained by `lease_dates_valid` (end_date > start_date).
 *
 * @module lib/validation/rules
 */

import { REGEX_EMAIL, REGEX_NAME, validatePhoneNumber } from "./landlord-settings";
import { getPasswordPolicyError, type PasswordContext } from "./password-policy";

export type FieldRuleResult = string | undefined;

/** Largest amount accepted anywhere money is entered (fits numeric(10,2)). */
export const MAX_MONEY_AMOUNT = 99_999_999.99;

/** Shared text limits so similar fields agree across forms and routes. */
export const TEXT_LIMITS = {
  personName: 70,
  shortText: 120,
  title: 150,
  address: 250,
  description: 2000,
  note: 1000,
  message: 4000,
  reason: 500,
  reference: 100,
  search: 200,
} as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isBlank = (value: unknown) =>
  value === undefined || value === null || (typeof value === "string" && value.trim() === "");

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export interface TextRuleOptions {
  label: string;
  required?: boolean;
  min?: number;
  max?: number;
}

/** Required/optional trimmed text with length bounds. Whitespace-only counts as empty. */
export function textRule(value: unknown, { label, required = false, min, max }: TextRuleOptions): FieldRuleResult {
  if (isBlank(value)) return required ? `${label} is required.` : undefined;
  if (typeof value !== "string") return `${label} must be text.`;
  const trimmed = value.trim();
  if (min !== undefined && trimmed.length < min) return `${label} must be at least ${min} characters.`;
  if (max !== undefined && trimmed.length > max) return `${label} cannot exceed ${max} characters.`;
  return undefined;
}

export function personNameRule(value: unknown, { label = "Full name", required = true } = {}): FieldRuleResult {
  const base = textRule(value, { label, required, min: 2, max: TEXT_LIMITS.personName });
  if (base || isBlank(value)) return base;
  if (!REGEX_NAME.test(String(value).trim())) {
    return `${label} can only contain letters, spaces, hyphens, apostrophes, and periods.`;
  }
  return undefined;
}

export function emailRule(value: unknown, { label = "Email address", required = true } = {}): FieldRuleResult {
  if (isBlank(value)) return required ? `${label} is required.` : undefined;
  const trimmed = String(value).trim();
  if (trimmed.length > 254) return `${label} is too long.`;
  if (!REGEX_EMAIL.test(trimmed)) return "Enter a valid email address (e.g. name@example.com).";
  return undefined;
}

/** Philippine or international phone (7–15 digits). Delegates to the existing settings rule. */
export function phoneRule(value: unknown, { required = false } = {}): FieldRuleResult {
  if (isBlank(value)) return required ? "Phone number is required." : undefined;
  const check = validatePhoneNumber(String(value), required);
  return check.isValid ? undefined : check.error;
}

/**
 * New-password policy shared by the setup wizard, account claim, settings and
 * reset flows. See `./password-policy` for the full rule set (length, letters
 * plus number/symbol, not common, not repetitive, not built from name/email).
 */
export { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "./password-policy";

export function newPasswordRule(
  value: unknown,
  { label = "Password", context }: { label?: string; context?: PasswordContext } = {}
): FieldRuleResult {
  if (isBlank(value)) return `${label} is required.`;
  return getPasswordPolicyError(String(value), { label, context });
}

export function confirmMatchRule(value: unknown, original: unknown, { label = "Passwords" } = {}): FieldRuleResult {
  if (isBlank(value)) return "Please confirm your password.";
  if (value !== original) return `${label} do not match.`;
  return undefined;
}

/** 6-digit numeric one-time code. */
export function otpRule(value: unknown, { length = 6 } = {}): FieldRuleResult {
  if (isBlank(value)) return "Verification code is required.";
  const code = String(value).trim();
  if (!new RegExp(`^\\d{${length}}$`).test(code)) return `Enter the ${length}-digit code.`;
  return undefined;
}

export function httpUrlRule(value: unknown, { label = "URL", required = false } = {}): FieldRuleResult {
  if (isBlank(value)) return required ? `${label} is required.` : undefined;
  try {
    const parsed = new URL(String(value).trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return `${label} must start with http:// or https://.`;
    if (!parsed.hostname.includes(".") && parsed.hostname !== "localhost") return `Enter a valid ${label.toLowerCase()}.`;
    return undefined;
  } catch {
    return `Enter a valid ${label.toLowerCase()}.`;
  }
}

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

/**
 * Converts form input into a number without inventing values:
 * blank → null, malformed → NaN. Commas used as thousands separators are accepted.
 */
export function parseNumericInput(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (isBlank(value)) return null;
  const cleaned = String(value).trim().replace(/,/g, "");
  if (!/^-?\d*\.?\d+$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

export interface MoneyRuleOptions {
  label: string;
  required?: boolean;
  /** Smallest accepted value. Defaults to 0 (zero allowed). */
  min?: number;
  /** When true, zero is rejected (amount must be greater than `min`). */
  positive?: boolean;
  max?: number;
}

/** Peso amount: numeric, max two decimal places, within range. */
export function moneyRule(value: unknown, { label, required = true, min = 0, positive = false, max = MAX_MONEY_AMOUNT }: MoneyRuleOptions): FieldRuleResult {
  const amount = parseNumericInput(value);
  if (amount === null) return required ? `${label} is required.` : undefined;
  if (!Number.isFinite(amount)) return `${label} must be a valid amount.`;
  if (positive && amount <= min) return `${label} must be greater than ₱${min.toLocaleString("en-PH")}.`;
  if (amount < min) return min === 0 ? `${label} cannot be negative.` : `${label} must be at least ₱${min.toLocaleString("en-PH")}.`;
  if (amount > max) return `${label} cannot exceed ₱${max.toLocaleString("en-PH", { maximumFractionDigits: 2 })}.`;
  if (Math.round(amount * 100) / 100 !== amount) return `${label} can have at most 2 decimal places.`;
  return undefined;
}

export interface IntegerRuleOptions {
  label: string;
  required?: boolean;
  min?: number;
  max?: number;
}

/** Whole number within range; rejects decimals rather than truncating them. */
export function integerRule(value: unknown, { label, required = true, min, max }: IntegerRuleOptions): FieldRuleResult {
  const parsed = parseNumericInput(value);
  if (parsed === null) return required ? `${label} is required.` : undefined;
  if (!Number.isFinite(parsed)) return `${label} must be a number.`;
  if (!Number.isInteger(parsed)) return `${label} must be a whole number.`;
  if (min !== undefined && parsed < min) return `${label} must be at least ${min}.`;
  if (max !== undefined && parsed > max) return `${label} cannot exceed ${max}.`;
  return undefined;
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/** True for a real calendar date in YYYY-MM-DD form (rejects 2026-02-30). */
export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Today's date in Asia/Manila as YYYY-MM-DD (the app's business timezone). */
export function todayIsoDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export interface DateRuleOptions {
  label: string;
  required?: boolean;
  /** Inclusive lower bound (YYYY-MM-DD). */
  min?: string;
  minMessage?: string;
  /** Inclusive upper bound (YYYY-MM-DD). */
  max?: string;
  maxMessage?: string;
}

export function dateRule(value: unknown, { label, required = true, min, minMessage, max, maxMessage }: DateRuleOptions): FieldRuleResult {
  if (isBlank(value)) return required ? `${label} is required.` : undefined;
  if (!isValidIsoDate(value)) return `${label} must be a valid date.`;
  if (min && value < min) return minMessage ?? `${label} cannot be before ${min}.`;
  if (max && value > max) return maxMessage ?? `${label} cannot be after ${max}.`;
  return undefined;
}

/**
 * Cross-field: end date relative to start date. `strict` requires end > start
 * (used for leases, which the DB constrains with end_date > start_date).
 */
export function dateRangeRule(
  start: unknown,
  end: unknown,
  { strict = false, endLabel = "End date", startLabel = "start date" } = {},
): FieldRuleResult {
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) return undefined;
  if (strict ? end <= start : end < start) {
    return strict ? `${endLabel} must be after the ${startLabel}.` : `${endLabel} must be on or after the ${startLabel}.`;
  }
  return undefined;
}

/** Cross-field: HH:MM end time after start time on the same day. */
export function timeRangeRule(start: unknown, end: unknown, { endLabel = "End time" } = {}): FieldRuleResult {
  const re = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
  if (typeof start !== "string" || typeof end !== "string" || !re.test(start) || !re.test(end)) return undefined;
  if (end.slice(0, 5) <= start.slice(0, 5)) return `${endLabel} must be after the start time.`;
  return undefined;
}

// ---------------------------------------------------------------------------
// Choice
// ---------------------------------------------------------------------------

export function choiceRule<T extends string>(value: unknown, options: readonly T[], { label, required = true }: { label: string; required?: boolean }): FieldRuleResult {
  if (isBlank(value)) return required ? `Select a ${label.toLowerCase()}.` : undefined;
  if (!options.includes(value as T)) return `Select a valid ${label.toLowerCase()}.`;
  return undefined;
}
