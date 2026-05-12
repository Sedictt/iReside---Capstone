import type { ComplianceChecklist } from "./types";

export const DEFAULT_COMPLIANCE_CHECKLIST: ComplianceChecklist = {
    valid_id: false,
    income_verified: false,
    application_completed: false,
    background_checked: false,
    payment_received: false,
    lease_signed: false,
    inspection_done: false,
};

export const buildComplianceChecklist = (
    complianceChecklist: Record<string, boolean> | null,
    requirementsChecklist: Record<string, boolean> | null
): ComplianceChecklist => {
    const merged = {
        ...(complianceChecklist ?? {}),
        ...(requirementsChecklist ?? {}),
    };

    return {
        valid_id: Boolean(merged.valid_id),
        income_verified: Boolean(merged.income_verified),
        application_completed: Boolean(merged.application_completed),
        background_checked: Boolean(merged.background_checked),
        payment_received: Boolean(merged.payment_received),
        lease_signed: Boolean(merged.lease_signed),
        inspection_done: Boolean(merged.inspection_done),
    };
};

export const FALLBACK_PROPERTY_IMAGE =
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&auto=format&fit=crop&q=80";

export const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

export function extractMissingColumn(error: import("./types").PostgrestLikeError | null | undefined) {
    if (!error || !error.message) {
        return null;
    }

    // PostgREST schema cache error format (e.g., PGRST204)
    const postgrestMatch = error.message.match(/'([^']+)' column/);
    if (postgrestMatch?.[1]) {
        return postgrestMatch[1];
    }

    // PostgreSQL undefined column format (e.g., 42703: column applications.lease_id does not exist)
    const postgresMatch = error.message.match(/column\s+([a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)\s+does not exist/i);
    if (postgresMatch?.[2]) {
        return postgresMatch[2];
    }

    return null;
}
