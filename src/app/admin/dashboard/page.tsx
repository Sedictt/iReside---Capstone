"use client";

import type { ElementType } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowRight,
    ArrowUpRight,
    BellRing,
    Building2,
    FileCheck,
    Home,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Users,
} from "lucide-react";

interface AdminStats {
    totalUsers: number;
    totalLandlords: number;
    totalTenants: number;
    activeLeases: number;
    totalProperties: number;
    pendingLandlordApplications: number;
    reviewingLandlordApplications: number;
}

interface ProductTourMetrics {
    funnel: {
        entered: number;
        completed: number;
        skipped: number;
        completionRatePercent: number;
    };
}

function formatPercent(value: number) {
    return `${Math.max(0, Math.round(value))}%`;
}

function StatTile({
    label,
    value,
    accent,
    meta,
    icon: Icon,
    loading,
}: {
    label: string;
    value: number;
    accent: string;
    meta: string;
    icon: ElementType;
    loading: boolean;
}) {
    return (
        <div className="group relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/85 p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20">
            <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(circle at top right, ${accent}20, transparent 58%)` }}
            />
            <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
                    {loading ? (
                        <div className="mt-4 h-10 w-24 animate-pulse rounded-xl bg-muted/50" />
                    ) : (
                        <p className="mt-4 text-4xl font-black tracking-tight text-foreground">{value}</p>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">{meta}</p>
                </div>
                <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
                    style={{ borderColor: `${accent}30`, background: `${accent}15`, color: accent }}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function MetricBar({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: string;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold text-foreground">{formatPercent(value)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted/70">
                <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: tone }}
                />
            </div>
        </div>
    );
}

function ActionLink({
    href,
    label,
    description,
    meta,
}: {
    href: string;
    label: string;
    description: string;
    meta: string;
}) {
    return (
        <Link
            href={href}
            className="group flex items-center justify-between gap-4 rounded-[1.5rem] border border-border/60 bg-background/60 px-4 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-background"
        >
            <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                    {meta}
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
        </Link>
    );
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [tourMetrics, setTourMetrics] = useState<ProductTourMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const load = async () => {
            try {
                const [statsResponse, tourResponse] = await Promise.all([
                    fetch("/api/admin/stats"),
                    fetch("/api/admin/product-tour/metrics"),
                ]);

                if (!active) return;

                if (statsResponse.ok) {
                    const statsPayload = await statsResponse.json();
                    if (active) setStats(statsPayload);
                }

                if (tourResponse.ok) {
                    const tourPayload = await tourResponse.json();
                    if (active) setTourMetrics(tourPayload);
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, []);

    const totalUsers = stats?.totalUsers ?? 0;
    const totalLandlords = stats?.totalLandlords ?? 0;
    const totalTenants = stats?.totalTenants ?? 0;
    const activeLeases = stats?.activeLeases ?? 0;
    const totalProperties = stats?.totalProperties ?? 0;
    const pendingApplications = stats?.pendingLandlordApplications ?? 0;
    const reviewingApplications = stats?.reviewingLandlordApplications ?? 0;
    const registrationQueue = pendingApplications + reviewingApplications;
    const completionRate = tourMetrics?.funnel.completionRatePercent ?? 0;
    const enteredTours = tourMetrics?.funnel.entered ?? 0;
    const completedTours = tourMetrics?.funnel.completed ?? 0;
    const skippedTours = tourMetrics?.funnel.skipped ?? 0;
    const tenantShare = totalUsers > 0 ? (totalTenants / totalUsers) * 100 : 0;
    const landlordShare = totalUsers > 0 ? (totalLandlords / totalUsers) * 100 : 0;
    const leaseCoverage = totalProperties > 0 ? (activeLeases / totalProperties) * 100 : 0;
    const reviewPressure = registrationQueue > 0 ? (reviewingApplications / registrationQueue) * 100 : 0;

    const statTiles = [
        {
            label: "Platform accounts",
            value: totalUsers,
            meta: `${totalTenants} tenants and ${totalLandlords} landlords`,
            icon: Users,
            accent: "#6d9838",
        },
        {
            label: "Registration queue",
            value: registrationQueue,
            meta: `${pendingApplications} pending and ${reviewingApplications} under review`,
            icon: FileCheck,
            accent: "#f59e0b",
        },
        {
            label: "Listed properties",
            value: totalProperties,
            meta: "Visible inventory on the platform",
            icon: Building2,
            accent: "#3b82f6",
        },
        {
            label: "Active leases",
            value: activeLeases,
            meta: "Current occupancy under contract",
            icon: Home,
            accent: "#22c55e",
        },
    ];

    const todayLabel = new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(new Date());

    return (
        <div className="min-h-screen bg-background px-6 py-6 text-foreground md:px-8 md:py-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.35)] backdrop-blur-xl md:p-8">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_right,rgba(109,152,56,0.24),transparent_58%)]" />
                    <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

                    <div className="relative z-10 grid gap-8 xl:grid-cols-[1.35fr_0.85fr]">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Admin command center
                            </div>

                            <div className="max-w-3xl space-y-3">
                                <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
                                    Govern registrations, platform access, and tenant activation from one workspace.
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                                    The admin dashboard is tuned for oversight, not day-to-day operations. Track queue pressure, watch adoption health, and move quickly on the decisions that keep iReside trustworthy.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    href="/admin/registrations"
                                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-primary-foreground shadow-[0_18px_30px_-18px_rgba(var(--primary-rgb),0.7)] transition-all hover:-translate-y-0.5 hover:bg-primary/90"
                                >
                                    Review registrations
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/admin/users"
                                    className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-background/70 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/20 hover:bg-background"
                                >
                                    Open user directory
                                </Link>
                                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-300">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Live on {todayLabel}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                            <div className="rounded-[1.75rem] border border-border/60 bg-background/55 p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Queue health</p>
                                        <p className="mt-2 text-3xl font-black tracking-tight text-foreground">{registrationQueue}</p>
                                    </div>
                                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-300">
                                        <FileCheck className="h-5 w-5" />
                                    </div>
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {pendingApplications} pending submissions and {reviewingApplications} applications already in assessment.
                                </p>
                                <div className="mt-4">
                                    <MetricBar label="In review" value={reviewPressure} tone="#f59e0b" />
                                </div>
                            </div>

                            <div className="rounded-[1.75rem] border border-border/60 bg-background/55 p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Tour completion</p>
                                        <p className="mt-2 text-3xl font-black tracking-tight text-foreground">{formatPercent(completionRate)}</p>
                                    </div>
                                    <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {completedTours} completed, {skippedTours} skipped, from {enteredTours} tenants who entered onboarding.
                                </p>
                                <div className="mt-4">
                                    <MetricBar label="Adoption progress" value={completionRate} tone="#6d9838" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {statTiles.map((tile) => (
                        <StatTile key={tile.label} loading={loading} {...tile} />
                    ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-[0_22px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur-sm">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Platform mix</p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">Who is inside the system right now</h2>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                                Occupancy coverage {formatPercent(leaseCoverage)}
                            </div>
                        </div>

                        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                            <div className="rounded-[1.75rem] border border-border/60 bg-background/55 p-5">
                                <div className="flex items-end justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Population balance</p>
                                        <p className="mt-1 text-sm text-muted-foreground">Role distribution across tenant and landlord portals.</p>
                                    </div>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </div>

                                <div className="mt-6 space-y-5">
                                    <MetricBar label="Tenant share" value={tenantShare} tone="#6d9838" />
                                    <MetricBar label="Landlord share" value={landlordShare} tone="#3b82f6" />
                                    <MetricBar label="Property lease coverage" value={leaseCoverage} tone="#22c55e" />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-[1.75rem] border border-border/60 bg-background/55 p-5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Tenants</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{totalTenants}</p>
                                    <p className="mt-2 text-sm text-muted-foreground">Residents using payments, messaging, and lease services.</p>
                                </div>
                                <div className="rounded-[1.75rem] border border-border/60 bg-background/55 p-5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Landlords</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{totalLandlords}</p>
                                    <p className="mt-2 text-sm text-muted-foreground">Property operators with listing and lease management access.</p>
                                </div>
                                <div className="rounded-[1.75rem] border border-border/60 bg-background/55 p-5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Properties</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{totalProperties}</p>
                                    <p className="mt-2 text-sm text-muted-foreground">Inventory actively tracked by the platform.</p>
                                </div>
                                <div className="rounded-[1.75rem] border border-border/60 bg-background/55 p-5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Active leases</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{activeLeases}</p>
                                    <p className="mt-2 text-sm text-muted-foreground">Contracts currently powering live tenant occupancy.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-[0_22px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Adoption oversight</p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">Nudge stalled tenants forward</h2>
                            </div>
                            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                                <BellRing className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                            <div className="rounded-[1.5rem] border border-border/60 bg-background/60 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Entered</p>
                                <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{enteredTours}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-border/60 bg-background/60 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Completed</p>
                                <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{completedTours}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-border/60 bg-background/60 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Skipped</p>
                                <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{skippedTours}</p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-[1.75rem] border border-primary/15 bg-primary/[0.07] p-5">
                            <p className="text-sm font-semibold text-foreground">Adoption watch</p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                Monitor tenants who entered the guided product tour but did not complete it, then coordinate any follow-up manually while registration approvals continue through the admin review lane.
                            </p>
                            <div className="mt-5 rounded-2xl border border-border/60 bg-background/70 px-4 py-4 text-sm text-muted-foreground">
                                {enteredTours > completedTours
                                    ? `${enteredTours - completedTours} tenants still need help reaching the end of the tour experience.`
                                    : "No stalled tour journeys are currently visible from the available metrics."}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-[0_22px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur-sm">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Governance lanes</p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">What this admin space is built to control</h2>
                            </div>
                            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
                                Oversight only
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <ActionLink
                                href="/admin/registrations"
                                label="Registration authority"
                                description="Inspect landlord applications, validate proofs, and move qualified applicants from submission into review and approval."
                                meta={`${registrationQueue} queued`}
                            />
                            <ActionLink
                                href="/admin/users"
                                label="User governance"
                                description="Review total platform accounts, compare role distribution, and understand who has access across tenant, landlord, and admin surfaces."
                                meta={`${totalUsers} accounts`}
                            />
                            <ActionLink
                                href="/admin/dashboard"
                                label="Adoption oversight"
                                description="Monitor onboarding conversion and use reminder tooling when guided setup stalls before tenant activation."
                                meta={`${completedTours} completed`}
                            />
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-[0_22px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Quick actions</p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">Move into the next task fast</h2>

                        <div className="mt-6 grid gap-4">
                            <Link
                                href="/admin/registrations"
                                className="group rounded-[1.75rem] border border-border/60 bg-background/55 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-background"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Review registrations</p>
                                        <p className="mt-1 text-sm text-muted-foreground">Triage new landlord access requests and keep queue time low.</p>
                                    </div>
                                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-300">
                                        <FileCheck className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="mt-5 flex items-center justify-between">
                                    <span className="text-2xl font-black tracking-tight text-foreground">{registrationQueue}</span>
                                    <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-primary">
                                        Open queue
                                        <ArrowUpRight className="h-4 w-4" />
                                    </span>
                                </div>
                            </Link>

                            <Link
                                href="/admin/users"
                                className="group rounded-[1.75rem] border border-border/60 bg-background/55 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-background"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Manage users</p>
                                        <p className="mt-1 text-sm text-muted-foreground">Inspect accounts, compare role distribution, and check access scope.</p>
                                    </div>
                                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-300">
                                        <Users className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="mt-5 flex items-center justify-between">
                                    <span className="text-2xl font-black tracking-tight text-foreground">{totalUsers}</span>
                                    <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-primary">
                                        Open directory
                                        <ArrowUpRight className="h-4 w-4" />
                                    </span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
