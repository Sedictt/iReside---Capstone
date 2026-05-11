"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
    Wrench,
    Plus,
    Clock,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    ImageIcon,
    Home,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { TenantMaintenanceModal } from "@/components/tenant/maintenance/TenantMaintenanceModal";

type MaintenanceStatus = "Pending" | "Assigned" | "In Progress" | "Resolved";
type Priority = "Critical" | "High" | "Medium" | "Low";

interface MaintenanceRequest {
    id: string;
    title: string;
    description: string;
    property: string;
    unit: string;
    landlord: string;
    priority: Priority;
    status: MaintenanceStatus;
    reportedAt: string;
    images: string[];
    selfRepairRequested?: boolean;
    selfRepairDecision?: "approved" | "rejected" | "pending";
    photoRequested?: boolean;
    tenantRepairStatus?: "not_started" | "personnel_arrived" | "repairing" | "done";
    tenantProvidedPhotos?: string[];
    repairMethod?: "landlord" | "third_party" | "self_repair";
    thirdPartyName?: string;
}

export default function TenantMaintenancePage() {
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<"All" | MaintenanceStatus>("All");
    const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
    const [previewMode, setPreviewMode] = useState<string | null>(null);
    const statusTabs: Array<"All" | "Pending" | "In Progress" | "Resolved"> = [
        "All",
        "Pending",
        "In Progress",
        "Resolved",
    ];

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await fetch("/api/tenant/maintenance");
                if (!response.ok) throw new Error("Failed to load requests");
                const data = await response.json();
                
                let fetchedRequests = data.requests || [];
                
                // --- PREVIEW SCENARIOS OVERRIDE ---
                if (typeof window !== "undefined") {
                    const params = new URLSearchParams(window.location.search);
                    const preview = params.get("preview");
                    setPreviewMode(preview);
                    
                    if (preview && fetchedRequests.length > 0) {
                        fetchedRequests = [...fetchedRequests];
                        if (preview === "accepted_self_repair") {
                            fetchedRequests[0] = {
                                ...fetchedRequests[0],
                                status: "In Progress",
                                selfRepairRequested: true,
                                selfRepairDecision: "approved",
                                photoRequested: false
                            };
                        } else if (preview === "rejected_self_repair") {
                            fetchedRequests[0] = {
                                ...fetchedRequests[0],
                                status: "In Progress",
                                selfRepairRequested: true,
                                selfRepairDecision: "rejected",
                                repairMethod: "landlord",
                                photoRequested: false
                            };
                        } else if (preview === "asking_for_photo") {
                            fetchedRequests[0] = {
                                ...fetchedRequests[0],
                                status: "In Progress",
                                selfRepairRequested: true,
                                selfRepairDecision: "approved",
                                photoRequested: true
                            };
                        } else if (preview === "landlord_repair") {
                            fetchedRequests[0] = {
                                ...fetchedRequests[0],
                                status: "In Progress",
                                selfRepairRequested: false,
                                repairMethod: "landlord"
                            };
                        } else if (preview === "third_party_repair") {
                            fetchedRequests[0] = {
                                ...fetchedRequests[0],
                                status: "In Progress",
                                selfRepairRequested: false,
                                repairMethod: "third_party",
                                thirdPartyName: "John's Plumbing Co."
                            };
                        } else if (preview === "resolved") {
                            fetchedRequests[0] = {
                                ...fetchedRequests[0],
                                status: "Resolved",
                                selfRepairRequested: false,
                                repairMethod: "landlord",
                                tenantRepairStatus: "done"
                            };
                        } else if (preview === "self_repair_repairing") {
                            fetchedRequests[0] = {
                                ...fetchedRequests[0],
                                status: "In Progress",
                                selfRepairRequested: true,
                                selfRepairDecision: "approved",
                                photoRequested: false,
                                tenantRepairStatus: "repairing"
                            };
                        } else if (preview === "self_repair_done") {
                            fetchedRequests[0] = {
                                ...fetchedRequests[0],
                                status: "In Progress",
                                selfRepairRequested: true,
                                selfRepairDecision: "approved",
                                photoRequested: false,
                                tenantRepairStatus: "done"
                            };
                        } else if (preview === "self_repair_photo_uploaded") {
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
                        } else if (preview === "third_party_personnel_arrived") {
                            fetchedRequests[0] = {
                                ...fetchedRequests[0],
                                status: "In Progress",
                                selfRepairRequested: false,
                                repairMethod: "third_party",
                                thirdPartyName: "John's Plumbing Co.",
                                tenantRepairStatus: "personnel_arrived"
                            };
                        } else if (preview === "third_party_repairing") {
                            fetchedRequests[0] = {
                                ...fetchedRequests[0],
                                status: "In Progress",
                                selfRepairRequested: false,
                                repairMethod: "third_party",
                                thirdPartyName: "John's Plumbing Co.",
                                tenantRepairStatus: "repairing"
                            };
                        } else if (preview === "third_party_done") {
                            fetchedRequests[0] = {
                                ...fetchedRequests[0],
                                status: "In Progress",
                                selfRepairRequested: false,
                                repairMethod: "third_party",
                                thirdPartyName: "John's Plumbing Co.",
                                tenantRepairStatus: "done"
                            };
                        } else if (preview === "third_party_photo_uploaded") {
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
                
                setRequests(fetchedRequests);
            } catch {
                setError("Could not load your maintenance requests.");
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, []);

    const filteredRequests = requests.filter(
        (req) => filter === "All" || req.status === filter
    );

    const handleTenantRequestUpdate = async (updated: MaintenanceRequest) => {
        try {
            const response = await fetch("/api/tenant/maintenance", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requestId: updated.id,
                    tenantRepairStatus: updated.tenantRepairStatus,
                    tenantProvidedPhotos: updated.tenantProvidedPhotos,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update maintenance request");
            }

            const payload = (await response.json()) as { request?: Partial<MaintenanceRequest> };
            const merged = {
                ...updated,
                ...(payload.request ?? {}),
            } as MaintenanceRequest;

            setSelectedRequest(merged);
            setRequests((current) => current.map((req) => (req.id === merged.id ? merged : req)));
        } catch {
            // Fall back to local optimistic update when API write fails.
            setSelectedRequest(updated);
            setRequests((current) => current.map((req) => (req.id === updated.id ? updated : req)));
        }
    };

    return (
        <div className="flex-1 w-full max-w-6xl mx-auto">
            {previewMode && (
                <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <span className="text-sm font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                        <Zap className="size-4" />
                        Preview Mode Active
                    </span>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/tenant/maintenance?preview=accepted_self_repair" className={cn("text-[10px] sm:text-xs font-bold border px-3 py-1.5 rounded-lg transition-colors", previewMode === "accepted_self_repair" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted")}>
                            Self-Repair (Approved)
                        </Link>
                        <Link href="/tenant/maintenance?preview=asking_for_photo" className={cn("text-[10px] sm:text-xs font-bold border px-3 py-1.5 rounded-lg transition-colors", previewMode === "asking_for_photo" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted")}>
                            Self-Repair (Photo)
                        </Link>
                        <Link href="/tenant/maintenance?preview=rejected_self_repair" className={cn("text-[10px] sm:text-xs font-bold border px-3 py-1.5 rounded-lg transition-colors", previewMode === "rejected_self_repair" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted")}>
                            Self-Repair (Denied)
                        </Link>
                        <Link href="/tenant/maintenance?preview=landlord_repair" className={cn("text-[10px] sm:text-xs font-bold border px-3 py-1.5 rounded-lg transition-colors", previewMode === "landlord_repair" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted")}>
                            Landlord Repair
                        </Link>
                        <Link href="/tenant/maintenance?preview=third_party_repair" className={cn("text-[10px] sm:text-xs font-bold border px-3 py-1.5 rounded-lg transition-colors", previewMode === "third_party_repair" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted")}>
                            Third-Party Repair
                        </Link>
                        <Link href="/tenant/maintenance?preview=resolved" className={cn("text-[10px] sm:text-xs font-bold border px-3 py-1.5 rounded-lg transition-colors", previewMode === "resolved" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted")}>
                            Resolved
                        </Link>
                        <Link href="/tenant/maintenance" className="text-[10px] sm:text-xs font-bold bg-background border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-red-500 hover:text-red-600">
                            Clear Preview
                        </Link>
                    </div>
                </div>
            )}

            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
                        <Wrench className="size-8 text-primary" />
                        Maintenance Requests
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track and manage repairs for your unit.
                    </p>
                </div>
                <Link
                    href="/tenant/maintenance/new"
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 w-fit"
                >
                    <Plus className="size-5" />
                    New Request
                </Link>
            </div>


            {/* Filters */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                {statusTabs.map((t) => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border",
                            filter === t
                                ? "bg-primary text-primary-foreground border-primary shadow-md"
                                : "bg-card border-border text-muted-foreground hover:border-primary/30"
                        )}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <MaintenanceCardSkeleton key={`maintenance-skeleton-${i}`} />
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
                    <AlertTriangle className="size-10 text-red-500 mx-auto mb-4" />
                    <p className="text-red-500 font-bold">{error}</p>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center">
                    <div className="size-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="size-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No requests found</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto mb-8">
                        {filter === 'All' 
                            ? "You haven't submitted any maintenance requests yet."
                            : `You don't have any requests marked as ${filter.toLowerCase()}.`
                        }
                    </p>
                    {filter === 'All' && (
                        <Link
                            href="/tenant/maintenance/new"
                            className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                        >
                            Submit your first request
                            <ArrowRight className="size-4" />
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredRequests.map((request) => (
                        <TenantMaintenanceCard
                            key={request.id}
                            request={request}
                            onClick={() => setSelectedRequest(request)}
                        />
                    ))}
                </div>
            )}

            <TenantMaintenanceModal 
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                request={selectedRequest}
                onUpdateRequest={handleTenantRequestUpdate}
            />
        </div>
    );
}

function TenantMaintenanceCard({ request, onClick }: { request: MaintenanceRequest, onClick?: () => void }) {
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
                            <Image
                                src={request.images[0]}
                                alt={request.title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 300px"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 dark:from-black/80 dark:via-transparent dark:to-black/40" />

                        {/* Multiple Images Indicator */}
                        {request.images.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-bold text-white border border-white/10 shadow-sm">
                                <ImageIcon className="size-3" />
                                +{request.images.length - 1}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted absolute inset-0">
                        <Wrench className="size-8 text-muted-foreground/30" />
                    </div>
                )}

                {/* Badges on top of image */}
                <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5 z-10">
                    <StatusBadge 
                        status={request.status} 
                        tenantRepairStatus={request.tenantRepairStatus}
                        isSelfRepair={request.selfRepairRequested && request.selfRepairDecision === "approved"}
                    />
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
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-tight tracking-tight">
                        {request.title}
                    </h3>
                </div>

                {/* Property & Unit */}
                <div className="flex flex-col gap-2 mb-4 shrink-0">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Home className="size-3 shrink-0" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest truncate">
                            {request.property}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-primary/80">
                        <Zap className="size-3 shrink-0" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest">
                            {request.unit}
                        </span>
                    </div>
                </div>

                {/* Action Badge */}
                {request.photoRequested && request.status === "In Progress" && (!request.tenantProvidedPhotos || request.tenantProvidedPhotos.length === 0) && (
                    <div className="mb-4 shrink-0 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg w-fit">
                        <div className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Action Required: Upload Photo</span>
                    </div>
                )}
                {request.repairMethod === "third_party" && request.status === "In Progress" && request.tenantRepairStatus === "done" && (!request.tenantProvidedPhotos || request.tenantProvidedPhotos.length === 0) && (
                    <div className="mb-4 shrink-0 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg w-fit">
                        <div className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Action Required: Upload Photo</span>
                    </div>
                )}

                {/* Spacer to push footer down */}
                <div className="flex-1 min-h-[12px]" />

                {/* Footer Info */}
                <div className="flex items-center justify-between gap-4 shrink-0 pt-4 border-t border-border/50 mt-auto">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 min-w-0">
                        <Clock className="size-3.5 shrink-0" />
                        <span className="truncate">{request.reportedAt}</span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick?.();
                        }}
                        className="text-[10px] font-semibold uppercase tracking-widest text-primary hover:text-white hover:bg-primary bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shadow-sm group/btn active:scale-95"
                    >
                        Details
                        <ArrowRight className="size-3.5 transition-transform group-hover/btn:translate-x-0.5" />
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
        Low: "bg-zinc-200/90 dark:bg-neutral-800/90 backdrop-blur-md text-zinc-700 dark:text-neutral-300 border-zinc-300 dark:border-neutral-600 shadow-sm",
    };

    return (
        <span className={cn(
            "px-2.5 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5",
            config[priority]
        )}>
            {priority === "Critical" && <AlertTriangle className="size-3" />}
            {priority} Priority
        </span>
    );
}

function StatusBadge({ status, tenantRepairStatus, isSelfRepair }: { status: MaintenanceStatus, tenantRepairStatus?: string, isSelfRepair?: boolean }) {
    const config = {
        Pending: "bg-amber-500 text-black border-amber-400 shadow-sm",
        Assigned: "bg-cyan-500/90 backdrop-blur-md text-white border-cyan-400/50 shadow-sm",
        "In Progress": "bg-primary text-primary-foreground border-primary/50 shadow-sm",
        Resolved: "bg-emerald-500/90 backdrop-blur-md text-white border-emerald-400/50 shadow-sm",
    };

    let displayStatus = status as string;
    let customClass = config[status];
    
    if (status === "In Progress" && tenantRepairStatus) {
        if (tenantRepairStatus === "personnel_arrived") {
            displayStatus = "Personnel Arrived";
            customClass = "bg-cyan-500/90 backdrop-blur-md text-white border-cyan-400/50 shadow-sm";
        } else if (tenantRepairStatus === "repairing") {
            displayStatus = isSelfRepair ? "Repairing (Self)" : "Repairing";
            customClass = "bg-primary/90 backdrop-blur-md text-primary-foreground border-primary/50 shadow-sm";
        } else if (tenantRepairStatus === "done") {
            displayStatus = isSelfRepair ? "Repair Done (Pending Verify)" : "Repair Done (Pending Verify)";
            customClass = "bg-emerald-500/90 backdrop-blur-md text-white border-emerald-400/50 shadow-sm";
        }
    }

    return (
        <span className={cn(
            "px-2.5 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-wider",
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

