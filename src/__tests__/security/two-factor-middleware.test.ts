// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createTwoFactorVerifiedCookieValue } from "@/lib/security/two-factor-cookie";

// Mock @supabase/ssr: the middleware verifies the session through getClaims().
const mockGetClaims = vi.fn();
vi.mock("@supabase/ssr", () => ({
    createServerClient: () => ({
        auth: {
            getClaims: mockGetClaims,
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

import { updateSession, isPublicRoute } from "@/lib/supabase/middleware";

const verifiedClaims = (id: string, user_metadata: Record<string, unknown>) => ({
    data: {
        claims: { sub: id, email: "landlord@example.com", role: "authenticated", user_metadata },
        header: { alg: "ES256" },
        signature: new Uint8Array(),
    },
    error: null,
});

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
        mockGetClaims.mockResolvedValue(verifiedClaims("user-2fa-enabled", { role: "landlord", two_factor_enabled: true }));

        const req = createRequest("http://localhost:3000/landlord/dashboard");
        const res = await updateSession(req);

        expect(res.status).toBe(307);
        expect(res.headers.get("location")).toContain("/login");
    });

    it("redirects when ireside_2fa_verified is an unsigned user id", async () => {
        mockGetClaims.mockResolvedValue(verifiedClaims("user-2fa-enabled", { role: "landlord", two_factor_enabled: true }));

        const req = createRequest("http://localhost:3000/landlord/dashboard", {
            "sb-token": "valid-auth-token",
            "ireside_2fa_verified": "user-2fa-enabled",
            "ireside_setup_completed": "true",
        });
        const res = await updateSession(req);

        expect(res.status).toBe(307);
        expect(res.headers.get("location")).toContain("/login");
    });

    it("allows access to protected route when the signed ireside_2fa_verified cookie matches the user", async () => {
        mockGetClaims.mockResolvedValue(verifiedClaims("user-2fa-enabled", { role: "landlord", two_factor_enabled: true }));

        const req = createRequest("http://localhost:3000/landlord/dashboard", {
            "sb-token": "valid-auth-token",
            "ireside_2fa_verified": await createTwoFactorVerifiedCookieValue("user-2fa-enabled"),
            "ireside_setup_completed": "true",
        });
        const res = await updateSession(req);

        expect(res.headers.get("location")).toBeNull();
    });

    it("redirects when ireside_2fa_pending is true even if user tries to reach dashboard", async () => {
        mockGetClaims.mockResolvedValue(verifiedClaims("user-pending", { role: "landlord" }));

        const req = createRequest("http://localhost:3000/landlord/dashboard", {
            "sb-token": "valid-auth-token",
            "ireside_2fa_pending": "true",
        });
        const res = await updateSession(req);

        expect(res.status).toBe(307);
        expect(res.headers.get("location")).toContain("/login");
    });

    it("keeps user on /login when 2FA is required and unverified without redirecting to dashboard", async () => {
        mockGetClaims.mockResolvedValue(verifiedClaims("user-2fa-enabled", { role: "landlord", two_factor_enabled: true }));

        const req = createRequest("http://localhost:3000/login", {
            "sb-token": "valid-auth-token",
            "ireside_2fa_pending": "true",
        });
        const res = await updateSession(req);

        expect(res.headers.get("location")).toBeNull();
    });
});

describe("Middleware session verification", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("redirects to /login when the session cookie fails signature verification", async () => {
        mockGetClaims.mockResolvedValue({ data: null, error: new Error("invalid signature") });

        const req = new NextRequest("http://localhost:3000/landlord/dashboard");
        req.cookies.set("sb-token", "forged-token");
        const res = await updateSession(req);

        expect(res.status).toBe(307);
        expect(res.headers.get("location")).toContain("/login");
    });

    it("lets a cookie-bearing request through only when verification timed out", async () => {
        mockGetClaims.mockImplementation(() => new Promise(() => { /* never resolves */ }));

        const req = new NextRequest("http://localhost:3000/landlord/dashboard");
        req.cookies.set("sb-token", "maybe-offline");
        const res = await updateSession(req);

        expect(res.headers.get("location")).toBeNull();
    }, 10000);

    it("does not honour the boneyard capture bypass in production", () => {
        const req = new NextRequest("http://localhost:3000/landlord/dashboard?boneyard=true");
        const original = process.env.NODE_ENV;
        (process.env as any).NODE_ENV = "production";
        try {
            expect(isPublicRoute("/landlord/dashboard", req)).toBe(false);
        } finally {
            (process.env as any).NODE_ENV = original;
        }
        expect(isPublicRoute("/landlord/dashboard", req)).toBe(true);
    });
});
