import { NextResponse } from "next/server";
import {
  expireInPersonIntents,
  getInPersonIntentExpiry,
  insertPaymentAuditEvent,
  sendPaymentNotifications,
  sendPaymentSystemMessage,
  toWorkflowSnapshot,
} from "@/lib/billing/workflow";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { databaseErrorResponse, parseWithSchema } from "@/lib/validation/server";
import { isUuid, tenantPaymentIntentSchema } from "@/lib/validation/schemas/billing.schema";

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

  // An empty body is allowed (all fields optional); malformed fields are not.
  const rawBody = await request.json().catch(() => ({}));
  const parsedBody = parseWithSchema(tenantPaymentIntentSchema, rawBody ?? {});
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.data;
  const note = body.note ?? null;
  const selectedItemIds = Array.from(new Set(body.selectedItemIds ?? []));
  const selectedReadingIds = Array.from(new Set(body.selectedReadingIds ?? []));

  try {
    await expireInPersonIntents(adminClient, userId, { tenantId: userId, paymentId: id });

        const { data: payment, error: paymentError } = await adminClient
            .from("payments")
            .select("id, tenant_id, landlord_id, invoice_number, status, workflow_status, intent_method, amount_tag, review_action, paid_amount, balance_remaining, receipt_number, payment_submitted_at, rejection_reason, in_person_intent_expires_at, metadata")
            .eq("id", id)
            .eq("tenant_id", userId)
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

        // A GCash proof is already awaiting review; a second (cash) intent would double-book it.
        if (payment.workflow_status === "under_review") {
            return NextResponse.json(
                { error: "A payment for this invoice is already awaiting your landlord's review." },
                { status: 409 },
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

        const beforeState = toWorkflowSnapshot(payment as any);
        const nowIso = new Date().toISOString();
        const expiresAt = getInPersonIntentExpiry();
        const landlordTransactionPath = `/landlord/invoices?invoiceId=${payment.id}`;

        const { data: updatedPayment, error: updateError } = await adminClient
            .from("payments")
            .update({
                workflow_status: "awaiting_in_person",
                method: "cash",
                intent_method: "in_person",
                in_person_intent_expires_at: expiresAt,
                payment_submitted_at: nowIso,
                payment_note: note,
                metadata: {
                    ...((payment.metadata as any) || {}),
                    pending_item_ids: selectedItemIds,
                    pending_reading_ids: selectedReadingIds,
                },
                rejection_reason: null,
                review_action: null,
                last_action_at: nowIso,
                last_action_by: userId,
            })
            .eq("id", payment.id)
            .select("id, status, workflow_status, intent_method, amount_tag, review_action, paid_amount, balance_remaining, receipt_number, payment_submitted_at, rejection_reason, in_person_intent_expires_at")
            .single();

        if (updateError) {
            console.error("Failed to record in-person intent:", updateError);
            return databaseErrorResponse(updateError, "Failed to trigger in-person payment.");
        }

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
                actorId: userId,
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
            actorId: userId,
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
