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
                "relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 shadow-[0_14px_32px_-26px_rgba(15,23,42,0.22)] dark:border-white/5 dark:from-[#171717] dark:via-[#111111] dark:to-[#0a0a0a] dark:shadow-xl",
                className
            )}
        >
            <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_60%)] pointer-events-none" />

            <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                        <span className={cn("inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] shadow-sm", statusStyles[status])}>
                            {status}
                        </span>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-neutral-400">
                                {simplifiedMode ? "Operations Summary" : "Operational Snapshot"}
                            </p>
                            <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{headline}</h3>
                        </div>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-emerald-600 shadow-sm dark:border-white/5 dark:bg-black/40 dark:text-emerald-400">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                </div>

                <p className="mt-4 max-w-md text-sm leading-6 text-slate-600 dark:text-neutral-300">{summary}</p>

                <div className="mt-6 grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                    {metrics.map((metric, index) => {
                        const Icon = metricIcons[index] ?? ShieldCheck;

                        return (
                            <div
                                key={metric.label}
                                className={cn(
                                    "flex min-h-[104px] flex-col justify-between rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
                                    toneStyles[metric.tone]
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">{metric.label}</p>
                                        <p className="mt-2 text-2xl font-bold tracking-tight">{metric.value}</p>
                                    </div>
                                    <div className="rounded-xl bg-white p-2 text-current shadow-sm dark:bg-black/40 opacity-90">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                </div>
                                <p className="mt-4 text-xs font-medium opacity-80">{metric.detail}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
