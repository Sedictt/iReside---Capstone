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
  roundToCentavos,
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
  generateReceiptNumber,
  ActiveLeaseSummary,
  MaintenanceTicketSummary,
  LandlordPropertySummary,
} from "@/lib/services/iris/iris-operations.service";

describe("Iris Real-World Operational Scenarios", () => {
  const property: LandlordPropertySummary = {
    id: "prop-sunflower",
    name: "Sunflower Residences",
    totalUnits: 12,
    occupiedUnits: 10,
  };

  // Scenario 1: End-of-Month Utility Invoicing & Delivery
  describe("Scenario 1: End-of-Month Utility Invoicing & Delivery", () => {
    it("should execute full billing flow: select unit, record meter readings, apply items, and commit invoice", () => {
      // 1. Initial State
      let state: InvoiceFsmState = { status: "IDLE", context: null };
      state = invoiceFsmReducer(state, { type: "START" });
      expect(state.status).toBe("SELECT_UNIT");

      // 2. Select Unit & Set Billing Period
      const unitContext: Omit<InvoiceBuildContext, "customItems"> = {
        leaseId: "lease-101",
        tenantId: "tenant-ana",
        tenantName: "Ana Marie Santos",
        unitId: "unit-301",
        unitName: "Unit 301 - 2BR",
        propertyId: property.id,
        propertyName: property.name,
        monthlyRent: 18500,
        billingMonth: "2026-11",
        dueDate: "2026-12-05",
        water: {
          billingMode: "tenant_paid",
          ratePerUnit: 45.5,
          previousReading: 120,
        },
        electricity: {
          billingMode: "tenant_paid",
          ratePerUnit: 12.25,
          previousReading: 1450,
        },
      };

      state = invoiceFsmReducer(state, {
        type: "SELECT_UNIT",
        payload: unitContext,
      });
      expect(state.status).toBe("INPUT_METERS");
      expect(state.context?.tenantName).toBe("Ana Marie Santos");

      // 3. Landlord enters meter readings: 135 water (15 units), 1580 electricity (130 kWh)
      state = invoiceFsmReducer(state, {
        type: "UPDATE_METERS",
        payload: {
          water: { currentReading: 135 },
          electricity: { currentReading: 1580 },
        },
      });
      expect(state.status).toBe("CUSTOM_ITEMS");

      // 4. Add custom items: Parking fee (2,000) and Aircon cleaning maintenance (800)
      state = invoiceFsmReducer(state, {
        type: "UPDATE_CUSTOM_ITEMS",
        payload: {
          customItems: [
            { id: "item-park", label: "Reserved Parking Slot #5", amount: 2000, category: "other" },
            { id: "item-aircon", label: "Semi-Annual Aircon Maintenance", amount: 800, category: "maintenance" },
          ],
          notes: "November invoice including aircon servicing charge.",
        },
      });
      expect(state.status).toBe("REVIEW");

      // 5. Calculate final invoice totals and verify itemized charges
      const totals = calculateInvoiceTotals(state.context!);
      // Rent: 18,500
      // Water: (135 - 120) * 45.50 = 15 * 45.50 = 682.50
      // Electricity: (1580 - 1450) * 12.25 = 130 * 12.25 = 1592.50
      // Custom: 2000 + 800 = 2800
      // Total: 18500 + 682.50 + 1592.50 + 2800 = 23575.00
      expect(totals.rentAmount).toBe(18500);
      expect(totals.waterUsage).toBe(15);
      expect(totals.waterCharge).toBe(682.5);
      expect(totals.electricityUsage).toBe(130);
      expect(totals.electricityCharge).toBe(1592.5);
      expect(totals.customChargesTotal).toBe(2800);
      expect(totals.totalDue).toBe(23575);
      expect(totals.itemizedSummary).toHaveLength(5);

      // 6. Proceed to review and commit
      state = invoiceFsmReducer(state, {
        type: "PROCEED_TO_REVIEW",
        payload: { totalAmount: totals.totalDue },
      });
      state = invoiceFsmReducer(state, { type: "COMMIT" });
      expect(state.status).toBe("COMMITTED");
      expect(state.error).toBeNull();
    });

    it("should handle mechanical meter dial rollover during month-end reading", () => {
      let state: InvoiceFsmState = { status: "IDLE", context: null };
      state = invoiceFsmReducer(state, { type: "START" });
      state = invoiceFsmReducer(state, {
        type: "SELECT_UNIT",
        payload: {
          leaseId: "lease-102",
          tenantId: "tenant-ben",
          tenantName: "Benedict Tan",
          unitId: "unit-102",
          unitName: "Studio 102",
          propertyId: property.id,
          propertyName: property.name,
          monthlyRent: 12000,
          billingMonth: "2026-11",
          dueDate: "2026-12-05",
          water: {
            billingMode: "tenant_paid",
            ratePerUnit: 50,
            previousReading: 9995, // 4-digit meter close to 9999
          },
        },
      });

      // Reading is 0012, which rolled over: (10000 - 9995) + 12 = 17 units
      state = invoiceFsmReducer(state, {
        type: "UPDATE_METERS",
        payload: {
          water: { currentReading: 12, hasRollover: true },
        },
      });
      expect(state.status).toBe("CUSTOM_ITEMS");

      const totals = calculateInvoiceTotals(state.context!);
      expect(totals.isRolloverWater).toBe(true);
      expect(totals.waterUsage).toBe(17);
      expect(totals.waterCharge).toBe(850);
      expect(totals.totalDue).toBe(12850); // 12000 + 850
    });
  });

  // Scenario 2: Overdue Rent Sweep & Bulk Reminder Dispatch
  describe("Scenario 2: Overdue Rent Sweep & Bulk Reminder Dispatch", () => {
    const portfolioLeases: ActiveLeaseSummary[] = [
      {
        id: "lease-current",
        tenantId: "t-1",
        tenantName: "Grace Tan",
        unitId: "u-1",
        unitName: "Unit 101",
        propertyId: property.id,
        propertyName: property.name,
        monthlyRent: 15000,
        startDate: "2026-01-01",
        endDate: "2027-01-01",
        outstandingBalance: 0,
        daysOverdue: 0,
        dueDate: "2026-11-05",
      },
      {
        id: "lease-overdue-1",
        tenantId: "t-2",
        tenantName: "Eduardo Manalo",
        unitId: "u-2",
        unitName: "Unit 204",
        propertyId: property.id,
        propertyName: property.name,
        monthlyRent: 16000,
        startDate: "2026-02-01",
        endDate: "2027-02-01",
        outstandingBalance: 16000,
        daysOverdue: 8,
        dueDate: "2026-11-04",
      },
      {
        id: "lease-overdue-2",
        tenantId: "t-3",
        tenantName: "Katarina Silva",
        unitId: "u-3",
        unitName: "Unit 305",
        propertyId: property.id,
        propertyName: property.name,
        monthlyRent: 22000,
        startDate: "2026-03-01",
        endDate: "2027-03-01",
        outstandingBalance: 22500, // Includes late fee
        daysOverdue: 14,
        dueDate: "2026-10-29",
      },
      {
        id: "lease-grace-period",
        tenantId: "t-4",
        tenantName: "Lucas Lim",
        unitId: "u-4",
        unitName: "Unit 402",
        propertyId: property.id,
        propertyName: property.name,
        monthlyRent: 14000,
        startDate: "2026-04-01",
        endDate: "2027-04-01",
        outstandingBalance: 14000,
        daysOverdue: 3, // Less than 5 days overdue threshold
        dueDate: "2026-11-09",
      },
    ];

    it("should sweep portfolio, isolate leases overdue >= 5 days, and dispatch personalized reminder notices", () => {
      // 1. Run sweep filter
      const delinquentLeases = filterAudience(portfolioLeases, "overdue_5d");
      expect(delinquentLeases).toHaveLength(2);
      expect(delinquentLeases.map((l) => l.tenantName)).toEqual([
        "Eduardo Manalo",
        "Katarina Silva",
      ]);

      // 2. Dispatch reminder notices for delinquent tenants
      const dispatchedNotifications = delinquentLeases.map((lease) => {
        const text = substituteTemplate("payment_overdue", {
          unit: lease.unitName,
          property_name: lease.propertyName,
          amount: formatPHP(lease.outstandingBalance),
          days_overdue: String(lease.daysOverdue),
          due_date: lease.dueDate,
        });
        return {
          tenantId: lease.tenantId,
          unit: lease.unitName,
          text,
        };
      });

      expect(dispatchedNotifications).toHaveLength(2);

      // Verify Eduardo's notification
      const eduardoMsg = dispatchedNotifications[0];
      expect(eduardoMsg.unit).toBe("Unit 204");
      expect(eduardoMsg.text).toContain("₱16,000.00");
      expect(eduardoMsg.text).toContain("overdue by 8 days");
      expect(eduardoMsg.text).toContain("2026-11-04");

      // Verify Katarina's notification
      const katarinaMsg = dispatchedNotifications[1];
      expect(katarinaMsg.unit).toBe("Unit 305");
      expect(katarinaMsg.text).toContain("₱22,500.00");
      expect(katarinaMsg.text).toContain("overdue by 14 days");
      expect(katarinaMsg.text).toContain("2026-10-29");
    });

    it("should strip injected XSS script payloads embedded in property names during reminder dispatch", () => {
      const maliciousLease: ActiveLeaseSummary = {
        ...portfolioLeases[1],
        propertyName: "<script>alert('hack')</script>Sunflower Residences",
      };

      const message = substituteTemplate("payment_overdue", {
        unit: maliciousLease.unitName,
        property_name: maliciousLease.propertyName,
        amount: formatPHP(maliciousLease.outstandingBalance),
        days_overdue: String(maliciousLease.daysOverdue),
        due_date: maliciousLease.dueDate,
      });

      expect(message).not.toContain("<script>");
      expect(message).not.toContain("alert('hack')");
      expect(message).toContain("Sunflower Residences");
    });
  });

  // Scenario 3: Face-to-Face Cash Collection & Instant Receipt Generation
  describe("Scenario 3: Face-to-Face Cash Collection & Instant Receipt Generation", () => {
    const walkinInvoice = {
      id: "inv-walkin-77",
      totalAmount: 20000,
      currentBalance: 20000,
    };

    it("should process walk-in partial cash settlement and generate authentic receipt", () => {
      // Walk-in tenant pays ₱12,000 cash first
      const partialPayment = recordQuickSettlement(
        {
          invoiceId: walkinInvoice.id,
          amount: 12000,
          method: "cash",
          paymentDate: "2026-11-12",
          note: "Handed cash to building manager in lobby office",
        },
        walkinInvoice,
        "CSH01"
      );

      expect(partialPayment.success).toBe(true);
      expect(partialPayment.receiptNumber).toBe("REC-202611-CSH01");
      expect(partialPayment.amountPaid).toBe(12000);
      expect(partialPayment.remainingBalance).toBe(8000);
      expect(partialPayment.status).toBe("partial");
      expect(partialPayment.method).toBe("cash");
    });

    it("should complete remaining balance settlement on subsequent cash visit", () => {
      const updatedInvoice = {
        id: walkinInvoice.id,
        totalAmount: 20000,
        currentBalance: 8000, // Remaining from previous partial
      };

      const fullPayment = recordQuickSettlement(
        {
          invoiceId: updatedInvoice.id,
          amount: 8000,
          method: "cash",
          paymentDate: "2026-11-14",
          note: "Settled remainder of balance in full",
        },
        updatedInvoice,
        "CSH02"
      );

      expect(fullPayment.success).toBe(true);
      expect(fullPayment.receiptNumber).toBe("REC-202611-CSH02");
      expect(fullPayment.amountPaid).toBe(8000);
      expect(fullPayment.remainingBalance).toBe(0);
      expect(fullPayment.status).toBe("completed");
    });
  });

  // Scenario 4: Emergency Water Leak Maintenance Triage
  describe("Scenario 4: Emergency Water Leak Maintenance Triage", () => {
    const emergencyTicket: MaintenanceTicketSummary = {
      id: "tkt-leak-911",
      unitId: "unit-502",
      unitName: "Unit 502",
      propertyId: property.id,
      propertyName: property.name,
      tenantName: "Danilo Roxas",
      title: "Urgent: Ceiling water leak from unit above",
      description: "Water pouring down bathroom ceiling near lighting fixture",
      priority: "urgent",
      status: "pending",
      createdAt: "2026-11-12T02:15:00Z",
    };

    it("should triage ticket from pending to assigned with emergency plumber and notify residents", () => {
      // 1. Dispatch emergency plumber
      const assignedTicket = updateMaintenanceTicketStatus(
        emergencyTicket,
        "assigned",
        { assignedTechnician: "FastFix Plumbing Services - Engr. Paul" }
      );
      expect(assignedTicket.status).toBe("assigned");
      expect(assignedTicket.assignedTechnician).toBe("FastFix Plumbing Services - Engr. Paul");

      // 2. Technician arrives on site -> transition to in_progress
      const inProgressTicket = updateMaintenanceTicketStatus(assignedTicket, "in_progress");
      expect(inProgressTicket.status).toBe("in_progress");

      // 3. Send maintenance advisory notice to affected units
      const advisoryNotice = substituteTemplate("maintenance_advisory", {
        property_name: inProgressTicket.propertyName,
        unit: inProgressTicket.unitName,
        maintenance_date: "Immediate (Today)",
        custom_message: "Main water valve shut off temporarily for emergency repair. Estimated repair time: 2 hours.",
      });

      expect(advisoryNotice).toContain(property.name);
      expect(advisoryNotice).toContain("Unit 502");
      expect(advisoryNotice).toContain("Main water valve shut off temporarily");

      // 4. Repair completed and verified
      const resolvedTicket = updateMaintenanceTicketStatus(inProgressTicket, "resolved");
      expect(resolvedTicket.status).toBe("resolved");

      // 5. Final manager sign-off
      const closedTicket = updateMaintenanceTicketStatus(resolvedTicket, "closed");
      expect(closedTicket.status).toBe("closed");
    });
  });

  // Scenario 5: 60-Day Lease Expiry Audit & Renewal Outreach
  describe("Scenario 5: 60-Day Lease Expiry Audit & Renewal Outreach", () => {
    const portfolioAuditLeases: ActiveLeaseSummary[] = [
      {
        id: "lease-exp-1",
        tenantId: "t-aud-1",
        tenantName: "Ramon Valenzuela",
        unitId: "u-aud-1",
        unitName: "Unit 102",
        propertyId: property.id,
        propertyName: property.name,
        monthlyRent: 13500,
        startDate: "2026-01-01",
        endDate: "2026-12-15", // 30 days from Nov 15
        outstandingBalance: 0,
        daysOverdue: 0,
        dueDate: "2026-11-25",
      },
      {
        id: "lease-exp-2",
        tenantId: "t-aud-2",
        tenantName: "Beatrice Corpuz",
        unitId: "u-aud-2",
        unitName: "Unit 205",
        propertyId: property.id,
        propertyName: property.name,
        monthlyRent: 17000,
        startDate: "2026-01-01",
        endDate: "2027-01-10", // 56 days from Nov 15
        outstandingBalance: 0,
        daysOverdue: 0,
        dueDate: "2026-11-25",
      },
      {
        id: "lease-safe",
        tenantId: "t-aud-3",
        tenantName: "Jose Mercado",
        unitId: "u-aud-3",
        unitName: "Unit 304",
        propertyId: property.id,
        propertyName: property.name,
        monthlyRent: 15500,
        startDate: "2026-06-01",
        endDate: "2027-06-01", // ~200 days away
        outstandingBalance: 0,
        daysOverdue: 0,
        dueDate: "2026-11-25",
      },
    ];

    it("should identify leases expiring in 60 days and generate personalized renewal proposals", () => {
      const expiringAudience = filterAudience(
        portfolioAuditLeases,
        "expiring_leases_60d",
        { referenceDate: "2026-11-15" }
      );

      expect(expiringAudience).toHaveLength(2);
      expect(expiringAudience.map((l) => l.tenantName)).toEqual([
        "Ramon Valenzuela",
        "Beatrice Corpuz",
      ]);

      const renewalLetters = expiringAudience.map((lease) =>
        substituteTemplate("lease_renewal", {
          tenant_name: lease.tenantName,
          unit: lease.unitName,
          property_name: lease.propertyName,
          lease_end_date: lease.endDate,
        })
      );

      expect(renewalLetters[0]).toContain("Hello Ramon Valenzuela");
      expect(renewalLetters[0]).toContain("Unit 102");
      expect(renewalLetters[0]).toContain("2026-12-15");

      expect(renewalLetters[1]).toContain("Hello Beatrice Corpuz");
      expect(renewalLetters[1]).toContain("Unit 205");
      expect(renewalLetters[1]).toContain("2027-01-10");
    });

    it("should build accurate landlord portfolio operations snapshot aggregating occupancy, receivables, and tickets", () => {
      const context = buildOperationsContext(
        "landlord-main",
        [property],
        portfolioAuditLeases,
        []
      );

      expect(context.landlordId).toBe("landlord-main");
      expect(context.properties).toHaveLength(1);
      expect(context.activeLeases).toHaveLength(3);
      expect(context.overdueLeases).toHaveLength(0);
      expect(context.totalReceivables).toBe(0);
      // 10 occupied / 12 total = 83.33%
      expect(context.occupancyRate).toBe(83.33);
    });
  });
});
