import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/landlord/flyer-template/route";
import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";

vi.mock("@/lib/api/auth-guard", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

describe("Flyer Template API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns saved template from user metadata on GET", async () => {
    const mockUser = {
      id: "user-123",
      user_metadata: {
        flyer_templates: {
          default: {
            propertyName: "Valenzuela Grand Residences",
            brandColor: "#8b5cf6",
          },
        },
      },
    };

    (requireAuthenticatedUser as any).mockResolvedValue({
      userId: "user-123",
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      },
    });

    const req = new NextRequest("http://localhost:3000/api/landlord/flyer-template?propertyId=default");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.template.propertyName).toBe("Valenzuela Grand Residences");
  });

  it("updates and saves template on POST", async () => {
    const mockUser = {
      id: "user-123",
      user_metadata: {},
    };

    const mockUpdateUser = vi.fn().mockResolvedValue({ data: {}, error: null });

    (requireAuthenticatedUser as any).mockResolvedValue({
      userId: "user-123",
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
          updateUser: mockUpdateUser,
        },
      },
    });

    const req = new NextRequest("http://localhost:3000/api/landlord/flyer-template", {
      method: "POST",
      body: JSON.stringify({
        propertyId: "default",
        template: {
          propertyName: "Reyes Residences",
          brandColor: "#10b981",
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalled();
  });

  it("returns 400 when template is missing on POST", async () => {
    (requireAuthenticatedUser as any).mockResolvedValue({
      userId: "user-123",
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
        },
      },
    });

    const req = new NextRequest("http://localhost:3000/api/landlord/flyer-template", {
      method: "POST",
      body: JSON.stringify({
        propertyId: "default",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
