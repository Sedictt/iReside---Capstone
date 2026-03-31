import { describe, expect, it, vi } from "vitest";
import {
    TENANT_PRODUCT_TOUR_STEPS,
    evaluateTenantProductTourEligibility,
    getTenantProductTourRequiredStep,
    isNextProductTourStepSubmission,
    type TenantProductTourState,
} from "../product-tour";

const baseState = (partial?: Partial<TenantProductTourState>): TenantProductTourState => ({
    tenant_id: "tenant-1",
    status: "in_progress",
    current_step_index: 0,
    started_at: new Date("2026-03-31T00:00:00.000Z").toISOString(),
    completed_at: null,
    skipped_at: null,
    skip_suppressed_until: null,
    replay_count: 0,
    last_event_at: null,
    last_route: null,
    last_anchor_id: null,
    metadata: {},
    ...partial,
});

describe("product tour helpers", () => {
    it("returns the next required step from current step index", () => {
        const state = baseState({ current_step_index: 2 });
        expect(getTenantProductTourRequiredStep(state)?.id).toBe(TENANT_PRODUCT_TOUR_STEPS[2].id);
    });

    it("validates only the required step as acceptable progression", () => {
        const state = baseState({ current_step_index: 1 });
        expect(isNextProductTourStepSubmission(state, TENANT_PRODUCT_TOUR_STEPS[1].id)).toBe(true);
        expect(isNextProductTourStepSubmission(state, TENANT_PRODUCT_TOUR_STEPS[2].id)).toBe(false);
    });

    it("marks newly completed onboarding tenants as eligible first-run", () => {
        vi.stubEnv("GUIDED_TENANT_PRODUCT_TOUR_ENABLED", "true");
        const result = evaluateTenantProductTourEligibility({
            role: "tenant",
            onboardingCompleted: true,
            state: null,
        });
        expect(result.eligible).toBe(true);
        expect(result.reason).toBe("eligible_first_run");
        vi.unstubAllEnvs();
    });

    it("suppresses eligibility during skip cooldown", () => {
        vi.stubEnv("GUIDED_TENANT_PRODUCT_TOUR_ENABLED", "true");
        const result = evaluateTenantProductTourEligibility({
            role: "tenant",
            onboardingCompleted: true,
            state: baseState({
                status: "skipped",
                skip_suppressed_until: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            }),
        });
        expect(result.eligible).toBe(false);
        expect(result.reason).toBe("skip_cooldown");
        vi.unstubAllEnvs();
    });

    it("allows reprompt after skip cooldown expires", () => {
        vi.stubEnv("GUIDED_TENANT_PRODUCT_TOUR_ENABLED", "true");
        const result = evaluateTenantProductTourEligibility({
            role: "tenant",
            onboardingCompleted: true,
            state: baseState({
                status: "skipped",
                skip_suppressed_until: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            }),
        });
        expect(result.eligible).toBe(true);
        expect(result.reason).toBe("eligible_reprompt");
        vi.unstubAllEnvs();
    });

    it("blocks non-tenant users from eligibility", () => {
        vi.stubEnv("GUIDED_TENANT_PRODUCT_TOUR_ENABLED", "true");
        const result = evaluateTenantProductTourEligibility({
            role: "landlord",
            onboardingCompleted: true,
            state: null,
        });
        expect(result.eligible).toBe(false);
        expect(result.reason).toBe("non_tenant");
        vi.unstubAllEnvs();
    });
});
