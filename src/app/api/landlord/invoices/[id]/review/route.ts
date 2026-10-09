import { NextResponse } from "next/server";

import { upsertPaymentReceipt, generateNextMonthInvoice } from "@/lib/billing/server";
import {
    computeAmountTag,
    expireInPersonIntents,
    insertPaymentAuditEvent,
    sendPaymentNotifications,
    sendPaymentSystemMessage,
    toWorkflowSnapshot,
} from "@/lib/billing/workflow";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { databaseErrorResponse, parseJsonBody, parseWithSchema, type ParseResult } from "@/lib/validation/server";
import {
    PROOF_LIMITS,
    REJECTION_REASON_REQUIRED,
    invoiceReviewSchema,
    isUuid,
    proofFileExtension,
    proofFileRule, proofContentRule,
    type InvoiceReviewInput,
} from "@/lib/validation/schemas/billing.schema";

/**
 * Accepts both the web modal's multipart body (`json` field + optional
 * `refundProofFile`) and a plain JSON body (mobile landlord view).
 */
async function readReviewRequest(
    request: Request,
): Promise<ParseResult<{ review: InvoiceReviewInput; refundProofFile: File | null }>> {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        const parsed = await parseJsonBody(request, invoiceReviewSchema);
        if (!parsed.ok) return parsed;
        return { ok: true, data: { review: parsed.data, refundProofFile: null } };
    }

    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return { ok: false, response: NextResponse.json({ error: "Request body is invalid.", fieldErrors: {} }, { status: 400 }) };
    }

    const rawJson = formData.get("json");
    let raw: unknown;
    try {
        raw = typeof rawJson === "string" ? JSON.parse(rawJson) : undefined;
    } catch {
        raw = undefined;
    }
    if (!raw || typeof raw !== "object") {
        return { ok: false, response: NextResponse.json({ error: "Review details are missing or malformed.", fieldErrors: {} }, { status: 400 }) };
    }

    const parsed = parseWithSchema(invoiceReviewSchema, raw);
    if (!parsed.ok) return parsed;

    const fileEntry = formData.get("refundProofFile");
    const refundProofFile = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
    const fileError = proofFileRule(refundProofFile, { label: "Refund proof", maxBytes: PROOF_LIMITS.refundProofMaxBytes }) ?? (await proofContentRule(refundProofFile, { label: "Refund proof" }));
    if (fileError) {
        return { ok: false, response: NextResponse.json({ error: fileError, fieldErrors: { refundProofFile: fileError } }, { status: 400 }) };
    }

    return { ok: true, data: { review: parsed.data, refundProofFile } };
}

type RouteContext = {
    params: Promise<{ id: string }>;
};

async function syncMoveInPaymentChecklist(supabase: SupabaseClient<Database>, leaseId: string) {
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

    const appQuery = supabase
        .from("applications")
        .select("id, requirements_checklist");

    const { data: applications, error: applicationError } = await appQuery
        .eq("lease_id", leaseId) as any;

    if (applicationError) throw applicationError;

    await Promise.all(
        (applications ?? []).map(async (application: any) => {
            const currentChecklist =
                application.requirements_checklist &&
                typeof application.requirements_checklist === "object" &&
                !Array.isArray(application.requirements_checklist)
                    ? (application.requirements_checklist as Record<string, unknown>)
                    : {};

            const updatePayload = {
                requirements_checklist: {
                    ...currentChecklist,
                    move_in_payment: moveInPaymentComplete,
                },
            } as any;
            const { error: updateError } = await supabase
                .from("applications" as any)
                .update(updatePayload)
                .eq("id", application.id);

            if (updateError) throw updateError;
        }),
    );
}

