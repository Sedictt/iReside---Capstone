"use client";

import { useEffect, useState } from "react";
import {
    ClipboardList, Users, Home, Building2,
    TrendingUp, UserCheck, UserX, Clock,
    ArrowUpRight, ShieldCheck,
} from "lucide-react";

interface AdminStats {
    totalUsers: number;
    totalLandlords: number;
    totalTenants: number;
    totalRegistrations: number;
    pendingRegistrations: number;
    reviewingRegistrations: number;
    approvedRegistrations: number;
    activeLeases: number;
    totalProperties: number;
}

function StatCard({
    label,
    value,
    icon: Icon,
    accent,
    sub,
    loading,
}: {
    label: string;
    value: number | undefined;
    icon: React.ElementType;
    accent: string;
    sub?: string;
    loading: boolean;
}) {
    return (
        <div className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-0.5 group"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            {/* Subtle glow on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                style={{ background: `radial-gradient(ellipse at top left, ${accent}08 0%, transparent 60%)` }} />

            <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
                    <Icon className="h-5 w-5" style={{ color: accent }} />
                </div>
                <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                    style={{ background: `${accent}10`, color: accent }}>
                    <ArrowUpRight className="h-3 w-3" />
                    <span>Live</span>
                </div>
            </div>

            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 mb-1.5">{label}</p>
                {loading ? (
                    <div className="h-9 w-20 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
                ) : (
                    <p className="text-4xl font-black text-white tracking-tight leading-none">
                        {value ?? 0}
                    </p>
                )}
                {sub && <p className="text-xs text-neutral-600 mt-1.5">{sub}</p>}
            </div>
        </div>
    );
}

function RegistrationBreakdown({ stats, loading }: { stats: AdminStats | null; loading: boolean }) {
    const items = [
        { label: "Pending", value: stats?.pendingRegistrations ?? 0, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
        { label: "Reviewing", value: stats?.reviewingRegistrations ?? 0, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
        { label: "Approved", value: stats?.approvedRegistrations ?? 0, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    ];
    const total = stats?.totalRegistrations ?? 0;

    return (
        <div className="rounded-2xl p-5 flex flex-col gap-5"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-white">Registration Pipeline</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Landlord application breakdown</p>
                </div>
                <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(225,29,72,0.12)", border: "1px solid rgba(225,29,72,0.2)" }}>
                    <ClipboardList className="h-4 w-4 text-rose-400" />
                </div>
            </div>

            {/* Progress bar */}
            {!loading && total > 0 && (
                <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                    {items.map((item) => (
                        <div key={item.label}
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${(item.value / total) * 100}%`, background: item.color }} />
                    ))}
                </div>
            )}
            {(loading || total === 0) && (
                <div className="h-2 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
            )}

            <div className="grid grid-cols-3 gap-3">
                {items.map((item) => (
                    <div key={item.label} className="rounded-xl p-3 text-center"
                        style={{ background: item.bg, border: `1px solid ${item.color}20` }}>
                        {loading ? (
                            <div className="h-6 w-8 mx-auto rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
                        ) : (
                            <p className="text-xl font-bold" style={{ color: item.color }}>{item.value}</p>
                        )}
                        <p className="text-[11px] text-neutral-500 mt-0.5 font-medium">{item.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function UserBreakdown({ stats, loading }: { stats: AdminStats | null; loading: boolean }) {
    const items = [
        { label: "Tenants", value: stats?.totalTenants ?? 0, icon: UserX, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
        { label: "Landlords", value: stats?.totalLandlords ?? 0, icon: UserCheck, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    ];

    return (
        <div className="rounded-2xl p-5 flex flex-col gap-5"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-white">User Breakdown</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Tenants vs landlords</p>
                </div>
                <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
                    <Users className="h-4 w-4 text-blue-400" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {items.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.label} className="rounded-xl p-4 flex flex-col gap-2"
                            style={{ background: item.bg, border: `1px solid ${item.color}20` }}>
                            <Icon className="h-4 w-4" style={{ color: item.color }} />
                            {loading ? (
                                <div className="h-7 w-12 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
                            ) : (
                                <p className="text-2xl font-black" style={{ color: item.color }}>{item.value}</p>
                            )}
                            <p className="text-xs text-neutral-500 font-medium">{item.label}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/stats")
            .then((r) => r.ok ? r.json() : null)
            .then((data) => { if (data) setStats(data); })
            .finally(() => setLoading(false));
    }, []);

    const primaryCards = [
        {
            label: "Total Users",
            value: stats?.totalUsers,
            icon: Users,
            accent: "#3b82f6",
            sub: `${stats?.totalLandlords ?? 0} landlords · ${stats?.totalTenants ?? 0} tenants`,
        },
        {
            label: "Total Properties",
            value: stats?.totalProperties,
            icon: Building2,
            accent: "#6d9838",
            sub: "Listed on platform",
        },
        {
            label: "Active Leases",
            value: stats?.activeLeases,
            icon: Home,
            accent: "#a855f7",
            sub: "Currently active",
        },
        {
            label: "Pending Reviews",
            value: stats?.pendingRegistrations,
            icon: Clock,
            accent: "#f59e0b",
            sub: `${stats?.reviewingRegistrations ?? 0} currently reviewing`,
        },
    ];

    return (
        <div className="min-h-screen p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #e11d48 0%, #9f1239 100%)" }}>
                            <ShieldCheck className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Admin Dashboard</h1>
                    </div>
                    <p className="text-sm text-neutral-500 ml-9.5">System overview and platform metrics</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}>
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    All systems operational
                </div>
            </div>

            {/* Primary stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {primaryCards.map((card) => (
                    <StatCard key={card.label} loading={loading} {...card} />
                ))}
            </div>

            {/* Secondary row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <RegistrationBreakdown stats={stats} loading={loading} />
                <UserBreakdown stats={stats} loading={loading} />
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl p-5"
                style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 mb-4">Quick Actions</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { label: "Review Pending Applications", href: "/admin/registrations", icon: ClipboardList, color: "#f59e0b", count: stats?.pendingRegistrations },
                        { label: "Manage Users", href: "/admin/users", icon: Users, color: "#3b82f6", count: stats?.totalUsers },
                        { label: "View All Registrations", href: "/admin/registrations", icon: TrendingUp, color: "#10b981", count: stats?.totalRegistrations },
                    ].map((action) => {
                        const Icon = action.icon;
                        return (
                            <a key={action.label} href={action.href}
                                className="group flex items-center gap-3 p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
                                    style={{ background: `${action.color}15`, border: `1px solid ${action.color}25` }}>
                                    <Icon className="h-4 w-4" style={{ color: action.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors truncate">{action.label}</p>
                                    {!loading && action.count !== undefined && (
                                        <p className="text-xs text-neutral-600 mt-0.5">{action.count} total</p>
                                    )}
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-neutral-600 group-hover:text-neutral-400 transition-colors shrink-0" />
                            </a>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
