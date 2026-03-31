import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveTenantTourContextMock = vi.fn();
const progressTenantProductTourStepMock = vi.fn();

vi.mock("../helpers", () => ({
    resolveTenantTourContext: resolveTenantTourContextMock,
}));

vi.mock("@/lib/product-tour", () => ({
    TENANT_PRODUCT_TOUR_STEPS: [
        { id: "dashboard_overview" },
        { id: "lease_overview" },
    ],
    isGuidedTenantProductTourEnabled: () => true,
    progressTenantProductTourStep: progressTenantProductTourStepMock,
}));

describe("POST /api/tenant/tour/step", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("returns 401 when request is unauthenticated", async () => {
        resolveTenantTourContextMock.mockResolvedValue({
            error: "Unauthorized",
            status: 401,
        });

        const { POST } = await import("./route");
        const response = await POST(
            new Request("http://localhost/api/tenant/tour/step", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stepId: "dashboard_overview" }),
            })
        );

        expect(response.status).toBe(401);
    });

    it("returns 400 for invalid step payload", async () => {
        resolveTenantTourContextMock.mockResolvedValue({
            context: {
                adminClient: {},
                user: { id: "tenant-1" },
            },
            error: null,
            status: 200,
        });

        const { POST } = await import("./route");
        const response = await POST(
            new Request("http://localhost/api/tenant/tour/step", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stepId: "unknown_step" }),
            })
        );

        expect(response.status).toBe(400);
    });

    it("returns 409 when step order is violated", async () => {
        resolveTenantTourContextMock.mockResolvedValue({
            context: {
                adminClient: {},
                user: { id: "tenant-1" },
            },
            error: null,
            status: 200,
        });
        const err = new Error("Step order violation: required step is lease_overview");
        (err as any).status = 409;
        (err as any).requiredStep = "lease_overview";
        progressTenantProductTourStepMock.mockRejectedValue(err);

        const { POST } = await import("./route");
        const response = await POST(
            new Request("http://localhost/api/tenant/tour/step", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stepId: "dashboard_overview" }),
            })
        );

        expect(response.status).toBe(409);
    });
});
