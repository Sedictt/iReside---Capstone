"use client";

import { useEffect, useState } from "react";
import { Smartphone, X, ArrowRight, MessageSquare, BarChart3, Receipt, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function LandlordMobileWelcomeModal() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeenMobileWelcome = localStorage.getItem("ireside_landlord_mobile_welcome_seen");
        if (!hasSeenMobileWelcome) {
            const timer = setTimeout(() => setIsVisible(true), 1200);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem("ireside_landlord_mobile_welcome_seen", "true");
        localStorage.setItem("ireside_landlord_welcome_lightbox_seen", "true");
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[110] block md:hidden pointer-events-auto">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={handleClose}
            />

            {/* Mobile Sheet / Modal */}
            <div
                className={cn(
                    "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[111]",
                    "w-[calc(100%-2rem)] max-w-[370px] max-h-[90vh] overflow-y-auto pointer-events-auto",
                    "rounded-[1.75rem] border border-white/10 bg-card/95 backdrop-blur-2xl shadow-2xl",
                    "p-5 text-foreground",
                    "animate-in zoom-in-95 fade-in duration-300"
                )}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="Close mobile welcome"
                >
                    <X className="size-4" />
                </button>

                {/* Header Badge */}
                <div className="flex items-center gap-3 mb-3.5">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]">
                        <Smartphone className="size-5" />
                    </div>
                    <div>
                        <span className="inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 rounded-full mb-0.5">
                            Mobile Edition
                        </span>
                        <h2 className="text-lg font-black tracking-tight text-foreground leading-tight">
                            iReside Mobile
                        </h2>
                    </div>
                </div>

                {/* Subtitle */}
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Your pocket dashboard for quick communication, vital alerts, and on-the-go property review.
                </p>

                {/* Mobile Features List */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-background/50 p-2.5">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                            <MessageSquare className="size-3.5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-foreground">Direct Tenant Chat &amp; Broadcasts</h4>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                                Instantly message residents and broadcast building notices.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-background/50 p-2.5">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                            <BarChart3 className="size-3.5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-foreground">Crucial Overview &amp; Metrics</h4>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                                Keep track of payments, upcoming lease expiries, and dues at a glance.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-background/50 p-2.5">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                            <Receipt className="size-3.5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-foreground">Payment Proof Review</h4>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                                Quickly verify uploaded payment proof receipts from tenants.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-background/50 p-2.5">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 shrink-0 mt-0.5">
                            <ShieldCheck className="size-3.5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-foreground">Audit Logs &amp; Activity</h4>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                                Read-only log viewer with search &amp; filter for key property events.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Desktop Note */}
                <div className="mb-4 rounded-xl bg-muted/40 border border-border/40 p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground leading-normal">
                        💡 Visual unit map layouts and complex account management are optimized for desktop view.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleClose}
                        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary py-2.5 px-4 text-primary-foreground font-black text-xs uppercase tracking-tight shadow-md transition-all hover:brightness-105 active:scale-95"
                    >
                        <span>Explore Mobile Portal</span>
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                    <button
                        onClick={handleClose}
                        className="w-full py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}
