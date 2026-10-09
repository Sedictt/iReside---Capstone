/**
 * Tenant-lifecycle validation
 *
 * Shared (client-safe) rules and Zod schemas for applications, invites,
 * walk-in intake, manual tenants, lease finalisation/signing, renewals and
 * move-out. Routes validate with these schemas at the boundary and the
 * matching forms reuse the same rule functions, so inline errors and server
 * errors agree.
 *
 * @module lib/validation/schemas/tenant-lifecycle
 */

import { z } from "zod";
import { REGEX_NAME } from "../landlord-settings";
import {
  TEXT_LIMITS,
  dateRangeRule,
  dateRule,
  integerRule,
  isValidIsoDate,
  moneyRule,
  phoneRule,
  textRule,
  todayIsoDate,
  type FieldRuleResult,
} from "../rules";
import { zEmail, zInteger, zIsoDate, zMoney, zOptionalPhone, zOptionalText, zRequiredText } from "../zod-fields";

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

export const LIFECYCLE_LIMITS = {
  applicantName: 100,
  occupation: 100,
  employer: 100,
  applicationMessage: 1000,
  maxMonthlyIncome: 10_000_000,
  rejectionReason: TEXT_LIMITS.reason,
  bypassReasonMin: 10,
  reviewNote: TEXT_LIMITS.note,
  denialReason: TEXT_LIMITS.reason,
  moveOutReason: TEXT_LIMITS.reason,
  inspectionNotes: TEXT_LIMITS.note,
  deductionDescription: 120,
  renewalNotes: TEXT_LIMITS.note,
  referenceNumber: TEXT_LIMITS.reference,
  url: 2048,
  /** Signature PNG data URLs are capped at 500KB decoded (~700K chars encoded). */
  signatureChars: 750_000,
  signingToken: 4096,
  /** Signed PDF base64 uploaded by the countersigning client (≈20MB decoded). */
  signedPdfBase64Chars: 28_000_000,
  maxOccupants: 50,
  maxRenewalTermMonths: 60,
  maxPaymentTermMonths: 12,
} as const;

/** Earliest/latest lease dates accepted (guards against 2-digit-year typos such as 0019). */
export const LEASE_YEAR_MIN_DATE = "1990-01-01";
export const LEASE_YEAR_MAX_DATE = "2100-12-31";

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

/**
 * Database identifier (UUID-shaped). Uses the permissive GUID pattern rather
 * than strict RFC 4122 so hand-seeded rows (e.g. 0000…0001) still resolve.
 */
export const zId = (label = "ID") => z.guid({ error: `${label} is invalid.` });

export function isId(value: unknown): value is string {
  return zId().safeParse(value).success;
}

/** Opaque URL tokens (invite / onboarding links): URL-safe characters, sane length. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
export function isUrlToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

// ---------------------------------------------------------------------------
// Field rules (client + server)
// ---------------------------------------------------------------------------

const isBlank = (value: unknown) => value === undefined || value === null || (typeof value === "string" && value.trim() === "");

/** Applicant / resident / emergency-contact name: 2–100 chars, no digits, name characters only. */
export function applicantNameRule(
  value: unknown,
  { label = "Applicant name", required = true }: { label?: string; required?: boolean } = {},
): FieldRuleResult {
  if (isBlank(value)) return required ? `${label} is required.` : undefined;
  if (typeof value !== "string") return `${label} must be text.`;
  const name = value.trim();
  if (/\d/.test(name)) return "Name must not contain numbers.";
  if (name.length < 2 || name.length > LIFECYCLE_LIMITS.applicantName) {
    return `Name must be between 2 and ${LIFECYCLE_LIMITS.applicantName} characters.`;
  }
  if (!REGEX_NAME.test(name)) return "Name can only contain letters, spaces, hyphens, apostrophes, and periods.";
  return undefined;
}

const PH_MOBILE_11 = /^(\+?63|0)?9\d{9}$/;
const PH_MOBILE_10 = /^9\d{9}$/;

/** Philippine mobile number (09XXXXXXXXX, 9XXXXXXXXX or +639XXXXXXXXX). */
export function phMobileRule(
  value: unknown,
  { required = false, label = "Phone number" }: { required?: boolean; label?: string } = {},
): FieldRuleResult {
  if (isBlank(value)) return required ? `${label} is required.` : undefined;
  const raw = String(value).trim();
  if (!/^[+()\-\s\d]+$/.test(raw)) return "Enter a valid Philippine mobile number (e.g. 09171234567).";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && PH_MOBILE_11.test(digits)) return undefined;
  if (digits.length === 10 && PH_MOBILE_10.test(digits)) return undefined;
  if (digits.length === 12 && PH_MOBILE_11.test(digits)) return undefined; // 639XXXXXXXXX
  return "Enter a valid Philippine mobile number (e.g. 09171234567).";
}

export function occupationRule(value: unknown): FieldRuleResult {
  if (isBlank(value)) return "Occupation is required.";
  const text = String(value).trim();
  if (text.length < 2 || text.length > LIFECYCLE_LIMITS.occupation) return "Occupation must be 2 to 100 characters.";
  return undefined;
}

