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
    default: "border-border bg-background text-foreground shadow-sm",
    positive: "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 shadow-sm",
    warning: "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300 shadow-sm",
    critical: "border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-300 shadow-sm",
};

const statusStyles: Record<OperationalSnapshotCardProps["status"], string> = {
    Performing: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    Stable: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    "Attention Required": "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
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
                "group relative flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-border bg-card p-1 shadow-xl shadow-black/[0.04] dark:shadow-black/20 transition-all duration-500",
                className
            )}
        >
            <div className="relative h-full w-full overflow-hidden rounded-[2.25rem] bg-muted/20 p-8 flex flex-col dark:bg-surface-2/30">
                <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,rgba(var(--primary-rgb),0.05),transparent_70%)] pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-8">
                    <div className="flex items-start justify-between gap-6">
                        <div className="space-y-4">
                            <div className={cn(
                                "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm", 
                                statusStyles[status]
                            )}>
                                <div className={cn(
                                    "h-2 w-2 rounded-full",
                                    status === "Performing" ? "bg-emerald-500 animate-pulse" :
                                    status === "Stable" ? "bg-blue-500" : "bg-red-500 animate-pulse"
                                )} />
                                {status}
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    {simplifiedMode ? "OPERATIONS SUMMARY" : "OPERATIONAL SNAPSHOT"}
                                </p>
                                <h3 className="mt-3 text-3xl font-black tracking-tight text-foreground leading-tight">{headline}</h3>
                            </div>
                        </div>

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-lg transition-transform group-hover:scale-110">
                            <ShieldCheck className="h-7 w-7" />
                        </div>
                    </div>

                    <p className="max-w-lg text-sm font-medium leading-relaxed text-muted-foreground">{summary}</p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {metrics.map((metric, index) => {
                            const Icon = metricIcons[index] ?? ShieldCheck;

                            return (
                                <div
                                    key={metric.label}
                                    className={cn(
                                        "relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] border p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
                                        toneStyles[metric.tone]
                                    )}
                                >
                                    <div className="relative z-10 flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-70">{metric.label}</p>
                                            <p className="mt-2 text-3xl font-black tracking-tight">{metric.value}</p>
                                        </div>
                                        <div className="rounded-xl bg-card/50 p-2.5 text-current shadow-sm border border-border">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <p className="relative z-10 mt-5 text-[11px] font-bold uppercase tracking-wider opacity-70">{metric.detail}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
