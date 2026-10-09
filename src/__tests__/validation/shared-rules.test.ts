import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  dateRangeRule,
  dateRule,
  emailRule,
  integerRule,
  isValidIsoDate,
  moneyRule,
  newPasswordRule,
  confirmMatchRule,
  otpRule,
  parseNumericInput,
  personNameRule,
  phoneRule,
  textRule,
  timeRangeRule,
  choiceRule,
} from "@/lib/validation/rules";
import { zEmail, zInteger, zIsoDate, zMoney, zOptionalText, zRequiredText } from "@/lib/validation/zod-fields";
import { parseJsonBody, zodFieldErrors } from "@/lib/validation/server";

describe("textRule", () => {
  it("treats whitespace-only as empty", () => {
    expect(textRule("   ", { label: "Title", required: true })).toBe("Title is required.");
    expect(textRule("   ", { label: "Note" })).toBeUndefined();
  });
  it("enforces trimmed length bounds", () => {
    expect(textRule(" ab ", { label: "Name", min: 3 })).toMatch(/at least 3/);
    expect(textRule("x".repeat(11), { label: "Code", max: 10 })).toMatch(/cannot exceed 10/);
    expect(textRule("x".repeat(10), { label: "Code", max: 10 })).toBeUndefined();
  });
});

describe("personNameRule", () => {
  it("accepts names with ñ, accents and apostrophes", () => {
    expect(personNameRule("José Peña")).toBeUndefined();
    expect(personNameRule("Ma. Cristina O'Neil-Nuñez")).toBeUndefined();
  });
  it("rejects digits and symbols", () => {
    expect(personNameRule("John123")).toMatch(/can only contain/);
    expect(personNameRule("<script>")).toMatch(/can only contain/);
  });
});

describe("emailRule", () => {
  it("returns the required and format messages", () => {
    expect(emailRule("")).toBe("Email address is required.");
    expect(emailRule("not-an-email")).toMatch(/valid email/);
    expect(emailRule("a@b.co")).toBeUndefined();
    expect(emailRule("", { required: false })).toBeUndefined();
  });
});

describe("phoneRule", () => {
  it("validates PH mobile formats", () => {
    expect(phoneRule("09171234567")).toBeUndefined();
    expect(phoneRule("+639171234567")).toBeUndefined();
    expect(phoneRule("0917123456")).toMatch(/11 digits/);
    expect(phoneRule("", { required: true })).toBe("Phone number is required.");
  });
});

describe("password rules", () => {
  it("requires 8+ chars with letters and a number or symbol", () => {
    expect(newPasswordRule("short1")).toMatch(/at least 8/);
    expect(newPasswordRule("lettersonly")).toMatch(/number or symbol/);
    expect(newPasswordRule("goodpass1")).toBeUndefined();
    expect(newPasswordRule("a1".repeat(40))).toMatch(/cannot exceed 72/);
  });
  it("confirms matching values", () => {
    expect(confirmMatchRule("", "abc")).toMatch(/confirm/);
    expect(confirmMatchRule("abd", "abc")).toBe("Passwords do not match.");
    expect(confirmMatchRule("abc", "abc")).toBeUndefined();
  });
});

describe("otpRule", () => {
  it("accepts exactly six digits", () => {
    expect(otpRule("123456")).toBeUndefined();
    expect(otpRule("12345")).toMatch(/6-digit/);
    expect(otpRule("12345a")).toMatch(/6-digit/);
  });
});

describe("parseNumericInput", () => {
  it("does not turn malformed input into a valid number", () => {
    expect(parseNumericInput("")).toBeNull();
    expect(parseNumericInput("1,500.50")).toBe(1500.5);
    expect(Number.isNaN(parseNumericInput("12abc"))).toBe(true);
    expect(Number.isNaN(parseNumericInput("1e5"))).toBe(true);
  });
});

