"use client";

import { List, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  view: "list" | "grid";
  onChange: (v: "list" | "grid") => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm p-1 shadow-inner">
      <button
        onClick={() => onChange("list")}
        className={cn(
          "p-1.5 rounded-lg transition-all duration-200",
          view === "list"
            ? "bg-primary text-primary-foreground shadow-sm scale-100"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground scale-95 opacity-70"
        )}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange("grid")}
        className={cn(
          "p-1.5 rounded-lg transition-all duration-200",
          view === "grid"
            ? "bg-primary text-primary-foreground shadow-sm scale-100"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground scale-95 opacity-70"
        )}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  );
}