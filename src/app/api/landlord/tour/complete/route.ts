import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    LANDLORD_PRODUCT_TOUR_STEPS,
    completeLandlordProductTour,
} from "@/lib/landlord-product-tour";

const completeSchema = z.object({
    stepId: z.string().optional().nullable(),
});

export async function POST(request: Request) {
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
        const body = await request.json();
        const { stepId } = completeSchema.parse(body);

        const state = await completeLandlordProductTour(adminClient as any, {
            landlordId: user.id,
            triggerSource: "manual",
            stepId: stepId as any,
        });

        return NextResponse.json({ success: true, state });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid request body", details: error.issues }, { status: 400 });
        }
        const message = error instanceof Error ? error.message : "Failed to complete product tour.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
