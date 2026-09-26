"use client";

import React, { useEffect } from "react";
import { ArrowRight, ArrowLeft, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardTourStep {
    id: number;
    title: string;
    description: string;
    targetTourId: string;
    targetElementLabel: string;
    tip?: string;
}

export const DASHBOARD_TOUR_STEPS: DashboardTourStep[] = [
    {
        id: 1,
        title: "Step 1: Quick Actions",
        description: "Launch everyday landlord workflows in one tap. Accept walk-in applications, record in-person rent collections, generate tenant invite links, print lobby QR posters, and open maintenance requests.",
        targetTourId: "tour-quick-actions",
        targetElementLabel: "Quick Actions (New Application, Collect Payment, Invite Link, Flyer)",
        tip: "Pro-tip: In-person cash collections recorded here immediately update tenant balances and issue digital receipts.",
    },
    {
        id: 2,
        title: "Step 2: Intelligence Hub",
        description: "Orchestrate your property ecosystem from one central command center. Monitor real-time overdue and near-due payments, inspect vacant units, track pending invites, and execute prioritized operational moves.",
        targetTourId: "tour-command-center",
        targetElementLabel: "Intelligence Hub (Overdue, Near Due, Vacant Units, Active Invites)",
        tip: "Clicking any stat pill instantly opens filtered management views and tenant follow-up tools.",
    },
    {
        id: 3,
        title: "Step 3: Cash Flow Ledger",
        description: "Track incoming and outgoing rental cash flows. Inspect tenant payment proofs, review past due balances, check rent due in the next 7 days, and acknowledge verified settlements.",
        targetTourId: "tour-cash-flow",
        targetElementLabel: "Cash Flow Ledger (Past Due Rent, Due in Next 7 Days, Recently Paid)",
        tip: "Tenants receive automated SMS and in-app payment confirmations as soon as you acknowledge their receipt.",
    },
    {
        id: 4,
        title: "Step 4: Property Selector & Navigation",
        description: "Seamlessly switch between properties across your portfolio at any time. Use the sidebar and omni-search to jump into your 2D Unit Map, Utility Billing, Tenant Directory, or Financial Invoices.",
        targetTourId: "tour-dashboard-navigation",
        targetElementLabel: "Property Selector & Navigation (Sidebar & Header Search)",
        tip: "All financial summaries, room occupancies, and alerts instantly update when switching active properties.",
    },
];

export interface DashboardTourSpotlightProps {
    isOpen: boolean;
    currentStepIndex: number;
    onNext: () => void;
    onPrev: () => void;
    onClose: () => void;
    onCompleteTour: () => void;
}

export function DashboardTourSpotlight({
    isOpen,
    currentStepIndex,
    onNext,
    onPrev,
    onClose,
    onCompleteTour,
}: DashboardTourSpotlightProps) {
    const step = DASHBOARD_TOUR_STEPS[currentStepIndex] || DASHBOARD_TOUR_STEPS[0];
    const isFirst = currentStepIndex === 0;
    const isLast = currentStepIndex === DASHBOARD_TOUR_STEPS.length - 1;

    // Auto-scroll target element into view smoothly when step changes
    useEffect(() => {
        if (!isOpen) return;
        const target = document.querySelector(`[data-tour-id="${step.targetTourId}"]`) ||
            (step.targetTourId === "tour-quick-actions" ? document.querySelector('[data-tour-id="tour-quick-actions-mobile"]') : null);
        if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [isOpen, step.targetTourId]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed bottom-6 right-6 z-[250] max-w-[420px] w-full pointer-events-auto"
            role="dialog"
            aria-modal="false"
            aria-labelledby="dashboard-tour-title"
        >
            <div className="rounded-3xl border border-primary/30 bg-card/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                            {step.id}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            Tour: Step {step.id} of {DASHBOARD_TOUR_STEPS.length}
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

                {/* Target Highlight Beacon Pill */}
                {step.targetElementLabel && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary">
                        <span className="relative flex size-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full size-2 bg-primary"></span>
                        </span>
                        <span className="truncate">Highlighted: {step.targetElementLabel}</span>
                    </div>
                )}

                {/* Body Content */}
                <div className="space-y-1.5">
                    <h3 id="dashboard-tour-title" className="text-base font-black text-foreground">
                        {step.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {step.description}
                    </p>
                </div>

                {/* Helpful Tip */}
                {step.tip && (
                    <div className="rounded-xl bg-muted/40 border border-border/50 p-2.5 text-[11px] text-muted-foreground italic">
                        {step.tip}
                    </div>
                )}

                {/* Navigation Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <button
                        type="button"
                        onClick={onPrev}
                        disabled={isFirst}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                            isFirst 
                                ? "opacity-40 cursor-not-allowed text-muted-foreground" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer active:scale-95"
                        )}
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-1">
                        {DASHBOARD_TOUR_STEPS.map((s, idx) => (
                            <span
                                key={s.id}
                                className={cn(
                                    "size-1.5 rounded-full transition-all duration-300",
                                    idx === currentStepIndex 
                                        ? "w-4 bg-primary" 
                                        : "bg-muted-foreground/30"
                                )}
                            />
                        ))}
                    </div>

                    {isLast ? (
                        <button
                            type="button"
                            onClick={onCompleteTour}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:brightness-105 transition-all cursor-pointer active:scale-95"
                        >
                            <span>Finish Tour</span>
                            <CheckCircle2 className="size-3.5" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onNext}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:brightness-105 transition-all cursor-pointer active:scale-95"
                        >
                            <span>Next</span>
                            <ArrowRight className="size-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
