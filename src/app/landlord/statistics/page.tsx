"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart, ChevronDown, Download, Eye, EyeOff, FileText, History, TrendingUp, X } from "lucide-react";
import { jsPDF } from "jspdf";
import { cn } from "@/lib/utils";
import { IrisAIAgent } from "@/components/landlord/dashboard/IrisAIAgent";
import { useAuth } from "@/hooks/useAuth";
import { KpiCard } from "@/components/landlord/dashboard/KpiCard";
import { KpiCardSkeleton } from "@/components/landlord/dashboard/KpiCardSkeleton";
import { ChartSkeleton } from "@/components/landlord/dashboard/ChartSkeleton";
import { OperationalSnapshotSkeleton } from "@/components/landlord/dashboard/OperationalSnapshotSkeleton";
import { FinancialPerformanceChart, type FinancialChartWindowData } from "@/components/landlord/dashboard/FinancialPerformanceChart";
import { OperationalSnapshotCard } from "@/components/landlord/dashboard/OperationalSnapshotCard";
import { useProperty } from "@/context/PropertyContext";

type KpiItem = {
    title: string;
    simplifiedTitle: string;
    value: string;
    change: string;
    simplifiedChange: string;
    trendData: number[];
    changeType: "positive" | "negative" | "neutral";
    iconColor: string;
    trendlineProperties: { colors: [string, string] };
};

type RangeOption = {
    id: "7d" | "30d" | "90d" | "1y" | "custom";
    label: string;
    days: number | null;
};

type ReportRow = {
    metric: string;
    value: string;
    change: string;
    trend: string;
};

type ExportAuditItem = {
    id: string;
    format: "csv" | "pdf";
    range: string;
    generatedAt: string;
};

type KpiInsight = {
    summary: string;
    status: string;
    recommendation: string;
    source?: "ai" | "fallback";
};

type OverviewApiResponse = {
    primaryKpis: Array<Pick<KpiItem, "title" | "value" | "change" | "simplifiedChange" | "trendData" | "changeType">>;
    extendedKpis: Array<Pick<KpiItem, "title" | "value" | "change" | "simplifiedChange" | "trendData" | "changeType">>;
    financialChart: {
        week: FinancialChartWindowData;
        month: FinancialChartWindowData;
        year: FinancialChartWindowData;
    };
    operationalSnapshot: {
        status: "Performing" | "Stable" | "Attention Required";
        headline: string;
        summary: string;
        metrics: Array<{
            label: string;
            value: string;
            detail: string;
            tone: "default" | "positive" | "warning" | "critical";
        }>;
    };
};

const RANGE_OPTIONS: RangeOption[] = [
    { id: "7d", label: "7D", days: 7 },
    { id: "30d", label: "30D", days: 30 },
    { id: "90d", label: "90D", days: 90 },
    { id: "1y", label: "1Y", days: 365 },
    { id: "custom", label: "Custom", days: null },
];

const DEFAULT_PRIMARY_KPIS: KpiItem[] = [
    {
        title: "Estimated Earnings",
        simplifiedTitle: "Money Earned",
        value: "₱0.00",
        change: "₱0 (0.0%)",
        simplifiedChange: "No change",
        trendData: [0, 0, 0, 0, 0, 0, 0],
        changeType: "neutral",
        iconColor: "bg-blue-500",
        trendlineProperties: { colors: ["#22d3ee", "#3b82f6"] },
    },
    {
        title: "Active Tenants",
        simplifiedTitle: "People Staying",
        value: "0",
        change: "0 vs previous period",
        simplifiedChange: "No change",
        trendData: [0, 0, 0, 0, 0, 0, 0],
        changeType: "neutral",
        iconColor: "bg-purple-500",
        trendlineProperties: { colors: ["#fb923c", "#ef4444"] },
    },
    {
        title: "Occupancy Rate",
        simplifiedTitle: "Rented Houses",
        value: "0%",
        change: "0.0% vs previous period",
        simplifiedChange: "No change",
        trendData: [0, 0, 0, 0, 0, 0, 0],
        changeType: "neutral",
        iconColor: "bg-emerald-500",
        trendlineProperties: { colors: ["#a855f7", "#ec4899"] },
    },
    {
        title: "Pending Issues",
        simplifiedTitle: "Things to Fix",
        value: "0",
        change: "0 pending",
        simplifiedChange: "No urgent issues",
        trendData: [0, 0, 0, 0, 0, 0, 0],
        changeType: "neutral",
        iconColor: "bg-red-500",
        trendlineProperties: { colors: ["#ef4444", "#ec4899"] },
    },
];

