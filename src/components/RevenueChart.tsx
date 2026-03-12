"use client";

import { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: 'top' as const,
            align: 'end' as const,
            labels: {
                color: "#94a3b8",
                usePointStyle: true,
                pointStyle: 'circle',
                boxWidth: 8,
                padding: 20,
                font: {
                    family: "'Inter', sans-serif",
                    size: 12,
                    weight: "500",
                }
            }
        },
        tooltip: {
            backgroundColor: "rgba(17, 17, 17, 0.95)",
            titleColor: "#f8fafc",
            bodyColor: "#cbd5e1",
            borderColor: "rgba(255,255,255,0.1)",
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
    scales: {
        x: {
            grid: {
                display: false,
            },
            border: { display: false },
            ticks: {
                color: "#64748b",
                font: { family: "'Inter', sans-serif", size: 12 },
                padding: 8,
            },
        },
        y: {
            border: { display: false },
            grid: {
                color: "rgba(255, 255, 255, 0.05)",
            },
            ticks: {
                color: "#64748b",
                font: { family: "'Inter', sans-serif", size: 12 },
                maxTicksLimit: 6,
                padding: 12,
                callback: (value: any) => `₱${value >= 1000 ? (value / 1000) + 'k' : value}`,
            },
        },
    },
    interaction: {
        mode: "index" as const,
        intersect: false,
    },
};

const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

const data = {
    labels,
    datasets: [
        {
            label: "Gross Revenue",
            data: [45000, 52000, 48000, 61000, 59000, 68000, 75000],
            backgroundColor: "#3b82f6", // Blue
            hoverBackgroundColor: "#60a5fa",
            borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 6, bottomRight: 6 },
            borderSkipped: false,
            barPercentage: 0.6,
            categoryPercentage: 0.8,
        },
        {
            label: "Net Income",
            data: [30000, 38000, 32000, 44000, 42000, 52000, 61000],
            backgroundColor: "#10b981", // Emerald
            hoverBackgroundColor: "#34d399",
            borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 6, bottomRight: 6 },
            borderSkipped: false,
            barPercentage: 0.6,
            categoryPercentage: 0.8,
        },
    ],
};

export default function RevenueChart() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex included-skeleton h-full w-full animate-pulse items-center justify-center rounded-lg bg-slate-800/50">
                <span className="text-slate-500">Loading chart...</span>
            </div>
        );
    }

    return <Bar options={options} data={data} />;
}
