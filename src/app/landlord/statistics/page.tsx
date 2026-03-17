"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Download, FileText, History, X } from "lucide-react";
import { jsPDF } from "jspdf";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/landlord/dashboard/KpiCard";
import { FinancialPerformanceChart, type FinancialChartWindowData } from "@/components/landlord/dashboard/FinancialPerformanceChart";
import { FeaturedPropertyCard } from "@/components/landlord/dashboard/FeaturedPropertyCard";

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
    featuredProperty: {
        propertyName: string;
        totalSales: string;
        totalViews: string;
        image: string;
        momGrowth: string;
        occupancyRate: string;
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
        labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
        earnings: [0, 0, 0, 0, 0],
        expenses: [0, 0, 0, 0, 0],
        netIncome: [0, 0, 0, 0, 0],
    },
    year: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        earnings: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        expenses: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        netIncome: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
};

const DEFAULT_FEATURED_PROPERTY: OverviewApiResponse["featuredProperty"] = {
    propertyName: "No Property Data Yet",
    totalSales: "₱0",
    totalViews: "0 inquiries",
    image: "/hero-images/apartment-03.png",
    momGrowth: "0.0%",
    occupancyRate: "0%",
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
    const [mounted, setMounted] = useState(false);
    const [showMoreKpis, setShowMoreKpis] = useState(false);
    const [simplifiedMode, setSimplifiedMode] = useState(true);
    const [selectedRange, setSelectedRange] = useState<RangeOption["id"]>("30d");
    const [startDate, setStartDate] = useState(formatIsoDate(shiftDays(-29)));
    const [endDate, setEndDate] = useState(formatIsoDate(shiftDays(0)));
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("pdf");
    const [exportHistory, setExportHistory] = useState<ExportAuditItem[]>([]);
    const [kpiInsights, setKpiInsights] = useState<Record<string, KpiInsight>>({});
    const [insightSource, setInsightSource] = useState<"ai" | "fallback" | null>(null);
    const [primaryKpis, setPrimaryKpis] = useState<KpiItem[]>(DEFAULT_PRIMARY_KPIS);
    const [extendedKpis, setExtendedKpis] = useState<KpiItem[]>(DEFAULT_EXTENDED_KPIS);
    const [financialChart, setFinancialChart] = useState<OverviewApiResponse["financialChart"]>(DEFAULT_FINANCIAL_CHART);
    const [featuredProperty, setFeaturedProperty] = useState<OverviewApiResponse["featuredProperty"]>(DEFAULT_FEATURED_PROPERTY);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);

    const reportStartDate = useMemo(() => new Date(`${startDate}T00:00:00`), [startDate]);
    const reportEndDate = useMemo(() => new Date(`${endDate}T23:59:59`), [endDate]);

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
                metric: simplifiedMode ? kpi.simplifiedTitle : kpi.title,
                value: kpi.value,
                change: simplifiedMode ? kpi.simplifiedChange : kpi.change,
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
                    mode: simplifiedMode ? "Simplified" : "Detailed",
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
                    mode: simplifiedMode ? "Simplified" : "Detailed",
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
        appendBlock(`View Mode: ${simplifiedMode ? "Simplified" : "Detailed"}`);
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
                const response = await fetch(`/api/landlord/statistics/overview?start=${startDate}&end=${endDate}`, {
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
                setFeaturedProperty(payload.featuredProperty ?? DEFAULT_FEATURED_PROPERTY);
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
    }, [mounted, startDate, endDate]);

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
        <div className="flex flex-col w-full bg-[#0a0a0a] text-white p-6 md:p-8 space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">Portfolio Statistics</h1>
                <p className="text-neutral-400 text-sm font-medium">Detailed insights into your property performance</p>
            </div>

            {/* Performance Overview Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[#111] p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-lg font-bold text-white tracking-tight">
                            {simplifiedMode ? "How You're Doing" : "Performance Overview"}
                        </h2>
                        {simplifiedMode && (
                            <p className="text-xs text-neutral-400">Simplified for easy reading</p>
                        )}
                    </div>
                    <div className="w-[1px] h-8 bg-white/10 mx-2 hidden sm:block"></div>
                    <button
                        onClick={() => setSimplifiedMode(!simplifiedMode)}
                        className={cn(
                            "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all",
                            !simplifiedMode
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-white/5 text-neutral-400 border border-white/5 hover:bg-white/10"
                        )}
                    >
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            !simplifiedMode ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"
                        )} />
                        {simplifiedMode ? "Show Detailed Analytics" : "Hide Detailed Analytics"}
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {statsLoading && (
                        <div className="text-[11px] px-2.5 py-1 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-300">
                            Syncing with database...
                        </div>
                    )}
                    {statsError && (
                        <div className="text-[11px] px-2.5 py-1 rounded-full border border-red-400/30 bg-red-500/10 text-red-300">
                            {statsError}
                        </div>
                    )}
                    <div className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-black/30 text-neutral-300">
                        {insightSource === "ai" ? "iRis AI Insights: Live" : "iRis Insights: Fallback"}
                    </div>
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-white/10 text-white bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {primaryKpis.map((kpi) => (
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
                        simplifiedMode={simplifiedMode}
                        aiInsight={kpiInsights[kpi.title]}
                    />
                ))}

            </div>

            {/* Expandable Stats Grid */}
            <div
                className={cn(
                    "grid transition-all duration-500 ease-in-out",
                    showMoreKpis ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"
                )}
            >
                <div className={cn("min-h-0", showMoreKpis ? "overflow-visible" : "overflow-hidden")}>
                    <div className={cn(
                        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-transform duration-500",
                        showMoreKpis ? "translate-y-0" : "-translate-y-4"
                    )}>
                        {extendedKpis.map((kpi) => (
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
                                simplifiedMode={simplifiedMode}
                                aiInsight={kpiInsights[kpi.title]}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-center -mt-2 mb-2">
                <button
                    onClick={() => setShowMoreKpis(!showMoreKpis)}
                    className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-all bg-[#0a0a0a] hover:bg-white/5 px-4 py-2 rounded-full border border-white/5 z-10 shadow-sm"
                >
                    {showMoreKpis ? "Show Less Statistics" : "View More Statistics"}
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", showMoreKpis && "rotate-180")} />
                </button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 h-[400px]">
                    <FinancialPerformanceChart simplifiedMode={simplifiedMode} dataByWindow={financialChart} />
                </div>

                {/* Featured Property Card */}
                <div className="lg:col-span-1 h-[400px]">
                    <FeaturedPropertyCard
                        propertyName={featuredProperty.propertyName}
                        totalSales={featuredProperty.totalSales}
                        totalViews={featuredProperty.totalViews}
                        image={featuredProperty.image}
                        momGrowth={featuredProperty.momGrowth}
                        occupancyRate={featuredProperty.occupancyRate}
                        className="h-full shadow-2xl"
                        simplifiedMode={simplifiedMode}
                    />
                </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#111] p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
                    <History className="h-4 w-4 text-neutral-400" />
                    Recent Report Exports
                </div>
                {exportHistory.length === 0 ? (
                    <p className="text-sm text-neutral-500 italic">No reports exported recently.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                        {exportHistory.slice(0, 5).map((item) => (
                            <div key={item.id} className="flex flex-col gap-1 text-xs bg-black/40 border border-white/5 rounded-lg px-3.5 py-3 hover:border-white/10 transition-colors">
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full",
                                        item.format.toLowerCase() === 'pdf' ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                                    )}>
                                        {item.format}
                                    </span>
                                    <span className="text-neutral-500 text-[10px]">{new Date(item.generatedAt).toLocaleDateString()}</span>
                                </div>
                                <span className="text-neutral-300 font-medium mt-1 truncate">{item.range}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isExportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Download className="h-5 w-5 text-emerald-400" />
                                Export Statistics Report
                            </h3>
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                className="text-neutral-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 flex flex-col gap-8">
                            {/* Report Period Section */}
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs">1</div>
                                    Select Report Period
                                </label>
                                <div className="pl-8 flex flex-col gap-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {RANGE_OPTIONS.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => applyPresetRange(option)}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border",
                                                    selectedRange === option.id
                                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-sm"
                                                        : "bg-white/5 border-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                                                )}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 flex flex-col gap-1.5">
                                            <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">Start Date</span>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(event) => onStartDateChange(event.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                                                aria-label="Report start date"
                                            />
                                        </div>
                                        <div className="pt-6">
                                            <span className="text-neutral-600">-</span>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-1.5">
                                            <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">End Date</span>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(event) => onEndDateChange(event.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
                                                aria-label="Report end date"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Export Format Section */}
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs">2</div>
                                    Select Format
                                </label>
                                <div className="pl-8 grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setExportFormat("pdf")}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
                                            exportFormat === "pdf"
                                                ? "border-blue-500/50 bg-blue-500/10 text-blue-300"
                                                : "border-white/5 bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-neutral-200"
                                        )}
                                    >
                                        <FileText className="h-8 w-8" />
                                        <span className="text-sm font-semibold">PDF Document</span>
                                    </button>
                                    <button
                                        onClick={() => setExportFormat("csv")}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
                                            exportFormat === "csv"
                                                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                                                : "border-white/5 bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-neutral-200"
                                        )}
                                    >
                                        <Download className="h-8 w-8" />
                                        <span className="text-sm font-semibold">CSV Spreadsheet</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-black/40 border-t border-white/5 flex justify-end gap-3">
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (exportFormat === "pdf") handleExportPdf();
                                    else handleExportCsv();
                                    setIsExportModalOpen(false);
                                }}
                                className="px-5 py-2 rounded-lg text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            >
                                Generate & Download
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toastMessage && (
                <div className="fixed bottom-6 right-6 px-4 py-3 rounded-lg border border-emerald-400/30 bg-emerald-500/15 text-emerald-100 text-sm font-semibold shadow-lg backdrop-blur-sm z-50">
                    {toastMessage}
                </div>
            )}
        </div >
    );
}
