"use client";

import React, { useState, useEffect } from "react";
import { 
    Users, 
    UserPlus, 
    ArrowRight, 
    ArrowLeft, 
    Clock, 
    CheckCircle2, 
    Share2, 
    DoorOpen,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TenantSetupPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectReusableLink: () => void;
    onSelectAddManually?: () => void;
    onSelectQuickAdd?: () => void;
    onSelectWalkIn?: () => void;
    onMaybeLater: () => void;
    propertyName?: string;
}

export function TenantSetupPromptModal({
    isOpen,
    onClose,
    onSelectReusableLink,
    onSelectAddManually,
    onSelectQuickAdd,
    onSelectWalkIn,
    onMaybeLater,
    propertyName,
}: TenantSetupPromptModalProps) {
    const [step, setStep] = useState<"inquire" | "choose_method">("inquire");

    // Reset step when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep("inquire");
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                if (step === "choose_method") {
                    setStep("inquire");
                } else {
                    onMaybeLater();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, step, onMaybeLater]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tenant-setup-modal-title"
            aria-describedby="tenant-setup-modal-desc"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto"
                onClick={step === "inquire" ? onMaybeLater : onClose}
            />

            {/* Modal Container */}
            <div
                className={cn(
                    "relative z-[151] w-full max-w-[580px] max-h-[90vh] overflow-y-auto pointer-events-auto",
                    "rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl",
                    "p-6 sm:p-8 space-y-6 animate-in zoom-in-95 fade-in duration-200"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Dismiss Button */}
                <button
                    type="button"
                    onClick={step === "inquire" ? onMaybeLater : onClose}
                    aria-label="Close dialog"
                    className="absolute top-5 right-5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <X className="size-4" />
                </button>

                {/* Step 1: Initial Inquiry */}
                {step === "inquire" && (
                    <div className="space-y-6">
                        {/* Header: Icon & Step Badge */}
                        <div className="flex items-center justify-between pr-8">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                                <Users className="size-6" />
                            </div>
                            <span className="inline-flex items-center text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/25">
                                Step 3 of Onboarding
                            </span>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-2">
                            <h2
                                id="tenant-setup-modal-title"
                                className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-tight"
                            >
                                Configure Your Tenants
                            </h2>
                            <p id="tenant-setup-modal-desc" className="text-sm text-muted-foreground leading-relaxed">
                                Your unit map{propertyName ? <> for <span className="font-semibold text-foreground">{propertyName}</span></> : ""} is ready! Do you want to configure your tenants and add them to the system now?
                            </p>
                        </div>

                        {/* Benefits checklist */}
                        <div className="rounded-2xl border border-border/70 bg-muted/30 dark:bg-muted/10 p-4 sm:p-5 space-y-3">
                            <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-foreground">
                                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                <span>Assign residents to vacant units</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-foreground">
                                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                <span>Enable digital rent collection & invoices</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-foreground">
                                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                <span>Track active leases & emergency contacts</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex w-full flex-col-reverse sm:flex-row gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onMaybeLater}
                                className="flex-1 inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <Clock className="size-4" />
                                <span>Maybe Later</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep("choose_method")}
                                className="flex-1 group inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            >
                                <span>Yes, Configure Tenants</span>
                                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Choose Method ("Yes" Selected) */}
                {step === "choose_method" && (
                    <div className="space-y-6">
                        {/* Header: Back & Step Indicator */}
                        <div className="flex items-center justify-between pr-8">
                            <button
                                type="button"
                                onClick={() => setStep("inquire")}
                                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1 px-2 -ml-2 rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <ArrowLeft className="size-4" />
                                <span>Back</span>
                            </button>
                            <span className="text-xs font-semibold text-primary">
                                Setup Method
                            </span>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1.5">
                            <h2
                                id="tenant-setup-modal-title"
                                className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-tight"
                            >
                                How would you like to add tenants?
                            </h2>
                            <p id="tenant-setup-modal-desc" className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Choose the onboarding mode that best fits your workflow.
                            </p>
                        </div>

                        {/* Method Cards */}
                        <div className="grid grid-cols-1 gap-3.5 pt-1">
                            {/* Option 1: Quick Add (Add Tenants Manually) */}
                            <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-4">
                                <div className="flex items-start gap-3.5 sm:gap-4">
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                                        <UserPlus className="size-5" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <h3 className="text-sm font-bold text-foreground">
                                                Add Tenants Manually
                                            </h3>
                                            <span className="inline-flex text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                                                Quick Add / Existing Leases
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Quickly add existing residents who are already living in your property before adopting iReside:
                                        </p>
                                    </div>
                                </div>

                                {/* Step-by-Step Guidance */}
                                <div className="rounded-xl border border-border/70 bg-background/70 p-3.5 sm:p-4 space-y-2 text-xs text-muted-foreground">
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] shrink-0 mt-0.5">
                                            1
                                        </span>
                                        <span className="leading-snug">
                                            <strong className="text-foreground">Select Unit:</strong> Pick which vacant unit this resident will occupy.
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] shrink-0 mt-0.5">
                                            2
                                        </span>
                                        <span className="leading-snug">
                                            <strong className="text-foreground">Resident Info:</strong> Provide their full legal name, email, and phone number.
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] shrink-0 mt-0.5">
                                            3
                                        </span>
                                        <span className="leading-snug">
                                            <strong className="text-foreground">Lease Terms:</strong> Confirm the monthly rent, security deposit, and lease start date.
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (onSelectQuickAdd) {
                                            onSelectQuickAdd();
                                        } else if (onSelectAddManually) {
                                            onSelectAddManually();
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    <UserPlus className="size-4" />
                                    <span>Open Manual Resident Form</span>
                                </button>
                            </div>

                            {/* Option 2: Reusable Invite Link */}
                            <button
                                type="button"
                                onClick={onSelectReusableLink}
                                className="group w-full text-left rounded-2xl border border-border/80 hover:border-primary/50 bg-muted/20 hover:bg-primary/5 p-4 sm:p-5 transition-all cursor-pointer shadow-2xs hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <div className="flex items-start gap-3.5 sm:gap-4">
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0 group-hover:scale-105 transition-transform">
                                        <Share2 className="size-5" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                                Invite via Reusable Link
                                            </h3>
                                            <span className="inline-flex text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                                                Remote Onboarding
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Generate a single reusable link or QR code to share with a single user or post in a group chat (Messenger, Viber, WhatsApp). Tenants can complete the application and onboarding process remotely from their own devices.
                                        </p>
                                        <div className="flex items-center gap-1.5 pt-0.5 text-xs font-semibold text-primary">
                                            <span>Generate and share link</span>
                                            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {/* Option 3: Walk-in Application */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (onSelectWalkIn) {
                                        onSelectWalkIn();
                                    } else if (onSelectAddManually) {
                                        onSelectAddManually();
                                    }
                                }}
                                className="group w-full text-left rounded-2xl border border-border/80 hover:border-emerald-500/50 bg-muted/20 hover:bg-emerald-500/5 p-4 sm:p-5 transition-all cursor-pointer shadow-2xs hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            >
                                <div className="flex items-start gap-3.5 sm:gap-4">
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
                                        <DoorOpen className="size-5" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <h3 className="text-sm font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                                                Walk-in Application
                                            </h3>
                                            <span className="inline-flex text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                                In-Person Leasing
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Process prospective walk-in applicants on-site with live document verification, instant digital contract signing, and downpayment recording.
                                        </p>
                                        <div className="flex items-center gap-1.5 pt-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                            <span>Start in-person intake</span>
                                            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
