import type { SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

import { findDirectConversation } from "@/lib/messages/engine";
import type { Database, Payment } from "@/types/database";

type DbClient = SupabaseClient<Database>;

export const IN_PERSON_INTENT_EXPIRY_HOURS = 72;

export type WorkflowSource = "api" | "chat_button" | "system_expiry";

export type PaymentWorkflowStatus = Database["public"]["Enums"]["payment_workflow_status"];
export type PaymentAmountTag = Database["public"]["Enums"]["payment_amount_tag"];
export type PaymentReviewAction = Database["public"]["Enums"]["payment_review_action"];
export type PaymentIntentMethod = Database["public"]["Enums"]["payment_intent_method"];

export type PaymentWorkflowSnapshot = Pick<
    Payment,
    | "id"
    | "status"
    | "workflow_status"
    | "intent_method"
    | "amount_tag"
    | "review_action"
    | "paid_amount"
    | "balance_remaining"
    | "receipt_number"
    | "payment_submitted_at"
    | "rejection_reason"
    | "in_person_intent_expires_at"
>;

type NotifyOptions = {
    title: string;
    message: string;
    type?: Database["public"]["Enums"]["notification_type"];
    data?: Database["public"]["Tables"]["notifications"]["Insert"]["data"];
};

type MessageOptions = {
    actorId: string;
    actorName: string;
    content: string;
    metadata?: Database["public"]["Tables"]["messages"]["Insert"]["metadata"];
};

export function toWorkflowSnapshot(payment: any): PaymentWorkflowSnapshot {
    return {
        id: payment.id,
        status: payment.status,
        workflow_status: payment.workflow_status,
        intent_method: payment.intent_method,
        amount_tag: payment.amount_tag,
        review_action: payment.review_action,
        paid_amount: payment.paid_amount,
        balance_remaining: payment.balance_remaining,
        receipt_number: payment.receipt_number,
        payment_submitted_at: payment.payment_submitted_at,
        rejection_reason: payment.rejection_reason,
        in_person_intent_expires_at: payment.in_person_intent_expires_at,
    };
}

export function getInPersonIntentExpiry(from = new Date()) {
    return new Date(from.getTime() + IN_PERSON_INTENT_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
}

export function computeAmountTag(expectedAmount: number, acceptedAmount: number): PaymentAmountTag {
    const expected = Number(expectedAmount);
    const accepted = Number(acceptedAmount);

    if (!Number.isFinite(expected) || expected <= 0 || !Number.isFinite(accepted) || accepted <= 0) {
        return "short_paid";
    }

    const delta = Number((accepted - expected).toFixed(2));
    if (Math.abs(delta) < 0.01) return "exact";
    if (delta > 0) return "overpaid";
    return accepted >= expected * 0.75 ? "partial" : "short_paid";
}

export async function insertPaymentAuditEvent(
    supabase: DbClient,
    params: {
        paymentId: string;
        actorId?: string | null;
        action: string;
        source: WorkflowSource;
        idempotencyKey?: string | null;
        beforeState?: Record<string, unknown>;
        afterState?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
    },
) {
    const { data, error } = await supabase
        .from("payment_workflow_audit_events")
        .insert({
            payment_id: params.paymentId,
            actor_id: params.actorId ?? null,
            action: params.action,
            source: params.source,
            idempotency_key: params.idempotencyKey ?? null,
            before_state: (params.beforeState as any) ?? {},
            after_state: (params.afterState as any) ?? {},
            metadata: (params.metadata as any) ?? {},
        } as any)
        .select("id")
        .maybeSingle();

    if (error) {
        const duplicate = error.code === "23505";
        if (duplicate && params.idempotencyKey) {
            const existing = await supabase
                .from("payment_workflow_audit_events")
                .select("id")
                .eq("payment_id", params.paymentId)
                .eq("idempotency_key", params.idempotencyKey)
                .maybeSingle();
            return { duplicate: true, id: existing.data?.id ?? null };
        }
        throw error;
    }

    return { duplicate: false, id: data?.id ?? null };
}

export async function getOrCreateDirectConversation(supabase: DbClient, userA: string, userB: string) {
    const existing = await findDirectConversation(supabase, userA, userB);
    if (existing) return existing;

    const conversationId = crypto.randomUUID();
    const { error: conversationError } = await supabase.from("conversations").insert({ id: conversationId });
    if (conversationError) throw conversationError;

    const { error: participantError } = await supabase.from("conversation_participants").insert([
        { conversation_id: conversationId, user_id: userA },
        { conversation_id: conversationId, user_id: userB },
    ]);
    if (participantError) throw participantError;

    return conversationId;
}

export async function sendPaymentNotifications(
    supabase: DbClient,
    userIds: string[],
    options: NotifyOptions,
) {
    if (userIds.length === 0) return;

    const inserts = userIds.map((userId) => ({
        user_id: userId,
        type: options.type ?? "payment",
        title: options.title,
        message: options.message,
        data: options.data ?? {},
    }));

    const { error } = await supabase.from("notifications").insert(inserts);
    if (error) throw error;
}

export async function sendPaymentSystemMessage(
    supabase: DbClient,
    payment: Pick<Payment, "tenant_id" | "landlord_id" | "id" | "invoice_number">,
    options: MessageOptions,
) {
    const conversationId = await getOrCreateDirectConversation(supabase, payment.tenant_id, payment.landlord_id);

    const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: options.actorId,
        type: "system",
        content: options.content,
        metadata: {
            ...(options.metadata as any ?? {}),
            actorName: options.actorName,
            paymentId: payment.id,
            invoiceNumber: payment.invoice_number,
            conversationId,
        },
    });

    if (error) throw error;
    return conversationId;
}

