/**
 * Landlord Settings Validation Module
 * 
 * Provides centralized, strict, and user-friendly validation schemas
 * and helper utilities for landlord settings forms, security updates,
 * branding configuration, and API payloads.
 *
 * @module lib/validation/landlord-settings
 */

import { z } from "zod";
import { validateSocialInput, socialsRecordSchema } from "./profile";

// ---------------------------------------------------------------------------
// Regular Expressions & Constants
// ---------------------------------------------------------------------------

export const REGEX_NAME = /^[a-zA-Z\s.,'-]+$/;
export const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const REGEX_HEX_COLOR = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
export const REGEX_PERMIT_NUMBER = /^[a-zA-Z0-9\s\-/.#]+$/;
export const REGEX_URL = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i;

// ---------------------------------------------------------------------------
// Field-Level Validation Functions
// ---------------------------------------------------------------------------

/**
 * Validates a landlord's full name.
 * Requirements: 2-70 characters, legal name characters only.
 */
export function validateFullName(value: string): { isValid: boolean; error?: string } {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) {
        return { isValid: false, error: "Full name is required." };
    }
    if (trimmed.length < 2) {
        return { isValid: false, error: "Full name must be at least 2 characters." };
    }
    if (trimmed.length > 70) {
        return { isValid: false, error: "Full name cannot exceed 70 characters." };
    }
    if (!REGEX_NAME.test(trimmed)) {
        return { isValid: false, error: "Full name can only contain letters, spaces, hyphens, and periods." };
    }
    return { isValid: true };
}

/**
 * Validates a business entity name.
 * Requirements: Optional, but if provided, 2-100 characters.
 */
export function validateBusinessName(value: string): { isValid: boolean; error?: string } {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) {
        return { isValid: true }; // optional
    }
    if (trimmed.length < 2) {
        return { isValid: false, error: "Business name must be at least 2 characters." };
    }
    if (trimmed.length > 100) {
        return { isValid: false, error: "Business name cannot exceed 100 characters." };
    }
    return { isValid: true };
}

/**
 * Validates a primary contact email.
 * Requirements: Required, standard valid email format.
 */
export function validateEmail(value: string): { isValid: boolean; error?: string } {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) {
        return { isValid: false, error: "Contact email is required." };
    }
    if (!REGEX_EMAIL.test(trimmed)) {
        return { isValid: false, error: "Please enter a valid email address (e.g. name@domain.com)." };
    }
    if (trimmed.length > 254) {
        return { isValid: false, error: "Email address is too long." };
    }
    return { isValid: true };
}

/**
 * Validates a phone number (Philippine or international standard).
 * Requirements: 7 to 15 digits; accepts '+', '-', '()', spaces.
 */
export function validatePhoneNumber(value: string, isRequired = false): { isValid: boolean; error?: string } {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) {
        if (isRequired) {
            return { isValid: false, error: "Phone number is required." };
        }
        return { isValid: true };
    }

    // Strip non-digit characters except leading plus
    const cleanDigits = trimmed.replace(/[^\d+]/g, "");
    const digitsOnly = trimmed.replace(/\D/g, "");

    if (digitsOnly.length < 7) {
        return { isValid: false, error: "Phone number must have at least 7 digits." };
    }
    if (digitsOnly.length > 15) {
        return { isValid: false, error: "Phone number cannot exceed 15 digits." };
    }

    // Check if Philippine mobile: e.g. 09XXXXXXXXX (11 digits) or +639XXXXXXXXX (12 digits)
    if (trimmed.startsWith("09") && digitsOnly.length !== 11) {
        return { isValid: false, error: "Philippine mobile numbers starting with 09 must be 11 digits." };
    }
    if (cleanDigits.startsWith("+639") && digitsOnly.length !== 12) {
        return { isValid: false, error: "Philippine mobile numbers starting with +639 must have 12 digits." };
    }

    return { isValid: true };
}

