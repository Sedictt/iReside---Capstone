import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useTimeFormat,
  TIME_FORMAT_STORAGE_KEY,
  DEFAULT_TIME_FORMAT,
} from "../../hooks/useTimeFormat";

describe("TimeFormat: useTimeFormat hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to 12h format when nothing is in localStorage", () => {
    const { result } = renderHook(() => useTimeFormat());
    expect(result.current.timeFormat).toBe("12h");
    expect(result.current.is24Hour).toBe(false);
  });

  it("reads 24h format from localStorage on mount", () => {
    localStorage.setItem(TIME_FORMAT_STORAGE_KEY, "24h");
    const { result } = renderHook(() => useTimeFormat());
    expect(result.current.timeFormat).toBe("24h");
    expect(result.current.is24Hour).toBe(true);
  });

  it("toggles between 12h and 24h format reactively", () => {
    const { result } = renderHook(() => useTimeFormat());
    expect(result.current.timeFormat).toBe("12h");

    act(() => {
      result.current.toggleTimeFormat();
    });

    expect(result.current.timeFormat).toBe("24h");
    expect(result.current.is24Hour).toBe(true);
    expect(localStorage.getItem(TIME_FORMAT_STORAGE_KEY)).toBe("24h");

    act(() => {
      result.current.toggleTimeFormat();
    });

    expect(result.current.timeFormat).toBe("12h");
    expect(result.current.is24Hour).toBe(false);
    expect(localStorage.getItem(TIME_FORMAT_STORAGE_KEY)).toBe("12h");
  });

  it("sets specific format directly", () => {
    const { result } = renderHook(() => useTimeFormat());

    act(() => {
      result.current.setTimeFormat("24h");
    });
    expect(result.current.timeFormat).toBe("24h");

    act(() => {
      result.current.setTimeFormat("12h");
    });
    expect(result.current.timeFormat).toBe("12h");
  });

  it("formats time correctly in 12-hour format without malformed PM mix-ups", () => {
    const { result } = renderHook(() => useTimeFormat());

    // Afternoon: 17:10
    const afternoon = new Date(2026, 8, 17, 17, 10, 0);
    const parts1 = result.current.formatTimeParts(afternoon);
    expect(parts1.hours).toBe("05");
    expect(parts1.minutes).toBe("10");
    expect(parts1.period).toBe("PM");
    expect(parts1.formatted).toBe("05:10 PM");

    // Morning: 09:05
    const morning = new Date(2026, 8, 17, 9, 5, 0);
    const parts2 = result.current.formatTimeParts(morning);
    expect(parts2.hours).toBe("09");
    expect(parts2.minutes).toBe("05");
    expect(parts2.period).toBe("AM");
    expect(parts2.formatted).toBe("09:05 AM");

    // Midnight: 00:00
    const midnight = new Date(2026, 8, 17, 0, 0, 0);
    const parts3 = result.current.formatTimeParts(midnight);
    expect(parts3.hours).toBe("12");
    expect(parts3.minutes).toBe("00");
    expect(parts3.period).toBe("AM");
    expect(parts3.formatted).toBe("12:00 AM");

    // Noon: 12:30
    const noon = new Date(2026, 8, 17, 12, 30, 0);
    const parts4 = result.current.formatTimeParts(noon);
    expect(parts4.hours).toBe("12");
    expect(parts4.minutes).toBe("30");
    expect(parts4.period).toBe("PM");
    expect(parts4.formatted).toBe("12:30 PM");
  });

  it("formats time correctly in 24-hour format", () => {
    localStorage.setItem(TIME_FORMAT_STORAGE_KEY, "24h");
    const { result } = renderHook(() => useTimeFormat());

    // Afternoon: 17:10
    const afternoon = new Date(2026, 8, 17, 17, 10, 0);
    const parts1 = result.current.formatTimeParts(afternoon);
    expect(parts1.hours).toBe("17");
    expect(parts1.minutes).toBe("10");
    expect(parts1.period).toBeUndefined();
    expect(parts1.formatted).toBe("17:10");

    // Morning: 09:05
    const morning = new Date(2026, 8, 17, 9, 5, 0);
    const parts2 = result.current.formatTimeParts(morning);
    expect(parts2.hours).toBe("09");
    expect(parts2.minutes).toBe("05");
    expect(parts2.period).toBeUndefined();
    expect(parts2.formatted).toBe("09:05");

    // Midnight: 00:00
    const midnight = new Date(2026, 8, 17, 0, 0, 0);
    const parts3 = result.current.formatTimeParts(midnight);
    expect(parts3.hours).toBe("00");
    expect(parts3.minutes).toBe("00");
    expect(parts3.period).toBeUndefined();
    expect(parts3.formatted).toBe("00:00");
  });
});
