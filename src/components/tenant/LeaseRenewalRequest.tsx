"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, Calendar, X, CheckCircle2, ArrowRight, ShieldCheck, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LeaseRenewalRequestProps {
    variant?: "sidebar" | "quickAction" | "none";
    daysRemaining: number;
    leaseId?: string;
    autoOpen?: boolean;
    renewalSettings?: {
        base_rent_adjustment: number;
        adjustment_type: "percentage" | "fixed";
        new_rules: string[];
        landlord_memo: string;
        is_enabled: boolean;
        renewal_terms?: Array<{
            months: number;
            label: string;
            price_label: string;
            is_popular?: boolean;
        }>;
    };
}

// Default term options when not provided by renewalSettings
const DEFAULT_RENEWAL_TERMS = [
    { months: 6, label: "Short Term", price_label: "Market Rate" },
    { months: 12, label: "Annual Standard", price_label: "Policy Rate", is_popular: true },
    { months: 24, label: "Long Term Duo", price_label: "Policy Rate" }
];

export default function LeaseRenewalRequest({ variant = "sidebar", daysRemaining, leaseId, autoOpen = false, renewalSettings }: LeaseRenewalRequestProps) {
    const [isOpen, setIsOpen] = useState(autoOpen);
    const [step, setStep] = useState<"disclosure" | "request">("disclosure");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [selectedTerm, setSelectedTerm] = useState<number>(12);
    const [acknowledged, setAcknowledged] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async () => {
        if (!leaseId) {
            toast.error("Lease ID not found");
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`/api/tenant/lease/${leaseId}/renew`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ term_months: selectedTerm })
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error("Renewal Request Failed", {
                    description: data.error || "Something went wrong"
                });
                return;
            }

            setSubmitted(true);
            toast.success("Renewal Request Sent", {
                description: `Landlord has been notified of your ${selectedTerm}-month renewal intent.`
            });

            // Auto-close after 3 seconds
            setTimeout(() => {
                setIsOpen(false);
                setSubmitted(false);
            }, 3500);
} catch {
            toast.error("Renewal Request Failed", {
                description: "Network error. Please try again."
            });
        } finally {
            setSubmitting(false);
        }
    };

    const isEligible = daysRemaining <= 90;

    return (
        <>
            {variant === "sidebar" ? (
                /* Sidebar Card Trigger */
                <div className={cn(
                    "rounded-[2rem] border p-8 relative overflow-hidden group flex-shrink-0 shadow-sm backdrop-blur-sm transition-all",
                    isEligible 
                        ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" 
                        : "border-border/60 bg-card grayscale opacity-80"
                )}>
                    {isEligible && (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-transparent opacity-80" />
                    )}
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-xl border",
                                isEligible ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
                            )}>
                                <RefreshCw className={cn("size-5", isEligible && "animate-spin-slow")} />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground">Lease Renewal</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                            {isEligible 
                                ? "Your lease is eligible for renewal. Select a term below to notify your landlord of your intent to stay."
                                : `Renewal requests open when your lease has 90 days remaining (in ${daysRemaining - 90} days).`}
                        </p>
                        <button
                            onClick={() => setIsOpen(true)}
                            disabled={!isEligible}
                            className={cn(
                                "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border shadow-sm",
                                isEligible 
                                    ? "bg-primary text-white hover:bg-primary-dark border-primary shadow-lg shadow-primary/20" 
                                    : "bg-muted text-muted-foreground border-border cursor-not-allowed"
                            )}
                        >
                            {isEligible ? "Request Renewal" : "Locked"}
                        </button>
                    </div>
                </div>
            ) : variant === "quickAction" ? (
                /* Quick Action Trigger */
                <button
                    onClick={() => setIsOpen(true)}
                    disabled={!isEligible}
                    className="bg-card/50 border border-border hover:border-primary/40 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 group backdrop-blur-sm disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                    <div className={cn(
                        "size-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                        isEligible ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                        <RefreshCw className="size-7" />
                    </div>
                    <span className="text-[10px] font-black text-center group-hover:text-primary transition-colors uppercase tracking-widest">Renew Lease</span>
                </button>
            ) : variant === "none" ? null : null}

            {/* Modal */}
            {mounted && isOpen ? createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="relative w-full max-w-lg bg-card rounded-2xl overflow-hidden border border-border shadow-2xl flex flex-col">

                        {/* Header */}
                        <div className="p-6 border-b border-border flex justify-between items-center bg-card/80 backdrop-blur-md z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                    <RefreshCw className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-foreground tracking-tight">
                                        {step === "disclosure" ? "Latest Property Terms" : "Lease Renewal Request"}
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                            {submitted ? (
                                <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                                    <div className="size-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                                        <CheckCircle2 className="size-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-2xl font-black text-foreground">Request Sent</h4>
                                        <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                                            Your request to renew for **{selectedTerm} months** has been sent to your landlord for review.
                                        </p>
                                    </div>
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                                        <Clock className="size-3" /> Awaiting Landlord Response
                                    </div>
                                </div>
                            ) : step === "disclosure" ? (
                                <div className="w-full animate-in slide-in-from-right-4 duration-500 space-y-6">
                                    <div className="bg-primary/5 rounded-[2rem] p-6 border border-primary/10 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                                            <ShieldCheck className="size-16" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Official Property Memo</p>
                                        <p className="text-sm font-medium text-foreground leading-relaxed">
                                            {renewalSettings?.landlord_memo || "No specific updates have been posted by the landlord for this renewal window."}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-2">Updated Terms</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-lg bg-background flex items-center justify-center text-primary">
                                                        <ArrowRight className="size-4" />
                                                    </div>
                                                    <span className="text-xs font-black text-foreground uppercase tracking-widest">Expected Rent Adjustment</span>
                                                </div>
                                                <span className="text-sm font-black text-primary">
                                                    {renewalSettings?.base_rent_adjustment ? (
                                                        renewalSettings.adjustment_type === "percentage" 
                                                            ? `+${renewalSettings.base_rent_adjustment}%` 
                                                            : `+PHP ${renewalSettings.base_rent_adjustment.toLocaleString()}`
                                                    ) : "No change"}
                                                </span>
                                            </div>

                                            {renewalSettings?.new_rules && renewalSettings.new_rules.length > 0 && (
                                                <div className="space-y-3 pt-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Rules & Clauses</p>
                                                    {renewalSettings.new_rules.map((rule, i) => (
                                                        <div key={i} className="flex items-start gap-3 p-3 bg-muted/20 rounded-xl border border-dashed border-border">
                                                            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                                            <p className="text-[11px] font-medium text-foreground">{rule}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 pt-2">
                                        <input 
                                            type="checkbox" 
                                            id="acknowledge"
                                            checked={acknowledged}
                                            onChange={(e) => setAcknowledged(e.target.checked)}
                                            className="size-5 rounded-lg border-border text-primary focus:ring-primary/20"
                                        />
                                        <label htmlFor="acknowledge" className="text-[11px] font-bold text-muted-foreground cursor-pointer select-none">
                                            I have reviewed the latest property terms and rules.
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full animate-in slide-in-from-right-4 duration-500 space-y-6">
                                    <div className="text-center space-y-2 mb-8">
                                        <h4 className="text-2xl font-black text-foreground">Select Your Term</h4>
                                        <p className="text-sm text-muted-foreground">Choose your preferred extension period.</p>
                                    </div>

<div className="grid grid-cols-1 gap-3">
                                        {(renewalSettings?.renewal_terms?.length ? renewalSettings.renewal_terms : DEFAULT_RENEWAL_TERMS).map((opt) => (
                                            <button
                                                key={opt.months}
                                                onClick={() => setSelectedTerm(opt.months)}
                                                className={cn(
                                                    "p-5 rounded-2xl border text-left transition-all flex items-center justify-between group",
                                                    selectedTerm === opt.months 
                                                        ? "bg-primary/5 border-primary shadow-sm" 
                                                        : "bg-background border-border hover:border-primary/30"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "size-10 rounded-xl flex items-center justify-center transition-colors",
                                                        selectedTerm === opt.months ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/10"
                                                    )}>
                                                        <Calendar className="size-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-foreground">{opt.months} Months</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{opt.label}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest",
                                                        selectedTerm === opt.months ? "text-primary" : "text-muted-foreground"
                                                    )}>{opt.price_label}</p>
                                                    {opt.is_popular && <span className="text-[8px] font-black text-white bg-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">Popular</span>}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border">
                                        <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                            Terms are based on the renewal policy disclosed in the previous step. Final approval is subject to landlord signature.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {!submitted && (
                            <div className="p-6 border-t border-border bg-background/50 flex gap-3">
                                {step === "disclosure" ? (
                                    <button
                                        onClick={() => setStep("request")}
                                        disabled={!acknowledged}
                                        className="w-full py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                                    >
                                        Accept & Proceed <ArrowRight className="size-4" />
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setStep("disclosure")}
                                            className="px-6 py-4 rounded-2xl border border-border text-muted-foreground font-black uppercase tracking-widest text-[10px] hover:bg-muted transition-all flex-1"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={submitting}
                                            className="px-6 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] hover:bg-primary-dark transition-all flex-[2] items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                                        >
                                            {submitting ? "Submitting..." : "Submit Request"} <ArrowRight className="size-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            , document.body) : null}

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </>
    );
}

