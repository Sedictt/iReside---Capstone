"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import {
    X,
    Users,
    Search,
    Phone,
    Mail,
    Calendar,
    DollarSign,
    ExternalLink,
    Loader2,
    MessageSquare,
    UserPlus,
    Building2,
    CheckCircle2,
    Clock,
    AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TenantDetailModal } from "@/components/landlord/tenants/TenantDetailModal";
import { AnimatedFilterPills } from "@/components/ui/AnimatedFilterPills";

interface PropertyTenantsModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    propertyName: string;
    propertyImage?: string | null;
}

interface TenantItem {
    id: string;
    name: string;
    property: string;
    unit: string;
    status: "Active" | "Moving Out" | "Evicted";
    rentAmount: number | null;
    leaseEnd: string | null;
    phone: string;
    email: string;
    avatar: string;
    avatarUrl: string | null;
    avatarBgColor: string | null;
    paymentStatus: "paid" | "late" | "pending";
    onboardingStatus: "pending" | "in_progress" | "completed" | "not_started";
}

export function PropertyTenantsModal({
    isOpen,
    onClose,
    propertyId,
    propertyName,
    propertyImage,
}: PropertyTenantsModalProps) {
    const [tenants, setTenants] = useState<TenantItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !propertyId) return;

        let isMounted = true;
        setIsLoading(true);

        const fetchTenants = async () => {
            try {
                const response = await fetch(`/api/landlord/tenants?propertyId=${propertyId}`);
                const data = await response.json();
                if (isMounted) {
                    if (response.ok && Array.isArray(data.tenants)) {
                        setTenants(data.tenants);
                    } else {
                        setTenants([]);
                    }
                }
            } catch (err) {
                console.error("Failed to load property tenants:", err);
                if (isMounted) setTenants([]);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchTenants();

        return () => {
            isMounted = false;
        };
    }, [isOpen, propertyId]);

    const filteredTenants = useMemo(() => {
        return tenants.filter((t) => {
            const matchesSearch =
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.phone.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" || t.status.toLowerCase() === statusFilter.toLowerCase();

            return matchesSearch && matchesStatus;
        });
    }, [tenants, searchQuery, statusFilter]);

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
                                        <Building2 className="size-6 text-primary" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2.5">
                                        <h3 className="text-xl font-black tracking-tight text-white truncate">
                                            {propertyName}
                                        </h3>
                                        <span className="shrink-0 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-black text-primary uppercase tracking-wider">
                                            {tenants.length} {tenants.length === 1 ? "Tenant" : "Tenants"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-400 font-medium truncate mt-0.5">
                                        Active Occupancy & Tenant Roster
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <Link
                                    href={`/landlord/tenants`}
                                    className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-neutral-300 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <span>Directory</span>
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

                        {/* Search & Status Filters */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-6 border-b border-white/5 bg-white/[0.01]">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                                <input
                                    type="text"
                                    placeholder="Search by tenant name, unit number, email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 py-2.5 text-xs font-medium text-white placeholder:text-neutral-500 outline-none focus:border-primary/50"
                                />
                            </div>

                            <AnimatedFilterPills
                                variant="primary"
                                size="sm"
                                options={["all", "active", "moving out", "evicted"]}
                                activeId={statusFilter}
                                onChange={(tab) => setStatusFilter(tab)}
                                layoutGroupId="property-tenants-filter-pills"
                            />
                        </div>

                        {/* Content / Tenant List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 max-h-[60vh]">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <Loader2 className="size-8 text-primary animate-spin" />
                                    <p className="text-xs font-black uppercase tracking-widest text-neutral-500">
                                        Loading Tenants…
                                    </p>
                                </div>
                            ) : filteredTenants.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-white/5 rounded-3xl p-8">
                                    <div className="size-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-500 mb-4">
                                        <Users className="size-6" />
                                    </div>
                                    <h4 className="text-base font-black text-white">No Tenants Found</h4>
                                    <p className="text-xs text-neutral-400 max-w-sm mt-1 mb-6">
                                        {searchQuery
                                            ? "No tenants matched your search filter criteria."
                                            : "There are currently no active tenants assigned to this property."}
                                    </p>
                                    <Link
                                        href="/landlord/tenants"
                                        className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                                    >
                                        <UserPlus className="size-4" />
                                        <span>Manage / Add Tenant</span>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {filteredTenants.map((t) => (
                                        <div
                                            key={t.id}
                                            className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-white/20 hover:bg-white/[0.04]"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div
                                                        className="size-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 overflow-hidden relative text-white shadow-inner"
                                                        style={{ backgroundColor: t.avatarBgColor || "#8B5CF6" }}
                                                    >
                                                        {t.avatarUrl ? (
                                                            <Image
                                                                src={t.avatarUrl}
                                                                alt={t.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <span className="font-black drop-shadow-sm">{t.avatar || t.name.slice(0, 2).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-black text-white truncate">
                                                            {t.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-black text-primary">
                                                                {t.unit || "Unassigned"}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                                                                    t.status === "Active"
                                                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                                        : t.status === "Moving Out"
                                                                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                                                )}
                                                            >
                                                                {t.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {t.paymentStatus === "paid" && (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                                                            <CheckCircle2 className="size-3" />
                                                            Paid
                                                        </span>
                                                    )}
                                                    {t.paymentStatus === "late" && (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20">
                                                            <AlertCircle className="size-3" />
                                                            Late
                                                        </span>
                                                    )}
                                                    {t.paymentStatus === "pending" && (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                                                            <Clock className="size-3" />
                                                            Pending
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Details & Actions */}
                                            <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-2">
                                                <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400">
                                                    {t.rentAmount && (
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <DollarSign className="size-3.5 text-neutral-500" />
                                                            <span className="font-bold text-white">
                                                                ₱{t.rentAmount.toLocaleString()}
                                                            </span>
                                                            <span className="text-[10px]">/mo</span>
                                                        </div>
                                                    )}
                                                    {t.leaseEnd && (
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <Calendar className="size-3.5 text-neutral-500" />
                                                            <span>End: {new Date(t.leaseEnd).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between gap-2 mt-1">
                                                    <div className="flex items-center gap-3 text-[11px] text-neutral-400 truncate">
                                                        {t.phone && (
                                                            <span className="flex items-center gap-1 truncate">
                                                                <Phone className="size-3 text-neutral-500" />
                                                                {t.phone}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <Link
                                                            href={`/landlord/messaging?tenantId=${t.id}`}
                                                            className="flex size-7 items-center justify-center rounded-lg bg-white/5 text-neutral-300 hover:bg-primary/20 hover:text-primary transition-all"
                                                            title="Message Tenant"
                                                        >
                                                            <MessageSquare className="size-3.5" />
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedTenantId(t.id)}
                                                            className="rounded-lg bg-white/5 px-2.5 py-1 text-[10px] font-bold text-neutral-300 hover:bg-white/10 hover:text-white transition-all"
                                                        >
                                                            Profile
                                                        </button>
                                                    </div>
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

            {/* Tenant Detail Modal nested if Profile clicked */}
            {selectedTenantId && (
                <TenantDetailModal
                    isOpen={Boolean(selectedTenantId)}
                    tenantId={selectedTenantId}
                    onClose={() => setSelectedTenantId(null)}
                />
            )}
        </>
    );
}
