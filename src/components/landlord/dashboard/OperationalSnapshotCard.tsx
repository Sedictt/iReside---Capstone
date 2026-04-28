"use client";

import { AlertTriangle, Building2, CalendarClock, CircleDollarSign, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type SnapshotMetric = {
    label: string;
    value: string;
    detail: string;
    tone: "default" | "positive" | "warning" | "critical";
};

interface OperationalSnapshotCardProps {
    status: "Performing" | "Stable" | "Attention Required";
    headline: string;
    summary: string;
    metrics: SnapshotMetric[];
    className?: string;
    simplifiedMode?: boolean;
}

const metricIcons = [Building2, AlertTriangle, CalendarClock, CircleDollarSign] as const;

const toneStyles: Record<SnapshotMetric["tone"], string> = {
    default: "border-slate-200 bg-white/60 text-slate-700 shadow-sm dark:border-white/5 dark:bg-white/5 dark:text-neutral-300",
    positive: "border-emerald-500/20 bg-emerald-50/50 text-emerald-700 shadow-sm dark:border-emerald-500/10 dark:bg-emerald-500/5 dark:text-emerald-300",
    warning: "border-amber-500/20 bg-amber-50/50 text-amber-700 shadow-sm dark:border-amber-500/10 dark:bg-amber-500/5 dark:text-amber-300",
    critical: "border-red-500/20 bg-red-50/50 text-red-700 shadow-sm dark:border-red-500/10 dark:bg-red-500/5 dark:text-red-300",
};

const statusStyles: Record<OperationalSnapshotCardProps["status"], string> = {
    Performing: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    Stable: "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300",
    "Attention Required": "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
};

export function OperationalSnapshotCard({
    status,
    headline,
    summary,
    metrics,
    className,
    simplifiedMode = false,
}: OperationalSnapshotCardProps) {
    return (
        <section
            className={cn(
                "group relative flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-card/60 p-1 shadow-2xl shadow-black/[0.08] dark:shadow-black/30 backdrop-blur-xl transition-all duration-500",
                className
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
            
            <div className="relative h-full w-full overflow-hidden rounded-[2.25rem] bg-card/40 p-8 flex flex-col">
                <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.1),transparent_70%)] pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-8">
                    <div className="flex items-start justify-between gap-6">
                        <div className="space-y-4">
                            <div className={cn(
                                "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm backdrop-blur-md", 
                                statusStyles[status]
                            )}>
                                <div className={cn(
                                    "h-2 w-2 rounded-full",
                                    status === "Performing" ? "bg-emerald-400 animate-pulse" :
                                    status === "Stable" ? "bg-blue-400" : "bg-red-400 animate-pulse"
                                )} />
                                {status}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">
                                    {simplifiedMode ? "OPERATIONS SUMMARY" : "OPERATIONAL SNAPSHOT"}
                                </p>
                                <h3 className="mt-3 text-3xl font-black tracking-tight text-foreground leading-tight">{headline}</h3>
                            </div>
                        </div>

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-card/80 text-emerald-400 shadow-xl backdrop-blur-md transition-transform group-hover:scale-110">
                            <ShieldCheck className="h-7 w-7" />
                        </div>
                    </div>

                    <p className="max-w-lg text-sm font-bold leading-relaxed text-muted-foreground/80">{summary}</p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {metrics.map((metric, index) => {
                            const Icon = metricIcons[index] ?? ShieldCheck;

                            return (
                                <div
                                    key={metric.label}
                                    className={cn(
                                        "relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] border p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                                        toneStyles[metric.tone]
                                    )}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                    
                                    <div className="relative z-10 flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{metric.label}</p>
                                            <p className="mt-2 text-3xl font-black tracking-tight">{metric.value}</p>
                                        </div>
                                        <div className="rounded-xl bg-card/40 p-2.5 text-current shadow-sm backdrop-blur-sm border border-white/5">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <p className="relative z-10 mt-5 text-[11px] font-black uppercase tracking-wider opacity-60">{metric.detail}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
