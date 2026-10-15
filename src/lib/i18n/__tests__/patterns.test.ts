import { describe, expect, it } from "vitest";
import { applyPatterns, compilePatterns } from "../patterns";

describe("message patterns", () => {
  const patterns = compilePatterns({
    "{label} is required.": "Kailangan ang {label|lower}.",
    "{label} must be at least {min} characters.": "Dapat hindi bababa sa {min} na character ang {label|lower}.",
  });
  const dict: Record<string, string> = { "Full name": "Buong pangalan", OTP: "OTP" };
  const tr = (s: string) => dict[s] ?? s;

  it("translates captures and lowercases mid-sentence", () => {
    expect(applyPatterns("Full name is required.", patterns, tr)).toBe("Kailangan ang buong pangalan.");
    expect(applyPatterns("OTP is required.", patterns, tr)).toBe("Kailangan ang OTP.");
  });

  it("prefers the most specific template and keeps numbers", () => {
    expect(applyPatterns("Full name must be at least 2 characters.", patterns, tr)).toBe(
      "Dapat hindi bababa sa 2 na character ang buong pangalan.",
    );
  });

  it("returns undefined when nothing matches", () => {
    expect(applyPatterns("Something else", patterns, tr)).toBeUndefined();
  });
});
