"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    ArrowUpRight,
    Banknote,
    Building2,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    CreditCard,
    Download,
    FileText,
    History,
    Landmark,
    Search,
    Shield,
    SlidersHorizontal,
    Smartphone,
    Wrench,
    X,
    type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLanguageContext } from "@/context/LanguageContext";
import { useProperty } from "@/context/PropertyContext";
import type { InvoiceListItem } from "@/lib/billing/server";
import { formatPhpCurrency } from "@/lib/billing/utils";
import { describeInvoice, getInvoiceAttentionGroup } from "@/lib/billing/invoice-plain-status";
import { describeAuditEvent } from "@/lib/audit/audit-display";
import type { AuditLogItem } from "@/app/api/audit-logs/route";

export type HistoryTabId = "payments" | "actions";

interface LandlordHistoryPanelProps {
    mode?: "drawer" | "page";
    initialTab?: HistoryTabId;
    onTabChange?: (tab: HistoryTabId) => void;
    onNavigate?: () => void;
}

type PaymentStatusFilter = "all" | "paid" | "attention" | "unpaid";

const AUDIT_CATEGORY_FILTERS = [
    { id: "all", label: "All" },
    { id: "billing", label: "Payments & Bills" },
    { id: "properties", label: "Rooms & Buildings" },
    { id: "maintenance", label: "Repairs" },
    { id: "security", label: "Account Security" },
] as const;

const AUDIT_CATEGORY_META: Record<string, { icon: LucideIcon; tile: string; label: string }> = {
    billing: {
        icon: CreditCard,
        tile: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        label: "Payments & Bills",
    },
    properties: {
        icon: Building2,
        tile: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
        label: "Rooms & Buildings",
    },
    maintenance: {
        icon: Wrench,
        tile: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        label: "Repairs",
    },
    security: {
        icon: Shield,
        tile: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
        label: "Account Security",
    },
    settings: {
        icon: SlidersHorizontal,
        tile: "bg-primary/15 text-primary",
        label: "Settings",
    },
    general: {
        icon: Clock,
        tile: "bg-muted text-foreground",
        label: "General",
    },
};

const METHOD_META: Record<string, { label: string; icon: LucideIcon }> = {
    cash: { label: "Cash", icon: Banknote },
    gcash: { label: "GCash", icon: Smartphone },
    bank_transfer: { label: "Bank Transfer", icon: Landmark },
};

function getPaymentStatusBadge(invoice: InvoiceListItem, t: (key: string) => string) {
    const info = describeInvoice(invoice, t);
    switch (info.tone) {
        case "success":
            return {
                label: info.tag,
                icon: CheckCircle2,
                className: "bg-emerald-500/15 text-emerald-800 border-emerald-500/30 dark:text-emerald-300",
            };
        case "danger":
            return {
                label: info.tag,
                icon: AlertTriangle,
                className: "bg-rose-500/15 text-rose-800 border-rose-500/30 dark:text-rose-300",
            };
        case "warning":
            return {
                label: info.tag,
                icon: Clock,
                className: "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-300",
            };
        default:
            return {
                label: info.tag,
                icon: FileText,
                className: "bg-muted text-foreground border-border",
            };
    }
}

