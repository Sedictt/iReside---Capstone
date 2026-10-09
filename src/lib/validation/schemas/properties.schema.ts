/**
 * Property, unit, unit-map, renewal-policy, flyer and landlord payment-setting
 * validation shared by the landlord route handlers and their forms.
 *
 * Client-safe: no server imports. Field rules return `string | undefined`
 * (for `useFormValidation`); the Zod schemas reuse the same rules so the API
 * rejects exactly what the forms flag, with the same message.
 *
 * Limits come from the database (`properties`, `units`, `unit_map_positions`,
 * `property_floor_configs`, `utility_configs`, `landlord_payment_destinations`)
 * and from the caps the property wizard / unit map already enforce.
 *
 * @module lib/validation/schemas/properties
 */

import { IMAGE_KIND_MIME, sniffImageKind } from "../upload";
import { z } from "zod";
import {
  TEXT_LIMITS,
  dateRangeRule,
  integerRule,
  isValidIsoDate,
  moneyRule,
  parseNumericInput,
  textRule,
  type FieldRuleResult,
} from "../rules";
import { zInteger, zMoney, zOptionalText, zRequiredText, zUuid } from "../zod-fields";
import { DEFAULT_PROPERTY_AMENITIES, isAmenityDuplicate, normalizeAmenityName } from "@/lib/constants/amenities";
import { DEFAULT_PROPERTY_RULES, isRuleDuplicate, normalizeRuleText } from "@/lib/constants/rules";

// ---------------------------------------------------------------------------
// Enums (exact Postgres / app values)
// ---------------------------------------------------------------------------

/** `public.property_type` */
export const PROPERTY_TYPES = ["apartment", "condo", "house", "townhouse", "studio", "dormitory", "boarding_house"] as const;
/** `public.unit_status` */
export const UNIT_STATUSES = ["vacant", "occupied", "maintenance"] as const;
/** Utility split methods offered by the property wizard (BillingStrategyModal). */
export const UTILITY_SPLIT_METHODS = ["fixed_charge", "individual_meter", "equal_per_head"] as const;
export const NUMBERING_STYLES = ["floor_based", "sequential"] as const;
export const CONTRACT_MODES = ["generate", "upload"] as const;
export const RENEWAL_ADJUSTMENT_TYPES = ["percentage", "fixed"] as const;
/** `public.utility_type` / `public.utility_billing_mode` and the `utility_configs_unit_label_check` pairing. */
export const UTILITY_TYPES = ["water", "electricity"] as const;
export const UTILITY_BILLING_MODES = ["included_in_rent", "tenant_paid"] as const;
export const UTILITY_UNIT_LABEL: Record<(typeof UTILITY_TYPES)[number], "cubic_meter" | "kwh"> = {
  water: "cubic_meter",
  electricity: "kwh",
};

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

const SQM_PER_SQFT = 0.092903;

export const PROPERTY_LIMITS = {
  name: 60,
  address: TEXT_LIMITS.address,
  description: TEXT_LIMITS.description,
  city: TEXT_LIMITS.shortText,
  /** Wizard caps (2 digits). */
  maxUnits: 99,
  maxFloors: 99,
  maxOccupancy: 99,
  unitPrefix: 10,
  maxStartingNumber: 9999,
  amenityMin: 2,
  amenityMax: 40,
  ruleMin: 3,
  ruleMax: 120,
  maxAmenities: 50,
  maxRules: 50,
  maxImages: 20,
  imageUrl: 2048,
  contractFileName: 255,
  /** Floor numbers: 0 = ground floor. */
  minFloor: 0,
  maxFloor: 99,
  floorDisplayName: 40,
  floorKey: 40,
  maxBeds: 99,
  maxBaths: 99,
  maxAreaSqm: 9999,
  maxSqft: Math.round(9999 / SQM_PER_SQFT),
  maxPositions: 2000,
  maxCoordinate: 1_000_000,
  /** JSON payload caps for blobs persisted in `properties.map_decorations`. */
  maxDecorationsBytes: 1_000_000,
  maxFlyerTemplateBytes: 512_000,
} as const;

export const RENEWAL_LIMITS = {
  maxPercentage: 100,
  maxRules: 20,
  ruleMax: 120,
  memoMax: 500,
} as const;