export function employerRule(value: unknown): FieldRuleResult {
  if (isBlank(value)) return "Employer is required.";
  const text = String(value).trim();
  if (text.length < 2 || text.length > LIFECYCLE_LIMITS.employer) return "Employer must be 2 to 100 characters.";
  return undefined;
}

export function monthlyIncomeRule(value: unknown): FieldRuleResult {
  return moneyRule(value, {
    label: "Monthly income",
    positive: true,
    max: LIFECYCLE_LIMITS.maxMonthlyIncome,
  });
}

export function applicationMessageRule(value: unknown): FieldRuleResult {
  if (isBlank(value)) return undefined;
  if (String(value).trim().length > LIFECYCLE_LIMITS.applicationMessage) {
    return `Notes must not exceed ${LIFECYCLE_LIMITS.applicationMessage} characters.`;
  }
  return undefined;
}

/** Move-in date: real calendar date; optionally not before today (Asia/Manila). */
export function moveInDateRule(
  value: unknown,
  { required = true, allowPast = false, today = todayIsoDate() }: { required?: boolean; allowPast?: boolean; today?: string } = {},
): FieldRuleResult {
  return dateRule(value, {
    label: "Move-in date",
    required,
    min: allowPast ? undefined : today,
    minMessage: "Move-in date cannot be in the past.",
    max: LEASE_YEAR_MAX_DATE,
  });
}

/** Lease start date (any real date within the supported year range). */
export function leaseStartDateRule(value: unknown, { label = "Lease start date" } = {}): FieldRuleResult {
  // Year typos (e.g. 0019) get the friendly message before the generic real-date check.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const year = Number(value.trim().slice(0, 4));
    if (year < 1990 || year > 2100) return "Dates must include a valid 4-digit year (e.g., 2026).";
  }
  return dateRule(value, {
    label,
    min: LEASE_YEAR_MIN_DATE,
    minMessage: "Dates must include a valid 4-digit year (e.g., 2026).",
    max: LEASE_YEAR_MAX_DATE,
    maxMessage: "Dates must include a valid 4-digit year (e.g., 2026).",
  });
}

/** Lease end date: real date, strictly after start (DB constraint lease_dates_valid). */
export function leaseEndDateRule(end: unknown, start: unknown, { label = "Lease end date" } = {}): FieldRuleResult {
  return (
    leaseStartDateRule(end, { label }) ??
    dateRangeRule(start, end, { strict: true, endLabel: label, startLabel: "start date" })
  );
}

export function monthlyRentRule(value: unknown): FieldRuleResult {
  return moneyRule(value, { label: "Monthly rent", positive: true });
}

export function securityDepositRule(value: unknown, { required = true } = {}): FieldRuleResult {
  return moneyRule(value, { label: "Security deposit", required });
}

export function advanceAmountRule(value: unknown, { required = true } = {}): FieldRuleResult {
  return moneyRule(value, { label: "Advance rent", required });
}

/** Move-out date: at least `minNoticeDays` after today and not after the lease end date. */
export const MOVE_OUT_NOTICE_DAYS = 30;

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

export function moveOutDateRule(
  value: unknown,
  { leaseEndDate, today = todayIsoDate() }: { leaseEndDate?: string | null; today?: string } = {},
): FieldRuleResult {
  if (isBlank(value)) return "Requested date is required";
  const iso = typeof value === "string" ? value.trim().slice(0, 10) : "";
  if (!isValidIsoDate(iso)) return "Requested date must be a valid date.";
  const earliest = addDaysIso(today, MOVE_OUT_NOTICE_DAYS);
  if (iso < earliest) {
    return `Move-out requests require a minimum of ${MOVE_OUT_NOTICE_DAYS} days notice. Earliest available date is ${earliest}.`;
  }
  if (leaseEndDate && isValidIsoDate(leaseEndDate) && iso > leaseEndDate) {
    return `Move-out date cannot be after your lease end date (${leaseEndDate}).`;
  }
  return undefined;
}

export function requiredReasonRule(value: unknown, { label = "Reason", max = TEXT_LIMITS.reason } = {}): FieldRuleResult {
  return textRule(value, { label, required: true, max });
}

export function inviteExpiryRule(value: unknown, { now = new Date() }: { now?: Date } = {}): FieldRuleResult {
  if (isBlank(value)) return "Please select an expiration date.";
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return "Invalid expiration date.";
  if (parsed.getTime() <= now.getTime()) return "Expiration must be in the future.";
  if (parsed.getUTCFullYear() > 2099) return "Expiration date is too far in the future.";
  return undefined;
}

export function renewalTermRule(value: unknown, allowed?: readonly number[]): FieldRuleResult {
  const base = integerRule(value, { label: "Renewal term", min: 1, max: LIFECYCLE_LIMITS.maxRenewalTermMonths });
  if (base) return base;
  if (allowed && allowed.length > 0 && !allowed.includes(Number(value))) return "Select one of the offered renewal terms.";
  return undefined;
}

