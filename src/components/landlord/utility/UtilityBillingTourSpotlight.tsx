"use client";

import React from "react";
import { Zap, Settings2, Send, ArrowRight, ArrowLeft, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UtilityTourStep {
    id: number;
    title: string;
    description: string;
    targetTab?: "readings" | "rates";
    tip?: string;
}

const TOUR_STEPS: UtilityTourStep[] = [
    {
        id: 1,
        title: "Step 1: Configure Utility Rates",
        description: "Click the Utility Rates tab to configure your property's electricity (₱/kWh) and water (₱/m³) tariffs. You can also customize individual unit rates if specific rooms have higher baseline consumption.",
        targetTab: "rates",
        tip: "Pro-tip: If utilities are already included in your flat rent, keep the default rates or set them to zero.",
    },
    {
        id: 2,
        title: "Step 2: Log Room Submeters",
        description: "In the Meter Readings tab, enter the current meter values for each room. iReside automatically carries over the previous readings month-to-month and calculates the exact consumption delta.",
        targetTab: "readings",
        tip: "Pro-tip: You can click 'Save Draft' at any time while walking the building without issuing bills.",
    },
    {
        id: 3,
        title: "Step 3: Post & Bill Monthly Invoices",
        description: "When readings are recorded for your billing cycle, click 'Post & Bill Invoices'. iReside bundles the base rent and submeter totals into itemized digital invoices sent to your residents.",
        targetTab: "readings",
        tip: "Tenants receive transparent breakdown receipts showing previous and current meter numbers.",
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

    const step = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];
    const isFirst = currentStepIndex === 0;
    const isLast = currentStepIndex === TOUR_STEPS.length - 1;

    return (
        <div 
            className="fixed bottom-6 right-6 z-[250] max-w-[420px] w-full"
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
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            Tour: Step {step.id} of {TOUR_STEPS.length}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        aria-label="Exit tour"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                    <h3 id="utility-tour-title" className="text-base font-bold text-foreground tracking-tight">
                        {step.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {step.description}
                    </p>
                </div>

                {step.tip && (
                    <div className="rounded-xl bg-primary/5 border border-primary/15 p-2.5 text-[11px] text-muted-foreground leading-snug">
                        <span className="font-semibold text-primary">Note: </span>
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
                            "h-9 px-3 rounded-xl border border-border text-xs font-semibold flex items-center gap-1.5 transition-all",
                            isFirst ? "opacity-30 cursor-not-allowed" : "hover:bg-muted cursor-pointer"
                        )}
                    >
                        <ArrowLeft className="size-3" />
                        <span>Back</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {!isLast ? (
                            <button
                                type="button"
                                onClick={onNext}
                                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
                            >
                                <span>Next</span>
                                <ArrowRight className="size-3" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onCompleteStep}
                                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-all cursor-pointer shadow-md shadow-primary/25"
                            >
                                <CheckCircle2 className="size-3.5" />
                                <span>Complete Step</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
