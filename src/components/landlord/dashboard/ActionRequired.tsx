"use client";

import { useEffect, useMemo, useReducer } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    ArrowRight,
    ClipboardCheck,
    MessageSquareMore,
    ShieldCheck,
    Wrench,
    Clock,
    Activity
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/lib/messages/client";
import { useProperty } from "@/context/PropertyContext";

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

type ActionItem = {
    id: string;
    title: string;
    detail: string;
    meta: string;
    href: string;
    cta: string;
    tone: "critical" | "high" | "medium";
    kind: "maintenance" | "lease" | "onboarding" | "message";
};

type ActionSummary = {
    label: string;
    value: number;
    icon: LucideIcon;
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

const onboardingStatusLabel: Record<TenantItem["onboardingStatus"], string> = {
    pending: "Pending Approval",
    in_progress: "In Progress",
    completed: "Verified",
    not_started: "Kickstart Needed",
};

const formatDateLabel = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

// --- Sub-components ---

function ActionSummaryBar({ summaries }: { summaries: ActionSummary[] }) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-1 pr-1 sm:justify-end">
            {summaries.map((summary) => (
                <div 
                    key={summary.label} 
                    className="group flex shrink-0 items-center gap-2 rounded-xl neumorphic-extruded px-3 py-1.5 text-[10px] sm:text-[11px] font-black transition-all hover:scale-[1.02] whitespace-nowrap"
                >
                    <summary.icon className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-muted-foreground">{summary.label}:</span>
                    <span className="text-foreground font-black">{summary.value}</span>
                </div>
            ))}
        </div>
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
                                {action.tone}
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

    const { actions, summaries } = useMemo(() => {
        if (!state.mounted) return { actions: [], summaries: [] };

        const nextActions: ActionItem[] = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        state.maintenance
            .filter((request) => request.status !== "Resolved")
            .slice(0, 3)
            .forEach((request) => {
                nextActions.push({
                    id: `maintenance-${request.id}`,
                    title: request.priority === "Critical" ? "Critical Repair Required" : "Maintenance Feedback Loop",
                    detail: `${request.tenant}: ${request.title} at ${request.property}`,
                    meta: `Reported ${formatDateLabel(request.reportedAt)}`,
                    href: `/landlord/maintenance?id=${request.id}`,
                    cta: "Dispatch Tech",
                    tone: request.priority === "Critical" ? "critical" : request.priority === "High" ? "high" : "medium",
                    kind: "maintenance",
                });
            });

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
            .slice(0, 2)
            .forEach(({ tenant, daysUntil }) => {
                nextActions.push({
                    id: `lease-${tenant.id}`,
                    title: daysUntil <= 7 ? "Urgent Lease Expiry" : "Lease Renewal Window",
                    detail: `${tenant.name} in ${tenant.unit} (${tenant.property})`,
                    meta: daysUntil <= 0 ? "Expired today" : `${daysUntil} days remaining`,
                    href: `/landlord/tenants?tab=renewals&tenantId=${tenant.id}`,
                    cta: "Send Renewal",
                    tone: daysUntil <= 7 ? "high" : "medium",
                    kind: "lease",
                });
            });

        state.applications
            .filter((app) => app.status === "pending" || app.status === "reviewing")
            .slice(0, 2)
            .forEach((app) => {
                nextActions.push({
                    id: `application-${app.id}`,
                    title: "Pending Applicant Verification",
                    detail: `${app.applicant.name}: Application for ${app.unitNumber} (${app.propertyName})`,
                    meta: "Document Review",
                    href: `/landlord/applications?id=${app.id}`,
                    cta: "Verify Docs",
                    tone: "high",
                    kind: "onboarding",
                });
            });

        state.tenants
            .filter((tenant) => tenant.onboardingStatus !== "completed")
            .slice(0, 2)
            .forEach((tenant) => {
                const isPendingReview = tenant.onboardingStatus === "pending";
                const isNotStarted = tenant.onboardingStatus === "not_started";

                nextActions.push({
                    id: `onboarding-${tenant.id}`,
                    title: isPendingReview
                        ? "Pending Resident Verification"
                        : isNotStarted
                        ? "Resident Setup Pending"
                        : "Resident Onboarding In Progress",
                    detail: isNotStarted
                        ? `${tenant.name} (${tenant.unit}): Move-in setup has not been started.`
                        : isPendingReview
                        ? `${tenant.name} (${tenant.unit}): Onboarding details submitted for review.`
                        : `${tenant.name} (${tenant.unit}): Move-in onboarding currently in progress.`,
                    meta: isPendingReview ? "Pending Approval" : isNotStarted ? "Onboarding Needed" : "In Progress",
                    href: `/landlord/tenants?view=profile&tenantId=${tenant.id}&search=${encodeURIComponent(tenant.name)}`,
                    cta: isPendingReview ? "Review Resident" : "View Resident",
                    tone: isNotStarted || isPendingReview ? "high" : "medium",
                    kind: "onboarding",
                });
            });

        state.conversations
            .filter((conversation) => conversation.unreadCount > 0)
            .slice(0, 2)
            .forEach((conversation) => {
                const other = conversation.otherParticipants[0];
                nextActions.push({
                    id: `message-${conversation.id}`,
                    title: "Incoming Inquiries",
                    detail: `${other?.fullName ?? "Resident"}: "${conversation.lastMessage?.content?.slice(0, 40)}..."`,
                    meta: `${conversation.unreadCount} unread responses`,
                    href: `/landlord/messages?conversation=${conversation.id}`,
                    cta: "Enter Chat",
                    tone: "medium",
                    kind: "message",
                });
            });

        const sorted = nextActions
            .sort((left, right) => {
                const weight = { critical: 3, high: 2, medium: 1 };
                return weight[right.tone] - weight[left.tone];
            })
            .slice(0, 6);

        const pendingApplicationsCount = state.applications.filter(
            (app) => app.status === "pending" || app.status === "reviewing"
        ).length;
        const incompleteTenantsCount = state.tenants.filter(
            (tenant) => tenant.onboardingStatus !== "completed"
        ).length;

        const summaryItems: ActionSummary[] = [
            {
                label: "Maintenance",
                value: state.maintenance.filter((request) => request.status !== "Resolved").length,
                icon: Activity
            },
            {
                label: "Unread Messages",
                value: state.conversations.filter((conversation) => conversation.unreadCount > 0).length,
                icon: MessageSquareMore
            },
            {
                label: "Move-In Tasks",
                value: incompleteTenantsCount + pendingApplicationsCount,
                icon: Clock
            },
        ];

        return { actions: sorted, summaries: summaryItems };
    }, [state.conversations, state.maintenance, state.tenants, state.applications, state.mounted]);

    return (
        <LazyMotion features={domAnimation}>
            <section className="rounded-[2.5rem] neumorphic-panel p-4 sm:p-6 md:p-8">
                <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-12 sm:size-14 items-center justify-center rounded-[1rem] sm:rounded-[1.25rem] neumorphic-extruded text-primary shrink-0">
                            <Activity className="size-5 sm:size-7" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-foreground">Needs Your Attention</h2>
                            <p className="hidden sm:block text-sm font-medium text-muted-foreground/80">
                                Things to follow up now: maintenance, lease renewals, and tenant messages.
                            </p>
                        </div>
                    </div>

                    <ActionSummaryBar summaries={summaries} />
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
                    ) : actions.length === 0 ? (
                        <ActionEmptyState />
                    ) : (
                        <div className="grid gap-4">
                            {actions.map((action) => (
                                <ActionItemCard key={action.id} action={action} />
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </section>
        </LazyMotion>
    );
}
