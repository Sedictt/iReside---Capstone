export type InvitePaymentTerms = {
    advanceMonths: number;
    securityDepositMonths: number;
    customAdvanceAmount?: number | null;
    customSecurityDepositAmount?: number | null;
};

export type PaymentPreview = {
    advanceAmount: number;
    securityDepositAmount: number;
    totalMoveInAmount: number;
    advanceMonths: number;
    securityDepositMonths: number;
    isCustomAdvance: boolean;
    isCustomDeposit: boolean;
    estimated: true;
    disclaimer: string;
};

export const PAYMENT_PREVIEW_DISCLAIMER =
    "Estimate only. Final payment requests are generated after landlord review.";

export const DEFAULT_INVITE_PAYMENT_TERMS: InvitePaymentTerms = {
    advanceMonths: 1,
    securityDepositMonths: 1,
    customAdvanceAmount: null,
    customSecurityDepositAmount: null,
};

export const ADVANCE_TEMPLATE_KEYS = [
    "advance",
    "advance_amount",
    "advance_payment",
    "advance_rent",
    "first_month_advance",
];

export const DEPOSIT_TEMPLATE_KEYS = [
    "deposit",
    "security_deposit",
    "security_deposit_amount",
];

export function parseTemplateAmount(value: unknown, monthlyRent: number): number | null {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
    if (typeof value !== "string") return null;

    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;

    const monthMatch = normalized.match(/(\d+(?:\.\d+)?)\s*month/);
    if (monthMatch && monthlyRent > 0) {
        const months = Number(monthMatch[1]);
        if (Number.isFinite(months) && months > 0) return months * monthlyRent;
    }

    if (normalized.includes("month") && monthlyRent > 0) return monthlyRent;

    const numeric = Number(normalized.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

export function pickTemplateAmount(
    template: Record<string, unknown> | null | undefined,
    keys: string[],
    monthlyRent: number
): number | null {
    if (!template) return null;

    const pools: Array<Record<string, unknown>> = [template];
    const answers = template.answers;
    if (answers && typeof answers === "object" && !Array.isArray(answers)) {
        pools.push(answers as Record<string, unknown>);
    }
    const defaults = template.defaults;
    if (defaults && typeof defaults === "object" && !Array.isArray(defaults)) {
        pools.push(defaults as Record<string, unknown>);
    }
    const paymentDefaults = template.payment_defaults;
    if (paymentDefaults && typeof paymentDefaults === "object" && !Array.isArray(paymentDefaults)) {
        pools.push(paymentDefaults as Record<string, unknown>);
    }

    for (const pool of pools) {
        for (const key of keys) {
            const parsed = parseTemplateAmount(pool[key], monthlyRent);
            if (parsed && parsed > 0) return parsed;
        }
    }
    return null;
}

export function sanitizePaymentTerms(raw: unknown): InvitePaymentTerms {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return { ...DEFAULT_INVITE_PAYMENT_TERMS };
    }

    const obj = raw as Record<string, unknown>;

    let advanceMonths = 1;
    if (typeof obj.advanceMonths === "number" && Number.isFinite(obj.advanceMonths)) {
        advanceMonths = obj.advanceMonths < 0 ? -1 : Math.max(0, Math.floor(obj.advanceMonths));
    } else if (typeof obj.advance_months === "number" && Number.isFinite(obj.advance_months)) {
        advanceMonths = obj.advance_months < 0 ? -1 : Math.max(0, Math.floor(obj.advance_months));
    }

    let securityDepositMonths = 1;
    if (typeof obj.securityDepositMonths === "number" && Number.isFinite(obj.securityDepositMonths)) {
        securityDepositMonths = obj.securityDepositMonths < 0 ? -1 : Math.max(0, Math.floor(obj.securityDepositMonths));
    } else if (typeof obj.security_deposit_months === "number" && Number.isFinite(obj.security_deposit_months)) {
        securityDepositMonths = obj.security_deposit_months < 0 ? -1 : Math.max(0, Math.floor(obj.security_deposit_months));
    }

    let customAdvanceAmount: number | null = null;
    const rawCustomAdvance = obj.customAdvanceAmount ?? obj.custom_advance_amount;
    if (typeof rawCustomAdvance === "number" && Number.isFinite(rawCustomAdvance) && rawCustomAdvance >= 0) {
        customAdvanceAmount = Math.round(rawCustomAdvance * 100) / 100;
    }

    let customSecurityDepositAmount: number | null = null;
    const rawCustomDeposit = obj.customSecurityDepositAmount ?? obj.custom_security_deposit_amount;
    if (typeof rawCustomDeposit === "number" && Number.isFinite(rawCustomDeposit) && rawCustomDeposit >= 0) {
        customSecurityDepositAmount = Math.round(rawCustomDeposit * 100) / 100;
    }

    return {
        advanceMonths,
        securityDepositMonths,
        customAdvanceAmount,
        customSecurityDepositAmount,
    };
}

export function calculatePaymentPreview(
    argOrMonthlyRent:
        | number
        | {
              monthlyRent: number;
              terms?: InvitePaymentTerms | null;
              contractTemplate?: Record<string, unknown> | null;
          },
    termsParam?: InvitePaymentTerms | null,
    contractTemplateParam?: Record<string, unknown> | null
): PaymentPreview {
    let monthlyRent = 0;
    let terms: InvitePaymentTerms | null = null;
    let contractTemplate: Record<string, unknown> | null = null;

    if (typeof argOrMonthlyRent === "number") {
        monthlyRent = argOrMonthlyRent;
        terms = termsParam ?? null;
        contractTemplate = contractTemplateParam ?? null;
    } else if (argOrMonthlyRent && typeof argOrMonthlyRent === "object") {
        monthlyRent = argOrMonthlyRent.monthlyRent;
        terms = argOrMonthlyRent.terms ?? null;
        contractTemplate = argOrMonthlyRent.contractTemplate ?? null;
    }

    const rent = Number.isFinite(monthlyRent) && monthlyRent > 0 ? monthlyRent : 0;
    const sanitizedTerms = terms ? sanitizePaymentTerms(terms) : null;

    let advanceAmount = 0;
    let securityDepositAmount = 0;
    let advanceMonths = 1;
    let securityDepositMonths = 1;
    let isCustomAdvance = false;
    let isCustomDeposit = false;

    if (sanitizedTerms) {
        advanceMonths = sanitizedTerms.advanceMonths;
        securityDepositMonths = sanitizedTerms.securityDepositMonths;

        if (advanceMonths === -1 && sanitizedTerms.customAdvanceAmount != null) {
            advanceAmount = sanitizedTerms.customAdvanceAmount;
            isCustomAdvance = true;
        } else if (advanceMonths >= 0) {
            advanceAmount = advanceMonths * rent;
        }

        if (securityDepositMonths === -1 && sanitizedTerms.customSecurityDepositAmount != null) {
            securityDepositAmount = sanitizedTerms.customSecurityDepositAmount;
            isCustomDeposit = true;
        } else if (securityDepositMonths >= 0) {
            securityDepositAmount = securityDepositMonths * rent;
        }
    } else {
        // Fallback for legacy invites or when terms were not configured
        advanceAmount = pickTemplateAmount(contractTemplate, ADVANCE_TEMPLATE_KEYS, rent) ?? rent;
        securityDepositAmount = pickTemplateAmount(contractTemplate, DEPOSIT_TEMPLATE_KEYS, rent) ?? rent;
    }

    return {
        advanceAmount,
        securityDepositAmount,
        totalMoveInAmount: advanceAmount + securityDepositAmount,
        advanceMonths,
        securityDepositMonths,
        isCustomAdvance,
        isCustomDeposit,
        estimated: true,
        disclaimer: PAYMENT_PREVIEW_DISCLAIMER,
    };
}
