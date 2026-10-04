"use client";

import React from "react";
import Link from "next/link";
import { 
    CreditCard, 
    Bed, 
    Wrench, 
    ShieldCheck, 
    ArrowRight,
    CheckCircle2 
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
    const { t, isFilipino } = useLanguage();
    const hasOverdue = overdueCount > 0;
    const hasMaintenance = maintenanceCount > 0;
    const needsAttention = hasOverdue || hasMaintenance;

    const hasTenantsEffective = hasTenants ?? (occupiedUnits > 0);
    const isRentPaymentsEmpty = totalUnits === 0 || (!hasTenantsEffective && !hasOverdue);
    const isRoomsEmpty = totalUnits === 0;
    const isMaintenanceEmpty = totalUnits === 0;

    return (
        <section 
            aria-label="Today's Overview" 
            className={cn(
                "relative z-0 h-auto w-full rounded-[2rem] p-6 sm:p-8 bg-card dark:bg-zinc-900 border border-border/60 shadow-sm transition-all space-y-6 overflow-hidden",
                className
            )}
        >
            {/* Subtle Decorative Skyline Graphic in Top Right (matches mockup) */}
            <div className="absolute top-0 right-0 h-44 w-72 pointer-events-none opacity-20 dark:opacity-5 select-none overflow-hidden" aria-hidden="true">
                <svg viewBox="0 0 320 190" fill="none" className="w-full h-full text-amber-600/40 dark:text-zinc-500">
                    <path d="M220 70 L260 40 L300 70 V190 H220 Z" fill="currentColor" fillOpacity="0.4" />
                    <path d="M250 100 H270 V125 H250 Z" fill="white" fillOpacity="0.6" />
                    <path d="M160 110 L195 85 L230 110 V190 H160 Z" fill="currentColor" fillOpacity="0.25" />
                    <path d="M180 130 H195 V150 H180 Z" fill="white" fillOpacity="0.5" />
                    <path d="M110 130 L135 110 L160 130 V190 H110 Z" fill="currentColor" fillOpacity="0.15" />
                    <path d="M60 190 C130 160 210 115 320 50 V190 H60 Z" fill="currentColor" fillOpacity="0.08" />
                </svg>
            </div>

            {/* Header: Today's Overview Banner */}
            <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                    {/* Golden Shield Container */}
                    <div className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 shrink-0 shadow-xs">
                        <ShieldCheck className="size-6 sm:size-7" aria-hidden="true" />
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                                {t("Today's Overview")}
                            </h2>
                            {needsAttention ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100/80 dark:bg-rose-950/50 text-rose-700 dark:text-rose-200 border border-rose-200/80 dark:border-rose-800/60">
                                    <span className="flex size-3.5 items-center justify-center rounded-full bg-rose-600 dark:bg-rose-500 text-white text-[9px] font-black leading-none shrink-0">!</span>
                                    <span>{t("Needs Attention")}</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/60">
                                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                                    <span>{t("All Good! No Issues Today")}</span>
                                </span>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">
                            {t("Quick summary of unpaid rent, room vacancies, and repair requests.")}
                        </p>
                    </div>
                </div>
            </div>

            {/* The 3 Themed Overview Cards */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* CARD 1: Rent Payments */}
                <div className={cn(
                    "relative rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-xs min-h-[250px] transition-all",
                    hasOverdue
                        ? "border border-rose-200/80 bg-rose-50/60 dark:border-rose-900/50 dark:bg-zinc-950/70"
                        : isRentPaymentsEmpty
                            ? "border border-border/70 bg-card/60 dark:border-zinc-800/80 dark:bg-zinc-950/40"
                            : "border border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-zinc-950/70"
                )}>
                    <div className="z-10">
                        {/* Header Chip */}
                        <div className="flex items-center gap-2.5">
                            <div className={cn(
                                "flex size-7 items-center justify-center rounded-lg text-white shadow-xs shrink-0 transition-colors",
                                hasOverdue
                                    ? "bg-rose-700 dark:bg-rose-700"
                                    : isRentPaymentsEmpty
                                        ? "bg-muted text-muted-foreground border border-border/60 dark:border-zinc-700"
                                        : "bg-emerald-700 dark:bg-emerald-700"
                            )}>
                                <CreditCard className="size-4" aria-hidden="true" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground/80 dark:text-zinc-400">
                                {t("Rent Payments")}
                            </span>
                        </div>

                        {/* Metric & Status Pill */}
                        <div className="my-5 space-y-3">
                            <div className={cn(
                                "text-3xl sm:text-4xl font-black tracking-tight tabular-nums transition-colors",
                                hasOverdue
                                    ? "text-rose-700 dark:text-rose-400"
                                    : isRentPaymentsEmpty
                                        ? "text-muted-foreground/80 dark:text-zinc-500"
                                        : "text-emerald-950 dark:text-emerald-400"
                            )}>
                                {hasOverdue ? `₱${overdueAmount.toLocaleString()}` : "₱0.00"}
                            </div>
                            <div>
                                {hasOverdue ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100/90 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60">
                                        <span className="flex size-3.5 items-center justify-center rounded-full bg-rose-600 dark:bg-rose-500 text-white text-[9px] font-black leading-none shrink-0">!</span>
                                        <span>{isFilipino ? `${overdueCount} tenant ang hindi pa bayad` : `${overdueCount} tenant${overdueCount === 1 ? "" : "s"} have not paid`}</span>
                                    </div>
                                ) : isRentPaymentsEmpty ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-muted dark:bg-zinc-800/60 text-muted-foreground dark:text-zinc-300 border border-border/60 dark:border-zinc-700/50">
                                        <span className="size-2 rounded-full bg-muted-foreground/50 dark:bg-zinc-400 shrink-0" />
                                        <span>{totalUnits === 0 ? t("No properties added yet") : t("No active tenants yet")}</span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
                                        <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                                        <span>{t("All rent paid on time")}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom CTA Button */}
                    <div className="pt-2 z-10">
                        {hasOverdue && onOpenOverduePayments ? (
                            <button
                                type="button"
                                onClick={onOpenOverduePayments}
                                className="group w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-rose-800 hover:bg-rose-900 dark:bg-rose-900/80 dark:hover:bg-rose-800 dark:border dark:border-rose-700/60 text-white shadow-xs transition-all flex items-center justify-between cursor-pointer"
                            >
                                <span>{t("View Unpaid Rent")}</span>
                                <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                            </button>
                        ) : isRentPaymentsEmpty ? (
                            totalUnits === 0 ? (
                                <Link
                                    href="/landlord/properties/new"
                                    className="group w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all flex items-center justify-between cursor-pointer"
                                >
                                    <span>{t("Add Property")}</span>
                                    <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                                </Link>
                            ) : (
                                <Link
                                    href="/landlord/tenants"
                                    className="group w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all flex items-center justify-between cursor-pointer"
                                >
                                    <span>{t("Add First Tenant")}</span>
                                    <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                                </Link>
                            )
                        ) : onRecordPayment ? (
                            <button
                                type="button"
                                onClick={onRecordPayment}
                                className="group w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-900/80 dark:hover:bg-emerald-800 dark:border dark:border-emerald-700/60 text-white shadow-xs transition-all flex items-center justify-between cursor-pointer"
                            >
                                <span>{t("Record Payment")}</span>
                                <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                            </button>
                        ) : (
                            <Link
                                href="/landlord/invoices"
                                className="group w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-900/80 dark:hover:bg-emerald-800 dark:border dark:border-emerald-700/60 text-white shadow-xs transition-all flex items-center justify-between cursor-pointer"
                            >
                                <span>{t("View Bills & Receipts")}</span>
                                <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* CARD 2: Room Occupancy */}
                <div className={cn(
                    "relative rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-xs min-h-[250px] transition-all",
                    isRoomsEmpty
                        ? "border border-border/70 bg-card/60 dark:border-zinc-800/80 dark:bg-zinc-950/40"
                        : "border border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-zinc-950/70"
                )}>
                    <div className="z-10">
                        {/* Header Chip */}
                        <div className="flex items-center gap-2.5">
                            <div className={cn(
                                "flex size-7 items-center justify-center rounded-lg text-white shadow-xs shrink-0 transition-colors",
                                isRoomsEmpty
                                    ? "bg-muted text-muted-foreground border border-border/60 dark:border-zinc-700"
                                    : "bg-emerald-800 dark:bg-emerald-700"
                            )}>
                                <Bed className="size-4" aria-hidden="true" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground/80 dark:text-zinc-400">
                                {t("Room Occupancy")}
                            </span>
                        </div>

                        {/* Metric & Status Pill */}
                        <div className="my-5 space-y-3">
                            <div className={cn(
                                "text-3xl sm:text-4xl font-black tracking-tight tabular-nums flex items-baseline transition-colors",
                                isRoomsEmpty
                                    ? "text-muted-foreground/80 dark:text-zinc-500"
                                    : "text-emerald-950 dark:text-emerald-400"
                            )}>
                                {isRoomsEmpty ? (
                                    <span>0 {t("of")} 0</span>
                                ) : (
                                    <>
                                        <span className="text-emerald-950 dark:text-emerald-400">{occupiedUnits}</span>
                                        <span className="text-xl sm:text-2xl font-medium text-muted-foreground/80 dark:text-zinc-400 mx-2">{t("of")}</span>
                                        <span className="text-emerald-950 dark:text-zinc-100">{totalUnits}</span>
                                    </>
                                )}
                            </div>
                            <div>
                                {isRoomsEmpty ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-muted dark:bg-zinc-800/60 text-muted-foreground dark:text-zinc-300 border border-border/60 dark:border-zinc-700/50">
                                        <span className="size-2 rounded-full bg-muted-foreground/50 dark:bg-zinc-400 shrink-0" />
                                        <span>{t("No rooms added yet")}</span>
                                    </div>
                                ) : openUnitsCount > 0 ? (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
                                        <span className="size-2 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
                                        <span>{openUnitsCount} {t(openUnitsCount === 1 ? "room ready for move-in" : "rooms ready for move-in")}</span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
                                        <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                                        <span>{t("All rooms occupied")}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom CTA Button */}
                    <div className="pt-2 z-10">
                        {isRoomsEmpty ? (
                            <Link
                                href="/landlord/unit-map"
                                className="group w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all flex items-center justify-between cursor-pointer"
                            >
                                <span>{t("Set Up Rooms")}</span>
                                <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                            </Link>
                        ) : openUnitsCount > 0 && onOpenVacantUnits ? (
                            <button
                                type="button"
                                onClick={onOpenVacantUnits}
                                className="group w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 text-foreground dark:text-zinc-100 border border-border/80 dark:border-zinc-700/80 shadow-xs transition-all flex items-center justify-between cursor-pointer"
                            >
                                <span>{t("View Empty Rooms")}</span>
                                <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                            </button>
                        ) : (
                            <Link
                                href="/landlord/unit-map"
                                className="group w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 text-foreground dark:text-zinc-100 border border-border/80 dark:border-zinc-700/80 shadow-xs transition-all flex items-center justify-between cursor-pointer"
                            >
                                <span>{openUnitsCount > 0 ? t("View Empty Rooms") : t("View Empty Rooms")}</span>
                                <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* CARD 3: Repairs & Maintenance */}
                <div className={cn(
                    "relative rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-xs min-h-[250px] transition-all",
                    hasMaintenance
                        ? "border border-amber-200/80 bg-amber-50/60 dark:border-amber-900/50 dark:bg-zinc-950/70"
                        : isMaintenanceEmpty
                            ? "border border-border/70 bg-card/60 dark:border-zinc-800/80 dark:bg-zinc-950/40"
                            : "border border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-zinc-950/70"
                )}>
                    <div className="z-10">
                        {/* Header Chip */}
                        <div className="flex items-center gap-2.5">
                            <div className={cn(
                                "flex size-7 items-center justify-center rounded-lg text-white shadow-xs shrink-0 transition-colors",
                                hasMaintenance
                                    ? "bg-amber-700 dark:bg-amber-600"
                                    : isMaintenanceEmpty
                                        ? "bg-muted text-muted-foreground border border-border/60 dark:border-zinc-700"
                                        : "bg-emerald-700 dark:bg-emerald-600"
                            )}>
                                <Wrench className="size-4" aria-hidden="true" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground/80 dark:text-zinc-400">
                                {t("Repairs & Maintenance")}
                            </span>
                        </div>

                        {/* Metric & Status Pill */}
                        <div className="my-5 space-y-3">
                            <div className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums flex items-baseline gap-2">
                                <span className={cn(
                                    "transition-colors",
                                    hasMaintenance
                                        ? "text-amber-700 dark:text-amber-400"
                                        : isMaintenanceEmpty
                                            ? "text-muted-foreground/80 dark:text-zinc-500"
                                            : "text-emerald-950 dark:text-emerald-400"
                                )}>
                                    {maintenanceCount}
                                </span>
                                <span className={cn(
                                    "text-xl sm:text-2xl font-bold transition-colors",
                                    isMaintenanceEmpty ? "text-muted-foreground dark:text-zinc-400" : "text-foreground dark:text-zinc-100"
                                )}>
                                    {t("Open Requests")}
                                </span>
                            </div>
                            <div>
                                {hasMaintenance ? (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100/90 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60">
                                        <span className="size-2 rounded-full bg-amber-600 dark:bg-amber-400 shrink-0" />
                                        <span>{t("Needs landlord review")}</span>
                                    </div>
                                ) : isMaintenanceEmpty ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-muted dark:bg-zinc-800/60 text-muted-foreground dark:text-zinc-300 border border-border/60 dark:border-zinc-700/50">
                                        <span className="size-2 rounded-full bg-muted-foreground/50 dark:bg-zinc-400 shrink-0" />
                                        <span>{t("No maintenance records")}</span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
                                        <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                                        <span>{t("All repairs resolved")}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom CTA Button */}
                    <div className="pt-2 z-10">
                        <Link
                            href="/landlord/maintenance"
                            className="group w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 text-foreground dark:text-zinc-100 border border-border/80 dark:border-zinc-700/80 shadow-xs transition-all flex items-center justify-between cursor-pointer"
                        >
                            <span>{isMaintenanceEmpty ? t("Maintenance Desk") : t("View Repair Requests")}</span>
                            <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
