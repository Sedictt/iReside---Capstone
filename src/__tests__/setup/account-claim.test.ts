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

  it("rejects dummy pre-seeded mobile number or invalid phone format", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      userId: "landlord-seed-1",
      userRole: "landlord",
      userEmail: "admin@turnkey.local",
    });

    // 1. Pre-seeded phone number
    const reqPreseeded = new NextRequest("http://localhost:3000/api/setup/account/claim", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Maria Clara",
        newEmail: "maria.clara@realdomain.com",
        phone: "0917-888-1234",
        otp: "123456",
        newPassword: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      }),
    });
    const resPreseeded = await accountClaimPost(reqPreseeded);
    expect(resPreseeded.status).toBe(400);
    const jsonPreseeded = await resPreseeded.json();
    expect(jsonPreseeded.error).toContain("sample placeholder");

    // 2. Invalid phone format (Philippine mobile starting with 09 must be 11 digits)
    const reqInvalid = new NextRequest("http://localhost:3000/api/setup/account/claim", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Maria Clara",
        newEmail: "maria.clara@realdomain.com",
        phone: "091234567", // starts with 09 but only 9 digits
        otp: "123456",
        newPassword: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      }),
    });
    const resInvalid = await accountClaimPost(reqInvalid);
    expect(resInvalid.status).toBe(400);
    const jsonInvalid = await resInvalid.json();
    expect(jsonInvalid.error).toContain("Philippine mobile numbers starting with 09 must be 11 digits");
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

    const mockProfilePrivateUpsert = vi.fn().mockResolvedValue({ error: null });

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
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
          update: mockProfileUpdate,
        };
      }
      if (table === "profile_private") {
        return {
          upsert: mockProfilePrivateUpsert,
        };
      }
      return {};
    });

    const req = new NextRequest("http://localhost:3000/api/setup/account/claim", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Maria Clara",
        newEmail: "maria.clara@realdomain.com",
        phone: "09171234567",
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

    // Verify auth.admin.updateUserById called with confirmed email, phone and new password
    expect(mockUpdateUserById).toHaveBeenCalledWith(
      "landlord-seed-1",
      expect.objectContaining({
        email: "maria.clara@realdomain.com",
        password: "SuperSecurePassword2026!",
        email_confirm: true,
        user_metadata: expect.objectContaining({
          is_account_claimed: true,
          full_name: "Maria Clara",
          phone: "09171234567",
        }),
      })
    );

    // Verify profiles table updated with is_account_claimed: true and phone
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "maria.clara@realdomain.com",
        full_name: "Maria Clara",
        phone: "09171234567",
        is_account_claimed: true,
        has_changed_password: true,
      })
    );

    // Verify profile_private updated with phone
    expect(mockProfilePrivateUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        profile_id: "landlord-seed-1",
        phone: "09171234567",
      }),
      { onConflict: "profile_id" }
    );

    // Verify security settings cleared OTP
    expect(mockSecuritySettingsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        has_changed_password: true,
        otp_code: null,
        otp_expiry: null,
        two_factor_email: null,
      })
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
