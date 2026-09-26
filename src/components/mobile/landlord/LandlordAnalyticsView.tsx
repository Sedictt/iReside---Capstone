'use client'

import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import Link from 'next/link'
import {
    ArrowUpRight,
    BarChart,
    Building2,
    Calendar as CalendarIcon,
    ChevronRight,
    CreditCard,
    Download,
    Eye,
    EyeOff,
    FileText,
    History,
    Info,
    RefreshCw,
    Sparkles,
    TrendingDown,
    TrendingUp,
    Users,
    Wrench,
    X,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import { cn } from '@/lib/utils'
import { IrisAIAgent } from '@/components/landlord/dashboard/IrisAIAgent'
import { useAuth } from '@/hooks/useAuth'
import { ChartSkeleton } from '@/components/landlord/dashboard/ChartSkeleton'
import { MobileFinancialPerformanceChart, type FinancialChartWindowData } from '@/components/mobile/landlord/MobileFinancialPerformanceChart'
import { useProperty } from '@/context/PropertyContext'
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector'
import { triggerHaptic } from '@/lib/haptics'
import { m as motion, AnimatePresence } from 'framer-motion'

/* ----------------------------------------------------------
   Types
   ---------------------------------------------------------- */

type KpiItem = {
    title: string
    simplifiedTitle: string
    value: string
    change: string
    simplifiedChange: string
    trendData: number[]
    changeType: 'positive' | 'negative' | 'neutral'
    iconColor: string
    trendlineProperties: { colors: [string, string] }
}

type RangeOption = {
    id: '7d' | '30d' | '90d' | '1y' | 'custom'
    label: string
    days: number | null
}

type ReportRow = {
    metric: string
    value: string
    change: string
    trend: string
}

type ExportAuditItem = {
    id: string
    format: 'csv' | 'pdf'
    range: string
    generatedAt: string
    rows: ReportRow[]
}

type OverviewApiResponse = {
    primaryKpis: Array<Pick<KpiItem, 'title' | 'value' | 'change' | 'simplifiedChange' | 'trendData' | 'changeType'>>
    extendedKpis: Array<Pick<KpiItem, 'title' | 'value' | 'change' | 'simplifiedChange' | 'trendData' | 'changeType'>>
    financialChart: {
        week: FinancialChartWindowData
        month: FinancialChartWindowData
        year: FinancialChartWindowData
    }
    operationalSnapshot: {
        status: 'Performing' | 'Stable' | 'Attention Required'
        headline: string
        summary: string
        metrics: Array<{
            label: string
            value: string
            detail: string
            tone: 'default' | 'positive' | 'warning' | 'critical'
        }>
    }
}

const RANGE_OPTIONS: RangeOption[] = [
    { id: '7d', label: '7D', days: 7 },
    { id: '30d', label: '30D', days: 30 },
    { id: '90d', label: '90D', days: 90 },
    { id: '1y', label: '1Y', days: 365 },
]

const DEFAULT_PRIMARY_KPIS: KpiItem[] = [
    {
        title: 'Gross Revenue',
        simplifiedTitle: 'Total Rent Collected',
        value: '₱0.00',
        change: '₱0 (0.0%)',
        simplifiedChange: 'No change',
        trendData: [0, 0, 0, 0, 0, 0, 0],
        changeType: 'neutral',
        iconColor: 'bg-emerald-500',
        trendlineProperties: { colors: ['#22d3ee', '#3b82f6'] },
    },
    {
        title: 'Physical Occupancy',
        simplifiedTitle: 'Occupied Units',
        value: '0%',
        change: '0% vs previous period',
        simplifiedChange: 'No change',
        trendData: [0, 0, 0, 0, 0, 0, 0],
        changeType: 'neutral',
        iconColor: 'bg-blue-500',
        trendlineProperties: { colors: ['#fb923c', '#ef4444'] },
    },
    {
        title: 'Economic Occupancy',
        simplifiedTitle: 'Revenue Efficiency',
        value: '0%',
        change: '0.0% vs previous period',
        simplifiedChange: 'No change',
        trendData: [0, 0, 0, 0, 0, 0, 0],
        changeType: 'neutral',
        iconColor: 'bg-purple-500',
        trendlineProperties: { colors: ['#a855f7', '#ec4899'] },
    },
    {
        title: 'Rent Arrears',
        simplifiedTitle: 'Unpaid Rent',
        value: '₱0',
        change: '0 pending',
        simplifiedChange: 'No overdue payments',
        trendData: [0, 0, 0, 0, 0, 0, 0],
        changeType: 'neutral',
        iconColor: 'bg-red-500',
        trendlineProperties: { colors: ['#ef4444', '#ec4899'] },
    },
]

const DEFAULT_EXTENDED_KPIS: KpiItem[] = [
    {
        title: 'Operating Expenses',
        simplifiedTitle: 'Maintenance & Costs',
        value: '₱0',
        change: '₱0 vs previous period',
        simplifiedChange: 'No change',
        trendData: [0, 0, 0, 0, 0, 0, 0],
        changeType: 'neutral',
        iconColor: 'bg-orange-500',
        trendlineProperties: { colors: ['#f97316', '#ea580c'] },
    },
    {
        title: 'Net Operating Income',
        simplifiedTitle: 'Net Profit (NOI)',
        value: '₱0',
        change: '0 vs previous period',
        simplifiedChange: 'Stable profit margin',
        trendData: [0, 0, 0, 0, 0, 0, 0],
        changeType: 'neutral',
        iconColor: 'bg-teal-500',
        trendlineProperties: { colors: ['#2dd4bf', '#14b8a6'] },
    },
    {
        title: 'Turnover Rate',
        simplifiedTitle: 'Tenant Churn',
        value: '0%',
        change: '0% vs previous period',
        simplifiedChange: 'No change',
        trendData: [0, 0, 0, 0, 0, 0, 0],
        changeType: 'neutral',
        iconColor: 'bg-primary',
        trendlineProperties: { colors: ['#818cf8', '#6366f1'] },
    },
    {
        title: 'Resolution Efficiency',
        simplifiedTitle: 'Maintenance Speed',
        value: '0 Days',
        change: '0 days avg. response',
        simplifiedChange: 'No change',
        trendData: [0, 0, 0, 0, 0, 0, 0],
        changeType: 'neutral',
        iconColor: 'bg-yellow-500',
        trendlineProperties: { colors: ['#facc15', '#eab308'] },
    },
]

const DEFAULT_FINANCIAL_CHART: OverviewApiResponse['financialChart'] = {
    week: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        earnings: [0, 0, 0, 0, 0, 0, 0],
        expenses: [0, 0, 0, 0, 0, 0, 0],
        netIncome: [0, 0, 0, 0, 0, 0, 0],
    },
    month: {
        labels: Array.from({ length: 30 }, (_, i) => (i + 1).toString()),
        earnings: Array.from({ length: 30 }, () => 0),
        expenses: Array.from({ length: 30 }, () => 0),
        netIncome: Array.from({ length: 30 }, () => 0),
    },
    year: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        earnings: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        expenses: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        netIncome: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
}