export const PAYMENT_SETTING_LIMITS = {
  accountNameMin: 2,
  accountNameMax: 60,
  noteMax: TEXT_LIMITS.reason,
  maxUtilityConfigs: 500,
} as const;

// ---------------------------------------------------------------------------
// Field rules (client + server)
// ---------------------------------------------------------------------------

export const propertyNameRule = (value: unknown): FieldRuleResult =>
  textRule(value, { label: "Property name", required: true, max: PROPERTY_LIMITS.name });

export const propertyAddressRule = (value: unknown, max: number = PROPERTY_LIMITS.address): FieldRuleResult =>
  textRule(value, { label: "Property address", required: true, max });

export const totalUnitsRule = (value: unknown): FieldRuleResult =>
  integerRule(value, { label: "Total units", min: 1, max: PROPERTY_LIMITS.maxUnits });

export const totalFloorsRule = (value: unknown): FieldRuleResult =>
  integerRule(value, { label: "Number of floors", min: 1, max: PROPERTY_LIMITS.maxFloors });

export const occupancyLimitRule = (value: unknown): FieldRuleResult =>
  integerRule(value, { label: "Max tenants per room", min: 1, max: PROPERTY_LIMITS.maxOccupancy });

export const unitPrefixRule = (value: unknown, { required = false } = {}): FieldRuleResult =>
  textRule(value, { label: "Room label", required, max: PROPERTY_LIMITS.unitPrefix });

export const startingNumberRule = (value: unknown): FieldRuleResult =>
  integerRule(value, { label: "Starting number", min: 1, max: PROPERTY_LIMITS.maxStartingNumber });

export const baseRentRule = (value: unknown): FieldRuleResult =>
  moneyRule(value, { label: "Monthly rent", positive: true });

export const unitAreaSqmRule = (value: unknown): FieldRuleResult =>
  integerRule(value, { label: "Area", required: false, min: 0, max: PROPERTY_LIMITS.maxAreaSqm });

export const unitBedsRule = (value: unknown): FieldRuleResult =>
  integerRule(value, { label: "Bedrooms", required: false, min: 0, max: PROPERTY_LIMITS.maxBeds });

export const unitBathsRule = (value: unknown): FieldRuleResult =>
  integerRule(value, { label: "Baths", required: false, min: 0, max: PROPERTY_LIMITS.maxBaths });

/** Custom amenity name: 2–40 chars, not already a standard or saved choice (case-insensitive). */
export function amenityNameRule(value: unknown, existing: readonly string[] = []): FieldRuleResult {
  const base = textRule(value, { label: "Amenity name", required: true, min: PROPERTY_LIMITS.amenityMin, max: PROPERTY_LIMITS.amenityMax });
  if (base) return base;
  const normalized = normalizeAmenityName(String(value));
  if (isAmenityDuplicate(normalized, DEFAULT_PROPERTY_AMENITIES)) return `"${normalized}" is already included in standard amenities.`;
  if (isAmenityDuplicate(normalized, existing)) return `"${normalized}" is already in your custom amenities list.`;
  return undefined;
}

/** Custom house rule: 3–120 chars, not already a standard or saved rule (case-insensitive). */
export function houseRuleTextRule(value: unknown, existing: readonly string[] = []): FieldRuleResult {
  const base = textRule(value, { label: "Rule text", required: true, min: PROPERTY_LIMITS.ruleMin, max: PROPERTY_LIMITS.ruleMax });
  if (base) return base;
  const normalized = normalizeRuleText(String(value));
  if (isRuleDuplicate(normalized, DEFAULT_PROPERTY_RULES)) return `"${normalized}" is already included in standard rules.`;
  if (isRuleDuplicate(normalized, existing)) return `"${normalized}" is already in your saved rules list.`;
  return undefined;
}

/**
 * Renewal rent increase. Only increases are applied (the renewal route ignores
 * values <= 0 and tenants see it as "+"), so negatives are rejected.
 */
