import { describe, it, expect, vi } from "vitest";
import {
  irisFsmReducer,
  canTransition,
  canProceed,
  getInvoiceTotalPreview,
  canRewindToStep,
  rewindToStep,
  isStepActive,
  validateMeterInput,
  type IrisFsmState,
  type IrisState,
  type InvoiceBuildContext,
} from "../iris-fsm";
import {
  roundCentavos,
  formatPhpCurrency,
  validateReadingDelta,
  calculateMeterUsage,
  calculateUtilityCharge,
  buildDraftInvoiceItems,
  calculateInvoiceTotals,
} from "../iris-invoice-flow";
import {
  sanitizeTemplateInput,
  validateTemplateContext,
  renderTemplate,
  getAvailableTemplateKeys,
} from "../iris-templates";
import {
  generateReceiptNumber,
  filterAudience,
  recordQuickSettlement,
  updateMaintenanceTicketStatus,
  buildOperationsContext,
  verifyLandlordPropertyOwnership,
  verifyLandlordLeaseOwnership,
  getLeaseInvoiceContext,
  getLandlordOperationalContext,
  type ActiveLeaseSummary,
  type MaintenanceTicketSummary,
} from "../iris-operations.service";

describe("Milestone 1 Empirical Stress Testing: iRis Operations Assistant", () => {
  // -------------------------------------------------------------------------
  // 1. Meter Reading Edge Cases
  // -------------------------------------------------------------------------
  describe("1. Meter Reading Edge Cases", () => {
    describe("Floating point precision & centavos rounding", () => {
      it("handles classic IEEE 754 floating point issues (0.1 + 0.2)", () => {
        const sum = 0.1 + 0.2; // 0.30000000000000004 in raw JS
        expect(roundCentavos(sum)).toBe(0.3);
      });

      it("rounds fractional centavos correctly (half up)", () => {
        expect(roundCentavos(10.004)).toBe(10);
        expect(roundCentavos(10.005)).toBe(10.01);
        expect(roundCentavos(10.009)).toBe(10.01);
        expect(roundCentavos(41.1255)).toBe(41.13);
      });

      it("handles NaN, Infinity, -Infinity gracefully without throwing", () => {
        expect(roundCentavos(NaN)).toBe(0);
        expect(roundCentavos(Infinity)).toBe(0);
        expect(roundCentavos(-Infinity)).toBe(0);
      });

      it("formats PHP currency string strictly with peso symbol and 2 decimals", () => {
        expect(formatPhpCurrency(0)).toBe("₱0.00");
        expect(formatPhpCurrency(1500.5)).toBe("₱1,500.50");
        expect(formatPhpCurrency(1234567.89)).toBe("₱1,234,567.89");
        expect(formatPhpCurrency(NaN)).toBe("₱0.00");
      });
    });

    describe("validateReadingDelta & calculateMeterUsage", () => {
      it("accepts equal previous and current readings with zero usage", () => {
        const res = validateReadingDelta(150, 150);
        expect(res.valid).toBe(true);
        expect(res.usage).toBe(0);

        const usageCalc = calculateMeterUsage(150, 150);
        expect(usageCalc.usage).toBe(0);
        expect(usageCalc.hasRollover).toBe(false);
      });

      it("computes normal forward meter progression correctly", () => {
        const res = validateReadingDelta(100.25, 155.75);
        expect(res.valid).toBe(true);
        expect(res.usage).toBe(55.5);
      });

      it("rejects negative previous or current readings", () => {
        const resPrev = validateReadingDelta(-1, 50);
        expect(resPrev.valid).toBe(false);
        expect(resPrev.error).toMatch(/previous/i);

        const resCurr = validateReadingDelta(50, -1);
        expect(resCurr.valid).toBe(false);
        expect(resCurr.error).toMatch(/current/i);

        expect(() => calculateMeterUsage(-5, 10)).toThrow();
        expect(() => calculateMeterUsage(10, -5)).toThrow();
      });

      it("rejects backwards reading when neither rollover nor reset is flagged", () => {
        const res = validateReadingDelta(500, 499);
        expect(res.valid).toBe(false);
        expect(res.usage).toBe(0);
        expect(res.error).toMatch(/less than previous/i);
        expect(() => calculateMeterUsage(500, 499)).toThrow();
      });

      it("handles meter replacement baseline reset (allowMeterReset: true)", () => {
        // Meter replaced: old meter was at 9840, new meter starts at 0 and now reads 35
        const res = validateReadingDelta(9840, 35, { allowMeterReset: true });
        expect(res.valid).toBe(true);
        expect(res.usage).toBe(35);

        const calc = calculateMeterUsage(9840, 35, { allowMeterReset: true });
        expect(calc.usage).toBe(35);
      });

      it("handles meter replacement baseline reset (allowMeterReset: true) when current >= previous", () => {
        // Meter replaced: old meter was at reading 10. New meter starts at 0 and now reads 45.
        // Because allowMeterReset is true, consumption on new meter is 45, NOT 45 - 10 = 35.
        const res = validateReadingDelta(10, 45, { allowMeterReset: true });
        expect(res.valid).toBe(true);
        expect(res.usage).toBe(45);
      });

      it("handles mechanical meter rollover (hasRollover: true)", () => {
        // 4-digit meter (max 10000): previous 9950, current 40 -> usage = (10000 - 9950) + 40 = 90
        const res = validateReadingDelta(9950, 40, { hasRollover: true });
        expect(res.valid).toBe(true);
        expect(res.usage).toBe(90);

        // 5-digit meter explicit maxReading: previous 99980, current 15 -> usage = (100000 - 99980) + 15 = 35
        const res5 = validateReadingDelta(99980, 15, {
          hasRollover: true,
          maxReading: 100000,
        });
        expect(res5.valid).toBe(true);
        expect(res5.usage).toBe(35);
      });

      it("rejects rollover if maxReading capacity is smaller than previous reading", () => {
        const res = validateReadingDelta(500, 10, {
          hasRollover: true,
          maxReading: 100, // Invalid: max capacity 100 is less than previous 500
        });
        expect(res.valid).toBe(false);
        expect(res.error).toMatch(/negative usage/i);
      });

      it("handles calculateUtilityCharge mode edge cases", () => {
        // included_in_rent must always be 0 regardless of usage
        expect(calculateUtilityCharge(100, 25, "included_in_rent")).toBe(0);
        // tenant_paid normal
        expect(calculateUtilityCharge(10.5, 12, "tenant_paid")).toBe(126);
        // zero usage
        expect(calculateUtilityCharge(0, 15, "tenant_paid")).toBe(0);
        // negative usage or rate must throw
        expect(() => calculateUtilityCharge(-1, 10, "tenant_paid")).toThrow();
        expect(() => calculateUtilityCharge(10, -5, "tenant_paid")).toThrow();
      });
    });

    describe("Draft invoice assembly calculations", () => {
      const baseContext: InvoiceBuildContext = {
        leaseId: "lease-101",
        tenantId: "tenant-201",
        tenantName: "Juan Dela Cruz",
        unitId: "unit-301",
        unitName: "Unit 3B",
        propertyId: "prop-401",
        propertyName: "Sunset Residences",
        monthlyRent: 15000,
        billingMonth: "2026-11",
        dueDate: "2026-11-25",
        water: {
          billingMode: "tenant_paid",
          ratePerUnit: 35.5,
          previousReading: 120,
          currentReading: 132, // usage 12 -> 426.00
        },
        electricity: {
          billingMode: "tenant_paid",
          ratePerUnit: 11.75,
          previousReading: 1050,
          currentReading: 1150, // usage 100 -> 1175.00
        },
        customItems: [
          { id: "custom-1", label: "Parking Fee", amount: 1500, category: "other" },
          { id: "custom-2", label: "Late Payment Penalty", amount: 500, category: "penalty" },
        ],
      };

      it("calculates exact itemized charges and total due for standard flow", () => {
        const draft = buildDraftInvoiceItems(baseContext);
        expect(draft.rentAmount).toBe(15000);
        expect(draft.waterUsage).toBe(12);
        expect(draft.waterCharge).toBe(426);
        expect(draft.electricityUsage).toBe(100);
        expect(draft.electricityCharge).toBe(1175);
        expect(draft.customTotal).toBe(2000);
        expect(draft.subtotal).toBe(18601);
        expect(draft.totalAmount).toBe(18601);
        expect(draft.items).toHaveLength(5);
      });

      it("handles utilities included in rent", () => {
        const ctx: InvoiceBuildContext = {
          ...baseContext,
          water: {
            billingMode: "included_in_rent",
            ratePerUnit: 0,
            previousReading: 100,
            currentReading: 120,
          },
          electricity: {
            billingMode: "included_in_rent",
            ratePerUnit: 0,
            previousReading: 200,
            currentReading: 250,
          },
          customItems: [],
        };
        const draft = buildDraftInvoiceItems(ctx);
        expect(draft.waterCharge).toBe(0);
        expect(draft.electricityCharge).toBe(0);
        expect(draft.subtotal).toBe(15000);
        expect(draft.totalAmount).toBe(15000);
        // Only rent line item should exist
        expect(draft.items).toHaveLength(1);
      });

      it("handles skipped utilities correctly", () => {
        const ctx: InvoiceBuildContext = {
          ...baseContext,
          water: {
            billingMode: "tenant_paid",
            ratePerUnit: 30,
            previousReading: 100,
            skipped: true,
          },
          electricity: {
            billingMode: "tenant_paid",
            ratePerUnit: 12,
            previousReading: 200,
            skipped: true,
          },
        };
        const draft = buildDraftInvoiceItems(ctx);
        expect(draft.waterCharge).toBe(0);
        expect(draft.electricityCharge).toBe(0);
        expect(draft.items.filter((i) => i.category === "water")).toHaveLength(0);
        expect(draft.items.filter((i) => i.category === "electricity")).toHaveLength(0);
      });

      it("handles backwards-compatible calculateInvoiceTotals category partitioning", () => {
        const totals = calculateInvoiceTotals(baseContext);
        expect(totals.rentAmount).toBe(15000);
        expect(totals.penaltyTotal).toBe(500);
        expect(totals.otherTotal).toBe(1500);
        expect(totals.maintenanceTotal).toBe(0);
        expect(totals.totalDue).toBe(18601);
        expect(totals.isRolloverWater).toBe(false);
      });
    });
  });

  // -------------------------------------------------------------------------
  // 2. Template Sanitization & Token Edge Cases
  // -------------------------------------------------------------------------
  describe("2. Template Sanitization & Token Edge Cases", () => {
    describe("sanitizeTemplateInput security aggression", () => {
      it("strips active <script> tags and inner content", () => {
        const payload = "<script>alert('pwned')</script>Hello Juan";
        expect(sanitizeTemplateInput(payload)).toBe("Hello Juan");
      });

      it("strips uppercase and mixed-case <SCRIPT> tags", () => {
        const payload = "<SCRIPT type='text/javascript'>malicious()</SCRIPT>Payment Due";
        expect(sanitizeTemplateInput(payload)).toBe("Payment Due");
      });

      it("strips inline event handlers like onerror, onload, onclick", () => {
        const payload = '<img src="invalid.jpg" onerror="alert(1)">Juan';
        const sanitized = sanitizeTemplateInput(payload);
        expect(sanitized).not.toContain("onerror");
        expect(sanitized).not.toContain("alert");
      });

      it("strips javascript: pseudo-protocol", () => {
        const payload = "javascript:alert('xss')";
        expect(sanitizeTemplateInput(payload)).toBe("alert('xss')");
      });

      it("strips <iframe> and <style> tags", () => {
        const payload = '<iframe src="https://evil.com"></iframe><style>body{display:none}</style>Notice';
        expect(sanitizeTemplateInput(payload)).toBe("Notice");
      });

      it("handles null, undefined, numbers, and boolean inputs safely", () => {
        expect(sanitizeTemplateInput(null)).toBe("");
        expect(sanitizeTemplateInput(undefined)).toBe("");
        expect(sanitizeTemplateInput(12345)).toBe("12345");
        expect(sanitizeTemplateInput(true)).toBe("true");
      });
    });

    describe("validateTemplateContext & renderTemplate edge cases", () => {
      it("detects missing required tokens", () => {
        const check = validateTemplateContext("payment_gentle", {
          tenant_name: "Juan",
          amount: "₱5,000.00",
          // missing unit, property_name, due_date
        });
        expect(check.valid).toBe(false);
        expect(check.missingTokens).toEqual(["unit", "property_name", "due_date"]);
      });

      it("treats whitespace-only values as missing", () => {
        const check = validateTemplateContext("general_notice", {
          property_name: "   ",
          custom_message: "Valid notice",
        });
        expect(check.valid).toBe(false);
        expect(check.missingTokens).toContain("property_name");
      });

      it("uses DEFAULT_FALLBACKS when tokens are omitted in renderTemplate non-strict mode", () => {
        const rendered = renderTemplate("payment_gentle", {});
        expect(rendered).toContain("Valued Resident");
        expect(rendered).toContain("₱0.00");
        expect(rendered).toContain("your unit");
        expect(rendered).toContain("the property");
        expect(rendered).toContain("the due date");
      });

      it("throws in strict mode when required token is missing", () => {
        expect(() => {
          renderTemplate("payment_gentle", { tenant_name: "Juan" }, { strict: true });
        }).toThrow(/Missing required template variable/);
      });

      it("renders arbitrary template text with custom tokens", () => {
        const template = "Welcome to {property_name}, {tenant_name}! Your pin is {pin}.";
        const result = renderTemplate(template, {
          property_name: "Grand Tower",
          tenant_name: "Maria",
          pin: "1234",
        });
        expect(result).toBe("Welcome to Grand Tower, Maria! Your pin is 1234.");
      });

      it("handles extra unexpected tokens gracefully without breaking", () => {
        const rendered = renderTemplate("general_notice", {
          property_name: "Sunset Residences",
          custom_message: "Elevator under maintenance.",
          unexpected_extra_field: "ignored",
          another_extra: "also ignored",
        });
        expect(rendered).toBe("Notice to residents of Sunset Residences: Elevator under maintenance.");
      });

      it("does not leak Object prototype functions (e.g. toString, valueOf, constructor)", () => {
        // Probe whether {toString} leaks Object.prototype.toString
        const rendered = renderTemplate("Notice: {custom_message} {toString}", {
          custom_message: "Hello",
        });
        // It should NOT contain [native code]
        expect(rendered).not.toContain("[native code]");
      });

      it("returns all defined template keys", () => {
        const keys = getAvailableTemplateKeys();
        expect(keys).toContain("payment_gentle");
        expect(keys).toContain("payment_overdue");
        expect(keys).toContain("lease_renewal");
        expect(keys).toContain("maintenance_advisory");
        expect(keys).toContain("general_notice");
      });
    });
  });

  // -------------------------------------------------------------------------
  // 3. State Machine Transition Invariants
  // -------------------------------------------------------------------------
  describe("3. State Machine Transition Invariants", () => {
    const validContext: InvoiceBuildContext = {
      leaseId: "lease-101",
      tenantId: "tenant-201",
      tenantName: "Maria Santos",
      unitId: "unit-301",
      unitName: "Room 101",
      propertyId: "prop-401",
      propertyName: "Green Residences",
      monthlyRent: 12000,
      billingMonth: "2026-11",
      dueDate: "2026-11-20",
      customItems: [],
    };

    describe("Transition matrix enforcement", () => {
      it("prevents illegal transition directly from IDLE to REVIEW or SUBMITTING", () => {
        expect(canTransition("IDLE", "REVIEW_INVOICE")).toBe(false);
        expect(canTransition("IDLE", "SUBMITTING")).toBe(false);
        expect(canTransition("IDLE", "COMPLETED")).toBe(false);

        const idleState: IrisFsmState = { status: "IDLE", context: null };
        const next = irisFsmReducer(idleState, { type: "SUBMIT_INVOICE" });
        expect(next.error).toMatch(/Cannot submit invoice from state IDLE/i);
        expect(next.status).toBe("IDLE");
      });

      it("prevents SUBMIT_INVOICE from non-review states", () => {
        const states: IrisState[] = ["IDLE", "SELECT_LEASE", "INPUT_WATER", "INPUT_ELECTRIC", "INPUT_CUSTOM_ITEMS"];
        for (const s of states) {
          const state: IrisFsmState = { status: s, context: validContext };
          const res = irisFsmReducer(state, { type: "SUBMIT_INVOICE" });
          expect(res.error).toMatch(/Cannot submit invoice/i);
          expect(res.status).toBe(s);
        }
      });

      it("enforces context validation on SELECT_LEASE with full payload", () => {
        const idleState: IrisFsmState = { status: "IDLE", context: null };
        // Invalid month format and negative rent
        const invalidPayload: any = {
          ...validContext,
          monthlyRent: -500,
          billingMonth: "invalid-month",
        };
        const next = irisFsmReducer(idleState, {
          type: "SELECT_LEASE",
          payload: invalidPayload,
        });
        expect(next.error).toBeDefined();
        expect(next.status).toBe("IDLE");
      });

      it("enforces monotonicity in SET_WATER_READING unless rollover or reset flagged", () => {
        const waterState: IrisFsmState = {
          status: "INPUT_WATER",
          context: {
            ...validContext,
            water: {
              billingMode: "tenant_paid",
              ratePerUnit: 25,
              previousReading: 500,
            },
          },
        };

        // Attempt backwards reading without rollover/reset
        const nextInvalid = irisFsmReducer(waterState, {
          type: "SET_WATER_READING",
          payload: { currentReading: 480 },
        });
        expect(nextInvalid.error).toMatch(/less than previous reading/i);
        expect(nextInvalid.status).toBe("INPUT_WATER");

        // Valid with allowMeterReset
        const nextReset = irisFsmReducer(waterState, {
          type: "SET_WATER_READING",
          payload: { currentReading: 15, allowMeterReset: true },
        });
        expect(nextReset.error).toBeNull();
        expect(nextReset.status).toBe("INPUT_ELECTRIC");
        expect(nextReset.context?.water?.usage).toBe(15);
      });

      it("prevents submitting when context is null", () => {
        const reviewNoContext: IrisFsmState = { status: "REVIEW_INVOICE", context: null };
        const res = irisFsmReducer(reviewNoContext, { type: "SUBMIT_INVOICE" });
        expect(res.error).toMatch(/context is null/i);
      });

      it("rejects meter readings and custom item mutations dispatched from unexpected states", () => {
        // Attempt SET_WATER_READING while in REVIEW_INVOICE
        const reviewState: IrisFsmState = { status: "REVIEW_INVOICE", context: validContext };
        const resWater = irisFsmReducer(reviewState, {
          type: "SET_WATER_READING",
          payload: { currentReading: 100 },
        });
        expect(resWater.error).toMatch(/Cannot set water reading in state REVIEW_INVOICE/i);

        // Attempt SET_ELECTRIC_READING while still in INPUT_WATER
        const waterState: IrisFsmState = { status: "INPUT_WATER", context: validContext };
        const resElec = irisFsmReducer(waterState, {
          type: "SET_ELECTRIC_READING",
          payload: { currentReading: 200 },
        });
        expect(resElec.error).toMatch(/Cannot set electric reading in state INPUT_WATER/i);

        // Attempt ADD_CUSTOM_ITEM while in COMPLETED
        const completedState: IrisFsmState = { status: "COMPLETED", context: validContext };
        const resItem = irisFsmReducer(completedState, {
          type: "ADD_CUSTOM_ITEM",
          payload: { id: "item-x", label: "Late Fee", amount: 100, category: "penalty" },
        });
        expect(resItem.error).toMatch(/Cannot add custom item in state COMPLETED/i);

        // Attempt SUBMISSION_SUCCESS while in IDLE
        const idleState: IrisFsmState = { status: "IDLE", context: null };
        const resSuccess = irisFsmReducer(idleState, {
          type: "SUBMISSION_SUCCESS",
          payload: { receiptNumber: "REC-FAKE" },
        });
        expect(resSuccess.error).toMatch(/Must be in SUBMITTING state/i);
      });
    });

    describe("canProceed selector invariants", () => {
      it("correctly identifies whether each state can proceed", () => {
        // IDLE can proceed
        expect(canProceed({ status: "IDLE", context: null })).toBe(true);

        // SELECT_LEASE requires leaseId
        expect(canProceed({ status: "SELECT_LEASE", context: null })).toBe(false);
        expect(canProceed({ status: "SELECT_LEASE", context: validContext })).toBe(true);

        // FETCH_CONTEXT cannot proceed (must wait for context load)
        expect(canProceed({ status: "FETCH_CONTEXT", context: validContext })).toBe(false);

        // INPUT_WATER requires valid reading if tenant_paid
        const waterContext: InvoiceBuildContext = {
          ...validContext,
          water: {
            billingMode: "tenant_paid",
            ratePerUnit: 30,
            previousReading: 100,
            currentReading: undefined, // missing!
          },
        };
        expect(canProceed({ status: "INPUT_WATER", context: waterContext })).toBe(false);

        // Valid water reading
        const waterValid: InvoiceBuildContext = {
          ...waterContext,
          water: { ...waterContext.water!, currentReading: 110 },
        };
        expect(canProceed({ status: "INPUT_WATER", context: waterValid })).toBe(true);

        // Skipped water can proceed
        const waterSkipped: InvoiceBuildContext = {
          ...waterContext,
          water: { ...waterContext.water!, skipped: true },
        };
        expect(canProceed({ status: "INPUT_WATER", context: waterSkipped })).toBe(true);

        // COMPLETED, COMMITTED, SUBMITTING, ERROR cannot proceed
        expect(canProceed({ status: "COMPLETED", context: validContext })).toBe(false);
        expect(canProceed({ status: "COMMITTED", context: validContext })).toBe(false);
        expect(canProceed({ status: "SUBMITTING", context: validContext })).toBe(false);
        expect(canProceed({ status: "ERROR", context: validContext, error: "Fatal" })).toBe(false);
      });
    });

    describe("Rewind & BACK navigation invariants", () => {
      it("prevents rewinding from terminal states (COMMITTED, COMPLETED, SUBMITTING)", () => {
        const committed: IrisFsmState = { status: "COMMITTED", context: validContext };
        expect(canRewindToStep(committed, "REVIEW")).toBe(false);
        expect(canRewindToStep(committed, "IDLE")).toBe(false);

        const rewindRes = rewindToStep(committed, "REVIEW");
        expect(rewindRes.error).toMatch(/Cannot rewind/i);

        const completed: IrisFsmState = { status: "COMPLETED", context: validContext };
        expect(canRewindToStep(completed, "INPUT_WATER")).toBe(false);
      });

      it("allows rewinding backwards to earlier steps in modern flow", () => {
        const review: IrisFsmState = { status: "REVIEW_INVOICE", context: validContext };
        expect(canRewindToStep(review, "INPUT_WATER")).toBe(true);
        expect(canRewindToStep(review, "INPUT_ELECTRIC")).toBe(true);
        expect(canRewindToStep(review, "INPUT_CUSTOM_ITEMS")).toBe(true);
        // Cannot rewind forward
        expect(canRewindToStep(review, "SUBMITTING")).toBe(false);
        expect(canRewindToStep(review, "COMPLETED")).toBe(false);

        const rewound = rewindToStep(review, "INPUT_WATER");
        expect(rewound.status).toBe("INPUT_WATER");
        expect(rewound.error).toBeNull();
        expect(rewound.context).toEqual(validContext);
      });

      it("BACK action navigates step-by-step backwards cleanly", () => {
        let state: IrisFsmState = { status: "REVIEW_INVOICE", context: validContext };
        state = irisFsmReducer(state, { type: "BACK" });
        expect(state.status).toBe("INPUT_CUSTOM_ITEMS");

        state = irisFsmReducer(state, { type: "BACK" });
        expect(state.status).toBe("INPUT_ELECTRIC");

        state = irisFsmReducer(state, { type: "BACK" });
        expect(state.status).toBe("INPUT_WATER");

        state = irisFsmReducer(state, { type: "BACK" });
        expect(state.status).toBe("SELECT_LEASE");

        state = irisFsmReducer(state, { type: "BACK" });
        expect(state.status).toBe("IDLE");
      });
    });

    describe("Full lifecycle simulation (happy path)", () => {
      it("transitions smoothly from IDLE to COMPLETED with correct totals and metadata", () => {
        let state: IrisFsmState = { status: "IDLE", context: null };

        // 1. START_INVOICE
        state = irisFsmReducer(state, { type: "START_INVOICE" });
        expect(state.status).toBe("SELECT_LEASE");

        // 2. CONTEXT_LOADED
        state = irisFsmReducer(state, {
          type: "CONTEXT_LOADED",
          payload: {
            ...validContext,
            water: {
              billingMode: "tenant_paid",
              ratePerUnit: 40,
              previousReading: 200,
            },
            electricity: {
              billingMode: "tenant_paid",
              ratePerUnit: 12,
              previousReading: 1000,
            },
          },
        });
        expect(state.status).toBe("INPUT_WATER");

        // 3. SET_WATER_READING
        state = irisFsmReducer(state, {
          type: "SET_WATER_READING",
          payload: { currentReading: 215 }, // 15 units * 40 = 600
        });
        expect(state.status).toBe("INPUT_ELECTRIC");
        expect(state.context?.water?.charge).toBe(600);

        // 4. SET_ELECTRIC_READING
        state = irisFsmReducer(state, {
          type: "SET_ELECTRIC_READING",
          payload: { currentReading: 1100 }, // 100 units * 12 = 1200
        });
        expect(state.status).toBe("INPUT_CUSTOM_ITEMS");
        expect(state.context?.electricity?.charge).toBe(1200);

        // 5. ADD_CUSTOM_ITEM
        state = irisFsmReducer(state, {
          type: "ADD_CUSTOM_ITEM",
          payload: { id: "item-1", label: "Amenity Pass", amount: 350, category: "other" },
        });
        expect(state.context?.customItems).toHaveLength(1);

        // 6. PROCEED_TO_REVIEW
        const previewTotal = getInvoiceTotalPreview(state);
        // 12000 rent + 600 water + 1200 elec + 350 amenity = 14150
        expect(previewTotal).toBe(14150);

        state = irisFsmReducer(state, {
          type: "PROCEED_TO_REVIEW",
          payload: { totalAmount: previewTotal },
        });
        expect(state.status).toBe("REVIEW_INVOICE");

        // 7. SUBMIT_INVOICE
        state = irisFsmReducer(state, { type: "SUBMIT_INVOICE" });
        expect(state.status).toBe("SUBMITTING");

        // 8. SUBMISSION_SUCCESS
        state = irisFsmReducer(state, {
          type: "SUBMISSION_SUCCESS",
          payload: { receiptNumber: "REC-202611-ABCDE", invoiceId: "inv-999" },
        });
        expect(state.status).toBe("COMPLETED");
        expect(state.submissionResult?.receiptNumber).toBe("REC-202611-ABCDE");

        // 9. RESET back to IDLE
        state = irisFsmReducer(state, { type: "RESET" });
        expect(state.status).toBe("IDLE");
        expect(state.context).toBeNull();
      });
    });
  });

  // -------------------------------------------------------------------------
  // 4. Ownership / Boundary Stress
  // -------------------------------------------------------------------------
  describe("4. Ownership / Boundary Stress", () => {
    describe("recordQuickSettlement boundary checks", () => {
      const invoice = {
        id: "inv-001",
        totalAmount: 10000,
        currentBalance: 4000,
      };

      it("records partial settlement correctly", () => {
        const res = recordQuickSettlement(
          {
            invoiceId: "inv-001",
            amount: 2500,
            method: "bank_transfer",
            paymentDate: "2026-11-12",
            referenceNumber: "BDO-123456",
          },
          invoice,
          "TEST1"
        );
        expect(res.success).toBe(true);
        expect(res.amountPaid).toBe(2500);
        expect(res.remainingBalance).toBe(1500);
        expect(res.status).toBe("partial");
        expect(res.receiptNumber).toMatch(/^REC-202611-TEST1/);
      });

      it("records full settlement (remaining = 0)", () => {
        const res = recordQuickSettlement(
          {
            invoiceId: "inv-001",
            amount: 4000,
            method: "cash",
            paymentDate: "2026-11-12",
          },
          invoice
        );
        expect(res.amountPaid).toBe(4000);
        expect(res.remainingBalance).toBe(0);
        expect(res.status).toBe("completed");
      });

      it("rejects mismatched invoiceId", () => {
        expect(() => {
          recordQuickSettlement(
            {
              invoiceId: "inv-FORGED",
              amount: 1000,
              method: "cash",
              paymentDate: "2026-11-12",
            },
            invoice
          );
        }).toThrow(/Invoice ID mismatch/);
      });

      it("rejects zero or negative settlement amount via Zod validation", () => {
        expect(() => {
          recordQuickSettlement(
            {
              invoiceId: "inv-001",
              amount: 0,
              method: "cash",
              paymentDate: "2026-11-12",
            },
            invoice
          );
        }).toThrow();

        expect(() => {
          recordQuickSettlement(
            {
              invoiceId: "inv-001",
              amount: -500,
              method: "cash",
              paymentDate: "2026-11-12",
            },
            invoice
          );
        }).toThrow();
      });

      it("rejects settlement on already fully-settled invoice", () => {
        const settledInvoice = { id: "inv-002", totalAmount: 5000, currentBalance: 0 };
        expect(() => {
          recordQuickSettlement(
            {
              invoiceId: "inv-002",
              amount: 500,
              method: "cash",
              paymentDate: "2026-11-12",
            },
            settledInvoice
          );
        }).toThrow(/already fully settled/);
      });
    });

    describe("updateMaintenanceTicketStatus lifecycle rules", () => {
      const ticket: MaintenanceTicketSummary = {
        id: "t-1",
        unitId: "u-1",
        unitName: "101",
        propertyId: "p-1",
        propertyName: "Prop A",
        tenantName: "Juan",
        title: "Leaking pipe",
        description: "Kitchen pipe is leaking",
        priority: "high",
        status: "pending",
        createdAt: "2026-11-01T00:00:00Z",
      };

      it("enforces technician assignment when moving to assigned status", () => {
        expect(() => {
          updateMaintenanceTicketStatus(ticket, "assigned");
        }).toThrow(/specifying a technician/);

        const assigned = updateMaintenanceTicketStatus(ticket, "assigned", {
          assignedTechnician: "Mario Plumber",
        });
        expect(assigned.status).toBe("assigned");
        expect(assigned.assignedTechnician).toBe("Mario Plumber");
      });

      it("rejects illegal transitions (e.g. pending -> closed, cancelled -> resolved)", () => {
        expect(() => updateMaintenanceTicketStatus(ticket, "closed")).toThrow(/Illegal ticket status transition/);

        const cancelled: MaintenanceTicketSummary = { ...ticket, status: "cancelled" };
        expect(() => updateMaintenanceTicketStatus(cancelled, "resolved")).toThrow(/Illegal ticket status transition/);
      });
    });

    describe("filterAudience edge cases", () => {
      const leases: ActiveLeaseSummary[] = [
        {
          id: "l-1",
          tenantId: "t-1",
          tenantName: "Tenant Overdue",
          unitId: "u-1",
          unitName: "101",
          propertyId: "p-1",
          propertyName: "Sunset",
          monthlyRent: 10000,
          startDate: "2026-01-01",
          endDate: "2026-12-31",
          outstandingBalance: 5000,
          daysOverdue: 10,
          dueDate: "2026-11-01",
        },
        {
          id: "l-2",
          tenantId: "t-2",
          tenantName: "Tenant Due Soon",
          unitId: "u-2",
          unitName: "102",
          propertyId: "p-1",
          propertyName: "Sunset",
          monthlyRent: 10000,
          startDate: "2026-01-01",
          endDate: "2026-12-31",
          outstandingBalance: 10000,
          daysOverdue: 0,
          dueDate: "2026-11-15",
        },
        {
          id: "l-3",
          tenantId: "t-3",
          tenantName: "Tenant Expiring",
          unitId: "u-3",
          unitName: "103",
          propertyId: "p-2",
          propertyName: "Sunrise",
          monthlyRent: 12000,
          startDate: "2025-12-01",
          endDate: "2026-11-30", // expiring in ~18 days from refDate
          outstandingBalance: 0,
          daysOverdue: 0,
          dueDate: "2026-11-01",
        },
      ];

      it("filters overdue tenants (>= 5 days overdue with positive balance)", () => {
        const overdue = filterAudience(leases, "overdue_5d");
        expect(overdue).toHaveLength(1);
        expect(overdue[0].id).toBe("l-1");
      });

      it("filters due soon tenants within threshold", () => {
        const dueSoon = filterAudience(leases, "due_soon", {
          referenceDate: "2026-11-12",
          dueSoonDaysThreshold: 5,
        });
        expect(dueSoon).toHaveLength(1);
        expect(dueSoon[0].id).toBe("l-2");
      });

      it("filters expiring leases within 60 days", () => {
        const expiring = filterAudience(leases, "expiring_leases_60d", {
          referenceDate: "2026-11-12",
        });
        expect(expiring).toHaveLength(3); // all end in Nov/Dec 2026!
      });

      it("filters by propertyId strictly", () => {
        const prop1Only = filterAudience(leases, "all_active_tenants", {
          propertyId: "p-1",
        });
        expect(prop1Only).toHaveLength(2);
        expect(prop1Only.every((l) => l.propertyId === "p-1")).toBe(true);
      });
    });

    describe("Database context & ownership boundary isolation (mocked Supabase)", () => {
      it("verifyLandlordPropertyOwnership returns false when landlordId or propertyId is missing or unowned", async () => {
        const mockSupabase = {
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          }),
        } as any;

        // Missing params
        expect(await verifyLandlordPropertyOwnership(mockSupabase, "", "p-1")).toBe(false);
        expect(await verifyLandlordPropertyOwnership(mockSupabase, "l-1", "")).toBe(false);

        // Unowned property (returns null data)
        expect(await verifyLandlordPropertyOwnership(mockSupabase, "landlord-wrong", "p-1")).toBe(false);
      });

      it("verifyLandlordLeaseOwnership returns false when lease does not belong to landlord", async () => {
        const mockSupabase = {
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          }),
        } as any;

        const isOwner = await verifyLandlordLeaseOwnership(mockSupabase, "landlord-attacker", "lease-victim");
        expect(isOwner).toBe(false);
      });

      it("getLeaseInvoiceContext returns null if lease not found or not owned by landlord", async () => {
        const mockSupabase = {
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error("Not found") }),
                }),
              }),
            }),
          }),
        } as any;

        const ctx = await getLeaseInvoiceContext(mockSupabase, "landlord-1", "lease-unowned");
        expect(ctx).toBeNull();
      });
    });
  });
});
