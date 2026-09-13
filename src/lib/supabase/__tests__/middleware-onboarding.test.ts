import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import {
    isAllowlistedTenantRoute,
    isAllowlistedTenantWritePath,
    isTenantApiWriteRequest,
    isExplicitLogoutRequest,
} from "../middleware";

const mockRequest = (pathname: string, method: string, searchParams?: Record<string, string>): NextRequest => {
    const params = new URLSearchParams(searchParams || {});
    return {
        method,
        nextUrl: {
            pathname,
            searchParams: params,
        },
    } as unknown as NextRequest;
};

describe("tenant onboarding middleware guards", () => {
    it("detects tenant write API requests", () => {
        expect(isTenantApiWriteRequest(mockRequest("/api/tenant/onboarding/step", "POST"))).toBe(true);
        expect(isTenantApiWriteRequest(mockRequest("/api/tenant/onboarding/step", "PATCH"))).toBe(true);
    });

    it("does not treat read-only or non-tenant requests as protected writes", () => {
        expect(isTenantApiWriteRequest(mockRequest("/api/tenant/onboarding", "GET"))).toBe(false);
        expect(isTenantApiWriteRequest(mockRequest("/api/landlord/tenants", "POST"))).toBe(false);
    });

    it("allows onboarding and lease signing write endpoints during onboarding", () => {
        expect(isAllowlistedTenantWritePath("/api/tenant/onboarding/step")).toBe(true);
        expect(isAllowlistedTenantWritePath("/api/tenant/leases/lease-123/sign")).toBe(true);
    });

    it("blocks non-allowlisted tenant write endpoints during onboarding", () => {
        expect(isAllowlistedTenantWritePath("/api/tenant/payments/checkout")).toBe(false);
    });

    it("allows onboarding-safe tenant routes and blocks protected ones", () => {
        expect(isAllowlistedTenantRoute("/tenant/onboarding")).toBe(true);
        expect(isAllowlistedTenantRoute("/tenant/sign-lease/abc")).toBe(true);
        expect(isAllowlistedTenantRoute("/tenant/dashboard")).toBe(false);
        expect(isAllowlistedTenantRoute("/tenant/tour")).toBe(false);
    });
});

describe("middleware explicit logout handling", () => {
    it("identifies explicit logout requests with logout query parameter", () => {
        expect(isExplicitLogoutRequest(mockRequest("/login", "GET", { logout: "1726000000" }))).toBe(true);
    });

    it("identifies explicit sync logout requests", () => {
        expect(isExplicitLogoutRequest(mockRequest("/login", "GET", { sync: "logout" }))).toBe(true);
    });

    it("does not treat ordinary login navigation as explicit logout", () => {
        expect(isExplicitLogoutRequest(mockRequest("/login", "GET"))).toBe(false);
        expect(isExplicitLogoutRequest(mockRequest("/login", "GET", { redirect: "/tenant/dashboard" }))).toBe(false);
    });

    it("does not treat other routes as explicit logout", () => {
        expect(isExplicitLogoutRequest(mockRequest("/tenant/dashboard", "GET", { logout: "true" }))).toBe(false);
    });
});

