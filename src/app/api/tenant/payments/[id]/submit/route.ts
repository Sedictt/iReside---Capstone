import { NextResponse } from "next/server";

import {
    expireInPersonIntents,
    insertPaymentAuditEvent,
    sendPaymentNotifications,
    sendPaymentSystemMessage,
    toWorkflowSnapshot,
} from "@/lib/billing/workflow";
import { BILLING_BUCKETS, uploadBillingFile } from "@/lib/billing/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
    const { id } = await context.params;
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await expireInPersonIntents(adminClient, user.id, { tenantId: user.id, paymentId: id });

        const formData = await request.formData();
        const method = formData.get("method");
        const referenceNumber = formData.get("referenceNumber");
        const note = formData.get("note");
        const partialAmountRaw = formData.get("partialAmount");
        const file = formData.get("receipt");
        const selectedItemIdsRaw = formData.get("selectedItemIds");
        const selectedReadingIdsRaw = formData.get("selectedReadingIds");

        if (method !== "gcash") {
            return NextResponse.json(
                { error: "Use the in-person intent action for face-to-face payments." },
                { status: 400 },
            );
        }

        const { data: payment, error: paymentError } = await adminClient
            .from("payments")
            .select("id, tenant_id, landlord_id, amount, paid_amount, balance_remaining, allow_partial_payments, invoice_number, workflow_status, review_action, status, intent_method, amount_tag, receipt_number, payment_submitted_at, rejection_reason, in_person_intent_expires_at, reference_number, payment_proof_url, metadata")
            .eq("id", id)
            .eq("tenant_id", user.id)
            .single();

        if (paymentError || !payment) {
            return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
        }

        if (payment.workflow_status === "confirmed" || payment.workflow_status === "receipted") {
            return NextResponse.json({ error: "This invoice is already finalized." }, { status: 409 });
        }

        const trimmedReference = typeof referenceNumber === "string" ? referenceNumber.trim() : "";
        if (!trimmedReference) {
            return NextResponse.json({ error: "Reference number is required for GCash submissions." }, { status: 400 });
        }

        if (!(file instanceof File) || file.size <= 0) {
            return NextResponse.json({ error: "A clear payment proof image is required." }, { status: 400 });
        }

        if (!file.type.startsWith("image/") || file.size < 2048) {
            return NextResponse.json({ error: "Payment proof is unreadable or invalid. Upload a clearer image." }, { status: 400 });
        }

        if (
            payment.workflow_status === "under_review" &&
            payment.reference_number === trimmedReference &&
            payment.payment_proof_url
        ) {
            return NextResponse.json({ ok: true, idempotent: true });
        }

        const partialAmount = typeof partialAmountRaw === "string" && partialAmountRaw.trim().length > 0
            ? Number(partialAmountRaw)
            : Number(payment.balance_remaining ?? payment.amount);

        if (!Number.isFinite(partialAmount) || partialAmount <= 0) {
            return NextResponse.json({ error: "A valid payment amount is required." }, { status: 400 });
        }

        const expectedAmount = Number(payment.balance_remaining ?? payment.amount);
        if (!payment.allow_partial_payments && partialAmount < expectedAmount) {
            return NextResponse.json({ error: "Partial payments are not enabled for this invoice." }, { status: 400 });
        }

        const proofUpload = await uploadBillingFile({
            bucketName: BILLING_BUCKETS.paymentProofs,
            ownerId: user.id,
            scope: id,
            file,
        });

        const beforeState = toWorkflowSnapshot(payment);
        const nowIso = new Date().toISOString();

        const { data: updatedPayment, error: updateError } = await adminClient
            .from("payments")
            .update({
                method: "gcash",
                workflow_status: "under_review",
                intent_method: "gcash",
                review_action: null,
                rejection_reason: null,
                payment_submitted_at: nowIso,
                reference_number: trimmedReference,
                payment_note: typeof note === "string" ? note.trim() || null : null,
                payment_proof_path: proofUpload?.path ?? null,
                payment_proof_url: proofUpload?.publicUrl ?? null,
                paid_amount: Number(payment.paid_amount || 0) + partialAmount,
                balance_remaining: Math.max(0, Number(payment.balance_remaining || payment.amount) - partialAmount),
                metadata: {
                    ...((payment.metadata as any) || {}),
                    pending_item_ids: typeof selectedItemIdsRaw === "string" ? JSON.parse(selectedItemIdsRaw) : [],
                    pending_reading_ids: typeof selectedReadingIdsRaw === "string" ? JSON.parse(selectedReadingIdsRaw) : [],
                },
                in_person_intent_expires_at: null,
                last_action_at: nowIso,
                last_action_by: user.id,
            })
            .eq("id", payment.id)
            .select("id, status, workflow_status, intent_method, amount_tag, review_action, paid_amount, balance_remaining, receipt_number, payment_submitted_at, rejection_reason, in_person_intent_expires_at")
            .single();

        if (updateError) {
            throw updateError;
        }

        await sendPaymentNotifications(
            adminClient,
            [payment.landlord_id],
            {
                title: "Payment proof submitted",
                message: `Tenant submitted GCash proof for invoice ${payment.invoice_number ?? payment.id}.`,
                data: {
                    paymentId: payment.id,
                    workflowStatus: "under_review",
                    actionButtons: ["Confirm Payment", "Reject", "Request Completion"],
                },
            },
        );

        await sendPaymentSystemMessage(
            adminClient,
            payment,
            {
                actorId: user.id,
                actorName: "Tenant",
                content: `Payment proof submitted for invoice ${payment.invoice_number ?? payment.id}. Status is now Under Review.`,
                metadata: {
                    event: "payment_submitted",
                    workflowStatus: "under_review",
                    paymentId: payment.id,
                },
            },
        );

        await insertPaymentAuditEvent(adminClient, {
            paymentId: payment.id,
            actorId: user.id,
            action: "tenant_payment_submitted_gcash",
            source: "api",
            beforeState,
            afterState: toWorkflowSnapshot(updatedPayment),
            metadata: {
                referenceNumber: trimmedReference,
                submittedAmount: partialAmount,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Failed to submit tenant payment:", error);
        return NextResponse.json({ error: "Failed to submit payment." }, { status: 500 });
    }
}
