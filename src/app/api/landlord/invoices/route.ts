import { NextResponse } from "next/server";
import { z } from "zod";

import { expireInPersonIntents } from "@/lib/billing/workflow";
import { generateMonthlyInvoices, listLandlordInvoices } from "@/lib/billing/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";

const generateSchema = z.object({
    billingMonth: z.string().optional(),
    leaseIds: z.array(z.string().trim().min(1)).optional(),
});

export async function GET(request: Request) {
    const { user } = await requireUser();
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    try {
        await expireInPersonIntents(adminClient, user.id, { landlordId: user.id });
        const invoices = await listLandlordInvoices(
            supabase,
            user.id,
            propertyId && propertyId !== "all" ? propertyId : undefined
        );
        return NextResponse.json(invoices);
    } catch (error) {
        console.error("Failed to load landlord invoices:", error);
        return NextResponse.json({ error: "Failed to load invoices." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { user } = await requireUser();
    const supabase = await createClient();

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
        const leaseIds = billingParams.leaseIds?.map((id) => id.trim()).filter((id) => id.length > 0);
        const generationResult = await generateMonthlyInvoices(supabase, user.id, billingParams.billingMonth, leaseIds);

        return NextResponse.json(generationResult);
    } catch (error) {
        console.error("Failed to generate landlord invoices:", error);
        return NextResponse.json({ error: "Failed to generate invoices." }, { status: 500 });
    }
}
