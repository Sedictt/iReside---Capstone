import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { replayLandlordProductTour } from "@/lib/landlord-product-tour";

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;
    const adminClient = createAdminClient();

    try {
        const state = await replayLandlordProductTour(adminClient as any, {
            landlordId: userId,
            triggerSource: "replay",
        });

        return NextResponse.json({ success: true, state });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to replay product tour.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
