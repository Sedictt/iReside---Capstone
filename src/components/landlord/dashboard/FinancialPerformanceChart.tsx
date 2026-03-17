"use client";

import { useState } from "react";
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
    simplifiedMode?: boolean;
    dataByWindow?: {
        week: FinancialChartWindowData;
        month: FinancialChartWindowData;
        year: FinancialChartWindowData;
    };
};

export function FinancialPerformanceChart({ simplifiedMode = false, dataByWindow }: FinancialPerformanceChartProps) {
    void simplifiedMode;
    const [activeTab, setActiveTab] = useState<"earnings" | "expenses" | "netIncome">("earnings");

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
                    if (!context.chart.chartArea) {
                        return '#f97316';
                    }
                    const { ctx, chartArea: { top, bottom } } = context.chart;
                    const gradient = ctx.createLinearGradient(0, bottom, 0, top);
                    if (activeTab === "expenses") {
                        gradient.addColorStop(0, '#b91c1c'); // Red-700
                        gradient.addColorStop(1, '#fca5a5'); // Red-300
                    } else if (activeTab === "netIncome") {
                        gradient.addColorStop(0, '#1e3a8a'); // Blue-900
                        gradient.addColorStop(1, '#60a5fa'); // Blue-400
                    } else {
                        gradient.addColorStop(0, '#5a7e2f'); // System Primary Dark (Sage)
                        gradient.addColorStop(1, '#89b84f'); // System Primary Light (Sage)
                    }
                    return gradient;
                },
                borderRadius: 6,
                borderSkipped: false,
                barThickness: 40,
                maxBarThickness: 50,
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: false, // Disable tooltip since we're using datalabels now
            },
            datalabels: {
                color: '#f8fafc',
                align: 'end' as const,
                anchor: 'end' as const,
                font: { weight: 'bold' as const, size: 12 },
                formatter: (value: number) => `₱${value}`,
                offset: 4, // Distance from the top of the bar
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    drawBorder: false
                },
                ticks: {
                    color: '#64748b',
                    font: { size: 12 }
                }
            },
            y: {
                grid: {
                    color: '#334155',
                    drawBorder: false,
                    lineWidth: 1,
                },
                border: { display: false },
                ticks: {
                    color: '#64748b',
                    callback: (val: string | number) => `₱${val}`,
                    padding: 10,
                    font: { size: 12 }
                },
                min: 0,
                // Give a bit more headroom for the labels
                suggestedMax: Math.max(...getCurrentData()) * 1.2,
            }
        },
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        layout: {
            padding: {
                top: 24 // Extra padding so top labels don't get cut off
            }
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#1e293b]/30 rounded-xl border border-white/5 p-6 backdrop-blur-sm">
            {/* Header / Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-8">
                    <button
                        onClick={() => setActiveTab("earnings")}
                        className={cn(
                            "text-sm font-medium transition-all flex items-center gap-2 pb-2 relative",
                            activeTab === "earnings" ? "text-white" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        {activeTab === "earnings" && (
                            <span className="absolute -left-3 top-1.5 h-1.5 w-1.5 rounded-full bg-[#6d9838] shadow-[0_0_8px_rgba(109,152,56,1)]"></span>
                        )}
                        {labels.earnings}
                    </button>
                    <button
                        onClick={() => setActiveTab("expenses")}
                        className={cn(
                            "text-sm font-medium transition-all flex items-center gap-2 pb-2 relative",
                            activeTab === "expenses" ? "text-white" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        {activeTab === "expenses" && (
                            <span className="absolute -left-3 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]"></span>
                        )}
                        {labels.expenses}
                    </button>
                    <button
                        onClick={() => setActiveTab("netIncome")}
                        className={cn(
                            "text-sm font-medium transition-all flex items-center gap-2 pb-2 relative",
                            activeTab === "netIncome" ? "text-white" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        {activeTab === "netIncome" && (
                            <span className="absolute -left-3 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)]"></span>
                        )}
                        {labels.netIncome}
                    </button>
                </div>

                {/* Timeframe Selector */}
                <div className="relative">
                    <select
                        value={timeWindow}
                        onChange={(e) => setTimeWindow(e.target.value as "week" | "month" | "year")}
                        className="appearance-none bg-neutral-900/50 border border-white/10 text-slate-300 text-sm py-2 pl-4 pr-10 rounded-lg hover:bg-neutral-800/80 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-500 cursor-pointer"
                    >
                        <option value="week" className="bg-neutral-900">This Week</option>
                        <option value="month" className="bg-neutral-900">This Month</option>
                        <option value="year" className="bg-neutral-900">This Year</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 w-full min-h-0 relative">
                <Bar
                    data={data}
                    options={options}
                />
            </div>
        </div>
    );
}
