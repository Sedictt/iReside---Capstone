"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { useTheme } from "next-themes";
import { X, Users, Wrench, Calendar, AlertCircle, RefreshCw, Eye } from "lucide-react";
import Image from "next/image";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { Skeleton } from "@/components/ui/Skeleton";
import { Unit } from "../types";

export interface UnitHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    unit: Unit | null;
    initialTab?: "tenants" | "maintenance";
    onOpenLease?: () => void;
}

interface TenantHistoryItem {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    leaseStart: string;
    leaseEnd: string;
    rent: number;
    securityDeposit: number;
    status: string;
    rawStatus: string;
    avatarUrl?: string | null;
    avatarBg?: string | null;
    createdAt: string;
}

interface MaintenanceHistoryItem {
    id: string;
    title: string;
    description: string;
    date: string;
    createdAt: string;
    resolvedAt?: string | null;
    status: string;
    rawStatus: string;
    priority: string;
    category?: string | null;
    cost: number;
    tenantName?: string | null;
}

interface UnitHistoryData {
    unit: {
        id: string;
        name: string;
        floor: number;
        status: string;
        rentAmount: number;
        propertyId: string;
        propertyName?: string;
    };
    tenants: TenantHistoryItem[];
    maintenance: MaintenanceHistoryItem[];
    expenses: Array<{
        id: string;
        category: string;
        amount: number;
        date: string;
        description: string;
    }>;
}

