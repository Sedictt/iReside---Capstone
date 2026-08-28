/**
 * iReside Brand Color & Contrast Token Engine
 * 
 * Provides mathematical color space conversions (Hex <-> HSL),
 * WCAG 2.1 AAA relative luminance and contrast ratio calculations,
 * and dynamic CSS custom property injection into the DOM document root.
 */

export interface HslColor {
  h: number; // 0 - 360
  s: number; // 0 - 100
  l: number; // 0 - 100
}

/**
 * Converts a HEX color string (e.g. "#6366f1" or "6366f1") to HSL values.
 */
export function hexToHsl(hex: string): HslColor {
  let c = hex.replace("#", "").trim();
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  if (c.length !== 6) {
    return { h: 255, s: 100, l: 85 }; // Default fallback purple
  }

  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Converts HSL components to a HEX color string.
 */
export function hslToHex(h: number, s: number, l: number): string {
  const normL = l / 100;
  const a = (s * Math.min(normL, 1 - normL)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = normL - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Calculates WCAG 2.1 Relative Luminance of a HEX color.
 */
export function getLuminance(hex: string): number {
  let c = hex.replace("#", "").trim();
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  if (c.length !== 6) return 0.5;

  const rgb = [
    parseInt(c.substring(0, 2), 16) / 255,
    parseInt(c.substring(2, 4), 16) / 255,
    parseInt(c.substring(4, 6), 16) / 255,
  ].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/**
 * Calculates WCAG Contrast Ratio between two HEX colors (1.0 to 21.0).
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

/**
 * Computes contrast-compliant text color (#09090b or #ffffff) for a given background HEX.
 */
export function getContrastTextColor(bgHex: string): string {
  const lum = getLuminance(bgHex);
  // If background is light (luminance > 0.38), use dark text; otherwise white
  return lum > 0.38 ? "#09090b" : "#ffffff";
}

/**
 * Extracts 2-letter monogram initials from a property or business name.
 */
export function getMonogramInitials(name: string): string {
  if (!name || !name.trim()) return "IR";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Converts a HEX color string to RGB object.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace("#", "").trim();
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  if (c.length !== 6) {
    return { r: 196, g: 176, b: 255 };
  }
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  };
}

/**
 * Injects dynamic CSS variables into document.documentElement.
 */
export function applyBrandCssVariables(primaryHex: string, secondaryHex?: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const validPrimary = primaryHex.startsWith("#") ? primaryHex : `#${primaryHex}`;
  const hsl = hexToHsl(validPrimary);
  const rgb = hexToRgb(validPrimary);
  const fgColor = getContrastTextColor(validPrimary);
  const root = document.documentElement;

  // Set direct valid color strings for Tailwind v4 and CSS standards
  root.style.setProperty("--primary", validPrimary);
  root.style.setProperty("--primary-foreground", fgColor);
  root.style.setProperty("--primary-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  
  // Set Raw HEX & RGB CSS variables for inline styles & gradients
  root.style.setProperty("--brand-primary", validPrimary);
  if (secondaryHex) {
    const validSecondary = secondaryHex.startsWith("#") ? secondaryHex : `#${secondaryHex}`;
    root.style.setProperty("--brand-secondary", validSecondary);
  }

  // Pre-calculate tints for subtle backgrounds
  root.style.setProperty("--brand-primary-50", hslToHex(hsl.h, Math.max(0, hsl.s - 20), 96));
  root.style.setProperty("--brand-primary-100", hslToHex(hsl.h, Math.max(0, hsl.s - 15), 90));
  root.style.setProperty("--brand-primary-900", hslToHex(hsl.h, hsl.s, 15));
}
