import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "../route";

const mockRequireAuthenticatedUser = vi.fn();
const mockRequireRole = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/api/auth-guard", () => ({
    requireAuthenticatedUser: (...args: any[]) => mockRequireAuthenticatedUser(...args),
    requireRole: (...args: any[]) => mockRequireRole(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
    createServiceRoleSupabaseClient: () => ({
        from: mockFrom,
    }),
}));

describe("API /api/landlord/quick-actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 if user is not authenticated on GET", async () => {
        mockRequireAuthenticatedUser.mockResolvedValue(new Response("Unauthorized", { status: 401 }));
        const req = new Request("http://localhost:3000/api/landlord/quick-actions");
        const res = await GET(req);
        expect(res.status).toBe(401);
    });

    it("returns sanitized default config on GET when no socials exist", async () => {
        mockRequireAuthenticatedUser.mockResolvedValue({
            userId: "user-123",
            userRole: "landlord",
            supabase: {},
        });
        mockRequireRole.mockReturnValue(undefined);

        const mockSingle = vi.fn().mockResolvedValue({
            data: { socials: null },
            error: null,
        });
        const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
        mockFrom.mockReturnValue({ select: mockSelect });

        const req = new Request("http://localhost:3000/api/landlord/quick-actions");
        const res = await GET(req);
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.config.order.length).toBe(10);
        expect(json.config.sortMode).toBe("custom");
    });

    it("persists updated order, hidden items, and sort mode on PATCH", async () => {
        mockRequireAuthenticatedUser.mockResolvedValue({
            userId: "user-123",
            userRole: "landlord",
            supabase: {},
        });
        mockRequireRole.mockReturnValue(undefined);

        // First query: select profile socials
        const mockSingle = vi.fn().mockResolvedValue({
            data: {
                socials: {
                    quick_actions: {
                        order: ["invoice-ledger"],
                        hidden: [],
                        sortMode: "custom",
                        usageCounts: { "invoice-ledger": 3 },
                    },
                },
            },
            error: null,
        });
        const mockEqSelect = vi.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEqSelect });

        // Second query: update profile socials
        const mockEqUpdate = vi.fn().mockResolvedValue({ error: null });
        const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

        mockFrom.mockImplementation((table: string) => {
            if (table === "profiles") {
                return {
                    select: mockSelect,
                    update: mockUpdate,
                };
            }
            return {};
        });

        const req = new Request("http://localhost:3000/api/landlord/quick-actions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sortMode: "frequently_used",
                hidden: ["settings"],
                usageCounts: { "invoice-ledger": 4 },
            }),
        });

        const res = await PATCH(req);
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.config.sortMode).toBe("frequently_used");
        expect(json.config.hidden).toContain("settings");
        expect(json.config.usageCounts["invoice-ledger"]).toBe(4);

        expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    it("returns 400 when invalid payload is submitted to PATCH", async () => {
        mockRequireAuthenticatedUser.mockResolvedValue({
            userId: "user-123",
            userRole: "landlord",
            supabase: {},
        });
        mockRequireRole.mockReturnValue(undefined);

        const req = new Request("http://localhost:3000/api/landlord/quick-actions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sortMode: "totally-bogus-mode",
            }),
        });

        const res = await PATCH(req);
        expect(res.status).toBe(400);
    });
});
