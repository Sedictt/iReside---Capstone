"use client";

import React, { useState, useEffect } from "react";
import { 
    Users, 
    Link2, 
    UserPlus, 
    ArrowRight, 
    ArrowLeft, 
    Clock, 
    CheckCircle2, 
    Share2, 
    FileText, 
    X,
    MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TenantSetupPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectReusableLink: () => void;
    onSelectAddManually: () => void;
    onMaybeLater: () => void;
    propertyName?: string;
}

export function TenantSetupPromptModal({
    isOpen,
    onClose,
    onSelectReusableLink,
    onSelectAddManually,
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
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/75 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto"
                onClick={step === "inquire" ? onMaybeLater : onClose}
            />

            {/* Modal Container */}
            <div
                className={cn(
                    "relative z-[151] w-full max-w-[620px] pointer-events-auto",
                    "rounded-[2.5rem] border border-border/80 bg-card/98 dark:bg-zinc-900/98 backdrop-blur-2xl shadow-2xl",
                    "p-7 sm:p-10 space-y-6 animate-in zoom-in-95 fade-in duration-300"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Step 1: Initial Inquiry */}
                {step === "inquire" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                                <Users className="size-7" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                Step 3 of Onboarding
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h2
                                id="tenant-setup-modal-title"
                                className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-tight"
                            >
                                Configure Your Tenants
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Your unit map{propertyName ? <> for <span className="font-bold text-foreground">{propertyName}</span></> : ""} is ready! Do you want to configure your tenants and add them to the system now?
                            </p>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5 space-y-3">
                            <div className="flex items-center gap-3 text-xs font-bold text-foreground">
                                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                <span>Assign residents to vacant units</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-foreground">
                                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                <span>Enable digital rent collection & invoices</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-foreground">
                                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                <span>Track active leases & emergency contacts</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep("choose_method")}
                                className="group w-full flex items-center justify-between gap-3 px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                            >
                                <span>Yes, Configure Tenants</span>
                                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                            </button>

                            <button
                                type="button"
                                onClick={onMaybeLater}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-border/70 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-[0.98]"
                            >
                                <Clock className="size-4" />
                                <span>Maybe Later</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Choose Method ("Yes" Selected) */}
                {step === "choose_method" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setStep("inquire")}
                                className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                <ArrowLeft className="size-4" />
                                <span>Back</span>
                            </button>
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                                Setup Method
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h2
                                id="tenant-setup-modal-title"
                                className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-tight"
                            >
                                How would you like to add tenants?
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                You can invite tenants remotely using a reusable link, or enter resident details manually.
                            </p>
                        </div>

                        {/* Method Cards */}
                        <div className="grid grid-cols-1 gap-4 pt-1">
                            {/* Option 1: Reusable Link */}
                            <div
                                onClick={onSelectReusableLink}
                                className="group relative rounded-2xl border border-border/80 hover:border-primary/60 bg-muted/20 hover:bg-primary/5 p-5 transition-all cursor-pointer shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0 group-hover:scale-105 transition-transform">
                                        <Share2 className="size-6" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                                                Invite via Reusable Link
                                            </h3>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                                Remote Onboarding
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Generate a single reusable link or QR code to share with a single user or post in a group chat (Messenger, Viber, WhatsApp). Tenants can complete the application and onboarding process remotely from their own devices.
                                        </p>
                                        <div className="flex items-center gap-1.5 pt-1 text-[11px] font-black text-primary">
                                            <span>Generate and share link</span>
                                            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Option 2: Add Manually */}
                            <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                                        <UserPlus className="size-6" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-black text-foreground">
                                                Add Tenants Manually
                                            </h3>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                In-Person / Direct
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            If you already have resident details or signed physical leases on hand, follow these steps:
                                        </p>
                                    </div>
                                </div>

                                {/* Step-by-Step Guidance */}
                                <div className="rounded-xl border border-border/60 bg-background/60 p-4 space-y-2.5 text-xs text-muted-foreground">
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary font-black text-[10px] shrink-0 mt-0.5">
                                            1
                                        </span>
                                        <span className="leading-snug">
                                            <strong className="text-foreground">Select Unit:</strong> Pick which vacant unit this resident will occupy.
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary font-black text-[10px] shrink-0 mt-0.5">
                                            2
                                        </span>
                                        <span className="leading-snug">
                                            <strong className="text-foreground">Resident Info:</strong> Provide their full legal name, email, and phone number.
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary font-black text-[10px] shrink-0 mt-0.5">
                                            3
                                        </span>
                                        <span className="leading-snug">
                                            <strong className="text-foreground">Lease Terms:</strong> Confirm the monthly rent, security deposit, and lease start date.
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={onSelectAddManually}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-foreground text-background font-black text-xs uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    <UserPlus className="size-4" />
                                    <span>Open Manual Resident Form</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
