import { describe, it, expect } from "vitest";
import {
  canTransition,
  validateMeterInput,
  invoiceFsmReducer,
  InvoiceFsmState,
  InvoiceBuildContext,
  InvoiceState,
  InvoiceBuildContextSchema,
  canProceed,
  getInvoiceTotalPreview,
  isStepActive,
  canRewindToStep,
  rewindToStep,
} from "@/lib/services/iris/iris-fsm";

describe("Iris Invoice FSM Engine", () => {
  const sampleValidContext: InvoiceBuildContext = {
    leaseId: "lease-101",
    tenantId: "tenant-202",
    tenantName: "Juan Dela Cruz",
    unitId: "unit-303",
    unitName: "Unit 3B",
    propertyId: "prop-404",
    propertyName: "Grand Residences",
    monthlyRent: 15000,
    billingMonth: "2026-11",
    dueDate: "2026-11-25",
    customItems: [],
  };

  describe("canTransition guard function", () => {
    it("should allow transition from IDLE to SELECT_UNIT", () => {
      expect(canTransition("IDLE", "SELECT_UNIT")).toBe(true);
    });

    it("should not allow transition from IDLE directly to REVIEW", () => {
      expect(canTransition("IDLE", "REVIEW")).toBe(false);
    });

    it("should not allow transition from IDLE directly to COMMITTED", () => {
      expect(canTransition("IDLE", "COMMITTED")).toBe(false);
    });

    it("should allow transition from SELECT_UNIT to INPUT_METERS", () => {
      expect(canTransition("SELECT_UNIT", "INPUT_METERS")).toBe(true);
    });

    it("should allow transition from SELECT_UNIT to IDLE (cancel)", () => {
      expect(canTransition("SELECT_UNIT", "IDLE")).toBe(true);
    });

    it("should allow transition from INPUT_METERS to CUSTOM_ITEMS", () => {
      expect(canTransition("INPUT_METERS", "CUSTOM_ITEMS")).toBe(true);
    });

    it("should allow transition from CUSTOM_ITEMS to REVIEW", () => {
      expect(canTransition("CUSTOM_ITEMS", "REVIEW")).toBe(true);
    });

    it("should allow transition from REVIEW to COMMITTED", () => {
      expect(canTransition("REVIEW", "COMMITTED")).toBe(true);
    });

    it("should allow COMMITTED to transition only to IDLE", () => {
      expect(canTransition("COMMITTED", "IDLE")).toBe(true);
      expect(canTransition("COMMITTED", "REVIEW")).toBe(false);
      expect(canTransition("COMMITTED", "SELECT_UNIT")).toBe(false);
    });

    it("should prevent arbitrary jumps like INPUT_METERS to COMMITTED", () => {
      expect(canTransition("INPUT_METERS", "COMMITTED")).toBe(false);
    });
  });

  describe("validateMeterInput helper", () => {
    it("should validate skipped utility reading as valid", () => {
      const res = validateMeterInput({
        billingMode: "tenant_paid",
        ratePerUnit: 45,
        previousReading: 120,
        skipped: true,
      });
      expect(res.valid).toBe(true);
    });

    it("should validate included_in_rent utility without current reading", () => {
      const res = validateMeterInput({
        billingMode: "included_in_rent",
        ratePerUnit: 0,
        previousReading: 0,
      });
      expect(res.valid).toBe(true);
    });

    it("should reject missing currentReading when tenant_paid and not skipped", () => {
      const res = validateMeterInput({
        billingMode: "tenant_paid",
        ratePerUnit: 15,
        previousReading: 100,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/Current reading is required/i);
    });

    it("should reject negative current reading", () => {
      const res = validateMeterInput({
        billingMode: "tenant_paid",
        ratePerUnit: 15,
        previousReading: 100,
        currentReading: -5,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/cannot be negative/i);
    });

    it("should reject current reading lower than previous without rollover flag", () => {
      const res = validateMeterInput({
        billingMode: "tenant_paid",
        ratePerUnit: 15,
        previousReading: 9999,
        currentReading: 15,
        hasRollover: false,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/without rollover flagged/i);
    });

    it("should accept current reading lower than previous when hasRollover is true", () => {
      const res = validateMeterInput({
        billingMode: "tenant_paid",
        ratePerUnit: 15,
        previousReading: 9999,
        currentReading: 15,
        hasRollover: true,
      });
      expect(res.valid).toBe(true);
    });

    it("should accept current reading equal to previous reading (zero usage)", () => {
      const res = validateMeterInput({
        billingMode: "tenant_paid",
        ratePerUnit: 15,
        previousReading: 500,
        currentReading: 500,
      });
      expect(res.valid).toBe(true);
    });
  });

  describe("InvoiceBuildContextSchema Zod Validation", () => {
    it("should validate a complete valid build context", () => {
      const parsed = InvoiceBuildContextSchema.safeParse(sampleValidContext);
      expect(parsed.success).toBe(true);
    });

    it("should reject negative monthly rent", () => {
      const invalid = { ...sampleValidContext, monthlyRent: -100 };
      const parsed = InvoiceBuildContextSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it("should reject invalid billingMonth format", () => {
      const invalid = { ...sampleValidContext, billingMonth: "November 2026" };
      const parsed = InvoiceBuildContextSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it("should reject invalid dueDate format", () => {
      const invalid = { ...sampleValidContext, dueDate: "25-11-2026" };
      const parsed = InvoiceBuildContextSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it("should reject missing required unitId or leaseId", () => {
      const invalid = { ...sampleValidContext, leaseId: "" };
      const parsed = InvoiceBuildContextSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe("invoiceFsmReducer State Transitions", () => {
    it("should initialize in IDLE state with null context", () => {
      const initial: InvoiceFsmState = {
        status: "IDLE",
        context: null,
      };
      expect(initial.status).toBe("IDLE");
      expect(initial.context).toBeNull();
    });

    it("should transition from IDLE to SELECT_UNIT on START event", () => {
      const initial: InvoiceFsmState = { status: "IDLE", context: null };
      const next = invoiceFsmReducer(initial, { type: "START" });
      expect(next.status).toBe("SELECT_UNIT");
      expect(next.error).toBeNull();
    });

    it("should reject START if already in REVIEW state", () => {
      const state: InvoiceFsmState = { status: "REVIEW", context: sampleValidContext };
      const next = invoiceFsmReducer(state, { type: "START" });
      expect(next.status).toBe("REVIEW");
      expect(next.error).toMatch(/Illegal transition/i);
    });

    it("should transition from SELECT_UNIT to INPUT_METERS with valid payload", () => {
      const state: InvoiceFsmState = { status: "SELECT_UNIT", context: null };
      const next = invoiceFsmReducer(state, {
        type: "SELECT_UNIT",
        payload: sampleValidContext,
      });
      expect(next.status).toBe("INPUT_METERS");
      expect(next.context?.unitName).toBe("Unit 3B");
      expect(next.error).toBeNull();
    });

    it("should return error when SELECT_UNIT payload fails validation", () => {
      const state: InvoiceFsmState = { status: "SELECT_UNIT", context: null };
      const next = invoiceFsmReducer(state, {
        type: "SELECT_UNIT",
        payload: { ...sampleValidContext, leaseId: "" },
      });
      expect(next.status).toBe("SELECT_UNIT");
      expect(next.error).toBeDefined();
    });

    it("should transition from INPUT_METERS to CUSTOM_ITEMS on valid UPDATE_METERS", () => {
      const state: InvoiceFsmState = {
        status: "INPUT_METERS",
        context: {
          ...sampleValidContext,
          water: {
            billingMode: "tenant_paid",
            ratePerUnit: 50,
            previousReading: 100,
          },
          electricity: {
            billingMode: "tenant_paid",
            ratePerUnit: 12,
            previousReading: 1200,
          },
        },
      };

      const next = invoiceFsmReducer(state, {
        type: "UPDATE_METERS",
        payload: {
          water: { currentReading: 110 },
          electricity: { currentReading: 1350 },
        },
      });

      expect(next.status).toBe("CUSTOM_ITEMS");
      expect(next.context?.water?.currentReading).toBe(110);
      expect(next.context?.electricity?.currentReading).toBe(1350);
      expect(next.error).toBeNull();
    });

    it("should reject UPDATE_METERS if current reading is invalid without rollover", () => {
      const state: InvoiceFsmState = {
        status: "INPUT_METERS",
        context: {
          ...sampleValidContext,
          water: {
            billingMode: "tenant_paid",
            ratePerUnit: 50,
            previousReading: 200,
          },
        },
      };

      const next = invoiceFsmReducer(state, {
        type: "UPDATE_METERS",
        payload: {
          water: { currentReading: 150 }, // lower than 200 without rollover
        },
      });

      expect(next.status).toBe("INPUT_METERS");
      expect(next.error).toMatch(/without rollover flagged/i);
    });

    it("should transition from CUSTOM_ITEMS to REVIEW on UPDATE_CUSTOM_ITEMS", () => {
      const state: InvoiceFsmState = {
        status: "CUSTOM_ITEMS",
        context: sampleValidContext,
      };

      const next = invoiceFsmReducer(state, {
        type: "UPDATE_CUSTOM_ITEMS",
        payload: {
          customItems: [
            { id: "c1", label: "Late Fee", amount: 500, category: "penalty" },
            { id: "c2", label: "Filter Replacement", amount: 300, category: "maintenance" },
          ],
          notes: "November invoice with penalty",
        },
      });

      expect(next.status).toBe("REVIEW");
      expect(next.context?.customItems).toHaveLength(2);
      expect(next.context?.notes).toBe("November invoice with penalty");
      expect(next.error).toBeNull();
    });

    it("should transition from REVIEW to COMMITTED on COMMIT event", () => {
      const state: InvoiceFsmState = {
        status: "REVIEW",
        context: sampleValidContext,
      };

      const next = invoiceFsmReducer(state, { type: "COMMIT" });
      expect(next.status).toBe("COMMITTED");
      expect(next.error).toBeNull();
    });

    it("should reject COMMIT if context is missing", () => {
      const state: InvoiceFsmState = {
        status: "REVIEW",
        context: null,
      };

      const next = invoiceFsmReducer(state, { type: "COMMIT" });
      expect(next.status).toBe("REVIEW");
      expect(next.error).toMatch(/context is null/i);
    });

    it("should step BACK through states properly", () => {
      let state: InvoiceFsmState = { status: "REVIEW", context: sampleValidContext };

      // REVIEW -> CUSTOM_ITEMS
      state = invoiceFsmReducer(state, { type: "BACK" });
      expect(state.status).toBe("CUSTOM_ITEMS");

      // CUSTOM_ITEMS -> INPUT_METERS
      state = invoiceFsmReducer(state, { type: "BACK" });
      expect(state.status).toBe("INPUT_METERS");

      // INPUT_METERS -> SELECT_UNIT
      state = invoiceFsmReducer(state, { type: "BACK" });
      expect(state.status).toBe("SELECT_UNIT");

      // SELECT_UNIT -> IDLE
      state = invoiceFsmReducer(state, { type: "BACK" });
      expect(state.status).toBe("IDLE");
      expect(state.context).toBeNull();
    });

    it("should prevent BACK navigation from COMMITTED state", () => {
      const state: InvoiceFsmState = { status: "COMMITTED", context: sampleValidContext };
      const next = invoiceFsmReducer(state, { type: "BACK" });
      expect(next.status).toBe("COMMITTED");
      expect(next.error).toMatch(/Cannot navigate back from COMMITTED/i);
    });

    it("should reset completely to IDLE on RESET event from any state", () => {
      const state: InvoiceFsmState = { status: "REVIEW", context: sampleValidContext };
      const next = invoiceFsmReducer(state, { type: "RESET" });
      expect(next.status).toBe("IDLE");
      expect(next.context).toBeNull();
      expect(next.error).toBeNull();
    });

    it("should preserve original state immutably without in-place mutation", () => {
      const original: InvoiceFsmState = Object.freeze({
        status: "IDLE" as InvoiceState,
        context: null,
      });

      const next = invoiceFsmReducer(original, { type: "START" });
      expect(original.status).toBe("IDLE");
      expect(next.status).toBe("SELECT_UNIT");
    });
  });

  describe("Iris FSM Granular Step Flow & Selectors", () => {
    it("should walk through START_INVOICE -> SELECT_LEASE -> CONTEXT_LOADED -> INPUT_WATER -> INPUT_ELECTRIC -> INPUT_CUSTOM_ITEMS -> REVIEW_INVOICE -> SUBMITTING -> COMPLETED", () => {
      let state: InvoiceFsmState = { status: "IDLE", context: null };

      // 1. START_INVOICE
      state = invoiceFsmReducer(state, { type: "START_INVOICE" });
      expect(state.status).toBe("SELECT_LEASE");

      // 2. SELECT_LEASE
      state = invoiceFsmReducer(state, {
        type: "SELECT_LEASE",
        payload: { leaseId: "lease-101" },
      });
      expect(state.status).toBe("FETCH_CONTEXT");

      // 3. CONTEXT_LOADED
      state = invoiceFsmReducer(state, {
        type: "CONTEXT_LOADED",
        payload: {
          ...sampleValidContext,
          water: {
            billingMode: "tenant_paid",
            ratePerUnit: 50,
            previousReading: 100,
          },
          electricity: {
            billingMode: "tenant_paid",
            ratePerUnit: 12,
            previousReading: 500,
          },
        },
      });
      expect(state.status).toBe("INPUT_WATER");

      // 4. SET_WATER_READING
      state = invoiceFsmReducer(state, {
        type: "SET_WATER_READING",
        payload: { currentReading: 115 },
      });
      expect(state.status).toBe("INPUT_ELECTRIC");
      expect(state.context?.water?.usage).toBe(15);
      expect(state.context?.water?.charge).toBe(750);

      // 5. SET_ELECTRIC_READING
      state = invoiceFsmReducer(state, {
        type: "SET_ELECTRIC_READING",
        payload: { currentReading: 600 },
      });
      expect(state.status).toBe("INPUT_CUSTOM_ITEMS");
      expect(state.context?.electricity?.usage).toBe(100);
      expect(state.context?.electricity?.charge).toBe(1200);

      // 6. ADD_CUSTOM_ITEM and REMOVE_CUSTOM_ITEM
      state = invoiceFsmReducer(state, {
        type: "ADD_CUSTOM_ITEM",
        payload: { id: "item-1", label: "Trash Fee", amount: 200, category: "other" },
      });
      expect(state.context?.customItems).toHaveLength(1);

      state = invoiceFsmReducer(state, {
        type: "ADD_CUSTOM_ITEM",
        payload: { id: "item-2", label: "Temp Item", amount: 100, category: "other" },
      });
      expect(state.context?.customItems).toHaveLength(2);

      state = invoiceFsmReducer(state, {
        type: "REMOVE_CUSTOM_ITEM",
        payload: { id: "item-2" },
      });
      expect(state.context?.customItems).toHaveLength(1);

      // 7. PROCEED_TO_REVIEW
      state = invoiceFsmReducer(state, { type: "PROCEED_TO_REVIEW" });
      expect(state.status).toBe("REVIEW_INVOICE");

      // 8. SUBMIT_INVOICE
      state = invoiceFsmReducer(state, { type: "SUBMIT_INVOICE" });
      expect(state.status).toBe("SUBMITTING");

      // 9. SUBMISSION_SUCCESS
      state = invoiceFsmReducer(state, {
        type: "SUBMISSION_SUCCESS",
        payload: { receiptNumber: "REC-202611-00001", invoiceId: "inv-999" },
      });
      expect(state.status).toBe("COMPLETED");
      expect(state.submissionResult?.receiptNumber).toBe("REC-202611-00001");
    });

    it("should handle SKIP_WATER and SKIP_ELECTRIC cleanly", () => {
      let state: InvoiceFsmState = {
        status: "INPUT_WATER",
        context: sampleValidContext,
      };

      state = invoiceFsmReducer(state, { type: "SKIP_WATER" });
      expect(state.status).toBe("INPUT_ELECTRIC");
      expect(state.context?.water?.skipped).toBe(true);

      state = invoiceFsmReducer(state, { type: "SKIP_ELECTRIC" });
      expect(state.status).toBe("INPUT_CUSTOM_ITEMS");
      expect(state.context?.electricity?.skipped).toBe(true);
    });

    it("should handle SET_METER_RESET toggle", () => {
      let state: InvoiceFsmState = {
        status: "INPUT_WATER",
        context: {
          ...sampleValidContext,
          water: {
            billingMode: "tenant_paid",
            ratePerUnit: 50,
            previousReading: 500,
          },
        },
      };

      state = invoiceFsmReducer(state, {
        type: "SET_METER_RESET",
        payload: { utility: "water", allowMeterReset: true },
      });
      expect(state.context?.water?.allowMeterReset).toBe(true);
    });
  });

  describe("Iris FSM Helper Selectors", () => {
    it("canProceed selector checks current state validity", () => {
      expect(canProceed({ status: "IDLE", context: null })).toBe(true);
      expect(canProceed({ status: "SELECT_LEASE", context: null })).toBe(false);
      expect(canProceed({ status: "SELECT_LEASE", context: sampleValidContext })).toBe(true);
      expect(canProceed({ status: "FETCH_CONTEXT", context: sampleValidContext })).toBe(false);

      // INPUT_WATER: valid if skipped or valid reading
      const waterSkippedState: InvoiceFsmState = {
        status: "INPUT_WATER",
        context: {
          ...sampleValidContext,
          water: { billingMode: "tenant_paid", ratePerUnit: 50, previousReading: 100, skipped: true },
        },
      };
      expect(canProceed(waterSkippedState)).toBe(true);

      const waterInvalidState: InvoiceFsmState = {
        status: "INPUT_WATER",
        context: {
          ...sampleValidContext,
          water: { billingMode: "tenant_paid", ratePerUnit: 50, previousReading: 100, currentReading: 50 },
        },
      };
      expect(canProceed(waterInvalidState)).toBe(false);

      const waterValidState: InvoiceFsmState = {
        status: "INPUT_WATER",
        context: {
          ...sampleValidContext,
          water: { billingMode: "tenant_paid", ratePerUnit: 50, previousReading: 100, currentReading: 120 },
        },
      };
      expect(canProceed(waterValidState)).toBe(true);
    });

    it("getInvoiceTotalPreview calculates live total", () => {
      const state: InvoiceFsmState = {
        status: "REVIEW_INVOICE",
        context: {
          ...sampleValidContext,
          monthlyRent: 15000,
          water: {
            billingMode: "tenant_paid",
            ratePerUnit: 50,
            previousReading: 100,
            currentReading: 110, // 10 units * 50 = 500
          },
          electricity: {
            billingMode: "tenant_paid",
            ratePerUnit: 12,
            previousReading: 1000,
            currentReading: 1100, // 100 units * 12 = 1200
          },
          customItems: [
            { id: "c1", label: "Late Fee", amount: 300, category: "penalty" },
          ],
        },
      };

      // 15000 + 500 + 1200 + 300 = 17000
      expect(getInvoiceTotalPreview(state)).toBe(17000);
    });

    it("isStepActive checks step status with aliases", () => {
      const state: InvoiceFsmState = { status: "REVIEW_INVOICE", context: sampleValidContext };
      expect(isStepActive(state, "REVIEW_INVOICE")).toBe(true);
      expect(isStepActive(state, "REVIEW")).toBe(true);
      expect(isStepActive(state, "INPUT_WATER")).toBe(false);
    });

    it("canRewindToStep and rewindToStep navigate backwards cleanly", () => {
      const state: InvoiceFsmState = {
        status: "REVIEW_INVOICE",
        context: sampleValidContext,
      };

      expect(canRewindToStep(state, "INPUT_WATER")).toBe(true);
      expect(canRewindToStep(state, "SELECT_LEASE")).toBe(true);
      expect(canRewindToStep(state, "COMPLETED")).toBe(false);

      const rewound = rewindToStep(state, "INPUT_WATER");
      expect(rewound.status).toBe("INPUT_WATER");
      expect(rewound.context).toBe(state.context);
      expect(rewound.error).toBeNull();
    });
  });
});


