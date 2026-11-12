import { z } from "zod";

export type IrisState =
  | "IDLE"
  | "SELECT_LEASE"
  | "FETCH_CONTEXT"
  | "INPUT_WATER"
  | "INPUT_ELECTRIC"
  | "INPUT_CUSTOM_ITEMS"
  | "REVIEW_INVOICE"
  | "SUBMITTING"
  | "COMPLETED"
  | "ERROR"
  // Legacy / shorthand aliases for backwards compatibility
  | "SELECT_UNIT"
  | "INPUT_METERS"
  | "CUSTOM_ITEMS"
  | "REVIEW"
  | "COMMITTED";

export type InvoiceState = IrisState;

export interface CustomItem {
  id: string;
  label: string;
  amount: number;
  category: "maintenance" | "penalty" | "other";
}

export interface UtilityReadingState {
  configId?: string;
  billingMode: "included_in_rent" | "tenant_paid";
  ratePerUnit: number;
  previousReading: number;
  currentReading?: number;
  usage?: number;
  charge?: number;
  skipped?: boolean;
  hasRollover?: boolean;
  allowMeterReset?: boolean;
}

export interface InvoiceBuildContext {
  leaseId: string;
  tenantId: string;
  tenantName: string;
  unitId: string;
  unitName: string;
  propertyId: string;
  propertyName: string;
  monthlyRent: number;
  billingMonth: string; // YYYY-MM
  dueDate: string;      // YYYY-MM-DD
  water?: UtilityReadingState;
  electricity?: UtilityReadingState;
  customItems: CustomItem[];
  notes?: string;
  totalAmount?: number;
}

export const CustomItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, "Label is required"),
  amount: z.number().finite("Amount must be a finite number"),
  category: z.enum(["maintenance", "penalty", "other"]),
});

export const UtilityReadingStateSchema = z.object({
  configId: z.string().optional(),
  billingMode: z.enum(["included_in_rent", "tenant_paid"]),
  ratePerUnit: z.number().min(0, "Rate cannot be negative"),
  previousReading: z.number().min(0, "Previous reading cannot be negative"),
  currentReading: z.number().min(0).optional(),
  usage: z.number().min(0).optional(),
  charge: z.number().min(0).optional(),
  skipped: z.boolean().optional(),
  hasRollover: z.boolean().optional(),
  allowMeterReset: z.boolean().optional(),
});

export const InvoiceBuildContextSchema = z.object({
  leaseId: z.string().min(1, "Lease ID is required"),
  tenantId: z.string().min(1, "Tenant ID is required"),
  tenantName: z.string().min(1, "Tenant name is required"),
  unitId: z.string().min(1, "Unit ID is required"),
  unitName: z.string().min(1, "Unit name is required"),
  propertyId: z.string().min(1, "Property ID is required"),
  propertyName: z.string().min(1, "Property name is required"),
  monthlyRent: z.number().min(0, "Monthly rent cannot be negative"),
  billingMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Billing month must be YYYY-MM"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD"),
  water: UtilityReadingStateSchema.optional(),
  electricity: UtilityReadingStateSchema.optional(),
  customItems: z.array(CustomItemSchema).default([]),
  notes: z.string().optional(),
  totalAmount: z.number().min(0).optional(),
});

export function formatZodError(error: z.ZodError): string {
  const issues = (error as any).issues ?? (error as any).errors ?? [];
  if (Array.isArray(issues) && issues.length > 0) {
    return issues.map((e: any) => e.message).join(", ");
  }
  return error.message || "Validation failed";
}

