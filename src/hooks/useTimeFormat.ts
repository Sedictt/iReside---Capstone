"use client";

import { useSyncExternalStore, useCallback } from "react";

export type TimeFormat = "12h" | "24h";

export const TIME_FORMAT_STORAGE_KEY = "ireside_time_format";
export const TIME_FORMAT_CHANGE_EVENT = "ireside-time-format-change";

export const DEFAULT_TIME_FORMAT: TimeFormat = "12h";

function getSnapshot(): TimeFormat {
  if (typeof window === "undefined") return DEFAULT_TIME_FORMAT;
  try {
    const stored = localStorage.getItem(TIME_FORMAT_STORAGE_KEY);
    return stored === "24h" ? "24h" : "12h";
  } catch {
    return DEFAULT_TIME_FORMAT;
  }
}

function getServerSnapshot(): TimeFormat {
  return DEFAULT_TIME_FORMAT;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(TIME_FORMAT_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(TIME_FORMAT_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useTimeFormat() {
  const timeFormat = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const is24Hour = timeFormat === "24h";

  const setTimeFormat = useCallback((format: TimeFormat) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(TIME_FORMAT_STORAGE_KEY, format);
      window.dispatchEvent(new Event(TIME_FORMAT_CHANGE_EVENT));
    } catch (e) {
      console.warn("[useTimeFormat] Failed to save time format:", e);
    }
  }, []);

  const toggleTimeFormat = useCallback(() => {
    const next: TimeFormat = getSnapshot() === "12h" ? "24h" : "12h";
    setTimeFormat(next);
  }, [setTimeFormat]);

  /**
   * Formats a given date into separated time parts respecting 12h/24h preference.
   */
  const formatTimeParts = useCallback(
    (date: Date) => {
      const hoursNum = date.getHours();
      const minutesStr = date.getMinutes().toString().padStart(2, "0");
      const secondsStr = date.getSeconds().toString().padStart(2, "0");

      if (is24Hour) {
        return {
          hours: hoursNum.toString().padStart(2, "0"),
          minutes: minutesStr,
          seconds: secondsStr,
          period: undefined,
          formatted: `${hoursNum.toString().padStart(2, "0")}:${minutesStr}`,
          is24Hour: true,
        };
      }

      // 12-Hour format
      const hour12 = (hoursNum % 12) || 12;
      const period: "AM" | "PM" = hoursNum >= 12 ? "PM" : "AM";
      return {
        hours: hour12.toString().padStart(2, "0"),
        minutes: minutesStr,
        seconds: secondsStr,
        period,
        formatted: `${hour12.toString().padStart(2, "0")}:${minutesStr} ${period}`,
        is24Hour: false,
      };
    },
    [is24Hour]
  );

  /**
   * Helper to format a string or date using standard localeTimeString.
   */
  const formatTimeString = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
      const d = typeof date === "string" ? new Date(date) : date;
      if (!d || Number.isNaN(d.getTime())) return "";
      return d.toLocaleTimeString("en-US", {
        hour12: !is24Hour,
        ...options,
      });
    },
    [is24Hour]
  );

  return {
    timeFormat,
    is24Hour,
    setTimeFormat,
    toggleTimeFormat,
    formatTimeParts,
    formatTimeString,
  };
}
