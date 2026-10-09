/**
 * Billing / Payments Validation Schemas
 *
 * Shared by the money routes (invoices, payment review/collection, tenant
 * payment submission, utility readings, expenses, refunds, application
 * payment portal) and the forms that call them, so a value the server rejects
 * is flagged inline with the same message.
 *
 * Client-safe: no server-only imports.
 *
 * Limits mirror the database (see supabase schema):
 *  - money columns are numeric(12,2); MAX_MONEY_AMOUNT keeps entry well inside it
 *  - expenses: amount > 0, category in (maintenance, utilities, taxes, other)
 *  - utility_readings: billing_period_end >= billing_period_start,
 *    current_reading >= previous_reading
 *  - payments: payments_rejection_reason_required (a rejected payment needs a reason)
 *
 * @module lib/validation/schemas/billing
 */

import { fileContentMatchesType } from "../upload";
import { z } from "zod";
import {
    MAX_MONEY_AMOUNT,
    TEXT_LIMITS,
    dateRangeRule,
    dateRule,
    isValidIsoDate,
    moneyRule,
    parseNumericInput,
    todayIsoDate,
    type FieldRuleResult,
} from "../rules";
import { zIsoDate, zMoney, zOptionalText, zRequiredText, zUuid } from "../zod-fields";

// ---------------------------------------------------------------------------
// Enums (exact Postgres enum values)
// ---------------------------------------------------------------------------

export const PAYMENT_METHODS = ["credit_card", "debit_card", "gcash", "maya", "bank_transfer", "cash"] as const;
export const PAYMENT_WORKFLOW_STATUSES = [
    "pending",
    "reminder_sent",
    "intent_submitted",
    "under_review",
    "awaiting_in_person",
    "confirmed",
    "rejected",
    "receipted",
] as const;
export const PAYMENT_REVIEW_ACTIONS = ["accept_partial", "request_completion", "reject", "confirm_received"] as const;
export const PAYMENT_AMOUNT_TAGS = ["exact", "partial", "overpaid", "short_paid"] as const;
export const PAYMENT_INTENT_METHODS = ["gcash", "in_person"] as const;
export const UTILITY_TYPES = ["water", "electricity"] as const;
/** expenses_category_check */
export const EXPENSE_CATEGORIES = ["maintenance", "utilities", "taxes", "other"] as const;

/** Methods a landlord can record for a direct (manual) collection. */
export const COLLECT_PAYMENT_METHODS = ["cash", "gcash", "bank_transfer"] as const;
/** Actions accepted by POST /api/landlord/invoices/[id]/review. */
export const INVOICE_REVIEW_ACTIONS = ["confirm", "confirm_received", "reject", "request_completion"] as const;
/** Resolution chosen for a non-exact (partial / over) payment. */
export const NON_EXACT_ACTIONS = ["accept_partial", "request_completion", "reject"] as const;
export const PAYMENT_ISSUE_TYPES = ["insufficient_amount", "excessive_amount", "not_received", "invalid_proof", "other"] as const;
/** Line-item categories offered by the Issue Invoice modal. */
export const INVOICE_ITEM_CATEGORIES = ["rent", "water", "electricity", "maintenance", "other"] as const;
export const REFUND_ACTIONS = ["credit", "refund"] as const;

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

export const BILLING_LIMITS = {
    reference: TEXT_LIMITS.reference, // 100
    reviewNote: 600,
    rejectionReason: TEXT_LIMITS.reason, // 500
    paymentNote: 600,
    collectionNote: 500,
    invoiceNotes: TEXT_LIMITS.note, // 1000
    itemLabel: TEXT_LIMITS.title, // 150
    maxInvoiceItems: 50,
    maxSelectedIds: 200,
    maxBulkLeases: 500,
    maxBulkReadings: 500,
    readingNote: 400,
    expenseDescription: 500,
    applicationNote: TEXT_LIMITS.note,
    url: 2048,
} as const;