// ---------------------------------------------------------------------------
// Zod helpers
// ---------------------------------------------------------------------------

const fromRule = <T>(rule: (value: T) => FieldRuleResult) =>
  (value: T, ctx: z.RefinementCtx) => {
    const message = rule(value);
    if (message) ctx.addIssue({ code: "custom", message });
  };

/** Blank strings → undefined so optional fields behave the same whether omitted or empty. */
const blankToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

const zApplicantName = (label = "Applicant name") =>
  z.string({ error: `${label} is required.` }).trim().superRefine(fromRule((v: string) => applicantNameRule(v, { label })));

const zOptionalApplicantName = (label: string) =>
  z.preprocess(
    blankToUndefined,
    z.string({ error: `${label} must be text.` }).trim().superRefine(fromRule((v: string) => applicantNameRule(v, { label }))).nullish(),
  ).transform((v) => v ?? null);

const zPhMobile = (label = "Phone number") =>
  z.string({ error: `${label} is required.` }).trim().max(25, `${label} is too long.`)
    .superRefine(fromRule((v: string) => phMobileRule(v, { required: true, label })));

const zOptionalPhMobile = (label = "Phone number") =>
  z.preprocess(
    blankToUndefined,
    z.string({ error: `${label} must be text.` }).trim().max(25, `${label} is too long.`)
      .superRefine(fromRule((v: string) => phMobileRule(v, { label }))).nullish(),
  ).transform((v) => v ?? null);

const zOptionalDate = (label: string, extra?: (iso: string) => FieldRuleResult) =>
  z.preprocess(
    blankToUndefined,
    z.string({ error: `${label} must be a valid date.` }).trim()
      .superRefine((value, ctx) => {
        const message = dateRule(value, { label, max: LEASE_YEAR_MAX_DATE }) ?? extra?.(value);
        if (message) ctx.addIssue({ code: "custom", message });
      })
      .nullish(),
  ).transform((v) => v ?? null);

const zHttpUrl = (label: string) =>
  z.string({ error: `${label} must be a link.` }).trim().max(LIFECYCLE_LIMITS.url, `${label} is too long.`)
    .refine((value) => /^https?:\/\/[^\s]+$/i.test(value), `${label} must start with http:// or https://.`);

const zOptionalHttpUrl = (label: string) =>
  z.preprocess(blankToUndefined, zHttpUrl(label).nullish()).transform((v) => v ?? null);

export const requirementsChecklistSchema = z
  .record(z.string().max(64, "Checklist key is too long."), z.boolean({ error: "requirements_checklist must only contain boolean values." }), {
    error: "requirements_checklist must only contain boolean values.",
  })
  .refine((value) => Object.keys(value).length <= 30, "Too many checklist entries.");

export const employmentInfoSchema = z.object(
  {
    occupation: z.string({ error: "Occupation is required." }).trim().superRefine(fromRule(occupationRule)),
    employer: z.string({ error: "Employer is required." }).trim().superRefine(fromRule(employerRule)),
    monthly_income: z
      .union([z.number(), z.string()], { error: "Monthly income is required." })
      .superRefine(fromRule(monthlyIncomeRule))
      .transform((v) => Number(String(v).replace(/,/g, ""))),
  },
  { error: "Employment details are required." },
);

const zApplicationMessage = () =>
  z.preprocess(
    blankToUndefined,
    z.string({ error: "Notes must be text." }).trim().superRefine(fromRule(applicationMessageRule)).nullish(),
  ).transform((v) => v ?? null);

// ---------------------------------------------------------------------------
// Applications (walk-in / landlord-entered tenant applications)
// ---------------------------------------------------------------------------

export const APPLICATION_EDITABLE_STATUSES = ["pending", "reviewing", "rejected", "withdrawn"] as const;

export const landlordApplicationCreateSchema = z.object({
  unit_id: zId("Unit"),
  applicant_name: zApplicantName(),
  applicant_email: zEmail("Applicant email"),
  applicant_phone: zOptionalPhone(),
  move_in_date: zOptionalDate("Move-in date"),
  emergency_contact_name: zOptionalApplicantName("Emergency contact name"),
  emergency_contact_phone: zOptionalPhone(),
  employment_info: employmentInfoSchema,
  requirements_checklist: requirementsChecklistSchema.nullish(),
  message: zApplicationMessage(),
  occupant_count: z.preprocess(blankToUndefined, zInteger("Number of occupants", { min: 1, max: LIFECYCLE_LIMITS.maxOccupants }).optional()),
  status: z.enum(["pending", "reviewing"], { error: "Invalid status value." }).optional(),
});

const zEditableStatus = z.string().superRefine((value, ctx) => {
  if (value === "approved") {
    ctx.addIssue({ code: "custom", message: "Direct approval is disabled. Move application to payment pending first." });
  } else if (!(APPLICATION_EDITABLE_STATUSES as readonly string[]).includes(value)) {
    ctx.addIssue({ code: "custom", message: "Invalid status value." });
  }
}) as unknown as z.ZodType<(typeof APPLICATION_EDITABLE_STATUSES)[number]>;

