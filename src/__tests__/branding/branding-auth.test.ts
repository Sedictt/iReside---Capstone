import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock auth-guard
const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/api/auth-guard", () => ({
  requireAuthenticatedUser: (...args: any[]) => mockRequireAuthenticatedUser(...args),
}));

// Mock admin client
const mockAdminFrom = vi.fn();
const mockAdminStorage = {
  getBucket: vi.fn().mockResolvedValue({ data: { name: "brand-logos" }, error: null }),
  createBucket: vi.fn().mockResolvedValue({ data: null, error: null }),
  from: vi.fn().mockReturnValue({
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/logo.png" } }),
  }),
};

vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleSupabaseClient: () => ({
    from: mockAdminFrom,
    storage: mockAdminStorage,
  }),
}));

import { POST as brandingPost } from "@/app/api/branding/route";
import { POST as logoPost } from "@/app/api/branding/logo/route";

describe("Brand Personalization Auth Guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/branding", () => {
    it("rejects tenant user with 403 Forbidden", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "tenant-user-123",
        userEmail: "tenant@example.com",
        userRole: "tenant",
        supabase: {},
      });

      const req = new NextRequest("http://localhost:3000/api/branding", {
        method: "POST",
        body: JSON.stringify({
          propertyName: "Tenant Renamed Property",
        }),
      });

      const res = await brandingPost(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.error).toContain("Forbidden");
    });

    it("allows landlord user to update branding", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-user-456",
        userEmail: "landlord@example.com",
        userRole: "landlord",
        supabase: {},
      });

      const mockPropertyQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "prop-1", map_decorations: {}, images: [] },
          error: null,
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };

      mockAdminFrom.mockReturnValue(mockPropertyQuery);

      const req = new NextRequest("http://localhost:3000/api/branding", {
        method: "POST",
        body: JSON.stringify({
          propertyName: "Skyline Towers",
          primaryColor: "#7c3aed",
        }),
      });

      const res = await brandingPost(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.propertyName).toBe("Skyline Towers");
      expect(json.primaryColor).toBe("#7c3aed");
    });

    it("allows admin user to update branding", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "admin-user-789",
        userEmail: "admin@example.com",
        userRole: "admin",
        supabase: {},
      });

      const mockPropertyQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "prop-1", map_decorations: {}, images: [] },
          error: null,
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };

      mockAdminFrom.mockReturnValue(mockPropertyQuery);

      const req = new NextRequest("http://localhost:3000/api/branding", {
        method: "POST",
        body: JSON.stringify({
          propertyName: "Admin Managed Estates",
        }),
      });

      const res = await brandingPost(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.propertyName).toBe("Admin Managed Estates");
    });
  });

  describe("POST /api/branding/logo", () => {
    it("rejects tenant user with 403 Forbidden", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "tenant-user-123",
        userEmail: "tenant@example.com",
        userRole: "tenant",
        supabase: {},
      });

      const formData = new FormData();
      const fakeFile = new File(["fake-image-bytes"], "logo.png", { type: "image/png" });
      formData.append("file", fakeFile);

      const req = new Request("http://localhost:3000/api/branding/logo", {
        method: "POST",
        body: formData,
      });

      const res = await logoPost(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.error).toContain("Forbidden");
    });

    it("allows landlord user to upload logo", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-user-456",
        userEmail: "landlord@example.com",
        userRole: "landlord",
        supabase: {},
      });

      const formData = new FormData();
      const fakeFile = new File(["fake-image-bytes"], "logo.png", { type: "image/png" });
      formData.append("file", fakeFile);

      const req = new Request("http://localhost:3000/api/branding/logo", {
        method: "POST",
        body: formData,
      });

      const res = await logoPost(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.logoUrl).toBe("https://example.com/logo.png");
    });
  });
});
