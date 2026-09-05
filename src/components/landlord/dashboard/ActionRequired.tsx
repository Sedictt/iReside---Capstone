"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    ArrowRight,
    ClipboardCheck,
    MessageSquareMore,
    ShieldCheck,
    Wrench,
    Clock,
    Activity,
    Filter,
    RotateCcw,
    Zap,
} from "lucide-react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/lib/messages/client";
import { useProperty } from "@/context/PropertyContext";
import { AnimatedFilterPills, type FilterPillItem } from "@/components/ui/AnimatedFilterPills";

// --- Types ---

type MaintenanceRequestItem = {
    id: string;
    title: string;
    property: string;
    unit: string;
    tenant: string;
    priority: "Critical" | "High" | "Medium" | "Low";
    status: "Pending" | "Assigned" | "In Progress" | "Resolved";
    reportedAt: string;
};

type TenantItem = {
    id: string;
    name: string;
    property: string;
    unit: string;
    leaseEnd: string | null;
    onboardingStatus: "pending" | "in_progress" | "completed" | "not_started";
};

type ApplicationItem = {
    id: string;
    status: string;
    applicant: {
        name: string;
        email: string;
    };
    unitNumber: string;
    propertyName: string;
    submittedDate: string;
};

type ActionCategoryFilter = "all" | "maintenance" | "onboarding" | "lease" | "message";

type ActionItem = {
    id: string;
    title: string;
    detail: string;
    meta: string;
    href: string;
    cta: string;
    tone: "critical" | "high" | "medium";
    kind: "maintenance" | "lease" | "onboarding" | "message";
    badgeLabel?: string;
};

// --- Constants & Helpers ---

const toneClasses: Record<ActionItem["tone"], string> = {
    critical: "border-red-500/25 bg-red-500/12 text-red-400",
    high: "border-amber-500/25 bg-amber-500/12 text-amber-400",
    medium: "border-primary/25 bg-primary/12 text-primary",
};

const kindIconMap = {
    maintenance: Wrench,
    lease: AlertTriangle,
    onboarding: ClipboardCheck,
    message: MessageSquareMore,
} as const;

const formatDateLabel = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

// --- Sub-components ---

function ActionFilteredEmptyState({ onReset }: { onReset: () => void }) {
    return (
        <m.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="rounded-[2rem] neumorphic-inset p-8 sm:p-12 text-center"
        >
            <div className="mb-4 inline-flex size-14 sm:size-16 items-center justify-center rounded-2xl neumorphic-extruded text-primary">
                <Filter className="size-6 sm:size-7" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-foreground">No Matching Attention Items</h3>
            <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground max-w-sm mx-auto">
                No items match your active filter criteria. Clear filters to view all pending tasks.
            </p>
            <button
                type="button"
                onClick={onReset}
                className="mt-5 inline-flex items-center gap-2 rounded-xl neumorphic-primary px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-black text-primary-foreground transition-all hover:brightness-110 active:scale-95"
            >
                <RotateCcw className="size-3.5" />
                Reset All Filters
            </button>
        </m.div>
    );
}

function ActionItemCard({ action }: { action: ActionItem }) {
    const Icon = kindIconMap[action.kind];

    return (
        <m.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative overflow-hidden rounded-[1.5rem] neumorphic-extruded p-4 sm:p-5 transition-all hover:scale-[1.01]"
        >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between relative z-10">
                <div className="flex items-start gap-4">
                    <div className="neumorphic-inset flex size-11 sm:size-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110">
                        <Icon className={cn(
                            "size-5",
                            action.tone === "critical" && "text-red-500",
                            action.tone === "high" && "text-amber-500",
                            action.tone === "medium" && "text-primary"
                        )} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-3">
                            <h3 className="text-sm sm:text-base font-black tracking-tight text-foreground transition-colors group-hover:text-primary">
                                {action.title}
                            </h3>
                            <span className={cn(
                                "rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest", 
                                toneClasses[action.tone]
                            )}>
                                {action.badgeLabel ?? action.tone}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
                            {action.detail}
                        </p>
                        <div className="mt-2 sm:mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            <Clock className="size-3" />
                            {action.meta}
                        </div>
                    </div>
                </div>

                <Link
                    href={action.href}
                    className="group/btn inline-flex items-center justify-center gap-3 w-full sm:w-auto rounded-xl neumorphic-primary px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-black tracking-tight text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] sm:self-center"
                >
                    {action.cta}
                    <ArrowRight className="size-3.5 sm:size-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
            </div>
        </m.div>
    );
}