export const landlordApplicationUpdateSchema = z.object({
  application_id: zId("Application"),
  requirements_checklist: requirementsChecklistSchema.nullish(),
  employment_info: employmentInfoSchema.nullish(),
  status: z.preprocess(blankToUndefined, zEditableStatus.optional()),
  applicant_name: zApplicantName().optional(),
  applicant_email: zEmail("Applicant email").optional(),
  applicant_phone: zOptionalPhone().optional(),
  emergency_contact_name: zOptionalApplicantName("Emergency contact name").optional(),
  emergency_contact_phone: zOptionalPhone().optional(),
  move_in_date: zOptionalDate("Move-in date").optional(),
  message: zApplicationMessage().optional(),
});

// ---------------------------------------------------------------------------
// Invite application (public applicant submission)
// ---------------------------------------------------------------------------

export const INVITE_REQUIREMENT_KEYS = ["valid_id", "proof_of_income", "application_form", "move_in_payment"] as const;

export const inviteApplicationSchema = z.object({
  unit_id: z.preprocess(blankToUndefined, zId("Unit").nullish()),
  applicant_name: zApplicantName(),
  applicant_email: zEmail("Applicant email"),
  applicant_phone: zOptionalPhMobile("Phone number"),
  move_in_date: zOptionalDate("Move-in date", (iso) => moveInDateRule(iso, { required: false })),
  emergency_contact_name: zApplicantName("Emergency contact name"),
  emergency_contact_phone: zPhMobile("Emergency contact phone"),
  employment_info: employmentInfoSchema,
  requirements_checklist: requirementsChecklistSchema.nullish(),
  uploaded_documents: z
    .array(
      z.object({
        requirementKey: z.enum(INVITE_REQUIREMENT_KEYS, { error: "Invalid document requirement." }),
        url: zHttpUrl("Document link"),
      }),
      { error: "Uploaded documents are invalid." },
    )
    .max(20, "Too many uploaded documents.")
    .nullish(),
  message: zApplicationMessage(),
});

// ---------------------------------------------------------------------------
// Invites (landlord-created links)
// ---------------------------------------------------------------------------

export const invitePaymentTermsSchema = z
  .object({
    advanceMonths: zInteger("Advance months", { min: -1, max: LIFECYCLE_LIMITS.maxPaymentTermMonths }).optional(),
    securityDepositMonths: zInteger("Security deposit months", { min: -1, max: LIFECYCLE_LIMITS.maxPaymentTermMonths }).optional(),
    customAdvanceAmount: z.preprocess(blankToUndefined, zMoney("Custom advance amount").nullish()),
    customSecurityDepositAmount: z.preprocess(blankToUndefined, zMoney("Custom security deposit").nullish()),
  })
  .superRefine((terms, ctx) => {
    if (terms.advanceMonths === -1 && (terms.customAdvanceAmount === null || terms.customAdvanceAmount === undefined)) {
      ctx.addIssue({ code: "custom", path: ["customAdvanceAmount"], message: "Enter the custom advance amount." });
    }
    if (terms.securityDepositMonths === -1 && (terms.customSecurityDepositAmount === null || terms.customSecurityDepositAmount === undefined)) {
      ctx.addIssue({ code: "custom", path: ["customSecurityDepositAmount"], message: "Enter the custom security deposit amount." });
    }
  });

export const inviteCreateSchema = z
  .object({
    mode: z.enum(["property", "unit"], { error: "Invalid invite mode." }),
    applicationType: z.enum(["face_to_face", "online", "existing_tenant"], { error: "Invalid invite application type." }),
    requiredRequirements: z
      .array(z.enum(INVITE_REQUIREMENT_KEYS, { error: "Invalid required document." }))
      .max(INVITE_REQUIREMENT_KEYS.length)
      .nullish(),
    propertyId: z.preprocess(blankToUndefined, zId("Property").optional()).refine((v) => Boolean(v), "Property is required."),
    unitId: z.preprocess(blankToUndefined, zId("Unit").nullish()),
    previewUnitId: z.preprocess(blankToUndefined, zId("Preview unit").nullish()),
    expiresAt: z.preprocess(
      blankToUndefined,
      z.string({ error: "Invalid expiration date." }).max(64).superRefine((v, ctx) => {
        const message = inviteExpiryRule(v);
        if (message) ctx.addIssue({ code: "custom", message });
      }).nullish(),
    ),
    paymentTerms: invitePaymentTermsSchema.nullish(),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "unit" && !value.unitId) {
      ctx.addIssue({ code: "custom", path: ["unitId"], message: "Unit is required for unit-scoped invites." });
    }
  });

export const inviteUpdateSchema = z.object({
  status: z.literal("revoked", { error: "Unsupported invite update." }),
});

// ---------------------------------------------------------------------------
// Application review actions
// ---------------------------------------------------------------------------

