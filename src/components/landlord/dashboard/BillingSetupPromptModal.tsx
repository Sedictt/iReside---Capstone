"use client";

import React, { useEffect } from "react";
import { Zap, ArrowRight, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BillingSetupPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfigureNow: () => void;
    onMaybeLater: () => void;
    propertyName?: string;
}

export function BillingSetupPromptModal({
    isOpen,
    onClose,
    onConfigureNow,
    onMaybeLater,
    propertyName,
}: BillingSetupPromptModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onMaybeLater();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onMaybeLater]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="billing-setup-modal-title"
            aria-describedby="billing-setup-modal-desc"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto"
                onClick={onMaybeLater}
            />

            {/* Modal Container */}
            <div
                className={cn(
                    "relative z-[151] w-full max-w-[560px] max-h-[90vh] overflow-y-auto pointer-events-auto",
                    "rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl",
                    "p-6 sm:p-8 space-y-6 animate-in zoom-in-95 fade-in duration-200"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Dismiss Button */}
                <button
                    type="button"
                    onClick={onMaybeLater}
                    aria-label="Close dialog"
                    className="absolute top-5 right-5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <X className="size-4" />
                </button>

                <div className="space-y-6">
                    {/* Header: Icon & Step Badge */}
                    <div className="flex items-center justify-between pr-8">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                            <Zap className="size-6" />
                        </div>
                        <span className="inline-flex items-center text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/25">
                            Step 3 of Onboarding
                        </span>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-2">
                        <h2
                            id="billing-setup-modal-title"
                            className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-tight"
                        >
                            Activate Payment &amp; Utility Rails
                        </h2>
                        <p id="billing-setup-modal-desc" className="text-sm text-muted-foreground leading-relaxed">
                            Your unit map{propertyName ? <> for <span className="font-semibold text-foreground">{propertyName}</span></> : ""} is ready! Now let&apos;s set up your electricity and water tariffs to prepare for automated billing.
                        </p>
                    </div>

                    {/* Benefits checklist */}
                    <div className="rounded-2xl border border-border/70 bg-muted/30 dark:bg-muted/10 p-4 sm:p-5 space-y-3">
                        <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-foreground">
                            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                            <span>Set baseline electricity (₱/kWh) and water (₱/m³) tariffs</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-foreground">
                            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                            <span>Record room submeters with automatic month-to-month deltas</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-foreground">
                            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                            <span>Enable digital invoices combining room rent and utilities</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex w-full flex-col-reverse sm:flex-row gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onMaybeLater}
                            className="flex-1 inline-flex items-center justify-center h-12 px-5 rounded-2xl border border-border/80 bg-background hover:bg-muted text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-98"
                        >
                            Maybe Later
                        </button>
                        <button
                            type="button"
                            onClick={onConfigureNow}
                            className="group flex-1 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-105 transition-all cursor-pointer active:scale-98"
                        >
                            <span>Set Up Billing Now</span>
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