export function renewalAdjustmentRule(value: unknown, adjustmentType: unknown): FieldRuleResult {
  if (adjustmentType === "percentage") {
    const amount = parseNumericInput(value);
    if (amount === null) return "Increase is required.";
    if (!Number.isFinite(amount)) return "Increase must be a number.";
    if (amount < 0) return "Increase cannot be negative.";
    if (amount > RENEWAL_LIMITS.maxPercentage) return `Increase cannot exceed ${RENEWAL_LIMITS.maxPercentage}%.`;
    if (Math.round(amount * 100) / 100 !== amount) return "Increase can have at most 2 decimal places.";
    return undefined;
  }
  return moneyRule(value, { label: "Increase" });
}

export const renewalRuleTextRule = (value: unknown, existing: readonly string[] = []): FieldRuleResult => {
  const base = textRule(value, { label: "Rule", required: true, max: RENEWAL_LIMITS.ruleMax });
  if (base) return base;
  const normalized = String(value).trim().toLowerCase();
  if (existing.some((rule) => rule.trim().toLowerCase() === normalized)) return "This rule is already listed.";
  return undefined;
};

/** GCash account name as the billing panel accepts it. */
const ACCOUNT_NAME_PATTERN = /^[\p{L}\s.,'’-]+$/u;
export function gcashAccountNameRule(value: unknown): FieldRuleResult {
  const base = textRule(value, {
    label: "GCash account name",
    required: true,
    min: PAYMENT_SETTING_LIMITS.accountNameMin,
    max: PAYMENT_SETTING_LIMITS.accountNameMax,
  });
  if (base) return base;
  if (!ACCOUNT_NAME_PATTERN.test(String(value).trim())) {
    return "GCash account name can only contain letters, spaces, periods, commas, apostrophes, and hyphens.";
  }
  return undefined;
}

export const GCASH_NUMBER_MESSAGE =
  "GCash mobile number must be an 11-digit Philippine mobile number starting with 09 (e.g. 09171234567).";

export function gcashNumberRule(value: unknown): FieldRuleResult {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "GCash mobile number is required.";
  if (!/^09\d{9}$/.test(digits)) return GCASH_NUMBER_MESSAGE;
  return undefined;
}

export const utilityRateRule = (value: unknown): FieldRuleResult => moneyRule(value, { label: "Rate" });

/** Case-insensitive duplicate finder for unit names within one property. */
export function findDuplicateName(names: readonly string[]): string | undefined {
  const seen = new Set<string>();
  for (const name of names) {
    const key = name.trim().toLowerCase();
    if (seen.has(key)) return name.trim();
    seen.add(key);
  }
  return undefined;
}

/** Bytes of the JSON encoding — used to cap blobs stored in jsonb columns. */
export function jsonByteSize(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value ?? null)).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

// ---------------------------------------------------------------------------
// Image uploads (server-side mirror of MEDIA_PRESETS.image without the toast dependency)
// ---------------------------------------------------------------------------

export const IMAGE_UPLOAD_TYPES: Record<string, { extensions: readonly string[]; ext: string }> = {
  "image/jpeg": { extensions: ["jpg", "jpeg"], ext: "jpg" },
  "image/jpg": { extensions: ["jpg", "jpeg"], ext: "jpg" },
  "image/png": { extensions: ["png"], ext: "png" },
  "image/webp": { extensions: ["webp"], ext: "webp" },
  "image/heic": { extensions: ["heic", "heif"], ext: "heic" },
  "image/heif": { extensions: ["heic", "heif"], ext: "heif" },
};
export const IMAGE_UPLOAD_DESCRIPTION = "PNG, JPG, JPEG, WebP, or HEIC";

/** Detects the real image format from the first bytes (null when unrecognised or not a raster photo). */
export function sniffImageMime(bytes: Uint8Array): string | null {
  const kind = sniffImageKind(bytes);
  return kind && kind !== "svg" && kind !== "gif" ? IMAGE_KIND_MIME[kind] : null;
}

/**
 * Validates an uploaded image's declared type, extension and size.
 * Pair with `sniffImageMime` on the bytes to reject renamed non-images.
 */
