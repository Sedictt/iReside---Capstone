import { describe, expect, it } from "vitest";
import { translate } from "../index";
import {
  choiceRule,
  confirmMatchRule,
  dateRangeRule,
  moneyRule,
  otpRule,
  personNameRule,
  textRule,
} from "@/lib/validation/rules";
import { getPasswordPolicyError } from "@/lib/validation/password-policy";
import { formatTenure, formatTenureShort, leaseDateRangeLabel, leaseTermLabel, tenureSinceLabel } from "@/lib/lease-term";

const fil = (text: string | undefined) => translate(text ?? "", "fil");

describe("runtime-built validation messages in Filipino", () => {
  it("translates required/length messages with the label inside the sentence", () => {
    expect(fil(personNameRule(""))).toBe("Kailangan ang buong pangalan.");
    expect(fil(textRule("x", { label: "Property name", min: 2 }))).toBe(
      "Dapat ay hindi bababa sa 2 character ang pangalan ng property.",
    );
    expect(fil(textRule("x".repeat(80), { label: "Contractor name", max: 70 }))).toBe(
      "Hindi puwedeng lumampas sa 70 character ang pangalan ng contractor.",
    );
  });

  it("translates money, date and choice rules", () => {
    expect(fil(moneyRule("-5", { label: "Monthly rent" }))).toBe("Hindi puwedeng negatibo ang buwanang upa.");
    expect(fil(dateRangeRule("2026-05-01", "2026-04-01", { strict: true }))).toBe(
      "Dapat ay pagkatapos ng petsa ng simula ang petsa ng pagtatapos.",
    );
    expect(fil(choiceRule("nope", ["a"], { label: "Expense category" }))).toBe("Pumili ng valid na kategorya ng gastos.");
  });

  it("translates password and code rules", () => {
    expect(fil(otpRule("12"))).toBe("Ilagay ang 6-digit na code.");
    expect(fil(confirmMatchRule("a", "b"))).toBe("Hindi magkatugma ang mga password.");
    expect(fil(getPasswordPolicyError("aaaaaaaaaaaa", { label: "New password" }))).not.toMatch(/must|predictable|common/);
  });

  it("translates fixed validation and API messages exactly", () => {
    expect(fil("Unit not found.")).toBe("Hindi nahanap ang unit.");
    expect(fil("Message cannot exceed 4000 characters.")).toBe("Hindi puwedeng lumampas sa 4000 character ang mensahe.");
  });

  it("leaves English untouched", () => {
    expect(translate("Full name is required.", "en")).toBe("Full name is required.");
    expect(translate("Contractor name cannot exceed 70 characters.", "en")).toBe(
      "Contractor name cannot exceed 70 characters.",
    );
  });
});

describe("lease-term labels in Filipino", () => {
  const NOW = new Date(2026, 9, 13);

  it("keeps English output by default", () => {
    expect(formatTenure("2025-03-01", NOW)).toBe("1 year 7 months");
    expect(formatTenureShort("2025-03-01", NOW)).toBe("1y 7m");
    expect(leaseTermLabel({ term_type: "open_ended" }, NOW)).toBe("Open-ended");
  });

  it("formats tenure, labels and dates in Filipino", () => {
    expect(formatTenure("2025-03-01", NOW, "fil")).toBe("1 taon at 7 buwan");
    expect(formatTenure("2026-10-20", NOW, "fil")).toBe("Magsisimula sa loob ng 7 araw");
    expect(formatTenureShort("2025-03-01", NOW, "fil")).toBe("1t 7b");
    expect(leaseTermLabel({ term_type: "open_ended" }, NOW, "fil")).toBe("Walang takdang tapos");
    expect(leaseTermLabel({ term_type: "fixed", end_date: "2026-11-30" }, NOW, "fil")).toMatch(/^Matatapos sa Nob 30, 2026$/);
    expect(tenureSinceLabel("2024-03-05", "fil")).toMatch(/^Mula Mar 2024$/);
    expect(leaseDateRangeLabel({ start_date: "2025-03-01", term_type: "open_ended" }, "fil")).toMatch(
      /^Mar 1, 2025 – Walang takdang tapos$/,
    );
  });
});