const DEFAULT_OPERATIONAL_SNAPSHOT: OverviewApiResponse['operationalSnapshot'] = {
    status: 'Stable',
    headline: 'Operations are stabilizing',
    summary: 'Snapshot data will appear here once the reporting window syncs with your latest portfolio activity.',
    metrics: [
        { label: 'Occupied Units', value: '0/0', detail: '0% occupied', tone: 'default' },
        { label: 'Urgent Issues', value: '0', detail: '0 open total', tone: 'default' },
        { label: 'Renewals Soon', value: '0', detail: 'Next 30 days', tone: 'default' },
        { label: 'Outstanding Rent', value: 'PHP 0', detail: '0 overdue invoices', tone: 'default' },
    ],
}

const formatIsoDate = (date: Date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 10)
}

const shiftDays = (days: number) => {
    const value = new Date()
    value.setHours(0, 0, 0, 0)
    value.setDate(value.getDate() + days)
    return value
}

const getDateLabels = (start: Date, end: Date, pointsCount: number) => {
    if (pointsCount <= 0) return []
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    return Array.from({ length: pointsCount }, (_, index) => {
        const ratio = pointsCount === 1 ? 0 : index / (pointsCount - 1)
        const date = new Date(start.getTime() + totalDays * ratio * (1000 * 60 * 60 * 24))
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    })
}

type StatsState = {
    primaryKpis: KpiItem[]
    extendedKpis: KpiItem[]
    financialChart: OverviewApiResponse['financialChart']
    operationalSnapshot: OverviewApiResponse['operationalSnapshot']
    statsLoading: boolean
    statsError: string | null
}

type StatsAction =
    | { type: 'LOAD_START' }
    | { type: 'LOAD_SUCCESS'; payload: Omit<StatsState, 'statsLoading' | 'statsError'> }
    | { type: 'LOAD_ERROR'; error: string }

function statsReducer(state: StatsState, action: StatsAction): StatsState {
    switch (action.type) {
        case 'LOAD_START':
            return { ...state, statsLoading: true, statsError: null }
        case 'LOAD_SUCCESS':
            return { ...state, ...action.payload, statsLoading: false, statsError: null }
        case 'LOAD_ERROR':
            return { ...state, statsLoading: false, statsError: action.error }
        default:
            return state
    }
}


const COLOR_THEMES = {
    blue: {
        text: 'text-blue-500',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25',
    },
    purple: {
        text: 'text-purple-500',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        btn: 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/25',
    },
    red: {
        text: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        btn: 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/25',
    },
    orange: {
        text: 'text-orange-500',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        btn: 'bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/25',
    },
    emerald: {
        text: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/25',
    },
    amber: {
        text: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/25',
    },
}

/* ----------------------------------------------------------
   Component
   ---------------------------------------------------------- */

