import { NextResponse } from "next/server";
import { z } from "zod";
import {
    TENANT_PRODUCT_TOUR_STEPS,
    completeTenantProductTour,
    isGuidedTenantProductTourEnabled,
} from "@/lib/product-tour";
import { resolveTenantTourContext } from "../helpers";

const completeSchema = z.object({
    stepId: z
        .enum(TENANT_PRODUCT_TOUR_STEPS.map((step) => step.id) as [string, ...string[]])
        .optional(),
});

export async function POST(request: Request) {
    if (!isGuidedTenantProductTourEnabled()) {
        return NextResponse.json({ error: "Guided tenant product tour is disabled." }, { status: 403 });
    }

    const auth = await resolveTenantTourContext();
    if (auth.error || !auth.context) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = completeSchema.safeParse(await request.json().catch(() => ({})));
    if (!body.success) {
        return NextResponse.json(
            {
                error: "Invalid complete payload.",
                issues: body.error.flatten(),
            },
            { status: 400 }
        );
    }

    try {
        const state = await completeTenantProductTour(auth.context.adminClient as any, {
            tenantId: auth.context.user.id,
            triggerSource: "manual",
            stepId: (body.data.stepId as any) ?? null,
        });
        return NextResponse.json({ success: true, state });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to complete product tour.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
