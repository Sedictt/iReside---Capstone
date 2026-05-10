"use client";

import { useEffect, useMemo, useState } from "react";
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
                    className="group flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-card/70 px-4 py-2 text-xs font-bold transition-all hover:bg-card"
                >
                    <summary.icon className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-muted-foreground">{summary.label}:</span>
                    <span className="text-foreground">{summary.value}</span>
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
            className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-card/70 p-5 transition-all hover:bg-card"
        >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between relative z-10">
                <div className="flex items-start gap-4">
                    <div className={cn(
                        "flex size-12 items-center justify-center rounded-2xl border transition-transform group-hover:scale-110", 
                        toneClasses[action.tone]
                    )}>
                        <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="mb-1.5 flex flex-wrap items-center gap-3">
                            <h3 className="text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                                {action.title}
                            </h3>
                            <span className={cn(
                                "rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest", 
                                toneClasses[action.tone]
                            )}>
                                {action.tone}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                            {action.detail}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                            <Clock className="size-3" />
                            {action.meta}
                        </div>
                    </div>
                </div>

                <Link
                    href={action.href}
                    className="group/btn inline-flex items-center gap-3 self-start rounded-xl bg-foreground px-6 py-3 text-sm font-semibold tracking-tight text-background transition-all hover:brightness-110 active:scale-95 sm:self-center"
                >
                    {action.cta}
                    <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
            </div>
            {/* Subtle decorative streak */}
            <div className={cn(
                "absolute bottom-0 left-6 right-6 h-[2px] opacity-0 transition-opacity group-hover:opacity-30", 
                toneClasses[action.tone]
            )} />
        </m.div>
    );
}

function ActionEmptyState() {
    return (
        <m.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[2.5rem] border border-dashed border-white/10 bg-card/70 p-12 text-center backdrop-blur-sm"
        >
            <div className="mb-6 inline-flex size-20 items-center justify-center rounded-[1.5rem] border border-primary/20 bg-primary/12 text-primary">
                <ShieldCheck className="size-10" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">All Caught Up</h3>
            <p className="mt-2 text-sm font-medium text-muted-foreground max-w-sm mx-auto">
                No urgent tasks right now. Everything that needs action is already handled.
            </p>
        </m.div>
    );
}

// --- Main Component ---

export function ActionRequired() {
    const { selectedPropertyId } = useProperty();
    const [maintenance, setMaintenance] = useState<MaintenanceRequestItem[]>([]);
    const [tenants, setTenants] = useState<TenantItem[]>([]);
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const loadDashboardActions = async () => {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({ propertyId: selectedPropertyId });
                const [maintenanceRes, tenantsRes, conversationsRes] = await Promise.all([
                    fetch(`/api/landlord/maintenance?${params.toString()}`, { signal: controller.signal }),
                    fetch(`/api/landlord/tenants?${params.toString()}`, { signal: controller.signal }),
                    fetch("/api/messages/conversations", { signal: controller.signal, cache: "no-store" }),
                ]);

                const [maintenancePayload, tenantsPayload, conversationsPayload] = await Promise.all([
                    maintenanceRes.json().catch(() => ({})),
                    tenantsRes.json().catch(() => ({})),
                    conversationsRes.json().catch(() => ({})),
                ]);

                if (!maintenanceRes.ok || !tenantsRes.ok || !conversationsRes.ok) {
                    throw new Error("Failed to load action items");
                }

                setMaintenance(
                    Array.isArray((maintenancePayload as { requests?: MaintenanceRequestItem[] }).requests)
                        ? (maintenancePayload as { requests: MaintenanceRequestItem[] }).requests
                        : []
                );
                setTenants(
                    Array.isArray((tenantsPayload as { tenants?: TenantItem[] }).tenants)
                        ? (tenantsPayload as { tenants: TenantItem[] }).tenants
                        : []
                );
                setConversations(
                    Array.isArray((conversationsPayload as { conversations?: ConversationSummary[] }).conversations)
                        ? (conversationsPayload as { conversations: ConversationSummary[] }).conversations
                        : []
                );
            } catch (loadError) {
                if ((loadError as Error).name === "AbortError") {
                    return;
                }
                setError("Unable to load action items right now.");
            } finally {
                setLoading(false);
            }
        };

        void loadDashboardActions();

        return () => {
            controller.abort();
        };
    }, [selectedPropertyId]);

    const { actions, summaries } = useMemo(() => {
        if (!mounted) return { actions: [], summaries: [] };

        const nextActions: ActionItem[] = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        maintenance
            .filter((request) => request.status !== "Resolved")
            .slice(0, 3)
            .forEach((request) => {
                nextActions.push({
                    id: `maintenance-${request.id}`,
                    title: request.priority === "Critical" ? "Critical Repair Required" : "Maintenance Feedback Loop",
                    detail: `${request.tenant}: ${request.title} at ${request.property}`,
                    meta: `Reported ${formatDateLabel(request.reportedAt)}`,
                    href: "/landlord/maintenance",
                    cta: "Dispatch Tech",
                    tone: request.priority === "Critical" ? "critical" : request.priority === "High" ? "high" : "medium",
                    kind: "maintenance",
                });
            });

        tenants
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
                    href: "/landlord/tenants",
                    cta: "Send Renewal",
                    tone: daysUntil <= 7 ? "high" : "medium",
                    kind: "lease",
                });
            });

        tenants
            .filter((tenant) => tenant.onboardingStatus !== "completed")
            .slice(0, 2)
            .forEach((tenant) => {
                nextActions.push({
                    id: `onboarding-${tenant.id}`,
                    title: "Pending Resident Verification",
                    detail: `${tenant.name} is stuck at ${onboardingStatusLabel[tenant.onboardingStatus]} stage.`,
                    meta: "Onboarding Bottleneck",
                    href: "/landlord/tenants",
                    cta: "Verify Docs",
                    tone: tenant.onboardingStatus === "in_progress" ? "medium" : "high",
                    kind: "onboarding",
                });
            });

        conversations
            .filter((conversation) => conversation.unreadCount > 0)
            .slice(0, 2)
            .forEach((conversation) => {
                const other = conversation.otherParticipants[0];
                nextActions.push({
                    id: `message-${conversation.id}`,
                    title: "Incoming Inquiries",
                    detail: `${other?.fullName ?? "Resident"}: "${conversation.lastMessage?.content?.slice(0, 40)}..."`,
                    meta: `${conversation.unreadCount} unread responses`,
                    href: "/landlord/messages",
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

        const summaryItems: ActionSummary[] = [
            {
                label: "Maintenance",
                value: maintenance.filter((request) => request.status !== "Resolved").length,
                icon: Activity
            },
            {
                label: "Unread Messages",
                value: conversations.filter((conversation) => conversation.unreadCount > 0).length,
                icon: MessageSquareMore
            },
            {
                label: "Move-In Tasks",
                value: tenants.filter((tenant) => tenant.onboardingStatus !== "completed").length,
                icon: Clock
            },
        ];

        return { actions: sorted, summaries: summaryItems };
    }, [conversations, maintenance, tenants, mounted]);

    return (
        <LazyMotion features={domAnimation}>
            <section className="rounded-[2.5rem] border border-white/10 bg-card/60 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
                <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex size-14 items-center justify-center rounded-[1.25rem] border border-indigo-500/20 bg-indigo-500/12 text-indigo-300">
                            <Activity className="size-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Needs Your Attention</h2>
                            <p className="text-sm font-medium text-muted-foreground/80">
                                Things to follow up now: maintenance, lease renewals, and tenant messages.
                            </p>
                        </div>
                    </div>

                    <ActionSummaryBar summaries={summaries} />
                </div>

                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="grid gap-4">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="animate-pulse rounded-[1.5rem] border border-white/10 bg-card/70 p-6">
                                    <div className="flex gap-4">
                                        <div className="size-12 rounded-xl bg-muted/40" />
                                        <div className="flex-1 space-y-3">
                                            <div className="h-4 w-1/4 rounded bg-muted/40" />
                                            <div className="size-3/4 rounded bg-muted/40" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <m.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 text-center"
                        >
                            <p className="text-sm font-bold text-red-500">{error}</p>
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
