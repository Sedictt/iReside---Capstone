"use client";

import React from "react";
import { 
    Zap, 
    Droplets, 
    Settings2, 
    CheckCircle2, 
    BookOpen, 
    ArrowRight, 
    Check, 
    X,
    FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface UtilityBillingOnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartTour: () => void;
    onGoToRates: () => void;
    onCompleteStep: () => void;
    propertyName?: string;
}

export function UtilityBillingOnboardingModal({
    isOpen,
    onClose,
    onStartTour,
    onGoToRates,
    onCompleteStep,
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
                className="absolute inset-0 bg-black/75 backdrop-blur-md animate-in fade-in duration-200" 
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div 
                className={cn(
                    "relative z-[201] w-full max-w-[620px] pointer-events-auto",
                    "rounded-[2.5rem] border border-border/80 bg-card/98 dark:bg-zinc-900/98 backdrop-blur-2xl shadow-2xl",
                    "p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto",
                    "animate-in zoom-in-95 fade-in duration-200"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-sm">
                            <Zap className="size-6" />
                        </div>
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                                    Step 3 of Onboarding
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    Financial Rails
                                </span>
                            </div>
                            <h2 id="utility-onboarding-modal-title" className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                                Utility & Submeter Billing Setup
                            </h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        aria-label="Close setup modal"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {propertyName ? `For ${propertyName}: ` : ""}
                    Configure how electricity and water are measured and charged. Setting your baseline utility rules now ensures all tenant rent invoices are generated with accurate, transparent itemization.
                </p>

                {/* 3 Core Educational Pillars: What You Can Do, What You Should Do, What You Learn */}
                <div className="space-y-3.5">
                    {/* Pillar 1: What You Can Do */}
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-black text-foreground uppercase tracking-wide">
                            <Zap className="size-3.5 text-primary" />
                            <span>What You Can Do</span>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1.5 pl-5 list-disc leading-relaxed">
                            <li>
                                <strong className="text-foreground">Set Utility Tariffs:</strong> Define property-wide or per-unit rates for Electricity (₱/kWh) and Water (₱/m³) in the <span className="font-semibold text-primary">Utility Rates</span> tab.
                            </li>
                            <li>
                                <strong className="text-foreground">Record Room Submeters:</strong> Log baseline previous and current meter readings per room. Previous numbers roll over automatically each month.
                            </li>
                            <li>
                                <strong className="text-foreground">Automated Invoice Billing:</strong> Click <span className="font-semibold text-primary">Post & Bill Invoices</span> to consolidate room rent and utility consumption into single itemized statements.
                            </li>
                        </ul>
                    </div>

                    {/* Pillar 2: What You Should Do */}
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-black text-foreground uppercase tracking-wide">
                            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>What You Should Do Right Now</span>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1.5 pl-5 list-disc leading-relaxed">
                            <li>
                                Check that default rates match your utility provider bills (e.g. Meralco / local water service).
                            </li>
                            <li>
                                If your rooms have submeters, record the initial meter values so the system can compute monthly usage differences.
                            </li>
                            <li>
                                If rent includes all utilities or you charge fixed rates, you can simply keep defaults and click <strong className="text-foreground">"Confirm & Proceed to Tenants"</strong>.
                            </li>
                        </ul>
                    </div>

                    {/* Pillar 3: What You Learn */}
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-black text-foreground uppercase tracking-wide">
                            <BookOpen className="size-3.5 text-blue-500" />
                            <span>How It Works (What You Learn)</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                            iReside uses the formula: <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] text-foreground font-semibold">Usage = Current Reading - Previous Reading</code>.
                            Calculated consumption is itemized directly on the resident&apos;s digital receipt, eliminating billing disputes.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 px-4 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-center order-3 sm:order-1 cursor-pointer"
                    >
                        Explore Workspace First
                    </button>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 order-1 sm:order-2">
                        <button
                            type="button"
                            onClick={onStartTour}
                            className="h-11 px-4 rounded-xl border border-border/80 bg-background hover:bg-muted text-xs font-bold text-foreground transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                        >
                            <span>Start Guided Tour</span>
                        </button>

                        <button
                            type="button"
                            onClick={onGoToRates}
                            className="h-11 px-4 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                        >
                            <Settings2 className="size-3.5" />
                            <span>Configure Rates Now</span>
                        </button>

                        <button
                            type="button"
                            onClick={onCompleteStep}
                            className="h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/20 active:scale-98"
                        >
                            <span>Confirm & Finish Step</span>
                            <ArrowRight className="size-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
