import { describe, it, expect } from "vitest";
import {
    validateSocialInput,
    normalizeSocialUrl,
    validateWebsiteUrl,
    validateFullName,
    validateBio,
    validatePhoneNumber,
    validateEmergencyContactPair,
    tenantProfilePatchSchema,
} from "../profile";

describe("Profile Validation Module", () => {
    describe("validateSocialInput", () => {
        it("accepts empty or whitespace-only inputs as optional", () => {
            expect(validateSocialInput("facebook", "").isValid).toBe(true);
            expect(validateSocialInput("facebook", "   ").isValid).toBe(true);
            expect(validateSocialInput("twitter", "").isValid).toBe(true);
            expect(validateSocialInput("website", "").isValid).toBe(true);
        });

        describe("Facebook validation & normalization", () => {
            it("accepts valid Facebook full URLs", () => {
                const res = validateSocialInput("facebook", "https://facebook.com/johndoe");
                expect(res.isValid).toBe(true);
                expect(res.normalized).toBe("https://facebook.com/johndoe");
            });

            it("accepts Facebook URL without protocol and normalizes it", () => {
                const res = validateSocialInput("facebook", "facebook.com/johndoe");
                expect(res.isValid).toBe(true);
                expect(res.normalized).toBe("https://facebook.com/johndoe");
            });

            it("accepts valid Facebook handles and normalizes them", () => {
                const res = validateSocialInput("facebook", "@johndoe");
                expect(res.isValid).toBe(true);
                expect(res.normalized).toBe("https://facebook.com/johndoe");

                const res2 = validateSocialInput("facebook", "john.doe123");
                expect(res2.isValid).toBe(true);
                expect(res2.normalized).toBe("https://facebook.com/john.doe123");
            });

            it("rejects mismatched URL domains", () => {
                const res = validateSocialInput("facebook", "https://google.com/johndoe");
                expect(res.isValid).toBe(false);
                expect(res.error).toContain("Must be a valid Facebook URL");
            });

            it("rejects Facebook URLs without username path", () => {
                const res = validateSocialInput("facebook", "https://facebook.com/");
                expect(res.isValid).toBe(false);
                expect(res.error).toContain("include your Facebook username");
            });

            it("rejects handles with spaces or illegal characters", () => {
                const res = validateSocialInput("facebook", "john doe");
                expect(res.isValid).toBe(false);

                const res2 = validateSocialInput("facebook", "jo");
                expect(res2.isValid).toBe(false);
            });
        });

        describe("Twitter / X validation & normalization", () => {
            it("accepts twitter.com and x.com URLs", () => {
                const resTwitter = validateSocialInput("twitter", "https://twitter.com/username");
                expect(resTwitter.isValid).toBe(true);
                expect(resTwitter.normalized).toBe("https://twitter.com/username");

                const resX = validateSocialInput("twitter", "https://x.com/username");
                expect(resX.isValid).toBe(true);
                expect(resX.normalized).toBe("https://x.com/username");
            });

            it("accepts twitter handles and normalizes to x.com", () => {
                const res = validateSocialInput("twitter", "@elonmusk");
                expect(res.isValid).toBe(true);
                expect(res.normalized).toBe("https://x.com/elonmusk");
            });

            it("rejects handles exceeding 15 characters", () => {
                const res = validateSocialInput("twitter", "this_handle_is_way_too_long");
                expect(res.isValid).toBe(false);
            });
        });

        describe("LinkedIn validation & normalization", () => {
            it("accepts linkedin profile URLs", () => {
                const res = validateSocialInput("linkedin", "https://linkedin.com/in/john-doe");
                expect(res.isValid).toBe(true);
                expect(res.normalized).toBe("https://linkedin.com/in/john-doe");
            });

            it("accepts handles and normalizes to in/ path", () => {
                const res = validateSocialInput("linkedin", "@john-doe");
                expect(res.isValid).toBe(true);
                expect(res.normalized).toBe("https://linkedin.com/in/john-doe");

                const res2 = validateSocialInput("linkedin", "in/john-doe");
                expect(res2.isValid).toBe(true);
                expect(res2.normalized).toBe("https://linkedin.com/in/john-doe");
            });
        });

        describe("Instagram validation & normalization", () => {
            it("accepts instagram URLs", () => {
                const res = validateSocialInput("instagram", "https://instagram.com/my_profile");
                expect(res.isValid).toBe(true);
                expect(res.normalized).toBe("https://instagram.com/my_profile");
            });

            it("accepts instagram handles and normalizes", () => {
                const res = validateSocialInput("instagram", "@my_profile");
                expect(res.isValid).toBe(true);
                expect(res.normalized).toBe("https://instagram.com/my_profile");
            });
        });

        describe("Website validation", () => {
            it("accepts valid website URLs with or without protocol", () => {
                expect(validateWebsiteUrl("https://example.com").isValid).toBe(true);
                expect(validateWebsiteUrl("example.com").isValid).toBe(true);
                expect(validateWebsiteUrl("sub.domain.ph/about").isValid).toBe(true);
            });

            it("rejects invalid website URLs", () => {
                expect(validateWebsiteUrl("not-a-valid-url").isValid).toBe(false);
            });
        });
    });

    describe("normalizeSocialUrl helper", () => {
        it("returns normalized URL for valid inputs", () => {
            expect(normalizeSocialUrl("facebook", "@johndoe")).toBe("https://facebook.com/johndoe");
            expect(normalizeSocialUrl("instagram", "myfeed")).toBe("https://instagram.com/myfeed");
        });

        it("returns empty string for invalid inputs", () => {
            expect(normalizeSocialUrl("facebook", "https://youtube.com/video")).toBe("");
        });
    });

    describe("validateFullName", () => {
        it("rejects empty or whitespace-only names", () => {
            expect(validateFullName("").isValid).toBe(false);
            expect(validateFullName("   ").isValid).toBe(false);
        });

        it("rejects names shorter than 2 characters", () => {
            expect(validateFullName("J").isValid).toBe(false);
        });

        it("rejects names exceeding 70 characters", () => {
            expect(validateFullName("A".repeat(71)).isValid).toBe(false);
        });

        it("rejects names containing numbers or html tags", () => {
            expect(validateFullName("John123").isValid).toBe(false);
            expect(validateFullName("<script>").isValid).toBe(false);
        });

        it("accepts valid legal names with spaces, periods, hyphens, and apostrophes", () => {
            expect(validateFullName("Juan Dela Cruz").isValid).toBe(true);
            expect(validateFullName("Maria-Clara O'Connor").isValid).toBe(true);
            expect(validateFullName("Dr. Jose P. Rizal").isValid).toBe(true);
            expect(validateFullName("Niña Santos").isValid).toBe(true);
        });
    });

    describe("validateBio", () => {
        it("accepts empty or normal bios up to 500 characters", () => {
            expect(validateBio("").isValid).toBe(true);
            expect(validateBio("Hello world, I love living here!").isValid).toBe(true);
            expect(validateBio("A".repeat(500)).isValid).toBe(true);
        });

        it("rejects bios longer than 500 characters", () => {
            expect(validateBio("A".repeat(501)).isValid).toBe(false);
        });
    });

    describe("validatePhoneNumber", () => {
        it("accepts empty if not required", () => {
            expect(validatePhoneNumber("").isValid).toBe(true);
        });

        it("rejects empty if required", () => {
            expect(validatePhoneNumber("", true).isValid).toBe(false);
        });

        it("validates Philippine 11-digit mobile numbers starting with 09", () => {
            expect(validatePhoneNumber("09171234567").isValid).toBe(true);
            expect(validatePhoneNumber("0917 123 4567").isValid).toBe(true);
            expect(validatePhoneNumber("0917123").isValid).toBe(false);
            expect(validatePhoneNumber("091712345678").isValid).toBe(false);
        });

        it("validates Philippine international format starting with +639", () => {
            expect(validatePhoneNumber("+639171234567").isValid).toBe(true);
            expect(validatePhoneNumber("+63 917 123 4567").isValid).toBe(true);
            expect(validatePhoneNumber("+639171234").isValid).toBe(false);
        });

        it("accepts valid international format", () => {
            expect(validatePhoneNumber("+12025550123").isValid).toBe(true);
        });
    });

    describe("validateEmergencyContactPair", () => {
        it("accepts empty pair", () => {
            const res = validateEmergencyContactPair("", "");
            expect(res.isValid).toBe(true);
        });

        it("accepts valid contact pair", () => {
            const res = validateEmergencyContactPair("Maria Santos", "09171234567");
            expect(res.isValid).toBe(true);
        });

        it("rejects if name is provided but phone is missing", () => {
            const res = validateEmergencyContactPair("Maria Santos", "");
            expect(res.isValid).toBe(false);
            expect(res.phoneError).toContain("phone is required");
        });

        it("rejects if phone is provided but name is missing", () => {
            const res = validateEmergencyContactPair("", "09171234567");
            expect(res.isValid).toBe(false);
            expect(res.nameError).toContain("name is required");
        });

        it("rejects invalid contact name format", () => {
            const res = validateEmergencyContactPair("Person123", "09171234567");
            expect(res.isValid).toBe(false);
            expect(res.nameError).toContain("invalid characters");
        });
    });

    describe("tenantProfilePatchSchema", () => {
        it("successfully parses valid payload", () => {
            const result = tenantProfilePatchSchema.safeParse({
                full_name: "Juan Dela Cruz",
                bio: "Tenant in building A",
                phone: "09171234567",
                emergency_contact_name: "Maria Dela Cruz",
                emergency_contact_phone: "09181234567",
                socials: {
                    facebook: "https://facebook.com/juandelacruz",
                    twitter: "@juandelacruz",
                },
            });
            expect(result.success).toBe(true);
        });

        it("fails parse when emergency contact is incomplete", () => {
            const result = tenantProfilePatchSchema.safeParse({
                emergency_contact_name: "Maria Dela Cruz",
                emergency_contact_phone: "",
            });
            expect(result.success).toBe(false);
        });

        it("fails parse when social URL is invalid", () => {
            const result = tenantProfilePatchSchema.safeParse({
                socials: {
                    facebook: "https://youtube.com/myfeed",
                },
            });
            expect(result.success).toBe(false);
        });
    });
});
