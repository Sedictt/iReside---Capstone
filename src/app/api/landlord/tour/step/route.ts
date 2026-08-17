import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    LANDLORD_PRODUCT_TOUR_STEPS,
    progressLandlordProductTourStep,
} from "@/lib/landlord-product-tour";

const stepSchema = z.object({
    stepId: z.string(),
    route: z.string().optional(),
    anchorId: z.string().optional().nullable(),
    anchorFound: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;
    const adminClient = createAdminClient();

    try {
        const body = await request.json();
        const { stepId, route, anchorId, anchorFound, metadata } = stepSchema.parse(body);

        const result = await progressLandlordProductTourStep(adminClient as any, {
            landlordId: userId,
            stepId: stepId as any,
            triggerSource: "step_progression",
            route,
            anchorId,
            anchorFound,
            metadata: metadata as Record<string, unknown>,
        });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid request body", details: error.issues }, { status: 400 });
        }
        if ((error as any).status === 409) {
            return NextResponse.json(
                {
                    error: (error as any).message,
                    requiredStepId: (error as any).requiredStep,
                },
                { status: 409 }
            );
        }
        const message = error instanceof Error ? error.message : "Failed to progress tour step.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
