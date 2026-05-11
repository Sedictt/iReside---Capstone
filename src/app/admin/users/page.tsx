"use client";

import Image from 'next/image';
import { useEffect, useState, useRef } from "react";
import { Search, Users, UserCheck, ShieldAlert, MoreHorizontal, Mail, Calendar, Key, Eye, Send, MoreVertical, X } from "lucide-react";
import type { UserRole } from "@/types/database";
import { cn } from "@/lib/utils";
import { RoleBadge } from "@/components/profile/RoleBadge";
import { toast } from "sonner";

interface UserRow {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    avatar_url: string | null;
    created_at: string;
}

interface UserDetail {
    profile: {
        id: string;
        full_name: string;
        email: string;
        role: UserRole;
        avatar_url: string | null;
        phone?: string;
        created_at: string;
    };
    application?: {
        id: string;
        business_name: string;
        business_address: string;
        phone: string;
        identity_document_url: string | null;
        ownership_document_url: string | null;
        business_permit_url?: string | null;
        business_permit_card_url?: string | null;
        status: string;
        verification_status: string;
        created_at: string;
    } | null;
}

const ROLE_CONFIG: Record<UserRole, { label: string; colorClass: string; bgClass: string; borderClass: string; icon: React.ElementType }> = {
    tenant: { label: "Tenant", colorClass: "text-blue-400", bgClass: "bg-blue-500/10", borderClass: "border-blue-500/20", icon: Users },
    landlord: { label: "Landlord", colorClass: "text-primary", bgClass: "bg-primary/20", borderClass: "border-primary/20", icon: UserCheck },
    admin: { label: "Admin", colorClass: "text-purple-400", bgClass: "bg-purple-500/10", borderClass: "border-purple-500/20", icon: ShieldAlert },
};

function ActionMenu({ user, onViewSnapshot, onResendEmail }: { user: UserRow; onViewSnapshot: (u: UserRow) => void; onResendEmail: (u: UserRow) => void }) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setOpen(!open)}
                className="inline-flex size-10 items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-white/40 transition-all hover:bg-white/10 hover:text-white"
            >
                <MoreHorizontal className="size-5" />
            </button>
            
            {open && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-white/10 bg-[#1a1a1a] p-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
                    {user.role === "landlord" && (
                        <>
                            <button
                                onClick={() => { setOpen(false); onViewSnapshot(user); }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-white/80 hover:bg-white/10 transition-colors"
                            >
                                <Eye className="size-4 text-blue-400" />
                                View Registration
                            </button>
                            <button
                                onClick={() => { setOpen(false); onResendEmail(user); }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-white/80 hover:bg-white/10 transition-colors"
                            >
                                <Send className="size-4 text-primary" />
                                Resend Onboarding
                            </button>
                        </>
                    )}
                    <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-white/80 hover:bg-white/10 transition-colors">
                        <Mail className="size-4 text-white/40" />
                        Send Email
                    </button>
                    <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-white/80 hover:bg-white/10 transition-colors">
                        <Key className="size-4 text-white/40" />
                        Reset Password
                    </button>
                </div>
            )}
        </div>
    );
}

