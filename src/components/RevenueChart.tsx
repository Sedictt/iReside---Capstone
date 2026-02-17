"use client";

import { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            backgroundColor: "#1e293b",
            titleColor: "#f8fafc",
            bodyColor: "#f8fafc",
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
        },
    },
    scales: {
        x: {
            grid: {
                display: false,
                drawBorder: false,
            },
            ticks: {
                color: "#94a3b8",
            },
        },
        y: {
            grid: {
                color: "#334155",
                drawBorder: false,
            },
            ticks: {
                color: "#94a3b8",
                callback: (value: any) => `₱${value}`,
            },
        },
    },
    interaction: {
        mode: "nearest" as const,
        axis: "x" as const,
        intersect: false,
    },
};

const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

const data = {
    labels,
    datasets: [
        {
            fill: true,
            label: "Revenue",
            data: [35000, 38000, 36000, 42000, 48000, 45000, 52000],
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "#3b82f6",
            pointHoverBorderColor: "#ffffff",
            pointHoverBorderWidth: 2,
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

    return <Line options={options} data={data} />;
}
