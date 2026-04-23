import { NextResponse } from "next/server";

import { expireInPersonIntents } from "@/lib/billing/workflow";
import { getTenantPaymentOverview } from "@/lib/billing/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
        await expireInPersonIntents(adminClient, user.id, { tenantId: user.id });
        const overview = await getTenantPaymentOverview(supabase, user.id);
        return NextResponse.json(overview);
    } catch (error) {
        console.error("Error fetching tenant payments:", error);
        return NextResponse.json({ error: "Failed to load payments." }, { status: 500 });
    }
}
