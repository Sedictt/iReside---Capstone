import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureLandlordProductTourState } from "@/lib/landlord-product-tour";
import { z } from "zod";
import { parseJsonBody } from "@/lib/validation/server";

/** Only the quest-board display preferences are client-writable; progress keys (completed steps, setup deferrals) are not. */
const metadataPatchSchema = z
    .object({
        show_completed_quests: z.boolean().optional(),
        quest_board_hidden: z.boolean().optional(),
    })
    .strict();

export async function PATCH(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const adminClient = createAdminClient();

    const parsed = await parseJsonBody(request, metadataPatchSchema);
    if (!parsed.ok) return parsed.response;
    const metadataUpdates = parsed.data;

    try {
        const state = await ensureLandlordProductTourState(adminClient as any, userId);

        const { data, error } = await adminClient
            .from("landlord_product_tour_states" as any)
            .update({
                metadata: {
                    ...state.metadata,
                    ...metadataUpdates,
                },
                updated_at: new Date().toISOString(),
            })
            .eq("landlord_id", userId)
            .select("*")
            .single();

        if (error) {
            throw new Error(`Failed to update tour metadata: ${error.message}`);
        }

        return NextResponse.json({ success: true, state: data });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update tour metadata.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
