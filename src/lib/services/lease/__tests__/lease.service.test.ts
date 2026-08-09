import { describe, it, expect, vi, beforeEach } from "vitest";
import { LeaseService } from "../lease.service";
import { LeaseNotFoundError } from "../lease.errors";

/**
 * Build a Supabase-shaped client mock whose `from()` returns a chain we control.
 * The chain exposes the fluent methods each service method calls.
 */
function createMockSupabase() {
  const chainRef: Record<string, unknown> = {};
  const mockFrom = vi.fn(() => chainRef.chain);
  const supabase = { from: mockFrom } as any;
  return { supabase, mockFrom, chainRef };
}

/** Resettable chain object that supports the fluent lease query surface. */
function createChain(overrides: Record<string, unknown> = {}) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
}

describe("LeaseService", () => {
  let mockSupabase: any;
  let chain: any;
  let service: LeaseService;

  beforeEach(() => {
    const built = createMockSupabase();
    mockSupabase = built.supabase;
    chain = createChain();
    built.chainRef.chain = chain;
    service = new LeaseService(mockSupabase);
  });

  describe("listLeasesForLandlord", () => {
    it("queries leases for the landlord and orders by created_at desc", async () => {
      chain.order.mockResolvedValue({
        data: [{ id: "lease-1", status: "active" }],
        error: null,
      });

      const result = await service.listLeasesForLandlord("landlord-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("leases");
      expect(chain.eq).toHaveBeenCalledWith("landlord_id", "landlord-1");
      expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(result).toEqual([{ id: "lease-1", status: "active" }]);
    });

    it("applies a property filter when propertyId is provided", async () => {
      chain.order.mockResolvedValue({ data: [], error: null });

      await service.listLeasesForLandlord("landlord-1", { propertyId: "prop-9" });

      expect(chain.eq).toHaveBeenCalledWith("unit.property_id", "prop-9");
    });

    it("ignores the 'all' property sentinel", async () => {
      chain.order.mockResolvedValue({ data: [], error: null });

      await service.listLeasesForLandlord("landlord-1", { propertyId: "all" });

      expect(chain.eq).toHaveBeenCalledWith("landlord_id", "landlord-1");
      expect(chain.eq).not.toHaveBeenCalledWith("unit.property_id", "all");
    });

    it("applies a single status filter", async () => {
      chain.order.mockResolvedValue({ data: [], error: null });

      await service.listLeasesForLandlord("landlord-1", { status: "active" });

      expect(chain.eq).toHaveBeenCalledWith("status", "active");
      expect(chain.in).not.toHaveBeenCalled();
    });

    it("applies a multiple-status filter with in()", async () => {
      chain.order.mockResolvedValue({ data: [], error: null });

      await service.listLeasesForLandlord("landlord-1", { status: "active,expired" });

      expect(chain.in).toHaveBeenCalledWith("status", ["active", "expired"]);
      expect(chain.eq).not.toHaveBeenCalledWith("status", "active,expired");
    });

    it("propagates database errors", async () => {
      chain.order.mockResolvedValue({ data: null, error: { message: "boom" } });

      await expect(service.listLeasesForLandlord("landlord-1")).rejects.toThrow(
        "Failed to fetch leases",
      );
    });
  });

  describe("getLeaseDetail", () => {
    it("returns the lease row on success", async () => {
      const leaseRow = { id: "lease-1", status: "active", landlord_id: "landlord-1" };
      chain.maybeSingle.mockResolvedValue({ data: leaseRow, error: null });

      const result = await service.getLeaseDetail("lease-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("leases");
      expect(chain.eq).toHaveBeenCalledWith("id", "lease-1");
      expect(result).toEqual(leaseRow);
    });

    it("throws LeaseNotFoundError when no row exists (no error)", async () => {
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(service.getLeaseDetail("lease-1")).rejects.toBeInstanceOf(
        LeaseNotFoundError,
      );
    });

    it("throws on database errors", async () => {
      chain.maybeSingle.mockResolvedValue({ data: null, error: { message: "boom" } });

      await expect(service.getLeaseDetail("lease-1")).rejects.toThrow(
        "Failed to fetch lease",
      );
    });
  });
});