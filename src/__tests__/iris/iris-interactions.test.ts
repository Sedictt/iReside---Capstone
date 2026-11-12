import { describe, it, expect } from "vitest";
import {
  invoiceFsmReducer,
  InvoiceFsmState,
  InvoiceBuildContext,
} from "@/lib/services/iris/iris-fsm";
import {
  calculateInvoiceTotals,
  calculateMeterUsage,
  formatPHP,
} from "@/lib/services/iris/iris-invoice-flow";
import {
  substituteTemplate,
  sanitizeTemplateInput,
} from "@/lib/services/iris/iris-templates";
import {
  filterAudience,
  recordQuickSettlement,
  updateMaintenanceTicketStatus,
  buildOperationsContext,
  ActiveLeaseSummary,
  MaintenanceTicketSummary,
} from "@/lib/services/iris/iris-operations.service";

describe("Iris Pairwise Feature Interactions", () => {
  const baseLease: InvoiceBuildContext = {
    leaseId: "lease-101",
    tenantId: "tenant-202",
    tenantName: "Carlos Mendoza",
    unitId: "unit-303",
    unitName: "Apartment 303",
    propertyId: "prop-404",
    propertyName: "Highland Residences",
    monthlyRent: 16000,
    billingMonth: "2026-11",
    dueDate: "2026-11-25",
    customItems: [],
  };

  describe("Interaction 1: Custom Fees, Utility Readings & Negative Discounts", () => {
    it("should compute combined total with tenant-paid utilities, penalty, and discount", () => {
      const ctx: InvoiceBuildContext = {
        ...baseLease,
        water: {
          billingMode: "tenant_paid",
          ratePerUnit: 55,
          previousReading: 120,
          currentReading: 132, // 12 units * 55 = ₱660
        },
        electricity: {
          billingMode: "tenant_paid",
          ratePerUnit: 14,
          previousReading: 2000,
          currentReading: 2150, // 150 kWh * 14 = ₱2100
        },
        customItems: [
          { id: "pen-1", label: "Late Payment Penalty", amount: 500, category: "penalty" },
          { id: "disc-1", label: "Prompt Payer Discount", amount: -1000, category: "other" },
        ],
      };

      const totals = calculateInvoiceTotals(ctx);
      // 16000 (rent) + 660 (water) + 2100 (elec) + 500 (penalty) - 1000 (disc) = 18260
      expect(totals.rentAmount).toBe(16000);
      expect(totals.waterCharge).toBe(660);
      expect(totals.electricityCharge).toBe(2100);
      expect(totals.penaltyTotal).toBe(500);
      expect(totals.otherTotal).toBe(-1000);
      expect(totals.totalDue).toBe(18260);
    });

    it("should properly structure itemized charge list with both additions and discounts", () => {
      const ctx: InvoiceBuildContext = {
        ...baseLease,
        customItems: [
          { id: "rep-1", label: "Window Screen Repair", amount: 450, category: "maintenance" },
          { id: "disc-2", label: "Courtesy Credit", amount: -200, category: "other" },
        ],
      };

      const totals = calculateInvoiceTotals(ctx);
      expect(totals.itemizedSummary).toHaveLength(3);
      expect(totals.itemizedSummary.find((i) => i.id === "rep-1")?.amount).toBe(450);
      expect(totals.itemizedSummary.find((i) => i.id === "disc-2")?.amount).toBe(-200);
      expect(totals.totalDue).toBe(16250);
    });

    it("should aggregate multiple penalties and maintenance charges alongside utilities", () => {
      const ctx: InvoiceBuildContext = {
        ...baseLease,
        water: {
          billingMode: "tenant_paid",
          ratePerUnit: 50,
          previousReading: 100,
          currentReading: 110, // ₱500
        },
        customItems: [
          { id: "p1", label: "Noise Violation Penalty", amount: 1000, category: "penalty" },
          { id: "p2", label: "Late Fee", amount: 500, category: "penalty" },
          { id: "m1", label: "Plumbing Service", amount: 800, category: "maintenance" },
        ],
      };

      const totals = calculateInvoiceTotals(ctx);
      expect(totals.penaltyTotal).toBe(1500);
      expect(totals.maintenanceTotal).toBe(800);
      expect(totals.totalDue).toBe(18800);
    });
  });

  describe("Interaction 2: Audience Filter Segmentation & Template Substitution", () => {
    const activeLeases: ActiveLeaseSummary[] = [
      {
        id: "l-1",
        tenantId: "t-1",
        tenantName: "Elena Cruz",
        unitId: "u-1",
        unitName: "Unit 105",
        propertyId: "prop-1",
        propertyName: "Pines View",
        monthlyRent: 14000,
        startDate: "2026-01-01",
        endDate: "2027-06-30",
        outstandingBalance: 14000,
        daysOverdue: 9,
        dueDate: "2026-11-06",
      },
      {
        id: "l-2",
        tenantId: "t-2",
        tenantName: "Roberto Gomez",
        unitId: "u-2",
        unitName: "Unit 208",
        propertyId: "prop-1",
        propertyName: "Pines View",
        monthlyRent: 12000,
        startDate: "2025-12-01",
        endDate: "2026-12-15", // Expiring in 30 days
        outstandingBalance: 0,
        daysOverdue: 0,
        dueDate: "2026-11-28",
      },
    ];

    it("should filter overdue tenants and render personalized overdue notice", () => {
      const overdue = filterAudience(activeLeases, "overdue_5d");
      expect(overdue).toHaveLength(1);
      const target = overdue[0];

      const message = substituteTemplate("payment_overdue", {
        tenant_name: target.tenantName,
        unit: target.unitName,
        property_name: target.propertyName,
        amount: formatPHP(target.outstandingBalance),
        days_overdue: String(target.daysOverdue),
        due_date: target.dueDate,
      });

      expect(message).toContain("Unit 105");
      expect(message).toContain("Unit 105");
      expect(message).toContain("₱14,000.00");
      expect(message).toContain("overdue by 9 days");
      expect(message).toContain("2026-11-06");
    });

    it("should filter expiring leases and render personalized renewal offer", () => {
      const expiring = filterAudience(activeLeases, "expiring_leases_60d", {
        referenceDate: "2026-11-15",
      });
      expect(expiring).toHaveLength(1);
      const target = expiring[0];

      const message = substituteTemplate("lease_renewal", {
        tenant_name: target.tenantName,
        unit: target.unitName,
        property_name: target.propertyName,
        lease_end_date: target.endDate,
      });

      expect(message).toContain("Roberto Gomez");
      expect(message).toContain("Unit 208");
      expect(message).toContain("2026-12-15");
    });

    it("should neutralize script payloads in tenant profile before audience broadcast dispatch", () => {
      const maliciousTenant: ActiveLeaseSummary = {
        ...activeLeases[0],
        unitName: "<script>alert('pwned')</script>Unit 105",
      };

      const message = substituteTemplate("payment_overdue", {
        tenant_name: maliciousTenant.tenantName,
        unit: maliciousTenant.unitName,
        property_name: maliciousTenant.propertyName,
        amount: formatPHP(maliciousTenant.outstandingBalance),
        days_overdue: String(maliciousTenant.daysOverdue),
        due_date: maliciousTenant.dueDate,
      });

      expect(message).not.toContain("<script>");
      expect(message).toContain("Unit 105");
    });
  });

  describe("Interaction 3: FSM Invoice Progression, Calculation & Quick Settlement", () => {
    it("should carry calculated FSM invoice directly into quick settlement recording", () => {
      // Step 1: Complete FSM Flow to COMMITTED
      let state: InvoiceFsmState = { status: "IDLE", context: null };
      state = invoiceFsmReducer(state, { type: "START" });
      state = invoiceFsmReducer(state, {
        type: "SELECT_UNIT",
        payload: {
          ...baseLease,
          water: { billingMode: "tenant_paid", ratePerUnit: 50, previousReading: 100 },
        },
      });
      state = invoiceFsmReducer(state, {
        type: "UPDATE_METERS",
        payload: { water: { currentReading: 120 } }, // 20 units * 50 = 1000
      });
      state = invoiceFsmReducer(state, {
        type: "UPDATE_CUSTOM_ITEMS",
        payload: { customItems: [] },
      });

      // Calculate totals
      const totals = calculateInvoiceTotals(state.context!);
      expect(totals.totalDue).toBe(17000); // 16000 + 1000

      state = invoiceFsmReducer(state, {
        type: "PROCEED_TO_REVIEW",
        payload: { totalAmount: totals.totalDue },
      });
      state = invoiceFsmReducer(state, { type: "COMMIT" });
      expect(state.status).toBe("COMMITTED");

      // Step 2: Record Cash Quick Settlement for the committed invoice
      const settlement = recordQuickSettlement(
        {
          invoiceId: state.context!.leaseId,
          amount: totals.totalDue,
          method: "cash",
          paymentDate: "2026-11-25",
          note: "Paid in full upon invoice issuance",
        },
        {
          id: state.context!.leaseId,
          totalAmount: totals.totalDue,
          currentBalance: totals.totalDue,
        },
        "FSM01"
      );

      expect(settlement.success).toBe(true);
      expect(settlement.status).toBe("completed");
      expect(settlement.remainingBalance).toBe(0);
      expect(settlement.receiptNumber).toBe("REC-202611-FSM01");
    });

    it("should handle partial cash settlement on calculated invoice with balance tracking", () => {
      const totals = calculateInvoiceTotals({
        ...baseLease,
        monthlyRent: 20000,
      });

      const settlement = recordQuickSettlement(
        {
          invoiceId: "lease-101",
          amount: 8000,
          method: "bank_transfer",
          paymentDate: "2026-11-26",
          referenceNumber: "TXN-998877",
        },
        {
          id: "lease-101",
          totalAmount: totals.totalDue,
          currentBalance: totals.totalDue,
        }
      );

      expect(settlement.status).toBe("partial");
      expect(settlement.amountPaid).toBe(8000);
      expect(settlement.remainingBalance).toBe(12000);
    });
  });

  describe("Interaction 4: Maintenance Triage & Invoice Addition", () => {
    it("should transition ticket to resolved and convert repair cost into invoice custom item", () => {
      const ticket: MaintenanceTicketSummary = {
        id: "m-tk-55",
        unitId: baseLease.unitId,
        unitName: baseLease.unitName,
        propertyId: baseLease.propertyId,
        propertyName: baseLease.propertyName,
        tenantName: baseLease.tenantName,
        title: "Broken AC Fan",
        description: "AC unit fan motor required replacement",
        priority: "high",
        status: "in_progress",
        assignedTechnician: "Alex Refrigeration",
        createdAt: "2026-11-12T08:00:00Z",
      };

      // Triage ticket to resolved
      const resolvedTicket = updateMaintenanceTicketStatus(ticket, "resolved");
      expect(resolvedTicket.status).toBe("resolved");

      // Bill tenant for replacement part via invoice custom items
      const repairCost = 1850;
      const invoiceCtx: InvoiceBuildContext = {
        ...baseLease,
        customItems: [
          {
            id: `repair-${resolvedTicket.id}`,
            label: `Maintenance: ${resolvedTicket.title}`,
            amount: repairCost,
            category: "maintenance",
          },
        ],
      };

      const totals = calculateInvoiceTotals(invoiceCtx);
      expect(totals.maintenanceTotal).toBe(1850);
      expect(totals.totalDue).toBe(17850);
      expect(totals.itemizedSummary.some((i) => i.id === "repair-m-tk-55")).toBe(true);
    });
  });

  describe("Interaction 5: Asymmetric Utilities (Rollover Water + Included Electricity)", () => {
    it("should compute rollover water delta while electricity remains zero-rated", () => {
      const ctx: InvoiceBuildContext = {
        ...baseLease,
        water: {
          billingMode: "tenant_paid",
          ratePerUnit: 60,
          previousReading: 9990,
          currentReading: 15, // Rollover -> 25 units * 60 = ₱1500
          hasRollover: true,
        },
        electricity: {
          billingMode: "included_in_rent",
          ratePerUnit: 12,
          previousReading: 3000,
          currentReading: 3200, // 200 kWh, but included in rent
        },
      };

      const totals = calculateInvoiceTotals(ctx);
      expect(totals.isRolloverWater).toBe(true);
      expect(totals.waterUsage).toBe(25);
      expect(totals.waterCharge).toBe(1500);
      expect(totals.electricityCharge).toBe(0); // rent-included
      expect(totals.totalDue).toBe(17500); // 16000 + 1500
    });

    it("should compute rollover electricity delta while water is normal tenant-paid", () => {
      const ctx: InvoiceBuildContext = {
        ...baseLease,
        water: {
          billingMode: "tenant_paid",
          ratePerUnit: 50,
          previousReading: 100,
          currentReading: 110, // 10 units = ₱500
          hasRollover: false,
        },
        electricity: {
          billingMode: "tenant_paid",
          ratePerUnit: 15,
          previousReading: 99950,
          currentReading: 50, // 5-digit Rollover: (100000 - 99950) + 50 = 100 units * 15 = ₱1500
          hasRollover: true,
        },
      };

      const totals = calculateInvoiceTotals(ctx);
      expect(totals.isRolloverWater).toBe(false);
      expect(totals.isRolloverElectricity).toBe(true);
      expect(totals.waterCharge).toBe(500);
      expect(totals.electricityCharge).toBe(1500);
      expect(totals.totalDue).toBe(18000); // 16000 + 500 + 1500
    });

    it("should compute simultaneous rollovers on both water and electricity", () => {
      const ctx: InvoiceBuildContext = {
        ...baseLease,
        water: {
          billingMode: "tenant_paid",
          ratePerUnit: 50,
          previousReading: 9998,
          currentReading: 8, // Rollover: (10000 - 9998) + 8 = 10 units * 50 = ₱500
          hasRollover: true,
        },
        electricity: {
          billingMode: "tenant_paid",
          ratePerUnit: 12,
          previousReading: 9990,
          currentReading: 30, // Rollover: (10000 - 9990) + 30 = 40 units * 12 = ₱480
          hasRollover: true,
        },
      };

      const totals = calculateInvoiceTotals(ctx);
      expect(totals.isRolloverWater).toBe(true);
      expect(totals.isRolloverElectricity).toBe(true);
      expect(totals.waterCharge).toBe(500);
      expect(totals.electricityCharge).toBe(480);
      expect(totals.totalDue).toBe(16980);
    });
  });

  describe("Interaction 6: FSM Step-Back and Calculation Adjustment", () => {
    it("should adjust total due when stepping back from review to modify meter reading", () => {
      let state: InvoiceFsmState = { status: "IDLE", context: null };
      state = invoiceFsmReducer(state, { type: "START" });
      state = invoiceFsmReducer(state, {
        type: "SELECT_UNIT",
        payload: {
          ...baseLease,
          water: { billingMode: "tenant_paid", ratePerUnit: 50, previousReading: 100 },
        },
      });

      // Initial reading: 110 (usage 10, charge 500)
      state = invoiceFsmReducer(state, {
        type: "UPDATE_METERS",
        payload: { water: { currentReading: 110 } },
      });
      state = invoiceFsmReducer(state, {
        type: "UPDATE_CUSTOM_ITEMS",
        payload: { customItems: [] },
      });
      expect(state.status).toBe("REVIEW");

      let totals = calculateInvoiceTotals(state.context!);
      expect(totals.totalDue).toBe(16500);

      // Step back: REVIEW -> CUSTOM_ITEMS -> INPUT_METERS
      state = invoiceFsmReducer(state, { type: "BACK" });
      expect(state.status).toBe("CUSTOM_ITEMS");
      state = invoiceFsmReducer(state, { type: "BACK" });
      expect(state.status).toBe("INPUT_METERS");

      // Corrected reading: 120 (usage 20, charge 1000)
      state = invoiceFsmReducer(state, {
        type: "UPDATE_METERS",
        payload: { water: { currentReading: 120 } },
      });
      state = invoiceFsmReducer(state, {
        type: "UPDATE_CUSTOM_ITEMS",
        payload: { customItems: [] },
      });
      expect(state.status).toBe("REVIEW");

      totals = calculateInvoiceTotals(state.context!);
      expect(totals.totalDue).toBe(17000);
    });
  });

  describe("Interaction 7: Due Soon Filter & Gentle Template", () => {
    it("should filter due soon tenants and render personalized gentle reminder", () => {
      const leaseDueSoon: ActiveLeaseSummary = {
        id: "l-soon",
        tenantId: "t-soon",
        tenantName: "Ana Lim",
        unitId: "u-soon",
        unitName: "Studio 402",
        propertyId: "prop-1",
        propertyName: "Pines View",
        monthlyRent: 11000,
        startDate: "2026-01-01",
        endDate: "2027-01-01",
        outstandingBalance: 11000,
        daysOverdue: 0,
        dueDate: "2026-11-18",
      };

      const filtered = filterAudience([leaseDueSoon], "due_soon", {
        referenceDate: "2026-11-15",
        dueSoonDaysThreshold: 5,
      });
      expect(filtered).toHaveLength(1);

      const msg = substituteTemplate("payment_gentle", {
        tenant_name: filtered[0].tenantName,
        unit: filtered[0].unitName,
        property_name: filtered[0].propertyName,
        amount: formatPHP(filtered[0].outstandingBalance),
        due_date: filtered[0].dueDate,
      });

      expect(msg).toContain("Dear Ana Lim");
      expect(msg).toContain("₱11,000.00");
      expect(msg).toContain("Studio 402");
      expect(msg).toContain("2026-11-18");
    });
  });

  describe("Interaction 8: Operations Context Recalculation After Settlement", () => {
    it("should recalculate total receivables after recording full settlement on overdue lease", () => {
      const lease: ActiveLeaseSummary = {
        id: "l-overdue",
        tenantId: "t-overdue",
        tenantName: "Carlos Reyes",
        unitId: "u-10",
        unitName: "Unit 10",
        propertyId: "prop-1",
        propertyName: "Pines View",
        monthlyRent: 15000,
        startDate: "2026-01-01",
        endDate: "2027-01-01",
        outstandingBalance: 15000,
        daysOverdue: 10,
        dueDate: "2026-11-02",
      };

      const initialContext = buildOperationsContext("landlord-1", [], [lease], []);
      expect(initialContext.totalReceivables).toBe(15000);
      expect(initialContext.overdueLeases).toHaveLength(1);

      const settlement = recordQuickSettlement(
        {
          invoiceId: "inv-10",
          amount: 15000,
          method: "cash",
          paymentDate: "2026-11-12",
        },
        { id: "inv-10", totalAmount: 15000, currentBalance: 15000 }
      );
      expect(settlement.status).toBe("completed");

      const updatedLease: ActiveLeaseSummary = {
        ...lease,
        outstandingBalance: settlement.remainingBalance,
        daysOverdue: 0,
      };

      const updatedContext = buildOperationsContext("landlord-1", [], [updatedLease], []);
      expect(updatedContext.totalReceivables).toBe(0);
      expect(updatedContext.overdueLeases).toHaveLength(0);
    });
  });

  describe("Interaction 9: FSM Meter Validation Rollover Handling", () => {
    it("should reject meter reading when current < previous without rollover, then accept with rollover", () => {
      let state: InvoiceFsmState = { status: "IDLE", context: null };
      state = invoiceFsmReducer(state, { type: "START" });
      state = invoiceFsmReducer(state, {
        type: "SELECT_UNIT",
        payload: {
          ...baseLease,
          water: { billingMode: "tenant_paid", ratePerUnit: 50, previousReading: 9990 },
        },
      });

      // Without hasRollover: should return error
      const failedState = invoiceFsmReducer(state, {
        type: "UPDATE_METERS",
        payload: { water: { currentReading: 15, hasRollover: false } },
      });
      expect(failedState.error).toContain("less than previous reading");
      expect(failedState.status).toBe("INPUT_METERS");

      // With hasRollover: should succeed and transition to CUSTOM_ITEMS
      const successState = invoiceFsmReducer(state, {
        type: "UPDATE_METERS",
        payload: { water: { currentReading: 15, hasRollover: true } },
      });
      expect(successState.error).toBeNull();
      expect(successState.status).toBe("CUSTOM_ITEMS");
    });
  });

  describe("Interaction 10: Maintenance Advisory Dynamic Formatting & Sanitization", () => {
    it("should substitute maintenance advisory with sanitized technician note", () => {
      const ticket: MaintenanceTicketSummary = {
        id: "t-leak",
        unitId: "u-101",
        unitName: "Unit 101",
        propertyId: "prop-1",
        propertyName: "Sunrise Heights",
        tenantName: "Juan Dela Cruz",
        title: "Water Leak",
        description: "Pipe burst in bathroom",
        priority: "urgent",
        status: "pending",
        createdAt: "2026-11-12T08:00:00Z",
      };

      const assigned = updateMaintenanceTicketStatus(ticket, "assigned", {
        assignedTechnician: "Mario Bros Plumbing",
      });
      expect(assigned.status).toBe("assigned");
      expect(assigned.assignedTechnician).toBe("Mario Bros Plumbing");

      const advisory = substituteTemplate("maintenance_advisory", {
        property_name: assigned.propertyName,
        unit: assigned.unitName,
        maintenance_date: "2026-11-13 09:00 AM",
        custom_message: "Technician <script>steal()</script>" + assigned.assignedTechnician + " will inspect main pipe",
      });

      expect(advisory).toContain("Sunrise Heights");
      expect(advisory).toContain("Unit 101");
      expect(advisory).toContain("Mario Bros Plumbing");
      expect(advisory).not.toContain("<script>");
    });
  });

  describe("Interaction 11: End-to-End Invoice Build & Quick Cash Settlement", () => {
    it("should complete full FSM flow and immediate settlement in one cohesive transaction", () => {
      let state: InvoiceFsmState = { status: "IDLE", context: null };
      state = invoiceFsmReducer(state, { type: "START" });
      state = invoiceFsmReducer(state, {
        type: "SELECT_UNIT",
        payload: {
          ...baseLease,
          monthlyRent: 20000,
          water: { billingMode: "tenant_paid", ratePerUnit: 40, previousReading: 200 },
          electricity: { billingMode: "included_in_rent", ratePerUnit: 0, previousReading: 0 },
        },
      });

      state = invoiceFsmReducer(state, {
        type: "UPDATE_METERS",
        payload: { water: { currentReading: 225 } }, // 25 units * 40 = 1000
      });

      state = invoiceFsmReducer(state, {
        type: "UPDATE_CUSTOM_ITEMS",
        payload: {
          customItems: [{ id: "parking", label: "Parking slot", amount: 2500, category: "other" }],
        },
      });

      const totals = calculateInvoiceTotals(state.context!);
      expect(totals.totalDue).toBe(23500); // 20000 rent + 1000 water + 2500 parking

      state = invoiceFsmReducer(state, {
        type: "PROCEED_TO_REVIEW",
        payload: { totalAmount: totals.totalDue },
      });
      expect(state.status).toBe("REVIEW");

      state = invoiceFsmReducer(state, { type: "COMMIT" });
      expect(state.status).toBe("COMMITTED");

      // Now tenant pays 15000 partial in cash
      const partialSettlement = recordQuickSettlement(
        {
          invoiceId: "inv-e2e",
          amount: 15000,
          method: "cash",
          paymentDate: "2026-11-12",
        },
        { id: "inv-e2e", totalAmount: totals.totalDue, currentBalance: totals.totalDue },
        "E2E01"
      );

      expect(partialSettlement.status).toBe("partial");
      expect(partialSettlement.remainingBalance).toBe(8500);
      expect(partialSettlement.receiptNumber).toBe("REC-202611-E2E01");
    });
  });

  describe("Interaction 12: General Notice Fallback & Dynamic Tag Substitution", () => {
    it("should format broadcast notice using default fallback when property is missing", () => {
      const notice = substituteTemplate("general_notice", {
        custom_message: "Annual fire drill scheduled for Saturday 2:00 PM.",
      });
      expect(notice).toBe("Notice to residents of the property: Annual fire drill scheduled for Saturday 2:00 PM.");
    });
  });
});
