"use client";

import { ArrowRight } from "lucide-react";
import { Line } from "react-chartjs-2";
import { cn } from "@/lib/utils";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    ScriptableContext,
    ChartData,
    ChartOptions
} from "chart.js";
import { useEffect, useRef, useState } from "react";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
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
    const chartRef = useRef<any>(null);
    const [gradient, setGradient] = useState<CanvasGradient | null>(null);

    // Prepare chart data locally to handle gradients and simplified props
    const chartData: ChartData<"line"> = {
        labels: data.map((_, i) => i.toString()), // Dummy labels
        datasets: [
            {
                data: data,
                borderColor: gradient || trendlineProperties.colors[0], // Fallback color
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 0,
                fill: false,
            }
        ]
    };

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

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart) return;

        const ctx = chart.ctx;
        if (ctx) {
            const chartArea = chart.chartArea;
            // Create gradient from left to right
            // Use a fallback width if chartArea is not yet available (initial render)
            const width = chartArea ? chartArea.right - chartArea.left : 300;
            const newGradient = ctx.createLinearGradient(0, 0, width, 0);
            newGradient.addColorStop(0, trendlineProperties.colors[0]);
            newGradient.addColorStop(1, trendlineProperties.colors[1]);
            setGradient(newGradient);
        }
    }, [trendlineProperties, data]); // Re-create if colors change

    return (
        <div className={cn("flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-[#171717] to-[#0a0a0a] shadow-xl border border-white/5", className)}>

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
                    ref={chartRef}
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
