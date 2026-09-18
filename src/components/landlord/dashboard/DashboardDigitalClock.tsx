"use client";

import React from "react";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import { TimeFormatToggle } from "@/components/ui/TimeFormatToggle";

interface DashboardDigitalClockProps {
    time: Date;
}

export function DashboardDigitalClock({ time }: DashboardDigitalClockProps) {
    const { is24Hour, formatTimeParts, toggleTimeFormat } = useTimeFormat();
    const { hours, minutes, period } = formatTimeParts(time);

    return (
        <div className="hidden lg:flex flex-col items-end mt-16 self-center select-none">
            <button
                type="button"
                onClick={toggleTimeFormat}
                className="group flex items-baseline gap-2 cursor-pointer transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl px-2 py-1 -mr-2"
                title={`Click to switch to ${is24Hour ? "12-hour (AM/PM)" : "24-hour"} format`}
                aria-label={`Current time is ${hours}:${minutes}${period ? ` ${period}` : ""}. Click to switch to ${is24Hour ? "12-hour" : "24-hour"} format.`}
            >
                <span className="font-mono text-7xl font-black tracking-tighter text-foreground tabular-nums group-hover:text-primary transition-colors">
                    {hours}:{minutes}
                </span>
                {period ? (
                    <span className="text-2xl font-black uppercase tracking-[0.2em] text-primary">
                        {period}
                    </span>
                ) : (
                    <span className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70 bg-muted/40 px-2 py-0.5 rounded-md border border-border/40">
                        24H
                    </span>
                )}
            </button>
            <div className="mt-2 flex items-center gap-2">
                <TimeFormatToggle variant="compact" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                    Local Operation Time
                </span>
            </div>
        </div>
    );
}
