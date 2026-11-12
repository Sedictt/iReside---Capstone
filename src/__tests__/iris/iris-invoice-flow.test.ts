import { describe, it, expect } from "vitest";
import {
  roundCentavos,
  formatPhpCurrency,
  validateReadingDelta,
  calculateUtilityCharge,
  buildDraftInvoiceItems,
  calculateInvoiceTotals,
} from "@/lib/services/iris/iris-invoice-flow";
import type { InvoiceBuildContext } from "@/lib/services/iris/iris-fsm";

describe("Iris Invoice Flow & Calculation Suite", () => {
  describe("roundCentavos helper", () => {
    it("should round numbers to 2 decimal places properly", () => {
      expect(roundCentavos(10.556)).toBe(10.56);
      expect(roundCentavos(10.554)).toBe(10.55);
      expect(roundCentavos(0.1 + 0.2)).toBe(0.3);
    });

    it("should handle edge cases like NaN and Infinity", () => {
      expect(roundCentavos(NaN)).toBe(0);
      expect(roundCentavos(Infinity)).toBe(0);
      expect(roundCentavos(-Infinity)).toBe(0);
    });

    it("should handle zero and negative values accurately", () => {
      expect(roundCentavos(0)).toBe(0);
      expect(roundCentavos(-15.456)).toBe(-15.46);
    });
  });

  describe("formatPhpCurrency helper", () => {
    it("should format numbers with Philippine Peso symbol and two decimals", () => {
      expect(formatPhpCurrency(15000)).toBe("₱15,000.00");
      expect(formatPhpCurrency(1234.5)).toBe("₱1,234.50");
      expect(formatPhpCurrency(0)).toBe("₱0.00");
    });
  });

  describe("validateReadingDelta utility validator", () => {
    it("should return valid and positive usage when current >= previous", () => {
      const res = validateReadingDelta(100, 150);
      expect(res.valid).toBe(true);
      expect(res.usage).toBe(50);
      expect(res.error).toBeUndefined();
    });

    it("should return valid and 0 usage when readings are identical", () => {
      const res = validateReadingDelta(200, 200);
      expect(res.valid).toBe(true);
      expect(res.usage).toBe(0);
    });

    it("should reject negative readings", () => {
      expect(validateReadingDelta(-10, 50).valid).toBe(false);
      expect(validateReadingDelta(50, -5).valid).toBe(false);
    });

    it("should reject current < previous when allowMeterReset and hasRollover are not set", () => {
      const res = validateReadingDelta(250, 100);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/Current reading (.*) is less than previous reading/i);
    });

    it("should calculate new baseline consumption when allowMeterReset is true", () => {
      const res = validateReadingDelta(950, 25, { allowMeterReset: true });
      expect(res.valid).toBe(true);
      expect(res.usage).toBe(25);
    });

    it("should calculate rollover delta when hasRollover is true", () => {
      // 4-digit meter: 9990 -> 15 => (10000 - 9990) + 15 = 25
      const res = validateReadingDelta(9990, 15, { hasRollover: true });
      expect(res.valid).toBe(true);
      expect(res.usage).toBe(25);
    });
  });

  describe("calculateUtilityCharge helper", () => {
    it("should return 0 when billingMode is included_in_rent", () => {
      expect(calculateUtilityCharge(50, 45, "included_in_rent")).toBe(0);
    });

    it("should calculate exact charge when tenant_paid", () => {
      expect(calculateUtilityCharge(15, 50, "tenant_paid")).toBe(750);
      expect(calculateUtilityCharge(12.5, 45.5, "tenant_paid")).toBe(568.75);
    });

    it("should throw error for negative usage or rate", () => {
      expect(() => calculateUtilityCharge(-5, 10, "tenant_paid")).toThrow(/non-negative/i);
      expect(() => calculateUtilityCharge(10, -5, "tenant_paid")).toThrow(/non-negative/i);
    });
  });

  describe("buildDraftInvoiceItems line items assembly", () => {
    const sampleContext: InvoiceBuildContext = {
      leaseId: "lease-001",
      tenantId: "tenant-001",
      tenantName: "Maria Clara",
      unitId: "unit-001",
      unitName: "Unit 101",
      propertyId: "prop-001",
      propertyName: "Greenview Residences",
      monthlyRent: 12000,
      billingMonth: "2026-11",
      dueDate: "2026-11-25",
      water: {
        billingMode: "tenant_paid",
        ratePerUnit: 40,
        previousReading: 100,
        currentReading: 110,
      },
      electricity: {
        billingMode: "tenant_paid",
        ratePerUnit: 12,
        previousReading: 1000,
        currentReading: 1150,
      },
      customItems: [
        { id: "cust-1", label: "Trash Collection Fee", amount: 250, category: "other" },
        { id: "cust-2", label: "Late Payment Penalty", amount: 500, category: "penalty" },
      ],
      notes: "Standard November Billing",
    };

    it("should build categorized items with proper sortOrder and compute totals", () => {
      const draft = buildDraftInvoiceItems(sampleContext);

      expect(draft.items).toHaveLength(5);
      // Rent item
      expect(draft.items[0].id).toBe("item-rent");
      expect(draft.items[0].category).toBe("rent");
      expect(draft.items[0].sortOrder).toBe(0);
      expect(draft.items[0].amount).toBe(12000);

      // Water item: (110 - 100) * 40 = 400
      expect(draft.items[1].id).toBe("item-water");
      expect(draft.items[1].category).toBe("water");
      expect(draft.items[1].sortOrder).toBe(10);
      expect(draft.items[1].amount).toBe(400);

      // Electric item: (1150 - 1000) * 12 = 1800
      expect(draft.items[2].id).toBe("item-electricity");
      expect(draft.items[2].category).toBe("electricity");
      expect(draft.items[2].sortOrder).toBe(20);
      expect(draft.items[2].amount).toBe(1800);

      // Custom items
      expect(draft.items[3].id).toBe("cust-1");
      expect(draft.items[3].sortOrder).toBe(30);

      // Totals
      // Subtotal = 12000 + 400 + 1800 + 250 + 500 = 14950
      expect(draft.subtotal).toBe(14950);
      expect(draft.totalAmount).toBe(14950);
      expect(draft.waterUsage).toBe(10);
      expect(draft.waterCharge).toBe(400);
      expect(draft.electricityUsage).toBe(150);
      expect(draft.electricityCharge).toBe(1800);
      expect(draft.customTotal).toBe(750);
    });

    it("should omit water or electric line item when included_in_rent", () => {
      const contextWithIncludedUtilities: InvoiceBuildContext = {
        ...sampleContext,
        water: {
          billingMode: "included_in_rent",
          ratePerUnit: 0,
          previousReading: 0,
        },
        electricity: {
          billingMode: "included_in_rent",
          ratePerUnit: 0,
          previousReading: 0,
        },
        customItems: [],
      };

      const draft = buildDraftInvoiceItems(contextWithIncludedUtilities);
      expect(draft.items).toHaveLength(1); // Only rent
      expect(draft.subtotal).toBe(12000);
      expect(draft.totalAmount).toBe(12000);
    });
  });
});
