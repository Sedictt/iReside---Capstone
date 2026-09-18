/**
 * Universal Client-Side Form & Input Validation Library
 * Provides robust validation, sanitization, and error messages for forms across iReside.
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate an email address according to standard email syntax.
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = (email ?? "").trim();
  if (!trimmed) {
    return { isValid: false, error: "Email address is required." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid email address (e.g., name@example.com)." };
  }
  return { isValid: true };
}

/**
 * Validate a password with length and basic complexity requirements.
 */
export function validatePassword(password: string, minLength = 8): ValidationResult {
  if (!password) {
    return { isValid: false, error: "Password is required." };
  }
  if (password.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters.` };
  }
  return { isValid: true };
}

/**
 * Sanitize a phone or GCash number by stripping all non-digits.
 */
export function sanitizeNumericInput(value: string, maxLength?: number): string {
  const digitsOnly = (value ?? "").replace(/\D/g, "");
  return typeof maxLength === "number" ? digitsOnly.slice(0, maxLength) : digitsOnly;
}

/**
 * Validate a GCash mobile number.
 * Must be strictly an 11-digit Philippine mobile number starting with 09 (e.g. 09171234567).
 */
export function validateGCashNumber(number: string): ValidationResult {
  const digits = sanitizeNumericInput(number);
  if (!digits) {
    return { isValid: false, error: "GCash mobile number is required." };
  }
  if (!digits.startsWith("09")) {
    return { isValid: false, error: "GCash number must start with 09 (e.g., 09171234567)." };
  }
  if (digits.length !== 11) {
    return { isValid: false, error: `GCash number must be exactly 11 digits (currently ${digits.length}).` };
  }
  return { isValid: true };
}

/**
 * Validate a general Philippine mobile phone number (09XXXXXXXXX or +639XXXXXXXXX).
 */
export function validatePhoneNumber(phone: string, required = false): ValidationResult {
  const trimmed = (phone ?? "").trim();
  if (!trimmed) {
    if (required) {
      return { isValid: false, error: "Phone number is required." };
    }
    return { isValid: true };
  }

  const digits = sanitizeNumericInput(trimmed);
  // Match standard 11-digit mobile starting with 09 or 12-digit international starting with 639
  if (digits.startsWith("09") && digits.length === 11) {
    return { isValid: true };
  }
  if (digits.startsWith("639") && digits.length === 12) {
    return { isValid: true };
  }

  return { isValid: false, error: "Please enter a valid Philippine mobile number (e.g., 09171234567)." };
}

/**
 * Validate a person or business name.
 */
export function validateName(name: string, fieldLabel = "Name", minLength = 2): ValidationResult {
  const trimmed = (name ?? "").trim();
  if (!trimmed) {
    return { isValid: false, error: `${fieldLabel} is required.` };
  }
  if (trimmed.length < minLength) {
    return { isValid: false, error: `${fieldLabel} must be at least ${minLength} characters.` };
  }
  // Disallow names with only numbers or special symbols
  const nameRegex = /^[\p{L}\s.'\-]+$/u;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: `${fieldLabel} contains invalid characters.` };
  }
  return { isValid: true };
}

/**
 * Validate a numeric utility rate per unit (e.g., electricity kWh or water m³).
 */
export function validateRatePerUnit(rate: number | string, isSubmetered = true): ValidationResult {
  if (typeof rate === "string" && !rate.trim()) {
    return { isValid: false, error: "Rate per unit is required." };
  }
  const numeric = typeof rate === "number" ? rate : parseFloat(rate);
  if (isNaN(numeric)) {
    return { isValid: false, error: "Rate must be a valid number." };
  }
  if (numeric < 0) {
    return { isValid: false, error: "Rate per unit cannot be negative." };
  }
  if (isSubmetered && numeric === 0) {
    return { isValid: false, error: "Submetered rate must be greater than ₱0." };
  }
  return { isValid: true };
}

/**
 * Validate an optional or required web URL.
 */
export function validateUrl(url: string, required = false): ValidationResult {
  const trimmed = (url ?? "").trim();
  if (!trimmed) {
    if (required) {
      return { isValid: false, error: "Website URL is required." };
    }
    return { isValid: true };
  }

  try {
    const parsed = new URL(trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`);
    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return { isValid: false, error: "Please enter a valid web address (e.g., https://example.com)." };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: "Please enter a valid web address." };
  }
}
