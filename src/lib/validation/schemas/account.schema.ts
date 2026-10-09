/**
 * Account, Authentication & Profile Validation Schemas
 *
 * Shared by the auth / setup / profile / branding route handlers and the
 * matching client forms so a field is rejected with the same message on both
 * sides. Client-safe: no server-only imports.
 *
 * Password policy: every flow that SETS a password (reset, recovery, claim,
 * settings) uses `newPasswordRule` / `zNewPassword` (8–72 chars, letters plus a
 * number or symbol). Flows that only CHECK a password (login, re-auth, 2FA
 * disable) only require a non-empty value so existing accounts with older,
 * shorter passwords can still sign in.
 *
 * @module lib/validation/schemas/account
 */

import { z } from "zod";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  TEXT_LIMITS,
  emailRule,
  otpRule,
  personNameRule,
  phoneRule,
  type FieldRuleResult,
} from "../rules";
import { zEmail, zNewPassword, zPersonName, zUuid } from "../zod-fields";
import {
  REGEX_HEX_COLOR,
  REGEX_PERMIT_NUMBER,
  validateSocialHandleOrUrl,
  validateWebsiteUrl,
} from "../landlord-settings";

// ---------------------------------------------------------------------------
// Field rules (client + server)
// ---------------------------------------------------------------------------

/** Generous upper bound for a password that is only being checked (login, re-auth). */
export const CURRENT_PASSWORD_MAX_LENGTH = 256;

/** Login / re-auth password: required only — never strength-checked. */
export function currentPasswordRule(value: unknown, { label = "Password" } = {}): FieldRuleResult {
  if (typeof value !== "string" || value.length === 0) return `${label} is required.`;
  if (value.length > CURRENT_PASSWORD_MAX_LENGTH) return `${label} is too long.`;
  return undefined;
}

/** Security recovery keys are 16 Base32 characters, typed with optional hyphens. */
export const SECURITY_KEY_LENGTH = 16;
export const normalizeSecurityKeyInput = (value: string) => value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

export function securityKeyRule(value: unknown): FieldRuleResult {
  if (typeof value !== "string" || !value.trim()) return "Security key is required.";
  if (normalizeSecurityKeyInput(value).length !== SECURITY_KEY_LENGTH) {
    return `Please enter the complete ${SECURITY_KEY_LENGTH}-character security key.`;
  }
  return undefined;
}

/** Optional email (blank allowed). */
export function optionalEmailRule(value: unknown, label = "Email address"): FieldRuleResult {
  return emailRule(value, { label, required: false });
}

export const HEX_COLOR_MESSAGE = "Enter a valid hex color (e.g. #8B5CF6).";

/**
 * Escapes LIKE wildcards so a case-insensitive email lookup (`.ilike("email", x)`)
 * matches only that exact address. Valid emails may contain `%` and `_`, which
 * would otherwise act as wildcards and match other accounts.
 */
export const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

// ---------------------------------------------------------------------------
// Zod building blocks
// ---------------------------------------------------------------------------

/** 6-digit one-time code. Whitespace is trimmed; anything else non-numeric is rejected. */
export const zOtp = (label = "Verification code") =>
  z.string({ error: `${label} is required.` }).trim().superRefine((value, ctx) => {
    const error = otpRule(value);
    if (error) ctx.addIssue({ code: "custom", message: error });
  });

/** Password being checked (not set): required, bounded, never strength-checked. */
export const zCurrentPassword = (label = "Password") =>
  z
    .string({ error: `${label} is required.` })
    .min(1, `${label} is required.`)
    .max(CURRENT_PASSWORD_MAX_LENGTH, `${label} is too long.`);

/** Optional trimmed text that keeps "" (clearing a field) instead of turning it into null. */
const zClearableText = (label: string, max: number) =>
  z.string({ error: `${label} must be text.` }).trim().max(max, `${label} cannot exceed ${max} characters.`);

const fromRule = (rule: (value: string) => FieldRuleResult) => (value: string, ctx: z.RefinementCtx) => {
  const error = rule(value);
  if (error) ctx.addIssue({ code: "custom", message: error });
};

/** Hex color with or without the leading '#'. */
export const zHexColor = (message = HEX_COLOR_MESSAGE) => z.string().trim().regex(REGEX_HEX_COLOR, message);

const ASSET_URL_MAX_LENGTH = 2048;
// Brand logos / banners picked locally are persisted as data URLs
// (logo ≤ 5 MB, banner ≤ 8 MB file → ≤ ~11 MB of base64).
const DATA_IMAGE_URL_MAX_LENGTH = 11_500_000;
const DATA_IMAGE_URL = /^data:image\/(png|jpe?g|webp|gif|heic|heif|svg\+xml);base64,[A-Za-z0-9+/=\s]+$/;

/**
 * Image reference stored for avatars, logos and banners: an http(s) URL, a
 * root-relative app path, or (for brand logos) a base64 image data URL.
 * Blocks `javascript:` and other schemes.
 */
