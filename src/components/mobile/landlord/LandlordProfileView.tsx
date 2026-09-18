'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProperty } from '@/context/PropertyContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut } from '@/lib/supabase/client-auth';
import Image from 'next/image';
import { 
    User, 
    ShieldCheck, 
    Search, 
    Filter, 
    Clock, 
    LogOut, 
    Moon, 
    Sun, 
    Building2, 
    AlertCircle, 
    CheckCircle2, 
    FileText, 
    Activity,
    ChevronDown,
    ChevronUp,
    Calendar,
    Home,
    Phone,
    Mail,
    ExternalLink,
    X,
    Sparkles
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobileConfirmModal } from '@/components/mobile/shared/MobileConfirmModal';
import type { AuditLogItem } from '@/app/api/audit-logs/route';

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";

const HIDDEN_METADATA_KEYS = new Set(['source', 'idempotencykey', 'actorid', 'token', 'requestid']);

function formatMetadataKey(key: string): string {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
}

function formatMetadataValue(key: string, val: any): string {
    if (val === null || val === undefined) return 'None';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'number') {
        if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('price') || key.toLowerCase().includes('fee') || key.toLowerCase().includes('total')) {
            return `₱${val.toLocaleString()}`;
        }
        return val.toLocaleString();
    }
    if (typeof val === 'string') {
        if (val.includes('_')) {
            return val.replace(/_/g, ' ').replace(/^./, (str) => str.toUpperCase());
        }
        return val;
    }
    return JSON.stringify(val);
}

