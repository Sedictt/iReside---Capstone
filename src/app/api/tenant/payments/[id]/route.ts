import { NextResponse } from "next/server";

import { expireInPersonIntents } from "@/lib/billing/workflow";
import { getInvoiceDetailForActor } from "@/lib/billing/server";
import { requireUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
    const { id } = await context.params;
    const { user, supabase } = await requireUser();
    const adminClient = createAdminClient();

    try {
        // Parallelize: expireInPersonIntents and getInvoiceDetailForActor are independent
        const [_, invoice] = await Promise.all([
            expireInPersonIntents(adminClient, user.id, { tenantId: user.id, paymentId: id }),
            getInvoiceDetailForActor(supabase, id, { tenantId: user.id }),
        ]);

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
        }

        return NextResponse.json({ invoice });
    } catch (error) {
        console.error("Failed to load tenant invoice:", error);
        return NextResponse.json({ error: "Failed to load invoice." }, { status: 500 });
    }
}
