"use client";

import type { ElementType } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowRight,
    BellRing,
    Building2,
    FileCheck,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    return Math.max(0, Math.round(value)) + "%";
}

function StatTile({
    label,
    value,
    accentColorClass,
    icon: Icon,
    loading,
}: {
    label: string;
    value: number;
    accentColorClass: string;
    icon: ElementType;
    loading: boolean;
}) {
    return (
        <div className="group relative overflow-hidden rounded-[2rem] border border-border/70 bg-card p-6 transition-all duration-300 ease-out hover:border-border hover:bg-muted/20">
            
            <div className="relative z-10 flex flex-col h-full gap-6">
                <div className="flex items-start justify-between">
                    <div className={cn("flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] shadow-inner", accentColorClass)}>
                        <Icon className="size-6" strokeWidth={1.5} />
                    </div>
                </div>
                <div>
                    {loading ? (
                        <div className="h-12 w-24 animate-pulse rounded-xl bg-white/5" />
                    ) : (
                        <p className="text-4xl font-semibold tracking-tight text-white">{value}</p>
                    )}
                    <p className="mt-2 text-[12px] font-bold uppercase tracking-widest text-white/40">{label}</p>
                </div>
            </div>
        </div>
    );
}

function MetricBar({
    label,
    value,
    colorClass,
}: {
    label: string;
    value: number;
    colorClass: string;
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold tracking-wide text-white/60">{label}</span>
                <span className="text-sm font-bold text-white">{formatPercent(value)}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/40 shadow-inner">
                <div
                    className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(0,0,0,0.5)]", colorClass)}
                    style={{ width: Math.min(100, Math.max(0, value)) + "%" }}
                />
            </div>
        </div>
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

    const todayLabel = new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(new Date());

    return (
        <div className="flex flex-col gap-8 pb-12">
            {/* Command Center Hero */}
            <section className="relative overflow-hidden rounded-[2.5rem] border border-border/70 bg-card p-8 md:p-12">

                <div className="relative z-10 flex flex-col justify-between gap-12 lg:flex-row lg:items-center">
                    <div className="max-w-2xl space-y-6">
                        <div className="inline-flex items-center gap-3 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-primary">
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex size-2 rounded-full bg-primary"></span>
                            </span>
                            Live Infrastructure
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl lg:leading-[1.1]">
                                System Overview & Governance
                            </h1>
                            <p className="text-base font-medium leading-relaxed text-white/50">
                                Monitor platform health, manage registration queues, and review system metrics across the iReside ecosystem. Designed for rapid oversight and frictionless decisions.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <Link
                                href="/admin/registrations"
                                className="group relative flex h-14 items-center justify-center overflow-hidden rounded-2xl bg-white px-8 font-bold text-black transition-all hover:bg-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Assess Queue
                                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                </span>
                            </Link>
                            <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-4 shadow-inner">
                                <span className="text-sm font-semibold text-white/40">{todayLabel}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid w-full shrink-0 gap-4 sm:grid-cols-2 lg:w-auto lg:min-w-[400px] lg:grid-cols-1">
                        <div className="group relative overflow-hidden rounded-[2rem] border border-primary/20 bg-primary/10 p-6 transition-colors hover:bg-primary/15">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/20">Registration Load</p>
                                    <p className="mt-2 text-4xl font-semibold tracking-tight text-white">{registrationQueue}</p>
                                </div>
                                <div className="rounded-2xl border border-primary/20 bg-primary/20 p-4 text-primary">
                                    <FileCheck className="size-6" strokeWidth={2} />
                                </div>
                            </div>
                            <div className="mt-5">
                                <MetricBar label="In Review" value={reviewPressure} colorClass="bg-gradient-to-r from-primary to-primary" />
                            </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-[2rem] border border-primary/20 bg-primary/10 p-6 transition-colors hover:bg-primary/15">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/20">System Adoption</p>
                                    <p className="mt-2 text-4xl font-semibold tracking-tight text-white">{formatPercent(completionRate)}</p>
                                </div>
                                <div className="rounded-2xl border border-primary/20 bg-primary/20 p-4 text-primary">
                                    <Sparkles className="size-6" strokeWidth={2} />
                                </div>
                            </div>
                            <div className="mt-5">
                                <MetricBar label="Tour Completion" value={completionRate} colorClass="bg-gradient-to-r from-primary to-primary" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Metrics Grid - Hick''s Law Grouping */}
            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile
                    label="Active Users"
                    value={totalUsers}
                    icon={Users}
                    accentColorClass="text-blue-400"
                    loading={loading}
                />
                <StatTile
                    label="Total Tenants"
                    value={totalTenants}
                    icon={Users}
                    accentColorClass="text-primary"
                    loading={loading}
                />
                <StatTile
                    label="Landlords"
                    value={totalLandlords}
                    icon={ShieldCheck}
                    accentColorClass="text-amber-400"
                    loading={loading}
                />
                <StatTile
                    label="Properties"
                    value={totalProperties}
                    icon={Building2}
                    accentColorClass="text-purple-400"
                    loading={loading}
                />
            </section>

            {/* Dimensional Data & Quick Actions */}
            <section className="grid gap-6 xl:grid-cols-3">
                
                {/* Platform Balance */}
                <div className="xl:col-span-2 flex flex-col overflow-hidden rounded-[2.5rem] border border-border/70 bg-card p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">Demographics</p>
                            <h2 className="mt-2 text-2xl font-semibold text-white">Platform Balance</h2>
                        </div>
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-white/[0.03] text-white/40">
                            <TrendingUp className="size-6" />
                        </div>
                    </div>

                    <div className="flex-1 rounded-[2rem] border border-border/70 bg-background p-8">
                        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
                            <div className="space-y-8 flex flex-col justify-center">
                                <MetricBar label="Tenant Saturation" value={tenantShare} colorClass="bg-primary" />
                                <MetricBar label="Landlord Footprint" value={landlordShare} colorClass="bg-amber-500" />
                                <MetricBar label="Property Lease Coverage" value={leaseCoverage} colorClass="bg-purple-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-[1.5rem] bg-muted/30 p-5 border border-border/70">
                                    <p className="text-3xl font-semibold text-primary">{totalTenants}</p>
                                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Tenants</p>
                                </div>
                                <div className="rounded-[1.5rem] bg-muted/30 p-5 border border-border/70">
                                    <p className="text-3xl font-semibold text-amber-400">{totalLandlords}</p>
                                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Landlords</p>
                                </div>
                                <div className="rounded-[1.5rem] bg-muted/30 p-5 border border-border/70">
                                    <p className="text-3xl font-semibold text-purple-400">{totalProperties}</p>
                                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Properties</p>
                                </div>
                                <div className="rounded-[1.5rem] bg-muted/30 p-5 border border-border/70">
                                    <p className="text-3xl font-semibold text-primary">{activeLeases}</p>
                                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Leases</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Onboarding Funnel (Fitts Law Target Optimization) */}
                <div className="flex flex-col overflow-hidden rounded-[2.5rem] border border-border/70 bg-card p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">Analytics</p>
                            <h2 className="mt-2 text-2xl font-semibold text-white">Tour Funnel</h2>
                        </div>
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground">
                            <BellRing className="size-6" />
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-4">
                        <div className="flex flex-1 items-center justify-between rounded-[1.5rem] border border-border/70 bg-muted/30 p-6 transition-colors hover:bg-muted/40">
                            <div>
                                <p className="text-sm font-bold text-white/50">Entered</p>
                                <p className="text-xs font-semibold text-white/30 mt-1">Total initiated</p>
                            </div>
                            <span className="text-3xl font-semibold text-white">{enteredTours}</span>
                        </div>
                        <div className="flex flex-1 items-center justify-between rounded-[1.5rem] border border-primary/20 bg-primary/20 p-6 transition-colors hover:bg-primary/20">
                            <div>
                                <p className="text-sm font-bold text-primary/20">Completed</p>
                                <p className="text-xs font-semibold text-primary/20 mt-1">Finished journey</p>
                            </div>
                            <span className="text-3xl font-semibold text-primary">{completedTours}</span>
                        </div>
                        <div className="flex flex-1 items-center justify-between rounded-[1.5rem] border border-primary/20 bg-primary/20 p-6 transition-colors hover:bg-primary/20">
                            <div>
                                <p className="text-sm font-bold text-primary/20">Abandoned</p>
                                <p className="text-xs font-semibold text-primary/20 mt-1">Skipped/Dropped</p>
                            </div>
                            <span className="text-3xl font-semibold text-primary">{skippedTours}</span>
                        </div>
                    </div>
                </div>

            </section>
        </div>
    );
}

