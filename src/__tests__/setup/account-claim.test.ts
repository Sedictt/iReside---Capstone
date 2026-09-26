import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockRequireAuthenticatedUser = vi.fn();
const mockAdminFrom = vi.fn();
const mockUpdateUserById = vi.fn();
const mockLogUserActivity = vi.fn();

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

vi.mock("@/lib/audit/audit-logger", () => ({
  logUserActivity: (...args: unknown[]) => mockLogUserActivity(...args),
}));

import { POST as accountClaimPost } from "../../app/api/setup/account/claim/route";

describe("POST /api/setup/account/claim (Account Claiming & Initial Credential Setup)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateUserById.mockResolvedValue({ data: { user: {} }, error: null });
    mockLogUserActivity.mockResolvedValue(undefined);
  });

  it("rejects unauthorized callers or tenants with 403 Forbidden", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      userId: "tenant-user-1",
      userRole: "tenant",
      userEmail: "tenant@example.com",
    });

    const req = new NextRequest("http://localhost:3000/api/setup/account/claim", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Tenant Attempt",
        newEmail: "tenant@ireside.ph",
        otp: "123456",
        newPassword: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      }),
    });

    const res = await accountClaimPost(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Forbidden");
  });

  it("rejects invalid input schema (short password, invalid email, mismatched confirmation)", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      userId: "landlord-seed-1",
      userRole: "landlord",
      userEmail: "admin@turnkey.local",
    });

    const req = new NextRequest("http://localhost:3000/api/setup/account/claim", {
      method: "POST",
      body: JSON.stringify({
        fullName: "J", // too short
        newEmail: "invalid-email",
        otp: "123", // not 6 digits
        newPassword: "short",
        confirmPassword: "mismatch",
      }),
    });

    const res = await accountClaimPost(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("rejects dummy pre-seeded email or name placeholders", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      userId: "landlord-seed-1",
      userRole: "landlord",
      userEmail: "admin@turnkey.local",
    });

    const req = new NextRequest("http://localhost:3000/api/setup/account/claim", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Turnkey Landlord", // disallowed placeholder name
        newEmail: "admin@turnkey.local", // disallowed placeholder email
        otp: "123456",
        newPassword: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      }),
    });

    const res = await accountClaimPost(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("sample placeholder");
  });

  it("rejects when OTP is incorrect or expired", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      userId: "landlord-seed-1",
      userRole: "landlord",
      userEmail: "admin@turnkey.local",
    });

    // Mock security settings returning wrong OTP
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "user_security_settings") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              otp_code: "999999",
              otp_expiry: new Date(Date.now() + 600000).toISOString(),
              two_factor_email: "landlord@realdomain.com",
            },
            error: null,
          }),
        };
      }
      return {};
    });

    const req = new NextRequest("http://localhost:3000/api/setup/account/claim", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Maria Clara",
        newEmail: "landlord@realdomain.com",
        otp: "123456",
        newPassword: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      }),
    });

    const res = await accountClaimPost(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Incorrect verification code");
  });

  it("rejects when email is already taken by another registered user with 409", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      userId: "landlord-seed-1",
      userRole: "landlord",
      userEmail: "admin@turnkey.local",
    });

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "user_security_settings") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              otp_code: "654321",
              otp_expiry: new Date(Date.now() + 600000).toISOString(),
              two_factor_email: "existing@example.com",
            },
            error: null,
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: "other-user-99" },
            error: null,
          }),
        };
      }
      return {};
    });

    const req = new NextRequest("http://localhost:3000/api/setup/account/claim", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Maria Clara",
        newEmail: "existing@example.com",
        otp: "654321",
        newPassword: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      }),
    });

    const res = await accountClaimPost(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("already linked to another account");
  });

  it("successfully verifies OTP, updates auth credentials, updates profile, and marks account claimed", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      userId: "landlord-seed-1",
      userRole: "landlord",
      userEmail: "admin@turnkey.local",
    });

    const mockProfileUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockSecuritySettingsUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const mockSecuritySettingsUpsert = vi.fn().mockResolvedValue({ error: null });

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "user_security_settings") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              otp_code: "112233",
              otp_expiry: new Date(Date.now() + 600000).toISOString(),
              two_factor_email: "maria.clara@realdomain.com",
            },
            error: null,
          }),
          update: mockSecuritySettingsUpdate,
          upsert: mockSecuritySettingsUpsert,
        };
      }
      if (table === "profiles") {
        let queryFields = "";
        return {
          select: vi.fn().mockImplementation((fields: string) => {
            queryFields = fields;
            return {
              eq: vi.fn().mockReturnThis(),
              ilike: vi.fn().mockReturnThis(),
              neq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockImplementation(async () => {
                if (queryFields === "phone") {
                  return { data: { phone: "0917-882-9912" }, error: null };
                }
                return { data: null, error: null };
              }),
            };
          }),
          update: mockProfileUpdate,
        };
      }
      if (table === "profile_private") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { phone: "0917-882-9912" },
            error: null,
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {};
    });

    const req = new NextRequest("http://localhost:3000/api/setup/account/claim", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Maria Clara",
        newEmail: "maria.clara@realdomain.com",
        otp: "112233",
        newPassword: "SuperSecurePassword2026!",
        confirmPassword: "SuperSecurePassword2026!",
      }),
    });

    const res = await accountClaimPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.email).toBe("maria.clara@realdomain.com");
    expect(json.securityKey).toBeDefined();
    expect(typeof json.securityKey).toBe("string");

    // Verify auth.admin.updateUserById called with confirmed email and new password
    expect(mockUpdateUserById).toHaveBeenCalledWith(
      "landlord-seed-1",
      expect.objectContaining({
        email: "maria.clara@realdomain.com",
        password: "SuperSecurePassword2026!",
        email_confirm: true,
        user_metadata: expect.objectContaining({
          role: "landlord",
          is_account_claimed: true,
          is_setup_completed: false,
          full_name: "Maria Clara",
        }),
      })
    );

    // Verify profiles table updated with pre-seeded phone cleared to null
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "maria.clara@realdomain.com",
        full_name: "Maria Clara",
        phone: null,
        has_changed_password: true,
      })
    );

    // Verify security settings upserted with encrypted security key and cleared OTP
    expect(mockSecuritySettingsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        has_changed_password: true,
        otp_code: null,
        otp_expiry: null,
        two_factor_email: null,
        security_key_encrypted: expect.any(String),
        security_key_iv: expect.any(String),
        security_key_auth_tag: expect.any(String),
      }),
      { onConflict: "profile_id" }
    );

    // Verify audit log recorded
    expect(mockLogUserActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "account_claimed",
        category: "security",
      })
    );
  });
});