export const UnitHistoryModal = ({
    isOpen,
    onClose,
    unit,
    initialTab = "tenants",
    onOpenLease,
}: UnitHistoryModalProps) => {
    const [activeTab, setActiveTab] = useState<"tenants" | "maintenance">(initialTab);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [historyData, setHistoryData] = useState<UnitHistoryData | null>(null);

    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    const unitId = unit?.dbId || unit?.id;

    const fetchHistory = React.useCallback(async () => {
        if (!unitId) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/landlord/units/${encodeURIComponent(unitId)}/history`);
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to fetch history (status ${res.status})`);
            }
            const data: UnitHistoryData = await res.json();
            setHistoryData(data);
        } catch (err: any) {
            console.error("Failed to load unit history:", err);
            setError(err.message || "Failed to load unit history. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [unitId]);

    useEffect(() => {
        if (isOpen && unitId) {
            void fetchHistory();
        } else if (!isOpen) {
            setHistoryData(null);
            setError(null);
        }
    }, [isOpen, unitId, fetchHistory]);

    if (!unit) return null;

    const tenantHistory = historyData?.tenants || [];
    const maintenanceHistory = historyData?.maintenance || [];

    const unitDisplayName = unit.name?.trim().toLowerCase().startsWith("unit ")
        ? unit.name.trim()
        : `Unit ${unit.name}`;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/60 backdrop-blur-md" 
                        onClick={onClose}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl h-[600px] flex flex-col rounded-3xl border border-border bg-card shadow-[0_24px_60px_-30px_rgba(0,0,0,0.3)] overflow-hidden"
                    >
                        {/* Close button */}
                        <div className="absolute right-6 top-6 z-10">
                            <button 
                                type="button"
                                onClick={onClose} 
                                className="rounded-full p-2 transition-colors hover:bg-muted text-muted-foreground"
                                aria-label="Close modal"
                            >
                                <X className="size-6" />
                            </button>
                        </div>

                        {/* Modal Header */}
                        <div className="p-8 pb-4">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <span className="material-icons-round text-2xl">history</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-2xl font-black tracking-tight text-foreground truncate">
                                        {unitDisplayName} History
                                    </h2>
                                    <p className="text-sm font-medium text-muted-foreground truncate">
                                        {historyData?.unit?.propertyName ? `${historyData.unit.propertyName} • ` : ""}Full audit trail and historical logs
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Tab Switcher */}
                        <div className="px-8 mb-4 flex items-center justify-between">
                            <div className="flex gap-2 p-1.5 rounded-2xl bg-muted w-fit">
                                <button 
                                    type="button"
                                    onClick={() => setActiveTab("tenants")}
                                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                        activeTab === "tenants" 
                                            ? "bg-card text-primary shadow-sm" 
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <Users className="size-3.5" />
                                    Tenants
                                    {!loading && tenantHistory.length > 0 && (
                                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
                                            {tenantHistory.length}
                                        </span>
                                    )}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setActiveTab("maintenance")}
                                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                        activeTab === "maintenance" 
                                            ? "bg-card text-primary shadow-sm" 
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <Wrench className="size-3.5" />
                                    Maintenance
                                    {!loading && maintenanceHistory.length > 0 && (
                                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
                                            {maintenanceHistory.length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Refresh Button */}
                            {!loading && (
                                <button
                                    type="button"
                                    onClick={() => void fetchHistory()}
                                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-xs flex items-center gap-1"
                                    title="Reload latest history data"
                                >
                                    <RefreshCw className="size-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Main Body */}
                        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar-premium">
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={`skeleton-${i}`} className="p-5 rounded-2xl border border-border bg-muted/20 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="size-10 rounded-full" />
                                                <div className="flex-1 space-y-1.5">
                                                    <Skeleton className="h-4 w-1/3 rounded-md" />
                                                    <Skeleton className="h-3 w-1/2 rounded-md opacity-60" />
                                                </div>
                                                <Skeleton className="h-5 w-16 rounded-full" />
                                            </div>
                                            <div className="pt-2 border-t border-border/40 flex justify-between">
                                                <Skeleton className="h-3 w-24 rounded-md" />
                                                <Skeleton className="h-3 w-16 rounded-md" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="p-8 text-center border border-destructive/20 rounded-2xl bg-destructive/5 space-y-3 my-4">
                                    <AlertCircle className="size-8 mx-auto text-destructive opacity-80" />
                                    <p className="text-sm font-black text-foreground">{error}</p>
                                    <button 
                                        type="button" 
                                        onClick={() => void fetchHistory()} 
                                        className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground hover:opacity-90 transition-all"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : activeTab === "tenants" ? (
                                tenantHistory.length === 0 ? (
                                    <div className="py-16 text-center text-muted-foreground space-y-2">
                                        <Users className="size-10 mx-auto opacity-20" />
                                        <p className="text-sm font-black text-foreground">No Lease History Found</p>
                                        <p className="text-xs">No active or past leases recorded for {unitDisplayName}.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {tenantHistory.map((item) => (
                                            <div key={item.id} className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-muted/30 transition-colors hover:bg-muted/50">
                                                {/* Tenant Avatar */}
                                                <div className="relative size-10 shrink-0">
                                                    {item.avatarUrl ? (
                                                        <div className="size-10 rounded-full overflow-hidden border border-border">
                                                            <Image 
                                                                src={item.avatarUrl} 
                                                                alt={item.name} 
                                                                width={40} 
                                                                height={40} 
                                                                className="object-cover size-full" 
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div 
                                                            className="flex size-10 items-center justify-center rounded-full text-white text-[10px] font-black"
                                                            style={{ backgroundColor: item.avatarBg || "var(--primary)" }}
                                                        >
                                                            {item.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tenant Info & Dates */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm font-black text-foreground truncate">{item.name}</p>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 ${
                                                            item.status === "Active" 
                                                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                                                                : item.status === "Completed"
                                                                ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                                                : item.status === "Terminated Early"
                                                                ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                                        }`}>
                                                            {item.status}
                                                        </span>
                                                    </div>

                                                    <p className="text-[10px] font-black text-muted-foreground mt-1 flex items-center gap-1.5 truncate">
                                                        <Calendar className="size-3 shrink-0 opacity-60" />
                                                        {item.leaseStart ? <ClientOnlyDate date={item.leaseStart} /> : "N/A"}
                                                        <span>&mdash;</span>
                                                        {item.leaseEnd ? <ClientOnlyDate date={item.leaseEnd} /> : "Ongoing"}
                                                    </p>

                                                    {item.email && (
                                                        <p className="text-[10px] text-muted-foreground/80 truncate mt-0.5">
                                                            {item.email}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Rent & Action */}
                                                <div className="text-right shrink-0">
                                                    <p className="text-xs font-black text-foreground">
                                                        ₱{item.rent.toLocaleString()}
                                                    </p>
                                                    <p className="text-[9px] font-black text-muted-foreground">Monthly Rent</p>
                                                    {onOpenLease && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                onClose();
                                                                onOpenLease();
                                                            }}
                                                            className="text-[9px] font-black text-primary uppercase tracking-wider hover:underline mt-1 inline-flex items-center gap-0.5"
                                                        >
                                                            <Eye className="size-3" />
                                                            View Lease
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                maintenanceHistory.length === 0 ? (
                                    <div className="py-16 text-center text-muted-foreground space-y-2">
                                        <Wrench className="size-10 mx-auto opacity-20" />
                                        <p className="text-sm font-black text-foreground">No Maintenance Records Found</p>
                                        <p className="text-xs">No repair requests or service logs reported for {unitDisplayName}.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {maintenanceHistory.map((item) => (
                                            <div key={item.id} className="flex items-start gap-4 p-5 rounded-2xl border border-border bg-muted/30 transition-colors hover:bg-muted/50">
                                                {/* Category Icon */}
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mt-0.5">
                                                    <Wrench className="size-5" />
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm font-black text-foreground truncate">{item.title}</p>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${
                                                            item.status === "Completed"
                                                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                                                : item.status === "In Progress"
                                                                ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                                        }`}>
                                                            {item.status}
                                                        </span>
                                                    </div>

                                                    <p className="text-[10px] font-medium text-muted-foreground line-clamp-2 mt-1">
                                                        {item.description}
                                                    </p>

                                                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[9px] font-black text-muted-foreground">
                                                        <span>
                                                            <ClientOnlyDate date={item.date} />
                                                        </span>
                                                        {item.category && (
                                                            <>
                                                                <span>&bull;</span>
                                                                <span className="capitalize">{item.category}</span>
                                                            </>
                                                        )}
                                                        {item.priority && item.priority !== "normal" && (
                                                            <>
                                                                <span>&bull;</span>
                                                                <span className="uppercase text-rose-500">{item.priority} priority</span>
                                                            </>
                                                        )}
                                                        {item.tenantName && (
                                                            <>
                                                                <span>&bull;</span>
                                                                <span>Reported by {item.tenantName}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Cost Column */}
                                                <div className="text-right shrink-0">
                                                    {item.cost > 0 ? (
                                                        <>
                                                            <p className="text-xs font-black text-foreground">₱{item.cost.toLocaleString()}</p>
                                                            <p className="text-[9px] font-black text-muted-foreground">Logged Cost</p>
                                                        </>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-muted-foreground/60 italic">
                                                            No cost logged
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-border bg-muted/20">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-[0.2em] transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-primary/20"
                            >
                                Close History View
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
