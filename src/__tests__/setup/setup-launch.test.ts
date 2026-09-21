import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockRequireAuthenticatedUser = vi.fn();
const mockAdminFrom = vi.fn();
const mockUpdateUserById = vi.fn();

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

import { POST as setupLaunchPost } from "../../app/api/setup/launch/route";

describe("POST /api/setup/launch (Turnkey Setup Claiming & Locking)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateUserById.mockResolvedValue({ data: { user: {} }, error: null });
  });

  it("rejects unauthorized or tenant callers with 403 Forbidden", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      userId: "tenant-123",
      userRole: "tenant",
    });

    const req = new NextRequest("http://localhost:3000/api/setup/launch", {
      method: "POST",
      body: JSON.stringify({
        branding: { propertyName: "Hacked Property" },
        admin: { fullName: "Tenant Admin" },
      }),
    });

    const res = await setupLaunchPost(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Forbidden");
  });

  it("allows landlord to claim account and launch setup with completion flag", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      userId: "landlord-turnkey-1",
      userRole: "landlord",
    });

    // Mock profiles update
    const mockProfilesChain = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    };

    // Mock properties query (existing property)
    const mockPropertyQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "prop-turnkey-1", map_decorations: {} },
        error: null,
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    };

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "profiles") return mockProfilesChain;
      if (table === "properties") return mockPropertyQuery;
      if (table === "landlord_business_profiles" || table === "user_security_settings") {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === "user_audit_logs") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    });

    const req = new NextRequest("http://localhost:3000/api/setup/launch", {
      method: "POST",
      body: JSON.stringify({
        branding: {
          propertyName: "Pinecrest Residences",
          propertyTagline: "Modern student living close to campus",
          rentalArchetype: "dormitory",
          primaryColor: "#8b5cf6",
          secondaryColor: "#06b6d4",
          propertyAddress: "Karuhatan, Valenzuela",
        },
        admin: {
          fullName: "Juan Dela Cruz",
          email: "juan@pinecrestsuites.ph",
          password: "MySecurePassword2026!",
          phone: "0918-123-4567",
        },
      }),
    });

    const res = await setupLaunchPost(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.branding.setupCompleted).toBe(true);
    expect(json.branding.propertyName).toBe("Pinecrest Residences");

    // Verify auth credential updating was invoked with personal password
    expect(mockUpdateUserById).toHaveBeenCalledWith(
      "landlord-turnkey-1",
      expect.objectContaining({
        password: "MySecurePassword2026!",
        email: "juan@pinecrestsuites.ph",
      })
    );

    // Verify profile updating
    expect(mockProfilesChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Juan Dela Cruz",
        phone: "0918-123-4567",
        business_name: "Pinecrest Residences",
      })
    );
  });

  it("rejects invalid branding and admin inputs with 400 Bad Request and validation details", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      userId: "landlord-turnkey-1",
      userRole: "landlord",
    });

    const req = new NextRequest("http://localhost:3000/api/setup/launch", {
      method: "POST",
      body: JSON.stringify({
        branding: {
          propertyName: "", // invalid: empty
          rentalArchetype: "castle", // invalid archetype
          primaryColor: "not-hex", // invalid hex
          secondaryColor: "#12345", // invalid 5 digits
          propertyAddress: "ab", // invalid: under 3 characters
          totalUnits: -5, // invalid negative units
        },
        admin: {
          fullName: "12345", // invalid legal name
          email: "not-an-email", // invalid email
        },
      }),
    });

    const res = await setupLaunchPost(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain("Validation failed");
    expect(json.details).toBeDefined();
    expect(json.details["branding.propertyName"]).toBeDefined();
    expect(json.details["branding.rentalArchetype"]).toBeDefined();
    expect(json.details["branding.primaryColor"]).toBeDefined();
    expect(json.details["branding.totalUnits"]).toBeDefined();
    expect(json.details["branding.propertyAddress"]).toBeDefined();
    expect(json.details["admin.fullName"]).toBeDefined();
    expect(json.details["admin.email"]).toBeDefined();
  });
});

