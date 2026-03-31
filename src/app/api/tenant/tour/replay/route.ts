import { NextResponse } from "next/server";
import {
    getTenantProductTourRequiredStep,
    isGuidedTenantProductTourEnabled,
    replayTenantProductTour,
} from "@/lib/product-tour";
import { resolveTenantTourContext } from "../helpers";

export async function POST() {
    if (!isGuidedTenantProductTourEnabled()) {
        return NextResponse.json({ error: "Guided tenant product tour is disabled." }, { status: 403 });
    }

    const auth = await resolveTenantTourContext();
    if (auth.error || !auth.context) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        const state = await replayTenantProductTour(auth.context.adminClient as any, {
            tenantId: auth.context.user.id,
            triggerSource: "replay",
        });

        return NextResponse.json({
            success: true,
            state,
            requiredStep: getTenantProductTourRequiredStep(state),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to replay product tour.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