const DEFAULT_EXTENDED_KPIS: KpiItem[] = [
    {
        title: "Maintenance Cost",
        simplifiedTitle: "Repair Costs",
        value: "₱0",
        change: "₱0 vs previous period",
        simplifiedChange: "No change",
        trendData: [0, 0, 0, 0, 0, 0, 0],
        changeType: "neutral",
        iconColor: "bg-orange-500",
        trendlineProperties: { colors: ["#f97316", "#ea580c"] },
    },
    {
        title: "Lease Renewals",
        simplifiedTitle: "Ending Contracts",
        value: "0",
        change: "0 due in next 30 days",
        simplifiedChange: "No contracts ending soon",
        trendData: [0, 0, 0, 0, 0, 0, 0],
        changeType: "neutral",
        iconColor: "bg-indigo-500",
        trendlineProperties: { colors: ["#818cf8", "#6366f1"] },
    },
    {
        title: "Avg. Tenant Duration",
        simplifiedTitle: "Average Stay",
        value: "0.0 Years",
        change: "0.0 yrs vs previous period",
        simplifiedChange: "No change",
        trendData: [0, 0, 0, 0, 0, 0, 0],
        changeType: "neutral",
        iconColor: "bg-teal-500",
        trendlineProperties: { colors: ["#2dd4bf", "#14b8a6"] },
    },
    {
        title: "Portfolio Value",
        simplifiedTitle: "Total Property Value",
        value: "₱0",
        change: "0.0% annualized rent value",
        simplifiedChange: "No change",
        trendData: [0, 0, 0, 0, 0, 0, 0],
        changeType: "neutral",
        iconColor: "bg-yellow-500",
        trendlineProperties: { colors: ["#facc15", "#eab308"] },
    },
];

const DEFAULT_FINANCIAL_CHART: OverviewApiResponse["financialChart"] = {
    week: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
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
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        earnings: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        expenses: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        netIncome: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
};

const DEFAULT_OPERATIONAL_SNAPSHOT: OverviewApiResponse["operationalSnapshot"] = {
    status: "Stable",
    headline: "Operations are stabilizing",
    summary: "Snapshot data will appear here once the reporting window syncs with your latest portfolio activity.",
    metrics: [
        { label: "Occupied Units", value: "0/0", detail: "0% occupied", tone: "default" },
        { label: "Urgent Issues", value: "0", detail: "0 open total", tone: "default" },
        { label: "Renewals Soon", value: "0", detail: "Next 30 days", tone: "default" },
        { label: "Outstanding Rent", value: "PHP 0", detail: "0 overdue invoices", tone: "default" },
    ],
};

const formatIsoDate = (date: Date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
};

const shiftDays = (days: number) => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    value.setDate(value.getDate() + days);
    return value;
};

const getDateLabels = (start: Date, end: Date, pointsCount: number) => {
    if (pointsCount <= 0) return [];
    const startMs = start.getTime();
    const endMs = end.getTime();
    const totalSpan = Math.max(endMs - startMs, 0);

    if (pointsCount === 1) {
        return [formatIsoDate(start)];
    }

    return Array.from({ length: pointsCount }, (_, index) => {
        const ratio = index / (pointsCount - 1);
        const point = new Date(startMs + totalSpan * ratio);
        return formatIsoDate(point);
    });
};