export function imageUploadRule(
  file: { name?: string; type?: string; size: number } | null | undefined,
  { maxBytes, label = "Image" }: { maxBytes: number; label?: string },
): FieldRuleResult {
  if (!file) return `${label} is required.`;
  if (file.size <= 0) return `${label} is empty or corrupted. Please choose another file.`;
  const mime = (file.type || "").toLowerCase();
  const allowed = IMAGE_UPLOAD_TYPES[mime];
  const name = file.name || "";
  const extension = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1).toLowerCase() : "";
  if (!allowed || (extension && !allowed.extensions.includes(extension))) {
    return `${label} must be ${IMAGE_UPLOAD_DESCRIPTION}.`;
  }
  if (file.size > maxBytes) {
    return `${label} exceeds the ${Math.round(maxBytes / (1024 * 1024))}MB size limit.`;
  }
  return undefined;
}

export type InspectedImage =
  | { ok: true; bytes: ArrayBuffer; contentType: string; extension: string }
  | { ok: false; error: string };

/** Runs `imageUploadRule`, then checks the file's bytes really are that kind of image. */
export async function inspectImageUpload(
  file: File,
  options: { maxBytes: number; label?: string },
): Promise<InspectedImage> {
  const error = imageUploadRule(file, options);
  if (error) return { ok: false, error };
  const bytes = await file.arrayBuffer();
  const sniffed = sniffImageMime(new Uint8Array(bytes.slice(0, 16)));
  if (!sniffed) {
    return { ok: false, error: `${options.label ?? "Image"} could not be read as ${IMAGE_UPLOAD_DESCRIPTION}.` };
  }
  return { ok: true, bytes, contentType: sniffed, extension: IMAGE_UPLOAD_TYPES[sniffed].ext };
}

// ---------------------------------------------------------------------------
// Zod helpers
// ---------------------------------------------------------------------------

const ruleRefine =
  <T>(rule: (value: T) => FieldRuleResult) =>
  (value: T, ctx: z.RefinementCtx) => {
    const message = rule(value);
    if (message) ctx.addIssue({ code: "custom", message });
  };

const numberish = (label: string) => z.union([z.number(), z.string()], { error: `${label} must be a number.` });

/** Optional whole number in range; blank/null → undefined. */
const zOptionalInteger = (label: string, opts: { min?: number; max?: number }) =>
  numberish(label)
    .nullish()
    .superRefine((value, ctx) => {
      const message = integerRule(value, { label, required: false, ...opts });
      if (message) ctx.addIssue({ code: "custom", message });
    })
    .transform((value) => {
      const parsed = parseNumericInput(value);
      return parsed === null ? undefined : parsed;
    });

const zEnum = <T extends readonly [string, ...string[]]>(values: T, label: string) =>
  z.enum(values, { error: `Select a valid ${label}.` });

const zHttpUrl = (label: string) =>
  z
    .string({ error: `${label} must be a URL.` })
    .trim()
    .max(PROPERTY_LIMITS.imageUrl, `${label} is too long.`)
    .refine((value) => {
      try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    }, `${label} must be a valid http(s) URL.`);

const uniqueTextList = (
  item: z.ZodType<string>,
  { label, max, duplicateMessage }: { label: string; max: number; duplicateMessage: string },
) =>
  z
    .array(item, { error: `${label} must be a list.` })
    .max(max, `You can add at most ${max} ${label.toLowerCase()}.`)
    .superRefine((list, ctx) => {
      const duplicate = findDuplicateName(list);
      if (duplicate) ctx.addIssue({ code: "custom", message: duplicateMessage.replace("{name}", duplicate) });
    });

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

const amenityItem = z
  .string({ error: "Amenity must be text." })
  .trim()
  .min(1, "Amenity name is required.")
  .max(PROPERTY_LIMITS.amenityMax, `Amenity name cannot exceed ${PROPERTY_LIMITS.amenityMax} characters.`);

const houseRuleItem = z
  .string({ error: "House rule must be text." })
  .trim()
  .min(1, "House rule is required.")
  .max(PROPERTY_LIMITS.ruleMax, `House rule cannot exceed ${PROPERTY_LIMITS.ruleMax} characters.`);

