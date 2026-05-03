"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { useProperty } from "@/context/PropertyContext";

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
    tenantAvatarBgColor?: string | null;
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
    const { selectedPropertyId } = useProperty();
    const searchParams = useSearchParams();
    const [filter, setFilter] = useState<"All" | Status>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [previewMode, setPreviewMode] = useState<string | null>(null);
    const [priorityFilter, setPriorityFilter] = useState<"All" | Priority>("All");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority-desc" | "priority-asc">("priority-desc");


    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const loadRequests = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/landlord/maintenance?propertyId=${selectedPropertyId}`, {
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

                    // Handle deep linking via ?id=
                    const deepLinkId = searchParams?.get("id");
                    if (deepLinkId) {
                        const targetRequest = fetchedRequests.find(r => r.id === deepLinkId);
                        if (targetRequest) {
                            setSelectedRequest(targetRequest);
                        }
                    }
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
    }, [selectedPropertyId]);

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
        <div className="flex flex-col w-full bg-background text-foreground p-6 md:p-8 space-y-8 animate-in fade-in duration-700 relative">
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                            <Wrench className="h-8 w-8 text-primary" />
                            Maintenance Operations
                        </h1>
                        <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Smart Triage Active</span>
                        </div>
                    </div>
                    <p className="text-muted-foreground font-medium text-sm max-w-2xl">
                        Coordinate, assign, and track property repairs. IRIS AI automatically prioritizes urgent requests for faster resolution.
                    </p>
                </div>
                <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-3xl font-black uppercase tracking-wider text-xs hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 shrink-0">
                    <Plus className="h-5 w-5" />
                    New Work Order
                </button>
            </div>

            {/* Main Content Area */}
            <div className="rounded-[2rem] bg-card border border-border flex flex-col shadow-sm">
                {/* Toolbar */}
                <div className="p-6 border-b border-border bg-muted/20">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex-1 w-full max-w-md">
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by ID, tenant, unit or title..."
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    className="w-full bg-background border border-border rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-1.5 shadow-sm">
                                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                                <select 
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value as any)}
                                    className="bg-transparent text-xs font-bold text-foreground outline-none cursor-pointer min-w-[100px]"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Assigned">Assigned</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-1.5 shadow-sm">
                                <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                                <select 
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value as any)}
                                    className="bg-transparent text-xs font-bold text-foreground outline-none cursor-pointer min-w-[100px]"
                                >
                                    <option value="All">All Priority</option>
                                    <option value="Critical">Critical Only</option>
                                    <option value="High">High Only</option>
                                    <option value="Medium">Medium Only</option>
                                    <option value="Low">Low Only</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-1.5 shadow-sm">
                                <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                                <select 
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="bg-transparent text-xs font-bold text-foreground outline-none cursor-pointer min-w-[150px]"
                                >
                                    <option value="priority-desc">Smart Triage (Priority)</option>
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="priority-asc">Priority (L-H)</option>
                                </select>
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
            className="group relative flex flex-col bg-card border border-border rounded-3xl overflow-hidden hover:border-primary/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl"
        >
            {/* Top Image Preview Area */}
            <div className="relative h-48 w-full bg-muted border-b border-border overflow-hidden shrink-0">
                {request.images && request.images.length > 0 ? (
                    <>
                        <img
                            src={request.images[0]}
                            alt={request.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Multiple Images Indicator */}
                        {request.images.length > 1 && (
                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1.5 text-[10px] font-bold text-white border border-white/10 shadow-sm">
                                <ImageIcon className="w-3 h-3" />
                                +{request.images.length - 1}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/50 absolute inset-0">
                        <Wrench className="w-10 h-10 text-muted-foreground/20" />
                    </div>
                )}

                {/* Badges on top of image */}
                <div className="absolute top-3 left-3 flex flex-col items-start gap-2 z-10">
                    <StatusBadge status={request.status} tenantRepairStatus={request.tenantRepairStatus} />
                    <PriorityBadge priority={request.priority} />
                </div>
            </div>

            {/* Glowing red accent for critical pending */}
            {isCritical && isPending && (
                <div className="absolute top-0 inset-x-0 h-1.5 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] z-10 animate-pulse" />
            )}

            {/* Content Area */}
            <div className="p-6 flex flex-col flex-1 bg-card">
                {/* Header & Meta */}
                <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
                    <span className="truncate">#{request.id.split('-')[0]}</span>
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {request.reportedAt}
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight tracking-tight mb-4">
                    {request.title}
                </h3>

                {/* Property & Unit */}
                <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="p-1.5 bg-muted rounded-lg">
                            <Home className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold truncate">
                            {request.property}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                            <Zap className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider">
                            Unit {request.unit}
                        </span>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between gap-4 shrink-0 pt-5 border-t border-border/50 mt-auto">
                    <div className="flex -space-x-2 overflow-hidden">
                        <div 
                            className="inline-block h-8 w-8 rounded-full ring-2 ring-background flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shrink-0"
                            style={{ backgroundColor: request.tenantAvatarBgColor || '#6d9838' }}
                        >
                            {request.tenantAvatar ? (
                                <img
                                    className="h-full w-full object-cover"
                                    src={request.tenantAvatar}
                                    alt={request.tenant}
                                />
                            ) : (
                                request.tenant.split(' ').map(n => n[0]).join('')
                            )}
                        </div>
                        <div className="flex flex-col justify-center pl-4">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Tenant</span>
                            <span className="text-xs font-bold text-foreground truncate max-w-[100px]">{request.tenant}</span>
                        </div>
                    </div>
                    
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick?.();
                        }}
                        className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                        aria-label="View Details"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}



function PriorityBadge({ priority }: { priority: Priority }) {
    const config = {
        Critical: "bg-red-600 border-red-700 text-white",
        High: "bg-amber-500 border-amber-600 text-white",
        Medium: "bg-blue-600 border-blue-700 text-white",
        Low: "bg-emerald-600 border-emerald-700 text-white",
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

function StatusBadge({ status, tenantRepairStatus }: { status: Status, tenantRepairStatus?: string }) {
    const config = {
        Pending: "bg-amber-500 border-amber-600 text-white",
        Assigned: "bg-blue-600 border-blue-700 text-white",
        "In Progress": "bg-primary border-primary text-primary-foreground",
        Resolved: "bg-emerald-600 border-emerald-700 text-white",
    };

    let displayStatus: string = status;
    let customClass = config[status];

    if (status === "In Progress" && tenantRepairStatus) {
        if (tenantRepairStatus === "personnel_arrived") {
            displayStatus = "Personnel Arrived";
            customClass = "bg-blue-600 border-blue-700 text-white";
        } else if (tenantRepairStatus === "repairing") {
            displayStatus = "Repairing";
            customClass = "bg-primary border-primary text-primary-foreground";
        } else if (tenantRepairStatus === "done") {
            displayStatus = "Awaiting Verify";
            customClass = "bg-emerald-600 border-emerald-700 text-white";
        }
    }

    return (
        <span className={cn(
            "px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider shadow-sm",
            customClass
        )}>
            {displayStatus}
        </span>
    );
}

function MaintenanceCardSkeleton() {
    return (
        <div className="relative flex flex-col bg-card border border-border rounded-3xl overflow-hidden shadow-sm h-[420px]">
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