/**
 * Validates a website URL.
 * Accepts with or without protocol, auto-normalizes for checking.
 */
export function validateWebsiteUrl(value: string, isRequired = false): { isValid: boolean; error?: string; normalized?: string } {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) {
        if (isRequired) {
            return { isValid: false, error: "Website URL is required." };
        }
        return { isValid: true, normalized: "" };
    }

    let urlToTest = trimmed;
    if (!/^https?:\/\//i.test(trimmed)) {
        urlToTest = `https://${trimmed}`;
    }

    try {
        const parsed = new URL(urlToTest);
        if (!["http:", "https:"].includes(parsed.protocol)) {
            return { isValid: false, error: "Website must use HTTP or HTTPS protocol." };
        }
        if (!parsed.hostname.includes(".")) {
            return { isValid: false, error: "Please enter a valid website address (e.g. example.com)." };
        }
        return { isValid: true, normalized: urlToTest };
    } catch {
        return { isValid: false, error: "Please enter a valid website URL." };
    }
}

/**
 * Validates office or physical address.
 * Max 250 characters.
 */
export function validateAddress(value: string): { isValid: boolean; error?: string } {
    const trimmed = value?.trim() ?? "";
    if (trimmed.length > 250) {
        return { isValid: false, error: "Office address cannot exceed 250 characters." };
    }
    return { isValid: true };
}

/**
 * Validates short biography.
 * Max 500 characters.
 */
export function validateBio(value: string): { isValid: boolean; error?: string } {
    const trimmed = value ?? "";
    if (trimmed.length > 500) {
        return { isValid: false, error: "Short bio cannot exceed 500 characters." };
    }
    return { isValid: true };
}

/**
 * Validates business permit number.
 * Max 50 characters, alphanumeric & common punctuation.
 */
export function validateBusinessPermitNumber(value: string): { isValid: boolean; error?: string } {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) return { isValid: true };
    if (trimmed.length > 50) {
        return { isValid: false, error: "Permit number cannot exceed 50 characters." };
    }
    if (!REGEX_PERMIT_NUMBER.test(trimmed)) {
        return { isValid: false, error: "Permit number contains invalid characters." };
    }
    return { isValid: true };
}

/**
 * Validates a social media profile input (URL or handle).
 */
export function validateSocialHandleOrUrl(
    platform: "facebook" | "instagram" | "twitter" | "linkedin",
    value: string
): { isValid: boolean; error?: string } {
    return validateSocialInput(platform, value);
}

/**
 * Validates a Hex Color string (e.g. #C4B0FF or C4B0FF).
 */
export function validateHexColor(value: string): { isValid: boolean; formatted: string; error?: string } {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) {
        return { isValid: false, formatted: "", error: "Color hex code is required." };
    }
    const cleanHex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    if (!REGEX_HEX_COLOR.test(cleanHex)) {
        return { isValid: false, formatted: cleanHex, error: "Must be a valid 3 or 6-digit hex color (e.g. #C4B0FF)." };
    }
    return { isValid: true, formatted: cleanHex.toUpperCase() };
}

/**
 * Validates property trade name.
 * Requirements: 1-80 characters.
 */
export function validatePropertyTradeName(value: string): { isValid: boolean; error?: string } {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) {
        return { isValid: false, error: "Property trade name cannot be blank." };
    }
    if (trimmed.length > 80) {
        return { isValid: false, error: "Property trade name cannot exceed 80 characters." };
    }
    return { isValid: true };
}

/**
 * Validates property tagline.
 * Requirements: Max 120 characters.
 */
export function validatePropertyTagline(value: string): { isValid: boolean; error?: string } {
    const trimmed = value ?? "";
    if (trimmed.length > 120) {
        return { isValid: false, error: "Tagline cannot exceed 120 characters." };
    }
    return { isValid: true };
}

/**
 * Validates direct image link for custom banner.
 */
