import { NextResponse } from "next/server";

import {
    applyPaymentPendingExpiry,
    areRequiredPaymentRequestsCompleted,
    logApplicationPaymentAudit,
} from "@/lib/application-payment-pending";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { sendPaymentReviewResolutionEmail } from "@/lib/email";

type RouteContext = {
    params: Promise<{ applicationId: string; requestId: string }>;
};

type ReviewAction = 
    | "confirm" 
    | "reject" 
    | "needs_correction" 
    | "return_payment" 
    | "return_overpayment" 
    | "request_shortfall";

export async function POST(request: Request, context: RouteContext) {
    const { applicationId, requestId } = await context.params;
    const adminClient = createServiceRoleSupabaseClient();

    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId } = authContext;

    const body = (await request.json()) as { 
        action?: ReviewAction; 
        note?: string | null;
        refundProofUrl?: string | null;
        amount?: number | null;
    };
    const action = body.action;
    const note = typeof body.note === "string" ? body.note.trim() : "";

    const VALID_ACTIONS: ReviewAction[] = [
        "confirm",
        "reject",
        "needs_correction",
        "return_payment",
        "return_overpayment",
        "request_shortfall",
    ];

    if (!action || !VALID_ACTIONS.includes(action)) {
        return NextResponse.json({ error: "Invalid review action." }, { status: 400 });
    }

    const { data: application, error: applicationError } = await adminClient
        .from("applications")
        .select(`
            id, 
            status, 
            landlord_id,
            applicant_name,
            applicant_email,
            unit:units (
                id,
                name,
                property:properties (
                    id,
                    name
                )
            )
        `)
        .eq("id", applicationId)
        .eq("landlord_id", userId)
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

    // Fetch target requests (supports specific ID or "all")
    let targetQuery = adminClient
        .from("application_payment_requests" as any)
        .select(
            "id, requirement_type, status, method, payment_proof_url, payment_proof_path, payment_note, reference_number, amount, metadata, bypassed"
        )
        .eq("application_id", application.id);

    if (requestId !== "all") {
        targetQuery = targetQuery.eq("id", requestId);
    }

    const { data: targetRequests, error: targetError } = await targetQuery as any;
    if (targetError || !targetRequests || targetRequests.length === 0) {
        return NextResponse.json({ error: "No matching payment requests found." }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const nextStatus = (action === "confirm" || action === "return_overpayment") ? "completed" : "rejected";

    if (action === "confirm") {
        for (const req of targetRequests) {
            if (!req.bypassed && !req.method) {
                return NextResponse.json({ error: "Payment method is required before confirmation." }, { status: 400 });
            }
            if (!req.bypassed && req.method === "gcash" && !req.payment_proof_url) {
                return NextResponse.json({ error: "GCash proof is required before confirmation." }, { status: 400 });
            }
        }
    }

    const updatedRows: any[] = [];
    for (const req of targetRequests) {
        const mergedMetadata = {
            ...(req.metadata || {}),
            resolution_action: action,
            resolution_note: note || null,
            refund_proof_url: body.refundProofUrl || null,
            resolved_amount: body.amount ?? null,
            resolved_at: nowIso,
            resolved_by: userId,
        };

        const updatePayload: any = {
            status: nextStatus,
            reviewed_at: nowIso,
            reviewed_by: userId,
            review_note: note || null,
            metadata: mergedMetadata,
        };

        const { data: updated, error: updateError } = await adminClient
            .from("application_payment_requests" as any)
            .update(updatePayload)
            .eq("id", req.id)
            .select("id, requirement_type, status, method, payment_note, reference_number, amount, due_at, payment_proof_url, submitted_at, reviewed_at, review_note, metadata, bypassed")
            .single() as any;

        if (updateError || !updated) {
            return NextResponse.json({ error: "Failed to update payment review." }, { status: 500 });
        }
        updatedRows.push(updated);

        await logApplicationPaymentAudit(adminClient, {
            application_id: application.id,
            payment_request_id: req.id,
            actor_id: userId,
            actor_role: "landlord",
            event_type: action === "confirm" ? "payment_confirmed" : action === "needs_correction" ? "payment_needs_correction" : "payment_rejected",
            metadata: {
                status: nextStatus,
                action,
                refund_proof_url: body.refundProofUrl || null,
                amount: body.amount ?? null,
            },
        });
    }

    // Send reconciliation email if resolution was return, overpayment refund, or shortfall request
    if (
        (action === "return_payment" || action === "return_overpayment" || action === "request_shortfall") &&
        application.applicant_email
    ) {
        try {
            const resolutionType = 
                action === "return_payment" ? "returned" 
                : action === "return_overpayment" ? "overpayment_refunded" 
                : "shortfall_requested";

            const propertyName = (application as any).unit?.property?.name || "Property";
            const unitName = (application as any).unit?.name || null;
            const applicantName = application.applicant_name || "Applicant";
            const systemTxn = targetRequests[0]?.metadata?.system_reference_number || targetRequests[0]?.metadata?.transaction_reference || "IR-TXN-REF";

            await sendPaymentReviewResolutionEmail({
                to: application.applicant_email.trim(),
                applicantName,
                propertyName,
                unitName,
                resolutionType,
                transactionReference: systemTxn,
                amount: typeof body.amount === "number" ? body.amount : null,
                note: note || null,
                proofUrl: body.refundProofUrl || null,
            });
            console.log(`[payment-review] Sent ${resolutionType} resolution email to ${application.applicant_email}`);
        } catch (emailErr) {
            console.error("[payment-review] Failed to send resolution email:", emailErr);
        }
    }

    const { data: allRequests } = await adminClient
        .from("application_payment_requests" as any)
        .select("requirement_type, status")
        .eq("application_id", application.id) as any;

    const allConfirmed = areRequiredPaymentRequestsCompleted(allRequests ?? []);

    return NextResponse.json({
        success: true,
        request: updatedRows[0],
        requests: updatedRows,
        allConfirmed,
    });
}
