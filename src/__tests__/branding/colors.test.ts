import { describe, it, expect } from "vitest";
import {
  hexToHsl,
  hslToHex,
  getLuminance,
  getContrastRatio,
  getContrastTextColor,
  getMonogramInitials,
} from "@/lib/branding/colors";

describe("Brand Color Token Engine", () => {
  it("converts hex to HSL correctly", () => {
    // Pure White
    const white = hexToHsl("#ffffff");
    expect(white.l).toBe(100);

    // Pure Black
    const black = hexToHsl("#000000");
    expect(black.l).toBe(0);

    // Primary Default Purple (#c4b0ff)
    const purple = hexToHsl("#c4b0ff");
    expect(purple.h).toBeGreaterThanOrEqual(250);
    expect(purple.h).toBeLessThanOrEqual(260);
    expect(purple.s).toBe(100);
    expect(purple.l).toBe(85);
  });

  it("converts HSL to hex correctly", () => {
    const hex = hslToHex(255, 100, 85);
    expect(hex.toLowerCase()).toBe("#c6b3ff");

    // Full round-trip test
    const backToHsl = hexToHsl(hex);
    expect(backToHsl.h).toBe(255);
    expect(backToHsl.s).toBe(100);
    expect(backToHsl.l).toBe(85);
  });

  it("calculates WCAG luminance and contrast ratio accurately", () => {
    const whiteLuminance = getLuminance("#ffffff");
    const blackLuminance = getLuminance("#000000");

    expect(whiteLuminance).toBeCloseTo(1.0, 2);
    expect(blackLuminance).toBeCloseTo(0.0, 2);

    const contrastRatio = getContrastRatio("#ffffff", "#000000");
    expect(contrastRatio).toBe(21.0);
  });

  it("selects appropriate high-contrast foreground color", () => {
    // Light background requires dark text
    expect(getContrastTextColor("#ffffff")).toBe("#09090b");
    expect(getContrastTextColor("#c4b0ff")).toBe("#09090b");
    expect(getContrastTextColor("#fef08a")).toBe("#09090b");

    // Dark background requires white text
    expect(getContrastTextColor("#000000")).toBe("#ffffff");
    expect(getContrastTextColor("#1e1b4b")).toBe("#ffffff");
    expect(getContrastTextColor("#065f46")).toBe("#ffffff");
  });

  it("extracts 2-letter monogram initials properly", () => {
    expect(getMonogramInitials("Reyes Residences")).toBe("RR");
    expect(getMonogramInitials("Valenzuela Grand Dormitory")).toBe("VG");
    expect(getMonogramInitials("Apartments")).toBe("AP");
    expect(getMonogramInitials("")).toBe("IR");
  });
});
