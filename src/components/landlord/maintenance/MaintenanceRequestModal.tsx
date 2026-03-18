"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
    X,
    Clock,
    Calendar,
    Hammer,
    Wrench,
    CheckCircle2,
    MoreVertical,
    ArrowRight,
    MapPin,
    Building,
    MessageSquare,
    PhoneCall,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import type { MaintenanceRequest } from "./MaintenanceDashboard";

const FALLBACK_AVATAR =
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80";

interface MaintenanceRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: MaintenanceRequest | null;
}

export function MaintenanceRequestModal({ isOpen, onClose, request }: MaintenanceRequestModalProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (!request) return;
        setCurrentImageIndex(0);
    }, [request?.id]);

    if (!isOpen || !request) return null;

    const isCritical = request.priority === "Critical";
    const isPending = request.status === "Pending";

    const nextImage = () => {
        if (request.images && currentImageIndex < request.images.length - 1) {
            setCurrentImageIndex(prev => prev + 1);
        }
    };

    const prevImage = () => {
        if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pt-10 sm:pt-0">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-neutral-900 sm:rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button (Mobile Mobile mostly, or absolute top) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors border border-white/10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Left Side: Images Gallery */}
                <div className="w-full md:w-1/2 relative bg-neutral-950 flex flex-col shrink-0 min-h-[300px] md:min-h-full">
                    <div className="relative flex-1 group">
                        {request.images && request.images.length > 0 ? (
                            <>
                                <img
                                    src={request.images[currentImageIndex]}
                                    alt="Maintenance Issue"
                                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/40" />

                                {/* Image Navigation */}
                                {request.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            disabled={currentImageIndex === 0}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity border border-white/10 hover:bg-primary hover:text-black"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            disabled={currentImageIndex === request.images.length - 1}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity border border-white/10 hover:bg-primary hover:text-black"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>

                                        {/* Image Dots */}
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                                            {request.images.map((_: any, idx: number) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentImageIndex(idx)}
                                                    className={cn(
                                                        "w-2 h-2 rounded-full transition-all",
                                                        currentImageIndex === idx ? "bg-primary w-4" : "bg-white/50 hover:bg-white"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                                <Hammer className="w-16 h-16 text-neutral-800" />
                            </div>
                        )}

                        {/* Status Badges Layered on Image */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                            <span className={cn(
                                "px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-wider shadow-lg backdrop-blur-md",
                                request.status === "Pending" ? "bg-amber-500 text-black border-amber-400" :
                                    request.status === "In Progress" ? "bg-primary text-black border-primary/50" :
                                        request.status === "Assigned" ? "bg-cyan-500/90 text-white border-cyan-400/50" :
                                            "bg-emerald-500/90 text-white border-emerald-400/50"
                            )}>
                                {request.status}
                            </span>
                            <span className={cn(
                                "px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-wider shadow-lg backdrop-blur-md",
                                request.priority === "Critical" ? "bg-red-500 text-white border-red-400" :
                                    request.priority === "High" ? "bg-orange-500/90 text-white border-orange-400/50" :
                                        request.priority === "Medium" ? "bg-blue-500/90 text-white border-blue-400/50" :
                                            "bg-neutral-800/90 text-neutral-300 border-neutral-600"
                            )}>
                                {request.priority} Priority
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Details & Actions */}
                <div className="w-full md:w-1/2 flex flex-col h-full overflow-y-auto custom-scrollbar bg-neutral-900">
                    <div className="p-6 md:p-8 space-y-8 flex-1">

                        {/* Header Information */}
                        <div>
                            <div className="flex items-center gap-3 text-xs font-medium text-neutral-500 mb-3">
                                <span className="font-mono bg-white/5 px-2 py-1 rounded-md border border-white/5">{request.id}</span>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    Reported {request.reportedAt}
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-white leading-tight mb-2">{request.title}</h2>
                            <p className="text-neutral-400 text-sm leading-relaxed">{request.description}</p>
                        </div>

                        {/* Location Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-neutral-950 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Building className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Property</span>
                                    <span className="text-sm font-bold text-white block">{request.property}</span>
                                </div>
                            </div>
                            <div className="bg-neutral-950 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <MapPin className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Unit</span>
                                    <span className="text-sm font-bold text-white block">{request.unit}</span>
                                </div>
                            </div>
                        </div>

                        {/* People Involved */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-white/5 pb-2">Involved Parties</h3>

                            {/* Tenant */}
                            <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-3">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={request.tenantAvatar || FALLBACK_AVATAR}
                                        alt={request.tenant}
                                        className="w-10 h-10 rounded-full border border-white/10"
                                    />
                                    <div>
                                        <span className="text-[10px] font-bold text-neutral-500 uppercase">Tenant</span>
                                        <p className="text-sm font-bold text-white leading-tight">{request.tenant}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors">
                                        <MessageSquare className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors">
                                        <PhoneCall className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Assignee */}
                            <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center">
                                        <Wrench className="w-5 h-5 text-neutral-500" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-neutral-500 uppercase">Contractor</span>
                                        <p className="text-sm font-bold text-white leading-tight">
                                            {request.assignee ? request.assignee : <span className="text-amber-500">Unassigned</span>}
                                        </p>
                                        {request.scheduledFor && (
                                            <p className="text-xs text-primary font-medium flex items-center gap-1 mt-0.5">
                                                <Calendar className="w-3 h-3" />
                                                {request.scheduledFor}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {request.assignee ? (
                                    <button className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors">
                                        <MessageSquare className="w-4 h-4" />
                                    </button>
                                ) : null}
                            </div>
                        </div>

                    </div>

                    {/* Bottom Action Bar */}
                    <div className="p-6 md:p-8 border-t border-white/5 bg-neutral-950 mt-auto flex items-center gap-4">
                        {isPending ? (
                            <button className="flex-1 bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-[0.98] flex items-center justify-center gap-2">
                                Assign Contractor
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : request.status === "In Progress" || request.status === "Assigned" ? (
                            <button className="flex-1 bg-primary hover:bg-emerald-400 text-black px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.98] flex items-center justify-center gap-2">
                                Resolve Issue
                                <CheckCircle2 className="w-4 h-4" />
                            </button>
                        ) : (
                            <div className="flex-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                Issue Resolved
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        )}
                        <button className="p-3 rounded-xl bg-neutral-900 border border-white/10 text-white hover:bg-neutral-800 transition-colors">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
