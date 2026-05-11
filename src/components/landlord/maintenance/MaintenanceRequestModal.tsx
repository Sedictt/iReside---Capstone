"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
    X,
    Clock,
    Calendar,
    Hammer,
    CheckCircle2,
    ArrowRight,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    UserRound,
    Expand,
    Home,
    Zap,
    ChevronDown,
    Camera,
    Wrench,
    Sparkles
} from "lucide-react";
import type { MaintenanceRequest } from "./MaintenanceDashboard";


type ProcessPlan = "landlord" | "third_party";
type SelfRepairDecision = "allow" | "reject" | null;

interface MaintenanceRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: MaintenanceRequest | null;
    onRequestUpdated?: (updated: MaintenanceRequest) => void;
}

export function MaintenanceRequestModal({ isOpen, onClose, request, onRequestUpdated }: MaintenanceRequestModalProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isImageLightboxOpen, setIsImageLightboxOpen] = useState(false);
    const [tenantPhotoIndex, setTenantPhotoIndex] = useState(0);
    const [isTenantPhotoLightboxOpen, setIsTenantPhotoLightboxOpen] = useState(false);

    const [processPlan, setProcessPlan] = useState<ProcessPlan>(() => (request?.repairMethod === "third_party" ? "third_party" : "landlord"));
    const [selfRepairDecision, setSelfRepairDecision] = useState<SelfRepairDecision>(() => {
        if (request?.selfRepairDecision === "approved") return "allow";
        if (request?.selfRepairDecision === "rejected") return "reject";
        return null;
    });
    const [thirdPartyPerson, setThirdPartyPerson] = useState(() => request?.thirdPartyName ?? "");
    const [formError, setFormError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [processStep, setProcessStep] = useState<"pending" | "assigned" | "in_progress" | "completed">(() => {
        if (!request) return "pending";
        if (request.status === "Resolved") return "completed";
        if (request.status === "In Progress") return "in_progress";
        if (request.status === "Assigned") return "assigned";
        return "pending";
    });

    if (!isOpen || !request) return null;

    const selfRepairRegex = /\[TENANT REQUESTED SELF-REPAIR PERMISSION\]\s*/g;
    const parsedDescription = request.description.replace(selfRepairRegex, '').trim();
    const selfRepairRequested =
        Boolean(request.selfRepairRequested) || /\[TENANT REQUESTED SELF-REPAIR PERMISSION\]/i.test(request.description);
    const isPending = processStep === "pending";

    const processSummary = processStep === "pending"
        ? null
        : selfRepairRequested && selfRepairDecision === "allow"
            ? "Tenant self-repair approved. They will handle this."
            : processPlan === "landlord"
                ? "Landlord repair selected. Tenant will be notified."
                : `Third-party repair: ${thirdPartyPerson.trim()}`;

    const nextImage = () => {
        if (request.images && currentImageIndex < request.images.length - 1) {
            setCurrentImageIndex((prev) => prev + 1);
        }
    };

    const prevImage = () => {
        if (currentImageIndex > 0) {
            setCurrentImageIndex((prev) => prev - 1);
        }
    };

    const nextTenantPhoto = () => {
        if (request.tenantProvidedPhotos && tenantPhotoIndex < request.tenantProvidedPhotos.length - 1) {
            setTenantPhotoIndex((prev) => prev + 1);
        }
    };

    const prevTenantPhoto = () => {
        if (tenantPhotoIndex > 0) {
            setTenantPhotoIndex((prev) => prev - 1);
        }
    };

    const persistLandlordUpdate = async (
        payload: Record<string, unknown>,
        optimisticFields: Partial<MaintenanceRequest>
    ) => {
        setIsSaving(true);
        setFormError(null);
        try {
            const response = await fetch("/api/landlord/maintenance", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requestId: request.id,
                    ...payload,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update maintenance request.");
            }

            const body = (await response.json()) as { request?: Partial<MaintenanceRequest> };
            const merged = {
                ...request,
                ...optimisticFields,
                ...(body.request ?? {}),
            } as MaintenanceRequest;
            onRequestUpdated?.(merged);
            return true;
        } catch {
            setFormError("Could not sync maintenance update. Please try again.");
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleProcess = async () => {
        if (processStep === "pending") {
            if (selfRepairRequested && selfRepairDecision === null) {
                setFormError("Please approve or deny the tenant's self-repair request first.");
                return;
            }
            if ((!selfRepairRequested || selfRepairDecision === "reject") && processPlan === "third_party" && thirdPartyPerson.trim().length === 0) {
                setFormError("Please provide the third-party repair person's name for tenant safety.");
                return;
            }

            const isSelfRepair = selfRepairRequested && selfRepairDecision === "allow";
            const targetStatus = isSelfRepair ? "in_progress" : "assigned";
            const targetStatusLabel = isSelfRepair ? "In Progress" : "Assigned";

            const payload: Record<string, unknown> = { status: targetStatus };
            const optimisticFields: Partial<MaintenanceRequest> = { status: targetStatusLabel };

            if (isSelfRepair) {
                payload.selfRepairDecision = "approved";
                payload.repairMethod = "self_repair";
                payload.thirdPartyName = null;
                optimisticFields.selfRepairDecision = "approved";
                optimisticFields.repairMethod = "self_repair";
                optimisticFields.thirdPartyName = "";
            } else {
                if (selfRepairRequested && selfRepairDecision === "reject") {
                    payload.selfRepairDecision = "rejected";
                    optimisticFields.selfRepairDecision = "rejected";
                }

                payload.repairMethod = processPlan;
                optimisticFields.repairMethod = processPlan;

                if (processPlan === "third_party") {
                    payload.thirdPartyName = thirdPartyPerson.trim();
                    optimisticFields.thirdPartyName = thirdPartyPerson.trim();
                } else {
                    payload.thirdPartyName = null;
                    optimisticFields.thirdPartyName = "";
                }
            }

            const synced = await persistLandlordUpdate(payload, optimisticFields);
            if (synced) {
                setProcessStep(isSelfRepair ? "in_progress" : "assigned");
            }
        } else if (processStep === "assigned") {
            const synced = await persistLandlordUpdate(
                { status: "in_progress" },
                { status: "In Progress" }
            );
            if (synced) {
                setProcessStep("in_progress");
            }
        } else if (processStep === "in_progress") {
            const synced = await persistLandlordUpdate(
                { status: "resolved", photoRequested: false },
                { status: "Resolved", photoRequested: false }
            );
            if (synced) {
                setProcessStep("completed");
            }
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                <div
                    className="absolute inset-0"
                    onClick={onClose}
                />

                <div
                    className="relative z-10 w-full max-w-5xl max-h-[95vh] bg-card text-card-foreground rounded-[2rem] border border-border/50 shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-300"
                    onClick={(event) => event.stopPropagation()}
                >
                    {/* Left Panel: Images */}
                    <div className="w-full md:w-[45%] relative bg-muted shrink-0 basis-[250px] md:basis-auto md:min-h-full overflow-hidden group">
                        {request.images && request.images.length > 0 ? (
                            <>
                                <button
                                    onClick={() => setIsImageLightboxOpen(true)}
                                    className="absolute inset-0 w-full h-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                                    aria-label="Enlarge photo"
                                >
                                    <Image
                                        src={request.images[currentImageIndex]}
                                        alt="Maintenance Issue"
                                        fill
                                        sizes="(max-width: 768px) 100vw, 45vw"
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                </button>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />
                                
                                <button
                                    onClick={() => setIsImageLightboxOpen(true)}
                                    className="absolute top-6 right-6 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white hover:bg-black/60 transition-colors shadow-lg"
                                >
                                    <Expand className="size-3.5" />
                                    Enlarge
                                </button>

                                {request.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            disabled={currentImageIndex === 0}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/40 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity border border-white/20 hover:bg-white hover:text-black shadow-lg"
                                        >
                                            <ChevronLeft className="size-5" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            disabled={currentImageIndex === request.images.length - 1}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/40 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity border border-white/20 hover:bg-white hover:text-black shadow-lg"
                                        >
                                            <ChevronRight className="size-5" />
                                        </button>

                                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 shadow-lg">
                                            {request.images.map((_, idx) => (
                                                <button
                                                    key={`img-${idx}`}
                                                    onClick={() => setCurrentImageIndex(idx)}
                                                    className={cn(
                                                        "size-2 rounded-full transition-all",
                                                        currentImageIndex === idx ? "bg-white w-6" : "bg-white/40 hover:bg-white/80"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                                <Hammer className="size-16 text-muted-foreground/30" />
                            </div>
                        )}

                        <div className="absolute top-6 left-6 flex flex-col gap-2 z-10 max-w-[80%]">
                            <div className="flex flex-wrap gap-2">
                                <span className={cn(
                                    "px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest shadow-lg backdrop-blur-md",
                                    request.status === "Pending" ? "bg-amber-500/90 text-black border-amber-400" :
                                        request.status === "In Progress" ? "bg-primary/90 text-primary-foreground border-primary/50" :
                                            request.status === "Assigned" ? "bg-cyan-500/90 text-white border-cyan-400/50" :
                                                "bg-emerald-500/90 text-white border-emerald-400/50"
                                )}>
                                    {request.status}
                                </span>
                                <span className={cn(
                                    "px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest shadow-lg backdrop-blur-md",
                                    request.priority === "Critical" ? "bg-red-500/90 text-white border-red-400" :
                                        request.priority === "High" ? "bg-orange-500/90 text-white border-orange-400/50" :
                                            request.priority === "Medium" ? "bg-blue-500/90 text-white border-blue-400/50" :
                                                "bg-neutral-800/90 text-neutral-300 border-neutral-600"
                                )}>
                                    {request.priority} Priority
                                </span>
                            </div>

                            {/* HUD: Property & Unit */}
                            <div className="mt-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col gap-2.5 shadow-lg w-full">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-white/10 rounded-lg shrink-0">
                                        <Home className="size-3.5 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest block">Property</span>
                                        <span className="text-sm font-bold text-white block line-clamp-1">{request.property}</span>
                                    </div>
                                </div>
                                <div className="h-px bg-white/10 w-full" />
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-white/10 rounded-lg shrink-0">
                                        <Zap className="size-3.5 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest block">Unit</span>
                                        <span className="text-sm font-bold text-white block line-clamp-1">{request.unit}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Content & Actions */}
                    <div className="w-full md:w-[55%] flex flex-col flex-1 min-h-0 bg-background relative">
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2.5 bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground rounded-full transition-all z-20 active:scale-90"
                            aria-label="Close"
                        >
                            <X className="size-5" />
                        </button>

                        <div className="flex-1 p-6 md:p-10 space-y-10 overflow-y-auto custom-scrollbar">
                            {/* Header Group */}
                            <div>
                                <div className="mb-6 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                    <div className="flex items-center bg-muted/50 rounded-lg border border-border px-3 py-1.5 text-foreground/70">
                                        ID: {request.id.split('-')[0]}
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg border border-border text-foreground/70">
                                        <Clock className="size-3.5" />
                                        Reported {request.reportedAt}
                                    </div>
                                </div>

                                <h2 className="text-4xl font-bold text-foreground leading-tight tracking-tighter mb-4">{request.title}</h2>
                                <p className="text-muted-foreground text-base leading-relaxed whitespace-pre-wrap">{parsedDescription}</p>
                                
                                {request.triageReason && (
                                    <div className="mt-8 rounded-3xl border border-primary/20 bg-primary/5 p-6 relative overflow-hidden group/ai">
                                        <div className="absolute -right-8 -top-8 size-32 bg-primary/10 blur-3xl rounded-full" />
                                        
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-2 bg-primary/10 rounded-xl">
                                                <Sparkles className="size-4 text-primary" />
                                            </div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                                                IRIS AI Smart Triage
                                            </p>
                                        </div>

                                        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                            {request.triageReason}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {selfRepairRequested && (
                                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-500/10 rounded-2xl shrink-0">
                                            <ShieldCheck className="size-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-foreground">Self-Repair Requested</p>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                {selfRepairDecision === "allow" ? "You have approved this request." : selfRepairDecision === "reject" ? "You have denied this request." : "The tenant asks to handle this repair themselves."}
                                            </p>
                                        </div>
                                    </div>
                                    {processStep === "pending" && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button 
                                                onClick={() => setSelfRepairDecision("allow")}
                                                className={cn("px-5 py-2.5 rounded-xl text-sm font-bold transition-all border", selfRepairDecision === "allow" ? "bg-emerald-500 text-white border-emerald-500 shadow-md" : "bg-background text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10")}
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => setSelfRepairDecision("reject")}
                                                className={cn("px-5 py-2.5 rounded-xl text-sm font-bold transition-all border", selfRepairDecision === "reject" ? "bg-red-500 text-white border-red-500 shadow-md" : "bg-background text-red-600 border-red-500/20 hover:bg-red-500/10")}
                                            >
                                                Deny
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}



                            {/* Involved Parties */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] pl-1">Involved Parties</h3>
                                
                                <div className="flex items-center gap-4 bg-muted/30 p-5 rounded-3xl border border-border">
                                    <div
                                        className="size-14 rounded-2xl overflow-hidden border border-border shrink-0 flex items-center justify-center text-lg font-bold text-white relative"
                                        style={{ backgroundColor: request.tenantAvatarBgColor || '#6d9838' }}
                                    >
                                        {request.tenantAvatar ? (
                                            <Image
                                                src={request.tenantAvatar}
                                                alt={request.tenant}
                                                fill
                                                sizes="56px"
                                                className="object-cover"
                                            />
                                        ) : (
                                            request.tenant.split(' ').map(n => n[0]).join('')
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Primary Tenant</span>
                                        <p className="text-lg font-bold text-foreground truncate leading-tight">{request.tenant}</p>
                                    </div>
                                    <button className="p-3 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm active:scale-90 shrink-0">
                                        <MessageSquare className="size-5" />
                                    </button>
                                </div>

                                {request.scheduledFor && (
                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-5 flex items-center gap-4">
                                        <div className="p-3 bg-amber-500/10 rounded-2xl">
                                            <Calendar className="size-6 text-amber-500" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-amber-500/70 uppercase tracking-[0.2em]">Scheduled Window</span>
                                            <p className="text-base font-bold text-foreground">{request.scheduledFor}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tenant Repair Progress */}
                            {request.tenantRepairStatus && request.tenantRepairStatus !== "not_started" && (
                                <div className={cn(
                                    "rounded-2xl border px-5 py-4 flex flex-col gap-3 shadow-sm animate-in fade-in slide-in-from-top-2",
                                    request.tenantRepairStatus === "done" 
                                        ? "border-emerald-500/30 bg-emerald-500/10" 
                                        : "border-primary/30 bg-primary/10"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-xl shrink-0",
                                            request.tenantRepairStatus === "done" 
                                                ? "bg-emerald-500/20" 
                                                : request.tenantRepairStatus === "personnel_arrived"
                                                    ? "bg-cyan-500/20"
                                                    : "bg-primary/20"
                                        )}>
                                            {request.tenantRepairStatus === "done" ? (
                                                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                                            ) : request.tenantRepairStatus === "personnel_arrived" ? (
                                                <UserRound className="size-5 text-cyan-600 dark:text-cyan-400" />
                                            ) : (
                                                <Wrench className="size-5 text-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">
                                                {request.tenantRepairStatus === "personnel_arrived" 
                                                    ? "Personnel Has Arrived" 
                                                    : request.tenantRepairStatus === "repairing" 
                                                        ? "Repair In Progress" 
                                                        : "Repair Marked as Done"}
                                            </p>
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {request.tenantRepairStatus === "personnel_arrived"
                                                    ? "The tenant has confirmed the repair personnel has arrived."
                                                    : request.tenantRepairStatus === "repairing"
                                                        ? "The tenant is actively tracking the repair progress."
                                                        : "The tenant has marked the repair as completed."}
                                            </p>
                                        </div>
                                    </div>

                                    {request.tenantProvidedPhotos && request.tenantProvidedPhotos.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Verification Photos</p>
                                            <div className="flex gap-2">
                                                {request.tenantProvidedPhotos.map((img, i) => (
                                                    <button
                                                        key={`tenant-photo-${i}`}
                                                        onClick={() => {
                                                            setTenantPhotoIndex(i);
                                                            setIsTenantPhotoLightboxOpen(true);
                                                        }}
                                                        className="relative size-20 rounded-xl overflow-hidden border border-border shadow-sm hover:border-primary/50 hover:shadow-md transition-all group"
                                                    >
                                                        <Image src={img} alt={`Tenant proof ${i + 1}`} fill sizes="80px" className="object-cover" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                            <Expand className="size-5 text-white" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Process Summary */}
                            {processStep !== "pending" && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-5 sm:p-6 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="size-5 shrink-0" />
                                        <h3 className="text-sm font-bold">Action Confirmed</h3>
                                    </div>
                                    <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80 font-medium">{processSummary}</p>
                                </div>
                            )}

                            {/* Processing Choice Section */}
                            {isPending && processStep === "pending" && (
                                <div className={cn("bg-muted/20 border border-border/50 rounded-3xl p-5 sm:p-6 space-y-5 transition-all duration-300", selfRepairDecision === "allow" ? "opacity-50 pointer-events-none" : "")}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={cn("size-2 rounded-full", selfRepairDecision === "allow" ? "bg-muted-foreground" : "bg-amber-500 animate-pulse")} />
                                        <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">
                                            {selfRepairDecision === "allow" ? "Action Managed by Tenant" : "Action Required"}
                                        </h3>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="select-action" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                                                Select Action
                                            </label>
                                            <div className="relative group">
                                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 bg-primary/10 text-primary rounded-md group-focus-within:bg-primary group-focus-within:text-primary-foreground transition-colors pointer-events-none shadow-sm">
                                                    {processPlan === "landlord" ? <Hammer className="size-3.5" /> : <UserRound className="size-3.5" />}
                                                </div>
                                                <select
                                                    id="select-action"
                                                    value={processPlan}
                                                    onChange={(e) => setProcessPlan(e.target.value as ProcessPlan)}
                                                    className="w-full appearance-none rounded-xl border border-border bg-card/50 py-3.5 pl-[3.25rem] pr-10 text-sm font-bold text-foreground outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm hover:border-border cursor-pointer"
                                                >
                                                    <option value="landlord">Landlord Repair (You handle it)</option>
                                                    <option value="third_party">Third Party Repair (Assign contractor)</option>
                                                </select>
                                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                                                    <ChevronDown className="size-4" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dynamic Fields based on selection */}
                                        {processPlan === "third_party" && (
                                            <div className="pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                                <label htmlFor="repair-person-name" className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    Repair Person Name <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative group">
                                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 bg-muted text-muted-foreground rounded-md group-focus-within:bg-primary/10 group-focus-within:text-primary transition-colors pointer-events-none shadow-sm">
                                                        <UserRound className="size-3.5" />
                                                    </div>
                                                    <input
                                                        id="repair-person-name"
                                                        type="text"
                                                        value={thirdPartyPerson}
                                                        onChange={(event) => setThirdPartyPerson(event.target.value)}
                                                        placeholder="Enter full name for tenant safety"
                                                        className="w-full rounded-xl border border-border bg-card/50 py-3.5 pl-[3.25rem] pr-4 text-sm font-bold text-foreground outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm placeholder:text-muted-foreground/40 hover:border-border"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {formError && (
                                        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400">
                                            <ShieldCheck className="size-4 shrink-0" />
                                            {formError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 md:p-8 border-t border-border/50 bg-card mt-auto flex flex-col sm:flex-row items-center gap-3 shrink-0">
                            <button
                                onClick={() => void handleProcess()}
                                disabled={processStep === "completed" || isSaving}
                                className={cn(
                                    "w-full sm:flex-1 px-6 py-4 rounded-2xl font-bold uppercase tracking-wider text-sm transition-all shadow-sm flex items-center justify-center gap-2 group/btn relative overflow-hidden",
                                    processStep === "pending" 
                                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.2)] active:scale-[0.98]" 
                                        : (processStep === "in_progress" || processStep === "assigned")
                                            ? "bg-cyan-500 hover:bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-[0.98]"
                                            : (processStep === "completed" && selfRepairDecision === "allow")
                                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 cursor-default"
                                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default"
                                )}
                            >
                                {processStep === "pending" && (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        To Process
                                        <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-1" />
                                    </div>
                                )}
                                {processStep === "assigned" && (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <Hammer className="size-4 animate-bounce" />
                                        Repair On the Way
                                    </div>
                                )}
                                {processStep === "in_progress" && (
                                    selfRepairDecision === "allow" ? (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <MessageSquare className="size-4 animate-pulse" />
                                            Notify Tenant
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <CheckCircle2 className="size-4" />
                                            Mark as Completed
                                        </div>
                                    )
                                )}
                                {processStep === "completed" && (
                                    selfRepairDecision === "allow" ? (
                                        <div className="flex items-center gap-2 animate-in zoom-in fade-in duration-300">
                                            <Clock className="size-5 shrink-0" />
                                            Waiting for Tenant Update
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 animate-in zoom-in fade-in duration-300">
                                            <CheckCircle2 className="size-5 shrink-0" />
                                            Repair Completed
                                        </div>
                                    )
                                )}
                            </button>

                            {processStep === "completed" && selfRepairDecision === "allow" && (
                                <button
                                    onClick={async () => {
                                        const synced = await persistLandlordUpdate(
                                            { status: "in_progress", photoRequested: true },
                                            { status: "In Progress", photoRequested: true }
                                        );
                                        if (synced) {
                                            setProcessStep("in_progress");
                                        }
                                    }}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-muted hover:bg-muted/80 disabled:opacity-50 text-foreground transition-all shadow-sm border border-border/50 flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold animate-in fade-in slide-in-from-bottom-2"
                                >
                                    <Camera className="size-4" />
                                    Ask for Photo
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox Modal for Issue Images */}
            {isImageLightboxOpen && request.images && request.images.length > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
                    <button
                        onClick={() => setIsImageLightboxOpen(false)}
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50 border border-white/10"
                        aria-label="Close Lightbox"
                    >
                        <X className="size-6" />
                    </button>
                    
                    <img
                        src={request.images[currentImageIndex]}
                        alt="Enlarged view"
                        className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl rounded-xl animate-in zoom-in-95 duration-300"
                    />

                    {request.images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                disabled={currentImageIndex === 0}
                                className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors disabled:opacity-0 border border-white/10"
                            >
                                <ChevronLeft className="size-8" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                disabled={currentImageIndex === request.images.length - 1}
                                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors disabled:opacity-0 border border-white/10"
                            >
                                <ChevronRight className="size-8" />
                            </button>
                            
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 px-5 py-3 rounded-full backdrop-blur-md border border-white/10">
                                {request.images.map((_, idx) => (
                                    <button
                                        key={`lightbox-img-${idx}`}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={cn(
                                            "size-2.5 rounded-full transition-all",
                                            currentImageIndex === idx ? "bg-white w-8" : "bg-white/40 hover:bg-white"
                                        )}
                                        aria-label={`Go to image ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Lightbox Modal for Tenant Photos */}
            {isTenantPhotoLightboxOpen && request.tenantProvidedPhotos && request.tenantProvidedPhotos.length > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
                    <button
                        onClick={() => setIsTenantPhotoLightboxOpen(false)}
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50 border border-white/10"
                        aria-label="Close Lightbox"
                    >
                        <X className="size-6" />
                    </button>
                    
                    <div className="absolute top-6 left-6 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 px-4 py-2 rounded-full z-50">
                        <span className="text-xs font-bold text-emerald-400">Tenant Verification Photo</span>
                    </div>
                    
                    <img
                        src={request.tenantProvidedPhotos[tenantPhotoIndex]}
                        alt="Tenant verification photo"
                        className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl rounded-xl animate-in zoom-in-95 duration-300"
                    />

                    {request.tenantProvidedPhotos.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); prevTenantPhoto(); }}
                                disabled={tenantPhotoIndex === 0}
                                className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors disabled:opacity-0 border border-white/10"
                            >
                                <ChevronLeft className="size-8" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); nextTenantPhoto(); }}
                                disabled={tenantPhotoIndex === request.tenantProvidedPhotos.length - 1}
                                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors disabled:opacity-0 border border-white/10"
                            >
                                <ChevronRight className="size-8" />
                            </button>
                            
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 px-5 py-3 rounded-full backdrop-blur-md border border-white/10">
                                {request.tenantProvidedPhotos.map((_, idx) => (
                                    <button
                                        key={`tenant-lightbox-${idx}`}
                                        onClick={() => setTenantPhotoIndex(idx)}
                                        className={cn(
                                            "size-2.5 rounded-full transition-all",
                                            tenantPhotoIndex === idx ? "bg-white w-8" : "bg-white/40 hover:bg-white"
                                        )}
                                        aria-label={`Go to photo ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}


