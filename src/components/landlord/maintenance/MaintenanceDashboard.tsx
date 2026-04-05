"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
    Wrench,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Search,
    Filter,
    Plus,
    MoreVertical,
    Calendar,
    Hammer,
    UserCircle2,
    ArrowRight,
    Image as ImageIcon
} from "lucide-react";
import { MaintenanceRequestModal } from "./MaintenanceRequestModal";

type Priority = "Critical" | "High" | "Medium" | "Low";
type Status = "Pending" | "Assigned" | "In Progress" | "Resolved";

export interface MaintenanceRequest {
    id: string;
    title: string;
    description: string;
    property: string;
    unit: string;
    tenant: string;
    tenantAvatar: string | null;
    priority: Priority;
    status: Status;
    reportedAt: string;
    assignee?: string;
    scheduledFor?: string;
    images: string[];
}

type MaintenanceMetrics = {
    actionRequired: number;
    inProgress: number;
    scheduled: number;
    resolvedThisMonth: number;
};

export function MaintenanceDashboard() {
    const [filter, setFilter] = useState<"All" | Status>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [metrics, setMetrics] = useState<MaintenanceMetrics>({
        actionRequired: 0,
        inProgress: 0,
        scheduled: 0,
        resolvedThisMonth: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const loadRequests = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch("/api/landlord/maintenance", {
                    method: "GET",
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error("Failed to load maintenance requests");
                }

                const payload = (await response.json()) as {
                    requests?: MaintenanceRequest[];
                    metrics?: MaintenanceMetrics;
                };

                setRequests(Array.isArray(payload.requests) ? payload.requests : []);
                if (payload.metrics) {
                    setMetrics(payload.metrics);
                }
            } catch (fetchError) {
                if ((fetchError as Error).name === "AbortError") {
                    return;
                }

                setError("Unable to load maintenance requests right now.");
                setRequests([]);
                setMetrics({
                    actionRequired: 0,
                    inProgress: 0,
                    scheduled: 0,
                    resolvedThisMonth: 0,
                });
            } finally {
                setLoading(false);
            }
        };

        void loadRequests();

        return () => {
            controller.abort();
        };
    }, []);

    const normalizedSearch = searchQuery.trim().toLowerCase();
    const filteredRequests = requests.filter((req) => {
        const matchesStatus = filter === "All" || req.status === filter;
        if (!normalizedSearch) {
            return matchesStatus;
        }

        const haystack = [req.id, req.tenant, req.unit, req.property, req.title]
            .filter((value) => typeof value === "string")
            .join(" ")
            .toLowerCase();

        return matchesStatus && haystack.includes(normalizedSearch);
    });

    return (
        <div className="flex flex-col w-full bg-background text-foreground p-6 md:p-8 space-y-8 animate-in fade-in duration-700 h-full overflow-y-auto custom-scrollbar relative">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground mb-2 flex items-center gap-3">
                        <Wrench className="h-8 w-8 text-primary/80" />
                        Maintenance Operations
                    </h1>
                    <p className="text-muted-foreground font-medium tracking-wide text-sm">
                        Coordinate, assign, and track property repairs in real-time.
                    </p>
                </div>
                <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold hover:bg-primary/90 shadow-sm transition-all active:scale-95">
                    <Plus className="h-5 w-5" />
                    New Work Order
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Action Required"
                    value={loading ? "..." : metrics.actionRequired.toLocaleString()}
                    subtitle="Pending requests"
                    icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                    glowColor="rgba(239,68,68,1)"
                    borderColor="border-red-500/20"
                />
                <StatCard
                    title="In Progress"
                    value={loading ? "..." : metrics.inProgress.toLocaleString()}
                    subtitle="Active work orders"
                    icon={<Hammer className="h-5 w-5 text-amber-500" />}
                    glowColor="rgba(245,158,11,1)"
                    borderColor="border-amber-500/20"
                />
                <StatCard
                    title="Scheduled"
                    value={loading ? "..." : metrics.scheduled.toLocaleString()}
                    subtitle="Upcoming visits"
                    icon={<Clock className="h-5 w-5 text-cyan-500" />}
                    glowColor="rgba(6,182,212,1)"
                    borderColor="border-cyan-500/20"
                />
                <StatCard
                    title="Resolved"
                    value={loading ? "..." : metrics.resolvedThisMonth.toLocaleString()}
                    subtitle="Completed this month"
                    icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                    glowColor="rgba(16,185,129,1)"
                    borderColor="border-emerald-500/20"
                />
            </div>

            {/* Main Content Area */}
            <div className="rounded-3xl bg-card border border-border flex flex-col pt-2 shadow-sm">
                {/* Toolbar */}
                <div className="p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/95 backdrop-blur-xl sticky top-0 z-10 rounded-t-3xl">
                    <div className="flex bg-muted/50 p-1.5 rounded-xl border border-border overflow-x-auto w-full sm:w-auto no-scrollbar">
                        {["All", "Pending", "In Progress", "Resolved"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab as any)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                                    filter === tab
                                        ? "bg-background text-foreground shadow-sm dark:bg-card"
                                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative group flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by ID, tenant or unit..."
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm"
                            />
                        </div>
                        <button className="p-2.5 rounded-xl bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-sm">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Grid Format Request List */}
                <div className="p-6">
                    {loading ? (
                        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
                            Loading maintenance requests...
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-500/20 bg-red-50/50 dark:bg-red-500/5 p-6 text-sm text-red-600 dark:text-red-300 shadow-sm">
                            {error}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredRequests.map((request) => (
                                <MaintenanceCard
                                    key={request.id}
                                    request={request}
                                    onClick={() => setSelectedRequest(request)}
                                />
                            ))}

                            {filteredRequests.length === 0 && (
                                <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 py-20 flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">
                                        No {filter !== "All" ? filter.toLowerCase() : ""} requests
                                    </h3>
                                    <p className="text-muted-foreground text-sm max-w-sm">
                                        You're all caught up! Everything is running smoothly across your properties.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <MaintenanceRequestModal
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                request={selectedRequest}
            />
        </div>
    );
}

function StatCard({ title, value, subtitle, icon, glowColor, borderColor }: any) {
    return (
        <div
            className={cn(
                "relative overflow-hidden p-6 rounded-3xl bg-card border shadow-sm transition-all duration-300 group hover:-translate-y-1 hover:shadow-md",
                borderColor
            )}
        >
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] dark:group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)` }}
            />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title}</h3>
                    <div className="p-2 rounded-xl bg-muted border border-border">
                        {icon}
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-4xl font-black text-foreground tracking-tighter">{value}</span>
                    <span className="text-sm font-medium text-muted-foreground">{subtitle}</span>
                </div>
            </div>
        </div>
    );
}

function MaintenanceCard({ request, onClick }: { request: MaintenanceRequest, onClick?: () => void }) {
    const isCritical = request.priority === "Critical";
    const isPending = request.status === "Pending";
    const isResolved = request.status === "Resolved";

    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg"
        >
            {/* Top Image Preview Area */}
            <div className="relative h-44 w-full bg-muted border-b border-border overflow-hidden shrink-0">
                {request.images && request.images.length > 0 ? (
                    <>
                        <img
                            src={request.images[0]}
                            alt={request.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 dark:from-black/80 dark:via-transparent dark:to-black/40" />

                        {/* Multiple Images Indicator */}
                        {request.images.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-bold text-white border border-white/10 shadow-sm">
                                <ImageIcon className="w-3 h-3" />
                                +{request.images.length - 1}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted absolute inset-0">
                        <Wrench className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                )}

                {/* Badges on top of image */}
                <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5 z-10">
                    <StatusBadge status={request.status} />
                    <PriorityBadge priority={request.priority} />
                </div>
            </div>

            {/* Glowing red accent for critical pending */}
            {isCritical && isPending && (
                <div className="absolute top-0 inset-x-0 h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] z-10" />
            )}

            {/* Content Area */}
            <div className="p-4 flex flex-col flex-1 bg-gradient-to-b from-card via-card to-muted/20 pb-2">
                {/* Header & Meta */}
                <div className="flex items-center justify-between mb-3 text-[10px] font-medium text-muted-foreground shrink-0">
                    <span className="font-mono font-bold tracking-wider">{request.id}</span>
                </div>

                {/* Title */}
                <div className="mb-3 shrink-0">
                    <h3 className="text-sm font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors line-clamp-2 leading-snug">{request.title}</h3>
                </div>

                {/* Property & Unit */}
                <div className="flex flex-wrap items-center gap-2 mb-4 shrink-0">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-700 dark:text-neutral-300 bg-background border border-border px-2 py-1 rounded-md shadow-sm">
                        {request.property}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20 shadow-sm">
                        {request.unit}
                    </span>
                </div>

                {/* Spacer to push footer down */}
                <div className="flex-1 min-h-[16px]" />

                {/* Footer Info */}
                <div className="flex items-center justify-between gap-3 shrink-0 pt-4 border-t border-border mt-auto">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {request.reportedAt}
                    </div>
                    <button
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-black text-primary hover:text-primary-foreground hover:bg-primary bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm"
                    >
                        View Details
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Pulsing effect for crucial items */}
            {isCritical && isPending && (
                <div className="absolute inset-0 rounded-2xl ring-2 ring-red-500/20 ring-offset-2 ring-offset-background animate-pulse pointer-events-none" />
            )}
        </div>
    );
}

function PriorityBadge({ priority }: { priority: Priority }) {
    const config = {
        Critical: "bg-red-500 text-white border-red-400 shadow-sm",
        High: "bg-orange-500/90 backdrop-blur-md text-white border-orange-400/50 shadow-sm",
        Medium: "bg-blue-500/90 backdrop-blur-md text-white border-blue-400/50 shadow-sm",
        Low: "bg-slate-200/90 dark:bg-neutral-800/90 backdrop-blur-md text-slate-700 dark:text-neutral-300 border-slate-300 dark:border-neutral-600 shadow-sm",
    };

    return (
        <span className={cn(
            "px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5",
            config[priority]
        )}>
            {priority === "Critical" && <AlertTriangle className="w-3 h-3" />}
            {priority} Priority
        </span>
    );
}

function StatusBadge({ status }: { status: Status }) {
    const config = {
        Pending: "bg-amber-500 text-black border-amber-400 shadow-sm",
        Assigned: "bg-cyan-500/90 backdrop-blur-md text-white border-cyan-400/50 shadow-sm",
        "In Progress": "bg-primary text-primary-foreground border-primary/50 shadow-sm",
        Resolved: "bg-emerald-500/90 backdrop-blur-md text-white border-emerald-400/50 shadow-sm",
    };

    return (
        <span className={cn(
            "px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider",
            config[status]
        )}>
            {status}
        </span>
    );
}
