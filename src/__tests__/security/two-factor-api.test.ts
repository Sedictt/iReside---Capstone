import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock auth guard
const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/api/auth-guard", () => ({
    requireAuthenticatedUser: (...args: any[]) => mockRequireAuthenticatedUser(...args),
}));

// Mock TwoFactorService
const mockGetStatus = vi.fn();
const mockSendOTP = vi.fn();
const mockVerifyOTP = vi.fn();
const mockDisable = vi.fn();

vi.mock("@/lib/services/auth/two-factor.service", () => {
    class MockTwoFactorService {
        getStatus = mockGetStatus;
        sendOTP = mockSendOTP;
        verifyOTP = mockVerifyOTP;
        disable = mockDisable;
    }
    return {
        TwoFactorService: MockTwoFactorService,
        maskEmail: (email: string) => email,
    };
});

// Import route handlers
import { GET as landlordGet, POST as landlordPost } from "@/app/api/landlord/2fa/route";
import { GET as tenantGet, POST as tenantPost } from "@/app/api/tenant/2fa/route";
import { POST as challengePost } from "@/app/api/auth/2fa/challenge/route";
import { POST as verifyLoginPost } from "@/app/api/auth/2fa/verify-login/route";
import { POST as cancelPost } from "@/app/api/auth/2fa/cancel/route";

