"use client";

import React, { useState, useEffect } from "react";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import { TimeFormatToggle } from "@/components/ui/TimeFormatToggle";
import { cn } from "@/lib/utils";

interface TenantDigitalClockProps {
  className?: string;
  compact?: boolean;
}

export function TenantDigitalClock({ className, compact = false }: TenantDigitalClockProps) {
  const [time, setTime] = useState<Date>(() => new Date());
  const [mounted, setMounted] = useState(false);
  const { is24Hour, formatTimeParts, toggleTimeFormat } = useTimeFormat();

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("h-14 w-36 rounded-2xl bg-muted/20 animate-pulse", className)} />
    );
  }

  const { hours, minutes, period } = formatTimeParts(time);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 select-none", className)}>
        <button
          type="button"
          onClick={toggleTimeFormat}
          className="font-mono text-base font-black text-foreground hover:text-primary transition-colors cursor-pointer"
          title={`Click to switch to ${is24Hour ? "12-hour" : "24-hour"} format`}
        >
          {hours}:{minutes}
          {period && <span className="ml-1 text-xs text-primary">{period}</span>}
        </button>
        <TimeFormatToggle variant="compact" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-end select-none", className)}>
      <button
        type="button"
        onClick={toggleTimeFormat}
        className="group flex items-baseline gap-1.5 cursor-pointer transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl px-1.5 py-0.5"
        title={`Click to switch to ${is24Hour ? "12-hour (AM/PM)" : "24-hour"} format`}
        aria-label={`Current time is ${hours}:${minutes}${period ? ` ${period}` : ""}. Click to switch to ${is24Hour ? "12-hour" : "24-hour"} format.`}
      >
        <span className="font-mono text-3xl sm:text-4xl font-black tracking-tight text-foreground tabular-nums group-hover:text-primary transition-colors">
          {hours}:{minutes}
        </span>
        {period ? (
          <span className="text-sm sm:text-base font-black uppercase tracking-wider text-primary">
            {period}
          </span>
        ) : (
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 bg-muted/40 px-1.5 py-0.5 rounded border border-border/40">
            24H
          </span>
        )}
      </button>
      <div className="mt-1 flex items-center gap-2">
        <TimeFormatToggle variant="compact" />
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">
          Local Time
        </span>
      </div>
    </div>
  );
}
