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
            case "paid": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "overdue": return "bg-red-500/10 text-red-400 border-red-500/20";
            case "pending": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            default: return "bg-white/5 text-neutral-400 border-white/10";
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
        <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">Invoices</h1>
                    <p className="text-neutral-400">Manage billing, track payments, and send reminders.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium flex items-center gap-2 hover:bg-white/10 transition-colors">
                        <Download className="w-4 h-4" /> Export Report
                    </button>
                    <button className="h-11 px-6 rounded-xl bg-primary text-black font-bold flex items-center gap-2 hover:bg-primary/90 hover:scale-105 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                        <Plus className="w-5 h-5" /> Create Invoice
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    {
                        label: "Total Outstanding",
                        value: loading ? "—" : formatCurrency(metrics.totalOutstanding),
                        icon: Clock,
                        color: "text-amber-400",
                        bg: "bg-amber-500/10",
                    },
                    {
                        label: "Overdue Amount",
                        value: loading ? "—" : formatCurrency(metrics.overdueAmount),
                        icon: AlertCircle,
                        color: "text-red-400",
                        bg: "bg-red-500/10",
                    },
                    {
                        label: "Collected (30 Days)",
                        value: loading ? "—" : formatCurrency(metrics.collectedLast30Days),
                        icon: CheckCircle2,
                        color: "text-emerald-400",
                        bg: "bg-emerald-500/10",
                    },
                    {
                        label: "Total Invoices",
                        value: loading ? "—" : metrics.totalInvoices.toLocaleString(),
                        icon: FileText,
                        color: "text-blue-400",
                        bg: "bg-blue-500/10",
                    },
                ].map((stat, i) => (
                    <div key={i} className="bg-[#111] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-all">
                        <div className={cn("absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-all opacity-50 group-hover:opacity-100", stat.bg)} />
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-2">{stat.label}</p>
                                <p className="text-3xl font-black text-white">{stat.value}</p>
                            </div>
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#111] p-2 rounded-2xl border border-white/5">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search invoices by tenant or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-none pl-11 pr-4 py-3 text-sm text-white focus:outline-none placeholder:text-neutral-600 font-medium"
                    />
                </div>
                <div className="w-px h-8 bg-white/10 hidden sm:block" />
                <div className="flex items-center w-full sm:w-auto overflow-x-auto hide-scrollbar gap-2 px-2 pb-2 sm:pb-0">
                    {['All', 'Pending', 'Overdue', 'Paid'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all",
                                statusFilter === status
                                    ? "bg-white/10 text-white"
                                    : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                    <button className="px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2">
                        <Filter className="w-4 h-4" /> <span className="text-sm font-medium">Filters</span>
                    </button>
                </div>
            </div>

            {/* Invoices List */}
            <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-5 text-xs font-bold text-neutral-500 uppercase tracking-widest">Invoice Details</th>
                                <th className="px-6 py-5 text-xs font-bold text-neutral-500 uppercase tracking-widest hidden md:table-cell">Tenant & Property</th>
                                <th className="px-6 py-5 text-xs font-bold text-neutral-500 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-5 text-xs font-bold text-neutral-500 uppercase tracking-widest hidden lg:table-cell">Dates</th>
                                <th className="px-6 py-5 text-xs font-bold text-neutral-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 shrink-0" />
                                                    <div className="space-y-2">
                                                        <div className="h-4 w-24 bg-white/10 rounded" />
                                                        <div className="flex gap-2">
                                                            <div className="h-4 w-16 bg-white/5 rounded" />
                                                            <div className="h-4 w-12 bg-white/5 rounded" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 hidden md:table-cell">
                                                <div className="space-y-2">
                                                    <div className="h-4 w-32 bg-white/10 rounded" />
                                                    <div className="h-3 w-24 bg-white/5 rounded" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="h-5 w-20 bg-white/10 rounded" />
                                            </td>
                                            <td className="px-6 py-5 hidden lg:table-cell">
                                                <div className="space-y-2">
                                                    <div className="h-4 w-20 bg-white/10 rounded" />
                                                    <div className="h-3 w-16 bg-white/5 rounded" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-end gap-2">
                                                    <div className="h-8 w-8 bg-white/5 rounded-lg" />
                                                    <div className="h-8 w-8 bg-white/5 rounded-lg" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            ) : error ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-sm text-red-300">
                                        {error}
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {filteredInvoices.map((invoice, idx) => (
                                <tr key={invoice.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 50}ms` }}>

                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 group-hover:text-primary transition-colors shrink-0">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm mb-1">{invoice.id}</p>
                                                <div className="flex items-center gap-2">
                                                            <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1", getStatusStyle(invoice.status))}>
                                                                {getStatusIcon(invoice.status)} {invoice.status}
                                                            </span>
                                                    <span className="text-xs text-neutral-500 bg-white/5 px-2 py-0.5 rounded-md">{invoice.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-5 hidden md:table-cell">
                                        <div>
                                            <p className="font-bold text-white text-sm mb-1">{invoice.tenant}</p>
                                            <p className="text-xs text-neutral-500 truncate max-w-[200px]">{invoice.property} • {invoice.unit}</p>
                                        </div>
                                    </td>

                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <p className="font-black text-white text-base">{formatCurrency(invoice.amount)}</p>
                                            <p className="text-xs text-neutral-500 mt-0.5">PHP</p>
                                        </div>
                                    </td>

                                    <td className="px-6 py-5 hidden lg:table-cell">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="text-neutral-500 w-12">Issued:</span>
                                                <span className="text-neutral-300 font-medium">{formatDate(invoice.issuedDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className={cn("w-12", invoice.status === 'overdue' ? 'text-red-400 font-bold' : 'text-neutral-500')}>Due:</span>
                                                <span className={cn("font-bold", invoice.status === 'overdue' ? 'text-red-400' : 'text-white')}>
                                                    {formatDate(invoice.dueDate)}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-end gap-2 text-neutral-400">
                                            {invoice.status === 'overdue' && (
                                                <button className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 flex items-center justify-center transition-all" title="Send Reminder">
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => setSelectedInvoice(invoice)}
                                                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors" 
                                                title="View Invoice"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors" title="Download PDF">
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>

                                </tr>
                            ))}

                                    {filteredInvoices.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center">
                                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 mx-auto mb-4">
                                                    <Search className="w-6 h-6" />
                                                </div>
                                                <p className="text-white font-bold mb-1">No invoices found</p>
                                                <p className="text-sm text-neutral-500">Try adjusting your search criteria or filters.</p>
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
