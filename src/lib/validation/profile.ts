/**
 * Profile Validation and Normalization Module
 *
 * Provides shared, standardized input validation and normalization
 * for user profiles across both Landlord and Tenant roles.
 *
 * @module lib/validation/profile
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Regular Expressions & Constants
// ---------------------------------------------------------------------------

export const REGEX_NAME = /^[\p{L}\s.,'-]+$/u;
export const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const MAX_BIO_LENGTH = 500;
export const MAX_NAME_LENGTH = 70;
export const MAX_ADDRESS_LENGTH = 250;

export type SocialPlatform = "facebook" | "twitter" | "linkedin" | "instagram" | "website";

interface PlatformRule {
    name: string;
    domains: string[];
    baseUrl: string;
    handleRegex: RegExp;
    example: string;
}

export const SOCIAL_PLATFORMS: Record<Exclude<SocialPlatform, "website">, PlatformRule> = {
    facebook: {
        name: "Facebook",
        domains: ["facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com", "fb.com", "fb.me"],
        baseUrl: "https://facebook.com/",
        handleRegex: /^[a-zA-Z0-9.]{3,50}$/,
        example: "facebook.com/username or @username",
    },
    twitter: {
        name: "X / Twitter",
        domains: ["twitter.com", "www.twitter.com", "x.com", "www.x.com"],
        baseUrl: "https://x.com/",
        handleRegex: /^[a-zA-Z0-9_]{1,15}$/,
        example: "x.com/username or @username",
    },
    linkedin: {
        name: "LinkedIn",
        domains: ["linkedin.com", "www.linkedin.com"],
        baseUrl: "https://linkedin.com/in/",
        handleRegex: /^[a-zA-Z0-9._\-]{3,100}$/,
        example: "linkedin.com/in/username or @username",
    },
    instagram: {
        name: "Instagram",
        domains: ["instagram.com", "www.instagram.com"],
        baseUrl: "https://instagram.com/",
        handleRegex: /^[a-zA-Z0-9._]{1,30}$/,
        example: "instagram.com/username or @username",
    },
};

// ---------------------------------------------------------------------------
// Social Links Validation & Normalization
// ---------------------------------------------------------------------------

export interface SocialValidationResult {
    isValid: boolean;
    error?: string;
    normalized?: string;
    isHandle?: boolean;
}

/**
 * Validates a social media profile URL or username handle.
 * If valid, also produces the normalized full URL.
 */
