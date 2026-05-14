import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/auth";
import {
    ADVANCE_TEMPLATE_KEYS,
    DEPOSIT_TEMPLATE_KEYS,
    pickTemplateAmount,
} from "@/lib/application-payment-pending";
import {
    buildInviteQrUrl,
    buildInviteUrl,
    generateInviteToken,
    getInviteAvailability,
    hashInviteToken,
    TENANT_INVITE_REQUIREMENT_KEYS,
    type TenantInviteApplicationType,
    type TenantInviteMode,
    type TenantInviteRequirementKey,
} from "@/lib/tenant-intake-invites";

type InviteRow = {
    id: string;
    landlord_id: string;
    property_id: string;
    unit_id: string | null;
    mode: TenantInviteMode;
    application_type: TenantInviteApplicationType;
    required_requirements: TenantInviteRequirementKey[] | null;
    public_token: string;
    status: "active" | "revoked" | "expired" | "consumed";
    max_uses: number;
    use_count: number;
    expires_at: string | null;
    last_used_at: string | null;
    created_at: string;
};

type PaymentPreview = {
    advanceAmount: number;
    securityDepositAmount: number;
    estimated: true;
    disclaimer: string;
};

const PAYMENT_PREVIEW_DISCLAIMER =
    "Estimate only. Final payment requests are generated after landlord review.";

function buildPaymentPreview(args: {
    contractTemplate: Record<string, unknown> | null;
    monthlyRentFallback: number;
}): PaymentPreview {
    const fallback = Number(args.monthlyRentFallback ?? 0);
    const safeFallback = Number.isFinite(fallback) && fallback > 0 ? fallback : 0;
    const advanceAmount =
        pickTemplateAmount(args.contractTemplate, ADVANCE_TEMPLATE_KEYS, safeFallback) ?? safeFallback;
    const securityDepositAmount =
        pickTemplateAmount(args.contractTemplate, DEPOSIT_TEMPLATE_KEYS, safeFallback) ?? safeFallback;

    return {
        advanceAmount,
        securityDepositAmount,
        estimated: true,
        disclaimer: PAYMENT_PREVIEW_DISCLAIMER,
    };
}

function formatInviteError(
    error: { code?: string; message?: string; details?: string | null; hint?: string | null } | null | undefined,
    fallback: string
) {
    if (!error) {
        return fallback;
    }

    const message = error.message ?? fallback;

    if (
        message.includes("tenant_intake_invites") ||
        message.includes("tenant_intake_invite_events") ||
        message.includes("public_token") ||
        message.includes("token_hash")
    ) {
        return "The tenant invite database schema is missing or outdated. Run the latest Supabase migrations, then try again.";
    }

    if (message.includes("foreign key") || error.code === "23503") {
        return "Invite creation failed because the selected property or unit could not be linked correctly.";
    }

    if (error.code === "23505") {
        return "A matching invite token already exists. Please try again.";
    }

    return error.details ? `${message} (${error.details})` : message;
}

export async function GET(request: Request) {
    const { user } = await requireUser();
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: invites, error } = await adminClient
        .from("tenant_intake_invites" as any)
        .select("id, landlord_id, property_id, unit_id, mode, application_type, required_requirements, public_token, status, max_uses, use_count, expires_at, last_used_at, created_at")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[landlord invites GET] Failed to load invites:", error);
        return NextResponse.json(
            { error: formatInviteError(error, "Failed to load invites.") },
            { status: 500 }
        );
    }

    const inviteRows = (invites ?? []) as unknown as InviteRow[];
    const propertyIds = [...new Set(inviteRows.map((invite) => invite.property_id))];

    const { data: properties } = propertyIds.length
        ? await adminClient.from("properties").select("id, name, contract_template").in("id", propertyIds)
        : { data: [] };
    const { data: units } = propertyIds.length
        ? await adminClient.from("units").select("id, property_id, name, rent_amount").in("property_id", propertyIds)
        : { data: [] };

    const propertyMap = new Map(
        (properties ?? []).map((row) => [
            row.id,
            {
                name: row.name,
                contractTemplate:
                    row.contract_template &&
                    typeof row.contract_template === "object" &&
                    !Array.isArray(row.contract_template)
                        ? (row.contract_template as Record<string, unknown>)
                        : null,
            },
        ])
    );
    const unitMap = new Map(
        (units ?? []).map((row) => [
            row.id,
            {
                name: row.name,
                propertyId: row.property_id,
                rentAmount: Number(row.rent_amount ?? 0),
            },
        ])
    );
    const propertyRentFallback = new Map<string, number>();
    for (const unitRow of units ?? []) {
        const rent = Number(unitRow.rent_amount ?? 0);
        if (!Number.isFinite(rent) || rent <= 0) continue;
        if (!propertyRentFallback.has(unitRow.property_id)) {
            propertyRentFallback.set(unitRow.property_id, rent);
        }
    }
    const origin = new URL(request.url).origin;

    return NextResponse.json({
        invites: inviteRows.map((invite) => {
            const availability = getInviteAvailability({
                status: invite.status,
                expiresAt: invite.expires_at,
                useCount: invite.use_count,
                maxUses: invite.max_uses,
            });
            const shareUrl = buildInviteUrl(origin, invite.public_token);
            const property = propertyMap.get(invite.property_id);
            const unit = invite.unit_id ? unitMap.get(invite.unit_id) : null;
            const monthlyFallback = unit?.rentAmount ?? propertyRentFallback.get(invite.property_id) ?? 0;
            return {
                id: invite.id,
                mode: invite.mode,
                applicationType: invite.application_type ?? "face_to_face",
                requiredRequirements: Array.isArray(invite.required_requirements)
                    ? invite.required_requirements.filter((item): item is TenantInviteRequirementKey =>
                        typeof item === "string" && TENANT_INVITE_REQUIREMENT_KEYS.includes(item as TenantInviteRequirementKey)
                    )
                    : [],
                status: availability.expired ? "expired" : availability.consumed ? "consumed" : invite.status,
                propertyId: invite.property_id,
                propertyName: property?.name ?? "Property",
                unitId: invite.unit_id,
                unitName: invite.unit_id ? unit?.name ?? "Unit" : null,
                expiresAt: invite.expires_at,
                useCount: invite.use_count,
                maxUses: invite.max_uses,
                lastUsedAt: invite.last_used_at,
                createdAt: invite.created_at,
                paymentPreview: buildPaymentPreview({
                    contractTemplate: property?.contractTemplate ?? null,
                    monthlyRentFallback: monthlyFallback,
                }),
                shareUrl,
                qrUrl: buildInviteQrUrl(shareUrl),
            };
        }),
    });
}

