import { NextResponse } from "next/server";
import { z } from "zod";

import { expireInPersonIntents } from "@/lib/billing/workflow";
import { generateMonthlyInvoices, listLandlordInvoices } from "@/lib/billing/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";

import { 
    getMonthStart, 
    getMonthEnd, 
    toIsoDate, 
    formatDateLong, 
    formatPhpCurrency, 
    makeInvoiceNumber, 
    parseLeaseBillingTerms 
} from "@/lib/billing/utils";

const generateSchema = z.object({
    billingMonth: z.string().optional(),
    leaseIds: z.array(z.string().trim().min(1)).optional(),
    leaseId: z.string().trim().min(1).optional(),
    dueDate: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(
        z.object({
            label: z.string().trim().min(1),
            amount: z.number().nonnegative(),
            category: z.string().default("rent"),
        })
    ).optional(),
});

export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;
    const adminClient = createServiceRoleSupabaseClient();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    try {
        await expireInPersonIntents(adminClient, userId, { landlordId: userId });
        const invoices = await listLandlordInvoices(
            supabase,
            userId,
            propertyId && propertyId !== "all" ? propertyId : undefined
        );
        return NextResponse.json(invoices);
    } catch (error) {
        console.error("Failed to load landlord invoices:", error);
        return NextResponse.json({ error: "Failed to load invoices." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    try {
        const rawJson = await request.json();
        const parsed = generateSchema.safeParse(rawJson);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid invoice generation payload.", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const billingParams = parsed.data;
        const targetLeaseId = billingParams.leaseId || (billingParams.leaseIds && billingParams.leaseIds.length === 1 ? billingParams.leaseIds[0] : null);

        // If specific items are provided for a single lease, create an itemized custom invoice
        if (targetLeaseId && billingParams.items && billingParams.items.length > 0) {
            const { data: lease, error: leaseErr } = await supabase
                .from("leases")
                .select(`
                    id,
                    unit_id,
                    tenant_id,
                    landlord_id,
                    monthly_rent,
                    terms,
                    status,
                    unit:units (
                        id,
                        property_id,
                        name,
                        rent_amount
                    ),
                    tenant:profiles!leases_tenant_id_fkey (
                        id,
                        full_name,
                        phone,
                        email
                    )
                `)
                .eq("id", targetLeaseId)
                .eq("landlord_id", userId)
                .single();

            if (leaseErr || !lease) {
                return NextResponse.json({ error: "Active lease not found or unauthorized." }, { status: 404 });
            }

            const cycleStart = getMonthStart(billingParams.billingMonth);
            const cycleEnd = getMonthEnd(billingParams.billingMonth);
            const cycleKey = toIsoDate(cycleStart);
            const terms = parseLeaseBillingTerms((lease as any).terms ?? null);

            const defaultDueDate = new Date(cycleStart.getFullYear(), cycleStart.getMonth(), Math.max(1, Math.min(terms.dueDay || 5, 28)));
            const dueDateIso = billingParams.dueDate ? toIsoDate(new Date(billingParams.dueDate)) : toIsoDate(defaultDueDate);

            const subtotal = billingParams.items.reduce((sum, it) => sum + Number(it.amount || 0), 0);
            const totalAmount = subtotal;

            const invoiceNum = makeInvoiceNumber(crypto.randomUUID(), cycleKey);

            const { data: paymentRow, error: paymentError } = await supabase
                .from("payments")
                .insert({
                    lease_id: lease.id,
                    tenant_id: lease.tenant_id,
                    landlord_id: userId,
                    amount: totalAmount,
                    subtotal,
                    paid_amount: 0,
                    balance_remaining: totalAmount,
                    status: "pending",
                    description: billingParams.notes?.trim() || `${formatDateLong(cycleKey)} monthly invoice`,
                    due_date: dueDateIso,
                    billing_cycle: cycleKey,
                    invoice_period_start: toIsoDate(cycleStart),
                    invoice_period_end: toIsoDate(cycleEnd),
                    allow_partial_payments: terms.allowPartialPayments,
                    due_day_snapshot: terms.dueDay,
                    late_fee_amount: terms.lateFeeAmount,
                    invoice_number: invoiceNum,
                })
                .select("id, invoice_number")
                .single();

            if (paymentError) {
                console.error("Failed to insert payment record:", paymentError);
                throw paymentError;
            }

            const itemInsertRows = billingParams.items.map((it, idx) => ({
                payment_id: paymentRow.id,
                label: it.label,
                amount: it.amount,
                category: it.category,
                sort_order: idx * 10,
                metadata: {},
            }));

            const { error: itemError } = await supabase.from("payment_items").insert(itemInsertRows);
            if (itemError) {
                console.error("Failed to insert payment items:", itemError);
                throw itemError;
            }

            // Create notification for tenant so it immediately appears in their phone portal
            if (lease.tenant_id) {
                try {
                    await supabase.from("notifications").insert({
                        user_id: lease.tenant_id,
                        type: "payment",
                        title: "New Invoice Issued",
                        message: `A new invoice for ${formatPhpCurrency(totalAmount)} has been issued for ${(lease as any).unit?.name ?? "your unit"}. Due date: ${dueDateIso}.`,
                        data: { invoice_id: paymentRow.id, amount: totalAmount },
                    });
                } catch (notifErr) {
                    console.warn("Failed to notify tenant of issued invoice:", notifErr);
                }
            }

            return NextResponse.json({
                success: true,
                created: 1,
                invoiceId: paymentRow.id,
                invoiceNumber: paymentRow.invoice_number,
                billingCycle: cycleKey,
            });
        }

        const leaseIds = billingParams.leaseIds?.map((id) => id.trim()).filter((id) => id.length > 0);
        const generationResult = await generateMonthlyInvoices(supabase, userId, billingParams.billingMonth, leaseIds);

        return NextResponse.json(generationResult);
    } catch (error) {
        console.error("Failed to generate landlord invoices:", error);
        return NextResponse.json({ error: "Failed to generate invoices." }, { status: 500 });
    }
}
