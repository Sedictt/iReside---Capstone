'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProperty } from '@/context/PropertyContext';
import { useRouter } from 'next/navigation';
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
    ChevronUp
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import type { AuditLogItem } from '@/app/api/audit-logs/route';

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80";

export function LandlordProfileView() {
    const { profile } = useAuth();
    const { properties } = useProperty();
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'billing' | 'maintenance' | 'auth' | 'system'>('all');
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    const fetchAuditLogs = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (categoryFilter !== 'all') queryParams.set('category', categoryFilter);
            if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());

            const res = await fetch(`/api/audit-logs?${queryParams.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(Array.isArray(data.logs) ? data.logs : []);
            }
        } catch (err) {
            console.error('Failed to load audit logs:', err);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        setLoadingLogs(true);
        fetchAuditLogs();
    }, [categoryFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingLogs(true);
        fetchAuditLogs();
    };

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace('/login');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const fullName = `${profile?.first_name || 'Landlord'} ${profile?.last_name || ''}`.trim();
    const avatarUrl = profile?.avatar_url || FALLBACK_AVATAR;

    return (
        <PullToRefresh onRefresh={fetchAuditLogs}>
            <div className="flex flex-col gap-3.5 pb-3">
                {/* User Profile Summary Card */}
                <div className="mx-4 p-4 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex items-center gap-3.5">
                    <div className="relative size-14 rounded-full overflow-hidden border-2 border-primary/30 bg-muted shrink-0 shadow-xs">
                        <Image src={avatarUrl} alt={fullName} fill sizes="56px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-black text-foreground truncate">{fullName}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary/15 text-primary">
                                Landlord
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{profile?.email || 'landlord@ireside.ph'}</p>
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                            <Building2 className="size-3 text-primary" />
                            <span>{properties.length} Managed Propert{properties.length === 1 ? 'y' : 'ies'}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Preferences Bar */}
                <div className="mx-4 grid grid-cols-2 gap-2.5">
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-3 rounded-xl bg-white dark:bg-card/70 border border-slate-300 dark:border-white/15 flex items-center justify-between active:scale-[0.98] transition-all shadow-2xs"
                    >
                        <div className="flex items-center gap-2">
                            {theme === 'dark' ? <Moon className="size-3.5 text-primary" /> : <Sun className="size-3.5 text-amber-500" />}
                            <span className="text-xs font-bold text-foreground">Appearance</span>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground capitalize">{theme || 'dark'}</span>
                    </button>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between text-red-400 active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <LogOut className="size-3.5" />
                            <span className="text-xs font-bold">Sign Out</span>
                        </div>
                    </button>
                </div>

                {/* AUDIT LOGS VIEWER */}
                <div className="flex flex-col gap-3 px-4 pt-2">
                    <div className="flex items-center gap-1.5">
                        <Activity className="size-4 text-primary" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                            Audit &amp; Activity Log
                        </h3>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Filter actions or keywords…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition-all"
                        >
                            Search
                        </button>
                    </form>

                {/* Category Pills */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                    {(['all', 'billing', 'maintenance', 'auth', 'system'] as const).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={cn(
                                "px-3 py-1 rounded-xl text-[11px] font-bold capitalize whitespace-nowrap transition-all",
                                categoryFilter === cat
                                    ? "bg-primary text-primary-foreground shadow-xs"
                                    : "bg-slate-100/90 dark:bg-card/70 border border-slate-300/80 dark:border-white/15 text-muted-foreground"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Logs Timeline */}
                <div className="flex flex-col gap-2">
                    {loadingLogs ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
                            <span className="text-xs text-muted-foreground">Loading audit records…</span>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-card/50 p-8 text-center flex flex-col items-center justify-center shadow-xs">
                            <ShieldCheck className="size-8 text-muted-foreground/50 mb-2" />
                            <h4 className="text-xs font-bold text-foreground">No audit logs found</h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                No logged events match the current filter.
                            </p>
                        </div>
                    ) : (
                        logs.map((item) => {
                            const isExpanded = expandedLogId === item.id;
                            const isWarning = item.severity === 'warning';
                            const isError = item.severity === 'critical' || (item.severity as any) === 'error';

                            return (
                                <div
                                    key={item.id}
                                    className="p-3 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-card/80 shadow-2xs flex flex-col gap-1.5 text-left"
                                >
                                    {/* Top Row: Category tag & Timestamp */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className={cn(
                                                "px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider",
                                                isError && "bg-red-500/15 text-red-400 border border-red-500/25",
                                                isWarning && "bg-amber-500/15 text-amber-400 border border-amber-500/25",
                                                !isError && !isWarning && "bg-primary/15 text-primary border border-primary/25"
                                            )}>
                                                {item.category || 'Event'}
                                            </span>
                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                                                {item.action}
                                            </span>
                                        </div>

                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>

                                    {/* Title & Description */}
                                    <h4 className="text-xs font-bold text-foreground">{item.title}</h4>
                                    <p className={cn(
                                        "text-[11px] text-muted-foreground leading-relaxed",
                                        !isExpanded && "line-clamp-2"
                                    )}>
                                        {item.description}
                                    </p>

                                    {/* Metadata details on expand */}
                                    {isExpanded && item.metadata && Object.keys(item.metadata).length > 0 && (
                                        <div className="p-2 rounded-lg bg-background/60 border border-slate-200/60 dark:border-white/5 mt-1 font-mono text-[10px] text-muted-foreground overflow-x-auto">
                                            <pre>{JSON.stringify(item.metadata, null, 2)}</pre>
                                        </div>
                                    )}

                                    {/* Expand toggle */}
                                    <button
                                        onClick={() => setExpandedLogId(isExpanded ? null : item.id)}
                                        className="text-[10px] font-bold text-primary flex items-center gap-0.5 pt-0.5"
                                    >
                                        <span>{isExpanded ? 'Show less' : 'View record details'}</span>
                                        {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
        </PullToRefresh>
    );
}
