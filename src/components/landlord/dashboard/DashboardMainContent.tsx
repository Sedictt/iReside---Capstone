"use client";

import React from "react";
import Link from "next/link";
import { UserPlus, QrCode, Wrench, Map, Printer, HelpCircle, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardMainContentProps {
    title: string;
    subtitle: string;
    time: Date;
    onNewWalkIn?: () => void;
    onCollectPayment?: () => void;
    onCreateInvite?: () => void;
    onOpenFlyer?: () => void;
}

export function DashboardMainContent({
    title,
    subtitle,
    time,
    onNewWalkIn,
    onCollectPayment,
    onCreateInvite,
    onOpenFlyer
}: DashboardMainContentProps) {
    const applicationsCtaClassName = "group relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl neumorphic-primary landlord-applications-cta px-6 sm:px-8 py-4 w-auto";
    const collectPaymentCtaClassName = "group relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl neumorphic-extruded border border-emerald-500/20 hover:border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10 px-6 py-4 w-auto active:scale-95 transition-all text-foreground hover:text-emerald-400 shrink-0";

    return (
        <>
            {/* Desktop and Tablet Layout */}
            <div data-tour-id="tour-welcome-area" className="hidden sm:flex flex-col justify-center max-w-2xl w-full">
                {/* Badge */}
                <div className="mb-4 sm:mb-6 flex items-center gap-2 w-fit rounded-full neumorphic-inset-card px-4 py-2">
                    <div className="relative">
                        <div className="size-2 rounded-full bg-primary animate-ping" />
                        <div className="absolute inset-0 size-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/80">
                        {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                </div>

                <h1 className="mb-4 text-3xl md:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
                    {title}
                    <span className="text-primary prose-invert">.</span>
                </h1>
                
                <p className="max-w-lg text-base font-medium text-muted-foreground md:text-xl leading-relaxed">
                    {subtitle}
                </p>

                {/* Navigation Actions */}
                <div className="flex sm:flex-row sm:items-center gap-3 mt-8 w-auto flex-wrap">
                    {onNewWalkIn ? (
                        <button 
                            onClick={onNewWalkIn}
                            className={applicationsCtaClassName}
                        >
                            <div className="absolute inset-0 bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-primary-foreground/10" />
                            <UserPlus className="size-4 font-black relative z-10" />
                            <span className="text-sm font-black uppercase tracking-tight relative z-10">New Application</span>
                        </button>
                    ) : (
                        <Link href="/landlord/applications?action=tenant-application" className={applicationsCtaClassName}>
                            <div className="absolute inset-0 bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-primary-foreground/10" />
                            <UserPlus className="size-4 font-black relative z-10" />
                            <span className="text-sm font-black uppercase tracking-tight relative z-10">New Application</span>
                        </Link>
                    )}

                    {onCollectPayment ? (
                        <button 
                            onClick={onCollectPayment}
                            className={collectPaymentCtaClassName}
                            title="Record Cash or Offline Rent Collection"
                        >
                            <Banknote className="size-4 text-emerald-500 font-black relative z-10" />
                            <span className="text-sm font-black uppercase tracking-tight relative z-10">Collect Payment</span>
                        </button>
                    ) : (
                        <Link href="/landlord/invoices" className={collectPaymentCtaClassName}>
                            <Banknote className="size-4 text-emerald-500 font-black relative z-10" />
                            <span className="text-sm font-black uppercase tracking-tight relative z-10">Collect Payment</span>
                        </Link>
                    )}
                    
                    <div className="flex items-center justify-center gap-2.5 w-auto">
                        {onCreateInvite && (
                            <button
                                onClick={onCreateInvite}
                                title="Create Invite link"
                                className="flex h-14 w-14 items-center justify-center rounded-2xl neumorphic-extruded active:scale-95 shrink-0"
                            >
                                <QrCode className="size-5 text-primary" />
                            </button>
                        )}
                        {onOpenFlyer ? (
                            <button
                                onClick={onOpenFlyer}
                                title="Lobby QR Code Flyer Poster"
                                className="flex h-14 w-14 items-center justify-center rounded-2xl neumorphic-extruded active:scale-95 shrink-0 text-foreground hover:text-primary transition-colors"
                            >
                                <Printer className="size-5" />
                            </button>
                        ) : (
                            <Link
                                href="/landlord/flyer"
                                title="Lobby QR Code Flyer Poster"
                                className="flex h-14 w-14 items-center justify-center rounded-2xl neumorphic-extruded active:scale-95 shrink-0 text-foreground hover:text-primary transition-colors"
                            >
                                <Printer className="size-5" />
                            </Link>
                        )}
                        <Link 
                            href="/landlord/maintenance" 
                            title="Maintenance Queue"
                            className="flex h-14 w-14 items-center justify-center rounded-2xl neumorphic-extruded active:scale-95 shrink-0"
                        >
                            <Wrench className="size-5 text-amber-500" />
                        </Link>
                        <Link 
                            href="/landlord/unit-map" 
                            title="Unit Map"
                            className="flex h-14 w-14 items-center justify-center rounded-2xl neumorphic-extruded active:scale-95 shrink-0 text-foreground hover:text-rose-500 transition-colors"
                        >
                            <Map className="size-5 text-rose-500" />
                        </Link>
                        <Link 
                            href="/landlord/docs" 
                            title="Help & User Manual"
                            className="flex h-14 w-14 items-center justify-center rounded-2xl neumorphic-extruded active:scale-95 shrink-0 text-foreground hover:text-primary transition-colors"
                        >
                            <HelpCircle className="size-5 text-indigo-400" />
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
                <div className="flex flex-row items-center gap-2 mt-2 w-full flex-wrap">
                    {onNewWalkIn ? (
                        <button 
                            onClick={onNewWalkIn}
                            className="group relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl neumorphic-primary py-2.5 min-w-[100px]"
                        >
                            <UserPlus className="size-3.5 font-black" />
                            <span className="text-[10px] font-black uppercase tracking-wider">New App</span>
                        </button>
                    ) : (
                        <Link 
                            href="/landlord/applications?action=tenant-application"
                            className="group relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl neumorphic-primary py-2.5 min-w-[100px]"
                        >
                            <UserPlus className="size-3.5 font-black" />
                            <span className="text-[10px] font-black uppercase tracking-wider">New App</span>
                        </Link>
                    )}

                    {onCollectPayment ? (
                        <button 
                            onClick={onCollectPayment}
                            className="group relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl neumorphic-extruded border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 py-2.5 min-w-[100px]"
                        >
                            <Banknote className="size-3.5 font-black text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Collect</span>
                        </button>
                    ) : (
                        <Link 
                            href="/landlord/invoices"
                            className="group relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl neumorphic-extruded border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 py-2.5 min-w-[100px]"
                        >
                            <Banknote className="size-3.5 font-black text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Collect</span>
                        </Link>
                    )}

                    <div className="flex items-center gap-1.5 shrink-0">
                        {onCreateInvite && (
                            <button
                                onClick={onCreateInvite}
                                title="Create Invite link"
                                className="flex h-9 w-9 items-center justify-center rounded-xl neumorphic-extruded active:scale-95"
                            >
                                <QrCode className="size-4 text-primary" />
                            </button>
                        )}
                        {onOpenFlyer ? (
                            <button
                                onClick={onOpenFlyer}
                                title="Print Lobby Poster"
                                className="flex h-9 w-9 items-center justify-center rounded-xl neumorphic-extruded active:scale-95 text-foreground hover:text-primary"
                            >
                                <Printer className="size-4" />
                            </button>
                        ) : (
                            <Link
                                href="/landlord/flyer"
                                title="Print Lobby Poster"
                                className="flex h-9 w-9 items-center justify-center rounded-xl neumorphic-extruded active:scale-95 text-foreground hover:text-primary"
                            >
                                <Printer className="size-4" />
                            </Link>
                        )}
                        <Link 
                            href="/landlord/maintenance" 
                            title="Maintenance Queue"
                            className="flex h-9 w-9 items-center justify-center rounded-xl neumorphic-extruded active:scale-95"
                        >
                            <Wrench className="size-4 text-amber-500" />
                        </Link>
                        <Link 
                            href="/landlord/unit-map" 
                            title="Unit Map"
                            className="flex h-9 w-9 items-center justify-center rounded-xl neumorphic-extruded active:scale-95"
                        >
                            <Map className="size-4 text-rose-500" />
                        </Link>
                        <Link 
                            href="/landlord/docs" 
                            title="Help & User Manual"
                            className="flex h-9 w-9 items-center justify-center rounded-xl neumorphic-extruded active:scale-95 text-foreground hover:text-primary"
                        >
                            <HelpCircle className="size-4 text-indigo-400" />
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
