import { NextResponse } from "next/server";
import { z } from "zod";

import { upsertPaymentReceipt } from "@/lib/billing/server";
import { createClient } from "@/lib/supabase/server";

const reviewSchema = z.object({
    decision: z.enum(["confirm", "reject", "needs_correction"]),
    note: z.string().max(600).optional(),
    acceptedAmount: z.number().positive().optional(),
});

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = reviewSchema.parse(await request.json());
        const { data: payment, error: paymentError } = await supabase
            .from("payments")
            .select("id, amount, paid_amount, balance_remaining, tenant_id, landlord_id, allow_partial_payments, receipt_number")
            .eq("id", id)
            .eq("landlord_id", user.id)
            .single();

        if (paymentError || !payment) {
            return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
        }

        if (body.decision === "confirm") {
            const acceptedAmount = body.acceptedAmount ?? Number(payment.paid_amount || payment.amount);
            if (!payment.allow_partial_payments && acceptedAmount < Number(payment.amount)) {
                return NextResponse.json({ error: "Partial confirmation is not allowed for this invoice." }, { status: 400 });
            }

            const balanceRemaining = Math.max(0, Number(payment.amount) - acceptedAmount);
            const nextStatus = balanceRemaining <= 0 ? "completed" : "pending";

            const { error: updateError } = await supabase
                .from("payments")
                .update({
                    landlord_confirmed: true,
                    status: nextStatus,
                    paid_at: new Date().toISOString(),
                    paid_amount: acceptedAmount,
                    balance_remaining: balanceRemaining,
                    payment_note: body.note ?? null,
                })
                .eq("id", id);

            if (updateError) throw updateError;

            await upsertPaymentReceipt(
                supabase,
                {
                    id: payment.id,
                    landlord_id: payment.landlord_id,
                    tenant_id: payment.tenant_id,
                    paid_amount: acceptedAmount,
                    amount: payment.amount,
                    receipt_number: payment.receipt_number,
                },
                user.id,
                body.note,
            );
        } else {
            const { error: rejectError } = await supabase
                .from("payments")
                .update({
                    landlord_confirmed: false,
                    status: body.decision === "reject" ? "failed" : "pending",
                    payment_note: body.note ?? null,
                })
                .eq("id", id);

            if (rejectError) throw rejectError;
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Failed to review invoice:", error);
        return NextResponse.json({ error: "Failed to update invoice." }, { status: 500 });
    }
}
