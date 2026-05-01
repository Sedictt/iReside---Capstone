import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
    const authHeader = request.headers.get("authorization");

    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    const { searchParams } = new URL(request.url);
    const targetMonth = searchParams.get("month");

    const now = targetMonth 
        ? new Date(targetMonth + "-01") 
        : new Date();
    
    const billingMonth = now.toISOString().slice(0, 7);

    try {
        const { data: landlords, error: landlordError } = await adminClient
            .from("profiles")
            .select("id")
            .eq("role", "landlord");

        if (landlordError) throw landlordError;

        if (!landlords || landlords.length === 0) {
            return NextResponse.json({ 
                message: "No landlords found",
                invoicesCreated: 0 
            });
        }

        const results = await Promise.all(
            landlords.map(async (landlord) => {
                const { generateMonthlyInvoices } = await import("@/lib/billing/server");
                return generateMonthlyInvoices(
                    adminClient,
                    landlord.id,
                    billingMonth
                );
            })
        );

        const totalCreated = results.reduce((sum, r) => sum + r.created, 0);
        const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);

        return NextResponse.json({
            success: true,
            billingMonth,
            invoicesCreated: totalCreated,
            invoicesSkipped: totalSkipped,
            landlordCount: landlords.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Monthly invoices cron error:", error);
        return NextResponse.json(
            { error: "Failed to generate monthly invoices" },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: "Use POST to trigger monthly invoice generation",
        optionalParams: { month: "YYYY-MM format, defaults to current month" },
        note: "Configure CRON_SECRET in environment for secure cron calls"
    });
}