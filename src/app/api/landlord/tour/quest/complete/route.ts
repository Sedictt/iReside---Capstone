import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { parseJsonBody } from "@/lib/validation/server";
import { ensureLandlordProductTourState } from "@/lib/landlord-product-tour";
import { COMPLETED_MISSIONS_METADATA_KEY, getCompletedMissionIds, getMissionById } from "@/lib/missions-config";

/** Marks one mission as finished. Finished missions live in the tour-state metadata, so no extra table is needed. */
export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, userRole } = authContext;

    if (userRole !== "landlord") {
        return NextResponse.json({ error: "Only landlords have missions." }, { status: 403 });
    }

    const parsed = await parseJsonBody(request, z.object({ questId: z.string().trim().min(1, "Quest ID is required.").max(64) }));
    if (!parsed.ok) return parsed.response;

    const mission = getMissionById(parsed.data.questId);
    if (!mission) {
        return NextResponse.json({ error: "Invalid quest ID" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    try {
        const state = await ensureLandlordProductTourState(adminClient as any, userId);
        const completed = getCompletedMissionIds(state.metadata);

        if (completed.includes(mission.id)) {
            return NextResponse.json({ success: true, state });
        }

        const { data, error } = await adminClient
            .from("landlord_product_tour_states" as any)
            .update({
                metadata: {
                    ...state.metadata,
                    [COMPLETED_MISSIONS_METADATA_KEY]: [...completed, mission.id],
                },
                updated_at: new Date().toISOString(),
            })
            .eq("landlord_id", userId)
            .select("*")
            .single();

        if (error) {
            throw new Error(`Failed to save mission progress: ${error.message}`);
        }

        return NextResponse.json({ success: true, state: data });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to complete mission.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
