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

  return (
    <div className={cn("space-y-5", className)}>
      {/* Slider Control Panel */}
      <div className="p-5 rounded-2xl bg-surface-2 border border-border/70 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">Display Font Scale</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-primary/15 text-primary border border-primary/25">
              {fontScale}% · {tierLabel}
            </span>
          </div>

          {!isDefault && (
            <button
              type="button"
              onClick={resetFontScale}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1 rounded-lg hover:bg-surface-3 cursor-pointer"
              title="Reset to 100% standard font size"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Range Slider Track */}
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setFontScale(Math.max(MIN_FONT_SCALE, fontScale - 10))}
              disabled={fontScale <= MIN_FONT_SCALE}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer"
              aria-label="Decrease font size"
            >
              <span className="font-serif font-bold text-xs">A</span>
            </button>

            <div className="relative flex-1 flex items-center">
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
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer"
              aria-label="Increase font size"
            >
              <span className="font-serif font-black text-lg">A</span>
            </button>
          </div>

          {/* Three Choice Buttons */}
          <div className="flex items-center justify-between px-2 pt-2 gap-2">
            {FONT_SCALE_STEPS.map((step) => {
              const isSelected = fontScale === step;
              const label =
                step === 100
                  ? "Standard (100%)"
                  : step === 110
                  ? "Comfortable (110%)"
                  : "Extra Large (120%)";
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => setFontScale(step)}
                  className={cn(
                    "flex-1 text-center py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
                    isSelected
                      ? "bg-card text-foreground font-bold shadow-sm border-primary/40 text-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-surface-3"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Readability Preview Box */}
      {showPreview && (
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 transition-all duration-300">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Type className="size-3.5 text-primary" />
              Live Readability Preview
            </span>
            <span className="text-xs font-mono text-primary font-bold">
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
