"use client";

import { ArrowRight, CircleHelp, X } from "lucide-react";
import { Bar } from "react-chartjs-2";
import { cn } from "@/lib/utils";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    Title,
    Tooltip,
    Filler,
    ScriptableContext,
    ChartData,
    ChartOptions
} from "chart.js";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    Title,
    Tooltip,
    Filler
);

interface KpiCardProps {
    title: string;
    simplifiedTitle?: string;
    value: string;
    change: string;
    simplifiedChange?: string;
    changeType: "positive" | "negative" | "neutral";
    data: number[];
    trendlineProperties?: {
        colors: [string, string]; // Start and End colors for gradient
    };
    iconColor?: string;
    className?: string;
    simplifiedMode?: boolean;
    aiInsight?: {
        summary: string;
        status: string;
        recommendation: string;
        source?: "ai" | "fallback";
    };
}

export function KpiCard({
    title,
    simplifiedTitle,
    value,
    change,
    simplifiedChange,
    changeType,
    data,
    trendlineProperties = { colors: ["#3b82f6", "#06b6d4"] }, // Default Blue to Cyan
    iconColor = "bg-blue-500",
    className,
    simplifiedMode = false,
    aiInsight
}: KpiCardProps) {
    const [showAiTooltip, setShowAiTooltip] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);

    const displayTitle = simplifiedMode && simplifiedTitle ? simplifiedTitle : title;
    const displayChange = simplifiedMode && simplifiedChange ? simplifiedChange : change;
    const insightSummary = aiInsight?.summary ?? `Your ${title} is currently ${value}. iRis is analyzing this metric and will share a personalized explanation shortly.`;
    const insightStatus = aiInsight?.status ?? "Trend analysis is loading.";
    const insightRecommendation = aiInsight?.recommendation ?? "Check back in a moment for a practical next step based on this KPI.";

    // Prepare chart data locally to handle gradients and simplified props
    const chartData = useMemo<ChartData<"bar">>(() => ({
        labels: data.map((_, i) => i.toString()), // Dummy labels
        datasets: [
            {
                data: data,
                backgroundColor: (context: ScriptableContext<"bar">) => {
                    const ctx = context.chart.ctx;
                    const chartArea = context.chart.chartArea;
                    if (!chartArea) {
                        return trendlineProperties.colors[0];
                    }
                    // Vertical gradient for bars from bottom to top
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, trendlineProperties.colors[0]);
                    gradient.addColorStop(1, trendlineProperties.colors[1]);
                    return gradient;
                },
                borderRadius: 4,
                borderSkipped: false,
                barPercentage: 0.6,
                categoryPercentage: 0.8,
            }
        ]
    }), [data, trendlineProperties]);

    const options: ChartOptions<"bar"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
            datalabels: { display: false }
        },
        scales: {
            x: { display: false },
            y: {
                display: false,
                min: 0, // Bars usually start from 0 or slightly below min for visual balance
                max: Math.max(...data) * 1.1,
            },
        },
        layout: {
            padding: {
                bottom: 10, // Ensure the bar doesn't get cut off at the very bottom
                left: 10,
                right: 10,
                top: 10
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
        animation: {
            duration: 1000,
        }
    };

    return (
        <div className={cn("relative flex flex-col justify-between overflow-visible rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-[0_14px_32px_-26px_rgba(15,23,42,0.22)] dark:border-white/5 dark:from-[#171717] dark:via-[#111111] dark:to-[#0a0a0a] dark:shadow-xl", className)}>

            {/* AI Helper Widget */}
            {!simplifiedMode && (
                <div className="absolute top-4 right-4 z-30">
                    <button
                        onMouseEnter={() => setShowAiTooltip(true)}
                        onMouseLeave={() => setShowAiTooltip(false)}
                        onClick={() => setShowAiModal(true)}
                        className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 hover:scale-110 transition-all border border-primary/20 group cursor-pointer shadow-lg shadow-primary/10"
                    >
                        <CircleHelp className="h-3.5 w-3.5" />
                    </button>

                    <AnimatePresence>
                        {showAiTooltip && (
                            <motion.div
                                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-xl pointer-events-none"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <CircleHelp className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-bold text-primary">i.R.i.s. Insight</span>
                                </div>
                                <p className="text-sm font-medium leading-relaxed text-foreground">
                                    {insightSummary}
                                </p>
                                <div className="mt-3 flex items-center gap-1.5 rounded-lg border-t border-border bg-primary/5 px-2 py-1.5 pt-2">
                                    <svg
                                        className="h-3.5 w-3.5 text-primary animate-pulse"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                    </svg>
                                    <span className="text-xs font-bold text-primary">Click icon for detailed analysis</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* AI Details Modal */}
            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {showAiModal && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowAiModal(false)}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                            <CircleHelp className="h-5 w-5 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground">i.R.i.s. Analysis: {title}</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowAiModal(false)}
                                        className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Status</h4>
                                        <p className="text-sm leading-relaxed text-foreground">
                                            {insightStatus}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Recommendation</h4>
                                        <p className="text-sm leading-relaxed text-foreground">
                                            {insightRecommendation}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setShowAiModal(false)}
                                        className="w-full py-2.5 rounded-xl bg-gradient-to-br from-lime-600 to-emerald-800 hover:from-lime-700 hover:to-emerald-900 text-white font-medium text-sm transition-all shadow-lg shadow-lime-900/20"
                                    >
                                        Got it, thanks!
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Header Content - Top Section */}
            <div className="p-6 pb-2 z-10 w-full">
                <div className="flex items-center gap-2 mb-3">
                    <span className={cn("h-2 w-2 rounded-full", iconColor)}></span>
                    <span className="text-sm font-medium tracking-wide text-slate-600 dark:text-neutral-300">{displayTitle}</span>
                </div>

                <h3 className="mb-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</h3>

                <p className={cn(
                    "text-sm font-medium",
                    changeType === "positive" ? "text-emerald-600 dark:text-emerald-400" :
                        changeType === "negative" ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-neutral-400"
                )}>
                    {displayChange}
                </p>
            </div>

            {/* Chart Section - Bottom Section */}
            {!simplifiedMode && (
                <div className="relative h-24 w-full mt-2">
                    <Bar
                        data={chartData}
                        options={options}
                    />

                    {/* Overlay Arrow Button */}
                    <button className="absolute bottom-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-500 backdrop-blur-md transition-colors hover:bg-white hover:text-slate-900 dark:border-white/5 dark:bg-neutral-800/80 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white">
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            )}
            {simplifiedMode && <div className="h-6" />}
        </div>
    );
}
