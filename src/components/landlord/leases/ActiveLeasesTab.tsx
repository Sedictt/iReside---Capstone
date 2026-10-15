"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
 Search,
 Plus,
 RefreshCw,
 FileText,
 AlertCircle,
 Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguageContext } from "@/context/LanguageContext";
import { useProperty } from "@/context/PropertyContext";
import { LeaseCard, LeaseListRow, type LeaseCardData } from "./LeaseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useInstantData } from "@/lib/hooks/useInstantData";
import { leaseEndSortValue } from "@/lib/lease-term";

interface ActiveLeasesTabProps {
 searchQuery: string;
 sortBy: string;
 onClearSearch: () => void;
 viewMode?: "list" | "grid";
}

export default function ActiveLeasesTab({ searchQuery, sortBy, onClearSearch, viewMode = "grid" }: ActiveLeasesTabProps) {
 const router = useRouter();
 const { t } = useLanguageContext();
 const { selectedPropertyId } = useProperty();

 const {
  data: leasesData,
  isLoading: loading,
  error: fetchError,
  refetch: fetchLeases,
 } = useInstantData<LeaseCardData[]>({
  key: `landlord_leases_active_${selectedPropertyId || "all"}`,
  fetcher: async (signal) => {
   const params = new URLSearchParams();
   params.set("status", "active");
   if (selectedPropertyId && selectedPropertyId !== "all") {
    params.set("propertyId", selectedPropertyId);
   }
   const res = await fetch(`/api/landlord/leases?${params.toString()}`, { signal });
   if (!res.ok) throw new Error("Failed to fetch active leases");
   const activeLeases = await res.json();
   return Array.isArray(activeLeases) ? (activeLeases as LeaseCardData[]) : [];
  },
 });

 const leases = leasesData ?? [];
 const error = fetchError?.message ?? null;

 const filteredLeases = useMemo(() => {
 let result = [...leases];
 
 // 1. Search Filtering
 if (searchQuery.trim()) {
 const q = searchQuery.toLowerCase();
 result = result.filter(
 (l) =>
 l.unit.property.name.toLowerCase().includes(q) ||
 l.tenant?.full_name.toLowerCase().includes(q) ||
 l.unit.name.toLowerCase().includes(q),
 );
 }

 // 2. Sorting
 if (sortBy === "rent-desc") {
 result.sort((a, b) => b.monthly_rent - a.monthly_rent);
 } else if (sortBy === "rent-asc") {
 result.sort((a, b) => a.monthly_rent - b.monthly_rent);
 } else if (sortBy === "date-asc") {
 // Dated terms soonest first; open-ended leases (no end date) sort last.
 result.sort((a, b) => leaseEndSortValue(a) - leaseEndSortValue(b));
 }

 return result;
 }, [leases, searchQuery, sortBy]);

 // A term switch is applied optimistically by the card; refetch so the list matches the server.
 const handleTermChange = () => {
 void fetchLeases();
 };

 if (loading) {
 return (
 <div className="flex h-64 items-center justify-center">
 <Loader2 className="size-8 animate-spin text-primary/40" />
 </div>
 );
 }

 if (error) {
 return (
 <div className="flex flex-col items-center justify-center gap-4 rounded-3xl neumorphic-inset p-12 text-center">
 <AlertCircle className="size-10 text-destructive/50" />
 <div className="space-y-1">
 <h3 className="font-bold text-foreground">{t("Failed to load leases")}</h3>
 <p className="text-sm text-muted-foreground">{error}</p>
 </div>
 <Button onClick={() => void fetchLeases()} variant="outline" className="rounded-xl">
 {t("Try Again")}
 </Button>
 </div>
 );
 }

 return (
 <div className="space-y-6">

 {/* Results Info */}
 <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1">
 <span>{filteredLeases.length === 1 ? t("{count} Active Lease", { count: filteredLeases.length }) : t("{count} Active Leases", { count: filteredLeases.length })}</span>
 {searchQuery && (
 <button onClick={onClearSearch} className="hover:text-primary transition-colors">
 {t("Clear Results")}
 </button>
 )}
 </div>

 {/* Content: Grid or List */}
 {filteredLeases.length === 0 ? (
 <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-border neumorphic-inset py-20 text-center">
 <FileText className="mb-4 size-10 text-muted-foreground/20" />
 <h4 className="font-bold text-foreground">{t("No leases found")}</h4>
 <p className="text-sm text-muted-foreground">{t("Adjust your search or add a new lease to get started.")}</p>
 </div>
 ) : viewMode === "list" ? (
 <div className="flex flex-col gap-3">
 {filteredLeases.map((lease, i) => (
 <LeaseListRow
 key={lease.id}
 lease={lease}
 variant="active"
 index={i}
 onClick={() => router.push(`/landlord/leases?id=${lease.id}`)}
 onTermChange={handleTermChange}
 />
 ))}
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
 {filteredLeases.map((lease, i) => (
 <LeaseCard
 key={lease.id}
 lease={lease}
 variant="active"
 index={i}
 onClick={() => router.push(`/landlord/leases?id=${lease.id}`)}
 onTermChange={handleTermChange}
 />
 ))}
 </div>
 )}
 </div>
 );
}
