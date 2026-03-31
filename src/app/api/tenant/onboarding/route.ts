import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    ensureTenantOnboardingState,
    getFirstIncompleteOnboardingStep,
    isGuidedTenantOnboardingEnabled,
} from "@/lib/onboarding";

const resolveRole = async (supabase: any, user: any): Promise<string> => {
    const metadataRole = user?.user_metadata?.role;
    if (typeof metadataRole === "string" && metadataRole.length > 0) {
        return metadataRole;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return profile?.role ?? "tenant";
};

export async function GET() {
    if (!isGuidedTenantOnboardingEnabled()) {
        return NextResponse.json({
            enabled: false,
            state: null,
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

    const role = await resolveRole(supabase, user);
    if (role !== "tenant") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const state = await ensureTenantOnboardingState(adminClient as any, user.id);
        const nextStep = getFirstIncompleteOnboardingStep(state.steps);

        return NextResponse.json({
            enabled: true,
            state,
            nextStep,
            completed: state.status === "completed",
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load onboarding state.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
