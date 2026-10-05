"use client";

import { List, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  view: "list" | "grid";
  onChange: (v: "list" | "grid") => void;
  className?: string;
  size?: "sm" | "md";
}

export function ViewToggle({ view, onChange, className, size = "md" }: ViewToggleProps) {
  const isSm = size === "sm";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1 neumorphic-extruded",
        isSm ? "h-9.5 sm:h-10 rounded-xl p-0.5" : "h-11 rounded-2xl p-1",
        className
      )}
      role="group"
      aria-label="View layout mode"
    >
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "flex items-center justify-center transition-all duration-200 cursor-pointer",
          isSm ? "size-8 rounded-lg" : "size-9 rounded-xl",
          view === "list"
            ? "bg-primary text-primary-foreground shadow-sm scale-100 font-bold"
            : "text-muted-foreground hover:neumorphic-inset hover:text-foreground scale-95 opacity-70"
        )}
        aria-label="List view"
        aria-pressed={view === "list"}
        title="List view"
      >
        <List className={isSm ? "size-3.5" : "size-4"} />
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={cn(
          "flex items-center justify-center transition-all duration-200 cursor-pointer",
          isSm ? "size-8 rounded-lg" : "size-9 rounded-xl",
          view === "grid"
            ? "bg-primary text-primary-foreground shadow-sm scale-100 font-bold"
            : "text-muted-foreground hover:neumorphic-inset hover:text-foreground scale-95 opacity-70"
        )}
        aria-label="Grid view"
        aria-pressed={view === "grid"}
        title="Grid view"
      >
        <LayoutGrid className={isSm ? "size-3.5" : "size-4"} />
      </button>
    </div>
  );
}