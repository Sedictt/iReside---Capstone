import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock @supabase/ssr
const mockGetUser = vi.fn();
vi.mock("@supabase/ssr", () => ({
    createServerClient: () => ({
        auth: {
            getUser: mockGetUser,
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: vi.fn().mockResolvedValue({ data: { role: "landlord" } }),
                    maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                }),
            }),
        }),
    }),
}));

import { updateSession } from "@/lib/supabase/middleware";

describe("Middleware Two-Factor Authentication Enforcement", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createRequest = (
        url: string,
        cookies: Record<string, string> = { "sb-token": "valid-auth-token" }
    ): NextRequest => {
        const req = new NextRequest(url);
        Object.entries(cookies).forEach(([k, v]) => {
            req.cookies.set(k, v);
        });
        return req;
    };

    it("redirects 2FA-enabled user to /login when ireside_2fa_verified is missing", async () => {
        mockGetUser.mockResolvedValue({
            data: {
                user: {
                    id: "user-2fa-enabled",
                    email: "landlord@example.com",
                    user_metadata: { role: "landlord", two_factor_enabled: true },
                },
            },
            error: null,
        });

        const req = createRequest("http://localhost:3000/landlord/dashboard");
        const res = await updateSession(req);

        // Expect redirect to /login
        expect(res.status).toBe(307);
        const location = res.headers.get("location");
        expect(location).toContain("/login");
    });

    it("allows access to protected route when ireside_2fa_verified matches user id", async () => {
        mockGetUser.mockResolvedValue({
            data: {
                user: {
                    id: "user-2fa-enabled",
                    email: "landlord@example.com",
                    user_metadata: { role: "landlord", two_factor_enabled: true },
                },
            },
            error: null,
        });

        const req = createRequest("http://localhost:3000/landlord/dashboard", {
            "sb-token": "valid-auth-token",
            "ireside_2fa_verified": "user-2fa-enabled",
            "ireside_setup_completed": "true",
        });
        const res = await updateSession(req);

        // Expect not redirecting (request is allowed through)
        const location = res.headers.get("location");
        expect(location).toBeNull();
    });

    it("redirects when ireside_2fa_pending is true even if user tries to reach dashboard", async () => {
        mockGetUser.mockResolvedValue({
            data: {
                user: {
                    id: "user-pending",
                    email: "landlord@example.com",
                    user_metadata: { role: "landlord" },
                },
            },
            error: null,
        });

        const req = createRequest("http://localhost:3000/landlord/dashboard", {
            "sb-token": "valid-auth-token",
            "ireside_2fa_pending": "true",
        });
        const res = await updateSession(req);

        expect(res.status).toBe(307);
        const location = res.headers.get("location");
        expect(location).toContain("/login");
    });

    it("keeps user on /login when 2FA is required and unverified without redirecting to dashboard", async () => {
        mockGetUser.mockResolvedValue({
            data: {
                user: {
                    id: "user-2fa-enabled",
                    email: "landlord@example.com",
                    user_metadata: { role: "landlord", two_factor_enabled: true },
                },
            },
            error: null,
        });

        const req = createRequest("http://localhost:3000/login", {
            "sb-token": "valid-auth-token",
            "ireside_2fa_pending": "true",
        });
        const res = await updateSession(req);

        // Should not redirect to dashboard
        const location = res.headers.get("location");
        expect(location).toBeNull();
    });
});
