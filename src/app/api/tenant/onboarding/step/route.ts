import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    completeTenantOnboardingStep,
    getFirstIncompleteOnboardingStep,
    isGuidedTenantOnboardingEnabled,
    ONBOARDING_STEPS,
    type OnboardingStep,
} from "@/lib/onboarding";

const stepSchema = z.object({
    step: z.enum(ONBOARDING_STEPS),
    data: z.record(z.string(), z.unknown()).optional(),
});

const profilePayloadSchema = z.object({
    full_name: z.string().trim().min(2).max(120),
    phone: z
        .string()
        .trim()
        .min(7)
        .max(24)
        .regex(/^[+0-9()\-\s]+$/, "Phone format is invalid."),
});

const leaseAckPayloadSchema = z.object({
    acknowledged: z.literal(true),
});

const paymentReadinessPayloadSchema = z.object({
    ready: z.literal(true),
    preferred_method: z.string().trim().min(1).max(64).optional(),
});

const supportHandoffPayloadSchema = z.object({
    confirmed: z.literal(true),
});

const validateStepPayload = (step: OnboardingStep, data: Record<string, unknown> | undefined) => {
    const payload = data ?? {};

    switch (step) {
        case "profile":
            return profilePayloadSchema.safeParse(payload);
        case "lease_acknowledged":
            return leaseAckPayloadSchema.safeParse(payload);
        case "payment_readiness":
            return paymentReadinessPayloadSchema.safeParse(payload);
        case "support_handoff":
            return supportHandoffPayloadSchema.safeParse(payload);
        default:
            return { success: false as const, error: null };
    }
};

const updateProfileFromOnboarding = async (
    supabase: any,
    userId: string,
    payload: { full_name: string; phone: string }
) => {
    const { error } = await supabase
        .from("profiles")
        .update({
            full_name: payload.full_name,
            phone: payload.phone,
        })
        .eq("id", userId);

    if (error) {
        throw new Error(`Failed to update profile from onboarding: ${error.message}`);
    }
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

    const parsedBody = stepSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsedBody.success) {
        return NextResponse.json(
            {
                error: "Invalid onboarding step request.",
                issues: parsedBody.error.flatten(),
            },
            { status: 400 }
        );
    }

    const { step, data } = parsedBody.data;
    const payloadCheck = validateStepPayload(step, data);
    if (!payloadCheck.success) {
        return NextResponse.json(
            {
                error: "Invalid onboarding step payload.",
                issues: payloadCheck.error?.flatten?.() ?? null,
            },
            { status: 400 }
        );
    }

    try {
        if (step === "profile") {
            await updateProfileFromOnboarding(supabase as any, user.id, payloadCheck.data);
        }

        const result = await completeTenantOnboardingStep(adminClient as any, {
            tenantId: user.id,
            step,
            actorId: user.id,
            stepData: payloadCheck.data,
        });
        const nextStep = getFirstIncompleteOnboardingStep(result.state.steps);

        return NextResponse.json({
            success: true,
            state: result.state,
            nextStep,
            completed: result.state.status === "completed",
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update onboarding step.";
        const status = typeof (error as any)?.status === "number" ? (error as any).status : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
