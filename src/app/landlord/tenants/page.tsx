"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Search,
    Filter,
    Wallet,
    Clock,
    AlertCircle,
    MessageSquare,
    ChevronRight,
    Building2,
    Calendar,
    CheckCircle2,
    MoreVertical,
    UserPlus,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProperty } from "@/context/PropertyContext";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { AddTenantModal } from "@/components/landlord/tenants/AddTenantModal";

type TenantStatus = "Active" | "Moving Out" | "Evicted";
type TenantPaymentStatus = "paid" | "late" | "pending";

type Tenant = {
    id: string;
    name: string;
    property: string;
    unit: string;
    status: TenantStatus;
    rentAmount: number | null;
    leaseEnd: string | null;
    phone: string;
    email: string;
    avatar: string;
    avatarUrl: string | null;
    avatarBgColor: string | null;
    paymentStatus: TenantPaymentStatus;
};


const formatLeaseEnd = (value: string | null) => {
    if (!value) return "No end date";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Invalid date";
    return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function TenantsPage() {
    const { selectedPropertyId } = useProperty();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<TenantStatus | "All">("All");
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadTenants = useCallback(async (controller?: AbortController) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({ propertyId: selectedPropertyId });
            const response = await fetch(`/api/landlord/tenants?${params.toString()}`, {
                method: "GET",
                signal: controller?.signal,
            });

            if (!response.ok) {
                throw new Error("Failed to load tenants");
            }

            const payload = (await response.json()) as { tenants?: Tenant[] };
            if (!controller?.signal.aborted) {
                setTenants(Array.isArray(payload.tenants) ? payload.tenants : []);
            }
        } catch (fetchError) {
            if ((fetchError as Error).name === "AbortError") {
                return;
            }

            if (!controller?.signal.aborted) {
                setError("Unable to load tenants right now.");
                setTenants([]);
            }
        } finally {
            if (!controller?.signal.aborted) {
                setLoading(false);
            }
        }
    }, [selectedPropertyId]);

    useEffect(() => {
        const controller = new AbortController();
        void loadTenants(controller);

        return () => {
            controller.abort();
        };
    }, [selectedPropertyId, loadTenants]);

    const filteredTenants = tenants.filter(tenant => {
        const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.property.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All" || tenant.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyles = (status: TenantStatus) => {
        switch (status) {
            case "Active": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
            case "Moving Out": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
            case "Evicted": return "bg-red-500/10 text-red-600 border-red-500/20";
            default: return "bg-muted text-muted-foreground border-border";
        }
    };

    const getPaymentBadge = (status: TenantPaymentStatus) => {
        switch (status) {
            case "paid": return (
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Paid
                </div>
            );
            case "late": return (
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600">
                    <AlertCircle className="h-3 w-3" /> Overdue
                </div>
            );
            case "pending": return (
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                    <Clock className="h-3 w-3" /> Pending
                </div>
            );
            default: return null;
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
            <AddTenantModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => void loadTenants()}
            />

            {/* Header Block (§8.2) */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Tenants Directory</h1>
                    <p className="mt-1 text-muted-foreground">Manage resident records and lease timelines across your portfolio.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
                    >
                        <UserPlus className="h-4 w-4" />
                        <span>Add New Tenant</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar (§8.5) */}
            <div className="flex flex-col gap-4 rounded-[2rem] border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search residents, units, or properties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 w-full rounded-2xl border-none bg-muted/50 pl-11 pr-4 text-sm font-medium transition-all focus:bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    />
                </div>
                <div className="flex items-center gap-2 px-1">
                    {["All", "Active", "Moving Out"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status as TenantStatus | "All")}
                            className={cn(
                                "h-10 rounded-xl px-4 text-sm font-bold transition-all",
                                statusFilter === status
                                    ? "bg-foreground text-background"
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                    <div className="mx-2 h-6 w-px bg-border hidden lg:block" />
                    <button className="flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                        <Filter className="h-4 w-4" />
                        <span>More Filters</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-72 animate-pulse rounded-3xl border border-border bg-muted/40" />
                    ))}
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center rounded-[2rem] border border-red-500/10 bg-red-500/5 py-12 text-center">
                    <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
                    <h3 className="text-lg font-bold text-red-700">Failed to load tenants</h3>
                    <p className="mt-1 text-sm text-red-600/70">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-6 rounded-xl bg-red-500 px-6 py-2 text-sm font-bold text-white hover:bg-red-600"
                    >
                        Try Again
                    </button>
                </div>
            ) : (
                <div data-tour-id="tour-tenant-hub" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {filteredTenants.map((tenant, idx) => (
                            <motion.div
                                key={tenant.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-xl dark:hover:shadow-primary/5"
                            >
                                {/* Card Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div 
                                            className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-background shadow-inner flex items-center justify-center text-xl font-black text-white"
                                            style={{ backgroundColor: tenant.avatarBgColor || '#6d9838' }}
                                        >
                                            {tenant.avatarUrl ? (
                                                <div className="relative h-full w-full">
                                                    <Image 
                                                        src={tenant.avatarUrl} 
                                                        alt={tenant.name} 
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                            ) : (
                                                tenant.avatar
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black leading-tight text-foreground transition-colors group-hover:text-primary">
                                                {tenant.name}
                                            </h3>
                                            <p className="text-xs font-medium text-muted-foreground">{tenant.email}</p>
                                        </div>
                                    </div>
                                    <button className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                        <MoreVertical className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Status & Payment Indicators */}
                                <div className="mt-6 flex items-center justify-between gap-3">
                                    <div className={cn(
                                        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-tight",
                                        getStatusStyles(tenant.status)
                                    )}>
                                        <div className={cn("h-1.5 w-1.5 rounded-full bg-current")} />
                                        {tenant.status}
                                    </div>
                                    <div className="rounded-2xl bg-muted/50 px-3 py-1">
                                        {getPaymentBadge(tenant.paymentStatus)}
                                    </div>
                                </div>

                                {/* Property Details */}
                                <div className="mt-6 space-y-3 rounded-2xl bg-muted/30 p-4">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <Building2 className="h-3.5 w-3.5" /> Property
                                        </span>
                                        <span className="font-bold text-foreground truncate max-w-[140px]">{tenant.property}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <Wallet className="h-3.5 w-3.5" /> Unit
                                        </span>
                                        <span className="font-bold text-foreground">{tenant.unit}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="h-3.5 w-3.5" /> Lease Ends
                                        </span>
                                        <span className="font-bold text-foreground">{formatLeaseEnd(tenant.leaseEnd)}</span>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="mt-6 flex items-center gap-2">
                                    <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-xs font-bold text-primary transition-all hover:bg-primary/20">
                                        View Profile
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
                                            <MessageSquare className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredTenants.length === 0 && !loading && (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-border bg-muted/10 py-24 text-center">
                            <div className="mb-4 rounded-full bg-muted p-6">
                                <Users className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">No residents found</h3>
                            <p className="mt-2 text-muted-foreground">Adjust your search or filters to find what you&apos;re looking for.</p>
                            <button 
                                onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}
                                className="mt-6 rounded-xl border border-border px-6 py-2 text-sm font-bold hover:bg-muted"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
