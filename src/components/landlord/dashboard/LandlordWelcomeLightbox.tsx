"use client";

import { useEffect, useState } from "react";
import { Zap, X, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function LandlordWelcomeLightbox() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if the user has already seen the welcome lightbox
        const hasSeenWelcome = localStorage.getItem(
            "ireside_landlord_welcome_lightbox_seen"
        );
        if (!hasSeenWelcome) {
            // Add a small delay for the UI to settle
            const timer = setTimeout(() => setIsVisible(true), 1200);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem("ireside_landlord_welcome_lightbox_seen", "true");
    };

    const handleOpenQuests = () => {
        // Dispatch a custom event to start the highlight guide
        window.dispatchEvent(new CustomEvent("start-quest-trigger-guide"));
        handleClose();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[110] pointer-events-auto">
            {/* Dimmed Background */}
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm animate-in fade-in duration-300" />

            {/* Welcome Lightbox */}
            <div
                className={cn(
                    "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[111]",
                    "w-full max-w-[520px] pointer-events-auto",
                    "rounded-[2.5rem] border border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl",
                    "p-8 md:p-12",
                    "animate-in zoom-in-95 fade-in duration-500"
                )}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 p-2 rounded-xl hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="Close welcome"
                >
                    <X className="size-5" />
                </button>

                {/* Icon Badge */}
                <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/15 text-primary mb-6">
                    <Zap className="size-8" />
                </div>

                {/* Heading */}
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight mb-3">
                    Welcome to iReside
                </h1>

                {/* Subheading */}
                <p className="text-base text-muted-foreground/90 leading-relaxed mb-6">
                    Your landlord portal is now ready. Let&apos;s guide you through the essential features to manage your properties efficiently.
                </p>

                {/* Feature Highlight Section */}
                <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                    <div className="flex items-start gap-4">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary shrink-0 mt-0.5">
                            <Sparkles className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-foreground mb-1">
                                Missions &amp; Guided Tours
                            </h3>
                            <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                We&apos;ve created interactive missions to help you set up your unit map, manage properties, invite residents, and track finances. Each mission includes step-by-step guidance.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Tips */}
                <div className="mb-8 space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.15em] text-primary">
                        What you&apos;ll learn:
                    </p>
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-xs text-muted-foreground/80">
                            <div className="size-1.5 rounded-full bg-primary/60" />
                            Setting up your visual unit map
                        </li>
                        <li className="flex items-center gap-2 text-xs text-muted-foreground/80">
                            <div className="size-1.5 rounded-full bg-primary/60" />
                            Managing multiple properties
                        </li>
                        <li className="flex items-center gap-2 text-xs text-muted-foreground/80">
                            <div className="size-1.5 rounded-full bg-primary/60" />
                            Inviting and managing residents
                        </li>
                        <li className="flex items-center gap-2 text-xs text-muted-foreground/80">
                            <div className="size-1.5 rounded-full bg-primary/60" />
                            Tracking revenue and finances
                        </li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        onClick={handleOpenQuests}
                        className="flex-1 group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-6 py-4 text-primary-foreground shadow-[0_8px_18px_rgba(var(--primary-rgb),0.28)] transition-all hover:brightness-105 active:scale-95"
                    >
                        <div className="absolute inset-0 bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <span className="text-sm font-black uppercase tracking-tight relative z-10">
                            View Missions
                        </span>
                        <ArrowRight className="size-4 font-black relative z-10 transition-transform group-hover:translate-x-0.5" />
                    </button>
                    <button
                        onClick={handleClose}
                        className="flex-1 rounded-2xl border border-white/10 bg-card/70 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 transition-all hover:bg-card hover:text-foreground"
                    >
                        Skip for Now
                    </button>
                </div>

                {/* Footer Note */}
                <p className="mt-6 text-center text-[10px] font-medium text-muted-foreground/60">
                    You can access the missions anytime via the icon in the top-right corner of the dashboard.
                </p>
            </div>
        </div>
    );
}