export const PAYMENT_METHODS = ["credit_card", "debit_card", "gcash", "maya", "bank_transfer", "cash"] as const;

export const leaseDataSchema = z
  .object({
    start_date: zIsoDate("Lease start date", { min: LEASE_YEAR_MIN_DATE, max: LEASE_YEAR_MAX_DATE }),
    end_date: zIsoDate("Lease end date", { min: LEASE_YEAR_MIN_DATE, max: LEASE_YEAR_MAX_DATE }),
    monthly_rent: zMoney("Monthly rent", { positive: true }),
    security_deposit: zMoney("Security deposit"),
    terms: z.record(z.string(), z.unknown()).nullish().transform((v) => v ?? {}),
    landlord_signature: z.string().max(LIFECYCLE_LIMITS.signatureChars, "Landlord signature is too large.").nullish(),
    tenant_signature: z.string().max(LIFECYCLE_LIMITS.signatureChars, "Tenant signature is too large.").nullish(),
    signed_document_url: zOptionalHttpUrl("Signed document link"),
    signed_document_path: z.string().max(LIFECYCLE_LIMITS.url).nullish(),
  })
  .superRefine((lease, ctx) => {
    const message = dateRangeRule(lease.start_date, lease.end_date, { strict: true, endLabel: "Lease end date" });
    if (message) ctx.addIssue({ code: "custom", path: ["end_date"], message });
  });

const actionPaymentSchema = z.object({
  amount: zMoney("Payment amount").optional(),
  method: z.enum(PAYMENT_METHODS, { error: "Invalid payment method." }).nullish(),
  reference_number: z.string().trim().max(LIFECYCLE_LIMITS.referenceNumber, "Reference number is too long.").nullish(),
  paid_at: z.string().max(64).nullish().refine((v) => !v || !Number.isNaN(new Date(v).getTime()), "Payment date is invalid."),
  status: z.enum(["pending", "completed"], { error: "Invalid payment status." }).nullish(),
  payment_proof_path: z.string().max(LIFECYCLE_LIMITS.url).nullish(),
  payment_proof_url: zOptionalHttpUrl("Payment proof link"),
  payment_note: zOptionalText("Payment note", TEXT_LIMITS.note),
});

export const applicationActionSchema = z.object({
  status: z.enum(["reviewing", "payment_pending", "approved", "rejected"], { error: "Invalid application status." }),
  rejection_reason: zOptionalText("Rejection reason", LIFECYCLE_LIMITS.rejectionReason),
  lease_data: leaseDataSchema.nullish(),
  advance_payment: actionPaymentSchema.nullish(),
  security_deposit_payment: actionPaymentSchema.nullish(),
});

export const paymentBypassSchema = z.object({
  password: z.string({ error: "Password is required for bypass." }).min(1, "Password is required for bypass.").max(72, "Password is too long."),
  reason: z
    .string({ error: "A detailed bypass reason is required (at least 10 characters)." })
    .trim()
    .min(LIFECYCLE_LIMITS.bypassReasonMin, "A detailed bypass reason is required (at least 10 characters).")
    .max(TEXT_LIMITS.reason, `Bypass reason cannot exceed ${TEXT_LIMITS.reason} characters.`),
});

export const PAYMENT_REVIEW_ACTIONS = [
  "confirm",
  "reject",
  "needs_correction",
  "return_payment",
  "return_overpayment",
  "request_shortfall",
] as const;

export const paymentReviewSchema = z.object({
  action: z.enum(PAYMENT_REVIEW_ACTIONS, { error: "Invalid review action." }),
  note: zOptionalText("Review note", LIFECYCLE_LIMITS.reviewNote),
  // The UI accepts either a receipt link or a GCash reference number here.
  refundProofUrl: zOptionalText("Refund proof reference", 250),
  amount: z.preprocess(blankToUndefined, zMoney("Amount").nullish()),
});

// ---------------------------------------------------------------------------
// Manual tenant (landlord adds an existing resident directly)
// ---------------------------------------------------------------------------

