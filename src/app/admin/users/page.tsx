"use client";

import { useEffect, useState } from "react";
import { Search, Users, UserCheck, UserX, ShieldAlert } from "lucide-react";
import type { UserRole } from "@/types/database";

interface UserRow {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    avatar_url: string | null;
    created_at: string;
}

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
    tenant: { label: "Tenant", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)", icon: UserX },
    landlord: { label: "Landlord", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", icon: UserCheck },
    admin: { label: "Admin", color: "#f43f5e", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.2)", icon: ShieldAlert },
};

function Avatar({ name, url }: { name: string; url: string | null }) {
    const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    if (url) {
        return <img src={url} alt={name} className="h-9 w-9 rounded-full object-cover" style={{ border: "1px solid rgba(255,255,255,0.1)" }} />;
    }
    return (
        <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {initials}
        </div>
    );
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

    useEffect(() => {
        fetch("/api/admin/users")
            .then((r) => r.json())
            .then(({ users }) => setUsers(users ?? []))
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
        <div className="min-h-screen p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.3)" }}>
                            <Users className="h-4 w-4 text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Users</h1>
                    </div>
                    <p className="text-sm text-neutral-500 ml-9.5">All registered users on the platform</p>
                </div>
                <div className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#a3a3a3" }}>
                    {loading ? "—" : `${users.length} total`}
                </div>
            </div>

            {/* Filters row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 rounded-xl focus:outline-none transition-all duration-200"
                        style={{
                            background: "#111111",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                    />
                </div>

                {/* Role filter pills */}
                <div className="flex gap-2 flex-wrap">
                    {(["all", "tenant", "landlord", "admin"] as const).map((role) => {
                        const active = roleFilter === role;
                        const cfg = role !== "all" ? ROLE_CONFIG[role] : null;
                        return (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200"
                                style={active ? {
                                    background: cfg ? cfg.bg : "rgba(255,255,255,0.1)",
                                    border: `1px solid ${cfg ? cfg.border : "rgba(255,255,255,0.2)"}`,
                                    color: cfg ? cfg.color : "#ffffff",
                                } : {
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                    color: "#737373",
                                }}
                            >
                                {role} {!loading && <span className="opacity-60">({counts[role]})</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                {/* Table header */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3.5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600">User</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600 w-24 text-center">Role</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600 w-28 text-right">Joined</p>
                </div>

                {loading ? (
                    <div className="py-16 flex flex-col items-center gap-3">
                        <div className="h-8 w-8 rounded-full border-2 border-neutral-800 border-t-neutral-500 animate-spin" />
                        <p className="text-sm text-neutral-600">Loading users...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-neutral-700" />
                        <p className="text-sm text-neutral-500">No users found</p>
                        <p className="text-xs text-neutral-700">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        {filtered.map((u) => {
                            const cfg = ROLE_CONFIG[u.role];
                            const RoleIcon = cfg.icon;
                            return (
                                <div key={u.id}
                                    className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-4 transition-colors duration-150"
                                    style={{ cursor: "default" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                    {/* User info */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar name={u.full_name} url={u.avatar_url} />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">{u.full_name}</p>
                                            <p className="text-xs text-neutral-500 truncate">{u.email}</p>
                                        </div>
                                    </div>

                                    {/* Role badge */}
                                    <div className="w-24 flex justify-center">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                                            <RoleIcon className="h-3 w-3" />
                                            {cfg.label}
                                        </span>
                                    </div>

                                    {/* Joined date */}
                                    <div className="w-28 text-right">
                                        <p className="text-xs text-neutral-500">
                                            {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
