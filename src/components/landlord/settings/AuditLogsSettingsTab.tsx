"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
    Search,
    Download,
    RefreshCw,
    CreditCard,
    Shield,
    SlidersHorizontal,
    Building2,
    Clock,
    Check,
    ChevronRight,
    ChevronLeft,
    FileText,
    Loader2,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { useLanguageContext } from "@/context/LanguageContext";
import { SettingsButton, SettingsCard, SettingsNotice, settingsInputClass } from "@/components/settings/settings-ui";
import { describeAuditEvent } from "@/lib/audit/audit-display";

export interface AuditLogItem {
    id: string;
    userId: string;
    userRole: string;
    action: string;
    category: "billing" | "security" | "settings" | "properties" | "maintenance" | "general";
    title: string;
    description: string;
    severity: "info" | "warning" | "critical";
    targetId: string | null;
    targetType: string | null;
    metadata: Record<string, any>;
    createdAt: string;
    device?: string;
}

interface AuditStats {
    total: number;
    billingCount: number;
    securityCount: number;
    settingsCount: number;
    propertiesCount: number;
}

const PAGE_SIZE = 8;

const FILTERS = ["all", "billing", "security", "settings", "properties"] as const;

// Plain-language names for each kind of activity (translated where shown).
const CATEGORY_LABELS: Record<string, string> = {
    all: "Everything",
    billing: "Payments and bills",
    security: "Sign-in and security",
    settings: "Settings changes",
    properties: "Properties and rooms",
    maintenance: "Repairs",
    general: "Other",
};

