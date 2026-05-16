"use client";

import { List, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  view: "list" | "grid";
  onChange: (v: "list" | "grid") => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
      <button
        onClick={() => onChange("list")}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          view === "list"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted"
        )}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange("grid")}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          view === "grid"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted"
        )}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  );
}