export function validateSocialInput(
    platform: SocialPlatform,
    value: string
): SocialValidationResult {
    const trimmed = (value ?? "").trim();
    if (!trimmed) {
        return { isValid: true, normalized: "" };
    }

    if (platform === "website") {
        return validateWebsiteUrl(trimmed);
    }

    const rule = SOCIAL_PLATFORMS[platform];
    if (!rule) {
        return { isValid: false, error: "Unsupported social platform." };
    }

    // Check if input is explicitly a URL or contains platform/external domain
    const hasProtocol = /^https?:\/\//i.test(trimmed);
    const startsWithWww = /^www\./i.test(trimmed);
    const containsPlatformDomain = rule.domains.some(d => trimmed.toLowerCase().includes(d));
    const isLinkedInInPrefix = platform === "linkedin" && /^in\//i.test(trimmed);
    const hasSlashPath = trimmed.includes("/") && !isLinkedInInPrefix;
    const hasDomainExtension = /\.(com|org|net|io|co|ph|me|app)(\/|$)/i.test(trimmed);

    const isUrl = hasProtocol || startsWithWww || containsPlatformDomain || hasSlashPath || hasDomainExtension;

    if (isUrl) {
        let urlStringToParse = trimmed;
        if (!hasProtocol) {
            urlStringToParse = `https://${trimmed}`;
        }

        try {
            const parsed = new URL(urlStringToParse);
            const host = parsed.hostname.toLowerCase();

            // Check if domain belongs to the target platform
            const domainMatches = rule.domains.some(d => host === d || host.endsWith(`.${d}`));
            if (!domainMatches) {
                return {
                    isValid: false,
                    error: `Must be a valid ${rule.name} URL (e.g. ${rule.example}).`,
                };
            }

            // Path shouldn't be empty or just '/'
            const path = parsed.pathname.replace(/^\/+|\/+$/g, "");
            if (!path) {
                return {
                    isValid: false,
                    error: `Please include your ${rule.name} username in the link.`,
                };
            }

            // Clean, normalized URL
            const cleanUrl = `${parsed.protocol}//${parsed.host}/${path}`;
            return { isValid: true, normalized: cleanUrl, isHandle: false };
        } catch {
            return {
                isValid: false,
                error: `Please enter a valid ${rule.name} link or username.`,
            };
        }
    }

    // Otherwise, treat as a handle/username
    let cleanHandle = trimmed.replace(/^@+/, "");
    if (platform === "linkedin") {
        cleanHandle = cleanHandle.replace(/^in\//i, "");
    }

    // Handles cannot contain spaces
    if (/\s/.test(cleanHandle)) {
        return {
            isValid: false,
            error: `${rule.name} username cannot contain spaces.`,
        };
    }

    if (!rule.handleRegex.test(cleanHandle)) {
        return {
            isValid: false,
            error: `Invalid ${rule.name} username format (e.g. ${rule.example}).`,
        };
    }

    // Format normalized URL for handle
    let normalized = `${rule.baseUrl}${cleanHandle}`;
    if (platform === "linkedin") {
        normalized = `https://linkedin.com/in/${cleanHandle.replace(/^in\//, "")}`;
    }

    return {
        isValid: true,
        normalized,
        isHandle: true,
    };
}

/**
 * Helper to normalize a social input directly, returning empty string if invalid.
 */
export function normalizeSocialUrl(platform: SocialPlatform, value: string): string {
    const res = validateSocialInput(platform, value);
    return res.isValid ? (res.normalized ?? "") : "";
}

/**
 * Validates a standard website URL.
 */
export function validateWebsiteUrl(value: string, isRequired = false): SocialValidationResult {
    const trimmed = (value ?? "").trim();
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
            return { isValid: false, error: "Website must use HTTP or HTTPS." };
        }
        if (!parsed.hostname.includes(".")) {
            return { isValid: false, error: "Please enter a valid website address (e.g. example.com)." };
        }
        return { isValid: true, normalized: urlToTest, isHandle: false };
    } catch {
        return { isValid: false, error: "Please enter a valid website URL." };
    }
}

// ---------------------------------------------------------------------------
// Personal & Contact Field Validators
// ---------------------------------------------------------------------------

export interface ValidationFieldResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validates a user's full name.
 */
export function validateFullName(value: string): ValidationFieldResult {
    const trimmed = (value ?? "").trim();
    if (!trimmed) {
        return { isValid: false, error: "Full name is required." };
    }
    if (trimmed.length < 2) {
        return { isValid: false, error: "Full name must be at least 2 characters." };
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
        return { isValid: false, error: `Full name cannot exceed ${MAX_NAME_LENGTH} characters.` };
    }
    if (!REGEX_NAME.test(trimmed)) {
        return { isValid: false, error: "Full name can only contain letters, spaces, hyphens, and periods." };
    }
    return { isValid: true };
}

/**
 * Validates a user's biography.
 */
export function validateBio(value: string, maxLength = MAX_BIO_LENGTH): ValidationFieldResult {
    const trimmed = value ?? "";
    if (trimmed.length > maxLength) {
        return { isValid: false, error: `Bio cannot exceed ${maxLength} characters.` };
    }
    return { isValid: true };
}

/**
 * Validates a Philippine or international phone number.
 */
export function validatePhoneNumber(value: string, isRequired = false): ValidationFieldResult {
    const trimmed = (value ?? "").trim();
    if (!trimmed) {
        if (isRequired) {
            return { isValid: false, error: "Phone number is required." };
        }
        return { isValid: true };
    }

    const cleanDigits = trimmed.replace(/[^\d+]/g, "");
    const digitsOnly = trimmed.replace(/\D/g, "");

    if (digitsOnly.length < 7) {
        return { isValid: false, error: "Phone number must have at least 7 digits." };
    }
    if (digitsOnly.length > 15) {
        return { isValid: false, error: "Phone number cannot exceed 15 digits." };
    }

    // Philippine mobile format check
    if (trimmed.startsWith("09") && digitsOnly.length !== 11) {
        return { isValid: false, error: "Philippine mobile numbers starting with 09 must be 11 digits." };
    }
    if (cleanDigits.startsWith("+639") && digitsOnly.length !== 12) {
        return { isValid: false, error: "Philippine mobile numbers starting with +639 must have 12 digits." };
    }

    return { isValid: true };
}

