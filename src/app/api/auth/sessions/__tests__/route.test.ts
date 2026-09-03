import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, DELETE } from "../route";
import * as authGuard from "@/lib/api/auth-guard";
import * as adminSupabase from "@/lib/supabase/admin";

describe("API /api/auth/sessions", () => {
    let mockSupabase: any;
    let mockAdminSupabase: any;
    let mockChannel: any;

    beforeEach(() => {
        vi.restoreAllMocks();

        mockChannel = {
            subscribe: vi.fn().mockResolvedValue(true),
            send: vi.fn().mockResolvedValue(true),
        };

        mockSupabase = {
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                        data: [
                            {
                                id: "sess-1",
                                user_id: "user-123",
                                created_at: "2026-08-31T10:00:00Z",
                                updated_at: "2026-08-31T12:00:00Z",
                                ip: "192.168.1.1",
                                user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0",
                            },
                            {
                                id: "sess-2",
                                user_id: "user-123",
                                created_at: "2026-08-31T09:00:00Z",
                                updated_at: "2026-08-31T11:00:00Z",
                                ip: "192.168.1.2",
                                user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4) Safari/604.1",
                            },
                        ],
                        error: null,
                    }),
                }),
            }),
            channel: vi.fn().mockReturnValue(mockChannel),
            removeChannel: vi.fn(),
        };

        mockAdminSupabase = {
            schema: vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    delete: vi.fn().mockReturnValue({
                        match: vi.fn().mockResolvedValue({ error: null }),
                    }),
                }),
            }),
        };

        vi.spyOn(authGuard, "requireAuthenticatedUser").mockResolvedValue({
            userId: "user-123",
            userEmail: "user@example.com",
            userRole: "landlord",
            supabase: mockSupabase as any,
        });

        vi.spyOn(adminSupabase, "createServiceRoleSupabaseClient").mockReturnValue(
            mockAdminSupabase as any
        );
    });

    describe("GET /api/auth/sessions", () => {
        it("returns enriched sessions with parsed device information", async () => {
            const req = new Request("http://localhost:3000/api/auth/sessions");
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data.sessions).toHaveLength(2);
            expect(data.data.sessions[0].browser).toContain("Chrome");
            expect(data.data.sessions[0].os).toContain("Windows");
            expect(data.data.sessions[0].deviceType).toBe("desktop");
            expect(data.data.sessions[1].deviceType).toBe("mobile");
        });
    });

    describe("DELETE /api/auth/sessions", () => {
        it("revokes a specific session by sessionId and broadcasts revocation", async () => {
            const req = new Request("http://localhost:3000/api/auth/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: "sess-2" }),
            });

            const response = await DELETE(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data.sessionId).toBe("sess-2");
            expect(mockSupabase.channel).toHaveBeenCalledWith("auth-monitor:user-123");
            expect(mockChannel.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: "SESSION_REVOKED",
                    payload: expect.objectContaining({ sessionId: "sess-2" }),
                })
            );
        });

        it("revokes other sessions when scope is 'others'", async () => {
            const req = new Request("http://localhost:3000/api/auth/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scope: "others" }),
            });

            const response = await DELETE(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(mockChannel.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: "SESSION_REVOKED",
                    payload: expect.objectContaining({ scope: "others" }),
                })
            );
        });

        it("returns 400 bad request if neither sessionId nor scope is provided", async () => {
            const req = new Request("http://localhost:3000/api/auth/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });

            const response = await DELETE(req);
            expect(response.status).toBe(400);
        });
    });
});
