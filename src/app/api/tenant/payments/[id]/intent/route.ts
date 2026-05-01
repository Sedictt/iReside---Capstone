import { NextResponse } from "next/server";
import { z } from "zod";

import {
    expireInPersonIntents,
    getInPersonIntentExpiry,
    insertPaymentAuditEvent,
    sendPaymentNotifications,
    sendPaymentSystemMessage,
    toWorkflowSnapshot,
} from "@/lib/billing/workflow";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
    params: Promise<{ id: string }>;
};

const intentSchema = z.object({
    note: z.string().max(600).optional(),
    selectedItemIds: z.array(z.string()).optional(),
    selectedReadingIds: z.array(z.string()).optional(),
});

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

        const body = intentSchema.parse(await request.json().catch(() => ({})));
        const note = body.note?.trim() || null;

        const { data: payment, error: paymentError } = await adminClient
            .from("payments")
            .select("id, tenant_id, landlord_id, invoice_number, status, workflow_status, intent_method, amount_tag, review_action, paid_amount, balance_remaining, receipt_number, payment_submitted_at, rejection_reason, in_person_intent_expires_at, metadata")
            .eq("id", id)
            .eq("tenant_id", user.id)
            .maybeSingle();

        if (paymentError || !payment) {
            return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
        }

        if (payment.workflow_status === "confirmed" || payment.workflow_status === "receipted") {
            return NextResponse.json({ error: "This invoice is already finalized." }, { status: 409 });
        }

        if (payment.workflow_status === "awaiting_in_person" && payment.in_person_intent_expires_at) {
            return NextResponse.json({
                ok: true,
                idempotent: true,
                expiresAt: payment.in_person_intent_expires_at,
            });
        }

        const beforeState = toWorkflowSnapshot(payment as any);
        const nowIso = new Date().toISOString();
        const expiresAt = getInPersonIntentExpiry();
        const landlordTransactionPath = `/landlord/invoices?invoiceId=${payment.id}`;

        const { data: updatedPayment, error: updateError } = await adminClient
            .from("payments")
            .update({
                workflow_status: "awaiting_in_person",
                intent_method: "in_person",
                in_person_intent_expires_at: expiresAt,
                payment_submitted_at: nowIso,
                payment_note: note,
                metadata: {
                    ...((payment.metadata as any) || {}),
                    pending_item_ids: body.selectedItemIds || [],
                    pending_reading_ids: body.selectedReadingIds || [],
                },
                rejection_reason: null,
                review_action: null,
                last_action_at: nowIso,
                last_action_by: user.id,
            })
            .eq("id", payment.id)
            .select("id, status, workflow_status, intent_method, amount_tag, review_action, paid_amount, balance_remaining, receipt_number, payment_submitted_at, rejection_reason, in_person_intent_expires_at")
            .single();

        if (updateError) throw updateError;

        await sendPaymentNotifications(
            adminClient,
            [payment.landlord_id, payment.tenant_id],
            {
                title: "In-person payment intent submitted",
                message: `Invoice ${payment.invoice_number ?? payment.id} is awaiting in-person confirmation.`,
                data: {
                    paymentId: payment.id,
                    workflowStatus: "awaiting_in_person",
                    expiresAt,
                    landlordTransactionPath,
                    actionLabel: "Confirm Received",
                },
            },
        );

        await sendPaymentSystemMessage(
            adminClient,
            payment,
            {
                actorId: user.id,
                actorName: "Tenant",
                content: "A face-to-face cash payment has been initiated. The landlord can now verify and confirm the receipt of funds using the interface below.",
                metadata: {
                    event: "awaiting_in_person",
                    paymentId: payment.id,
                    workflowStatus: "awaiting_in_person",
                    expiresAt,
                    landlordTransactionPath,
                },
            },
        );

        await insertPaymentAuditEvent(adminClient, {
            paymentId: payment.id,
            actorId: user.id,
            action: "tenant_in_person_intent_submitted",
            source: "api",
            beforeState,
            afterState: toWorkflowSnapshot(updatedPayment as any),
            metadata: {
                note,
                expiresAt,
            },
        });

        return NextResponse.json({ ok: true, expiresAt });
    } catch (error) {
        console.error("Failed to trigger in-person intent:", error);
        return NextResponse.json({ error: "Failed to trigger in-person payment." }, { status: 500 });
    }
}
