"use client";

import { useSyncExternalStore, useCallback, useEffect } from "react";

export type FontSizeTier = "normal" | "large" | "larger";

export const MIN_FONT_SCALE = 100;
export const MAX_FONT_SCALE = 120;
export const DEFAULT_FONT_SCALE = 100;
export const FONT_SCALE_STEPS = [100, 110, 120];

const EVENT_NAME = "ireside-font-size-change";
const STORAGE_SCALE_KEY = "ireside_font_scale";
const STORAGE_LEGACY_KEY = "ireside_font_size";

export function getTierFromScale(scale: number): FontSizeTier {
  if (scale <= 100) return "normal";
  if (scale <= 110) return "large";
  return "larger";
}

export function getTierLabel(scale: number): string {
  if (scale <= 100) return "Standard (Default)";
  if (scale <= 110) return "Comfortable";
  return "Extra Large";
}

function applyScaleToDocument(scale: number) {
  if (typeof document === "undefined") return;
  // Apply directly to root inline style for instant browser-native CSS rem scaling
  document.documentElement.style.fontSize = `${scale}%`;

  const tier = getTierFromScale(scale);
  document.documentElement.setAttribute("data-font-size", tier);
  document.documentElement.setAttribute("data-font-scale", String(scale));
}

function getSnapshot(): number {
  if (typeof window === "undefined") return DEFAULT_FONT_SCALE;
  try {
    const rawScale = localStorage.getItem(STORAGE_SCALE_KEY);
    if (rawScale) {
      const parsed = parseInt(rawScale, 10);
      if (!isNaN(parsed) && parsed >= MIN_FONT_SCALE && parsed <= MAX_FONT_SCALE) {
        return parsed;
      }
    }
    // Fallback: check legacy key
    const legacy = localStorage.getItem(STORAGE_LEGACY_KEY);
    if (legacy === "large") return 110;
    if (legacy === "larger") return 120;
    return DEFAULT_FONT_SCALE;
  } catch {
    return DEFAULT_FONT_SCALE;
  }
}

function getServerSnapshot(): number {
  return DEFAULT_FONT_SCALE;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useFontSize() {
  const fontScale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Synchronize document styles immediately
  useEffect(() => {
    applyScaleToDocument(fontScale);
  }, [fontScale]);

  const setFontScale = useCallback((newScale: number) => {
    if (typeof window === "undefined") return;
    const clamped = Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, Math.round(newScale)));

    try {
      localStorage.setItem(STORAGE_SCALE_KEY, String(clamped));
      const tier = getTierFromScale(clamped);
      localStorage.setItem(STORAGE_LEGACY_KEY, tier);
      applyScaleToDocument(clamped);
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch {
      // Ignore storage restrictions (e.g., incognito)
    }
  }, []);

  const resetFontScale = useCallback(() => {
    setFontScale(DEFAULT_FONT_SCALE);
  }, [setFontScale]);

  // Backwards compatibility helpers
  const tier = getTierFromScale(fontScale);
  const setFontSize = useCallback((nextTier: "normal" | "large" | "larger") => {
    if (nextTier === "normal") setFontScale(100);
    else if (nextTier === "large") setFontScale(110);
    else if (nextTier === "larger") setFontScale(120);
  }, [setFontScale]);

  return {
    fontScale,
    setFontScale,
    resetFontScale,
    tier,
    tierLabel: getTierLabel(fontScale),
    fontSize: tier,
    setFontSize,
    isDefault: fontScale === DEFAULT_FONT_SCALE,
    isNormal: fontScale === 100,
    isLarge: fontScale === 110,
    isLarger: fontScale === 120,
    mounted: true,
  };
}
