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
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/lib/messages/client";
import { useProperty } from "@/context/PropertyContext";
import { AnimatedFilterPills, type FilterPillItem } from "@/components/ui/AnimatedFilterPills";
import { EXPIRING_URGENT_DAYS, OPEN_ENDED_NOTICE_DAYS, formatLeaseDate, isFixedTerm, leaseEndState } from "@/lib/lease-term";
import { useLanguageContext } from "@/context/LanguageContext";
import { MAINTENANCE_PRIORITY_BADGE_TEXT, toPriorityLabel, type MaintenancePriorityLabel } from "@/lib/maintenance-priority";

// --- Types ---

type MaintenanceRequestItem = {
    id: string;
    title: string;
    property: string;
    unit: string;
    tenant: string;
    priority: MaintenancePriorityLabel;
    status: "Pending" | "Assigned" | "In Progress" | "Resolved";
    reportedAt: string;
};

type TenantItem = {
    id: string;
    name: string;
    property: string;
    unit: string;
    leaseStart?: string | null;
    /** Null for open-ended leases until a move-out date is agreed. */
    leaseEnd: string | null;
    /** Lease term type; the API may expose it under any of these keys. */
    leaseTermType?: string | null;
    term_type?: string | null;
    termType?: string | null;
    lease_term?: string | null;
    onboardingStatus: "pending" | "in_progress" | "completed" | "not_started";
};

/** Normalise a tenant row into the shape the lease-term helpers understand. */
const tenantLeaseTerm = (tenant: TenantItem) => ({
    term_type: tenant.leaseTermType ?? tenant.term_type ?? tenant.termType ?? tenant.lease_term ?? null,
    end_date: tenant.leaseEnd,
    start_date: tenant.leaseStart ?? null,
});

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
    critical: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400",
    high: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    medium: "border-primary/25 bg-primary/10 text-primary",
};

const kindIconMap = {
    maintenance: Wrench,
    lease: AlertTriangle,
    onboarding: ClipboardCheck,
    message: MessageSquareMore,
} as const;

const formatDateLabel = (raw: string | null | undefined, locale: string, fallback = "Recently") => {
    if (!raw) return fallback;
    const trimmed = raw.trim();
    if (!trimmed) return fallback;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
        // API sometimes returns human-readable relative strings like "Today" or "2 days ago"
        return trimmed;
    }
    return parsed.toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

// --- Sub-components ---

function ActionFilteredEmptyState({ onReset, isMobile }: { onReset: () => void; isMobile?: boolean }) {
    const { t } = useLanguageContext();
    return (
        <m.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className={cn(
                "rounded-2xl text-center",
                isMobile ? "border border-border/50 bg-muted/20 p-6" : "neumorphic-inset p-8 sm:p-12"
            )}
        >
            <div className={cn(
                "mb-3 inline-flex items-center justify-center rounded-2xl text-primary",
                isMobile ? "size-12 bg-primary/10" : "mb-4 size-14 sm:size-16 neumorphic-extruded"
            )}>
                <Filter className={isMobile ? "size-5" : "size-6 sm:size-7"} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground text-balance">{t("No Matching Attention Items")}</h3>
            <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground max-w-sm mx-auto text-pretty">
                {t("No items match your active filter criteria. Clear filters to view all pending tasks.")}
            </p>
            <button
                type="button"
                onClick={onReset}
                className={cn(
                    "mt-4 inline-flex items-center justify-center gap-2 rounded-xl min-h-[44px] px-5 py-2.5 text-xs font-bold transition-all active:scale-95 cursor-pointer",
                    isMobile
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "mt-5 font-black neumorphic-primary text-primary-foreground hover:brightness-110"
                )}
            >
                <RotateCcw className="size-3.5" />
                {t("Reset All Filters")}
            </button>
        </m.div>
    );
}

