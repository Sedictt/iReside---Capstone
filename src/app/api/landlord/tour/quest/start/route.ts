import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    LANDLORD_QUESTS,
    LANDLORD_PRODUCT_TOUR_STEPS,
    ensureLandlordProductTourState,
    type LandlordQuestId,
    type LandlordProductTourDbRow,
} from "@/lib/landlord-product-tour";

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;
    const adminClient = createAdminClient();

    try {
        const { questId } = (await request.json()) as { questId: LandlordQuestId };
        const quest = LANDLORD_QUESTS.find((q) => q.id === questId);

        if (!quest) {
            return NextResponse.json({ error: "Invalid quest ID" }, { status: 400 });
        }

        const firstStepId = quest.stepIds[0];
        const stepIndex = LANDLORD_PRODUCT_TOUR_STEPS.findIndex((s) => s.id === firstStepId);

        if (stepIndex === -1) {
            return NextResponse.json({ error: "Quest step not found" }, { status: 500 });
        }

        // Update the tour state to point to the first step of the quest
        const { data, error } = await adminClient
            .from("landlord_product_tour_states" as any)
            .update({
                current_step_index: stepIndex,
                status: "in_progress",
                last_event_at: new Date().toISOString(),
            })
            .eq("landlord_id", userId)
            .select("*")
            .single();

        if (error) {
            throw new Error(`Failed to update tour state: ${error.message}`);
        }

        return NextResponse.json({
            success: true,
            state: data,
            firstStep: LANDLORD_PRODUCT_TOUR_STEPS[stepIndex],
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to start quest.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
