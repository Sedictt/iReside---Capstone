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

async function syncMoveInPaymentChecklist(supabase: Awaited<ReturnType<typeof createClient>>, leaseId: string) {
    const requiredDescriptions = new Set(["Advance Rent - First Month", "Security Deposit"]);
    const { data: leasePayments, error: paymentsError } = await supabase
        .from("payments")
        .select("description, status, landlord_confirmed")
        .eq("lease_id", leaseId);

    if (paymentsError) throw paymentsError;

    const requiredPayments = (leasePayments ?? []).filter((payment) =>
        requiredDescriptions.has(String(payment.description ?? ""))
    );

    const moveInPaymentComplete =
        requiredPayments.length === requiredDescriptions.size &&
        requiredPayments.every(
            (payment) => payment.status === "completed" && payment.landlord_confirmed === true
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
        })
    );
}

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
            .select(
                "id, lease_id, amount, paid_amount, balance_remaining, tenant_id, landlord_id, allow_partial_payments, receipt_number"
            )
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

        if (payment.lease_id) {
            await syncMoveInPaymentChecklist(supabase, payment.lease_id);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Failed to review invoice:", error);
        return NextResponse.json({ error: "Failed to update invoice." }, { status: 500 });
    }
}
