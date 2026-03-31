import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import {
    isAllowlistedTenantRoute,
    isAllowlistedTenantWritePath,
    isTenantApiWriteRequest,
} from "../middleware";

const mockRequest = (pathname: string, method: string): NextRequest =>
    ({
        method,
        nextUrl: {
            pathname,
        },
    }) as unknown as NextRequest;

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
