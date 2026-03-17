"use client";

import { useEffect, useState } from "react";
import {
    Search,
    Filter,
    Wallet,
    Clock,
    AlertCircle,
    MessageSquare,
    Phone,
    Mail,
    ChevronRight,
    Building2,
    Calendar,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    paymentStatus: TenantPaymentStatus;
};

const formatCurrency = (value: number | null) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "Not provided";
    }

    return `₱${value.toLocaleString()}`;
};

const formatLeaseEnd = (value: string | null) => {
    if (!value) return "Not set";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not set";

    return parsed.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

export default function TenantsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<TenantStatus | "All">("All");
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const loadTenants = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch("/api/landlord/tenants", {
                    method: "GET",
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error("Failed to load tenants");
                }

                const payload = (await response.json()) as { tenants?: Tenant[] };
                setTenants(Array.isArray(payload.tenants) ? payload.tenants : []);
            } catch (fetchError) {
                if ((fetchError as Error).name === "AbortError") {
                    return;
                }

                setError("Unable to load tenants right now.");
                setTenants([]);
            } finally {
                setLoading(false);
            }
        };

        void loadTenants();

        return () => {
            controller.abort();
        };
    }, []);

    const filteredTenants = tenants.filter(tenant => {
        const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.property.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All" || tenant.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: TenantStatus) => {
        switch (status) {
            case "Active": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "Moving Out": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            case "Evicted": return "bg-red-500/10 text-red-400 border-red-500/20";
            default: return "bg-white/5 text-neutral-400 border-white/10";
        }
    };

    const getPaymentStatusIcon = (status: TenantPaymentStatus) => {
        switch (status) {
            case "paid": return <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Paid</div>;
            case "late": return <div className="flex items-center gap-1.5 text-xs font-medium text-red-400"><AlertCircle className="w-3.5 h-3.5" /> Overdue</div>;
            case "pending": return <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400"><Clock className="w-3.5 h-3.5" /> Pending</div>;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">Tenants Directory</h1>
                    <p className="text-neutral-400">Manage and monitor your active leases across all properties.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="h-11 px-6 rounded-xl bg-primary text-black font-bold flex items-center gap-2 hover:bg-primary/90 hover:scale-105 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                        Add Tenant
                    </button>
                </div>
            </div>


            {/* Table Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#111] p-2 rounded-2xl border border-white/5">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search by name, property, or unit..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-none pl-11 pr-4 py-3 text-sm text-white focus:outline-none placeholder:text-neutral-600 font-medium"
                    />
                </div>
                <div className="w-px h-8 bg-white/10 hidden sm:block" />
                <div className="flex items-center w-full sm:w-auto overflow-x-auto hide-scrollbar gap-2 px-2 pb-2 sm:pb-0">
                    {['All', 'Active', 'Moving Out', 'Evicted'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all",
                                statusFilter === status
                                    ? "bg-white/10 text-white"
                                    : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                    <button className="px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2">
                        <Filter className="w-4 h-4" /> <span className="text-sm font-medium">Filters</span>
                    </button>
                </div>
            </div>

            {/* Tenant Cards Grid */}
            {loading ? (
                <div className="rounded-3xl border border-white/5 bg-[#111] p-6 text-sm text-neutral-400">
                    Loading tenants...
                </div>
            ) : error ? (
                <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
                    {error}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTenants.map((tenant, idx) => (
                    <div
                        key={tenant.id}
                        className="bg-[#111] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.02] hover:border-white/10 transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-2 flex flex-col justify-between shadow-2xl"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        {/* Status badges */}
                        <div className="flex items-center justify-between mb-6">
                            <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold border backdrop-blur-md", getStatusColor(tenant.status))}>
                                {tenant.status}
                            </span>
                            <div className="bg-black/20 rounded-full px-2 py-1">
                                {getPaymentStatusIcon(tenant.paymentStatus)}
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="relative w-24 h-24 mb-4 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(var(--primary),0.1)] group-hover:shadow-[0_0_30px_rgba(var(--primary),0.2)] rounded-full">
                                {tenant.avatarUrl ? (
                                    <img
                                        src={tenant.avatarUrl}
                                        alt={tenant.name}
                                        className="w-full h-full object-cover rounded-full border-2 border-primary/20"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 border-2 border-primary/20 flex items-center justify-center text-primary font-black text-2xl">
                                        {tenant.avatar}
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-xl text-white mb-1 group-hover:text-primary transition-colors">{tenant.name}</h3>
                            <p className="text-sm text-neutral-500 mb-4">{tenant.email}</p>

                            <div className="flex items-center gap-2 text-xs font-medium bg-white/5 px-4 py-2 rounded-full border border-white/5 w-full justify-center">
                                <Building2 className="w-4 h-4 text-neutral-400" />
                                <span className="text-neutral-300 truncate">{tenant.property}</span>
                                <span className="text-neutral-600 px-1">•</span>
                                <span className="text-neutral-400 whitespace-nowrap">{tenant.unit}</span>
                            </div>
                        </div>

                        {/* Financials & Dates */}
                        <div className="grid grid-cols-2 gap-4 mb-6 pt-5 border-t border-white/5">
                            <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                                <p className="text-xs font-medium text-neutral-500 mb-1.5 flex items-center gap-1.5">
                                    <Wallet className="w-3.5 h-3.5" /> Rent
                                </p>
                                <p className="font-bold text-white text-[15px]">{formatCurrency(tenant.rentAmount)}</p>
                            </div>
                            <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                                <p className="text-xs font-medium text-neutral-500 mb-1.5 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" /> Lease Ends
                                </p>
                                <p className="font-bold text-white text-[15px]">
                                    {formatLeaseEnd(tenant.leaseEnd)}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-5 border-t border-white/5 mt-auto">
                            <div className="flex items-center gap-2">
                                <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-primary/20 hover:text-primary transition-all hover:scale-105">
                                    <Phone className="w-4 h-4" />
                                </button>
                                <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-primary/20 hover:text-primary transition-all hover:scale-105">
                                    <MessageSquare className="w-4 h-4" />
                                </button>
                                <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-primary/20 hover:text-primary transition-all hover:scale-105">
                                    <Mail className="w-4 h-4" />
                                </button>
                            </div>
                            <button className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-2 rounded-xl">
                                Profile <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

                    {filteredTenants.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-[#111] border border-white/5 rounded-3xl animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 mx-auto mb-5">
                                <Search className="w-8 h-8" />
                            </div>
                            <p className="text-xl text-white font-bold mb-2">No tenants found</p>
                            <p className="text-neutral-500 max-w-sm mx-auto">We couldn't find any tenants matching your current filters and search query.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
