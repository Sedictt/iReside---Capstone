// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetClaims = vi.fn();
const mockProfileMaybeSingle = vi.fn();
let cookieJar: Record<string, string> = {};

vi.mock("next/headers", () => ({
    cookies: async () => ({
        getAll: () => Object.entries(cookieJar).map(([name, value]) => ({ name, value })),
        get: (name: string) => (name in cookieJar ? { name, value: cookieJar[name] } : undefined),
    }),
}));

vi.mock("@/lib/supabase/server", () => ({
    createServerSupabaseClient: async () => ({
        auth: { getClaims: mockGetClaims },
        from: () => ({
            select: () => ({
                eq: () => ({
                    maybeSingle: mockProfileMaybeSingle,
                }),
            }),
        }),
    }),
}));

import { requireAuthenticatedUser, clearAuthIdentityCache } from "@/lib/api/auth-guard";
import { createTwoFactorVerifiedCookieValue, TWO_FACTOR_VERIFIED_COOKIE } from "@/lib/security/two-factor-cookie";

const validClaims = (overrides: Record<string, unknown> = {}) => ({
    data: {
        claims: {
            sub: "user-123",
            email: "user@example.com",
            role: "authenticated",
            user_metadata: { role: "admin" },
            ...overrides,
        },
        header: { alg: "ES256" },
        signature: new Uint8Array(),
    },
    error: null,
});

describe("requireAuthenticatedUser", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearAuthIdentityCache();
        cookieJar = { "sb-project-auth-token": "cookie-value" };
        mockProfileMaybeSingle.mockResolvedValue({ data: { role: "tenant", two_factor_enabled: false }, error: null });
    });

    it("rejects a session whose JWT fails signature verification", async () => {
        mockGetClaims.mockResolvedValue({ data: null, error: new Error("invalid signature") });
        const result = await requireAuthenticatedUser();
        expect(result).toBeInstanceOf(Response);
        expect((result as Response).status).toBe(401);
    });

    it("takes the role from the profiles table, never from user_metadata", async () => {
        mockGetClaims.mockResolvedValue(validClaims({ user_metadata: { role: "admin" } }));
        const result = await requireAuthenticatedUser();
        expect(result).not.toBeInstanceOf(Response);
        if (result instanceof Response) return;
        expect(result.userId).toBe("user-123");
        expect(result.userEmail).toBe("user@example.com");
        expect(result.userRole).toBe("tenant");
    });

    it("falls back to least privilege when the profile lookup fails", async () => {
        mockGetClaims.mockResolvedValue(validClaims({ user_metadata: { role: "landlord" } }));
        mockProfileMaybeSingle.mockResolvedValue({ data: null, error: new Error("boom") });
        const result = await requireAuthenticatedUser();
        if (result instanceof Response) throw new Error("expected context");
        expect(result.userRole).toBe("tenant");
    });

    it("requires the signed verified-device cookie when 2FA is enabled", async () => {
        mockGetClaims.mockResolvedValue(validClaims());
        mockProfileMaybeSingle.mockResolvedValue({ data: { role: "landlord", two_factor_enabled: true }, error: null });

        const denied = await requireAuthenticatedUser();
        expect(denied).toBeInstanceOf(Response);
        expect((denied as Response).status).toBe(401);
        const body = await (denied as Response).json();
        expect(body.error.details.code).toBe("TWO_FACTOR_REQUIRED");

        // An unsigned (legacy) cookie is still rejected.
        cookieJar[TWO_FACTOR_VERIFIED_COOKIE] = "user-123";
        expect(await requireAuthenticatedUser()).toBeInstanceOf(Response);

        // The signed cookie for this user is accepted.
        cookieJar[TWO_FACTOR_VERIFIED_COOKIE] = await createTwoFactorVerifiedCookieValue("user-123");
        const allowed = await requireAuthenticatedUser();
        expect(allowed).not.toBeInstanceOf(Response);
        if (!(allowed instanceof Response)) expect(allowed.userRole).toBe("landlord");
    });

    it("lets the 2FA challenge endpoints through while the device is still pending", async () => {
        mockGetClaims.mockResolvedValue(validClaims());
        mockProfileMaybeSingle.mockResolvedValue({ data: { role: "landlord", two_factor_enabled: true }, error: null });
        const result = await requireAuthenticatedUser(undefined, { allowPendingTwoFactor: true });
        expect(result).not.toBeInstanceOf(Response);
    });

    it("caches a verified identity per cookie set", async () => {
        mockGetClaims.mockResolvedValue(validClaims());
        await requireAuthenticatedUser();
        await requireAuthenticatedUser();
        expect(mockGetClaims).toHaveBeenCalledTimes(1);

        cookieJar = { "sb-project-auth-token": "another-session" };
        await requireAuthenticatedUser();
        expect(mockGetClaims).toHaveBeenCalledTimes(2);
    });
});