const propertyFields = {
  name: zRequiredText("Property name", PROPERTY_LIMITS.name),
  address: zRequiredText("Property address", PROPERTY_LIMITS.address),
  type: zEnum(PROPERTY_TYPES, "property type").default("apartment"),
  total_units: zInteger("Total units", { min: 1, max: PROPERTY_LIMITS.maxUnits }).default(1),
  total_floors: zInteger("Number of floors", { min: 1, max: PROPERTY_LIMITS.maxFloors }).default(1),
  base_rent_amount: zMoney("Monthly rent", { positive: true }),
  description: zOptionalText("Description", PROPERTY_LIMITS.description),
  amenities: uniqueTextList(amenityItem, {
    label: "Amenities",
    max: PROPERTY_LIMITS.maxAmenities,
    duplicateMessage: 'Amenity "{name}" is listed more than once.',
  }).default([]),
  house_rules: uniqueTextList(houseRuleItem, {
    label: "House rules",
    max: PROPERTY_LIMITS.maxRules,
    duplicateMessage: 'House rule "{name}" is listed more than once.',
  }).default([]),
  images: z
    .array(zHttpUrl("Image"), { error: "Images must be a list." })
    .max(PROPERTY_LIMITS.maxImages, `A property can have at most ${PROPERTY_LIMITS.maxImages} images.`)
    .default([]),
  contract_mode: zEnum(CONTRACT_MODES, "lease contract option").nullish(),
  contract_file: zOptionalText("Contract file name", PROPERTY_LIMITS.contractFileName),
  occupancy_limit: zInteger("Max tenants per room", { min: 1, max: PROPERTY_LIMITS.maxOccupancy }).default(5),
  utility_billing: zEnum(UTILITY_SPLIT_METHODS, "utility billing method").default("fixed_charge"),
  unit_prefix: zOptionalText("Room label", PROPERTY_LIMITS.unitPrefix),
  numbering_style: zEnum(NUMBERING_STYLES, "numbering style").default("floor_based"),
  starting_number: zInteger("Starting number", { min: 1, max: PROPERTY_LIMITS.maxStartingNumber }).default(101),
};

/** POST /api/landlord/properties */
export const propertyCreateSchema = z.object({
  ...propertyFields,
  city: zOptionalText("City", PROPERTY_LIMITS.city),
});

/** PUT/PATCH /api/landlord/properties/[id] — name/address may be omitted (kept), but never blanked. */
export const propertyUpdateSchema = z.object({
  ...propertyFields,
  name: propertyFields.name.optional(),
  address: propertyFields.address.optional(),
});

export type PropertyCreateInput = z.output<typeof propertyCreateSchema>;
export type PropertyUpdateInput = z.output<typeof propertyUpdateSchema>;

export const propertyIdSchema = zUuid("Property ID");
export const unitIdSchema = zUuid("Unit ID");

// ---------------------------------------------------------------------------
// Renewal settings
// ---------------------------------------------------------------------------

export const renewalSettingsSchema = z
  .object({
    base_rent_adjustment: numberish("Increase").default(0),
    adjustment_type: zEnum(RENEWAL_ADJUSTMENT_TYPES, "adjustment type").default("percentage"),
    new_rules: uniqueTextList(zRequiredText("Rule", RENEWAL_LIMITS.ruleMax), {
      label: "Rules",
      max: RENEWAL_LIMITS.maxRules,
      duplicateMessage: 'Rule "{name}" is listed more than once.',
    }).default([]),
    landlord_memo: z
      .string({ error: "Note must be text." })
      .trim()
      .max(RENEWAL_LIMITS.memoMax, `Note cannot exceed ${RENEWAL_LIMITS.memoMax} characters.`)
      .nullish()
      .transform((value) => value ?? ""),
    is_enabled: z.boolean({ error: "Enabled must be true or false." }).default(true),
  })
  .superRefine((settings, ctx) => {
    const message = renewalAdjustmentRule(settings.base_rent_adjustment, settings.adjustment_type);
    if (message) ctx.addIssue({ code: "custom", path: ["base_rent_adjustment"], message });
  })
  .transform((settings) => ({
    ...settings,
    base_rent_adjustment: parseNumericInput(settings.base_rent_adjustment) as number,
  }));

export const renewalSettingsPatchSchema = z.object({
  settings: renewalSettingsSchema,
});

// ---------------------------------------------------------------------------
// Units & unit map
// ---------------------------------------------------------------------------

export const unitStatusSchema = z.object({
  status: zEnum(UNIT_STATUSES, "unit status"),
});

const floorNumber = (label = "Floor") => zInteger(label, { min: PROPERTY_LIMITS.minFloor, max: PROPERTY_LIMITS.maxFloor });

