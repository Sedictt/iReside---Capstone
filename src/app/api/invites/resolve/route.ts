import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInviteToken, hashInviteToken } from "@/lib/tenant-intake-invites";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const unitId = url.searchParams.get("unitId") || url.searchParams.get("unit");
    const code = url.searchParams.get("code");

    const adminClient = createAdminClient();

    try {
        // 1. If an invite code was passed in query param, verify it directly
        if (code) {
            const { data: inviteByCode } = await (adminClient
                .from("tenant_intake_invites" as any)
                .select("id, public_token, status")
                .eq("public_token", code.trim())
                .maybeSingle() as any);

            if (inviteByCode && inviteByCode.status === "active") {
                return NextResponse.json({
                    ok: true,
                    token: inviteByCode.public_token,
                    redirectUrl: `/apply/${inviteByCode.public_token}`,
                });
            }
        }

        // 2. If unitId is provided, find or create an active intake invite for this unit
        if (!unitId) {
            return NextResponse.json({ error: "Unit ID or invite code is required." }, { status: 400 });
        }

        // Check if there is already an active invite for this unit
        const { data: existingInvite } = await (adminClient
            .from("tenant_intake_invites" as any)
            .select("id, public_token, status, expires_at")
            .eq("unit_id", unitId)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle() as any);

        if (existingInvite?.public_token) {
            return NextResponse.json({
                ok: true,
                token: existingInvite.public_token,
                redirectUrl: `/apply/${existingInvite.public_token}`,
            });
        }

        // If no active invite exists, verify unit and property
        const { data: unit, error: unitError } = await adminClient
            .from("units")
            .select("id, name, property_id, status, rent_amount")
            .eq("id", unitId)
            .maybeSingle();

        if (unitError || !unit) {
            return NextResponse.json({ error: "Unit not found." }, { status: 404 });
        }

        const { data: property, error: propError } = await adminClient
            .from("properties")
            .select("id, landlord_id, name")
            .eq("id", unit.property_id)
            .maybeSingle();

        if (propError || !property) {
            return NextResponse.json({ error: "Property not found." }, { status: 404 });
        }

        // Auto-generate an active invite token for this unit
        const token = generateInviteToken();
        const inviteId = crypto.randomUUID();
        const tokenHash = hashInviteToken(token);

        const { error: insertError } = await (adminClient
            .from("tenant_intake_invites" as any)
            .insert({
                id: inviteId,
                landlord_id: property.landlord_id,
                property_id: property.id,
                unit_id: unit.id,
                mode: "unit",
                application_type: "online",
                required_requirements: ["valid_id", "proof_of_income"],
                public_token: token,
                token_hash: tokenHash,
                status: "active",
                max_uses: 100,
                use_count: 0,
                expires_at: null,
            }) as any);

        if (insertError) {
            console.error("Error creating auto-invite for unit:", insertError);
            return NextResponse.json({ error: "Failed to generate application link for this unit." }, { status: 500 });
        }

        return NextResponse.json({
            ok: true,
            token,
            redirectUrl: `/apply/${token}`,
        });
    } catch (err: any) {
        console.error("Error resolving unit invite:", err);
        return NextResponse.json({ error: "Unable to resolve unit application." }, { status: 500 });
    }
}
