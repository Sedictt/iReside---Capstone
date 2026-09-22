/**
 * Brand Setup Validation Module
 * 
 * Provides centralized, strict, and user-friendly validation schemas
 * and helper utilities for the Brand Setup wizard (/setup), branding configuration,
 * and /api/setup/launch server endpoints.
 *
 * @module lib/validation/brand-setup
 */

import { z } from "zod";
import {
  REGEX_NAME,
  REGEX_EMAIL,
  REGEX_HEX_COLOR,
  validateFullName,
  validateEmail,
  validatePhoneNumber,
  validateHexColor,
  evaluatePasswordStrength,
} from "./landlord-settings";

// ---------------------------------------------------------------------------
// Constants & MIME Types
// ---------------------------------------------------------------------------

export const ALLOWED_LOGO_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
];

export const MAX_LOGO_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const VALID_ARCHETYPES = ["apartment", "dormitory", "boarding_house"] as const;
export type RentalArchetype = (typeof VALID_ARCHETYPES)[number];

export const DISALLOWED_PRESEEDED_DATA = {
  propertyNames: [
    "reyes residences",
    "default property",
    "untitled property",
    "sample property",
    "my property",
    "ireside residences",
    "ireside",
  ],
  taglines: [
    "premier student & residential living in valenzuela",
    "residential living",
    "premier student living",
    "modern property management & residential operations",
  ],
  adminNames: [
    "roberto reyes",
    "default admin",
    "administrator",
    "landlord",
    "turnkey landlord",
    "master admin",
  ],
  emails: [
    "landlord@reyesresidences.com",
    "admin@reyesresidences.com",
    "admin@property.com",
    "landlord@property.com",
    "landlord@example.com",
    "landlord@turnkey.local",
  ],
  phones: [
    "0917-882-9912",
    "0917-000-0000",
    "09170000000",
    "09178829912",
  ],
};

// ---------------------------------------------------------------------------
// Field-Level Validation Functions
// ---------------------------------------------------------------------------

/**
 * Validates the Property Trade Name.
 * Requirements: Required, 2-80 characters, no HTML tags, must not use pre-seeded dummy text.
 */
export function validatePropertyTradeName(value: string): { isValid: boolean; error?: string } {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return { isValid: false, error: "Property trade name is required." };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: "Property trade name must be at least 2 characters." };
  }
  if (trimmed.length > 80) {
    return { isValid: false, error: "Property trade name cannot exceed 80 characters." };
  }
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return { isValid: false, error: "Property trade name contains forbidden markup tags." };
  }
  if (DISALLOWED_PRESEEDED_DATA.propertyNames.includes(trimmed.toLowerCase())) {
    return { isValid: false, error: "Please enter your actual property or business name instead of the sample placeholder." };
  }
  return { isValid: true };
}

/**
 * Validates the Property Tagline / Subtitle.
 * Requirements: Optional, maximum 120 characters, must not use pre-seeded dummy text.
 */
export function validatePropertyTagline(value: string): { isValid: boolean; error?: string } {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return { isValid: true }; // optional
  }
  if (trimmed.length > 120) {
    return { isValid: false, error: "Tagline cannot exceed 120 characters." };
  }
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return { isValid: false, error: "Tagline contains forbidden markup tags." };
  }
  if (DISALLOWED_PRESEEDED_DATA.taglines.includes(trimmed.toLowerCase())) {
    return { isValid: false, error: "Please enter your own brand tagline instead of the sample placeholder." };
  }
  return { isValid: true };
}

/**
 * Validates the Rental Archetype.
 * Must be 'apartment', 'dormitory', or 'boarding_house'.
 */
export function validateRentalArchetype(value: string): { isValid: boolean; error?: string } {
  if (!value || !VALID_ARCHETYPES.includes(value as RentalArchetype)) {
    return { isValid: false, error: "Please select a valid property archetype (Apartment, Dormitory, or Boarding House)." };
  }
  return { isValid: true };
}

/**
 * Validates Total Units / Inventory count.
 * Requirements: Required, positive integer between 1 and 10,000.
 */
export function validateTotalUnits(value: number | string): { isValid: boolean; error?: string; parsedValue?: number } {
  const str = String(value ?? "").trim();
  if (!str) {
    return { isValid: false, error: "Total units count is required." };
  }
  const num = Number(str);
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return { isValid: false, error: "Total units must be a valid whole number." };
  }
  if (num < 1) {
    return { isValid: false, error: "Total units must be at least 1 unit." };
  }
  if (num > 10000) {
    return { isValid: false, error: "Total units cannot exceed 10,000 units." };
  }
  return { isValid: true, parsedValue: num };
}

