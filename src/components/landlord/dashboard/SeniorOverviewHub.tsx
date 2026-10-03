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
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100/80 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60">
                                    <span className="flex size-3.5 items-center justify-center rounded-full bg-rose-600 text-white text-[9px] font-black leading-none shrink-0">!</span>
                                    <span>{t("Needs Attention")}</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
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
                    "relative rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-xs min-h-[250px] transition-colors",
                    hasOverdue
                        ? "border border-rose-200/70 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/90 via-pink-50/30 to-white dark:from-rose-950/20 dark:via-rose-900/10 dark:to-zinc-900/90"
                        : isRentPaymentsEmpty
                            ? "border border-border/70 dark:border-zinc-800 bg-card/60 dark:bg-zinc-900/60"
                            : "border border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 via-green-50/20 to-white dark:from-emerald-950/20 dark:via-emerald-900/10 dark:to-zinc-900/90"
                )}>
                    {/* Bill / Document Watermark Illustration */}
                    <div className="absolute -right-2 top-8 pointer-events-none select-none" aria-hidden="true">
                        {hasOverdue ? (
                            <svg width="135" height="135" viewBox="0 0 135 135" fill="none" className="text-rose-300/40 dark:text-rose-700/20">
                                <rect x="25" y="15" width="75" height="95" rx="14" fill="currentColor" fillOpacity="0.45" />
                                <line x1="42" y1="40" x2="82" y2="40" stroke="white" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.85" />
                                <line x1="42" y1="58" x2="72" y2="58" stroke="white" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.85" />
                                <circle cx="95" cy="90" r="18" fill="#E11D48" fillOpacity="0.35" />
                                <circle cx="95" cy="90" r="15" fill="#E11D48" />
                                <text x="95" y="96" textAnchor="middle" fill="white" fontSize="17" fontWeight="900" fontFamily="sans-serif">!</text>
                            </svg>
                        ) : isRentPaymentsEmpty ? (
                            <svg width="135" height="135" viewBox="0 0 135 135" fill="none" className="text-muted-foreground/15 dark:text-zinc-700/20">
                                <rect x="25" y="15" width="75" height="95" rx="14" fill="currentColor" fillOpacity="0.35" />
                                <line x1="42" y1="40" x2="82" y2="40" stroke="white" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.5" />
                                <line x1="42" y1="58" x2="72" y2="58" stroke="white" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.5" />
                            </svg>
                        ) : (
                            <svg width="135" height="135" viewBox="0 0 135 135" fill="none" className="text-emerald-300/40 dark:text-emerald-700/20">
                                <rect x="25" y="15" width="75" height="95" rx="14" fill="currentColor" fillOpacity="0.45" />
                                <line x1="42" y1="40" x2="82" y2="40" stroke="white" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.85" />
                                <line x1="42" y1="58" x2="72" y2="58" stroke="white" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.85" />
                                <circle cx="95" cy="90" r="18" fill="#059669" fillOpacity="0.35" />
                                <circle cx="95" cy="90" r="15" fill="#059669" />
                                <path d="M89 90 L93.5 94.5 L101 86" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>

                    <div className="z-10">
                        {/* Header Chip */}
                        <div className="flex items-center gap-2.5">
                            <div className={cn(
                                "flex size-7 items-center justify-center rounded-lg text-white shadow-xs shrink-0 transition-colors",
                                hasOverdue
                                    ? "bg-rose-700 dark:bg-rose-600"
                                    : isRentPaymentsEmpty
                                        ? "bg-muted text-muted-foreground border border-border/60"
                                        : "bg-emerald-700 dark:bg-emerald-600"
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
                                        : "text-emerald-950 dark:text-emerald-300"
                            )}>
                                {hasOverdue ? `₱${overdueAmount.toLocaleString()}` : "₱0.00"}
                            </div>
                            <div>
                                {hasOverdue ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100/90 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60">
                                        <span className="flex size-3.5 items-center justify-center rounded-full bg-rose-600 text-white text-[9px] font-black leading-none shrink-0">!</span>
                                        <span>{isFilipino ? `${overdueCount} tenant ang hindi pa bayad` : `${overdueCount} tenant${overdueCount === 1 ? "" : "s"} have not paid`}</span>
                                    </div>
                                ) : isRentPaymentsEmpty ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border/60">
                                        <span className="size-2 rounded-full bg-muted-foreground/50 shrink-0" />
                                        <span>{totalUnits === 0 ? t("No properties added yet") : t("No active tenants yet")}</span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
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
                                className="group w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-rose-800 hover:bg-rose-900 text-white shadow-xs transition-all flex items-center justify-between cursor-pointer"
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
                                className="group w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all flex items-center justify-between cursor-pointer"
                            >
                                <span>{t("Record Payment")}</span>
                                <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                            </button>
                        ) : (
                            <Link
                                href="/landlord/invoices"
                                className="group w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all flex items-center justify-between cursor-pointer"
                            >
                                <span>{t("View Bills & Receipts")}</span>
                                <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* CARD 2: Room Occupancy */}
                <div className={cn(
                    "relative rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-xs min-h-[250px] transition-colors",
                    isRoomsEmpty
                        ? "border border-border/70 dark:border-zinc-800 bg-card/60 dark:bg-zinc-900/60"
                        : "border border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 via-green-50/20 to-white dark:from-emerald-950/20 dark:via-emerald-900/10 dark:to-zinc-900/90"
                )}>
                    {/* Bed Watermark Illustration */}
                    <div className="absolute -right-1 top-10 pointer-events-none select-none" aria-hidden="true">
                        <svg width="130" height="130" viewBox="0 0 130 130" fill="none" className={isRoomsEmpty ? "text-muted-foreground/15 dark:text-zinc-700/20" : "text-emerald-300/40 dark:text-emerald-700/20"}>
                            <rect x="25" y="30" width="14" height="60" rx="4" fill="currentColor" fillOpacity={isRoomsEmpty ? "0.3" : "0.5"} />
                            <rect x="44" y="44" width="24" height="18" rx="4" fill="currentColor" fillOpacity={isRoomsEmpty ? "0.4" : "0.7"} />
                            <rect x="42" y="64" width="70" height="18" rx="4" fill="currentColor" fillOpacity={isRoomsEmpty ? "0.2" : "0.4"} />
                            <rect x="108" y="55" width="10" height="35" rx="3" fill="currentColor" fillOpacity={isRoomsEmpty ? "0.3" : "0.5"} />
                        </svg>
                    </div>

                    <div className="z-10">
                        {/* Header Chip */}
                        <div className="flex items-center gap-2.5">
                            <div className={cn(
                                "flex size-7 items-center justify-center rounded-lg text-white shadow-xs shrink-0 transition-colors",
                                isRoomsEmpty
                                    ? "bg-muted text-muted-foreground border border-border/60"
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
                                    : "text-emerald-950 dark:text-emerald-300"
                            )}>
                                {isRoomsEmpty ? (
                                    <span>0 {t("of")} 0</span>
                                ) : (
                                    <>
                                        <span>{occupiedUnits}</span>
                                        <span className="text-xl sm:text-2xl font-medium text-muted-foreground/80 mx-2">{t("of")}</span>
                                        <span>{totalUnits}</span>
                                    </>
                                )}
                            </div>
                            <div>
                                {isRoomsEmpty ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border/60">
                                        <span className="size-2 rounded-full bg-muted-foreground/50 shrink-0" />
                                        <span>{t("No rooms added yet")}</span>
                                    </div>
                                ) : openUnitsCount > 0 ? (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
                                        <span className="size-2 rounded-full bg-emerald-600 shrink-0" />
                                        <span>{openUnitsCount} {t(openUnitsCount === 1 ? "room ready for move-in" : "rooms ready for move-in")}</span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
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
                                className="group w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-foreground border border-border/80 shadow-xs transition-all flex items-center justify-between cursor-pointer"
                            >
                                <span>{t("View Empty Rooms")}</span>
                                <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                            </button>
                        ) : (
                            <Link
                                href="/landlord/unit-map"
                                className="group w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-foreground border border-border/80 shadow-xs transition-all flex items-center justify-between cursor-pointer"
                            >
                                <span>{openUnitsCount > 0 ? t("View Empty Rooms") : t("View Empty Rooms")}</span>
                                <ArrowRight className="size-4 transition-transform motion-reduce:transition-none group-hover:translate-x-1" aria-hidden="true" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* CARD 3: Repairs & Maintenance */}
                <div className={cn(
                    "relative rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-xs min-h-[250px] transition-colors",
                    hasMaintenance
                        ? "border border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/80 via-orange-50/20 to-white dark:from-amber-950/20 dark:via-amber-900/10 dark:to-zinc-900/90"
                        : isMaintenanceEmpty
                            ? "border border-border/70 dark:border-zinc-800 bg-card/60 dark:bg-zinc-900/60"
                            : "border border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 via-green-50/20 to-white dark:from-emerald-950/20 dark:via-emerald-900/10 dark:to-zinc-900/90"
                )}>
                    {/* Wrench Watermark Illustration */}
                    <div className="absolute right-0 top-8 pointer-events-none select-none" aria-hidden="true">
                        <svg width="130" height="130" viewBox="0 0 130 130" fill="none" className={
                            hasMaintenance
                                ? "text-amber-300/40 dark:text-amber-700/20"
                                : isMaintenanceEmpty
                                    ? "text-muted-foreground/15 dark:text-zinc-700/20"
                                    : "text-emerald-300/40 dark:text-emerald-700/20"
                        }>
                            <path
                                d="M72 26 C64 26 57 31 55 38 L38 55 L34 51 C30 47 24 47 20 51 C16 55 16 61 20 65 L26 71 L16 81 C13 84 13 90 16 93 C19 96 25 96 28 93 L38 83 L44 89 C48 93 54 93 58 89 C62 85 62 79 58 75 L54 71 L71 54 C78 52 83 45 83 36 C83 32 81 30 79 30 C77 30 75 32 73 34 C71 36 67 36 65 34 C63 32 63 28 65 26 Z"
                                fill="currentColor"
                                fillOpacity={isMaintenanceEmpty ? "0.3" : "0.45"}
                                transform="rotate(25 60 60)"
                            />
                            {!hasMaintenance && !isMaintenanceEmpty && (
                                <>
                                    <circle cx="95" cy="90" r="18" fill="#059669" fillOpacity="0.35" />
                                    <circle cx="95" cy="90" r="15" fill="#059669" />
                                    <path d="M89 90 L93.5 94.5 L101 86" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </>
                            )}
                        </svg>
                    </div>

                    <div className="z-10">
                        {/* Header Chip */}
                        <div className="flex items-center gap-2.5">
                            <div className={cn(
                                "flex size-7 items-center justify-center rounded-lg text-white shadow-xs shrink-0 transition-colors",
                                hasMaintenance
                                    ? "bg-amber-700 dark:bg-amber-600"
                                    : isMaintenanceEmpty
                                        ? "bg-muted text-muted-foreground border border-border/60"
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
                                            : "text-emerald-950 dark:text-emerald-300"
                                )}>
                                    {maintenanceCount}
                                </span>
                                <span className={cn(
                                    "text-xl sm:text-2xl font-bold transition-colors",
                                    isMaintenanceEmpty ? "text-muted-foreground" : "text-foreground"
                                )}>
                                    {t("Open Requests")}
                                </span>
                            </div>
                            <div>
                                {hasMaintenance ? (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100/90 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60">
                                        <span className="size-2 rounded-full bg-amber-600 shrink-0" />
                                        <span>{t("Needs landlord review")}</span>
                                    </div>
                                ) : isMaintenanceEmpty ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border/60">
                                        <span className="size-2 rounded-full bg-muted-foreground/50 shrink-0" />
                                        <span>{t("No maintenance records")}</span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
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
                            className="group w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-foreground border border-border/80 shadow-xs transition-all flex items-center justify-between cursor-pointer"
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
