import { describe, it, expect } from "vitest";
import {
  IRIS_TEMPLATES,
  DEFAULT_FALLBACKS,
  sanitizeTemplateInput,
  substituteTemplate,
  renderTemplate,
  validateTemplateContext,
  getAvailableTemplateKeys,
  IrisTemplateKey,
} from "@/lib/services/iris/iris-templates";

describe("Iris Pre-Vetted Template Engine & Sanitizer", () => {
  describe("Template Registry & Keys", () => {
    it("should list all 5 pre-vetted template keys", () => {
      const keys = getAvailableTemplateKeys();
      expect(keys).toHaveLength(5);
      expect(keys).toContain("payment_gentle");
      expect(keys).toContain("payment_overdue");
      expect(keys).toContain("lease_renewal");
      expect(keys).toContain("maintenance_advisory");
      expect(keys).toContain("general_notice");
    });

    it("payment_gentle template should contain required tokens", () => {
      const t = IRIS_TEMPLATES.payment_gentle;
      expect(t).toContain("{tenant_name}");
      expect(t).toContain("{amount}");
      expect(t).toContain("{unit}");
      expect(t).toContain("{property_name}");
      expect(t).toContain("{due_date}");
    });

    it("payment_overdue template should contain overdue tokens", () => {
      const t = IRIS_TEMPLATES.payment_overdue;
      expect(t).toContain("{tenant_name}");
      expect(t).toContain("{amount}");
      expect(t).toContain("{days_overdue}");
      expect(t).toContain("{due_date}");
    });

    it("lease_renewal template should contain lease end date token", () => {
      const t = IRIS_TEMPLATES.lease_renewal;
      expect(t).toContain("{tenant_name}");
      expect(t).toContain("{unit}");
      expect(t).toContain("{lease_end_date}");
    });

    it("maintenance_advisory template should contain maintenance tokens", () => {
      const t = IRIS_TEMPLATES.maintenance_advisory;
      expect(t).toContain("{property_name}");
      expect(t).toContain("{unit}");
      expect(t).toContain("{maintenance_date}");
      expect(t).toContain("{custom_message}");
    });

    it("general_notice template should contain property name and custom message", () => {
      const t = IRIS_TEMPLATES.general_notice;
      expect(t).toContain("{property_name}");
      expect(t).toContain("{custom_message}");
    });
  });

  describe("sanitizeTemplateInput - XSS and Injection Defense", () => {
    it("should return empty string for null or undefined", () => {
      expect(sanitizeTemplateInput(null)).toBe("");
      expect(sanitizeTemplateInput(undefined)).toBe("");
    });

    it("should convert numeric inputs to string without alteration", () => {
      expect(sanitizeTemplateInput(12500)).toBe("12500");
      expect(sanitizeTemplateInput(0)).toBe("0");
    });

    it("should strip simple script tags", () => {
      const dirty = "<script>alert('xss')</script>Juan";
      expect(sanitizeTemplateInput(dirty)).toBe("Juan");
    });

    it("should strip complex multiline script tags with attributes", () => {
      const dirty = `<script type="text/javascript" src="http://evil.com/hack.js">
        window.location = "http://evil.com";
      </script>Payment of ₱5,000`;
      expect(sanitizeTemplateInput(dirty)).toBe("Payment of ₱5,000");
    });

    it("should strip style tags and embedded styles", () => {
      const dirty = "<style>body { display: none; }</style>Hello Tenant";
      expect(sanitizeTemplateInput(dirty)).toBe("Hello Tenant");
    });

    it("should strip iframe tags", () => {
      const dirty = `<iframe src="https://phishing.site"></iframe>Unit 4A`;
      expect(sanitizeTemplateInput(dirty)).toBe("Unit 4A");
    });

    it("should strip basic HTML formatting tags (b, i, div, span)", () => {
      const dirty = "<b>URGENT:</b> Please pay <span>₱10,000</span>";
      expect(sanitizeTemplateInput(dirty)).toBe("URGENT: Please pay ₱10,000");
    });

    it("should strip onerror event handler injection", () => {
      const dirty = `<img src="x" onerror="alert(1)" />Due today`;
      expect(sanitizeTemplateInput(dirty)).toBe("Due today");
    });

    it("should strip onload event handler injection", () => {
      const dirty = `<svg onload="alert('hack')">Unit 102`;
      expect(sanitizeTemplateInput(dirty)).toBe("Unit 102");
    });

    it("should strip javascript: pseudoprotocol", () => {
      const dirty = `<a href="javascript:doEvil()">Click here</a>`;
      expect(sanitizeTemplateInput(dirty)).toBe("Click here");
    });

    it("should preserve harmless punctuation and characters (₱, commas, dots, dashes)", () => {
      const safe = "Rent: ₱15,500.50 (Due: 2026-11-25) - Please settle ASAP!";
      expect(sanitizeTemplateInput(safe)).toBe(safe);
    });

    it("should trim excess whitespace around the input", () => {
      expect(sanitizeTemplateInput("   Grand Residences   ")).toBe("Grand Residences");
    });
  });

  describe("substituteTemplate Token Substitution", () => {
    const fullContext = {
      tenant_name: "Maria Santos",
      unit: "Unit 401",
      property_name: "Sunnyvale Heights",
      amount: "₱12,500.00",
      due_date: "2026-11-30",
      days_overdue: "7",
      lease_end_date: "2026-12-31",
      maintenance_date: "2026-11-20",
      custom_message: "Water supply shutdown from 1PM to 5PM for tank cleaning.",
    };

    it("should render payment_gentle with full context correctly", () => {
      const res = substituteTemplate("payment_gentle", fullContext);
      expect(res).toContain("Dear Maria Santos");
      expect(res).toContain("₱12,500.00");
      expect(res).toContain("Unit 401");
      expect(res).toContain("Sunnyvale Heights");
      expect(res).toContain("2026-11-30");
      expect(res).not.toContain("{");
    });

    it("should render payment_overdue with full context correctly", () => {
      const res = substituteTemplate("payment_overdue", fullContext);
      expect(res).toContain("URGENT NOTICE");
      expect(res).toContain("₱12,500.00");
      expect(res).toContain("overdue by 7 days");
      expect(res).toContain("2026-11-30");
    });

    it("should render lease_renewal with full context correctly", () => {
      const res = substituteTemplate("lease_renewal", fullContext);
      expect(res).toContain("Hello Maria Santos");
      expect(res).toContain("Unit 401");
      expect(res).toContain("end on 2026-12-31");
    });

    it("should render maintenance_advisory with full context correctly", () => {
      const res = substituteTemplate("maintenance_advisory", fullContext);
      expect(res).toContain("Sunnyvale Heights (Unit 401)");
      expect(res).toContain("2026-11-20");
      expect(res).toContain("Water supply shutdown from 1PM to 5PM");
    });

    it("should render general_notice with full context correctly", () => {
      const res = substituteTemplate("general_notice", fullContext);
      expect(res).toContain("Notice to residents of Sunnyvale Heights:");
      expect(res).toContain("Water supply shutdown");
    });

    it("should support custom template string directly", () => {
      const custom = "Hi {tenant_name}, your balance of {amount} is recorded for {unit}.";
      const res = substituteTemplate(custom, fullContext);
      expect(res).toBe("Hi Maria Santos, your balance of ₱12,500.00 is recorded for Unit 401.");
    });

    it("should sanitize malicious tokens passed inside context", () => {
      const maliciousContext = {
        tenant_name: "<script>stealCookies()</script>Hacker",
        amount: "₱5,000<img src=x onerror=evil()>",
        unit: "Penthouse",
        property_name: "Towers",
        due_date: "2026-11-15",
      };
      const res = substituteTemplate("payment_gentle", maliciousContext);
      expect(res).not.toContain("<script>");
      expect(res).not.toContain("stealCookies");
      expect(res).not.toContain("<img");
      expect(res).toContain("Dear Hacker");
      expect(res).toContain("₱5,000");
    });
  });

  describe("Fallback Behavior for Missing Tokens", () => {
    it("should use DEFAULT_FALLBACKS for missing tenant_name", () => {
      const res = substituteTemplate("payment_gentle", {
        unit: "Unit 1A",
        property_name: "Palace",
        amount: "₱5,000",
        due_date: "2026-11-20",
      });
      expect(res).toContain("Dear Valued Resident");
    });

    it("should use DEFAULT_FALLBACKS for missing amount", () => {
      const res = substituteTemplate("payment_gentle", {
        tenant_name: "Pedro",
        unit: "Unit 1A",
        property_name: "Palace",
        due_date: "2026-11-20",
      });
      expect(res).toContain("₱0.00");
    });

    it("should use DEFAULT_FALLBACKS for missing days_overdue", () => {
      const res = substituteTemplate("payment_overdue", {
        tenant_name: "Pedro",
        unit: "Unit 1A",
        property_name: "Palace",
        amount: "₱8,000",
        due_date: "2026-11-01",
      });
      expect(res).toContain("overdue by 0 days");
    });

    it("should use DEFAULT_FALLBACKS for missing maintenance_date and custom_message", () => {
      const res = substituteTemplate("maintenance_advisory", {
        property_name: "The Heights",
        unit: "Unit 2B",
      });
      expect(res).toContain("scheduled date");
      expect(res).toContain(DEFAULT_FALLBACKS.custom_message);
    });

    it("should support customFallback option overriding default fallback", () => {
      const res = substituteTemplate(
        "payment_gentle",
        { unit: "Unit 1A" },
        { customFallback: "N/A" }
      );
      expect(res).toContain("Dear N/A");
      expect(res).toContain("rent of N/A");
    });

    it("should throw error in strict mode when token is missing", () => {
      expect(() => {
        substituteTemplate("payment_gentle", { unit: "Unit 1" }, { strict: true });
      }).toThrow(/Missing required template variable/i);
    });

    it("should handle empty context object without crashing", () => {
      const res = substituteTemplate("payment_gentle", {});
      expect(res).toBeDefined();
      expect(res).toContain("Valued Resident");
      expect(res).toContain("the property");
    });

    it("should handle empty string in context by falling back", () => {
      const res = substituteTemplate("payment_gentle", { tenant_name: "   " });
      expect(res).toContain("Dear Valued Resident");
    });

    it("should handle undefined and null values in context by falling back", () => {
      const res = substituteTemplate("payment_gentle", {
        tenant_name: undefined,
        amount: undefined,
      });
      expect(res).toContain("Valued Resident");
      expect(res).toContain("₱0.00");
    });

    it("should convert numerical context values to strings", () => {
      const res = substituteTemplate("Notice: room {unit} owes {amount}", {
        unit: 101 as any,
        amount: 5000 as any,
      });
      expect(res).toBe("Notice: room 101 owes 5000");
    });

    it("should substitute multiple occurrences of the same token", () => {
      const res = substituteTemplate("Hi {tenant_name}, {tenant_name}!", {
        tenant_name: "Alice",
      });
      expect(res).toBe("Hi Alice, Alice!");
    });

    it("should strip complex nested HTML tags from custom messages", () => {
      const res = substituteTemplate("general_notice", {
        property_name: "Tower A",
        custom_message: "<div><b>Warning:</b> <script>stealCookies()</script>Inspection tomorrow</div>",
      });
      expect(res).toContain("Warning: Inspection tomorrow");
      expect(res).not.toContain("<script>");
      expect(res).not.toContain("stealCookies()");
    });

    it("should handle unknown tokens with bracket fallback when not in DEFAULT_FALLBACKS", () => {
      const res = substituteTemplate("Hello {mystery_token}!", {});
      expect(res).toBe("Hello [mystery_token]!");
    });

    it("should sanitize customFallback string before inserting", () => {
      const res = substituteTemplate(
        "payment_gentle",
        { tenant_name: undefined },
        { customFallback: "<script>alert(1)</script>Safe Fallback" }
      );
      expect(res).toContain("Safe Fallback");
      expect(res).not.toContain("<script>");
    });
  });

  describe("validateTemplateContext validation helper", () => {
    it("should return valid: true when all required template tokens exist", () => {
      const res = validateTemplateContext("payment_gentle", {
        tenant_name: "Juan",
        amount: "₱10,000",
        unit: "1A",
        property_name: "Towers",
        due_date: "2026-11-25",
      });
      expect(res.valid).toBe(true);
      expect(res.missingTokens).toHaveLength(0);
    });

    it("should identify missing tokens when context is incomplete", () => {
      const res = validateTemplateContext("payment_gentle", {
        tenant_name: "Juan",
        unit: "1A",
      });
      expect(res.valid).toBe(false);
      expect(res.missingTokens).toContain("amount");
      expect(res.missingTokens).toContain("property_name");
      expect(res.missingTokens).toContain("due_date");
    });

    it("renderTemplate should function identically to substituteTemplate", () => {
      const output = renderTemplate("payment_gentle", {
        tenant_name: "Maria",
        amount: "₱5,000",
        unit: "Unit 3",
        property_name: "Sunrise",
        due_date: "2026-12-01",
      });
      expect(output).toContain("Dear Maria");
      expect(output).toContain("₱5,000");
    });
  });
});