export async function POST(request: Request, context: RouteContext) {
    const { id } = await context.params;
    const adminClient = createServiceRoleSupabaseClient();
    const authContext = await requireAuthenticatedUser(request);

    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    if (!isUuid(id)) {
        return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    const body = await readReviewRequest(request);
    if (!body.ok) return body.response;
    const { review: parsed, refundProofFile } = body.data;

    try {

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

        await expireInPersonIntents(adminClient, userId, { landlordId: userId, paymentId: id });

        const { data: payment, error: paymentError } = await adminClient
            .from("payments")
            .select("id, lease_id, amount, paid_amount, balance_remaining, tenant_id, landlord_id, allow_partial_payments, receipt_number, method, invoice_number, status, workflow_status, intent_method, amount_tag, review_action, payment_submitted_at, rejection_reason, in_person_intent_expires_at, metadata")
            .eq("id", id)
            .eq("landlord_id", userId)
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

        // A receipted invoice is closed: it cannot be rejected or reopened from review.
        if (
            (parsed.action === "reject" || parsed.action === "request_completion") &&
            payment.workflow_status === "receipted"
        ) {
            return NextResponse.json({ error: "This invoice is already finalized." }, { status: 409 });
        }

        // Upload only after ownership is confirmed and the action is known to proceed.
        let refundProofUrl = parsed.refundProofUrl || null;
        if (refundProofFile) {
            const fileName = `refund-proof-${id}-${Date.now()}.${proofFileExtension(refundProofFile)}`;
            const { data: uploadData, error: uploadError } = await adminClient.storage
                .from("payment-proofs")
                .upload(fileName, refundProofFile, { contentType: refundProofFile.type });

            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = adminClient.storage
                .from("payment-proofs")
                .getPublicUrl(uploadData.path);
            refundProofUrl = publicUrl;
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
            return NextResponse.json(
                { error: REJECTION_REASON_REQUIRED, fieldErrors: { rejectionReason: REJECTION_REASON_REQUIRED } },
                { status: 400 },
            );
        }

        const nowIso = new Date().toISOString();
        let workflowStatus: "confirmed" | "rejected" = "confirmed";
        let reviewAction: "accept_partial" | "request_completion" | "reject" | "confirm_received" = "confirm_received";
        
        // Correct math: balance_remaining and paid_amount are already updated by tenant submit
        // If we reject, we REVERT them. If we confirm, we KEEP them (or adjust if acceptedAmount differs).
        let balanceRemaining = Number(payment.balance_remaining);
        let paidAmount = Number(payment.paid_amount);
        let method = payment.method;

        // Metadata handling
        const currentMetadata = (payment.metadata as any) || {};
        const pendingItems = currentMetadata.pending_item_ids || [];
        const pendingReadings = currentMetadata.pending_reading_ids || [];
        let paidItemIds = currentMetadata.paid_item_ids || [];
        let paidReadingIds = currentMetadata.paid_reading_ids || [];
        let newMetadata = { ...currentMetadata };

        if (parsed.action === "reject") {
            workflowStatus = "rejected";
            reviewAction = "reject";
            // Revert to previous state
            const rejectedAmount = Number(payment.paid_amount) - (beforeState.paid_amount || 0);
            paidAmount = Number(beforeState.paid_amount || 0);
            balanceRemaining = Number(beforeState.balance_remaining || payment.amount);
            
            // Clear pending items on rejection
            newMetadata.pending_item_ids = [];
            newMetadata.pending_reading_ids = [];
        } else if (parsed.action === "request_completion") {
            workflowStatus = "rejected";
            reviewAction = "request_completion";
            // Use the acceptedAmount provided in the review (essential for F2F shortfalls)
            paidAmount = acceptedAmount;
            balanceRemaining = Math.max(0, Number(payment.amount) - acceptedAmount);
            
            // Clear pending items on rejection
            newMetadata.pending_item_ids = [];
            newMetadata.pending_reading_ids = [];
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
                    paidAmount = acceptedAmount;
                    balanceRemaining = Math.max(0, Number(payment.amount) - acceptedAmount);
                } else {
                    reviewAction = "accept_partial";
                    paidAmount = Number(beforeState.paid_amount || 0) + acceptedAmount;
                    balanceRemaining = Math.max(0, Number(payment.amount) - paidAmount);
                }
            } else {
                reviewAction = parsed.action === "confirm_received" ? "confirm_received" : "accept_partial";
                paidAmount = Number(beforeState.paid_amount || 0) + acceptedAmount;
                balanceRemaining = Math.max(0, Number(payment.amount) - paidAmount);
            }

            if (parsed.action === "confirm_received") {
                method = "cash";
            }

            // Move pending items to paid items on confirmation
            paidItemIds = Array.from(new Set([...paidItemIds, ...pendingItems]));
            paidReadingIds = Array.from(new Set([...paidReadingIds, ...pendingReadings]));
            
            newMetadata = {
                ...newMetadata,
                paid_item_ids: paidItemIds,
                paid_reading_ids: paidReadingIds,
                pending_item_ids: [],
                pending_reading_ids: [],
            };
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
                metadata: {
                    ...newMetadata,
                    refund_proof_url: refundProofUrl || (parsed.refundProofUrl ?? null),
                },
                in_person_intent_expires_at: null,
                last_action_at: nowIso,
                last_action_by: userId,
            })
            .eq("id", id)
            .select("id, lease_id, amount, paid_amount, balance_remaining, tenant_id, landlord_id, allow_partial_payments, receipt_number, method, invoice_number, status, workflow_status, intent_method, amount_tag, review_action, payment_submitted_at, rejection_reason, in_person_intent_expires_at")
            .single();

        if (updateError) {
            console.error("Failed to update reviewed invoice:", updateError);
            if ((updateError as { code?: string }).code === "23514") {
                return NextResponse.json(
                    { error: REJECTION_REASON_REQUIRED, fieldErrors: { rejectionReason: REJECTION_REASON_REQUIRED } },
                    { status: 400 },
                );
            }
            return databaseErrorResponse(updateError, "Failed to update invoice.");
        }

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
                userId,
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
                    status: "completed",
                    workflow_status: "receipted",
                    receipt_number: receipt.receipt_number,
                    last_action_at: nowIso,
                    last_action_by: userId,
                })
                .eq("id", updatedPayment.id);

            if (receiptedError) throw receiptedError;
            receiptIssued = true;
        }

        const finalWorkflowStatus = receiptIssued ? "receipted" : updatedPayment.workflow_status;

        // Auto-generate next month's invoice after payment is confirmed/receipted
        if (finalWorkflowStatus === "confirmed" || finalWorkflowStatus === "receipted") {
            try {
                const nextInvoice = await generateNextMonthInvoice(adminClient, updatedPayment.lease_id);
                console.log("[Review API] Auto-generated next month invoice:", nextInvoice);
            } catch (nextInvoiceError) {
                console.error("[Review API] Failed to auto-generate next month invoice:", nextInvoiceError);
                // Don't fail the main operation if next invoice generation fails
            }
        }

        const paymentMetadata = payment.metadata as any || {};
        // Only mark as refund reconciliation if landlord is actually uploading refund proof AND the action is "confirm"
        const isRefundReconciliation = parsed.issueType === "excessive_amount" && parsed.action === "confirm" && refundProofUrl !== null;

        console.log("[Review API] REFUND CHECK:", {
            action: parsed.action,
            refundProofFile_present: !!refundProofFile,
            refundProofUrl_value: refundProofUrl,
            issueType_from_payload: parsed.issueType,
            issueType_from_payment: paymentMetadata.issueType,
            refundPreference_in_payment: !!paymentMetadata.refund_preference,
            isRefundReconciliation: isRefundReconciliation,
            paymentId: updatedPayment.id,
            invoiceNumber: updatedPayment.invoice_number,
        });

        await sendPaymentNotifications(
            adminClient,
            [updatedPayment.tenant_id, updatedPayment.landlord_id],
            {
                title: isRefundReconciliation 
                    ? "Refund Processed" 
                    : (finalWorkflowStatus === "rejected" ? "Payment review rejected" : "Payment review updated"),
                message:
                    isRefundReconciliation 
                        ? `Refund for invoice ${updatedPayment.invoice_number ?? updatedPayment.id} has been processed.`
                        : finalWorkflowStatus === "rejected"
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
                    refundProofUrl: refundProofUrl || (parsed.refundProofUrl ?? null),
                    isRefundReconciliation,
                },
            },
        );

        // Send system message for normal payments (not refund reconciliation)
        if (!isRefundReconciliation) {
            await sendPaymentSystemMessage(
                adminClient,
                updatedPayment,
                {
                    actorId: userId,
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
                        rejectionReason: finalWorkflowStatus === "rejected" ? rejectionReason : null,
                        issueType: parsed.issueType,
                        shortfallAmount: parsed.shortfallAmount,
                        refundProofUrl: refundProofUrl || (parsed.refundProofUrl ?? null),
                    },
                },
            );
        }
        // Update existing overpayment message for refund reconciliation
        else if (isRefundReconciliation) {
            const { data: overpaymentMsg } = await adminClient
                .from("messages")
                .select("id, metadata")
                .eq("type", "system")
                .contains("metadata", { paymentId: updatedPayment.id, issueType: "excessive_amount" })
                .maybeSingle();

            if (overpaymentMsg) {
                console.log("[Review API] Found existing refund message:", overpaymentMsg.id, "Updating to resolved state...");
                const { error: updateError } = await adminClient
                    .from("messages")
                    .update({
                        content: "The refund has been processed and reconciliation is complete.",
                        metadata: {
                            ...(overpaymentMsg.metadata as any || {}),
                            isResolved: true,
                            workflowStatus: finalWorkflowStatus,
                            refundProofUrl: refundProofUrl || (parsed.refundProofUrl ?? null),
                        },
                    })
                    .eq("id", overpaymentMsg.id)
                    .select("id");

                if (updateError) {
                    console.error("[Review API] Failed to update refund message:", updateError);
                } else {
                    console.log("[Review API] Successfully updated message to resolved. Refund proof URL:", refundProofUrl);
                }
            } else {
                console.log("[Review API] No existing refund message found for payment", updatedPayment.id, "- creating new one...");
                await sendPaymentSystemMessage(
                    adminClient,
                    updatedPayment,
                    {
                        actorId: userId,
                        actorName: "Landlord",
                        content: "The refund has been processed and reconciliation is complete.",
                        metadata: {
                            event: "landlord_review",
                            systemType: "landlord_review",
                            workflowStatus: finalWorkflowStatus,
                            issueType: "excessive_amount",
                            isResolved: true,
                            refundProofUrl: refundProofUrl || (parsed.refundProofUrl ?? null),
                            paymentId: updatedPayment.id,
                        },
                    },
                );
            }
        }

        await insertPaymentAuditEvent(adminClient, {
            paymentId: updatedPayment.id,
            actorId: userId,
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
            debug: {
                isRefundReconciliation,
                action: parsed.issueType,
                issueType: parsed.issueType,
                hasRefundProof: !!refundProofUrl,
                paymentId: updatedPayment. id,
                invoiceNumber: updatedPayment.invoice_number,
            }
        });
    } catch (error) {
        console.error("Failed to review invoice:", error);
        return NextResponse.json({ error: "Failed to update invoice." }, { status: 500 });
    }
}
