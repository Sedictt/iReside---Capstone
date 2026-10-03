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
    const { t, isFilipino } = useLanguage();
    const applicationsCtaClassName = "group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4.5 sm:px-5 py-2.5 w-auto active:scale-95 transition-all shadow-xs cursor-pointer";
    const collectPaymentCtaClassName = "group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-background hover:bg-emerald-500/10 text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 font-bold px-4.5 sm:px-5 py-2.5 w-auto active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer";

    return (
        <>
            {/* Desktop and Tablet Layout */}
            <div data-tour-id="tour-welcome-area" className="hidden sm:flex flex-col justify-center max-w-2xl w-full">
                {/* Badge */}
                <div className="mb-2 sm:mb-2.5 flex items-center gap-2 w-fit rounded-full bg-muted/60 border border-border/60 px-3 py-1">
                    <div className="relative">
                        <div className="size-1.5 rounded-full bg-primary animate-ping" />
                        <div className="absolute inset-0 size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/80">
                        {time.toLocaleDateString(isFilipino ? 'fil-PH' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                </div>

                <h1 className="mb-1 text-2xl md:text-3xl font-black tracking-tight text-foreground leading-[1.15]">
                    {title}
                    <span className="text-primary prose-invert">.</span>
                </h1>
                
                <p className="max-w-lg text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                    {subtitle}
                </p>

                {/* Navigation Actions */}
                <div 
                    data-tour-id="tour-quick-actions" 
                    className={cn(
                        "relative flex sm:flex-row sm:items-center gap-2.5 mt-3.5 sm:mt-4 w-auto flex-wrap rounded-2xl transition-all duration-300",
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
                            <div className="absolute inset-0 bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-primary-foreground/10" />
                            <UserPlus className="size-3.5 font-black relative z-10" />
                            <span className="text-xs font-black uppercase tracking-wider relative z-10">{t("New Application")}</span>
                        </button>
                    ) : (
                        <Link href="/landlord/applications?action=tenant-application" className={applicationsCtaClassName}>
                            <div className="absolute inset-0 bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-primary-foreground/10" />
                            <UserPlus className="size-3.5 font-black relative z-10" />
                            <span className="text-xs font-black uppercase tracking-wider relative z-10">{t("New Application")}</span>
                        </Link>
                    )}

                    {onCollectPayment ? (
                        <button 
                            onClick={onCollectPayment}
                            className={collectPaymentCtaClassName}
                            title="Record Cash or In-Person Rent Payment"
                        >
                            <Banknote className="size-3.5 text-emerald-500 font-black relative z-10" />
                            <span className="text-xs font-black uppercase tracking-wider relative z-10">{t("Record Payment")}</span>
                        </button>
                    ) : (
                        <Link href="/landlord/invoices" className={collectPaymentCtaClassName} title="Record Cash or In-Person Rent Payment">
                            <Banknote className="size-3.5 text-emerald-500 font-black relative z-10" />
                            <span className="text-xs font-black uppercase tracking-wider relative z-10">{t("Record Payment")}</span>
                        </Link>
                    )}
                    
                    <div className="flex items-center justify-center gap-2 w-auto">
                        {onCreateInvite && (
                            <button
                                onClick={onCreateInvite}
                                title="Create Invite link"
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-background hover:bg-muted text-primary border border-border/70 hover:border-border shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer"
                            >
                                <QrCode className="size-4" />
                            </button>
                        )}
                        {onOpenFlyer ? (
                            <button
                                onClick={onOpenFlyer}
                                title="Lobby QR Code Flyer Poster"
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-background hover:bg-muted text-foreground hover:text-primary border border-border/70 hover:border-border shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer"
                            >
                                <Printer className="size-4" />
                            </button>
                        ) : (
                            <Link
                                href="/landlord/flyer"
                                title="Lobby QR Code Flyer Poster"
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-background hover:bg-muted text-foreground hover:text-primary border border-border/70 hover:border-border shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer"
                            >
                                <Printer className="size-4" />
                            </Link>
                        )}
                        <Link 
                            href="/landlord/maintenance" 
                            title="Maintenance Queue"
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-background hover:bg-muted text-amber-500 border border-border/70 hover:border-border shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer"
                        >
                            <Wrench className="size-4" />
                        </Link>
                        <Link 
                            href="/landlord/unit-map" 
                            title="Unit Map"
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-background hover:bg-muted text-rose-500 border border-border/70 hover:border-border shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer"
                        >
                            <Map className="size-4" />
                        </Link>
                        <Link 
                            href="/landlord/docs" 
                            title="Help & User Manual"
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-background hover:bg-muted text-foreground hover:text-primary border border-border/70 hover:border-border shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer"
                        >
                            <HelpCircle className="size-4 text-indigo-400" />
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
                        {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {" • "}
                        {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
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
                            <span className="text-[10px] font-black uppercase tracking-wider">{isFilipino ? "Aplikasyon" : "New App"}</span>
                        </button>
                    ) : (
                        <Link 
                            href="/landlord/applications?action=tenant-application"
                            className="group relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 min-w-[100px] font-bold shadow-xs active:scale-95 transition-all"
                        >
                            <UserPlus className="size-3.5 font-black" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{isFilipino ? "Aplikasyon" : "New App"}</span>
                        </Link>
                    )}

                    {onCollectPayment ? (
                        <button 
                            onClick={onCollectPayment}
                            className="group relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-background hover:bg-emerald-500/10 border border-emerald-500/30 text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 py-2.5 min-w-[100px] font-bold shadow-xs active:scale-95 transition-all"
                            title="Record Cash or In-Person Rent Payment"
                        >
                            <Banknote className="size-3.5 font-black text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{isFilipino ? "Magbayad" : "Record"}</span>
                        </button>
                    ) : (
                        <Link 
                            href="/landlord/invoices"
                            className="group relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-background hover:bg-emerald-500/10 border border-emerald-500/30 text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 py-2.5 min-w-[100px] font-bold shadow-xs active:scale-95 transition-all"
                            title="Record Cash or In-Person Rent Payment"
                        >
                            <Banknote className="size-3.5 font-black text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{isFilipino ? "Magbayad" : "Record"}</span>
                        </Link>
                    )}

                    <div className="flex items-center gap-1.5 shrink-0">
                        {onCreateInvite && (
                            <button
                                onClick={onCreateInvite}
                                title="Create Invite link"
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-background hover:bg-muted text-primary border border-border/70 shadow-2xs active:scale-95"
                            >
                                <QrCode className="size-4" />
                            </button>
                        )}
                        {onOpenFlyer ? (
                            <button
                                onClick={onOpenFlyer}
                                title="Print Lobby Poster"
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-background hover:bg-muted border border-border/70 shadow-2xs active:scale-95 text-foreground hover:text-primary"
                            >
                                <Printer className="size-4" />
                            </button>
                        ) : (
                            <Link
                                href="/landlord/flyer"
                                title="Print Lobby Poster"
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-background hover:bg-muted border border-border/70 shadow-2xs active:scale-95 text-foreground hover:text-primary"
                            >
                                <Printer className="size-4" />
                            </Link>
                        )}
                        <Link 
                            href="/landlord/maintenance" 
                            title="Maintenance Queue"
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-background hover:bg-muted text-amber-500 border border-border/70 shadow-2xs active:scale-95"
                        >
                            <Wrench className="size-4" />
                        </Link>
                        <Link 
                            href="/landlord/unit-map" 
                            title="Unit Map"
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-background hover:bg-muted text-rose-500 border border-border/70 shadow-2xs active:scale-95"
                        >
                            <Map className="size-4" />
                        </Link>
                        <Link 
                            href="/landlord/docs" 
                            title="Help & User Manual"
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
