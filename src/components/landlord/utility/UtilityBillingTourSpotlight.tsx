"use client";

import React from "react";
import { ArrowRight, ArrowLeft, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UtilityTourStep {
    id: number;
    title: string;
    description: string;
    targetTab?: "readings" | "rates";
    targetElementLabel: string;
    tip?: string;
}

export const TOUR_STEPS: UtilityTourStep[] = [
    {
        id: 1,
        title: "Step 1: Set Electric & Water Rates",
        description: "Click the Electricity & Water Rates tab to set your standard electric (₱/kWh) and water (₱/m³) rates, or choose if utilities are already included in the rent.",
        targetTab: "rates",
        targetElementLabel: "Electricity & Water Rates Tab",
        tip: "If utilities are already included in your monthly rent, you can set rates to zero or choose 'Included in Rent'.",
    },
    {
        id: 2,
        title: "Step 2: Enter Room Meter Readings",
        description: "In the Meter Readings tab, enter current meter numbers for occupied rooms. iReside remembers previous readings and calculates monthly usage automatically.",
        targetTab: "readings",
        targetElementLabel: "Save Readings Button",
        tip: "You can click 'Save Readings' at any time while checking rooms without sending bills yet.",
    },
    {
        id: 3,
        title: "Step 3: Send Monthly Bills to Tenants",
        description: "When readings are recorded for the month, click 'Send Monthly Bills'. Your tenants receive transparent, itemized receipts showing their rent and exact utility usage.",
        targetTab: "readings",
        targetElementLabel: "Send Monthly Bills Button",
        tip: "Tenants receive easy-to-read receipts with exact meter numbers and charges.",
    },
];

export interface UtilityBillingTourSpotlightProps {
    isOpen: boolean;
    currentStepIndex: number;
    onNext: () => void;
    onPrev: () => void;
    onClose: () => void;
    onCompleteStep: () => void;
}

export function UtilityBillingTourSpotlight({
    isOpen,
    currentStepIndex,
    onNext,
    onPrev,
    onClose,
    onCompleteStep,
}: UtilityBillingTourSpotlightProps) {
    if (!isOpen) return null;

    // Defense-in-depth: Never render the tour spotlight card if the utility onboarding modal is open
    if (typeof document !== "undefined" && Boolean(
        document.querySelector('[aria-labelledby="utility-billing-onboarding-title"]') ||
        document.querySelector('[data-ireside-greeting="utility-billing"]')
    )) {
        return null;
    }

    const step = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];
    const isFirst = currentStepIndex === 0;
    const isLast = currentStepIndex === TOUR_STEPS.length - 1;

    return (
        <div 
            className="fixed bottom-6 right-6 z-[250] max-w-[420px] w-full pointer-events-auto"
            role="dialog"
            aria-modal="false"
            aria-labelledby="utility-tour-title"
        >
            <div className="rounded-3xl border border-primary/30 bg-card/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                            {step.id}
                        </span>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                            Tour: Step {step.id} of {TOUR_STEPS.length}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        aria-label="Exit tour"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Target Highlight Beacon Pill */}
                {step.targetElementLabel && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                        <span className="relative flex size-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full size-2 bg-primary"></span>
                        </span>
                        <span className="truncate">Highlighted: {step.targetElementLabel}</span>
                    </div>
                )}

                {/* Content */}
                <div className="space-y-1.5">
                    <h3 id="utility-tour-title" className="text-base font-bold text-foreground tracking-tight">
                        {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                    </p>
                </div>

                {step.tip && (
                    <div className="rounded-xl bg-primary/5 border border-primary/15 p-3 text-xs text-muted-foreground leading-snug">
                        <span className="font-bold text-primary">Note: </span>
                        {step.tip}
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                    <button
                        type="button"
                        onClick={onPrev}
                        disabled={isFirst}
                        className={cn(
                            "h-10 sm:h-11 px-4 rounded-xl border border-border text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all",
                            isFirst ? "opacity-30 cursor-not-allowed" : "hover:bg-muted cursor-pointer"
                        )}
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Back</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {!isLast ? (
                            <button
                                type="button"
                                onClick={onNext}
                                className="h-10 sm:h-11 px-5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                                <span>Next</span>
                                <ArrowRight className="size-3.5" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onCompleteStep}
                                className="h-10 sm:h-11 px-5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-all cursor-pointer shadow-md shadow-primary/25 active:scale-95"
                            >
                                <CheckCircle2 className="size-4" />
                                <span>Complete Step</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
