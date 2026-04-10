import { NextResponse } from "next/server";

import { getTenantPaymentOverview } from "@/lib/billing/server";
import { createClient } from "@/lib/supabase/server";

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
        const overview = await getTenantPaymentOverview(supabase, user.id);
        return NextResponse.json(overview);
    } catch (error) {
        console.error("Error fetching tenant payments:", error);
        return NextResponse.json({ error: "Failed to load payments." }, { status: 500 });
    }
}
