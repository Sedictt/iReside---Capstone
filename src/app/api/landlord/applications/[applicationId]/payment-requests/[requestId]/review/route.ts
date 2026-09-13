import { NextResponse } from "next/server";

import {
    applyPaymentPendingExpiry,
    areRequiredPaymentRequestsCompleted,
    buildPortalToken,
    buildPortalUrl,
    logApplicationPaymentAudit,
    resolvePaymentPendingExpiry,
} from "@/lib/application-payment-pending";
import { uploadBillingFile, BILLING_BUCKETS } from "@/lib/billing/storage";
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

    let action: ReviewAction | undefined;
    let note = "";
    let refundProofUrl: string | null = null;
    let amount: number | null = null;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        action = formData.get("action") as ReviewAction;
        note = String(formData.get("note") || "").trim();
        const rawAmount = formData.get("amount");
        if (rawAmount !== null && rawAmount !== undefined && String(rawAmount).trim() !== "") {
            const parsed = Number(rawAmount);
            if (!Number.isNaN(parsed)) amount = parsed;
        }
        refundProofUrl = String(formData.get("refundProofUrl") || "").trim() || null;

        const proofFile = formData.get("refundProofFile");
        if (proofFile instanceof File && proofFile.size > 0) {
            try {
                const uploadResult = await uploadBillingFile({
                    bucketName: BILLING_BUCKETS.paymentProofs,
                    ownerId: applicationId,
                    scope: `payment-refund/${applicationId}`,
                    file: proofFile,
                });
                refundProofUrl = uploadResult.publicUrl;
            } catch (uploadErr) {
                console.error("[payment-review] Error uploading refund proof file:", uploadErr);
            }
        }
    } else {
        const body = (await request.json()) as { 
            action?: ReviewAction; 
            note?: string | null;
            refundProofUrl?: string | null;
            amount?: number | null;
        };
        action = body.action;
        note = typeof body.note === "string" ? body.note.trim() : "";
        refundProofUrl = typeof body.refundProofUrl === "string" ? body.refundProofUrl.trim() || null : null;
        amount = typeof body.amount === "number" ? body.amount : null;
    }

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
            refund_proof_url: refundProofUrl || null,
            resolved_amount: amount ?? null,
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
                refund_proof_url: refundProofUrl || null,
                amount: amount ?? null,
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

            // If returning payment or requesting shortfall, generate a fresh portal token so applicant can easily return to the portal
            let paymentPortalUrl: string | null = null;
            if (action === "return_payment" || action === "request_shortfall") {
                const { token, hash: tokenHash } = buildPortalToken();
                const now = new Date();
                const expiresAt = resolvePaymentPendingExpiry(now);
                await adminClient
                    .from("applications")
                    .update({
                        payment_portal_token_hash: tokenHash,
                        payment_portal_token_expires_at: expiresAt.toISOString(),
                        payment_pending_expires_at: expiresAt.toISOString(),
                    } as any)
                    .eq("id", application.id);

                paymentPortalUrl = buildPortalUrl(new URL(request.url).origin, token);
            }

            await sendPaymentReviewResolutionEmail({
                to: application.applicant_email.trim(),
                applicantName,
                propertyName,
                unitName,
                resolutionType,
                transactionReference: systemTxn,
                amount: typeof amount === "number" ? amount : null,
                note: note || null,
                proofUrl: refundProofUrl || null,
                paymentPortalUrl,
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
