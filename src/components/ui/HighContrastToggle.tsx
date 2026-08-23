"use client";

import React from "react";
import { Contrast } from "lucide-react";
import { useHighContrast } from "@/hooks/useHighContrast";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function HighContrastToggle({ className }: { className?: string }) {
  const { isHighContrast, toggleHighContrast, mounted } = useHighContrast();

  if (!mounted) return null;

  const handleClick = () => {
    toggleHighContrast();
    if (!isHighContrast) {
      toast.success("High Contrast Mode Enabled", {
        description: "Solid borders, reinforced font weights, and WCAG AAA legibility.",
      });
    } else {
      toast.info("High Contrast Mode Disabled");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 border cursor-pointer",
        isHighContrast
          ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-black dark:border-white shadow-xs ring-2 ring-primary/40"
          : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700",
        className
      )}
      title="Toggle High Contrast Accessibility Mode"
    >
      <Contrast className="size-3.5 shrink-0" />
      <span className="hidden sm:inline">{isHighContrast ? "Contrast: ON" : "High Contrast"}</span>
    </button>
  );
}
