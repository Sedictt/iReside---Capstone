import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { upsertPaymentReceipt, generateNextMonthInvoice } from "@/lib/billing/server";
import { insertPaymentAuditEvent, sendPaymentNotifications } from "@/lib/billing/workflow";
import { logUserActivity } from "@/lib/audit/audit-logger";

const collectPaymentSchema = z.object({
    invoiceId: z.string().uuid(),
    amount: z.number().positive(),
    method: z.enum(["cash", "gcash", "bank_transfer"]).default("cash"),
    referenceNumber: z.string().max(100).optional().nullable(),
    paymentDate: z.string().optional(),
    note: z.string().max(500).optional().nullable(),
});

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId } = authContext;
    const adminClient = createServiceRoleSupabaseClient();

    try {
        const body = await request.json();
        const parsed = collectPaymentSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid payment payload.", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { invoiceId, amount, method, referenceNumber, paymentDate, note } = parsed.data;

        // Fetch payment record
        const { data: payment, error: paymentError } = await adminClient
            .from("payments")
            .select("id, lease_id, amount, paid_amount, balance_remaining, tenant_id, landlord_id, allow_partial_payments, receipt_number, method, invoice_number, status, workflow_status, metadata")
            .eq("id", invoiceId)
            .eq("landlord_id", userId)
            .single();

        if (paymentError || !payment) {
            return NextResponse.json({ error: "Invoice not found or unauthorized." }, { status: 404 });
        }

        const nowIso = new Date().toISOString();
        const currentPaid = Number(payment.paid_amount || 0);
        const newPaidTotal = currentPaid + amount;
        const newBalanceRemaining = Math.max(0, Number(payment.amount) - newPaidTotal);
        const isFull = newBalanceRemaining <= 0;

        const updatePayload: any = {
            status: isFull ? "completed" : "pending",
            workflow_status: isFull ? "receipted" : "confirmed",
            paid_amount: newPaidTotal,
            balance_remaining: newBalanceRemaining,
            method,
            reference_number: referenceNumber || null,
            landlord_confirmed: true,
            paid_at: paymentDate ? new Date(paymentDate).toISOString() : nowIso,
            payment_submitted_at: nowIso,
            payment_note: note || "Direct landlord collection",
            amount_tag: isFull ? "exact" : "partial",
            review_action: "confirm_received",
            last_action_at: nowIso,
            last_action_by: userId,
        };

        // Create or update receipt
        const receipt = await upsertPaymentReceipt(
            adminClient,
            {
                id: payment.id,
                landlord_id: payment.landlord_id,
                tenant_id: payment.tenant_id,
                paid_amount: amount,
                amount: payment.amount,
                receipt_number: payment.receipt_number,
                method,
            },
            userId,
            note ?? "Payment collected directly by landlord",
            {
                originalAmount: Number(payment.amount),
                acceptedAmount: amount,
                amountTag: isFull ? "exact" : "partial",
            }
        );

        updatePayload.receipt_number = receipt.receipt_number;

        const { data: updatedPayment, error: updateError } = await adminClient
            .from("payments")
            .update(updatePayload)
            .eq("id", invoiceId)
            .select("id, invoice_number, receipt_number, amount, paid_amount, balance_remaining, status, workflow_status, method, paid_at")
            .single();

        if (updateError) {
            throw updateError;
        }

        // Auto-generate next month invoice if fully settled
        if (isFull) {
            try {
                await generateNextMonthInvoice(adminClient, payment.lease_id);
            } catch (nextInvoiceError) {
                console.error("[Collect Payment API] Next month invoice generation skipped:", nextInvoiceError);
            }
        }

        // Audit Event
        try {
            await insertPaymentAuditEvent(adminClient, {
                paymentId: payment.id,
                actorId: userId,
                action: "confirm_received",
                source: "api",
                beforeState: payment,
                afterState: { ...payment, ...updatePayload },
                metadata: {
                    collectionMode: "direct_landlord_collection",
                    method,
                    amountCollected: amount,
                    referenceNumber: referenceNumber || null,
                },
            });

            await logUserActivity({
                userId,
                userRole: "landlord",
                action: "PAYMENT_COLLECTED",
                category: "billing",
                title: `Rent Payment Collected (₱${amount.toLocaleString()})`,
                description: `Recorded ${method.toUpperCase()} collection of ₱${amount.toLocaleString()} (Receipt #${receipt.receipt_number}).`,
                severity: "info",
                targetId: payment.id,
                targetType: "payment",
                metadata: {
                    amount,
                    method,
                    referenceNumber: referenceNumber || null,
                    receiptNumber: receipt.receipt_number,
                    isFullyPaid: isFull,
                    invoiceNumber: payment.invoice_number,
                },
                userAgent: request.headers.get("user-agent"),
            }, adminClient);
        } catch (auditError) {
            console.error("[Collect Payment API] Audit event logging error:", auditError);
        }

        // Notify tenant
        try {
            await sendPaymentNotifications(adminClient, [payment.tenant_id], {
                title: "Payment Receipt Confirmed",
                message: `Your landlord recorded a payment of ₱${amount.toLocaleString()} (Receipt #${receipt.receipt_number}).`,
                type: "payment",
                data: {
                    paymentId: payment.id,
                    receiptNumber: receipt.receipt_number,
                    amount,
                },
            });
        } catch (notifError) {
            console.error("[Collect Payment API] Tenant notification error:", notifError);
        }

        return NextResponse.json({
            ok: true,
            invoice: updatedPayment,
            receiptNumber: receipt.receipt_number,
            isFullyPaid: isFull,
            balanceRemaining: newBalanceRemaining,
        });
    } catch (error) {
        console.error("[Collect Payment API] Unexpected error:", error);
        return NextResponse.json({ error: "Failed to record payment." }, { status: 500 });
    }
}
