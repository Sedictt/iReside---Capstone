import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "../user.service";
import { UserNotFoundError } from "../user.errors";

function createMockSupabase() {
  const tableChains: Record<string, any> = {};

  function getTableChain(tableName: string) {
    if (!tableChains[tableName]) {
      const chain: Record<string, any> = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.update = vi.fn().mockReturnValue(chain);
      chain.delete = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.in = vi.fn().mockReturnValue(chain);
      chain.order = vi.fn().mockReturnValue(chain);
      chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
      chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      tableChains[tableName] = chain;
    }
    return tableChains[tableName];
  }

  const mockSupabase = {
    from: vi.fn((tableName: string) => getTableChain(tableName)),
  };

  return { mockSupabase: mockSupabase as any, getTableChain };
}

describe("UserService", () => {
  let service: UserService;
  let mockSupabase: any;
  let getTableChain: (tableName: string) => any;

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.mockSupabase;
    getTableChain = mocks.getTableChain;
    service = new UserService(mockSupabase);
  });

  describe("getProfile", () => {
    it("returns profile for existing user", async () => {
      const mockProfile = {
        id: "user-1",
        full_name: "Juan Dela Cruz",
        email: "juan@example.com",
        role: "tenant",
      };

      const chain = getTableChain("profiles");
      chain.maybeSingle.mockResolvedValue({ data: mockProfile, error: null });

      const result = await service.getProfile("user-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
      expect(chain.eq).toHaveBeenCalledWith("id", "user-1");
      expect(result).toEqual(mockProfile);
    });

    it("returns null when profile is not found", async () => {
      const chain = getTableChain("profiles");
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await service.getProfile("missing-user");
      expect(result).toBeNull();
    });
  });

  describe("updateProfile", () => {
    it("updates and returns updated profile", async () => {
      const updatedMock = {
        id: "user-1",
        full_name: "Juan Updated",
        phone: "+639170000000",
      };

      const chain = getTableChain("profiles");
      chain.single.mockResolvedValue({ data: updatedMock, error: null });

      const result = await service.updateProfile("user-1", {
        fullName: "Juan Updated",
        phone: "+639170000000",
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
      expect(chain.update).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith("id", "user-1");
      expect(result).toEqual(updatedMock);
    });
  });

  describe("listUsersForAdmin", () => {
    it("returns profiles with joined product tour state for tenants", async () => {
      const mockProfiles = [
        { id: "tenant-1", full_name: "Tenant One", email: "t1@ex.com", role: "tenant", avatar_url: null, created_at: "2026-08-01" },
        { id: "landlord-1", full_name: "Landlord One", email: "l1@ex.com", role: "landlord", avatar_url: null, created_at: "2026-08-02" },
      ];

      const mockTourRows = [
        { tenant_id: "tenant-1", status: "completed", started_at: "2026-08-01", completed_at: "2026-08-01", last_event_at: "2026-08-01" },
      ];

      const profileChain = getTableChain("profiles");
      const tourChain = getTableChain("tenant_product_tour_states");

      profileChain.order.mockResolvedValue({ data: mockProfiles, error: null });
      tourChain.in.mockResolvedValue({ data: mockTourRows, error: null });

      const result = await service.listUsersForAdmin();

      expect(result).toHaveLength(2);
      expect(result[0].productTourSummary?.status).toBe("completed");
      expect(result[1].productTourSummary).toBeNull();
    });
  });

  describe("getUserDetailForAdmin", () => {
    it("returns profile and landlord application for landlord role", async () => {
      const mockProfile = { id: "landlord-1", full_name: "Landlord One", role: "landlord" };
      const mockApp = { id: "app-1", profile_id: "landlord-1", status: "approved" };

      const profileChain = getTableChain("profiles");
      const appChain = getTableChain("landlord_applications");

      profileChain.maybeSingle.mockResolvedValue({ data: mockProfile, error: null });
      appChain.maybeSingle.mockResolvedValue({ data: mockApp, error: null });

      const result = await service.getUserDetailForAdmin("landlord-1");

      expect(result.profile).toEqual(mockProfile);
      expect(result.application).toEqual(mockApp);
    });

    it("throws UserNotFoundError if profile does not exist", async () => {
      const profileChain = getTableChain("profiles");
      profileChain.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(service.getUserDetailForAdmin("missing-user")).rejects.toBeInstanceOf(
        UserNotFoundError,
      );
    });
  });
});
