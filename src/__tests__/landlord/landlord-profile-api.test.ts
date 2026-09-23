import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockRequireAuthenticatedUser = vi.fn();
const mockRequireRole = vi.fn();
const mockAdminFrom = vi.fn();
const mockUpdateUserById = vi.fn();

vi.mock("@/lib/api/auth-guard", () => ({
  requireAuthenticatedUser: (...args: unknown[]) => mockRequireAuthenticatedUser(...args),
  requireRole: (...args: unknown[]) => mockRequireRole(...args),
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

import { GET, PATCH } from "../../app/api/landlord/profile/route";

describe("Landlord Profile API (/api/landlord/profile)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockReturnValue(undefined);
    mockUpdateUserById.mockResolvedValue({ data: { user: {} }, error: null });
  });

  describe("GET /api/landlord/profile", () => {
    it("returns profile and self-heals stale seed email with authenticated user email", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-user-1",
        userEmail: "real.owner@customdomain.ph",
        userRole: "landlord",
      });

      const mockProfilesUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "landlord-user-1",
                    email: "practice.landlord1@ireside.ph", // Stale seed email in DB
                    full_name: "Original Landlord",
                    business_name: "Original Property",
                    socials: {},
                  },
                  error: null,
                }),
              }),
            }),
            update: mockProfilesUpdate,
          };
        }
        if (table === "profile_private" || table === "landlord_business_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const req = new NextRequest("http://localhost:3000/api/landlord/profile", {
        method: "GET",
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      // Profile email should be self-healed to the authenticated email
      expect(json.profile.email).toBe("real.owner@customdomain.ph");

      // Database should have been updated with the authenticated email
      expect(mockProfilesUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "real.owner@customdomain.ph",
        })
      );
    });

    it("does not update database if profile email already matches authenticated email", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-user-1",
        userEmail: "matching.owner@customdomain.ph",
        userRole: "landlord",
      });

      const mockProfilesUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "landlord-user-1",
                    email: "matching.owner@customdomain.ph",
                    full_name: "Matching Landlord",
                    business_name: "Matching Property",
                    socials: {},
                  },
                  error: null,
                }),
              }),
            }),
            update: mockProfilesUpdate,
          };
        }
        if (table === "profile_private" || table === "landlord_business_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const req = new NextRequest("http://localhost:3000/api/landlord/profile", {
        method: "GET",
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.profile.email).toBe("matching.owner@customdomain.ph");
      expect(mockProfilesUpdate).not.toHaveBeenCalled();
    });
  });

  describe("PATCH /api/landlord/profile", () => {
    it("updates email in both profiles table and Supabase Auth credentials", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-user-1",
        userEmail: "old.email@domain.com",
        userRole: "landlord",
      });

      const mockProfilesUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "landlord-user-1",
                email: "new.owner@customdomain.ph",
                full_name: "Juan Dela Cruz",
                business_name: "Dela Cruz Suites",
                phone: "0917-123-4567",
              },
              error: null,
            }),
          }),
        }),
      });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "landlord-user-1",
                    email: "old.email@domain.com",
                    full_name: "Juan Dela Cruz",
                    socials: {},
                  },
                  error: null,
                }),
              }),
            }),
            update: mockProfilesUpdate,
          };
        }
        if (table === "profile_private" || table === "landlord_business_profiles") {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const req = new NextRequest("http://localhost:3000/api/landlord/profile", {
        method: "PATCH",
        body: JSON.stringify({
          full_name: "Juan Dela Cruz",
          email: "new.owner@customdomain.ph",
          business_name: "Dela Cruz Suites",
          phone: "0917-123-4567",
        }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.profile.email).toBe("new.owner@customdomain.ph");

      // Verify profiles update received normalized email
      expect(mockProfilesUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "new.owner@customdomain.ph",
          full_name: "Juan Dela Cruz",
          business_name: "Dela Cruz Suites",
        })
      );

      // Verify admin auth updateUserById was called to sync Supabase Auth
      expect(mockUpdateUserById).toHaveBeenCalledWith(
        "landlord-user-1",
        expect.objectContaining({
          email: "new.owner@customdomain.ph",
          email_confirm: true,
        })
      );
    });
  });
});
