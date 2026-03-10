"use client";

import { useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    TooltipItem,
    ScriptableContext
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { cn } from "@/lib/utils";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip
);

export function FinancialPerformanceChart({ simplifiedMode = false }: { simplifiedMode?: boolean }) {
    const [activeTab, setActiveTab] = useState<"earnings" | "expenses" | "netIncome">("earnings");

    // labels mapping
    const labels = {
        earnings: simplifiedMode ? "Money In" : "Total Earnings",
        expenses: simplifiedMode ? "Money Out" : "Expenses",
        netIncome: simplifiedMode ? "Money Left" : "Net Income"
    };

    // Mock data to match the curve shape in the requested design
    const earningsData = [130, 165, 225, 180, 235, 175];
    const expensesData = [80, 95, 110, 100, 120, 105]; // Lower relative to earnings
    const netIncomeData = [50, 70, 115, 80, 115, 70]; // Difference roughly

    const getCurrentData = () => {
        switch (activeTab) {
            case "expenses": return expensesData;
            case "netIncome": return netIncomeData;
            case "earnings":
            default: return earningsData;
        }
    };

    const data = {
        labels: ["05/01", "05/08", "05/15", "05/22", "05/29", "05/31"],
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
                        gradient.addColorStop(0, '#047857'); // Emerald-700
                        gradient.addColorStop(1, '#6ee7b7'); // Emerald-300
                    } else {
                        gradient.addColorStop(0, '#c2410c'); // Orange-700
                        gradient.addColorStop(1, '#fdba74'); // Orange-300
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
                backgroundColor: '#0f172a', // Darker background
                titleColor: '#94a3b8',
                bodyColor: '#f8fafc',
                bodyFont: { size: 16, weight: 'bold' as const },
                padding: 12,
                displayColors: false,
                cornerRadius: 8,
                callbacks: {
                    title: () => '', // Hide title
                    label: (context: TooltipItem<"bar">) => `₱${context.raw}`,
                },
                yAlign: 'bottom' as const,
                borderColor: '#334155',
                borderWidth: 1,
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
                min: 0, // Adjusted min to 0 to accommodate lower values
                suggestedMax: 300
            }
        },
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#1e293b]/30 rounded-xl border border-white/5 p-6 backdrop-blur-sm">
            {/* Header / Tabs */}
            <div className="flex items-center gap-8 mb-4">
                <button
                    onClick={() => setActiveTab("earnings")}
                    className={cn(
                        "text-sm font-medium transition-all flex items-center gap-2 pb-2 relative",
                        activeTab === "earnings" ? "text-white" : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    {activeTab === "earnings" && (
                        <span className="absolute -left-3 top-1.5 h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]"></span>
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
                        <span className="absolute -left-3 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]"></span>
                    )}
                    {labels.netIncome}
                </button>
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
