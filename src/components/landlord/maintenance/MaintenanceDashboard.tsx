"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
    Wrench,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Search,
    Plus,
    ArrowRight,
    Home,
    Zap,
    Image as ImageIcon,
    ArrowUpDown,
    Sparkles,
    Filter
} from "lucide-react";
import { MaintenanceRequestModal } from "./MaintenanceRequestModal";
import Link from "next/link";

type Priority = "Critical" | "High" | "Medium" | "Low";
type Status = "Pending" | "Assigned" | "In Progress" | "Resolved";

export interface MaintenanceRequest {
    id: string;
    title: string;
    description: string;
    selfRepairRequested?: boolean;
    selfRepairDecision?: "approved" | "rejected" | "pending";
    photoRequested?: boolean;
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
    tenantRepairStatus?: "not_started" | "personnel_arrived" | "repairing" | "done";
    tenantProvidedPhotos?: string[];
    repairMethod?: "landlord" | "third_party" | "self_repair";
    thirdPartyName?: string;
    sentiment?: "Distressed" | "Negative" | "Neutral" | "Positive";
    triageReason?: string;
    triageConfidence?: number;
    triageSource?: "ai" | "heuristic" | "cache" | "database";
    triagedAt?: string | null;
}

export function MaintenanceDashboard() {
    const [filter, setFilter] = useState<"All" | Status>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [previewMode, setPreviewMode] = useState<string | null>(null);
    const [priorityFilter, setPriorityFilter] = useState<"All" | Priority>("All");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority-desc" | "priority-asc">("newest");


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
                };

                let fetchedRequests = Array.isArray(payload.requests) ? payload.requests : [];

                // --- PREVIEW SCENARIOS OVERRIDE ---
                if (typeof window !== "undefined") {
                    const params = new URLSearchParams(window.location.search);
                    const preview = params.get("preview");
                    setPreviewMode(preview);

                    if (preview && fetchedRequests.length > 0) {
                        fetchedRequests = [...fetchedRequests];
                        if (preview === "self_repair_photo") {
                            fetchedRequests[0] = {
                                ...fetchedRequests[0],
                                status: "In Progress",
                                selfRepairRequested: true,
                                selfRepairDecision: "approved",
                                photoRequested: true,
                                tenantRepairStatus: "done",
                                tenantProvidedPhotos: [
                                    "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=300&q=80"
                                ]
                            };
                        } else if (preview === "tenant_repairing") {
                            fetchedRequests[0] = {
                                ...fetchedRequests[0],
                                status: "In Progress",
                                selfRepairRequested: true,
                                selfRepairDecision: "approved",
                                tenantRepairStatus: "repairing"
                            };
                        } else if (preview === "tenant_done") {
                            fetchedRequests[0] = {
                                ...fetchedRequests[0],
                                status: "In Progress",
                                selfRepairRequested: true,
                                selfRepairDecision: "approved",
                                tenantRepairStatus: "done"
                            };
                        } else if (preview === "resolved") {
                            fetchedRequests[0] = {
                                ...fetchedRequests[0],
                                status: "Resolved",
                                selfRepairRequested: false,
                                repairMethod: "landlord",
                                tenantRepairStatus: "done"
                            };
                        } else if (preview === "third_party_tenant_done") {
                            fetchedRequests[0] = {
                                ...fetchedRequests[0],
                                status: "In Progress",
                                selfRepairRequested: false,
                                repairMethod: "third_party",
                                thirdPartyName: "John's Plumbing Co.",
                                tenantRepairStatus: "done",
                                tenantProvidedPhotos: [
                                    "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=300&q=80"
                                ]
                            };
                        }
                    }
                }

                if (!controller.signal.aborted) {
                    setRequests(fetchedRequests);
                }
            } catch (fetchError) {
                if ((fetchError as Error).name === "AbortError") {
                    return;
                }

                if (!controller.signal.aborted) {
                    setError("Unable to load maintenance requests right now.");
                    setRequests([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
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
        const matchesPriority = priorityFilter === "All" || req.priority === priorityFilter;

        if (!normalizedSearch) {
            return matchesStatus && matchesPriority;
        }

        const haystack = [req.id, req.tenant, req.unit, req.property, req.title]
            .filter((value) => typeof value === "string")
            .join(" ")
            .toLowerCase();

        return matchesStatus && matchesPriority && haystack.includes(normalizedSearch);
    });

    const sortedRequests = [...filteredRequests].sort((a, b) => {
        if (sortBy === "newest") {
            return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
        }
        if (sortBy === "oldest") {
            return new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();
        }
        if (sortBy === "priority-desc") {
            const priorityMap = { Critical: 3, High: 2, Medium: 1, Low: 0 };
            return priorityMap[b.priority] - priorityMap[a.priority];
        }
        if (sortBy === "priority-asc") {
            const priorityMap = { Critical: 3, High: 2, Medium: 1, Low: 0 };
            return priorityMap[a.priority] - priorityMap[b.priority];
        }
        return 0;
    });

    const handleLandlordRequestUpdate = (updated: MaintenanceRequest) => {
        setSelectedRequest(updated);
        setRequests((current) => current.map((req) => (req.id === updated.id ? updated : req)));
    };

    return (
        <div className="flex flex-col w-full bg-background text-foreground p-6 md:p-8 space-y-8 animate-in fade-in duration-700 h-full overflow-y-auto custom-scrollbar relative">
            {previewMode && (
                <div className="mb-2 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <span className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Preview Mode Active
                    </span>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/landlord/maintenance?preview=self_repair_photo" className={cn("text-[10px] sm:text-xs font-bold border px-3 py-1.5 rounded-lg transition-colors", previewMode === "self_repair_photo" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted")}>
                            Self-Repair Photo
                        </Link>
                        <Link href="/landlord/maintenance?preview=tenant_repairing" className={cn("text-[10px] sm:text-xs font-bold border px-3 py-1.5 rounded-lg transition-colors", previewMode === "tenant_repairing" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted")}>
                            Tenant Repairing
                        </Link>
                        <Link href="/landlord/maintenance?preview=tenant_done" className={cn("text-[10px] sm:text-xs font-bold border px-3 py-1.5 rounded-lg transition-colors", previewMode === "tenant_done" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted")}>
                            Tenant Done
                        </Link>
                        <Link href="/landlord/maintenance?preview=third_party_tenant_done" className={cn("text-[10px] sm:text-xs font-bold border px-3 py-1.5 rounded-lg transition-colors", previewMode === "third_party_tenant_done" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted")}>
                            Third-Party (Tenant Done)
                        </Link>
                        <Link href="/landlord/maintenance?preview=resolved" className={cn("text-[10px] sm:text-xs font-bold border px-3 py-1.5 rounded-lg transition-colors", previewMode === "resolved" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted")}>
                            Resolved
                        </Link>
                        <Link href="/landlord/maintenance" className="text-[10px] sm:text-xs font-bold bg-background border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-red-500 hover:text-red-600">
                            Clear Preview
                        </Link>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                            <Wrench className="h-8 w-8 text-primary/80" />
                            Maintenance Operations
                        </h1>
                        <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm animate-pulse-subtle">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Smart Triage Active</span>
                        </div>
                    </div>
                    <p className="text-muted-foreground font-medium tracking-wide text-sm">
                        Coordinate, assign, and track property repairs in real-time.
                    </p>
                </div>
                <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold hover:bg-primary/90 shadow-sm transition-all active:scale-95">
                    <Plus className="h-5 w-5" />
                    New Work Order
                </button>
            </div>

            {/* Main Content Area */}
            <div className="rounded-3xl bg-card border border-border flex flex-col pt-2 shadow-sm">
                {/* Toolbar */}
                <div className="p-6 border-b border-border flex flex-col sm:flex-row items-end justify-between gap-6 bg-card rounded-t-3xl">
                        <div className="flex flex-col gap-1.5 flex-1 w-full sm:max-w-md">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 pl-1">Search Requests</label>
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by ID, tenant or unit..."
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    className="w-full bg-background border border-border rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                            <div className="flex flex-col gap-1.5 shrink-0">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 pl-1">Status</label>
                                <div className="relative flex items-center">
                                    <select 
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value as any)}
                                        className="appearance-none h-[42px] px-10 rounded-xl bg-background border border-border text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all shadow-sm outline-none cursor-pointer min-w-[150px]"
                                    >
                                        <option value="All">All</option>
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>
                                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 shrink-0">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 pl-1">Priority</label>
                                <div className="relative flex items-center">
                                    <select 
                                        value={priorityFilter}
                                        onChange={(e) => setPriorityFilter(e.target.value as any)}
                                        className="appearance-none h-[42px] px-10 rounded-xl bg-background border border-border text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all shadow-sm outline-none cursor-pointer min-w-[150px]"
                                    >
                                        <option value="All">All</option>
                                        <option value="Critical">Critical Only</option>
                                        <option value="High">High Only</option>
                                        <option value="Medium">Medium Only</option>
                                        <option value="Low">Low Only</option>
                                    </select>
                                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 shrink-0">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 pl-1">Sort By</label>
                                <div className="relative flex items-center">
                                    <select 
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="appearance-none h-[42px] pl-10 pr-12 rounded-xl bg-background border border-border text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all shadow-sm outline-none cursor-pointer min-w-[190px]"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="priority-desc">Priority (H-L)</option>
                                        <option value="priority-asc">Priority (L-H)</option>
                                    </select>
                                    <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                                </div>
                            </div>
                        </div>
                </div>

                {/* Grid Format Request List */}
                <div className="p-6">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <MaintenanceCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-500/20 bg-red-50/50 dark:bg-red-500/5 p-6 text-sm text-red-600 dark:text-red-300 shadow-sm">
                            {error}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {sortedRequests.map((request) => (
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
                                        No {priorityFilter !== "All" ? priorityFilter.toLowerCase() : ""} {filter !== "All" ? filter.toLowerCase() : ""} requests
                                    </h3>
                                    <p className="text-muted-foreground text-sm max-w-sm">
                                        You&apos;re all caught up! Everything is running smoothly across your properties.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <MaintenanceRequestModal
                key={selectedRequest?.id ?? "maintenance-modal-closed"}
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                request={selectedRequest}
                onRequestUpdated={handleLandlordRequestUpdate}
            />
        </div>
    );
}

function MaintenanceCard({ request, onClick }: { request: MaintenanceRequest, onClick?: () => void }) {
    const isCritical = request.priority === "Critical";
    const isPending = request.status === "Pending";

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
                    <StatusBadge status={request.status} tenantRepairStatus={request.tenantRepairStatus} />
                    <PriorityBadge priority={request.priority} />
                </div>
            </div>

            {/* Glowing red accent for critical pending */}
            {isCritical && isPending && (
                <div className="absolute top-0 inset-x-0 h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] z-10" />
            )}

            {/* Content Area */}
            <div className="p-4 flex flex-col flex-1 bg-gradient-to-b from-card via-card to-muted/5 pb-2">
                {/* Header & Meta */}
                <div className="flex items-center justify-between mb-2 text-[10px] font-bold text-muted-foreground/60 tracking-wider uppercase shrink-0">
                    <span className="truncate max-w-[120px]">ID: {request.id.split('-')[0]}...</span>
                </div>

                {/* Title */}
                <div className="mb-4 shrink-0">
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-tight tracking-tight">
                        {request.title}
                    </h3>
                </div>

                {/* Property & Unit */}
                <div className="flex flex-col gap-2 mb-4 shrink-0">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Home className="w-3 h-3 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest truncate">
                            {request.property}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-primary/80">
                        <Zap className="w-3 h-3 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {request.unit}
                        </span>
                    </div>
                </div>

                {/* Spacer to push footer down */}
                <div className="flex-1 min-h-[12px]" />

                {/* Footer Info */}
                <div className="flex items-center justify-between gap-4 shrink-0 pt-4 border-t border-border/50 mt-auto">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 min-w-0">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{request.reportedAt}</span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick?.();
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white hover:bg-primary bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shadow-sm group/btn active:scale-95"
                    >
                        Details
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
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
            {priority === "Critical" ? (
                <AlertTriangle className="w-3 h-3" />
            ) : (
                <Sparkles className="w-2.5 h-2.5 opacity-70" />
            )}
            {priority} Priority
        </span>
    );
}

function StatusBadge({ status, tenantRepairStatus }: { status: Status, tenantRepairStatus?: string }) {
    const config = {
        Pending: "bg-amber-500 text-black border-amber-400 shadow-sm",
        Assigned: "bg-cyan-500/90 backdrop-blur-md text-white border-cyan-400/50 shadow-sm",
        "In Progress": "bg-primary text-primary-foreground border-primary/50 shadow-sm",
        Resolved: "bg-emerald-500/90 backdrop-blur-md text-white border-emerald-400/50 shadow-sm",
    };

    let displayStatus: string = status;
    let customClass = config[status];

    if (status === "In Progress" && tenantRepairStatus) {
        if (tenantRepairStatus === "personnel_arrived") {
            displayStatus = "Personnel Arrived";
            customClass = "bg-cyan-500/90 backdrop-blur-md text-white border-cyan-400/50 shadow-sm";
        } else if (tenantRepairStatus === "repairing") {
            displayStatus = "Repairing";
            customClass = "bg-primary/90 backdrop-blur-md text-primary-foreground border-primary/50 shadow-sm";
        } else if (tenantRepairStatus === "done") {
            displayStatus = "Done (Pending Verify)";
            customClass = "bg-emerald-500/90 backdrop-blur-md text-white border-emerald-400/50 shadow-sm";
        }
    }

    return (
        <span className={cn(
            "px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider",
            customClass
        )}>
            {displayStatus}
        </span>
    );
}

function MaintenanceCardSkeleton() {
    return (
        <div className="relative flex flex-col bg-card/60 border border-border rounded-2xl overflow-hidden shadow-sm h-[400px]">
            {/* Neutral Shimmer Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent -translate-x-full animate-shimmer" style={{ animationDuration: '2.5s' }} />
            </div>
            
            <div className="h-44 w-full bg-muted animate-pulse" />
            
            <div className="p-4 flex flex-col flex-1 space-y-4">
                <div className="flex justify-between">
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </div>
                
                <div className="space-y-2">
                    <div className="h-5 w-full bg-muted rounded-lg animate-pulse" />
                    <div className="h-5 w-2/3 bg-muted rounded-lg animate-pulse" />
                </div>

                <div className="flex gap-2">
                    <div className="h-6 w-20 bg-muted rounded-md animate-pulse" />
                    <div className="h-6 w-16 bg-muted rounded-md animate-pulse" />
                </div>

                <div className="flex-1" />

                <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-9 w-24 bg-muted rounded-xl animate-pulse" />
                </div>
            </div>
        </div>
    );
}