/** numeric(12,2) ceiling, used for meter readings (not peso amounts). */
export const MAX_METER_READING = 9_999_999_999.99;

const MB = 1024 * 1024;
/** Server-side upload limits (client pickers may be stricter). */
export const PROOF_LIMITS = {
    /** Tenant GCash proof (payment-proofs bucket limit is 8 MB). */
    paymentProofMaxBytes: 8 * MB,
    /** The existing "unreadable proof" floor for tenant GCash screenshots. */
    paymentProofMinBytes: 2048,
    /** Prospect move-in payment proof (portal accepts images and PDFs up to 10 MB). */
    applicationProofMaxBytes: 10 * MB,
    /** Landlord refund proof (picker allows 5 MB images). */
    refundProofMaxBytes: 5 * MB,
    /** Tenant refund QR code (image preset, 10 MB). */
    refundQrMaxBytes: 10 * MB,
    /** Utility meter reading proof (utility-reading-proofs bucket limit is 8 MB). */
    readingProofMaxBytes: 8 * MB,
} as const;

export const PROOF_IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"] as const;
export const PROOF_PDF_MIME_TYPE = "application/pdf";

// ---------------------------------------------------------------------------
// Pure rules (shared by forms and schemas)
// ---------------------------------------------------------------------------

const isBlank = (value: unknown) => value === undefined || value === null || (typeof value === "string" && value.trim() === "");

/** Rounds a computed peso figure to centavos so float noise never fails the 2-decimal rule. */
export const roundCentavos = (value: number) => Math.round(value * 100) / 100;

/** Non-negative meter reading with at most two decimals (numeric(12,2)). */
export function meterReadingRule(value: unknown, { label, required = true }: { label: string; required?: boolean }): FieldRuleResult {
    const reading = parseNumericInput(value);
    if (reading === null) return required ? `${label} is required.` : undefined;
    if (!Number.isFinite(reading)) return `${label} must be a number.`;
    if (reading < 0) return `${label} cannot be negative.`;
    if (reading > MAX_METER_READING) return `${label} is too large.`;
    if (Math.round(reading * 100) / 100 !== reading) return `${label} can have at most 2 decimal places.`;
    return undefined;
}

export const READING_ORDER_MESSAGE = "Current reading cannot be lower than the previous reading.";

/** Current meter reading: valid number and not below the previous reading (utility_readings_positive_progress). */
export function currentReadingRule(current: unknown, previous: unknown, { label = "Current reading", required = true } = {}): FieldRuleResult {
    const base = meterReadingRule(current, { label, required });
    if (base || isBlank(current)) return base;
    const prev = parseNumericInput(previous);
    const curr = parseNumericInput(current);
    if (prev !== null && curr !== null && Number.isFinite(prev) && curr < prev) return READING_ORDER_MESSAGE;
    return undefined;
}

/** YYYY-MM (or the first-of-month YYYY-MM-DD the invoice modal sends) with a real month. */
export function billingMonthRule(value: unknown, { label = "Billing month", required = false } = {}): FieldRuleResult {
    if (isBlank(value)) return required ? `${label} is required.` : undefined;
    if (typeof value !== "string") return `${label} must be a valid month.`;
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}$/.test(trimmed)) {
        return isValidIsoDate(`${trimmed}-01`) ? undefined : `${label} must be a valid month.`;
    }
    return isValidIsoDate(trimmed) ? undefined : `${label} must be a valid month.`;
}

/** Philippine mobile number used for GCash (09XXXXXXXXX or +639XXXXXXXXX; spaces/dashes ignored). */
export function gcashNumberRule(value: unknown, { required = false } = {}): FieldRuleResult {
    if (isBlank(value)) return required ? "GCash number is required." : undefined;
    const digits = String(value).replace(/[\s-]/g, "");
    if (!/^(09\d{9}|\+639\d{9}|639\d{9})$/.test(digits)) return "Enter a valid GCash number (e.g. 0917 123 4567).";
    return undefined;
}

export const REJECTION_REASON_REQUIRED = "Rejection reason is required.";

