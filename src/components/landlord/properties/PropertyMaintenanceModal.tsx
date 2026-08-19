"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import {
    X,
    Wrench,
    Search,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    ExternalLink,
    Building2,
    Camera,
    User,
    Sparkles,
    Filter,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MaintenanceRequestModal } from "@/components/landlord/maintenance/MaintenanceRequestModal";
import type { MaintenanceRequest } from "@/components/landlord/maintenance/MaintenanceDashboard";

interface PropertyMaintenanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    propertyName: string;
    propertyImage?: string | null;
}

export function PropertyMaintenanceModal({
    isOpen,
    onClose,
    propertyId,
    propertyName,
    propertyImage,
}: PropertyMaintenanceModalProps) {
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

    useEffect(() => {
        if (!isOpen || !propertyId) return;

        let isMounted = true;
        setIsLoading(true);

        const fetchMaintenance = async () => {
            try {
                const response = await fetch(`/api/landlord/maintenance?propertyId=${propertyId}`);
                const data = await response.json();
                if (isMounted) {
                    if (response.ok && Array.isArray(data.requests)) {
                        setRequests(data.requests);
                    } else {
                        setRequests([]);
                    }
                }
            } catch (err) {
                console.error("Failed to load property maintenance requests:", err);
                if (isMounted) setRequests([]);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchMaintenance();

        return () => {
            isMounted = false;
        };
    }, [isOpen, propertyId]);

    const filteredRequests = useMemo(() => {
        return requests.filter((r) => {
            const matchesSearch =
                r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.tenant.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" ||
                r.status.toLowerCase().replace(/\s+/g, "_") === statusFilter.toLowerCase().replace(/\s+/g, "_") ||
                r.status.toLowerCase() === statusFilter.toLowerCase();

            const matchesPriority =
                priorityFilter === "all" ||
                r.priority.toLowerCase() === priorityFilter.toLowerCase();

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [requests, searchQuery, statusFilter, priorityFilter]);

    const activeCount = useMemo(() => {
        return requests.filter(
            (r) => r.status === "Pending" || r.status === "Assigned" || r.status === "In Progress"
        ).length;
    }, [requests]);

    if (!isOpen) return null;

    return (
        <>
            <AnimatePresence>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[2.5rem] border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="relative size-12 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-white/5 flex items-center justify-center">
                                    {propertyImage ? (
                                        <Image
                                            src={propertyImage}
                                            alt={propertyName}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <Building2 className="size-6 text-amber-400" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2.5">
                                        <h3 className="text-xl font-black tracking-tight text-white truncate">
                                            {propertyName}
                                        </h3>
                                        <span className="shrink-0 rounded-full bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 text-[10px] font-black text-amber-400 uppercase tracking-wider">
                                            {activeCount} Active {activeCount === 1 ? "Ticket" : "Tickets"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-400 font-medium truncate mt-0.5">
                                        Maintenance & Service Requests
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <Link
                                    href="/landlord/maintenance"
                                    className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-neutral-300 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <span>Dashboard</span>
                                    <ExternalLink className="size-3.5" />
                                </Link>
                                <button
                                    onClick={onClose}
                                    className="flex size-9 items-center justify-center rounded-xl bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                        </div>

                        {/* Search & Filters */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-6 border-b border-white/5 bg-white/[0.01]">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                                <input
                                    type="text"
                                    placeholder="Search tickets by title, description, unit, tenant..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 py-2.5 text-xs font-medium text-white placeholder:text-neutral-500 outline-none focus:border-amber-400/50"
                                />
                            </div>

                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                                {["all", "pending", "in progress", "resolved"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setStatusFilter(tab)}
                                        className={cn(
                                            "rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-all shrink-0",
                                            statusFilter === tab
                                                ? "bg-amber-400 text-black font-black"
                                                : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content / Requests List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 max-h-[60vh]">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <Loader2 className="size-8 text-amber-400 animate-spin" />
                                    <p className="text-xs font-black uppercase tracking-widest text-neutral-500">
                                        Loading Maintenance Tickets…
                                    </p>
                                </div>
                            ) : filteredRequests.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-white/5 rounded-3xl p-8">
                                    <div className="size-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-500 mb-4">
                                        <Wrench className="size-6" />
                                    </div>
                                    <h4 className="text-base font-black text-white">No Maintenance Tickets</h4>
                                    <p className="text-xs text-neutral-400 max-w-sm mt-1 mb-6">
                                        {searchQuery
                                            ? "No requests matched your filter criteria."
                                            : "There are currently no active maintenance issues reported for this property."}
                                    </p>
                                    <Link
                                        href="/landlord/maintenance"
                                        className="flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-400/20"
                                    >
                                        <Wrench className="size-4" />
                                        <span>Open Maintenance Dashboard</span>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {filteredRequests.map((req) => (
                                        <div
                                            key={req.id}
                                            className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-white/20 hover:bg-white/[0.04]"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-black text-primary">
                                                                {req.unit || "General"}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                                                                    req.priority === "Critical"
                                                                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                                                        : req.priority === "High"
                                                                        ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                                                        : req.priority === "Medium"
                                                                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                                )}
                                                            >
                                                                {req.priority}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                                                                    req.status === "Resolved"
                                                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                                        : req.status === "In Progress"
                                                                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                                )}
                                                            >
                                                                {req.status}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-sm font-black text-white truncate group-hover:text-amber-400 transition-colors">
                                                            {req.title}
                                                        </h4>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-neutral-400 line-clamp-2 mt-1.5 leading-relaxed font-medium">
                                                    {req.description}
                                                </p>
                                            </div>

                                            {/* Footer metadata & Action */}
                                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div
                                                        className="size-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden relative text-white shadow-inner"
                                                        style={{ backgroundColor: req.tenantAvatarBgColor || "#8B5CF6" }}
                                                    >
                                                        {req.tenantAvatar ? (
                                                            <Image
                                                                src={req.tenantAvatar}
                                                                alt={req.tenant}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <span>{req.tenant.slice(0, 1).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-bold text-neutral-300 truncate">
                                                        {req.tenant}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {req.images && req.images.length > 0 && (
                                                        <span className="flex items-center gap-1 text-[10px] text-neutral-400 bg-white/5 px-2 py-1 rounded-lg">
                                                            <Camera className="size-3" />
                                                            {req.images.length}
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedRequest(req)}
                                                        className="rounded-lg bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-200 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                                                    >
                                                        Details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>

            {/* Maintenance Request Detail Modal */}
            {selectedRequest && (
                <MaintenanceRequestModal
                    isOpen={Boolean(selectedRequest)}
                    request={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    onRequestUpdated={(updated) => {
                        setRequests((prev) =>
                            prev.map((r) => (r.id === updated.id ? updated : r))
                        );
                        setSelectedRequest(updated);
                    }}
                />
            )}
        </>
    );
}
