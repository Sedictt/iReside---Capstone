'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Users,
    Search,
    Phone,
    Mail,
    MessageSquare,
    Building2,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    RefreshCw,
    X,
    ChevronRight,
    ArrowUpRight,
    FileText,
    Shield,
    Sparkles,
    UserCheck
} from 'lucide-react';
import { useProperty } from '@/context/PropertyContext';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TenantItem {
    id: string;
    name: string;
    property: string;
    unit: string;
    status: 'Active' | 'Moving Out' | 'Evicted';
    rentAmount: number | null;
    leaseEnd: string | null;
    phone: string;
    email: string;
    avatar: string;
    avatarUrl: string | null;
    avatarBgColor: string | null;
    paymentStatus: 'paid' | 'late' | 'pending';
    onboardingStatus: 'pending' | 'in_progress' | 'completed' | 'not_started';
}

interface TenantDetailProfile {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    address?: string | null;
    avatar_url?: string | null;
    created_at?: string;
}

interface TenantDetailLease {
    id: string;
    status: string;
    start_date: string;
    end_date: string;
    monthly_rent: number;
    security_deposit?: number;
    unit?: {
        name: string;
        property?: {
            name: string;
            address: string;
        };
    };
}

export function LandlordTenantsView() {
    const router = useRouter();
    const { selectedPropertyId } = useProperty();

    const [tenants, setTenants] = useState<TenantItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'late' | 'moving_out'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Detail drawer state
    const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailProfile, setDetailProfile] = useState<TenantDetailProfile | null>(null);
    const [detailLease, setDetailLease] = useState<TenantDetailLease | null>(null);

    const fetchTenants = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedPropertyId && selectedPropertyId !== 'all') {
                params.set('propertyId', selectedPropertyId);
            }

            const res = await fetch(`/api/landlord/tenants?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to load tenants');
            const data = await res.json();
            setTenants(Array.isArray(data.tenants) ? data.tenants : []);
        } catch (err) {
            console.error('Error fetching landlord tenants:', err);
            toast.error('Failed to load tenant roster');
        } finally {
            setLoading(false);
        }
    }, [selectedPropertyId]);

    useEffect(() => {
        fetchTenants();
    }, [fetchTenants]);

    const formatCurrency = (amt?: number | null) => {
        if (typeof amt !== 'number') return '₱0.00';
        return `₱${amt.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getDaysRemaining = (endStr?: string | null) => {
        if (!endStr) return null;
        const end = new Date(endStr);
        const today = new Date();
        return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    // Metrics summary
    const metrics = useMemo(() => {
        const total = tenants.length;
        const paidCount = tenants.filter(t => t.paymentStatus === 'paid').length;
        const lateCount = tenants.filter(t => t.paymentStatus === 'late').length;
        const movingOutCount = tenants.filter(t => t.status === 'Moving Out').length;
        return { total, paidCount, lateCount, movingOutCount };
    }, [tenants]);

    // Filtered list
    const filteredTenants = useMemo(() => {
        let list = tenants;

        if (activeTab === 'active') {
            list = list.filter(t => t.status === 'Active');
        } else if (activeTab === 'late') {
            list = list.filter(t => t.paymentStatus === 'late');
        } else if (activeTab === 'moving_out') {
            list = list.filter(t => t.status === 'Moving Out');
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(t => {
                const name = t.name.toLowerCase();
                const unit = t.unit.toLowerCase();
                const prop = t.property.toLowerCase();
                const phone = (t.phone || '').toLowerCase();
                const email = (t.email || '').toLowerCase();
                return name.includes(q) || unit.includes(q) || prop.includes(q) || phone.includes(q) || email.includes(q);
            });
        }

        return list;
    }, [tenants, activeTab, searchQuery]);

    // Open detail drawer
    const openTenantDetail = async (tenant: TenantItem) => {
        triggerHaptic('light');
        setSelectedTenant(tenant);
        setDetailLoading(true);
        setDetailProfile(null);
        setDetailLease(null);

        try {
            const res = await fetch(`/api/landlord/tenants/${tenant.id}/profile`);
            if (res.ok) {
                const data = await res.json();
                setDetailProfile(data.profile || null);
                setDetailLease(data.activeLease || null);
            }
        } catch (e) {
            console.error('Error fetching tenant detail:', e);
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <PullToRefresh onRefresh={fetchTenants}>
            <div className="flex flex-col gap-3.5 p-4 pb-20">
                {/* Property Scope & Refresh */}
                <div className="flex items-center justify-between gap-2">
                    <MobilePropertySelector className="flex-1" />
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            fetchTenants();
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-2xs"
                        aria-label="Refresh roster"
                    >
                        <RefreshCw className={cn("size-4", loading && "animate-spin text-primary")} />
                    </button>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-2xl bg-card border border-slate-200 dark:border-white/10 flex flex-col justify-between">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total</span>
                        <span className="text-lg font-black text-foreground mt-0.5">{metrics.total}</span>
                    </div>

                    <div 
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('active');
                        }}
                        className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between cursor-pointer active:scale-97 transition-all"
                    >
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Paid</span>
                        <span className="text-lg font-black text-foreground mt-0.5">{metrics.paidCount}</span>
                    </div>

                    <div 
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('late');
                        }}
                        className={cn(
                            "p-2.5 rounded-2xl border flex flex-col justify-between cursor-pointer active:scale-97 transition-all",
                            metrics.lateCount > 0 
                                ? "bg-amber-500/10 border-amber-500/30" 
                                : "bg-card border-slate-200 dark:border-white/10"
                        )}
                    >
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Late</span>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-black text-foreground mt-0.5">{metrics.lateCount}</span>
                            {metrics.lateCount > 0 && (
                                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                            )}
                        </div>
                    </div>

                    <div 
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('moving_out');
                        }}
                        className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col justify-between cursor-pointer active:scale-97 transition-all"
                    >
                        <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Moving</span>
                        <span className="text-lg font-black text-foreground mt-0.5">{metrics.movingOutCount}</span>
                    </div>
                </div>

                {/* Live Search Input */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tenant, unit, phone, or email..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter Navigation Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('all');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeTab === 'all'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        All ({tenants.length})
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('active');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeTab === 'active'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('late');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeTab === 'late'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Late
                        {metrics.lateCount > 0 && (
                            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-black">
                                {metrics.lateCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('moving_out');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeTab === 'moving_out'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Moving
                    </button>
                </div>

                {/* Tenant List */}
                <div className="space-y-3">
                    {filteredTenants.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl bg-card border border-slate-200 dark:border-white/10 flex flex-col items-center gap-2.5">
                            <Users className="size-10 text-muted-foreground/40 stroke-1" />
                            <h4 className="text-sm font-bold text-foreground">No Tenants Found</h4>
                            <p className="text-xs text-muted-foreground max-w-xs">
                                {searchQuery ? 'No tenants match your search filter.' : 'No tenants found in this category.'}
                            </p>
                        </div>
                    ) : (
                        filteredTenants.map((tenant) => {
                            const days = getDaysRemaining(tenant.leaseEnd);
                            const isLate = tenant.paymentStatus === 'late';
                            const isMoving = tenant.status === 'Moving Out';

                            return (
                                <div
                                    key={tenant.id}
                                    className={cn(
                                        "rounded-2xl p-4 bg-card border shadow-xs transition-all flex flex-col gap-3",
                                        isLate
                                            ? "border-amber-500/40"
                                            : isMoving
                                            ? "border-purple-500/40"
                                            : "border-slate-200 dark:border-white/10"
                                    )}
                                >
                                    {/* Tenant Header Row */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div 
                                            onClick={() => openTenantDetail(tenant)}
                                            className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                                        >
                                            {/* Avatar with initials fallback */}
                                            <div 
                                                className="size-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200 dark:border-white/10"
                                                style={{ backgroundColor: tenant.avatarBgColor || '#e2e8f0' }}
                                            >
                                                <span className="text-slate-800">
                                                    {tenant.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-black text-foreground truncate">
                                                    {tenant.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 truncate">
                                                    <span className="font-bold text-foreground">
                                                        Unit {tenant.unit}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="truncate">{tenant.property}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <span className={cn(
                                            "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0",
                                            isMoving
                                                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                                                : isLate
                                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                        )}>
                                            {isMoving ? 'Moving Out' : isLate ? 'Late Dues' : 'Up to Date'}
                                        </span>
                                    </div>

                                    {/* Snapshot Metrics */}
                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs">
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block font-bold uppercase">Monthly Rent</span>
                                            <span className="font-bold text-foreground">
                                                {formatCurrency(tenant.rentAmount)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block font-bold uppercase">Lease Ends</span>
                                            <span className="font-semibold text-foreground">
                                                {tenant.leaseEnd ? formatDate(tenant.leaseEnd) : 'No Lease'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block font-bold uppercase">Time Left</span>
                                            <span className={cn(
                                                "font-semibold",
                                                typeof days === 'number' && days <= 60 
                                                    ? "text-amber-600 dark:text-amber-400 font-bold" 
                                                    : "text-muted-foreground"
                                            )}>
                                                {typeof days === 'number' ? `${days} days` : 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Row */}
                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                                        <button
                                            onClick={() => openTenantDetail(tenant)}
                                            className="text-xs font-bold text-primary flex items-center gap-1 active:scale-95 transition-all"
                                        >
                                            View Details
                                            <ChevronRight className="size-3.5" />
                                        </button>

                                        <div className="flex items-center gap-1.5">
                                            {tenant.phone && (
                                                <a
                                                    href={`tel:${tenant.phone}`}
                                                    onClick={() => triggerHaptic('light')}
                                                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                                                    aria-label="Call tenant"
                                                >
                                                    <Phone className="size-3.5" />
                                                </a>
                                            )}
                                            {tenant.email && (
                                                <a
                                                    href={`mailto:${tenant.email}`}
                                                    onClick={() => triggerHaptic('light')}
                                                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                                                    aria-label="Email tenant"
                                                >
                                                    <Mail className="size-3.5" />
                                                </a>
                                            )}
                                            <Link
                                                href={`/mobile/landlord/messages?tenantId=${tenant.id}`}
                                                onClick={() => triggerHaptic('light')}
                                                className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                                                aria-label="Message tenant"
                                            >
                                                <MessageSquare className="size-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* TENANT DETAIL DRAWER */}
                {selectedTenant && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                        <div className="w-full sm:max-w-md max-h-[85vh] bg-background rounded-t-3xl sm:rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xl flex flex-col gap-4 overflow-y-auto animate-in slide-in-from-bottom duration-200">
                            {/* Drawer Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="size-12 rounded-full flex items-center justify-center font-bold text-base shrink-0 border border-slate-200 dark:border-white/10"
                                        style={{ backgroundColor: selectedTenant.avatarBgColor || '#e2e8f0' }}
                                    >
                                        <span className="text-slate-800">
                                            {selectedTenant.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-foreground">
                                            {selectedTenant.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Unit {selectedTenant.unit} • {selectedTenant.property}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedTenant(null)}
                                    className="p-1.5 rounded-full text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Contact Quick Triggers */}
                            <div className="grid grid-cols-2 gap-2">
                                {selectedTenant.phone ? (
                                    <a
                                        href={`tel:${selectedTenant.phone}`}
                                        onClick={() => triggerHaptic('light')}
                                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center gap-2 text-xs font-bold text-foreground active:scale-98 transition-all"
                                    >
                                        <Phone className="size-4 text-emerald-500" />
                                        Call ({selectedTenant.phone})
                                    </a>
                                ) : null}

                                <Link
                                    href={`/mobile/landlord/messages?tenantId=${selectedTenant.id}`}
                                    onClick={() => triggerHaptic('light')}
                                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center gap-2 text-xs font-bold text-foreground active:scale-98 transition-all"
                                >
                                    <MessageSquare className="size-4 text-blue-500" />
                                    Send Chat
                                </Link>
                            </div>

                            {/* Contact & Personal Information */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 space-y-2 text-xs">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                    Contact & Profile
                                </span>
                                <div className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-white/5">
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="font-semibold text-foreground truncate max-w-[200px]">
                                        {selectedTenant.email || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-white/5">
                                    <span className="text-muted-foreground">Phone:</span>
                                    <span className="font-semibold text-foreground">
                                        {selectedTenant.phone || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-muted-foreground">Payment Standing:</span>
                                    <span className={cn(
                                        "font-bold uppercase text-[10px] px-2 py-0.5 rounded-md",
                                        selectedTenant.paymentStatus === 'paid' 
                                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" 
                                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    )}>
                                        {selectedTenant.paymentStatus}
                                    </span>
                                </div>
                            </div>

                            {/* Lease Information */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 space-y-2 text-xs">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                    Tenancy Agreement
                                </span>
                                <div className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-white/5">
                                    <span className="text-muted-foreground">Monthly Rent:</span>
                                    <span className="font-black text-foreground">
                                        {formatCurrency(selectedTenant.rentAmount)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-white/5">
                                    <span className="text-muted-foreground">Lease Term:</span>
                                    <span className="font-semibold text-foreground">
                                        Until {formatDate(selectedTenant.leaseEnd)}
                                    </span>
                                </div>
                                {detailLease?.security_deposit && (
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-muted-foreground">Security Deposit:</span>
                                        <span className="font-semibold text-foreground">
                                            {formatCurrency(detailLease.security_deposit)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Action footer */}
                            <div className="flex items-center gap-2 pt-1">
                                <Link
                                    href="/mobile/landlord/leases"
                                    className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-xs"
                                >
                                    <FileText className="size-4" />
                                    Manage Leases
                                </Link>
                                <button
                                    onClick={() => setSelectedTenant(null)}
                                    className="py-3 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-98 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PullToRefresh>
    );
}
