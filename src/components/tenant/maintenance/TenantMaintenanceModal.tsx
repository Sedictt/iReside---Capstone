"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
    X,
    Clock,
    Wrench,
    CheckCircle2,
    Hammer,
    Camera,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    ShieldCheck,
    UserRound,
    MapPin
} from "lucide-react";

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

interface TenantMaintenanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: MaintenanceRequest | null;
    onUpdateRequest?: (updated: MaintenanceRequest) => void;
}

export function TenantMaintenanceModal({ isOpen, onClose, request, onUpdateRequest }: TenantMaintenanceModalProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!isOpen || !request) return null;

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

    const getStatusStep = () => {
        if (request.status === "Pending") return 1;
        if (request.status === "Assigned" || request.status === "In Progress") return 2;
        if (request.status === "Resolved") return 3;
        return 1;
    };

    const currentStep = getStatusStep();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <button 
                className="absolute inset-0 cursor-default" 
                onClick={onClose}
                aria-label="Close maintenance detail"
            />

            <div className="relative w-full max-w-5xl bg-background rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] border border-border animate-in zoom-in-95 duration-300">
                {/* Left Panel: Images & Info */}
                <div className="w-full md:w-1/2 flex flex-col bg-muted/30 border-r border-border/50 relative">
                    {/* Images */}
                    <div className="relative h-64 md:h-full bg-black/5 shrink-0 flex items-center justify-center overflow-hidden">
                        {request.images && request.images.length > 0 ? (
                            <>
                                <Image
                                    src={request.images[currentImageIndex]}
                                    alt={`Image ${currentImageIndex + 1}`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover"
                                />
                                {request.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                            disabled={currentImageIndex === 0}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors disabled:opacity-0 backdrop-blur-md"
                                        >
                                            <ChevronLeft className="size-5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                            disabled={currentImageIndex === request.images.length - 1}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors disabled:opacity-0 backdrop-blur-md"
                                        >
                                            <ChevronRight className="size-5" />
                                        </button>
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                                            {request.images.map((_, idx) => (
                                                <div
                                                    key={`img-dot-${idx}`}
                                                    className={cn(
                                                        "size-1.5 rounded-full transition-all",
                                                        currentImageIndex === idx ? "bg-white w-4" : "bg-white/50"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground/50">
                                <ImageIcon className="size-16 mb-4 opacity-20" />
                                <p className="text-sm font-semibold">No images provided</p>
                            </div>
                        )}

                        {/* Location HUD Overlay */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            <span className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider border backdrop-blur-md shadow-sm w-fit",
                                request.priority === "Critical" ? "bg-red-500/90 text-white border-red-400" :
                                request.priority === "High" ? "bg-orange-500/90 text-white border-orange-400" :
                                request.priority === "Medium" ? "bg-blue-500/90 text-white border-blue-400" :
                                "bg-neutral-800/90 text-neutral-300 border-neutral-600"
                            )}>
                                {request.priority} Priority
                            </span>
                            <div className="bg-background/80 backdrop-blur-md px-3 py-2 rounded-xl border border-border/50 shadow-sm flex flex-col gap-1 w-fit">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <MapPin className="size-3 shrink-0" />
                                    <span className="text-[10px] font-semibold uppercase tracking-widest truncate max-w-[150px]">
                                        {request.property}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-foreground">
                                    <span className="text-sm font-semibold truncate max-w-[150px]">
                                        Unit {request.unit}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Content & Tracker */}
                <div className="w-full md:w-1/2 flex flex-col h-[50vh] md:h-auto">
                    {/* Header */}
                    <div className="p-6 md:p-8 flex items-start justify-between gap-4 border-b border-border/50 shrink-0">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border/50">
                                    ID: {request.id.split('-')[0]}
                                </span>
                                <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                                    <Clock className="size-3" />
                                    {request.reportedAt}
                                </span>
                            </div>
                            <h2 className="text-2xl font-semibold text-foreground leading-tight tracking-tight mb-2">
                                {request.title}
                            </h2>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {request.description}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-muted hover:bg-muted-foreground/10 rounded-full transition-colors shrink-0"
                            aria-label="Close Modal"
                        >
                            <X className="size-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Status Tracker */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-muted/10 relative custom-scrollbar">
                        <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
                        
                        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-6 pl-2">
                            Repair Status Timeline
                        </h3>
                        
                        <div className="relative space-y-4 before:absolute before:inset-0 before:ml-[19px] before:-translate-x-px before:h-full before:w-0.5 before:bg-border/60">
                            
                            {/* Step 1: Submitted */}
                            <div className="relative pl-12 pr-2">
                                <div className={cn(
                                    "absolute left-2 top-4 size-6 rounded-full border-[3px] border-background flex items-center justify-center shadow-sm z-10 transition-all duration-500",
                                    currentStep >= 1 ? "bg-primary ring-4 ring-primary/20 scale-110" : "bg-muted scale-100"
                                )}>
                                    {currentStep >= 1 && <CheckCircle2 className="size-3 text-primary-foreground" />}
                                </div>
                                <div className={cn(
                                    "p-4 rounded-2xl border transition-all duration-500",
                                    currentStep === 1 ? "bg-card border-border shadow-sm ring-1 ring-primary/10" : "bg-transparent border-transparent hover:bg-muted/50",
                                    currentStep > 1 ? "opacity-70" : "opacity-100"
                                )}>
                                    <h4 className={cn("text-sm font-semibold tracking-tight", currentStep === 1 ? "text-primary" : "text-foreground")}>Request Submitted</h4>
                                    <p className="text-xs font-medium text-muted-foreground mt-1 leading-relaxed">Your request was successfully sent to your landlord.</p>
                                </div>
                            </div>

                            {/* Step 2: Self-Repair Review (Only if requested) */}
                            {request.selfRepairRequested && (
                                <div className="relative pl-12 pr-2">
                                    <div className={cn(
                                        "absolute left-2 top-4 size-6 rounded-full border-[3px] border-background flex items-center justify-center shadow-sm z-10 transition-all duration-500",
                                        currentStep >= 2 ? "bg-primary ring-4 ring-primary/20 scale-110" : "bg-muted scale-100"
                                    )}>
                                        {currentStep >= 2 && (
                                            request.selfRepairDecision === "rejected" ? <X className="size-3.5 text-primary-foreground" /> : <ShieldCheck className="size-3.5 text-primary-foreground" />
                                        )}
                                    </div>
                                    <div className={cn(
                                        "p-4 rounded-2xl border transition-all duration-500",
                                        currentStep >= 2 ? "bg-card border-border shadow-sm ring-1 ring-border" : "bg-transparent border-transparent hover:bg-muted/50",
                                        currentStep > 2 || (request.selfRepairDecision === "rejected" && request.repairMethod) ? "opacity-70" : "opacity-100"
                                    )}>
                                        <h4 className={cn("text-sm font-semibold tracking-tight", currentStep >= 2 ? "text-primary" : "text-foreground")}>
                                            {request.selfRepairDecision === "approved" 
                                                ? "Self-Repair Approved" 
                                                : request.selfRepairDecision === "rejected"
                                                ? "Self-Repair Denied"
                                                : "Self-Repair Pending Review"}
                                        </h4>
                                        <p className="text-xs font-medium text-muted-foreground mt-1 leading-relaxed">
                                            {request.selfRepairDecision === "approved"
                                                ? "The landlord approved your self-repair request." 
                                                : request.selfRepairDecision === "rejected"
                                                ? "The landlord denied the self-repair request."
                                                : "The landlord is reviewing your request."}
                                        </p>

                                        {request.selfRepairDecision === "approved" && currentStep === 2 && (
                                            <>
                                                {/* Update Repair Progress */}
                                                <div className="mt-5 bg-muted/50 border border-border/60 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                                                    <h5 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                                                        Update Repair Progress
                                                    </h5>
                                                    
                                                    <div className="mt-6 bg-muted/20 p-1.5 rounded-[24px] border border-border/50 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                                        <button 
                                                            onClick={() => onUpdateRequest?.({ ...request, tenantRepairStatus: "repairing" })}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center gap-3 py-6 rounded-[20px] transition-all duration-300 group relative",
                                                                request.tenantRepairStatus === "repairing" 
                                                                    ? "bg-background shadow-xl shadow-black/5 text-primary scale-[1.02] ring-1 ring-border" 
                                                                    : "bg-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "size-10 rounded-full flex items-center justify-center transition-all duration-300",
                                                                request.tenantRepairStatus === "repairing" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:bg-background"
                                                            )}>
                                                                <Wrench className="size-5" />
                                                            </div>
                                                            <span className="text-[9px] font-semibold uppercase tracking-widest">Repairing</span>
                                                            {request.tenantRepairStatus === "repairing" && (
                                                                <div className="absolute -top-1 -right-1 size-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in duration-300">
                                                                    <CheckCircle2 className="size-2.5" />
                                                                </div>
                                                            )}
                                                        </button>
                                                        <button 
                                                            onClick={() => onUpdateRequest?.({ ...request, tenantRepairStatus: "done" })}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center gap-3 py-6 rounded-[20px] transition-all duration-300 group relative",
                                                                request.tenantRepairStatus === "done" 
                                                                    ? "bg-background shadow-xl shadow-black/5 text-primary scale-[1.02] ring-1 ring-border" 
                                                                    : "bg-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "size-10 rounded-full flex items-center justify-center transition-all duration-300",
                                                                request.tenantRepairStatus === "done" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:bg-background"
                                                            )}>
                                                                <CheckCircle2 className="size-5" />
                                                            </div>
                                                            <span className="text-[9px] font-semibold uppercase tracking-widest">Done</span>
                                                            {request.tenantRepairStatus === "done" && (
                                                                <div className="absolute -top-1 -right-1 size-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in duration-300">
                                                                    <CheckCircle2 className="size-2.5" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    </div>
                                                    {request.tenantRepairStatus === "done" && (
                                                        <p className="text-[10px] text-muted-foreground mt-3 text-center animate-in fade-in">Waiting for landlord to request a photo or resolve the ticket.</p>
                                                    )}
                                                </div>

                                                {/* Action Required Box */}
                                                {request.photoRequested && (
                                                    <div className={cn(
                                                        "mt-5 rounded-2xl p-4 shadow-sm relative overflow-hidden group border transition-colors",
                                                        request.tenantProvidedPhotos && request.tenantProvidedPhotos.length > 0 
                                                            ? "bg-emerald-500/5 border-emerald-500/20" 
                                                            : "bg-amber-500/5 border-amber-500/20"
                                                    )}>
                                                        <div className={cn(
                                                            "absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-70 pointer-events-none",
                                                            request.tenantProvidedPhotos && request.tenantProvidedPhotos.length > 0 ? "from-emerald-500/10" : "from-amber-500/10"
                                                        )} />
                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className={cn(
                                                                    "flex size-6 items-center justify-center rounded-full",
                                                                    request.tenantProvidedPhotos && request.tenantProvidedPhotos.length > 0 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                                                )}>
                                                                    {request.tenantProvidedPhotos && request.tenantProvidedPhotos.length > 0 ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
                                                                </div>
                                                                <h5 className={cn(
                                                                    "text-xs font-semibold uppercase tracking-widest",
                                                                    request.tenantProvidedPhotos && request.tenantProvidedPhotos.length > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
                                                                )}>
                                                                    {request.tenantProvidedPhotos && request.tenantProvidedPhotos.length > 0 ? "Photo Uploaded" : "Action Required"}
                                                                </h5>
                                                            </div>
                                                            
                                                            {request.tenantProvidedPhotos && request.tenantProvidedPhotos.length > 0 ? (
                                                                <div className="space-y-3 animate-in fade-in">
                                                                    <div className="flex gap-2">
                                                                        {request.tenantProvidedPhotos.map((img, i) => (
                                                                            <div key={img} className="relative size-16 rounded-lg overflow-hidden border border-border shadow-sm">
                                                                                <Image src={img} alt={`Proof ${i}`} fill sizes="64px" className="object-cover" />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-medium">The landlord will review the photo to resolve the request.</p>
                                                                </div>
                                                            ) : (
                                                                <div className="animate-in fade-in">
                                                                    <p className="text-xs font-medium text-amber-700/80 dark:text-amber-300/80 mb-4 leading-relaxed">
                                                                        Please upload a photo proof of the completed repair to finalize this request.
                                                                    </p>
                                                                    <button 
                                                                        onClick={() => {
                                                                            onUpdateRequest?.({
                                                                                ...request,
                                                                                tenantProvidedPhotos: [
                                                                                    "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=300&q=80"
                                                                                ]
                                                                            });
                                                                        }}
                                                                        className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                                    >
                                                                        <Camera className="size-4" />
                                                                        Upload Photo
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Repair Assignment (Only if NOT self repair, OR self repair denied) */}
                            {(!request.selfRepairRequested || request.selfRepairDecision === "rejected") && (
                                <div className="relative pl-12 pr-2">
                                    <div className={cn(
                                        "absolute left-2 top-4 size-6 rounded-full border-[3px] border-background flex items-center justify-center shadow-sm z-10 transition-all duration-500",
                                        currentStep >= 2 && request.repairMethod ? "bg-cyan-500 ring-4 ring-cyan-500/20 scale-110" : "bg-muted scale-100"
                                    )}>
                                        {currentStep >= 2 && request.repairMethod && (
                                            request.repairMethod === "third_party" ? <UserRound className="size-3.5 text-white" /> : <Hammer className="size-3.5 text-white" />
                                        )}
                                    </div>
                                    <div className={cn(
                                        "p-4 rounded-2xl border transition-all duration-500",
                                        currentStep >= 2 && request.repairMethod ? "bg-card border-border shadow-sm ring-1 ring-border" : "bg-transparent border-transparent hover:bg-muted/50",
                                        currentStep < 2 || !request.repairMethod || currentStep === 3 ? "opacity-70" : "opacity-100"
                                    )}>
                                        <h4 className={cn("text-sm font-semibold tracking-tight", currentStep >= 2 && request.repairMethod ? "text-cyan-600 dark:text-cyan-500" : "text-foreground")}>
                                            {request.repairMethod === "landlord" ? "Landlord Repair" : request.repairMethod === "third_party" ? "Third-Party Repair" : "Repair Pending Assignment"}
                                        </h4>
                                        <p className="text-xs font-medium text-muted-foreground mt-1 leading-relaxed">
                                            {request.repairMethod === "landlord" ? (
                                                "The landlord will personally handle this repair."
                                            ) : request.repairMethod === "third_party" ? (
                                                <>
                                                    A third-party professional (<span className="text-foreground font-bold">{request.thirdPartyName || "Contractor"}</span>) has been assigned.
                                                </>
                                            ) : (
                                                "The landlord is assigning a repair method."
                                            )}
                                        </p>

                                        {request.repairMethod === "third_party" && currentStep === 2 && (
                                            <>
                                                {/* Update Repair Progress for Third-Party */}
                                                <div className="mt-5 bg-muted/50 border border-border/60 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                                                    <h5 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                                                        Update Repair Progress
                                                    </h5>
                                                    
                                                    <div className="mt-6 bg-muted/20 p-1.5 rounded-[24px] border border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                                        <button 
                                                            onClick={() => onUpdateRequest?.({ ...request, tenantRepairStatus: "personnel_arrived" })}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center gap-3 py-6 rounded-[20px] transition-all duration-300 group relative",
                                                                request.tenantRepairStatus === "personnel_arrived" 
                                                                    ? "bg-background shadow-xl shadow-black/5 text-primary scale-[1.02] ring-1 ring-border" 
                                                                    : "bg-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "size-10 rounded-full flex items-center justify-center transition-all duration-300",
                                                                request.tenantRepairStatus === "personnel_arrived" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:bg-background"
                                                            )}>
                                                                <UserRound className="size-5" />
                                                            </div>
                                                            <span className="text-[9px] font-semibold uppercase tracking-widest">Arrived</span>
                                                            {request.tenantRepairStatus === "personnel_arrived" && (
                                                                <div className="absolute -top-1 -right-1 size-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in duration-300">
                                                                    <CheckCircle2 className="size-2.5" />
                                                                </div>
                                                            )}
                                                        </button>
                                                        <button 
                                                            onClick={() => onUpdateRequest?.({ ...request, tenantRepairStatus: "repairing" })}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center gap-3 py-6 rounded-[20px] transition-all duration-300 group relative",
                                                                request.tenantRepairStatus === "repairing" 
                                                                    ? "bg-background shadow-xl shadow-black/5 text-primary scale-[1.02] ring-1 ring-border" 
                                                                    : "bg-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "size-10 rounded-full flex items-center justify-center transition-all duration-300",
                                                                request.tenantRepairStatus === "repairing" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:bg-background"
                                                            )}>
                                                                <Wrench className="size-5" />
                                                            </div>
                                                            <span className="text-[9px] font-semibold uppercase tracking-widest">Repairing</span>
                                                            {request.tenantRepairStatus === "repairing" && (
                                                                <div className="absolute -top-1 -right-1 size-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in duration-300">
                                                                    <CheckCircle2 className="size-2.5" />
                                                                </div>
                                                            )}
                                                        </button>
                                                        <button 
                                                            onClick={() => onUpdateRequest?.({ ...request, tenantRepairStatus: "done" })}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center gap-3 py-6 rounded-[20px] transition-all duration-300 group relative",
                                                                request.tenantRepairStatus === "done" 
                                                                    ? "bg-background shadow-xl shadow-black/5 text-primary scale-[1.02] ring-1 ring-border" 
                                                                    : "bg-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "size-10 rounded-full flex items-center justify-center transition-all duration-300",
                                                                request.tenantRepairStatus === "done" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:bg-background"
                                                            )}>
                                                                <CheckCircle2 className="size-5" />
                                                            </div>
                                                            <span className="text-[9px] font-semibold uppercase tracking-widest">Done</span>
                                                            {request.tenantRepairStatus === "done" && (
                                                                <div className="absolute -top-1 -right-1 size-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in duration-300">
                                                                    <CheckCircle2 className="size-2.5" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    </div>
                                                    {request.tenantRepairStatus === "done" && (
                                                        <p className="text-[10px] text-muted-foreground mt-3 text-center animate-in fade-in">Please upload a photo of the completed repair for landlord verification.</p>
                                                    )}
                                                </div>

                                                {/* Photo Upload for Third-Party Verification */}
                                                {request.tenantRepairStatus === "done" && (
                                                    <div className={cn(
                                                        "mt-5 rounded-2xl p-4 shadow-sm relative overflow-hidden group border transition-colors",
                                                        request.tenantProvidedPhotos && request.tenantProvidedPhotos.length > 0 
                                                            ? "bg-emerald-500/5 border-emerald-500/20" 
                                                            : "bg-amber-500/5 border-amber-500/20"
                                                    )}>
                                                        <div className={cn(
                                                            "absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-70 pointer-events-none",
                                                            request.tenantProvidedPhotos && request.tenantProvidedPhotos.length > 0 ? "from-emerald-500/10" : "from-amber-500/10"
                                                        )} />
                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className={cn(
                                                                    "flex size-6 items-center justify-center rounded-full",
                                                                    request.tenantProvidedPhotos && request.tenantProvidedPhotos.length > 0 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                                                )}>
                                                                    {request.tenantProvidedPhotos && request.tenantProvidedPhotos.length > 0 ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
                                                                </div>
                                                                <h5 className={cn(
                                                                    "text-xs font-semibold uppercase tracking-widest",
                                                                    request.tenantProvidedPhotos && request.tenantProvidedPhotos.length > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
                                                                )}>
                                                                    {request.tenantProvidedPhotos && request.tenantProvidedPhotos.length > 0 ? "Photo Uploaded" : "Action Required"}
                                                                </h5>
                                                            </div>
                                                            
                                                            {request.tenantProvidedPhotos && request.tenantProvidedPhotos.length > 0 ? (
                                                                <div className="space-y-3 animate-in fade-in">
                                                                    <div className="flex gap-2">
                                                                        {request.tenantProvidedPhotos.map((img, i) => (
                                                                            <div key={img} className="relative size-16 rounded-lg overflow-hidden border border-border shadow-sm">
                                                                                <Image src={img} alt={`Proof ${i}`} fill sizes="64px" className="object-cover" />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-medium">The landlord will review the photo to verify the repair.</p>
                                                                </div>
                                                            ) : (
                                                                <div className="animate-in fade-in">
                                                                    <p className="text-xs font-medium text-amber-700/80 dark:text-amber-300/80 mb-4 leading-relaxed">
                                                                        Please upload a photo proof of the completed repair so the landlord can verify the third-party work.
                                                                    </p>
                                                                    <button 
                                                                        onClick={() => {
                                                                            onUpdateRequest?.({
                                                                                ...request,
                                                                                tenantProvidedPhotos: [
                                                                                    "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=300&q=80"
                                                                                ]
                                                                            });
                                                                        }}
                                                                        className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                                    >
                                                                        <Camera className="size-4" />
                                                                        Upload Photo
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Resolved */}
                            <div className="relative pl-12 pr-2">
                                <div className={cn(
                                    "absolute left-2 top-4 size-6 rounded-full border-[3px] border-background flex items-center justify-center shadow-sm z-10 transition-all duration-500",
                                    currentStep === 3 ? "bg-emerald-500 ring-4 ring-emerald-500/20 scale-110" : "bg-muted scale-100"
                                )}>
                                    {currentStep === 3 && <CheckCircle2 className="size-3 text-white" />}
                                </div>
                                <div className={cn(
                                    "p-4 rounded-2xl border transition-all duration-500",
                                    currentStep === 3 ? "bg-emerald-500/5 border-emerald-500/20 shadow-sm ring-1 ring-emerald-500/20" : "bg-transparent border-transparent hover:bg-muted/50",
                                    currentStep < 3 ? "opacity-70" : "opacity-100"
                                )}>
                                    <h4 className={cn("text-sm font-semibold tracking-tight", currentStep === 3 ? "text-emerald-600 dark:text-emerald-500" : "text-foreground")}>Resolved</h4>
                                    <p className="text-xs font-medium text-muted-foreground mt-1 leading-relaxed">
                                        The maintenance request has been completed and closed.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


