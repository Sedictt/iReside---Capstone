import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { parseJsonBody } from "@/lib/validation/server";
import { isId, unitHoldSchema } from "@/lib/validation/schemas/tenant-lifecycle.schema";
import {
    getActiveUnitHold,
    resolveHoldExpiryIso,
    setUnitHoldInTemplate,
} from "@/lib/unit-hold";
import type { UnitHoldInfo } from "@/lib/application-intake";
import { sendUnitOnHoldStatusEmail } from "@/lib/email";
import { invalidatePropertyUnitsCache } from "@/app/api/landlord/property-units/route";

export async function POST(
    request: Request,
    context: { params: Promise<{ unitId: string }> }
) {
    const { unitId } = await context.params;
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId } = authContext;

    if (!isId(unitId)) {
        return NextResponse.json({ error: "Invalid unit ID." }, { status: 400 });
    }

    const parsed = await parseJsonBody(request, unitHoldSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const adminClient = createServiceRoleSupabaseClient();

    const { data: unit, error: unitErr } = await adminClient
        .from("units")
        .select("id, name, property_id, status")
        .eq("id", unitId)
        .maybeSingle();

    if (unitErr || !unit) {
        return NextResponse.json({ error: "Unit not found." }, { status: 404 });
    }

    if ((unit.status ?? "").toLowerCase() === "occupied") {
        return NextResponse.json(
            { error: "Cannot place a hold on a unit that is already occupied." },
            { status: 409 }
        );
    }

    const { data: property, error: propErr } = await adminClient
        .from("properties")
        .select("id, name, landlord_id, contract_template")
        .eq("id", unit.property_id)
        .maybeSingle();

    if (propErr || !property) {
        return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    if (property.landlord_id !== userId) {
        return NextResponse.json({ error: "You do not own this unit." }, { status: 403 });
    }

    const now = new Date();
    const holdInfo: UnitHoldInfo = {
        held_for_name: body.held_for_name.trim(),
        held_by_application_id: body.held_by_application_id ?? null,
        hold_expires_at: resolveHoldExpiryIso(body.duration_preset, now),
        hold_note: body.hold_note ?? null,
        created_at: now.toISOString(),
    };

    const updatedTemplate = setUnitHoldInTemplate(property.contract_template, unitId, holdInfo, now);

    const { error: updateErr } = await adminClient
        .from("properties")
        .update({
            contract_template: updatedTemplate as any,
            updated_at: now.toISOString(),
        })
        .eq("id", property.id);

    if (updateErr) {
        console.error("[units/hold POST] Failed to save hold:", updateErr);
        return NextResponse.json({ error: "Failed to place unit on hold." }, { status: 500 });
    }

    invalidatePropertyUnitsCache(userId);

    let notifiedCount = 0;
    if (body.notify_other_applicants) {
        try {
            let otherAppsQuery = adminClient
                .from("applications")
                .select("id, applicant_name, applicant_email")
                .eq("unit_id", unitId)
                .in("status", ["pending", "reviewing"]);

            if (body.held_by_application_id) {
                otherAppsQuery = otherAppsQuery.neq("id", body.held_by_application_id);
            }

            const { data: otherApps } = await otherAppsQuery;
            for (const other of otherApps ?? []) {
                const email = other.applicant_email?.trim();
                if (!email) continue;
                try {
                    await sendUnitOnHoldStatusEmail({
                        to: email,
                        applicantName: other.applicant_name?.trim() || "Applicant",
                        propertyName: property.name || "Property",
                        unitName: unit.name || "Room",
                        holdNote: body.hold_note,
                    });
                    notifiedCount += 1;
                } catch (emailErr) {
                    console.error("[units/hold POST] Failed to notify competing applicant:", emailErr);
                }
            }
        } catch (err) {
            console.error("[units/hold POST] Competing notification lookup error:", err);
        }
    }

    return NextResponse.json({
        success: true,
        unit_id: unitId,
        hold_info: holdInfo,
        notified_count: notifiedCount,
    });
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ unitId: string }> }
) {
    const { unitId } = await context.params;
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId } = authContext;

    if (!isId(unitId)) {
        return NextResponse.json({ error: "Invalid unit ID." }, { status: 400 });
    }

    const adminClient = createServiceRoleSupabaseClient();

    const { data: unit } = await adminClient
        .from("units")
        .select("id, property_id")
        .eq("id", unitId)
        .maybeSingle();

    if (!unit) {
        return NextResponse.json({ error: "Unit not found." }, { status: 404 });
    }

    const { data: property } = await adminClient
        .from("properties")
        .select("id, landlord_id, contract_template")
        .eq("id", unit.property_id)
        .maybeSingle();

    if (!property) {
        return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    if (property.landlord_id !== userId) {
        return NextResponse.json({ error: "You do not own this unit." }, { status: 403 });
    }

    const existingHold = getActiveUnitHold(property.contract_template, unitId);
    if (existingHold) {
        const updatedTemplate = setUnitHoldInTemplate(property.contract_template, unitId, null);
        const { error: updateErr } = await adminClient
            .from("properties")
            .update({
                contract_template: updatedTemplate as any,
                updated_at: new Date().toISOString(),
            })
            .eq("id", property.id);

        if (updateErr) {
            return NextResponse.json({ error: "Failed to release unit hold." }, { status: 500 });
        }
    }

    invalidatePropertyUnitsCache(userId);

    return NextResponse.json({
        success: true,
        unit_id: unitId,
        hold_info: null,
    });
}