/**
 * Validates Property Location / Address.
 * Requirements: Required, 3 to 200 characters.
 */
export function validatePropertyAddress(value: string): { isValid: boolean; error?: string } {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return { isValid: false, error: "Property location or address is required." };
  }
  if (trimmed.length < 3) {
    return { isValid: false, error: "Property location must be at least 3 characters." };
  }
  if (trimmed.length > 200) {
    return { isValid: false, error: "Property location cannot exceed 200 characters." };
  }
  return { isValid: true };
}

/**
 * Validates a Brand Color Hex string.
 * Auto-formats with '#' prefix.
 */
export function validateBrandColor(value: string, label = "Color"): { isValid: boolean; formatted: string; error?: string } {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return { isValid: false, formatted: "", error: `${label} hex code is required.` };
  }
  const cleanHex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!REGEX_HEX_COLOR.test(cleanHex)) {
    return { isValid: false, formatted: cleanHex, error: `${label} must be a valid 3 or 6-digit hex color (e.g. #8B5CF6).` };
  }
  return { isValid: true, formatted: cleanHex.toUpperCase() };
}

/**
 * Validates an uploaded logo file.
 * Checks file type and size.
 */
export function validateLogoFile(file: { size: number; type?: string; name?: string }): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: "No file selected." };
  }
  if (file.size <= 0) {
    return { isValid: false, error: "The selected logo file is empty." };
  }
  if (file.size > MAX_LOGO_FILE_SIZE) {
    return { isValid: false, error: "Logo file size must be less than 5MB." };
  }
  if (file.type && !ALLOWED_LOGO_MIME_TYPES.includes(file.type.toLowerCase())) {
    return { isValid: false, error: "Please upload a valid image file (PNG, JPG, WebP, or SVG)." };
  }
  return { isValid: true };
}

/**
 * Validates the Landlord Full Name.
 * 2-70 characters, legal name characters only, must not use pre-seeded dummy text.
 */
export function validateAdminFullName(value: string): { isValid: boolean; error?: string } {
  const base = validateFullName(value);
  if (!base.isValid) return base;
  if (DISALLOWED_PRESEEDED_DATA.adminNames.includes(value.trim().toLowerCase())) {
    return { isValid: false, error: "Please enter your real legal or business name instead of the sample placeholder." };
  }
  return { isValid: true };
}

/**
 * Validates the Landlord Email.
 * Required, valid email format, must not use pre-seeded dummy email.
 */
export function validateAdminEmail(value: string): { isValid: boolean; error?: string } {
  const base = validateEmail(value);
  if (!base.isValid) return base;
  if (DISALLOWED_PRESEEDED_DATA.emails.includes(value.trim().toLowerCase())) {
    return { isValid: false, error: "Please enter your actual working email address instead of the sample placeholder." };
  }
  return { isValid: true };
}

/**
 * Validates the Landlord Phone Number.
 * Required for setup, Philippine or international format, must not use pre-seeded dummy phone.
 */
export function validateAdminPhone(value: string): { isValid: boolean; error?: string } {
  const base = validatePhoneNumber(value, true);
  if (!base.isValid) return base;
  const cleanDigits = value.replace(/\D/g, "");
  if (DISALLOWED_PRESEEDED_DATA.phones.some((p) => p.replace(/\D/g, "") === cleanDigits)) {
    return { isValid: false, error: "Please enter your actual phone number instead of the sample placeholder." };
  }
  return { isValid: true };
}

/**
 * Validates the Master Admin Password.
 * If unchanged placeholder (••••••••••••), it is valid.
 * Otherwise, requires at least 8 characters with letters and numbers/symbols.
 */
export function validateAdminPassword(
  password: string,
  isExistingPlaceholder = false
): { isValid: boolean; error?: string } {
  const trimmed = password ?? "";
  if (isExistingPlaceholder && (trimmed === "••••••••••••" || !trimmed)) {
    return { isValid: true };
  }
  if (!trimmed) {
    return { isValid: false, error: "Master password is required." };
  }
  if (trimmed.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long." };
  }
  if (!/[a-zA-Z]/.test(trimmed) || !/[\d\W_]/.test(trimmed)) {
    return { isValid: false, error: "Password must contain both letters and numbers or symbols." };
  }
  return { isValid: true };
}

/**
 * Validates password confirmation matching.
 */
export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
  isExistingPlaceholder = false
): { isValid: boolean; error?: string } {
  if (isExistingPlaceholder && (password === "••••••••••••" || !password)) {
    return { isValid: true };
  }
  if (!confirmPassword) {
    return { isValid: false, error: "Please confirm your master password." };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: "Passwords do not match." };
  }
  return { isValid: true };
}

