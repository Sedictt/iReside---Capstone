"use client";

import { useEffect, useState } from "react";
import {
    Search,
    Filter,
    MoreVertical,
    FileText,
    Download,
    AlertCircle,
    CheckCircle2,
    Clock,
    Plus,
    Send,
    Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InvoiceModal, Invoice } from "@/components/landlord/invoices/InvoiceModal";

type InvoiceStatus = "paid" | "pending" | "overdue";
type InvoiceMetrics = {
    totalOutstanding: number;
    overdueAmount: number;
    collectedLast30Days: number;
    totalInvoices: number;
};

const formatCurrency = (value: number | null) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "Not provided";
    }

    return `₱${value.toLocaleString()}`;
};

const formatDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not set";
    return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function InvoicesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Overdue" | "Paid">("All");
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [metrics, setMetrics] = useState<InvoiceMetrics>({
        totalOutstanding: 0,
        overdueAmount: 0,
        collectedLast30Days: 0,
        totalInvoices: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const loadInvoices = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch("/api/landlord/invoices", {
                    method: "GET",
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error("Failed to load invoices");
                }

                const payload = (await response.json()) as {
                    invoices?: Invoice[];
                    metrics?: InvoiceMetrics;
                };

                setInvoices(Array.isArray(payload.invoices) ? payload.invoices : []);
                if (payload.metrics) {
                    setMetrics(payload.metrics);
                }
            } catch (fetchError) {
                if ((fetchError as Error).name === "AbortError") {
                    return;
                }

                setError("Unable to load invoices right now.");
                setInvoices([]);
                setMetrics({
                    totalOutstanding: 0,
                    overdueAmount: 0,
                    collectedLast30Days: 0,
                    totalInvoices: 0,
                });
            } finally {
                setLoading(false);
            }
        };

        void loadInvoices();

        return () => {
            controller.abort();
        };
    }, []);

    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch = invoice.tenant.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All" || invoice.status === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status: InvoiceStatus) => {
        switch (status) {
            case "paid": return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
            case "overdue": return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300";
            case "pending": return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
            default: return "border-border bg-muted text-muted-foreground";
        }
    };

    const getStatusIcon = (status: InvoiceStatus) => {
        switch (status) {
            case "paid": return <CheckCircle2 className="w-4 h-4" />;
            case "overdue": return <AlertCircle className="w-4 h-4" />;
            case "pending": return <Clock className="w-4 h-4" />;
            default: return null;
        }
    };

    return (
        <div className="mx-auto min-h-screen max-w-7xl space-y-8 px-6 py-8 text-foreground animate-in fade-in duration-500 sm:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-muted/35 p-8 shadow-sm">
                <div className="absolute right-0 top-0 h-[420px] w-[420px] -translate-y-1/2 translate-x-1/3 rounded-full bg-primary/16 blur-[120px] opacity-45 dark:bg-primary/20 dark:opacity-50" />
                <div className="absolute bottom-0 left-0 h-[260px] w-[260px] translate-y-1/2 -translate-x-1/3 rounded-full bg-emerald-500/12 blur-[100px] opacity-35 dark:bg-emerald-500/20 dark:opacity-30" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-md">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            <span>Billing Operations</span>
                        </div>
                        <h1 className="mb-2 text-4xl font-black tracking-tight text-foreground md:text-5xl">Invoices</h1>
                        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                            Manage billing, track payment standing, and follow up on overdue balances across your active leases.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background/75 px-4 font-medium text-foreground transition-all hover:bg-muted/70">
                            <Download className="h-4 w-4" /> Export Report
                        </button>
                        <button className="flex h-11 items-center gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-[0_14px_30px_-18px_rgba(var(--primary-rgb),0.65)] transition-all hover:bg-primary/90">
                            <Plus className="h-5 w-5" /> Create Invoice
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                {[
                    {
                        label: "Total Outstanding",
                        value: loading ? "—" : formatCurrency(metrics.totalOutstanding),
                        icon: Clock,
                        color: "text-amber-700 dark:text-amber-300",
                        bg: "bg-amber-500/10",
                    },
                    {
                        label: "Overdue Amount",
                        value: loading ? "—" : formatCurrency(metrics.overdueAmount),
                        icon: AlertCircle,
                        color: "text-red-700 dark:text-red-300",
                        bg: "bg-red-500/10",
                    },
                    {
                        label: "Collected (30 Days)",
                        value: loading ? "—" : formatCurrency(metrics.collectedLast30Days),
                        icon: CheckCircle2,
                        color: "text-emerald-700 dark:text-emerald-300",
                        bg: "bg-emerald-500/10",
                    },
                    {
                        label: "Total Invoices",
                        value: loading ? "—" : metrics.totalInvoices.toLocaleString(),
                        icon: FileText,
                        color: "text-blue-700 dark:text-blue-300",
                        bg: "bg-blue-500/10",
                    },
                ].map((stat, i) => (
                    <div key={i} className="group relative overflow-hidden rounded-2xl border border-border bg-card/95 p-6 shadow-sm transition-all hover:border-primary/15">
                        <div className={cn("absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl opacity-50 transition-all group-hover:opacity-100", stat.bg)} />
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <p className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                                <p className="text-3xl font-black text-foreground">{stat.value}</p>
                            </div>
                            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stat.bg, stat.color)}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/95 p-2 shadow-sm sm:flex-row">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search invoices by tenant or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-transparent bg-transparent py-3 pl-11 pr-4 text-sm font-medium text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary/30 focus:bg-background focus:outline-none"
                    />
                </div>
                <div className="hidden h-8 w-px bg-border sm:block" />
                <div className="flex items-center w-full sm:w-auto overflow-x-auto hide-scrollbar gap-2 px-2 pb-2 sm:pb-0">
                    {(["All", "Pending", "Overdue", "Paid"] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                                statusFilter === status
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                    <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground">
                        <Filter className="h-4 w-4" /> <span className="text-sm font-medium">Filters</span>
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border bg-card/95 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-muted/35">
                                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Invoice Details</th>
                                <th className="hidden px-6 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground md:table-cell">Tenant & Property</th>
                                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Amount</th>
                                <th className="hidden px-6 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground lg:table-cell">Dates</th>
                                <th className="px-6 py-5 text-right text-xs font-bold uppercase tracking-widest text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 shrink-0 rounded-xl bg-muted" />
                                                    <div className="space-y-2">
                                                        <div className="h-4 w-24 rounded bg-muted" />
                                                        <div className="flex gap-2">
                                                            <div className="h-4 w-16 rounded bg-muted/70" />
                                                            <div className="h-4 w-12 rounded bg-muted/70" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 hidden md:table-cell">
                                                <div className="space-y-2">
                                                    <div className="h-4 w-32 rounded bg-muted" />
                                                    <div className="h-3 w-24 rounded bg-muted/70" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="h-5 w-20 rounded bg-muted" />
                                            </td>
                                            <td className="px-6 py-5 hidden lg:table-cell">
                                                <div className="space-y-2">
                                                    <div className="h-4 w-20 rounded bg-muted" />
                                                    <div className="h-3 w-16 rounded bg-muted/70" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-end gap-2">
                                                    <div className="h-8 w-8 rounded-lg bg-muted/70" />
                                                    <div className="h-8 w-8 rounded-lg bg-muted/70" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            ) : error ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-sm text-red-700 dark:text-red-300">
                                        {error}
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {filteredInvoices.map((invoice, idx) => (
                                <tr key={invoice.id} className="group cursor-pointer transition-colors hover:bg-muted/30 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 50}ms` }}>

                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background/75 text-muted-foreground transition-colors group-hover:border-primary/20 group-hover:text-primary">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="mb-1 text-sm font-bold text-foreground">{invoice.id}</p>
                                                <div className="flex items-center gap-2">
                                                            <span className={cn("flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", getStatusStyle(invoice.status))}>
                                                                {getStatusIcon(invoice.status)} {invoice.status}
                                                            </span>
                                                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{invoice.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-5 hidden md:table-cell">
                                        <div>
                                            <p className="mb-1 text-sm font-bold text-foreground">{invoice.tenant}</p>
                                            <p className="max-w-[200px] truncate text-xs text-muted-foreground">{invoice.property} • {invoice.unit}</p>
                                        </div>
                                    </td>

                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <p className="text-base font-black text-foreground">{formatCurrency(invoice.amount)}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">PHP</p>
                                        </div>
                                    </td>

                                    <td className="px-6 py-5 hidden lg:table-cell">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="w-12 text-muted-foreground">Issued:</span>
                                                <span className="font-medium text-foreground">{formatDate(invoice.issuedDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className={cn("w-12", invoice.status === "overdue" ? "font-bold text-red-700 dark:text-red-300" : "text-muted-foreground")}>Due:</span>
                                                <span className={cn("font-bold", invoice.status === "overdue" ? "text-red-700 dark:text-red-300" : "text-foreground")}>
                                                    {formatDate(invoice.dueDate)}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-end gap-2 text-muted-foreground">
                                            {invoice.status === "overdue" && (
                                                <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-700 transition-all hover:bg-red-500/20 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200" title="Send Reminder">
                                                    <Send className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => setSelectedInvoice(invoice)}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/75 transition-colors hover:border-primary/20 hover:bg-muted hover:text-foreground" 
                                                title="View Invoice"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/75 transition-colors hover:border-primary/20 hover:bg-muted hover:text-foreground" title="Download PDF">
                                                <Download className="h-4 w-4" />
                                            </button>
                                            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/75 transition-colors hover:border-primary/20 hover:bg-muted hover:text-foreground">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>

                                </tr>
                            ))}

                                    {filteredInvoices.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center">
                                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                    <Search className="h-6 w-6" />
                                                </div>
                                                <p className="mb-1 font-bold text-foreground">No invoices found</p>
                                                <p className="text-sm text-muted-foreground">Try adjusting your search criteria or filters.</p>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedInvoice && (
                <InvoiceModal 
                    invoice={selectedInvoice} 
                    onClose={() => setSelectedInvoice(null)} 
                />
            )}
        </div>
    );
}