function ActionEmptyState() {
    return (
        <m.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[2.5rem] neumorphic-inset p-12 text-center"
        >
            <div className="mb-6 inline-flex size-20 items-center justify-center rounded-[1.5rem] neumorphic-extruded text-primary">
                <ShieldCheck className="size-10" />
            </div>
            <h3 className="text-xl font-black text-foreground">All Caught Up</h3>
            <p className="mt-2 text-sm font-medium text-muted-foreground max-w-sm mx-auto">
                No urgent tasks right now. Everything that needs action is already handled.
            </p>
        </m.div>
    );
}

interface ActionRequiredState {
    maintenance: MaintenanceRequestItem[];
    tenants: TenantItem[];
    conversations: ConversationSummary[];
    applications: ApplicationItem[];
    loading: boolean;
    error: string | null;
    mounted: boolean;
}

type ActionRequiredAction = 
    | { type: "SET_MAINTENANCE"; payload: MaintenanceRequestItem[] }
    | { type: "SET_TENANTS"; payload: TenantItem[] }
    | { type: "SET_CONVERSATIONS"; payload: ConversationSummary[] }
    | { type: "SET_APPLICATIONS"; payload: ApplicationItem[] }
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_ERROR"; payload: string | null }
    | { type: "SET_MOUNTED"; payload: boolean };

function actionRequiredReducer(state: ActionRequiredState, action: ActionRequiredAction): ActionRequiredState {
    switch (action.type) {
        case "SET_MAINTENANCE":
            return { ...state, maintenance: action.payload };
        case "SET_TENANTS":
            return { ...state, tenants: action.payload };
        case "SET_CONVERSATIONS":
            return { ...state, conversations: action.payload };
        case "SET_APPLICATIONS":
            return { ...state, applications: action.payload };
        case "SET_LOADING":
            return { ...state, loading: action.payload };
        case "SET_ERROR":
            return { ...state, error: action.payload };
        case "SET_MOUNTED":
            return { ...state, mounted: action.payload };
        default:
            return state;
    }
}

// --- Main Component ---