export async function expireInPersonIntents(
    supabase: DbClient,
    actorId: string | null,
    filters: { tenantId?: string; landlordId?: string; paymentId?: string } = {},
) {
    let query = supabase
        .from("payments")
        .select("id, tenant_id, landlord_id, invoice_number, workflow_status, in_person_intent_expires_at")
        .eq("workflow_status", "awaiting_in_person")
        .lt("in_person_intent_expires_at", new Date().toISOString());

    if (filters.tenantId) query = query.eq("tenant_id", filters.tenantId);
    if (filters.landlordId) query = query.eq("landlord_id", filters.landlordId);
    if (filters.paymentId) query = query.eq("id", filters.paymentId);

    const { data: expiredRows, error } = await query;
    if (error) throw error;

    if (!expiredRows || expiredRows.length === 0) return 0;

    for (const row of expiredRows) {
        const { error: updateError } = await supabase
            .from("payments")
            .update({
                workflow_status: "pending",
                intent_method: null,
                in_person_intent_expires_at: null,
                review_action: null,
                last_action_at: new Date().toISOString(),
                last_action_by: actorId,
            })
            .eq("id", row.id)
            .eq("workflow_status", "awaiting_in_person");
        if (updateError) throw updateError;

        await insertPaymentAuditEvent(supabase, {
            paymentId: row.id,
            actorId,
            action: "in_person_intent_expired",
            source: "system_expiry",
            beforeState: {
                workflowStatus: row.workflow_status,
                inPersonIntentExpiresAt: row.in_person_intent_expires_at,
            },
            afterState: {
                workflowStatus: "pending",
                inPersonIntentExpiresAt: null,
            },
            metadata: {
                reason: "deadline_elapsed",
            },
        });

        await sendPaymentNotifications(
            supabase,
            [row.tenant_id, row.landlord_id],
            {
                title: "In-person payment intent expired",
                message: `Invoice ${row.invoice_number ?? row.id} was returned to Pending after no confirmation in 3 days.`,
                data: {
                    paymentId: row.id,
                    workflowStatus: "pending",
                    reason: "in_person_intent_expired",
                },
            },
        );

        await sendPaymentSystemMessage(
            supabase,
            {
                id: row.id,
                tenant_id: row.tenant_id,
                landlord_id: row.landlord_id,
                invoice_number: row.invoice_number,
            },
            {
                actorId: actorId ?? row.landlord_id,
                actorName: "IRIS",
                content: "The face-to-face payment request has expired. The invoice status has been reverted to pending.",
                metadata: {
                    event: "in_person_intent_expired",
                    paymentId: row.id,
                    workflowStatus: "pending",
                },
            },
        );
    }

    return expiredRows.length;
}