describe("moneyRule", () => {
  const label = "Monthly rent";
  it("handles required, negative, zero and decimals", () => {
    expect(moneyRule("", { label })).toBe("Monthly rent is required.");
    expect(moneyRule("-1", { label })).toBe("Monthly rent cannot be negative.");
    expect(moneyRule("0", { label })).toBeUndefined();
    expect(moneyRule("0", { label, positive: true })).toMatch(/greater than/);
    expect(moneyRule("10.555", { label })).toMatch(/2 decimal/);
    expect(moneyRule("10.55", { label })).toBeUndefined();
    expect(moneyRule("abc", { label })).toMatch(/valid amount/);
  });
  it("enforces the max boundary", () => {
    expect(moneyRule(99_999_999.99, { label })).toBeUndefined();
    expect(moneyRule(100_000_000, { label })).toMatch(/cannot exceed/);
  });
});

describe("integerRule", () => {
  it("rejects fractional values instead of truncating", () => {
    expect(integerRule("2.5", { label: "Floors" })).toBe("Floors must be a whole number.");
    expect(integerRule("0", { label: "Floors", min: 1 })).toBe("Floors must be at least 1.");
    expect(integerRule("3", { label: "Floors", min: 1, max: 50 })).toBeUndefined();
  });
});

describe("dates", () => {
  it("rejects impossible calendar dates", () => {
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("2028-02-29")).toBe(true);
    expect(dateRule("2026-13-01", { label: "Start date" })).toMatch(/valid date/);
  });
  it("checks min/max bounds", () => {
    expect(dateRule("2026-01-01", { label: "Due date", min: "2026-02-01" })).toMatch(/cannot be before/);
  });
  it("orders date ranges", () => {
    expect(dateRangeRule("2026-09-10", "2026-09-05")).toBe("End date must be on or after the start date.");
    expect(dateRangeRule("2026-09-10", "2026-09-10")).toBeUndefined();
    expect(dateRangeRule("2026-09-10", "2026-09-10", { strict: true })).toBe("End date must be after the start date.");
    expect(dateRangeRule("", "2026-09-10")).toBeUndefined();
  });
  it("orders time ranges", () => {
    expect(timeRangeRule("10:00", "09:00")).toMatch(/after the start time/);
    expect(timeRangeRule("10:00", "10:00")).toMatch(/after the start time/);
    expect(timeRangeRule("10:00", "11:30")).toBeUndefined();
  });
});

describe("choiceRule", () => {
  it("rejects values outside the option set", () => {
    expect(choiceRule("x", ["a", "b"] as const, { label: "Category" })).toBe("Select a valid category.");
    expect(choiceRule("", ["a"] as const, { label: "Category" })).toBe("Select a category.");
  });
});

describe("zod field builders", () => {
  it("share messages with the client rules", () => {
    const schema = z.object({ title: zRequiredText("Title", 10), note: zOptionalText("Note", 5), amount: zMoney("Amount", { positive: true }) });
    const result = schema.safeParse({ title: "  ", note: "   ", amount: "0" });
    expect(result.success).toBe(false);
    const errors = zodFieldErrors(result.error!);
    expect(errors.title).toBe("Title is required.");
    expect(errors.amount).toMatch(/greater than/);
  });
  it("coerces numeric strings and blank optional text", () => {
    const schema = z.object({ note: zOptionalText("Note", 5), amount: zMoney("Amount"), count: zInteger("Count", { min: 1 }) });
    const result = schema.parse({ note: "  ", amount: "1,200.50", count: "3" });
    expect(result).toEqual({ note: null, amount: 1200.5, count: 3 });
  });
  it("normalizes email and rejects invalid dates", () => {
    expect(zEmail().parse(" User@Example.COM ")).toBe("user@example.com");
    expect(zIsoDate("Start date").safeParse("2026-02-30").success).toBe(false);
  });
});

describe("parseJsonBody", () => {
  it("returns a 400 with fieldErrors instead of throwing", async () => {
    const request = new Request("http://x", { method: "POST", body: JSON.stringify({ amount: -5 }) });
    const result = await parseJsonBody(request, z.object({ amount: zMoney("Amount") }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toBe("Amount cannot be negative.");
      expect(body.fieldErrors.amount).toBe("Amount cannot be negative.");
    }
  });
  it("rejects malformed JSON", async () => {
    const request = new Request("http://x", { method: "POST", body: "{not json" });
    const result = await parseJsonBody(request, z.object({}));
    expect(result.ok).toBe(false);
  });
});
