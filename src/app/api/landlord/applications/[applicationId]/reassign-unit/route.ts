import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { parseJsonBody } from "@/lib/validation/server";
import { isId, reassignApplicationUnitSchema } from "@/lib/validation/schemas/tenant-lifecycle.schema";
import { getActiveUnitHold } from "@/lib/unit-hold";
import { sendUnitReassignedRecommendationEmail } from "@/lib/email";
import { generateRoomOfferLink } from "@/lib/jwt";
import { invalidatePropertyUnitsCache } from "@/app/api/landlord/property-units/route";

export async function POST(
    request: Request,
    context: { params: Promise<{ applicationId: string }> }
) {
    const { applicationId } = await context.params;
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId } = authContext;

    if (!isId(applicationId)) {
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const parsed = await parseJsonBody(request, reassignApplicationUnitSchema);
    if (!parsed.ok) return parsed.response;
    const { target_unit_id, landlord_note, notify_applicant } = parsed.data;

    const adminClient = createServiceRoleSupabaseClient();

    const { data: application, error: appErr } = await adminClient
        .from("applications")
        .select(
            "id, unit_id, landlord_id, status, applicant_name, applicant_email, requirements_checklist"
        )
        .eq("id", applicationId)
        .eq("landlord_id", userId)
        .maybeSingle();

    if (appErr || !application) {
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    if (application.status === "approved") {
        return NextResponse.json(
            { error: "An already approved application cannot be moved to another unit." },
            { status: 409 }
        );
    }

    if (application.unit_id === target_unit_id) {
        return NextResponse.json(
            { error: "Applicant is already assigned to this unit." },
            { status: 400 }
        );
    }

    const [{ data: sourceUnit }, { data: targetUnit }] = await Promise.all([
        adminClient
            .from("units")
            .select("id, name, property_id, rent_amount")
            .eq("id", application.unit_id)
            .maybeSingle(),
        adminClient
            .from("units")
            .select("id, name, property_id, status, rent_amount")
            .eq("id", target_unit_id)
            .maybeSingle(),
    ]);

    if (!targetUnit) {
        return NextResponse.json({ error: "Recommended unit not found." }, { status: 404 });
    }

    if ((targetUnit.status ?? "").toLowerCase() === "occupied") {
        return NextResponse.json(
            { error: "The selected unit is already occupied. Please choose a vacant unit." },
            { status: 409 }
        );
    }

    const { data: targetProperty } = await adminClient
        .from("properties")
        .select("id, name, landlord_id, contract_template")
        .eq("id", targetUnit.property_id)
        .maybeSingle();

    if (!targetProperty || targetProperty.landlord_id !== userId) {
        return NextResponse.json(
            { error: "You do not own the target unit." },
            { status: 403 }
        );
    }

    const activeHold = getActiveUnitHold(targetProperty.contract_template, target_unit_id);
    if (activeHold && activeHold.held_by_application_id !== applicationId) {
        return NextResponse.json(
            { error: `Room ${targetUnit.name} is currently on hold for ${activeHold.held_for_name}.` },
            { status: 409 }
        );
    }

    const { data: targetCommitted } = await adminClient
        .from("applications")
        .select("id")
        .eq("unit_id", target_unit_id)
        .in("status", ["payment_pending", "approved"])
        .neq("id", applicationId)
        .limit(1)
        .maybeSingle();

    if (targetCommitted) {
        return NextResponse.json(
            { error: `Room ${targetUnit.name} already has a committed applicant.` },
            { status: 409 }
        );
    }

    const nowIso = new Date().toISOString();
    const existingChecklist =
        application.requirements_checklist &&
        typeof application.requirements_checklist === "object" &&
        !Array.isArray(application.requirements_checklist)
            ? { ...(application.requirements_checklist as Record<string, unknown>) }
            : {};

    const offeredMonthlyRent = Number(targetUnit.rent_amount ?? 0);
    existingChecklist.pending_unit_offer = {
        target_unit_id: targetUnit.id,
        target_unit_name: targetUnit.name,
        target_monthly_rent: offeredMonthlyRent,
        previous_unit_id: application.unit_id,
        previous_unit_name: sourceUnit?.name ?? "Previous Room",
        offered_at: nowIso,
        offered_by: userId,
        landlord_note: landlord_note ?? null,
        status: "pending",
        responded_at: null,
    };

    const { error: updateErr } = await adminClient
        .from("applications")
        .update({
            requirements_checklist: existingChecklist as any,
            updated_at: nowIso,
        } as any)
        .eq("id", applicationId)
        .eq("landlord_id", userId);

    if (updateErr) {
        console.error("[reassign-unit POST] Update error:", updateErr);
        return NextResponse.json({ error: "Failed to save room offer for this application." }, { status: 500 });
    }

    invalidatePropertyUnitsCache(userId);

    const offerResponseUrl = generateRoomOfferLink(applicationId, targetUnit.id);

    let emailSent = false;
    const applicantEmail = application.applicant_email?.trim();
    if (notify_applicant && applicantEmail) {
        try {
            await sendUnitReassignedRecommendationEmail({
                to: applicantEmail,
                applicantName: application.applicant_name?.trim() || "Applicant",
                propertyName: targetProperty.name || "Property",
                previousUnitName: sourceUnit?.name || "Previous Room",
                newUnitName: targetUnit.name || "New Room",
                newMonthlyRent: offeredMonthlyRent,
                landlordNote: landlord_note,
                offerResponseUrl,
            });
            emailSent = true;
        } catch (emailErr) {
            console.error("[reassign-unit POST] Email error:", emailErr);
        }
    }

    return NextResponse.json({
        success: true,
        application_id: applicationId,
        previous_unit_id: application.unit_id,
        previous_unit_name: sourceUnit?.name ?? "Unit",
        offered_unit_id: targetUnit.id,
        offered_unit_name: targetUnit.name,
        new_unit_id: targetUnit.id,
        new_unit_name: targetUnit.name,
        new_monthly_rent: offeredMonthlyRent,
        offer_status: "pending",
        offer_response_url: offerResponseUrl,
        status: application.status,
        email_sent: emailSent,
    });
}