/** payments_rejection_reason_required: rejecting or requesting completion needs a reason. */
export function rejectionReasonRule(value: unknown, { required }: { required: boolean }): FieldRuleResult {
    if (isBlank(value)) return required ? REJECTION_REASON_REQUIRED : undefined;
    if (String(value).trim().length > BILLING_LIMITS.rejectionReason) {
        return `Rejection reason cannot exceed ${BILLING_LIMITS.rejectionReason} characters.`;
    }
    return undefined;
}

/** Amount a payer submits/records: positive peso amount that does not exceed what is still owed. */
export function amountWithinBalanceRule(
    value: unknown,
    balance: number,
    { label = "Amount", required = true }: { label?: string; required?: boolean } = {},
): FieldRuleResult {
    const base = moneyRule(value, { label, required, positive: true });
    if (base || isBlank(value)) return base;
    const amount = parseNumericInput(value) as number;
    if (Number.isFinite(balance) && balance > 0 && amount > roundCentavos(balance) + 0.001) {
        return `${label} cannot exceed the balance due of ₱${balance.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;
    }
    return undefined;
}

export interface ProofFileLike {
    size: number;
    type: string;
    name?: string;
}

export interface ProofFileRuleOptions {
    label?: string;
    required?: boolean;
    maxBytes: number;
    minBytes?: number;
    allowPdf?: boolean;
}

/** Server-side upload check: real file, allowed MIME type, within size limits. */
export function proofFileRule(file: ProofFileLike | null | undefined, { label = "Payment proof", required = false, maxBytes, minBytes = 1, allowPdf = false }: ProofFileRuleOptions): FieldRuleResult {
    if (!file || file.size <= 0) return required ? `${label} is required.` : undefined;
    const type = (file.type || "").toLowerCase();
    const allowed = (PROOF_IMAGE_MIME_TYPES as readonly string[]).includes(type) || (allowPdf && type === PROOF_PDF_MIME_TYPE);
    if (!allowed) return `${label} must be a ${allowPdf ? "JPG, PNG, WebP, HEIC image or a PDF" : "JPG, PNG, WebP or HEIC image"}.`;
    if (file.size < minBytes) return `${label} is unreadable or invalid. Upload a clearer image.`;
    if (file.size > maxBytes) return `${label} must be ${Math.round(maxBytes / MB)} MB or smaller.`;
    return undefined;
}

/** Storage-safe extension derived from the (already validated) MIME type, never from the client file name. */
export function proofFileExtension(file: ProofFileLike): string {
    const type = (file.type || "").toLowerCase();
    if (type === PROOF_PDF_MIME_TYPE) return "pdf";
    if (type === "image/png") return "png";
    if (type === "image/webp") return "webp";
    if (type === "image/heic") return "heic";
    if (type === "image/heif") return "heif";
    return "jpg";
}

/** Server-side: rejects a proof whose bytes are not the image/PDF its declared type claims (e.g. a renamed script). */
export async function proofContentRule(file: Blob | null | undefined, { label = "Payment proof", allowPdf = false } = {}): Promise<FieldRuleResult> {
    if (!file || file.size <= 0) return undefined;
    if (await fileContentMatchesType(file, { allowPdf })) return undefined;
    return `${label} could not be read as a valid ${allowPdf ? "image or PDF" : "image"}. Upload the original file.`;
}

/** True for a UUID route param / id (used to 404 malformed ids before they reach Postgres). */
export const isUuid = (value: unknown): value is string => z.uuid().safeParse(value).success;

// ---------------------------------------------------------------------------
// Zod field helpers
// ---------------------------------------------------------------------------

const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value === null ? undefined : value);

export const zBillingMonth = (label = "Billing month") =>
    z.string({ error: `${label} must be a valid month.` }).trim().superRefine((value, ctx) => {
        const error = billingMonthRule(value, { label, required: true });
        if (error) ctx.addIssue({ code: "custom", message: error });
    });

export const zMeterReading = (label: string) =>
    z
        .union([z.number(), z.string()], { error: `${label} must be a number.` })
        .superRefine((value, ctx) => {
            const error = meterReadingRule(value, { label });
            if (error) ctx.addIssue({ code: "custom", message: error });
        })
        .transform((value) => parseNumericInput(value) as number);

/** Signed peso figure (e.g. a shortfall that is negative when the tenant overpaid). */
export const zSignedMoney = (label: string) =>
    z
        .union([z.number(), z.string()], { error: `${label} must be a valid amount.` })
        .superRefine((value, ctx) => {
            const amount = parseNumericInput(value);
            const error = moneyRule(amount === null ? value : Math.abs(amount), { label });
            if (error) ctx.addIssue({ code: "custom", message: error });
        })
        .transform((value) => parseNumericInput(value) as number);

/** Optional YYYY-MM-DD that may not be later than today (Asia/Manila). */
const zOptionalPastOrTodayDate = (label: string, futureMessage: string) =>
    z
        .string({ error: `${label} must be a valid date.` })
        .trim()
        .nullish()
        .superRefine((value, ctx) => {
            const error = dateRule(value, { label, required: false, max: todayIsoDate(), maxMessage: futureMessage });
            if (error) ctx.addIssue({ code: "custom", message: error });
        })
        .transform((value) => (value ? value : undefined));

/** Optional absolute http(s) URL. */
const zOptionalHttpUrl = (label: string) =>
    z
        .string({ error: `${label} must be a valid URL.` })
        .trim()
        .max(BILLING_LIMITS.url, `${label} is too long.`)
        .nullish()
        .refine((value) => {
            if (!value) return true;
            try {
                const url = new URL(value);
                return url.protocol === "https:" || url.protocol === "http:";
            } catch {
                return false;
            }
        }, `${label} must be a valid URL.`)
        .transform((value) => (value ? value : null));

/** JSON-encoded list of UUIDs sent as a FormData string (e.g. `selectedItemIds`). */
const zJsonUuidList = (label: string) =>
    z
        .string()
        .nullish()
        .transform((raw, ctx): string[] => {
            if (!raw || raw.trim() === "") return [];
            let parsed: unknown;
            try {
                parsed = JSON.parse(raw);
            } catch {
                ctx.addIssue({ code: "custom", message: `${label} are invalid.` });
                return z.NEVER;
            }
            const result = z.array(z.uuid()).max(BILLING_LIMITS.maxSelectedIds).safeParse(parsed);
            if (!result.success) {
                ctx.addIssue({ code: "custom", message: `${label} are invalid.` });
                return z.NEVER;
            }
            return Array.from(new Set(result.data));
        });

const zUuidList = (label: string) =>
    z.array(z.uuid({ error: `${label} are invalid.` }), { error: `${label} are invalid.` }).max(BILLING_LIMITS.maxSelectedIds, `Too many ${label.toLowerCase()}.`);

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export const invoiceItemSchema = z.object({
    label: zRequiredText("Item description", BILLING_LIMITS.itemLabel),
    amount: zMoney("Item amount"),
    category: z.enum(INVOICE_ITEM_CATEGORIES, { error: "Select a valid item category." }).default("rent"),
});

export const INVOICE_TOTAL_MESSAGE = "Invoice total must be greater than ₱0.";

/** POST /api/landlord/invoices — monthly generation or a single itemized invoice. */
export const invoiceGenerateSchema = z
    .object({
        billingMonth: zBillingMonth().optional(),
        leaseIds: z.array(zUuid("Lease"), { error: "Lease selection is invalid." }).max(BILLING_LIMITS.maxBulkLeases, "Too many leases selected.").optional(),
        leaseId: zUuid("Lease").optional(),
        dueDate: zIsoDate("Due date").optional(),
        notes: zOptionalText("Notes", BILLING_LIMITS.invoiceNotes),
        items: z.array(invoiceItemSchema, { error: "Invoice items are invalid." }).max(BILLING_LIMITS.maxInvoiceItems, `An invoice can have at most ${BILLING_LIMITS.maxInvoiceItems} items.`).optional(),
    })
    .superRefine((value, ctx) => {
        if (value.items && value.items.length > 0) {
            const total = value.items.reduce((sum, item) => sum + item.amount, 0);
            if (!(total > 0)) ctx.addIssue({ code: "custom", path: ["items"], message: INVOICE_TOTAL_MESSAGE });
            else if (total > MAX_MONEY_AMOUNT) ctx.addIssue({ code: "custom", path: ["items"], message: "Invoice total is too large." });
        }
    });

export type InvoiceGenerateInput = z.output<typeof invoiceGenerateSchema>;

/** Recomputes an itemized invoice total server-side (never trust a client total). */
export function computeInvoiceTotal(items: { amount: number }[]): number {
    return roundCentavos(items.reduce((sum, item) => sum + item.amount, 0));
}

// ---------------------------------------------------------------------------
// Landlord review / collection / refunds
// ---------------------------------------------------------------------------

/**
 * POST /api/landlord/invoices/[id]/review.
 *
 * `mismatchResolution` / `paymentDiscrepancyType` are the field names the web
 * InvoiceModal sends; they are accepted as aliases of `nonExactAction` / `issueType`.
 */
export const invoiceReviewSchema = z
    .object({
        action: z.enum(INVOICE_REVIEW_ACTIONS, { error: "Select a valid review action." }),
        note: zOptionalText("Note", BILLING_LIMITS.reviewNote),
        acceptedAmount: zMoney("Accepted amount", { positive: true }).nullish(),
        amountTag: z.enum(PAYMENT_AMOUNT_TAGS, { error: "Amount tag is invalid." }).nullish(),
        nonExactAction: z.enum(NON_EXACT_ACTIONS, { error: "Select a valid resolution." }).nullish(),
        mismatchResolution: z.enum(NON_EXACT_ACTIONS, { error: "Select a valid resolution." }).nullish(),
        rejectionReason: zOptionalText("Rejection reason", BILLING_LIMITS.rejectionReason),
        issueType: z.enum(PAYMENT_ISSUE_TYPES, { error: "Issue type is invalid." }).nullish(),
        paymentDiscrepancyType: z.enum(PAYMENT_ISSUE_TYPES, { error: "Issue type is invalid." }).nullish(),
        shortfallAmount: zSignedMoney("Shortfall amount").nullish(),
        idempotencyKey: z.string().trim().max(120, "Idempotency key is too long.").nullish(),
        refundProofUrl: zOptionalHttpUrl("Refund proof URL"),
    })
    .transform(({ mismatchResolution, paymentDiscrepancyType, ...rest }) => ({
        ...rest,
        acceptedAmount: rest.acceptedAmount ?? undefined,
        amountTag: rest.amountTag ?? undefined,
        nonExactAction: rest.nonExactAction ?? mismatchResolution ?? undefined,
        issueType: rest.issueType ?? paymentDiscrepancyType ?? undefined,
        shortfallAmount: rest.shortfallAmount ?? undefined,
        idempotencyKey: rest.idempotencyKey || undefined,
    }))
    .superRefine((value, ctx) => {
        const needsReason =
            value.action === "reject" ||
            value.action === "request_completion" ||
            value.nonExactAction === "reject" ||
            value.nonExactAction === "request_completion";
        if (needsReason && !value.rejectionReason) {
            ctx.addIssue({ code: "custom", path: ["rejectionReason"], message: REJECTION_REASON_REQUIRED });
        }
    });

export type InvoiceReviewInput = z.output<typeof invoiceReviewSchema>;

/** POST /api/landlord/payments/collect */
export const collectPaymentSchema = z.object({
    invoiceId: zUuid("Invoice"),
    amount: zMoney("Amount collected", { positive: true }),
    method: z.enum(COLLECT_PAYMENT_METHODS, { error: "Select a valid payment method." }).default("cash"),
    referenceNumber: zOptionalText("Reference number", BILLING_LIMITS.reference),
    paymentDate: zOptionalPastOrTodayDate("Date received", "Date received cannot be in the future."),
    note: zOptionalText("Note", BILLING_LIMITS.collectionNote),
});

export type CollectPaymentInput = z.output<typeof collectPaymentSchema>;

/** Amount still owed on an invoice row (falls back to amount − paid for legacy rows with a zero balance). */
export function outstandingBalance(payment: { amount: unknown; paid_amount?: unknown; balance_remaining?: unknown }): number {
    const amount = Number(payment.amount ?? 0);
    const balance = Number(payment.balance_remaining ?? 0);
    if (Number.isFinite(balance) && balance > 0) return roundCentavos(balance);
    const paid = Number(payment.paid_amount ?? 0);
    return roundCentavos(Math.max(0, amount - (Number.isFinite(paid) ? paid : 0)));
}

// ---------------------------------------------------------------------------
// Tenant payments
// ---------------------------------------------------------------------------

/** POST /api/tenant/payments/[id]/submit (FormData → object). */
export const tenantPaymentSubmitSchema = z.object({
    method: z.literal("gcash", { error: "Use the in-person intent action for face-to-face payments." }),
    referenceNumber: z
        .string({ error: "Reference number is required for GCash submissions." })
        .trim()
        .min(1, "Reference number is required for GCash submissions.")
        .max(BILLING_LIMITS.reference, `Reference number cannot exceed ${BILLING_LIMITS.reference} characters.`),
    note: zOptionalText("Note", BILLING_LIMITS.paymentNote),
    partialAmount: z.preprocess(emptyToUndefined, zMoney("Payment amount", { positive: true }).optional()),
    selectedItemIds: zJsonUuidList("Selected items"),
    selectedReadingIds: zJsonUuidList("Selected readings"),
});

export type TenantPaymentSubmitInput = z.output<typeof tenantPaymentSubmitSchema>;

/** POST /api/tenant/payments/[id]/intent */
export const tenantPaymentIntentSchema = z.object({
    note: zOptionalText("Note", BILLING_LIMITS.paymentNote),
    selectedItemIds: zUuidList("Selected items").optional(),
    selectedReadingIds: zUuidList("Selected readings").optional(),
});

/** POST /api/tenant/payments/advance */
export const advancePaymentSchema = z.object({
    targetMonth: z
        .string({ error: "Target month must be a valid month (YYYY-MM)." })
        .trim()
        .regex(/^\d{4}-\d{2}$/, "Target month must be a valid month (YYYY-MM).")
        .refine((value) => isValidIsoDate(`${value}-01`), "Target month must be a valid month (YYYY-MM).")
        .optional(),
    monthsCount: z
        .number({ error: "Months must be a whole number between 1 and 12." })
        .int("Months must be a whole number between 1 and 12.")
        .min(1, "Months must be a whole number between 1 and 12.")
        .max(12, "Months must be a whole number between 1 and 12.")
        .optional()
        .default(1),
});

/** POST /api/tenant/payments/[id]/refund-info (FormData → object; the QR file is checked separately). */
export const refundInfoSchema = z.object({
    action: z.enum(REFUND_ACTIONS, { error: "Choose whether to credit or refund the excess." }),
    gcashNumber: z
        .string()
        .trim()
        .max(20, "Enter a valid GCash number (e.g. 0917 123 4567).")
        .nullish()
        .superRefine((value, ctx) => {
            const error = gcashNumberRule(value);
            if (error) ctx.addIssue({ code: "custom", message: error });
        })
        .transform((value) => (value ? value.replace(/[\s-]/g, "") : null)),
});

export const REFUND_DETAILS_REQUIRED = "Enter your GCash number or upload a GCash QR code to receive the refund.";

// ---------------------------------------------------------------------------
// Application (prospect) payment portal
// ---------------------------------------------------------------------------

/** POST /api/application-payments/[token] */
export const applicationPaymentSubmitSchema = z
    .object({
        paymentRequestId: z
            .string()
            .trim()
            .nullish()
            .refine((value) => !value || value === "all" || z.uuid().safeParse(value).success, "Payment request is invalid.")
            .transform((value) => (value ? value : "all")),
        method: z.preprocess(
            (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
            z.enum(["gcash", "cash"], { error: "Method must be either GCash or Cash." }),
        ),
        referenceNumber: zOptionalText("Reference number", BILLING_LIMITS.reference),
        note: zOptionalText("Note", BILLING_LIMITS.applicationNote),
    })
    .superRefine((value, ctx) => {
        if (value.method === "gcash" && !value.referenceNumber) {
            ctx.addIssue({ code: "custom", path: ["referenceNumber"], message: "Reference number is required for GCash submissions." });
        }
    });

// ---------------------------------------------------------------------------
// Utility readings
// ---------------------------------------------------------------------------

export const utilityReadingSchema = z
    .object({
        // Not always a lease UUID: the service also resolves unit IDs for vacant units.
        leaseId: z
            .string({ error: "Lease or unit identifier is required." })
            .trim()
            .min(1, "Lease or unit identifier is required.")
            .max(100, "Lease or unit identifier is invalid."),
        unitId: zOptionalText("Unit", 100),
        utilityType: z.enum(UTILITY_TYPES, { error: "Select a valid utility type." }),
        billingPeriodStart: zIsoDate("Billing period start"),
        billingPeriodEnd: zIsoDate("Billing period end"),
        previousReading: zMeterReading("Previous reading"),
        currentReading: zMeterReading("Current reading"),
        note: zOptionalText("Note", BILLING_LIMITS.readingNote),
    })
    .superRefine((value, ctx) => {
        const rangeError = dateRangeRule(value.billingPeriodStart, value.billingPeriodEnd, {
            endLabel: "Billing period end",
            startLabel: "billing period start",
        });
        if (rangeError) ctx.addIssue({ code: "custom", path: ["billingPeriodEnd"], message: rangeError });
        if (value.currentReading < value.previousReading) {
            ctx.addIssue({ code: "custom", path: ["currentReading"], message: READING_ORDER_MESSAGE });
        }
    });

export type UtilityReadingInput = z.output<typeof utilityReadingSchema>;

export const utilityReadingBulkSchema = z.object({
    readings: z
        .array(utilityReadingSchema, { error: "Readings must be a list." })
        .min(1, "Enter at least one reading.")
        .max(BILLING_LIMITS.maxBulkReadings, `You can save at most ${BILLING_LIMITS.maxBulkReadings} readings at once.`),
    postInvoices: z.boolean({ error: "postInvoices must be true or false." }).optional(),
    month: zBillingMonth("Month").optional(),
});

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export const EXPENSE_FUTURE_DATE_MESSAGE = "Date incurred cannot be in the future.";

export const expenseSchema = z.object({
    category: z.enum(EXPENSE_CATEGORIES, { error: "Select a valid expense category." }),
    amount: zMoney("Amount", { positive: true }),
    date_incurred: z
        .string({ error: "Date incurred is required." })
        .trim()
        .superRefine((value, ctx) => {
            const error = dateRule(value, { label: "Date incurred", max: todayIsoDate(), maxMessage: EXPENSE_FUTURE_DATE_MESSAGE });
            if (error) ctx.addIssue({ code: "custom", message: error });
        }),
    description: zRequiredText("Description", BILLING_LIMITS.expenseDescription),
    propertyId: z
        .union([zUuid("Property"), z.literal("all")], { error: "Property is invalid." })
        .nullish()
        .transform((value) => (value && value !== "all" ? value : null)),
});

export type ExpenseInput = z.output<typeof expenseSchema>;

/** `?propertyId=` filter shared by the landlord money list endpoints. */
export const propertyFilterQuerySchema = z
    .object({
        propertyId: z
            .string()
            .trim()
            .optional()
            .refine((value) => !value || value === "all" || z.uuid().safeParse(value).success, "Property is invalid."),
    })
    .loose();
