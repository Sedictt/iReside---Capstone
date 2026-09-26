'use client'

import React, { useState } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    ScriptableContext,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { triggerHaptic } from '@/lib/haptics'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    ChartDataLabels
)

export type FinancialChartWindowData = {
    labels: string[]
    earnings: number[]
    expenses: number[]
    netIncome: number[]
}

type MobileFinancialPerformanceChartProps = {
    dataByWindow?: {
        week: FinancialChartWindowData
        month: FinancialChartWindowData
        year: FinancialChartWindowData
    }
}

export function MobileFinancialPerformanceChart({ dataByWindow }: MobileFinancialPerformanceChartProps) {
    const [activeTab, setActiveTab] = useState<'earnings' | 'expenses' | 'netIncome'>('earnings')
    const [timeWindow, setTimeWindow] = useState<'week' | 'month' | 'year'>('month')
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme !== 'light'

    const fallbackChartData = {
        week: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            earnings: [45, 60, 40, 75, 55, 90, 85],
            expenses: [20, 30, 15, 25, 20, 40, 35],
            netIncome: [25, 30, 25, 50, 35, 50, 50],
        },
        month: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
            earnings: [130, 165, 225, 180, 235],
            expenses: [80, 95, 110, 100, 120],
            netIncome: [50, 70, 115, 80, 115],
        },
        year: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            earnings: [420, 500, 450, 600, 550, 700, 680, 750, 800, 850, 900, 1100],
            expenses: [200, 250, 220, 300, 280, 350, 340, 380, 400, 420, 450, 500],
            netIncome: [220, 250, 230, 300, 270, 350, 340, 370, 400, 430, 450, 600],
        },
    }

    const chartData = dataByWindow ?? fallbackChartData

    const getCurrentData = () => {
        const sourceData = chartData[timeWindow]
        switch (activeTab) {
            case 'expenses':
                return sourceData.expenses
            case 'netIncome':
                return sourceData.netIncome
            case 'earnings':
            default:
                return sourceData.earnings
        }
    }

    const currentValues = getCurrentData()
    const maxValue = Math.max(...currentValues, 1)

    const data = {
        labels: chartData[timeWindow].labels,
        datasets: [
            {
                label: 'Amount',
                data: currentValues,
                backgroundColor: (context: ScriptableContext<'bar'>) => {
                    if (!context.chart.chartArea) {
                        return activeTab === 'expenses'
                            ? '#ef4444'
                            : activeTab === 'netIncome'
                            ? '#3b82f6'
                            : '#5e9a7a'
                    }
                    const { ctx, chartArea: { top, bottom } } = context.chart
                    const gradient = ctx.createLinearGradient(0, bottom, 0, top)
                    if (activeTab === 'expenses') {
                        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)')
                        gradient.addColorStop(1, 'rgba(239, 68, 68, 0.95)')
                    } else if (activeTab === 'netIncome') {
                        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)')
                        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.95)')
                    } else {
                        gradient.addColorStop(0, 'rgba(94, 154, 122, 0.3)')
                        gradient.addColorStop(1, 'rgba(94, 154, 122, 0.95)')
                    }
                    return gradient
                },
                borderRadius: 10,
                borderSkipped: false,
                categoryPercentage: 0.8,
                barPercentage: 0.85,
                maxBarThickness: 48,
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 900,
            easing: 'easeOutQuart' as const,
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                titleFont: { size: 11, weight: 'bold' as const },
                bodyFont: { size: 12, weight: 'bold' as const },
                padding: 10,
                cornerRadius: 12,
                displayColors: false,
                callbacks: {
                    label: (context: any) => `₱${Number(context.raw).toLocaleString()}`,
                },
            },
            datalabels: {
                display: (context: any) => context.chart.data.labels!.length <= 8,
                color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.85)',
                align: 'end' as const,
                anchor: 'end' as const,
                font: { weight: 'bold' as const, size: 9 },
                formatter: (value: number) => {
                    if (value === 0) return '₱0'
                    return `₱${(value / 1000).toFixed(1)}k`
                },
                offset: 4,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.6)',
                    font: { size: 10, weight: 'bold' as const },
                    padding: 8,
                },
            },
            y: {
                grid: {
                    color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)',
                    tickBorderDash: [4, 4],
                },
                border: { display: false },
                ticks: {
                    color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.6)',
                    callback: (val: string | number) => `₱${Number(val) / 1000}k`,
                    padding: 8,
                    font: { size: 9, weight: 'bold' as const },
                },
                min: 0,
                suggestedMax: maxValue * 1.25,
            },
        },
    }

    return (
        <div className="w-full space-y-3.5">
            {/* 1. Time Window Segmented Control (h-11 / 44px thumb touch target) */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl neumorphic-inset bg-muted/20">
                {(['week', 'month', 'year'] as const).map((w) => {
                    const isSelected = timeWindow === w
                    const label = w === 'week' ? 'Weekly' : w === 'month' ? 'Monthly' : 'Yearly'
                    return (
                        <button
                            key={w}
                            type="button"
                            onClick={() => {
                                triggerHaptic('light')
                                setTimeWindow(w)
                            }}
                            className={cn(
                                'h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center select-none active:scale-95',
                                isSelected
                                    ? 'neumorphic-panel text-primary shadow-sm'
                                    : 'text-muted-foreground/70 hover:text-foreground'
                            )}
                        >
                            {label}
                        </button>
                    )
                })}
            </div>

            {/* 2. Data Series Selector (h-11 / 44px thumb touch target) */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl neumorphic-panel border border-border/20">
                <button
                    type="button"
                    onClick={() => {
                        triggerHaptic('light')
                        setActiveTab('earnings')
                    }}
                    className={cn(
                        'h-11 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 select-none',
                        activeTab === 'earnings'
                            ? 'neumorphic-inset text-emerald-500'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <span className={cn('size-2 rounded-full shrink-0', activeTab === 'earnings' ? 'bg-emerald-500 shadow-sm' : 'bg-muted-foreground/40')} />
                    <span className="truncate">Earnings</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        triggerHaptic('light')
                        setActiveTab('expenses')
                    }}
                    className={cn(
                        'h-11 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 select-none',
                        activeTab === 'expenses'
                            ? 'neumorphic-inset text-red-500'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <span className={cn('size-2 rounded-full shrink-0', activeTab === 'expenses' ? 'bg-red-500 shadow-sm' : 'bg-muted-foreground/40')} />
                    <span className="truncate">Expenses</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        triggerHaptic('light')
                        setActiveTab('netIncome')
                    }}
                    className={cn(
                        'h-11 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 select-none',
                        activeTab === 'netIncome'
                            ? 'neumorphic-inset text-blue-500'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <span className={cn('size-2 rounded-full shrink-0', activeTab === 'netIncome' ? 'bg-blue-500 shadow-sm' : 'bg-muted-foreground/40')} />
                    <span className="truncate">Net</span>
                </button>
            </div>

            {/* 3. Uncluttered Chart Visualization */}
            <div className="relative w-full h-[260px] pt-2">
                <Bar data={data} options={options} />
            </div>
        </div>
    )
}