export async function POST(request: Request) {
    const { user } = await requireUser();
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const body = (await request.json()) as {
        mode?: TenantInviteMode;
        applicationType?: TenantInviteApplicationType;
        requiredRequirements?: TenantInviteRequirementKey[];
        propertyId?: string;
        unitId?: string | null;
        expiresAt?: string | null;
    };

    const mode = body.mode;
    const applicationType = body.applicationType;
    const propertyId = body.propertyId;
    const unitId = body.unitId ?? null;

    if (mode !== "property" && mode !== "unit") {
        return NextResponse.json({ error: "Invalid invite mode." }, { status: 400 });
    }

    if (applicationType !== "face_to_face" && applicationType !== "online" && applicationType !== "existing_tenant") {
        return NextResponse.json({ error: "Invalid invite application type." }, { status: 400 });
    }

    if (!propertyId) {
        return NextResponse.json({ error: "Property is required." }, { status: 400 });
    }

    if (mode === "unit" && !unitId) {
        return NextResponse.json({ error: "Unit is required for unit-scoped invites." }, { status: 400 });
    }

    const { data: property, error: propertyError } = await adminClient
        .from("properties")
        .select("id, name, contract_template")
        .eq("id", propertyId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (propertyError || !property) {
        return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    let unitForPreview: { id: string; status: string; rent_amount: number } | null = null;
    if (mode === "unit" && unitId) {
        const { data: unit, error: unitError } = await adminClient
            .from("units")
            .select("id, status, rent_amount")
            .eq("id", unitId)
            .eq("property_id", propertyId)
            .maybeSingle();

        if (unitError || !unit) {
            return NextResponse.json({ error: "Unit not found for this property." }, { status: 404 });
        }

        if (unit.status !== "vacant") {
            return NextResponse.json({ error: "Only vacant units can receive invite links." }, { status: 400 });
        }
        unitForPreview = {
            id: unit.id,
            status: unit.status,
            rent_amount: Number(unit.rent_amount ?? 0),
        };
    }

    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
        return NextResponse.json({ error: "Invalid expiration date." }, { status: 400 });
    }

    const token = generateInviteToken();
    const inviteId = crypto.randomUUID();
    const requiredRequirements = applicationType === "online"
        ? Array.from(new Set((Array.isArray(body.requiredRequirements) ? body.requiredRequirements : []).filter(
            (item): item is TenantInviteRequirementKey =>
                typeof item === "string" &&
                TENANT_INVITE_REQUIREMENT_KEYS.includes(item as TenantInviteRequirementKey) &&
                item !== "move_in_payment"
        )))
        : [];

    if (applicationType === "online" && requiredRequirements.length === 0) {
        return NextResponse.json({ error: "Select at least one required document for online applications." }, { status: 400 });
    }

    const { error: insertError } = await adminClient.from("tenant_intake_invites" as any).insert({
        id: inviteId,
        landlord_id: user.id,
        property_id: propertyId,
        unit_id: mode === "unit" ? unitId : null,
        mode,
        application_type: applicationType,
        required_requirements: requiredRequirements,
        public_token: token,
        token_hash: hashInviteToken(token),
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        max_uses: 1,
        use_count: 0,
        status: "active",
    });

    if (insertError) {
        console.error("[landlord invites POST] Failed to create invite:", insertError);
        return NextResponse.json(
            { error: formatInviteError(insertError, "Failed to create invite.") },
            { status: 500 }
        );
    }

    const { error: eventError } = await adminClient.from("tenant_intake_invite_events" as any).insert({
        invite_id: inviteId,
        event_type: "created",
        metadata: {
            mode,
            applicationType,
            requiredRequirements,
            propertyId,
            unitId: mode === "unit" ? unitId : null,
        },
    });

    if (eventError) {
        console.error("[landlord invites POST] Failed to write invite event:", eventError);
    }

    const origin = new URL(request.url).origin;
    const shareUrl = buildInviteUrl(origin, token);

    const propertyTemplate =
        property.contract_template &&
        typeof property.contract_template === "object" &&
        !Array.isArray(property.contract_template)
            ? (property.contract_template as Record<string, unknown>)
            : null;

    const paymentPreview = buildPaymentPreview({
        contractTemplate: propertyTemplate,
        monthlyRentFallback: unitForPreview?.rent_amount ?? 0,
    });

    return NextResponse.json({
        invite: {
            id: inviteId,
            mode,
            applicationType,
            requiredRequirements,
            propertyId,
            unitId: mode === "unit" ? unitId : null,
            status: "active",
            expiresAt: expiresAt ? expiresAt.toISOString() : null,
            useCount: 0,
            maxUses: 1,
            lastUsedAt: null,
            createdAt: new Date().toISOString(),
            paymentPreview,
            shareUrl,
            qrUrl: buildInviteQrUrl(shareUrl),
        },
    });
}
