import { describe, it, expect } from "vitest";
import {
  validatePropertyTradeName,
  validatePropertyTagline,
  validateRentalArchetype,
  validateTotalUnits,
  validatePropertyAddress,
  validateBrandColor,
  validateLogoFile,
  validateAdminFullName,
  validateAdminEmail,
  validateAdminPhone,
  validateAdminPassword,
  validateConfirmPassword,
  validateStep1Identity,
  validateStep2Theme,
  validateStep3Admin,
  validateAllBrandSetup,
  setupLaunchSchema,
  brandingUpdateSchema,
} from "../../lib/validation/brand-setup";

describe("Brand Setup Validation Module", () => {
  describe("validatePropertyTradeName", () => {
    it("rejects empty or whitespace-only names", () => {
      expect(validatePropertyTradeName("").isValid).toBe(false);
      expect(validatePropertyTradeName("   ").isValid).toBe(false);
      expect(validatePropertyTradeName("").error).toContain("required");
    });

    it("rejects single character name", () => {
      const res = validatePropertyTradeName("A");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("at least 2 characters");
    });

    it("rejects names longer than 80 characters", () => {
      const longName = "A".repeat(81);
      const res = validatePropertyTradeName(longName);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("cannot exceed 80 characters");
    });

    it("rejects HTML / script tags", () => {
      const res = validatePropertyTradeName("<script>alert('xss')</script>");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("forbidden markup");
    });

    it("rejects pre-seeded placeholder property trade names", () => {
      expect(validatePropertyTradeName("Reyes Residences").isValid).toBe(false);
      expect(validatePropertyTradeName("reyes residences").isValid).toBe(false);
      expect(validatePropertyTradeName("Sample Property").isValid).toBe(false);
      expect(validatePropertyTradeName("Default Property").isValid).toBe(false);
      expect(validatePropertyTradeName("iReside Residences").isValid).toBe(false);
      expect(validatePropertyTradeName("ireside residences").isValid).toBe(false);
      expect(validatePropertyTradeName("iReside").isValid).toBe(false);
      expect(validatePropertyTradeName("Reyes Residences").error).toContain("sample placeholder");
    });

    it("accepts valid property trade names", () => {
      expect(validatePropertyTradeName("Pinecrest Lofts & Suites").isValid).toBe(true);
      expect(validatePropertyTradeName("Skyline Lofts & Suites").isValid).toBe(true);
      expect(validatePropertyTradeName("St. Jude Dormitory").isValid).toBe(true);
    });
  });

  describe("validatePropertyTagline", () => {
    it("accepts empty or whitespace (optional field)", () => {
      expect(validatePropertyTagline("").isValid).toBe(true);
      expect(validatePropertyTagline("   ").isValid).toBe(true);
    });

    it("rejects taglines exceeding 120 characters", () => {
      const longTagline = "T".repeat(121);
      const res = validatePropertyTagline(longTagline);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("cannot exceed 120 characters");
    });

    it("rejects HTML tags", () => {
      const res = validatePropertyTagline("Premier living <img src=x onerror=alert(1)>");
      expect(res.isValid).toBe(false);
    });

    it("rejects pre-seeded placeholder taglines", () => {
      expect(validatePropertyTagline("Premier Student & Residential Living in Valenzuela").isValid).toBe(false);
      expect(validatePropertyTagline("residential living").isValid).toBe(false);
      expect(validatePropertyTagline("Premier Student Living").isValid).toBe(false);
      expect(validatePropertyTagline("residential living").error).toContain("sample placeholder");
    });

    it("accepts valid taglines", () => {
      expect(validatePropertyTagline("Modern and accessible student accommodations").isValid).toBe(true);
      expect(validatePropertyTagline("Comfortable urban living close to universities").isValid).toBe(true);
    });
  });

  describe("validateRentalArchetype", () => {
    it("rejects invalid or empty archetypes", () => {
      expect(validateRentalArchetype("").isValid).toBe(false);
      expect(validateRentalArchetype("mansion").isValid).toBe(false);
      expect(validateRentalArchetype("hotel").isValid).toBe(false);
    });

    it("accepts apartment, dormitory, and boarding_house", () => {
      expect(validateRentalArchetype("apartment").isValid).toBe(true);
      expect(validateRentalArchetype("dormitory").isValid).toBe(true);
      expect(validateRentalArchetype("boarding_house").isValid).toBe(true);
    });
  });

  describe("validateTotalUnits", () => {
    it("rejects empty or whitespace values", () => {
      expect(validateTotalUnits("").isValid).toBe(false);
      expect(validateTotalUnits("   ").isValid).toBe(false);
    });

    it("rejects non-numeric strings or NaN", () => {
      expect(validateTotalUnits("abc").isValid).toBe(false);
      expect(validateTotalUnits("twelve").isValid).toBe(false);
    });

    it("rejects decimal numbers", () => {
      expect(validateTotalUnits("12.5").isValid).toBe(false);
      expect(validateTotalUnits(12.5).isValid).toBe(false);
    });

    it("rejects zero or negative values", () => {
      expect(validateTotalUnits("0").isValid).toBe(false);
      expect(validateTotalUnits("-5").isValid).toBe(false);
      expect(validateTotalUnits(0).isValid).toBe(false);
    });

    it("rejects units exceeding 10,000", () => {
      expect(validateTotalUnits("10001").isValid).toBe(false);
      expect(validateTotalUnits(15000).isValid).toBe(false);
    });

    it("accepts valid integer counts and parses them", () => {
      const res1 = validateTotalUnits("16");
      expect(res1.isValid).toBe(true);
      expect(res1.parsedValue).toBe(16);

      const res2 = validateTotalUnits(1);
      expect(res2.isValid).toBe(true);
      expect(res2.parsedValue).toBe(1);

      const res3 = validateTotalUnits("10000");
      expect(res3.isValid).toBe(true);
      expect(res3.parsedValue).toBe(10000);
    });
  });

  describe("validatePropertyAddress", () => {
    it("rejects empty or whitespace", () => {
      expect(validatePropertyAddress("").isValid).toBe(false);
      expect(validatePropertyAddress("   ").isValid).toBe(false);
    });

    it("rejects address under 3 characters", () => {
      expect(validatePropertyAddress("KV").isValid).toBe(false);
    });

    it("rejects address exceeding 200 characters", () => {
      expect(validatePropertyAddress("A".repeat(201)).isValid).toBe(false);
    });

    it("accepts valid locations and addresses", () => {
      expect(validatePropertyAddress("Karuhatan, Valenzuela City").isValid).toBe(true);
      expect(validatePropertyAddress("123 MacArthur Highway, Malinta").isValid).toBe(true);
    });
  });

  describe("validateBrandColor", () => {
    it("rejects empty colors", () => {
      expect(validateBrandColor("").isValid).toBe(false);
    });

    it("rejects invalid hex characters", () => {
      expect(validateBrandColor("red").isValid).toBe(false);
      expect(validateBrandColor("#GGG").isValid).toBe(false);
      expect(validateBrandColor("#12345").isValid).toBe(false); // 5 digits
    });

    it("accepts and formats 3 and 6-digit hex values", () => {
      const res1 = validateBrandColor("#8B5CF6");
      expect(res1.isValid).toBe(true);
      expect(res1.formatted).toBe("#8B5CF6");

      const res2 = validateBrandColor("8b5cf6");
      expect(res2.isValid).toBe(true);
      expect(res2.formatted).toBe("#8B5CF6");

      const res3 = validateBrandColor("#fff");
      expect(res3.isValid).toBe(true);
      expect(res3.formatted).toBe("#FFF");
    });
  });

  describe("validateLogoFile", () => {
    it("rejects empty file size", () => {
      expect(validateLogoFile({ size: 0, type: "image/png" }).isValid).toBe(false);
    });

    it("rejects files exceeding 5MB", () => {
      expect(validateLogoFile({ size: 6 * 1024 * 1024, type: "image/png" }).isValid).toBe(false);
    });

    it("rejects disallowed MIME types", () => {
      expect(validateLogoFile({ size: 1024, type: "application/pdf" }).isValid).toBe(false);
      expect(validateLogoFile({ size: 1024, type: "text/plain" }).isValid).toBe(false);
      expect(validateLogoFile({ size: 1024, type: "video/mp4" }).isValid).toBe(false);
    });

    it("accepts valid image MIME types within size limit", () => {
      expect(validateLogoFile({ size: 2 * 1024 * 1024, type: "image/png" }).isValid).toBe(true);
      expect(validateLogoFile({ size: 500 * 1024, type: "image/jpeg" }).isValid).toBe(true);
      expect(validateLogoFile({ size: 300 * 1024, type: "image/webp" }).isValid).toBe(true);
      expect(validateLogoFile({ size: 50 * 1024, type: "image/svg+xml" }).isValid).toBe(true);
    });
  });

  describe("validateAdminFullName", () => {
    it("rejects empty or single-character names", () => {
      expect(validateAdminFullName("").isValid).toBe(false);
      expect(validateAdminFullName("J").isValid).toBe(false);
    });

    it("rejects numbers or illegal characters", () => {
      expect(validateAdminFullName("Roberto123").isValid).toBe(false);
      expect(validateAdminFullName("Roberto $ Reyes").isValid).toBe(false);
    });

    it("rejects pre-seeded dummy admin full names", () => {
      expect(validateAdminFullName("Roberto Reyes").isValid).toBe(false);
      expect(validateAdminFullName("Default Admin").isValid).toBe(false);
      expect(validateAdminFullName("Administrator").isValid).toBe(false);
      expect(validateAdminFullName("Turnkey Landlord").isValid).toBe(false);
      expect(validateAdminFullName("Master Admin").isValid).toBe(false);
      expect(validateAdminFullName("Roberto Reyes").error).toContain("sample placeholder");
    });

    it("accepts standard legal names with hyphens and periods", () => {
      expect(validateAdminFullName("Juan Dela Cruz").isValid).toBe(true);
      expect(validateAdminFullName("Mary-Ann Del Rosario").isValid).toBe(true);
      expect(validateAdminFullName("Dr. Jose P. Rizal").isValid).toBe(true);
    });
  });

  describe("validateAdminEmail", () => {
    it("rejects invalid emails", () => {
      expect(validateAdminEmail("").isValid).toBe(false);
      expect(validateAdminEmail("invalid").isValid).toBe(false);
      expect(validateAdminEmail("user@").isValid).toBe(false);
      expect(validateAdminEmail("@domain.com").isValid).toBe(false);
    });

    it("rejects pre-seeded placeholder emails", () => {
      expect(validateAdminEmail("landlord@reyesresidences.com").isValid).toBe(false);
      expect(validateAdminEmail("admin@reyesresidences.com").isValid).toBe(false);
      expect(validateAdminEmail("admin@property.com").isValid).toBe(false);
      expect(validateAdminEmail("landlord@reyesresidences.com").error).toContain("sample placeholder");
    });

    it("accepts valid email format", () => {
      expect(validateAdminEmail("admin@pinecrestsuites.ph").isValid).toBe(true);
    });
  });

  describe("validateAdminPhone", () => {
    it("rejects empty phone when required", () => {
      expect(validateAdminPhone("").isValid).toBe(false);
    });

    it("rejects numbers with too few digits", () => {
      expect(validateAdminPhone("12345").isValid).toBe(false);
    });

    it("rejects pre-seeded placeholder phone numbers", () => {
      expect(validateAdminPhone("0917-882-9912").isValid).toBe(false);
      expect(validateAdminPhone("09178829912").isValid).toBe(false);
      expect(validateAdminPhone("0917-000-0000").isValid).toBe(false);
      expect(validateAdminPhone("09178829912").error).toContain("sample placeholder");
    });

    it("accepts valid Philippine numbers", () => {
      expect(validateAdminPhone("09187654321").isValid).toBe(true);
      expect(validateAdminPhone("+639187654321").isValid).toBe(true);
      expect(validateAdminPhone("0920-111-2233").isValid).toBe(true);
    });
  });

  describe("validateAdminPassword & validateConfirmPassword", () => {
    it("accepts unchanged placeholder password", () => {
      expect(validateAdminPassword("••••••••••••", true).isValid).toBe(true);
      expect(validateConfirmPassword("••••••••••••", "••••••••••••", true).isValid).toBe(true);
    });

    it("rejects passwords under 8 characters when creating/updating", () => {
      expect(validateAdminPassword("pass1", false).isValid).toBe(false);
    });

    it("rejects passwords missing numbers/symbols", () => {
      expect(validateAdminPassword("lettersalltheway", false).isValid).toBe(false);
    });

    it("accepts strong passwords containing letters and numbers/symbols", () => {
      expect(validateAdminPassword("SecurePass2026!", false).isValid).toBe(true);
    });

    it("rejects non-matching password confirmation", () => {
      expect(validateConfirmPassword("SecurePass2026!", "DifferentPass2026!", false).isValid).toBe(false);
    });

    it("accepts matching password confirmation", () => {
      expect(validateConfirmPassword("SecurePass2026!", "SecurePass2026!", false).isValid).toBe(true);
    });
  });

  describe("Step & End-to-End Validation Runners", () => {
    const validStep1 = {
      propertyName: "Pinecrest Lofts & Suites",
      tagline: "Quality student homes and serviced apartments",
      propertyArchetype: "apartment",
      totalUnits: "16",
      propertyAddress: "Karuhatan, Valenzuela City",
    };

    const validStep2 = {
      primaryColor: "#8B5CF6",
      secondaryColor: "#06B6D4",
      modePreference: "dark" as const,
    };

    const validStep3 = {
      adminName: "Juan Dela Cruz",
      adminEmail: "landlord@pinecrest.ph",
      adminPhone: "09187654321",
      adminPassword: "••••••••••••",
      confirmPassword: "••••••••••••",
      isExistingPlaceholder: true,
    };

    it("validates Step 1 successfully when all fields valid", () => {
      const res = validateStep1Identity(validStep1);
      expect(res.isValid).toBe(true);
      expect(Object.keys(res.errors)).toHaveLength(0);
    });

    it("catches multiple errors in Step 1", () => {
      const res = validateStep1Identity({
        propertyName: "",
        tagline: "T".repeat(150),
        propertyArchetype: "invalid",
        totalUnits: "-5",
        propertyAddress: "ab",
      });
      expect(res.isValid).toBe(false);
      expect(res.errors["propertyName"]).toBeDefined();
      expect(res.errors["tagline"]).toBeDefined();
      expect(res.errors["propertyArchetype"]).toBeDefined();
      expect(res.errors["totalUnits"]).toBeDefined();
      expect(res.errors["propertyAddress"]).toBeDefined();
    });

    it("validates Step 1 successfully when totalUnits and propertyAddress are omitted", () => {
      const res = validateStep1Identity({
        propertyName: "Pinecrest Lofts & Suites",
        tagline: "Quality student homes and serviced apartments",
        propertyArchetype: "apartment",
      });
      expect(res.isValid).toBe(true);
      expect(Object.keys(res.errors)).toHaveLength(0);
    });

    it("validates Step 2 successfully", () => {
      const res = validateStep2Theme(validStep2);
      expect(res.isValid).toBe(true);
    });

    it("catches invalid colors in Step 2", () => {
      const res = validateStep2Theme({
        primaryColor: "not-color",
        secondaryColor: "",
        modePreference: "dark",
      });
      expect(res.isValid).toBe(false);
      expect(res.errors["primaryColor"]).toBeDefined();
      expect(res.errors["secondaryColor"]).toBeDefined();
    });

    it("validates Step 3 successfully", () => {
      const res = validateStep3Admin(validStep3);
      expect(res.isValid).toBe(true);
    });

    it("catches password mismatch in Step 3", () => {
      const res = validateStep3Admin({
        ...validStep3,
        adminPassword: "Password123!",
        confirmPassword: "Password456!",
        isExistingPlaceholder: false,
      });
      expect(res.isValid).toBe(false);
      expect(res.errors["confirmPassword"]).toContain("do not match");
    });

    it("strictly requires passwords during initial setup when isExistingPlaceholder is false", () => {
      const res = validateStep3Admin({
        ...validStep3,
        adminPassword: "",
        confirmPassword: "",
        isExistingPlaceholder: false,
      });
      expect(res.isValid).toBe(false);
      expect(res.errors["adminPassword"]).toContain("required");
      expect(res.errors["confirmPassword"]).toContain("confirm your master password");
    });

    it("validates entire setup successfully and identifies firstErrorStep when invalid", () => {
      const validAll = validateAllBrandSetup(validStep1, validStep2, validStep3);
      expect(validAll.isValid).toBe(true);

      const invalidStep1 = validateAllBrandSetup(
        { ...validStep1, propertyName: "" },
        validStep2,
        validStep3
      );
      expect(invalidStep1.isValid).toBe(false);
      expect(invalidStep1.firstErrorStep).toBe(1);
      expect(invalidStep1.firstErrorField).toBe("propertyName");

      const invalidStep3 = validateAllBrandSetup(
        validStep1,
        validStep2,
        { ...validStep3, adminName: "J" }
      );
      expect(invalidStep3.isValid).toBe(false);
      expect(invalidStep3.firstErrorStep).toBe(3);
      expect(invalidStep3.firstErrorField).toBe("adminName");
    });
  });

  describe("Server Zod Schemas", () => {
    it("validates setupLaunchSchema with valid payload", () => {
      const payload = {
        branding: {
          propertyName: "Pinecrest Lofts & Suites",
          propertyTagline: "Premier Living Experience",
          rentalArchetype: "dormitory",
          primaryColor: "#8B5CF6",
          secondaryColor: "#06B6D4",
          propertyAddress: "Karuhatan, Valenzuela",
          totalUnits: "24",
        },
        admin: {
          fullName: "Juan Dela Cruz",
          email: "admin@pinecrestresidences.ph",
          phone: "0918-123-4567",
          password: "SecurePassword123!",
        },
      };
      const result = setupLaunchSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.branding.totalUnits).toBe(24);
      }
    });

    it("rejects setupLaunchSchema when pre-seeded dummy data is used", () => {
      const payload = {
        branding: {
          propertyName: "Reyes Residences",
          rentalArchetype: "apartment" as const,
          primaryColor: "#8B5CF6",
          secondaryColor: "#06B6D4",
        },
        admin: {
          fullName: "Roberto Reyes",
          email: "landlord@reyesresidences.com",
          phone: "0917-882-9912",
        },
      };
      const result = setupLaunchSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[]>;
        expect(JSON.stringify(result.error.issues)).toContain("sample placeholder");
      }
    });

    it("rejects setupLaunchSchema when required fields missing or invalid", () => {
      const invalidPayload = {
        branding: {
          propertyName: "",
          rentalArchetype: "castle",
          primaryColor: "purple",
          secondaryColor: "#123",
          propertyAddress: "",
          totalUnits: 0,
        },
        admin: {
          fullName: "12345",
          email: "not-an-email",
        },
      };
      const result = setupLaunchSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it("validates brandingUpdateSchema", () => {
      expect(brandingUpdateSchema.safeParse({ propertyName: "Skyline" }).success).toBe(true);
      expect(brandingUpdateSchema.safeParse({ primaryColor: "not-hex" }).success).toBe(false);
    });
  });
});
