import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { verifyRoomOfferToken } from "@/lib/jwt";
import { getActiveUnitHold } from "@/lib/unit-hold";
import { parseJsonBody } from "@/lib/validation/server";
import { invalidatePropertyUnitsCache } from "@/app/api/landlord/property-units/route";

const offerDecisionSchema = z.object({
    token: z.string().min(1, "Offer token is required."),
    decision: z.enum(["accept", "cancel"]),
});

interface PendingUnitOffer {
    target_unit_id?: string;
    target_unit_name?: string;
    target_monthly_rent?: number;
    previous_unit_id?: string | null;
    previous_unit_name?: string;
    offered_at?: string;
    offered_by?: string;
    landlord_note?: string | null;
    status?: "pending" | "accepted" | "cancelled";
    responded_at?: string | null;
}

function readChecklist(raw: unknown): Record<string, unknown> {
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        return { ...(raw as Record<string, unknown>) };
    }
    return {};
}

async function checkTargetUnitAvailability(
    adminClient: ReturnType<typeof createServiceRoleSupabaseClient>,
    targetUnitId: string,
    applicationId: string
) {
    const { data: targetUnit } = await adminClient
        .from("units")
        .select("id, name, status, rent_amount, property_id")
        .eq("id", targetUnitId)
        .maybeSingle();

    if (!targetUnit) {
        return {
            targetUnit: null,
            property: null,
            available: false,
            reason: "The offered room is no longer listed.",
        };
    }

    const { data: property } = await adminClient
        .from("properties")
        .select("id, name, address, contract_template")
        .eq("id", targetUnit.property_id)
        .maybeSingle();

    if ((targetUnit.status ?? "").toLowerCase() === "occupied") {
        return {
            targetUnit,
            property,
            available: false,
            reason: `${targetUnit.name} has already been occupied.`,
        };
    }

    const activeHold = property
        ? getActiveUnitHold(property.contract_template, targetUnitId)
        : null;
    if (activeHold && activeHold.held_by_application_id !== applicationId) {
        return {
            targetUnit,
            property,
            available: false,
            reason: `${targetUnit.name} is currently held for another applicant.`,
        };
    }

    const { data: committedApp } = await adminClient
        .from("applications")
        .select("id")
        .eq("unit_id", targetUnitId)
        .in("status", ["payment_pending", "approved"])
        .neq("id", applicationId)
        .limit(1)
        .maybeSingle();

    if (committedApp) {
        return {
            targetUnit,
            property,
            available: false,
            reason: `${targetUnit.name} already has another confirmed applicant.`,
        };
    }

    return {
        targetUnit,
        property,
        available: true,
        reason: null as string | null,
    };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim() ?? "";

    if (!token) {
        return NextResponse.json({ error: "Missing room offer token." }, { status: 400 });
    }

    const verified = verifyRoomOfferToken(token);
    if (!verified.valid || !verified.payload) {
        return NextResponse.json(
            { error: verified.error || "Invalid or expired room offer link." },
            { status: 400 }
        );
    }

    const { applicationId, targetUnitId } = verified.payload;
    const adminClient = createServiceRoleSupabaseClient();

    const { data: application, error: appErr } = await adminClient
        .from("applications")
        .select("id, unit_id, status, applicant_name, requirements_checklist")
        .eq("id", applicationId)
        .maybeSingle();

    if (appErr || !application) {
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const checklist = readChecklist(application.requirements_checklist);
    const pendingOffer = (checklist.pending_unit_offer ?? null) as PendingUnitOffer | null;

    if (!pendingOffer || pendingOffer.target_unit_id !== targetUnitId) {
        return NextResponse.json(
            { error: "This room offer is no longer active or has been replaced by a newer offer." },
            { status: 409 }
        );
    }

    const { targetUnit, property, available, reason } = await checkTargetUnitAvailability(
        adminClient,
        targetUnitId,
        applicationId
    );

    const { data: prevUnit } = application.unit_id
        ? await adminClient
              .from("units")
              .select("id, name")
              .eq("id", application.unit_id)
              .maybeSingle()
        : { data: null };

    return NextResponse.json({
        applicationId: application.id,
        applicantName: application.applicant_name || "Applicant",
        propertyName: property?.name || "Property",
        propertyAddress: property?.address || null,
        previousUnitName: pendingOffer.previous_unit_name || prevUnit?.name || "Previous Room",
        offeredUnitId: targetUnitId,
        offeredUnitName: targetUnit?.name || pendingOffer.target_unit_name || "Offered Room",
        offeredMonthlyRent: Number(targetUnit?.rent_amount ?? pendingOffer.target_monthly_rent ?? 0),
        landlordNote: pendingOffer.landlord_note ?? null,
        offeredAt: pendingOffer.offered_at ?? null,
        offerStatus: pendingOffer.status ?? "pending",
        respondedAt: pendingOffer.responded_at ?? null,
        applicationStatus: application.status,
        unitStillAvailable: available,
        unavailableReason: reason,
    });
}

export async function POST(request: Request) {
    const parsed = await parseJsonBody(request, offerDecisionSchema);
    if (!parsed.ok) return parsed.response;

    const { token, decision } = parsed.data;
    const verified = verifyRoomOfferToken(token);
    if (!verified.valid || !verified.payload) {
        return NextResponse.json(
            { error: verified.error || "Invalid or expired room offer link." },
            { status: 400 }
        );
    }

    const { applicationId, targetUnitId } = verified.payload;
    const adminClient = createServiceRoleSupabaseClient();

    const { data: application, error: appErr } = await adminClient
        .from("applications")
        .select("id, unit_id, landlord_id, status, requirements_checklist")
        .eq("id", applicationId)
        .maybeSingle();

    if (appErr || !application) {
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    if (application.status === "approved") {
        return NextResponse.json(
            { error: "This application has already been approved." },
            { status: 409 }
        );
    }

    const checklist = readChecklist(application.requirements_checklist);
    const pendingOffer = (checklist.pending_unit_offer ?? null) as PendingUnitOffer | null;

    if (!pendingOffer || pendingOffer.target_unit_id !== targetUnitId) {
        return NextResponse.json(
            { error: "This room offer is no longer active or has been replaced by a newer offer." },
            { status: 409 }
        );
    }

    if (pendingOffer.status && pendingOffer.status !== "pending") {
        return NextResponse.json(
            {
                error:
                    pendingOffer.status === "accepted"
                        ? "You have already accepted this room offer."
                        : "This application has already been cancelled.",
            },
            { status: 409 }
        );
    }

    const nowIso = new Date().toISOString();

    if (decision === "cancel") {
        checklist.pending_unit_offer = {
            ...pendingOffer,
            status: "cancelled",
            responded_at: nowIso,
        };

        const { error: cancelErr } = await adminClient
            .from("applications")
            .update({
                status: "withdrawn",
                requirements_checklist: checklist as any,
                updated_at: nowIso,
            } as any)
            .eq("id", applicationId);

        if (cancelErr) {
            console.error("[apply/offer POST] Cancel error:", cancelErr);
            return NextResponse.json(
                { error: "Could not cancel your application. Please try again." },
                { status: 500 }
            );
        }

        if (application.landlord_id) {
            invalidatePropertyUnitsCache(application.landlord_id);
        }

        return NextResponse.json({
            success: true,
            decision: "cancel",
            offer_status: "cancelled",
            application_status: "withdrawn",
            offered_unit_name: pendingOffer.target_unit_name || "Offered Room",
        });
    }

    const { targetUnit, available, reason } = await checkTargetUnitAvailability(
        adminClient,
        targetUnitId,
        applicationId
    );

    if (!available || !targetUnit) {
        return NextResponse.json(
            { error: reason || "The offered room is no longer available." },
            { status: 409 }
        );
    }

    const history = Array.isArray(checklist.reassignment_history)
        ? [...checklist.reassignment_history]
        : [];

    history.push({
        previous_unit_id: application.unit_id,
        previous_unit_name: pendingOffer.previous_unit_name ?? "Previous Room",
        new_unit_id: targetUnit.id,
        new_unit_name: targetUnit.name,
        accepted_at: nowIso,
        offered_at: pendingOffer.offered_at ?? null,
        landlord_note: pendingOffer.landlord_note ?? null,
    });

    checklist.reassignment_history = history;
    checklist.pending_unit_offer = {
        ...pendingOffer,
        status: "accepted",
        responded_at: nowIso,
    };

    const { error: acceptErr } = await adminClient
        .from("applications")
        .update({
            unit_id: targetUnit.id,
            status: "reviewing",
            requirements_checklist: checklist as any,
            updated_at: nowIso,
        } as any)
        .eq("id", applicationId);

    if (acceptErr) {
        console.error("[apply/offer POST] Accept error:", acceptErr);
        return NextResponse.json(
            { error: "Could not accept the room offer. Please try again." },
            { status: 500 }
        );
    }

    if (application.landlord_id) {
        invalidatePropertyUnitsCache(application.landlord_id);
    }

    return NextResponse.json({
        success: true,
        decision: "accept",
        offer_status: "accepted",
        application_status: "reviewing",
        offered_unit_name: targetUnit.name,
    });
}
