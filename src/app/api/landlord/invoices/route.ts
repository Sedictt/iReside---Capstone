import { NextResponse } from "next/server";
import { z } from "zod";

import { generateMonthlyInvoices, listLandlordInvoices } from "@/lib/billing/server";
import { createClient } from "@/lib/supabase/server";

const generateSchema = z.object({
    billingMonth: z.string().optional(),
    leaseIds: z.array(z.string().uuid()).optional(),
});

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const payload = await listLandlordInvoices(supabase, user.id);
        return NextResponse.json(payload);
    } catch (error) {
        console.error("Failed to load landlord invoices:", error);
        return NextResponse.json({ error: "Failed to load invoices." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = generateSchema.parse(await request.json());
        const result = await generateMonthlyInvoices(supabase, user.id, body.billingMonth, body.leaseIds);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Failed to generate landlord invoices:", error);
        return NextResponse.json({ error: "Failed to generate invoices." }, { status: 500 });
    }
}
