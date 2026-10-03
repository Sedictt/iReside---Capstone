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
        <div className="hidden lg:flex flex-col items-end select-none">
            <button
                type="button"
                onClick={toggleTimeFormat}
                className="group flex items-baseline gap-1.5 cursor-pointer transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl px-2 py-0.5 -mr-1"
                title={`Click to switch to ${is24Hour ? "12-hour (AM/PM)" : "24-hour"} format`}
                aria-label={`Current time is ${hours}:${minutes}${period ? ` ${period}` : ""}. Click to switch to ${is24Hour ? "12-hour" : "24-hour"} format.`}
            >
                <span className="font-mono text-3xl xl:text-4xl font-black tracking-tight text-foreground tabular-nums group-hover:text-primary transition-colors">
                    {hours}:{minutes}
                </span>
                {period && (
                    <span className="text-sm xl:text-base font-black uppercase tracking-wider text-primary ml-1">
                        {period}
                    </span>
                )}
            </button>
            <div className="flex items-center gap-2 mt-0.5">
                <TimeFormatToggle variant="compact" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                    Local Time
                </span>
            </div>
        </div>
    );
}