describe("Two-Factor Authentication API Endpoints", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Landlord 2FA (/api/landlord/2fa)", () => {
        it("returns status for authenticated landlord", async () => {
            mockRequireAuthenticatedUser.mockResolvedValue({
                userId: "landlord-1",
                userRole: "landlord",
            });
            mockGetStatus.mockResolvedValue({
                enabled: true,
                email: "landlord@example.com",
                userEmail: "landlord@example.com",
            });

            const req = new NextRequest("http://localhost:3000/api/landlord/2fa?action=status");
            const res = await landlordGet(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.enabled).toBe(true);
            expect(data.email).toBe("landlord@example.com");
        });

        it("dispatches OTP on send-otp action", async () => {
            mockRequireAuthenticatedUser.mockResolvedValue({
                userId: "landlord-1",
                userRole: "landlord",
            });
            mockSendOTP.mockResolvedValue({
                success: true,
                message: "Verification code sent to your email",
                email: "la***d@example.com",
            });

            const req = new NextRequest("http://localhost:3000/api/landlord/2fa", {
                method: "POST",
                body: JSON.stringify({ action: "send-otp" }),
            });
            const res = await landlordPost(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);
            expect(mockSendOTP).toHaveBeenCalledWith("landlord-1", { action: "enable" });
        });

        it("enables 2FA on valid verify-otp action", async () => {
            mockRequireAuthenticatedUser.mockResolvedValue({
                userId: "landlord-1",
                userRole: "landlord",
            });
            mockVerifyOTP.mockResolvedValue({
                success: true,
                message: "2FA enabled successfully",
                email: "landlord@example.com",
            });

            const req = new NextRequest("http://localhost:3000/api/landlord/2fa", {
                method: "POST",
                body: JSON.stringify({ action: "verify-otp", otp: "123456" }),
            });
            const res = await landlordPost(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);
            expect(mockVerifyOTP).toHaveBeenCalledWith("landlord-1", "123456", { enableOnSuccess: true });
        });

        it("disables 2FA on disable action with password", async () => {
            mockRequireAuthenticatedUser.mockResolvedValue({
                userId: "landlord-1",
                userRole: "landlord",
            });
            mockDisable.mockResolvedValue({
                success: true,
                message: "2FA disabled successfully",
            });

            const req = new NextRequest("http://localhost:3000/api/landlord/2fa", {
                method: "POST",
                body: JSON.stringify({ action: "disable", password: "secure-password" }),
            });
            const res = await landlordPost(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);
            expect(mockDisable).toHaveBeenCalledWith("landlord-1", "secure-password");
        });
    });

    describe("Tenant 2FA (/api/tenant/2fa)", () => {
        it("returns status for authenticated tenant", async () => {
            mockRequireAuthenticatedUser.mockResolvedValue({
                userId: "tenant-1",
                userRole: "tenant",
            });
            mockGetStatus.mockResolvedValue({
                enabled: false,
                email: null,
                userEmail: "tenant@example.com",
            });

            const req = new NextRequest("http://localhost:3000/api/tenant/2fa?action=status");
            const res = await tenantGet(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.enabled).toBe(false);
        });

        it("dispatches OTP on send-otp action for tenant", async () => {
            mockRequireAuthenticatedUser.mockResolvedValue({
                userId: "tenant-1",
                userRole: "tenant",
            });
            mockSendOTP.mockResolvedValue({
                success: true,
                message: "Verification code sent to your email",
                email: "te***t@example.com",
            });

            const req = new NextRequest("http://localhost:3000/api/tenant/2fa", {
                method: "POST",
                body: JSON.stringify({ action: "send-otp" }),
            });
            const res = await tenantPost(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);
            expect(mockSendOTP).toHaveBeenCalledWith("tenant-1", { action: "enable" });
        });
    });

    describe("Login 2FA Challenge & Verification", () => {
        const PROTECTED_USER = "3e4f5a6b-7c8d-4e9f-8a1b-2c3d4e5f6a7c";
        const UNPROTECTED_USER = "8f9a6c2e-1b3d-4e5f-9a7b-2c3d4e5f6a7b";

        beforeEach(() => {
            // The challenge follows password sign-in, so the caller has a session.
            mockRequireAuthenticatedUser.mockResolvedValue({ userId: PROTECTED_USER, userRole: "tenant" });
        });

        it("rejects a malformed user id with 400 before touching the 2FA service", async () => {
            const req = new NextRequest("http://localhost:3000/api/auth/2fa/challenge", {
                method: "POST",
                body: JSON.stringify({ userId: "not-a-uuid" }),
            });
            const res = await challengePost(req);
            expect(res.status).toBe(400);
            expect(mockSendOTP).not.toHaveBeenCalled();
        });

        it("refuses to send a login code for a different user than the signed-in one", async () => {
            mockRequireAuthenticatedUser.mockResolvedValue({ userId: UNPROTECTED_USER, userRole: "tenant" });
            const req = new NextRequest("http://localhost:3000/api/auth/2fa/challenge", {
                method: "POST",
                body: JSON.stringify({ userId: PROTECTED_USER }),
            });
            const res = await challengePost(req);
            expect(res.status).toBe(403);
            expect(mockSendOTP).not.toHaveBeenCalled();
        });

        it("rejects a non 6-digit code on verify-login", async () => {
            const req = new NextRequest("http://localhost:3000/api/auth/2fa/verify-login", {
                method: "POST",
                body: JSON.stringify({ userId: PROTECTED_USER, otp: "12ab" }),
            });
            const res = await verifyLoginPost(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.fieldErrors.otp).toMatch(/6-digit/);
            expect(mockVerifyOTP).not.toHaveBeenCalled();
        });

        it("refuses to issue a verified cookie for another user", async () => {
            mockRequireAuthenticatedUser.mockResolvedValue({ userId: UNPROTECTED_USER, userRole: "tenant" });
            const req = new NextRequest("http://localhost:3000/api/auth/2fa/verify-login", {
                method: "POST",
                body: JSON.stringify({ userId: PROTECTED_USER, otp: "123456" }),
            });
            const res = await verifyLoginPost(req);
            expect(res.status).toBe(403);
            expect(res.cookies.get("ireside_2fa_verified")).toBeUndefined();
        });

        it("returns required: false when user has 2FA disabled", async () => {
            mockRequireAuthenticatedUser.mockResolvedValue({ userId: UNPROTECTED_USER, userRole: "tenant" });
            mockGetStatus.mockResolvedValue({
                enabled: false,
                email: null,
                userEmail: "user@example.com",
            });

            const req = new NextRequest("http://localhost:3000/api/auth/2fa/challenge", {
                method: "POST",
                body: JSON.stringify({ userId: "8f9a6c2e-1b3d-4e5f-9a7b-2c3d4e5f6a7b" }),
            });

            const res = await challengePost(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.required).toBe(false);
            expect(res.cookies.get("ireside_2fa_pending")).toBeUndefined();
        });

        it("returns required: true, sends OTP, and sets ireside_2fa_pending cookie when 2FA is active", async () => {
            mockGetStatus.mockResolvedValue({
                enabled: true,
                email: "user@example.com",
                userEmail: "user@example.com",
            });
            mockSendOTP.mockResolvedValue({
                success: true,
                email: "us***r@example.com",
            });

            const req = new NextRequest("http://localhost:3000/api/auth/2fa/challenge", {
                method: "POST",
                body: JSON.stringify({ userId: "3e4f5a6b-7c8d-4e9f-8a1b-2c3d4e5f6a7c" }),
            });

            const res = await challengePost(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.required).toBe(true);
            expect(data.email).toBe("us***r@example.com");

            const pendingCookie = res.cookies.get("ireside_2fa_pending");
            expect(pendingCookie).toBeDefined();
            expect(pendingCookie?.value).toBe("true");

            const verifiedCookie = res.cookies.get("ireside_2fa_verified");
            expect(verifiedCookie?.value).toBe("");
        });

        it("verifies login OTP, clears pending cookie, and sets verified cookie on success", async () => {
            mockVerifyOTP.mockResolvedValue({
                success: true,
                message: "Verification successful",
            });

            const req = new NextRequest("http://localhost:3000/api/auth/2fa/verify-login", {
                method: "POST",
                body: JSON.stringify({ userId: "3e4f5a6b-7c8d-4e9f-8a1b-2c3d4e5f6a7c", otp: "123456" }),
            });

            const res = await verifyLoginPost(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);

            // Verified cookie removal
            const pendingCookie = res.cookies.get("ireside_2fa_pending");
            expect(pendingCookie?.value).toBe("");

            // Verified 2FA session cookie issuance
            const verifiedCookie = res.cookies.get("ireside_2fa_verified");
            expect(verifiedCookie?.value).toBe("3e4f5a6b-7c8d-4e9f-8a1b-2c3d4e5f6a7c");
        });

        it("returns error and 400 status when login OTP verification fails", async () => {
            mockVerifyOTP.mockResolvedValue({
                success: false,
                error: "Invalid verification code. 4 attempts remaining.",
                code: "INVALID_CODE",
                remainingAttempts: 4,
            });

            const req = new NextRequest("http://localhost:3000/api/auth/2fa/verify-login", {
                method: "POST",
                body: JSON.stringify({ userId: "3e4f5a6b-7c8d-4e9f-8a1b-2c3d4e5f6a7c", otp: "000000" }),
            });

            const res = await verifyLoginPost(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain("Invalid verification code");
            expect(data.remainingAttempts).toBe(4);
        });

        it("clears pending and verified cookies on challenge cancel", async () => {
            const req = new NextRequest("http://localhost:3000/api/auth/2fa/cancel", {
                method: "POST",
                body: JSON.stringify({ userId: "3e4f5a6b-7c8d-4e9f-8a1b-2c3d4e5f6a7c" }),
            });

            const res = await cancelPost(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);

            const pendingCookie = res.cookies.get("ireside_2fa_pending");
            expect(pendingCookie?.value).toBe("");

            const verifiedCookie = res.cookies.get("ireside_2fa_verified");
            expect(verifiedCookie?.value).toBe("");
        });
    });
});