export function ActionRequired() {
    const { selectedPropertyId } = useProperty();
    
    const [state, dispatch] = useReducer(actionRequiredReducer, {
        maintenance: [],
        tenants: [],
        conversations: [],
        applications: [],
        loading: true,
        error: null,
        mounted: false
    });

    const [categoryFilter, setCategoryFilter] = useState<ActionCategoryFilter>("all");
    const [urgentOnly, setUrgentOnly] = useState(false);

    useEffect(() => {
        dispatch({ type: "SET_MOUNTED", payload: true });
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const loadDashboardActions = async () => {
            dispatch({ type: "SET_LOADING", payload: true });
            dispatch({ type: "SET_ERROR", payload: null });

            try {
                const params = new URLSearchParams({ propertyId: selectedPropertyId });
                const [maintenanceRes, tenantsRes, conversationsRes, applicationsRes] = await Promise.all([
                    fetch(`/api/landlord/maintenance?${params.toString()}`, { signal: controller.signal }),
                    fetch(`/api/landlord/tenants?${params.toString()}`, { signal: controller.signal }),
                    fetch("/api/messages/conversations", { signal: controller.signal, cache: "no-store" }),
                    fetch(`/api/landlord/applications?${params.toString()}`, { signal: controller.signal }),
                ]);

                const [maintenancePayload, tenantsPayload, conversationsPayload, applicationsPayload] = await Promise.all([
                    maintenanceRes.json().catch(() => ({})),
                    tenantsRes.json().catch(() => ({})),
                    conversationsRes.json().catch(() => ({})),
                    applicationsRes.json().catch(() => ({})),
                ]);

                if (!maintenanceRes.ok || !tenantsRes.ok || !conversationsRes.ok) {
                    throw new Error("Failed to load action items");
                }

                dispatch({ 
                    type: "SET_MAINTENANCE", 
                    payload: Array.isArray((maintenancePayload as { requests?: MaintenanceRequestItem[] }).requests)
                        ? (maintenancePayload as { requests: MaintenanceRequestItem[] }).requests
                        : []
                });
                dispatch({ 
                    type: "SET_TENANTS", 
                    payload: Array.isArray((tenantsPayload as { tenants?: TenantItem[] }).tenants)
                        ? (tenantsPayload as { tenants: TenantItem[] }).tenants
                        : []
                });
                dispatch({ 
                    type: "SET_CONVERSATIONS", 
                    payload: Array.isArray((conversationsPayload as { conversations?: ConversationSummary[] }).conversations)
                        ? (conversationsPayload as { conversations: ConversationSummary[] }).conversations
                        : []
                });
                dispatch({ 
                    type: "SET_APPLICATIONS", 
                    payload: Array.isArray((applicationsPayload as { applications?: ApplicationItem[] }).applications)
                        ? (applicationsPayload as { applications: ApplicationItem[] }).applications
                        : []
                });
            } catch (loadError) {
                if ((loadError as Error).name === "AbortError") {
                    return;
                }
                dispatch({ type: "SET_ERROR", payload: "Unable to load action items right now." });
            } finally {
                dispatch({ type: "SET_LOADING", payload: false });
            }
        };

        void loadDashboardActions();

        return () => {
            controller.abort();
        };
    }, [selectedPropertyId]);

    const { allActions, counts } = useMemo(() => {
        if (!state.mounted) {
            return {
                allActions: [],
                counts: { all: 0, maintenance: 0, onboarding: 0, lease: 0, message: 0, urgent: 0 }
            };
        }

        const rawActions: ActionItem[] = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // 1. Maintenance Requests (Database-driven priority SLA)
        state.maintenance
            .filter((request) => request.status !== "Resolved")
            .slice(0, 10)
            .forEach((request) => {
                const isCritical = request.priority === "Critical";
                const isHigh = request.priority === "High";

                rawActions.push({
                    id: `maintenance-${request.id}`,
                    title: isCritical 
                        ? "Emergency Repair Required" 
                        : isHigh 
                        ? "Urgent Maintenance Ticket" 
                        : "Routine Maintenance",
                    detail: `${request.tenant}: ${request.title} at ${request.property}`,
                    meta: `Reported ${formatDateLabel(request.reportedAt)}`,
                    href: `/landlord/maintenance?id=${request.id}`,
                    cta: "Dispatch Tech",
                    tone: isCritical ? "critical" : isHigh ? "high" : "medium",
                    badgeLabel: isCritical ? "Critical SLA" : isHigh ? "High Priority" : "Standard",
                    kind: "maintenance",
                });
            });

        // 2. Lease Expirations (Time-to-deadline thresholds)
        state.tenants
            .filter((tenant) => tenant.leaseEnd)
            .map((tenant) => {
                const target = new Date(tenant.leaseEnd as string);
                target.setHours(0, 0, 0, 0);
                const daysUntil = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return { tenant, daysUntil };
            })
            .filter(({ daysUntil }) => daysUntil <= 30)
            .sort((left, right) => left.daysUntil - right.daysUntil)
            .slice(0, 10)
            .forEach(({ tenant, daysUntil }) => {
                const isImminent = daysUntil <= 7;

                rawActions.push({
                    id: `lease-${tenant.id}`,
                    title: daysUntil <= 0 
                        ? "Lease Term Expired" 
                        : isImminent 
                        ? "Imminent Lease Expiry" 
                        : "Lease Renewal Window",
                    detail: `${tenant.name} in ${tenant.unit} (${tenant.property})`,
                    meta: daysUntil <= 0 ? "Expired today" : `${daysUntil} days remaining`,
                    href: `/landlord/tenants?tab=renewals&tenantId=${tenant.id}`,
                    cta: "Send Renewal",
                    tone: isImminent ? "high" : "medium",
                    badgeLabel: daysUntil <= 0 ? "Expired" : isImminent ? "Expiring Soon" : "Renewal Due",
                    kind: "lease",
                });
            });

        // 3. Rental Applications (Operational pipeline review)
        state.applications
            .filter((app) => app.status === "pending" || app.status === "reviewing")
            .slice(0, 10)
            .forEach((app) => {
                rawActions.push({
                    id: `application-${app.id}`,
                    title: "Applicant Verification",
                    detail: `${app.applicant.name}: Application for ${app.unitNumber} (${app.propertyName})`,
                    meta: "Document Verification",
                    href: `/landlord/applications?id=${app.id}`,
                    cta: "Verify Docs",
                    tone: "medium",
                    badgeLabel: "Review Needed",
                    kind: "onboarding",
                });
            });

        // 4. Resident Onboarding (Pre-move-in administrative tasks)
        state.tenants
            .filter((tenant) => tenant.onboardingStatus !== "completed")
            .slice(0, 10)
            .forEach((tenant) => {
                const isPendingReview = tenant.onboardingStatus === "pending";
                const isNotStarted = tenant.onboardingStatus === "not_started";

                rawActions.push({
                    id: `onboarding-${tenant.id}`,
                    title: isPendingReview
                        ? "Resident Document Verification"
                        : isNotStarted
                        ? "Resident Setup Required"
                        : "Resident Onboarding Active",
                    detail: isNotStarted
                        ? `${tenant.name} (${tenant.unit}): Move-in setup has not been initiated.`
                        : isPendingReview
                        ? `${tenant.name} (${tenant.unit}): Onboarding details submitted for review.`
                        : `${tenant.name} (${tenant.unit}): Move-in onboarding currently in progress.`,
                    meta: isPendingReview ? "Pending Approval" : isNotStarted ? "Setup Needed" : "In Progress",
                    href: `/landlord/tenants?view=profile&tenantId=${tenant.id}&search=${encodeURIComponent(tenant.name)}`,
                    cta: isPendingReview ? "Review Resident" : "View Resident",
                    tone: "medium",
                    badgeLabel: isPendingReview ? "Approval Needed" : isNotStarted ? "Setup Pending" : "In Progress",
                    kind: "onboarding",
                });
            });

        // 5. Communications (Unread resident inquiries)
        state.conversations
            .filter((conversation) => conversation.unreadCount > 0)
            .slice(0, 10)
            .forEach((conversation) => {
                const other = conversation.otherParticipants[0];
                rawActions.push({
                    id: `message-${conversation.id}`,
                    title: "Resident Inquiry",
                    detail: `${other?.fullName ?? "Resident"}: "${conversation.lastMessage?.content?.slice(0, 40) ?? ""}..."`,
                    meta: `${conversation.unreadCount} unread response${conversation.unreadCount > 1 ? "s" : ""}`,
                    href: `/landlord/messages?conversation=${conversation.id}`,
                    cta: "Enter Chat",
                    tone: "medium",
                    badgeLabel: "Unread",
                    kind: "message",
                });
            });

        const sorted = rawActions.sort((left, right) => {
            const weight = { critical: 3, high: 2, medium: 1 };
            return weight[right.tone] - weight[left.tone];
        });

        const calculatedCounts = {
            all: sorted.length,
            maintenance: sorted.filter((a) => a.kind === "maintenance").length,
            onboarding: sorted.filter((a) => a.kind === "onboarding").length,
            lease: sorted.filter((a) => a.kind === "lease").length,
            message: sorted.filter((a) => a.kind === "message").length,
            urgent: sorted.filter((a) => a.tone === "critical" || a.tone === "high").length,
        };

        return { allActions: sorted, counts: calculatedCounts };
    }, [state.conversations, state.maintenance, state.tenants, state.applications, state.mounted]);

    const filteredActions = useMemo(() => {
        let list = allActions;

        if (categoryFilter !== "all") {
            list = list.filter((item) => item.kind === categoryFilter);
        }

        if (urgentOnly) {
            list = list.filter((item) => item.tone === "critical" || item.tone === "high");
        }

        const maxLimit = categoryFilter === "all" && !urgentOnly ? 6 : 15;
        return list.slice(0, maxLimit);
    }, [allActions, categoryFilter, urgentOnly]);

    const hasActiveFilters = categoryFilter !== "all" || urgentOnly;

    const handleResetFilters = () => {
        setCategoryFilter("all");
        setUrgentOnly(false);
    };

    const filterOptions: FilterPillItem<ActionCategoryFilter>[] = [
        { 
            id: "all", 
            label: "All", 
            badge: counts.all > 0 ? counts.all : undefined 
        },
        { 
            id: "onboarding", 
            label: "Move-In", 
            icon: <ClipboardCheck className="size-3.5" />, 
            badge: counts.onboarding > 0 ? counts.onboarding : undefined 
        },
        { 
            id: "maintenance", 
            label: "Maintenance", 
            icon: <Wrench className="size-3.5" />, 
            badge: counts.maintenance > 0 ? counts.maintenance : undefined 
        },
        { 
            id: "lease", 
            label: "Renewals", 
            icon: <AlertTriangle className="size-3.5" />, 
            badge: counts.lease > 0 ? counts.lease : undefined 
        },
        { 
            id: "message", 
            label: "Messages", 
            icon: <MessageSquareMore className="size-3.5" />, 
            badge: counts.message > 0 ? counts.message : undefined 
        },
    ];

    return (
        <LazyMotion features={domAnimation}>
            <section className="rounded-[2.5rem] neumorphic-panel p-4 sm:p-6 md:p-8">
                {/* Header Row */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-12 sm:size-14 items-center justify-center rounded-[1rem] sm:rounded-[1.25rem] neumorphic-extruded text-primary shrink-0">
                            <Activity className="size-5 sm:size-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-lg sm:text-2xl font-black tracking-tight text-foreground">Needs Your Attention</h2>
                                {counts.urgent > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                                        <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                                        {counts.urgent} Urgent
                                    </span>
                                )}
                            </div>
                            <p className="hidden sm:block text-sm font-medium text-muted-foreground/80">
                                Action items requiring your immediate review or follow-up.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                        <AnimatedFilterPills
                            variant="neumorphic"
                            size="sm"
                            options={filterOptions}
                            activeId={categoryFilter}
                            onChange={(id) => setCategoryFilter(id)}
                            layoutGroupId="dashboard-action-category-filters"
                        />

                        {/* Urgent Only Toggle Pill */}
                        <button
                            type="button"
                            onClick={() => setUrgentOnly((prev) => !prev)}
                            className={cn(
                                "group relative flex h-8 sm:h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-black transition-all shrink-0 select-none",
                                urgentOnly
                                    ? "border border-red-500/40 bg-red-500/15 text-red-400 shadow-sm shadow-red-500/10"
                                    : "neumorphic-inset text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Zap className={cn("size-3.5 transition-colors", urgentOnly ? "fill-red-400 text-red-400" : "text-muted-foreground group-hover:text-amber-400")} />
                            <span>Urgent Only</span>
                            {counts.urgent > 0 && (
                                <span className={cn(
                                    "rounded-full px-1.5 py-0.2 text-[9px] font-black",
                                    urgentOnly ? "bg-red-500/30 text-red-300" : "bg-white/10 text-neutral-400"
                                )}>
                                    {counts.urgent}
                                </span>
                            )}
                        </button>
                    </div>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors hover:neumorphic-inset"
                        >
                            <RotateCcw className="size-3" />
                            <span>Reset Filter</span>
                        </button>
                    )}
                </div>

                <AnimatePresence mode="popLayout">
                    {state.loading ? (
                        <div className="grid gap-4">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="animate-pulse rounded-[1.5rem] neumorphic-inset p-6">
                                    <div className="flex gap-4">
                                        <div className="size-12 rounded-xl neumorphic-extruded" />
                                        <div className="flex-1 space-y-3">
                                            <div className="h-4 w-1/4 rounded bg-muted/30" />
                                            <div className="size-3/4 rounded bg-muted/30" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : state.error ? (
                        <m.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="rounded-3xl border border-red-500/30 neumorphic-inset p-6 text-center"
                        >
                            <p className="text-sm font-black text-red-500">{state.error}</p>
                        </m.div>
                    ) : allActions.length === 0 ? (
                        <ActionEmptyState />
                    ) : filteredActions.length === 0 ? (
                        <ActionFilteredEmptyState onReset={handleResetFilters} />
                    ) : (
                        <div className="grid gap-4">
                            {filteredActions.map((action) => (
                                <ActionItemCard key={action.id} action={action} />
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </section>
        </LazyMotion>
    );
}
