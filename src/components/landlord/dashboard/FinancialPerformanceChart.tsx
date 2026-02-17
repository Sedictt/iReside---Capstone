"use client";

import { useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    TooltipItem,
    ScriptableContext
} from "chart.js";
import { Line } from "react-chartjs-2";
import { cn } from "@/lib/utils";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip
);

export function FinancialPerformanceChart() {
    const [activeTab, setActiveTab] = useState<"earnings" | "revenue" | "starts">("earnings");

    // Mock data to match the curve shape in the requested design
    const earningsData = [130, 165, 225, 180, 235, 175];
    const revenueData = [200, 210, 205, 240, 230, 250];
    const startsData = [50, 80, 60, 90, 85, 100];

    const getCurrentData = () => {
        switch (activeTab) {
            case "revenue": return revenueData;
            case "starts": return startsData;
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
                borderColor: (context: ScriptableContext<"line">) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, context.chart.width, 0);
                    gradient.addColorStop(0, '#fdba74'); // Orange-300
                    gradient.addColorStop(0.5, '#f97316'); // Orange-500
                    gradient.addColorStop(1, '#c2410c'); // Orange-700
                    return gradient;
                },
                borderWidth: 4,
                tension: 0.5, // Smoother bezier curve
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: '#f97316',
                pointHoverBorderWidth: 3,
                fill: false,
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
                    label: (context: TooltipItem<"line">) => `₱${context.raw}`,
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
                min: 100,
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
                    Estimated Earnings
                </button>
                <button
                    onClick={() => setActiveTab("revenue")}
                    className={cn(
                        "text-sm font-medium transition-all pb-2 hover:text-slate-300",
                        activeTab === "revenue" ? "text-white" : "text-slate-500"
                    )}
                >
                    Revenue Per Panelist
                </button>
                <button
                    onClick={() => setActiveTab("starts")}
                    className={cn(
                        "text-sm font-medium transition-all pb-2 hover:text-slate-300",
                        activeTab === "starts" ? "text-white" : "text-slate-500"
                    )}
                >
                    Survey Starts
                </button>
            </div>

            {/* Chart Area */}
            <div className="flex-1 w-full min-h-0 relative">
                <Line
                    data={data}
                    options={options}
                />
            </div>
        </div>
    );
}
