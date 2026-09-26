"use client";

import React, { useEffect } from "react";
import { ArrowRight, Compass, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnitMapExploreOrReturnModalProps {
    isOpen: boolean;
    onReturnToDashboard: () => void;
    onContinueExploring: () => void;
    onProceedToBilling?: () => void;
    isDark?: boolean;
    propertyName?: string;
}

export function UnitMapExploreOrReturnModal({
    isOpen,
    onReturnToDashboard,
    onContinueExploring,
    onProceedToBilling,
    isDark = false,
    propertyName,
}: UnitMapExploreOrReturnModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onContinueExploring();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onContinueExploring]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="explore-or-return-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto"
                onClick={onContinueExploring}
            />

            {/* Modal Dialog */}
            <div
                className={cn(
                    "relative z-[151] w-full max-w-[500px] pointer-events-auto",
                    "rounded-[2rem] border shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 fade-in duration-300",
                    isDark
                        ? "border-zinc-800 bg-zinc-900/98 text-white shadow-black/60"
                        : "border-border/80 bg-card/98 text-zinc-900 shadow-xl"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Badge & Icon */}
                <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm shrink-0">
                        <CheckCircle2 className="size-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
                            Layout Saved
                        </span>
                        <h2
                            id="explore-or-return-title"
                            className="text-xl sm:text-2xl font-black tracking-tight leading-tight"
                        >
                            Unit Map Ready
                        </h2>
                    </div>
                </div>

                {/* Subtext */}
                <p className={cn("text-xs sm:text-sm leading-relaxed", isDark ? "text-zinc-300" : "text-zinc-600")}>
                    Your units and hallways have been organized on the canvas
                    {propertyName ? <> for <span className="font-bold">{propertyName}</span></> : ""}.
                    Next up in onboarding: Configure your payment channels (GCash) and utility tariffs so your invoices and leases are ready.
                </p>

                {/* Choice Actions */}
                <div className="flex w-full flex-col gap-2.5 pt-2">
                    {onProceedToBilling ? (
                        <button
                            type="button"
                            onClick={onProceedToBilling}
                            className="w-full group inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <span>Set Up Billing & Utilities</span>
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    ) : null}

                    <div className="flex w-full flex-col-reverse sm:flex-row gap-2.5">
                        <button
                            type="button"
                            onClick={onContinueExploring}
                            className={cn(
                                "flex-1 inline-flex items-center justify-center gap-2 h-10 sm:h-11 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-[0.98]",
                                isDark
                                    ? "bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60"
                                    : "bg-muted/70 hover:bg-muted text-zinc-700 hover:text-zinc-950 border border-border/70"
                            )}
                        >
                            <Compass className="size-3.5" />
                            <span>Continue Exploring Map</span>
                        </button>

                        <button
                            type="button"
                            onClick={onReturnToDashboard}
                            className={cn(
                                "flex-1 group inline-flex items-center justify-center gap-2 h-10 sm:h-11 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer active:scale-[0.98]",
                                onProceedToBilling
                                    ? isDark
                                        ? "bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                                        : "bg-background hover:bg-muted/80 text-zinc-700 border border-border/70"
                                    : "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:brightness-105"
                            )}
                        >
                            <span>Return to Dashboard</span>
                            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </div>

                {/* Footer hint */}
                <p className={cn("text-center text-[11px]", isDark ? "text-zinc-500" : "text-zinc-400")}>
                    You can return to the dashboard anytime using the navigation menu.
                </p>
            </div>
        </div>
    );
}