export type IrisFsmEvent =
  | { type: "START_INVOICE" }
  | { type: "START" }
  | { type: "SELECT_LEASE"; payload: { leaseId: string } | InvoiceBuildContext }
  | { type: "SELECT_UNIT"; payload: Omit<InvoiceBuildContext, "customItems"> & { customItems?: CustomItem[] } }
  | { type: "CONTEXT_LOADED"; payload: InvoiceBuildContext }
  | {
      type: "SET_WATER_READING";
      payload: {
        currentReading?: number;
        hasRollover?: boolean;
        allowMeterReset?: boolean;
        skipped?: boolean;
      };
    }
  | { type: "SKIP_WATER" }
  | {
      type: "SET_ELECTRIC_READING";
      payload: {
        currentReading?: number;
        hasRollover?: boolean;
        allowMeterReset?: boolean;
        skipped?: boolean;
      };
    }
  | { type: "SKIP_ELECTRIC" }
  | {
      type: "SET_METER_RESET";
      payload: {
        utility: "water" | "electricity";
        allowMeterReset: boolean;
      };
    }
  | {
      type: "UPDATE_METERS";
      payload: {
        water?: Partial<UtilityReadingState>;
        electricity?: Partial<UtilityReadingState>;
      };
    }
  | { type: "ADD_CUSTOM_ITEM"; payload: CustomItem }
  | { type: "REMOVE_CUSTOM_ITEM"; payload: { id: string } }
  | {
      type: "UPDATE_CUSTOM_ITEMS";
      payload: {
        customItems: CustomItem[];
        notes?: string;
      };
    }
  | { type: "PROCEED_TO_REVIEW"; payload?: { totalAmount?: number } }
  | { type: "SUBMIT_INVOICE" }
  | { type: "COMMIT"; payload?: { receiptNumber?: string } }
  | {
      type: "SUBMISSION_SUCCESS";
      payload?: { receiptNumber?: string; invoiceId?: string };
    }
  | { type: "SUBMISSION_FAILED"; payload: { error: string } }
  | { type: "SET_ERROR"; payload: { error: string } }
  | { type: "BACK" }
  | { type: "RESET" };

export type InvoiceFsmEvent = IrisFsmEvent;

export interface IrisFsmState {
  status: IrisState;
  context: InvoiceBuildContext | null;
  error?: string | null;
  submissionResult?: { receiptNumber?: string; invoiceId?: string } | null;
}

export type InvoiceFsmState = IrisFsmState;
export type IrisInvoiceState = IrisFsmState;

export const initialIrisInvoiceState: IrisInvoiceState = {
  status: "IDLE",
  context: null,
  error: null,
  submissionResult: null,
};

/** Valid transitions for deterministic flow */
export const VALID_TRANSITIONS: Record<IrisState, readonly IrisState[]> = {
  IDLE: ["SELECT_LEASE", "SELECT_UNIT"],
  SELECT_LEASE: ["FETCH_CONTEXT", "INPUT_WATER", "IDLE"],
  SELECT_UNIT: ["INPUT_METERS", "FETCH_CONTEXT", "INPUT_WATER", "IDLE"],
  FETCH_CONTEXT: ["INPUT_WATER", "INPUT_METERS", "ERROR", "IDLE"],
  INPUT_WATER: ["INPUT_ELECTRIC", "INPUT_CUSTOM_ITEMS", "CUSTOM_ITEMS", "SELECT_LEASE", "SELECT_UNIT", "IDLE"],
  INPUT_METERS: ["CUSTOM_ITEMS", "INPUT_CUSTOM_ITEMS", "SELECT_UNIT", "SELECT_LEASE", "IDLE"],
  INPUT_ELECTRIC: ["INPUT_CUSTOM_ITEMS", "CUSTOM_ITEMS", "INPUT_WATER", "IDLE"],
  INPUT_CUSTOM_ITEMS: ["REVIEW_INVOICE", "REVIEW", "INPUT_ELECTRIC", "INPUT_WATER", "IDLE"],
  CUSTOM_ITEMS: ["REVIEW", "REVIEW_INVOICE", "INPUT_METERS", "INPUT_WATER", "IDLE"],
  REVIEW_INVOICE: ["SUBMITTING", "COMMITTED", "INPUT_CUSTOM_ITEMS", "CUSTOM_ITEMS", "IDLE"],
  REVIEW: ["COMMITTED", "SUBMITTING", "CUSTOM_ITEMS", "INPUT_CUSTOM_ITEMS", "IDLE"],
  SUBMITTING: ["COMPLETED", "COMMITTED", "ERROR"],
  COMPLETED: ["IDLE"],
  COMMITTED: ["IDLE"],
  ERROR: ["IDLE", "SELECT_LEASE", "SELECT_UNIT", "REVIEW_INVOICE", "REVIEW"],
} as const;

