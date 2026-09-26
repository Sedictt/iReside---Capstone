"use client";

import React from "react";
import { CheckCircle2, LayoutDashboard, Map, Users, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardTourCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (href: string) => void;
    propertyName?: string;
}

export function DashboardTourCompletionModal({
    isOpen,
    onClose,
    onNavigate,
    propertyName,
}: DashboardTourCompletionModalProps) {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-tour-complete-title"
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto" 
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div 
                className={cn(
                    "relative z-[201] w-full max-w-[540px] pointer-events-auto",
                    "rounded-[2.5rem] border border-border/80 bg-card/98 dark:bg-zinc-900/98 backdrop-blur-2xl shadow-2xl",
                    "p-7 sm:p-10 space-y-6",
                    "animate-in zoom-in-95 fade-in duration-300"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Icon */}
                <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                    <CheckCircle2 className="size-7" />
                </div>

                {/* Headings */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
                            Onboarding Complete
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            All Features Unlocked
                        </span>
                    </div>
                    <h1 id="dashboard-tour-complete-title" className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-tight">
                        You&apos;re All Set Up!
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Congratulations! You have completed the 5-stage setup{propertyName ? <> for <span className="font-bold text-foreground">{propertyName}</span></> : ""}. Your property, visual unit map, billing rails, tenants, and operational dashboard are fully ready for daily rental operations.
                    </p>
                </div>

                {/* Next Steps Card */}
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Where would you like to go next?
                    </h3>

                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => onNavigate("/landlord/unit-map")}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/50 transition-all text-left group cursor-pointer active:scale-98"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                                    <Map className="size-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                                        Open 2D Visual Map
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground">
                                        Review unit occupancy, tenant assignments, and room layout.
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>

                        <button
                            type="button"
                            onClick={() => onNavigate("/landlord/tenants")}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/50 transition-all text-left group cursor-pointer active:scale-98"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                                    <Users className="size-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                                        Manage Resident Directory
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground">
                                        View tenant profiles, digital leases, and lease renewal dates.
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                    </div>
                </div>

                {/* Primary Dismiss Button */}
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-xs font-black bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-105 transition-all cursor-pointer active:scale-95"
                    >
                        <LayoutDashboard className="size-4" />
                        <span>Explore Operational Dashboard</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
