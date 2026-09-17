import type {
    Json,
    PaymentStatus,
    PaymentWorkflowStatus,
    UtilityBillingMode,
    UtilityType,
} from "@/types/database";

export type InvoiceStatus =
    | "paid"
    | "pending"
    | "overdue"
    | "processing"
    | "failed"
    | "refunded"
    | "reminder_sent"
    | "intent_submitted"
    | "under_review"
    | "awaiting_in_person"
    | "confirmed"
    | "rejected"
    | "receipted";

export type LeaseBillingTerms = {
    dueDay: number;
    lateFeeAmount: number;
    allowPartialPayments: boolean;
    utilitiesDescription: string | null;
};

const DEFAULT_TERMS: LeaseBillingTerms = {
    dueDay: 5,
    lateFeeAmount: 0,
    allowPartialPayments: false,
    utilitiesDescription: null,
};

export const PHP_CURRENCY = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export const formatPhpCurrency = (value: number | null | undefined) =>
    PHP_CURRENCY.format(Number.isFinite(value) ? Number(value) : 0);

export const formatDateLong = (value: string | null | undefined) => {
    if (!value) return "Not set";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not set";

    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
};

export const formatDateShort = (value: string | null | undefined) => {
    if (!value) return "Not set";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not set";

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export const getMonthStart = (value?: string | Date) => {
    const date = value ? new Date(value) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getMonthEnd = (value?: string | Date) => {
    const start = getMonthStart(value);
    return new Date(start.getFullYear(), start.getMonth() + 1, 0);
};

export const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);

export const getInvoiceStatus = ({
    status,
    workflowStatus,
    dueDate,
    balanceRemaining,
}: {
    status: PaymentStatus;
    workflowStatus?: PaymentWorkflowStatus | null;
    dueDate: string;
    balanceRemaining?: number | null;
}): InvoiceStatus => {
    // 1. Explicit terminal states from DB status column
    if (status === "completed") return "paid";
    if (status === "failed") return "failed";
    if (status === "refunded") return "refunded";

    // 2. Under review takes priority over balance checks (so provisional balance deduction during proof submit doesn't mark as paid)
    if (workflowStatus === "under_review") return "under_review";
    if (workflowStatus === "rejected") return "rejected";
    if (workflowStatus === "receipted") return "paid";

    // 3. Balance-based "paid" status
    if ((balanceRemaining ?? 0) <= 0) return "paid";

    // 4. In-flight workflow states when balance is still owed
    if (workflowStatus === "reminder_sent") return "reminder_sent";
    if (workflowStatus === "intent_submitted") return "intent_submitted";
    if (workflowStatus === "awaiting_in_person") return "awaiting_in_person";

    // 5. Processing state
    if (status === "processing") return "processing";

    // 6. Overdue check
    const due = new Date(dueDate);
    if (!Number.isNaN(due.getTime()) && due.getTime() < Date.now()) {
        return "overdue";
    }

    return "pending";
};

export type InvoiceFilterCategory = "overdue" | "under_review" | "pending" | "paid";

export const getInvoiceFilterCategory = (invoice: {
    status: string;
    workflowStatus?: string | null;
    proofStatus?: string | null;
    balanceRemaining: number;
    dueDate?: string | null;
}): InvoiceFilterCategory => {
    // 1. Awaiting verification of submitted payment proof
    const isAwaitingVerification =
        (invoice.workflowStatus === "under_review" ||
            invoice.status === "under_review" ||
            invoice.proofStatus === "submitted") &&
        invoice.workflowStatus !== "confirmed" &&
        invoice.status !== "completed";

    if (isAwaitingVerification) {
        return "under_review";
    }

    // 2. Settled / paid in full
    const isSettled =
        invoice.balanceRemaining <= 0 ||
        invoice.status === "completed" ||
        invoice.status === "paid" ||
        invoice.workflowStatus === "receipted";

    if (isSettled) {
        return "paid";
    }

    // 3. Past due date with balance remaining
    const isOverdue =
        invoice.status === "overdue" ||
        invoice.workflowStatus === "overdue" ||
        (invoice.dueDate
            ? !Number.isNaN(new Date(invoice.dueDate).getTime()) &&
              new Date(invoice.dueDate).getTime() < Date.now()
            : false);

    if (isOverdue) {
        return "overdue";
    }

    // 4. Pending payment (awaiting payment, cash collection scheduled, reminder sent, partial balance)
    return "pending";
};

export const getInvoiceDisplayStatus = (invoice: {
    status: string;
    workflowStatus?: string | null;
    proofStatus?: string | null;
    balanceRemaining: number;
    dueDate?: string | null;
    hasReceipt?: boolean;
}): string => {
    // 1. Under verification
    if (
        (invoice.workflowStatus === "under_review" ||
            invoice.status === "under_review" ||
            invoice.proofStatus === "submitted") &&
        invoice.workflowStatus !== "confirmed" &&
        invoice.status !== "completed"
    ) {
        return "under_review";
    }

    // 2. Settled: strictly display Settled or Finalized (never Awaiting Payment)
    if (
        invoice.balanceRemaining <= 0 ||
        invoice.status === "completed" ||
        invoice.status === "paid" ||
        invoice.workflowStatus === "receipted"
    ) {
        return invoice.hasReceipt || invoice.workflowStatus === "receipted" ? "receipted" : "paid";
    }

    // 3. Overdue check when balance is owed
    if (
        invoice.status === "overdue" ||
        invoice.workflowStatus === "overdue" ||
        (invoice.dueDate &&
            !Number.isNaN(new Date(invoice.dueDate).getTime()) &&
            new Date(invoice.dueDate).getTime() < Date.now())
    ) {
        return "overdue";
    }

    // 4. Active pending workflow states
    if (invoice.workflowStatus === "awaiting_in_person") return "awaiting_in_person";
    if (invoice.workflowStatus === "intent_submitted") return "intent_submitted";
    if (invoice.workflowStatus === "rejected") return "rejected";
    if (invoice.workflowStatus === "reminder_sent") return "reminder_sent";

    return "pending";
};

export const parseLeaseBillingTerms = (terms: Json | null): LeaseBillingTerms => {
    if (!terms || typeof terms !== "object" || Array.isArray(terms)) {
        return DEFAULT_TERMS;
    }

    const record = terms as Record<string, Json | undefined>;
    const dueDayRaw = record.dueDay ?? record.due_day ?? record.rent_due_day ?? record.rentDueDay;
    const lateFeeRaw = record.lateFeeAmount ?? record.late_fee ?? record.late_fee_amount;
    const allowPartialRaw = record.allowPartialPayments ?? record.allow_partial_payments;
    const utilitiesDescription = typeof record.utilitiesDescription === "string"
        ? record.utilitiesDescription
        : typeof record.utilities_description === "string"
            ? record.utilities_description
            : null;

    const dueDay = typeof dueDayRaw === "number" ? dueDayRaw : DEFAULT_TERMS.dueDay;
    const lateFeeAmount = typeof lateFeeRaw === "number" ? lateFeeRaw : DEFAULT_TERMS.lateFeeAmount;
    const allowPartialPayments = typeof allowPartialRaw === "boolean"
        ? allowPartialRaw
        : DEFAULT_TERMS.allowPartialPayments;

    return {
        dueDay,
        lateFeeAmount,
        allowPartialPayments,
        utilitiesDescription,
    };
};

/**
 * Resolves the effective due date for a target billing month.
 * Respects explicit lease terms (dueDay/due_day/rent_due_day) or falls back
 * to the day of month from the lease start_date. Safely clamps to days in month.
 */
export const resolveLeaseBillingDueDate = (
    lease: { start_date?: string | null; terms?: Json | null } | null | undefined,
    targetDate: Date
): string => {
    const terms = parseLeaseBillingTerms(lease?.terms ?? null);
    const hasExplicitDueDay =
        typeof (lease?.terms as any)?.dueDay === "number" ||
        typeof (lease?.terms as any)?.due_day === "number" ||
        typeof (lease?.terms as any)?.rent_due_day === "number" ||
        typeof (lease?.terms as any)?.rentDueDay === "number";

    let startDay = DEFAULT_TERMS.dueDay;
    if (lease?.start_date) {
        const parsed = new Date(lease.start_date);
        if (!Number.isNaN(parsed.getTime())) {
            startDay = parsed.getDate();
        }
    }

    const targetDay = hasExplicitDueDay ? terms.dueDay : (startDay || DEFAULT_TERMS.dueDay);
    const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
    const safeDay = Math.max(1, Math.min(targetDay, daysInMonth));
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(safeDay).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const getUtilityUnitLabel = (utilityType: UtilityType) =>
    utilityType === "water" ? "cubic_meter" : "kwh";

export const computeUsage = (previousReading: number, currentReading: number) =>
    Number((currentReading - previousReading).toFixed(2));

export const computeUtilityCharge = ({
    mode,
    ratePerUnit,
    usage,
}: {
    mode: UtilityBillingMode;
    ratePerUnit: number;
    usage: number;
}) => {
    if (mode === "included_in_rent") return 0;
    return Number((ratePerUnit * usage).toFixed(2));
};

export const makeInvoiceNumber = (paymentId: string, billingCycle: string) =>
    `INV-${billingCycle.replace(/-/g, "").slice(0, 6)}-${paymentId.slice(0, 8).toUpperCase()}`;

export const makeReceiptNumber = (paymentId: string, issuedAt: string) =>
    `REC-${issuedAt.replace(/-/g, "").slice(0, 6)}-${paymentId.slice(0, 8).toUpperCase()}`;

export const sanitizeFileName = (name: string) =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
