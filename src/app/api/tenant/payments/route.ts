import { NextResponse } from "next/server";

import { expireInPersonIntents } from "@/lib/billing/workflow";
import { getTenantPaymentOverview } from "@/lib/billing/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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
        await expireInPersonIntents(adminClient, user.id, { tenantId: user.id });
        const overview = await getTenantPaymentOverview(supabase, user.id);
        
        // Compute upcoming months forecast
        const now = new Date();
        const monthlyRent = overview.lease?.monthlyRent ?? 0;
        const upcomingMonths = [];
        
        // Get existing invoices for upcoming months
        const { data: existingPayments } = await supabase
            .from("payments")
            .select("id, amount, due_date, billing_cycle, status, metadata")
            .eq("tenant_id", user.id)
            .in("status", ["pending", "processing"])
            .order("billing_cycle", { ascending: true })
            .limit(3);
        
        const existingMap = new Map();
        for (const p of (existingPayments ?? [])) {
            if (p.billing_cycle) existingMap.set(p.billing_cycle, p);
        }
        
        for (let i = 1; i <= 3; i++) {
            const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const monthKey = targetDate.toISOString().slice(0, 7);
            const cycleKey = `${monthKey}-01`;
            
            const existing = existingMap.get(cycleKey);
            const metadata = existing?.metadata as Record<string, unknown> | null;
            const isForecast = metadata?.is_forecast === true;
            
            upcomingMonths.push({
                month: monthKey,
                monthLabel: targetDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
                amount: existing ? Number(existing.amount ?? 0) : monthlyRent,
                dueDate: existing?.due_date ?? `${cycleKey}-05`,
                invoiceId: existing?.id ?? null,
                isForecast: !existing || isForecast,
                status: existing?.status ?? null,
            });
        }
        
        return NextResponse.json({ ...overview, upcomingMonths });
    } catch (error) {
        console.error("Error fetching tenant payments:", error);
        return NextResponse.json({ error: "Failed to load payments." }, { status: 500 });
    }
}
