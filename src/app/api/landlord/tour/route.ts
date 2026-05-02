import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

const resolveRole = async (supabase: any, user: any) => {
    const metadataRole = user?.user_metadata?.role;
    if (typeof metadataRole === "string" && metadataRole.length > 0) {
        return metadataRole;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
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

    const supabase = await createClient();
    const adminClient = createAdminClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await resolveRole(supabase as any, user);
    if (role !== "landlord") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const shouldStart = parseBoolean(url.searchParams.get("start"), true);
    const triggerSource = resolveTriggerSource(url.searchParams.get("source"));
    const onboardingCompleted = await resolveOnboardingCompleted(adminClient as any, user.id);

    try {
        const eligibility = await resolveLandlordProductTourEligibility(adminClient as any, {
            landlordId: user.id,
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
                  landlordId: user.id,
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
export async function DELETE() {
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
        // Remove both state and events for a truly "complete" reset
        await adminClient
            .from("landlord_product_tour_events" as any)
            .delete()
            .eq("landlord_id", user.id);

        await adminClient
            .from("landlord_product_tour_states" as any)
            .delete()
            .eq("landlord_id", user.id);

        return NextResponse.json({ success: true, message: "Tour progress completely wiped." });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to reset product tour.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
