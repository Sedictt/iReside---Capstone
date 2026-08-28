"use client";

import { useSyncExternalStore, useCallback, useEffect } from "react";

const EVENT_NAME = "ireside-high-contrast-change";

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("ireside_high_contrast") === "true";
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
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

export function useHighContrast() {
  const isHighContrast = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Synchronize document attributes to match current store value
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isHighContrast) {
      document.documentElement.classList.add("high-contrast");
      document.documentElement.setAttribute("data-high-contrast", "true");
    } else {
      document.documentElement.classList.remove("high-contrast");
      document.documentElement.removeAttribute("data-high-contrast");
    }
  }, [isHighContrast]);

  const toggleHighContrast = useCallback((forceState?: boolean | any) => {
    if (typeof window === "undefined") return;
    const current = getSnapshot();
    const isExplicitBool = typeof forceState === "boolean";
    const next = isExplicitBool ? forceState : !current;

    try {
      localStorage.setItem("ireside_high_contrast", String(next));
      if (next) {
        document.documentElement.classList.add("high-contrast");
        document.documentElement.setAttribute("data-high-contrast", "true");
      } else {
        document.documentElement.classList.remove("high-contrast");
        document.documentElement.removeAttribute("data-high-contrast");
      }
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch {
      // Ignore storage errors
    }
  }, []);

  return {
    isHighContrast,
    toggleHighContrast,
    mounted: true,
  };
}
