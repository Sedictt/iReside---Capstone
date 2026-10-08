import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedUser, requireRole } from "@/lib/api/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureLandlordProductTourState, getLandlordProductTourState } from "@/lib/landlord-product-tour";
import type { LandlordSetupSignals } from "@/lib/landlord-setup";

/**
 * Landlord setup (onboarding) signals that cannot be derived from the property list.
 *
 * GET  /api/landlord/setup-status → LandlordSetupSignals
 *   - billing evidence from landlord_payment_destinations / utility_configs
 *   - persisted "configure later" choices (stored in landlord_product_tour_states.metadata.setup)
 *   - dashboard tour completion (independent of the guided-tour feature flag)
 *
 * POST /api/landlord/setup-status { step: "billing" | "first_tenant", action: "defer" | "resume" }
 *   Persists a "configure later" choice so it survives logout, refresh, and other devices.
 *   Completion itself is never stored here: it always comes from real billing / lease records.
 */

const NO_STORE = { "Cache-Control": "private, no-cache, no-store, must-revalidate" };

type SetupMetadata = { billingDeferredAt?: string | null; tenantDeferredAt?: string | null };

const readSetupMetadata = (metadata: Record<string, unknown> | null | undefined): SetupMetadata => {
    const raw = metadata?.setup;
    return raw && typeof raw === "object" ? (raw as SetupMetadata) : {};
};

export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    try {
        requireRole(authContext, "landlord");
    } catch (e) {
        return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { userId } = authContext;
    const admin = createAdminClient();

    try {
        const [destinationResult, utilityResult, tourState] = await Promise.all([
            admin
                .from("landlord_payment_destinations")
                .select("id")
                .eq("landlord_id", userId)
                .eq("is_enabled", true)
                .limit(1),
            admin
                .from("utility_configs")
                .select("property_id")
                .eq("landlord_id", userId)
                .eq("is_active", true)
                // A real choice is either a rate or "included in rent". Placeholder configs auto-created
                // at billing time are tenant_paid with a 0 rate, so they don't count as configured.
                .or("rate_per_unit.gt.0,billing_mode.eq.included_in_rent"),
            getLandlordProductTourState(admin as any, userId),
        ]);

        if (destinationResult.error) throw destinationResult.error;
        if (utilityResult.error) throw utilityResult.error;

        const setup = readSetupMetadata(tourState?.metadata);
        const signals: LandlordSetupSignals = {
            hasPaymentDestination: (destinationResult.data ?? []).length > 0,
            utilityRatePropertyIds: Array.from(
                new Set((utilityResult.data ?? []).map((row: { property_id: string }) => row.property_id))
            ),
            billingDeferredAt: setup.billingDeferredAt ?? null,
            tenantDeferredAt: setup.tenantDeferredAt ?? null,
            dashboardTourDone: tourState?.status === "completed" || tourState?.status === "skipped",
        };

        return NextResponse.json(signals, { headers: NO_STORE });
    } catch (error) {
        console.error("[setup-status GET] Error:", error);
        const message = error instanceof Error ? error.message : "Failed to load setup status.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

const updateSchema = z.object({
    step: z.enum(["billing", "first_tenant"]),
    action: z.enum(["defer", "resume"]),
});

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    try {
        requireRole(authContext, "landlord");
    } catch (e) {
        return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { userId } = authContext;
    const admin = createAdminClient();

    try {
        const { step, action } = updateSchema.parse(await request.json());
        const state = await ensureLandlordProductTourState(admin as any, userId);
        const field = step === "billing" ? "billingDeferredAt" : "tenantDeferredAt";
        const setup: SetupMetadata = {
            ...readSetupMetadata(state.metadata),
            [field]: action === "defer" ? new Date().toISOString() : null,
        };

        const { error } = await admin
            .from("landlord_product_tour_states" as any)
            .update({ metadata: { ...state.metadata, setup }, updated_at: new Date().toISOString() })
            .eq("landlord_id", userId);
        if (error) throw error;

        return NextResponse.json({ success: true, setup }, { headers: NO_STORE });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid request body", details: error.issues }, { status: 400 });
        }
        console.error("[setup-status POST] Error:", error);
        const message = error instanceof Error ? error.message : "Failed to update setup status.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
