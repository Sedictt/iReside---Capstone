"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
 User,
 Home,
 ArrowLeft,
 CheckCircle2,
 Clock,
 AlertCircle,
 ShieldCheck,
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
 Loader2,
 FileText,
 LayoutDashboard,
 LayoutGrid,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { m as motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { generateLeasePdf, exportLeaseDocumentElementToPdf } from "@/lib/lease-pdf";
import { LeaseDocument, type LeaseDocumentProps } from "@/components/lease/LeaseDocument";
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
  const [leaseViewMode, setLeaseViewMode] = useState<"document" | "overview">("document");

 const formattedLeaseData: LeaseDocumentProps | null = useMemo(() => {
   if (!lease) return null;
   return {
     id: lease.id,
     status: lease.status,
     start_date: lease.start_date,
     end_date: lease.end_date,
     monthly_rent: Number(lease.monthly_rent || 0),
     security_deposit: Number(lease.security_deposit || 0),
     terms: lease.terms,
     tenant_signature: lease.tenant_signature,
     tenant_signed_at: lease.tenant_signed_at,
     landlord_signature: lease.landlord_signature,
     landlord_signed_at: lease.landlord_signed_at,
     signed_at: lease.signed_at || null,
     signed_document_url: lease.signed_document_url || null,
     unit: {
       name: lease.unit?.name || "Unit",
       property: {
         name: lease.unit?.property?.name || lease.property?.name || "Residential Property",
         address: lease.unit?.property?.address || lease.property?.address || "Address not specified",
         city: lease.unit?.property?.city || lease.property?.city || "",
       },
     },
     landlord: {
       full_name: lease.landlord?.full_name || "Landlord",
       email: lease.landlord?.email || "",
     },
     tenant: {
       full_name: lease.tenant?.full_name || "Tenant",
       email: lease.tenant?.email || "",
     },
   };
 }, [lease]);

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

 const [isExportingPdf, setIsExportingPdf] = useState(false);

 const handleExportPdf = async () => {
    if (!lease || !formattedLeaseData) return;
    setIsExportingPdf(true);
    try {
      let pdfBlob: Blob | null = null;

      // 1. Primary: Generate pixel-perfect PDF directly from the official LeaseDocument element (visible or offscreen)
      const element =
        document.getElementById("official-lease-document-visible") ||
        document.getElementById("official-lease-document-hidden");

      if (element) {
        try {
          pdfBlob = await exportLeaseDocumentElementToPdf(
            element,
            `Lease_Agreement_${lease.id?.slice(0, 8) || "official"}.pdf`
          );
        } catch (elementErr) {
          console.warn("[Export PDF] DOM export failed, attempting fallbacks:", elementErr);
        }
      }

      // 2. Fallback: If DOM capture failed and a stored document exists, attempt download
      if (!pdfBlob && lease.signed_document_url) {
        try {
          const response = await fetch(lease.signed_document_url);
          if (response.ok) {
            pdfBlob = await response.blob();
          }
        } catch (fetchErr) {
          console.warn("[Export PDF] Stored signed doc fetch failed:", fetchErr);
        }
      }

      // 3. Fallback to direct jsPDF generator if DOM capture was not available
      if (!pdfBlob) {
        pdfBlob = await generateLeasePdf({
          id: lease.id,
          startDate: formatDate(lease.start_date),
          endDate: formatDate(lease.end_date),
          monthlyRent: Number(lease.monthly_rent || 0),
          securityDeposit: Number(lease.security_deposit || 0),
          property: {
            name: lease.unit?.property?.name || lease.property?.name || "Residential Property",
            address: lease.unit?.property?.address || lease.property?.address || "Address not specified",
            contract_template: lease.unit?.property?.contract_template || lease.property?.contract_template,
          },
          unit: {
            name: lease.unit?.name || "Unit",
          },
          landlord: {
            name: lease.landlord?.full_name || "Landlord",
            email: lease.landlord?.email || "",
          },
          tenant: {
            name: lease.tenant?.full_name || "Tenant",
            email: lease.tenant?.email || "",
          },
          terms: lease.terms,
          tenantSignature: lease.tenant_signature || undefined,
          tenantSignedAt: lease.tenant_signed_at || undefined,
          landlordSignature: lease.landlord_signature || undefined,
          landlordSignedAt: lease.landlord_signed_at || undefined,
        });
      }

      // 4. Trigger download
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      const shortId = lease.id ? lease.id.slice(0, 8) : "agreement";
      a.download = `Lease_Agreement_${shortId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Official Lease Agreement PDF exported successfully!");
    } catch (err) {
      console.error("[Export PDF] Failed:", err);
      toast.error("Failed to export lease PDF. Please try again.");
    } finally {
      setIsExportingPdf(false);
    }
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
 <LoadingSpinner size="md" className="text-primary" />
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
 <div className="overflow-hidden rounded-[2.5rem] neumorphic-panel ">
              <div className="border-b border-border/30 neumorphic-inset px-6 py-5 sm:px-8 sm:py-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                        Lease Agreement
                      </h1>
                      <LeaseStatusBadge status={lease.status} />
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">
                      ID: <span className="font-semibold text-foreground">{lease.id ? (lease.id.length > 16 ? lease.id.slice(0, 8).toUpperCase() : lease.id) : "N/A"}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                    {/* View Mode Toggle */}
                    <div className="flex items-center rounded-xl neumorphic-inset p-1">
                      <button
                        type="button"
                        onClick={() => setLeaseViewMode("document")}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all",
                          leaseViewMode === "document"
                            ? "neumorphic-panel text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <FileText className="size-3.5" />
                        Agreement
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeaseViewMode("overview")}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all",
                          leaseViewMode === "overview"
                            ? "neumorphic-panel text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <LayoutDashboard className="size-3.5" />
                        Overview
                      </button>
                    </div>

                    {/* Export PDF Button */}
                    <button
                      onClick={handleExportPdf}
                      disabled={isExportingPdf}
                      className="flex h-10 items-center gap-2 rounded-xl neumorphic-panel px-4 text-xs font-black uppercase tracking-widest transition-all hover:neumorphic-inset disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      title="Export official Lease Agreement PDF"
                    >
                      {isExportingPdf ? (
                        <Loader2 className="size-3.5 animate-spin text-primary" />
                      ) : (
                        <Download className="size-3.5" />
                      )}
                      <span>{isExportingPdf ? "Exporting..." : "Export PDF"}</span>
                    </button>
                  </div>
                </div>
              </div>

            {leaseViewMode === "document" ? (
              <div className="flex justify-center overflow-x-auto rounded-b-[2.5rem] neumorphic-inset p-4 sm:p-8 md:p-10 bg-neutral-100/60 dark:bg-black/20">
                <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl border border-zinc-200/70">
                  {formattedLeaseData && (
                    <LeaseDocument
                      containerId="official-lease-document-visible"
                      disableAnimation={false}
                      className="shadow-none border-none max-w-none p-6 sm:p-8 md:p-10"
                      {...formattedLeaseData}
                    />
                  )}
                </div>
              </div>
            ) : (
              <>
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
                        <div className="flex size-12 items-center justify-center rounded-2xl neumorphic-inset text-muted-foreground font-black">
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
                          <LayoutGrid className="size-6" />
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
              </>
            )}
          </div>

          {leaseViewMode === "overview" && (
            <div className="rounded-[2.5rem] neumorphic-panel p-8 ">
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
                    <pre className="overflow-x-auto rounded-xl neumorphic-inset p-4 text-xs">
                      {JSON.stringify(lease.terms, null, 2)}
                    </pre>
                  )
                ) : (
                  <p className="italic">Standard lease terms apply.</p>
                )}
              </div>
            </div>
          )}

          {/* Off-screen rendered document for 100% faithful PDF exports when in overview mode */}
          {leaseViewMode === "overview" && formattedLeaseData && (
            <div
              style={{
                position: "fixed",
                left: "-9999px",
                top: 0,
                width: "850px",
                pointerEvents: "none",
                zIndex: -100,
              }}
              aria-hidden="true"
            >
              <div className="bg-white p-4">
                <LeaseDocument
                  containerId="official-lease-document-hidden"
                  disableAnimation={true}
                  {...formattedLeaseData}
                />
              </div>
            </div>
          )}
        </div>

  <div className="space-y-6">
  <div className="rounded-3xl neumorphic-panel p-6">
  <div className="mb-4 flex items-center justify-between">
  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
  Audit Trail
  </h3>
  <History className="size-4 text-muted-foreground/50" />
  </div>
  <LeaseAuditTrail events={[]} />
  </div>

  <div className="space-y-4 rounded-3xl neumorphic-panel p-6">
  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
  Signature Status
  </h3>
 <div className="space-y-4">
 <div className="flex items-center justify-between rounded-2xl neumorphic-inset p-4">
 <div className="flex items-center gap-3">
 <div
 className={cn(
 "flex size-8 items-center justify-center rounded-full",
 lease.tenant_signed_at
 ? "bg-emerald-500/20 text-emerald-500"
 : "neumorphic-inset text-muted-foreground",
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

 <div className="flex items-center justify-between rounded-2xl neumorphic-inset p-4">
 <div className="flex items-center gap-3">
 <div
 className={cn(
 "flex size-8 items-center justify-center rounded-full",
 lease.landlord_signed_at
 ? "bg-emerald-500/20 text-emerald-500"
 : "neumorphic-inset text-muted-foreground",
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
 className="w-full rounded-2xl neumorphic-primary px-6 py-4 text-xs font-black uppercase tracking-widest shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
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
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
      {/* ─── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Lease Hub
          </h1>
          <p className="text-sm font-medium text-neutral-400">
            Monitor and manage all tenancy agreements across your portfolio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="group flex h-11 items-center gap-2 rounded-2xl neumorphic-panel px-4 text-xs font-black uppercase tracking-widest text-neutral-400 transition-all hover:border-primary/30 hover:neumorphic-inset hover:text-white active:scale-95 cursor-pointer"
          >
            <RefreshCw className="size-4 transition-transform group-hover:rotate-180 duration-500" />
            Refresh
          </button>
          
          <button 
            onClick={() => push("/landlord/applications?action=walk-in")}
            className="flex h-11 items-center gap-2 rounded-2xl bg-primary px-6 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 cursor-pointer"
          >
            <Plus className="size-4" />
            New Lease
          </button>
        </div>
      </div>

      {/* ─── Unified Command Bar ──────────────────────────────────── */}
      <div className="flex flex-col items-center justify-between gap-4 border border-white/5 neumorphic-panel p-3 md:p-4 rounded-3xl backdrop-blur-xl xl:flex-row">
        {/* Segmented Pill Tabs */}
        <div className="flex items-center gap-1 rounded-2xl neumorphic-extruded p-1 w-full sm:w-auto overflow-x-auto">
          {[
            { id: "active", label: "Active", icon: ShieldCheck },
            { id: "renewals", label: "Renewals", icon: RefreshCw },
            { id: "history", label: "Archive", icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                activeTab === tab.id
                  ? "neumorphic-panel text-white ring-1 ring-border shadow-sm"
                  : "text-neutral-400 hover:neumorphic-inset hover:text-white"
              )}
            >
              <tab.icon className={cn("size-3.5", activeTab === tab.id ? "text-primary" : "text-neutral-400")} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search, Scope, and Refine Controls */}
        <div className="flex w-full items-center gap-3 xl:w-auto">
          <div className="relative flex-1 xl:w-72">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search tenant or unit..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-2xl neumorphic-extruded pl-10 pr-4 text-xs font-black text-white focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-neutral-500"
            />
          </div>

          <div className="flex h-11 items-center gap-2 rounded-2xl neumorphic-extruded px-3.5 text-xs font-black uppercase tracking-wider text-neutral-300">
            <Building2 className="size-4 text-neutral-400 shrink-0" />
            <select 
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value as any)}
              className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-zinc-900 text-white">All Properties</option>
              {properties.map(p => (
                <option key={p.id} value={p.id} className="bg-zinc-900 text-white">{p.name}</option>
              ))}
            </select>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex size-11 shrink-0 items-center justify-center rounded-2xl neumorphic-extruded text-neutral-400 hover:neumorphic-inset hover:text-white transition-all cursor-pointer">
                <Filter className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl neumorphic-panel border border-white/10">
              <div className="px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                  Refine Results
                </p>
              </div>
              <DropdownMenuSeparator className="mx-2 bg-white/10" />
              
              <div className="mt-2 px-3 pb-1">
                <p className="text-[11px] font-bold text-muted-foreground/70">Sort by Rent</p>
              </div>
              <DropdownMenuItem 
                onClick={() => setSortBy("rent-desc")}
                className={cn("gap-3 rounded-xl cursor-pointer", sortBy === "rent-desc" && "bg-primary/10 text-primary font-bold")}
              >
                <div className={cn("flex size-8 items-center justify-center rounded-lg transition-colors", sortBy === "rent-desc" ? "bg-primary/20" : "bg-primary/10 text-primary")}>
                  <ArrowUp01 className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-xs">High to Low</span>
                  <span className="text-[9px] text-muted-foreground">Highest rent first</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy("rent-asc")}
                className={cn("gap-3 rounded-xl cursor-pointer", sortBy === "rent-asc" && "bg-primary/10 text-primary font-bold")}
              >
                <div className={cn("flex size-8 items-center justify-center rounded-lg transition-colors", sortBy === "rent-asc" ? "bg-primary/20" : "neumorphic-inset text-muted-foreground")}>
                  <ArrowDown10 className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-xs">Low to High</span>
                  <span className="text-[9px] text-muted-foreground">Lowest rent first</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="mx-2 my-2 bg-white/10" />
              
              <div className="px-3 pb-1">
                <p className="text-[11px] font-bold text-muted-foreground/70">Lease Expiry</p>
              </div>
              <DropdownMenuItem 
                onClick={() => setSortBy("date-asc")}
                className={cn("gap-3 rounded-xl cursor-pointer", sortBy === "date-asc" && "bg-amber-500/10 text-amber-500 font-bold")}
              >
                <div className={cn("flex size-8 items-center justify-center rounded-lg transition-colors", sortBy === "date-asc" ? "bg-amber-500/20" : "bg-amber-500/10 text-amber-500")}>
                  <CalendarRange className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-xs">Soonest First</span>
                  <span className="text-[9px] text-muted-foreground">Urgent renewals top</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="mx-2 my-2 bg-white/10" />
              
              <DropdownMenuItem 
                onClick={() => setSortBy("default")}
                className="gap-3 rounded-xl text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10">
                  <RotateCcw className="size-4" />
                </div>
                <span className="font-black uppercase tracking-wider text-[10px]">Reset All Filters</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ─── Tab Content Views ────────────────────────────────────── */}
      <div className="mt-4">
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
 <LoadingSpinner size="md" className="text-primary" />
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
