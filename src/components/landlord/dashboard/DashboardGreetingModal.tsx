"use client";

import React from "react";
import { LayoutDashboard, Zap, Activity, Banknote, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardGreetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartTour: () => void;
    propertyName?: string;
}

export function DashboardGreetingModal({
    isOpen,
    onClose,
    onStartTour,
    propertyName,
}: DashboardGreetingModalProps) {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-greeting-modal-title"
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
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                    <LayoutDashboard className="size-7" />
                </div>

                {/* Headings */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                            Step 5 of 5 • Final Stage
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            Command Center
                        </span>
                    </div>
                    <h1 id="dashboard-greeting-modal-title" className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-tight">
                        Master Your Dashboard
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Welcome to your operational headquarters{propertyName ? <> for <span className="font-bold text-foreground">{propertyName}</span></> : ""}! Take a quick 1-minute guided tour to discover how to record cash payments, inspect occupancy, and monitor collection health.
                    </p>
                </div>

                {/* 3 Clean Feature Steps Overview */}
                <div className="space-y-2.5 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 border border-primary/20">
                            <Zap className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-foreground">
                                1. Action Launchpad
                            </h3>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Record cash collections, onboard walk-in tenants, generate invite links, or download marketing flyers in one click.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 border border-primary/20">
                            <Activity className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-foreground">
                                2. Real-Time Operational Pulse
                            </h3>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Monitor overdue balances, vacant rooms, and pending applications with instant interactive drill-down drawers.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 border border-primary/20">
                            <Banknote className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-foreground">
                                3. Revenue Stream &amp; Settlement
                            </h3>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Review inbound payments in real-time and acknowledge settlements with automatic digital receipting.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer text-center active:scale-95"
                    >
                        Explore First
                    </button>
                    <button
                        type="button"
                        onClick={onStartTour}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-xs font-black bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-105 transition-all cursor-pointer active:scale-95"
                    >
                        <span>Start Guided Tour</span>
                        <ArrowRight className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
