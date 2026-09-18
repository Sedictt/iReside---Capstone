"use client";

import * as React from "react";
import { Type, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import {
  useFontSize,
  MIN_FONT_SCALE,
  MAX_FONT_SCALE,
  DEFAULT_FONT_SCALE,
  FONT_SCALE_STEPS,
} from "@/hooks/useFontSize";
import { cn } from "@/lib/utils";

export interface FontSizeToggleProps {
  variant?: "slider" | "compact" | "segmented";
  showPreview?: boolean;
  className?: string;
}

export function FontSizeToggle({
  variant = "slider",
  showPreview = true,
  className,
}: FontSizeToggleProps) {
  const {
    fontScale,
    setFontScale,
    resetFontScale,
    tierLabel,
    isDefault,
  } = useFontSize();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          variant === "slider"
            ? "h-32 w-full rounded-2xl border border-border/50 bg-muted/20 animate-pulse"
            : "size-10 rounded-xl border border-border/50 bg-muted/20 animate-pulse",
          className
        )}
      />
    );
  }

  // Compact variant: Quick cycle button for navbars/sidebars
  if (variant === "compact") {
    const handleCycle = () => {
      const nextScale = fontScale >= 120 ? 100 : fontScale + 10;
      setFontScale(nextScale);
    };

    return (
      <button
        type="button"
        onClick={handleCycle}
        className={cn(
          "relative flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 transition-all hover:bg-zinc-100 hover:border-zinc-300 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:hover:bg-white/[0.08] dark:hover:border-white/20 cursor-pointer",
          className
        )}
        title={`Text size: ${fontScale}% (${tierLabel}). Click to cycle.`}
        aria-label={`Change text size. Currently ${fontScale}%`}
      >
        <div className="flex items-center justify-center font-bold tracking-tighter">
          <span className="text-xs">A</span>
          {fontScale > 100 && (
            <span className="text-[10px] text-primary font-black ml-0.5">
              {fontScale >= 120 ? "++" : "+"}
            </span>
          )}
        </div>
      </button>
    );
  }

  // Slider variant (Default for Settings / Accessibility panels)
  const percentageFilled = ((fontScale - MIN_FONT_SCALE) / (MAX_FONT_SCALE - MIN_FONT_SCALE)) * 100;

  const SCALE_PRESETS = [
    { scale: 100, title: "Standard", percentage: "100%" },
    { scale: 110, title: "Comfortable", percentage: "110%" },
    { scale: 120, title: "Extra Large", percentage: "120%" },
  ];

  return (
    <div className={cn("space-y-5", className)}>
      {/* Slider Control Panel */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-surface-2 border border-border/70 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-foreground shrink-0">Display Font Scale</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-primary/15 text-primary border border-primary/25 whitespace-nowrap shrink-0">
              {fontScale}% · {tierLabel}
            </span>
          </div>

          {!isDefault && (
            <button
              type="button"
              onClick={resetFontScale}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1 rounded-lg hover:bg-surface-3 cursor-pointer shrink-0 ml-auto"
              title="Reset to 100% standard font size"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Range Slider Track */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setFontScale(Math.max(MIN_FONT_SCALE, fontScale - 10))}
              disabled={fontScale <= MIN_FONT_SCALE}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer shrink-0"
              aria-label="Decrease font size"
            >
              <span className="font-serif font-bold text-xs sm:text-sm">A</span>
            </button>

            <div className="relative flex-1 flex items-center min-w-0">
              <input
                type="range"
                min={MIN_FONT_SCALE}
                max={MAX_FONT_SCALE}
                step={10}
                value={fontScale}
                onChange={(e) => setFontScale(Number(e.target.value))}
                aria-label="Font size scale percentage"
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-surface-3 accent-primary transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{
                  background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percentageFilled}%, var(--surface-3) ${percentageFilled}%, var(--surface-3) 100%)`,
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => setFontScale(Math.min(MAX_FONT_SCALE, fontScale + 10))}
              disabled={fontScale >= MAX_FONT_SCALE}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer shrink-0"
              aria-label="Increase font size"
            >
              <span className="font-serif font-black text-base sm:text-lg">A</span>
            </button>
          </div>

          {/* Three Choice Buttons */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 pt-1.5 items-stretch">
            {SCALE_PRESETS.map((preset) => {
              const isSelected = fontScale === preset.scale;
              return (
                <button
                  key={preset.scale}
                  type="button"
                  onClick={() => setFontScale(preset.scale)}
                  className={cn(
                    "group relative flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-2 px-1.5 sm:px-3 rounded-xl transition-all cursor-pointer border text-center min-w-0",
                    isSelected
                      ? "bg-card text-primary font-bold shadow-sm border-primary/50"
                      : "bg-surface-1/40 hover:bg-surface-3 text-muted-foreground border-border/40 hover:text-foreground"
                  )}
                >
                  <span className="text-[11px] sm:text-xs font-bold leading-tight truncate">
                    {preset.title}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] sm:text-xs font-mono shrink-0",
                      isSelected ? "text-primary/80 font-semibold" : "opacity-60"
                    )}
                  >
                    ({preset.percentage})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Readability Preview Box */}
      {showPreview && (
        <div className="rounded-2xl border border-border/80 bg-card p-3.5 sm:p-5 space-y-3 transition-all duration-300">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 shrink-0">
              <Type className="size-3.5 text-primary shrink-0" />
              Live Readability Preview
            </span>
            <span className="text-xs font-mono text-primary font-bold shrink-0">
              {fontScale}% scale active
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="text-base font-bold text-foreground tracking-tight">
              Sample Lease &amp; Property Notice
            </h4>
            <p className="text-sm text-foreground/85 leading-relaxed">
              Unit #304 lease agreement renewal is approved. The monthly rent is ₱24,500 with water and high-speed fiber internet amenities included.
            </p>
            <p className="text-xs text-muted-foreground">
              Small caption details, payment due dates, and badges scale cleanly with zero clipping.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
