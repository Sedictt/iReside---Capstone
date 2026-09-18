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

  // Compact variant: Small pill for clocks / headers
  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleTimeFormat();
        }}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider transition-all uppercase cursor-pointer select-none",
          "border border-border/70 hover:border-primary/60 bg-background/80 hover:bg-background backdrop-blur-md",
          "text-muted-foreground hover:text-foreground active:scale-95 shadow-sm",
          className
        )}
        title={`Current format: ${is24Hour ? "24-Hour" : "12-Hour"}. Click to switch to ${is24Hour ? "12-Hour" : "24-Hour"}.`}
        aria-label={`Switch time format from ${is24Hour ? "24-Hour" : "12-Hour"} to ${is24Hour ? "12-Hour" : "24-Hour"}`}
      >
        <Clock className="size-3 text-primary shrink-0" />
        <span>{is24Hour ? "24H" : "12H"}</span>
      </button>
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