export const floorKeySchema = z
  .string({ error: "Floor is required." })
  .trim()
  .min(1, "Floor is required.")
  .max(PROPERTY_LIMITS.floorKey, "Floor key is too long.")
  .regex(/^[a-z0-9_-]+$/i, "Floor key is invalid.");

const floorDisplayName = zOptionalText("Floor name", PROPERTY_LIMITS.floorDisplayName);

export const floorConfigCreateSchema = z.object({
  propertyId: propertyIdSchema,
  floorNumber: floorNumber(),
  displayName: floorDisplayName,
});

export const floorConfigRenameSchema = z.object({
  propertyId: propertyIdSchema,
  floorKey: floorKeySchema,
  displayName: floorDisplayName,
});

export const floorConfigDeleteQuerySchema = z.object({
  propertyId: propertyIdSchema,
  floorKey: floorKeySchema,
});

export const unitMapQuerySchema = z.object({
  propertyId: propertyIdSchema,
});

export const unitFloorSchema = z.object({
  floor: floorNumber(),
  autoRenumber: z.boolean({ error: "autoRenumber must be true or false." }).default(true),
});

export const batchRenameSchema = z.object({
  propertyId: propertyIdSchema,
  prefix: z
    .string({ error: "Room label must be text." })
    .trim()
    .max(PROPERTY_LIMITS.unitPrefix, `Room label cannot exceed ${PROPERTY_LIMITS.unitPrefix} characters.`)
    .default("Unit"),
  numberingStyle: zEnum(NUMBERING_STYLES, "numbering style").default("floor_based"),
  startingNumber: zInteger("Starting number", { min: 1, max: PROPERTY_LIMITS.maxStartingNumber }).default(101),
});

const coordinate = (label: string) =>
  z
    .number({ error: `${label} must be a number.` })
    .finite(`${label} must be a number.`)
    .min(-PROPERTY_LIMITS.maxCoordinate, `${label} is out of range.`)
    .max(PROPERTY_LIMITS.maxCoordinate, `${label} is out of range.`);

const unitConfigFields = {
  beds: zOptionalInteger("Bedrooms", { min: 0, max: PROPERTY_LIMITS.maxBeds }),
  baths: zOptionalInteger("Baths", { min: 0, max: PROPERTY_LIMITS.maxBaths }),
  sqft: zOptionalInteger("Area", { min: 0, max: PROPERTY_LIMITS.maxSqft }),
};

export const unitMapSaveSchema = z.object({
  propertyId: propertyIdSchema,
  positions: z
    .array(
      z.object({
        // Canvas-only units carry non-UUID ids; the route keeps only ids that belong to the property.
        unitId: z.string({ error: "Unit ID is required." }).trim().min(1, "Unit ID is required.").max(100, "Unit ID is invalid."),
        floorKey: z.string({ error: "Floor is required." }).trim().max(PROPERTY_LIMITS.floorKey, "Floor key is too long."),
        x: coordinate("X position"),
        y: coordinate("Y position"),
        w: coordinate("Width"),
        h: coordinate("Height"),
        metadata: z.object(unitConfigFields).nullish(),
      }),
      { error: "Positions must be a list." },
    )
    .max(PROPERTY_LIMITS.maxPositions, "Too many unit positions.")
    .optional(),
  decorations: z
    .record(z.string().max(64, "Decoration key is too long."), z.unknown(), { error: "Decorations must be an object." })
    .refine((value) => jsonByteSize(value) <= PROPERTY_LIMITS.maxDecorationsBytes, "Map decorations are too large to save.")
    .optional(),
});

export const unitConfigSchema = z
  .object({
    propertyId: propertyIdSchema,
    unitId: unitIdSchema.optional(),
    applyToAll: z.boolean({ error: "applyToAll must be true or false." }).default(false),
    ...unitConfigFields,
    // null clears the stored area; undefined leaves it unchanged.
    sqft: z.union([z.null(), zInteger("Area", { min: 0, max: PROPERTY_LIMITS.maxSqft })]).optional(),
    areaSqm: z
      .number({ error: "Area must be a number." })
      .finite("Area must be a number.")
      .min(0, "Area cannot be negative.")
      .max(PROPERTY_LIMITS.maxAreaSqm, `Area cannot exceed ${PROPERTY_LIMITS.maxAreaSqm}.`)
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.applyToAll && !value.unitId) {
      ctx.addIssue({ code: "custom", path: ["unitId"], message: "Select a unit, or apply the change to all units." });
    }
  });

