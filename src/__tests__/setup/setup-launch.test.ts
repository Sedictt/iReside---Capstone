import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/api/auth-guard", () => ({
  requireAuthenticatedUser: (...args: any[]) => mockRequireAuthenticatedUser(...args),
}));

const mockUpdateUserById = vi.fn().mockResolvedValue({ data: { user: {} }, error: null });
const mockAdminFrom = vi.fn();

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

import { POST as setupLaunchPost } from "@/app/api/setup/launch/route";

describe("POST /api/setup/launch (Turnkey Setup Claiming & Locking)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      return {};
    });

    const req = new NextRequest("http://localhost:3000/api/setup/launch", {
      method: "POST",
      body: JSON.stringify({
        branding: {
          propertyName: "Reyes Residences",
          propertyTagline: "Premium Student Living",
          rentalArchetype: "dormitory",
          primaryColor: "#8b5cf6",
          secondaryColor: "#06b6d4",
          propertyAddress: "Karuhatan, Valenzuela",
        },
        admin: {
          fullName: "Roberto Reyes",
          email: "roberto@reyesresidences.ph",
          password: "MySecurePassword2026!",
          phone: "0917-123-4567",
        },
      }),
    });

    const res = await setupLaunchPost(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.branding.setupCompleted).toBe(true);
    expect(json.branding.propertyName).toBe("Reyes Residences");

    // Verify auth credential updating was invoked with personal password
    expect(mockUpdateUserById).toHaveBeenCalledWith(
      "landlord-turnkey-1",
      expect.objectContaining({
        password: "MySecurePassword2026!",
        email: "roberto@reyesresidences.ph",
      })
    );

    // Verify profile updating
    expect(mockProfilesChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Roberto Reyes",
        phone: "0917-123-4567",
        business_name: "Reyes Residences",
      })
    );
  });
});
