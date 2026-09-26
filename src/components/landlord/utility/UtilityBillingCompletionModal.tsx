"use client";

import React, { useEffect } from "react";
import { ArrowRight, Compass, CheckCircle2, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface UtilityBillingCompletionModalProps {
    isOpen: boolean;
    onContinueExploring: () => void;
    onProceedToTenants: () => void;
    onReturnToDashboard: () => void;
    propertyName?: string;
}

export function UtilityBillingCompletionModal({
    isOpen,
    onContinueExploring,
    onProceedToTenants,
    onReturnToDashboard,
    propertyName,
}: UtilityBillingCompletionModalProps) {
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
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="utility-completion-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/75 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto"
                onClick={onContinueExploring}
            />

            {/* Modal Dialog */}
            <div
                className={cn(
                    "relative z-[201] w-full max-w-[500px] pointer-events-auto",
                    "rounded-[2.5rem] border border-border/80 bg-card/98 dark:bg-zinc-900/98 text-foreground shadow-2xl",
                    "p-7 sm:p-9 space-y-6 animate-in zoom-in-95 fade-in duration-300"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Badge & Icon */}
                <div className="flex items-center gap-3">
                    <div className="flex size-13 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm shrink-0">
                        <CheckCircle2 className="size-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
                            Billing Rails Configured
                        </span>
                        <h2
                            id="utility-completion-title"
                            className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-foreground"
                        >
                            Utility Billing Ready
                        </h2>
                    </div>
                </div>

                {/* Subtext */}
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Your utility tariffs and billing settings have been configured
                    {propertyName ? <> for <span className="font-bold text-foreground">{propertyName}</span></> : ""}.
                    Next up in onboarding: Configure your tenants and assign them to units to activate lease tracking and automated invoices.
                </p>

                {/* Choice Actions */}
                <div className="flex w-full flex-col gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={onProceedToTenants}
                        className="w-full group inline-flex items-center justify-center gap-2 h-12 px-5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-md shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <span>Proceed to Tenant Setup</span>
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </button>

                    <div className="flex w-full flex-col-reverse sm:flex-row gap-2.5">
                        <button
                            type="button"
                            onClick={onContinueExploring}
                            className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-xs font-semibold bg-muted/70 hover:bg-muted text-foreground border border-border/70 transition-all cursor-pointer active:scale-[0.98]"
                        >
                            <Compass className="size-3.5" />
                            <span>Continue Exploring</span>
                        </button>
                        <button
                            type="button"
                            onClick={onReturnToDashboard}
                            className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-xs font-semibold bg-muted/70 hover:bg-muted text-foreground border border-border/70 transition-all cursor-pointer active:scale-[0.98]"
                        >
                            <LayoutDashboard className="size-3.5" />
                            <span>Dashboard</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