export function LandlordAnalyticsView() {
    const { profile } = useAuth()
    const { selectedPropertyId } = useProperty()

    const [mounted, setMounted] = useState(false)
    const [selectedRange, setSelectedRange] = useState<RangeOption['id']>('30d')
    const [startDate, setStartDate] = useState(() => formatIsoDate(shiftDays(-29)))
    const [endDate, setEndDate] = useState(() => formatIsoDate(shiftDays(0)))
    const [isIrisVisible, setIsIrisVisible] = useState(false)
    const [isExportModalOpen, setIsExportModalOpen] = useState(false)
    const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('pdf')
    const [exportHistory, setExportHistory] = useState<ExportAuditItem[]>([])
    const [selectedVitalsDetail, setSelectedVitalsDetail] = useState<{
        title: string
        value: string
        subtext: string
        description: string
        color: keyof typeof COLOR_THEMES
        actionLabel?: string
        actionHref?: string
    } | null>(null)
    const [toastMessage, setToastMessage] = useState<string | null>(null)

    const [statsState, dispatchStats] = useReducer(statsReducer, {
        primaryKpis: DEFAULT_PRIMARY_KPIS,
        extendedKpis: DEFAULT_EXTENDED_KPIS,
        financialChart: DEFAULT_FINANCIAL_CHART,
        operationalSnapshot: DEFAULT_OPERATIONAL_SNAPSHOT,
        statsLoading: false,
        statsError: null,
    })

    const { primaryKpis, extendedKpis, financialChart, operationalSnapshot, statsLoading, statsError } = statsState

    const landlordFirstName = useMemo(() => {
        const fullName = profile?.full_name?.trim()
        if (!fullName) return null
        return fullName.split(/\s+/)[0] ?? null
    }, [profile?.full_name])

    // Primary KPI shortcuts
    const grossRevenue = primaryKpis[0] || DEFAULT_PRIMARY_KPIS[0]
    const occupiedUnits = primaryKpis[1] || DEFAULT_PRIMARY_KPIS[1]
    const revenueEfficiency = primaryKpis[2] || DEFAULT_PRIMARY_KPIS[2]
    const unpaidRent = primaryKpis[3] || DEFAULT_PRIMARY_KPIS[3]

    // Extended KPI shortcuts
    const operatingExpenses = extendedKpis[0] || DEFAULT_EXTENDED_KPIS[0]
    const netIncome = extendedKpis[1] || DEFAULT_EXTENDED_KPIS[1]
    const turnoverRate = extendedKpis[2] || DEFAULT_EXTENDED_KPIS[2]
    const resolutionSpeed = extendedKpis[3] || DEFAULT_EXTENDED_KPIS[3]

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    const getReportRows = (): ReportRow[] => {
        const activeKpis = [...primaryKpis, ...extendedKpis]
        const rStart = new Date(`${startDate}T00:00:00`)
        const rEnd = new Date(`${endDate}T23:59:59`)
        return activeKpis.map((kpi) => {
            const labels = getDateLabels(rStart, rEnd, kpi.trendData.length)
            const trend = labels.map((label, index) => `${label}: ${kpi.trendData[index]}`).join(' | ')

            return {
                metric: kpi.simplifiedTitle,
                value: kpi.value,
                change: kpi.simplifiedChange,
                trend,
            }
        })
    }

    const fetchExportHistory = useCallback(async () => {
        try {
            const response = await fetch('/api/landlord/analytics/report?limit=5&offset=0')
            if (!response.ok) return
            const payload = await response.json()
            setExportHistory(payload.history as ExportAuditItem[])
        } catch {
            // Handled gracefully
        }
    }, [])

    const applyPresetRange = (option: RangeOption) => {
        triggerHaptic('light')
        setSelectedRange(option.id)
        if (!option.days) return

        const end = shiftDays(0)
        const start = shiftDays(-(option.days - 1))
        setStartDate(formatIsoDate(start))
        setEndDate(formatIsoDate(end))
    }

    const handleExportCsv = async () => {
        triggerHaptic('medium')
        const now = new Date()
        const rows = getReportRows()

        try {
            await fetch('/api/landlord/analytics/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    format: 'csv',
                    mode: 'Full',
                    includeExpandedKpis: true,
                    range: `${startDate} to ${endDate}`,
                    generatedAt: now.toLocaleString(),
                    rows,
                }),
            })
            fetchExportHistory()
        } catch {}

        const reportHeaderRows = [
            ['Portfolio Analytics Report'],
            ['Generated At', now.toLocaleString()],
            ['Selected Range', `${startDate} to ${endDate}`],
            [],
            ['Metric', 'Value', 'Change', 'Trend Data'],
        ]

        const metricRows = rows.map((row) => [row.metric, row.value, row.change, row.trend])
        const csvContent = [...reportHeaderRows, ...metricRows]
            .map((row) =>
                row
                    .map((cell) => {
                        const str = String(cell ?? '')
                        return str.includes(',') || str.includes('"') || str.includes('\n')
                            ? `"${str.replace(/"/g, '""')}"`
                            : str
                    })
                    .join(',')
            )
            .join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
        const datePart = now.toISOString().split('T')[0]
        downloadBlob(blob, `portfolio-analytics-${datePart}.csv`)
        setToastMessage('CSV report downloaded successfully.')
    }

    const handleExportPdf = () => {
        triggerHaptic('medium')
        const now = new Date()
        const rows = getReportRows()
        const doc = new jsPDF({ unit: 'pt', format: 'a4' })
        const pageWidth = doc.internal.pageSize.getWidth()
        const margin = 40
        const contentWidth = pageWidth - margin * 2
        const pageHeight = doc.internal.pageSize.getHeight()
        let y = 96

        doc.setFillColor(12, 74, 110)
        doc.rect(0, 0, pageWidth, 74, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(20)
        doc.text('iReside', margin, 34)
        doc.setFontSize(12)
        doc.text('Portfolio Analytics Report', margin, 54)
        doc.setTextColor(24, 24, 27)

        const appendBlock = (text: string, size = 11, spacing = 16) => {
            doc.setFontSize(size)
            const lines = doc.splitTextToSize(text, contentWidth)
            const nextY = y + lines.length * spacing
            if (nextY > pageHeight - 40) {
                doc.addPage()
                y = 56
            }
            doc.text(lines, margin, y)
            y += lines.length * spacing
        }

        appendBlock('Portfolio Analytics Executive Report', 18, 20)
        appendBlock(`Generated: ${now.toLocaleString()}`)
        appendBlock(`Reporting Period: ${startDate} to ${endDate}`)

        y += 6
        rows.forEach((row, index) => {
            appendBlock(`${index + 1}. ${row.metric}`, 13, 18)
            appendBlock(`Value: ${row.value}`)
            appendBlock(`Change: ${row.change}`)
            appendBlock(`Trend: ${row.trend}`)
            y += 6
        })

        doc.setFontSize(10)
        doc.setTextColor(100, 116, 139)
        doc.text(`Generated by iReside on ${now.toLocaleString()}`, margin, pageHeight - 20)

        const datePart = now.toISOString().split('T')[0]
        doc.save(`portfolio-analytics-${datePart}.pdf`)
        setToastMessage('PDF report exported successfully.')
    }

    const handleRedownload = (item: ExportAuditItem) => {
        triggerHaptic('light')
        const now = new Date(item.generatedAt)
        const datePart = now.toISOString().split('T')[0]

        if (item.format === 'csv') {
            const reportHeaderRows = [
                ['Portfolio Analytics Report (Historical)'],
                ['Original Generation', now.toLocaleString()],
                ['Range', item.range],
                [],
                ['Metric', 'Value', 'Change', 'Trend Data'],
            ]
            const metricRows = item.rows.map((row) => [row.metric, row.value, row.change, row.trend])
            const csvContent = [...reportHeaderRows, ...metricRows]
                .map((row) =>
                    row
                        .map((cell) => {
                            const str = String(cell ?? '')
                            return str.includes(',') || str.includes('"') || str.includes('\n')
                                ? `"${str.replace(/"/g, '""')}"`
                                : str
                        })
                        .join(',')
                )
                .join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
            downloadBlob(blob, `report-${datePart}.csv`)
            setToastMessage('CSV redownloaded from history.')
        } else {
            const doc = new jsPDF({ unit: 'pt', format: 'a4' })
            const pageWidth = doc.internal.pageSize.getWidth()
            const margin = 40
            const contentWidth = pageWidth - margin * 2
            const pageHeight = doc.internal.pageSize.getHeight()
            let y = 96

            doc.setFillColor(12, 74, 110)
            doc.rect(0, 0, pageWidth, 74, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(20)
            doc.text('iReside', margin, 34)
            doc.setFontSize(12)
            doc.text('Portfolio Analytics Report', margin, 54)
            doc.setTextColor(24, 24, 27)

            const appendBlock = (text: string, size = 11, spacing = 16) => {
                doc.setFontSize(size)
                const lines = doc.splitTextToSize(text, contentWidth)
                const nextY = y + lines.length * spacing
                if (nextY > pageHeight - 40) {
                    doc.addPage()
                    y = 56
                }
                doc.text(lines, margin, y)
                y += lines.length * spacing
            }

            appendBlock('Portfolio Analytics Report (Historical)', 18, 20)
            appendBlock(`Original Generation: ${now.toLocaleString()}`)
            appendBlock(`Range: ${item.range}`)

            y += 6
            item.rows.forEach((row, index) => {
                appendBlock(`${index + 1}. ${row.metric}`, 13, 18)
                appendBlock(`Value: ${row.value}`)
                appendBlock(`Change: ${row.change}`)
                appendBlock(`Trend: ${row.trend}`)
                y += 6
            })

            doc.save(`report-${datePart}.pdf`)
            setToastMessage('PDF redownloaded from history.')
        }
    }

    useEffect(() => {
        setMounted(true)
        fetchExportHistory()
    }, [fetchExportHistory])

    useEffect(() => {
        if (!mounted) return
        const controller = new AbortController()

        const mergeKpis = (
            base: KpiItem[],
            incoming: Array<Pick<KpiItem, 'title' | 'value' | 'change' | 'simplifiedChange' | 'trendData' | 'changeType'>>
        ) => {
            const map = new Map(incoming.map((i) => [i.title, i]))
            return base.map((b) => {
                const inc = map.get(b.title)
                if (!inc) return b
                return {
                    ...b,
                    value: inc.value,
                    change: inc.change,
                    simplifiedChange: inc.simplifiedChange,
                    trendData: inc.trendData,
                    changeType: inc.changeType,
                }
            })
        }

        const loadOverview = async () => {
            dispatchStats({ type: 'LOAD_START' })
            try {
                const params = new URLSearchParams({
                    start: startDate,
                    end: endDate,
                    propertyId: selectedPropertyId || 'all',
                })
                const res = await fetch(`/api/landlord/analytics/overview?${params.toString()}`, {
                    signal: controller.signal,
                })
                if (!res.ok) {
                    dispatchStats({ type: 'LOAD_ERROR', error: 'Unable to load live analytics.' })
                    return
                }
                const payload = (await res.json()) as OverviewApiResponse
                dispatchStats({
                    type: 'LOAD_SUCCESS',
                    payload: {
                        primaryKpis: mergeKpis(primaryKpis, payload.primaryKpis ?? []),
                        extendedKpis: mergeKpis(extendedKpis, payload.extendedKpis ?? []),
                        financialChart: payload.financialChart ?? DEFAULT_FINANCIAL_CHART,
                        operationalSnapshot: payload.operationalSnapshot ?? DEFAULT_OPERATIONAL_SNAPSHOT,
                    },
                })
            } catch (err) {
                if ((err as Error).name === 'AbortError') return
                dispatchStats({ type: 'LOAD_ERROR', error: 'Failed to sync portfolio metrics.' })
            }
        }

        void loadOverview()
        return () => controller.abort()
    }, [mounted, startDate, endDate, selectedPropertyId])

    useEffect(() => {
        if (!toastMessage) return
        const t = setTimeout(() => setToastMessage(null), 2500)
        return () => clearTimeout(t)
    }, [toastMessage])

    if (!mounted) return null

    return (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28 mobile-scroll">
            {/* 1. Property Selector Pill */}
            <div className="w-full">
                <MobilePropertySelector />
            </div>

            {/* 2. Sleek Utility Bar (Export & iRis AI) */}
            <div className="flex items-center justify-between gap-2.5">
                <button
                    type="button"
                    onClick={() => {
                        triggerHaptic('light')
                        setIsExportModalOpen(true)
                    }}
                    className="flex-1 h-12 neumorphic-panel rounded-2xl px-4 flex items-center justify-center gap-2 border border-border/20 text-foreground font-black text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                    <Download className="size-4 text-primary" />
                    <span>Export Report</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        triggerHaptic('light')
                        setIsIrisVisible((p) => !p)
                    }}
                    className={cn(
                        'h-12 neumorphic-panel rounded-2xl px-4 flex items-center justify-center gap-2 border border-border/20 font-black text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-xs',
                        isIrisVisible ? 'text-primary' : 'text-muted-foreground'
                    )}
                >
                    <Sparkles className="size-4 text-primary" />
                    <span>{isIrisVisible ? 'Hide iRis' : 'Ask iRis'}</span>
                </button>
            </div>

            {/* 3. 👑 THE HERO FINANCIAL WALLET CARD (No clipped text, full width) */}
            <section className="neumorphic-panel rounded-[2rem] p-5 sm:p-6 border border-border/30 shadow-md relative overflow-hidden space-y-4">
                {/* Background ambient accent */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                {/* Card Header & Timeframe Switcher */}
                <div className="flex items-center justify-between gap-2 relative z-10">
                    <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                            Gross Revenue
                        </span>
                    </div>

                    {statsLoading ? (
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-primary">
                            <RefreshCw className="size-3 animate-spin" />
                            Syncing
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 neumorphic-inset-card px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-muted-foreground/80">
                            <CalendarIcon className="size-2.5 text-primary" />
                            {selectedRange.toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Grand Currency Amount (Never truncated) */}
                <div className="space-y-1 relative z-10">
                    <div className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-none">
                        {grossRevenue.value}
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
                            <TrendingUp className="size-3" />
                            {grossRevenue.change}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                            collected in rent
                        </span>
                    </div>
                </div>

                {/* Embedded Timeframe Segmented Control */}
                <div className="pt-2 relative z-10">
                    <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl neumorphic-inset">
                        {RANGE_OPTIONS.map((opt) => {
                            const isSelected = selectedRange === opt.id
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => applyPresetRange(opt)}
                                    className={cn(
                                        'h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center select-none active:scale-95',
                                        isSelected
                                            ? 'neumorphic-panel text-primary shadow-sm'
                                            : 'text-muted-foreground/70 hover:text-foreground'
                                    )}
                                >
                                    {opt.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* 4. 📈 POCKET FINANCIAL PERFORMANCE CHART */}
            <section className="neumorphic-panel rounded-[2rem] p-4 sm:p-5 border border-border/20 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <div className="neumorphic-inset-card flex size-8 items-center justify-center rounded-xl text-emerald-400">
                            <TrendingUp className="size-4" />
                        </div>
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
                                Financial Performance
                            </h2>
                            <p className="text-[10px] text-muted-foreground">
                                Revenue vs. Operational Costs
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/mobile/landlord/payments"
                        onClick={() => triggerHaptic('light')}
                        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary hover:underline shrink-0"
                    >
                        <span>Finance Hub</span>
                        <ArrowUpRight className="size-3" />
                    </Link>
                </div>

                {/* Chart container */}
                <div className="min-h-[320px] w-full pt-1">
                    {statsLoading ? (
                        <ChartSkeleton />
                    ) : (
                        <MobileFinancialPerformanceChart dataByWindow={financialChart} />
                    )}
                </div>
            </section>

            {/* 5. 📋 PORTFOLIO HEALTH & VITALS (Native Mobile List - Facebook/iOS Style) */}
            <section className="space-y-2">
                <div className="px-2 pt-1 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                        Portfolio Vitals & Metrics
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground/60">
                        Tap for details
                    </span>
                </div>

                <div className="neumorphic-panel rounded-[2rem] p-2 divide-y divide-border/10 border border-border/20 shadow-sm">
                    {/* Row 1: Occupied Units */}
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic('light')
                            setSelectedVitalsDetail({
                                title: 'Occupied Units (Physical Occupancy)',
                                value: occupiedUnits.value,
                                subtext: occupiedUnits.change,
                                description: 'Percentage of total registered rentable units currently occupied under active leases.',
                                color: 'blue',
                                actionLabel: 'View Leases',
                                actionHref: '/landlord/leases',
                            })
                        }}
                        className="w-full min-h-[60px] flex items-center justify-between p-3.5 hover:bg-muted/40 rounded-2xl transition-all active:scale-[0.98] text-left cursor-pointer select-none"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="size-10 rounded-2xl flex items-center justify-center shrink-0 neumorphic-inset-card text-blue-500">
                                <Building2 className="size-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                                    Occupied Units
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {occupiedUnits.change}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-black text-blue-500">
                                {occupiedUnits.value}
                            </span>
                            <ChevronRight className="size-4 text-muted-foreground/50" />
                        </div>
                    </button>

                    {/* Row 2: Revenue Efficiency */}
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic('light')
                            setSelectedVitalsDetail({
                                title: 'Revenue Efficiency (Economic Occupancy)',
                                value: revenueEfficiency.value,
                                subtext: revenueEfficiency.change,
                                description: 'Actual rent collected vs. theoretical maximum potential rent if 100% occupied at market rate.',
                                color: 'purple',
                                actionLabel: 'Review Rent Roll',
                                actionHref: '/mobile/landlord/payments',
                            })
                        }}
                        className="w-full min-h-[60px] flex items-center justify-between p-3.5 hover:bg-muted/40 rounded-2xl transition-all active:scale-[0.98] text-left cursor-pointer select-none"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="size-10 rounded-2xl flex items-center justify-center shrink-0 neumorphic-inset-card text-purple-500">
                                <BarChart className="size-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                                    Revenue Efficiency
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    Realized revenue potential
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-black text-purple-500">
                                {revenueEfficiency.value}
                            </span>
                            <ChevronRight className="size-4 text-muted-foreground/50" />
                        </div>
                    </button>

                    {/* Row 3: Unpaid Rent (Arrears) */}
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic('light')
                            setSelectedVitalsDetail({
                                title: 'Unpaid Rent (Arrears)',
                                value: unpaidRent.value,
                                subtext: unpaidRent.change,
                                description: 'Outstanding invoices and overdue balances awaiting tenant settlement.',
                                color: 'red',
                                actionLabel: 'Collect Overdue Rent',
                                actionHref: '/mobile/landlord/payments',
                            })
                        }}
                        className="w-full min-h-[60px] flex items-center justify-between p-3.5 hover:bg-muted/40 rounded-2xl transition-all active:scale-[0.98] text-left cursor-pointer select-none"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="size-10 rounded-2xl flex items-center justify-center shrink-0 neumorphic-inset-card text-red-500">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black uppercase tracking-wider text-red-500">
                                    Unpaid Rent
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {unpaidRent.change}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-black text-red-500">
                                {unpaidRent.value}
                            </span>
                            <ChevronRight className="size-4 text-muted-foreground/50" />
                        </div>
                    </button>

                    {/* Row 4: Operating Expenses */}
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic('light')
                            setSelectedVitalsDetail({
                                title: 'Operating Expenses',
                                value: operatingExpenses.value,
                                subtext: operatingExpenses.change,
                                description: 'Total maintenance repair bills, utility payouts, and operational expenses.',
                                color: 'orange',
                                actionLabel: 'View Expense Breakdown',
                                actionHref: '/mobile/landlord/payments',
                            })
                        }}
                        className="w-full min-h-[60px] flex items-center justify-between p-3.5 hover:bg-muted/40 rounded-2xl transition-all active:scale-[0.98] text-left cursor-pointer select-none"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="size-10 rounded-2xl flex items-center justify-center shrink-0 neumorphic-inset-card text-orange-500">
                                <CreditCard className="size-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                                    Operating Costs
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    Maintenance & bills
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-black text-orange-500">
                                {operatingExpenses.value}
                            </span>
                            <ChevronRight className="size-4 text-muted-foreground/50" />
                        </div>
                    </button>

                    {/* Row 5: Net Operating Income (NOI) */}
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic('light')
                            setSelectedVitalsDetail({
                                title: 'Net Operating Income (NOI)',
                                value: netIncome.value,
                                subtext: netIncome.change,
                                description: 'Real net profit generated after subtracting all operating expenses from collected rent.',
                                color: 'emerald',
                                actionLabel: 'Finance Overview',
                                actionHref: '/mobile/landlord/payments',
                            })
                        }}
                        className="w-full min-h-[60px] flex items-center justify-between p-3.5 hover:bg-muted/40 rounded-2xl transition-all active:scale-[0.98] text-left cursor-pointer select-none"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="size-10 rounded-2xl flex items-center justify-center shrink-0 neumorphic-inset-card text-teal-500">
                                <TrendingUp className="size-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black uppercase tracking-wider text-teal-500">
                                    Net Profit (NOI)
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    Revenue minus expenses
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-black text-teal-500">
                                {netIncome.value}
                            </span>
                            <ChevronRight className="size-4 text-muted-foreground/50" />
                        </div>
                    </button>

                    {/* Row 6: Maintenance Speed */}
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic('light')
                            setSelectedVitalsDetail({
                                title: 'Maintenance Speed',
                                value: resolutionSpeed.value,
                                subtext: resolutionSpeed.change,
                                description: 'Average time in days from ticket creation by tenant to contractor completion.',
                                color: 'amber',
                                actionLabel: 'View Open Tickets',
                                actionHref: '/mobile/landlord/tickets',
                            })
                        }}
                        className="w-full min-h-[60px] flex items-center justify-between p-3.5 hover:bg-muted/40 rounded-2xl transition-all active:scale-[0.98] text-left cursor-pointer select-none"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="size-10 rounded-2xl flex items-center justify-center shrink-0 neumorphic-inset-card text-yellow-500">
                                <Wrench className="size-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                                    Resolution Speed
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {resolutionSpeed.simplifiedChange}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-black text-amber-500">
                                {resolutionSpeed.value}
                            </span>
                            <ChevronRight className="size-4 text-muted-foreground/50" />
                        </div>
                    </button>
                </div>
            </section>

            {/* 6. 🤖 iRis AI Smart Briefing Card */}
            <section className="neumorphic-panel rounded-[2rem] p-4 sm:p-5 border border-primary/20 bg-primary/5 space-y-3">
                <div className="flex items-start gap-3">
                    <div className="size-10 rounded-2xl flex items-center justify-center shrink-0 bg-primary/20 text-primary">
                        <Sparkles className="size-5" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-foreground">
                                iRis Executive Briefing
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                {operationalSnapshot.status}
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                            {operationalSnapshot.summary}
                        </p>
                    </div>
                </div>

                <div className="pt-1">
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic('light')
                            setIsIrisVisible(true)
                        }}
                        className="w-full neumorphic-extruded py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider text-primary flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
                    >
                        <span>Open Interactive AI Analysis</span>
                        <ChevronRight className="size-3.5" />
                    </button>
                </div>
            </section>

            {/* 7. 📜 Quick Export History Chips */}
            {exportHistory.length > 0 && (
                <section className="space-y-2">
                    <div className="px-2 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                            Recent Downloads
                        </span>
                        <History className="size-3.5 text-muted-foreground/60" />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {exportHistory.slice(0, 5).map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleRedownload(item)}
                                className="neumorphic-panel rounded-2xl p-2.5 px-3.5 flex items-center gap-2 shrink-0 border border-border/20 text-left active:scale-95 transition-all cursor-pointer"
                            >
                                <FileText className="size-3.5 text-primary" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-foreground">
                                        {item.format.toUpperCase()} Report
                                    </span>
                                    <span className="text-[8px] text-muted-foreground">
                                        {new Date(item.generatedAt).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                                <Download className="size-3 text-muted-foreground/60 ml-1" />
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Floating iRis Agent Container */}
            <div className="relative z-40">
                <IrisAIAgent
                    stats={{
                        primaryKpis,
                        extendedKpis,
                        operationalSnapshot,
                        financialChart,
                    }}
                    isVisible={isIrisVisible}
                    onVisibilityChange={setIsIrisVisible}
                    showVisibilityToggle={false}
                    landlordFirstName={landlordFirstName}
                />
            </div>

            {/* Metric Detail Slide-Up Bottom Sheet */}
            <AnimatePresence>
                {selectedVitalsDetail && (
                    <div className="fixed inset-0 z-[160] flex flex-col justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedVitalsDetail(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                            className="relative z-10 w-full rounded-t-[2.5rem] neumorphic-panel border-t border-border/30 p-6 space-y-4 bg-background shadow-2xl max-h-[70vh] overflow-y-auto"
                        >
                            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto" />

                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-black uppercase tracking-tight text-foreground">
                                        {selectedVitalsDetail.title}
                                    </h3>
                                    <p className={cn("text-3xl font-black tracking-tight", COLOR_THEMES[selectedVitalsDetail.color]?.text || 'text-primary')}>
                                        {selectedVitalsDetail.value}
                                    </p>
                                    <p className={cn("text-xs font-semibold inline-block px-2.5 py-0.5 rounded-full border", 
                                        COLOR_THEMES[selectedVitalsDetail.color]?.bg || 'bg-muted',
                                        COLOR_THEMES[selectedVitalsDetail.color]?.text || 'text-muted-foreground',
                                        COLOR_THEMES[selectedVitalsDetail.color]?.border || 'border-border'
                                    )}>
                                        {selectedVitalsDetail.subtext}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedVitalsDetail(null)}
                                    className="size-8 rounded-full neumorphic-extruded flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                                {selectedVitalsDetail.description}
                            </p>

                            {selectedVitalsDetail.actionHref && (
                                <div className="pt-2">
                                    <Link
                                        href={selectedVitalsDetail.actionHref}
                                        onClick={() => setSelectedVitalsDetail(null)}
                                        className={cn(
                                            "w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer",
                                            COLOR_THEMES[selectedVitalsDetail.color]?.btn || 'neumorphic-primary'
                                        )}
                                    >
                                        <span>{selectedVitalsDetail.actionLabel || 'View Details'}</span>
                                        <ArrowUpRight className="size-3.5" />
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Export Bottom Sheet Modal */}
            <AnimatePresence>
                {isExportModalOpen && (
                    <div className="fixed inset-0 z-[150] flex flex-col justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsExportModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                            className="relative z-10 w-full rounded-t-[2.5rem] neumorphic-panel border-t border-border/30 p-5 space-y-5 bg-background shadow-2xl max-h-[85vh] overflow-y-auto mobile-scroll"
                        >
                            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto" />

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-black uppercase tracking-tight text-foreground">
                                        Export Analytics Report
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground">
                                        Generate downloadable audit
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsExportModalOpen(false)}
                                    className="size-11 rounded-full neumorphic-extruded flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {/* Period selector */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                                    1. Reporting Range
                                </label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {RANGE_OPTIONS.map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => applyPresetRange(option)}
                                            className={cn(
                                                'h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center select-none',
                                                selectedRange === option.id
                                                    ? 'neumorphic-inset text-primary'
                                                    : 'neumorphic-extruded text-muted-foreground'
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60">From</span>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => {
                                                setSelectedRange('custom')
                                                setStartDate(e.target.value)
                                            }}
                                            className="h-11 neumorphic-inset rounded-xl w-full px-3 text-xs font-semibold mt-1 text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60">To</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => {
                                                setSelectedRange('custom')
                                                setEndDate(e.target.value)
                                            }}
                                            className="neumorphic-inset rounded-xl w-full px-3 py-2 text-xs font-semibold mt-1 text-foreground"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Format selector */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                                    2. Format
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic('light')
                                            setExportFormat('pdf')
                                        }}
                                        className={cn(
                                            'p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer',
                                            exportFormat === 'pdf'
                                                ? 'neumorphic-inset text-blue-400'
                                                : 'neumorphic-extruded text-muted-foreground'
                                        )}
                                    >
                                        <FileText className="size-6" />
                                        <span className="text-xs font-black uppercase tracking-wider">PDF Report</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic('light')
                                            setExportFormat('csv')
                                        }}
                                        className={cn(
                                            'p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer',
                                            exportFormat === 'csv'
                                                ? 'neumorphic-inset text-emerald-400'
                                                : 'neumorphic-extruded text-muted-foreground'
                                        )}
                                    >
                                        <Download className="size-6" />
                                        <span className="text-xs font-black uppercase tracking-wider">CSV Data</span>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (exportFormat === 'pdf') handleExportPdf()
                                        else handleExportCsv()
                                        setIsExportModalOpen(false)
                                    }}
                                    className="w-full h-12 neumorphic-primary rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                                >
                                    Generate & Download
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-20 left-4 right-4 z-[200] neumorphic-inset-card rounded-2xl px-4 py-3 text-center text-xs font-black text-emerald-400 shadow-xl border border-emerald-500/20 animate-in slide-in-from-bottom-3 duration-200">
                    {toastMessage}
                </div>
            )}
        </div>
    )
}