export default function StatisticsPage() {
    const { profile } = useAuth();
    const { selectedPropertyId } = useProperty();
    const [mounted, setMounted] = useState(false);
    const [showMoreKpis, setShowMoreKpis] = useState(false);
    const [selectedRange, setSelectedRange] = useState<RangeOption["id"]>("30d");
    const [startDate, setStartDate] = useState(formatIsoDate(shiftDays(-29)));
    const [endDate, setEndDate] = useState(formatIsoDate(shiftDays(0)));
    const [isIrisVisible, setIsIrisVisible] = useState(true);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("pdf");
    const [exportHistory, setExportHistory] = useState<ExportAuditItem[]>([]);
    const [kpiInsights, setKpiInsights] = useState<Record<string, KpiInsight>>({});
    const [insightSource, setInsightSource] = useState<"ai" | "fallback" | null>(null);
    const [primaryKpis, setPrimaryKpis] = useState<KpiItem[]>(DEFAULT_PRIMARY_KPIS);
    const [extendedKpis, setExtendedKpis] = useState<KpiItem[]>(DEFAULT_EXTENDED_KPIS);
    const [financialChart, setFinancialChart] = useState<OverviewApiResponse["financialChart"]>(DEFAULT_FINANCIAL_CHART);
    const [operationalSnapshot, setOperationalSnapshot] = useState<OverviewApiResponse["operationalSnapshot"]>(DEFAULT_OPERATIONAL_SNAPSHOT);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);

    const reportStartDate = useMemo(() => new Date(`${startDate}T00:00:00`), [startDate]);
    const reportEndDate = useMemo(() => new Date(`${endDate}T23:59:59`), [endDate]);
    const landlordFirstName = useMemo(() => {
        const fullName = profile?.full_name?.trim();
        if (!fullName) return null;
        return fullName.split(/\s+/)[0] ?? null;
    }, [profile?.full_name]);

    const buildLocalFallbackInsight = (kpi: KpiItem): KpiInsight => {
        const status =
            kpi.changeType === "positive"
                ? "This KPI is trending in a healthy direction."
                : kpi.changeType === "negative"
                  ? "This KPI is weakening and should be reviewed soon."
                  : "This KPI is stable right now.";

        const recommendation =
            kpi.changeType === "positive"
                ? "Keep using the same strategy and track what actions are causing this improvement."
                : kpi.changeType === "negative"
                  ? "Review recent tenant activity, maintenance timing, and pricing decisions to identify the likely cause."
                  : "Keep monitoring this weekly and set an alert so changes are caught early.";

        return {
            summary: `${kpi.title} is currently ${kpi.value} with a recent change of ${kpi.change}.`,
            status,
            recommendation,
            source: "fallback",
        };
    };

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getReportRows = (): ReportRow[] => {
        const activeKpis = showMoreKpis ? [...primaryKpis, ...extendedKpis] : primaryKpis;
        return activeKpis.map((kpi) => {
            const labels = getDateLabels(reportStartDate, reportEndDate, kpi.trendData.length);
            const trend = labels.map((label, index) => `${label}: ${kpi.trendData[index]}`).join(" | ");

            return {
                metric: kpi.simplifiedTitle,
                value: kpi.value,
                change: kpi.simplifiedChange,
                trend,
            };
        });
    };

    const fetchExportHistory = async () => {
        try {
            const response = await fetch("/api/landlord/statistics/report", { method: "GET" });
            if (!response.ok) {
                return;
            }

            const payload = await response.json();
            if (Array.isArray(payload?.history)) {
                setExportHistory(payload.history as ExportAuditItem[]);
            }
        } catch {
            // Keep the page functional even if audit history is unavailable.
        }
    };

    const trackPdfExport = async () => {
        try {
            await fetch("/api/landlord/statistics/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    format: "pdf",
                    mode: "Standard",
                    includeExpandedKpis: showMoreKpis,
                    range: `${startDate} to ${endDate}`,
                    rows: getReportRows(),
                }),
            });
            fetchExportHistory();
        } catch {
            // PDF generation should still succeed if tracking fails.
        }
    };

    const applyPresetRange = (option: RangeOption) => {
        setSelectedRange(option.id);
        if (!option.days) return;

        const end = shiftDays(0);
        const start = shiftDays(-(option.days - 1));
        setStartDate(formatIsoDate(start));
        setEndDate(formatIsoDate(end));
    };

    const handleExportCsv = async () => {
        const now = new Date();
        const rows = getReportRows();

        try {
            const response = await fetch("/api/landlord/statistics/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    format: "csv",
                    mode: "Standard",
                    includeExpandedKpis: showMoreKpis,
                    range: `${startDate} to ${endDate}`,
                    generatedAt: now.toLocaleString(),
                    rows,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to export CSV report.");
            }

            const csvText = await response.text();
            const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
            const datePart = now.toISOString().split("T")[0];
            downloadBlob(blob, `landlord-portfolio-report-${datePart}.csv`);
            setToastMessage("CSV report exported successfully.");
            fetchExportHistory();
        } catch {
            setToastMessage("Unable to export CSV right now. Please try again.");
        }
    };

    const handleExportPdf = () => {
        const now = new Date();
        const rows = getReportRows();
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 40;
        const contentWidth = pageWidth - margin * 2;
        const pageHeight = doc.internal.pageSize.getHeight();
        let y = 96;

        doc.setFillColor(12, 74, 110);
        doc.rect(0, 0, pageWidth, 74, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text("iReside", margin, 34);
        doc.setFontSize(12);
        doc.text("Landlord Portfolio Report", margin, 54);
        doc.setTextColor(24, 24, 27);

        const appendBlock = (text: string, size = 11, spacing = 16) => {
            doc.setFontSize(size);
            const lines = doc.splitTextToSize(text, contentWidth);
            const nextY = y + lines.length * spacing;

            if (nextY > pageHeight - 40) {
                doc.addPage();
                y = 56;
            }

            doc.text(lines, margin, y);
            y += lines.length * spacing;
        };

        appendBlock("Portfolio Statistics Report", 18, 20);
        appendBlock(`Generated: ${now.toLocaleString()}`);
        appendBlock(`Selected Range: ${startDate} to ${endDate}`);
        appendBlock(`Includes Expanded KPIs: ${showMoreKpis ? "Yes" : "No"}`);

        y += 6;
        rows.forEach((row, index) => {
            appendBlock(`${index + 1}. ${row.metric}`, 13, 18);
            appendBlock(`Value: ${row.value}`);
            appendBlock(`Change: ${row.change}`);
            appendBlock(`Trend: ${row.trend}`);
            y += 6;
        });

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated by iReside on ${now.toLocaleString()}`, margin, pageHeight - 20);

        const datePart = now.toISOString().split("T")[0];
        doc.save(`landlord-portfolio-report-${datePart}.pdf`);
        setToastMessage("PDF report exported successfully.");
        trackPdfExport();
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            fetchExportHistory();
        }
    }, [mounted]);

    useEffect(() => {
        if (!mounted) return;

        const controller = new AbortController();

        const mergeKpiValues = (
            baseKpis: KpiItem[],
            incomingKpis: Array<Pick<KpiItem, "title" | "value" | "change" | "simplifiedChange" | "trendData" | "changeType">>
        ) => {
            const incomingMap = new Map(incomingKpis.map((item) => [item.title, item]));

            return baseKpis.map((kpi) => {
                const incoming = incomingMap.get(kpi.title);
                if (!incoming) return kpi;

                return {
                    ...kpi,
                    value: incoming.value,
                    change: incoming.change,
                    simplifiedChange: incoming.simplifiedChange,
                    trendData: incoming.trendData,
                    changeType: incoming.changeType,
                };
            });
        };

        const loadOverview = async () => {
            setStatsLoading(true);
            setStatsError(null);

            try {
                const params = new URLSearchParams({
                    start: startDate,
                    end: endDate,
                    propertyId: selectedPropertyId,
                });
                const response = await fetch(`/api/landlord/statistics/overview?${params.toString()}`, {
                    method: "GET",
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error("Failed to load statistics overview");
                }

                const payload = (await response.json()) as OverviewApiResponse;
                setPrimaryKpis((previous) => mergeKpiValues(previous, payload.primaryKpis ?? []));
                setExtendedKpis((previous) => mergeKpiValues(previous, payload.extendedKpis ?? []));
                setFinancialChart(payload.financialChart ?? DEFAULT_FINANCIAL_CHART);
                setOperationalSnapshot(payload.operationalSnapshot ?? DEFAULT_OPERATIONAL_SNAPSHOT);
            } catch (error) {
                if ((error as Error).name === "AbortError") return;
                setStatsError("Unable to load live statistics right now.");
            } finally {
                setStatsLoading(false);
            }
        };

        void loadOverview();

        return () => {
            controller.abort();
        };
    }, [mounted, startDate, endDate, selectedPropertyId]);

    useEffect(() => {
        if (!mounted) return;

        const allKpis = [...primaryKpis, ...extendedKpis];
        const controller = new AbortController();

        const fetchKpiInsights = async () => {
            try {
                const response = await fetch("/api/landlord/statistics/insights", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        rangeStart: startDate,
                        rangeEnd: endDate,
                        kpis: allKpis.map((kpi) => ({
                            title: kpi.title,
                            value: kpi.value,
                            change: kpi.change,
                            trendData: kpi.trendData,
                            changeType: kpi.changeType,
                        })),
                    }),
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch KPI insights");
                }

                const payload = (await response.json()) as {
                    insights?: Record<string, KpiInsight>;
                    source?: "ai" | "fallback";
                };

                const mappedInsights: Record<string, KpiInsight> = {};
                allKpis.forEach((kpi) => {
                    mappedInsights[kpi.title] = payload.insights?.[kpi.title] ?? buildLocalFallbackInsight(kpi);
                });

                setKpiInsights(mappedInsights);
                setInsightSource(payload.source ?? "fallback");
            } catch {
                const fallback: Record<string, KpiInsight> = {};
                allKpis.forEach((kpi) => {
                    fallback[kpi.title] = buildLocalFallbackInsight(kpi);
                });

                setKpiInsights(fallback);
                setInsightSource("fallback");
            }
        };

        fetchKpiInsights();

        return () => controller.abort();
    }, [mounted, startDate, endDate, primaryKpis, extendedKpis]);

    useEffect(() => {
        if (!toastMessage) return;
        const timeout = setTimeout(() => setToastMessage(null), 2600);
        return () => clearTimeout(timeout);
    }, [toastMessage]);

    useEffect(() => {
        const savedVisibility = localStorage.getItem("iris_stats_mascot_visible");
        if (savedVisibility === "false") {
            setIsIrisVisible(false);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("iris_stats_mascot_visible", String(isIrisVisible));
    }, [isIrisVisible]);

    const onStartDateChange = (value: string) => {
        setSelectedRange("custom");
        setStartDate(value);
        if (value > endDate) {
            setEndDate(value);
        }
    };

    const onEndDateChange = (value: string) => {
        setSelectedRange("custom");
        setEndDate(value);
        if (value < startDate) {
            setStartDate(value);
        }
    };

    if (!mounted) return null;

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-background selection:bg-primary/30">
            {/* Decorative Background Elements */}
            <div className="pointer-events-none absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-primary/8 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-500/8 blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[60%] w-[60%] rounded-full bg-primary/3 blur-[140px]" />
            </div>

            <div className="relative z-10 mx-auto max-w-[1600px] space-y-12 px-4 py-8 text-foreground md:px-8 lg:py-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out">
                {/* Page Header */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-primary shadow-sm backdrop-blur-md">
                        <BarChart className="h-3.5 w-3.5" />
                        Portfolio Analytics
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Statistics</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Detailed insights into your property performance and portfolio health.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="group/iris-toggle relative">
                        <button
                            type="button"
                            onClick={() => setIsIrisVisible((prev) => !prev)}
                            className={cn(
                                "inline-flex items-center gap-2.5 rounded-full border px-5 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-sm transition-all hover:scale-105 active:scale-95",
                                isIrisVisible
                                    ? "border-primary/35 bg-card/90 text-primary hover:border-primary/45"
                                    : "border-white/10 bg-card/80 text-muted-foreground hover:bg-card hover:text-foreground"
                            )}
                            aria-pressed={!isIrisVisible}
                            aria-label={isIrisVisible ? "Hide iRis assistant" : "Show iRis assistant"}
                            aria-describedby="iris-toggle-tooltip"
                        >
                            {isIrisVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            {isIrisVisible ? "Hide iRis" : "Show iRis"}
                        </button>
                        <div
                            id="iris-toggle-tooltip"
                            role="tooltip"
                            className="pointer-events-none absolute left-1/2 top-[-0.85rem] z-20 w-max max-w-[17rem] -translate-x-1/2 -translate-y-full rounded-xl border border-white/10 bg-card/95 px-3 py-2 text-[10px] font-bold tracking-wide text-foreground opacity-0 shadow-xl backdrop-blur-xl transition-all duration-200 group-hover/iris-toggle:opacity-100 group-hover/iris-toggle:translate-y-[-2.75rem] group-focus-within/iris-toggle:opacity-100 group-focus-within/iris-toggle:translate-y-[-2.75rem]"
                        >
                            Toggle iRis mascot visibility on this page.
                            <div className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b border-white/10 bg-card/95" />
                        </div>
                    </div>
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:scale-105 hover:bg-primary/90 active:scale-95"
                    >
                        <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Performance Control Bar */}
            <section className="relative z-0 w-full rounded-[2.5rem] border border-white/10 bg-surface-1 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-indigo-500/20 bg-indigo-500/12 text-indigo-300">
                            <BarChart className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground">
                                How You&apos;re Doing
                            </h2>
                            <p className="text-sm font-medium text-muted-foreground/80">
                                Simplified for easy reading
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {statsLoading && (
                            <div className="relative overflow-hidden rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-blue-400 shadow-sm">
                                <span className="absolute inset-0 -translate-x-[100%] animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                Syncing...
                            </div>
                        )}
                        {statsError && (
                            <div className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-red-400">
                                {statsError}
                            </div>
                        )}
                        <button
                            onClick={() => setShowMoreKpis(!showMoreKpis)}
                            className={cn(
                                "flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10",
                                showMoreKpis
                                    ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]"
                                    : "border-white/10 bg-card/80 text-muted-foreground hover:border-primary/40 hover:bg-card hover:text-foreground"
                            )}
                        >
                            {showMoreKpis ? "Less Details" : "More Metrics"}
                            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", showMoreKpis && "rotate-180")} />
                        </button>
                    </div>
                </div>

                <div className="mt-12 space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {statsLoading ? (
                            Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
                        ) : (
                            primaryKpis.map((kpi) => (
                                <KpiCard
                                    key={kpi.title}
                                    title={kpi.title}
                                    simplifiedTitle={kpi.simplifiedTitle}
                                    value={kpi.value}
                                    change={kpi.change}
                                    simplifiedChange={kpi.simplifiedChange}
                                    changeType={kpi.changeType}
                                            iconColor={kpi.iconColor}
                                            trendlineProperties={kpi.trendlineProperties}
                                            data={kpi.trendData}
                                        />
                            ))
                        )}
                    </div>

                    {/* Expandable Stats Grid */}
                    <div
                        className={cn(
                            "grid transition-all duration-500 ease-in-out",
                            showMoreKpis ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        )}
                    >
                        <div className={cn("min-h-0", showMoreKpis ? "overflow-visible" : "overflow-hidden")}>
                            <div className={cn(
                                "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-transform duration-500 pt-4",
                                showMoreKpis ? "translate-y-0" : "-translate-y-4"
                            )}>
                                {statsLoading ? (
                                    Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
                                ) : (
                                    extendedKpis.map((kpi) => (
                                        <KpiCard
                                            key={kpi.title}
                                            title={kpi.title}
                                            simplifiedTitle={kpi.simplifiedTitle}
                                            value={kpi.value}
                                            change={kpi.change}
                                            simplifiedChange={kpi.simplifiedChange}
                                            changeType={kpi.changeType}
                                            iconColor={kpi.iconColor}
                                            trendlineProperties={kpi.trendlineProperties}
                                            data={kpi.trendData}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* Main Content Grid */}
            <section className="relative z-0 w-full rounded-[2.5rem] border border-white/10 bg-surface-1 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
                <div className="mb-10 flex flex-wrap items-center justify-between gap-4 px-2">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-emerald-500/20 bg-emerald-500/12 text-emerald-300">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground">Financial Intelligence</h2>
                            <p className="text-sm font-medium text-muted-foreground/80">Revenue streams, expenses, and operational health overview.</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    {/* Chart Section */}
                    <div className="h-[480px]">
                        {statsLoading ? (
                            <ChartSkeleton />
                        ) : (
                            <FinancialPerformanceChart dataByWindow={financialChart} />
                        )}
                    </div>
                </div>
            </section>

            {/* iRis AI Agent */}
            <IrisAIAgent 
                stats={{
                    primaryKpis,
                    extendedKpis,
                    operationalSnapshot,
                    financialChart
                }}
                isVisible={isIrisVisible}
                onVisibilityChange={setIsIrisVisible}
                showVisibilityToggle={false}
                landlordFirstName={landlordFirstName}
            />

            {/* Export History */}
            <section className="relative z-0 w-full rounded-[2.5rem] border border-white/10 bg-surface-1 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
                <div className="mb-6 flex items-center gap-4 px-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-amber-500/20 bg-amber-500/12 text-amber-300">
                        <History className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-foreground">Export History</h2>
                        <p className="text-sm font-medium text-muted-foreground/80">Recently generated reports and downloads.</p>
                    </div>
                </div>
                {exportHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-white/10 bg-card/70 py-12 text-muted-foreground/40">
                        <FileText className="h-8 w-8 mb-3" />
                        <p className="text-[9px] font-black uppercase tracking-widest">No reports exported yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {exportHistory.slice(0, 5).map((item) => (
                            <div key={item.id} className="flex flex-col gap-2 rounded-[1.75rem] border border-white/10 bg-surface-2 p-4 transition-all hover:bg-surface-3 hover:ring-1 hover:ring-primary/20">
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "font-black text-[9px] tracking-[0.2em] uppercase px-2.5 py-1 rounded-full border",
                                        item.format.toLowerCase() === 'pdf'
                                            ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                                            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                    )}>
                                        {item.format}
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground/60">{new Date(item.generatedAt).toLocaleDateString()}</span>
                                </div>
                                <span className="mt-1 truncate text-xs font-bold text-foreground">{item.range}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {isExportModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Close export modal"
                        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
                        onClick={() => setIsExportModalOpen(false)}
                    />
                    <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-card shadow-[0_30px_60px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-card/95 px-8 py-6 backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <Download className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-foreground">Export Report</h2>
                                    <p className="text-sm font-medium text-muted-foreground/80">Generate a downloadable statistics report.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsExportModalOpen(false)}
                                className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-card/70 text-muted-foreground transition-all hover:bg-card hover:text-foreground hover:rotate-90 active:scale-95"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="p-8 flex flex-col gap-8">
                            {/* Report Period Section */}
                            <div className="flex flex-col gap-4">
                                <label className="flex items-center gap-3 text-sm font-black text-foreground">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[10px] font-black text-primary">1</div>
                                    Select Report Period
                                </label>
                                <div className="pl-10 flex flex-col gap-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {RANGE_OPTIONS.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => applyPresetRange(option)}
                                                className={cn(
                                                    "px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-[0.1em] transition-all duration-200 border",
                                                    selectedRange === option.id
                                                        ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]"
                                                        : "border-white/10 bg-card/70 text-muted-foreground hover:bg-card hover:text-foreground"
                                                )}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 flex flex-col gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Start</span>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(event) => onStartDateChange(event.target.value)}
                                                className="w-full rounded-2xl border border-white/10 bg-card/70 px-4 py-3 text-sm font-medium text-foreground transition-all focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 hover:bg-card"
                                                aria-label="Report start date"
                                            />
                                        </div>
                                        <div className="pt-7 text-muted-foreground/40 font-black">–</div>
                                        <div className="flex-1 flex flex-col gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">End</span>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(event) => onEndDateChange(event.target.value)}
                                                className="w-full rounded-2xl border border-white/10 bg-card/70 px-4 py-3 text-sm font-medium text-foreground transition-all focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 hover:bg-card"
                                                aria-label="Report end date"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Export Format Section */}
                            <div className="flex flex-col gap-4">
                                <label className="flex items-center gap-3 text-sm font-black text-foreground">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[10px] font-black text-primary">2</div>
                                    Select Format
                                </label>
                                <div className="pl-10 grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setExportFormat("pdf")}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-3 p-5 rounded-[1.75rem] border-2 transition-all duration-200",
                                            exportFormat === "pdf"
                                                ? "border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                                                : "border-white/10 bg-card/70 text-muted-foreground hover:bg-card hover:text-foreground"
                                        )}
                                    >
                                        <FileText className="h-8 w-8" />
                                        <span className="text-xs font-black uppercase tracking-[0.15em]">PDF</span>
                                    </button>
                                    <button
                                        onClick={() => setExportFormat("csv")}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-3 p-5 rounded-[1.75rem] border-2 transition-all duration-200",
                                            exportFormat === "csv"
                                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                                                : "border-white/10 bg-card/70 text-muted-foreground hover:bg-card hover:text-foreground"
                                        )}
                                    >
                                        <Download className="h-8 w-8" />
                                        <span className="text-xs font-black uppercase tracking-[0.15em]">CSV</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-white/10 bg-card/95 px-8 py-6 backdrop-blur-xl">
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                className="rounded-2xl border border-white/10 bg-card/70 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 transition-all hover:bg-card hover:text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (exportFormat === "pdf") handleExportPdf();
                                    else handleExportCsv();
                                    setIsExportModalOpen(false);
                                }}
                                className="group rounded-2xl bg-primary px-6 py-3 text-sm font-black uppercase tracking-tight text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-95"
                            >
                                Generate & Download
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-500/25 bg-emerald-500/12 px-5 py-3.5 text-sm font-black text-emerald-300 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300">
                    {toastMessage}
                </div>
            )}
            </div>
        </div>
    );
}
