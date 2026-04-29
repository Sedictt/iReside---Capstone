import { createHash, randomBytes } from "crypto";

export type TenantInviteMode = "property" | "unit";
export type TenantInviteStatus = "active" | "revoked" | "expired" | "consumed";
export type TenantInviteApplicationType = "online" | "face_to_face" | "existing_tenant";
export type TenantInviteRequirementKey =
    | "valid_id"
    | "proof_of_income"
    | "application_form"
    | "move_in_payment";

export const TENANT_INVITE_REQUIREMENT_KEYS: TenantInviteRequirementKey[] = [
    "valid_id",
    "proof_of_income",
    "application_form",
    "move_in_payment",
];

export function generateInviteToken() {
    return randomBytes(24).toString("base64url");
}

export function hashInviteToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

export function buildInviteUrl(origin: string, token: string) {
    return `${origin.replace(/\/$/, "")}/apply/${token}`;
}

export function buildInviteQrUrl(inviteUrl: string) {
    const encoded = encodeURIComponent(inviteUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encoded}`;
}

export function getInviteAvailability(params: {
    status: TenantInviteStatus;
    expiresAt: string | null;
    useCount: number | null;
    maxUses: number | null;
    now?: Date;
}) {
    const now = params.now ?? new Date();
    const expiresAt = params.expiresAt ? new Date(params.expiresAt) : null;
    const expired = expiresAt ? expiresAt.getTime() <= now.getTime() : false;
    const useCount = params.useCount ?? 0;
    const maxUses = params.maxUses ?? 1;
    const consumed = useCount >= maxUses;
    const active = params.status === "active" && !expired && !consumed;

    return {
        active,
        expired,
        consumed,
    };
}
