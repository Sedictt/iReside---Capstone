import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockRequireAuthenticatedUser = vi.fn();
const mockAdminFrom = vi.fn();
const mockUpdateUserById = vi.fn();
const mockSendEmailVerificationOTP = vi.fn();

vi.mock("@/lib/api/auth-guard", () => ({
  requireAuthenticatedUser: (...args: unknown[]) => mockRequireAuthenticatedUser(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleSupabaseClient: () => ({
    auth: {
      admin: {
        updateUserById: mockUpdateUserById,
      },
    },
    from: mockAdminFrom,
  }),
}));

vi.mock("@/lib/email", () => ({
  sendEmailVerificationOTP: (...args: unknown[]) => mockSendEmailVerificationOTP(...args),
}));

vi.mock("@/lib/audit/audit-logger", () => ({
  logUserActivity: vi.fn().mockResolvedValue(true),
}));

import { POST as sendOtpPost } from "../../app/api/setup/email/send-otp/route";
import { POST as verifyOtpPost } from "../../app/api/setup/email/verify-otp/route";

describe("Email Verification OTP Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmailVerificationOTP.mockResolvedValue({ success: true });
    mockUpdateUserById.mockResolvedValue({ data: { user: {} }, error: null });
  });

  describe("POST /api/setup/email/send-otp", () => {
    it("rejects non-landlord callers with 403 Forbidden", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "tenant-123",
        userRole: "tenant",
      });

      const req = new NextRequest("http://localhost:3000/api/setup/email/send-otp", {
        method: "POST",
        body: JSON.stringify({ newEmail: "newemail@domain.com" }),
      });

      const res = await sendOtpPost(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Forbidden");
    });

    it("rejects invalid email addresses", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-1",
        userRole: "landlord",
      });

      const req = new NextRequest("http://localhost:3000/api/setup/email/send-otp", {
        method: "POST",
        body: JSON.stringify({ newEmail: "invalid-email" }),
      });

      const res = await sendOtpPost(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("valid email");
    });

    it("generates 6-digit OTP, saves in user_security_settings, and sends email", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-1",
        userRole: "landlord",
      });

      // Mock profiles check (no duplicate)
      mockAdminFrom.mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: () => ({
              ilike: () => ({
                neq: () => ({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "user_security_settings") {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      });

      const req = new NextRequest("http://localhost:3000/api/setup/email/send-otp", {
        method: "POST",
        body: JSON.stringify({ newEmail: "landlord@example.com" }),
      });

      const res = await sendOtpPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(mockSendEmailVerificationOTP).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "landlord@example.com",
          otp: expect.stringMatching(/^\d{6}$/),
        })
      );
    });
  });

  describe("POST /api/setup/email/verify-otp", () => {
    it("rejects non-landlord callers with 403 Forbidden", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "tenant-123",
        userRole: "tenant",
      });

      const req = new NextRequest("http://localhost:3000/api/setup/email/verify-otp", {
        method: "POST",
        body: JSON.stringify({ newEmail: "new@domain.com", otp: "123456" }),
      });

      const res = await verifyOtpPost(req);
      expect(res.status).toBe(403);
    });

    it("verifies OTP successfully and updates Supabase auth and profiles", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-1",
        userRole: "landlord",
      });

      const validFuture = new Date(Date.now() + 600000).toISOString();

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === "user_security_settings") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    otp_code: "654321",
                    otp_expiry: validFuture,
                    two_factor_email: "verified@example.com",
                  },
                  error: null,
                }),
              }),
            }),
            update: () => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            update: () => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      });

      const req = new NextRequest("http://localhost:3000/api/setup/email/verify-otp", {
        method: "POST",
        body: JSON.stringify({ newEmail: "verified@example.com", otp: "654321" }),
      });

      const res = await verifyOtpPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(mockUpdateUserById).toHaveBeenCalledWith("landlord-1", {
        email: "verified@example.com",
        email_confirm: true,
      });
    });

    it("validates OTP without consuming it when validateOnly is true", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-1",
        userRole: "landlord",
      });

      const validFuture = new Date(Date.now() + 600000).toISOString();

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === "user_security_settings") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    otp_code: "654321",
                    otp_expiry: validFuture,
                    two_factor_email: "verified@example.com",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const req = new NextRequest("http://localhost:3000/api/setup/email/verify-otp", {
        method: "POST",
        body: JSON.stringify({ newEmail: "verified@example.com", otp: "654321", validateOnly: true }),
      });

      const res = await verifyOtpPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.valid).toBe(true);
      // Ensure updateUserById was NOT called in validateOnly mode
      expect(mockUpdateUserById).not.toHaveBeenCalled();
    });

    it("rejects invalid or expired OTP", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-1",
        userRole: "landlord",
      });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === "user_security_settings") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    otp_code: "654321",
                    otp_expiry: new Date(Date.now() - 1000).toISOString(), // expired
                    two_factor_email: "verified@example.com",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const req = new NextRequest("http://localhost:3000/api/setup/email/verify-otp", {
        method: "POST",
        body: JSON.stringify({ newEmail: "verified@example.com", otp: "654321" }),
      });

      const res = await verifyOtpPost(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("expired");
    });
  });
});
