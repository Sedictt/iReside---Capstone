"use client";

import Link from "next/link";
import { Tooltip } from "@/components/ui/tooltip";
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
    loadingPayments?: boolean;
    loadingUnits?: boolean;
    loadingInvites?: boolean;
    onOpenVacantUnits?: () => void;
};

type StatCard = {
    label: string;
    value: number;
    isLoading?: boolean;
    href?: string;
    onClick?: () => void;
    toneClass: string;
    icon: LucideIcon;
};

type NextMove = {
    id: string;
    title: string;
    detail: string;
    href?: string;
    onClick?: () => void;
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
    loadingPayments = false,
    loadingUnits = false,
    loadingInvites = false,
    onOpenVacantUnits,
}: CommandCenterProps) {
    const statCards: StatCard[] = [
        {
            label: "Overdue",
            value: overdueCount,
            isLoading: loadingPayments,
            href: "/landlord/invoices?tab=invoices&status=overdue",
            toneClass: "text-red-400",
            icon: Zap
        },
        {
            label: "Near Due",
            value: nearDueCount,
            isLoading: loadingPayments,
            href: "/landlord/invoices?tab=invoices&status=pending",
            toneClass: "text-amber-400",
            icon: TrendingUp
        },
        {
            label: "Vacant",
            value: vacantUnitsCount,
            isLoading: loadingUnits,
            href: onOpenVacantUnits ? undefined : "/landlord/properties",
            onClick: onOpenVacantUnits,
            toneClass: "text-sky-400 cursor-pointer hover:border-sky-500/40",
            icon: Building2
        },
        {
            label: "Invites",
            value: activeInviteCount,
            isLoading: loadingInvites,
            href: "/landlord/applications",
            toneClass: "text-primary",
            icon: QrCode
        },
    ];

    const nextMoves: NextMove[] = [
        overdueCount > 0
            ? {
                id: "overdue",
                title: "Collect overdue rent",
                detail: `${overdueCount} overdue payment${overdueCount === 1 ? "" : "s"} need follow-up.`,
                href: "/landlord/invoices?tab=invoices&status=overdue",
                cta: "Open invoices",
                urgency: "high",
            }
            : {
                id: "health",
                title: "System check: Healthy",
                detail: "Every account is up to date. Excellent operations.",
                href: "/landlord/invoices?tab=invoices",
                cta: "Review ledger",
                urgency: "low",
            },
        vacantUnitsCount > 0
            ? {
                id: "vacancy",
                title: "Optimize occupancy",
                detail: `${vacantUnitsCount} unit${vacantUnitsCount === 1 ? "" : "s"} are awaiting new residents.`,
                href: onOpenVacantUnits ? undefined : "/landlord/properties",
                onClick: onOpenVacantUnits,
                cta: onOpenVacantUnits ? "Review vacant units" : "Open properties",
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
        <section className={cn(
            "neumorphic-panel relative group/section overflow-hidden rounded-[2.5rem] p-4 sm:p-6 md:p-8",
            "dark:glass-premium dark:bg-card/40 dark:border-white/10 dark:shadow-2xl"
        )}>
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 size-64 rounded-full bg-primary/10 blur-[80px] pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-500" />
            
            <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between relative z-10">
                <div className="flex items-start gap-4">
                    <div className="neumorphic-inset-card flex size-14 items-center justify-center rounded-[1.25rem] text-primary dark:bg-primary/10 dark:border-primary/20 dark:shadow-none">
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
                <div className="flex gap-2 overflow-x-auto pb-2 pr-1 w-full sm:w-auto scrollbar-hide">
                    {statCards.map((stat) => {
                        const content = (
                            <>
                                <stat.icon className="size-4 opacity-80 transition-opacity group-hover:opacity-100" />
                                <div className="flex flex-col text-left">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                                    {stat.isLoading ? (
                                        <div className="h-4 w-8 rounded bg-muted animate-pulse mt-1" />
                                    ) : (
                                        <span className="text-sm sm:text-base font-black leading-none text-foreground">{stat.value}</span>
                                    )}
                                </div>
                            </>
                        );

                        const cardClass = cn(
                            "neumorphic-extruded group relative flex shrink-0 w-auto items-center gap-2 sm:gap-3 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 active:scale-95",
                            "dark:bento-glass-card dark:hover:bg-white/[0.05] transition-all cursor-pointer",
                            stat.toneClass
                        );

                        if (stat.onClick) {
                            return (
                                <button
                                    key={stat.label}
                                    type="button"
                                    onClick={stat.onClick}
                                    className={cardClass}
                                    title={`View ${stat.label} units directory`}
                                >
                                    {content}
                                </button>
                            );
                        }

                        return (
                            <Link
                                key={stat.label}
                                href={stat.href || "#"}
                                className={cardClass}
                            >
                                {content}
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_380px] relative z-10">
                {/* Operations Center */}
                <div className={cn(
                    "neumorphic-inset rounded-[2rem] p-4 sm:p-5 md:p-6",
                    "dark:bento-glass-inset"
                )}>
                    <h3 className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80">
                        <span className="h-1 w-4 rounded-full bg-primary" />
                        Operations Center
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                        {[
                            { 
                                label: "Invoice Ledger", 
                                icon: ReceiptText, 
                                href: "/landlord/invoices", 
                                color: "text-blue-400",
                                description: "Track rental payments, monitor pending balances, and issue invoices."
                            },
                            { 
                                label: "Tenant Records", 
                                icon: FileText, 
                                href: "/landlord/tenants", 
                                color: "text-emerald-400",
                                description: "View active tenant profiles, lease status, and occupant contact details."
                            },
                            { 
                                label: "Property Portfolio", 
                                icon: Building2, 
                                href: "/landlord/properties", 
                                color: "text-violet-400",
                                description: "Manage properties, configure rental units, and review occupancy."
                            },
                            { 
                                label: "Rental Applications", 
                                icon: ClipboardList, 
                                href: "/landlord/applications", 
                                color: "text-primary",
                                description: "Evaluate applicant submissions, verify screening data, and approve leases."
                            },
                            { 
                                label: "Unit Visualizer", 
                                icon: FolderSearch2, 
                                href: "/landlord/unit-map", 
                                color: "text-amber-400",
                                description: "Interactive architectural layout of units, floor maps, and occupancy status."
                            },
                            { 
                                label: "Maintenance Desk", 
                                icon: Hammer, 
                                href: "/landlord/maintenance", 
                                color: "text-rose-400",
                                description: "Resolve work orders, track repairs, and communicate with maintenance staff."
                            },
                            { 
                                label: "Lease Lifecycle", 
                                icon: RefreshCw, 
                                href: "/landlord/tenants?tab=renewals", 
                                color: "text-indigo-400",
                                description: "Monitor ending leases, process contract extensions, and manage renewals."
                            },
                            { 
                                label: "Financial Metrics", 
                                icon: BarChart3, 
                                href: "/landlord/analytics", 
                                color: "text-teal-400",
                                description: "Deep-dive cash flow, yield tracking, utility usage, and forecast projections."
                            },
                            { 
                                label: "Settings", 
                                icon: Settings2, 
                                href: "/landlord/settings", 
                                color: "text-slate-400",
                                description: "Configure system rules, customize utility pricing, and manage account security."
                            },
                        ].map((action) => (
                            <Tooltip key={action.label} content={action.description}>
                                <Link
                                    href={action.href}
                                    className={cn(
                                        "neumorphic-extruded group flex flex-col items-center text-center gap-1.5 sm:gap-2 rounded-[1.25rem] p-2 sm:p-3",
                                        "dark:bento-glass-card dark:hover:bg-primary/5 dark:hover:border-primary/20 dark:hover:shadow-[0_0_20px_rgba(196,176,255,0.1)] transition-all"
                                    )}
                                    aria-label={`${action.label}: ${action.description}`}
                                >
                                    <div className={cn(
                                        "neumorphic-inset-card flex size-8 sm:size-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
                                        "dark:bg-white/[0.05] dark:border-white/10 dark:shadow-none",
                                        action.color
                                    )}>
                                        <action.icon className="size-4 sm:size-5" />
                                    </div>
                                    <div className="flex flex-col gap-0.5 text-center">
                                        <span className={cn(
                                            "text-[10px] sm:text-xs font-black tracking-tight transition-colors text-foreground/90 group-hover:text-foreground max-w-full",
                                            "overflow-hidden text-ellipsis whitespace-nowrap"
                                        )}>
                                            {action.label}
                                        </span>
                                    </div>
                                </Link>
                            </Tooltip>
                        ))}
                    </div>
                </div>

                {/* Insights Hub */}
                <div className={cn(
                    "neumorphic-inset rounded-[2rem] p-4 sm:p-5 md:p-6",
                    "dark:bento-glass-inset"
                )}>
                    <h3 className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80">
                        <span className="h-1 w-4 rounded-full bg-amber-500" />
                        Next Priorities
                    </h3>
                    
                    <div className="flex flex-col gap-4">
                        {nextMoves.map((move) => (
                            <div key={move.id} className={cn(
                                "neumorphic-extruded group/item relative overflow-hidden rounded-2xl p-4",
                                "dark:bento-glass-card dark:hover:bg-white/[0.05] transition-all"
                            )}>
                                <div className="absolute top-0 right-0 p-2 opacity-0 -translate-y-1 translate-x-1 group-hover/item:opacity-20 transition-all">
                                    <Zap className="size-12" />
                                </div>
                                <div className="mb-2 flex items-center justify-between relative z-10">
                                    <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest", urgencyStyles[move.urgency])}>
                                        {move.urgency} Priority
                                    </span>
                                </div>
                                <h4 className="text-sm font-black text-foreground relative z-10">{move.title}</h4>
                                <p className="mt-1 text-xs font-medium text-muted-foreground/70 dark:text-white/60 leading-relaxed relative z-10">{move.detail}</p>
                                
                                {move.onClick ? (
                                    <button
                                        type="button"
                                        onClick={move.onClick}
                                        className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary transition-all hover:gap-3 group/link cursor-pointer"
                                    >
                                        {move.cta}
                                        <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-1" />
                                    </button>
                                ) : (
                                    <Link
                                        href={move.href || "#"}
                                        className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary transition-all hover:gap-3 group/link"
                                    >
                                        {move.cta}
                                        <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-1" />
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