export function canTransition(from: IrisState, to: IrisState): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Validates a meter reading state input for non-negative values and monotonicity.
 */
export function validateMeterInput(
  reading?: UtilityReadingState
): { valid: boolean; error?: string } {
  if (!reading || reading.skipped || reading.billingMode === "included_in_rent") {
    return { valid: true };
  }
  if (reading.currentReading === undefined || reading.currentReading === null) {
    return { valid: false, error: "Current reading is required" };
  }
  if (reading.currentReading < 0) {
    return { valid: false, error: "Current reading cannot be negative" };
  }
  if (reading.currentReading < reading.previousReading && !reading.hasRollover && !reading.allowMeterReset) {
    return {
      valid: false,
      error: `Current reading (${reading.currentReading}) is less than previous reading (${reading.previousReading}) without rollover flagged`,
    };
  }
  return { valid: true };
}

/**
 * Pure transition reducer for iRis operations finite state machine.
 */
export function irisFsmReducer(
  currentState: IrisFsmState,
  action: IrisFsmEvent
): IrisFsmState {
  switch (action.type) {
    case "RESET": {
      return {
        status: "IDLE",
        context: null,
        error: null,
        submissionResult: null,
      };
    }

    case "SET_ERROR": {
      return {
        ...currentState,
        status: "ERROR",
        error: action.payload.error,
      };
    }

    case "START":
    case "START_INVOICE": {
      const nextStatus: IrisState = action.type === "START" ? "SELECT_UNIT" : "SELECT_LEASE";
      if (!canTransition(currentState.status, nextStatus)) {
        return {
          ...currentState,
          error: `Illegal transition from ${currentState.status} with ${action.type} action`,
        };
      }
      return {
        status: nextStatus,
        context: currentState.context,
        error: null,
      };
    }

    case "SELECT_LEASE": {
      const payload = action.payload;
      // If full build context passed
      if ("tenantId" in payload && "unitId" in payload) {
        const parseResult = InvoiceBuildContextSchema.safeParse(payload);
        if (!parseResult.success) {
          return {
            ...currentState,
            error: formatZodError(parseResult.error),
          };
        }
        return {
          status: "INPUT_WATER",
          context: parseResult.data,
          error: null,
        };
      }

      // If just leaseId passed
      return {
        status: "FETCH_CONTEXT",
        context: currentState.context
          ? { ...currentState.context, leaseId: payload.leaseId }
          : ({ leaseId: payload.leaseId } as any),
        error: null,
      };
    }

    case "SELECT_UNIT": {
      if (!canTransition(currentState.status, "INPUT_METERS")) {
        return {
          ...currentState,
          error: `Illegal transition from ${currentState.status} with SELECT_UNIT action`,
        };
      }

      const buildContext: InvoiceBuildContext = {
        ...action.payload,
        customItems: action.payload.customItems ?? [],
      };

      const parseResult = InvoiceBuildContextSchema.safeParse(buildContext);
      if (!parseResult.success) {
        return {
          ...currentState,
          error: formatZodError(parseResult.error),
        };
      }

      return {
        status: "INPUT_METERS",
        context: parseResult.data,
        error: null,
      };
    }

    case "CONTEXT_LOADED": {
      const parseResult = InvoiceBuildContextSchema.safeParse(action.payload);
      if (!parseResult.success) {
        return {
          ...currentState,
          status: "ERROR",
          error: formatZodError(parseResult.error),
        };
      }
      return {
        status: "INPUT_WATER",
        context: parseResult.data,
        error: null,
      };
    }

    case "SET_WATER_READING": {
      if (
        currentState.status !== "INPUT_WATER" &&
        currentState.status !== "INPUT_METERS"
      ) {
        return {
          ...currentState,
          error: `Cannot set water reading in state ${currentState.status}`,
        };
      }
      if (!currentState.context) {
        return { ...currentState, error: "Missing invoice context" };
      }
      const existingWater = currentState.context.water ?? {
        billingMode: "tenant_paid",
        ratePerUnit: 0,
        previousReading: 0,
      };
      const updatedWater: UtilityReadingState = {
        ...existingWater,
        ...action.payload,
      };

      const check = validateMeterInput(updatedWater);
      if (!check.valid) {
        return { ...currentState, error: check.error };
      }

      if (updatedWater.currentReading !== undefined && updatedWater.billingMode === "tenant_paid") {
        const usage = updatedWater.allowMeterReset
          ? updatedWater.currentReading
          : Math.max(0, updatedWater.currentReading - updatedWater.previousReading);
        updatedWater.usage = Math.round(usage * 100) / 100;
        updatedWater.charge = Math.round(usage * updatedWater.ratePerUnit * 100) / 100;
      }

      return {
        status: "INPUT_ELECTRIC",
        context: {
          ...currentState.context,
          water: updatedWater,
        },
        error: null,
      };
    }

    case "SKIP_WATER": {
      if (
        currentState.status !== "INPUT_WATER" &&
        currentState.status !== "INPUT_METERS"
      ) {
        return {
          ...currentState,
          error: `Cannot skip water reading in state ${currentState.status}`,
        };
      }
      if (!currentState.context) {
        return { ...currentState, error: "Missing invoice context" };
      }
      const existingWater = currentState.context.water ?? {
        billingMode: "tenant_paid",
        ratePerUnit: 0,
        previousReading: 0,
      };
      return {
        status: "INPUT_ELECTRIC",
        context: {
          ...currentState.context,
          water: {
            ...existingWater,
            skipped: true,
            usage: 0,
            charge: 0,
          },
        },
        error: null,
      };
    }

    case "SET_ELECTRIC_READING": {
      if (
        currentState.status !== "INPUT_ELECTRIC" &&
        currentState.status !== "INPUT_METERS"
      ) {
        return {
          ...currentState,
          error: `Cannot set electric reading in state ${currentState.status}`,
        };
      }
      if (!currentState.context) {
        return { ...currentState, error: "Missing invoice context" };
      }
      const existingElectric = currentState.context.electricity ?? {
        billingMode: "tenant_paid",
        ratePerUnit: 0,
        previousReading: 0,
      };
      const updatedElectric: UtilityReadingState = {
        ...existingElectric,
        ...action.payload,
      };

      const check = validateMeterInput(updatedElectric);
      if (!check.valid) {
        return { ...currentState, error: check.error };
      }

      if (updatedElectric.currentReading !== undefined && updatedElectric.billingMode === "tenant_paid") {
        const usage = updatedElectric.allowMeterReset
          ? updatedElectric.currentReading
          : Math.max(0, updatedElectric.currentReading - updatedElectric.previousReading);
        updatedElectric.usage = Math.round(usage * 100) / 100;
        updatedElectric.charge = Math.round(usage * updatedElectric.ratePerUnit * 100) / 100;
      }

      return {
        status: "INPUT_CUSTOM_ITEMS",
        context: {
          ...currentState.context,
          electricity: updatedElectric,
        },
        error: null,
      };
    }

    case "SKIP_ELECTRIC": {
      if (
        currentState.status !== "INPUT_ELECTRIC" &&
        currentState.status !== "INPUT_METERS"
      ) {
        return {
          ...currentState,
          error: `Cannot skip electric reading in state ${currentState.status}`,
        };
      }
      if (!currentState.context) {
        return { ...currentState, error: "Missing invoice context" };
      }
      const existingElectric = currentState.context.electricity ?? {
        billingMode: "tenant_paid",
        ratePerUnit: 0,
        previousReading: 0,
      };
      return {
        status: "INPUT_CUSTOM_ITEMS",
        context: {
          ...currentState.context,
          electricity: {
            ...existingElectric,
            skipped: true,
            usage: 0,
            charge: 0,
          },
        },
        error: null,
      };
    }

    case "SET_METER_RESET": {
      if (!currentState.context) {
        return { ...currentState, error: "Missing invoice context" };
      }
      const utilityKey = action.payload.utility;
      const currentUtility = currentState.context[utilityKey] ?? {
        billingMode: "tenant_paid",
        ratePerUnit: 0,
        previousReading: 0,
      };

      return {
        ...currentState,
        context: {
          ...currentState.context,
          [utilityKey]: {
            ...currentUtility,
            allowMeterReset: action.payload.allowMeterReset,
          },
        },
      };
    }

    case "UPDATE_METERS": {
      if (currentState.status !== "INPUT_METERS" && currentState.status !== "INPUT_WATER" && currentState.status !== "INPUT_ELECTRIC") {
        return {
          ...currentState,
          error: `Cannot update meters in state ${currentState.status}`,
        };
      }
      if (!currentState.context) {
        return {
          ...currentState,
          error: "Missing invoice context",
        };
      }

      const updatedWater: UtilityReadingState | undefined = action.payload.water
        ? {
            ...currentState.context.water,
            ...action.payload.water,
            billingMode:
              action.payload.water.billingMode ??
              currentState.context.water?.billingMode ??
              "tenant_paid",
            ratePerUnit:
              action.payload.water.ratePerUnit ??
              currentState.context.water?.ratePerUnit ??
              0,
            previousReading:
              action.payload.water.previousReading ??
              currentState.context.water?.previousReading ??
              0,
          }
        : currentState.context.water;

      const updatedElectricity: UtilityReadingState | undefined = action.payload.electricity
        ? {
            ...currentState.context.electricity,
            ...action.payload.electricity,
            billingMode:
              action.payload.electricity.billingMode ??
              currentState.context.electricity?.billingMode ??
              "tenant_paid",
            ratePerUnit:
              action.payload.electricity.ratePerUnit ??
              currentState.context.electricity?.ratePerUnit ??
              0,
            previousReading:
              action.payload.electricity.previousReading ??
              currentState.context.electricity?.previousReading ??
              0,
          }
        : currentState.context.electricity;

      const waterCheck = validateMeterInput(updatedWater);
      if (!waterCheck.valid) {
        return {
          ...currentState,
          error: waterCheck.error,
        };
      }

      const electricCheck = validateMeterInput(updatedElectricity);
      if (!electricCheck.valid) {
        return {
          ...currentState,
          error: electricCheck.error,
        };
      }

      return {
        status: "CUSTOM_ITEMS",
        context: {
          ...currentState.context,
          water: updatedWater,
          electricity: updatedElectricity,
        },
        error: null,
      };
    }

    case "ADD_CUSTOM_ITEM": {
      if (
        currentState.status !== "CUSTOM_ITEMS" &&
        currentState.status !== "INPUT_CUSTOM_ITEMS"
      ) {
        return {
          ...currentState,
          error: `Cannot add custom item in state ${currentState.status}`,
        };
      }
      if (!currentState.context) {
        return { ...currentState, error: "Missing invoice context" };
      }
      const itemParsed = CustomItemSchema.safeParse(action.payload);
      if (!itemParsed.success) {
        return {
          ...currentState,
          error: formatZodError(itemParsed.error),
        };
      }
      return {
        ...currentState,
        context: {
          ...currentState.context,
          customItems: [...(currentState.context.customItems ?? []), itemParsed.data],
        },
        error: null,
      };
    }

    case "REMOVE_CUSTOM_ITEM": {
      if (
        currentState.status !== "CUSTOM_ITEMS" &&
        currentState.status !== "INPUT_CUSTOM_ITEMS"
      ) {
        return {
          ...currentState,
          error: `Cannot remove custom item in state ${currentState.status}`,
        };
      }
      if (!currentState.context) {
        return { ...currentState, error: "Missing invoice context" };
      }
      return {
        ...currentState,
        context: {
          ...currentState.context,
          customItems: (currentState.context.customItems ?? []).filter(
            (item) => item.id !== action.payload.id
          ),
        },
        error: null,
      };
    }

    case "UPDATE_CUSTOM_ITEMS": {
      if (currentState.status !== "CUSTOM_ITEMS" && currentState.status !== "INPUT_CUSTOM_ITEMS") {
        return {
          ...currentState,
          error: `Cannot update custom items in state ${currentState.status}`,
        };
      }
      if (!currentState.context) {
        return {
          ...currentState,
          error: "Missing invoice context",
        };
      }

      const itemsCheck = z.array(CustomItemSchema).safeParse(action.payload.customItems);
      if (!itemsCheck.success) {
        return {
          ...currentState,
          error: formatZodError(itemsCheck.error),
        };
      }

      return {
        status: currentState.status === "INPUT_CUSTOM_ITEMS" ? "REVIEW_INVOICE" : "REVIEW",
        context: {
          ...currentState.context,
          customItems: action.payload.customItems,
          notes: action.payload.notes ?? currentState.context.notes,
        },
        error: null,
      };
    }

    case "PROCEED_TO_REVIEW": {
      if (
        currentState.status !== "CUSTOM_ITEMS" &&
        currentState.status !== "INPUT_CUSTOM_ITEMS"
      ) {
        return {
          ...currentState,
          error: `Cannot proceed to review from state ${currentState.status}`,
        };
      }
      if (!currentState.context) {
        return {
          ...currentState,
          error: "Missing invoice context",
        };
      }
      return {
        status: currentState.status === "INPUT_CUSTOM_ITEMS" ? "REVIEW_INVOICE" : "REVIEW",
        context: {
          ...currentState.context,
          totalAmount: action.payload?.totalAmount ?? currentState.context.totalAmount,
        },
        error: null,
      };
    }

    case "SUBMIT_INVOICE": {
      if (currentState.status !== "REVIEW_INVOICE" && currentState.status !== "REVIEW") {
        return {
          ...currentState,
          error: `Cannot submit invoice from state ${currentState.status}`,
        };
      }
      if (!currentState.context) {
        return {
          ...currentState,
          error: "Cannot submit: context is null",
        };
      }
      return {
        ...currentState,
        status: "SUBMITTING",
        error: null,
      };
    }

    case "COMMIT": {
      if (currentState.status !== "REVIEW" && currentState.status !== "REVIEW_INVOICE") {
        return {
          ...currentState,
          error: `Cannot commit invoice from state ${currentState.status}. Must be in REVIEW state.`,
        };
      }
      if (!currentState.context) {
        return {
          ...currentState,
          error: "Cannot commit: context is null",
        };
      }

      return {
        status: "COMMITTED",
        context: currentState.context,
        submissionResult: action.payload ? { receiptNumber: action.payload.receiptNumber } : null,
        error: null,
      };
    }

    case "SUBMISSION_SUCCESS": {
      if (currentState.status !== "SUBMITTING") {
        return {
          ...currentState,
          error: `Cannot record submission success in state ${currentState.status}. Must be in SUBMITTING state.`,
        };
      }
      return {
        ...currentState,
        status: "COMPLETED",
        submissionResult: action.payload ?? null,
        error: null,
      };
    }

    case "SUBMISSION_FAILED": {
      if (currentState.status !== "SUBMITTING") {
        return {
          ...currentState,
          error: `Cannot record submission failure in state ${currentState.status}. Must be in SUBMITTING state.`,
        };
      }
      return {
        ...currentState,
        status: "ERROR",
        error: action.payload.error,
      };
    }

    case "BACK": {
      switch (currentState.status) {
        case "COMMITTED":
        case "COMPLETED":
          return {
            ...currentState,
            error: "Cannot navigate back from COMMITTED state",
          };
        case "SUBMITTING":
          return {
            ...currentState,
            status: "REVIEW_INVOICE",
            error: null,
          };
        case "REVIEW_INVOICE":
          return {
            ...currentState,
            status: "INPUT_CUSTOM_ITEMS",
            error: null,
          };
        case "REVIEW":
          return {
            ...currentState,
            status: "CUSTOM_ITEMS",
            error: null,
          };
        case "INPUT_CUSTOM_ITEMS":
          return {
            ...currentState,
            status: "INPUT_ELECTRIC",
            error: null,
          };
        case "CUSTOM_ITEMS":
          return {
            ...currentState,
            status: "INPUT_METERS",
            error: null,
          };
        case "INPUT_ELECTRIC":
          return {
            ...currentState,
            status: "INPUT_WATER",
            error: null,
          };
        case "INPUT_WATER":
          return {
            ...currentState,
            status: "SELECT_LEASE",
            error: null,
          };
        case "INPUT_METERS":
          return {
            ...currentState,
            status: "SELECT_UNIT",
            error: null,
          };
        case "FETCH_CONTEXT":
        case "SELECT_LEASE":
        case "SELECT_UNIT":
          return {
            status: "IDLE",
            context: null,
            error: null,
          };
        case "ERROR":
          return {
            status: "IDLE",
            context: currentState.context,
            error: null,
          };
        case "IDLE":
        default:
          return currentState;
      }
    }

    default:
      return {
        ...currentState,
        error: "Unrecognized FSM action",
      };
  }
}

