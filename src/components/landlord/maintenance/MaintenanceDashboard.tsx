"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  ArrowRight,
  MapPin,
  Zap,
  Image as ImageIcon,
  ArrowUpDown,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  UserCheck,
} from "lucide-react";
import { MaintenanceRequestModal } from "./MaintenanceRequestModal";
import { ViewToggle } from "@/components/shared/ViewToggle";
import { useViewMode } from "@/hooks/useViewMode";
import { useProperty } from "@/context/PropertyContext";
import { useInstantData } from "@/lib/hooks/useInstantData";
import { useLanguageContext } from "@/context/LanguageContext";
import { getSafeAvatarBgColor } from "@/lib/constants";
import {
  MAINTENANCE_PRIORITY_RANK,
  MAINTENANCE_PRIORITY_SOFT_CLASSES,
  type MaintenancePriorityLabel,
} from "@/lib/maintenance-priority";

type Priority = MaintenancePriorityLabel;
type Status = "Pending" | "Assigned" | "In Progress" | "Resolved";
type WorkflowTab = "all" | "needs_action" | "in_progress" | "completed";
type SortOption = "priority-desc" | "newest" | "oldest" | "priority-asc";

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  selfRepairRequested?: boolean;
  selfRepairDecision?: "approved" | "rejected" | "pending";
  photoRequested?: boolean;
  property: string;
  unit: string;
  tenant: string;
  tenantAvatar: string | null;
  tenantAvatarBgColor?: string | null;
  priority: Priority;
  status: Status;
  reportedAt: string;
  assignee?: string;
  scheduledFor?: string;
  images: string[];
  tenantRepairStatus?: "not_started" | "personnel_arrived" | "repairing" | "done";
  tenantProvidedPhotos?: string[];
  repairMethod?: "landlord" | "third_party" | "self_repair";
  thirdPartyName?: string;
  sentiment?: "Distressed" | "Negative" | "Neutral" | "Positive";
  triageReason?: string;
  triageConfidence?: number;
  triageSource?: "ai" | "heuristic" | "cache" | "database";
  triagedAt?: string | null;
}

const PRIORITY_OPTIONS: readonly ("All" | Priority)[] = [
  "All",
  "Critical",
  "High",
  "Medium",
  "Low",
];

function isNeedsAction(req: MaintenanceRequest): boolean {
  return (
    req.status === "Pending" ||
    (req.status === "In Progress" && req.tenantRepairStatus === "done")
  );
}

function isInProgressWork(req: MaintenanceRequest): boolean {
  return (
    req.status === "Assigned" ||
    (req.status === "In Progress" && req.tenantRepairStatus !== "done")
  );
}

/**
 * Converts relative strings ("Just now", "2 days ago") or formatted dates ("Oct 14, 2026")
 * into a comparable epoch timestamp for reliable newest/oldest sorting.
 */
function parseReportedTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "just now") return Date.now();
  if (trimmed === "yesterday") return Date.now() - 86_400_000;

  const relMatch = trimmed.match(/^(\d+)\s+(min|mins|minute|minutes|hour|hours|hr|hrs|day|days|week|weeks|month|months)\s+ago$/);
  if (relMatch) {
    const amount = Number(relMatch[1]);
    const unit = relMatch[2];
    const msPerUnit = unit.startsWith("min")
      ? 60_000
      : unit.startsWith("h")
      ? 3_600_000
      : unit.startsWith("d")
      ? 86_400_000
      : unit.startsWith("w")
      ? 7 * 86_400_000
      : 30 * 86_400_000;
    return Date.now() - amount * msPerUnit;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getSafeReportedLabel(value: string | null | undefined, fallback: string): string {
  if (!value || !value.trim()) return fallback;
  return value.trim() === "Invalid Date" ? fallback : value;
}

function getActionMeta(req: MaintenanceRequest): {
  label: string;
  emphasis: "primary" | "verify" | "secondary" | "subtle";
} {
  if (req.status === "Pending") {
    return { label: "Review & Assign", emphasis: "primary" };
  }
  if (req.status === "In Progress" && req.tenantRepairStatus === "done") {
    return { label: "Verify Repair", emphasis: "verify" };
  }
  if (req.status === "Resolved") {
    return { label: "View Summary", emphasis: "subtle" };
  }
  return { label: "Check Progress", emphasis: "secondary" };
}

function getStatusMeta(status: Status, tenantRepairStatus?: string) {
  if (status === "Pending") {
    return {
      label: "Needs Review",
      classes: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
      solidClasses: "bg-amber-500 border-amber-600 text-white",
      Icon: Clock,
    };
  }
  if (status === "Assigned") {
    return {
      label: "Assigned",
      classes: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300",
      solidClasses: "bg-blue-600 border-blue-700 text-white",
      Icon: UserCheck,
    };
  }
  if (status === "In Progress") {
    if (tenantRepairStatus === "personnel_arrived") {
      return {
        label: "Worker Arrived",
        classes: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300",
        solidClasses: "bg-blue-600 border-blue-700 text-white",
        Icon: Wrench,
      };
    }
    if (tenantRepairStatus === "done") {
      return {
        label: "Verify Repair",
        classes: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
        solidClasses: "bg-emerald-600 border-emerald-700 text-white",
        Icon: CheckCircle2,
      };
    }
    return {
      label: "Repairing",
      classes: "bg-primary/15 text-primary border-primary/30",
      solidClasses: "bg-primary border-primary text-primary-foreground",
      Icon: Wrench,
    };
  }

  return {
    label: "Completed",
    classes: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
    solidClasses: "bg-emerald-600 border-emerald-700 text-white",
    Icon: CheckCircle2,
  };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export function MaintenanceDashboard() {
  const { selectedPropertyId } = useProperty();
  const { t } = useLanguageContext();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<WorkflowTab>("all");
  const [searchQuery, setSearchQuery] = useState(() => searchParams?.get("search") || "");
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [previewMode] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<"All" | Priority>("All");
  const [sortBy, setSortBy] = useState<SortOption>("priority-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [view, setView] = useViewMode("ireside:maintenance-view");
  const effectiveView = isMobile ? "list" : view;
  const pageSize = isMobile ? 4 : 6;

  const {
    data: requestsData,
    isLoading: loading,
    error: fetchError,
    mutate: mutateRequests,
    refetch: refreshRequests,
  } = useInstantData<MaintenanceRequest[]>({
    key: `landlord_maintenance_${selectedPropertyId || "all"}`,
    fetcher: async (signal?: AbortSignal) => {
      const response = await fetch(`/api/landlord/maintenance?propertyId=${selectedPropertyId}`, {
        method: "GET",
        signal,
      });
      if (!response.ok) throw new Error("Failed to load maintenance requests");
      const payload = (await response.json()) as { requests?: MaintenanceRequest[] };
      return Array.isArray(payload.requests) ? payload.requests : [];
    },
  });

  const requests: MaintenanceRequest[] = useMemo(() => requestsData ?? [], [requestsData]);
  const error = fetchError ? t(fetchError.message) : null;

  useEffect(() => {
    const deepLinkId = searchParams?.get("id");
    if (deepLinkId && requests.length > 0) {
      const target = requests.find((r: MaintenanceRequest) => r.id === deepLinkId);
      if (target) setSelectedRequest(target);
    }
  }, [searchParams, requests]);

  const counts = useMemo(() => {
    let needsAction = 0;
    let inProgress = 0;
    let completed = 0;
    for (const req of requests) {
      if (req.status === "Resolved") completed += 1;
      else if (isNeedsAction(req)) needsAction += 1;
      else if (isInProgressWork(req)) inProgress += 1;
    }
    return {
      all: requests.length,
      needsAction,
      inProgress,
      completed,
    };
  }, [requests]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredRequests = useMemo(() => {
    return requests.filter((req: MaintenanceRequest) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "needs_action" && isNeedsAction(req)) ||
        (activeTab === "in_progress" && isInProgressWork(req)) ||
        (activeTab === "completed" && req.status === "Resolved");

      const matchesPriority = priorityFilter === "All" || req.priority === priorityFilter;

      if (!normalizedSearch) {
        return matchesTab && matchesPriority;
      }

      const haystack = [req.id, req.tenant, req.unit, req.property, req.title]
        .filter((value): value is string => typeof value === "string")
        .join(" ")
        .toLowerCase();

      return matchesTab && matchesPriority && haystack.includes(normalizedSearch);
    });
  }, [requests, activeTab, priorityFilter, normalizedSearch]);

  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort((a: MaintenanceRequest, b: MaintenanceRequest) => {
      if (sortBy === "newest") {
        return parseReportedTimestamp(b.reportedAt) - parseReportedTimestamp(a.reportedAt);
      }
      if (sortBy === "oldest") {
        return parseReportedTimestamp(a.reportedAt) - parseReportedTimestamp(b.reportedAt);
      }
      if (sortBy === "priority-desc") {
        // Put unresolved items ahead of already resolved items when sorting by urgency
        const aResolved = a.status === "Resolved" ? 1 : 0;
        const bResolved = b.status === "Resolved" ? 1 : 0;
        if (aResolved !== bResolved) return aResolved - bResolved;
        return (MAINTENANCE_PRIORITY_RANK[b.priority] ?? 0) - (MAINTENANCE_PRIORITY_RANK[a.priority] ?? 0);
      }
      if (sortBy === "priority-asc") {
        return (MAINTENANCE_PRIORITY_RANK[a.priority] ?? 0) - (MAINTENANCE_PRIORITY_RANK[b.priority] ?? 0);
      }
      return 0;
    });
  }, [filteredRequests, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedRequests.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRequests = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedRequests.slice(start, start + pageSize);
  }, [sortedRequests, safePage, pageSize]);

  const rangeStart = sortedRequests.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, sortedRequests.length);

  const hasActiveFilters =
    activeTab !== "all" || priorityFilter !== "All" || searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setActiveTab("all");
    setPriorityFilter("All");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleLandlordRequestUpdate = (updated: MaintenanceRequest) => {
    setSelectedRequest(updated);
    void mutateRequests(
      (current) => (current ?? []).map((req: MaintenanceRequest) => (req.id === updated.id ? updated : req)),
      false
    );
  };

  const tabs: {
    id: WorkflowTab;
    label: string;
    hint: string;
    count: number;
    highlight?: boolean;
  }[] = [
    {
      id: "all",
      label: t("All Requests"),
      hint: t("Everything"),
      count: counts.all,
    },
    {
      id: "needs_action",
      label: t("Needs Action"),
      hint: t("Waiting on you"),
      count: counts.needsAction,
      highlight: counts.needsAction > 0,
    },
    {
      id: "in_progress",
      label: t("In Progress"),
      hint: t("Being repaired"),
      count: counts.inProgress,
    },
    {
      id: "completed",
      label: t("Completed"),
      hint: t("Finished work"),
      count: counts.completed,
    },
  ];

  return (
    <div className="flex flex-col w-full bg-background text-foreground p-4 sm:p-6 md:p-8 space-y-6 animate-in fade-in duration-500 relative">
      {previewMode && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold text-primary flex items-center gap-2">
            <Zap className="size-4" />
            {t("Preview Mode Active")}
          </span>
          <div className="flex flex-wrap gap-2">
            <Link href="/landlord/maintenance" className="text-xs font-semibold neumorphic-panel px-3 py-1.5 rounded-lg text-red-500 hover:text-red-600">
              {t("Clear Preview")}
            </Link>
          </div>
        </div>
      )}

      {/* Calm, Clear Page Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Wrench className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance">
              {t("Repairs & Maintenance")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl text-pretty">
              {t("See tenant repair requests, check what needs your action, and track repairs until they are done.")}
            </p>
          </div>
        </div>
      </header>

      {/* Workflow Tabs — Answers "What matters right now?" */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" role="tablist" aria-label={t("Repair status tabs")}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={cn(
                "flex items-center justify-between gap-3 rounded-2xl p-4 text-left transition-all cursor-pointer min-h-[64px] border",
                isActive
                  ? "bg-primary/10 border-primary/40 shadow-sm"
                  : "neumorphic-panel border-border/60 hover:border-primary/25"
              )}
            >
              <div className="min-w-0">
                <div className={cn(
                  "text-sm sm:text-base font-bold leading-tight",
                  isActive ? "text-primary" : "text-foreground"
                )}>
                  {tab.label}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {tab.hint}
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 min-w-[32px] h-8 px-2.5 rounded-full text-sm font-bold inline-flex items-center justify-center tabular-nums",
                  tab.highlight
                    ? "bg-amber-500 text-white"
                    : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Panel */}
      <section className="rounded-3xl neumorphic-panel border border-border/60 flex flex-col overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-6 border-b border-border/60 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                maxLength={60}
                type="text"
                placeholder={t("Search by tenant name, room, or issue...")}
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                className="w-full min-h-[48px] bg-background border border-border rounded-xl py-2.5 pl-10 pr-10 text-sm sm:text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  aria-label={t("Clear search")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Sort & View Mode */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 min-h-[48px]">
                <ArrowUpDown className="size-4 text-muted-foreground shrink-0" />
                <label htmlFor="maintenance-sort" className="sr-only">
                  {t("Sort requests")}
                </label>
                <select
                  id="maintenance-sort"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as SortOption);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-sm font-semibold text-foreground outline-none cursor-pointer min-w-[160px] py-2"
                >
                  <option value="priority-desc" className="bg-card text-foreground">
                    {t("Most Urgent First")}
                  </option>
                  <option value="newest" className="bg-card text-foreground">
                    {t("Newest First")}
                  </option>
                  <option value="oldest" className="bg-card text-foreground">
                    {t("Oldest First")}
                  </option>
                  <option value="priority-asc" className="bg-card text-foreground">
                    {t("Least Urgent First")}
                  </option>
                </select>
              </div>

              {!isMobile && <ViewToggle view={view} onChange={setView} />}
            </div>
          </div>

          {/* Wrapped Priority Chips + Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1">
              {t("Urgency:")}
            </span>
            {PRIORITY_OPTIONS.map((option) => {
              const isSelected = priorityFilter === option;
              const dotColor =
                option === "Critical"
                  ? "bg-red-500"
                  : option === "High"
                  ? "bg-orange-500"
                  : option === "Medium"
                  ? "bg-blue-500"
                  : option === "Low"
                  ? "bg-zinc-400"
                  : null;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setPriorityFilter(option);
                    setCurrentPage(1);
                  }}
                  aria-pressed={isSelected}
                  className={cn(
                    "min-h-[40px] px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all inline-flex items-center gap-2 cursor-pointer",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-foreground border-border hover:border-primary/40"
                  )}
                >
                  {dotColor && (
                    <span
                      className={cn(
                        "size-2 rounded-full shrink-0",
                        isSelected ? "bg-white" : dotColor
                      )}
                      aria-hidden="true"
                    />
                  )}
                  <span>{option === "All" ? t("All") : t(option)}</span>
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="min-h-[40px] px-3.5 py-1.5 rounded-full text-sm font-semibold text-primary hover:bg-primary/10 transition-colors inline-flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <RotateCcw className="size-3.5" />
                {t("Reset Filters")}
              </button>
            )}
          </div>
        </div>

        {/* Request List / Grid */}
        <div className="p-4 sm:p-6">
          {loading ? (
            <div
              className={cn(
                effectiveView === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  : "flex flex-col gap-3"
              )}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <MaintenanceCardSkeleton key={`maintenance-skeleton-${i}`} view={effectiveView} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-50/70 dark:bg-red-500/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {t("Could not load repair requests")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => refreshRequests()}
                className="min-h-[44px] px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer shrink-0"
              >
                {t("Try Again")}
              </button>
            </div>
          ) : sortedRequests.length === 0 ? (
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {requests.length === 0
                  ? t("No repair requests yet")
                  : t("No matching requests found")}
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base max-w-md mb-6">
                {requests.length === 0
                  ? t("You are all caught up! When a tenant reports a repair issue, it will show up here.")
                  : t("No requests match your current search or filter. Reset filters to see all requests.")}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="min-h-[44px] px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="size-4" />
                  {t("Clear All Filters")}
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                className={cn(
                  effectiveView === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "flex flex-col gap-3"
                )}
              >
                {paginatedRequests.map((request) =>
                  effectiveView === "grid" ? (
                    <MaintenanceCard
                      key={request.id}
                      request={request}
                      onClick={() => setSelectedRequest(request)}
                    />
                  ) : (
                    <MaintenanceListRow
                      key={request.id}
                      request={request}
                      onClick={() => setSelectedRequest(request)}
                    />
                  )
                )}
              </div>

              {/* Plain-English Pagination Bar */}
              <div className="mt-6 pt-5 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm font-medium text-muted-foreground tabular-nums">
                  {t("Showing {start}–{end} of {total} requests", {
                    start: rangeStart,
                    end: rangeEnd,
                    total: sortedRequests.length,
                  })}
                </p>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="min-h-[44px] px-4 rounded-xl border border-border bg-background text-sm font-semibold text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:pointer-events-none transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronLeft className="size-4" />
                      {t("Previous")}
                    </button>
                    <span className="px-3 text-sm font-semibold text-foreground tabular-nums">
                      {t("Page {page} of {total}", { page: safePage, total: totalPages })}
                    </span>
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="min-h-[44px] px-4 rounded-xl border border-border bg-background text-sm font-semibold text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:pointer-events-none transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {t("Next")}
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <MaintenanceRequestModal
        key={selectedRequest?.id ?? "maintenance-modal-closed"}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        onRequestUpdated={handleLandlordRequestUpdate}
      />
    </div>
  );
}

