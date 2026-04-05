"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ScriptableContext
} from "chart.js";
import { Bar } from "react-chartjs-2";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useTheme } from "next-themes";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels
);

const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

const data = {
    labels,
    datasets: [
        {
            label: "Gross Revenue",
            data: [45000, 52000, 48000, 61000, 59000, 68000, 75000],
            backgroundColor: (context: ScriptableContext<"bar">) => {
                if (!context.chart.chartArea) return '#65a30d'; // Lime 500 fallback
                const { ctx, chartArea: { top, bottom } } = context.chart;
                const gradient = ctx.createLinearGradient(0, bottom, 0, top);
                gradient.addColorStop(0, '#3f6212'); // Lime 700
                gradient.addColorStop(1, '#84cc16'); // Lime 500
                return gradient;
            },
            borderRadius: 6,
            borderSkipped: 'bottom' as const,
            barPercentage: 0.6,
            categoryPercentage: 0.8,
        },
        {
            label: "Net Income",
            data: [30000, 38000, 32000, 44000, 42000, 52000, 61000],
            backgroundColor: (context: ScriptableContext<"bar">) => {
                if (!context.chart.chartArea) return '#10b981'; // Emerald 500 fallback
                const { ctx, chartArea: { top, bottom } } = context.chart;
                const gradient = ctx.createLinearGradient(0, bottom, 0, top);
                gradient.addColorStop(0, '#047857'); // Emerald 700
                gradient.addColorStop(1, '#10b981'); // Emerald 500
                return gradient;
            },
            borderRadius: 6,
            borderSkipped: 'bottom' as const,
            barPercentage: 0.6,
            categoryPercentage: 0.8,
        },
    ],
};

export default function RevenueChart() {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme !== "light";

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
                align: 'end' as const,
                labels: {
                    color: isDark ? "#e2e8f0" : "#475569",
                    usePointStyle: true,
                    pointStyle: 'circle' as const,
                    boxWidth: 8,
                    padding: 20,
                    font: {
                        family: "inherit",
                        size: 13,
                        weight: "bold" as const,
                    }
                }
            },
            datalabels: {
                color: isDark ? '#f8fafc' : '#334155',
                align: 'end' as const,
                anchor: 'end' as const,
                font: { family: "inherit", weight: 'bold' as const, size: 11 },
                formatter: (value: number) => `₱${value >= 1000 ? (value / 1000) + 'k' : value}`,
                offset: 4,
            },
            tooltip: {
                backgroundColor: isDark ? "rgba(17, 17, 17, 0.95)" : "rgba(255, 255, 255, 0.96)",
                titleColor: isDark ? "#f8fafc" : "#0f172a",
                bodyColor: isDark ? "#cbd5e1" : "#475569",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(148,163,184,0.25)",
                borderWidth: 1,
                padding: 16,
                cornerRadius: 12,
                displayColors: true,
                usePointStyle: true,
                boxPadding: 6,
                callbacks: {
                    label: (context: any) => ` ₱${context.raw.toLocaleString()}`
                }
            },
        },
        layout: {
            padding: {
                top: 24
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                border: { display: false },
                ticks: {
                    color: isDark ? "#94a3b8" : "#64748b",
                    font: { family: "inherit", size: 12, weight: "normal" as const },
                    padding: 10,
                },
            },
            y: {
                border: { display: false },
                grid: {
                    color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(148, 163, 184, 0.18)",
                    drawTicks: false,
                },
                ticks: {
                    color: isDark ? "#94a3b8" : "#64748b",
                    font: { family: "inherit", size: 12, weight: "normal" as const },
                    maxTicksLimit: 6,
                    padding: 16,
                    callback: (value: number | string) => `₱${Number(value) >= 1000 ? (Number(value) / 1000) + 'k' : value}`,
                },
                beginAtZero: true,
            },
        },
        interaction: {
            mode: "index" as const,
            intersect: false,
        },
    }), [isDark]);

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            setMounted(true);
        });

        return () => {
            window.cancelAnimationFrame(frame);
        };
    }, []);

    if (!mounted) {
        return (
            <div className="flex included-skeleton h-full w-full animate-pulse items-center justify-center rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Loading chart...</span>
            </div>
        );
    }

    return <Bar options={options} data={data} />;
}
