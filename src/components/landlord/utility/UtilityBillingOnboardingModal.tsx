"use client";

import React from "react";
import { Zap, Droplets, CheckCircle2, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UtilityBillingOnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartTour: () => void;
    propertyName?: string;
}

export function UtilityBillingOnboardingModal({
    isOpen,
    onClose,
    onStartTour,
    propertyName,
}: UtilityBillingOnboardingModalProps) {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="utility-onboarding-modal-title"
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto" 
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div 
                className={cn(
                    "relative z-[201] w-full max-w-[540px] pointer-events-auto",
                    "rounded-[2.5rem] border border-border/80 bg-card/98 dark:bg-zinc-900/98 backdrop-blur-2xl shadow-2xl",
                    "p-7 sm:p-10 space-y-6",
                    "animate-in zoom-in-95 fade-in duration-300"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Icon */}
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                    <Zap className="size-7" />
                </div>

                {/* Headings */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                            Step 3 of Onboarding
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Financial &amp; Utility Rails
                        </span>
                    </div>
                    <h1 id="utility-onboarding-modal-title" className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-tight">
                        Set Up Utility Billing
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Configure electricity and water tariffs{propertyName ? <> for <span className="font-bold text-foreground">{propertyName}</span></> : ""} to prepare automated monthly invoicing. Baseline rates ensure all resident statements are itemized transparently.
                    </p>
                </div>

                {/* 3 Clean Feature Steps Overview */}
                <div className="space-y-2.5 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 border border-primary/20">
                            <Zap className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-foreground">
                                1. Tariff Configuration
                            </h3>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Set default electricity (₱/kWh) and water (₱/m³) rates, or retain flat zero-cost rates if rent is all-inclusive.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 border border-primary/20">
                            <Droplets className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-foreground">
                                2. Submeter Readings
                            </h3>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Enter baseline room meter numbers. iReside automatically calculates monthly consumption deltas.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 border border-primary/20">
                            <CheckCircle2 className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-foreground">
                                3. Automated Invoicing
                            </h3>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Post monthly utility bills directly into resident receipts alongside room rent with itemized breakdown.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col-reverse sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 inline-flex items-center justify-center h-12 px-5 rounded-2xl border border-border/80 bg-background hover:bg-muted text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-98"
                    >
                        Maybe Later
                    </button>
                    <button
                        type="button"
                        onClick={onStartTour}
                        className="group flex-1 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-105 transition-all cursor-pointer active:scale-98"
                    >
                        <span>Start Guided Setup</span>
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </div>
        </div>
    );
}
