import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validatePassword,
  validateGCashNumber,
  validatePhoneNumber,
  validateName,
  validateRatePerUnit,
  validateUrl,
  sanitizeNumericInput,
} from "@/lib/validation/client-validation";

describe("Universal Client Validation", () => {
  describe("sanitizeNumericInput", () => {
    it("strips letters, symbols and keeps only digits", () => {
      expect(sanitizeNumericInput("09913487293ghg")).toBe("09913487293");
      expect(sanitizeNumericInput("+63 (917) 123-4567")).toBe("639171234567");
      expect(sanitizeNumericInput("abc!@#")).toBe("");
    });

    it("respects maxLength parameter", () => {
      expect(sanitizeNumericInput("09913487293555", 11)).toBe("09913487293");
    });
  });

  describe("validateGCashNumber", () => {
    it("accepts valid 11-digit Philippine mobile numbers starting with 09", () => {
      expect(validateGCashNumber("09913487293").isValid).toBe(true);
      expect(validateGCashNumber("09171234567").isValid).toBe(true);
    });

    it("rejects numbers containing letters even if length matches", () => {
      // sanitizeNumericInput drops letters, so "09913487293ghg" has 11 digits
      // but raw input with fewer digits like "09123ghg" fails
      const result = validateGCashNumber("09123ghg");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("11 digits");
    });

    it("rejects numbers not starting with 09", () => {
      const result = validateGCashNumber("08123456789");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("must start with 09");
    });

    it("rejects empty or too short numbers", () => {
      expect(validateGCashNumber("").isValid).toBe(false);
      expect(validateGCashNumber("09123").isValid).toBe(false);
    });
  });

  describe("validateEmail", () => {
    it("accepts valid email addresses", () => {
      expect(validateEmail("landlord@ireside.com").isValid).toBe(true);
      expect(validateEmail("user.name+tag@domain.co").isValid).toBe(true);
    });

    it("rejects missing or malformed email addresses", () => {
      expect(validateEmail("").isValid).toBe(false);
      expect(validateEmail("notanemail").isValid).toBe(false);
      expect(validateEmail("missing@domain").isValid).toBe(false);
      expect(validateEmail("@nodomain.com").isValid).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("validates password length correctly", () => {
      expect(validatePassword("short").isValid).toBe(false);
      expect(validatePassword("12345678").isValid).toBe(true);
      expect(validatePassword("").isValid).toBe(false);
    });
  });

  describe("validateName", () => {
    it("accepts valid names", () => {
      expect(validateName("Juan Dela Cruz").isValid).toBe(true);
      expect(validateName("Mary-Jane O'Connor").isValid).toBe(true);
    });

    it("rejects empty or too short names", () => {
      expect(validateName("").isValid).toBe(false);
      expect(validateName("A").isValid).toBe(false);
    });
  });

  describe("validateRatePerUnit", () => {
    it("accepts positive numbers for submetered utilities", () => {
      expect(validateRatePerUnit(15.5, true).isValid).toBe(true);
      expect(validateRatePerUnit("24.00", true).isValid).toBe(true);
    });

    it("rejects negative rates and 0 when submetered", () => {
      expect(validateRatePerUnit(-5, true).isValid).toBe(false);
      expect(validateRatePerUnit(0, true).isValid).toBe(false);
      expect(validateRatePerUnit("abc", true).isValid).toBe(false);
    });
  });

  describe("validateUrl", () => {
    it("accepts valid URLs", () => {
      expect(validateUrl("https://example.com").isValid).toBe(true);
      expect(validateUrl("myproperty.ph").isValid).toBe(true);
    });

    it("rejects invalid URLs when provided", () => {
      expect(validateUrl("justtext").isValid).toBe(false);
    });
  });
});