function MaintenanceCard({
  request,
  onClick,
}: {
  request: MaintenanceRequest;
  onClick?: () => void;
}) {
  const { t } = useLanguageContext();
  const isCriticalPending = request.priority === "Critical" && request.status === "Pending";
  const isResolved = request.status === "Resolved";
  const action = getActionMeta(request);
  const avatarBg = getSafeAvatarBgColor(request.tenantAvatarBgColor);
  const reportedLabel = getSafeReportedLabel(request.reportedAt, t("Recently"));

  return (
    <article
      onClick={onClick}
      className="group relative flex flex-col bg-card border border-border/70 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-pointer h-full"
    >
      {isCriticalPending && (
        <div className="h-1.5 w-full bg-red-500 shrink-0" aria-hidden="true" />
      )}

      {/* Photo Header with Single Clear Status Pill */}
      <div className="relative h-44 w-full bg-muted/40 border-b border-border/60 overflow-hidden shrink-0">
        {request.images && request.images.length > 0 ? (
          <>
            <Image
              src={request.images[0]}
              alt={request.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" />
            {request.images.length > 1 && (
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold text-white">
                <ImageIcon className="size-3.5" />
                +{request.images.length - 1}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground/40">
            <Wrench className="size-9" />
            <span className="text-xs font-medium">{t("No photo attached")}</span>
          </div>
        )}

        <div className="absolute top-3 left-3 z-10">
          <StatusBadge status={request.status} tenantRepairStatus={request.tenantRepairStatus} solid />
        </div>
      </div>

      {/* 3-Band Content Area */}
      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Band 1: Priority + Time + Issue Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            {!isResolved ? (
              <PriorityBadge priority={request.priority} />
            ) : (
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {t("Closed")}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
              <Clock className="size-3.5 shrink-0" />
              {reportedLabel}
            </span>
          </div>

          <h3
            title={request.title}
            className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug"
          >
            {request.title}
          </h3>
        </div>

        {/* Band 2: Where & Who */}
        <div className="space-y-2.5 mt-auto text-sm">
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
            <span className="leading-snug">
              <strong className="font-semibold text-foreground">
                {t("Unit {unit}", { unit: request.unit })}
              </strong>
              {" • "}
              <span>{request.property}</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              className="relative size-8 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0"
              style={{ backgroundColor: avatarBg }}
            >
              {request.tenantAvatar ? (
                <Image className="object-cover" src={request.tenantAvatar} alt={request.tenant} fill />
              ) : (
                getInitials(request.tenant)
              )}
            </div>
            <span className="text-sm font-medium text-foreground truncate">
              {request.tenant}
            </span>
          </div>
        </div>

        {/* Band 3: Clear Action Button */}
        <div className="pt-3 border-t border-border/60">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className={cn(
              "w-full min-h-[44px] px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer",
              action.emphasis === "primary" &&
                "bg-primary text-primary-foreground hover:bg-primary/90",
              action.emphasis === "verify" &&
                "bg-emerald-600 text-white hover:bg-emerald-700",
              action.emphasis === "secondary" &&
                "bg-primary/10 text-primary hover:bg-primary/15",
              action.emphasis === "subtle" &&
                "bg-muted/70 text-foreground hover:bg-muted"
            )}
          >
            <span>{t(action.label)}</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function MaintenanceListRow({
  request,
  onClick,
}: {
  request: MaintenanceRequest;
  onClick?: () => void;
}) {
  const { t } = useLanguageContext();
  const isCriticalPending = request.priority === "Critical" && request.status === "Pending";
  const isResolved = request.status === "Resolved";
  const action = getActionMeta(request);
  const avatarBg = getSafeAvatarBgColor(request.tenantAvatarBgColor);
  const reportedLabel = getSafeReportedLabel(request.reportedAt, t("Recently"));

  return (
    <article
      onClick={onClick}
      className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm hover:border-primary/40 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {isCriticalPending && (
        <div className="absolute inset-y-0 left-0 w-1.5 bg-red-500" aria-hidden="true" />
      )}

      {/* Left: Avatar + Issue Title + Plain Context */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1 pl-1">
        <div
          className="relative size-11 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0"
          style={{ backgroundColor: avatarBg }}
        >
          {request.tenantAvatar ? (
            <Image className="object-cover" src={request.tenantAvatar} alt={request.tenant} fill />
          ) : (
            getInitials(request.tenant)
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h3
            title={request.title}
            className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug"
          >
            {request.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{request.tenant}</span>
            <span aria-hidden="true">•</span>
            <span className="font-semibold text-primary">
              {t("Unit {unit}", { unit: request.unit })}
            </span>
            <span aria-hidden="true">•</span>
            <span>{request.property}</span>
            <span aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Clock className="size-3.5" />
              {reportedLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Status + Urgency + Explicit Action Button */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
        <div className="flex items-center gap-2 flex-wrap">
          {!isResolved && <PriorityBadge priority={request.priority} />}
          <StatusBadge status={request.status} tenantRepairStatus={request.tenantRepairStatus} />
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className={cn(
            "min-h-[44px] px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer",
            action.emphasis === "primary" &&
              "bg-primary text-primary-foreground hover:bg-primary/90",
            action.emphasis === "verify" &&
              "bg-emerald-600 text-white hover:bg-emerald-700",
            action.emphasis === "secondary" &&
              "bg-primary/10 text-primary hover:bg-primary/15",
            action.emphasis === "subtle" &&
              "bg-muted/70 text-foreground hover:bg-muted"
          )}
        >
          <span>{t(action.label)}</span>
          <ArrowRight className="size-4" />
        </button>
      </div>
    </article>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useLanguageContext();

  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap",
        MAINTENANCE_PRIORITY_SOFT_CLASSES[priority]
      )}
    >
      {priority === "Critical" && <AlertTriangle className="size-3.5 shrink-0" />}
      {t(priority)}
    </span>
  );
}

function StatusBadge({
  status,
  tenantRepairStatus,
  solid = false,
}: {
  status: Status;
  tenantRepairStatus?: string;
  solid?: boolean;
}) {
  const { t } = useLanguageContext();
  const meta = getStatusMeta(status, tenantRepairStatus);
  const Icon = meta.Icon;

  return (
    <span
      className={cn(
        "px-3 py-1 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs",
        solid ? meta.solidClasses : meta.classes
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      {t(meta.label)}
    </span>
  );
}

function MaintenanceCardSkeleton({ view }: { view?: string }) {
  if (view === "list") {
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/60 rounded-2xl p-5 animate-pulse">
        <div className="flex items-center gap-3.5 flex-1">
          <div className="size-11 rounded-full bg-muted shrink-0" />
          <div className="space-y-2 flex-1 max-w-md">
            <div className="h-5 w-3/4 bg-muted rounded-lg" />
            <div className="h-4 w-1/2 bg-muted rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-20 bg-muted rounded-full" />
          <div className="h-11 w-32 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-card border border-border/60 rounded-2xl overflow-hidden h-[380px] animate-pulse">
      <div className="h-44 w-full bg-muted" />
      <div className="p-5 flex flex-col flex-1 gap-4">
        <div className="flex justify-between">
          <div className="h-6 w-20 bg-muted rounded-full" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
        <div className="h-6 w-4/5 bg-muted rounded-lg" />
        <div className="space-y-2 mt-auto">
          <div className="h-4 w-2/3 bg-muted rounded" />
          <div className="h-8 w-1/2 bg-muted rounded-full" />
        </div>
        <div className="h-11 w-full bg-muted rounded-xl" />
      </div>
    </div>
  );
}
