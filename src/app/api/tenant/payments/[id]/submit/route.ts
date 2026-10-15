import { NextResponse } from "next/server";
import {
  expireInPersonIntents,
  insertPaymentAuditEvent,
  sendPaymentNotifications,
  sendPaymentSystemMessage,
  toWorkflowSnapshot,
} from "@/lib/billing/workflow";
import { BILLING_BUCKETS, uploadBillingFile } from "@/lib/billing/storage";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { databaseErrorResponse, parseWithSchema } from "@/lib/validation/server";
import {
  PROOF_LIMITS,
  amountWithinBalanceRule,
  isUuid,
  outstandingBalance,
  proofFileRule, proofContentRule,
  roundCentavos,
  tenantPaymentSubmitSchema,
} from "@/lib/validation/schemas/billing.schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId } = authContext;
  const adminClient = createServiceRoleSupabaseClient();

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Request body is invalid.", fieldErrors: {} }, { status: 400 });
  }

  const parsed = parseWithSchema(tenantPaymentSubmitSchema, {
    method: formData.get("method") ?? undefined,
    referenceNumber: formData.get("referenceNumber") ?? undefined,
    note: formData.get("note"),
    partialAmount: formData.get("partialAmount") ?? undefined,
    selectedItemIds: formData.get("selectedItemIds"),
    selectedReadingIds: formData.get("selectedReadingIds"),
  });
  if (!parsed.ok) return parsed.response;
  const { referenceNumber: trimmedReference, note, partialAmount: requestedAmount, selectedItemIds, selectedReadingIds } = parsed.data;

  const fileEntry = formData.get("receipt");
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
  if (!file) {
    return NextResponse.json(
      { error: "A clear payment proof image is required.", fieldErrors: { receipt: "A clear payment proof image is required." } },
      { status: 400 },
    );
  }
  const fileError = proofFileRule(file, {
    label: "Payment proof",
    required: true,
    maxBytes: PROOF_LIMITS.paymentProofMaxBytes,
    minBytes: PROOF_LIMITS.paymentProofMinBytes,
  }) ?? (await proofContentRule(file, { label: "Payment proof" }));
  if (fileError) {
    return NextResponse.json({ error: fileError, fieldErrors: { receipt: fileError } }, { status: 400 });
  }

  try {
    await expireInPersonIntents(adminClient, userId, { tenantId: userId, paymentId: id });

        const { data: payment, error: paymentError } = await adminClient
            .from("payments")
            .select("id, tenant_id, landlord_id, amount, paid_amount, balance_remaining, allow_partial_payments, invoice_number, workflow_status, review_action, status, intent_method, amount_tag, receipt_number, payment_submitted_at, rejection_reason, in_person_intent_expires_at, reference_number, payment_proof_url, metadata")
            .eq("id", id)
            .eq("tenant_id", userId)
            .single();

        if (paymentError || !payment) {
            return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
        }

        if (payment.workflow_status === "confirmed" || payment.workflow_status === "receipted") {
            return NextResponse.json({ error: "This invoice is already finalized." }, { status: 409 });
        }

        if (
            payment.workflow_status === "under_review" &&
            payment.reference_number === trimmedReference &&
            payment.payment_proof_url
        ) {
            return NextResponse.json({ ok: true, idempotent: true });
        }

        // Duplicate-submission guard: the submitted amount is already applied to
        // paid_amount while under review, so a second proof must wait for the review.
        if (payment.workflow_status === "under_review") {
            return NextResponse.json(
                { error: "A payment for this invoice is already awaiting your landlord's review." },
                { status: 409 },
            );
        }

        const expectedAmount = outstandingBalance(payment);
        if (expectedAmount <= 0) {
            return NextResponse.json({ error: "This invoice has no remaining balance." }, { status: 409 });
        }

        const partialAmount = requestedAmount ?? expectedAmount;
        const amountError = amountWithinBalanceRule(partialAmount, expectedAmount, { label: "Payment amount" });
        if (amountError) {
            return NextResponse.json({ error: amountError, fieldErrors: { partialAmount: amountError } }, { status: 400 });
        }

        if (!payment.allow_partial_payments && partialAmount < expectedAmount) {
            return NextResponse.json(
                { error: "Partial payments are not enabled for this invoice.", fieldErrors: { partialAmount: "Partial payments are not enabled for this invoice." } },
                { status: 400 },
            );
        }

        // Selected line items / readings must belong to this invoice.
        if (selectedItemIds.length > 0) {
            const { data: ownedItems, error: itemsError } = await adminClient
                .from("payment_items")
                .select("id")
                .eq("payment_id", payment.id)
                .in("id", selectedItemIds);
            if (itemsError || (ownedItems ?? []).length !== selectedItemIds.length) {
                return NextResponse.json({ error: "Some selected charges do not belong to this invoice." }, { status: 400 });
            }
        }
        if (selectedReadingIds.length > 0) {
            const { data: ownedReadings, error: readingsError } = await adminClient
                .from("utility_readings")
                .select("id")
                .eq("payment_id", payment.id)
                .in("id", selectedReadingIds);
            if (readingsError || (ownedReadings ?? []).length !== selectedReadingIds.length) {
                return NextResponse.json({ error: "Some selected readings do not belong to this invoice." }, { status: 400 });
            }
        }

        const proofUpload = await uploadBillingFile({
            bucketName: BILLING_BUCKETS.paymentProofs,
            ownerId: userId,
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
                payment_note: note ?? null,
                payment_proof_path: proofUpload?.path ?? null,
                payment_proof_url: proofUpload?.publicUrl ?? null,
                paid_amount: roundCentavos(Number(payment.paid_amount || 0) + partialAmount),
                balance_remaining: roundCentavos(Math.max(0, expectedAmount - partialAmount)),
                metadata: {
                    ...((payment.metadata as any) || {}),
                    pending_item_ids: selectedItemIds,
                    pending_reading_ids: selectedReadingIds,
                },
                in_person_intent_expires_at: null,
                last_action_at: nowIso,
                last_action_by: userId,
            })
            .eq("id", payment.id)
            .select("id, status, workflow_status, intent_method, amount_tag, review_action, paid_amount, balance_remaining, receipt_number, payment_submitted_at, rejection_reason, in_person_intent_expires_at")
            .single();

        if (updateError) {
            console.error("Failed to record tenant payment submission:", updateError);
            return databaseErrorResponse(updateError, "Failed to submit payment.");
        }

        await Promise.all([
            sendPaymentNotifications(
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
            ),
            sendPaymentSystemMessage(
                adminClient,
                payment,
                {
                    actorId: userId,
                    actorName: "Tenant",
                    content: `Payment proof submitted for invoice ${payment.invoice_number ?? payment.id}. Status is now Under Review.`,
                    metadata: {
                        event: "payment_submitted",
                        workflowStatus: "under_review",
                        paymentId: payment.id,
                    },
                },
            ),
            insertPaymentAuditEvent(adminClient, {
                paymentId: payment.id,
                actorId: userId,
                action: "tenant_payment_submitted_gcash",
                source: "api",
                beforeState,
                afterState: toWorkflowSnapshot(updatedPayment),
                metadata: {
                    referenceNumber: trimmedReference,
                    submittedAmount: partialAmount,
                },
            }),
        ]);


        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Failed to submit tenant payment:", error);
        return NextResponse.json({ error: "Failed to submit payment." }, { status: 500 });
    }
}
