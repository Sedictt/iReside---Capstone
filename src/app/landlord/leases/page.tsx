"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User,
  Home,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Download,
  History,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Building2,
  ArrowUp01,
  ArrowDown10,
  CalendarRange,
  RotateCcw,
} from "lucide-react";
import { m as motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LandlordRenewalReview from "@/components/landlord/leases/RenewalReview";
import { LeaseStatusBadge } from "@/components/landlord/leases/LeaseStatusBadge";
import { LeaseAuditTrail } from "@/components/landlord/leases/LeaseAuditTrail";
import { useProperty } from "@/context/PropertyContext";
import ActiveLeasesTab from "@/components/landlord/leases/ActiveLeasesTab";
import ArchiveTab from "@/components/landlord/leases/ArchiveTab";

function LeasesContent() {
  const searchParams = useSearchParams();
  const { back, push } = useRouter();
  const leaseId = searchParams.get("id");
  const unitId = searchParams.get("unitId");
  const { selectedPropertyId, setSelectedPropertyId, properties } = useProperty();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("default");

  const [activeTab, setActiveTab] = useState<"active" | "renewals" | "history">(
    "active",
  );
  const [lease, setLease] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countersignLoading, setCountersignLoading] = useState(false);

  useEffect(() => {
    if (leaseId) {
      void fetchLease(leaseId);
    } else if (unitId) {
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
      const leaseDetails = await res.json();
      setLease(leaseDetails);
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

  if (leaseId && (loading || lease || error)) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <button
          onClick={() => back()}
          className="mb-6 flex items-center gap-2 text-sm font-black text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Leases
        </button>

        {loading ? (
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Loading Lease Record...
            </p>
          </div>
        ) : error ? (
          <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-[2.5rem] border border-red-500/20 bg-red-500/5 text-center">
            <AlertCircle className="size-12 text-red-500" />
            <h3 className="text-xl font-black text-foreground">
              Error Loading Lease
            </h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => void fetchLease(leaseId)}
              className="mt-4 rounded-xl bg-red-500 px-6 py-2 text-sm font-black text-white transition-all hover:bg-red-600"
            >
              Try Again
            </button>
          </div>
        ) : lease ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <div className="overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-sm">
                <div className="border-b border-border bg-muted/30 p-8">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black tracking-tight text-foreground">
                          Lease Agreement
                        </h1>
                        <LeaseStatusBadge status={lease.status} />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        ID: {lease.id}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-5 text-xs font-black uppercase tracking-widest transition-all hover:bg-muted">
                        <Download className="size-4" />
                        Export PDF
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-12 p-8 md:grid-cols-2">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      Parties Involved
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 font-black text-primary">
                          <User className="size-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Tenant
                          </p>
                          <p className="text-lg font-black text-foreground">
                            {lease.tenant?.full_name}
                          </p>
                          <p className="text-xs font-medium text-muted-foreground">
                            {lease.tenant?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground font-black">
                          <ShieldCheck className="size-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Landlord
                          </p>
                          <p className="text-lg font-black text-foreground">
                            {lease.landlord?.full_name}
                          </p>
                          <p className="text-xs font-medium text-muted-foreground">
                            {lease.landlord?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      Premises Details
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/10 font-black text-blue-500">
                          <Home className="size-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Property
                          </p>
                          <p className="text-lg font-black text-foreground">
                            {lease.unit?.property?.name}
                          </p>
                          <p className="text-xs font-medium text-muted-foreground">
                            {lease.unit?.property?.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 font-black text-emerald-500">
                          <LayoutGridIcon className="size-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Unit
                          </p>
                          <p className="text-lg font-black text-foreground">
                            Unit {lease.unit?.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 border-t border-border p-8 sm:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Term Period
                    </p>
                    <p className="text-sm font-black text-foreground">
                      {formatDate(lease.start_date)} -{" "}
                      {formatDate(lease.end_date)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Monthly Rent
                    </p>
                    <p className="text-sm font-black text-foreground">
                      {formatCurrency(lease.monthly_rent)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Security Deposit
                    </p>
                    <p className="text-sm font-black text-foreground">
                      {formatCurrency(lease.security_deposit)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-sm">
                <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  Lease Terms & Conditions
                </h3>
                <div className="prose prose-sm prose-invert max-w-none text-muted-foreground">
                  {lease.terms ? (
                    typeof lease.terms === "string" ? (
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {lease.terms}
                      </p>
                    ) : (
                      <pre className="overflow-x-auto rounded-xl bg-muted/50 p-4 text-xs">
                        {JSON.stringify(lease.terms, null, 2)}
                      </pre>
                    )
                  ) : (
                    <p className="italic">Standard lease terms apply.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    Audit Trail
                  </h3>
                  <History className="size-4 text-muted-foreground/50" />
                </div>
                <LeaseAuditTrail events={[]} />
              </div>

              <div className="space-y-6 rounded-[2.5rem] border border-border bg-card p-8 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  Signature Status
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full",
                          lease.tenant_signed_at
                            ? "bg-emerald-500/20 text-emerald-500"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {lease.tenant_signed_at ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <Clock className="size-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-foreground">
                          Tenant
                        </p>
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {lease.tenant_signed_at
                            ? `Signed ${formatDate(lease.tenant_signed_at)}`
                            : "Pending Signature"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full",
                          lease.landlord_signed_at
                            ? "bg-emerald-500/20 text-emerald-500"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {lease.landlord_signed_at ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <Clock className="size-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-foreground">
                          Landlord
                        </p>
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {lease.landlord_signed_at
                            ? `Signed ${formatDate(lease.landlord_signed_at)}`
                            : "Pending Signature"}
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
                        const res = await fetch(
                          `/api/landlord/leases/${lease.id}/signing-link`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                          },
                        );
                        if (!res.ok) {
                          const errorResponse = await res.json();
                          throw new Error(
                            errorResponse.error || "Failed to generate signing link",
                          );
                        }
                        const signingResponse = await res.json();
                        if (signingResponse.signingUrl) {
                          window.location.href = signingResponse.signingUrl;
                        } else {
                          throw new Error("No signing URL returned");
                        }
                      } catch (err: any) {
                        setError(
                          err.message || "Failed to generate signing link",
                        );
                        setCountersignLoading(false);
                      }
                    }}
                    disabled={countersignLoading}
                    className="w-full rounded-2xl bg-primary px-6 py-4 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
                  >
                    {countersignLoading
                      ? "Generating Link..."
                      : "Countersign Lease"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Lease Hub
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage all tenancy agreements across your portfolio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="group flex h-12 items-center gap-2 rounded-2xl border border-border bg-background px-4 text-xs font-black uppercase tracking-widest text-muted-foreground transition-all hover:border-primary hover:text-primary active:scale-95"
          >
            <RefreshCw className="size-4 transition-transform group-hover:rotate-180 duration-500" />
            Refresh
          </button>
          
          <button 
            className="flex h-12 items-center gap-2 rounded-2xl bg-primary px-6 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl active:scale-95"
          >
            <Plus className="size-4" />
            New Lease
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by tenant name or unit..." 
            className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex h-12 items-center gap-2 rounded-2xl border border-border bg-card px-4 text-sm font-bold text-foreground">
            <Building2 className="size-4 text-muted-foreground" />
            <select 
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value as any)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Properties</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-12 size-12 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary transition-all cursor-pointer">
                <Filter className="size-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <div className="px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                  Refine Results
                </p>
              </div>
              <DropdownMenuSeparator className="mx-2 bg-border/40" />
              
              <div className="mt-2 px-3 pb-1">
                <p className="text-[11px] font-bold text-muted-foreground/70">Sort by Rent</p>
              </div>
              <DropdownMenuItem 
                onClick={() => setSortBy("rent-desc")}
                className={cn("gap-3", sortBy === "rent-desc" && "bg-primary/5 text-primary")}
              >
                <div className={cn("flex size-8 items-center justify-center rounded-lg transition-colors", sortBy === "rent-desc" ? "bg-primary/20" : "bg-primary/10 text-primary")}>
                  <ArrowUp01 className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">High to Low</span>
                  <span className="text-[10px] text-muted-foreground">Highest rent first</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("rent-asc")}
                className={cn("gap-3", sortBy === "rent-asc" && "bg-primary/5 text-primary")}
              >
                <div className={cn("flex size-8 items-center justify-center rounded-lg transition-colors", sortBy === "rent-asc" ? "bg-primary/20" : "bg-muted text-muted-foreground")}>
                  <ArrowDown10 className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">Low to High</span>
                  <span className="text-[10px] text-muted-foreground">Lowest rent first</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="mx-2 my-2 bg-border/40" />
              
              <div className="px-3 pb-1">
                <p className="text-[11px] font-bold text-muted-foreground/70">Lease Expiry</p>
              </div>
              <DropdownMenuItem 
                onClick={() => setSortBy("date-asc")}
                className={cn("gap-3", sortBy === "date-asc" && "bg-amber-500/5 text-amber-500")}
              >
                <div className={cn("flex size-8 items-center justify-center rounded-lg transition-colors", sortBy === "date-asc" ? "bg-amber-500/20" : "bg-amber-500/10 text-amber-500")}>
                  <CalendarRange className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">Soonest First</span>
                  <span className="text-[10px] text-muted-foreground">Urgent renewals top</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="mx-2 my-2 bg-border/40" />
              
              <DropdownMenuItem 
                onClick={() => setSortBy("default")}
                className="gap-3 text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10">
                  <RotateCcw className="size-4" />
                </div>
                <span className="font-bold uppercase tracking-wider text-[11px]">Reset All Filters</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-border/60">
        {[
          { id: "active", label: "Active", icon: ShieldCheck },
          { id: "renewals", label: "Renewals", icon: RefreshCw },
          { id: "history", label: "Archive", icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "relative flex items-center gap-2.5 px-6 py-4 text-[13px] font-bold transition-all",
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className={cn("size-4", activeTab === tab.id ? "text-primary" : "text-muted-foreground/60")} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeHubTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "renewals" ? (
          <LandlordRenewalReview searchQuery={searchQuery} />
        ) : activeTab === "active" ? (
          <ActiveLeasesTab 
            searchQuery={searchQuery} 
            sortBy={sortBy}
            onClearSearch={() => {
              setSearchQuery("");
              setSortBy("default");
            }} 
          />
        ) : (
          <ArchiveTab 
            searchQuery={searchQuery} 
            sortBy={sortBy}
            onClearSearch={() => {
              setSearchQuery("");
              setSortBy("default");
            }} 
          />
        )}
      </div>
    </div>
  );
}


export default function LeasesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <LeasesContent />
    </Suspense>
  );
}

function LayoutGridIcon({ className }: { className?: string }) {
  return (
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
}
