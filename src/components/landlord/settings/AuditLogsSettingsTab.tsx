"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
    ShieldCheck,
    Search,
    Download,
    RefreshCw,
    Filter,
    CreditCard,
    Shield,
    SlidersHorizontal,
    Building2,
    Clock,
    Laptop,
    CheckCircle2,
    AlertTriangle,
    Info,
    X,
    FileText,
    ExternalLink,
    ChevronRight,
    ChevronLeft,
    Lock,
    Sparkles,
    Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ClientOnlyDate } from "@/components/ui/client-only-date";

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

export function AuditLogsSettingsTab() {
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
            toast.error("Unable to load activity logs.");
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, selectedSeverity, searchQuery]);

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
            toast.success("Audit log CSV exported successfully!");
        } catch (err: any) {
            console.error("Export error:", err);
            toast.error("Failed to export audit log.");
        } finally {
            setIsExporting(false);
        }
    };

    // Category Badge Details
    const getCategoryDetails = (cat: string) => {
        switch (cat) {
            case "billing":
                return {
                    label: "Billing & Invoices",
                    icon: CreditCard,
                    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                    dotClass: "bg-emerald-500",
                };
            case "security":
                return {
                    label: "Security & Auth",
                    icon: Shield,
                    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                    dotClass: "bg-amber-500",
                };
            case "settings":
                return {
                    label: "Settings & Profile",
                    icon: SlidersHorizontal,
                    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
                    dotClass: "bg-indigo-500",
                };
            case "properties":
                return {
                    label: "Properties & Units",
                    icon: Building2,
                    badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
                    dotClass: "bg-cyan-500",
                };
            default:
                return {
                    label: "Activity",
                    icon: Clock,
                    badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
                    dotClass: "bg-slate-500",
                };
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* Header & Transparency Notice */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                                <ShieldCheck className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Activity & Audit Logs
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-neutral-400">
                                    Tamper-proof chronological trail of account, billing, and security actions.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => fetchLogs()}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-neutral-200 transition-colors"
                        >
                            <RefreshCw className={cn("size-3.5", loading && "animate-spin text-emerald-500")} />
                            <span>Refresh</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleExportCsv}
                            disabled={isExporting || logs.length === 0}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                        >
                            <Download className="size-3.5" />
                            <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
                        </button>
                    </div>
                </div>

                {/* Ethical Privacy Guarantee Banner */}
                <div className="flex items-start gap-3 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-slate-600 dark:text-emerald-200/90 leading-relaxed">
                    <Lock className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                    <div>
                        <span className="font-bold text-slate-900 dark:text-white">Ethical Logging Standard (OWASP & GDPR Article 30): </span>
                        <span>
                            All events are append-only and strictly isolated to your workspace. Passwords, auth tokens, private chat texts, and financial secrets are never logged.
                        </span>
                    </div>
                </div>
            </div>

            {/* Metrics Bento Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 block">Total Activities</span>
                    <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
                </div>
                <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">Billing Actions</span>
                    <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.billingCount}</p>
                </div>
                <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-1">
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block">Security Events</span>
                    <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{stats.securityCount}</p>
                </div>
                <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 space-y-1">
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 block">Settings Changes</span>
                    <p className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.settingsCount}</p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="space-y-3">
                <div className="flex flex-col md:flex-row items-center gap-3">
                    {/* Search Input */}
                    <div className="relative w-full md:flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by action, resident, or invoice ID..."
                            className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-50/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder:text-slate-400"
                        />
                    </div>

                    {/* Category Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl overflow-x-auto w-full md:w-auto">
                        {["all", "billing", "security", "settings", "properties"].map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap",
                                    selectedCategory === cat
                                        ? "bg-white dark:bg-[#1e2330] text-slate-900 dark:text-white shadow-sm"
                                        : "text-slate-500 dark:text-neutral-400 hover:text-slate-900"
                                )}
                            >
                                {cat === "all" ? "All Logs" : cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Logs Timeline List (Paginated & Clean) */}
            <div className="space-y-2.5">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2 text-xs">
                        <RefreshCw className="size-5 animate-spin text-emerald-500" />
                        Loading activity logs...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-3xl space-y-2 text-slate-400">
                        <ShieldCheck className="size-8 text-slate-300 dark:text-white/20 mx-auto" />
                        <p className="text-sm font-bold text-slate-700 dark:text-neutral-300">No activity logs found</p>
                        <p className="text-xs">Actions you perform across the dashboard will appear here in real time.</p>
                    </div>
                ) : (
                    paginatedLogs.map((log) => {
                        const catInfo = getCategoryDetails(log.category);
                        const Icon = catInfo.icon;

                        return (
                            <div
                                key={log.id}
                                className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/40 dark:bg-white/[0.02] hover:bg-slate-100/60 dark:hover:bg-white/5 transition-all gap-3"
                            >
                                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                    <div className={cn("size-10 rounded-2xl flex items-center justify-center shrink-0 border", catInfo.badgeClass)}>
                                        <Icon className="size-4" />
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                                {log.title}
                                            </h4>
                                            <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border", catInfo.badgeClass)}>
                                                {log.category}
                                            </span>
                                            {log.severity === "warning" && (
                                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                    Warning
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                                            {log.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-white/5">
                                    <div className="text-left sm:text-right">
                                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-neutral-400">
                                            <Clock className="size-3 text-slate-400" />
                                            <ClientOnlyDate date={log.createdAt} format={{ month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }} />
                                        </div>
                                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 block font-mono">
                                            {log.device || "Web Application"}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setInspectingLog(log)}
                                        className="size-8 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white flex items-center justify-center transition-colors"
                                        title="View Metadata"
                                    >
                                        <Eye className="size-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination Controls Footer */}
            {logs.length > PAGE_SIZE && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10 text-xs">
                    <span className="text-slate-500 dark:text-neutral-400 font-medium">
                        Showing <strong className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * PAGE_SIZE + 1}</strong> to <strong className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * PAGE_SIZE, logs.length)}</strong> of <strong className="font-bold text-slate-900 dark:text-white">{logs.length}</strong> activities
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 font-bold text-slate-700 dark:text-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="size-3.5" />
                            <span>Previous</span>
                        </button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                <button
                                    key={pageNum}
                                    type="button"
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={cn(
                                        "size-7 rounded-xl font-bold transition-all text-xs flex items-center justify-center",
                                        currentPage === pageNum
                                            ? "bg-emerald-500 text-white shadow-sm"
                                            : "border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-white/10"
                                    )}
                                >
                                    {pageNum}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 font-bold text-slate-700 dark:text-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <span>Next</span>
                            <ChevronRight className="size-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Metadata Inspector Modal */}
            <AnimatePresence>
                {inspectingLog && (
                    <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131722] p-6 shadow-2xl space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                        <FileText className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white">Audit Event Details</h3>
                                        <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono">ID: {inspectingLog.id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setInspectingLog(null)}
                                    className="size-8 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-white/5">
                                    <span className="text-slate-500 dark:text-neutral-400">Action Code</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">{inspectingLog.action}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-white/5">
                                    <span className="text-slate-500 dark:text-neutral-400">Category</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{inspectingLog.category}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-white/5">
                                    <span className="text-slate-500 dark:text-neutral-400">Recorded At</span>
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {new Date(inspectingLog.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-white/5">
                                    <span className="text-slate-500 dark:text-neutral-400">Client / Device</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{inspectingLog.device || "Web Browser"}</span>
                                </div>
                            </div>

                            {/* JSON Payload Inspector */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 dark:text-neutral-400">
                                    Sanitized Event Metadata
                                </label>
                                <pre className="p-3.5 rounded-2xl bg-slate-900 text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-48 custom-scrollbar-premium">
                                    {JSON.stringify(inspectingLog.metadata, null, 2)}
                                </pre>
                            </div>

                            <button
                                onClick={() => setInspectingLog(null)}
                                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-xs font-bold text-slate-800 dark:text-white transition-all"
                            >
                                Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
