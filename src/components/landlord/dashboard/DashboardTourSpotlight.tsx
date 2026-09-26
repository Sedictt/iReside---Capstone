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
        title: "Step 1: Operational Action Launchpad",
        description: "Execute daily high-frequency operations in one click. Record cash or offline rent collections, onboard walk-in tenants, generate self-onboarding invite links, or download printable QR flyers.",
        targetTourId: "tour-quick-actions",
        targetElementLabel: "Quick Action Launchpad (New Application, Collect Payment, Invite Link, Flyer)",
        tip: "Pro-tip: Cash payments recorded here instantly credit tenant balances and issue digital receipts.",
    },
    {
        id: 2,
        title: "Step 2: Real-Time Command Pulse",
        description: "Keep your finger on your portfolio's pulse. Tap any status card to immediately inspect overdue settlements, review vacant units, or view pending prospective tenant applications.",
        targetTourId: "tour-command-center",
        targetElementLabel: "Command Center Pulse (Overdue, Near Due, Vacant Units, Active Invites)",
        tip: "Clicking 'Overdue Settlements' opens direct tenant messaging options to send payment follow-ups.",
    },
    {
        id: 3,
        title: "Step 3: Revenue Stream & Direct Settlement",
        description: "Track inbound rent payments and monthly target progress. Inspect tenant proof of payment, verify GCash reference numbers, and complete settlement acknowledgement in real-time.",
        targetTourId: "tour-cash-flow",
        targetElementLabel: "Cash Flow Ledger & Recent Payment Feed",
        tip: "Tenants receive automated payment confirmations once you acknowledge their payment record.",
    },
    {
        id: 4,
        title: "Step 4: Portfolio Switcher & Operations Hub",
        description: "Seamlessly switch between properties across your portfolio at any time. Use the sidebar to jump into your 2D Visual Map, Utility Billing, Tenant Hub, or Digital Lease Agreements.",
        targetTourId: "tour-dashboard-navigation",
        targetElementLabel: "Property Selector & Navigation Bar",
        tip: "All analytics, payment trackers, and room occupancy instantly recalculate when switching properties.",
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
