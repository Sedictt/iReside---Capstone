"use client";

import React from "react";

interface DashboardDigitalClockProps {
    time: Date;
}

export function DashboardDigitalClock({ time }: DashboardDigitalClockProps) {
    return (
        <div className="hidden lg:flex flex-col items-end mt-16 self-center">
            <div className="flex items-baseline gap-2">
                <span className="font-mono text-7xl font-black tracking-tighter text-foreground tabular-nums">
                    {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
                </span>
                <span className="text-2xl font-black uppercase tracking-[0.2em] text-primary">
                    {time.getHours() >= 12 ? 'PM' : 'AM'}
                </span>
            </div>
            <div className="mt-2 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">
                Local Operation Time
            </div>
        </div>
    );
}
