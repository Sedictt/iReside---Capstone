import { describe, it, expect } from "vitest";
import {
    validateFullName,
    validateBusinessName,
    validateEmail,
    validatePhoneNumber,
    validateWebsiteUrl,
    validateAddress,
    validateBio,
    validateBusinessPermitNumber,
    validateSocialHandleOrUrl,
    validateHexColor,
    validatePropertyTradeName,
    validatePropertyTagline,
    validateBannerImageUrl,
    evaluatePasswordStrength,
    validatePasswordPair,
    validateUtilityRate,
    validateAllLandlordSettings,
} from "../landlord-settings";

describe("Landlord Settings Validation", () => {
    describe("validateFullName", () => {
        it("rejects empty or whitespace-only names", () => {
            expect(validateFullName("").isValid).toBe(false);
            expect(validateFullName("   ").isValid).toBe(false);
        });

        it("rejects names with less than 2 characters", () => {
            expect(validateFullName("J").isValid).toBe(false);
        });

        it("rejects names with invalid symbols or numbers", () => {
            expect(validateFullName("John123").isValid).toBe(false);
            expect(validateFullName("John<script>").isValid).toBe(false);
        });

        it("accepts valid names with periods, hyphens, and apostrophes", () => {
            expect(validateFullName("Juan Dela Cruz").isValid).toBe(true);
            expect(validateFullName("Mary-Jane O'Connor").isValid).toBe(true);
            expect(validateFullName("Dr. Jose Rizal").isValid).toBe(true);
        });
    });

    describe("validateEmail", () => {
        it("rejects invalid emails", () => {
            expect(validateEmail("").isValid).toBe(false);
            expect(validateEmail("invalid-email").isValid).toBe(false);
            expect(validateEmail("test@").isValid).toBe(false);
            expect(validateEmail("@domain.com").isValid).toBe(false);
        });

        it("accepts valid standard email addresses", () => {
            expect(validateEmail("landlord@example.com").isValid).toBe(true);
            expect(validateEmail("first.last@company.ph").isValid).toBe(true);
        });
    });

    describe("validatePhoneNumber", () => {
        it("accepts empty if optional", () => {
            expect(validatePhoneNumber("").isValid).toBe(true);
            expect(validatePhoneNumber("", false).isValid).toBe(true);
        });

        it("rejects if required and empty", () => {
            expect(validatePhoneNumber("", true).isValid).toBe(false);
        });

        it("rejects invalid phone numbers", () => {
            expect(validatePhoneNumber("123").isValid).toBe(false);
            expect(validatePhoneNumber("091234").isValid).toBe(false); // Philippine 09 must be 11 digits
        });

        it("accepts valid Philippine and international numbers", () => {
            expect(validatePhoneNumber("09171234567").isValid).toBe(true);
            expect(validatePhoneNumber("+639171234567").isValid).toBe(true);
            expect(validatePhoneNumber("+63 917 123 4567").isValid).toBe(true);
            expect(validatePhoneNumber("+14155552671").isValid).toBe(true);
        });
    });

    describe("validateWebsiteUrl", () => {
        it("accepts empty if optional", () => {
            expect(validateWebsiteUrl("").isValid).toBe(true);
        });

        it("normalizes and validates URLs with or without http(s)", () => {
            expect(validateWebsiteUrl("https://example.com").isValid).toBe(true);
            expect(validateWebsiteUrl("http://myresidence.ph").isValid).toBe(true);
            expect(validateWebsiteUrl("skyline.ireside.ph").isValid).toBe(true);
        });

        it("rejects malformed URLs", () => {
            expect(validateWebsiteUrl("not_a_website").isValid).toBe(false);
            expect(validateWebsiteUrl("ftp://something.com").isValid).toBe(false);
        });
    });

    describe("validateHexColor", () => {
        it("accepts 3 and 6 digit hex colors with or without #", () => {
            expect(validateHexColor("#C4B0FF").isValid).toBe(true);
            expect(validateHexColor("C4B0FF").isValid).toBe(true);
            expect(validateHexColor("#fff").isValid).toBe(true);
            expect(validateHexColor("fff").isValid).toBe(true);
        });

        it("rejects invalid hex characters or invalid lengths", () => {
            expect(validateHexColor("").isValid).toBe(false);
            expect(validateHexColor("ZZZZZZ").isValid).toBe(false);
            expect(validateHexColor("#12").isValid).toBe(false);
            expect(validateHexColor("#1234567").isValid).toBe(false);
        });
    });

    describe("evaluatePasswordStrength & validatePasswordPair", () => {
        it("evaluates password strength correctly", () => {
            const weak = evaluatePasswordStrength("abc");
            expect(weak.score).toBeLessThan(2);
            expect(weak.label).toBe("Weak");

            const strong = evaluatePasswordStrength("Str0ngP@ssw0rd2026");
            expect(strong.score).toBeGreaterThanOrEqual(3);
        });

        it("enforces password matching and length", () => {
            // Mismatched
            expect(validatePasswordPair("StrongP@ss1", "StrongP@ss2").isValid).toBe(false);

            // Shorter than 8
            expect(validatePasswordPair("P@ss1", "P@ss1").isValid).toBe(false);

            // Empty confirm password
            expect(validatePasswordPair("StrongP@ss1", "").isValid).toBe(false);

            // Valid matching pair
            expect(validatePasswordPair("SecureP@ss123", "SecureP@ss123").isValid).toBe(true);
        });
    });

    describe("validateUtilityRate", () => {
        it("validates valid rate numbers", () => {
            expect(validateUtilityRate(12.5).isValid).toBe(true);
            expect(validateUtilityRate("15.75").isValid).toBe(true);
            expect(validateUtilityRate(0).isValid).toBe(true);
        });

        it("rejects negative rates and NaN", () => {
            expect(validateUtilityRate(-5).isValid).toBe(false);
            expect(validateUtilityRate("abc").isValid).toBe(false);
        });
    });

    describe("validateAllLandlordSettings", () => {
        it("returns isValid: false and navigates to the first error", () => {
            const result = validateAllLandlordSettings({
                full_name: "",
                business_name: "Acme",
                email: "bad-email",
                phone: "",
                website: "",
                address: "",
                bio: "",
                emergency_contact_name: "",
                emergency_contact_phone: "",
                business_permit_number: "",
                socials: { facebook: "", instagram: "", twitter: "", linkedin: "" },
            });

            expect(result.isValid).toBe(false);
            expect(result.errors.full_name).toBeDefined();
            expect(result.firstErrorTab?.category).toBe("Identity");
            expect(result.firstErrorTab?.subtab).toBe("Profile");
            expect(result.firstErrorTab?.fieldName).toBe("full_name");
        });

        it("returns isValid: true when all required and optional fields are valid", () => {
            const result = validateAllLandlordSettings({
                full_name: "Maria Santos",
                business_name: "Santos Properties",
                email: "maria@example.com",
                phone: "09171234567",
                website: "https://santos.ph",
                address: "123 Taft Ave, Manila",
                bio: "Experienced landlord providing quality homes.",
                emergency_contact_name: "Juan Santos",
                emergency_contact_phone: "09181234567",
                business_permit_number: "BP-2026-00123",
                socials: {
                    facebook: "https://facebook.com/santosproperties",
                    instagram: "santosproperties",
                    twitter: "santosprops",
                    linkedin: "santos-properties",
                },
            }, {
                propertyTradeName: "Santos Tower",
                propertyTagline: "Modern Living in Taft",
                brandPrimaryHex: "#C4B0FF",
                brandSecondaryHex: "#8B5CF6",
            });

            expect(result.isValid).toBe(true);
            expect(Object.keys(result.errors)).toHaveLength(0);
        });
    });
});
