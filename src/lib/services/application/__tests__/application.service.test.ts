import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationService } from "../application.service";
import {
  ApplicationNotFoundError,
  ApplicationValidationError,
  InvalidApplicationStateError,
} from "../application.errors";

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
      chain.limit = vi.fn().mockReturnValue(chain);
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

describe("ApplicationService", () => {
  let service: ApplicationService;
  let mockSupabase: any;
  let getTableChain: (tableName: string) => any;

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.mockSupabase;
    getTableChain = mocks.getTableChain;
    service = new ApplicationService(mockSupabase);
  });

  describe("getLandlordApplications", () => {
    it("returns empty array if landlord has no applications", async () => {
      const appChain = getTableChain("applications");
      appChain.order.mockResolvedValue({ data: [], error: null });

      const result = await service.getLandlordApplications("landlord-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("applications");
      expect(appChain.eq).toHaveBeenCalledWith("landlord_id", "landlord-1");
      expect(result).toEqual([]);
    });

    it("enriches application rows with related units and applicant profiles", async () => {
      const mockAppRow = {
        id: "app-1",
        landlord_id: "landlord-1",
        unit_id: "unit-1",
        applicant_id: "tenant-1",
        lease_id: null,
        status: "pending",
        message: "Looking forward to moving in",
        created_at: "2026-08-01T10:00:00Z",
        documents: [],
        application_source: "walk_in_application",
      };

      const mockUnit = {
        id: "unit-1",
        name: "Unit 101",
        rent_amount: 15000,
        property_id: "prop-1",
        property: { id: "prop-1", name: "Green Residences", contract_template: null, images: ["img.jpg"] },
      };

      const mockProfile = {
        id: "tenant-1",
        full_name: "Juan Dela Cruz",
        email: "juan@example.com",
        phone: "+639171234567",
        avatar_url: null,
        avatar_bg_color: "#333",
      };

      const appChain = getTableChain("applications");
      const unitChain = getTableChain("units");
      const profileChain = getTableChain("profiles");

      appChain.order.mockResolvedValue({ data: [mockAppRow], error: null });
      unitChain.in.mockResolvedValue({ data: [mockUnit], error: null });
      profileChain.in.mockResolvedValue({ data: [mockProfile], error: null });

      const result = await service.getLandlordApplications("landlord-1");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("app-1");
      expect(result[0].applicant.name).toBe("Juan Dela Cruz");
      expect(result[0].propertyName).toBe("Green Residences");
      expect(result[0].unitNumber).toBe("Unit 101");
    });
  });

  describe("getTenantApplications", () => {
    it("fetches tenant applications ordered by created_at descending", async () => {
      const mockTenantApps = [
        {
          id: "app-1",
          status: "pending",
          documents: [],
          created_at: "2026-08-01T00:00:00Z",
          unit: {
            id: "unit-1",
            name: "Unit 101",
            rent_amount: 15000,
            property: { id: "prop-1", name: "Tower 1", address: "123 Main St", city: "Makati", type: "apartment", images: [] },
          },
        },
      ];

      const appChain = getTableChain("applications");
      appChain.order.mockResolvedValue({ data: mockTenantApps, error: null });

      const result = await service.getTenantApplications("tenant-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("applications");
      expect(appChain.eq).toHaveBeenCalledWith("applicant_id", "tenant-1");
      expect(result).toEqual(mockTenantApps);
    });
  });

  describe("createWalkInApplication", () => {
    it("creates walk in application record with valid inputs", async () => {
      const appChain = getTableChain("applications");
      appChain.single.mockResolvedValue({ data: { id: "new-app-1" }, error: null });

      const result = await service.createWalkInApplication("landlord-1", {
        unitId: "unit-1",
        applicantName: "Maria Clara",
        applicantEmail: "maria@example.com",
        applicantPhone: "09171234567",
        moveInDate: "2026-09-01",
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("applications");
      expect(appChain.insert).toHaveBeenCalled();
      expect(result).toEqual({ id: "new-app-1" });
    });

    it("throws ApplicationValidationError when applicant name or email is missing", async () => {
      await expect(
        service.createWalkInApplication("landlord-1", {
          unitId: "unit-1",
          applicantName: "",
          applicantEmail: "maria@example.com",
          applicantPhone: "09171234567",
        }),
      ).rejects.toBeInstanceOf(ApplicationValidationError);
    });
  });

  describe("updateApplicationStatus", () => {
    it("updates application status when transition is legal", async () => {
      const appChain = getTableChain("applications");
      appChain.maybeSingle.mockResolvedValue({
        data: { id: "app-1", status: "pending", landlord_id: "landlord-1" },
        error: null,
      });

      await service.updateApplicationStatus("app-1", "reviewing", "landlord-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("applications");
      expect(appChain.update).toHaveBeenCalled();
    });

    it("throws ApplicationNotFoundError when application does not exist", async () => {
      const appChain = getTableChain("applications");
      appChain.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(
        service.updateApplicationStatus("missing-app", "reviewing", "landlord-1"),
      ).rejects.toBeInstanceOf(ApplicationNotFoundError);
    });

    it("throws InvalidApplicationStateError when transition is illegal", async () => {
      const appChain = getTableChain("applications");
      appChain.maybeSingle.mockResolvedValue({
        data: { id: "app-1", status: "rejected", landlord_id: "landlord-1" },
        error: null,
      });

      await expect(
        service.updateApplicationStatus("app-1", "approved", "landlord-1"),
      ).rejects.toBeInstanceOf(InvalidApplicationStateError);
    });
  });
});
