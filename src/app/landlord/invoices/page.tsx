"use client";

/**
 * Finance Hub (landlord): rent bills, expenses, and unified financial ledger.
 *
 * Senior-Accessible & Design-System Aligned:
 * - Solid, high-contrast surfaces in both light and dark mode (no muddy frosted glass or AI-slop translucency).
 * - Person-First hierarchy: Displays Tenant Name & Room Unit prominently over raw invoice UUIDs.
 * - Cognitive Clarity: Plain-language explanations under financial totals (e.g., "Collected minus expenses").
 * - Actionable "Today's Action Required" banner with crisp high-contrast buttons.
 * - Single primary CTA in header (+ Issue Invoice).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    AlertCircle,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    Banknote,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock,
    Eye,
    EyeOff,
    Download,
    FileText,
    Filter,
    LayoutGrid,
    LayoutList,
    Plus,
    Receipt,
    RefreshCw,
    Search,
    Wallet,
    X,
    Zap,
    type LucideIcon,
} from "lucide-react";

import { InvoiceModal } from "@/components/landlord/invoices/InvoiceModal";
import { IssueInvoiceModal } from "@/components/landlord/invoices/IssueInvoiceModal";
import { RecordExpenseModal } from "@/components/landlord/invoices/RecordExpenseModal";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { Skeleton } from "@/components/ui/Skeleton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { InvoiceListItem } from "@/lib/billing/server";
import { formatDateLong, formatPhpCurrency } from "@/lib/billing/utils";
import {
    describeInvoice,
    getInvoiceAttentionGroup,
    type InvoiceAttentionGroup,
} from "@/lib/billing/invoice-plain-status";
import { cn } from "@/lib/utils";
import { useProperty } from "@/context/PropertyContext";
import { useLanguageContext } from "@/context/LanguageContext";

interface ExpenseItem {
    id: string;
    category: string;
    amount: number;
    date_incurred: string;
    description: string;
}

type SectionId = "invoices" | "ledger" | "expenses";
type FilterId = InvoiceAttentionGroup | "all";
type SortId = "newest" | "oldest" | "tenant_az" | "highest_amount" | "lowest_amount";
type MethodId = "all" | "gcash" | "bank_transfer" | "cash";

const SECTION_IDS: SectionId[] = ["invoices", "ledger", "expenses"];
const FILTER_IDS: FilterId[] = ["attention", "late", "waiting", "paid", "all"];

function filterFromLegacyStatus(status: string): FilterId {
    switch (status) {
        case "overdue":
            return "late";
        case "under_review":
        case "refund_pending":
        case "awaiting_in_person":
            return "attention";
        case "pending":
        case "reminder_sent":
        case "intent_submitted":
        case "rejected":
            return "waiting";
        case "paid":
        case "paid_all":
        case "receipted":
        case "confirmed":
            return "paid";
        default:
            return (FILTER_IDS as string[]).includes(status) ? (status as FilterId) : "all";
    }
}

function readSectionFromUrl(): SectionId {
    if (typeof window === "undefined") return "invoices";
    const tab = new URLSearchParams(window.location.search).get("tab");
    return (SECTION_IDS as string[]).includes(tab ?? "") ? (tab as SectionId) : "invoices";
}

/** Table columns the landlord can hide. Tenant and the action button are not on the list. */
type TableColumnId = "status" | "dueDate" | "total" | "remaining";
const TABLE_COLUMNS: Array<{ id: TableColumnId; label: string }> = [
    { id: "status", label: "Status" },
    { id: "dueDate", label: "Due Date" },
    { id: "total", label: "Total Payable" },
    { id: "remaining", label: "Remaining" },
];
const TABLE_COLUMN_IDS = TABLE_COLUMNS.map((column) => column.id);
const COLUMNS_STORAGE_KEY = "ireside.landlord.invoices.hiddenColumns";