function ActionItemCard({ action, isMobile }: { action: ActionItem; isMobile?: boolean }) {
    const Icon = kindIconMap[action.kind];
    const { t } = useLanguageContext();

    if (isMobile) {
        return (
            <m.div
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="rounded-2xl border border-border/60 bg-background/80 dark:bg-zinc-900/60 p-3.5 shadow-xs flex flex-col gap-2.5"
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                            "flex size-9 items-center justify-center rounded-xl shrink-0 border",
                            action.tone === "critical" && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
                            action.tone === "high" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                            action.tone === "medium" && "bg-primary/10 text-primary border-primary/20"
                        )}>
                            <Icon className="size-4" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-1">
                            {action.title}
                        </h3>
                    </div>
                    <span className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap shrink-0",
                        toneClasses[action.tone]
                    )}>
                        {t(action.badgeLabel ?? action.tone)}
                    </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {action.detail}
                </p>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground min-w-0">
                        <Clock className="size-3.5 shrink-0" />
                        <span className="truncate">{action.meta}</span>
                    </div>
                    <Link
                        href={action.href}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition-all whitespace-nowrap shrink-0 shadow-xs"
                    >
                        <span>{action.cta}</span>
                        <ArrowRight className="size-3.5 shrink-0" />
                    </Link>
                </div>
            </m.div>
        );
    }

    return (
        <m.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative overflow-hidden rounded-2xl neumorphic-extruded p-4 sm:p-5 transition-all hover:scale-[1.01]"
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
                            <h3 className="text-sm sm:text-base font-black tracking-tight text-foreground transition-colors group-hover:text-primary text-balance">
                                {action.title}
                            </h3>
                            <span className={cn(
                                "rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest", 
                                toneClasses[action.tone]
                            )}>
                                {t(action.badgeLabel ?? action.tone)}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed text-pretty">
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
                    className="group/btn inline-flex items-center justify-center gap-3 w-full sm:w-auto rounded-xl min-h-[44px] neumorphic-primary px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-black tracking-tight text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] sm:self-center"
                >
                    {action.cta}
                    <ArrowRight className="size-3.5 sm:size-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
            </div>
        </m.div>
    );
}

function ActionEmptyState({ isMobile }: { isMobile?: boolean }) {
    const { t } = useLanguageContext();
    return (
        <m.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "text-center",
                isMobile ? "rounded-2xl border border-border/50 bg-muted/20 p-6" : "rounded-3xl neumorphic-inset p-10 sm:p-12"
            )}
        >
            <div className={cn(
                "inline-flex items-center justify-center rounded-2xl text-primary",
                isMobile ? "mb-3 size-12 bg-primary/10" : "mb-6 size-20 neumorphic-extruded"
            )}>
                <ShieldCheck className={isMobile ? "size-6" : "size-10"} />
            </div>
            <h3 className={cn("font-bold text-foreground text-balance", isMobile ? "text-base" : "text-xl font-black")}>{t("All Caught Up")}</h3>
            <p className={cn("mt-1.5 font-medium text-muted-foreground max-w-sm mx-auto text-pretty", isMobile ? "text-xs" : "mt-2 text-sm")}>
                {t("No urgent tasks right now. Everything that needs action is already handled.")}
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

