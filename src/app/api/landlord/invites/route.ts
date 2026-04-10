import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildInviteQrUrl, buildInviteUrl, generateInviteToken, getInviteAvailability, hashInviteToken, type TenantInviteMode } from "@/lib/tenant-intake-invites";

type InviteRow = {
    id: string;
    landlord_id: string;
    property_id: string;
    unit_id: string | null;
    mode: TenantInviteMode;
    public_token: string;
    status: "active" | "revoked" | "expired" | "consumed";
    max_uses: number;
    use_count: number;
    expires_at: string | null;
    last_used_at: string | null;
    created_at: string;
};

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
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: invites, error } = await adminClient
        .from("tenant_intake_invites")
        .select("id, landlord_id, property_id, unit_id, mode, public_token, status, max_uses, use_count, expires_at, last_used_at, created_at")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[landlord invites GET] Failed to load invites:", error);
        return NextResponse.json(
            { error: formatInviteError(error, "Failed to load invites.") },
            { status: 500 }
        );
    }

    const inviteRows = (invites ?? []) as InviteRow[];
    const propertyIds = [...new Set(inviteRows.map((invite) => invite.property_id))];
    const unitIds = [...new Set(inviteRows.map((invite) => invite.unit_id).filter((value): value is string => Boolean(value)))];

    const { data: properties } = propertyIds.length
        ? await adminClient.from("properties").select("id, name").in("id", propertyIds)
        : { data: [] };
    const { data: units } = unitIds.length
        ? await adminClient.from("units").select("id, name").in("id", unitIds)
        : { data: [] };

    const propertyMap = new Map((properties ?? []).map((row) => [row.id, row.name]));
    const unitMap = new Map((units ?? []).map((row) => [row.id, row.name]));
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
            return {
                id: invite.id,
                mode: invite.mode,
                status: availability.expired ? "expired" : availability.consumed ? "consumed" : invite.status,
                propertyId: invite.property_id,
                propertyName: propertyMap.get(invite.property_id) ?? "Property",
                unitId: invite.unit_id,
                unitName: invite.unit_id ? unitMap.get(invite.unit_id) ?? "Unit" : null,
                expiresAt: invite.expires_at,
                useCount: invite.use_count,
                maxUses: invite.max_uses,
                lastUsedAt: invite.last_used_at,
                createdAt: invite.created_at,
                shareUrl,
                qrUrl: buildInviteQrUrl(shareUrl),
            };
        }),
    });
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
        mode?: TenantInviteMode;
        propertyId?: string;
        unitId?: string | null;
        expiresAt?: string | null;
    };

    const mode = body.mode;
    const propertyId = body.propertyId;
    const unitId = body.unitId ?? null;

    if (mode !== "property" && mode !== "unit") {
        return NextResponse.json({ error: "Invalid invite mode." }, { status: 400 });
    }

    if (!propertyId) {
        return NextResponse.json({ error: "Property is required." }, { status: 400 });
    }

    if (mode === "unit" && !unitId) {
        return NextResponse.json({ error: "Unit is required for unit-scoped invites." }, { status: 400 });
    }

    const { data: property, error: propertyError } = await adminClient
        .from("properties")
        .select("id")
        .eq("id", propertyId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (propertyError || !property) {
        return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    if (mode === "unit" && unitId) {
        const { data: unit, error: unitError } = await adminClient
            .from("units")
            .select("id, status")
            .eq("id", unitId)
            .eq("property_id", propertyId)
            .maybeSingle();

        if (unitError || !unit) {
            return NextResponse.json({ error: "Unit not found for this property." }, { status: 404 });
        }

        if (unit.status !== "vacant") {
            return NextResponse.json({ error: "Only vacant units can receive invite links." }, { status: 400 });
        }
    }

    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
        return NextResponse.json({ error: "Invalid expiration date." }, { status: 400 });
    }

    const token = generateInviteToken();
    const inviteId = crypto.randomUUID();

    const { error: insertError } = await adminClient.from("tenant_intake_invites").insert({
        id: inviteId,
        landlord_id: user.id,
        property_id: propertyId,
        unit_id: mode === "unit" ? unitId : null,
        mode,
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

    const { error: eventError } = await adminClient.from("tenant_intake_invite_events").insert({
        invite_id: inviteId,
        event_type: "created",
        metadata: { mode, propertyId, unitId: mode === "unit" ? unitId : null },
    });

    if (eventError) {
        console.error("[landlord invites POST] Failed to write invite event:", eventError);
    }

    const origin = new URL(request.url).origin;
    const shareUrl = buildInviteUrl(origin, token);

    return NextResponse.json({
        invite: {
            id: inviteId,
            mode,
            propertyId,
            unitId: mode === "unit" ? unitId : null,
            status: "active",
            expiresAt: expiresAt ? expiresAt.toISOString() : null,
            useCount: 0,
            maxUses: 1,
            lastUsedAt: null,
            createdAt: new Date().toISOString(),
            shareUrl,
            qrUrl: buildInviteQrUrl(shareUrl),
        },
    });
}
