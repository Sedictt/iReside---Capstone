"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { 
    AlertTriangle, 
    Ban, 
    CheckCircle2, 
    Clock3, 
    Filter, 
    Plus, 
    ShieldAlert, 
    ArrowRight, 
    RotateCcw, 
    Trash2, 
    Search,
    MessageSquare,
    User,
    Calendar,
    ChevronDown,
    Flag,
    ChevronRight,
    Maximize2
} from "lucide-react";
import { m as motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

type ReportRow = {
    id: string;
    conversationId: string | null;
    category: string;
    details: string;
    status: ReportStatus;
    exactMessage: string | null;
    reportedMessageId: string | null;
    reportedMessage:
        | {
              id: string | null;
              conversationId: string | null;
              senderId: string | null;
              type: string;
              content: string;
              createdAt: string;
          }
        | null;
    screenshots?: Array<{ fileName: string; mimeType: string; size: number | null; url: string }>;
    createdAt: string;
    reporter: { id: string; name: string; email: string } | null;
    target: { id: string; name: string; email: string } | null;
};

type BannedTerm = {
    id: string;
    term: string;
    normalizedTerm: string;
    source: string;
    reportId: string | null;
    isActive: boolean;
    createdAt: string;
};

const STATUS_OPTIONS: ReportStatus[] = ["open", "reviewing", "resolved", "dismissed"];

export default function AdminChatModerationPage() {
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [terms, setTerms] = useState<BannedTerm[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [addingTermId, setAddingTermId] = useState<string | null>(null);
    const [manualTerm, setManualTerm] = useState("");
    const [isAddingManualTerm, setIsAddingManualTerm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [termSearchQuery, setTermSearchQuery] = useState("");

    const loadData = useCallback(async () => {
        setError(null);
        setLoading(true);

        try {
            const [reportsResponse, termsResponse] = await Promise.all([
                fetch("/api/admin/chat-moderation/reports"),
                fetch("/api/admin/chat-moderation/terms"),
            ]);

            const reportsPayload = (await reportsResponse.json().catch(() => null)) as
                | { reports?: ReportRow[]; error?: string }
                | null;
            const termsPayload = (await termsResponse.json().catch(() => null)) as
                | { terms?: BannedTerm[]; error?: string }
                | null;

            if (!reportsResponse.ok) {
                throw new Error(reportsPayload?.error ?? "Failed to load report queue.");
            }
            if (!termsResponse.ok) {
                throw new Error(termsPayload?.error ?? "Failed to load banned terms.");
            }

            setReports(reportsPayload?.reports ?? []);
            setTerms(termsPayload?.terms ?? []);
        } catch (fetchError) {
            const message = fetchError instanceof Error ? fetchError.message : "Failed to load moderation data.";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const filteredReports = useMemo(() => {
        return reports.filter((report) => {
            const matchesStatus = statusFilter === "all" || report.status === statusFilter;
            const matchesCategory = categoryFilter === "all" || report.category === categoryFilter;
            return matchesStatus && matchesCategory;
        });
    }, [reports, statusFilter, categoryFilter]);

    const filteredTerms = useMemo(() => {
        if (!termSearchQuery.trim()) return terms;
        const q = termSearchQuery.toLowerCase();
        return terms.filter(t => t.term.toLowerCase().includes(q));
    }, [terms, termSearchQuery]);

    const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        setExpandedReports(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const categories = useMemo(() => {
        return Array.from(new Set(reports.map((report) => report.category))).sort();
    }, [reports]);

    const updateReportStatus = useCallback(async (reportId: string, status: ReportStatus) => {
        setSavingId(reportId);
        setError(null);
        try {
            const response = await fetch(`/api/admin/chat-moderation/reports/${reportId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) {
                throw new Error(payload?.error ?? "Failed to update report status.");
            }

            setReports((previous) => previous.map((report) => (report.id === reportId ? { ...report, status } : report)));
        } catch (statusError) {
            const message = statusError instanceof Error ? statusError.message : "Failed to update report status.";
            setError(message);
        } finally {
            setSavingId(null);
        }
    }, []);

    const addBannedTerm = useCallback(
        async (term: string, reportId: string | null) => {
            const trimmed = term.trim();
            if (trimmed.length < 2) {
                setError("Banned term must be at least 2 characters.");
                return;
            }

            if (reportId) {
                setAddingTermId(reportId);
            } else {
                setIsAddingManualTerm(true);
            }

            setError(null);
            try {
                const response = await fetch("/api/admin/chat-moderation/terms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ term: trimmed, reportId }),
                });
                const payload = (await response.json().catch(() => null)) as
                    | { term?: BannedTerm; error?: string }
                    | null;

                if (!response.ok) {
                    throw new Error(payload?.error ?? "Failed to add banned term.");
                }

                if (payload?.term) {
                    setTerms((previous) => [payload.term!, ...previous]);
                }

                if (reportId) {
                    setReports((previous) =>
                        previous.map((report) => (report.id === reportId ? { ...report, status: "resolved" } : report))
                    );
                } else {
                    setManualTerm("");
                }
            } catch (termError) {
                const message = termError instanceof Error ? termError.message : "Failed to add banned term.";
                setError(message);
            } finally {
                if (reportId) {
                    setAddingTermId(null);
                } else {
                    setIsAddingManualTerm(false);
                }
            }
        },
        []
    );

    return (
        <div className="mx-auto max-w-7xl space-y-8 px-4 pb-12 sm:px-6 lg:px-8">
            {/* Header Section */}
            <header className="relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-card p-10 shadow-2xl dark:border-white/5 dark:bg-neutral-900/40">
                <div className="absolute -right-20 -top-20 size-64 rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 size-64 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-500">
                            <ShieldAlert className="size-4" />
                            Safety Operations Center
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-4xl font-semibold tracking-tight text-foreground dark:text-white sm:text-5xl">
                                Moderation <span className="text-primary">Hub</span>
                            </h1>
                            <p className="max-w-2xl text-base font-medium text-muted-foreground dark:text-neutral-400">
                                Review flagged content, manage banned vocabulary, and enforce community standards across the iReside platform.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => void loadData()}
                            className="group flex items-center gap-2 rounded-2xl bg-muted/50 px-6 py-3.5 text-sm font-bold text-foreground transition-all hover:bg-muted hover:scale-105 active:scale-95 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                        >
                            <RotateCcw className={cn("size-4 transition-transform group-hover:rotate-180", loading && "animate-spin")} />
                            Sync Queue
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-500 animate-in slide-in-from-top-2">
                        <AlertTriangle className="size-5" />
                        {error}
                    </div>
                )}
            </header>

            <main className="grid gap-8 lg:grid-cols-12">
                {/* Reports Column */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-border/50 bg-card/50 p-6 backdrop-blur-sm dark:border-white/5 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Flag className="size-5 text-primary" />
                                <h2 className="text-sm font-semibold text-foreground dark:text-white uppercase tracking-wider">Report Queue</h2>
                            </div>
                            <div className="h-5 w-px bg-border/50" />
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                {filteredReports.length} Active Items
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Custom Status Dropdown */}
                            <div className="relative group/status">
                                <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-background/50 hover:bg-background hover:border-primary/50 transition-all text-xs font-bold text-foreground min-w-[140px] justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "size-1.5 rounded-full",
                                            statusFilter === "all" ? "bg-muted-foreground" :
                                            statusFilter === "open" ? "bg-red-500" :
                                            statusFilter === "reviewing" ? "bg-amber-500" :
                                            "bg-emerald-500"
                                        )} />
                                        <span className="capitalize">{statusFilter === "all" ? "All Status" : statusFilter}</span>
                                    </div>
                                    <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-hover/status:rotate-180" />
                                </button>
                                
                                <div className="absolute top-full left-0 mt-2 w-full min-w-[160px] rounded-2xl border border-border/50 bg-card/95 p-1.5 shadow-2xl backdrop-blur-2xl opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all z-50 transform origin-top translate-y-2 group-hover/status:translate-y-0">
                                    <button
                                        onClick={() => setStatusFilter("all")}
                                        className={cn(
                                            "w-full text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-colors",
                                            statusFilter === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                        )}
                                    >
                                        All Status
                                    </button>
                                    {STATUS_OPTIONS.map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-colors",
                                                statusFilter === status ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                            )}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Category Dropdown */}
                            <div className="relative group/cat">
                                <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-background/50 hover:bg-background hover:border-primary/50 transition-all text-xs font-bold text-foreground min-w-[160px] justify-between">
                                    <div className="flex items-center gap-2">
                                        <Filter className="size-3.5 text-muted-foreground" />
                                        <span className="truncate">{categoryFilter === "all" ? "All Categories" : categoryFilter}</span>
                                    </div>
                                    <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-hover/cat:rotate-180" />
                                </button>
                                
                                <div className="absolute top-full left-0 mt-2 w-full min-w-[180px] rounded-2xl border border-border/50 bg-card/95 p-1.5 shadow-2xl backdrop-blur-2xl opacity-0 invisible group-hover/cat:opacity-100 group-hover/cat:visible transition-all z-50 transform origin-top translate-y-2 group-hover/cat:translate-y-0">
                                    <button
                                        onClick={() => setCategoryFilter("all")}
                                        className={cn(
                                            "w-full text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-colors",
                                            categoryFilter === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                        )}
                                    >
                                        All Categories
                                    </button>
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategoryFilter(cat)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-colors",
                                                categoryFilter === cat ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={`chat-moderation-skeleton-${i}`} className="h-24 w-full animate-pulse rounded-[2rem] bg-card/50 dark:bg-white/[0.02]" />
                            ))}
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-border/50 bg-card/20 py-20 text-center">
                            <CheckCircle2 className="size-12 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground dark:text-white uppercase tracking-widest">Queue Clear</h3>
                            <p className="text-sm text-muted-foreground">Everything is under control.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <AnimatePresence initial={false}>
                                {filteredReports.map((report) => (
                                    <ModerationReportCard
                                        key={report.id}
                                        report={report}
                                        isExpanded={expandedReports.has(report.id)}
                                        onToggle={() => toggleExpand(report.id)}
                                        updateReportStatus={updateReportStatus}
                                        addBannedTerm={addBannedTerm}
                                        savingId={savingId}
                                        addingTermId={addingTermId}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Terms Column */}
                <aside className="lg:col-span-4 space-y-6">
                    <div className="rounded-[2.5rem] border border-border/50 bg-card p-8 shadow-xl dark:border-white/5 dark:bg-neutral-900/40">
                        <div className="mb-6 space-y-2">
                            <h2 className="text-lg font-semibold text-foreground dark:text-white uppercase tracking-wider">Vocabulary</h2>
                            <p className="text-xs font-medium text-muted-foreground">Manage active banned filters.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">Manual Entry</label>
                                <div className="flex flex-col gap-3">
                                    <input
                                        value={manualTerm}
                                        onChange={(event) => setManualTerm(event.target.value)}
                                        placeholder="Enter term..."
                                        className="w-full rounded-2xl border border-border bg-background/50 px-5 py-4 text-sm font-bold text-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none dark:border-white/10 dark:bg-black/40"
                                    />
                                    <button
                                        onClick={() => void addBannedTerm(manualTerm, null)}
                                        disabled={isAddingManualTerm || manualTerm.trim().length < 2}
                                        className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                                    >
                                        <Plus className="size-4" />
                                        Add Term
                                    </button>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border/50 dark:border-white/5">
                                <div className="relative mb-4">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={termSearchQuery}
                                        onChange={(e) => setTermSearchQuery(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full rounded-2xl border border-border bg-background/50 pl-12 pr-5 py-3 text-sm font-bold text-foreground focus:border-primary/50 outline-none dark:border-white/10 dark:bg-black/40"
                                    />
                                </div>

                                <div className="custom-scrollbar max-h-[450px] space-y-2 overflow-y-auto pr-2">
                                    {filteredTerms.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <p className="text-xs font-bold text-muted-foreground/40 italic">No matches found.</p>
                                        </div>
                                    ) : (
                                        filteredTerms.map((term) => (
                                            <div 
                                                key={term.id} 
                                                className="flex items-center justify-between rounded-2xl border border-border bg-background/50 p-4 transition-all hover:border-primary/20 hover:bg-muted/20 dark:border-white/5 dark:bg-black/20"
                                            >
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-semibold text-foreground dark:text-white">{term.term}</span>
                                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{term.source}</span>
                                                </div>
                                                {term.reportId && (
                                                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                                                        <ArrowRight className="size-3" />
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
}

/**
 * Individual Report Card Component
 * Handles its own expanded/collapsed states
 */
function ModerationReportCard({ 
    report, 
    isExpanded, 
    onToggle, 
    updateReportStatus, 
    addBannedTerm, 
    savingId, 
    addingTermId 
}: { 
    report: ReportRow; 
    isExpanded: boolean; 
    onToggle: () => void;
    updateReportStatus: (id: string, status: ReportStatus) => Promise<void>;
    addBannedTerm: (term: string, reportId: string) => Promise<void>;
    savingId: string | null;
    addingTermId: string | null;
}) {
    return (
        <motion.article 
            layout
            variants={{
                initial: { y: 0 },
                hover: { y: -4 }
            }}
            initial="initial"
            animate="initial"
            whileHover="hover"
            className={cn(
                "group relative rounded-[2rem] border border-border/50 bg-card shadow-sm transition-all hover:border-primary/30",
                isExpanded ? "ring-2 ring-primary/20 shadow-xl" : "hover:shadow-md cursor-pointer"
            )}
        >
            {/* Status Indicator Stripe (Refined Gradient) */}
            <div className={cn(
                "h-1 w-full shrink-0 opacity-60 transition-opacity group-hover:opacity-100",
                report.status === "open" ? "bg-gradient-to-r from-transparent via-red-500 to-transparent" :
                report.status === "reviewing" ? "bg-gradient-to-r from-transparent via-amber-500 to-transparent" :
                report.status === "resolved" ? "bg-gradient-to-r from-transparent via-emerald-500 to-transparent" :
                "bg-neutral-500/20"
            )} />

            {/* Hover Preview Popout (Only when collapsed) */}
            {!isExpanded && (
                <div className="pointer-events-none absolute left-1/2 -top-14 z-[100] -translate-x-1/2 opacity-0 invisible translate-y-2 scale-95 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:visible group-hover:-translate-y-1 group-hover:scale-100">
                    <div className="relative rounded-2xl border border-primary/30 bg-card px-6 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl min-w-[320px] max-w-md">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-semibold uppercase tracking-widest text-primary">Incident Insight</span>
                            <p className="text-sm font-medium leading-relaxed text-foreground italic">
                                &quot;{report.details || "No additional context provided."}&quot;
                            </p>
                        </div>
                        {/* Tooltip Arrow */}
                        <div className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-b border-r border-primary/30 bg-card" />
                    </div>
                </div>
            )}

            {/* Collapsed / Summary View */}
            <div 
                onClick={onToggle}
                className="flex items-center gap-6 p-6 md:px-8"
            >
                <div className="flex flex-1 items-center min-w-0">
                    {/* Compact Identity Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 lg:flex-none lg:w-80">
                        <div className="size-10 shrink-0 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <User className="size-5 text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground truncate">{report.reporter?.name || "Anon"}</span>
                                <ArrowRight className="size-3.5 text-muted-foreground/30" />
                                <span className="text-sm font-semibold text-primary truncate">{report.target?.name || "Target"}</span>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{report.category}</span>
                        </div>
                    </div>

                    {/* Meta Info (Right aligned) */}
                    <div className="hidden md:flex items-center gap-6 ml-auto mr-4 text-[10px] font-semibold uppercase tracking-[0.15em]">
                        <div className="flex items-center gap-2 text-muted-foreground/60">
                            <Calendar className="size-3.5" />
                            <span suppressHydrationWarning>{new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="h-3 w-px bg-border/50" />
                        <div className={cn(
                            "px-3 py-1 rounded-full border shadow-sm",
                            report.status === "open" ? "text-red-500 border-red-500/20 bg-red-500/5" :
                            report.status === "reviewing" ? "text-amber-500 border-amber-500/20 bg-amber-500/5" :
                            report.status === "resolved" ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" :
                            "text-neutral-500 border-neutral-500/10 bg-neutral-500/5"
                        )}>
                            {report.status}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted/50 border border-border group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
                        {isExpanded ? (
                            <ChevronDown className="size-5 text-primary" />
                        ) : (
                            <Maximize2 className="size-4 text-muted-foreground group-hover:text-primary" />
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Detailed View */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="border-t border-border/50 p-0">
                            <div className="flex flex-col">
                                {/* Case Details Grid */}
                                <div className="grid lg:grid-cols-2 border-b border-border/50">
                                    {/* Left: Reporter Side */}
                                    <div className="flex flex-col p-8 border-r border-border/50 bg-muted/10 dark:bg-white/[0.01]">
                                        <div className="mb-10 flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">
                                                <MessageSquare className="size-3.5" />
                                                Reporter&apos;s Statement
                                            </div>
                                            {/* Vertical spacer to match the Right side's System ID height */}
                                            <div className="h-[14px]" />
                                        </div>

                                        <div className="flex-1 flex items-center justify-center">
                                            <p className="text-xl font-medium leading-relaxed text-foreground dark:text-neutral-300 italic text-center max-w-sm">
                                                &quot;{report.details || "No additional context provided by the reporter."}&quot;
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 mt-12">
                                            <div className="size-8 rounded-full bg-background border border-border flex items-center justify-center">
                                                <User className="size-4 text-muted-foreground/40" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-muted-foreground">Reported by {report.reporter?.name || "Anon"}</span>
                                                <span className="text-[10px] text-muted-foreground/60">{report.reporter?.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Evidence Side */}
                                    <div className="flex flex-col p-8 bg-red-500/[0.02]">
                                        <div className="mb-10 flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-500/80">
                                                <ShieldAlert className="size-3.5" />
                                                Flagged Evidence
                                            </div>
                                            <div className="pl-5.5">
                                                <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-tighter">System ID: {report.reportedMessageId || report.id}</span>
                                            </div>
                                        </div>

                                        <div className="flex-1 flex items-center justify-center">
                                            {report.reportedMessage ? (
                                                <div className="relative bg-transparent py-2 overflow-hidden w-full">
                                                    <p className="text-xl font-semibold text-foreground dark:text-neutral-200 leading-relaxed italic text-center">
                                                        &quot;{report.reportedMessage.content}&quot;
                                                    </p>
                                                </div>
                                            ) : report.exactMessage ? (
                                                <div className="relative bg-transparent py-2 overflow-hidden w-full">
                                                    <p className="text-xl font-semibold text-foreground dark:text-neutral-200 leading-relaxed italic text-center">
                                                        "{report.exactMessage}"
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/50 bg-muted/10 w-full">
                                                    <ShieldAlert className="size-10 text-muted-foreground/20 mb-3" />
                                                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">No Direct Logs Available</span>
                                                </div>
                                            )}
                                        </div>

                                        {report.target && (
                                                <>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-primary">Target: {report.target.name}</span>
                                                        <span className="text-[10px] text-muted-foreground/60">{report.target.email}</span>
                                                    </div>
                                                    <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                                        <User className="size-4 text-primary" />
                                                    </div>
                                                </>
                                            )}
                                    </div>
                                </div>

                                {/* Action Tray Footer */}
                                <div className="flex items-center justify-between p-6 bg-muted/5 dark:bg-white/[0.01]">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => void updateReportStatus(report.id, "dismissed")}
                                            disabled={savingId === report.id}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95 text-[11px] font-semibold uppercase tracking-widest"
                                        >
                                            <Trash2 className="size-4" />
                                            Dismiss Case
                                        </button>
                                        
                                        {report.exactMessage && (
                                            <button
                                                onClick={() => void addBannedTerm(report.exactMessage!, report.id)}
                                                disabled={addingTermId === report.id}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95 text-[11px] font-semibold uppercase tracking-widest border border-red-500/10"
                                            >
                                                <Ban className="size-4" />
                                                Add to Banned Terms
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => void updateReportStatus(report.id, "resolved")}
                                        disabled={savingId === report.id}
                                        className="flex items-center gap-3 px-8 py-3 rounded-xl bg-emerald-500 text-white text-[11px] font-semibold uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                                    >
                                        <CheckCircle2 className="size-4" />
                                        Mark as Resolved
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.article>
    );
}
