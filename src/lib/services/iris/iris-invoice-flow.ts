import type { CustomItem, InvoiceBuildContext, UtilityReadingState } from "./iris-fsm";

export interface ItemizedCharge {
  id: string;
  label: string;
  category: "rent" | "water" | "electricity" | "maintenance" | "penalty" | "other";
  amount: number;
  details?: string;
}

export interface DraftInvoiceItem {
  id: string;
  label: string;
  category: "rent" | "water" | "electricity" | "maintenance" | "penalty" | "other";
  amount: number;
  sortOrder: number;
  metadata?: {
    usage?: number;
    ratePerUnit?: number;
    previousReading?: number;
    currentReading?: number;
    billingMode?: string;
    isRollover?: boolean;
    allowMeterReset?: boolean;
    details?: string;
  };
}

export interface DraftInvoiceCalculation {
  items: DraftInvoiceItem[];
  subtotal: number;
  totalAmount: number;
  rentAmount: number;
  waterUsage: number;
  waterCharge: number;
  electricityUsage: number;
  electricityCharge: number;
  customTotal: number;
}

export interface InvoiceTotalsCalculation {
  rentAmount: number;
  waterUsage: number;
  waterCharge: number;
  electricityUsage: number;
  electricityCharge: number;
  customChargesTotal: number;
  penaltyTotal: number;
  maintenanceTotal: number;
  otherTotal: number;
  subtotal: number;
  totalDue: number;
  isRolloverWater: boolean;
  isRolloverElectricity: boolean;
  itemizedSummary: ItemizedCharge[];
}

/**
 * Rounds any monetary or usage number to standard 2-decimal centavos precision,
 * avoiding IEEE 754 floating point arithmetic issues.
 */
