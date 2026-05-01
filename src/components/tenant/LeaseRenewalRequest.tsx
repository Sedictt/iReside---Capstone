"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, Calendar, X, CheckCircle2, ArrowRight, ShieldCheck, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LeaseRenewalRequestProps {
    variant?: "sidebar" | "quickAction";
    daysRemaining: number;
}

export default function LeaseRenewalRequest({ variant = "sidebar", daysRemaining }: LeaseRenewalRequestProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<"idle" | "evaluating" | "options" | "success">("idle");
    const [mounted, setMounted] = useState(false);
    const [selectedTerm, setSelectedTerm] = useState<number>(12);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleStartRequest = () => {
        setIsOpen(true);
        setStatus("evaluating");

        // Simulate a system scan for eligibility
        setTimeout(() => {
            setStatus("options");
        }, 2000);
    };

    const handleSubmit = () => {
        setStatus("success");
        toast.success("Renewal Request Sent", {
            description: `Landlord has been notified of your ${selectedTerm}-month renewal intent.`
        });
        
        // Auto-close after 3 seconds
        setTimeout(() => {
            setIsOpen(false);
            setStatus("idle");
        }, 3500);
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
                                <RefreshCw className={cn("w-5 h-5", isEligible && "animate-spin-slow")} />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Lease Renewal</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                            {isEligible 
                                ? "You are within the renewal window. Secure your unit for another term with pre-approved rates."
                                : `Your renewal window opens in ${daysRemaining - 90} days. Stay tuned for exclusive extension offers.`}
                        </p>
                        <button
                            onClick={handleStartRequest}
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
            ) : (
                /* Quick Action Trigger */
                <button
                    onClick={handleStartRequest}
                    disabled={!isEligible}
                    className="bg-card/50 border border-border hover:border-primary/40 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 group backdrop-blur-sm disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                        isEligible ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                        <RefreshCw className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-black text-center group-hover:text-primary transition-colors uppercase tracking-widest">Renew Lease</span>
                </button>
            )}

            {/* Modal */}
            {mounted && isOpen ? createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="relative w-full max-w-lg bg-card rounded-2xl overflow-hidden border border-border shadow-2xl flex flex-col">

                        {/* Header */}
                        <div className="p-6 border-b border-border flex justify-between items-center bg-card/80 backdrop-blur-md z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                    <RefreshCw className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-foreground tracking-tight">Renewal Proposal</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Agreement Lifecycle v2.0</p>
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
                        <div className="p-8 flex flex-col items-center justify-center min-h-[350px]">
                            {status === "evaluating" && (
                                <div className="text-center space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                                        <div className="absolute inset-0 rounded-full border-4 border-border" />
                                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                        <ShieldCheck className="w-8 h-8 text-primary/50 animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-foreground mb-2">Evaluating Standing...</h4>
                                        <p className="text-sm text-muted-foreground">Checking payment history, trust score, and unit availability.</p>
                                    </div>
                                </div>
                            )}

                            {status === "options" && (
                                <div className="w-full animate-in zoom-in-95 duration-500 space-y-6">
                                    <div className="text-center space-y-2 mb-8">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest mb-2">
                                            Pre-Approved for Renewal
                                        </div>
                                        <h4 className="text-2xl font-black text-foreground">Select Your Term</h4>
                                        <p className="text-sm text-muted-foreground">Choose your preferred extension period.</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { months: 6, label: "Short Term", price: "Standard Rate" },
                                            { months: 12, label: "Annual Standard", price: "Locked Rate", popular: true },
                                            { months: 24, label: "Long Term Duo", price: "2% Discount" }
                                        ].map((opt) => (
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
                                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                        selectedTerm === opt.months ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/10"
                                                    )}>
                                                        <Calendar className="w-5 h-5" />
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
                                                    )}>{opt.price}</p>
                                                    {opt.popular && <span className="text-[8px] font-black text-white bg-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">Popular</span>}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border">
                                        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                            Pricing is indicative and based on current market rates. Final approval is subject to landlord verification and signature.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {status === "success" && (
                                <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-2xl font-black text-foreground">Request Transmitted</h4>
                                        <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                                            Your renewal intent for **{selectedTerm} months** has been sent to property management. 
                                        </p>
                                    </div>
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                                        <Clock className="w-3 h-3" /> Awaiting Landlord Response
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {status === "options" && (
                            <div className="p-4 border-t border-border bg-background/50 flex gap-3">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-3 rounded-xl text-muted-foreground font-semibold hover:bg-muted hover:text-foreground transition-all flex-1"
                                >
                                    Not Now
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-4 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px] hover:bg-primary-dark transition-all flex flex-1 items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    Submit Request <ArrowRight className="w-4 h-4" />
                                </button>
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
