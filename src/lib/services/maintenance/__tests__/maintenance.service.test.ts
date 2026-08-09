import { describe, it, expect, vi, beforeEach } from "vitest";
import { MaintenanceService } from "../maintenance.service";
import { MaintenanceNotFoundError, MaintenanceValidationError } from "../maintenance.errors";

describe("MaintenanceService", () => {
  let mockSupabase: any;
  let maintenanceService: MaintenanceService;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    };
    maintenanceService = new MaintenanceService(mockSupabase);
  });

  describe("getLandlordMaintenanceRequests", () => {
    it("returns empty requests and zero metrics when no records found", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await maintenanceService.getLandlordMaintenanceRequests("landlord-123");

      expect(result.requests).toEqual([]);
      expect(result.metrics).toEqual({
        actionRequired: 0,
        inProgress: 0,
        scheduled: 0,
        resolvedThisMonth: 0,
      });
    });

    it("fetches and maps maintenance requests with triage metrics", async () => {
      const mockRow = {
        id: "req-1",
        unit_id: "unit-1",
        tenant_id: "tenant-1",
        title: "Water leak in bathroom",
        description: "Pipe burst under sink",
        status: "open",
        priority: "urgent",
        category: "plumbing",
        images: ["https://example.com/photo.jpg"],
        self_repair_requested: false,
        created_at: new Date().toISOString(),
      };

      const mockMaintenanceQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockRow], error: null }),
        update: vi.fn().mockReturnThis(),
      };

      const mockProfilesQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [{ id: "tenant-1", full_name: "John Doe", avatar_url: null, avatar_bg_color: null }],
          error: null,
        }),
      };

      const mockUnitsQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [{ id: "unit-1", name: "101", property_id: "prop-1" }],
          error: null,
        }),
      };

      const mockPropertiesQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [{ id: "prop-1", name: "Sunshine Tower" }],
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((tableName: string) => {
        if (tableName === "maintenance_requests") return mockMaintenanceQuery;
        if (tableName === "profiles") return mockProfilesQuery;
        if (tableName === "units") return mockUnitsQuery;
        if (tableName === "properties") return mockPropertiesQuery;
        return { select: vi.fn().mockReturnThis() };
      });

      const result = await maintenanceService.getLandlordMaintenanceRequests("landlord-123");

      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].id).toBe("req-1");
      expect(result.requests[0].property).toBe("Sunshine Tower");
      expect(result.requests[0].unit).toBe("101");
      expect(result.requests[0].tenant).toBe("John Doe");
      expect(result.metrics.actionRequired).toBe(1);
    });
  });

  describe("getTenantMaintenanceRequests", () => {
    it("returns formatted requests for tenant", async () => {
      const mockRow = {
        id: "req-tenant-1",
        unit_id: "unit-1",
        landlord_id: "landlord-1",
        title: "Aircon not cooling",
        description: "Need AC maintenance",
        status: "in_progress",
        priority: "medium",
        category: "general",
        images: [],
        created_at: new Date().toISOString(),
      };

      const mockMaintenanceQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockRow], error: null }),
      };

      const mockProfilesQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [{ id: "landlord-1", full_name: "Jane Landlord" }],
          error: null,
        }),
      };

      const mockUnitsQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [{ id: "unit-1", name: "Unit 202", property_id: "prop-1" }],
          error: null,
        }),
      };

      const mockPropertiesQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [{ id: "prop-1", name: "Ocean Breeze" }],
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((tableName: string) => {
        if (tableName === "maintenance_requests") return mockMaintenanceQuery;
        if (tableName === "profiles") return mockProfilesQuery;
        if (tableName === "units") return mockUnitsQuery;
        if (tableName === "properties") return mockPropertiesQuery;
        return { select: vi.fn().mockReturnThis() };
      });

      const requests = await maintenanceService.getTenantMaintenanceRequests("tenant-123");

      expect(requests).toHaveLength(1);
      expect(requests[0].id).toBe("req-tenant-1");
      expect(requests[0].property).toBe("Ocean Breeze");
      expect(requests[0].unit).toBe("Unit 202");
      expect(requests[0].landlord).toBe("Jane Landlord");
    });
  });

  describe("createLandlordMaintenance", () => {
    it("validates input fields", async () => {
      await expect(
        maintenanceService.createLandlordMaintenance("landlord-1", {
          unitId: "",
          title: "Title",
          description: "Description",
          priority: "Medium",
        }),
      ).rejects.toThrow(MaintenanceValidationError);
    });

    it("creates maintenance request when active lease exists", async () => {
      const mockLeasesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { tenant_id: "tenant-999" },
          error: null,
        }),
      };

      const mockCreatedRow = {
        id: "new-req-1",
        unit_id: "unit-1",
        tenant_id: "tenant-999",
        title: "Broken door handle",
        description: "Need replacement",
        status: "open",
        priority: "low",
        category: null,
        images: [],
        created_at: new Date().toISOString(),
      };

      const mockMaintenanceQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCreatedRow,
          error: null,
        }),
      };

      const mockUnitsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { name: "Unit 301", property_id: "prop-1" },
          error: null,
        }),
      };

      const mockPropertiesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { name: "Palms Condo" },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((tableName: string) => {
        if (tableName === "leases") return mockLeasesQuery;
        if (tableName === "maintenance_requests") return mockMaintenanceQuery;
        if (tableName === "units") return mockUnitsQuery;
        if (tableName === "properties") return mockPropertiesQuery;
        return { select: vi.fn().mockReturnThis() };
      });

      const result = await maintenanceService.createLandlordMaintenance("landlord-1", {
        unitId: "unit-1",
        title: "Broken door handle",
        description: "Need replacement",
        priority: "Low",
      });

      expect(result.id).toBe("new-req-1");
      expect(result.property).toBe("Palms Condo");
      expect(result.unit).toBe("Unit 301");
    });
  });

  describe("updateLandlordMaintenance", () => {
    it("throws validation error when payload is empty", async () => {
      await expect(
        maintenanceService.updateLandlordMaintenance("landlord-1", {
          requestId: "req-1",
        }),
      ).rejects.toThrow(MaintenanceValidationError);
    });

    it("updates status and returns refreshed record", async () => {
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "req-1",
            unit_id: "unit-1",
            tenant_id: "tenant-1",
            title: "Leak",
            description: "Fixed leak",
            status: "resolved",
            priority: "urgent",
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockUpdateQuery);

      const result = await maintenanceService.updateLandlordMaintenance("landlord-1", {
        requestId: "req-1",
        status: "resolved",
      });

      expect(result.id).toBe("req-1");
      expect(result.status).toBe("Resolved");
    });
  });
});
