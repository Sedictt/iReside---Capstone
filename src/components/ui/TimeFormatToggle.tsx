"use client";

import React from "react";
import { Clock } from "lucide-react";
import { useTimeFormat, TimeFormat } from "@/hooks/useTimeFormat";
import { cn } from "@/lib/utils";

export interface TimeFormatToggleProps {
  variant?: "segmented" | "compact";
  className?: string;
  showPreview?: boolean;
}

export function TimeFormatToggle({
  variant = "segmented",
  className,
  showPreview = true,
}: TimeFormatToggleProps) {
  const { timeFormat, setTimeFormat, toggleTimeFormat, is24Hour } = useTimeFormat();

  // Compact variant: Clean segmented switch for clocks / headers
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center p-0.5 rounded-lg border border-border/70 bg-muted/30 backdrop-blur-md select-none",
          className
        )}
        role="group"
        aria-label="Time format selector"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setTimeFormat("12h");
          }}
          className={cn(
            "px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer",
            !is24Hour
              ? "bg-background text-foreground shadow-xs font-black border border-border/40"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={!is24Hour}
          title="Switch to 12-hour format (AM/PM)"
        >
          12H
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setTimeFormat("24h");
          }}
          className={cn(
            "px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer",
            is24Hour
              ? "bg-background text-foreground shadow-xs font-black border border-border/40"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={is24Hour}
          title="Switch to 24-hour format"
        >
          24H
        </button>
      </div>
    );
  }

  // Segmented variant: Full card control for Settings pages
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 12-Hour Option */}
        <button
          type="button"
          onClick={() => setTimeFormat("12h")}
          className={cn(
            "flex items-center justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer",
            !is24Hour
              ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
              : "border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border"
          )}
          aria-pressed={!is24Hour}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "size-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                !is24Hour
                  ? "bg-primary text-primary-foreground border-primary font-black shadow-sm"
                  : "neumorphic-inset text-muted-foreground border-border/40"
              )}
            >
              <Clock className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">12-Hour Format</span>
                {!is24Hour && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Standard clock with AM/PM indicator
              </p>
            </div>
          </div>
          {showPreview && (
            <span className="font-mono text-xs font-black text-foreground/80 bg-background/80 px-2.5 py-1 rounded-lg border border-border/50 shrink-0">
              05:10 PM
            </span>
          )}
        </button>

        {/* 24-Hour Option */}
        <button
          type="button"
          onClick={() => setTimeFormat("24h")}
          className={cn(
            "flex items-center justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer",
            is24Hour
              ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
              : "border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border"
          )}
          aria-pressed={is24Hour}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "size-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                is24Hour
                  ? "bg-primary text-primary-foreground border-primary font-black shadow-sm"
                  : "neumorphic-inset text-muted-foreground border-border/40"
              )}
            >
              <Clock className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">24-Hour Format</span>
                {is24Hour && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Military / 24H clock without AM/PM
              </p>
            </div>
          </div>
          {showPreview && (
            <span className="font-mono text-xs font-black text-foreground/80 bg-background/80 px-2.5 py-1 rounded-lg border border-border/50 shrink-0">
              17:10
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