function SnapshotModal({ user, onClose }: { user: UserDetail; onClose: () => void }) {
    const profile = user.profile;
    const app = user.application;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#1a1a1a] p-8 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 flex size-10 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
                >
                    <X className="size-5" />
                </button>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white">Registration Snapshot</h2>
                    <p className="text-sm text-white/50 mt-1">{profile.full_name} - {profile.email}</p>
                </div>

                <div className="space-y-8">
                    {/* Personal Information */}
                    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-4">Personal Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Full Name</p>
                                <p className="text-white font-medium mt-1">{profile.full_name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Email</p>
                                <p className="text-white font-medium mt-1">{profile.email}</p>
                            </div>
                            {app?.phone && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Phone</p>
                                    <p className="text-white font-medium mt-1">{app.phone}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Role</p>
                                <RoleBadge role={profile.role} />
                            </div>
                        </div>
                    </section>

                    {/* Business/Property Information */}
                    {app && (
                        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-4">Property Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Business Name</p>
                                    <p className="text-white font-medium mt-1">{app.business_name || "N/A"}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Business Address</p>
                                    <p className="text-white font-medium mt-1">{app.business_address || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Application Status</p>
                                    <span className={cn(
                                        "inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase",
                                        app.status === "approved" && "bg-green-500/20 text-green-400 border border-green-500/30",
                                        app.status === "pending" && "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
                                        app.status === "rejected" && "bg-red-500/20 text-red-400 border border-red-500/30"
                                    )}>
                                        {app.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Verification Status</p>
                                    <span className={cn(
                                        "inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase",
                                        app.verification_status === "verified" && "bg-green-500/20 text-green-400 border border-green-500/30",
                                        app.verification_status === "not_verified" && "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30"
                                    )}>
                                        {app.verification_status}
                                    </span>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Documents */}
                    {app && (
                        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-4">Uploaded Documents</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {app.identity_document_url && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Identity Document</p>
<a href={app.identity_document_url} target="_blank" rel="noopener noreferrer" className="relative block h-32 rounded-xl border border-white/10 overflow-hidden hover:border-primary/50 transition-colors">
                                                <Image src={app.identity_document_url} alt="Identity" fill sizes="(max-width: 768px) 100vw, 256px" className="object-cover" />
                                        </a>
                                    </div>
                                )}
                                {app.ownership_document_url && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Proof of Ownership</p>
<a href={app.ownership_document_url} target="_blank" rel="noopener noreferrer" className="relative block h-32 rounded-xl border border-white/10 overflow-hidden hover:border-primary/50 transition-colors">
                                                <Image src={app.ownership_document_url} alt="Ownership" fill sizes="(max-width: 768px) 100vw, 256px" className="object-cover" />
                                        </a>
                                    </div>
                                )}
                                {app.business_permit_url && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Business Permit (Paper)</p>
<a href={app.business_permit_url} target="_blank" rel="noopener noreferrer" className="relative block h-32 rounded-xl border border-white/10 overflow-hidden hover:border-primary/50 transition-colors">
                                                <Image src={app.business_permit_url} alt="Permit Paper" fill sizes="(max-width: 768px) 100vw, 256px" className="object-cover" />
                                        </a>
                                    </div>
                                )}
                                {app.business_permit_card_url && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Business Permit (Card)</p>
<a href={app.business_permit_card_url} target="_blank" rel="noopener noreferrer" className="relative block h-32 rounded-xl border border-white/10 overflow-hidden hover:border-primary/50 transition-colors">
                                                <Image src={app.business_permit_card_url} alt="Permit Card" fill sizes="(max-width: 768px) 100vw, 256px" className="object-cover" />
                                        </a>
                                    </div>
                                )}
                                {!app.identity_document_url && !app.ownership_document_url && !app.business_permit_url && !app.business_permit_card_url && (
                                    <p className="text-white/40 text-sm">No documents uploaded</p>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
    const [snapshotUser, setSnapshotUser] = useState<UserDetail | null>(null);
    const [loadingSnapshot, setLoadingSnapshot] = useState(false);

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

    const handleViewSnapshot = async (user: UserRow) => {
        setLoadingSnapshot(true);
        try {
            const res = await fetch(`/api/admin/users/${user.id}`);
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
            } else {
                setSnapshotUser(data);
            }
        } catch (err) {
            toast.error("Failed to load user details");
        } finally {
            setLoadingSnapshot(false);
        }
    };

    const handleResendEmail = async (user: UserRow) => {
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "resend_onboarding" }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Onboarding email sent!");
            } else {
                toast.error(data.error || "Failed to send email");
            }
        } catch (err) {
            toast.error("Failed to send email");
        }
    };

    return (
        <div className="flex flex-col gap-8 pb-12">
            {/* Header & Controls - Gestalt Grouping */}
            <section className="relative overflow-hidden rounded-[2.5rem] border border-border/70 bg-card p-8 md:p-10">
                
                <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl space-y-4">
                        <div className="inline-flex items-center gap-3 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                            <Users className="size-3.5" />
                            Directory Access
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
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
                        <Search className="absolute left-6 size-5 text-white/30 transition-colors group-focus-within:text-primary" />
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

            {/* Directory Table Area */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-border/70 bg-card">
                {/* Mobile Cards */}
                <div className="p-4 md:hidden">
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={`user-skeleton-${i}`} className="animate-pulse rounded-2xl border border-border/70 bg-muted/30 p-4">
                                    <div className="mb-3 h-4 w-1/2 rounded bg-white/10" />
                                    <div className="h-3 w-2/3 rounded bg-white/10" />
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-10 text-center">
                            <div className="mx-auto mb-4 inline-flex size-14 items-center justify-center rounded-full bg-white/5">
                                <Search className="size-7 text-white/20" />
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
                                            <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-white/10">
                                                {user.avatar_url ? (
                                                    <Image src={user.avatar_url} alt="" fill sizes="40px" className="object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
                                                        <span className="text-xs font-bold text-white/70">
                                                            {user.full_name.substring(0, 2).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <p className="truncate text-sm font-bold text-white">{user.full_name}</p>
                                                    <RoleBadge role={user.role} />
                                                </div>
                                                <p className="truncate text-xs text-white/50">{user.email}</p>
                                            </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-2" suppressHydrationWarning>
                                            <div className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-inner", roleInfo.bgClass, roleInfo.borderClass)}>
                                                <RoleIcon className={cn("size-4 shrink-0", roleInfo.colorClass)} />
                                                <span className={cn("text-[11px] font-bold uppercase tracking-wider", roleInfo.colorClass)}>
                                                    {roleInfo.label}
                                                </span>
                                            </div>
                                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/60">
                                                <Calendar className="size-3.5 text-white/30" />
                                                <span suppressHydrationWarning>{dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-mono text-white/60">
                                                <Key className="size-3.5 text-white/30" />
                                                {user.id.split("-")[0]}
                                            </span>
                                        </div>

                                        {/* Mobile Actions */}
                                        <div className="mt-4 flex gap-2">
                                            {user.role === "landlord" && (
                                                <button
                                                    onClick={() => handleViewSnapshot(user)}
                                                    className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-white/70 hover:bg-white/10"
                                                >
                                                    View Registration
                                                </button>
                                            )}
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
                            <tr className="border-b border-border/70 text-[11px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/30">
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
                                    <tr key={`table-skeleton-${i}`} className="animate-pulse">
                                        <td className="p-8">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-full bg-white/5" />
                                                <div className="space-y-2">
                                                    <div className="h-4 w-32 rounded bg-white/5" />
                                                    <div className="h-3 w-20 rounded bg-white/5" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8"><div className="size-40 rounded bg-white/5" /></td>
                                        <td className="p-8"><div className="h-8 w-24 rounded-xl bg-white/5" /></td>
                                        <td className="p-8"><div className="h-4 w-24 rounded bg-white/5" /></td>
                                        <td className="p-8 text-right"><div className="inline-block size-8 rounded-lg bg-white/5" /></td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center">
                                        <div className="inline-flex size-16 items-center justify-center rounded-full bg-white/5 mb-4">
                                            <Search className="size-8 text-white/20" />
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
<td className="relative px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        {user.avatar_url ? (
                                                            <Image src={user.avatar_url} alt="" width={48} height={48} className="object-cover rounded-full border border-white/10 shadow-lg shrink-0" />
                                                    ) : (
                                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-inner">
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
                                                            <Key className="size-3" />
                                                            <span className="truncate max-w-[120px] font-mono">{user.id.split('-')[0]}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                                                    <Mail className="size-4 text-white/30" />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-inner", roleInfo.bgClass, roleInfo.borderClass)}>
                                                    <RoleIcon className={cn("size-4 shrink-0", roleInfo.colorClass)} />
                                                    <span className={cn("text-[11px] font-bold uppercase tracking-wider", roleInfo.colorClass)}>
                                                        {roleInfo.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 text-sm font-medium text-white/50" suppressHydrationWarning>
                                                    <Calendar className="size-4 text-white/20" />
                                                    {dateObj.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <ActionMenu 
                                                    user={user} 
                                                    onViewSnapshot={handleViewSnapshot}
                                                    onResendEmail={handleResendEmail}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Snapshot Modal */}
            {snapshotUser && (
                <SnapshotModal
                    user={snapshotUser}
                    onClose={() => setSnapshotUser(null)}
                />
            )}
        </div>
    );
}