export const manualTenantSchema = z
  .object({
    fullName: z.string({ error: "Full name is required." }).trim().superRefine((value, ctx) => {
      if (!value) return ctx.addIssue({ code: "custom", message: "Full name, email, property, unit, start date, and end date are required." });
      if (value.length < 2 || value.length > 100) return ctx.addIssue({ code: "custom", message: "Resident full name must be between 2 and 100 characters." });
      if (/\d/.test(value)) return ctx.addIssue({ code: "custom", message: "Resident full name cannot contain numbers." });
      if (!REGEX_NAME.test(value)) ctx.addIssue({ code: "custom", message: "Name can only contain letters, spaces, hyphens, apostrophes, and periods." });
    }),
    email: z.string({ error: "Please enter a valid email address." }).trim().superRefine((value, ctx) => {
      if (!value) return ctx.addIssue({ code: "custom", message: "Full name, email, property, unit, start date, and end date are required." });
      if (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) ctx.addIssue({ code: "custom", message: "Please enter a valid email address." });
    }).transform((v) => v.toLowerCase()),
    phone: z.preprocess(
      blankToUndefined,
      z.string().trim().max(25).superRefine((value, ctx) => {
        if (phoneRule(value)) ctx.addIssue({ code: "custom", message: "Please enter a valid phone number (10 to 15 digits)." });
      }).nullish(),
    ).transform((v) => v ?? null),
    propertyId: zId("Property"),
    unitId: zId("Unit"),
    startDate: z.string({ error: "Please provide valid lease start and end dates." }).trim().superRefine(fromRule((v: string) => leaseStartDateRule(v, { label: "Lease start date" }))),
    endDate: z.string({ error: "Please provide valid lease start and end dates." }).trim().superRefine(fromRule((v: string) => leaseStartDateRule(v, { label: "Lease end date" }))),
    monthlyRent: z.union([z.number(), z.string()], { error: "Monthly rent must be greater than zero." }).superRefine(fromRule(monthlyRentRule)).transform((v) => Number(String(v).replace(/,/g, ""))),
    securityDeposit: z.preprocess(blankToUndefined, zMoney("Security deposit").optional()).transform((v) => v ?? 0),
    advancePayment: z.preprocess(blankToUndefined, zMoney("Advance payment").optional()).transform((v) => v ?? 0),
    advanceMonths: z.preprocess(blankToUndefined, zInteger("Advance months", { min: 0, max: LIFECYCLE_LIMITS.maxPaymentTermMonths }).optional()).transform((v) => v ?? 1),
    securityDepositMonths: z.preprocess(blankToUndefined, zInteger("Security deposit months", { min: 0, max: LIFECYCLE_LIMITS.maxPaymentTermMonths }).optional()).transform((v) => v ?? 1),
    advancePaid: z.boolean().optional().default(false),
    securityDepositPaid: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.endDate <= value.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "Lease end date must be after start date." });
    }
  });

// ---------------------------------------------------------------------------
// Lease finalisation / signing
// ---------------------------------------------------------------------------

export const leaseFinalizeSchema = z
  .object({
    application_id: zId("Application"),
    unit_id: zId("Unit"),
    lease_start: zIsoDate("Lease start date", { min: LEASE_YEAR_MIN_DATE, max: LEASE_YEAR_MAX_DATE }),
    lease_end: zIsoDate("Lease end date", { min: LEASE_YEAR_MIN_DATE, max: LEASE_YEAR_MAX_DATE }),
    monthly_rent: zMoney("Monthly rent", { positive: true }),
    security_deposit: z.preprocess(blankToUndefined, zMoney("Security deposit").optional()).transform((v) => v ?? 0),
    landlord_signature: z.string({ error: "Both landlord and tenant signatures are required." }).min(1, "Both landlord and tenant signatures are required.").max(LIFECYCLE_LIMITS.signatureChars, "Landlord signature is too large."),
    tenant_signature: z.string({ error: "Both landlord and tenant signatures are required." }).min(1, "Both landlord and tenant signatures are required.").max(LIFECYCLE_LIMITS.signatureChars, "Tenant signature is too large."),
    occupant_count: z.preprocess(blankToUndefined, zInteger("Number of occupants", { min: 1, max: LIFECYCLE_LIMITS.maxOccupants }).optional()),
  })
  .superRefine((value, ctx) => {
    const message = dateRangeRule(value.lease_start, value.lease_end, { strict: true, endLabel: "Lease end date" });
    if (message) ctx.addIssue({ code: "custom", path: ["lease_end"], message });
  });

/** Body of the tenant/landlord sign endpoints (accepts snake_case and camelCase aliases). */
export const signLeaseBodySchema = z.object({
  tenant_signature: z.string().max(LIFECYCLE_LIMITS.signatureChars, "Signature file is too large.").optional(),
  tenantSignature: z.string().max(LIFECYCLE_LIMITS.signatureChars, "Signature file is too large.").optional(),
  landlord_signature: z.string().max(LIFECYCLE_LIMITS.signatureChars, "Signature file is too large.").optional(),
  landlordSignature: z.string().max(LIFECYCLE_LIMITS.signatureChars, "Signature file is too large.").optional(),
  signing_token: z.string().max(LIFECYCLE_LIMITS.signingToken, "Invalid signing token").optional(),
  signingToken: z.string().max(LIFECYCLE_LIMITS.signingToken, "Invalid signing token").optional(),
  signed_pdf_base64: z.string().max(LIFECYCLE_LIMITS.signedPdfBase64Chars, "Signed document is too large.").optional(),
  signedPdfBase64: z.string().max(LIFECYCLE_LIMITS.signedPdfBase64Chars, "Signed document is too large.").optional(),
});

export const signingLinkRoleSchema = z.enum(["tenant", "landlord"], { error: "Invalid signing role." });

// ---------------------------------------------------------------------------
// Renewals
// ---------------------------------------------------------------------------

