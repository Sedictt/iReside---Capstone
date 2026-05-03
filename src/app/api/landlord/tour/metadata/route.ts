import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureLandlordProductTourState } from "@/lib/landlord-product-tour";

export async function PATCH(request: Request) {
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
        const metadataUpdates = await request.json();
        const state = await ensureLandlordProductTourState(adminClient as any, user.id);

        const { data, error } = await adminClient
            .from("landlord_product_tour_states" as any)
            .update({
                metadata: {
                    ...state.metadata,
                    ...metadataUpdates,
                },
                updated_at: new Date().toISOString(),
            })
            .eq("landlord_id", user.id)
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
