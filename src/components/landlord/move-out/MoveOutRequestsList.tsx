"use client";

import { useState, useEffect, useMemo } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  Calendar,
  User,
  Home,
  ChevronRight,
  Loader2,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { useProperty } from "@/context/PropertyContext";
import { MoveOutStatusBadge } from "./MoveOutStatusBadge";
import { MoveOutStatus } from "@/types/database";

interface MoveOutRequest {
  id: string;
  status: MoveOutStatus;
  requested_date: string;
  reason: string | null;
  created_at: string;
  lease: {
    unit: {
      name: string;
      property: {
        id: string;
        name: string;
      };
    };
    tenant: {
      full_name: string;
      email: string;
    };
  };
}

export function MoveOutRequestsList({ onSelect, initialFilter = "all", preview = false }: { onSelect: (request: MoveOutRequest) => void, initialFilter?: MoveOutStatus | "all", preview?: boolean }) {
  const { selectedPropertyId } = useProperty();
  const [requests, setRequests] = useState<MoveOutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<MoveOutStatus | "all">(initialFilter);

  // Sync activeFilter when initialFilter prop changes (e.g. via URL)
  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function loadRequests() {
      if (isCancelled) return;
      if (preview) {
        await new Promise(resolve => {
          timeoutId = setTimeout(resolve, 800);
        });
        const MOCK_REQUESTS: MoveOutRequest[] = [
          {
            id: "req-1",
            status: "pending",
            requested_date: new Date(Date.now() + 86400000 * 30).toISOString(),
            reason: "Relocating for a new job opportunity in Metro Manila.",
            created_at: new Date().toISOString(),
            lease: {
              id: "lease-1",
              start_date: new Date(Date.now() - 86400000 * 300).toISOString(),
              end_date: new Date(Date.now() + 86400000 * 60).toISOString(),
              monthly_rent: 25000,
              security_deposit: 50000,
              unit: { name: "Unit 402", property: { id: "p1", name: "Emerald Heights", address: "123 Skyline Ave, Metro Manila" } },
              tenant: { id: "t1", full_name: "Alexander Thompson", email: "alex.t@example.com", phone: "+63 912 345 6789" }
            },
            notes: null,
            denial_reason: null,
            denied_at: null,
            approved_at: null,
            inspection_date: null,
            inspection_notes: null,
            deposit_refund_amount: null
          } as any,
          {
            id: "req-2",
            status: "approved",
            requested_date: new Date(Date.now() + 86400000 * 15).toISOString(),
            reason: "Moving closer to family.",
            created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
            lease: {
              id: "lease-2",
              start_date: new Date(Date.now() - 86400000 * 400).toISOString(),
              end_date: new Date(Date.now() + 86400000 * 15).toISOString(),
              monthly_rent: 18000,
              security_deposit: 36000,
              unit: { name: "Studio 12B", property: { id: "p2", name: "The Grand Atrium", address: "456 Central Blvd, Quezon City" } },
              tenant: { id: "t2", full_name: "Sarah Jenkins", email: "sarah.j@example.com", phone: "+63 987 654 3210" }
            },
            notes: null,
            denial_reason: null,
            denied_at: null,
            approved_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            inspection_date: null,
            inspection_notes: null,
            deposit_refund_amount: null
          } as any,
          {
            id: "req-3",
            status: "completed",
            requested_date: new Date(Date.now() - 86400000 * 2).toISOString(),
            reason: "Buying a new house.",
            created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
            lease: {
              id: "lease-3",
              start_date: new Date(Date.now() - 86400000 * 730).toISOString(),
              end_date: new Date(Date.now() - 86400000 * 2).toISOString(),
              monthly_rent: 30000,
              security_deposit: 60000,
              unit: { name: "Suite 901", property: { id: "p1", name: "Emerald Heights", address: "123 Skyline Ave, Metro Manila" } },
              tenant: { id: "t3", full_name: "John Miller", email: "john.m@example.com", phone: "+63 900 111 2222" }
            },
            notes: "Unit left in perfect condition.",
            denial_reason: null,
            denied_at: null,
            approved_at: new Date(Date.now() - 86400000 * 50).toISOString(),
            inspection_date: new Date(Date.now() - 86400000 * 2).toISOString(),
            inspection_notes: "Minor scratches on floor, but acceptable.",
            deposit_refund_amount: 58500,
            checklist_data: {
              keys_returned: true,
              unit_cleaned: true,
              no_major_damage: true,
              rent_settled: true,
              utilities_settled: true,
              other_dues_cleared: true
            }
          } as any
        ];
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        if (isCancelled) return;
        setRequests(MOCK_REQUESTS);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (selectedPropertyId !== "all") {
          params.append("propertyId", selectedPropertyId);
        }
        if (activeFilter !== "all") {
          params.append("status", activeFilter);
        }
        
        const response = await fetch(`/api/landlord/move-out?${params.toString()}`);
        if (isCancelled) return;
        if (!response.ok) throw new Error("Failed to load requests");
        
        const data = await response.json();
        if (isCancelled) return;
        setRequests(data);
      } catch (err) {
        if (isCancelled) return;
        console.error("Error loading move-out requests:", err);
        setError("Failed to load move-out requests. Please try again.");
      } finally {
        if (isCancelled) return;
        setLoading(false);
      }
    }

    loadRequests();
    return () => { isCancelled = true; if (timeoutId !== null) clearTimeout(timeoutId); };
  }, [selectedPropertyId, activeFilter, preview]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch = 
        req.lease.tenant.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.lease.unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.lease.unit.property.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = activeFilter === "all" || req.status === activeFilter;
      
      return matchesSearch && matchesFilter;
    });
  }, [requests, searchQuery, activeFilter]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      completed: requests.filter((r) => r.status === "completed").length,
    };
  }, [requests]);

  const filterTabs = [
    { label: "All", value: "all", count: stats.total },
    { label: "Pending", value: "pending", count: stats.pending },
    { label: "Approved", value: "approved", count: stats.approved },
    { label: "Completed", value: "completed", count: stats.completed },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-1 rounded-2xl border border-border bg-background/50 p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value as any)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                activeFilter === tab.value
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
            >
              {tab.label}
              <span className={cn(
                "rounded-lg px-1.5 py-0.5 text-[9px]",
                activeFilter === tab.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by tenant, unit, or property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-2xl border border-border bg-background/50 pl-10 pr-4 text-xs font-black text-foreground focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      {/* List Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary/40" />
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-[2rem] border border-red-500/10 bg-red-500/5 p-8 text-center">
            <AlertCircle className="mb-4 size-12 text-red-500/50" />
            <h3 className="text-lg font-black text-foreground">Error Loading Requests</h3>
            <p className="text-sm font-medium text-muted-foreground">{error}</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-border bg-muted/20 p-12 text-center">
            <Inbox className="mb-4 size-12 text-muted-foreground/30" />
            <h3 className="text-xl font-black text-foreground">No Requests Found</h3>
            <p className="text-sm font-medium text-muted-foreground">
              {searchQuery || activeFilter !== "all" 
                ? "No requests match your current filters."
                : "There are currently no move-out requests."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1">
            <AnimatePresence mode="popLayout">
              {filteredRequests.map((req, idx) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  onClick={() => onSelect(req)}
                  className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                >
                  <div className="flex flex-col p-6 md:flex-row md:items-center md:gap-6">
                    {/* Status & Date */}
                    <div className="mb-4 flex flex-col gap-3 md:mb-0 md:min-w-[140px]">
                      <MoveOutStatusBadge status={req.status} />
                      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground">
                        <Home className="size-5" />
                        Requested: {formatDate(req.requested_date)}
                      </div>
                    </div>

                    {/* Tenant Info */}
                    <div className="mb-4 flex flex-1 flex-col gap-1 md:mb-0">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-primary/60" />
                        <h4 className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                          {req.lease.tenant.full_name}
                        </h4>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground truncate max-w-[200px]">
                        {req.lease.tenant.email}
                      </p>
                    </div>

                    {/* Property/Unit Info */}
                    <div className="mb-4 flex flex-1 flex-col gap-1 md:mb-0">
                      <div className="flex items-center gap-2">
                        <Home className="size-4 text-primary/60" />
                        <span className="text-sm font-black text-foreground">
                          {req.lease.unit.name}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground truncate max-w-[200px]">
                        {req.lease.unit.property.name}
                      </p>
                    </div>

                    {/* Reason Preview */}
                    <div className="hidden flex-1 flex-col gap-1 lg:flex">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Reason</span>
                      <p className="text-xs font-medium text-foreground line-clamp-1 italic">
                        &quot;{req.reason || "No reason provided"}&quot;
                      </p>
                    </div>

                    {/* Action Arrow */}
                    <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 md:block">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-muted transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                        <ChevronRight className="size-5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

