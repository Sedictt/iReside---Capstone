"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { m as motion, useReducedMotion } from "framer-motion";
import { 
    CreditCard, 
    Bed, 
    Wrench, 
    ArrowRight,
    CheckCircle2,
    Banknote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface SeniorOverviewHubProps {
    overdueCount: number;
    overdueAmount: number;
    occupiedUnits: number;
    totalUnits: number;
    openUnitsCount: number;
    maintenanceCount: number;
    userName?: string;
    hasTenants?: boolean;
    onOpenOverduePayments?: () => void;
    onRecordPayment?: () => void;
    onOpenVacantUnits?: () => void;
    className?: string;
}

export function SeniorOverviewHub({
    overdueCount,
    overdueAmount,
    occupiedUnits,
    totalUnits,
    openUnitsCount,
    maintenanceCount,
    hasTenants,
    onOpenOverduePayments,
    onRecordPayment,
    onOpenVacantUnits,
    className,
}: SeniorOverviewHubProps) {
    const { t } = useLanguage();
    const shouldReduceMotion = useReducedMotion();
    const hasOverdue = overdueCount > 0;
    const hasMaintenance = maintenanceCount > 0;
    const needsAttention = hasOverdue || hasMaintenance;

    const hasTenantsEffective = hasTenants ?? (occupiedUnits > 0);
    const isRentPaymentsEmpty = totalUnits === 0 || (!hasTenantsEffective && !hasOverdue);
    const isRoomsEmpty = totalUnits === 0;
    const isMaintenanceEmpty = totalUnits === 0;

    const occupancyPercentage = totalUnits > 0
        ? Math.min(100, Math.round((occupiedUnits / totalUnits) * 100))
        : 0;

    // Smooth ease-out count-up for the overdue rent figure
    const [displayOverdueAmount, setDisplayOverdueAmount] = useState(overdueAmount);
    useEffect(() => {
        if (shouldReduceMotion || !hasOverdue || overdueAmount <= 0) {
            setDisplayOverdueAmount(overdueAmount);
            return;
        }

        let rafId = 0;
        const duration = 650;
        const startTime = performance.now();

        const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            // Ease-out quart
            const eased = 1 - Math.pow(1 - progress, 4);
            setDisplayOverdueAmount(overdueAmount * eased);
            if (progress < 1) {
                rafId = requestAnimationFrame(tick);
            } else {
                setDisplayOverdueAmount(overdueAmount);
            }
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [overdueAmount, hasOverdue, shouldReduceMotion]);

    const formattedOverdueAmount = displayOverdueAmount.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return (
        <section 
            aria-label={t("Today's Overview")} 
            className={cn(
                "relative z-0 w-full space-y-4",
                className
            )}
        >
            {/* Section Header: Unboxed, clean typographic hierarchy */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-0.5">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        {t("Today's Overview")}
                    </h2>
                    {needsAttention ? (
                        <span className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                            <span className="relative flex size-2 shrink-0" aria-hidden="true">
                                <span className="animate-ping motion-reduce:hidden absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-60" />
                                <span className="relative inline-flex rounded-full size-2 bg-rose-600 dark:bg-rose-400" />
                            </span>
                            <span>{t("Needs Attention")}</span>
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                            <span>{t("All Good! No Issues Today")}</span>
                        </span>
                    )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("Quick summary of unpaid rent, room vacancies, and repair requests.")}
                </p>
            </div>

            {/* Asymmetric Priority Grid: 60% Tactile Brand Primary Card (Left) + 40% Quiet Elevated Secondary Rows (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* PRIMARY FOCAL CARD (Left ~60%): Tactile dot texture + periodic light sheen + inset rim highlight */}
                <motion.div
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                        "group/hero relative lg:col-span-7 rounded-2xl p-6 overflow-hidden flex flex-col justify-between transition-all duration-200 border",
                        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_4px_14px_-4px_rgba(0,0,0,0.12)]",
                        "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.28),0_10px_24px_-6px_rgba(0,0,0,0.16)]",
                        isRentPaymentsEmpty
                            ? "bg-slate-900 dark:bg-zinc-800/90 text-white border-slate-800 dark:border-zinc-700"
                            : "bg-primary text-primary-foreground border-primary/30"
                    )}
                >
                    {/* Directional bottom-left to upper-right depth gradient */}
                    <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/28 via-transparent to-white/14"
                        aria-hidden="true"
                    />

                    {/* Tactile architectural grid & dot-node surface texture */}
                    <div
                        className="overview-grid-texture-hero pointer-events-none absolute inset-0"
                        aria-hidden="true"
                    />

                    {/* Periodic satin light sheen (sweeps cleanly across the card on load & every 5s) */}
                    {!shouldReduceMotion && (
                        <motion.div
                            initial={{ x: "-140%" }}
                            animate={{ x: "420%" }}
                            transition={{
                                duration: 1.4,
                                delay: 0.6,
                                repeat: Infinity,
                                repeatDelay: 5,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                            aria-hidden="true"
                        />
                    )}

                    <div className="relative z-10">
                        {/* Top Meta Row: Anchored icon badge on left, live status pill on right */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className={cn(
                                "flex items-center gap-2.5",
                                isRentPaymentsEmpty ? "text-slate-200" : "text-primary-foreground/90"
                            )}>
                                <div className={cn(
                                    "flex size-8 items-center justify-center rounded-lg border shadow-2xs",
                                    isRentPaymentsEmpty
                                        ? "bg-white/10 border-white/15"
                                        : "bg-primary-foreground/10 border-primary-foreground/20"
                                )}>
                                    <CreditCard className="size-4 shrink-0" aria-hidden="true" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    {t("Rent Payments")}
                                </span>
                            </div>

                            {hasOverdue ? (
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white text-rose-700 shadow-xs">
                                    <span className="relative flex size-2 shrink-0" aria-hidden="true">
                                        <span className="animate-ping motion-reduce:hidden absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                                        <span className="relative inline-flex rounded-full size-2 bg-rose-600" />
                                    </span>
                                    <span>
                                        {overdueCount === 1
                                            ? t("{count} tenant has not paid", { count: overdueCount })
                                            : t("{count} tenants have not paid", { count: overdueCount })}
                                    </span>
                                </span>
                            ) : isRentPaymentsEmpty ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-200 border border-white/10">
                                    <span className="size-2 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />
                                    <span>{totalUnits === 0 ? t("No properties added yet") : t("No active tenants yet")}</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20">
                                    <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                                    <span>{t("All rent paid on time")}</span>
                                </span>
                            )}
                        </div>

                        {/* Dominant Hero Metric */}
                        <div className="my-6 space-y-1.5">
                            <p className={cn(
                                "text-xs font-medium",
                                isRentPaymentsEmpty ? "text-slate-300" : "text-primary-foreground/80"
                            )}>
                                {hasOverdue ? t("Unpaid Rent") : t("Unpaid Balance")}
                            </p>
                            <div className="text-4xl sm:text-5xl font-black tracking-tight tabular-nums leading-none">
                                {hasOverdue ? `₱${formattedOverdueAmount}` : "₱0.00"}
                            </div>
                        </div>
                    </div>

                    {/* Action Footer: Grouped left-aligned CTAs with crisp WCAG-safe contrast */}
                    <div className={cn(
                        "relative z-10 pt-4 border-t flex flex-wrap items-center gap-3",
                        isRentPaymentsEmpty ? "border-white/15" : "border-primary-foreground/15"
                    )}>
                        {hasOverdue && onOpenOverduePayments ? (
                            <>
                                <button
                                    type="button"
                                    onClick={onOpenOverduePayments}
                                    className="group min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary-foreground hover:opacity-90 text-[var(--primary-foreground-inverse)] shadow-xs transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <span>{t("View Unpaid Rent")}</span>
                                    <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                                </button>
                                {onRecordPayment && (
                                    <button
                                        type="button"
                                        onClick={onRecordPayment}
                                        className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary-foreground/10 hover:bg-primary-foreground/15 text-primary-foreground border border-primary-foreground/25 transition-all active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
                                    >
                                        <Banknote className="size-4" aria-hidden="true" />
                                        <span>{t("Record Payment")}</span>
                                    </button>
                                )}
                            </>
                        ) : isRentPaymentsEmpty ? (
                            totalUnits === 0 ? (
                                <Link
                                    href="/landlord/properties/new"
                                    className="group min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-slate-100 text-slate-900 shadow-xs transition-all active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
                                >
                                    <span>{t("Add Property")}</span>
                                    <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                                </Link>
                            ) : (
                                <Link
                                    href="/landlord/tenants"
                                    className="group min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-slate-100 text-slate-900 shadow-xs transition-all active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
                                >
                                    <span>{t("Add First Tenant")}</span>
                                    <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                                </Link>
                            )
                        ) : onRecordPayment ? (
                            <button
                                type="button"
                                onClick={onRecordPayment}
                                className="group min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary-foreground hover:opacity-90 text-[var(--primary-foreground-inverse)] shadow-xs transition-all active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
                            >
                                <span>{t("Record Payment")}</span>
                                <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                            </button>
                        ) : (
                            <Link
                                href="/landlord/invoices"
                                className="group min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary-foreground hover:opacity-90 text-[var(--primary-foreground-inverse)] shadow-xs transition-all active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
                            >
                                <span>{t("View Bills & Receipts")}</span>
                                <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                            </Link>
                        )}
                    </div>
                </motion.div>

                {/* SECONDARY COMPACT STACK (Right ~40%): Room Occupancy & Repairs with subtle dot grain & hover lift */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    {/* ROW 1: Room Occupancy */}
                    <motion.div
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
                        className="relative overflow-hidden flex-1 rounded-2xl bg-card dark:bg-zinc-900 border border-border p-5 shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] hover:border-primary/35 hover:-translate-y-0.5 hover:shadow-sm motion-reduce:hover:translate-y-0 transition-all duration-200 flex flex-col justify-between gap-4"
                    >
                        {/* Subtle architectural surface texture */}
                        <div className="overview-grid-texture-surface pointer-events-none absolute inset-0" aria-hidden="true" />

                        <div className="relative z-10 flex items-start justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <div className="flex size-7 items-center justify-center rounded-lg bg-muted/80 border border-border text-foreground/80">
                                        <Bed className="size-3.5 shrink-0" aria-hidden="true" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider">
                                        {t("Room Occupancy")}
                                    </span>
                                </div>

                                <div className="flex items-baseline gap-1.5 tabular-nums">
                                    {isRoomsEmpty ? (
                                        <span className="text-2xl sm:text-3xl font-black tracking-tight text-muted-foreground">
                                            0 {t("of")} 0
                                        </span>
                                    ) : (
                                        <>
                                            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                                                {occupiedUnits}
                                            </span>
                                            <span className="text-sm font-semibold text-muted-foreground">
                                                {t("of")} {totalUnits}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Compact Secondary Action */}
                            {isRoomsEmpty ? (
                                <Link
                                    href="/landlord/unit-map"
                                    className="group min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-muted/60 hover:bg-muted text-foreground border border-border transition-all active:scale-[0.98] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                                >
                                    <span>{t("Set Up Rooms")}</span>
                                    <ArrowRight className="size-3.5 transition-transform motion-reduce:transition-none group-hover:translate-x-0.5" aria-hidden="true" />
                                </Link>
                            ) : openUnitsCount > 0 && onOpenVacantUnits ? (
                                <button
                                    type="button"
                                    onClick={onOpenVacantUnits}
                                    className="group min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-muted/60 hover:bg-muted text-foreground border border-border transition-all active:scale-[0.98] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                                >
                                    <span>{t("View Empty Rooms")}</span>
                                    <ArrowRight className="size-3.5 transition-transform motion-reduce:transition-none group-hover:translate-x-0.5" aria-hidden="true" />
                                </button>
                            ) : (
                                <Link
                                    href="/landlord/unit-map"
                                    className="group min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-muted/60 hover:bg-muted text-foreground border border-border transition-all active:scale-[0.98] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                                >
                                    <span>{t("View Empty Rooms")}</span>
                                    <ArrowRight className="size-3.5 transition-transform motion-reduce:transition-none group-hover:translate-x-0.5" aria-hidden="true" />
                                </Link>
                            )}
                        </div>

                        {/* Animated Occupancy Progress Bar & Status Line */}
                        <div className="relative z-10 space-y-2">
                            <div className="h-2 w-full rounded-full bg-muted/80 border border-border/50 overflow-hidden" aria-hidden="true">
                                <motion.div
                                    initial={shouldReduceMotion ? { width: `${occupancyPercentage}%` } : { width: 0 }}
                                    animate={{ width: `${occupancyPercentage}%` }}
                                    transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                                    className="h-full rounded-full bg-primary"
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                {isRoomsEmpty ? (
                                    <span className="font-medium text-muted-foreground">
                                        {t("No rooms added yet")}
                                    </span>
                                ) : openUnitsCount > 0 ? (
                                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                        <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" aria-hidden="true" />
                                        <span>{openUnitsCount} {t(openUnitsCount === 1 ? "room ready for move-in" : "rooms ready for move-in")}</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
                                        <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                                        <span>{t("All rooms occupied")}</span>
                                    </span>
                                )}
                                {!isRoomsEmpty && (
                                    <span className="font-mono text-[11px] font-semibold text-muted-foreground tabular-nums">
                                        {occupancyPercentage}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* ROW 2: Repairs & Maintenance */}
                    <motion.div
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                        className="relative overflow-hidden flex-1 rounded-2xl bg-card dark:bg-zinc-900 border border-border p-5 shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] hover:border-primary/35 hover:-translate-y-0.5 hover:shadow-sm motion-reduce:hover:translate-y-0 transition-all duration-200 flex items-center justify-between gap-4"
                    >
                        {/* Subtle architectural surface texture */}
                        <div className="overview-grid-texture-surface pointer-events-none absolute inset-0" aria-hidden="true" />

                        <div className="relative z-10 space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-muted/80 border border-border text-foreground/80">
                                    <Wrench className="size-3.5 shrink-0" aria-hidden="true" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    {t("Repairs & Maintenance")}
                                </span>
                            </div>

                            <div className="flex items-baseline gap-2 tabular-nums">
                                <span className={cn(
                                    "text-2xl sm:text-3xl font-black tracking-tight",
                                    hasMaintenance
                                        ? "text-amber-600 dark:text-amber-400"
                                        : isMaintenanceEmpty
                                            ? "text-muted-foreground"
                                            : "text-foreground"
                                )}>
                                    {maintenanceCount}
                                </span>
                                <span className="text-sm font-semibold text-muted-foreground">
                                    {t("Open Requests")}
                                </span>
                            </div>

                            <div>
                                {hasMaintenance ? (
                                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                        <span className="relative flex size-2 shrink-0" aria-hidden="true">
                                            <span className="animate-ping motion-reduce:hidden absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-65" />
                                            <span className="relative inline-flex rounded-full size-2 bg-amber-500" />
                                        </span>
                                        <span>{t("Needs landlord review")}</span>
                                    </span>
                                ) : isMaintenanceEmpty ? (
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {t("No maintenance records")}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                        <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                                        <span>{t("All repairs resolved")}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        <Link
                            href="/landlord/maintenance"
                            className="relative z-10 group min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-muted/60 hover:bg-muted text-foreground border border-border transition-all active:scale-[0.98] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                            <span>{isMaintenanceEmpty ? t("Maintenance Desk") : t("View Repair Requests")}</span>
                            <ArrowRight className="size-3.5 transition-transform motion-reduce:transition-none group-hover:translate-x-0.5" aria-hidden="true" />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
