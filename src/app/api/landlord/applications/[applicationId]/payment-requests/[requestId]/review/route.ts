import { NextResponse } from "next/server";

import {
    applyPaymentPendingExpiry,
    areRequiredPaymentRequestsCompleted,
    logApplicationPaymentAudit,
} from "@/lib/application-payment-pending";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
    params: Promise<{ applicationId: string; requestId: string }>;
};

type ReviewAction = "confirm" | "reject" | "needs_correction";

export async function POST(request: Request, context: RouteContext) {
    const { applicationId, requestId } = await context.params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { action?: ReviewAction; note?: string | null };
    const action = body.action;
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (action !== "confirm" && action !== "reject" && action !== "needs_correction") {
        return NextResponse.json({ error: "Invalid review action." }, { status: 400 });
    }

    const { data: application, error: applicationError } = await adminClient
        .from("applications")
        .select("id, status, landlord_id")
        .eq("id", applicationId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (applicationError || !application) {
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const expiryResult = await applyPaymentPendingExpiry(adminClient, application.id);
    if (expiryResult.expired) {
        return NextResponse.json(
            { error: "Payment window has expired and the application was moved back to reviewing." },
            { status: 409 }
        );
    }

    if (application.status !== "payment_pending") {
        return NextResponse.json({ error: "Application is not in payment-pending stage." }, { status: 409 });
    }

    const reqQuery = adminClient
        .from("application_payment_requests" as any)
        .select(
            "id, requirement_type, status, method, payment_proof_url, payment_proof_path, payment_note, reference_number, amount, bypassed"
        );

    const { data: paymentRequest, error: requestError } = await reqQuery
        .eq("id", requestId)
        .eq("application_id", application.id)
        .maybeSingle() as any;

    if (requestError || !paymentRequest) {
        return NextResponse.json({ error: "Payment request not found." }, { status: 404 });
    }

    if (paymentRequest.status === "expired") {
        return NextResponse.json({ error: "Payment request has expired." }, { status: 409 });
    }

    const nowIso = new Date().toISOString();
    const nextStatus = action === "confirm" ? "completed" : "rejected";

    if (action === "confirm" && !paymentRequest.bypassed) {
        if (!paymentRequest.method) {
            return NextResponse.json({ error: "Payment method is required before confirmation." }, { status: 400 });
        }
        if (paymentRequest.method === "gcash" && !paymentRequest.payment_proof_url) {
            return NextResponse.json({ error: "GCash proof is required before confirmation." }, { status: 400 });
        }
    }

    const updatePayload = {
        status: nextStatus,
        reviewed_at: nowIso,
        reviewed_by: user.id,
        review_note: note || null,
    } as any;

    const updateQuery = adminClient
        .from("application_payment_requests" as any)
        .update(updatePayload)
        .eq("id", paymentRequest.id)
        .eq("application_id", application.id)
        .select(
            "id, requirement_type, status, method, payment_note, reference_number, amount, due_at, payment_proof_url, submitted_at, reviewed_at, review_note, bypassed"
        )
        .single();

    const { data: updatedRequest, error: updateError } = await updateQuery as any;

    if (updateError || !updatedRequest) {
        return NextResponse.json({ error: "Failed to update payment review." }, { status: 500 });
    }

    const eventType =
        action === "confirm"
            ? "payment_confirmed"
            : action === "needs_correction"
              ? "payment_needs_correction"
              : "payment_rejected";

    await logApplicationPaymentAudit(adminClient, {
        application_id: application.id,
        payment_request_id: paymentRequest.id,
        actor_id: user.id,
        actor_role: "landlord",
        event_type: eventType,
        metadata: {
            note: note || null,
            status: nextStatus,
        },
    });

    const allQuery = adminClient
        .from("application_payment_requests" as any)
        .select("requirement_type, status");

    const { data: allRequests, error: allRequestsError } = await allQuery
        .eq("application_id", application.id) as any;

    if (allRequestsError) {
        return NextResponse.json({ error: "Updated request but failed to compute completion state." }, { status: 500 });
    }

    const allConfirmed = areRequiredPaymentRequestsCompleted(allRequests ?? []);

    return NextResponse.json({
        request: {
            id: updatedRequest.id,
            requirementType: updatedRequest.requirement_type,
            status: updatedRequest.status,
            method: updatedRequest.method,
            note: updatedRequest.payment_note,
            referenceNumber: updatedRequest.reference_number,
            amount: Number(updatedRequest.amount ?? 0),
            dueAt: updatedRequest.due_at,
            proofUrl: updatedRequest.payment_proof_url,
            submittedAt: updatedRequest.submitted_at,
            reviewedAt: updatedRequest.reviewed_at,
            reviewNote: updatedRequest.review_note,
            bypassed: Boolean(updatedRequest.bypassed),
        },
        allConfirmed,
    });
}
