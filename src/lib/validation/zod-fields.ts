/**
 * Zod field builders backed by the shared rules in `./rules`, so a route's
 * server-side schema rejects exactly what the matching form flags inline —
 * with the same message.
 *
 * @module lib/validation/zod-fields
 */

import { z } from "zod";
import {
  MAX_MONEY_AMOUNT,
  dateRule,
  emailRule,
  integerRule,
  isValidIsoDate,
  moneyRule,
  newPasswordRule,
  parseNumericInput,
  personNameRule,
  phoneRule,
  type DateRuleOptions,
} from "./rules";

/** Required trimmed text. Whitespace-only is rejected as empty. */
export const zRequiredText = (label: string, max: number, min = 1) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(min, min <= 1 ? `${label} is required.` : `${label} must be at least ${min} characters.`)
    .max(max, `${label} cannot exceed ${max} characters.`);

/** Optional trimmed text; blank strings become `null` so they never persist as "". */
export const zOptionalText = (label: string, max: number) =>
  z
    .string({ error: `${label} must be text.` })
    .trim()
    .max(max, `${label} cannot exceed ${max} characters.`)
    .nullish()
    .transform((value) => (value ? value : null));

export const zEmail = (label = "Email address") =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .superRefine((value, ctx) => {
      const error = emailRule(value, { label });
      if (error) ctx.addIssue({ code: "custom", message: error });
    })
    .transform((value) => value.toLowerCase());

export const zPersonName = (label = "Full name") =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .superRefine((value, ctx) => {
      const error = personNameRule(value, { label });
      if (error) ctx.addIssue({ code: "custom", message: error });
    });

export const zOptionalPhone = () =>
  z
    .string({ error: "Phone number must be text." })
    .trim()
    .max(25, "Phone number is too long.")
    .nullish()
    .superRefine((value, ctx) => {
      const error = phoneRule(value ?? "", { required: false });
      if (error) ctx.addIssue({ code: "custom", message: error });
    })
    .transform((value) => (value ? value : null));

export const zRequiredPhone = () =>
  z
    .string({ error: "Phone number is required." })
    .trim()
    .superRefine((value, ctx) => {
      const error = phoneRule(value, { required: true });
      if (error) ctx.addIssue({ code: "custom", message: error });
    });

export const zNewPassword = (label = "Password") =>
  z.string({ error: `${label} is required.` }).superRefine((value, ctx) => {
    const error = newPasswordRule(value, { label });
    if (error) ctx.addIssue({ code: "custom", message: error });
  });

/**
 * Peso amount accepting a number or numeric string (form/JSON both occur).
 * Rejects NaN, more than two decimals, negatives, and out-of-range values.
 */
export const zMoney = (label: string, opts: { min?: number; positive?: boolean; max?: number } = {}) =>
  z
    .union([z.number(), z.string()], { error: `${label} must be a valid amount.` })
    .superRefine((value, ctx) => {
      const error = moneyRule(value, { label, required: true, max: MAX_MONEY_AMOUNT, ...opts });
      if (error) ctx.addIssue({ code: "custom", message: error });
    })
    .transform((value) => parseNumericInput(value) as number);

export const zInteger = (label: string, opts: { min?: number; max?: number } = {}) =>
  z
    .union([z.number(), z.string()], { error: `${label} must be a number.` })
    .superRefine((value, ctx) => {
      const error = integerRule(value, { label, required: true, ...opts });
      if (error) ctx.addIssue({ code: "custom", message: error });
    })
    .transform((value) => parseNumericInput(value) as number);

/** Real calendar date in YYYY-MM-DD form (rejects 2026-02-30). */
export const zIsoDate = (label: string, opts: Omit<DateRuleOptions, "label" | "required"> = {}) =>
  z.string({ error: `${label} is required.` }).trim().superRefine((value, ctx) => {
    const error = dateRule(value, { label, required: true, ...opts });
    if (error) ctx.addIssue({ code: "custom", message: error });
  });

export const zOptionalIsoDate = (label: string) =>
  z
    .string()
    .trim()
    .nullish()
    .refine((value) => !value || isValidIsoDate(value), `${label} must be a valid date.`)
    .transform((value) => (value ? value : null));

export const zUuid = (label = "ID") => z.guid({ error: `${label} is invalid.` });
