"use client";

import { useEffect, useState } from "react";
import {
    Search,
    Filter,
    Wallet,
    Clock,
    AlertCircle,
    MessageSquare,
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
                if (!controller.signal.aborted) {
                    setTenants(Array.isArray(payload.tenants) ? payload.tenants : []);
                }
            } catch (fetchError) {
                if ((fetchError as Error).name === "AbortError") {
                    return;
                }

                if (!controller.signal.aborted) {
                    setError("Unable to load tenants right now.");
                    setTenants([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
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
            case "Active": return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
            case "Moving Out": return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
            case "Evicted": return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300";
            default: return "border-border bg-muted text-muted-foreground";
        }
    };

    const getPaymentStatusIcon = (status: TenantPaymentStatus) => {
        switch (status) {
            case "paid": return <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /> Paid</div>;
            case "late": return <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-300"><AlertCircle className="w-3.5 h-3.5" /> Overdue</div>;
            case "pending": return <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300"><Clock className="w-3.5 h-3.5" /> Pending</div>;
            default: return null;
        }
    };

    return (
        <div className="mx-auto min-h-screen max-w-7xl space-y-8 px-6 py-8 text-foreground animate-in fade-in duration-500 sm:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-muted/35 p-8 shadow-sm">
                <div className="absolute right-0 top-0 h-[420px] w-[420px] -translate-y-1/2 translate-x-1/3 rounded-full bg-primary/16 blur-[120px] opacity-45 dark:bg-primary/20 dark:opacity-50" />
                <div className="absolute bottom-0 left-0 h-[260px] w-[260px] translate-y-1/2 -translate-x-1/3 rounded-full bg-sky-500/12 blur-[100px] opacity-35 dark:bg-blue-500/20 dark:opacity-30" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-md">
                            <Building2 className="h-3.5 w-3.5 text-primary" />
                            <span>Lease Operations</span>
                        </div>
                        <h1 className="mb-2 text-4xl font-black tracking-tight text-foreground md:text-5xl">Tenants Directory</h1>
                        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                            Manage resident records, lease timelines, and payment standing across your active portfolio.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex h-11 items-center gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-[0_14px_30px_-18px_rgba(var(--primary-rgb),0.65)] transition-all hover:bg-primary/90">
                            Add Tenant
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/95 p-2 shadow-sm sm:flex-row">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by name, property, or unit..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-transparent bg-transparent py-3 pl-11 pr-4 text-sm font-medium text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary/30 focus:bg-background focus:outline-none"
                    />
                </div>
                <div className="hidden h-8 w-px bg-border sm:block" />
                <div className="flex items-center w-full sm:w-auto overflow-x-auto hide-scrollbar gap-2 px-2 pb-2 sm:pb-0">
                    {["All", "Active", "Moving Out", "Evicted"].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status as TenantStatus | "All")}
                            className={cn(
                                "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                                statusFilter === status
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                    <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground">
                        <Filter className="w-4 h-4" /> <span className="text-sm font-medium">Filters</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="relative flex flex-col justify-between rounded-[2rem] border border-border bg-card/60 p-6 shadow-sm overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/40 to-transparent -translate-x-full animate-shimmer" />
                            
                            <div className="flex items-center justify-between mb-8">
                                <div className="h-6 w-16 rounded-lg bg-muted animate-pulse" />
                                <div className="h-7 w-24 rounded-full bg-muted/60 animate-pulse" />
                            </div>

                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="mb-4 h-24 w-24 rounded-full bg-muted animate-pulse" />
                                <div className="mb-2 h-6 w-40 rounded-xl bg-muted animate-pulse" />
                                <div className="h-4 w-48 rounded-lg bg-muted/50 animate-pulse" />
                                
                                <div className="mt-6 h-10 w-full rounded-full bg-muted/40 animate-pulse" />
                            </div>

                            <div className="mb-6 flex flex-col gap-3 border-t border-border pt-6">
                                <div className="h-12 w-full rounded-2xl bg-muted/30 animate-pulse" />
                                <div className="h-12 w-full rounded-2xl bg-muted/30 animate-pulse" />
                            </div>

                            <div className="mt-auto flex items-center justify-between border-t border-border pt-6">
                                <div className="flex items-center gap-2">
                                    <div className="h-10 w-10 rounded-xl bg-muted/40 animate-pulse" />
                                    <div className="h-10 w-10 rounded-xl bg-muted/40 animate-pulse" />
                                </div>
                                <div className="h-10 w-24 rounded-xl bg-muted/50 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="rounded-3xl border border-red-500/20 bg-red-500/8 p-6 text-sm text-red-700 dark:text-red-300">
                    {error}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTenants.map((tenant, idx) => (
                    <div
                        key={tenant.id}
                        className="group flex cursor-pointer flex-col justify-between rounded-3xl border border-border bg-card/95 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-card hover:shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] dark:hover:shadow-[0_20px_45px_-30px_rgba(0,0,0,0.55)] animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <span className={cn("rounded-md border px-2.5 py-1 text-xs font-bold", getStatusColor(tenant.status))}>
                                {tenant.status}
                            </span>
                            <div className="rounded-full border border-border bg-background/70 px-2 py-1">
                                {getPaymentStatusIcon(tenant.paymentStatus)}
                            </div>
                        </div>

                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="relative mb-4 h-24 w-24 rounded-full transition-transform group-hover:scale-[1.03]">
                                {tenant.avatarUrl ? (
                                    <img
                                        src={tenant.avatarUrl}
                                        alt={tenant.name}
                                        className="h-full w-full rounded-full border-2 border-primary/20 object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-primary/20 bg-gradient-to-tr from-primary/20 to-primary/5 text-2xl font-black text-primary">
                                        {tenant.avatar}
                                    </div>
                                )}
                            </div>
                            <h3 className="mb-1 text-xl font-bold text-foreground transition-colors group-hover:text-primary">{tenant.name}</h3>
                            <p className="mb-4 text-sm text-muted-foreground">{tenant.email}</p>

                            <div className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-muted/45 px-4 py-2 text-xs font-medium">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate text-foreground">{tenant.property}</span>
                                <span className="px-1 text-muted-foreground">•</span>
                                <span className="whitespace-nowrap text-muted-foreground">{tenant.unit}</span>
                            </div>
                        </div>

                        <div className="mb-6 flex flex-col gap-3 border-t border-border pt-5">
                            <div className="flex items-center justify-between rounded-xl border border-border bg-background/75 px-4 py-3">
                                <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                    <Wallet className="h-4 w-4" /> Rent
                                </p>
                                <p className="text-sm font-bold text-foreground">{formatCurrency(tenant.rentAmount)}</p>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border bg-background/75 px-4 py-3">
                                <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                    <Calendar className="h-4 w-4" /> Lease Ends
                                </p>
                                <p className="text-sm font-bold text-foreground">
                                    {formatLeaseEnd(tenant.leaseEnd)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between border-t border-border pt-5">
                            <div className="flex items-center gap-2">
                                <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/75 text-muted-foreground transition-all hover:border-primary/20 hover:bg-primary/10 hover:text-primary">
                                    <MessageSquare className="w-4 h-4" />
                                </button>
                                <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/75 text-muted-foreground transition-all hover:border-primary/20 hover:bg-primary/10 hover:text-primary">
                                    <Mail className="w-4 h-4" />
                                </button>
                            </div>
                            <button className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/15 hover:text-primary/80">
                                Profile <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

                    {filteredTenants.length === 0 && (
                        <div className="col-span-full rounded-3xl border border-border bg-card/95 py-20 text-center shadow-sm animate-in fade-in zoom-in duration-500">
                            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                <Search className="w-8 h-8" />
                            </div>
                            <p className="mb-2 text-xl font-bold text-foreground">No tenants found</p>
                            <p className="mx-auto max-w-sm text-muted-foreground">We couldn&apos;t find any tenants matching your current filters and search query.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
