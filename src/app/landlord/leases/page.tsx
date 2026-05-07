"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
    FileText, 
    Calendar, 
    User, 
    Home, 
    ArrowLeft, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    ShieldCheck,
    Loader2,
    Search,
    Filter,
    RefreshCw,
    Download,
    History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import LandlordRenewalReview from "@/components/landlord/leases/RenewalReview";
import { LeaseStatusBadge } from "@/components/landlord/leases/LeaseStatusBadge";
import { LeaseAuditTrail } from "@/components/landlord/leases/LeaseAuditTrail";
import { useProperty } from "@/context/PropertyContext";

function LeasesContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const leaseId = searchParams.get("id");
    const unitId = searchParams.get("unitId");
    const { selectedPropertyId } = useProperty();

    const [activeTab, setActiveTab] = useState<"renewals" | "active" | "history">("renewals");
    const [lease, setLease] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countersignLoading, setCountersignLoading] = useState(false);

    useEffect(() => {
        if (leaseId) {
            void fetchLease(leaseId);
        } else if (unitId) {
            // If we have unitId but no leaseId, we might need an API to find the active lease for this unit
            // For now, let's just show renewals if we don't have a specific lease ID
            setActiveTab("renewals");
        }
    }, [leaseId, unitId]);

    const fetchLease = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/landlord/leases/${id}`);
            if (!res.ok) {
                if (res.status === 404) throw new Error("Lease not found");
                throw new Error("Failed to fetch lease details");
            }
            const data = await res.json();
            setLease(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    // If viewing a specific lease
    if (leaseId && (loading || lease || error)) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
                <button 
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Leases
                </button>

                {loading ? (
                    <div className="flex h-96 flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading Lease Record...</p>
                    </div>
                ) : error ? (
                    <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-[2.5rem] border border-red-500/20 bg-red-500/5 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500" />
                        <h3 className="text-xl font-black text-foreground">Error Loading Lease</h3>
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <button 
                            onClick={() => void fetchLease(leaseId)}
                            className="mt-4 rounded-xl bg-red-500 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-red-600"
                        >
                            Try Again
                        </button>
                    </div>
                ) : lease ? (
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Lease Details (Left Column) */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-sm">
                                <div className="bg-muted/30 p-8 border-b border-border">
                                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h1 className="text-3xl font-black tracking-tight text-foreground">Lease Agreement</h1>
                                                <LeaseStatusBadge status={lease.status} />
                                            </div>
                                            <p className="text-sm font-medium text-muted-foreground">ID: {lease.id}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-5 text-xs font-black uppercase tracking-widest transition-all hover:bg-muted">
                                                <Download className="h-4 w-4" />
                                                Export PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {/* Parties */}
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Parties Involved</h3>
                                        
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black">
                                                    <User className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tenant</p>
                                                    <p className="text-lg font-black text-foreground">{lease.tenant?.full_name}</p>
                                                    <p className="text-xs font-medium text-muted-foreground">{lease.tenant?.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground font-black">
                                                    <ShieldCheck className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Landlord</p>
                                                    <p className="text-lg font-black text-foreground">{lease.landlord?.full_name}</p>
                                                    <p className="text-xs font-medium text-muted-foreground">{lease.landlord?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Property & Unit */}
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Premises Details</h3>
                                        
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 font-black">
                                                    <Home className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Property</p>
                                                    <p className="text-lg font-black text-foreground">{lease.unit?.property?.name}</p>
                                                    <p className="text-xs font-medium text-muted-foreground">{lease.unit?.property?.address}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black">
                                                    <LayoutGrid className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unit</p>
                                                    <p className="text-lg font-black text-foreground">Unit {lease.unit?.name}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Term Period</p>
                                        <p className="text-sm font-black text-foreground">
                                            {formatDate(lease.start_date)} - {formatDate(lease.end_date)}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly Rent</p>
                                        <p className="text-sm font-black text-foreground">{formatCurrency(lease.monthly_rent)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Security Deposit</p>
                                        <p className="text-sm font-black text-foreground">{formatCurrency(lease.security_deposit)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Terms Section */}
                            <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-sm">
                                <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Lease Terms & Conditions</h3>
                                <div className="prose prose-sm prose-invert max-w-none text-muted-foreground">
                                    {lease.terms ? (
                                        typeof lease.terms === 'string' ? (
                                            <p className="whitespace-pre-wrap leading-relaxed">{lease.terms}</p>
                                        ) : (
                                            <pre className="text-xs bg-muted/50 p-4 rounded-xl overflow-x-auto">
                                                {JSON.stringify(lease.terms, null, 2)}
                                            </pre>
                                        )
                                    ) : (
                                        <p className="italic">Standard lease terms apply.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Audit Trail (Right Column) */}
                        <div className="space-y-8">
                            <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-sm">
                                <div className="mb-6 flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Audit Trail</h3>
                                    <History className="h-4 w-4 text-muted-foreground/50" />
                                </div>
                                <LeaseAuditTrail events={[]} /> {/* We might need to fetch real events if available */}
                            </div>

                            <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-sm space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Signature Status</h3>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between rounded-2xl bg-muted/30 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-8 w-8 rounded-full flex items-center justify-center",
                                                lease.tenant_signed_at ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"
                                            )}>
                                                {lease.tenant_signed_at ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-foreground">Tenant</p>
                                                <p className="text-[10px] font-medium text-muted-foreground">
                                                    {lease.tenant_signed_at ? `Signed ${formatDate(lease.tenant_signed_at)}` : "Pending Signature"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between rounded-2xl bg-muted/30 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-8 w-8 rounded-full flex items-center justify-center",
                                                lease.landlord_signed_at ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"
                                            )}>
                                                {lease.landlord_signed_at ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-foreground">Landlord</p>
                                                <p className="text-[10px] font-medium text-muted-foreground">
                                                    {lease.landlord_signed_at ? `Signed ${formatDate(lease.landlord_signed_at)}` : "Pending Signature"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {lease.status === "pending_landlord_signature" && (
                                    <button 
                                        onClick={async () => {
                                            setCountersignLoading(true);
                                            try {
                                                const res = await fetch(`/api/landlord/leases/${lease.id}/signing-link`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                });
                                                if (!res.ok) {
                                                    const data = await res.json();
                                                    throw new Error(data.error || "Failed to generate signing link");
                                                }
                                                const data = await res.json();
                                                if (data.signingUrl) {
                                                    window.location.href = data.signingUrl;
                                                } else {
                                                    throw new Error("No signing URL returned");
                                                }
                                            } catch (err: any) {
                                                setError(err.message || "Failed to generate signing link");
                                                setCountersignLoading(false);
                                            }
                                        }}
                                        disabled={countersignLoading}
                                        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs transition-all hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-50"
                                    >
                                        {countersignLoading ? "Generating Link..." : "Countersign Lease"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        );
    }

    // Default view: Hub with tabs
    return (
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground">Lease Hub</h1>
                    <p className="mt-1 text-muted-foreground">Monitor and manage all tenancy agreements across your portfolio.</p>
                </div>
            </div>

            {/* Hub Tabs */}
            <div className="flex items-center gap-1 border-b border-border">
                {[
                    { id: "renewals", label: "Renewals", icon: RefreshCw },
                    { id: "active", label: "Active Leases", icon: ShieldCheck },
                    { id: "history", label: "Archive", icon: History },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all relative",
                            activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div 
                                layoutId="activeHubTab"
                                className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                            />
                        )}
                    </button>
                ))}
            </div>

            <div className="mt-8">
                {activeTab === "renewals" ? (
                    <LandlordRenewalReview />
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center rounded-[2.5rem] border-2 border-dashed border-border bg-muted/5">
                        <div className="p-6 rounded-full bg-muted/50 mb-6">
                            <FileText className="w-12 h-12 text-muted-foreground/20" />
                        </div>
                        <h3 className="text-xl font-black text-foreground">Coming Soon</h3>
                        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                            We're building the full lease management portal. For now, you can manage renewals here or view specific leases via notifications.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function LeasesPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <LeasesContent />
        </Suspense>
    );
}

const LayoutGrid = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <rect width="7" height="7" x="3" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="14" rx="1" />
        <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
);
