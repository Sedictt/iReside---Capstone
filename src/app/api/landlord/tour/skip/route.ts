import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseJsonBody } from "@/lib/validation/server";
import {
    LANDLORD_PRODUCT_TOUR_STEPS,
    skipLandlordProductTour,
} from "@/lib/landlord-product-tour";

const skipSchema = z.object({
    stepId: z.string().trim().min(1).max(100).optional().nullable(),
    metadata: z.record(z.string().max(64), z.unknown()).refine((value) => JSON.stringify(value).length <= 16_000, "Metadata is too large.").optional(),
});

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;
    const adminClient = createAdminClient();

    const parsed = await parseJsonBody(request, skipSchema);
    if (!parsed.ok) return parsed.response;
    const { stepId, metadata } = parsed.data;

    try {

        const state = await skipLandlordProductTour(adminClient as any, {
            landlordId: userId,
            triggerSource: "manual",
            stepId: stepId as any,
            metadata: metadata as Record<string, unknown>,
        });

        return NextResponse.json({ success: true, state });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid request body", details: error.issues }, { status: 400 });
        }
        const message = error instanceof Error ? error.message : "Failed to skip product tour.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
