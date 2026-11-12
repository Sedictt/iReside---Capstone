import { describe, it, expect } from "vitest";
import {
  roundToCentavos,
  formatPHP,
  calculateMeterUsage,
  calculateUtilityCharge,
  calculateInvoiceTotals,
} from "@/lib/services/iris/iris-invoice-flow";
import type { InvoiceBuildContext } from "@/lib/services/iris/iris-fsm";

describe("Iris Invoice Calculation Engine", () => {
  describe("roundToCentavos precision math", () => {
    it("should return 0 for zero", () => {
      expect(roundToCentavos(0)).toBe(0);
    });

    it("should round 10.555 up to 10.56", () => {
      expect(roundToCentavos(10.555)).toBe(10.56);
    });

    it("should round 10.554 down to 10.55", () => {
      expect(roundToCentavos(10.554)).toBe(10.55);
    });

    it("should fix floating point binary anomalies like 0.1 + 0.2", () => {
      expect(roundToCentavos(0.1 + 0.2)).toBe(0.3);
    });

    it("should round 0.005 up to 0.01", () => {
      expect(roundToCentavos(0.005)).toBe(0.01);
    });

    it("should handle negative numbers correctly", () => {
      expect(roundToCentavos(-50.256)).toBe(-50.26);
    });

    it("should return 0 for NaN", () => {
      expect(roundToCentavos(NaN)).toBe(0);
    });

    it("should return 0 for Infinity", () => {
      expect(roundToCentavos(Infinity)).toBe(0);
      expect(roundToCentavos(-Infinity)).toBe(0);
    });
  });

  describe("formatPHP formatting", () => {
    it("should format 0 as ₱0.00", () => {
      expect(formatPHP(0)).toBe("₱0.00");
    });

    it("should format whole amounts with comma grouping", () => {
      expect(formatPHP(15000)).toBe("₱15,000.00");
    });

    it("should format fractional amounts with exact two decimals", () => {
      expect(formatPHP(1234.5)).toBe("₱1,234.50");
      expect(formatPHP(1234.56)).toBe("₱1,234.56");
    });

    it("should round and format multi-digit amounts", () => {
      expect(formatPHP(1250000.758)).toBe("₱1,250,000.76");
    });
  });

  describe("calculateMeterUsage with deltas and rollovers", () => {
    it("should calculate standard positive consumption delta", () => {
      const res = calculateMeterUsage(100, 145);
      expect(res.usage).toBe(45);
      expect(res.hasRollover).toBe(false);
    });

    it("should calculate zero consumption when readings are identical", () => {
      const res = calculateMeterUsage(250, 250);
      expect(res.usage).toBe(0);
      expect(res.hasRollover).toBe(false);
    });

    it("should calculate decimal meter usage accurately", () => {
      const res = calculateMeterUsage(115.3, 130.8);
      expect(res.usage).toBe(15.5);
      expect(res.hasRollover).toBe(false);
    });

    it("should throw error if previous reading is negative", () => {
      expect(() => calculateMeterUsage(-10, 50)).toThrow(/cannot be negative/i);
    });

    it("should throw error if current reading is negative", () => {
      expect(() => calculateMeterUsage(50, -10)).toThrow(/cannot be negative/i);
    });

    it("should throw error if current < previous and hasRollover is false", () => {
      expect(() => calculateMeterUsage(500, 480, { hasRollover: false })).toThrow(
        /less than previous reading/i
      );
    });

    it("should calculate rollover usage for 4-digit mechanical meter (9999 to 0015)", () => {
      const res = calculateMeterUsage(9999, 15, { hasRollover: true, maxReading: 10000 });
      expect(res.usage).toBe(16); // (10000 - 9999) + 15 = 16
      expect(res.hasRollover).toBe(true);
    });

    it("should calculate rollover usage with inferred capacity when maxReading omitted", () => {
      // 9950 is 4 digits -> capacity 10000
      const res = calculateMeterUsage(9950, 25, { hasRollover: true });
      expect(res.usage).toBe(75); // (10000 - 9950) + 25 = 75
      expect(res.hasRollover).toBe(true);
    });

    it("should calculate rollover usage for 5-digit digital meter (99980 to 20)", () => {
      const res = calculateMeterUsage(99980, 20, { hasRollover: true, maxReading: 100000 });
      expect(res.usage).toBe(40); // (100000 - 99980) + 20 = 40
      expect(res.hasRollover).toBe(true);
    });
  });

  describe("calculateUtilityCharge", () => {
    it("should return 0 charge when billingMode is included_in_rent", () => {
      const charge = calculateUtilityCharge(120, 50, "included_in_rent");
      expect(charge).toBe(0);
    });

    it("should calculate correct charge for tenant_paid utilities", () => {
      const charge = calculateUtilityCharge(20, 45, "tenant_paid");
      expect(charge).toBe(900);
    });

    it("should calculate charge with fractional rate and centavos precision", () => {
      const charge = calculateUtilityCharge(145, 12.35, "tenant_paid");
      expect(charge).toBe(1790.75); // 145 * 12.35 = 1790.75
    });

    it("should return 0 charge when usage is 0", () => {
      const charge = calculateUtilityCharge(0, 15, "tenant_paid");
      expect(charge).toBe(0);
    });

    it("should throw error when rate is negative", () => {
      expect(() => calculateUtilityCharge(10, -5, "tenant_paid")).toThrow(/must be non-negative/i);
    });

    it("should throw error when usage is negative", () => {
      expect(() => calculateUtilityCharge(-10, 15, "tenant_paid")).toThrow(/must be non-negative/i);
    });
  });

  describe("calculateInvoiceTotals complete invoicing flow", () => {
    const baseContext: InvoiceBuildContext = {
      leaseId: "lease-1",
      tenantId: "tenant-1",
      tenantName: "Ana Reyes",
      unitId: "unit-101",
      unitName: "Studio 101",
      propertyId: "prop-1",
      propertyName: "Greenwood Residences",
      monthlyRent: 12000,
      billingMonth: "2026-11",
      dueDate: "2026-11-28",
      customItems: [],
    };

    it("should calculate rent-only invoice when no utilities or custom items", () => {
      const totals = calculateInvoiceTotals(baseContext);
      expect(totals.rentAmount).toBe(12000);
      expect(totals.waterCharge).toBe(0);
      expect(totals.electricityCharge).toBe(0);
      expect(totals.customChargesTotal).toBe(0);
      expect(totals.totalDue).toBe(12000);
      expect(totals.itemizedSummary).toHaveLength(1);
      expect(totals.itemizedSummary[0].category).toBe("rent");
    });

    it("should include tenant_paid water charge in totals", () => {
      const ctx: InvoiceBuildContext = {
        ...baseContext,
        water: {
          billingMode: "tenant_paid",
          ratePerUnit: 50,
          previousReading: 120,
          currentReading: 130, // 10 units = ₱500
        },
      };

      const totals = calculateInvoiceTotals(ctx);
      expect(totals.waterUsage).toBe(10);
      expect(totals.waterCharge).toBe(500);
      expect(totals.totalDue).toBe(12500);
      expect(totals.isRolloverWater).toBe(false);
    });

    it("should handle water rollover calculation correctly in totals", () => {
      const ctx: InvoiceBuildContext = {
        ...baseContext,
        water: {
          billingMode: "tenant_paid",
          ratePerUnit: 50,
          previousReading: 9995,
          currentReading: 5, // Rollover -> 10 units = ₱500
          hasRollover: true,
        },
      };

      const totals = calculateInvoiceTotals(ctx);
      expect(totals.waterUsage).toBe(10);
      expect(totals.waterCharge).toBe(500);
      expect(totals.isRolloverWater).toBe(true);
      expect(totals.totalDue).toBe(12500);
    });

    it("should zero-out water charge if water is included_in_rent", () => {
      const ctx: InvoiceBuildContext = {
        ...baseContext,
        water: {
          billingMode: "included_in_rent",
          ratePerUnit: 50,
          previousReading: 100,
          currentReading: 150,
        },
      };

      const totals = calculateInvoiceTotals(ctx);
      expect(totals.waterCharge).toBe(0);
      expect(totals.totalDue).toBe(12000);
    });

    it("should include tenant_paid electricity in totals", () => {
      const ctx: InvoiceBuildContext = {
        ...baseContext,
        electricity: {
          billingMode: "tenant_paid",
          ratePerUnit: 14.5,
          previousReading: 2000,
          currentReading: 2150, // 150 kWh * 14.50 = 2175.00
        },
      };

      const totals = calculateInvoiceTotals(ctx);
      expect(totals.electricityUsage).toBe(150);
      expect(totals.electricityCharge).toBe(2175);
      expect(totals.totalDue).toBe(14175);
    });

    it("should calculate combined water, electricity, and rent", () => {
      const ctx: InvoiceBuildContext = {
        ...baseContext,
        water: {
          billingMode: "tenant_paid",
          ratePerUnit: 50,
          previousReading: 100,
          currentReading: 110, // 500
        },
        electricity: {
          billingMode: "tenant_paid",
          ratePerUnit: 12,
          previousReading: 500,
          currentReading: 600, // 1200
        },
      };

      const totals = calculateInvoiceTotals(ctx);
      expect(totals.rentAmount).toBe(12000);
      expect(totals.waterCharge).toBe(500);
      expect(totals.electricityCharge).toBe(1200);
      expect(totals.subtotal).toBe(13700);
      expect(totals.totalDue).toBe(13700);
    });

    it("should handle skipped utility readings without error", () => {
      const ctx: InvoiceBuildContext = {
        ...baseContext,
        water: {
          billingMode: "tenant_paid",
          ratePerUnit: 50,
          previousReading: 100,
          skipped: true,
        },
      };

      const totals = calculateInvoiceTotals(ctx);
      expect(totals.waterUsage).toBe(0);
      expect(totals.waterCharge).toBe(0);
      expect(totals.totalDue).toBe(12000);
    });

    it("should categorize penalty, maintenance, and other custom items", () => {
      const ctx: InvoiceBuildContext = {
        ...baseContext,
        customItems: [
          { id: "1", label: "Late Payment Penalty", amount: 500, category: "penalty" },
          { id: "2", label: "Door Knob Repair", amount: 350, category: "maintenance" },
          { id: "3", label: "Parking Space", amount: 1500, category: "other" },
        ],
      };

      const totals = calculateInvoiceTotals(ctx);
      expect(totals.penaltyTotal).toBe(500);
      expect(totals.maintenanceTotal).toBe(350);
      expect(totals.otherTotal).toBe(1500);
      expect(totals.customChargesTotal).toBe(2350);
      expect(totals.totalDue).toBe(14350); // 12000 + 2350
    });

    it("should support negative adjustment items (e.g. early payment discount)", () => {
      const ctx: InvoiceBuildContext = {
        ...baseContext,
        customItems: [
          { id: "disc", label: "Loyalty Discount", amount: -500, category: "other" },
        ],
      };

      const totals = calculateInvoiceTotals(ctx);
      expect(totals.customChargesTotal).toBe(-500);
      expect(totals.totalDue).toBe(11500);
    });

    it("should maintain 2-decimal centavos precision with multiple odd amounts", () => {
      const ctx: InvoiceBuildContext = {
        ...baseContext,
        monthlyRent: 8550.33,
        water: {
          billingMode: "tenant_paid",
          ratePerUnit: 48.75,
          previousReading: 120.5,
          currentReading: 133.2, // usage 12.7 * 48.75 = 619.125 -> 619.13
        },
        electricity: {
          billingMode: "tenant_paid",
          ratePerUnit: 13.45,
          previousReading: 1000,
          currentReading: 1075, // usage 75 * 13.45 = 1008.75
        },
        customItems: [
          { id: "fee1", label: "Garbage Fee", amount: 150.25, category: "other" },
        ],
      };

      const totals = calculateInvoiceTotals(ctx);
      expect(totals.rentAmount).toBe(8550.33);
      expect(totals.waterCharge).toBe(619.13);
      expect(totals.electricityCharge).toBe(1008.75);
      expect(totals.customChargesTotal).toBe(150.25);
      // 8550.33 + 619.13 + 1008.75 + 150.25 = 10328.46
      expect(totals.totalDue).toBe(10328.46);
    });

    it("should produce itemized summary matching each item in calculation", () => {
      const ctx: InvoiceBuildContext = {
        ...baseContext,
        water: {
          billingMode: "tenant_paid",
          ratePerUnit: 50,
          previousReading: 10,
          currentReading: 20,
        },
        customItems: [
          { id: "pen", label: "Late fee", amount: 200, category: "penalty" },
        ],
      };

      const totals = calculateInvoiceTotals(ctx);
      expect(totals.itemizedSummary).toHaveLength(3);
      expect(totals.itemizedSummary.map((i) => i.id)).toEqual([
        "rent-charge",
        "water-charge",
        "pen",
      ]);
    });

    it("should calculate meter usage of zero when previous and current are identical", () => {
      const res = calculateMeterUsage(150.5, 150.5);
      expect(res.usage).toBe(0);
      expect(res.hasRollover).toBe(false);
    });

    it("should calculate utility charge accurately for fractional consumption and rate", () => {
      const charge = calculateUtilityCharge(12.5, 45.2, "tenant_paid");
      expect(charge).toBe(565);
    });

    it("should correctly compute zero utility charge when consumption delta is zero", () => {
      const ctx: InvoiceBuildContext = {
        ...baseContext,
        water: {
          billingMode: "tenant_paid",
          ratePerUnit: 50,
          previousReading: 100,
          currentReading: 100,
        },
      };
      const totals = calculateInvoiceTotals(ctx);
      expect(totals.waterUsage).toBe(0);
      expect(totals.waterCharge).toBe(0);
    });

    it("should aggregate multiple penalty line items accurately into penaltyTotal", () => {
      const ctx: InvoiceBuildContext = {
        ...baseContext,
        customItems: [
          { id: "pen1", label: "Late fee 1", amount: 250, category: "penalty" },
          { id: "pen2", label: "Late fee 2", amount: 150.5, category: "penalty" },
        ],
      };
      const totals = calculateInvoiceTotals(ctx);
      expect(totals.penaltyTotal).toBe(400.5);
      expect(totals.customChargesTotal).toBe(400.5);
    });

    it("should round boundary centavos 0.004 down to 0.00", () => {
      expect(roundToCentavos(0.004)).toBe(0);
    });
  });
});