/**
 * Validates an email address.
 */
export function validateEmail(value: string, isRequired = true): ValidationFieldResult {
    const trimmed = (value ?? "").trim();
    if (!trimmed) {
        if (isRequired) {
            return { isValid: false, error: "Email address is required." };
        }
        return { isValid: true };
    }
    if (trimmed.length > 254) {
        return { isValid: false, error: "Email cannot exceed 254 characters." };
    }
    if (!REGEX_EMAIL.test(trimmed)) {
        return { isValid: false, error: "Please enter a valid email address." };
    }
    return { isValid: true };
}

/**
 * Validates an address string.
 */
export function validateAddress(value: string): ValidationFieldResult {
    const trimmed = (value ?? "").trim();
    if (trimmed.length > MAX_ADDRESS_LENGTH) {
        return { isValid: false, error: `Address cannot exceed ${MAX_ADDRESS_LENGTH} characters.` };
    }
    return { isValid: true };
}

/**
 * Validates emergency contact pair: if one is entered, both are required.
 */
export function validateEmergencyContactPair(
    name: string,
    phone: string
): { isValid: boolean; nameError?: string; phoneError?: string } {
    const trimmedName = (name ?? "").trim();
    const trimmedPhone = (phone ?? "").trim();

    let nameError: string | undefined;
    let phoneError: string | undefined;

    if (trimmedName || trimmedPhone) {
        if (!trimmedName) {
            nameError = "Emergency contact name is required when a phone number is provided.";
        } else if (trimmedName.length < 2) {
            nameError = "Emergency contact name must be at least 2 characters.";
        } else if (trimmedName.length > MAX_NAME_LENGTH) {
            nameError = `Emergency contact name cannot exceed ${MAX_NAME_LENGTH} characters.`;
        } else if (!REGEX_NAME.test(trimmedName)) {
            nameError = "Contact name contains invalid characters.";
        }

        if (!trimmedPhone) {
            phoneError = "Emergency contact phone is required when a contact name is provided.";
        } else {
            const phoneCheck = validatePhoneNumber(trimmedPhone, true);
            if (!phoneCheck.isValid) {
                phoneError = phoneCheck.error;
            }
        }
    }

    return {
        isValid: !nameError && !phoneError,
        nameError,
        phoneError,
    };
}

// ---------------------------------------------------------------------------
// Server Zod Schemas
// ---------------------------------------------------------------------------

export const socialsRecordSchema = z.record(
    z.string(),
    z.string().trim().max(255)
).optional().superRefine((socials, ctx) => {
    if (!socials) return;
    const knownKeys: SocialPlatform[] = ["facebook", "twitter", "linkedin", "instagram", "website"];
    for (const [key, value] of Object.entries(socials)) {
        if (!value) continue;
        if (knownKeys.includes(key as SocialPlatform)) {
            const result = validateSocialInput(key as SocialPlatform, value);
            if (!result.isValid) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: result.error || `Invalid ${key} link format`,
                    path: [key],
                });
            }
        }
    }
});

export const tenantProfilePatchSchema = z.object({
    full_name: z.string().trim().min(2, "Full name must be at least 2 characters").max(MAX_NAME_LENGTH, `Full name cannot exceed ${MAX_NAME_LENGTH} characters`).regex(REGEX_NAME, "Full name can only contain letters, spaces, hyphens, and periods").optional(),
    email: z.string().trim().regex(REGEX_EMAIL, "Invalid email address").optional(),
    bio: z.string().trim().max(MAX_BIO_LENGTH, `Bio cannot exceed ${MAX_BIO_LENGTH} characters`).optional(),
    phone: z.string().trim().max(25).optional(),
    address: z.string().trim().max(MAX_ADDRESS_LENGTH, `Address cannot exceed ${MAX_ADDRESS_LENGTH} characters`).optional(),
    emergency_contact_name: z.string().trim().max(MAX_NAME_LENGTH).optional(),
    emergency_contact_phone: z.string().trim().max(25).optional(),
    has_changed_password: z.boolean().optional(),
    socials: socialsRecordSchema,
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