function formatDate(dateStr?: string | null): string {
    if (!dateStr) return 'N/A';
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

export function LandlordProfileView() {
    const { profile, user } = useAuth();
    const { properties } = useProperty();
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Main section tabs: 'leases' | 'activity'
    const [mainTab, setMainTab] = useState<'leases' | 'activity'>('leases');

    // Leases state
    const [leases, setLeases] = useState<any[]>([]);
    const [loadingLeases, setLoadingLeases] = useState(true);
    const [leaseSearchQuery, setLeaseSearchQuery] = useState('');
    const [leaseStatusFilter, setLeaseStatusFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('all');
    const [expandedLeaseId, setExpandedLeaseId] = useState<string | null>(null);

    // Audit logs state
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'billing' | 'maintenance' | 'auth' | 'system'>('all');
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    // Logout confirmation state
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    // Read URL query params for initial tab & highlighted lease
    useEffect(() => {
        const tabParam = searchParams?.get('tab');
        const leaseIdParam = searchParams?.get('leaseId') || searchParams?.get('id');
        if (tabParam === 'leases' || tabParam === 'lease' || leaseIdParam) {
            setMainTab('leases');
            if (leaseIdParam) {
                setExpandedLeaseId(leaseIdParam);
                setLeaseSearchQuery(leaseIdParam);
            }
        } else if (tabParam === 'activity') {
            setMainTab('activity');
        }
    }, [searchParams]);

    const fetchLeases = async () => {
        setLoadingLeases(true);
        try {
            const res = await fetch('/api/landlord/leases');
            if (res.ok) {
                const data = await res.json();
                setLeases(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('[LandlordProfile] Failed to load leases:', err);
        } finally {
            setLoadingLeases(false);
        }
    };

    const fetchAuditLogs = async () => {
        setLoadingLogs(true);
        try {
            const queryParams = new URLSearchParams();
            queryParams.set('limit', '250');

            const res = await fetch(`/api/audit-logs?${queryParams.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(Array.isArray(data.logs) ? data.logs : []);
            }
        } catch (err) {
            console.error('[LandlordProfile] Failed to load audit logs:', err);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchLeases();
        fetchAuditLogs();
    }, []);

    const handleRefresh = async () => {
        if (mainTab === 'leases') {
            await fetchLeases();
        } else {
            await fetchAuditLogs();
        }
    };

    // Filtered Leases
    const filteredLeases = useMemo(() => {
        const q = leaseSearchQuery.toLowerCase().trim();
        return leases.filter((l) => {
            const status = (l.status || '').toLowerCase();
            if (leaseStatusFilter === 'active' && status !== 'active') return false;
            if (leaseStatusFilter === 'pending' && !status.includes('pending')) return false;
            if (leaseStatusFilter === 'expired' && status !== 'expired' && status !== 'terminated') return false;

            if (!q) return true;
            const tenantName = (l.tenant?.full_name || '').toLowerCase();
            const tenantEmail = (l.tenant?.email || '').toLowerCase();
            const unitName = (l.unit?.name || '').toLowerCase();
            const propName = (l.unit?.property?.name || '').toLowerCase();
            const id = (l.id || '').toLowerCase();
            return (
                tenantName.includes(q) ||
                tenantEmail.includes(q) ||
                unitName.includes(q) ||
                propName.includes(q) ||
                id.includes(q)
            );
        });
    }, [leases, leaseSearchQuery, leaseStatusFilter]);

    // Filtered Audit Logs
    const filteredLogs = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return logs.filter((item) => {
            if (categoryFilter !== 'all') {
                const itemCat = (item.category || '').toLowerCase();
                if (itemCat !== categoryFilter.toLowerCase()) return false;
            }
            if (!q) return true;
            const title = (item.title || '').toLowerCase();
            const desc = (item.description || '').toLowerCase();
            const action = (item.action || '').toLowerCase();
            const category = (item.category || '').toLowerCase();
            return title.includes(q) || desc.includes(q) || action.includes(q) || category.includes(q);
        });
    }, [logs, searchQuery, categoryFilter]);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await signOut();
            router.replace('/login');
        } catch (err) {
            console.error('Logout error:', err);
            setLoggingOut(false);
            setShowLogoutConfirm(false);
        }
    };

    const fullName = 
        profile?.full_name || 
        `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 
        user?.user_metadata?.full_name || 
        user?.user_metadata?.name || 
        'Landlord';
    const avatarUrl = profile?.avatar_url || FALLBACK_AVATAR;

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="flex flex-col gap-3.5 pb-8">
                {/* User Profile Summary Card */}
                <div className="px-4 pt-2.5">
                    <div className="p-4 rounded-[1.75rem] neumorphic-extruded flex items-center gap-3.5">
                        <div className="relative size-14 rounded-2xl overflow-hidden shrink-0 neumorphic-inset-card p-0.5">
                            <div className="relative w-full h-full rounded-[0.85rem] overflow-hidden">
                                <Image src={avatarUrl} alt={fullName} fill sizes="56px" className="object-cover" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-foreground tracking-tight truncate">{fullName}</h3>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary/15 text-primary border border-primary/20">
                                    Landlord
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5 font-medium">{profile?.email || 'landlord@ireside.ph'}</p>
                            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground font-semibold">
                                <div className="neumorphic-inset-card flex size-4 items-center justify-center rounded-md text-primary shrink-0">
                                    <Building2 className="size-2.5" />
                                </div>
                                <span>{properties.length} Managed Propert{properties.length === 1 ? 'y' : 'ies'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Preferences Bar (Theme & Logout) */}
                <div className="px-4 grid grid-cols-2 gap-2.5">
                    {/* Theme Toggle */}
                    <button
                        type="button"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-3.5 rounded-2xl neumorphic-extruded flex items-center justify-between active:scale-95 transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <div className="neumorphic-inset-card flex size-7 items-center justify-center rounded-xl text-primary shrink-0">
                                {theme === 'dark' ? <Moon className="size-3.5 text-primary" /> : <Sun className="size-3.5 text-amber-500" />}
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider text-foreground">Theme</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground capitalize">{theme || 'dark'}</span>
                    </button>

                    {/* Logout Button */}
                    <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(true)}
                        className="p-3.5 rounded-2xl neumorphic-extruded flex items-center justify-between active:scale-95 transition-all cursor-pointer group hover:bg-red-500/5"
                    >
                        <div className="flex items-center gap-2">
                            <div className="neumorphic-inset-card flex size-7 items-center justify-center rounded-xl text-red-500 shrink-0">
                                <LogOut className="size-3.5" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider text-red-500">Sign Out</span>
                        </div>
                    </button>
                </div>

                {/* Primary Profile Switcher Tabs: Leases vs Activity */}
                <div className="px-4 grid grid-cols-2 gap-2.5 pt-0.5">
                    <button
                        type="button"
                        onClick={() => setMainTab('leases')}
                        className={cn(
                            "py-3 px-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer",
                            mainTab === 'leases'
                                ? "neumorphic-primary text-white shadow-xs"
                                : "neumorphic-extruded text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <FileText className="size-3.5 shrink-0" />
                        <span>Leases</span>
                        {leases.length > 0 && (
                            <span className={cn(
                                "px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none",
                                mainTab === 'leases' ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                            )}>
                                {leases.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setMainTab('activity')}
                        className={cn(
                            "py-3 px-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer",
                            mainTab === 'activity'
                                ? "neumorphic-primary text-white shadow-xs"
                                : "neumorphic-extruded text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Activity className="size-3.5 shrink-0" />
                        <span>Activity</span>
                        {logs.length > 0 && (
                            <span className={cn(
                                "px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none",
                                mainTab === 'activity' ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                            )}>
                                {logs.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* SECTION 1: LEASES TAB */}
                {mainTab === 'leases' && (
                    <>
                        {/* Sticky Search & Filter Bar for Leases */}
                        <div className="sticky top-[calc(var(--mobile-header-height,56px)+env(safe-area-inset-top,0px))] z-30 bg-background/95 backdrop-blur-md pt-2 pb-3 flex flex-col gap-2.5 border-b border-slate-200/80 dark:border-white/10 shadow-xs">
                            <div className="px-4 flex items-center">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="SEARCH LEASE, TENANT, UNIT, PROPERTY…"
                                        value={leaseSearchQuery}
                                        onChange={(e) => setLeaseSearchQuery(e.target.value)}
                                        className="h-11 w-full rounded-2xl border-none text-[11px] font-black uppercase tracking-wider pl-11 pr-8 focus:outline-none neumorphic-inset placeholder:text-muted-foreground/40 text-foreground"
                                    />
                                    {leaseSearchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setLeaseSearchQuery('')}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/50 hover:text-foreground"
                                            aria-label="Clear search"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Status Filter Pills */}
                            <div className="px-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
                                {(['all', 'active', 'pending', 'expired'] as const).map((filterKey) => {
                                    const isActive = leaseStatusFilter === filterKey;
                                    return (
                                        <button
                                            key={filterKey}
                                            type="button"
                                            onClick={() => setLeaseStatusFilter(filterKey)}
                                            className={cn(
                                                "shrink-0 py-2.5 px-3.5 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer",
                                                isActive
                                                    ? "neumorphic-primary text-white shadow-xs"
                                                    : "neumorphic-extruded text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <span>{filterKey}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Leases List */}
                        <div className="flex flex-col gap-3 px-4 pt-1">
                            {loadingLeases && leases.length === 0 ? (
                                <div className="space-y-3 pt-1">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="p-4 rounded-[1.75rem] neumorphic-extruded animate-pulse space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="h-4 w-28 bg-muted/60 rounded-lg" />
                                                <div className="h-4 w-16 bg-muted/60 rounded-lg" />
                                            </div>
                                            <div className="h-5 w-3/4 bg-muted/60 rounded-lg" />
                                            <div className="h-4 w-1/2 bg-muted/60 rounded-lg" />
                                        </div>
                                    ))}
                                </div>
                            ) : filteredLeases.length === 0 ? (
                                <div className="neumorphic-panel rounded-[2rem] p-8 flex flex-col items-center justify-center text-center gap-3.5 shadow-sm my-4">
                                    <div className="neumorphic-inset-card flex size-14 items-center justify-center rounded-2xl text-primary shrink-0">
                                        <FileText className="size-7" strokeWidth={1.8} />
                                    </div>
                                    <div className="space-y-1 max-w-[250px]">
                                        <h3 className="text-sm font-black text-foreground">
                                            {leaseSearchQuery ? 'No matching leases' : 'No lease records found'}
                                        </h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {leaseSearchQuery 
                                                ? 'Try adjusting your search terms or status filter.'
                                                : 'Lease contracts with your tenants will appear here.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                filteredLeases.map((lease) => {
                                    const isExpanded = expandedLeaseId === lease.id;
                                    const statusStr = (lease.status || '').toLowerCase();
                                    const isPendingSignature = statusStr.includes('pending');

                                    return (
                                        <div
                                            key={lease.id}
                                            onClick={() => setExpandedLeaseId(isExpanded ? null : lease.id)}
                                            className={cn(
                                                "p-4 rounded-[1.75rem] transition-all cursor-pointer",
                                                isExpanded
                                                    ? "neumorphic-panel shadow-md ring-1 ring-primary/30"
                                                    : "neumorphic-extruded active:scale-[0.99]"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3.5 min-w-0">
                                                    <div className="neumorphic-inset-card flex size-11 items-center justify-center rounded-2xl text-amber-500 shrink-0">
                                                        <FileText className="size-5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <span className={cn(
                                                                "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                                                statusStr === 'active'
                                                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                                    : isPendingSignature
                                                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                                                    : "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20"
                                                            )}>
                                                                {statusStr.replace(/_/g, ' ') || 'ACTIVE'}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-xs font-black text-foreground truncate">
                                                            {lease.unit?.property?.name || 'Property'} — {lease.unit?.name || 'Unit'}
                                                        </h4>
                                                        <p className="text-[11px] text-muted-foreground font-semibold truncate flex items-center gap-1 mt-0.5">
                                                            <User className="size-3 text-primary shrink-0" />
                                                            <span>{lease.tenant?.full_name || 'Tenant'}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <span className="text-xs font-black text-foreground block font-mono">
                                                        ₱{(Number(lease.monthly_rent) || 0).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-bold">/ mo</span>
                                                </div>
                                            </div>

                                            {/* Quick Duration Summary */}
                                            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/5 text-[10px] text-muted-foreground font-semibold">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="size-3 text-primary shrink-0" />
                                                    <span>
                                                        {formatDate(lease.start_date)} — {formatDate(lease.end_date)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-primary font-bold">
                                                    <span>{isExpanded ? 'Hide' : 'Details'}</span>
                                                    {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                                                </div>
                                            </div>

                                            {/* Expanded Lease Details */}
                                            {isExpanded && (
                                                <div 
                                                    className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-white/10 space-y-2.5 animate-in fade-in zoom-in-98 duration-150"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="p-2.5 rounded-xl neumorphic-inset-card">
                                                            <span className="text-[9px] font-black uppercase text-muted-foreground block">Security Deposit</span>
                                                            <span className="text-xs font-black text-foreground block mt-0.5 font-mono">
                                                                ₱{(Number(lease.security_deposit) || 0).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="p-2.5 rounded-xl neumorphic-inset-card">
                                                            <span className="text-[9px] font-black uppercase text-muted-foreground block">Tenant Email</span>
                                                            <span className="text-[11px] font-bold text-foreground block mt-0.5 truncate">
                                                                {lease.tenant?.email || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {lease.tenant?.phone && (
                                                        <div className="p-2.5 rounded-xl neumorphic-inset-card flex items-center justify-between">
                                                            <span className="text-[9px] font-black uppercase text-muted-foreground">Phone Number</span>
                                                            <span className="text-[11px] font-bold text-foreground font-mono">{lease.tenant.phone}</span>
                                                        </div>
                                                    )}

                                                    {lease.signed_at && (
                                                        <div className="p-2.5 rounded-xl neumorphic-inset-card flex items-center justify-between">
                                                            <span className="text-[9px] font-black uppercase text-muted-foreground">Signed On</span>
                                                            <span className="text-[11px] font-bold text-foreground">{formatDate(lease.signed_at)}</span>
                                                        </div>
                                                    )}

                                                    <div className="p-2.5 rounded-xl neumorphic-inset-card flex items-center justify-between">
                                                        <span className="text-[9px] font-black uppercase text-muted-foreground">Lease Reference</span>
                                                        <span className="text-[10px] font-mono font-bold text-muted-foreground truncate max-w-[170px]">{lease.id}</span>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="pt-1 flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => router.push(`/landlord/leases?id=${lease.id}`)}
                                                            className="flex-1 py-2.5 px-3 rounded-xl neumorphic-primary text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
                                                        >
                                                            <FileText className="size-3.5" />
                                                            <span>Open Contract</span>
                                                        </button>
                                                        {statusStr === 'pending_landlord_signature' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => router.push(`/signing/landlord/${lease.id}`)}
                                                                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer hover:bg-emerald-700"
                                                            >
                                                                <ShieldCheck className="size-3.5" />
                                                                <span>Countersign</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}

                {/* SECTION 2: ACTIVITY LOG TAB */}
                {mainTab === 'activity' && (
                    <>
                        {/* Sticky Search & Category Bar */}
                        <div className="sticky top-[calc(var(--mobile-header-height,56px)+env(safe-area-inset-top,0px))] z-30 bg-background/95 backdrop-blur-md pt-2 pb-3 flex flex-col gap-2.5 border-b border-slate-200/80 dark:border-white/10 shadow-xs">
                            <div className="px-4 flex items-center">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="SEARCH AUDIT RECORDS, ACTIONS, USERS…"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-11 w-full rounded-2xl border-none text-[11px] font-black uppercase tracking-wider pl-11 pr-8 focus:outline-none neumorphic-inset placeholder:text-muted-foreground/40 text-foreground"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/50 hover:text-foreground"
                                            aria-label="Clear search"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Category Pills */}
                            <div className="px-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
                                {(['all', 'billing', 'maintenance', 'auth', 'system'] as const).map((cat) => {
                                    const isActive = categoryFilter === cat;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setCategoryFilter(cat)}
                                            className={cn(
                                                "shrink-0 py-2.5 px-3.5 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer",
                                                isActive
                                                    ? "neumorphic-primary text-white shadow-xs"
                                                    : "neumorphic-extruded text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <span>{cat}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Audit Logs List */}
                        <div className="flex flex-col gap-3 px-4 pt-1">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <div className="neumorphic-inset-card flex size-6 items-center justify-center rounded-lg text-primary shrink-0">
                                        <Activity className="size-3" />
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                        Activity Log
                                    </h3>
                                </div>
                                <span className="text-[10px] font-semibold text-muted-foreground">
                                    {filteredLogs.length} event{filteredLogs.length === 1 ? '' : 's'}
                                </span>
                            </div>

                            {loadingLogs ? (
                                <div className="space-y-3 pt-1">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="p-4 rounded-[1.75rem] neumorphic-extruded animate-pulse space-y-2">
                                            <div className="h-4 w-32 bg-muted/60 rounded-lg" />
                                            <div className="h-3 w-48 bg-muted/60 rounded-lg" />
                                        </div>
                                    ))}
                                </div>
                            ) : filteredLogs.length === 0 ? (
                                <div className="neumorphic-panel rounded-[2rem] p-8 flex flex-col items-center justify-center text-center gap-3.5 shadow-sm my-4">
                                    <div className="neumorphic-inset-card flex size-14 items-center justify-center rounded-2xl text-primary shrink-0">
                                        <Activity className="size-7" strokeWidth={1.8} />
                                    </div>
                                    <div className="space-y-1 max-w-[250px]">
                                        <h3 className="text-sm font-black text-foreground">No activities found</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {searchQuery ? 'Try matching another search keyword or category.' : 'Audit events and records will be logged automatically here.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                filteredLogs.map((item) => {
                                    const isExpanded = expandedLogId === item.id;
                                    const hasMetadata = item.metadata && Object.keys(item.metadata).length > 0;

                                    return (
                                        <div
                                            key={item.id}
                                            className="p-4 rounded-[1.75rem] neumorphic-extruded flex flex-col gap-2.5 transition-all"
                                        >
                                            {/* Header: Title + Timestamp */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                            {item.category || 'General'}
                                                        </span>
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70 font-mono">
                                                            {item.action}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-xs font-black text-foreground truncate mt-0.5">
                                                        {item.title || item.action}
                                                    </h4>
                                                </div>
                                                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 shrink-0 font-mono">
                                                    <Clock className="size-3" />
                                                    {formatDate(item.createdAt)}
                                                </span>
                                            </div>

                                            {/* Description */}
                                            {item.description && (
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    {item.description}
                                                </p>
                                            )}

                                            {/* Metadata Expandable Drawer */}
                                            {isExpanded && hasMetadata && (
                                                <div className="mt-1 pt-2.5 border-t border-border/40 flex flex-col gap-2 animate-in fade-in duration-200">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                                            Event Details
                                                        </span>
                                                        {(item.metadata?.actorName as string | undefined) && (
                                                            <span className="text-[10px] font-bold text-primary">
                                                                By: {(item.metadata?.actorName as string | undefined)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        {Object.entries(item.metadata)
                                                            .filter(([k, v]) => !HIDDEN_METADATA_KEYS.has(k.toLowerCase()) && v !== null && v !== undefined && v !== '')
                                                            .map(([k, v]) => {
                                                                const strVal = formatMetadataValue(k, v);
                                                                const isLong = strVal.length > 20;
                                                                return (
                                                                    <div
                                                                        key={k}
                                                                        className={cn(
                                                                            "p-2.5 rounded-xl bg-background/50 border border-border/30 flex flex-col min-w-0 shadow-2xs",
                                                                            isLong && "col-span-2"
                                                                        )}
                                                                    >
                                                                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/80 truncate">
                                                                            {formatMetadataKey(k)}
                                                                        </span>
                                                                        <span className="text-xs font-bold text-foreground truncate mt-0.5">
                                                                            {strVal}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Expand toggle */}
                                            <div className="pt-1 flex items-center justify-between border-t border-border/40">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedLogId(isExpanded ? null : item.id)}
                                                    className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-0.5 hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <span>{isExpanded ? 'Less' : 'Details'}</span>
                                                    {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Sign Out Confirmation Modal */}
            <MobileConfirmModal
                isOpen={showLogoutConfirm}
                title="Sign Out of iReside?"
                description="Are you sure you want to sign out? You will need to log back in to access your properties and management dashboard."
                confirmLabel="Sign Out"
                cancelLabel="Cancel"
                variant="danger"
                isLoading={loggingOut}
                icon={<LogOut className="size-5" />}
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutConfirm(false)}
            />
        </PullToRefresh>
    );
}
