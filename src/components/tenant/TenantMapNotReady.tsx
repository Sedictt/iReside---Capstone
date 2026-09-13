"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Compass, MapPin, MessageSquare, RefreshCw } from "lucide-react";
import { m as motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TenantMapNotReadyProps {
    propertyName?: string;
    propertyAddress?: string;
    currentUnitName?: string;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export function TenantMapNotReady({
    propertyName = "Your Residence",
    propertyAddress,
    currentUnitName,
    onRefresh,
    isRefreshing = false,
}: TenantMapNotReadyProps) {
    return (
        <div className="flex-1 flex flex-col min-h-screen bg-background text-foreground selection:bg-emerald-500/20 relative overflow-hidden">
            {/* Subtle architectural background grid */}
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, currentColor 1px, transparent 1px),
                        linear-gradient(to bottom, currentColor 1px, transparent 1px)
                    `,
                    backgroundSize: "36px 36px",
                }}
            />

            {/* Soft ambient center glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Top Navigation Bar */}
            <header className="h-16 px-6 sm:px-8 border-b border-border/60 flex items-center justify-between bg-background/80 backdrop-blur-md sticky top-0 z-20">
                <Link
                    href="/tenant/dashboard"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl hover:bg-muted/60 group"
                >
                    <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5 text-emerald-500" />
                    <span>Back to Dashboard</span>
                </Link>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>Setup in Progress</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-xl"
                >
                    {/* Centered Cohesive Card */}
                    <div className="rounded-3xl border border-border/80 bg-card/90 dark:bg-card/70 backdrop-blur-xl shadow-xl dark:shadow-2xl dark:shadow-black/50 p-6 sm:p-8 space-y-6 text-center">
                        
                        {/* Icon Anchor */}
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="size-20 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                                    <Compass className="size-9 stroke-[1.8]" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 size-7 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground shadow-sm">
                                    <Building2 className="size-3.5 text-emerald-500" />
                                </div>
                            </div>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-2">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                Interactive Map Coming Soon
                            </h1>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                The property management team is currently preparing the digital floor map for{" "}
                                <span className="font-semibold text-foreground">{propertyName}</span>. Once published, you&apos;ll be able to explore building floors, locate neighboring units, and request unit transfers here.
                            </p>
                        </div>

                        {/* Property & Residence Info Box */}
                        <div className="rounded-2xl border border-border/70 bg-muted/30 dark:bg-muted/20 p-4 text-left space-y-3">
                            <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
                                <div className="flex items-center gap-2 min-w-0">
                                    <MapPin className="size-4 text-emerald-500 shrink-0" />
                                    <span className="text-sm font-bold text-foreground truncate">{propertyName}</span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                                    Property Details
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                {currentUnitName && (
                                    <div className="p-3 rounded-xl bg-background/80 dark:bg-background/50 border border-border/50 min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Your Unit</p>
                                        <p className="text-sm font-bold text-foreground mt-0.5 truncate">{currentUnitName}</p>
                                    </div>
                                )}
                                <div className={cn("p-3 rounded-xl bg-background/80 dark:bg-background/50 border border-border/50 min-w-0", !currentUnitName && "col-span-2")}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Floor Map Status</p>
                                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1.5 whitespace-nowrap truncate">
                                        <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                                        <span className="truncate">Pending Landlord Setup</span>
                                    </p>
                                </div>
                            </div>

                            {propertyAddress && (
                                <p className="text-xs text-muted-foreground truncate pt-0.5">
                                    {propertyAddress}
                                </p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                            <Link
                                href="/tenant/dashboard"
                                className="sm:flex-1 py-3 px-5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-md shadow-emerald-600/20 whitespace-nowrap"
                            >
                                <ArrowLeft className="size-4 shrink-0" />
                                <span className="whitespace-nowrap">Dashboard</span>
                            </Link>

                            <Link
                                href="/tenant/messages"
                                className="sm:flex-1 py-3 px-5 rounded-xl text-xs font-bold uppercase tracking-wider bg-muted/60 hover:bg-muted text-foreground border border-border/70 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] whitespace-nowrap"
                            >
                                <MessageSquare className="size-4 shrink-0" />
                                <span className="whitespace-nowrap">Contact Landlord</span>
                            </Link>

                            {onRefresh && (
                                <button
                                    type="button"
                                    onClick={onRefresh}
                                    disabled={isRefreshing}
                                    className="py-3 px-3.5 rounded-xl text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted border border-border/70 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
                                    title="Check if the landlord has completed map setup"
                                >
                                    <RefreshCw className={cn("size-4 shrink-0", isRefreshing && "animate-spin text-emerald-500")} />
                                    <span className="sm:hidden text-xs font-bold uppercase tracking-wider whitespace-nowrap">Check Updates</span>
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
