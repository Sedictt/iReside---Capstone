import { NextResponse } from "next/server";
import { z } from "zod";

import { expireInPersonIntents } from "@/lib/billing/workflow";
import { generateMonthlyInvoices, listLandlordInvoices } from "@/lib/billing/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const generateSchema = z.object({
    billingMonth: z.string().optional(),
    leaseIds: z.array(z.string().trim().min(1)).optional(),
});

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
        await expireInPersonIntents(adminClient, user.id, { landlordId: user.id });
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
        const payload = await request.json();
        const parsed = generateSchema.safeParse(payload);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid invoice generation payload.", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const body = parsed.data;
        const leaseIds = body.leaseIds?.map((id) => id.trim()).filter((id) => id.length > 0);
        const result = await generateMonthlyInvoices(supabase, user.id, body.billingMonth, leaseIds);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Failed to generate landlord invoices:", error);
        return NextResponse.json({ error: "Failed to generate invoices." }, { status: 500 });
    }
}