export function LandlordHistoryPanel({
    mode = "page",
    initialTab = "payments",
    onTabChange,
    onNavigate,
}: LandlordHistoryPanelProps) {
    const { t, locale } = useLanguageContext();
    const { selectedPropertyId } = useProperty();

    const [activeTab, setActiveTab] = useState<HistoryTabId>(initialTab);
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const handleTabSwitch = (next: HistoryTabId) => {
        setActiveTab(next);
        onTabChange?.(next);
    };

    const pageSize = mode === "drawer" ? 6 : 8;

    // ─── Payment History State ────────────────────────────────────────────
    const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(true);
    const [paymentsError, setPaymentsError] = useState<string | null>(null);
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>("all");
    const [paymentSearch, setPaymentSearch] = useState("");
    const [paymentPage, setPaymentPage] = useState(1);

    const fetchPayments = useCallback(async () => {
        setPaymentsLoading(true);
        setPaymentsError(null);
        try {
            const params = new URLSearchParams();
            if (selectedPropertyId && selectedPropertyId !== "all") {
                params.set("propertyId", selectedPropertyId);
            }
            const query = params.toString();
            const res = await fetch(query ? `/api/landlord/invoices?${query}` : "/api/landlord/invoices");
            if (!res.ok) throw new Error("Failed to load payment history");
            const data = await res.json();
            setInvoices(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading payment history:", err);
            setPaymentsError(t("Unable to load payment history. Please try again."));
        } finally {
            setPaymentsLoading(false);
        }
    }, [selectedPropertyId, t]);

    useEffect(() => {
        if (activeTab === "payments") {
            void fetchPayments();
        }
    }, [activeTab, fetchPayments]);

    useEffect(() => {
        setPaymentPage(1);
    }, [paymentStatusFilter, paymentSearch]);

    const paymentMetrics = useMemo(() => {
        let totalCollected = 0;
        let paidCount = 0;
        let attentionCount = 0;

        for (const inv of invoices) {
            const group = getInvoiceAttentionGroup(inv);
            if (group === "paid") {
                totalCollected += inv.amount;
                paidCount += 1;
            } else if (group === "attention") {
                attentionCount += 1;
            }
        }
        return { totalCollected, paidCount, attentionCount };
    }, [invoices]);

    const filteredPayments = useMemo(() => {
        const q = paymentSearch.trim().toLowerCase();
        return invoices.filter((inv) => {
            const group = getInvoiceAttentionGroup(inv);
            if (paymentStatusFilter === "paid" && group !== "paid") return false;
            if (paymentStatusFilter === "attention" && group !== "attention") return false;
            if (paymentStatusFilter === "unpaid" && group !== "waiting" && group !== "late") return false;
            if (q) {
                const haystack = [
                    inv.tenant,
                    inv.unit,
                    inv.property,
                    inv.invoiceNumber,
                    inv.referenceNumber ?? "",
                    inv.type,
                ]
                    .join(" ")
                    .toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
    }, [invoices, paymentStatusFilter, paymentSearch]);

    const paymentTotalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
    const safePaymentPage = Math.min(paymentPage, paymentTotalPages);
    const paginatedPayments = useMemo(() => {
        const start = (safePaymentPage - 1) * pageSize;
        return filteredPayments.slice(start, start + pageSize);
    }, [filteredPayments, safePaymentPage, pageSize]);

    const paymentRangeStart = filteredPayments.length === 0 ? 0 : (safePaymentPage - 1) * pageSize + 1;
    const paymentRangeEnd = Math.min(safePaymentPage * pageSize, filteredPayments.length);

    const handleExportPaymentsCsv = () => {
        if (filteredPayments.length === 0) {
            toast.info(t("No payment records to download."));
            return;
        }
        const headers = ["Bill Number", "Tenant", "Property", "Unit", "Type", "Method", "Reference", "Status", "Due Date", "Amount (PHP)"];
        const rows = filteredPayments.map((inv) => {
            const statusInfo = describeInvoice(inv, t);
            return [
                inv.invoiceNumber,
                `"${(inv.tenant || "").replace(/"/g, '""')}"`,
                `"${(inv.property || "").replace(/"/g, '""')}"`,
                `"${(inv.unit || "").replace(/"/g, '""')}"`,
                `"${(inv.type || "").replace(/"/g, '""')}"`,
                inv.paymentMethod || "N/A",
                inv.referenceNumber || "",
                `"${statusInfo.tag.replace(/"/g, '""')}"`,
                inv.dueDate || "",
                inv.amount.toFixed(2),
            ].join(",");
        });
        const csv = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ireside-payment-history-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success(t("Payment list downloaded."));
    };

    // ─── Actions History (Audit Logs) State ───────────────────────────────
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [actionsLoading, setActionsLoading] = useState(true);
    const [actionsError, setActionsError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [actionSearch, setActionSearch] = useState("");
    const [actionPage, setActionPage] = useState(1);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [isExportingAudit, setIsExportingAudit] = useState(false);

    const fetchActions = useCallback(async () => {
        setActionsLoading(true);
        setActionsError(null);
        try {
            const params = new URLSearchParams();
            if (selectedCategory !== "all") params.set("category", selectedCategory);
            if (actionSearch.trim()) params.set("search", actionSearch.trim());
            params.set("limit", "100");

            const res = await fetch(`/api/audit-logs?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to load actions history");
            const data = await res.json();
            setLogs(Array.isArray(data.logs) ? data.logs : []);
        } catch (err) {
            console.error("Error loading actions history:", err);
            setActionsError(t("Unable to load your actions history. Please try again."));
        } finally {
            setActionsLoading(false);
        }
    }, [selectedCategory, actionSearch, t]);

    useEffect(() => {
        if (activeTab === "actions") {
            void fetchActions();
        }
    }, [activeTab, fetchActions]);

    useEffect(() => {
        setActionPage(1);
    }, [selectedCategory, actionSearch]);

    const actionTotalPages = Math.max(1, Math.ceil(logs.length / pageSize));
    const safeActionPage = Math.min(actionPage, actionTotalPages);
    const paginatedActions = useMemo(() => {
        const start = (safeActionPage - 1) * pageSize;
        return logs.slice(start, start + pageSize);
    }, [logs, safeActionPage, pageSize]);

    const actionRangeStart = logs.length === 0 ? 0 : (safeActionPage - 1) * pageSize + 1;
    const actionRangeEnd = Math.min(safeActionPage * pageSize, logs.length);

    const handleExportAuditCsv = async () => {
        setIsExportingAudit(true);
        try {
            const params = new URLSearchParams();
            if (selectedCategory !== "all") params.set("category", selectedCategory);
            if (actionSearch.trim()) params.set("search", actionSearch.trim());
            params.set("export", "csv");

            const res = await fetch(`/api/audit-logs?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to export audit logs");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `ireside-actions-history-${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success(t("Actions list downloaded."));
        } catch (err) {
            console.error("Audit export error:", err);
            toast.error(t("Could not download your actions list. Please try again."));
        } finally {
            setIsExportingAudit(false);
        }
    };

    return (
        <div className="flex flex-col gap-5">
            {/* Single Clean Tab Bar + Download */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div
                    role="tablist"
                    aria-label={t("History sections")}
                    className="grid grid-cols-2 sm:inline-flex rounded-2xl neumorphic-inset p-1.5 gap-1"
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === "payments"}
                        onClick={() => handleTabSwitch("payments")}
                        className={cn(
                            "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer min-h-[44px]",
                            activeTab === "payments"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <CreditCard className="size-4 shrink-0" />
                        <span>{t("Payment History")}</span>
                        {paymentMetrics.attentionCount > 0 && (
                            <span className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                                activeTab === "payments"
                                    ? "bg-white/20 text-white"
                                    : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                            )}>
                                {paymentMetrics.attentionCount}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === "actions"}
                        onClick={() => handleTabSwitch("actions")}
                        className={cn(
                            "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer min-h-[44px]",
                            activeTab === "actions"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <History className="size-4 shrink-0" />
                        <span>{t("My Actions")}</span>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => (activeTab === "payments" ? handleExportPaymentsCsv() : void handleExportAuditCsv())}
                    disabled={activeTab === "actions" && isExportingAudit}
                    className="inline-flex items-center justify-center gap-2 rounded-xl neumorphic-extruded px-4 py-2.5 text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer min-h-[44px] disabled:opacity-50"
                >
                    <Download className="size-4" />
                    <span>{t("Download List")}</span>
                </button>
            </div>

            {/* ═══ TAB 1: PAYMENT HISTORY ═══ */}
            {activeTab === "payments" && (
                <div className="space-y-5">
                    {/* Single Unified Summary + Search/Filter Panel */}
                    <div className="rounded-2xl neumorphic-panel p-5 sm:p-6 space-y-5">
                        {/* Quiet 3-column summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-border/60">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground">{t("Total Collected")}</p>
                                <p className="mt-1 text-2xl font-bold text-primary tabular-nums">
                                    {formatPhpCurrency(paymentMetrics.totalCollected)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground">{t("Paid Bills")}</p>
                                <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                                    {paymentMetrics.paidCount}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground">{t("Needs Checking")}</p>
                                <p className={cn(
                                    "mt-1 text-2xl font-bold tabular-nums",
                                    paymentMetrics.attentionCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                                )}>
                                    {paymentMetrics.attentionCount}
                                </p>
                            </div>
                        </div>

                        {/* Search & Simple Status Chips */}
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    maxLength={60}
                                    value={paymentSearch}
                                    onChange={(e) => setPaymentSearch(e.target.value)}
                                    placeholder={t("Search by tenant name, room, or bill number...")}
                                    aria-label={t("Search by tenant name, room, or bill number...")}
                                    className="w-full rounded-xl neumorphic-inset bg-background py-2.5 pl-10 pr-10 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[44px]"
                                />
                                {paymentSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setPaymentSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                                        aria-label={t("Clear search")}
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {(
                                    [
                                        { id: "all", label: "All" },
                                        { id: "paid", label: "Paid" },
                                        { id: "attention", label: "Needs Checking" },
                                        { id: "unpaid", label: "Not Paid Yet" },
                                    ] as const
                                ).map((chip) => (
                                    <button
                                        key={chip.id}
                                        type="button"
                                        onClick={() => setPaymentStatusFilter(chip.id)}
                                        className={cn(
                                            "rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-pointer min-h-[40px]",
                                            paymentStatusFilter === chip.id
                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                : "bg-muted text-foreground/80 hover:bg-muted/80 hover:text-foreground"
                                        )}
                                    >
                                        {t(chip.label)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Payment List */}
                    {paymentsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                            ))}
                        </div>
                    ) : paymentsError ? (
                        <div className="rounded-2xl neumorphic-panel p-8 text-center space-y-4">
                            <AlertTriangle className="size-9 text-rose-500 mx-auto" />
                            <p className="text-base font-semibold text-foreground">{paymentsError}</p>
                            <button
                                type="button"
                                onClick={() => void fetchPayments()}
                                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground cursor-pointer min-h-[44px]"
                            >
                                {t("Try Again")}
                            </button>
                        </div>
                    ) : paginatedPayments.length === 0 ? (
                        <div className="rounded-2xl neumorphic-panel p-10 text-center space-y-3">
                            <CreditCard className="size-10 text-muted-foreground/40 mx-auto" />
                            <p className="text-base font-bold text-foreground">
                                {invoices.length === 0 ? t("No payment records yet") : t("No payments match your search")}
                            </p>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                {invoices.length === 0
                                    ? t("When you create rent bills or record payments from tenants, they will show up here.")
                                    : t("Try clearing your search or tapping \"All\" to see every bill.")}
                            </p>
                            {(paymentStatusFilter !== "all" || paymentSearch) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPaymentStatusFilter("all");
                                        setPaymentSearch("");
                                    }}
                                    className="mt-2 rounded-xl bg-muted px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted/80 cursor-pointer min-h-[44px]"
                                >
                                    {t("Show All Payments")}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-2xl neumorphic-panel divide-y divide-border/60 overflow-hidden">
                            {paginatedPayments.map((inv) => {
                                const badge = getPaymentStatusBadge(inv, t);
                                const StatusIcon = badge.icon;
                                const methodKey = (inv.paymentMethod || "").toLowerCase();
                                const methodInfo = METHOD_META[methodKey];
                                const MethodIcon = methodInfo?.icon ?? Banknote;

                                return (
                                    <Link
                                        key={inv.id}
                                        href={`/landlord/invoices?invoiceId=${inv.id}`}
                                        onClick={() => onNavigate?.()}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 hover:bg-muted/50 transition-colors group"
                                    >
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-base font-bold text-foreground">
                                                    {inv.tenant || t("Tenant")}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    • {inv.unit}{inv.property ? ` (${inv.property})` : ""}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2.5 flex-wrap text-sm text-muted-foreground">
                                                <span className="font-mono font-medium text-foreground/80">{inv.invoiceNumber}</span>
                                                {methodInfo && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                                                        <MethodIcon className="size-3.5" />
                                                        {t(methodInfo.label)}
                                                    </span>
                                                )}
                                                {inv.dueDate && (
                                                    <span>
                                                        • <ClientOnlyDate date={inv.dueDate} locale={locale} />
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                                            <span className="text-base sm:text-lg font-bold text-foreground tabular-nums text-right">
                                                {formatPhpCurrency(inv.amount)}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold whitespace-nowrap",
                                                    badge.className
                                                )}>
                                                    <StatusIcon className="size-3.5 shrink-0" />
                                                    <span>{badge.label}</span>
                                                </span>
                                                <ArrowUpRight className="size-4 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Senior-Friendly Pagination */}
                    {filteredPayments.length > pageSize && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                            <p className="text-sm text-muted-foreground tabular-nums">
                                {t("Showing {start}–{end} of {total}", {
                                    start: paymentRangeStart,
                                    end: paymentRangeEnd,
                                    total: filteredPayments.length,
                                })}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={safePaymentPage <= 1}
                                    onClick={() => setPaymentPage((p) => Math.max(1, p - 1))}
                                    className="inline-flex items-center gap-1.5 rounded-xl neumorphic-extruded px-4 py-2 text-sm font-bold text-foreground disabled:opacity-40 cursor-pointer min-h-[44px]"
                                >
                                    <ChevronLeft className="size-4" />
                                    {t("Previous")}
                                </button>
                                <button
                                    type="button"
                                    disabled={safePaymentPage >= paymentTotalPages}
                                    onClick={() => setPaymentPage((p) => Math.min(paymentTotalPages, p + 1))}
                                    className="inline-flex items-center gap-1.5 rounded-xl neumorphic-extruded px-4 py-2 text-sm font-bold text-foreground disabled:opacity-40 cursor-pointer min-h-[44px]"
                                >
                                    {t("Next")}
                                    <ChevronRight className="size-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ TAB 2: MY ACTIONS (AUDIT LOG) ═══ */}
            {activeTab === "actions" && (
                <div className="space-y-5">
                    {/* Search & Category Chips */}
                    <div className="rounded-2xl neumorphic-panel p-5 sm:p-6 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <input
                                type="text"
                                maxLength={60}
                                value={actionSearch}
                                onChange={(e) => setActionSearch(e.target.value)}
                                placeholder={t("Search what you did (e.g., payment, bill, repair)...")}
                                aria-label={t("Search what you did (e.g., payment, bill, repair)...")}
                                className="w-full rounded-xl neumorphic-inset bg-background py-2.5 pl-10 pr-10 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[44px]"
                            />
                            {actionSearch && (
                                <button
                                    type="button"
                                    onClick={() => setActionSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                                    aria-label={t("Clear search")}
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {AUDIT_CATEGORY_FILTERS.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={cn(
                                        "rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-pointer min-h-[40px]",
                                        selectedCategory === cat.id
                                            ? "bg-primary text-primary-foreground shadow-xs"
                                            : "bg-muted text-foreground/80 hover:bg-muted/80 hover:text-foreground"
                                    )}
                                >
                                    {t(cat.label)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Audit Log List */}
                    {actionsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                            ))}
                        </div>
                    ) : actionsError ? (
                        <div className="rounded-2xl neumorphic-panel p-8 text-center space-y-4">
                            <AlertTriangle className="size-9 text-rose-500 mx-auto" />
                            <p className="text-base font-semibold text-foreground">{actionsError}</p>
                            <button
                                type="button"
                                onClick={() => void fetchActions()}
                                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground cursor-pointer min-h-[44px]"
                            >
                                {t("Try Again")}
                            </button>
                        </div>
                    ) : paginatedActions.length === 0 ? (
                        <div className="rounded-2xl neumorphic-panel p-10 text-center space-y-3">
                            <History className="size-10 text-muted-foreground/40 mx-auto" />
                            <p className="text-base font-bold text-foreground">
                                {t("No actions recorded yet")}
                            </p>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                {t("Whenever you record a payment, send a bill, update a repair, or change your security settings, it is saved here.")}
                            </p>
                            {(selectedCategory !== "all" || actionSearch) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory("all");
                                        setActionSearch("");
                                    }}
                                    className="mt-2 rounded-xl bg-muted px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted/80 cursor-pointer min-h-[44px]"
                                >
                                    {t("Show All Actions")}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-2xl neumorphic-panel divide-y divide-border/60 overflow-hidden">
                            {paginatedActions.map((log) => {
                                const meta = AUDIT_CATEGORY_META[log.category] ?? AUDIT_CATEGORY_META.general;
                                const Icon = meta.icon;
                                const display = describeAuditEvent(
                                    {
                                        action: log.action,
                                        title: log.title,
                                        description: log.description,
                                        metadata: log.metadata,
                                    },
                                    t
                                );
                                const isExpanded = expandedLogId === log.id;

                                return (
                                    <div key={log.id} className="transition-colors hover:bg-muted/40">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                            aria-expanded={isExpanded}
                                            className="w-full flex items-start gap-3.5 p-4 sm:p-5 text-left cursor-pointer"
                                        >
                                            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl mt-0.5", meta.tile)}>
                                                <Icon className="size-5" />
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-base font-bold text-foreground">
                                                        {display.title}
                                                    </p>
                                                    <ChevronDown className={cn(
                                                        "size-4 text-muted-foreground shrink-0 transition-transform",
                                                        isExpanded && "rotate-180"
                                                    )} />
                                                </div>
                                                {display.description && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {display.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2.5 flex-wrap text-xs text-muted-foreground pt-1">
                                                    <span className="font-medium">
                                                        <ClientOnlyDate date={log.createdAt} locale={locale} />
                                                    </span>
                                                    {log.device && (
                                                        <span>• {log.device}</span>
                                                    )}
                                                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground/80">
                                                        {t(meta.label)}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="px-4 pb-4 pt-0 sm:px-5 sm:pb-5 pl-[4.25rem]">
                                                <div className="rounded-xl neumorphic-inset bg-muted/40 p-3.5 text-xs space-y-2">
                                                    {log.targetId && (
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-semibold text-muted-foreground">{t("Reference Number")}</span>
                                                            <span className="font-mono text-foreground truncate max-w-[240px]" title={log.targetId}>
                                                                {log.targetId}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="font-semibold text-muted-foreground">{t("Event Type")}</span>
                                                        <span className="font-mono text-foreground">{log.action}</span>
                                                    </div>
                                                    {log.metadata && Object.keys(log.metadata).filter((k) => k !== "device").length > 0 && (
                                                        <div className="pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                            {Object.entries(log.metadata)
                                                                .filter(([k]) => k !== "device")
                                                                .map(([k, v]) => (
                                                                    <div key={k} className="flex items-center justify-between gap-2 bg-card rounded-lg px-2.5 py-1.5 border border-border/50">
                                                                        <span className="text-muted-foreground truncate">{k}</span>
                                                                        <span className="font-mono text-foreground truncate max-w-[140px]" title={String(v)}>
                                                                            {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Senior-Friendly Pagination */}
                    {logs.length > pageSize && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                            <p className="text-sm text-muted-foreground tabular-nums">
                                {t("Showing {start}–{end} of {total}", {
                                    start: actionRangeStart,
                                    end: actionRangeEnd,
                                    total: logs.length,
                                })}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={safeActionPage <= 1}
                                    onClick={() => setActionPage((p) => Math.max(1, p - 1))}
                                    className="inline-flex items-center gap-1.5 rounded-xl neumorphic-extruded px-4 py-2 text-sm font-bold text-foreground disabled:opacity-40 cursor-pointer min-h-[44px]"
                                >
                                    <ChevronLeft className="size-4" />
                                    {t("Previous")}
                                </button>
                                <button
                                    type="button"
                                    disabled={safeActionPage >= actionTotalPages}
                                    onClick={() => setActionPage((p) => Math.min(actionTotalPages, p + 1))}
                                    className="inline-flex items-center gap-1.5 rounded-xl neumorphic-extruded px-4 py-2 text-sm font-bold text-foreground disabled:opacity-40 cursor-pointer min-h-[44px]"
                                >
                                    {t("Next")}
                                    <ChevronRight className="size-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