export function validateBannerImageUrl(value: string): { isValid: boolean; error?: string } {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) {
        return { isValid: false, error: "Please enter an image URL." };
    }
    if (!/^https?:\/\/.+/i.test(trimmed)) {
        return { isValid: false, error: "Banner URL must start with http:// or https://." };
    }
    try {
        const parsed = new URL(trimmed);
        if (!parsed.hostname.includes(".")) {
            return { isValid: false, error: "Please enter a valid image web link." };
        }
    } catch {
        return { isValid: false, error: "Invalid URL format." };
    }
    return { isValid: true };
}

/**
 * Calculates password strength and checks security requirements.
 */
export function evaluatePasswordStrength(password: string): {
    score: number; // 0 to 4
    label: "Weak" | "Fair" | "Good" | "Strong";
    color: string;
    checks: {
        hasMinLength: boolean;
        hasLetter: boolean;
        hasNumberOrSymbol: boolean;
        hasUppercase: boolean;
    };
    error?: string;
} {
    const trimmed = password ?? "";
    const hasMinLength = trimmed.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(trimmed);
    const hasNumberOrSymbol = /[\d\W_]/.test(trimmed);
    const hasUppercase = /[A-Z]/.test(trimmed);

    let score = 0;
    if (trimmed.length >= 8) score++;
    if (trimmed.length >= 12) score++;
    if (hasLetter && hasNumberOrSymbol) score++;
    if (hasUppercase) score++;

    let label: "Weak" | "Fair" | "Good" | "Strong" = "Weak";
    let color = "text-rose-500 bg-rose-500";

    if (score >= 4) {
        label = "Strong";
        color = "text-emerald-500 bg-emerald-500";
    } else if (score === 3) {
        label = "Good";
        color = "text-blue-500 bg-blue-500";
    } else if (score === 2) {
        label = "Fair";
        color = "text-amber-500 bg-amber-500";
    }

    let error: string | undefined;
    if (trimmed.length > 0 && trimmed.length < 8) {
        error = "Password must be at least 8 characters.";
    } else if (trimmed.length > 0 && !hasNumberOrSymbol) {
        error = "Password must include at least one number or special symbol.";
    }

    return {
        score,
        label,
        color,
        checks: {
            hasMinLength,
            hasLetter,
            hasNumberOrSymbol,
            hasUppercase,
        },
        error,
    };
}

/**
 * Validates a password change pair (new password & confirm password).
 */
export function validatePasswordPair(
    newPassword: string,
    confirmPassword: string
): { isValid: boolean; newPasswordError?: string; confirmPasswordError?: string } {
    if (!newPassword) {
        return { isValid: false, newPasswordError: "New password is required." };
    }
    if (newPassword.length < 8) {
        return { isValid: false, newPasswordError: "New password must be at least 8 characters long." };
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[\d\W_]/.test(newPassword)) {
        return { isValid: false, newPasswordError: "Password must contain both letters and numbers/symbols." };
    }
    if (!confirmPassword) {
        return { isValid: false, confirmPasswordError: "Please confirm your new password." };
    }
    if (newPassword !== confirmPassword) {
        return { isValid: false, confirmPasswordError: "Passwords do not match." };
    }
    return { isValid: true };
}

/**
 * Validates utility rate per unit.
 */
export function validateUtilityRate(rate: number | string): { isValid: boolean; error?: string; parsedValue: number } {
    const num = typeof rate === "string" ? parseFloat(rate) : rate;
    if (Number.isNaN(num)) {
        return { isValid: false, error: "Rate must be a valid number.", parsedValue: 0 };
    }
    if (num < 0) {
        return { isValid: false, error: "Rate per unit cannot be negative.", parsedValue: 0 };
    }
    if (num > 99999) {
        return { isValid: false, error: "Rate per unit cannot exceed ₱99,999.", parsedValue: num };
    }
    return { isValid: true, parsedValue: num };
}

