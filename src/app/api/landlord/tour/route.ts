import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    LANDLORD_PRODUCT_TOUR_STEPS,
    getLandlordProductTourRequiredStep,
    isGuidedLandlordProductTourEnabled,
    resolveLandlordProductTourEligibility,
    startLandlordProductTour,
    type LandlordProductTourTriggerSource,
} from "@/lib/landlord-product-tour";

const parseBoolean = (value: string | null, defaultValue: boolean) => {
    if (value === null) return defaultValue;
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
    return defaultValue;
};

const resolveTriggerSource = (value: string | null): LandlordProductTourTriggerSource => {
    if (value === "onboarding_handoff") return "onboarding_handoff";
    if (value === "auto_portal_entry") return "auto_portal_entry";
    if (value === "resume") return "resume";
    if (value === "replay") return "replay";
    return "manual";
};

const resolveRole = async (supabase: any, userId: string) => {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    return profile?.role ?? "landlord";
};

const resolveOnboardingCompleted = async (adminClient: any, landlordId: string) => {
    const { data } = await adminClient
        .from("landlord_applications")
        .select("onboarding_completed_at")
        .eq("profile_id", landlordId)
        .maybeSingle();
    return !!data?.onboarding_completed_at;
};

export async function GET(request: Request) {
    if (!isGuidedLandlordProductTourEnabled()) {
        return NextResponse.json({
            enabled: false,
            eligible: false,
            state: null,
            requiredStep: null,
            steps: LANDLORD_PRODUCT_TOUR_STEPS,
        });
    }

    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;
    const adminClient = createAdminClient();

    // Parallelize: resolveRole and resolveOnboardingCompleted are independent
    const [role, onboardingCompleted] = await Promise.all([
        resolveRole(supabase as any, userId),
        resolveOnboardingCompleted(adminClient as any, userId),
    ]);
    if (role !== "landlord") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const url = new URL(request.url);
        const shouldStart = parseBoolean(url.searchParams.get("start"), true);
        const triggerSource = resolveTriggerSource(url.searchParams.get("source"));
        const eligibility = await resolveLandlordProductTourEligibility(adminClient as any, {
            landlordId: userId,
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
                requiredStep: eligibility.state ? getLandlordProductTourRequiredStep(eligibility.state) : null,
                steps: LANDLORD_PRODUCT_TOUR_STEPS,
            });
        }

        const started = shouldStart
            ? await startLandlordProductTour(adminClient as any, {
                  landlordId: userId,
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
            requiredStep: state ? getLandlordProductTourRequiredStep(state) : null,
            steps: LANDLORD_PRODUCT_TOUR_STEPS,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load product tour state.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
export async function DELETE(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;
    const adminClient = createAdminClient();

    try {
        // Remove both state and events for a truly "complete" reset
        await adminClient
            .from("landlord_product_tour_events" as any)
            .delete()
            .eq("landlord_id", userId);

        await adminClient
            .from("landlord_product_tour_states" as any)
            .delete()
            .eq("landlord_id", userId);

        return NextResponse.json({ success: true, message: "Tour progress completely wiped." });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to reset product tour.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
