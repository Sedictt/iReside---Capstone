import { NextResponse } from "next/server";
import { z } from "zod";

import { upsertPaymentReceipt } from "@/lib/billing/server";
import {
    computeAmountTag,
    expireInPersonIntents,
    insertPaymentAuditEvent,
    sendPaymentNotifications,
    sendPaymentSystemMessage,
    toWorkflowSnapshot,
} from "@/lib/billing/workflow";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const reviewSchema = z.object({
    action: z.enum(["confirm", "confirm_received", "reject", "request_completion"]),
    note: z.string().max(600).optional(),
    acceptedAmount: z.number().positive().optional(),
    amountTag: z.enum(["exact", "partial", "overpaid", "short_paid"]).optional(),
    nonExactAction: z.enum(["accept_partial", "request_completion", "reject"]).optional(),
    rejectionReason: z.string().max(500).optional(),
    idempotencyKey: z.string().max(120).optional(),
});

type RouteContext = {
    params: Promise<{ id: string }>;
};

async function syncMoveInPaymentChecklist(supabase: Awaited<ReturnType<typeof createClient>>, leaseId: string) {
    const requiredDescriptions = new Set(["Advance Rent - First Month", "Security Deposit"]);
    const { data: leasePayments, error: paymentsError } = await supabase
        .from("payments")
        .select("description, status, landlord_confirmed")
        .eq("lease_id", leaseId);

    if (paymentsError) throw paymentsError;

    const requiredPayments = (leasePayments ?? []).filter((payment) =>
        requiredDescriptions.has(String(payment.description ?? "")),
    );

    const moveInPaymentComplete =
        requiredPayments.length === requiredDescriptions.size &&
        requiredPayments.every(
            (payment) => payment.status === "completed" && payment.landlord_confirmed === true,
        );

    const { data: applications, error: applicationError } = await supabase
        .from("applications")
        .select("id, requirements_checklist")
        .eq("lease_id", leaseId);

    if (applicationError) throw applicationError;

    await Promise.all(
        (applications ?? []).map(async (application) => {
            const currentChecklist =
                application.requirements_checklist &&
                typeof application.requirements_checklist === "object" &&
                !Array.isArray(application.requirements_checklist)
                    ? (application.requirements_checklist as Record<string, unknown>)
                    : {};

            const { error: updateError } = await supabase
                .from("applications")
                .update({
                    requirements_checklist: {
                        ...currentChecklist,
                        move_in_payment: moveInPaymentComplete,
                    },
                })
                .eq("id", application.id);

            if (updateError) throw updateError;
        }),
    );
}

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
        const parsed = reviewSchema.parse(await request.json());
        const idempotencyKey = request.headers.get("idempotency-key") ?? parsed.idempotencyKey ?? null;

        if (idempotencyKey) {
            const existing = await adminClient
                .from("payment_workflow_audit_events")
                .select("id, action")
                .eq("payment_id", id)
                .eq("idempotency_key", idempotencyKey)
                .maybeSingle();

            if (!existing.error && existing.data) {
                return NextResponse.json({ ok: true, idempotent: true });
            }
        }

        await expireInPersonIntents(adminClient, user.id, { landlordId: user.id, paymentId: id });

        const { data: payment, error: paymentError } = await adminClient
            .from("payments")
            .select("id, lease_id, amount, paid_amount, balance_remaining, tenant_id, landlord_id, allow_partial_payments, receipt_number, method, invoice_number, status, workflow_status, intent_method, amount_tag, review_action, payment_submitted_at, rejection_reason, in_person_intent_expires_at")
            .eq("id", id)
            .eq("landlord_id", user.id)
            .single();

        if (paymentError || !payment) {
            return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
        }

        if (
            (parsed.action === "confirm" || parsed.action === "confirm_received") &&
            (payment.workflow_status === "confirmed" || payment.workflow_status === "receipted")
        ) {
            return NextResponse.json({ ok: true, idempotent: true, workflowStatus: payment.workflow_status });
        }

        if (
            (parsed.action === "reject" || parsed.action === "request_completion") &&
            payment.workflow_status === "rejected"
        ) {
            return NextResponse.json({ ok: true, idempotent: true, workflowStatus: payment.workflow_status });
        }

        const beforeState = toWorkflowSnapshot(payment);

        const acceptedAmount = parsed.acceptedAmount ?? Number(payment.paid_amount || payment.amount);
        if (!Number.isFinite(acceptedAmount) || acceptedAmount <= 0) {
            return NextResponse.json({ error: "Accepted amount must be greater than zero." }, { status: 400 });
        }

        const amountTag = parsed.amountTag ?? computeAmountTag(Number(payment.amount), acceptedAmount);
        const isNonExact = amountTag !== "exact";

        if ((parsed.action === "confirm" || parsed.action === "confirm_received") && isNonExact && !parsed.nonExactAction) {
            return NextResponse.json(
                { error: "Non-exact payments require an explicit landlord action." },
                { status: 400 },
            );
        }

        const needsReason =
            parsed.action === "reject" ||
            parsed.action === "request_completion" ||
            parsed.nonExactAction === "reject" ||
            parsed.nonExactAction === "request_completion";

        const rejectionReason = parsed.rejectionReason?.trim() || null;
        if (needsReason && !rejectionReason) {
            return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
        }

        const nowIso = new Date().toISOString();
        let workflowStatus: "confirmed" | "rejected" = "confirmed";
        let reviewAction: "accept_partial" | "request_completion" | "reject" | "confirm_received" = "confirm_received";
        let balanceRemaining = Math.max(0, Number(payment.amount) - acceptedAmount);
        let paidAmount = acceptedAmount;
        let method = payment.method;

        if (parsed.action === "reject") {
            workflowStatus = "rejected";
            reviewAction = "reject";
            balanceRemaining = Number(payment.amount);
            paidAmount = 0;
        } else if (parsed.action === "request_completion") {
            workflowStatus = "rejected";
            reviewAction = "request_completion";
            balanceRemaining = Number(payment.amount);
            paidAmount = 0;
        } else {
            if (isNonExact) {
                if (parsed.nonExactAction === "reject") {
                    workflowStatus = "rejected";
                    reviewAction = "reject";
                    balanceRemaining = Number(payment.amount);
                    paidAmount = 0;
                } else if (parsed.nonExactAction === "request_completion") {
                    workflowStatus = "rejected";
                    reviewAction = "request_completion";
                    balanceRemaining = Number(payment.amount);
                    paidAmount = 0;
                } else {
                    reviewAction = "accept_partial";
                }
            } else {
                reviewAction = parsed.action === "confirm_received" ? "confirm_received" : "accept_partial";
            }

            if (parsed.action === "confirm_received") {
                method = "cash";
            }
        }

        const { data: updatedPayment, error: updateError } = await adminClient
            .from("payments")
            .update({
                workflow_status: workflowStatus,
                review_action: reviewAction,
                amount_tag: amountTag,
                paid_amount: paidAmount,
                balance_remaining: balanceRemaining,
                payment_note: parsed.note?.trim() || null,
                rejection_reason: workflowStatus === "rejected" ? rejectionReason : null,
                method,
                intent_method: parsed.action === "confirm_received" ? "in_person" : payment.intent_method,
                in_person_intent_expires_at: null,
                last_action_at: nowIso,
                last_action_by: user.id,
            })
            .eq("id", id)
            .select("id, lease_id, amount, paid_amount, balance_remaining, tenant_id, landlord_id, allow_partial_payments, receipt_number, method, invoice_number, status, workflow_status, intent_method, amount_tag, review_action, payment_submitted_at, rejection_reason, in_person_intent_expires_at")
            .single();

        if (updateError) throw updateError;

        let receiptIssued = false;
        if (updatedPayment.workflow_status === "confirmed" && updatedPayment.balance_remaining <= 0) {
            const receipt = await upsertPaymentReceipt(
                adminClient,
                {
                    id: updatedPayment.id,
                    landlord_id: updatedPayment.landlord_id,
                    tenant_id: updatedPayment.tenant_id,
                    paid_amount: updatedPayment.paid_amount,
                    amount: updatedPayment.amount,
                    receipt_number: updatedPayment.receipt_number,
                    method: updatedPayment.method,
                },
                user.id,
                parsed.note ?? null,
                {
                    originalAmount: Number(updatedPayment.amount),
                    acceptedAmount: Number(updatedPayment.paid_amount),
                    amountTag,
                },
            );

            const { error: receiptedError } = await adminClient
                .from("payments")
                .update({
                    workflow_status: "receipted",
                    receipt_number: receipt.receipt_number,
                    last_action_at: nowIso,
                    last_action_by: user.id,
                })
                .eq("id", updatedPayment.id);

            if (receiptedError) throw receiptedError;
            receiptIssued = true;
        }

        const finalWorkflowStatus = receiptIssued ? "receipted" : updatedPayment.workflow_status;

        await sendPaymentNotifications(
            adminClient,
            [updatedPayment.tenant_id, updatedPayment.landlord_id],
            {
                title: finalWorkflowStatus === "rejected" ? "Payment review rejected" : "Payment review updated",
                message:
                    finalWorkflowStatus === "rejected"
                        ? `Invoice ${updatedPayment.invoice_number ?? updatedPayment.id} was rejected.`
                        : receiptIssued
                          ? `Invoice ${updatedPayment.invoice_number ?? updatedPayment.id} is confirmed and receipted.`
                          : `Invoice ${updatedPayment.invoice_number ?? updatedPayment.id} was confirmed.`,
                data: {
                    paymentId: updatedPayment.id,
                    workflowStatus: finalWorkflowStatus,
                    amountTag,
                    reviewAction,
                    rejectionReason: finalWorkflowStatus === "rejected" ? rejectionReason : null,
                },
            },
        );

        await sendPaymentSystemMessage(
            adminClient,
            updatedPayment,
            {
                actorId: user.id,
                actorName: "Landlord",
                content:
                    finalWorkflowStatus === "rejected"
                        ? `The payment request has been rejected. Reason: ${rejectionReason}`
                        : receiptIssued
                          ? "The payment has been confirmed and a digital receipt has been issued."
                          : "The payment has been confirmed.",
                metadata: {
                    event: "landlord_review",
                    workflowStatus: finalWorkflowStatus,
                    reviewAction,
                    amountTag,
                    paymentId: updatedPayment.id,
                },
            },
        );

        await insertPaymentAuditEvent(adminClient, {
            paymentId: updatedPayment.id,
            actorId: user.id,
            action: `landlord_review_${finalWorkflowStatus}`,
            source: "api",
            idempotencyKey,
            beforeState,
            afterState: {
                ...toWorkflowSnapshot(updatedPayment),
                workflow_status: finalWorkflowStatus,
            },
            metadata: {
                amountTag,
                reviewAction,
                acceptedAmount,
                rejectionReason,
                receiptIssued,
            },
        });

        if (payment.lease_id) {
            await syncMoveInPaymentChecklist(supabase, payment.lease_id);
        }

        return NextResponse.json({
            ok: true,
            workflowStatus: finalWorkflowStatus,
            receiptIssued,
        });
    } catch (error) {
        console.error("Failed to review invoice:", error);
        return NextResponse.json({ error: "Failed to update invoice." }, { status: 500 });
    }
}
