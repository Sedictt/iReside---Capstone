import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { verifyApplicationStatusToken } from "@/lib/jwt";
import { getActiveUnitHold } from "@/lib/unit-hold";

export type ApplicationPaymentStage =
    | "awaiting_upload"
    | "partial_submitted"
    | "awaiting_verification"
    | "action_needed"
    | "verified";

export interface PublicRoomOfferSummary {
    status: "pending" | "accepted" | "cancelled";
    offeredUnitName: string | null;
}

export interface PublicApplicationStatusResponse {
    referenceCode: string;
    propertyName: string;
    unitName: string;
    status: string;
    appliedAt: string;
    updatedAt: string;
    paymentStage: ApplicationPaymentStage | null;
    unitOnHold: boolean;
    roomOffer: PublicRoomOfferSummary | null;
}

const NO_STORE_HEADERS = {
    "Cache-Control": "no-store",
} as const;

function jsonNoStore(body: unknown, status = 200) {
    return NextResponse.json(body, {
        status,
        headers: NO_STORE_HEADERS,
    });
}

function readSafeRoomOffer(rawChecklist: unknown): PublicRoomOfferSummary | null {
    if (!rawChecklist || typeof rawChecklist !== "object" || Array.isArray(rawChecklist)) {
        return null;
    }

    const rawOffer = (rawChecklist as Record<string, unknown>).pending_unit_offer;
    if (!rawOffer || typeof rawOffer !== "object" || Array.isArray(rawOffer)) {
        return null;
    }

    const offerRecord = rawOffer as Record<string, unknown>;
    const offerStatus = offerRecord.status;
    if (offerStatus !== "pending" && offerStatus !== "accepted" && offerStatus !== "cancelled") {
        return null;
    }

    const offeredUnitName =
        typeof offerRecord.target_unit_name === "string" && offerRecord.target_unit_name.trim()
            ? offerRecord.target_unit_name.trim()
            : null;

    return {
        status: offerStatus,
        offeredUnitName,
    };
}

function resolvePaymentStage(
    requests: Array<{ requirement_type?: string | null; status?: string | null }> | null | undefined
): ApplicationPaymentStage {
    const rows = Array.isArray(requests) ? requests : [];
    if (rows.length === 0) {
        return "awaiting_upload";
    }

    if (rows.some((req) => req.status === "rejected")) {
        return "action_needed";
    }

    if (rows.every((req) => req.status === "completed")) {
        return "verified";
    }

    const hasProcessing = rows.some((req) => req.status === "processing");
    const hasCompleted = rows.some((req) => req.status === "completed");
    const hasPending = rows.some((req) => req.status === "pending");

    if (hasProcessing && !hasPending) {
        return "awaiting_verification";
    }

    if (hasProcessing || hasCompleted) {
        return "partial_submitted";
    }

    return "awaiting_upload";
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim() ?? "";

    if (!token) {
        return jsonNoStore({ error: "Missing application status token." }, 400);
    }

    const verified = verifyApplicationStatusToken(token);
    if (!verified.valid || !verified.payload) {
        return jsonNoStore(
            { error: verified.error || "Invalid or expired status link." },
            401
        );
    }

    const { applicationId } = verified.payload;
    const adminClient = createServiceRoleSupabaseClient();

    const { data: application, error: appErr } = await adminClient
        .from("applications")
        .select("id, unit_id, status, created_at, updated_at, requirements_checklist")
        .eq("id", applicationId)
        .maybeSingle();

    if (appErr || !application) {
        return jsonNoStore({ error: "Application not found." }, 404);
    }

    const { data: unit } = application.unit_id
        ? await adminClient
              .from("units")
              .select("id, name, property_id")
              .eq("id", application.unit_id)
              .maybeSingle()
        : { data: null };

    const { data: property } = unit?.property_id
        ? await adminClient
              .from("properties")
              .select("id, name, contract_template")
              .eq("id", unit.property_id)
              .maybeSingle()
        : { data: null };

    const activeHold =
        unit && property ? getActiveUnitHold(property.contract_template, unit.id) : null;

    const unitOnHold = Boolean(
        activeHold &&
            activeHold.held_by_application_id !== application.id &&
            (application.status === "pending" || application.status === "reviewing")
    );

    let paymentStage: ApplicationPaymentStage | null = null;
    if (application.status === "payment_pending") {
        const { data: paymentRequests } = await (adminClient
            .from("application_payment_requests" as any)
            .select("requirement_type, status")
            .eq("application_id", application.id) as any);

        paymentStage = resolvePaymentStage(paymentRequests);
    }

    const roomOffer = readSafeRoomOffer(application.requirements_checklist);

    const payload: PublicApplicationStatusResponse = {
        referenceCode: application.id.slice(0, 8).toUpperCase(),
        propertyName: property?.name || "Property",
        unitName: unit?.name || "Unit",
        status: application.status,
        appliedAt: application.created_at,
        updatedAt: application.updated_at || application.created_at,
        paymentStage,
        unitOnHold,
        roomOffer,
    };

    return jsonNoStore(payload, 200);
}
