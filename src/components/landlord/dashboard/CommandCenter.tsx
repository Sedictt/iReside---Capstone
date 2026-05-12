"use client";

import Link from "next/link";
import {
    ArrowRight,
    Building2,
    ClipboardList,
    FileText,
    QrCode,
    ReceiptText,
    Settings2,
    ShieldCheck,
    TrendingUp,
    Zap,
    BarChart3,
    FolderSearch2,
    Hammer,
    RefreshCw
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type CommandCenterProps = {
    overdueCount: number;
    nearDueCount: number;
    vacantUnitsCount: number;
    activeInviteCount: number;
};

type StatCard = {
    label: string;
    value: number;
    href: string;
    toneClass: string;
    icon: LucideIcon;
};

type NextMove = {
    id: string;
    title: string;
    detail: string;
    href: string;
    cta: string;
    urgency: "high" | "medium" | "low";
};

const urgencyStyles: Record<NextMove["urgency"], string> = {
    high: "border-red-500/25 bg-red-500/12 text-red-400",
    medium: "border-amber-500/25 bg-amber-500/12 text-amber-400",
    low: "border-primary/25 bg-primary/12 text-primary",
};

export function CommandCenter({
    overdueCount,
    nearDueCount,
    vacantUnitsCount,
    activeInviteCount,
}: CommandCenterProps) {
    const statCards: StatCard[] = [
        {
            label: "Overdue",
            value: overdueCount,
            href: "/landlord/invoices",
            toneClass: "bg-card/70 border-white/10 text-red-400 hover:bg-card",
            icon: Zap
        },
        {
            label: "Near Due",
            value: nearDueCount,
            href: "/landlord/invoices",
            toneClass: "bg-card/70 border-white/10 text-amber-400 hover:bg-card",
            icon: TrendingUp
        },
        {
            label: "Vacant",
            value: vacantUnitsCount,
            href: "/landlord/properties",
            toneClass: "bg-card/70 border-white/10 text-sky-400 hover:bg-card",
            icon: Building2
        },
        {
            label: "Invites",
            value: activeInviteCount,
            href: "/landlord/applications",
            toneClass: "bg-card/70 border-white/10 text-primary hover:bg-card",
            icon: QrCode
        },
    ];

    const nextMoves: NextMove[] = [
        overdueCount > 0
            ? {
                id: "overdue",
                title: "Collect overdue rent",
                detail: `${overdueCount} overdue payment${overdueCount === 1 ? "" : "s"} need follow-up.`,
                href: "/landlord/invoices",
                cta: "Open invoices",
                urgency: "high",
            }
            : {
                id: "health",
                title: "System check: Healthy",
                detail: "Every account is up to date. Excellent operations.",
                href: "/landlord/invoices",
                cta: "Review ledger",
                urgency: "low",
            },
        vacantUnitsCount > 0
            ? {
                id: "vacancy",
                title: "Optimize occupancy",
                detail: `${vacantUnitsCount} unit${vacantUnitsCount === 1 ? "" : "s"} are awaiting new residents.`,
                href: "/landlord/properties",
                cta: "Open properties",
                urgency: "medium",
            }
            : {
                id: "occupancy",
                title: "Full occupancy reached",
                detail: "Maximize revenue by maintaining current satisfaction.",
                href: "/landlord/unit-map",
                cta: "View unit map",
                urgency: "low",
            },
    ];

    return (
        <section className="relative group/section overflow-hidden rounded-[2.5rem] border border-white/10 bg-card/60 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 size-64 rounded-full bg-white/5 blur-[80px] pointer-events-none" />
            
            <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between relative z-10">
                <div className="flex items-start gap-4">
                    <div className="flex size-14 items-center justify-center rounded-[1.25rem] border border-primary/20 bg-primary/15 text-primary">
                        <ShieldCheck className="size-7" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-foreground">Intelligence Hub</h2>
                        <p className="text-sm font-medium text-muted-foreground/80">
                            Orchestrating your property ecosystem from one dashboard.
                        </p>
                    </div>
                </div>

                {/* Real-time stats pills */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                    {statCards.map((stat) => (
                        <Link
                            key={stat.label}
                            href={stat.href}
                            className={cn(
                                "group relative flex items-center gap-3 rounded-2xl border px-4 py-2.5 transition-all duration-300 active:scale-95",
                                stat.toneClass
                            )}
                        >
                            <stat.icon className="size-4 opacity-80 transition-opacity group-hover:opacity-100" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                                <span className="text-base font-black leading-none text-foreground">{stat.value}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_380px] relative z-10">
                {/* Operations Center */}
                <div className="rounded-[2rem] border border-white/10 bg-card/70 p-6 backdrop-blur-sm">
                    <h3 className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80">
                        <span className="h-1 w-4 rounded-full bg-primary" />
                        Operations Center
                    </h3>
                    
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {[
                            { label: "Invoice Ledger", icon: ReceiptText, href: "/landlord/invoices", color: "text-blue-400", bgColor: "bg-blue-400/15" },
                            { label: "Tenant Records", icon: FileText, href: "/landlord/tenants", color: "text-emerald-400", bgColor: "bg-emerald-400/15" },
                            { label: "Property Portfolio", icon: Building2, href: "/landlord/properties", color: "text-violet-400", bgColor: "bg-violet-400/15" },
                            { label: "Application Review", icon: ClipboardList, href: "/landlord/applications", color: "text-amber-400", bgColor: "bg-amber-400/15" },
                            { label: "Utility Billing", icon: Zap, href: "/landlord/utility-billing", color: "text-sky-400", bgColor: "bg-sky-400/15" },
                            { label: "Maintenance Logs", icon: Hammer, href: "/landlord/maintenance", color: "text-rose-400", bgColor: "bg-rose-400/15" },
                            { label: "Lease Renewals", icon: RefreshCw, href: "/landlord/tenants?tab=renewals", color: "text-cyan-400", bgColor: "bg-cyan-400/15" },
                            { label: "Document Vault", icon: FolderSearch2, href: "/landlord/documents", color: "text-primary", bgColor: "bg-primary/15" },
                            { label: "Account Settings", icon: Settings2, href: "/landlord/settings", color: "text-zinc-400", bgColor: "bg-zinc-400/15" },
                        ].map((action, i) => {
                            const Content = (
                                <>
                                    <div className={cn(
                                        "flex size-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-black/20",
                                        action.bgColor,
                                        action.color
                                    )}>
                                        <action.icon className="size-5" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className={cn(
                                            "text-sm font-black tracking-tight transition-colors",
                                            "text-foreground/90 group-hover:text-foreground"
                                        )}>
                                            {action.label}
                                        </span>
                                    </div>
                                </>
                            );

                            return (
                                <Link 
                                    key={action.href}
                                    href={action.href}
                                    className="group flex items-center gap-4 rounded-[1.25rem] border border-white/5 bg-card/40 p-3.5 transition-all hover:bg-card hover:border-white/10 hover:shadow-xl hover:shadow-black/20"
                                >
                                    {Content}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Insights Hub */}
                <div className="rounded-[2rem] border border-white/10 bg-card/70 p-6 backdrop-blur-sm">
                    <h3 className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80">
                        <span className="h-1 w-4 rounded-full bg-amber-500" />
                        Next Priorities
                    </h3>
                    
                    <div className="flex flex-col gap-4">
                        {nextMoves.map((move) => (
                            <div key={move.id} className="group/item relative overflow-hidden rounded-2xl border border-white/10 bg-card/70 p-4 transition-all hover:bg-card">
                                <div className="absolute top-0 right-0 p-2 opacity-0 -translate-y-1 translate-x-1 group-hover/item:opacity-20 transition-all">
                                    <Zap className="size-12" />
                                </div>
                                <div className="mb-2 flex items-center justify-between relative z-10">
                                    <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest", urgencyStyles[move.urgency])}>
                                        {move.urgency} Priority
                                    </span>
                                </div>
                                <h4 className="text-sm font-black text-foreground relative z-10">{move.title}</h4>
                                <p className="mt-1 text-xs font-medium text-muted-foreground leading-relaxed relative z-10">{move.detail}</p>
                                <Link
                                    href={move.href}
                                    className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary transition-all hover:gap-3 group/link"
                                >
                                    {move.cta}
                                    <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-1" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