// ---------------------------------------------------------------------------
// Comprehensive Settings Validation Runner
// ---------------------------------------------------------------------------

export interface LandlordProfileFormValues {
    full_name: string;
    business_name: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    bio: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    business_permit_number: string;
    socials: {
        facebook: string;
        instagram: string;
        twitter: string;
        linkedin: string;
    };
}

export interface PersonalizationFormValues {
    propertyTradeName: string;
    propertyTagline: string;
    brandPrimaryHex: string;
    brandSecondaryHex: string;
    bannerUrl?: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
    firstErrorTab?: {
        category: "Identity" | "Personalization" | "Finance" | "Security" | "Notifications" | "Data" | "AuditLogs";
        subtab: string;
        fieldName: string;
    };
}

/**
 * Runs full validation across all Landlord Settings fields and maps the first
 * error to the exact Tab and SubTab for intuitive user auto-navigation.
 */
export function validateAllLandlordSettings(
    formData: LandlordProfileFormValues,
    personalization?: PersonalizationFormValues
): ValidationResult {
    const errors: Record<string, string> = {};

    // 1. Identity -> Profile
    const nameCheck = validateFullName(formData.full_name);
    if (!nameCheck.isValid) errors["full_name"] = nameCheck.error!;

    const bizCheck = validateBusinessName(formData.business_name);
    if (!bizCheck.isValid) errors["business_name"] = bizCheck.error!;

    const emailCheck = validateEmail(formData.email);
    if (!emailCheck.isValid) errors["email"] = emailCheck.error!;

    const phoneCheck = validatePhoneNumber(formData.phone);
    if (!phoneCheck.isValid) errors["phone"] = phoneCheck.error!;

    const websiteCheck = validateWebsiteUrl(formData.website);
    if (!websiteCheck.isValid) errors["website"] = websiteCheck.error!;

    const addressCheck = validateAddress(formData.address);
    if (!addressCheck.isValid) errors["address"] = addressCheck.error!;

    const bioCheck = validateBio(formData.bio);
    if (!bioCheck.isValid) errors["bio"] = bioCheck.error!;

    // 2. Identity -> Emergency Contact
    if (formData.emergency_contact_name) {
        if (formData.emergency_contact_name.trim().length < 2) {
            errors["emergency_contact_name"] = "Emergency contact name must be at least 2 characters.";
        } else if (!REGEX_NAME.test(formData.emergency_contact_name.trim())) {
            errors["emergency_contact_name"] = "Name contains invalid characters.";
        }
    }
    const emergPhoneCheck = validatePhoneNumber(formData.emergency_contact_phone);
    if (!emergPhoneCheck.isValid) {
        errors["emergency_contact_phone"] = emergPhoneCheck.error!;
    }
    // Cross check: if one is present, both are required
    if (formData.emergency_contact_name.trim() && !formData.emergency_contact_phone.trim()) {
        errors["emergency_contact_phone"] = "Emergency phone number is required when a contact name is provided.";
    }
    if (formData.emergency_contact_phone.trim() && !formData.emergency_contact_name.trim()) {
        errors["emergency_contact_name"] = "Emergency contact name is required when a phone number is provided.";
    }

    // 3. Identity -> Socials
    if (formData.socials) {
        const fbCheck = validateSocialHandleOrUrl("facebook", formData.socials.facebook);
        if (!fbCheck.isValid) errors["socials_facebook"] = fbCheck.error!;

        const igCheck = validateSocialHandleOrUrl("instagram", formData.socials.instagram);
        if (!igCheck.isValid) errors["socials_instagram"] = igCheck.error!;

        const twCheck = validateSocialHandleOrUrl("twitter", formData.socials.twitter);
        if (!twCheck.isValid) errors["socials_twitter"] = twCheck.error!;

        const liCheck = validateSocialHandleOrUrl("linkedin", formData.socials.linkedin);
        if (!liCheck.isValid) errors["socials_linkedin"] = liCheck.error!;
    }

    // 4. Identity -> Verification
    const permitCheck = validateBusinessPermitNumber(formData.business_permit_number);
    if (!permitCheck.isValid) errors["business_permit_number"] = permitCheck.error!;

    // 5. Personalization (if provided)
    if (personalization) {
        const tradeNameCheck = validatePropertyTradeName(personalization.propertyTradeName);
        if (!tradeNameCheck.isValid) errors["propertyTradeName"] = tradeNameCheck.error!;

        const taglineCheck = validatePropertyTagline(personalization.propertyTagline);
        if (!taglineCheck.isValid) errors["propertyTagline"] = taglineCheck.error!;

        const primaryHexCheck = validateHexColor(personalization.brandPrimaryHex);
        if (!primaryHexCheck.isValid) errors["brandPrimaryHex"] = primaryHexCheck.error!;

        const secondaryHexCheck = validateHexColor(personalization.brandSecondaryHex);
        if (!secondaryHexCheck.isValid) errors["brandSecondaryHex"] = secondaryHexCheck.error!;
    }

    // Determine the first error location for automatic navigation
    let firstErrorTab: ValidationResult["firstErrorTab"];
    const fieldKeys = Object.keys(errors);

    if (fieldKeys.length > 0) {
        const firstField = fieldKeys[0];

        if (["full_name", "business_name", "email", "phone", "website", "address", "bio"].includes(firstField)) {
            firstErrorTab = { category: "Identity", subtab: "Profile", fieldName: firstField };
        } else if (["emergency_contact_name", "emergency_contact_phone"].includes(firstField)) {
            firstErrorTab = { category: "Identity", subtab: "Emergency Contact", fieldName: firstField };
        } else if (firstField.startsWith("socials_")) {
            firstErrorTab = { category: "Identity", subtab: "Socials", fieldName: firstField };
        } else if (firstField === "business_permit_number") {
            firstErrorTab = { category: "Identity", subtab: "Verification", fieldName: firstField };
        } else if (["brandPrimaryHex", "brandSecondaryHex"].includes(firstField)) {
            firstErrorTab = { category: "Personalization", subtab: "Themes & Contrast", fieldName: firstField };
        } else if (["propertyTradeName", "propertyTagline"].includes(firstField)) {
            firstErrorTab = { category: "Personalization", subtab: "Branding & Logo", fieldName: firstField };
        }
    }

    return {
        isValid: fieldKeys.length === 0,
        errors,
        firstErrorTab,
    };
}

