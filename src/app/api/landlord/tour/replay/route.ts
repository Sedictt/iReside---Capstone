import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { replayLandlordProductTour } from "@/lib/landlord-product-tour";

export async function POST() {
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
        const state = await replayLandlordProductTour(adminClient as any, {
            landlordId: user.id,
            triggerSource: "replay",
        });

        return NextResponse.json({ success: true, state });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to replay product tour.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
