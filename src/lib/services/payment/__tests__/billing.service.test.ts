import { describe, it, expect, vi, beforeEach } from "vitest";
import { BillingService } from "../billing.service";
import { PaymentAccessError, PaymentNotFoundError, PaymentValidationError } from "../payment.errors";

function createMockSupabase() {
  const chainRef: Record<string, any> = {};

  chainRef.select = vi.fn().mockReturnValue(chainRef);
  chainRef.insert = vi.fn().mockReturnValue(chainRef);
  chainRef.eq = vi.fn().mockReturnValue(chainRef);
  chainRef.order = vi.fn().mockReturnValue(chainRef);
  chainRef.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chainRef.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

  const mockSupabase = {
    from: vi.fn(() => chainRef),
  };

  return { mockSupabase: mockSupabase as any, chain: chainRef };
}

describe("BillingService", () => {
  let service: BillingService;
  let mockSupabase: any;
  let chain: any;

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.mockSupabase;
    chain = mocks.chain;
    service = new BillingService(mockSupabase);
  });

  describe("listUtilityReadings", () => {
    it("fetches readings ordered by entered_at descending", async () => {
      const mockReadings = [{ id: "read-1", usage: 15, computed_charge: 450 }];
      chain.order.mockResolvedValue({ data: mockReadings, error: null });

      const result = await service.listUtilityReadings("landlord-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("utility_readings");
      expect(chain.eq).toHaveBeenCalledWith("landlord_id", "landlord-1");
      expect(result).toEqual(mockReadings);
    });

    it("applies lease and property filters when provided", async () => {
      chain.order.mockResolvedValue({ data: [], error: null });

      await service.listUtilityReadings("landlord-1", {
        leaseId: "lease-1",
        propertyId: "prop-1",
      });

      expect(chain.eq).toHaveBeenCalledWith("lease_id", "lease-1");
      expect(chain.eq).toHaveBeenCalledWith("property_id", "prop-1");
    });
  });

  describe("recordUtilityReading", () => {
    it("computes usage & charges and inserts utility reading row", async () => {
      const validLease = { id: "lease-1", unit_id: "unit-1", landlord_id: "landlord-1" };
      const validUnit = { id: "unit-1", property_id: "prop-1" };
      const validConfig = {
        unit_id: "unit-1",
        billing_mode: "submetered_usage",
        rate_per_unit: 50,
      };
      const createdReading = {
        id: "read-new",
        usage: 10,
        billed_rate: 50,
        computed_charge: 500,
      };

      // Mock sequence of queries:
      // 1. leases lookup
      chain.maybeSingle.mockResolvedValueOnce({ data: validLease, error: null });
      // 2. units lookup
      chain.single.mockResolvedValueOnce({ data: validUnit, error: null });
      // 3. utility_configs lookup (chain.order returns configs array)
      chain.order.mockResolvedValueOnce({ data: [validConfig], error: null });
      // 4. utility_readings insert (chain.single returns created reading)
      chain.single.mockResolvedValueOnce({ data: createdReading, error: null });

      const result = await service.recordUtilityReading("landlord-1", {
        leaseId: "lease-1",
        utilityType: "water",
        billingPeriodStart: "2026-07-01",
        billingPeriodEnd: "2026-07-31",
        previousReading: 100,
        currentReading: 110,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("utility_readings");
      expect(result).toEqual(createdReading);
    });

    it("throws PaymentValidationError when current reading is lower than previous", async () => {
      await expect(
        service.recordUtilityReading("landlord-1", {
          leaseId: "lease-1",
          utilityType: "electricity",
          billingPeriodStart: "2026-07-01",
          billingPeriodEnd: "2026-07-31",
          previousReading: 500,
          currentReading: 400,
        }),
      ).rejects.toBeInstanceOf(PaymentValidationError);
    });

    it("throws PaymentAccessError when lease does not belong to landlord", async () => {
      chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

      await expect(
        service.recordUtilityReading("wrong-landlord", {
          leaseId: "lease-1",
          utilityType: "water",
          billingPeriodStart: "2026-07-01",
          billingPeriodEnd: "2026-07-31",
          previousReading: 100,
          currentReading: 110,
        }),
      ).rejects.toBeInstanceOf(PaymentAccessError);
    });
  });
});
