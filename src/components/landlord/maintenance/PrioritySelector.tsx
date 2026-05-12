"use client";

import { cn } from "@/lib/utils";

type Priority = "Low" | "Medium" | "High" | "Critical";

interface PrioritySelectorProps {
  value: Priority;
  onChange: (p: Priority) => void;
  error?: string;
}

const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Critical"];

const styles: Record<Priority, { active: string; inactive: string }> = {
  Low:      { active: "bg-gray-400 text-white",      inactive: "bg-muted text-muted-foreground hover:bg-muted/80" },
  Medium:   { active: "bg-yellow-500 text-white",    inactive: "bg-muted text-muted-foreground hover:bg-muted/80" },
  High:     { active: "bg-orange-500 text-white",   inactive: "bg-muted text-muted-foreground hover:bg-muted/80" },
  Critical: { active: "bg-red-500 text-white",       inactive: "bg-muted text-muted-foreground hover:bg-muted/80" },
};

export function PrioritySelector({ value, onChange, error }: PrioritySelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex rounded-2xl border border-border bg-muted/30 p-1 gap-1">
        {PRIORITIES.map((p) => {
          const isSelected = value === p;
          const s = styles[p];
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                isSelected ? s.active : s.inactive
              )}
            >
              {p}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}