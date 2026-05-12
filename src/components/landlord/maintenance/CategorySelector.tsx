"use client";

import { cn } from "@/lib/utils";
import { MAINTENANCE_CATEGORIES } from "@/lib/constants/maintenance-categories";

interface CategorySelectorProps {
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

export function CategorySelector({ value, onChange, error }: CategorySelectorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {MAINTENANCE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = value === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange(cat.id)}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 group",
                isSelected
                  ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary"
                  : "bg-card border-border hover:border-primary/30"
              )}
            >
              <div className={cn("p-2 rounded-xl transition-colors", cat.bg, cat.color)}>
                <Icon className="size-5" />
              </div>
              <span className="text-xs font-black text-center">{cat.label}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}