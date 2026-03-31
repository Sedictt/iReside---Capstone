import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    areAllOnboardingStepsComplete,
    ensureTenantOnboardingState,
    finalizeTenantOnboarding,
    getFirstIncompleteOnboardingStep,
    isGuidedTenantOnboardingEnabled,
} from "@/lib/onboarding";
import {
    TENANT_PRODUCT_TOUR_ROUTE,
    isGuidedTenantProductTourEnabled,
    resolveTenantProductTourEligibility,
} from "@/lib/product-tour";

const completeSchema = z.object({
    next: z.string().optional(),
});

const resolveSafeNextPath = (value: string | undefined) => {
    if (!value || typeof value !== "string") {
        return null;
    }

    if (!value.startsWith("/")) {
        return null;
    }

    if (!value.startsWith("/tenant/")) {
        return null;
    }

    if (value.startsWith("/tenant/onboarding")) {
        return null;
    }

    return value;
};

const resolveCompletionDestination = async (
    adminClient: any,
    tenantId: string,
    safeNextPath: string | null
) => {
    if (safeNextPath) {
        return safeNextPath;
    }

    if (isGuidedTenantProductTourEnabled()) {
        const eligibility = await resolveTenantProductTourEligibility(adminClient, {
            tenantId,
            role: "tenant",
            onboardingCompleted: true,
        });
        if (eligibility.eligible) {
            return `${TENANT_PRODUCT_TOUR_ROUTE}?source=onboarding_handoff`;
        }
    }

    return "/tenant/dashboard";
};

export async function POST(request: Request) {
    if (!isGuidedTenantOnboardingEnabled()) {
        return NextResponse.json({ error: "Guided onboarding is disabled." }, { status: 403 });
    }

    const supabase = await createClient();
    const adminClient = createAdminClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = completeSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid completion request." }, { status: 400 });
    }

    try {
        const state = await ensureTenantOnboardingState(adminClient as any, user.id);
        const allRequiredComplete = areAllOnboardingStepsComplete(state.steps);
        if (!allRequiredComplete) {
            const requiredStep = getFirstIncompleteOnboardingStep(state.steps);
            return NextResponse.json(
                {
                    error: "Required onboarding steps are incomplete.",
                    requiredStep,
                    state,
                },
                { status: 409 }
            );
        }

        const completedState =
            state.status === "completed"
                ? state
                : await finalizeTenantOnboarding(adminClient as any, user.id, user.id);

        const safeNextPath = resolveSafeNextPath(parsed.data.next);
        const redirectTo = await resolveCompletionDestination(adminClient as any, user.id, safeNextPath);

        return NextResponse.json({
            success: true,
            state: completedState,
            redirectTo,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to complete onboarding.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
