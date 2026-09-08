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
                    badgeClass: "bg-primary/10 text-primary border-primary/20",
                    dotClass: "bg-primary",
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
                    badgeClass: "bg-primary/10 text-primary border-primary/20",
                    dotClass: "bg-primary",
                };
            case "properties":
                return {
                    label: "Properties & Units",
                    icon: Building2,
                    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
                    dotClass: "bg-sky-500",
                };
            default:
                return {
                    label: "Activity",
                    icon: Clock,
                    badgeClass: "bg-muted text-muted-foreground border-border",
                    dotClass: "bg-muted-foreground",
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
                            <div className="size-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                                <ShieldCheck className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                                    Activity & Audit Logs
                                </h2>
                                <p className="text-xs text-muted-foreground">
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
                            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl neumorphic-extruded hover:text-primary text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw className={cn("size-3.5", loading && "animate-spin text-primary")} />
                            <span>Refresh</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleExportCsv}
                            disabled={isExporting || logs.length === 0}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl neumorphic-primary text-primary-foreground text-xs font-black transition-all shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                        >
                            <Download className="size-3.5" />
                            <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
                        </button>
                    </div>
                </div>

                {/* Ethical Privacy Guarantee Banner */}
                <div className="flex items-start gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground leading-relaxed">
                    <Lock className="size-4 shrink-0 text-primary mt-0.5" />
                    <div>
                        <span className="font-bold text-foreground">Ethical Logging Standard (OWASP & GDPR Article 30): </span>
                        <span>
                            All events are append-only and strictly isolated to your workspace. Passwords, auth tokens, private chat texts, and financial secrets are never logged.
                        </span>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="space-y-3">
                <div className="flex flex-col md:flex-row items-center gap-3">
                    {/* Search Input */}
                    <div className="relative w-full md:flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by action, resident, or invoice ID..."
                            className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm text-foreground bg-card/60 border border-border rounded-2xl focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Category Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-2xl border border-border/40 overflow-x-auto w-full md:w-auto scrollbar-hide">
                        {["all", "billing", "security", "settings", "properties"].map((cat) => {
                            const isCatActive = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap cursor-pointer",
                                        isCatActive
                                            ? "neumorphic-panel text-primary font-black shadow-sm border-primary/30 ring-1 ring-primary/20"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                    )}
                                >
                                    {cat === "all" ? "All Logs" : cat}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Logs Timeline List (Paginated & Clean) */}
            <div className="space-y-2.5">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2 text-xs">
                        <RefreshCw className="size-5 animate-spin text-primary" />
                        Loading activity logs...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-border rounded-3xl space-y-2 text-muted-foreground">
                        <ShieldCheck className="size-8 text-muted-foreground/40 mx-auto" />
                        <p className="text-sm font-bold text-foreground">No activity logs found</p>
                        <p className="text-xs">Actions you perform across the dashboard will appear here in real time.</p>
                    </div>
                ) : (
                    paginatedLogs.map((log) => {
                        const catInfo = getCategoryDetails(log.category);
                        const Icon = catInfo.icon;

                        return (
                            <div
                                key={log.id}
                                className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/30 transition-all gap-3 shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                    <div className={cn("size-10 rounded-2xl flex items-center justify-center shrink-0 border", catInfo.badgeClass)}>
                                        <Icon className="size-4" />
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
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
                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                            {log.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                                    <div className="text-left sm:text-right">
                                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                                            <Clock className="size-3 text-muted-foreground/60" />
                                            <ClientOnlyDate date={log.createdAt} format={{ month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }} />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground/80 block font-mono">
                                            {log.device || "Web Application"}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setInspectingLog(log)}
                                        className="size-8 rounded-xl neumorphic-extruded flex items-center justify-center text-muted-foreground hover:text-primary transition-all cursor-pointer"
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/80 text-xs">
                    <span className="text-muted-foreground font-medium">
                        Showing <strong className="font-bold text-foreground">{(currentPage - 1) * PAGE_SIZE + 1}</strong> to <strong className="font-bold text-foreground">{Math.min(currentPage * PAGE_SIZE, logs.length)}</strong> of <strong className="font-bold text-foreground">{logs.length}</strong> activities
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl neumorphic-extruded font-bold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                                        "size-7 rounded-xl font-bold transition-all text-xs flex items-center justify-center cursor-pointer",
                                        currentPage === pageNum
                                            ? "neumorphic-primary text-primary-foreground font-black shadow-sm shadow-primary/20"
                                            : "neumorphic-extruded text-muted-foreground hover:text-foreground"
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
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl neumorphic-extruded font-bold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                            className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                                        <FileText className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-foreground">Audit Event Details</h3>
                                        <p className="text-xs text-muted-foreground font-mono">ID: {inspectingLog.id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setInspectingLog(null)}
                                    className="size-8 rounded-xl neumorphic-extruded flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">Action Code</span>
                                    <span className="font-mono font-bold text-foreground">{inspectingLog.action}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">Category</span>
                                    <span className="font-bold text-primary uppercase tracking-wider">{inspectingLog.category}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">Recorded At</span>
                                    <span className="font-medium text-foreground">
                                        {new Date(inspectingLog.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">Client / Device</span>
                                    <span className="font-medium text-foreground">{inspectingLog.device || "Web Browser"}</span>
                                </div>
                            </div>

                            {/* JSON Payload Inspector */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground">
                                    Sanitized Event Metadata
                                </label>
                                <pre className="p-3.5 rounded-2xl bg-muted/80 text-primary text-[11px] font-mono overflow-x-auto max-h-48 border border-border/40 custom-scrollbar-premium">
                                    {JSON.stringify(inspectingLog.metadata, null, 2)}
                                </pre>
                            </div>

                            <button
                                onClick={() => setInspectingLog(null)}
                                className="w-full py-3 rounded-xl neumorphic-extruded hover:text-primary text-xs font-bold text-foreground transition-all cursor-pointer"
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
