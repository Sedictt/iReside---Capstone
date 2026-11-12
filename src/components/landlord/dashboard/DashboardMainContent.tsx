"use client";

import React from "react";
import Link from "next/link";
import { UserPlus, QrCode, Wrench, Map, Printer, HelpCircle, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface DashboardMainContentProps {
    title: string;
    subtitle: string;
    time: Date;
    isTourOpen?: boolean;
    currentTourStep?: number;
    onNewWalkIn?: () => void;
    onCollectPayment?: () => void;
    onCreateInvite?: () => void;
    onOpenFlyer?: () => void;
}

export function DashboardMainContent({
    title,
    subtitle,
    time,
    isTourOpen = false,
    currentTourStep = 0,
    onNewWalkIn,
    onCollectPayment,
    onCreateInvite,
    onOpenFlyer
}: DashboardMainContentProps) {
    const { t, locale } = useLanguage();
    const applicationsCtaClassName = "group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-2.5 min-h-[40px] w-auto active:scale-95 transition-colors shadow-xs cursor-pointer";
    const collectPaymentCtaClassName = "group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-muted/50 hover:bg-muted text-foreground border border-border font-bold px-4 py-2.5 min-h-[40px] w-auto active:scale-95 transition-colors shrink-0 cursor-pointer";

    return (
        <>
            {/* Desktop and Tablet Layout */}
            <div data-tour-id="tour-welcome-area" className="hidden sm:flex flex-col justify-center max-w-2xl w-full">
                {/* Date Line */}
                <div className="mb-1.5 flex items-center gap-2 w-fit">
                    <span className="size-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {time.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                </div>

                <h1 className="mb-1 text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
                    {title}
                    <span className="text-primary">.</span>
                </h1>
                
                <p className="max-w-lg text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {subtitle}
                </p>

                {/* Navigation Actions */}
                <div 
                    data-tour-id="tour-quick-actions" 
                    className={cn(
                        "relative flex sm:flex-row sm:items-center gap-2 mt-4 w-auto flex-wrap rounded-2xl transition-all duration-300",
                        isTourOpen && currentTourStep === 0 && "ring-4 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_30px_rgba(155,119,255,0.85)] animate-pulse bg-primary/10 p-2 z-30"
                    )}
                >
                    {isTourOpen && currentTourStep === 0 && (
                        <span className="absolute -top-2 -right-2 flex size-3 z-40">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full size-3 bg-primary"></span>
                        </span>
                    )}
                    {onNewWalkIn ? (
                        <button 
                            onClick={onNewWalkIn}
                            className={applicationsCtaClassName}
                        >
                            <UserPlus className="size-4 shrink-0" />
                            <span className="text-xs font-bold">{t("New Application")}</span>
                        </button>
                    ) : (
                        <Link href="/landlord/applications?action=tenant-application" className={applicationsCtaClassName}>
                            <UserPlus className="size-4 shrink-0" />
                            <span className="text-xs font-bold">{t("New Application")}</span>
                        </Link>
                    )}

                    {onCollectPayment ? (
                        <button 
                            onClick={onCollectPayment}
                            className={collectPaymentCtaClassName}
                            title={t("Record Cash or In-Person Rent Payment")}
                        >
                            <Banknote className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="text-xs font-bold">{t("Record Payment")}</span>
                        </button>
                    ) : (
                        <Link href="/landlord/invoices" className={collectPaymentCtaClassName} title={t("Record Cash or In-Person Rent Payment")}>
                            <Banknote className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="text-xs font-bold">{t("Record Payment")}</span>
                        </Link>
                    )}
                    
                    <div className="h-5 w-px bg-border mx-1 hidden md:block" aria-hidden="true" />

                    <div className="flex items-center justify-center gap-1.5 w-auto">
                        {onCreateInvite && (
                            <button
                                onClick={onCreateInvite}
                                title={t("Create Invite link")}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors shrink-0 cursor-pointer"
                            >
                                <QrCode className="size-4" />
                            </button>
                        )}
                        {onOpenFlyer ? (
                            <button
                                onClick={onOpenFlyer}
                                title={t("Lobby QR Code Flyer Poster")}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors shrink-0 cursor-pointer"
                            >
                                <Printer className="size-4" />
                            </button>
                        ) : (
                            <Link
                                href="/landlord/flyer"
                                title={t("Lobby QR Code Flyer Poster")}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors shrink-0 cursor-pointer"
                            >
                                <Printer className="size-4" />
                            </Link>
                        )}
                        <Link 
                            href="/landlord/maintenance" 
                            title={t("Maintenance Queue")}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors shrink-0 cursor-pointer"
                        >
                            <Wrench className="size-4" />
                        </Link>
                        <Link 
                            href="/landlord/unit-map" 
                            title={t("Unit Map")}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors shrink-0 cursor-pointer"
                        >
                            <Map className="size-4" />
                        </Link>
                        <Link 
                            href="/landlord/docs" 
                            title={t("Help & User Manual")}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors shrink-0 cursor-pointer"
                        >
                            <HelpCircle className="size-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Dedicated Layout (Clean, non-cluttered, unified single row) */}
            <div className="flex sm:hidden flex-col w-full text-left gap-3 pr-14">
                {/* Date Badge */}
                <div className="flex items-center gap-2 w-fit rounded-full neumorphic-inset-card px-2.5 py-1">
                    <div className="relative">
                        <div className="size-1 rounded-full bg-primary animate-ping" />
                        <div className="absolute inset-0 size-1 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[0.12em] text-foreground/80">
                        {time.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}
                        {" • "}
                        {time.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </span>
                </div>

                {/* Hero Greeting Section */}
                <div className="space-y-0.5">
                    <h1 className="text-xl font-black tracking-tight text-foreground leading-tight">
                        {title}
                        <span className="text-primary prose-invert">.</span>
                    </h1>
                    <p className="max-w-xs text-[11px] font-medium text-muted-foreground leading-relaxed">
                        {subtitle}
                    </p>
                </div>

                {/* Mobile Quick Action Bar (Unified Single Row) */}
                <div 
                    data-tour-id="tour-quick-actions-mobile" 
                    className={cn(
                        "relative flex flex-row items-center gap-2 mt-2 w-full flex-wrap rounded-xl transition-all duration-300",
                        isTourOpen && currentTourStep === 0 && "ring-4 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_30px_rgba(155,119,255,0.85)] animate-pulse bg-primary/10 p-1.5 z-30"
                    )}
                >
                    {isTourOpen && currentTourStep === 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex size-2.5 z-40">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full size-2.5 bg-primary"></span>
                        </span>
                    )}
                    {onNewWalkIn ? (
                        <button 
                            onClick={onNewWalkIn}
                            className="group relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 min-w-[100px] font-bold shadow-xs active:scale-95 transition-all"
                        >
                            <UserPlus className="size-3.5 font-black" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{t("New App")}</span>
                        </button>
                    ) : (
                        <Link 
                            href="/landlord/applications?action=tenant-application"
                            className="group relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 min-w-[100px] font-bold shadow-xs active:scale-95 transition-all"
                        >
                            <UserPlus className="size-3.5 font-black" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{t("New App")}</span>
                        </Link>
                    )}

                    {onCollectPayment ? (
                        <button 
                            onClick={onCollectPayment}
                            className="group relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-background hover:bg-emerald-500/10 border border-emerald-500/30 text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 py-2.5 min-w-[100px] font-bold shadow-xs active:scale-95 transition-all"
                            title={t("Record Cash or In-Person Rent Payment")}
                        >
                            <Banknote className="size-3.5 font-black text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{t("Record")}</span>
                        </button>
                    ) : (
                        <Link 
                            href="/landlord/invoices"
                            className="group relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-background hover:bg-emerald-500/10 border border-emerald-500/30 text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 py-2.5 min-w-[100px] font-bold shadow-xs active:scale-95 transition-all"
                            title={t("Record Cash or In-Person Rent Payment")}
                        >
                            <Banknote className="size-3.5 font-black text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{t("Record")}</span>
                        </Link>
                    )}

                    <div className="flex items-center gap-1.5 shrink-0">
                        {onCreateInvite && (
                            <button
                                onClick={onCreateInvite}
                                title={t("Create Invite link")}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-background hover:bg-muted text-primary border border-border/70 shadow-2xs active:scale-95"
                            >
                                <QrCode className="size-4" />
                            </button>
                        )}
                        {onOpenFlyer ? (
                            <button
                                onClick={onOpenFlyer}
                                title={t("Print Lobby Poster")}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-background hover:bg-muted border border-border/70 shadow-2xs active:scale-95 text-foreground hover:text-primary"
                            >
                                <Printer className="size-4" />
                            </button>
                        ) : (
                            <Link
                                href="/landlord/flyer"
                                title={t("Print Lobby Poster")}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-background hover:bg-muted border border-border/70 shadow-2xs active:scale-95 text-foreground hover:text-primary"
                            >
                                <Printer className="size-4" />
                            </Link>
                        )}
                        <Link 
                            href="/landlord/maintenance" 
                            title={t("Maintenance Queue")}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-background hover:bg-muted text-amber-500 border border-border/70 shadow-2xs active:scale-95"
                        >
                            <Wrench className="size-4" />
                        </Link>
                        <Link 
                            href="/landlord/unit-map" 
                            title={t("Unit Map")}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-background hover:bg-muted text-rose-500 border border-border/70 shadow-2xs active:scale-95"
                        >
                            <Map className="size-4" />
                        </Link>
                        <Link 
                            href="/landlord/docs" 
                            title={t("Help & User Manual")}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-background hover:bg-muted border border-border/70 shadow-2xs active:scale-95 text-foreground hover:text-primary"
                        >
                            <HelpCircle className="size-4 text-indigo-400" />
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
