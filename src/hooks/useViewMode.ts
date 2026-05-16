"use client";

import { useState, useEffect } from "react";

export function useViewMode(key: string): ["list" | "grid", (v: "list" | "grid") => void] {
  const [view, setView] = useState<"list" | "grid">("list");

  // Read from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(key);
    if (stored === "list" || stored === "grid") {
      setView(stored);
    }
  }, [key]);

  // Write to localStorage on change
  const handleSetView = (v: "list" | "grid") => {
    setView(v);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, v);
    }
  };

  return [view, handleSetView];
}