export const invoiceFsmReducer = irisFsmReducer;

// ---------------------------------------------------------------------------
// Helper Selectors
// ---------------------------------------------------------------------------

/**
 * Checks if the user has completed necessary inputs in the current step to proceed.
 */
export function canProceed(state: IrisFsmState): boolean {
  if (state.error && state.status === "ERROR") return false;

  switch (state.status) {
    case "IDLE":
      return true;
    case "SELECT_LEASE":
      return !!state.context?.leaseId;
    case "SELECT_UNIT":
      return !!state.context?.unitId;
    case "FETCH_CONTEXT":
      return false;
    case "INPUT_WATER": {
      if (!state.context) return false;
      const w = state.context.water;
      if (!w || w.skipped || w.billingMode === "included_in_rent") return true;
      return validateMeterInput(w).valid;
    }
    case "INPUT_METERS": {
      if (!state.context) return false;
      const wValid = validateMeterInput(state.context.water).valid;
      const eValid = validateMeterInput(state.context.electricity).valid;
      return wValid && eValid;
    }
    case "INPUT_ELECTRIC": {
      if (!state.context) return false;
      const e = state.context.electricity;
      if (!e || e.skipped || e.billingMode === "included_in_rent") return true;
      return validateMeterInput(e).valid;
    }
    case "INPUT_CUSTOM_ITEMS":
    case "CUSTOM_ITEMS":
      return !!state.context;
    case "REVIEW_INVOICE":
    case "REVIEW":
      return !!state.context && (state.context.monthlyRent ?? 0) >= 0;
    case "SUBMITTING":
    case "COMPLETED":
    case "COMMITTED":
    case "ERROR":
    default:
      return false;
  }
}

