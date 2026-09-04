import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useFontSize,
  FONT_SCALE_STEPS,
  DEFAULT_FONT_SCALE,
  MIN_FONT_SCALE,
  MAX_FONT_SCALE,
} from "@/hooks/useFontSize";

describe("Accessibility: useFontSize slider & scale hook", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-font-size");
    document.documentElement.removeAttribute("data-font-scale");
    document.documentElement.style.fontSize = "";
  });

  it("provides valid step increments for the slider (exactly three choices)", () => {
    expect(FONT_SCALE_STEPS).toEqual([100, 110, 120]);
    expect(DEFAULT_FONT_SCALE).toBe(100);
    expect(MIN_FONT_SCALE).toBe(100);
    expect(MAX_FONT_SCALE).toBe(120);
  });

  it("defaults to 100% when no scale is saved in localStorage", () => {
    const { result } = renderHook(() => useFontSize());
    expect(result.current.fontScale).toBe(100);
    expect(result.current.isDefault).toBe(true);
    expect(result.current.isNormal).toBe(true);
    expect(result.current.tier).toBe("normal");
    expect(document.documentElement.style.fontSize).toBe("100%");
  });

  it("reads pre-existing fontScale from localStorage on mount", () => {
    localStorage.setItem("ireside_font_scale", "110");
    const { result } = renderHook(() => useFontSize());
    expect(result.current.fontScale).toBe(110);
    expect(result.current.isLarge).toBe(true);
    expect(document.documentElement.style.fontSize).toBe("110%");
  });

  it("updates font scale when slider changes, clamping to bounds [100, 120]", () => {
    const { result } = renderHook(() => useFontSize());

    act(() => {
      result.current.setFontScale(110);
    });

    expect(result.current.fontScale).toBe(110);
    expect(result.current.isDefault).toBe(false);
    expect(result.current.isLarge).toBe(true);
    expect(localStorage.getItem("ireside_font_scale")).toBe("110");
    expect(document.documentElement.style.fontSize).toBe("110%");
    expect(document.documentElement.getAttribute("data-font-size")).toBe("large");

    // Clamping test - should clamp to MAX_FONT_SCALE (120)
    act(() => {
      result.current.setFontScale(200);
    });
    expect(result.current.fontScale).toBe(120);
    expect(document.documentElement.style.fontSize).toBe("120%");

    // Clamping test - should clamp to MIN_FONT_SCALE (100)
    act(() => {
      result.current.setFontScale(50);
    });
    expect(result.current.fontScale).toBe(100);
    expect(document.documentElement.style.fontSize).toBe("100%");
  });

  it("resets font scale back to default 100%", () => {
    const { result } = renderHook(() => useFontSize());

    act(() => {
      result.current.setFontScale(120);
    });
    expect(result.current.fontScale).toBe(120);
    expect(result.current.isDefault).toBe(false);

    act(() => {
      result.current.resetFontScale();
    });
    expect(result.current.fontScale).toBe(100);
    expect(result.current.isDefault).toBe(true);
    expect(document.documentElement.style.fontSize).toBe("100%");
  });
});
