import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isAuthorizedCronRequest(authHeader: string | null): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
        // Fail closed in production: without a secret anyone could trigger billing for every landlord.
        return process.env.NODE_ENV !== "production";
    }
    const expected = Buffer.from(`Bearer ${secret}`);
    const provided = Buffer.from(authHeader ?? "");
    return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function POST(request: Request) {
    const authHeader = request.headers.get("authorization");

    if (!isAuthorizedCronRequest(authHeader)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetMonth = searchParams.get("month");

    // YYYY-MM with a real month; anything else used to throw on toISOString() (500).
    if (targetMonth !== null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(targetMonth)) {
        return NextResponse.json({ error: "month must be in YYYY-MM format." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const billingMonth = targetMonth ?? new Date().toISOString().slice(0, 7);

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