/**
 * Calculates current preview total amount from state context.
 */
export function getInvoiceTotalPreview(state: IrisFsmState): number {
  if (!state.context) return 0;
  const rent = Math.max(0, state.context.monthlyRent || 0);

  let waterCharge = 0;
  if (state.context.water && !state.context.water.skipped && state.context.water.billingMode === "tenant_paid") {
    if (state.context.water.charge !== undefined) {
      waterCharge = state.context.water.charge;
    } else if (state.context.water.currentReading !== undefined) {
      const usage = state.context.water.allowMeterReset
        ? state.context.water.currentReading
        : Math.max(0, state.context.water.currentReading - state.context.water.previousReading);
      waterCharge = Math.round(usage * state.context.water.ratePerUnit * 100) / 100;
    }
  }

  let electricCharge = 0;
  if (state.context.electricity && !state.context.electricity.skipped && state.context.electricity.billingMode === "tenant_paid") {
    if (state.context.electricity.charge !== undefined) {
      electricCharge = state.context.electricity.charge;
    } else if (state.context.electricity.currentReading !== undefined) {
      const usage = state.context.electricity.allowMeterReset
        ? state.context.electricity.currentReading
        : Math.max(0, state.context.electricity.currentReading - state.context.electricity.previousReading);
      electricCharge = Math.round(usage * state.context.electricity.ratePerUnit * 100) / 100;
    }
  }

  const customTotal = (state.context.customItems ?? []).reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );

  return Math.round((rent + waterCharge + electricCharge + customTotal) * 100) / 100;
}

