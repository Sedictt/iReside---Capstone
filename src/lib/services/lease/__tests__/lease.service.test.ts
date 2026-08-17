import { describe, it, expect, vi, beforeEach } from "vitest";
import { LeaseService } from "../lease.service";
import {
  LeaseAccessError,
  LeaseNotFoundError,
  LeaseSigningEligibilityError,
} from "../lease.errors";


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

  describe("getTenantLeases", () => {
    it("fetches tenant leases ordered by created_at desc", async () => {
      const leases = [{ id: "lease-tenant-1", status: "active" }];
      chain.order.mockResolvedValue({ data: leases, error: null });

      const result = await service.getTenantLeases("tenant-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("leases");
      expect(chain.eq).toHaveBeenCalledWith("tenant_id", "tenant-1");
      expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(result).toEqual(leases);
    });

    it("throws when tenant lease fetch fails", async () => {
      chain.order.mockResolvedValue({ data: null, error: { message: "tenant error" } });

      await expect(service.getTenantLeases("tenant-1")).rejects.toThrow(
        "Failed to fetch tenant leases",
      );
    });
  });

  describe("getLandlordLeases", () => {
    it("fetches landlord leases with full joined details", async () => {
      const leases = [{ id: "lease-landlord-1", status: "active" }];
      chain.order.mockResolvedValue({ data: leases, error: null });

      const result = await service.getLandlordLeases("landlord-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("leases");
      expect(chain.eq).toHaveBeenCalledWith("landlord_id", "landlord-1");
      expect(result).toEqual(leases);
    });

    it("throws when landlord lease fetch fails", async () => {
      chain.order.mockResolvedValue({ data: null, error: { message: "landlord error" } });

      await expect(service.getLandlordLeases("landlord-1")).rejects.toThrow(
        "Failed to fetch landlord leases",
      );
    });
  });

  describe("getLeaseById", () => {
    it("returns joined lease by id", async () => {
      const lease = { id: "lease-123", status: "active" };
      chain.maybeSingle.mockResolvedValue({ data: lease, error: null });

      const result = await service.getLeaseById("lease-123");

      expect(mockSupabase.from).toHaveBeenCalledWith("leases");
      expect(chain.eq).toHaveBeenCalledWith("id", "lease-123");
      expect(result).toEqual(lease);
    });

    it("throws LeaseNotFoundError when lease does not exist", async () => {
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(service.getLeaseById("missing-lease")).rejects.toBeInstanceOf(
        LeaseNotFoundError,
      );
    });
  });

  describe("getActiveLease", () => {
    it("returns active lease for tenant", async () => {
      const activeLease = { id: "active-lease", status: "active" };
      chain.maybeSingle.mockResolvedValue({ data: activeLease, error: null });

      const result = await service.getActiveLease("tenant-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("leases");
      expect(chain.eq).toHaveBeenCalledWith("tenant_id", "tenant-1");
      expect(chain.eq).toHaveBeenCalledWith("status", "active");
      expect(result).toEqual(activeLease);
    });

    it("returns null when no active lease exists", async () => {
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await service.getActiveLease("tenant-1");

      expect(result).toBeNull();
    });

    it("throws on database error", async () => {
      chain.maybeSingle.mockResolvedValue({ data: null, error: { message: "db error" } });

      await expect(service.getActiveLease("tenant-1")).rejects.toThrow(
        "Failed to fetch active lease",
      );
    });
  });

  describe("getTenantRenewalRequests", () => {
    it("fetches renewal requests for tenant", async () => {
      const renewalRequests = [{ id: "renewal-1", status: "pending" }];
      chain.order.mockResolvedValue({ data: renewalRequests, error: null });

      const result = await service.getTenantRenewalRequests("tenant-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("renewal_requests");
      expect(chain.eq).toHaveBeenCalledWith("tenant_id", "tenant-1");
      expect(result).toEqual(renewalRequests);
    });

    it("throws on error fetching tenant renewal requests", async () => {
      chain.order.mockResolvedValue({ data: null, error: { message: "renewal fetch error" } });

      await expect(service.getTenantRenewalRequests("tenant-1")).rejects.toThrow(
        "Failed to fetch tenant renewal requests",
      );
    });
  });

  describe("getLandlordRenewalRequests", () => {
    it("fetches renewal requests for landlord without status filter", async () => {
      const renewalRequests = [{ id: "renewal-1", status: "pending" }];
      chain.order.mockResolvedValue({ data: renewalRequests, error: null });

      const result = await service.getLandlordRenewalRequests("landlord-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("renewal_requests");
      expect(chain.eq).toHaveBeenCalledWith("landlord_id", "landlord-1");
      expect(result).toEqual(renewalRequests);
    });

    it("applies status filter when provided", async () => {
      chain.order.mockResolvedValue({ data: [], error: null });

      await service.getLandlordRenewalRequests("landlord-1", "pending");

      expect(chain.eq).toHaveBeenCalledWith("landlord_id", "landlord-1");
      expect(chain.eq).toHaveBeenCalledWith("status", "pending");
    });
  });

  describe("getRenewalRequestById", () => {
    it("fetches single renewal request by id", async () => {
      const renewal = { id: "req-1", status: "approved" };
      chain.maybeSingle.mockResolvedValue({ data: renewal, error: null });

      const result = await service.getRenewalRequestById("req-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("renewal_requests");
      expect(chain.eq).toHaveBeenCalledWith("id", "req-1");
      expect(result).toEqual(renewal);
    });

    it("returns null when renewal request not found", async () => {
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await service.getRenewalRequestById("req-missing");

      expect(result).toBeNull();
    });
  });

  describe("getTenantActiveLease", () => {
    it("returns active lease when multiple leases exist", async () => {
      const leases = [
        { id: "draft-lease", status: "draft" },
        { id: "active-lease", status: "active" },
      ];
      chain.order.mockResolvedValue({ data: leases, error: null });

      const result = await service.getTenantActiveLease("tenant-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("leases");
      expect(chain.eq).toHaveBeenCalledWith("tenant_id", "tenant-1");
      expect(result).toEqual({ id: "active-lease", status: "active" });
    });

    it("falls back to the first lease if no active lease exists", async () => {
      const leases = [{ id: "pending-lease", status: "pending_signature" }];
      chain.order.mockResolvedValue({ data: leases, error: null });

      const result = await service.getTenantActiveLease("tenant-1");

      expect(result).toEqual({ id: "pending-lease", status: "pending_signature" });
    });

    it("returns null when no leases exist", async () => {
      chain.order.mockResolvedValue({ data: [], error: null });

      const result = await service.getTenantActiveLease("tenant-1");

      expect(result).toBeNull();
    });

    it("throws on error", async () => {
      chain.order.mockResolvedValue({ data: null, error: { message: "fetch failed" } });

      await expect(service.getTenantActiveLease("tenant-1")).rejects.toThrow(
        "Failed to fetch tenant active lease",
      );
    });
  });

  describe("getTenantLeaseById", () => {
    it("returns lease detail for the tenant", async () => {
      const lease = { id: "lease-100", tenant_id: "tenant-1", status: "active" };
      chain.maybeSingle.mockResolvedValue({ data: lease, error: null });

      const result = await service.getTenantLeaseById("tenant-1", "lease-100");

      expect(mockSupabase.from).toHaveBeenCalledWith("leases");
      expect(chain.eq).toHaveBeenCalledWith("id", "lease-100");
      expect(chain.eq).toHaveBeenCalledWith("tenant_id", "tenant-1");
      expect(result).toEqual(lease);
    });

    it("throws LeaseNotFoundError when not found", async () => {
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(service.getTenantLeaseById("tenant-1", "lease-missing")).rejects.toBeInstanceOf(
        LeaseNotFoundError,
      );
    });
  });

  describe("generateLandlordSigningLink", () => {
    const validLease = {
      id: "lease-sign-1",
      status: "pending_landlord_signature",
      landlord_id: "landlord-1",
      tenant_signature: "data:image/png;base64,sample",
      tenant_signed_at: "2026-06-01T00:00:00Z",
    };

    it("generates signing link on valid lease eligibility", async () => {
      chain.maybeSingle.mockResolvedValue({ data: validLease, error: null });

      const result = await service.generateLandlordSigningLink("landlord-1", "lease-sign-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("leases");
      expect(chain.eq).toHaveBeenCalledWith("id", "lease-sign-1");
      expect(result.leaseId).toBe("lease-sign-1");
      expect(result.status).toBe("pending_landlord_signature");
      expect(result.signingUrl).toContain("signing/landlord/lease-sign-1?token=");
    });

    it("throws LeaseNotFoundError when lease does not exist", async () => {
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(
        service.generateLandlordSigningLink("landlord-1", "missing-lease"),
      ).rejects.toBeInstanceOf(LeaseNotFoundError);
    });

    it("throws LeaseAccessError when landlord id does not match", async () => {
      chain.maybeSingle.mockResolvedValue({ data: validLease, error: null });

      await expect(
        service.generateLandlordSigningLink("wrong-landlord", "lease-sign-1"),
      ).rejects.toBeInstanceOf(LeaseAccessError);
    });

    it("throws LeaseSigningEligibilityError when status is not pending_landlord_signature", async () => {
      const draftLease = { ...validLease, status: "draft" };
      chain.maybeSingle.mockResolvedValue({ data: draftLease, error: null });

      await expect(
        service.generateLandlordSigningLink("landlord-1", "lease-sign-1"),
      ).rejects.toBeInstanceOf(LeaseSigningEligibilityError);
    });

    it("throws LeaseSigningEligibilityError when tenant has not signed yet", async () => {
      const unsignedLease = { ...validLease, tenant_signature: null };
      chain.maybeSingle.mockResolvedValue({ data: unsignedLease, error: null });

      await expect(
        service.generateLandlordSigningLink("landlord-1", "lease-sign-1"),
      ).rejects.toBeInstanceOf(LeaseSigningEligibilityError);
    });
  });

  describe("signLeaseAsLandlord", () => {
    const validSignature =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGDMVmAQ==";

    const pendingLease = {
      id: "lease-1",
      status: "pending_landlord_signature",
      landlord_id: "landlord-1",
      tenant_signature: "data:image/png;base64,sample",
      tenant_signed_at: "2026-06-01T00:00:00Z",
      signature_lock_version: 1,
    };

    function createMockAdminClient() {
      const leasesChain: any = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { signature_lock_version: 1 },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [{ id: "lease-1" }],
                error: null,
              }),
            }),
          }),
        }),
      };

      const applicationsChain: any = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "app-1", compliance_checklist: {} },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };

      return {
        from: vi.fn((table: string) => {
          if (table === "leases") return leasesChain;
          if (table === "applications") return applicationsChain;
          return leasesChain;
        }),
      } as any;
    }

    it("successfully signs lease as landlord", async () => {
      chain.maybeSingle.mockResolvedValue({ data: pendingLease, error: null });
      const mockAdmin = createMockAdminClient();

      const result = await service.signLeaseAsLandlord(
        {
          leaseId: "lease-1",
          landlordId: "landlord-1",
          signature: validSignature,
        },
        mockAdmin,
      );

      expect(result.leaseId).toBe("lease-1");
      expect(result.status).toBe("active");
      expect(result.signedAt).toBeDefined();
      expect(result.sanitizedSignature).toBeDefined();
    });

    it("throws LeaseNotFoundError when lease does not exist", async () => {
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(
        service.signLeaseAsLandlord({
          leaseId: "missing-lease",
          landlordId: "landlord-1",
          signature: validSignature,
        }),
      ).rejects.toBeInstanceOf(LeaseNotFoundError);
    });

    it("throws LeaseAccessError on landlord mismatch", async () => {
      chain.maybeSingle.mockResolvedValue({ data: pendingLease, error: null });

      await expect(
        service.signLeaseAsLandlord({
          leaseId: "lease-1",
          landlordId: "wrong-landlord",
          signature: validSignature,
        }),
      ).rejects.toBeInstanceOf(LeaseAccessError);
    });

    it("throws LeaseSigningEligibilityError when lease status is not pending_landlord_signature", async () => {
      const activeLease = { ...pendingLease, status: "active" };
      chain.maybeSingle.mockResolvedValue({ data: activeLease, error: null });

      await expect(
        service.signLeaseAsLandlord({
          leaseId: "lease-1",
          landlordId: "landlord-1",
          signature: validSignature,
        }),
      ).rejects.toBeInstanceOf(LeaseSigningEligibilityError);
    });

    it("throws LeaseSigningEligibilityError when tenant has not signed", async () => {
      const unsignedLease = { ...pendingLease, tenant_signature: null };
      chain.maybeSingle.mockResolvedValue({ data: unsignedLease, error: null });

      await expect(
        service.signLeaseAsLandlord({
          leaseId: "lease-1",
          landlordId: "landlord-1",
          signature: validSignature,
        }),
      ).rejects.toBeInstanceOf(LeaseSigningEligibilityError);
    });

    it("throws LeaseSigningEligibilityError on invalid signature format", async () => {
      chain.maybeSingle.mockResolvedValue({ data: pendingLease, error: null });

      await expect(
        service.signLeaseAsLandlord({
          leaseId: "lease-1",
          landlordId: "landlord-1",
          signature: "not-a-valid-data-url",
        }),
      ).rejects.toBeInstanceOf(LeaseSigningEligibilityError);
    });
  });
});