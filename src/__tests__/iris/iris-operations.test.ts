import { describe, it, expect } from "vitest";
import {
  generateReceiptNumber,
  filterAudience,
  recordQuickSettlement,
  updateMaintenanceTicketStatus,
  buildOperationsContext,
  QuickSettlementInput,
  ActiveLeaseSummary,
  MaintenanceTicketSummary,
  LandlordPropertySummary,
  IrisOperationsService,
  verifyLandlordPropertyOwnership,
  verifyLandlordLeaseOwnership,
  getLeaseInvoiceContext,
  getLandlordOperationalContext,
} from "@/lib/services/iris/iris-operations.service";

describe("Iris Landlord Operations Service", () => {
  const sampleLeases: ActiveLeaseSummary[] = [
    {
      id: "lease-1",
      tenantId: "tenant-1",
      tenantName: "Juan Dela Cruz",
      tenantEmail: "juan@example.com",
      tenantPhone: "+639171234567",
      unitId: "unit-101",
      unitName: "Unit 101",
      propertyId: "prop-alpha",
      propertyName: "Alpha Residences",
      monthlyRent: 18000,
      startDate: "2026-01-01",
      endDate: "2027-05-31",
      outstandingBalance: 18000,
      daysOverdue: 12,
      dueDate: "2026-11-01",
    },
    {
      id: "lease-2",
      tenantId: "tenant-2",
      tenantName: "Maria Santos",
      tenantEmail: "maria@example.com",
      tenantPhone: "+639187654321",
      unitId: "unit-102",
      unitName: "Unit 102",
      propertyId: "prop-alpha",
      propertyName: "Alpha Residences",
      monthlyRent: 15000,
      startDate: "2026-02-01",
      endDate: "2026-11-20", // Expiring within 8 days of 2026-11-12
      outstandingBalance: 15000,
      daysOverdue: 2, // Overdue but < 5d
      dueDate: "2026-11-10",
    },
    {
      id: "lease-3",
      tenantId: "tenant-3",
      tenantName: "Pedro Penduko",
      unitId: "unit-201",
      unitName: "Unit 201",
      propertyId: "prop-beta",
      propertyName: "Beta Tower",
      monthlyRent: 22000,
      startDate: "2026-06-01",
      endDate: "2027-05-31",
      outstandingBalance: 22000,
      daysOverdue: 0,
      dueDate: "2026-11-15", // Due in 3 days from 2026-11-12
    },
    {
      id: "lease-4",
      tenantId: "tenant-4",
      tenantName: "Elena Ramos",
      unitId: "unit-202",
      unitName: "Unit 202",
      propertyId: "prop-beta",
      propertyName: "Beta Tower",
      monthlyRent: 20000,
      startDate: "2025-12-01",
      endDate: "2026-11-30", // Expiring in 18 days
      outstandingBalance: 0, // Fully paid
      daysOverdue: 0,
      dueDate: "2026-11-01",
    },
  ];

  describe("Official Receipt Generation", () => {
    it("should generate receipt number matching REC-YYYYMM-XXXXX pattern", () => {
      const rec = generateReceiptNumber("2026-11-12");
      expect(rec).toMatch(/^REC-202611-[A-Z0-9]{5}$/);
    });

    it("should respect custom seed code for deterministic testing", () => {
      const rec = generateReceiptNumber("2026-11-12", "ABC12");
      expect(rec).toBe("REC-202611-ABC12");
    });

    it("should pad short seed code to 5 characters", () => {
      const rec = generateReceiptNumber("2026-11-12", "AB");
      expect(rec).toBe("REC-202611-ABXXX");
    });

    it("should truncate seed codes longer than 5 characters", () => {
      const rec = generateReceiptNumber("2026-11-12", "ABCDEFG");
      expect(rec).toBe("REC-202611-ABCDE");
    });

    it("should default to current year and month if date is omitted", () => {
      const rec = generateReceiptNumber();
      const now = new Date();
      const expectedPrefix = `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
      expect(rec.startsWith(expectedPrefix)).toBe(true);
    });
  });

  describe("Audience Segmentation Filters", () => {
    const refDate = "2026-11-12";

    it("all_active_tenants should return all leases", () => {
      const result = filterAudience(sampleLeases, "all_active_tenants");
      expect(result).toHaveLength(4);
    });

    it("all_active_tenants should respect propertyId filter", () => {
      const result = filterAudience(sampleLeases, "all_active_tenants", {
        propertyId: "prop-alpha",
      });
      expect(result).toHaveLength(2);
      expect(result.every((l) => l.propertyId === "prop-alpha")).toBe(true);
    });

    it("overdue_5d should return only leases with balance and daysOverdue >= 5", () => {
      const result = filterAudience(sampleLeases, "overdue_5d", {
        referenceDate: refDate,
      });
      expect(result).toHaveLength(1);
      expect(result[0].tenantName).toBe("Juan Dela Cruz");
      expect(result[0].daysOverdue).toBe(12);
    });

    it("overdue_5d should exclude leases with daysOverdue < 5", () => {
      const result = filterAudience(sampleLeases, "overdue_5d", {
        referenceDate: refDate,
      });
      const names = result.map((l) => l.tenantName);
      expect(names).not.toContain("Maria Santos"); // 2 days overdue
    });

    it("overdue_5d should exclude fully paid leases even if past due date", () => {
      const paidOverdueLease: ActiveLeaseSummary = {
        ...sampleLeases[0],
        id: "lease-paid-overdue",
        outstandingBalance: 0,
        daysOverdue: 15,
      };
      const result = filterAudience([paidOverdueLease], "overdue_5d");
      expect(result).toHaveLength(0);
    });

    it("due_soon should return leases due within default threshold (5 days) with balance", () => {
      const result = filterAudience(sampleLeases, "due_soon", {
        referenceDate: refDate,
      });
      // Pedro Penduko due 2026-11-15 is 3 days away
      expect(result).toHaveLength(1);
      expect(result[0].tenantName).toBe("Pedro Penduko");
    });

    it("due_soon should respect custom dueSoonDaysThreshold", () => {
      const result = filterAudience(sampleLeases, "due_soon", {
        referenceDate: refDate,
        dueSoonDaysThreshold: 1, // Only 1 day away
      });
      // Pedro is 3 days away, so 0 found
      expect(result).toHaveLength(0);
    });

    it("due_soon should exclude tenants with zero balance due", () => {
      const zeroBalanceDueSoon: ActiveLeaseSummary = {
        ...sampleLeases[2],
        id: "lease-zero-due",
        outstandingBalance: 0,
        dueDate: "2026-11-14",
      };
      const result = filterAudience([zeroBalanceDueSoon], "due_soon", {
        referenceDate: refDate,
      });
      expect(result).toHaveLength(0);
    });

    it("expiring_leases_60d should return leases ending within 60 days of reference date", () => {
      const result = filterAudience(sampleLeases, "expiring_leases_60d", {
        referenceDate: refDate,
      });
      // Maria Santos (ends 2026-11-20, 8 days) and Elena Ramos (ends 2026-11-30, 18 days)
      expect(result).toHaveLength(2);
      const names = result.map((l) => l.tenantName);
      expect(names).toContain("Maria Santos");
      expect(names).toContain("Elena Ramos");
    });

    it("expiring_leases_60d should exclude leases ending > 60 days away", () => {
      const result = filterAudience(sampleLeases, "expiring_leases_60d", {
        referenceDate: refDate,
      });
      const names = result.map((l) => l.tenantName);
      expect(names).not.toContain("Pedro Penduko"); // ends 2027-05-31
    });

    it("expiring_leases_60d should filter by propertyId", () => {
      const result = filterAudience(sampleLeases, "expiring_leases_60d", {
        referenceDate: refDate,
        propertyId: "prop-beta",
      });
      expect(result).toHaveLength(1);
      expect(result[0].tenantName).toBe("Elena Ramos");
    });
  });

  describe("Quick Payment Settlement", () => {
    const mockInvoice = {
      id: "inv-9001",
      totalAmount: 18000,
      currentBalance: 18000,
    };

    it("should record full cash settlement successfully", () => {
      const input: QuickSettlementInput = {
        invoiceId: "inv-9001",
        amount: 18000,
        method: "cash",
        paymentDate: "2026-11-12",
        note: "Received by landlord in cash",
      };
      const result = recordQuickSettlement(input, mockInvoice, "FULL1");
      expect(result.success).toBe(true);
      expect(result.status).toBe("completed");
      expect(result.amountPaid).toBe(18000);
      expect(result.remainingBalance).toBe(0);
      expect(result.receiptNumber).toBe("REC-202611-FULL1");
    });

    it("should record partial settlement and compute accurate remaining balance", () => {
      const input: QuickSettlementInput = {
        invoiceId: "inv-9001",
        amount: 8000,
        method: "bank_transfer",
        referenceNumber: "BDO-REF-8899",
        paymentDate: "2026-11-12",
      };
      const result = recordQuickSettlement(input, mockInvoice, "PART1");
      expect(result.success).toBe(true);
      expect(result.status).toBe("partial");
      expect(result.amountPaid).toBe(8000);
      expect(result.remainingBalance).toBe(10000);
      expect(result.method).toBe("bank_transfer");
      expect(result.referenceNumber).toBe("BDO-REF-8899");
    });

    it("should preserve centavo rounding precision in remaining balance", () => {
      const complexInvoice = {
        id: "inv-complex",
        totalAmount: 15450.75,
        currentBalance: 15450.75,
      };
      const input: QuickSettlementInput = {
        invoiceId: "inv-complex",
        amount: 5450.35,
        method: "in_person",
        paymentDate: "2026-11-12",
      };
      const result = recordQuickSettlement(input, complexInvoice);
      expect(result.amountPaid).toBe(5450.35);
      expect(result.remainingBalance).toBe(10000.4);
    });

    it("should throw error if invoice ID does not match", () => {
      const input: QuickSettlementInput = {
        invoiceId: "wrong-id",
        amount: 5000,
        method: "cash",
        paymentDate: "2026-11-12",
      };
      expect(() => recordQuickSettlement(input, mockInvoice)).toThrow(/Invoice ID mismatch/);
    });

    it("should throw error when paying against an already fully settled invoice", () => {
      const settledInvoice = { ...mockInvoice, currentBalance: 0 };
      const input: QuickSettlementInput = {
        invoiceId: "inv-9001",
        amount: 1000,
        method: "cash",
        paymentDate: "2026-11-12",
      };
      expect(() => recordQuickSettlement(input, settledInvoice)).toThrow(/already fully settled/);
    });

    it("should throw error on non-positive payment amount (0)", () => {
      const input: QuickSettlementInput = {
        invoiceId: "inv-9001",
        amount: 0,
        method: "cash",
        paymentDate: "2026-11-12",
      };
      expect(() => recordQuickSettlement(input, mockInvoice)).toThrow(/greater than zero/);
    });

    it("should throw error on negative payment amount", () => {
      const input: QuickSettlementInput = {
        invoiceId: "inv-9001",
        amount: -500,
        method: "cash",
        paymentDate: "2026-11-12",
      };
      expect(() => recordQuickSettlement(input, mockInvoice)).toThrow(/greater than zero/);
    });

    it("should throw error on invalid date format", () => {
      const input = {
        invoiceId: "inv-9001",
        amount: 1000,
        method: "cash" as const,
        paymentDate: "12-11-2026", // Wrong format
      };
      expect(() => recordQuickSettlement(input, mockInvoice)).toThrow(/YYYY-MM-DD/);
    });

    it("should clamp remaining balance to 0 if payment exceeds balance", () => {
      const input: QuickSettlementInput = {
        invoiceId: "inv-9001",
        amount: 25000,
        method: "cash",
        paymentDate: "2026-11-12",
      };
      const result = recordQuickSettlement(input, mockInvoice);
      expect(result.remainingBalance).toBe(0);
      expect(result.status).toBe("completed");
    });
  });

  describe("Maintenance Ticket Triage Updates", () => {
    const sampleTicket: MaintenanceTicketSummary = {
      id: "ticket-101",
      unitId: "unit-101",
      unitName: "Unit 101",
      propertyId: "prop-alpha",
      propertyName: "Alpha Residences",
      tenantName: "Juan Dela Cruz",
      title: "Clogged kitchen sink",
      description: "Water draining very slowly",
      priority: "medium",
      status: "pending",
      createdAt: "2026-11-10T08:00:00Z",
    };

    it("should transition from pending to assigned with technician", () => {
      const updated = updateMaintenanceTicketStatus(sampleTicket, "assigned", {
        assignedTechnician: "Mario Plumber",
      });
      expect(updated.status).toBe("assigned");
      expect(updated.assignedTechnician).toBe("Mario Plumber");
      expect(updated.updatedAt).toBeDefined();
    });

    it("should throw error when assigning ticket without specifying technician", () => {
      expect(() => updateMaintenanceTicketStatus(sampleTicket, "assigned")).toThrow(
        /Cannot assign ticket without specifying a technician/
      );
    });

    it("should transition from pending to in_progress directly", () => {
      const updated = updateMaintenanceTicketStatus(sampleTicket, "in_progress");
      expect(updated.status).toBe("in_progress");
    });

    it("should transition from assigned to in_progress", () => {
      const assignedTicket: MaintenanceTicketSummary = {
        ...sampleTicket,
        status: "assigned",
        assignedTechnician: "Mario Plumber",
      };
      const updated = updateMaintenanceTicketStatus(assignedTicket, "in_progress");
      expect(updated.status).toBe("in_progress");
      expect(updated.assignedTechnician).toBe("Mario Plumber");
    });

    it("should transition from in_progress to resolved", () => {
      const inProgressTicket: MaintenanceTicketSummary = {
        ...sampleTicket,
        status: "in_progress",
        assignedTechnician: "Mario Plumber",
      };
      const updated = updateMaintenanceTicketStatus(inProgressTicket, "resolved");
      expect(updated.status).toBe("resolved");
    });

    it("should transition from resolved to closed", () => {
      const resolvedTicket: MaintenanceTicketSummary = {
        ...sampleTicket,
        status: "resolved",
      };
      const updated = updateMaintenanceTicketStatus(resolvedTicket, "closed");
      expect(updated.status).toBe("closed");
    });

    it("should throw error on illegal transition: pending directly to resolved", () => {
      expect(() => updateMaintenanceTicketStatus(sampleTicket, "resolved")).toThrow(
        /Illegal ticket status transition/
      );
    });

    it("should throw error on illegal transition: pending directly to closed", () => {
      expect(() => updateMaintenanceTicketStatus(sampleTicket, "closed")).toThrow(
        /Illegal ticket status transition/
      );
    });

    it("should allow reopening closed ticket to in_progress", () => {
      const closedTicket: MaintenanceTicketSummary = {
        ...sampleTicket,
        status: "closed",
      };
      const reopened = updateMaintenanceTicketStatus(closedTicket, "in_progress");
      expect(reopened.status).toBe("in_progress");
    });

    it("should allow cancelling a pending ticket", () => {
      const cancelled = updateMaintenanceTicketStatus(sampleTicket, "cancelled");
      expect(cancelled.status).toBe("cancelled");
    });
  });

  describe("Operations Context Aggregation", () => {
    const properties: LandlordPropertySummary[] = [
      { id: "prop-alpha", name: "Alpha Residences", totalUnits: 10, occupiedUnits: 8 },
      { id: "prop-beta", name: "Beta Tower", totalUnits: 20, occupiedUnits: 16 },
    ];

    const tickets: MaintenanceTicketSummary[] = [
      {
        id: "t-1",
        unitId: "u-1",
        unitName: "Unit 1",
        propertyId: "prop-alpha",
        propertyName: "Alpha Residences",
        tenantName: "Tenant A",
        title: "Leaky faucet",
        description: "Kitchen faucet dripping",
        priority: "low",
        status: "pending",
        createdAt: "2026-11-10T00:00:00Z",
      },
      {
        id: "t-2",
        unitId: "u-2",
        unitName: "Unit 2",
        propertyId: "prop-beta",
        propertyName: "Beta Tower",
        tenantName: "Tenant B",
        title: "AC maintenance",
        description: "Annual cleaning",
        priority: "medium",
        status: "closed",
        createdAt: "2026-11-01T00:00:00Z",
      },
    ];

    it("should aggregate total receivables accurately with centavos precision", () => {
      const context = buildOperationsContext("landlord-1", properties, sampleLeases, tickets);
      // Leases: 18000 + 15000 + 22000 + 0 = 55000
      expect(context.totalReceivables).toBe(55000);
    });

    it("should calculate occupancy rate across all properties accurately", () => {
      const context = buildOperationsContext("landlord-1", properties, sampleLeases, tickets);
      // Total units: 10 + 20 = 30. Occupied: 8 + 16 = 24. 24/30 = 80%
      expect(context.occupancyRate).toBe(80);
    });

    it("should filter open tickets excluding closed and cancelled ones", () => {
      const context = buildOperationsContext("landlord-1", properties, sampleLeases, tickets);
      expect(context.openTickets).toHaveLength(1);
      expect(context.openTickets[0].id).toBe("t-1");
    });

    it("should filter overdue leases with positive balance and daysOverdue > 0", () => {
      const context = buildOperationsContext("landlord-1", properties, sampleLeases, tickets);
      // Juan (12d, 18k) and Maria (2d, 15k)
      expect(context.overdueLeases).toHaveLength(2);
      const names = context.overdueLeases.map((l) => l.tenantName);
      expect(names).toContain("Juan Dela Cruz");
      expect(names).toContain("Maria Santos");
    });

    it("should handle zero total units without division by zero", () => {
      const context = buildOperationsContext("landlord-1", [], [], []);
      expect(context.occupancyRate).toBe(0);
      expect(context.totalReceivables).toBe(0);
      expect(context.activeLeases).toHaveLength(0);
      expect(context.openTickets).toHaveLength(0);
    });
  });

  describe("IrisOperationsService Database Context Operations", () => {
    it("verifyLandlordPropertyOwnership returns true when landlord owns property", async () => {
      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: (col1: string, val1: string) => ({
              eq: (col2: string, val2: string) => ({
                maybeSingle: async () => {
                  if (table === "properties" && val1 === "prop-1" && val2 === "landlord-1") {
                    return { data: { id: "prop-1" }, error: null };
                  }
                  return { data: null, error: null };
                },
              }),
            }),
          }),
        }),
      } as any;

      const owns = await IrisOperationsService.verifyLandlordPropertyOwnership(
        mockSupabase,
        "landlord-1",
        "prop-1"
      );
      expect(owns).toBe(true);

      const notOwns = await IrisOperationsService.verifyLandlordPropertyOwnership(
        mockSupabase,
        "landlord-2",
        "prop-1"
      );
      expect(notOwns).toBe(false);
    });

    it("verifyLandlordLeaseOwnership returns true when landlord owns lease", async () => {
      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: (col1: string, val1: string) => ({
              eq: (col2: string, val2: string) => ({
                maybeSingle: async () => {
                  if (table === "leases" && val1 === "lease-1" && val2 === "landlord-1") {
                    return { data: { id: "lease-1", landlord_id: "landlord-1" }, error: null };
                  }
                  return { data: null, error: null };
                },
              }),
            }),
          }),
        }),
      } as any;

      const owns = await IrisOperationsService.verifyLandlordLeaseOwnership(
        mockSupabase,
        "landlord-1",
        "lease-1"
      );
      expect(owns).toBe(true);

      const notOwns = await IrisOperationsService.verifyLandlordLeaseOwnership(
        mockSupabase,
        "landlord-1",
        "lease-999"
      );
      expect(notOwns).toBe(false);
    });

    it("getLeaseInvoiceContext fetches and pre-fills InvoiceBuildContext", async () => {
      const createQueryBuilder = (tableName: string) => {
        const builder: any = {
          select: () => builder,
          eq: () => builder,
          in: () => builder,
          order: () => builder,
          limit: () => builder,
          maybeSingle: async () => {
            if (tableName === "leases") {
              return {
                data: {
                  id: "lease-1",
                  unit_id: "unit-101",
                  tenant_id: "tenant-101",
                  landlord_id: "landlord-1",
                  monthly_rent: 18000,
                  status: "active",
                },
                error: null,
              };
            }
            if (tableName === "units") {
              return { data: { id: "unit-101", name: "101", property_id: "prop-1" }, error: null };
            }
            if (tableName === "properties") {
              return { data: { name: "Sunshine Tower" }, error: null };
            }
            if (tableName === "profiles") {
              return { data: { full_name: "Juan Dela Cruz" }, error: null };
            }
            if (tableName === "utility_readings") {
              return { data: { current_reading: 150 }, error: null };
            }
            return { data: null, error: null };
          },
          then: (resolve: any) => {
            if (tableName === "utility_configs") {
              resolve({
                data: [
                  {
                    id: "cfg-w",
                    utility_type: "water",
                    billing_mode: "tenant_paid",
                    rate_per_unit: 45,
                  },
                  {
                    id: "cfg-e",
                    utility_type: "electricity",
                    billing_mode: "tenant_paid",
                    rate_per_unit: 12,
                  },
                ],
                error: null,
              });
            } else {
              resolve({ data: [], error: null });
            }
          },
        };
        return builder;
      };

      const mockSupabase = {
        from: (table: string) => createQueryBuilder(table),
      } as any;

      const context = await IrisOperationsService.getLeaseInvoiceContext(
        mockSupabase,
        "landlord-1",
        "lease-1"
      );

      expect(context).not.toBeNull();
      expect(context?.leaseId).toBe("lease-1");
      expect(context?.tenantName).toBe("Juan Dela Cruz");
      expect(context?.monthlyRent).toBe(18000);
      expect(context?.water?.previousReading).toBe(150);
      expect(context?.electricity?.previousReading).toBe(150);
    });
  });
});
