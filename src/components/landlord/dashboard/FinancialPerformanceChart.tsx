"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    ScriptableContext
} from "chart.js";
import { Bar } from "react-chartjs-2";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    ChartDataLabels
);

export type FinancialChartWindowData = {
    labels: string[];
    earnings: number[];
    expenses: number[];
    netIncome: number[];
};

type FinancialPerformanceChartProps = {
    dataByWindow?: {
        week: FinancialChartWindowData;
        month: FinancialChartWindowData;
        year: FinancialChartWindowData;
    };
};

export function FinancialPerformanceChart({ dataByWindow }: FinancialPerformanceChartProps) {
    const [activeTab, setActiveTab] = useState<"earnings" | "expenses" | "netIncome">("earnings");
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme !== "light";

    const [timeWindow, setTimeWindow] = useState<"week" | "month" | "year">("month");

    // Keep KPI terminology consistent in both default and simplified views.
    const labels = {
        earnings: "Total Earnings",
        expenses: "Expenses",
        netIncome: "Net Income"
    };

    // Data structures for different timeframes
    const fallbackChartData = {
        week: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            earnings: [45, 60, 40, 75, 55, 90, 85],
            expenses: [20, 30, 15, 25, 20, 40, 35],
            netIncome: [25, 30, 25, 50, 35, 50, 50],
        },
        month: {
            labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
            earnings: [130, 165, 225, 180, 235],
            expenses: [80, 95, 110, 100, 120],
            netIncome: [50, 70, 115, 80, 115],
        },
        year: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            earnings: [420, 500, 450, 600, 550, 700, 680, 750, 800, 850, 900, 1100],
            expenses: [200, 250, 220, 300, 280, 350, 340, 380, 400, 420, 450, 500],
            netIncome: [220, 250, 230, 300, 270, 350, 340, 370, 400, 430, 450, 600],
        }
    };

    const chartData = dataByWindow ?? fallbackChartData;

    const getCurrentData = () => {
        const sourceData = chartData[timeWindow];
        switch (activeTab) {
            case "expenses": return sourceData.expenses;
            case "netIncome": return sourceData.netIncome;
            case "earnings":
            default: return sourceData.earnings;
        }
    };

    const data = {
        labels: chartData[timeWindow].labels,
        datasets: [
            {
                label: "Amount",
                data: getCurrentData(),
                backgroundColor: (context: ScriptableContext<"bar">) => {
                    if (!context.chart.chartArea) return activeTab === "expenses" ? "#ef4444" : activeTab === "netIncome" ? "#3b82f6" : "#6d9838";
                    const { ctx, chartArea: { top, bottom } } = context.chart;
                    const gradient = ctx.createLinearGradient(0, bottom, 0, top);
                    if (activeTab === "expenses") {
                        gradient.addColorStop(0, "rgba(239, 68, 68, 0.4)");
                        gradient.addColorStop(1, "rgba(239, 68, 68, 0.9)");
                    } else if (activeTab === "netIncome") {
                        gradient.addColorStop(0, "rgba(59, 130, 246, 0.4)");
                        gradient.addColorStop(1, "rgba(59, 130, 246, 0.9)");
                    } else {
                        gradient.addColorStop(0, "rgba(109, 152, 56, 0.4)");
                        gradient.addColorStop(1, "rgba(109, 152, 56, 0.9)");
                    }
                    return gradient;
                },
                borderRadius: 12,
                borderSkipped: false,
                categoryPercentage: 0.85,
                barPercentage: 0.9,
                maxBarThickness: 120,
                hoverBackgroundColor: (context: ScriptableContext<"bar">) => {
                    if (!context.chart.chartArea) return "#ffffff";
                    const { ctx, chartArea: { top, bottom } } = context.chart;
                    const gradient = ctx.createLinearGradient(0, bottom, 0, top);
                    if (activeTab === "expenses") {
                        gradient.addColorStop(0, "rgba(239, 68, 68, 0.6)");
                        gradient.addColorStop(1, "rgba(239, 68, 68, 1)");
                    } else if (activeTab === "netIncome") {
                        gradient.addColorStop(0, "rgba(59, 130, 246, 0.6)");
                        gradient.addColorStop(1, "rgba(59, 130, 246, 1)");
                    } else {
                        gradient.addColorStop(0, "rgba(109, 152, 56, 0.6)");
                        gradient.addColorStop(1, "rgba(109, 152, 56, 1)");
                    }
                    return gradient;
                },
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1500,
            easing: 'easeOutQuart' as const,
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleFont: { size: 10, weight: 'bold' as const, family: 'Geist Sans' },
                bodyFont: { size: 12, weight: 'bold' as const, family: 'Geist Sans' },
                padding: 12,
                cornerRadius: 12,
                displayColors: false,
                callbacks: {
                    label: (context: any) => `₱${context.raw.toLocaleString()}`,
                }
            },
            datalabels: {
                display: (context: any) => context.chart.data.labels!.length <= 15,
                color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.9)',
                align: 'end' as const,
                anchor: 'end' as const,
                font: { weight: 'bold' as const, size: 10, family: 'Geist Sans' },
                formatter: (value: number) => `₱${(value / 1000).toFixed(1)}k`,
                offset: 8,
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                border: { display: false },
                ticks: {
                    color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.4)',
                    font: { size: 10, weight: 'bold' as const, family: 'Geist Sans' },
                    padding: 10,
                }
            },
            y: {
                grid: {
                    color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)',
                    tickBorderDash: [5, 5],
                },
                border: { display: false },
                ticks: {
                    color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.4)',
                    callback: (val: string | number) => `₱${Number(val) / 1000}k`,
                    padding: 15,
                    font: { size: 10, weight: 'bold' as const, family: 'Geist Sans' },
                },
                min: 0,
                suggestedMax: Math.max(...getCurrentData()) * 1.3,
            }
        },
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        layout: {
            padding: {
                top: 32,
                bottom: 8,
                left: 8,
                right: 8
            }
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative flex h-full w-full flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-card/60 p-8 shadow-2xl shadow-black/[0.06] dark:shadow-black/20 backdrop-blur-xl transition-all duration-300"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
            
            {/* Header / Tabs */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-10">
                    <button
                        onClick={() => setActiveTab("earnings")}
                        className={cn(
                            "text-[10px] font-black uppercase tracking-[0.25em] transition-all flex items-center gap-3 pb-3 relative",
                            activeTab === "earnings" ? "text-foreground" : "text-muted-foreground/60 hover:text-foreground"
                        )}
                    >
                        {activeTab === "earnings" && (
                            <motion.span 
                                layoutId="activeTabIndicator"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6d9838] shadow-[0_0_12px_rgba(109,152,56,0.6)]"
                            />
                        )}
                        <span className={cn("h-2 w-2 rounded-full", activeTab === "earnings" ? "bg-[#6d9838] shadow-[0_0_8px_rgba(109,152,56,0.8)]" : "bg-neutral-600")} />
                        {labels.earnings}
                    </button>
                    <button
                        onClick={() => setActiveTab("expenses")}
                        className={cn(
                            "text-[10px] font-black uppercase tracking-[0.25em] transition-all flex items-center gap-3 pb-3 relative",
                            activeTab === "expenses" ? "text-foreground" : "text-muted-foreground/60 hover:text-foreground"
                        )}
                    >
                        {activeTab === "expenses" && (
                            <motion.span 
                                layoutId="activeTabIndicator"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                            />
                        )}
                        <span className={cn("h-2 w-2 rounded-full", activeTab === "expenses" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-neutral-600")} />
                        {labels.expenses}
                    </button>
                    <button
                        onClick={() => setActiveTab("netIncome")}
                        className={cn(
                            "text-[10px] font-black uppercase tracking-[0.25em] transition-all flex items-center gap-3 pb-3 relative",
                            activeTab === "netIncome" ? "text-foreground" : "text-muted-foreground/60 hover:text-foreground"
                        )}
                    >
                        {activeTab === "netIncome" && (
                            <motion.span 
                                layoutId="activeTabIndicator"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                            />
                        )}
                        <span className={cn("h-2 w-2 rounded-full", activeTab === "netIncome" ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "bg-neutral-600")} />
                        {labels.netIncome}
                    </button>
                </div>

                {/* Timeframe Selector */}
                <div className="relative group/select">
                    <select
                        value={timeWindow}
                        onChange={(e) => setTimeWindow(e.target.value as "week" | "month" | "year")}
                        className="cursor-pointer appearance-none rounded-2xl border border-white/10 bg-card/80 py-2.5 pl-6 pr-8 text-[10px] font-black uppercase tracking-[0.15em] text-foreground transition-all hover:bg-card hover:ring-1 hover:ring-primary/20 focus:outline-none min-w-[150px]"
                    >
                        <option value="week">Weekly</option>
                        <option value="month">Monthly</option>
                        <option value="year">Yearly</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground/40 group-hover/select:text-primary transition-colors">
                        <ChevronDown className="h-3.5 w-3.5" />
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative flex-1 w-full min-h-0 pt-4">
                <Bar
                    data={data}
                    options={options}
                />
            </div>
        </motion.div>
    );
}
