import { createHash, randomBytes } from "crypto";

import type { Json } from "@/types/database";

export const PAYMENT_PENDING_DURATION_HOURS = 72;
export const PAYMENT_PENDING_REQUIREMENT_TYPES = ["advance_rent", "security_deposit"] as const;
export type ApplicationPaymentRequirementType = (typeof PAYMENT_PENDING_REQUIREMENT_TYPES)[number];

type ApplicationPaymentRequestStatus =
    | "pending"
    | "processing"
    | "completed"
    | "rejected"
    | "expired";

type PaymentPendingLeaseData = {
    start_date: string;
    end_date: string;
    monthly_rent: number;
    security_deposit: number;
    terms: Record<string, unknown>;
    landlord_signature: string;
};

export type PaymentPendingConfig = {
    created_at: string;
    lease_data: PaymentPendingLeaseData;
    advance_amount: number;
    security_amount: number;
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

export function resolvePaymentPendingExpiry(from: Date = new Date()) {
    return new Date(from.getTime() + PAYMENT_PENDING_DURATION_HOURS * 60 * 60 * 1000);
}

export function hashPortalToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

export function buildPortalToken() {
    const token = randomBytes(24).toString("base64url");
    return {
        token,
        hash: hashPortalToken(token),
    };
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
}

export function parseAmountValue(value: unknown, monthlyRent: number): number | null {
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
    template: Record<string, unknown> | null,
    keys: string[],
    monthlyRent: number
): number | null {
    if (!template) return null;

    const pools: Record<string, unknown>[] = [template];
    const answers = asRecord(template.answers);
    const defaults = asRecord(template.defaults);
    const paymentDefaults = asRecord(template.payment_defaults);

    if (answers) pools.push(answers);
    if (defaults) pools.push(defaults);
    if (paymentDefaults) pools.push(paymentDefaults);

    for (const pool of pools) {
        for (const key of keys) {
            const parsed = parseAmountValue(pool[key], monthlyRent);
            if (parsed && parsed > 0) return parsed;
        }
    }
    return null;
}

export function readPaymentPendingConfig(value: unknown): PaymentPendingConfig | null {
    const root = asRecord(value);
    const config = root ? asRecord(root.payment_pending_config) : null;
    if (!config) return null;

    const leaseData = asRecord(config.lease_data);
    if (!leaseData) return null;

    const start_date = typeof leaseData.start_date === "string" ? leaseData.start_date : "";
    const end_date = typeof leaseData.end_date === "string" ? leaseData.end_date : "";
    const monthly_rent = Number(leaseData.monthly_rent);
    const security_deposit = Number(leaseData.security_deposit);
    const landlord_signature =
        typeof leaseData.landlord_signature === "string" ? leaseData.landlord_signature : "";
    const terms = asRecord(leaseData.terms) ?? {};

    const advance_amount = Number(config.advance_amount);
    const security_amount = Number(config.security_amount);
    const created_at = typeof config.created_at === "string" ? config.created_at : "";

    if (
        !start_date ||
        !end_date ||
        !landlord_signature ||
        !Number.isFinite(monthly_rent) ||
        monthly_rent <= 0 ||
        !Number.isFinite(security_deposit) ||
        security_deposit <= 0 ||
        !Number.isFinite(advance_amount) ||
        advance_amount <= 0 ||
        !Number.isFinite(security_amount) ||
        security_amount <= 0
    ) {
        return null;
    }

    return {
        created_at,
        lease_data: {
            start_date,
            end_date,
            monthly_rent,
            security_deposit,
            landlord_signature,
            terms,
        },
        advance_amount,
        security_amount,
    };
}

export function withPaymentPendingConfig(
    current: unknown,
    config: PaymentPendingConfig
): Record<string, unknown> {
    const base = asRecord(current) ?? {};
    return {
        ...base,
        payment_pending_config: config,
    };
}

function normalizeChecklist(value: unknown): Record<string, unknown> {
    const parsed = asRecord(value);
    return parsed ?? {};
}

export function areRequiredPaymentRequestsCompleted(
    requests: Array<{ requirement_type?: string | null; status?: string | null }>
) {
    const completeByType = new Map<ApplicationPaymentRequirementType, boolean>();
    for (const type of PAYMENT_PENDING_REQUIREMENT_TYPES) completeByType.set(type, false);

    for (const request of requests) {
        const type = request.requirement_type as ApplicationPaymentRequirementType | undefined;
        if (!type || !completeByType.has(type)) continue;
        if (request.status === "completed") {
            completeByType.set(type, true);
        }
    }

    return PAYMENT_PENDING_REQUIREMENT_TYPES.every((type) => completeByType.get(type) === true);
}

export async function logApplicationPaymentAudit(
    adminClient: any,
    params: {
        application_id: string;
        payment_request_id?: string | null;
        actor_id?: string | null;
        actor_role: "system" | "landlord" | "prospect";
        event_type:
            | "request_generated"
            | "portal_opened"
            | "proof_submitted"
            | "payment_confirmed"
            | "payment_rejected"
            | "payment_needs_correction"
            | "bypass_used"
            | "expired"
            | "finalized";
        metadata?: Json;
    }
) {
    const { error } = await adminClient.from("application_payment_audit_events").insert({
        application_id: params.application_id,
        payment_request_id: params.payment_request_id ?? null,
        actor_id: params.actor_id ?? null,
        actor_role: params.actor_role,
        event_type: params.event_type,
        metadata: params.metadata ?? {},
    });

    if (error) {
        console.error("[application-payment] failed to log audit event:", error);
    }
}

export async function applyPaymentPendingExpiry(
    adminClient: any,
    applicationId: string
): Promise<{ expired: boolean; application: any | null }> {
    const { data: application, error } = await adminClient
        .from("applications")
        .select(
            "id, status, payment_pending_expires_at, requirements_checklist, payment_pending_started_at, payment_portal_token_hash, payment_portal_token_expires_at"
        )
        .eq("id", applicationId)
        .maybeSingle();

    if (error || !application) {
        return { expired: false, application: null };
    }

    if (application.status !== "payment_pending") {
        return { expired: false, application };
    }

    const expiresAtValue = application.payment_pending_expires_at;
    const expiresAt = expiresAtValue ? new Date(expiresAtValue) : null;
    const now = new Date();
    if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() > now.getTime()) {
        return { expired: false, application };
    }

    const { data: requests, error: requestsError } = await adminClient
        .from("application_payment_requests" as any)
        .select("id, status, requirement_type")
        .eq("application_id", applicationId);

    if (requestsError) {
        throw requestsError;
    }

    const allComplete = areRequiredPaymentRequestsCompleted(requests ?? []);
    if (allComplete) {
        return { expired: false, application };
    }

    const currentChecklist = normalizeChecklist(application.requirements_checklist);

    const { error: revertError } = await adminClient
        .from("applications")
        .update({
            status: "reviewing",
            payment_pending_started_at: null,
            payment_pending_expires_at: null,
            payment_portal_token_hash: null,
            payment_portal_token_expires_at: null,
            requirements_checklist: {
                ...currentChecklist,
                move_in_payment: false,
            },
        })
        .eq("id", applicationId)
        .eq("status", "payment_pending");

    if (revertError) {
        throw revertError;
    }

    await adminClient
        .from("application_payment_requests" as any)
        .update({ status: "expired" })
        .eq("application_id", applicationId)
        .in("status", ["pending", "processing"]);

    await logApplicationPaymentAudit(adminClient, {
        application_id: applicationId,
        actor_role: "system",
        event_type: "expired",
        metadata: {
            reason: "deadline_elapsed",
            expired_at: now.toISOString(),
        },
    });

    const { data: refreshed } = await adminClient
        .from("applications")
        .select(
            "id, status, payment_pending_expires_at, requirements_checklist, payment_pending_started_at, payment_portal_token_hash, payment_portal_token_expires_at"
        )
        .eq("id", applicationId)
        .maybeSingle();

    return { expired: true, application: refreshed ?? null };
}

export function buildPortalUrl(origin: string, token: string) {
    return `${origin.replace(/\/$/, "")}/apply/payments/${token}`;
}