export function roundCentavos(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** Backwards-compatible alias */
export const roundToCentavos = roundCentavos;

/**
 * Formats a numeric currency value into Philippine Peso standard format (₱X,XXX.XX)
 */
export function formatPhpCurrency(amount: number): string {
  const rounded = roundCentavos(amount);
  return `₱${rounded.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Backwards-compatible alias */
export const formatPHP = formatPhpCurrency;

export interface MeterReadingDeltaOptions {
  allowMeterReset?: boolean;
  hasRollover?: boolean;
  maxReading?: number;
}

/**
 * Validates a meter reading progression against previous reading.
 * Invariant: current >= previous unless allowMeterReset or hasRollover is true.
 */
export function validateReadingDelta(
  previous: number,
  current: number,
  options: MeterReadingDeltaOptions = {}
): { valid: boolean; usage: number; error?: string } {
  if (previous < 0) {
    return {
      valid: false,
      usage: 0,
      error: "Previous meter reading cannot be negative",
    };
  }
  if (current < 0) {
    return {
      valid: false,
      usage: 0,
      error: "Current meter reading cannot be negative",
    };
  }

  // Meter replaced / reset: baseline starts anew from 0
  if (options.allowMeterReset) {
    return {
      valid: true,
      usage: roundCentavos(current),
    };
  }

  // Normal progression: current >= previous
  if (current >= previous) {
    return {
      valid: true,
      usage: roundCentavos(current - previous),
    };
  }

  // Check if rollover occurred
  if (options.hasRollover) {
    let max = options.maxReading;
    if (!max) {
      const digits = Math.max(4, Math.floor(previous).toString().length);
      max = Math.pow(10, digits);
    }
    const rolloverUsage = max - previous + current;
    if (rolloverUsage < 0) {
      return {
        valid: false,
        usage: 0,
        error: `Rollover calculation resulted in negative usage (${rolloverUsage}). Check previous reading or maxReading capacity.`,
      };
    }
    return {
      valid: true,
      usage: roundCentavos(rolloverUsage),
    };
  }

  return {
    valid: false,
    usage: 0,
    error: `Current reading (${current}) is less than previous reading (${previous}). Flag hasRollover if the meter rolled over, or meter reset if replaced.`,
  };
}

/**
 * Backwards-compatible helper throwing on invalid delta.
 */
export function calculateMeterUsage(
  previousReading: number,
  currentReading: number,
  options: MeterReadingDeltaOptions = {}
): { usage: number; hasRollover: boolean } {
  const result = validateReadingDelta(previousReading, currentReading, options);
  if (!result.valid) {
    throw new Error(result.error);
  }
  return {
    usage: result.usage,
    hasRollover: !!options.hasRollover,
  };
}

/**
 * Calculates utility charge based on billing mode and consumption.
 */
export function calculateUtilityCharge(
  usage: number,
  ratePerUnit: number,
  billingMode: "included_in_rent" | "tenant_paid"
): number {
  if (billingMode === "included_in_rent") {
    return 0;
  }
  if (ratePerUnit < 0 || usage < 0) {
    throw new Error("Utility rate and usage must be non-negative");
  }
  return roundCentavos(usage * ratePerUnit);
}

/**
 * Assembles categorized line items, subtotal, and total amount for invoice draft.
 */
export function buildDraftInvoiceItems(
  context: InvoiceBuildContext
): DraftInvoiceCalculation {
  const rentAmount = roundCentavos(context.monthlyRent || 0);
  const items: DraftInvoiceItem[] = [];

  // 1. Rent Line Item (sort_order: 0)
  items.push({
    id: "item-rent",
    label: `Monthly Rent (${context.billingMonth})`,
    category: "rent",
    amount: rentAmount,
    sortOrder: 0,
    metadata: {
      details: `Unit ${context.unitName} at ${context.propertyName}`,
    },
  });

  // 2. Water Line Item (sort_order: 10)
  let waterUsage = 0;
  let waterCharge = 0;
  if (context.water && !context.water.skipped) {
    if (context.water.billingMode === "included_in_rent") {
      waterUsage = 0;
      waterCharge = 0;
    } else if (context.water.charge !== undefined) {
      waterCharge = roundCentavos(context.water.charge);
      waterUsage = roundCentavos(context.water.usage ?? 0);
    } else if (context.water.currentReading !== undefined) {
      const delta = validateReadingDelta(
        context.water.previousReading,
        context.water.currentReading,
        {
          allowMeterReset: context.water.allowMeterReset,
          hasRollover: context.water.hasRollover,
        }
      );
      waterUsage = delta.usage;
      waterCharge = calculateUtilityCharge(
        waterUsage,
        context.water.ratePerUnit,
        context.water.billingMode
      );
    }

    if (context.water.billingMode === "tenant_paid") {
      items.push({
        id: "item-water",
        label: `Water Utility (${waterUsage} units @ ${formatPhpCurrency(context.water.ratePerUnit)}/unit)`,
        category: "water",
        amount: waterCharge,
        sortOrder: 10,
        metadata: {
          usage: waterUsage,
          ratePerUnit: context.water.ratePerUnit,
          previousReading: context.water.previousReading,
          currentReading: context.water.currentReading,
          billingMode: context.water.billingMode,
          isRollover: context.water.hasRollover,
          allowMeterReset: context.water.allowMeterReset,
        },
      });
    }
  }

  // 3. Electricity Line Item (sort_order: 20)
  let electricityUsage = 0;
  let electricityCharge = 0;
  if (context.electricity && !context.electricity.skipped) {
    if (context.electricity.billingMode === "included_in_rent") {
      electricityUsage = 0;
      electricityCharge = 0;
    } else if (context.electricity.charge !== undefined) {
      electricityCharge = roundCentavos(context.electricity.charge);
      electricityUsage = roundCentavos(context.electricity.usage ?? 0);
    } else if (context.electricity.currentReading !== undefined) {
      const delta = validateReadingDelta(
        context.electricity.previousReading,
        context.electricity.currentReading,
        {
          allowMeterReset: context.electricity.allowMeterReset,
          hasRollover: context.electricity.hasRollover,
        }
      );
      electricityUsage = delta.usage;
      electricityCharge = calculateUtilityCharge(
        electricityUsage,
        context.electricity.ratePerUnit,
        context.electricity.billingMode
      );
    }

    if (context.electricity.billingMode === "tenant_paid") {
      items.push({
        id: "item-electricity",
        label: `Electricity Utility (${electricityUsage} kWh @ ${formatPhpCurrency(context.electricity.ratePerUnit)}/kWh)`,
        category: "electricity",
        amount: electricityCharge,
        sortOrder: 20,
        metadata: {
          usage: electricityUsage,
          ratePerUnit: context.electricity.ratePerUnit,
          previousReading: context.electricity.previousReading,
          currentReading: context.electricity.currentReading,
          billingMode: context.electricity.billingMode,
          isRollover: context.electricity.hasRollover,
          allowMeterReset: context.electricity.allowMeterReset,
        },
      });
    }
  }

  // 4. Custom Items (sort_order: 30+)
  let customTotal = 0;
  (context.customItems || []).forEach((item, index) => {
    const itemAmount = roundCentavos(item.amount);
    customTotal = roundCentavos(customTotal + itemAmount);

    items.push({
      id: item.id,
      label: item.label,
      category: item.category,
      amount: itemAmount,
      sortOrder: 30 + index,
      metadata: {
        details: context.notes,
      },
    });
  });

  const subtotal = roundCentavos(
    rentAmount + waterCharge + electricityCharge + customTotal
  );
  const totalAmount = subtotal;

  return {
    items,
    subtotal,
    totalAmount,
    rentAmount,
    waterUsage,
    waterCharge,
    electricityUsage,
    electricityCharge,
    customTotal,
  };
}

/**
 * Calculates itemized charges and total due for an invoice build context.
 * Kept for full backwards-compatibility.
 */
export function calculateInvoiceTotals(
  context: InvoiceBuildContext
): InvoiceTotalsCalculation {
  const draft = buildDraftInvoiceItems(context);

  let penaltyTotal = 0;
  let maintenanceTotal = 0;
  let otherTotal = 0;

  for (const item of context.customItems || []) {
    const itemAmt = roundCentavos(item.amount);
    if (item.category === "penalty") {
      penaltyTotal = roundCentavos(penaltyTotal + itemAmt);
    } else if (item.category === "maintenance") {
      maintenanceTotal = roundCentavos(maintenanceTotal + itemAmt);
    } else {
      otherTotal = roundCentavos(otherTotal + itemAmt);
    }
  }

  const itemizedSummary: ItemizedCharge[] = draft.items.map((it) => {
    let id = it.id;
    if (it.id === "item-rent") id = "rent-charge";
    else if (it.id === "item-water") id = "water-charge";
    else if (it.id === "item-electricity") id = "electricity-charge";
    return {
      id,
      label: it.label,
      category: it.category,
      amount: it.amount,
      details: it.metadata?.details,
    };
  });

  return {
    rentAmount: draft.rentAmount,
    waterUsage: draft.waterUsage,
    waterCharge: draft.waterCharge,
    electricityUsage: draft.electricityUsage,
    electricityCharge: draft.electricityCharge,
    customChargesTotal: draft.customTotal,
    penaltyTotal,
    maintenanceTotal,
    otherTotal,
    subtotal: draft.subtotal,
    totalDue: draft.totalAmount,
    isRolloverWater: !!context.water?.hasRollover,
    isRolloverElectricity: !!context.electricity?.hasRollover,
    itemizedSummary,
  };
}
