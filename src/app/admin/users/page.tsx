"use client";

import { useEffect, useState } from "react";
import { Search, Users, UserCheck, ShieldAlert, MoreHorizontal, Mail, Calendar, Key } from "lucide-react";
import type { UserRole } from "@/types/database";
import { cn } from "@/lib/utils";
import { RoleBadge } from "@/components/profile/RoleBadge";

interface UserRow {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    avatar_url: string | null;
    created_at: string;
}

const ROLE_CONFIG: Record<UserRole, { label: string; colorClass: string; bgClass: string; borderClass: string; icon: React.ElementType }> = {
    tenant: { label: "Tenant", colorClass: "text-blue-400", bgClass: "bg-blue-500/10", borderClass: "border-blue-500/20", icon: Users },
    landlord: { label: "Landlord", colorClass: "text-primary", bgClass: "bg-primary/20", borderClass: "border-primary/20", icon: UserCheck },
    admin: { label: "Admin", colorClass: "text-purple-400", bgClass: "bg-purple-500/10", borderClass: "border-purple-500/20", icon: ShieldAlert },
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

    useEffect(() => {
        fetch("/api/admin/users")
            .then((r) => r.json())
            .then((data) => setUsers(data.users ?? []))
            .finally(() => setLoading(false));
    }, []);

    const filtered = users.filter((u) => {
        const matchesSearch =
            u.full_name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const counts = {
        all: users.length,
        tenant: users.filter((u) => u.role === "tenant").length,
        landlord: users.filter((u) => u.role === "landlord").length,
        admin: users.filter((u) => u.role === "admin").length,
    };

    return (
        <div className="flex flex-col gap-8 pb-12">
            {/* Header & Controls - Gestalt Grouping */}
            <section className="relative overflow-hidden rounded-[2.5rem] border border-border/70 bg-card p-8 md:p-10">
                
                <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl space-y-4">
                        <div className="inline-flex items-center gap-3 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-primary">
                            <Users className="h-3.5 w-3.5" />
                            Directory Access
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                            User Records
                        </h1>
                        <p className="text-base font-medium leading-relaxed text-white/50">
                            Search, filter, and audit every account provisioned on the iReside platform.
                        </p>
                    </div>

                    {/* Fitts''s Law Optimized Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        {(["all", "tenant", "landlord", "admin"] as const).map((role) => {
                            const isActive = roleFilter === role;
                            return (
                                <button
                                    key={role}
                                    onClick={() => setRoleFilter(role)}
                                    className={cn(
                                        "relative flex h-12 items-center justify-center rounded-2xl border px-6 font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                        isActive
                                            ? "border-primary/25 bg-primary/10 text-primary"
                                            : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.06] hover:text-white"
                                    )}
                                >
                                    <span className="capitalize">{role}</span>
                                    <span className="ml-2 rounded-md bg-black/30 px-2 py-0.5 text-[10px] text-white/40">
                                        {counts[role]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Hick''s Law - Unified Search Bar */}
                <div className="relative z-10 mt-8">
                    <div className="group relative flex items-center">
                        <Search className="absolute left-6 h-5 w-5 text-white/30 transition-colors group-focus-within:text-primary" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or identity..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-16 w-full rounded-2xl border border-border/70 bg-background pl-14 pr-6 text-lg font-medium text-foreground placeholder:text-muted-foreground transition-all focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/20"
                        />
                    </div>
                </div>
            </section>

            {/* Directory Table Area - Psychological Layout structured for scanning */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-border/70 bg-card">
                {/* Mobile Cards */}
                <div className="p-4 md:hidden">
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="animate-pulse rounded-2xl border border-border/70 bg-muted/30 p-4">
                                    <div className="mb-3 h-4 w-1/2 rounded bg-white/10" />
                                    <div className="h-3 w-2/3 rounded bg-white/10" />
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-10 text-center">
                            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
                                <Search className="h-7 w-7 text-white/20" />
                            </div>
                            <p className="text-base font-bold text-white">No records found</p>
                            <p className="mt-1 text-sm text-white/40">Adjust your filters or search query.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((user) => {
                                const roleInfo = ROLE_CONFIG[user.role];
                                const RoleIcon = roleInfo.icon;
                                const dateObj = new Date(user.created_at);

                                return (
                                    <article key={user.id} className="rounded-2xl border border-border/70 bg-background p-4">
                                        <div className="flex items-center gap-3">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full border border-white/10 object-cover" />
                                            ) : (
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-white/5">
                                                    <span className="text-xs font-bold text-white/70">
                                                        {user.full_name.substring(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <p className="truncate text-sm font-bold text-white">{user.full_name}</p>
                                                    <RoleBadge role={user.role} />
                                                </div>
                                                <p className="truncate text-xs text-white/50">{user.email}</p>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <div className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-inner", roleInfo.bgClass, roleInfo.borderClass)}>
                                                <RoleIcon className={cn("h-4 w-4 shrink-0", roleInfo.colorClass)} />
                                                <span className={cn("text-[11px] font-bold uppercase tracking-wider", roleInfo.colorClass)}>
                                                    {roleInfo.label}
                                                </span>
                                            </div>
                                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/60">
                                                <Calendar className="h-3.5 w-3.5 text-white/30" />
                                                {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-mono text-white/60">
                                                <Key className="h-3.5 w-3.5 text-white/30" />
                                                {user.id.split("-")[0]}
                                            </span>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Desktop Table Data */}
                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/70 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground bg-muted/30">
                                <th className="px-8 py-5 font-bold">Identity</th>
                                <th className="px-8 py-5 font-bold">Contact</th>
                                <th className="px-8 py-5 font-bold">Clearance Role</th>
                                <th className="px-8 py-5 font-bold">Provisioned</th>
                                <th className="px-8 py-5 text-right font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-white/5" />
                                                <div className="space-y-2">
                                                    <div className="h-4 w-32 rounded bg-white/5" />
                                                    <div className="h-3 w-20 rounded bg-white/5" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8"><div className="h-4 w-40 rounded bg-white/5" /></td>
                                        <td className="p-8"><div className="h-8 w-24 rounded-xl bg-white/5" /></td>
                                        <td className="p-8"><div className="h-4 w-24 rounded bg-white/5" /></td>
                                        <td className="p-8 text-right"><div className="inline-block h-8 w-8 rounded-lg bg-white/5" /></td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center">
                                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
                                            <Search className="h-8 w-8 text-white/20" />
                                        </div>
                                        <p className="text-lg font-bold text-white">No records found</p>
                                        <p className="text-sm text-white/40 mt-1">Adjust your filters or search query.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((user) => {
                                    const roleInfo = ROLE_CONFIG[user.role];
                                    const RoleIcon = roleInfo.icon;
                                    const dateObj = new Date(user.created_at);
                                    
                                    return (
                                        <tr key={user.id} className="group transition-colors hover:bg-white/[0.02]">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full border border-white/10 object-cover shadow-lg" />
                                                    ) : (
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-inner">
                                                            <span className="text-sm font-bold text-white/70">
                                                                {user.full_name.substring(0, 2).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="flex min-w-0 items-center gap-2">
                                                            <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{user.full_name}</p>
                                                            <RoleBadge role={user.role} />
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-white/40">
                                                            <Key className="h-3 w-3" />
                                                            <span className="truncate max-w-[120px] font-mono">{user.id.split('-')[0]}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                                                    <Mail className="h-4 w-4 text-white/30" />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-inner", roleInfo.bgClass, roleInfo.borderClass)}>
                                                    <RoleIcon className={cn("h-4 w-4 shrink-0", roleInfo.colorClass)} />
                                                    <span className={cn("text-[11px] font-bold uppercase tracking-wider", roleInfo.colorClass)}>
                                                        {roleInfo.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 text-sm font-medium text-white/50">
                                                    <Calendar className="h-4 w-4 text-white/20" />
                                                    {dateObj.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-white/40 transition-all hover:bg-white/10 hover:text-white">
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
