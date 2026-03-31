import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const ensureTenantOnboardingStateMock = vi.fn();
const finalizeTenantOnboardingMock = vi.fn();
const resolveTenantProductTourEligibilityMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
    createClient: createClientMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/onboarding", () => ({
    areAllOnboardingStepsComplete: () => true,
    ensureTenantOnboardingState: ensureTenantOnboardingStateMock,
    finalizeTenantOnboarding: finalizeTenantOnboardingMock,
    getFirstIncompleteOnboardingStep: () => null,
    isGuidedTenantOnboardingEnabled: () => true,
}));

vi.mock("@/lib/product-tour", () => ({
    TENANT_PRODUCT_TOUR_ROUTE: "/tenant/tour",
    isGuidedTenantProductTourEnabled: () => true,
    resolveTenantProductTourEligibility: resolveTenantProductTourEligibilityMock,
}));

describe("POST /api/tenant/onboarding/complete", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        createClientMock.mockResolvedValue({
            auth: {
                getUser: async () => ({
                    data: {
                        user: {
                            id: "tenant-1",
                            user_metadata: { role: "tenant" },
                        },
                    },
                    error: null,
                }),
            },
        });
        createAdminClientMock.mockReturnValue({});
        ensureTenantOnboardingStateMock.mockResolvedValue({
            tenant_id: "tenant-1",
            status: "completed",
            steps: {
                profile: true,
                lease_acknowledged: true,
                payment_readiness: true,
                support_handoff: true,
            },
        });
        finalizeTenantOnboardingMock.mockResolvedValue({
            tenant_id: "tenant-1",
            status: "completed",
        });
    });

    it("hands off to /tenant/tour when no destination is captured and tenant is eligible", async () => {
        resolveTenantProductTourEligibilityMock.mockResolvedValue({
            eligible: true,
            reason: "eligible_first_run",
            state: null,
            suppressUntil: null,
        });

        const { POST } = await import("./route");
        const response = await POST(
            new Request("http://localhost/api/tenant/onboarding/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            })
        );
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload.redirectTo).toBe("/tenant/tour?source=onboarding_handoff");
    });

    it("returns captured tenant destination when it is safe", async () => {
        resolveTenantProductTourEligibilityMock.mockResolvedValue({
            eligible: true,
            reason: "eligible_first_run",
            state: null,
            suppressUntil: null,
        });

        const { POST } = await import("./route");
        const response = await POST(
            new Request("http://localhost/api/tenant/onboarding/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    next: "/tenant/payments",
                }),
            })
        );
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload.redirectTo).toBe("/tenant/payments");
    });
});