export function ActionRequired({ variant = "desktop" }: { variant?: "desktop" | "mobile" } = {}) {
    const isMobile = variant === "mobile";
    const { selectedPropertyId } = useProperty();
    const { t, locale, language } = useLanguageContext();
    
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
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [categoryFilter, urgentOnly, selectedPropertyId]);

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
                const priority = toPriorityLabel(request.priority);
                const isCritical = priority === "Critical";
                const isHigh = priority === "High";

                rawActions.push({
                    id: `maintenance-${request.id}`,
                    title: isCritical
                        ? t("Emergency Repair Required")
                        : isHigh
                        ? t("Urgent Maintenance Ticket")
                        : t("Routine Maintenance"),
                    detail: t("{tenant}: {issue} at {property}", { tenant: request.tenant, issue: request.title, property: request.property }),
                    meta: t("Reported {date}", { date: formatDateLabel(request.reportedAt, locale, t("Recently")) }),
                    href: isMobile ? `/mobile/landlord/tickets?id=${request.id}` : `/landlord/maintenance?id=${request.id}`,
                    cta: t("Dispatch Tech"),
                    tone: isCritical ? "critical" : isHigh ? "high" : "medium",
                    badgeLabel: isCritical ? "Critical SLA" : isHigh ? MAINTENANCE_PRIORITY_BADGE_TEXT.High : "Standard",
                    kind: "maintenance",
                });
            });

        // 2. Lease end dates. Only fixed terms expire; open-ended leases never get a
        //    renewal nudge, but an approved move-out within the notice window is surfaced.
        state.tenants
            .map((tenant) => ({ tenant, term: tenantLeaseTerm(tenant), endState: leaseEndState(tenantLeaseTerm(tenant), now) }))
            .filter(({ endState }) => endState.kind !== "open_ended" && endState.daysLeft <= EXPIRING_URGENT_DAYS)
            .sort((left, right) => (left.endState.daysLeft ?? 0) - (right.endState.daysLeft ?? 0))
            .slice(0, 10)
            .forEach(({ tenant, term, endState }) => {
                if (endState.kind === "open_ended") return;
                const daysUntil = endState.daysLeft;
                const isImminent = daysUntil <= 7;

                if (endState.kind === "moving_out" || (endState.kind === "ended" && !isFixedTerm(term))) {
                    // Open-ended lease with an agreed move-out date.
                    if (daysUntil > OPEN_ENDED_NOTICE_DAYS) return;
                    rawActions.push({
                        id: `lease-${tenant.id}`,
                        title: daysUntil < 0 ? t("Move-out Date Passed") : daysUntil === 0 ? t("Move-out Today") : t("Move-out Coming Up"),
                        detail: t("{name} in {unit} ({property})", { name: tenant.name, unit: tenant.unit, property: tenant.property }),
                        meta: daysUntil < 0
                            ? t("Move-out was {date}", { date: formatLeaseDate(endState.endDate, undefined, language) })
                            : daysUntil === 0
                            ? t("Moving out today")
                            : daysUntil === 1
                            ? t("{count} day until move-out ({date})", { count: daysUntil, date: formatLeaseDate(endState.endDate, undefined, language) })
                            : t("{count} days until move-out ({date})", { count: daysUntil, date: formatLeaseDate(endState.endDate, undefined, language) }),
                        href: isMobile
                            ? `/mobile/landlord/move-out?tenantId=${tenant.id}`
                            : `/landlord/move-out?tenantId=${tenant.id}`,
                        cta: t("Prepare Move-out"),
                        tone: isImminent ? "high" : "medium",
                        badgeLabel: daysUntil < 0 ? "Follow Up" : isImminent ? "This Week" : "Scheduled",
                        kind: "lease",
                    });
                    return;
                }

                // Fixed term ending (or ended) within the urgent window.
                rawActions.push({
                    id: `lease-${tenant.id}`,
                    title: daysUntil <= 0
                        ? t("Lease Term Expired")
                        : isImminent
                        ? t("Imminent Lease Expiry")
                        : t("Lease Renewal Window"),
                    detail: t("{name} in {unit} ({property})", { name: tenant.name, unit: tenant.unit, property: tenant.property }),
                    meta: daysUntil < 0
                        ? t("Ended {date}", { date: formatLeaseDate(endState.endDate, undefined, language) })
                        : daysUntil === 0
                        ? t("Expires today")
                        : t("{count} days remaining", { count: daysUntil }),
                    href: isMobile
                        ? `/mobile/landlord/leases?tab=renewals&tenantId=${tenant.id}`
                        : `/landlord/tenants?tab=renewals&tenantId=${tenant.id}`,
                    cta: t("Send Renewal"),
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
                    title: t("Applicant Verification"),
                    detail: t("{name}: Application for {unit} ({property})", { name: app.applicant.name, unit: app.unitNumber, property: app.propertyName }),
                    meta: t("Document Verification"),
                    href: isMobile
                        ? `/mobile/landlord/applications?id=${app.id}`
                        : `/landlord/applications?id=${app.id}`,
                    cta: t("Verify Docs"),
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
                        ? t("Resident Document Verification")
                        : isNotStarted
                        ? t("Resident Setup Required")
                        : t("Resident Onboarding Active"),
                    detail: isNotStarted
                        ? t("{name} ({unit}): Move-in setup has not been initiated.", { name: tenant.name, unit: tenant.unit })
                        : isPendingReview
                        ? t("{name} ({unit}): Onboarding details submitted for review.", { name: tenant.name, unit: tenant.unit })
                        : t("{name} ({unit}): Move-in onboarding currently in progress.", { name: tenant.name, unit: tenant.unit }),
                    meta: isPendingReview ? t("Pending Approval") : isNotStarted ? t("Setup Needed") : t("In Progress"),
                    href: isMobile
                        ? `/mobile/landlord/tenants?view=profile&tenantId=${tenant.id}&search=${encodeURIComponent(tenant.name)}`
                        : `/landlord/tenants?view=profile&tenantId=${tenant.id}&search=${encodeURIComponent(tenant.name)}`,
                    cta: isPendingReview ? t("Review Resident") : t("View Resident"),
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
                    title: t("Resident Inquiry"),
                    detail: `${other?.fullName ?? t("Resident")}: "${conversation.lastMessage?.content?.slice(0, 40) ?? ""}..."`,
                    meta: conversation.unreadCount > 1
                        ? t("{count} unread responses", { count: conversation.unreadCount })
                        : t("{count} unread response", { count: conversation.unreadCount }),
                    href: isMobile
                        ? `/mobile/landlord/messages?conversation=${conversation.id}`
                        : `/landlord/messages?conversation=${conversation.id}`,
                    cta: t("Enter Chat"),
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
    }, [state.conversations, state.maintenance, state.tenants, state.applications, state.mounted, isMobile, t, locale, language]);

    const filteredActions = useMemo(() => {
        let list = allActions;

        if (categoryFilter !== "all") {
            list = list.filter((item) => item.kind === categoryFilter);
        }

        if (urgentOnly) {
            list = list.filter((item) => item.tone === "critical" || item.tone === "high");
        }

        return list;
    }, [allActions, categoryFilter, urgentOnly]);

    const pageSize = isMobile ? 3 : 6;
    const totalPages = Math.max(1, Math.ceil(filteredActions.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const paginatedActions = useMemo(
        () => filteredActions.slice(startIndex, startIndex + pageSize),
        [filteredActions, startIndex, pageSize]
    );

    const hasActiveFilters = categoryFilter !== "all" || urgentOnly;

    const handleResetFilters = () => {
        setCategoryFilter("all");
        setUrgentOnly(false);
        setCurrentPage(1);
    };

    const filterOptions: FilterPillItem<ActionCategoryFilter>[] = [
        { 
            id: "all", 
            label: t("All"), 
            badge: counts.all > 0 ? counts.all : undefined 
        },
        { 
            id: "onboarding", 
            label: t("Move-In"), 
            icon: <ClipboardCheck className="size-3.5" />, 
            badge: counts.onboarding > 0 ? counts.onboarding : undefined 
        },
        { 
            id: "maintenance", 
            label: t("Maintenance"), 
            icon: <Wrench className="size-3.5" />, 
            badge: counts.maintenance > 0 ? counts.maintenance : undefined 
        },
        { 
            id: "lease", 
            label: t("Renewals"), 
            icon: <AlertTriangle className="size-3.5" />, 
            badge: counts.lease > 0 ? counts.lease : undefined 
        },
        { 
            id: "message", 
            label: t("Messages"), 
            icon: <MessageSquareMore className="size-3.5" />, 
            badge: counts.message > 0 ? counts.message : undefined 
        },
    ];

    const visibleRangeStart = filteredActions.length === 0 ? 0 : startIndex + 1;
    const visibleRangeEnd = Math.min(startIndex + pageSize, filteredActions.length);

    return (
        <LazyMotion features={domAnimation}>
            <section
                className={cn(
                    isMobile
                        ? "rounded-2xl bg-card border border-border/60 p-4 shadow-xs"
                        : "rounded-3xl neumorphic-panel p-6 sm:p-8"
                )}
            >
                {/* Header Row */}
                <div className={cn(
                    isMobile
                        ? "mb-3.5 flex items-center justify-between gap-2.5"
                        : "mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                )}>
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                            "flex items-center justify-center text-primary shrink-0",
                            isMobile
                                ? "size-10 rounded-xl bg-primary/10 border border-primary/15"
                                : "size-12 sm:size-14 rounded-2xl neumorphic-extruded"
                        )}>
                            <Activity className={isMobile ? "size-5" : "size-5 sm:size-7"} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className={cn(
                                    "font-bold tracking-tight text-foreground",
                                    isMobile ? "text-base leading-snug" : "text-lg sm:text-2xl font-black text-balance"
                                )}>
                                    {t("Needs Your Attention")}
                                </h2>
                                {!isMobile && counts.urgent > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 tabular-nums whitespace-nowrap">
                                        <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                                        {t("{count} Urgent", { count: counts.urgent })}
                                    </span>
                                )}
                            </div>
                            <p className={cn(
                                "text-muted-foreground leading-snug",
                                isMobile ? "text-xs" : "hidden sm:block text-sm font-medium text-muted-foreground/80 max-w-prose text-pretty"
                            )}>
                                {isMobile
                                    ? t("Items waiting for your review")
                                    : t("Action items requiring your immediate review or follow-up.")}
                            </p>
                        </div>
                    </div>

                    {isMobile && counts.urgent > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 tabular-nums whitespace-nowrap shrink-0">
                            <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                            {t("{count} Urgent", { count: counts.urgent })}
                        </span>
                    )}
                </div>

                {/* Filter Controls Bar */}
                {isMobile ? (
                    <div className="mb-3.5 flex flex-wrap items-center gap-1.5">
                        {filterOptions
                            .filter((option) => option.id === "all" || Number(option.badge ?? 0) > 0 || categoryFilter === option.id)
                            .map((option) => {
                                const isActive = categoryFilter === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setCategoryFilter(option.id)}
                                        className={cn(
                                            "inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border",
                                            isActive
                                                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                                : "bg-muted/50 text-muted-foreground hover:text-foreground border-border/60"
                                        )}
                                    >
                                        {option.icon}
                                        <span>{option.label}</span>
                                        {option.badge !== undefined && (
                                            <span className={cn(
                                                "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold tabular-nums",
                                                isActive
                                                    ? "bg-primary-foreground/20 text-primary-foreground"
                                                    : "bg-background/80 text-foreground"
                                            )}>
                                                {option.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}

                        {(counts.urgent > 0 || urgentOnly) && (
                            <button
                                type="button"
                                onClick={() => setUrgentOnly((prev) => !prev)}
                                className={cn(
                                    "inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border",
                                    urgentOnly
                                        ? "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40"
                                        : "bg-muted/50 text-muted-foreground hover:text-foreground border-border/60"
                                )}
                            >
                                <Zap className={cn("size-3.5", urgentOnly ? "fill-red-500 text-red-500" : "text-amber-500")} />
                                <span>{t("Urgent Only")}</span>
                                {counts.urgent > 0 && (
                                    <span className={cn(
                                        "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold tabular-nums",
                                        urgentOnly
                                            ? "bg-red-500/20 text-red-700 dark:text-red-300"
                                            : "bg-background/80 text-foreground"
                                    )}>
                                        {counts.urgent}
                                    </span>
                                )}
                            </button>
                        )}

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1 min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            >
                                <RotateCcw className="size-3.5" />
                                <span>{t("Reset")}</span>
                            </button>
                        )}
                    </div>
                ) : (
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
                                    "group relative flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-black transition-all shrink-0 select-none",
                                    urgentOnly
                                        ? "border border-red-500/40 bg-red-500/15 text-red-400 shadow-sm shadow-red-500/10"
                                        : "neumorphic-inset text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Zap className={cn("size-3.5 transition-colors", urgentOnly ? "fill-red-400 text-red-400" : "text-muted-foreground group-hover:text-amber-400")} />
                                <span>{t("Urgent Only")}</span>
                                {counts.urgent > 0 && (
                                    <span className={cn(
                                        "rounded-full px-1.5 py-0.2 text-[9px] font-black tabular-nums",
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
                                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 min-h-[36px] text-xs font-bold text-muted-foreground hover:text-primary transition-colors hover:neumorphic-inset"
                            >
                                <RotateCcw className="size-3" />
                                <span>{t("Reset Filter")}</span>
                            </button>
                        )}
                    </div>
                )}

                <AnimatePresence mode="popLayout">
                    {state.loading ? (
                        <div className={cn("grid", isMobile ? "gap-2.5" : "gap-4")}>
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className={cn(
                                        "animate-pulse rounded-2xl",
                                        isMobile ? "border border-border/50 bg-muted/20 p-4" : "neumorphic-inset p-6"
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className={cn("rounded-xl shrink-0", isMobile ? "size-9 bg-muted/40" : "size-12 neumorphic-extruded")} />
                                        <div className="flex-1 space-y-2.5">
                                            <div className="h-3.5 w-1/3 rounded bg-muted/40" />
                                            <div className="h-3 w-3/4 rounded bg-muted/30" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : state.error ? (
                        <m.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={cn(
                                "border border-red-500/30 text-center",
                                isMobile ? "rounded-2xl bg-red-500/5 p-5" : "rounded-3xl neumorphic-inset p-6"
                            )}
                        >
                            <p className="text-sm font-bold text-red-500">{t(state.error)}</p>
                        </m.div>
                    ) : allActions.length === 0 ? (
                        <ActionEmptyState isMobile={isMobile} />
                    ) : filteredActions.length === 0 ? (
                        <ActionFilteredEmptyState onReset={handleResetFilters} isMobile={isMobile} />
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className={cn("grid", isMobile ? "gap-2.5" : "gap-4")}>
                                {paginatedActions.map((action) => (
                                    <ActionItemCard key={action.id} action={action} isMobile={isMobile} />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className={cn(
                                    "flex items-center justify-between gap-2 pt-3 border-t border-border/50",
                                    isMobile ? "flex-col xs:flex-row" : ""
                                )}>
                                    <p className="text-xs font-medium text-muted-foreground tabular-nums">
                                        {t("Showing {start}–{end} of {total}", {
                                            start: visibleRangeStart,
                                            end: visibleRangeEnd,
                                            total: filteredActions.length,
                                        })}
                                    </p>

                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                        <button
                                            type="button"
                                            disabled={safePage <= 1}
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            aria-label={t("Previous page")}
                                            className={cn(
                                                "inline-flex items-center justify-center gap-1 rounded-xl border border-border bg-muted/50 hover:bg-muted text-foreground text-xs font-bold transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
                                                isMobile ? "min-h-[44px] px-3.5" : "min-h-[38px] px-3"
                                            )}
                                        >
                                            <ChevronLeft className="size-4 shrink-0" />
                                            <span>{t("Prev")}</span>
                                        </button>

                                        <span className="text-xs font-bold text-foreground tabular-nums px-1.5 whitespace-nowrap">
                                            {t("Page {page} of {total}", { page: safePage, total: totalPages })}
                                        </span>

                                        <button
                                            type="button"
                                            disabled={safePage >= totalPages}
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            aria-label={t("Next page")}
                                            className={cn(
                                                "inline-flex items-center justify-center gap-1 rounded-xl border border-border bg-muted/50 hover:bg-muted text-foreground text-xs font-bold transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
                                                isMobile ? "min-h-[44px] px-3.5" : "min-h-[38px] px-3"
                                            )}
                                        >
                                            <span>{t("Next")}</span>
                                            <ChevronRight className="size-4 shrink-0" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </section>
        </LazyMotion>
    );
}
