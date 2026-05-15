"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Archive,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProperty } from "@/context/PropertyContext";
import { LeaseCard, type LeaseCardData } from "./LeaseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ArchiveTabProps {
  searchQuery: string;
  sortBy: string;
  onClearSearch: () => void;
}

export default function ArchiveTab({ searchQuery, sortBy, onClearSearch }: ArchiveTabProps) {
  const router = useRouter();
  const { selectedPropertyId } = useProperty();

  const [leases, setLeases] = useState<LeaseCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArchivedLeases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("status", "expired,terminated");
      if (selectedPropertyId && selectedPropertyId !== "all") {
        params.set("propertyId", selectedPropertyId);
      }
      const res = await fetch(`/api/landlord/leases?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch archived leases");
      const archiveResponse = await res.json();
      setLeases(archiveResponse as LeaseCardData[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    void fetchArchivedLeases();
  }, [fetchArchivedLeases]);

  const filteredLeases = useMemo(() => {
    if (!searchQuery.trim()) return leases;
    const q = searchQuery.toLowerCase();
    return leases.filter(
      (l) =>
        l.unit.property.name.toLowerCase().includes(q) ||
        l.tenant?.full_name.toLowerCase().includes(q) ||
        l.unit.name.toLowerCase().includes(q),
    );
  }, [leases, searchQuery]);

  const sortedLeases = useMemo(() => {
    let result = [...filteredLeases];

    if (sortBy === "rent-desc") {
      result.sort((a, b) => b.monthly_rent - a.monthly_rent);
    } else if (sortBy === "rent-asc") {
      result.sort((a, b) => a.monthly_rent - b.monthly_rent);
    } else if (sortBy === "date-asc") {
      result.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
    } else {
      // Default: Sort by end_date descending (most recent first)
      result.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
    }

    return result;
  }, [filteredLeases, sortBy]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-muted/20 p-12 text-center">
        <AlertCircle className="size-10 text-destructive/50" />
        <div className="space-y-1">
          <h3 className="font-bold text-foreground">Failed to load archive</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={() => void fetchArchivedLeases()} variant="outline" className="rounded-xl">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Results Info */}
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1">
        <span>{sortedLeases.length} Historical {sortedLeases.length === 1 ? 'Record' : 'Records'}</span>
        <span className="italic text-[10px] opacity-60">Sorted by most recently ended</span>
      </div>

      {/* Grid */}
      {sortedLeases.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-border bg-muted/10 py-20 text-center">
          <Archive className="mb-4 size-10 text-muted-foreground/20" />
          <h4 className="font-bold text-foreground">Archive is empty</h4>
          <p className="text-sm text-muted-foreground">Historical records will appear here as tenancies conclude.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedLeases.map((lease, i) => (
            <LeaseCard
              key={lease.id}
              lease={lease}
              variant="archive"
              index={i}
              onClick={() => router.push(`/landlord/leases?id=${lease.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