/**
 * Returns true if step is currently active (with alias normalization).
 */
export function isStepActive(state: IrisFsmState, step: IrisState): boolean {
  if (state.status === step) return true;
  if (step === "REVIEW_INVOICE" && state.status === "REVIEW") return true;
  if (step === "REVIEW" && state.status === "REVIEW_INVOICE") return true;
  if (step === "COMPLETED" && state.status === "COMMITTED") return true;
  if (step === "COMMITTED" && state.status === "COMPLETED") return true;
  if (step === "INPUT_CUSTOM_ITEMS" && state.status === "CUSTOM_ITEMS") return true;
  if (step === "CUSTOM_ITEMS" && state.status === "INPUT_CUSTOM_ITEMS") return true;
  return false;
}

const STEP_ORDER: IrisState[] = [
  "IDLE",
  "SELECT_LEASE",
  "FETCH_CONTEXT",
  "INPUT_WATER",
  "INPUT_ELECTRIC",
  "INPUT_CUSTOM_ITEMS",
  "REVIEW_INVOICE",
  "SUBMITTING",
  "COMPLETED",
];

const LEGACY_STEP_ORDER: IrisState[] = [
  "IDLE",
  "SELECT_UNIT",
  "INPUT_METERS",
  "CUSTOM_ITEMS",
  "REVIEW",
  "COMMITTED",
];

/**
 * Checks whether user can rewind backwards to targetStep.
 */
export function canRewindToStep(state: IrisFsmState, targetStep: IrisState): boolean {
  if (state.status === "COMMITTED" || state.status === "COMPLETED" || state.status === "SUBMITTING") {
    return false;
  }
  const isLegacy = LEGACY_STEP_ORDER.includes(state.status) && LEGACY_STEP_ORDER.includes(targetStep);
  const list = isLegacy ? LEGACY_STEP_ORDER : STEP_ORDER;

  const currentIndex = list.indexOf(state.status);
  const targetIndex = list.indexOf(targetStep);

  return currentIndex > 0 && targetIndex >= 0 && targetIndex < currentIndex;
}

/**
 * Rewinds FSM to target earlier step, preserving valid context.
 */
export function rewindToStep(state: IrisFsmState, targetStep: IrisState): IrisFsmState {
  if (!canRewindToStep(state, targetStep)) {
    return {
      ...state,
      error: `Cannot rewind from ${state.status} to ${targetStep}`,
    };
  }
  return {
    ...state,
    status: targetStep,
    error: null,
  };
}