export const tenantRenewalRequestSchema = z.object({
  term_months: zInteger("Renewal term", { min: 1, max: LIFECYCLE_LIMITS.maxRenewalTermMonths }),
});

export const renewalDecisionSchema = z.discriminatedUnion(
  "action",
  [
    z.object({
      action: z.literal("approve"),
      proposed_start_date: z.preprocess(blankToUndefined, zIsoDate("Proposed start date", { min: LEASE_YEAR_MIN_DATE, max: LEASE_YEAR_MAX_DATE }).optional()),
      proposed_end_date: z.preprocess(blankToUndefined, zIsoDate("Proposed end date", { min: LEASE_YEAR_MIN_DATE, max: LEASE_YEAR_MAX_DATE }).optional()),
      proposed_monthly_rent: z.preprocess(blankToUndefined, zMoney("Proposed monthly rent", { positive: true }).optional()),
      proposed_security_deposit: z.preprocess(blankToUndefined, zMoney("Proposed security deposit").optional()),
      terms_json: z.record(z.string(), z.unknown()).nullish(),
    }),
    z.object({
      action: z.literal("reject"),
      landlord_notes: zOptionalText("Notes", LIFECYCLE_LIMITS.renewalNotes),
    }),
  ],
  { error: "Invalid action. Use 'approve' or 'reject'." },
);