const CATEGORY_STYLES: Record<string, { icon: LucideIcon; tile: string }> = {
    billing: { icon: CreditCard, tile: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200" },
    security: { icon: Shield, tile: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200" },
    settings: { icon: SlidersHorizontal, tile: "bg-primary/25 text-foreground dark:bg-primary/20" },
    properties: { icon: Building2, tile: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200" },
};
const DEFAULT_CATEGORY_STYLE = { icon: Clock, tile: "bg-muted text-foreground" };

export function AuditLogsSettingsTab() {
    const { t, locale } = useLanguageContext();
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [stats, setStats] = useState<AuditStats>({
        total: 0,
        billingCount: 0,
        securityCount: 0,
        settingsCount: 0,
        propertiesCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [inspectingLog, setInspectingLog] = useState<AuditLogItem | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    // Fetch Logs
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCategory !== "all") params.set("category", selectedCategory);
            if (selectedSeverity !== "all") params.set("severity", selectedSeverity);
            if (searchQuery.trim()) params.set("search", searchQuery.trim());

            const res = await fetch(`/api/audit-logs?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to load audit logs");
            const data = await res.json();
            setLogs(data.logs || []);
            if (data.stats) setStats(data.stats);
        } catch (err: any) {
            console.error("Error loading audit logs:", err);
            toast.error(t("Unable to load activity logs."));
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, selectedSeverity, searchQuery, t]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Reset pagination on filter or search change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, selectedSeverity, searchQuery]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return logs.slice(start, start + PAGE_SIZE);
    }, [logs, currentPage]);

    // Handle CSV Export
    const handleExportCsv = async () => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams();
            if (selectedCategory !== "all") params.set("category", selectedCategory);
            if (selectedSeverity !== "all") params.set("severity", selectedSeverity);
            if (searchQuery.trim()) params.set("search", searchQuery.trim());
            params.set("export", "csv");

            const res = await fetch(`/api/audit-logs?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to export audit logs");
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `ireside-audit-log-${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
            toast.success(t("Your activity list was downloaded."));
        } catch (err: any) {
            console.error("Export error:", err);
            toast.error(t("We could not download your activity list. Please try again."));
        } finally {
            setIsExporting(false);
        }
    };

    const categoryLabel = (category: string) => t(CATEGORY_LABELS[category] ?? CATEGORY_LABELS.general);
    const isFiltered = selectedCategory !== "all" || searchQuery.trim().length > 0;
    const pageStart = (currentPage - 1) * PAGE_SIZE + 1;
    const pageEnd = Math.min(currentPage * PAGE_SIZE, logs.length);

    const inspectedText = inspectingLog ? describeAuditEvent(inspectingLog, t) : null;
    const inspectedRows = inspectingLog
        ? [
              { label: t("When"), value: new Date(inspectingLog.createdAt).toLocaleString(locale, { dateStyle: "long", timeStyle: "short" }) },
              { label: t("Kind of activity"), value: categoryLabel(inspectingLog.category) },
              ...(inspectingLog.device ? [{ label: t("Device"), value: inspectingLog.device }] : []),
          ]
        : [];

    return (
        <>
            <SettingsNotice tone="info" title={t("Your private details stay private")}>
                {t("This list only shows what was done and when. Passwords, sign-in codes, private messages and bank details are never saved here.")}
            </SettingsNotice>

            <SettingsCard title={t("Find something")} description={t("Search, or pick what kind of activity to show.")}>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="activity-search" className="block text-lg font-bold text-foreground">
                            {t("Search")}
                        </label>
                        <p id="activity-search-help" className="text-base text-muted-foreground leading-snug">
                            {t("Type a word, a tenant's name, or a bill number.")}
                        </p>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                            <input
                                id="activity-search"
                                aria-describedby="activity-search-help"
                                type="search"
                                maxLength={60}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={settingsInputClass(false, "pl-12")}
                            />
                        </div>
                    </div>

                    <fieldset className="space-y-3">
                        <legend className="text-lg font-bold text-foreground">{t("Show")}</legend>
                        <div className="flex flex-wrap gap-3">
                            {FILTERS.map((cat) => {
                                const selected = selectedCategory === cat;
                                return (
                                    <label
                                        key={cat}
                                        className={cn(
                                            "inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border-2 px-4 py-2 text-base font-bold transition-colors",
                                            "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/50",
                                            selected ? "border-foreground/70 bg-primary/20 text-foreground" : "border-foreground/20 bg-card text-foreground hover:border-foreground/45",
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="activity-filter"
                                            value={cat}
                                            checked={selected}
                                            onChange={() => setSelectedCategory(cat)}
                                            className="sr-only"
                                        />
                                        {selected && <Check className="size-5 shrink-0" strokeWidth={3} aria-hidden />}
                                        {categoryLabel(cat)}
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>
                </div>
            </SettingsCard>

            <SettingsCard
                title={t("What happened")}
                description={t("Newest first.")}
                headerExtra={
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <SettingsButton variant="secondary" icon={RefreshCw} onClick={() => fetchLogs()} disabled={loading}>
                            {t("Check for new activity")}
                        </SettingsButton>
                        <SettingsButton
                            variant="secondary"
                            icon={Download}
                            onClick={handleExportCsv}
                            loading={isExporting}
                            disabled={logs.length === 0}
                        >
                            {isExporting ? t("Downloading…") : t("Download a copy")}
                        </SettingsButton>
                    </div>
                }
            >
                {loading ? (
                    <p role="status" className="flex items-center gap-3 py-10 text-lg font-semibold text-foreground">
                        <Loader2 className="size-6 shrink-0 motion-safe:animate-spin" aria-hidden />
                        {t("Loading your activity…")}
                    </p>
                ) : logs.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-foreground/20 p-8 text-center">
                        <p className="text-lg font-bold text-foreground">{isFiltered ? t("Nothing matches your search") : t("Nothing here yet")}</p>
                        <p className="mt-1 text-base text-muted-foreground">
                            {isFiltered
                                ? t("Try another word, or choose Everything above.")
                                : t("Things you do in iReside, like changing settings or sending bills, will show up here.")}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <ul className="space-y-3">
                            {paginatedLogs.map((log) => {
                                const style = CATEGORY_STYLES[log.category] ?? DEFAULT_CATEGORY_STYLE;
                                const Icon = style.icon;
                                const shown = describeAuditEvent(log, t);
                                return (
                                    <li key={log.id} className="flex flex-col gap-4 rounded-2xl border-2 border-foreground/10 p-4 sm:flex-row sm:items-start">
                                        <div className="flex min-w-0 flex-1 items-start gap-4">
                                            <span aria-hidden className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", style.tile)}>
                                                <Icon className="size-6" />
                                            </span>
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <p className="text-lg font-bold text-foreground break-words">{shown.title}</p>
                                                {shown.description && <p className="text-base text-muted-foreground leading-snug break-words">{shown.description}</p>}
                                                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-base text-foreground/80">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Clock className="size-4 shrink-0" aria-hidden />
                                                        <ClientOnlyDate date={log.createdAt} format={{ month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }} />
                                                    </span>
                                                    <span className="font-semibold">{categoryLabel(log.category)}</span>
                                                    {log.severity !== "info" && (
                                                        <span className="rounded-lg bg-amber-100 px-2 py-0.5 font-bold text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
                                                            {t("Important")}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <SettingsButton variant="secondary" icon={FileText} onClick={() => setInspectingLog(log)} className="shrink-0">
                                            {t("See details")}
                                        </SettingsButton>
                                    </li>
                                );
                            })}
                        </ul>

                        {logs.length > PAGE_SIZE && (
                            <nav aria-label={t("Pages")} className="flex flex-col gap-4 border-t-2 border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-base font-semibold text-foreground" aria-live="polite">
                                    {t("Showing {start}–{end} of {total}", { start: pageStart, end: pageEnd, total: logs.length })}
                                    <span className="ml-2 text-muted-foreground">
                                        ({t("Page {page} of {pages}", { page: currentPage, pages: totalPages })})
                                    </span>
                                </p>
                                <div className="flex gap-3">
                                    <SettingsButton
                                        variant="secondary"
                                        icon={ChevronLeft}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex-1 sm:flex-none"
                                    >
                                        {t("Previous page")}
                                    </SettingsButton>
                                    <SettingsButton
                                        variant="secondary"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex-1 flex-row-reverse sm:flex-none"
                                        icon={ChevronRight}
                                    >
                                        {t("Next page")}
                                    </SettingsButton>
                                </div>
                            </nav>
                        )}
                    </div>
                )}
            </SettingsCard>

            <Dialog.Root open={inspectingLog !== null} onOpenChange={(open) => { if (!open) setInspectingLog(null); }}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-[200] bg-black/60" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-[201] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-2 border-foreground/15 bg-card p-6 shadow-2xl focus:outline-none sm:p-8">
                        {inspectingLog && inspectedText && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Dialog.Title className="text-2xl font-bold text-foreground break-words">{inspectedText.title}</Dialog.Title>
                                    <Dialog.Description className="text-lg text-muted-foreground leading-relaxed break-words">
                                        {inspectedText.description || t("Activity details")}
                                    </Dialog.Description>
                                </div>

                                <dl className="divide-y-2 divide-border rounded-2xl border-2 border-foreground/10">
                                    {inspectedRows.map((row) => (
                                        <div key={row.label} className="flex flex-col gap-1 p-4 sm:flex-row sm:justify-between sm:gap-4">
                                            <dt className="text-base text-muted-foreground">{row.label}</dt>
                                            <dd className="text-base font-bold text-foreground sm:text-right break-words">{row.value}</dd>
                                        </div>
                                    ))}
                                </dl>

                                <details className="group rounded-2xl border-2 border-foreground/10">
                                    <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-2xl px-4 py-3 text-base font-bold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 [&::-webkit-details-marker]:hidden">
                                        <ChevronRight className="size-5 shrink-0 transition-transform group-open:rotate-90" aria-hidden />
                                        {t("Technical details (for support)")}
                                    </summary>
                                    <div className="space-y-3 border-t-2 border-border p-4 text-base">
                                        <p className="text-foreground break-all">
                                            <span className="text-muted-foreground">{t("Reference")}: </span>
                                            <span className="font-mono">{inspectingLog.id}</span>
                                        </p>
                                        <p className="text-foreground break-all">
                                            <span className="text-muted-foreground">{t("Action code")}: </span>
                                            <span className="font-mono">{inspectingLog.action}</span>
                                        </p>
                                        <pre className="max-h-48 overflow-auto rounded-xl bg-muted p-3 font-mono text-sm text-foreground">
                                            {JSON.stringify(inspectingLog.metadata, null, 2)}
                                        </pre>
                                    </div>
                                </details>

                                <SettingsButton variant="primary" size="lg" className="w-full" onClick={() => setInspectingLog(null)}>
                                    {t("Close")}
                                </SettingsButton>
                            </div>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
}
