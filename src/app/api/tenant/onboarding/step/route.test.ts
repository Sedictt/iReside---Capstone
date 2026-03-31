import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
    createClient: createClientMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: createAdminClientMock,
}));

describe("POST /api/tenant/onboarding/step", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        process.env.GUIDED_TENANT_ONBOARDING_ENABLED = "true";
    });

    it("returns 401 for unauthenticated requests", async () => {
        createClientMock.mockResolvedValue({
            auth: {
                getUser: async () => ({
                    data: { user: null },
                    error: { message: "No auth session" },
                }),
            },
        });
        createAdminClientMock.mockReturnValue({});

        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/tenant/onboarding/step", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    step: "profile",
                    data: {
                        full_name: "Tenant User",
                        phone: "+639171234567",
                    },
                }),
            })
        );

        expect(response.status).toBe(401);
    });

    it("returns 400 for invalid request payload", async () => {
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

        const { POST } = await import("./route");
        const response = await POST(
            new Request("http://localhost/api/tenant/onboarding/step", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    step: "not-a-step",
                }),
            })
        );

        expect(response.status).toBe(400);
    });
});