export function imageReferenceRule(value: unknown, { label = "Image URL", allowDataUrl = false } = {}): FieldRuleResult {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value !== "string") return `${label} must be text.`;
  const trimmed = value.trim();
  if (allowDataUrl && trimmed.startsWith("data:")) {
    if (trimmed.length > DATA_IMAGE_URL_MAX_LENGTH) return `${label} is too large.`;
    return DATA_IMAGE_URL.test(trimmed) ? undefined : `${label} must be a PNG, JPG, WebP, GIF, HEIC or SVG image.`;
  }
  if (trimmed.length > ASSET_URL_MAX_LENGTH) return `${label} is too long.`;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return undefined;
  } catch {
    // fall through
  }
  return `${label} must be a valid http(s) link.`;
}

export const zImageReference = (label = "Image URL", opts: { allowDataUrl?: boolean } = {}) =>
  z
    .string({ error: `${label} must be text.` })
    .trim()
    .nullish()
    .superRefine((value, ctx) => {
      const error = imageReferenceRule(value, { label, ...opts });
      if (error) ctx.addIssue({ code: "custom", message: error });
    })
    .transform((value) => (value === undefined ? undefined : value ? value : null));

// ---------------------------------------------------------------------------
// Auth: password reset / OTP / recovery
// ---------------------------------------------------------------------------

export const passwordResetRequestSchema = z.object({ email: zEmail() });

export const passwordResetOtpVerifySchema = z.object({
  email: zEmail(),
  otp: zOtp(),
});

export const passwordResetSchema = z.object({
  email: zEmail(),
  resetToken: z.string({ error: "Reset session is missing. Please verify your code again." }).min(1, "Reset session is missing. Please verify your code again.").max(4096, "Reset session is invalid."),
  newPassword: zNewPassword("Password"),
});

export const securityKeyRecoverSchema = z.object({
  email: zEmail(),
  securityKey: z
    .string({ error: "Security key is required." })
    .max(64, "Security key is invalid.")
    .superRefine(fromRule(securityKeyRule)),
  newPassword: zNewPassword("New password"),
  newEmail: z
    .string()
    .trim()
    .nullish()
    .superRefine((value, ctx) => {
      const error = optionalEmailRule(value ?? "", "New email address");
      if (error) ctx.addIssue({ code: "custom", message: error });
    })
    .transform((value) => (value ? value.toLowerCase() : null)),
});

export const securityKeyRotateSchema = z.union([
  z.object({ action: z.literal("send-otp") }),
  z.object({
    action: z.undefined().optional(),
    currentPassword: zCurrentPassword("Current password"),
    otpCode: zOtp(),
  }),
]);

/** Legacy registration OTP (deprecated landlord signup). */
export const registrationOtpSchema = z.object({ email: zEmail() });

// ---------------------------------------------------------------------------
// Auth: 2FA
// ---------------------------------------------------------------------------

export const twoFactorChallengeSchema = z.object({
  userId: zUuid("User ID"),
  resend: z.boolean().optional(),
});

export const twoFactorVerifyLoginSchema = z.object({
  userId: zUuid("User ID"),
  otp: zOtp(),
});

/** POST /api/{tenant,landlord}/2fa */
export const twoFactorActionSchema = z.discriminatedUnion(
  "action",
  [
    z.object({ action: z.literal("send-otp") }),
    z.object({ action: z.literal("verify-otp"), otp: zOtp() }),
    z.object({ action: z.literal("disable"), password: zCurrentPassword("Account password") }),
  ],
  { error: "Invalid action" },
);

/** DELETE /api/auth/sessions */
export const sessionRevokeSchema = z
  .object({
    sessionId: zUuid("Session ID").optional(),
    scope: z.enum(["others", "global"], { error: "Scope must be 'others' or 'global'." }).optional(),
  })
  .refine((value) => Boolean(value.sessionId || value.scope), {
    message: "Either sessionId or a valid scope ('others' | 'global') must be provided",
  });

// ---------------------------------------------------------------------------
// Setup: email linking & account claim
// ---------------------------------------------------------------------------

export const setupSendOtpSchema = z.object({ newEmail: zEmail() });

export const setupVerifyOtpSchema = z.object({
  newEmail: zEmail(),
  otp: zOtp(),
  validateOnly: z.boolean().optional(),
});