export default function InvoicesPage() {
    const { selectedPropertyId } = useProperty();
    const { t, locale } = useLanguageContext();
    const searchParams = useSearchParams();

    const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
    const [metrics, setMetrics] = useState({ totalOutstanding: 0, overdueAmount: 0, collectedLast30Days: 0, totalInvoices: 0 });
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loadedAt, setLoadedAt] = useState(0);

    const [section, setSection] = useState<SectionId>("invoices");
    const [filter, setFilter] = useState<FilterId>("all");
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<SortId>("newest");
    const [method, setMethod] = useState<MethodId>("all");
    const [viewMode, setViewMode] = useState<"table" | "cards">("table");
    // Table columns the landlord chose to hide. Tenant and the action button always show.
    const [hiddenColumns, setHiddenColumns] = useState<Set<TableColumnId>>(() => new Set());

    useEffect(() => {
        // Per-browser convenience only: hidden columns are remembered on this device.
        try {
            const raw = window.localStorage.getItem(COLUMNS_STORAGE_KEY);
            if (!raw) return;
            const parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setHiddenColumns(new Set(parsed.filter((id): id is TableColumnId => (TABLE_COLUMN_IDS as readonly string[]).includes(String(id)))));
            }
        } catch {
            // Storage may be blocked (private window); the default of every column shown is fine.
        }
    }, []);

    const toggleColumn = useCallback((id: TableColumnId, visible: boolean) => {
        setHiddenColumns((current) => {
            const next = new Set(current);
            if (visible) next.delete(id);
            else next.add(id);
            try {
                window.localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify([...next]));
            } catch {
                // Not remembered this time; the choice still applies until the page reloads.
            }
            return next;
        });
    }, []);
    const isColumnShown = (id: TableColumnId) => !hiddenColumns.has(id);

    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isIssueInvoiceModalOpen, setIsIssueInvoiceModalOpen] = useState(false);
    const listHeadingRef = useRef<HTMLHeadingElement>(null);

    // Sync section with browser URL
    useEffect(() => {
        setSection(readSectionFromUrl());
        const onPop = () => setSection(readSectionFromUrl());
        window.addEventListener("popstate", onPop);
        return () => window.removeEventListener("popstate", onPop);
    }, []);

    const openSection = useCallback((next: SectionId) => {
        setSection((current) => {
            if (current === next) return current;
            const params = new URLSearchParams(window.location.search);
            params.set("tab", next);
            window.history.pushState(window.history.state, "", `${window.location.pathname}?${params.toString()}`);
            return next;
        });
    }, []);

    useEffect(() => {
        const queryId = searchParams.get("id") || searchParams.get("invoiceId");
        if (queryId) setSelectedInvoiceId(queryId);
        const action = searchParams.get("action");
        if (action === "create" || action === "issue") setIsIssueInvoiceModalOpen(true);
        const status = searchParams.get("status");
        if (status) setFilter(filterFromLegacyStatus(status));
        const searchParam = searchParams.get("search");
        if (searchParam) setSearch(searchParam);
        const tab = searchParams.get("tab");
        if (tab && (SECTION_IDS as string[]).includes(tab)) setSection(tab as SectionId);
    }, [searchParams]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const params = new URLSearchParams({ propertyId: selectedPropertyId });
            const [invoiceRes, expensesRes] = await Promise.all([
                fetch(`/api/landlord/invoices?${params.toString()}`, { cache: "no-store" }),
                fetch(`/api/landlord/expenses?${params.toString()}`, { cache: "no-store" }),
            ]);
            if (!invoiceRes.ok || !expensesRes.ok) throw new Error();
            const invoicePayload = await invoiceRes.json();
            const expensesPayload = await expensesRes.json();
            setInvoices(invoicePayload.invoices ?? []);
            setExpenses(expensesPayload.expenses ?? []);
            setMetrics(invoicePayload.metrics ?? { totalOutstanding: 0, overdueAmount: 0, collectedLast30Days: 0, totalInvoices: 0 });
        } catch {
            setLoadError(t("Unable to load billing operations. Check your connection and try again."));
        } finally {
            setLoadedAt(Date.now());
            setLoading(false);
        }
    }, [selectedPropertyId, t]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const counts = useMemo(() => {
        let attention = 0;
        let late = 0;
        let waiting = 0;
        let paid = 0;
        for (const invoice of invoices) {
            const group = getInvoiceAttentionGroup(invoice);
            if (group === "attention") attention++;
            else if (group === "late") late++;
            else if (group === "waiting") waiting++;
            else if (group === "paid") paid++;
        }
        return { all: invoices.length, attention, late, waiting, paid };
    }, [invoices]);

    const visibleInvoices = useMemo(() => {
        const needle = search.trim().toLowerCase();
        let list = invoices.filter((invoice) =>
            needle ? `${invoice.invoiceNumber} ${invoice.tenant} ${invoice.property} ${invoice.unit}`.toLowerCase().includes(needle) : true,
        );
        if (filter !== "all") list = list.filter((invoice) => getInvoiceAttentionGroup(invoice) === filter);
        if (method !== "all") {
            list = list.filter((invoice) => {
                if (method === "cash") return invoice.paymentMethod === "cash" || invoice.paymentMethod === "in_person" || invoice.workflowStatus === "awaiting_in_person";
                return invoice.paymentMethod === method;
            });
        }
        return list.toSorted((a, b) => {
            if (sortBy === "oldest") return new Date(a.issuedDate).getTime() - new Date(b.issuedDate).getTime();
            if (sortBy === "tenant_az") return a.tenant.localeCompare(b.tenant);
            if (sortBy === "highest_amount") return b.amount - a.amount;
            if (sortBy === "lowest_amount") return a.amount - b.amount;
            return new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime();
        });
    }, [invoices, search, filter, method, sortBy]);

    const handleExportCSV = () => {
        const ledgerData = [
            ...expenses.map((expense) => ({ date: expense.date_incurred, type: "Expense", category: expense.category, description: expense.description, amount: -expense.amount })),
            ...invoices
                .filter((invoice) => getInvoiceAttentionGroup(invoice) === "paid")
                .map((invoice) => ({ date: invoice.issuedDate, type: "Income", category: "Rent Payment", description: `Invoice ${invoice.invoiceNumber} - ${invoice.tenant}`, amount: invoice.amount })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const headers = ["Date", "Type", "Category", "Description", "Amount (PHP)"];
        const csvContent = [headers.join(","), ...ledgerData.map((row) => [row.date, row.type, row.category, `"${row.description.replace(/"/g, '""')}"`, row.amount.toFixed(2)].join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `iReside_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const { totalExpenses, expensesLast30Days } = useMemo(() => {
        const thirtyDaysAgo = loadedAt - 30 * 24 * 60 * 60 * 1000;
        return {
            totalExpenses: expenses.reduce((sum, expense) => sum + expense.amount, 0),
            expensesLast30Days: expenses.reduce((sum, expense) => (new Date(expense.date_incurred).getTime() >= thirtyDaysAgo ? sum + expense.amount : sum), 0),
        };
    }, [expenses, loadedAt]);
    const netLast30Days = metrics.collectedLast30Days - expensesLast30Days;

    return (
        <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-8 md:px-8 lg:py-10">
            {/* Header: Financial Center pill + Title + Action buttons */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-foreground shadow-xs">
                        <FileText className="size-3.5 text-primary" />
                        {t("Financial Center")}
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
                        {t("Finance Hub")}
                    </h1>
                    <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-zinc-400">
                        {t("Track monthly rent, verify tenant payments, and manage property expenses.")}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/landlord/utility-billing"
                        className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-all hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 active:scale-95"
                    >
                        <Zap className="size-4 text-amber-500" />
                        <span>{t("Record Submeters")}</span>
                    </Link>

                    <button
                        type="button"
                        onClick={() => {
                            setSection("invoices");
                            setIsIssueInvoiceModalOpen(true);
                        }}
                        className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-95 cursor-pointer"
                    >
                        <Plus className="size-4" />
                        <span>{t("Issue Invoice")}</span>
                    </button>
                </div>
            </div>

            {/* Error notice if fetch failed */}
            {loadError && (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-300 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30 p-4 text-sm font-bold text-rose-900 dark:text-rose-300 shadow-xs">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="size-5 shrink-0 text-rose-700 dark:text-rose-400" />
                        <span>{loadError}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => void loadData()}
                        className="rounded-xl border border-rose-300 dark:border-rose-800 bg-card px-3 py-1 text-xs font-bold hover:bg-muted"
                    >
                        {t("Try again")}
                    </button>
                </div>
            )}

            {/* Top 3 Hero Stat Cards: Solid cards with high-contrast text */}
            <div className="grid gap-4 sm:grid-cols-3">
                <HeroStat
                    label={t("Net Cash in Hand (30d)")}
                    value={formatPhpCurrency(netLast30Days)}
                    highlight={netLast30Days >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}
                    loading={loading}
                    subtext={t("Rent collected minus property expenses")}
                    icon={Banknote}
                />
                <HeroStat
                    label={t("Rent Collected (30d)")}
                    value={formatPhpCurrency(metrics.collectedLast30Days)}
                    highlight="text-blue-700 dark:text-blue-400"
                    loading={loading}
                    subtext={t("Total rent collected from tenants")}
                    icon={Receipt}
                />
                <HeroStat
                    label={t("Total Expenses (30d)")}
                    value={formatPhpCurrency(expensesLast30Days)}
                    highlight="text-amber-800 dark:text-amber-400"
                    loading={loading}
                    subtext={t("Repairs, utility bills & maintenance costs")}
                    icon={Wallet}
                />
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto border-b border-border pb-px">
                <button
                    type="button"
                    onClick={() => openSection("invoices")}
                    className={cn(
                        "px-6 py-3 text-sm font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer",
                        section === "invoices"
                            ? "border-primary text-primary"
                            : "border-transparent text-slate-600 dark:text-zinc-400 hover:border-border hover:text-foreground"
                    )}
                >
                    <Receipt className="size-4" />
                    <span>{t("Rent Invoices")}</span>
                    <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-mono font-bold",
                        section === "invoices" ? "bg-primary/20 text-primary" : "bg-muted text-foreground"
                    )}>
                        {invoices.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => openSection("ledger")}
                    className={cn(
                        "px-6 py-3 text-sm font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer",
                        section === "ledger"
                            ? "border-primary text-primary"
                            : "border-transparent text-slate-600 dark:text-zinc-400 hover:border-border hover:text-foreground"
                    )}
                >
                    <Banknote className="size-4" />
                    <span>{t("Unified Ledger")}</span>
                </button>

                <button
                    type="button"
                    onClick={() => openSection("expenses")}
                    className={cn(
                        "px-6 py-3 text-sm font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer",
                        section === "expenses"
                            ? "border-primary text-primary"
                            : "border-transparent text-slate-600 dark:text-zinc-400 hover:border-border hover:text-foreground"
                    )}
                >
                    <Wallet className="size-4" />
                    <span>{t("Expenses")}</span>
                    <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-mono font-bold",
                        section === "expenses" ? "bg-primary/20 text-primary" : "bg-muted text-foreground"
                    )}>
                        {expenses.length}
                    </span>
                </button>
            </div>

            {/* TAB 1: RENT INVOICES */}
            {section === "invoices" && (
                <div className="flex min-h-[50vh] flex-col rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs animate-in fade-in">
                    {/* Header & Controls Toolbar */}
                    <div className="mb-4 flex shrink-0 flex-col gap-3 border-b border-border pb-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 ref={listHeadingRef} className="text-xl font-black text-foreground lg:text-2xl">
                                {t("Issued Invoices")}
                                <span className="sr-only">, </span>
                                <span className="ml-2 align-middle text-sm font-semibold text-muted-foreground tabular-nums">{counts.all}</span>
                            </h2>

                            {/* Search bar */}
                            <div className="relative w-full sm:w-72">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                                <input
                                    maxLength={60}
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder={t("Search tenant, unit, or invoice...")}
                                    className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-9 text-xs sm:text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-xs"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-foreground p-0.5"
                                        aria-label={t("Clear search")}
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Status pills, then method / sort / view on the same row */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            {/* Segmented Filter Pills */}
                            <div className="inline-flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border overflow-x-auto max-w-full">
                                <button
                                    type="button"
                                    onClick={() => setFilter("all")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                                        filter === "all"
                                            ? "bg-card text-foreground shadow-xs font-black border border-border/80"
                                            : "text-slate-600 dark:text-zinc-400 hover:text-foreground hover:bg-card/80"
                                    )}
                                >
                                    <span>{t("All")}</span>
                                    <span className={cn(
                                        "text-[11px] px-1.5 py-0.5 rounded-md font-mono font-bold",
                                        filter === "all" ? "bg-primary/20 text-primary" : "bg-muted text-foreground"
                                    )}>
                                        {counts.all}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFilter("attention")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                                        filter === "attention"
                                            ? "bg-amber-600 text-white shadow-xs font-black"
                                            : "text-slate-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                    )}
                                >
                                    <AlertCircle className="size-3.5 shrink-0" />
                                    <span>{t("To Verify")}</span>
                                    <span className={cn(
                                        "text-[11px] px-1.5 py-0.5 rounded-md font-mono font-bold",
                                        filter === "attention" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                                    )}>
                                        {counts.attention}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFilter("late")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                                        filter === "late"
                                            ? "bg-rose-600 text-white shadow-xs font-black"
                                            : "text-slate-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                    )}
                                >
                                    <CalendarDays className="size-3.5 shrink-0" />
                                    <span>{t("Overdue")}</span>
                                    <span className={cn(
                                        "text-[11px] px-1.5 py-0.5 rounded-md font-mono font-bold",
                                        filter === "late" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300"
                                    )}>
                                        {counts.late}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFilter("waiting")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                                        filter === "waiting"
                                            ? "bg-card text-foreground shadow-xs font-black border border-border/80"
                                            : "text-slate-600 dark:text-zinc-400 hover:text-foreground hover:bg-card/80"
                                    )}
                                >
                                    <Clock className="size-3.5 shrink-0" />
                                    <span>{t("Awaiting")}</span>
                                    <span className={cn(
                                        "text-[11px] px-1.5 py-0.5 rounded-md font-mono font-bold",
                                        filter === "waiting" ? "bg-primary/20 text-primary" : "bg-muted text-foreground"
                                    )}>
                                        {counts.waiting}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFilter("paid")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                                        filter === "paid"
                                            ? "bg-emerald-700 text-white shadow-xs font-black"
                                            : "text-slate-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                    )}
                                >
                                    <CheckCircle2 className="size-3.5 shrink-0" />
                                    <span>{t("Paid")}</span>
                                    <span className={cn(
                                        "text-[11px] px-1.5 py-0.5 rounded-md font-mono font-bold",
                                        filter === "paid" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                                    )}>
                                        {counts.paid}
                                    </span>
                                </button>
                            </div>

                            {/* Method & Sorting Filters */}
                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value as MethodId)}
                                    aria-label={t("Filter by payment method")}
                                    className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground outline-none transition-all hover:bg-muted/50 focus:border-primary shadow-xs cursor-pointer"
                                >
                                    <option value="all">{t("All Methods")}</option>
                                    <option value="gcash">GCash</option>
                                    <option value="bank_transfer">{t("Bank Transfer")}</option>
                                    <option value="cash">{t("Cash / In-Person")}</option>
                                </select>

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortId)}
                                    aria-label={t("Sort bills by")}
                                    className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground outline-none transition-all hover:bg-muted/50 focus:border-primary shadow-xs cursor-pointer"
                                >
                                    <option value="newest">{t("Newest First")}</option>
                                    <option value="oldest">{t("Oldest First")}</option>
                                    <option value="tenant_az">{t("Tenant (A-Z)")}</option>
                                    <option value="highest_amount">{t("Highest Amount")}</option>
                                    <option value="lowest_amount">{t("Lowest Amount")}</option>
                                </select>

                                {/* View Switcher: Table vs Cards */}
                                <div className="inline-flex items-center rounded-xl border border-border bg-background p-1 shadow-xs">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("table")}
                                        aria-label={t("Table view")}
                                        title={t("Table view")}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                                            viewMode === "table"
                                                ? "bg-card text-foreground shadow-xs border border-border/80"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <LayoutList className="size-3.5" />
                                        <span className="hidden sm:inline">{t("Table")}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("cards")}
                                        aria-label={t("Cards view")}
                                        title={t("Cards view")}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                                            viewMode === "cards"
                                                ? "bg-card text-foreground shadow-xs border border-border/80"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <LayoutGrid className="size-3.5" />
                                        <span className="hidden sm:inline">{t("Cards")}</span>
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Invoices: Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-muted/20 py-16 text-muted-foreground">
                            <LoadingSpinner size="md" className="mb-4 text-primary" />
                            <p className="text-xs font-black uppercase tracking-widest text-foreground">{t("Loading bills...")}</p>
                        </div>
                    )}

                    {/* Invoices: Empty State */}
                    {!loading && visibleInvoices.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
                            <p className="text-lg font-bold text-foreground">
                                {invoices.length === 0 ? t("No rent bills found.") : t("No bills match your chosen filters.")}
                            </p>
                            <p className="mt-1.5 text-sm text-slate-600 dark:text-zinc-400">
                                {invoices.length === 0 ? t("Issue your first rent bill using the button above.") : t("Try clearing the search or choosing another filter pile.")}
                            </p>
                            {invoices.length > 0 && (filter !== "all" || search || method !== "all") && (
                                <button
                                    type="button"
                                    onClick={() => { setFilter("all"); setSearch(""); setMethod("all"); }}
                                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
                                >
                                    <RefreshCw className="size-3.5" />
                                    <span>{t("Reset all filters")}</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Invoices: Table View (Adhering to Tufte, Alignment, Fitts, and Miller Laws) */}
                    {!loading && visibleInvoices.length > 0 && viewMode === "table" && (
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                            {/* Hidden columns come back from here: one small chip each, only when something is hidden */}
                            {hiddenColumns.size > 0 && (
                                <div className="flex flex-wrap items-center justify-end gap-1.5 border-b border-border bg-muted/20 px-4 py-2">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("Hidden")}:</span>
                                    {TABLE_COLUMNS.filter((column) => hiddenColumns.has(column.id)).map((column) => (
                                        <button
                                            key={column.id}
                                            type="button"
                                            onClick={() => toggleColumn(column.id, true)}
                                            aria-label={t("Show the {column} column", { column: t(column.label) })}
                                            title={t("Show the {column} column", { column: t(column.label) })}
                                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-xs font-bold text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer"
                                        >
                                            <Eye className="size-3.5" />
                                            <span>{t(column.label)}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                {/*
                                  Fixed layout: the tenant column takes whatever is left and truncates, so the
                                  fixed-width columns (and the action button's right padding) never get pushed
                                  past the card edge the way auto layout did with long property names.
                                */}
                                <table className="w-full table-fixed text-left text-sm border-collapse min-w-[640px]">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
                                            <th scope="col" className="py-3.5 pl-6 pr-4 text-left">
                                                {t("Tenant & Unit")}
                                            </th>
                                            {isColumnShown("status") && (
                                                <th scope="col" className="py-3.5 px-4 text-left w-[170px]">
                                                    <HideableHeader label={t("Status")} onHide={() => toggleColumn("status", false)} />
                                                </th>
                                            )}
                                            {isColumnShown("dueDate") && (
                                                <th scope="col" className="py-3.5 px-4 text-left w-[160px]">
                                                    <HideableHeader label={t("Due Date")} onHide={() => toggleColumn("dueDate", false)} />
                                                </th>
                                            )}
                                            {isColumnShown("total") && (
                                                <th scope="col" className="py-3.5 px-4 text-right w-[170px]">
                                                    <HideableHeader label={t("Total Payable")} onHide={() => toggleColumn("total", false)} align="right" />
                                                </th>
                                            )}
                                            {isColumnShown("remaining") && (
                                                <th scope="col" className="py-3.5 px-4 text-right w-[140px]">
                                                    <HideableHeader label={t("Remaining")} onHide={() => toggleColumn("remaining", false)} align="right" />
                                                </th>
                                            )}
                                            <th scope="col" className="py-3.5 pl-3 pr-6 text-right w-[136px]">
                                                <span className="sr-only">{t("Action")}</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {visibleInvoices.map((invoice) => (
                                            <InvoiceTableRow
                                                key={invoice.id}
                                                invoice={invoice}
                                                onOpen={() => setSelectedInvoiceId(invoice.id)}
                                                isColumnShown={isColumnShown}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Invoices: Cards View (4-Level Visual Hierarchy) */}
                    {!loading && visibleInvoices.length > 0 && viewMode === "cards" && (
                        <div className="space-y-4">
                            {visibleInvoices.map((invoice) => (
                                <InvoiceCard
                                    key={invoice.id}
                                    invoice={invoice}
                                    onOpen={() => setSelectedInvoiceId(invoice.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: UNIFIED LEDGER */}
            {section === "ledger" && (
                <div className="flex min-h-[50vh] flex-col rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs animate-in fade-in">
                    <div className="mb-6 flex shrink-0 flex-col gap-4 border-b border-border pb-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">{t("Audit Trail")}</p>
                                <h2 className="mt-1 text-2xl font-black text-foreground lg:text-3xl">{t("Unified Financial Ledger")}</h2>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-0.5">
                                    {t("Chronological record of every collected payment and property expense.")}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleExportCSV}
                                disabled={loading || (expenses.length === 0 && invoices.length === 0)}
                                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-xs sm:text-sm font-bold text-foreground shadow-xs hover:border-primary hover:text-primary transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                <Download className="size-4" />
                                <span>{t("Download CSV Spreadsheet")}</span>
                            </button>
                        </div>
                    </div>

                    {loading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
                                    <Skeleton className="h-10 w-48 rounded-xl bg-muted" />
                                    <Skeleton className="h-7 w-28 rounded-xl bg-muted" />
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && expenses.length === 0 && invoices.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
                            <p className="text-lg font-bold text-foreground">{t("No transactions recorded yet.")}</p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">{t("Paid rent bills and recorded expenses will appear here automatically.")}</p>
                        </div>
                    )}

                    {!loading && (expenses.length > 0 || invoices.length > 0) && (
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse min-w-[640px]">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
                                            <th scope="col" className="py-3.5 pl-5 pr-4 text-left">
                                                {t("Date")}
                                            </th>
                                            <th scope="col" className="py-3.5 px-4 text-left">
                                                {t("Description / Entity")}
                                            </th>
                                            <th scope="col" className="py-3.5 px-4 text-left">
                                                {t("Type")}
                                            </th>
                                            <th scope="col" className="py-3.5 pl-4 pr-5 text-right">
                                                {t("Amount (PHP)")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {[
                                            ...expenses.map((expense) => ({
                                                id: `expense-${expense.id}`,
                                                type: "expense" as const,
                                                date: new Date(expense.date_incurred),
                                                amount: expense.amount,
                                                title: t(expense.category),
                                                detail: expense.description,
                                            })),
                                            ...invoices
                                                .filter((invoice) => getInvoiceAttentionGroup(invoice) === "paid")
                                                .map((invoice) => ({
                                                    id: `income-${invoice.id}`,
                                                    type: "income" as const,
                                                    date: new Date(invoice.issuedDate),
                                                    amount: invoice.amount,
                                                    title: t("Rent Payment: {name}", { name: invoice.tenant }),
                                                    detail: t("Unit {unit} • Invoice #{num}", { unit: invoice.unit, num: invoice.invoiceNumber }),
                                                })),
                                        ]
                                            .sort((a, b) => b.date.getTime() - a.date.getTime())
                                            .map((entry) => (
                                                <tr
                                                    key={entry.id}
                                                    className="group transition-colors hover:bg-muted/40"
                                                >
                                                    <td className="py-3.5 pl-5 pr-4 align-middle whitespace-nowrap text-xs text-muted-foreground font-normal">
                                                        <span suppressHydrationWarning>
                                                            {entry.date.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 align-middle min-w-[220px]">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={cn(
                                                                    "flex size-8 shrink-0 items-center justify-center rounded-lg font-bold",
                                                                    entry.type === "income"
                                                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                                                                        : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800"
                                                                )}
                                                            >
                                                                {entry.type === "income" ? (
                                                                    <ArrowDownRight className="size-4" />
                                                                ) : (
                                                                    <ArrowUpRight className="size-4" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-sm text-foreground capitalize truncate">
                                                                    {entry.title}
                                                                </p>
                                                                {entry.detail && (
                                                                    <p className="text-xs text-muted-foreground font-normal truncate mt-0.5">
                                                                        {entry.detail}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                                                        <span
                                                            className={cn(
                                                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                                                                entry.type === "income"
                                                                    ? "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800"
                                                                    : "bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800"
                                                            )}
                                                        >
                                                            <span className="size-1.5 rounded-full bg-current" />
                                                            {entry.type === "income" ? t("Income") : t("Expense")}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 pl-4 pr-5 align-middle text-right whitespace-nowrap text-sm font-bold tabular-nums">
                                                        <span
                                                            className={cn(
                                                                entry.type === "income"
                                                                    ? "text-emerald-700 dark:text-emerald-400"
                                                                    : "text-rose-700 dark:text-rose-400"
                                                            )}
                                                        >
                                                            {entry.type === "income" ? "+" : "−"}{formatPhpCurrency(entry.amount)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: EXPENSES */}
            {section === "expenses" && (
                <div className="flex min-h-[50vh] flex-col rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs animate-in fade-in">
                    <div className="mb-6 flex shrink-0 flex-col gap-4 border-b border-border pb-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">{t("Outflow & Costs")}</p>
                                <h2 className="mt-1 text-2xl font-black text-foreground lg:text-3xl">{t("Property Expenses")}</h2>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-0.5">
                                    {t("Log building maintenance, utility bills you cover, and property taxes.")}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsExpenseModalOpen(true)}
                                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs sm:text-sm font-black text-primary-foreground shadow-xs hover:bg-primary/90 transition-all active:scale-95 cursor-pointer"
                            >
                                <Plus className="size-4" />
                                <span>{t("Record Expense")}</span>
                            </button>
                        </div>
                    </div>

                    {loading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
                                    <Skeleton className="h-10 w-48 rounded-xl bg-muted" />
                                    <Skeleton className="h-7 w-28 rounded-xl bg-muted" />
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && expenses.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
                            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 mb-3">
                                <Wallet className="size-7" />
                            </div>
                            <p className="text-lg font-bold text-foreground">{t("No expenses recorded yet.")}</p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto">
                                {t("Click \"Record Expense\" above to log repairs, maintenance, and utility bills.")}
                            </p>
                        </div>
                    )}

                    {!loading && expenses.length > 0 && (
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse min-w-[640px]">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
                                            <th scope="col" className="py-3.5 pl-5 pr-4 text-left">
                                                {t("Date Incurred")}
                                            </th>
                                            <th scope="col" className="py-3.5 px-4 text-left">
                                                {t("Category")}
                                            </th>
                                            <th scope="col" className="py-3.5 px-4 text-left">
                                                {t("Description / Notes")}
                                            </th>
                                            <th scope="col" className="py-3.5 pl-4 pr-5 text-right">
                                                {t("Amount (PHP)")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {expenses.map((expense) => (
                                            <tr
                                                key={expense.id}
                                                className="group transition-colors hover:bg-muted/40"
                                            >
                                                <td className="py-4 pl-5 pr-4 align-middle whitespace-nowrap text-xs text-muted-foreground font-normal">
                                                    <ClientOnlyDate date={expense.date_incurred} />
                                                </td>
                                                <td className="py-4 px-4 align-middle whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 text-xs font-semibold capitalize text-rose-900 dark:text-rose-300">
                                                        <span className="size-1.5 rounded-full bg-rose-600 dark:bg-rose-400" />
                                                        {t(expense.category)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 align-middle text-xs sm:text-sm text-foreground">
                                                    {expense.description || "—"}
                                                </td>
                                                <td className="py-4 pl-4 pr-5 align-middle text-right whitespace-nowrap text-sm font-bold text-foreground tabular-nums">
                                                    {formatPhpCurrency(expense.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <InvoiceModal
                invoiceId={selectedInvoiceId}
                onClose={() => setSelectedInvoiceId(null)}
                onUpdated={loadData}
            />

            <RecordExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSaved={loadData}
            />

            <IssueInvoiceModal
                isOpen={isIssueInvoiceModalOpen}
                onClose={() => setIsIssueInvoiceModalOpen(false)}
                onIssued={loadData}
                defaultUnitId={searchParams.get("unitId")}
                propertyId={selectedPropertyId}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Helper Subcomponents
// ---------------------------------------------------------------------------

function HeroStat({
    label,
    value,
    highlight,
    loading,
    subtext,
    icon: Icon,
}: {
    label: string;
    value: string;
    highlight?: string;
    loading?: boolean;
    subtext?: string;
    icon?: LucideIcon;
}) {
    return (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                    {Icon && <Icon className={cn("size-4 shrink-0 opacity-70", highlight)} />}
                </div>
                {loading ? (
                    <div className="mt-3 flex items-center">
                        <Skeleton className="h-8 w-32 rounded-xl bg-muted" />
                    </div>
                ) : (
                    <p className={cn("mt-2 text-2xl sm:text-3xl font-bold tracking-tight tabular-nums", highlight)}>
                        {value}
                    </p>
                )}
            </div>
            {subtext && (
                <p className="mt-3 text-xs font-normal text-muted-foreground border-t border-border/60 pt-2.5">
                    {subtext}
                </p>
            )}
        </div>
    );
}

/** A column heading with a small eye button that hides the column (the chip row above the table brings it back). */
function HideableHeader({ label, onHide, align = "left" }: { label: string; onHide: () => void; align?: "left" | "right" }) {
    const { t } = useLanguageContext();
    return (
        <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", align === "right" && "flex-row-reverse")}>
            <span>{label}</span>
            <button
                type="button"
                onClick={onHide}
                aria-label={t("Hide the {column} column", { column: label })}
                title={t("Hide the {column} column", { column: label })}
                className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer"
            >
                <EyeOff className="size-3.5" />
            </button>
        </span>
    );
}

/**
 * World-Class Data Table Row (HCI & Typography Laws):
 * - Tufte's Data-Ink: Clean 1px horizontal divider, subtle hover highlight, no cage lines.
 * - Alignment: Left-aligned tenant & status, right-aligned numbers with tabular-nums matching headers.
 * - Fitts's Law: Entire row is clickable with comfortable 16px vertical padding.
 * - Hick-Hyman Law: 1 clear contextual action or quiet chevron.
 */
function InvoiceTableRow({ invoice, onOpen, isColumnShown }: { invoice: InvoiceListItem; onOpen: () => void; isColumnShown: (id: TableColumnId) => boolean }) {
    const { t } = useLanguageContext();
    const plain = describeInvoice({ ...invoice, tenantName: invoice.tenant }, t, "landlord");
    const isPaid = plain.group === "paid";
    const isAttention = plain.group === "attention";
    const isLate = plain.group === "late";

    return (
        <tr
            onClick={onOpen}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen();
                }
            }}
            aria-label={t("Open bill for {name}, Unit {unit}", { name: invoice.tenant, unit: invoice.unit })}
            className="group cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/50 outline-none select-none"
        >
            {/* Column 1: Tenant & Unit (Left Aligned - Anchor) */}
            <td className="py-3.5 pl-5 pr-4 align-middle">
                <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors tracking-tight truncate">
                        {invoice.tenant}
                    </p>
                    <p className="text-xs text-muted-foreground font-normal truncate mt-0.5">
                        <span>{t("Unit {unit}", { unit: invoice.unit })}</span>
                        <span className="mx-1.5 opacity-40">·</span>
                        <span>{invoice.property}</span>
                        <span className="mx-1.5 opacity-40">·</span>
                        <span className="font-mono text-[11px] opacity-75">{invoice.invoiceNumber}</span>
                    </p>
                </div>
            </td>

            {/* Column 2: Status (Left Aligned - Single Pill Container) */}
            {isColumnShown("status") && (
            <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                <span
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                        isAttention
                            ? "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800"
                            : isLate
                                ? "bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800"
                                : isPaid
                                    ? "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800"
                                    : "bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700"
                    )}
                >
                    <span className="size-1.5 rounded-full bg-current" />
                    {plain.tag}
                </span>
            </td>
            )}

            {/* Column 3: Due Date (Left Aligned) */}
            {isColumnShown("dueDate") && (
            <td className="py-3.5 px-4 align-middle whitespace-nowrap text-xs text-muted-foreground font-normal">
                {formatDateLong(invoice.dueDate)}
            </td>
            )}

            {/* Column 4: Total Payable (STRICTLY RIGHT ALIGNED, Tabular) */}
            {isColumnShown("total") && (
            <td className="py-3.5 px-4 align-middle text-right whitespace-nowrap text-sm font-semibold text-foreground tabular-nums">
                {formatPhpCurrency(invoice.amount)}
            </td>
            )}

            {/* Column 5: Remaining (STRICTLY RIGHT ALIGNED, Tabular) */}
            {isColumnShown("remaining") && (
            <td className="py-3.5 px-4 align-middle text-right whitespace-nowrap text-sm tabular-nums">
                {isPaid ? (
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {t("Settled")}
                    </span>
                ) : (
                    <span
                        className={cn(
                            "font-semibold",
                            invoice.balanceRemaining > 0 ? "text-foreground" : "text-muted-foreground font-normal"
                        )}
                    >
                        {formatPhpCurrency(invoice.balanceRemaining)}
                    </span>
                )}
            </td>
            )}

            {/* Column 6: Contextual Action (Right Aligned, Non-Clipping) */}
            <td className="py-3.5 pl-3 pr-6 align-middle text-right whitespace-nowrap">
                <div className="flex items-center justify-end">
                    {isAttention ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-500 px-3 py-1.5 text-xs font-bold shadow-xs transition-all shrink-0">
                            <span>{t("Review")}</span>
                            <ChevronRight className="size-3.5" />
                        </span>
                    ) : isLate ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 px-3 py-1.5 text-xs font-bold transition-all shrink-0">
                            <span>{t("Remind")}</span>
                            <ChevronRight className="size-3.5" />
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground px-3 py-1.5 text-xs font-medium transition-all shrink-0">
                            <span>{t("View")}</span>
                            <ChevronRight className="size-3.5" />
                        </span>
                    )}
                </div>
            </td>
        </tr>
    );
}

/**
 * Clean, Calibrated Visual Hierarchy:
 * - Level 1 (Dominant): Tenant Name + Status Badge (the only pill on the card).
 * - Level 2 (Context): Unit Room · Property · #Invoice (quiet, regular font, no pill borders).
 * - Level 3 (Financials): Amount · Balance · Due Date (tabular, medium weight, aligned).
 * - Level 4 (Action): Contextual button or subtle chevron. No redundant run-on sentences.
 */
function InvoiceCard({ invoice, onOpen }: { invoice: InvoiceListItem; onOpen: () => void }) {
    const { t } = useLanguageContext();
    const plain = describeInvoice({ ...invoice, tenantName: invoice.tenant }, t, "landlord");
    const isPaid = plain.group === "paid";
    const isAttention = plain.group === "attention";
    const isLate = plain.group === "late";

    return (
        <button
            type="button"
            onClick={onOpen}
            aria-label={t("Open bill for {name}, Unit {unit}", { name: invoice.tenant, unit: invoice.unit })}
            className="group w-full text-left rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs hover:border-slate-400 dark:hover:border-zinc-700 transition-all cursor-pointer"
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left Side: Subject Identity & Quiet Context */}
                <div className="space-y-1 min-w-0">
                    {/* Level 1: Primary Anchor (Tenant Name + Single Status Badge) */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                            {invoice.tenant}
                        </h3>

                        <span
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                                isAttention
                                    ? "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800"
                                    : isLate
                                        ? "bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800"
                                        : isPaid
                                            ? "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800"
                                            : "bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700"
                            )}
                        >
                            <span className="size-1.5 rounded-full bg-current" />
                            {plain.tag}
                        </span>
                    </div>

                    {/* Level 2: Secondary Context (Quiet, unboxed, regular weight) */}
                    <p className="text-xs sm:text-sm text-muted-foreground font-normal">
                        <span>{t("Unit {unit}", { unit: invoice.unit })}</span>
                        <span className="mx-1.5 opacity-40">·</span>
                        <span>{invoice.property}</span>
                        <span className="mx-1.5 opacity-40">·</span>
                        <span className="font-mono text-[11px] opacity-75">{invoice.invoiceNumber}</span>
                    </p>
                </div>

                {/* Right Side: Level 3 Financials & Level 4 Action */}
                <div className="flex items-center gap-6 sm:gap-8 shrink-0">
                    <div className="text-left sm:text-right">
                        <span className="block text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                            {t("Total Payable")}
                        </span>
                        <span className="block text-sm sm:text-base font-semibold text-foreground tabular-nums">
                            {formatPhpCurrency(invoice.amount)}
                        </span>
                    </div>

                    <div className="text-left sm:text-right">
                        <span className="block text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                            {isPaid ? t("Status") : t("Remaining")}
                        </span>
                        <span
                            className={cn(
                                "block text-sm sm:text-base font-semibold tabular-nums",
                                isPaid
                                    ? "text-emerald-700 dark:text-emerald-400 font-bold"
                                    : invoice.balanceRemaining > 0
                                        ? "text-foreground"
                                        : "text-muted-foreground font-normal"
                            )}
                        >
                            {isPaid ? t("Settled") : formatPhpCurrency(invoice.balanceRemaining)}
                        </span>
                    </div>

                    <div className="hidden md:block text-right">
                        <span className="block text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                            {t("Due Date")}
                        </span>
                        <span className="block text-xs sm:text-sm font-normal text-muted-foreground">
                            {formatDateLong(invoice.dueDate)}
                        </span>
                    </div>

                    {/* Action Trigger */}
                    <div className="pl-1 shrink-0">
                        {isAttention ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-500 px-3 py-1.5 text-xs font-bold shadow-xs transition-all shrink-0">
                                <span>{t("Review")}</span>
                                <ChevronRight className="size-3.5" />
                            </span>
                        ) : isLate ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 px-3 py-1.5 text-xs font-bold transition-all shrink-0">
                                <span>{t("Remind")}</span>
                                <ChevronRight className="size-3.5" />
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground px-3 py-1.5 text-xs font-medium transition-all shrink-0">
                                <span>{t("View")}</span>
                                <ChevronRight className="size-3.5" />
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
}
