import { describe, it, expect, vi, beforeEach } from "vitest";
import { PropertyService } from "../property.service";
import {
  PropertyNotFoundError,
  PropertyAccessError,
  PropertyValidationError,
  UnitNotFoundError,
} from "../property.errors";

function createMockSupabase() {
  const tableChains: Record<string, any> = {};

  function getTableChain(tableName: string) {
    if (!tableChains[tableName]) {
      const chain: any = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.update = vi.fn().mockReturnValue(chain);
      chain.delete = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.in = vi.fn().mockReturnValue(chain);
      chain.order = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockReturnValue(chain);
      chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
      chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      chain.then = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve);
      tableChains[tableName] = chain;
    }
    return tableChains[tableName];
  }

  const mockSupabase = {
    from: vi.fn((tableName: string) => getTableChain(tableName)),
  };

  return { mockSupabase: mockSupabase as any, getTableChain };
}

describe("PropertyService", () => {
  let service: PropertyService;
  let mockSupabase: any;
  let getTableChain: (tableName: string) => any;

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.mockSupabase;
    getTableChain = mocks.getTableChain;
    service = new PropertyService(mockSupabase);
  });

  describe("getPropertiesForLandlord", () => {
    it("returns mapped properties array", async () => {
      const mockRows = [
        {
          id: "prop-1",
          name: "Sunrise Residences",
          address: "123 Main St",
          type: "apartment",
          images: ["https://example.com/img.jpg"],
          contract_template: { clauses: [] },
        },
      ];

      const chain = getTableChain("properties");
      chain.order.mockResolvedValue({ data: mockRows, error: null });

      const result = await service.getPropertiesForLandlord("landlord-1");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("prop-1");
      expect(result[0].contractTemplate).toEqual({ clauses: [] });
    });
  });

  describe("getPropertyIdsForLandlord", () => {
    it("returns flat array of property IDs", async () => {
      const chain = getTableChain("properties");
      chain.eq.mockResolvedValue({ data: [{ id: "prop-1" }, { id: "prop-2" }], error: null });

      const result = await service.getPropertyIdsForLandlord("landlord-1");

      expect(result).toEqual(["prop-1", "prop-2"]);
    });
  });

  describe("getPropertyDetail", () => {
    it("throws PropertyNotFoundError when property not found", async () => {
      const chain = getTableChain("properties");
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(service.getPropertyDetail("missing-prop", "landlord-1")).rejects.toBeInstanceOf(
        PropertyNotFoundError,
      );
    });

    it("returns PropertyDetail with unitCount and envPolicy", async () => {
      const propChain = getTableChain("properties");
      const unitChain = getTableChain("units");
      const envChain = getTableChain("property_environment_policies");

      propChain.maybeSingle.mockResolvedValue({
        data: {
          id: "prop-1",
          name: "Sunrise",
          address: "123 Main",
          type: "apartment",
          description: "Nice place",
          amenities: ["wifi"],
          house_rules: ["No pets"],

          images: [],
          contract_template: null,
          total_units: 10,
          total_floors: 2,
          base_rent_amount: 15000,
        },
        error: null,
      });
      unitChain.then = (resolve: any) =>
        Promise.resolve({ count: 8, error: null }).then(resolve);
      envChain.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await service.getPropertyDetail("prop-1", "landlord-1");

      expect(result.id).toBe("prop-1");
      expect(result.baseRentAmount).toBe(15000);
    });
  });

  describe("updateRenewalSettings", () => {
    it("throws PropertyValidationError on invalid values", async () => {
      await expect(
        service.updateRenewalSettings({
          propertyId: "prop-1",
          landlordId: "landlord-1",
          autoRenewalEnabled: true,
          renewalNoticeDays: -1,
          defaultRenewalTermMonths: 12,
          defaultRentIncreasePercent: 5,
        }),
      ).rejects.toBeInstanceOf(PropertyValidationError);
    });

    it("throws PropertyAccessError when landlord doesn't own property", async () => {
      const chain = getTableChain("properties");
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(
        service.updateRenewalSettings({
          propertyId: "prop-1",
          landlordId: "other-landlord",
          autoRenewalEnabled: false,
          renewalNoticeDays: 30,
          defaultRenewalTermMonths: 12,
          defaultRentIncreasePercent: 0,
        }),
      ).rejects.toBeInstanceOf(PropertyAccessError);
    });
  });
});
