import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const [
            { data: nextPayments, error: nextPaymentError },
            { data: historyRows, error: historyError }
        ] = await Promise.all([
            // Fetch the next pending/processing payment with its items
            supabase
                .from("payments")
                .select(`
                    id,
                    amount,
                    status,
                    method,
                    description,
                    due_date,
                    payment_items (
                        id,
                        label,
                        amount,
                        category
                    ),
                    lease:leases (
                        unit:units (
                            name
                        )
                    )
                `)
                .eq("tenant_id", user.id)
                .in("status", ["pending", "processing"])
                .order("due_date", { ascending: true })
                .limit(1),
            
            // Fetch recent payment history
            supabase
                .from("payments")
                .select(`
                    id,
                    amount,
                    status,
                    method,
                    description,
                    due_date,
                    paid_at,
                    reference_number
                `)
                .eq("tenant_id", user.id)
                .not("status", "in", '("pending","processing")')
                .order("due_date", { ascending: false })
                .limit(10)
        ]);

        if (nextPaymentError) throw nextPaymentError;
        if (historyError) throw historyError;

        return NextResponse.json({
            nextPayment: nextPayments?.[0] || null,
            history: historyRows || []
        });
    } catch (e: any) {
        console.error("Error fetching payments:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