// ---------------------------------------------------------------------------
// Server Zod Schema for API validation
// ---------------------------------------------------------------------------

export const landlordProfilePatchSchema = z.object({
    full_name: z.string().trim().min(2, "Full name must be at least 2 characters").max(70).optional(),
    business_name: z.string().trim().max(100).optional(),
    email: z.string().trim().regex(REGEX_EMAIL, "Invalid email address").optional(),
    phone: z.string().trim().max(25).optional(),
    website: z.string().trim().max(255).optional(),
    address: z.string().trim().max(250).optional(),
    bio: z.string().trim().max(500).optional(),
    emergency_contact_name: z.string().trim().max(70).optional(),
    emergency_contact_phone: z.string().trim().max(25).optional(),
    business_permit_number: z.string().trim().max(50).optional(),
    socials: socialsRecordSchema,
    notification_preferences: z.record(z.string(), z.any()).optional(),
}).superRefine((data, ctx) => {
    const emergName = data.emergency_contact_name?.trim() || "";
    const emergPhone = data.emergency_contact_phone?.trim() || "";
    if (emergName || emergPhone) {
        if (!emergName) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Emergency contact name is required when emergency phone is provided",
                path: ["emergency_contact_name"],
            });
        }
        if (!emergPhone) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Emergency contact phone is required when emergency name is provided",
                path: ["emergency_contact_phone"],
            });
        }
    }
});
