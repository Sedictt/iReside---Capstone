import { NextResponse } from "next/server";
import { z } from "zod";
import {
    TENANT_PRODUCT_TOUR_STEPS,
    isGuidedTenantProductTourEnabled,
    progressTenantProductTourStep,
} from "@/lib/product-tour";
import { resolveTenantTourContext } from "../helpers";

const stepSchema = z.object({
    stepId: z.enum(TENANT_PRODUCT_TOUR_STEPS.map((step) => step.id) as [string, ...string[]]),
    route: z.string().trim().min(1).max(200).optional(),
    anchorId: z.string().trim().min(1).max(120).optional(),
    anchorFound: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
    if (!isGuidedTenantProductTourEnabled()) {
        return NextResponse.json({ error: "Guided tenant product tour is disabled." }, { status: 403 });
    }

    const auth = await resolveTenantTourContext();
    if (auth.error || !auth.context) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = stepSchema.safeParse(await request.json().catch(() => ({})));
    if (!body.success) {
        return NextResponse.json(
            {
                error: "Invalid tour step payload.",
                issues: body.error.flatten(),
            },
            { status: 400 }
        );
    }

    try {
        const result = await progressTenantProductTourStep(auth.context.adminClient as any, {
            tenantId: auth.context.user.id,
            stepId: body.data.stepId as any,
            triggerSource: body.data.anchorFound === false ? "fallback" : "step_progression",
            route: body.data.route ?? null,
            anchorId: body.data.anchorId ?? null,
            anchorFound: body.data.anchorFound,
            metadata: body.data.metadata,
        });

        return NextResponse.json({
            success: true,
            state: result.state,
            completed: result.completed,
            requiredStep: result.requiredStep,
            nextStep: result.nextStep,
        });
    } catch (error) {
        const status = typeof (error as any)?.status === "number" ? (error as any).status : 500;
        const message = error instanceof Error ? error.message : "Failed to progress product tour step.";
        const requiredStepId = (error as any)?.requiredStep;

        if (status === 409) {
            const requiredStep = TENANT_PRODUCT_TOUR_STEPS.find((step) => step.id === requiredStepId) ?? null;
            return NextResponse.json(
                {
                    error: message,
                    requiredStep,
                },
                { status: 409 }
            );
        }

        return NextResponse.json({ error: message }, { status });
    }
}
