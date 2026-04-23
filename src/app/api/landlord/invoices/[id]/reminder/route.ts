import { NextResponse } from "next/server";

import {
    expireInPersonIntents,
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

export async function POST(_: Request, context: RouteContext) {
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
        await expireInPersonIntents(adminClient, user.id, { landlordId: user.id, paymentId: id });

        const { data: payment, error: paymentError } = await adminClient
            .from("payments")
            .select("id, tenant_id, landlord_id, invoice_number, workflow_status, status, intent_method, amount_tag, review_action, paid_amount, balance_remaining, receipt_number, payment_submitted_at, rejection_reason, in_person_intent_expires_at")
            .eq("id", id)
            .eq("landlord_id", user.id)
            .maybeSingle();

        if (paymentError || !payment) {
            return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
        }

        if (payment.workflow_status === "confirmed" || payment.workflow_status === "receipted") {
            return NextResponse.json({ error: "Cannot remind a finalized invoice." }, { status: 409 });
        }

        if (payment.workflow_status === "reminder_sent") {
            return NextResponse.json({ ok: true, idempotent: true, remindedAt: new Date().toISOString() });
        }

        const beforeState = toWorkflowSnapshot(payment);
        const nowIso = new Date().toISOString();
        const payNowPath = `/tenant/payments/${payment.id}/checkout`;

        const { data: updatedPayment, error: error } = await adminClient
            .from("payments")
            .update({
                workflow_status: "reminder_sent",
                reminder_sent_at: nowIso,
                last_action_at: nowIso,
                last_action_by: user.id,
            })
            .eq("id", payment.id)
            .eq("landlord_id", user.id)
            .select("id, tenant_id, landlord_id, invoice_number, workflow_status, status, intent_method, amount_tag, review_action, paid_amount, balance_remaining, receipt_number, payment_submitted_at, rejection_reason, in_person_intent_expires_at")
            .single();

        if (error) throw error;

        await sendPaymentNotifications(
            adminClient,
            [updatedPayment.tenant_id],
            {
                title: "Rent payment reminder",
                message: `Invoice ${updatedPayment.invoice_number ?? updatedPayment.id} is due soon. Tap Pay Now to continue.`,
                data: {
                    paymentId: updatedPayment.id,
                    workflowStatus: updatedPayment.workflow_status,
                    payNowPath,
                    actionLabel: "Pay Now",
                },
            },
        );

        await sendPaymentSystemMessage(
            adminClient,
            updatedPayment,
            {
                actorId: user.id,
                actorName: "IRIS",
                content: "A payment reminder has been sent for this invoice. You can settle it quickly using the button below.",
                metadata: {
                    event: "reminder_sent",
                    actionLabel: "Pay Now",
                    payNowPath,
                },
            },
        );

        await insertPaymentAuditEvent(adminClient, {
            paymentId: updatedPayment.id,
            actorId: user.id,
            action: "reminder_sent",
            source: "api",
            beforeState,
            afterState: toWorkflowSnapshot(updatedPayment),
            metadata: {
                payNowPath,
            },
        });

        return NextResponse.json({ ok: true, remindedAt: nowIso });
    } catch (error) {
        console.error("Failed to send invoice reminder:", error);
        return NextResponse.json({ error: "Failed to send reminder." }, { status: 500 });
    }
}
