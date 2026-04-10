import { NextResponse } from "next/server";

import { BILLING_BUCKETS, uploadBillingFile } from "@/lib/billing/storage";
import { createClient } from "@/lib/supabase/server";

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
        const formData = await request.formData();
        const method = formData.get("method");
        const referenceNumber = formData.get("referenceNumber");
        const note = formData.get("note");
        const partialAmountRaw = formData.get("partialAmount");
        const file = formData.get("receipt");

        const { data: payment, error: paymentError } = await supabase
            .from("payments")
            .select("id, tenant_id, amount, paid_amount, balance_remaining, allow_partial_payments")
            .eq("id", id)
            .eq("tenant_id", user.id)
            .single();

        if (paymentError || !payment) {
            return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
        }

        const partialAmount = typeof partialAmountRaw === "string" && partialAmountRaw.trim().length > 0
            ? Number(partialAmountRaw)
            : Number(payment.balance_remaining ?? payment.amount);

        if (!Number.isFinite(partialAmount) || partialAmount <= 0) {
            return NextResponse.json({ error: "A valid payment amount is required." }, { status: 400 });
        }

        if (!payment.allow_partial_payments && partialAmount < Number(payment.balance_remaining ?? payment.amount)) {
            return NextResponse.json({ error: "Partial payments are not enabled for this invoice." }, { status: 400 });
        }

        let proofUpload: { path: string; publicUrl: string } | null = null;
        if (file instanceof File && file.size > 0) {
            proofUpload = await uploadBillingFile({
                bucketName: BILLING_BUCKETS.paymentProofs,
                ownerId: user.id,
                scope: id,
                file,
            });
        }

        const { error: updateError } = await supabase
            .from("payments")
            .update({
                method: method === "cash" ? "cash" : "gcash",
                status: "processing",
                payment_submitted_at: new Date().toISOString(),
                reference_number: typeof referenceNumber === "string" ? referenceNumber.trim() || null : null,
                payment_note: typeof note === "string" ? note.trim() || null : null,
                payment_proof_path: proofUpload?.path ?? null,
                payment_proof_url: proofUpload?.publicUrl ?? null,
                paid_amount: partialAmount,
                balance_remaining: Math.max(0, Number(payment.amount) - partialAmount),
            })
            .eq("id", payment.id);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Failed to submit tenant payment:", error);
        return NextResponse.json({ error: "Failed to submit payment." }, { status: 500 });
    }
}