/** Cross-field rule for an approved renewal: new term must extend past the current lease. */
export function renewalTermDatesRule(
  start: unknown,
  end: unknown,
  currentEndDate?: string | null,
): { field: "proposed_start_date" | "proposed_end_date"; message: string } | undefined {
  const range = dateRangeRule(start, end, { strict: true, endLabel: "Proposed end date", startLabel: "proposed start date" });
  if (range) return { field: "proposed_end_date", message: range };
  if (currentEndDate && isValidIsoDate(currentEndDate) && isValidIsoDate(end) && end <= currentEndDate) {
    return { field: "proposed_end_date", message: `Proposed end date must be after the current lease end date (${currentEndDate}).` };
  }
  if (currentEndDate && isValidIsoDate(currentEndDate) && isValidIsoDate(start) && start < currentEndDate) {
    return { field: "proposed_start_date", message: `Proposed start date cannot be before the current lease end date (${currentEndDate}).` };
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Move-out
// ---------------------------------------------------------------------------

export const moveOutRequestSchema = z.object({
  requestedDate: z
    .string({ error: "Requested date is required" })
    .trim()
    .min(1, "Requested date is required")
    .max(40, "Requested date must be a valid date.")
    .refine((v) => isValidIsoDate(v.slice(0, 10)) && !Number.isNaN(new Date(v).getTime()), "Requested date must be a valid date.")
    .transform((v) => v.slice(0, 10)),
  reason: zOptionalText("Reason", LIFECYCLE_LIMITS.moveOutReason),
});

const checklistItemSchema = z.object({
  id: z.string().max(64),
  label: z.string().max(200).optional(),
  completed: z.boolean(),
});

export const moveOutChecklistSchema = z.object({
  checklist_data: z
    .record(
      z.string().max(64),
      z.union([
        z.boolean(),
        z.object({ completed: z.boolean() }).passthrough(),
        z.array(checklistItemSchema).max(50, "Too many checklist items."),
      ]),
      { error: "Checklist data is required" },
    )
    .refine((value) => Object.keys(value).length <= 50, "Too many checklist entries."),
});

/** Completion check for both checklist shapes ({key: bool|{completed}} and {items: [...]}). */
export function isMoveOutChecklistComplete(checklist: Record<string, unknown>): boolean {
  const values = Object.values(checklist);
  if (values.length === 0) return false;
  return values.every((item) => {
    if (typeof item === "boolean") return item;
    if (Array.isArray(item)) return item.length > 0 && item.every((entry) => (entry as { completed?: unknown })?.completed === true);
    if (item && typeof item === "object") return (item as { completed?: unknown }).completed === true;
    return false;
  });
}

export const moveOutApproveSchema = z.object({
  inspection_date: z.preprocess(blankToUndefined, zIsoDate("Inspection date", { min: LEASE_YEAR_MIN_DATE, max: LEASE_YEAR_MAX_DATE }).nullish()),
});

export const moveOutDenySchema = z.object({
  denial_reason: z
    .string({ error: "Denial reason is required" })
    .trim()
    .min(1, "Denial reason is required")
    .max(LIFECYCLE_LIMITS.denialReason, `Denial reason cannot exceed ${LIFECYCLE_LIMITS.denialReason} characters.`),
});

export const depositDeductionSchema = z.object({
  id: z.string().max(64).optional(),
  description: zRequiredText("Deduction description", LIFECYCLE_LIMITS.deductionDescription),
  amount: zMoney("Deduction amount", { positive: true }),
});

export const moveOutInspectionSchema = z.object({
  inspection_date: z.preprocess(blankToUndefined, zIsoDate("Inspection date", { min: LEASE_YEAR_MIN_DATE, max: LEASE_YEAR_MAX_DATE }).nullish()),
  inspection_notes: zOptionalText("Inspection notes", LIFECYCLE_LIMITS.inspectionNotes),
  inspection_photos: z.array(zHttpUrl("Inspection photo")).max(20, "Too many inspection photos.").nullish(),
  checklist_data: z.record(z.string().max(64), z.boolean()).refine((v) => Object.keys(v).length <= 30, "Too many checklist entries.").nullish(),
  deposit_deductions: z.array(depositDeductionSchema).max(50, "Too many deductions.").nullish(),
  deposit_refund_amount: z.preprocess(blankToUndefined, zMoney("Refund amount").nullish()),
});

/** Legacy move-out-requests completion payload. */
export const legacyMoveOutCompleteSchema = z.object({
  inspection_notes: zOptionalText("Inspection notes", LIFECYCLE_LIMITS.inspectionNotes),
  inspection_photos: z.array(zHttpUrl("Inspection photo")).max(20, "Too many inspection photos.").nullish(),
  deposit_deductions: z
    .object({ total_deductions: z.preprocess(blankToUndefined, zMoney("Total deductions").optional()) })
    .passthrough()
    .nullish(),
});

// ---------------------------------------------------------------------------
// Landlord onboarding
// ---------------------------------------------------------------------------

const zOnboardingImage = (label: string) =>
  z
    .string()
    .max(10_000_000, `${label} is too large.`)
    .refine(
      (v) => /^https?:\/\//i.test(v) || /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/.test(v),
      `${label} must be an uploaded image.`,
    )
    .nullable()
    .optional();

export const ONBOARDING_LIMITS = { maxUnits: 500, maxFloors: 200, maxHeadLimit: 50 } as const;

export const landlordOnboardingSchema = z.object({
  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password cannot exceed 72 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  fullName: z.string({ error: "Full name is required" }).trim().superRefine(fromRule((v: string) => applicantNameRule(v, { label: "Full name" }))),
  phone: z.string({ error: "Valid phone number is required" }).trim().superRefine(fromRule((v: string) => phoneRule(v, { required: true }))),
  propertyConfig: z
    .object({
      propertyPhoto: zOnboardingImage("Property photo"),
      profilePhoto: zOnboardingImage("Profile photo"),
      profileBgColor: z.string().max(32).regex(/^[#a-zA-Z0-9(),.%\s-]*$/, "Invalid profile color.").nullable().optional(),
      coverPhoto: zOnboardingImage("Cover photo"),
      totalUnits: zInteger("Total units", { min: 1, max: ONBOARDING_LIMITS.maxUnits }).default(1),
      totalFloors: zInteger("Total floors", { min: 1, max: ONBOARDING_LIMITS.maxFloors }).default(1),
      headLimit: z.union([zInteger("Head limit", { min: 1, max: ONBOARDING_LIMITS.maxHeadLimit }), z.literal("none")]).default(4),
      utilityBilling: z.enum(["included_in_rent", "separate_metered", "mixed"], { error: "Invalid utility billing option." }).default("included_in_rent"),
      baseRent: zMoney("Base rent").default(0),
      amenities: z.array(z.string().trim().max(100)).max(100).default([]),
      house_rules: z.array(z.string().trim().max(TEXT_LIMITS.reason)).max(100).default([]),
      contractMode: z.enum(["upload", "generate"], { error: "Invalid contract option." }).default("generate"),
    })
    .optional(),
});

export const onboardingResendSchema = z.object({
  email: zEmail("Email address"),
});


// ---------------------------------------------------------------------------
// List filters (query strings)
// ---------------------------------------------------------------------------

/** Optional id filter: absent/blank, "all", or an id. */
export const zFilterId = (label: string) =>
  z.preprocess(blankToUndefined, z.union([z.literal("all"), zId(label)], { error: `${label} filter is invalid.` }).optional());

/** Optional enum filter that also accepts "all". */
export const zFilterEnum = <T extends readonly [string, ...string[]]>(label: string, values: T) =>
  z.preprocess(blankToUndefined, z.enum(["all", ...values] as unknown as [string, ...string[]], { error: `${label} filter is invalid.` }).optional());

export const LEASE_STATUSES = [
  "draft",
  "pending_signature",
  "active",
  "expired",
  "terminated",
  "pending_tenant_signature",
  "pending_landlord_signature",
] as const;

/** Lease list status filter: comma-separated keywords (e.g. "active,expiring_soon", "expired,terminated"). */
export const landlordLeaseListQuerySchema = z.object({
  propertyId: zFilterId("Property"),
  unitId: zFilterId("Unit"),
  status: z.preprocess(
    blankToUndefined,
    z.string().max(200, "Status filter is invalid.").regex(/^[a-z_]+(,[a-z_]+)*$/, "Status filter is invalid.").optional(),
  ),
});

export const landlordRenewalListQuerySchema = z.object({
  propertyId: zFilterId("Property"),
  status: zFilterEnum("Status", ["pending", "approved", "rejected", "signed"] as const),
});
