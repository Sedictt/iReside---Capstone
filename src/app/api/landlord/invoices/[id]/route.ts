import { NextResponse } from "next/server";

import { getInvoiceDetailForActor } from "@/lib/billing/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const invoice = await getInvoiceDetailForActor(supabase, id, { landlordId: user.id });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
        }

        return NextResponse.json({ invoice });
    } catch (error) {
        console.error("Failed to load landlord invoice:", error);
        return NextResponse.json({ error: "Failed to load invoice." }, { status: 500 });
    }
}