// ---------------------------------------------------------------------------
// Step-Level Validation Runners
// ---------------------------------------------------------------------------

export interface Step1IdentityData {
  propertyName: string;
  tagline: string;
  propertyArchetype?: string | null;
  totalUnits?: number | string;
  propertyAddress?: string;
}

export interface Step2ThemeData {
  primaryColor: string;
  secondaryColor: string;
  modePreference: "dark" | "light";
}

export interface Step3AdminData {
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminPassword: string;
  confirmPassword: string;
  isExistingPlaceholder?: boolean;
}

export interface BrandSetupValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  firstErrorStep?: 1 | 2 | 3;
  firstErrorField?: string;
}

/**
 * Validates Step 1: Property Identity & Logo
 */
export function validateStep1Identity(data: Step1IdentityData): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const nameCheck = validatePropertyTradeName(data.propertyName);
  if (!nameCheck.isValid) errors["propertyName"] = nameCheck.error!;

  const taglineCheck = validatePropertyTagline(data.tagline);
  if (!taglineCheck.isValid) errors["tagline"] = taglineCheck.error!;

  if (data.propertyArchetype) {
    const archetypeCheck = validateRentalArchetype(data.propertyArchetype);
    if (!archetypeCheck.isValid) errors["propertyArchetype"] = archetypeCheck.error!;
  }

  if (data.totalUnits !== undefined && data.totalUnits !== null && String(data.totalUnits).trim() !== "") {
    const unitsCheck = validateTotalUnits(data.totalUnits);
    if (!unitsCheck.isValid) errors["totalUnits"] = unitsCheck.error!;
  }

  if (data.propertyAddress !== undefined && data.propertyAddress !== null && String(data.propertyAddress).trim() !== "") {
    const addressCheck = validatePropertyAddress(data.propertyAddress);
    if (!addressCheck.isValid) errors["propertyAddress"] = addressCheck.error!;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates Step 2: Theme & Color Studio
 */
export function validateStep2Theme(data: Step2ThemeData): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const primaryCheck = validateBrandColor(data.primaryColor, "Primary brand");
  if (!primaryCheck.isValid) errors["primaryColor"] = primaryCheck.error!;

  const secondaryCheck = validateBrandColor(data.secondaryColor, "Secondary accent");
  if (!secondaryCheck.isValid) errors["secondaryColor"] = secondaryCheck.error!;

  if (data.modePreference !== "dark" && data.modePreference !== "light") {
    errors["modePreference"] = "Theme mode must be 'dark' or 'light'.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates Step 3: Master Admin Account
 */
export function validateStep3Admin(data: Step3AdminData): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const nameCheck = validateAdminFullName(data.adminName);
  if (!nameCheck.isValid) errors["adminName"] = nameCheck.error!;

  const emailCheck = validateAdminEmail(data.adminEmail);
  if (!emailCheck.isValid) errors["adminEmail"] = emailCheck.error!;

  const phoneCheck = validateAdminPhone(data.adminPhone);
  if (!phoneCheck.isValid) errors["adminPhone"] = phoneCheck.error!;

  const passwordCheck = validateAdminPassword(data.adminPassword, data.isExistingPlaceholder);
  if (!passwordCheck.isValid) errors["adminPassword"] = passwordCheck.error!;

  const confirmCheck = validateConfirmPassword(data.adminPassword, data.confirmPassword, data.isExistingPlaceholder);
  if (!confirmCheck.isValid) errors["confirmPassword"] = confirmCheck.error!;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Full end-to-end validation across all steps in the Brand Setup Wizard.
 */
export function validateAllBrandSetup(
  step1: Step1IdentityData,
  step2: Step2ThemeData,
  step3: Step3AdminData
): BrandSetupValidationResult {
  const step1Result = validateStep1Identity(step1);
  const step2Result = validateStep2Theme(step2);
  const step3Result = validateStep3Admin(step3);

  const errors: Record<string, string> = {
    ...step1Result.errors,
    ...step2Result.errors,
    ...step3Result.errors,
  };

  let firstErrorStep: 1 | 2 | 3 | undefined;
  let firstErrorField: string | undefined;

  if (Object.keys(step1Result.errors).length > 0) {
    firstErrorStep = 1;
    firstErrorField = Object.keys(step1Result.errors)[0];
  } else if (Object.keys(step2Result.errors).length > 0) {
    firstErrorStep = 2;
    firstErrorField = Object.keys(step2Result.errors)[0];
  } else if (Object.keys(step3Result.errors).length > 0) {
    firstErrorStep = 3;
    firstErrorField = Object.keys(step3Result.errors)[0];
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstErrorStep,
    firstErrorField,
  };
}

// ---------------------------------------------------------------------------
// Server Zod Schemas for API Endpoints
// ---------------------------------------------------------------------------

export const setupLaunchSchema = z.object({
  branding: z.object({
    propertyName: z
      .string()
      .trim()
      .min(2, "Property trade name must be at least 2 characters")
      .max(80, "Property trade name cannot exceed 80 characters")
      .refine((val) => !DISALLOWED_PRESEEDED_DATA.propertyNames.includes(val.toLowerCase()), {
        message: "Please enter your actual property or business name instead of the sample placeholder.",
      }),
    propertyTagline: z
      .string()
      .trim()
      .max(120, "Tagline cannot exceed 120 characters")
      .optional()
      .nullable()
      .refine((val) => !val || !DISALLOWED_PRESEEDED_DATA.taglines.includes(val.toLowerCase()), {
        message: "Please write your own brand tagline instead of the sample placeholder.",
      }),
    rentalArchetype: z.enum(VALID_ARCHETYPES).optional().nullable(),
    primaryColor: z
      .string()
      .trim()
      .regex(REGEX_HEX_COLOR, "Primary color must be a valid hex color code"),
    secondaryColor: z
      .string()
      .trim()
      .regex(REGEX_HEX_COLOR, "Secondary color must be a valid hex color code"),
    logoUrl: z.string().nullable().optional(),
    propertyAddress: z
      .string()
      .trim()
      .max(200, "Property address cannot exceed 200 characters")
      .optional()
      .nullable()
      .refine((val) => val === undefined || val === null || val === "" || val.length >= 3, {
        message: "Property address must be at least 3 characters",
      }),
    totalUnits: z.preprocess(
      (val) => (val === undefined || val === null || val === "" ? undefined : typeof val === "string" ? parseInt(val, 10) : val),
      z
        .number()
        .int("Total units must be an integer")
        .min(1, "Total units must be at least 1")
        .max(10000, "Total units cannot exceed 10,000")
        .optional()
    ).optional(),
  }),
  admin: z.object({
    fullName: z
      .string()
      .trim()
      .min(2, "Landlord full name must be at least 2 characters")
      .max(70, "Landlord full name cannot exceed 70 characters")
      .regex(REGEX_NAME, "Landlord full name can only contain letters, spaces, hyphens, and periods")
      .refine((val) => !DISALLOWED_PRESEEDED_DATA.adminNames.includes(val.toLowerCase()), {
        message: "Please enter your real legal or business name instead of the sample placeholder.",
      })
      .optional(),
    email: z
      .string()
      .trim()
      .regex(REGEX_EMAIL, "Invalid landlord email address")
      .optional()
      .nullable()
      .refine((val) => !val || !DISALLOWED_PRESEEDED_DATA.emails.includes(val.toLowerCase()), {
        message: "Please enter your actual working email address instead of the sample placeholder.",
      }),
    phone: z
      .string()
      .trim()
      .min(7, "Phone number must be at least 7 digits")
      .max(25, "Phone number is too long")
      .optional()
      .nullable()
      .refine((val) => {
        if (!val) return true;
        const clean = val.replace(/\D/g, "");
        return !DISALLOWED_PRESEEDED_DATA.phones.some((p) => p.replace(/\D/g, "") === clean);
      }, {
        message: "Please enter your actual phone number instead of the sample placeholder.",
      }),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional()
      .nullable(),
  }).optional(),
});

export const brandingUpdateSchema = z.object({
  propertyName: z
    .string()
    .trim()
    .min(2, "Property trade name must be at least 2 characters")
    .max(80, "Property trade name cannot exceed 80 characters")
    .optional(),
  propertyTagline: z
    .string()
    .trim()
    .max(120, "Tagline cannot exceed 120 characters")
    .optional()
    .nullable(),
  rentalArchetype: z.enum(VALID_ARCHETYPES).optional().nullable(),
  primaryColor: z
    .string()
    .trim()
    .regex(REGEX_HEX_COLOR, "Primary color must be a valid hex color code")
    .optional(),
  secondaryColor: z
    .string()
    .trim()
    .regex(REGEX_HEX_COLOR, "Secondary color must be a valid hex color code")
    .optional(),
  logoUrl: z.string().nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
  setupCompleted: z.boolean().optional(),
  setupCompletedAt: z.string().nullable().optional(),
});
