import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    TENANT_PRODUCT_TOUR_STEPS,
    getTenantProductTourRequiredStep,
    isGuidedTenantProductTourEnabled,
    resolveTenantProductTourEligibility,
    startTenantProductTour,
    type TenantProductTourTriggerSource,
} from "@/lib/product-tour";

const parseBoolean = (value: string | null, defaultValue: boolean) => {
    if (value === null) return defaultValue;
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
    return defaultValue;
};

const resolveTriggerSource = (value: string | null): TenantProductTourTriggerSource => {
    if (value === "onboarding_handoff") return "onboarding_handoff";
    if (value === "auto_portal_entry") return "auto_portal_entry";
    if (value === "resume") return "resume";
    if (value === "replay") return "replay";
    return "manual";
};

const resolveRole = async (supabase: any, user: any) => {
    const metadataRole = user?.user_metadata?.role;
    if (typeof metadataRole === "string" && metadataRole.length > 0) {
        return metadataRole;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return profile?.role ?? "tenant";
};

const resolveOnboardingCompleted = async (adminClient: any, tenantId: string) => {
    const { data } = await adminClient
        .from("tenant_product_tour_states")
        .select("status")
        .eq("tenant_id", tenantId)
        .maybeSingle();
    return data?.status === "completed";
};

export async function GET(request: Request) {
    if (!isGuidedTenantProductTourEnabled()) {
        return NextResponse.json({
            enabled: false,
            eligible: false,
            state: null,
            requiredStep: null,
            steps: TENANT_PRODUCT_TOUR_STEPS,
        });
    }

    const { user, supabase } = await requireUser();
    const adminClient = createAdminClient();

    const role = await resolveRole(supabase as any, user);
    if (role !== "tenant") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const shouldStart = parseBoolean(url.searchParams.get("start"), true);
    const triggerSource = resolveTriggerSource(url.searchParams.get("source"));
    const onboardingCompleted = await resolveOnboardingCompleted(adminClient as any, user.id);

    try {
        const eligibility = await resolveTenantProductTourEligibility(adminClient as any, {
            tenantId: user.id,
            role,
            onboardingCompleted,
        });

        if (!eligibility.eligible) {
            return NextResponse.json({
                enabled: true,
                eligible: false,
                reason: eligibility.reason,
                suppressUntil: eligibility.suppressUntil,
                state: eligibility.state,
                requiredStep: eligibility.state ? getTenantProductTourRequiredStep(eligibility.state) : null,
                steps: TENANT_PRODUCT_TOUR_STEPS,
            });
        }

        const started = shouldStart
            ? await startTenantProductTour(adminClient as any, {
                  tenantId: user.id,
                  triggerSource,
                  route: url.searchParams.get("route"),
                  anchorId: url.searchParams.get("anchorId"),
              })
            : null;
        const state = started?.state ?? eligibility.state;

        return NextResponse.json({
            enabled: true,
            eligible: true,
            reason: eligibility.reason,
            state,
            started: started?.started ?? false,
            requiredStep: state ? getTenantProductTourRequiredStep(state) : null,
            steps: TENANT_PRODUCT_TOUR_STEPS,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load product tour state.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
