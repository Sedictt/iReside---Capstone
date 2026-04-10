import type { Json, PaymentStatus, UtilityBillingMode, UtilityType } from "@/types/database";

export type InvoiceStatus = "paid" | "pending" | "overdue" | "processing" | "failed" | "refunded";

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
    dueDate,
    balanceRemaining,
}: {
    status: PaymentStatus;
    dueDate: string;
    balanceRemaining?: number | null;
}): InvoiceStatus => {
    if (status === "completed" || (balanceRemaining ?? 0) <= 0) return "paid";
    if (status === "processing") return "processing";
    if (status === "failed") return "failed";
    if (status === "refunded") return "refunded";

    const due = new Date(dueDate);
    if (!Number.isNaN(due.getTime()) && due.getTime() < Date.now()) {
        return "overdue";
    }

    return "pending";
};

export const parseLeaseBillingTerms = (terms: Json | null): LeaseBillingTerms => {
    if (!terms || typeof terms !== "object" || Array.isArray(terms)) {
        return DEFAULT_TERMS;
    }

    const record = terms as Record<string, Json | undefined>;
    const dueDayRaw = record.dueDay ?? record.due_day;
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
