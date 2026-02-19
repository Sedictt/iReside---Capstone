"use client";

import { ArrowRight, CircleHelp, X } from "lucide-react";
import { Line } from "react-chartjs-2";
import { cn } from "@/lib/utils";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    LineController,
    Title,
    Tooltip,
    Filler,
    ScriptableContext,
    ChartData,
    ChartOptions
} from "chart.js";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    LineController,
    Title,
    Tooltip,
    Filler
);

interface KpiCardProps {
    title: string;
    value: string;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    data: number[];
    trendlineProperties?: {
        colors: [string, string]; // Start and End colors for gradient
    };
    iconColor?: string;
    className?: string;
}

export function KpiCard({
    title,
    value,
    change,
    changeType,
    data,
    trendlineProperties = { colors: ["#3b82f6", "#06b6d4"] }, // Default Blue to Cyan
    iconColor = "bg-blue-500",
    className
}: KpiCardProps) {
    const [showAiTooltip, setShowAiTooltip] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);

    // Prepare chart data locally to handle gradients and simplified props
    const chartData = useMemo<ChartData<"line">>(() => ({
        labels: data.map((_, i) => i.toString()), // Dummy labels
        datasets: [
            {
                data: data,
                borderColor: (context: ScriptableContext<"line">) => {
                    const ctx = context.chart.ctx;
                    const chartArea = context.chart.chartArea;
                    if (!chartArea) {
                        return trendlineProperties.colors[0];
                    }
                    const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                    gradient.addColorStop(0, trendlineProperties.colors[0]);
                    gradient.addColorStop(1, trendlineProperties.colors[1]);
                    return gradient;
                },
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 0,
                fill: false,
            }
        ]
    }), [data, trendlineProperties]);

    const options: ChartOptions<"line"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
        },
        scales: {
            x: { display: false },
            y: {
                display: false,
                min: Math.min(...data) * 0.8, // Dynamic min just to ensure curve has room
                max: Math.max(...data) * 1.1,
            },
        },
        layout: {
            padding: {
                bottom: 10 // Ensure the line doesn't get cut off at the very bottom
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
        <div className={cn("relative flex flex-col justify-between overflow-visible rounded-3xl bg-gradient-to-br from-[#171717] to-[#0a0a0a] shadow-xl border border-white/5", className)}>

            {/* AI Helper Widget */}
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
                            className="absolute right-0 top-10 w-64 p-4 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 pointer-events-none"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <CircleHelp className="h-4 w-4 text-primary" />
                                <span className="text-sm font-bold text-primary">i.R.i.s. Insight</span>
                            </div>
                            <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                                Your <strong className="text-white">{title}</strong> is currently <span className="text-white">{value}</span>.
                                This represents a <span className={cn(changeType === "positive" ? "text-emerald-400" : changeType === "negative" ? "text-red-400" : "text-neutral-400")}>{change}</span> shift,
                                suggesting {changeType === 'positive' ? 'strong growth' : changeType === 'negative' ? 'a decline to monitor' : 'stability'} in your portfolio.
                            </p>
                            <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-1.5 bg-primary/5 rounded-lg px-2 py-1.5">
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

            {/* AI Details Modal */}
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
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#171717] border border-white/10 rounded-2xl shadow-2xl z-[101] p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                        <CircleHelp className="h-5 w-5 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">i.R.i.s. Analysis: {title}</h3>
                                </div>
                                <button
                                    onClick={() => setShowAiModal(false)}
                                    className="p-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-neutral-900 border border-white/5">
                                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Current Status</h4>
                                    <p className="text-sm text-white leading-relaxed">
                                        Your {title} is currently <span className="font-bold text-emerald-400">{changeType === 'positive' ? 'Trending Up' : changeType === 'negative' ? 'Trending Down' : 'Stable'}</span>.
                                        Based on historical data, this is performing {changeType === 'positive' ? 'better' : 'worse'} than expected for this quarter.
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-neutral-900 border border-white/5">
                                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Recommendation</h4>
                                    <p className="text-sm text-neutral-300 leading-relaxed">
                                        Consider simplifying tenant communications or reviewing recent maintenance logs to deduce impact on {title}. i.R.i.s. suggests a review of recent operational costs to optimize this further.
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
            </AnimatePresence>

            {/* Header Content - Top Section */}
            <div className="p-6 pb-2 z-10 w-full">
                <div className="flex items-center gap-2 mb-3">
                    <span className={cn("h-2 w-2 rounded-full", iconColor)}></span>
                    <span className="text-sm font-medium text-neutral-300 tracking-wide">{title}</span>
                </div>

                <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">{value}</h3>

                <p className={cn(
                    "text-sm font-medium",
                    changeType === "positive" ? "text-emerald-400" :
                        changeType === "negative" ? "text-red-400" : "text-neutral-400"
                )}>
                    {change}
                </p>
            </div>

            {/* Chart Section - Bottom Section */}
            <div className="relative h-24 w-full mt-2">
                <Line
                    data={chartData}
                    options={options}
                />

                {/* Overlay Arrow Button */}
                <button className="absolute bottom-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800/80 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white backdrop-blur-md border border-white/5">
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
