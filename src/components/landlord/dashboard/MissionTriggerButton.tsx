"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Check, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    getOverallQuestProgress,
    type LandlordProductTourState
} from "@/lib/landlord-product-tour";
import { useLanguage } from "@/hooks/useLanguage";

interface MissionTriggerButtonProps {
    onOpen: () => void;
    className?: string;
}

export function MissionTriggerButton({ onOpen, className }: MissionTriggerButtonProps) {
    const { isFilipino } = useLanguage();
    const [state, setState] = useState<LandlordProductTourState | null>(null);

    const fetchState = useCallback(async () => {
        try {
            const res = await fetch("/api/landlord/tour?start=0");
            if (res.ok) {
                const data = await res.json();
                if (data?.state) {
                    setState(data.state);
                }
            }
        } catch {
            // Silently ignore network failures for background status
        }
    }, []);

    useEffect(() => {
        fetchState();

        const handleRefresh = () => {
            fetchState();
        };

        window.addEventListener("open-quest-board", handleRefresh);
        window.addEventListener("quest-progress-updated", handleRefresh);
        window.addEventListener("focus", handleRefresh);

        return () => {
            window.removeEventListener("open-quest-board", handleRefresh);
            window.removeEventListener("quest-progress-updated", handleRefresh);
            window.removeEventListener("focus", handleRefresh);
        };
    }, [fetchState]);

    const progress = getOverallQuestProgress(state);
    const isCompleted = progress === 100;
    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

    const labelText = isCompleted
        ? (isFilipino ? "Kumpleto na ang Setup (100%)" : "Setup Complete (100%)")
        : (isFilipino ? `Gabay sa Setup (${progress}% Tapos Na)` : `Setup Guide (${progress}% Done)`);

    return (
        <button
            type="button"
            onClick={onOpen}
            data-tour-id="tour-quest-trigger"
            aria-label={labelText}
            className={cn(
                "relative group flex size-10 sm:size-11 items-center justify-center rounded-xl sm:rounded-2xl neumorphic-extruded active:scale-95 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer shrink-0 transition-all",
                isCompleted && "ring-1 ring-emerald-500/30",
                className
            )}
            title={labelText}
        >
            <div className="relative flex size-8 items-center justify-center">
                {/* SVG Radial Progress Meter */}
                <svg className="size-8 -rotate-90 transform" viewBox="0 0 36 36">
                    {/* Background Ring Track */}
                    <circle
                        cx="18"
                        cy="18"
                        r={radius}
                        fill="none"
                        strokeWidth="3.2"
                        className="stroke-muted/30 dark:stroke-white/10"
                    />
                    {/* Active Progress Ring */}
                    <circle
                        cx="18"
                        cy="18"
                        r={radius}
                        fill="none"
                        strokeWidth="3.2"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className={cn(
                            "transition-all duration-700 ease-out",
                            isCompleted 
                                ? "stroke-emerald-500" 
                                : "stroke-primary"
                        )}
                    />
                </svg>

                {/* Center Value / Status */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {isCompleted ? (
                        <Check className="size-3.5 stroke-[3] text-emerald-500 transition-transform group-hover:scale-110" />
                    ) : progress > 0 ? (
                        <span className="font-mono text-[9px] font-black text-foreground group-hover:text-primary transition-colors tracking-tighter tabular-nums select-none">
                            {progress}%
                        </span>
                    ) : (
                        <Compass className="size-3.5 text-primary transition-transform group-hover:scale-110" />
                    )}
                </div>
            </div>

            {/* Accessible Hover Tooltip */}
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 scale-0 px-2.5 py-1 rounded-lg bg-popover text-[10px] font-bold text-popover-foreground opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all whitespace-nowrap border border-border shadow-xl pointer-events-none z-50">
                {labelText}
            </span>
        </button>
    );
}
