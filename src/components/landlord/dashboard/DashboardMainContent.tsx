"use client";

import React from "react";
import Link from "next/link";
import { UserPlus, QrCode, Wrench, Map } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardMainContentProps {
    title: string;
    subtitle: string;
    time: Date;
    onNewWalkIn?: () => void;
    onCreateInvite?: () => void;
}

export function DashboardMainContent({
    title,
    subtitle,
    time,
    onNewWalkIn,
    onCreateInvite
}: DashboardMainContentProps) {
    return (
        <div data-tour-id="tour-welcome-area" className="flex flex-col justify-center max-w-2xl py-12">
            {/* Badge */}
            <div className="mb-6 flex items-center gap-2.5 w-fit rounded-full border border-white/10 bg-card/60 px-4 py-1.5 backdrop-blur-xl">
                <div className="relative">
                    <div className="size-2 rounded-full bg-primary animate-ping" />
                    <div className="absolute inset-0 size-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
                    {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
            </div>

            <h1 className="mb-4 text-4xl font-black tracking-tight text-foreground md:text-6xl leading-[1.1]">
                {title}
                <span className="text-primary prose-invert">.</span>
            </h1>
            
            <p className="max-w-lg text-base font-medium text-muted-foreground md:text-xl leading-relaxed">
                {subtitle}
            </p>

            {/* Navigation Actions */}
            <div className="flex flex-wrap items-center gap-4 mt-10">
                {onNewWalkIn ? (
                    <button 
                        onClick={onNewWalkIn}
                        className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-primary px-8 py-4 text-primary-foreground shadow-[0_8px_18px_rgba(var(--primary-rgb),0.28)] transition-all hover:brightness-105 active:scale-95"
                    >
                        <div className="absolute inset-0 bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <UserPlus className="size-5 font-black relative z-10" />
                        <span className="text-sm font-black uppercase tracking-tight relative z-10">New Application</span>
                    </button>
                ) : (
                    <Link href="/landlord/applications?action=tenant-application" className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-primary px-8 py-4 text-primary-foreground shadow-[0_8px_18px_rgba(var(--primary-rgb),0.28)] transition-all hover:brightness-105 active:scale-95">
                        <div className="absolute inset-0 bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <UserPlus className="size-5 font-black relative z-10" />
                        <span className="text-sm font-black uppercase tracking-tight relative z-10">New Application</span>
                    </Link>
                )}
                
                <div className="flex items-center gap-2">
                    {onCreateInvite && (
                        <button
                            onClick={onCreateInvite}
                            title="Create Invite link"
                            className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl transition-all hover:bg-card"
                        >
                            <QrCode className="size-5 text-primary" />
                        </button>
                    )}
                    <Link 
                        href="/landlord/maintenance" 
                        title="Maintenance Queue"
                        className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl transition-all hover:bg-card"
                    >
                        <Wrench className="size-5 text-amber-500" />
                    </Link>
                    <Link 
                        href="/landlord/unit-map" 
                        title="Unit Map"
                        className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl transition-all hover:bg-card"
                    >
                        <Map className="size-5 text-rose-500" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