// ---------------------------------------------------------------------------
// Flyer
// ---------------------------------------------------------------------------

export const flyerPropertyKeySchema = z.union([z.literal("default"), propertyIdSchema], {
  error: "Property ID is invalid.",
});

const isSafeBackground = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === "" ||
  (typeof value === "string" && (/^https?:\/\//i.test(value) || /^data:image\/(png|jpe?g|webp);base64,/i.test(value)));

export const flyerTemplateSaveSchema = z.object({
  propertyId: flyerPropertyKeySchema.default("default"),
  template: z
    .record(z.string().max(64, "Template key is too long."), z.unknown(), { error: "Template data is required." })
    .refine((template) => isSafeBackground(template.customBgImage), {
      message: "Background image must be an uploaded image.",
      path: ["customBgImage"],
    })
    .refine((template) => jsonByteSize(template) <= PROPERTY_LIMITS.maxFlyerTemplateBytes, {
      message: "This flyer design is too large to sync. Re-upload the background photo and try again.",
    }),
});

// ---------------------------------------------------------------------------
// Payment settings (multipart form fields, already extracted as strings)
// ---------------------------------------------------------------------------

const zBooleanString = (fallback: boolean) =>
  z
    .enum(["true", "false"], { error: "Value must be true or false." })
    .nullish()
    .transform((value) => (value == null ? fallback : value === "true"));

export const gcashSettingsSchema = z.object({
  accountName: z
    .string({ error: "GCash account name is required." })
    .trim()
    .superRefine(ruleRefine(gcashAccountNameRule)),
  accountNumber: z
    .string({ error: "GCash mobile number is required." })
    .superRefine(ruleRefine(gcashNumberRule))
    .transform((value) => value.replace(/\D/g, "")),
  isEnabled: zBooleanString(true),
  removeQr: zBooleanString(false),
});

export const utilityConfigItemSchema = z
  .object({
    id: zUuid("Utility setting ID").nullish(),
    property_id: z.union([z.literal("all"), propertyIdSchema], { error: "Property ID is invalid." }),
    unit_id: z
      .union([unitIdSchema, z.literal("")], { error: "Unit ID is invalid." })
      .nullish()
      .transform((value) => (value ? value : null)),
    utility_type: zEnum(UTILITY_TYPES, "utility type"),
    billing_mode: zEnum(UTILITY_BILLING_MODES, "billing mode"),
    rate_per_unit: zMoney("Rate"),
    unit_label: z.enum(["kwh", "cubic_meter"], { error: "Select a valid unit." }),
    is_active: z.boolean({ error: "Active must be true or false." }).default(true),
    effective_from: z
      .string({ error: "Effective date is required." })
      .trim()
      .refine(isValidIsoDate, "Effective date must be a valid date."),
    effective_to: z
      .string()
      .trim()
      .nullish()
      .refine((value) => !value || isValidIsoDate(value), "End date must be a valid date.")
      .transform((value) => (value ? value : null)),
    note: zOptionalText("Note", PAYMENT_SETTING_LIMITS.noteMax),
  })
  .superRefine((item, ctx) => {
    if (UTILITY_UNIT_LABEL[item.utility_type] !== item.unit_label) {
      ctx.addIssue({ code: "custom", path: ["unit_label"], message: "Unit does not match the utility type." });
    }
    const range = dateRangeRule(item.effective_from, item.effective_to, { endLabel: "End date", startLabel: "effective date" });
    if (range) ctx.addIssue({ code: "custom", path: ["effective_to"], message: range });
  });

export const utilityConfigListSchema = z
  .array(utilityConfigItemSchema, { error: "Utility settings must be a list." })
  .max(PAYMENT_SETTING_LIMITS.maxUtilityConfigs, "Too many utility settings in one save.");

export const deletedConfigIdsSchema = z
  .array(zUuid("Utility setting ID"), { error: "Deleted settings must be a list." })
  .max(PAYMENT_SETTING_LIMITS.maxUtilityConfigs, "Too many utility settings in one save.");