export const accountClaimSchema = z
  .object({
    fullName: zPersonName("Full name"),
    newEmail: zEmail(),
    otp: zOtp(),
    newPassword: zNewPassword("Password"),
    confirmPassword: z.string({ error: "Please confirm your password." }).min(1, "Please confirm your password."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export const avatarAppearanceSchema = z.object({
  avatar_url: zImageReference("Avatar URL").optional(),
  avatar_bg_color: zHexColor("Avatar color must be a valid hex color.").nullish(),
});

export const BIO_MAX_LENGTH = 500;

/** PATCH /api/tenant/profile — only the fields the route has always allowed. */
export const tenantProfilePatchSchema = z.object({
  has_changed_password: z.boolean({ error: "has_changed_password must be true or false." }).optional(),
  full_name: zPersonName("Full name").optional(),
  bio: zClearableText("Bio", BIO_MAX_LENGTH).optional(),
  phone: z
    .string({ error: "Phone number must be text." })
    .trim()
    .max(25, "Phone number is too long.")
    .superRefine((value, ctx) => {
      const error = phoneRule(value, { required: false });
      if (error) ctx.addIssue({ code: "custom", message: error });
    })
    .nullish()
    // Absent stays absent (field untouched); blank clears it.
    .transform((value) => (value === undefined ? undefined : value ? value : null)),
  address: zClearableText("Address", TEXT_LIMITS.address).nullish(),
});

const optionalLandlordField = (label: string, max: number, rule?: (value: string) => FieldRuleResult) => {
  const base = zClearableText(label, max);
  return (rule ? base.superRefine(fromRule(rule)) : base).optional();
};

/**
 * PATCH /api/landlord/profile — mirrors the inline rules in LandlordSettings
 * (validateAllLandlordSettings) so the server enforces the same constraints.
 */
export const landlordProfilePatchSchema = z.object({
  full_name: z
    .string({ error: "Full name must be text." })
    .trim()
    .superRefine(fromRule((v) => personNameRule(v, { label: "Full name" })))
    .optional(),
  business_name: optionalLandlordField("Business name", 100, (v) =>
    v && v.length < 2 ? "Business name must be at least 2 characters." : undefined,
  ),
  email: z
    .string({ error: "Email must be text." })
    .trim()
    // Blank leaves the stored email unchanged (route behaviour), so only a non-blank value is checked.
    .superRefine(fromRule((v) => emailRule(v, { label: "Contact email", required: false })))
    .transform((v) => v.toLowerCase())
    .optional(),
  phone: optionalLandlordField("Phone number", 25, (v) => phoneRule(v, { required: false })),
  website: optionalLandlordField("Website", 255, (v) => {
    const check = validateWebsiteUrl(v);
    return check.isValid ? undefined : check.error;
  }),
  address: optionalLandlordField("Office address", 250),
  bio: optionalLandlordField("Short bio", BIO_MAX_LENGTH),
  emergency_contact_name: optionalLandlordField("Emergency contact name", 70, (v) =>
    v ? personNameRule(v, { label: "Emergency contact name", required: false }) : undefined,
  ),
  emergency_contact_phone: optionalLandlordField("Emergency contact phone", 25, (v) => phoneRule(v, { required: false })),
  business_permit_number: optionalLandlordField("Permit number", 50, (v) =>
    v && !REGEX_PERMIT_NUMBER.test(v) ? "Permit number contains invalid characters." : undefined,
  ),
  socials: z
    .record(z.string().max(40), z.string().trim().max(255, "Social link cannot exceed 255 characters."))
    .superRefine((socials, ctx) => {
      for (const platform of ["facebook", "instagram", "twitter", "linkedin"] as const) {
        const value = socials[platform];
        if (!value) continue;
        const check = validateSocialHandleOrUrl(platform, value);
        if (!check.isValid) ctx.addIssue({ code: "custom", message: check.error ?? "Invalid social link.", path: [platform] });
      }
    })
    .optional(),
  notification_preferences: z.record(z.string().max(80), z.unknown()).optional(),
});

// Image upload checks live in the shared upload module; re-exported for existing imports.
export { IMAGE_KIND_MIME, IMAGE_KIND_EXTENSIONS, sniffImageKind, isUnsafeSvg, checkImageUpload } from "../upload";
export type { ImageKind, ImageUploadPolicy, ImageUploadCheck } from "../upload";
import type { ImageKind, ImageUploadPolicy } from "../upload";

const MB = 1024 * 1024;
const PHOTO_KINDS = ["jpeg", "png", "webp", "gif", "heic"] as const satisfies readonly ImageKind[];

/** Upload policies for the profile / branding routes (sizes unchanged from the original routes). */
export const IMAGE_UPLOAD_POLICIES = {
  avatar: { label: "Profile photo", maxBytes: 5 * MB, allowed: PHOTO_KINDS },
  cover: { label: "Cover image", maxBytes: 10 * MB, allowed: PHOTO_KINDS },
  permit: { label: "Permit photo", maxBytes: 15 * MB, allowed: PHOTO_KINDS },
  banner: { label: "Banner image", maxBytes: 10 * MB, allowed: PHOTO_KINDS },
  logo: { label: "Logo", maxBytes: 5 * MB, allowed: ["png", "jpeg", "webp", "svg"] },
} as const satisfies Record<string, ImageUploadPolicy>;

/** Re-exported for forms that need the max length attribute. */
export { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH };
