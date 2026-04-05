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
} from "lucide-react";
import type { ConversationSummary } from "@/lib/messages/client";

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
};

const toneClasses: Record<ActionItem["tone"], string> = {
    critical: "border-red-500/20 bg-red-500/8 text-red-600 dark:text-red-300",
    high: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    medium: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
};

const kindIcon = {
    maintenance: Wrench,
    lease: AlertTriangle,
    onboarding: ClipboardCheck,
    message: MessageSquareMore,
} satisfies Record<ActionItem["kind"], typeof Wrench>;

const statusLabel: Record<TenantItem["onboardingStatus"], string> = {
    pending: "Pending",
    in_progress: "In progress",
    completed: "Completed",
    not_started: "Not started",
};

const formatDateLabel = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });

const getDaysUntil = (iso: string) => {
    const target = new Date(iso);
    if (Number.isNaN(target.getTime())) {
        return Number.POSITIVE_INFINITY;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export function ActionRequired() {
    const [maintenance, setMaintenance] = useState<MaintenanceRequestItem[]>([]);
    const [tenants, setTenants] = useState<TenantItem[]>([]);
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const loadDashboardActions = async () => {
            setLoading(true);
            setError(null);

            try {
                const [maintenanceRes, tenantsRes, conversationsRes] = await Promise.all([
                    fetch("/api/landlord/maintenance", { signal: controller.signal }),
                    fetch("/api/landlord/tenants", { signal: controller.signal }),
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
    }, []);

    const { actions, summaries } = useMemo(() => {
        const nextActions: ActionItem[] = [];

        maintenance
            .filter((request) => request.status !== "Resolved")
            .slice(0, 3)
            .forEach((request) => {
                nextActions.push({
                    id: `maintenance-${request.id}`,
                    title: request.priority === "Critical" ? "Critical maintenance request" : "Maintenance request awaiting action",
                    detail: `${request.tenant} reported ${request.title} in ${request.property} • ${request.unit}`,
                    meta: request.reportedAt,
                    href: "/landlord/maintenance",
                    cta: "Review request",
                    tone: request.priority === "Critical" ? "critical" : request.priority === "High" ? "high" : "medium",
                    kind: "maintenance",
                });
            });

        tenants
            .filter((tenant) => tenant.leaseEnd)
            .map((tenant) => ({ tenant, daysUntil: getDaysUntil(tenant.leaseEnd as string) }))
            .filter(({ daysUntil }) => daysUntil <= 30)
            .sort((left, right) => left.daysUntil - right.daysUntil)
            .slice(0, 2)
            .forEach(({ tenant, daysUntil }) => {
                nextActions.push({
                    id: `lease-${tenant.id}`,
                    title: daysUntil <= 7 ? "Lease ending this week" : "Lease renewal coming up",
                    detail: `${tenant.name} in ${tenant.property} • ${tenant.unit}`,
                    meta: `${daysUntil <= 0 ? "Ends today" : `${daysUntil} day${daysUntil === 1 ? "" : "s"} left`} • ${formatDateLabel(tenant.leaseEnd as string)}`,
                    href: "/landlord/tenants",
                    cta: "Open tenant",
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
                    title: "Tenant onboarding incomplete",
                    detail: `${tenant.name} still needs onboarding attention for ${tenant.unit}`,
                    meta: statusLabel[tenant.onboardingStatus],
                    href: "/landlord/tenants",
                    cta: "Follow up",
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
                    title: "Unread tenant message",
                    detail: `${other?.fullName ?? "Conversation"}: ${conversation.lastMessage?.content ?? "New message"}`,
                    meta: `${conversation.unreadCount} unread`,
                    href: "/landlord/messages",
                    cta: "Reply",
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
            },
            {
                label: "Unread Messages",
                value: conversations.filter((conversation) => conversation.unreadCount > 0).length,
            },
            {
                label: "Onboarding",
                value: tenants.filter((tenant) => tenant.onboardingStatus !== "completed").length,
            },
        ];

        return { actions: sorted, summaries: summaryItems };
    }, [conversations, maintenance, tenants]);

    return (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Action Required</h2>
                        <p className="text-sm text-muted-foreground">
                            Prioritized landlord tasks from operations, leases, onboarding, and messages.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {summaries.map((summary) => (
                        <div key={summary.label} className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                            {summary.label}: <span className="text-foreground">{summary.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="grid gap-3">
                    {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="animate-pulse rounded-2xl border border-border bg-muted/30 p-4">
                            <div className="mb-3 h-4 w-40 rounded bg-muted" />
                            <div className="mb-2 h-3 w-full rounded bg-muted/80" />
                            <div className="h-3 w-32 rounded bg-muted/80" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                </div>
            ) : actions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">You’re all caught up</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        No urgent landlord actions are waiting right now.
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {actions.map((action) => {
                        const Icon = kindIcon[action.kind];

                        return (
                            <div key={action.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-background/70 p-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <div className={`rounded-xl border p-2.5 ${toneClasses[action.tone]}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="mb-1 flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm font-bold text-foreground">{action.title}</h3>
                                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${toneClasses[action.tone]}`}>
                                                {action.tone}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{action.detail}</p>
                                        <p className="mt-1 text-xs font-medium text-muted-foreground">{action.meta}</p>
                                    </div>
                                </div>

                                <Link
                                    href={action.href}
                                    className="inline-flex items-center gap-2 self-start rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:self-center"
                                >
                                    {action.cta}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
