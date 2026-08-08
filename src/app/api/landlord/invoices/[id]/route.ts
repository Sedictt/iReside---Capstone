import { NextResponse } from "next/server";

import { expireInPersonIntents } from "@/lib/billing/workflow";
import { getInvoiceDetailForActor } from "@/lib/billing/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
    const { id } = await context.params;
    const adminClient = createAdminClient();
    const authContext = await requireAuthenticatedUser(_);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    try {
        await expireInPersonIntents(adminClient, userId, { landlordId: userId, paymentId: id });
        const invoice = await getInvoiceDetailForActor(supabase, id, { landlordId: userId });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
        }

        return NextResponse.json({ invoice });
    } catch (error) {
        console.error("Failed to load landlord invoice:", error);
        return NextResponse.json({ error: "Failed to load invoice." }, { status: 500 });
    }
}
