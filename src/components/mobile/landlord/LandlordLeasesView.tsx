'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    FileText,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Search,
    MessageSquare,
    Phone,
    Building2,
    RefreshCw,
    Check,
    X,
    ChevronRight,
    ArrowUpRight,
    Shield,
    Sparkles,
    Filter
} from 'lucide-react';
import { useProperty } from '@/context/PropertyContext';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector';
import LeaseModal from '@/components/tenant/LeaseModal';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useLanguageContext } from '@/context/LanguageContext';
import { toast } from 'sonner';
import type { LeaseData } from '@/types/lease';
import {
    formatTenure,
    isLeaseExpiringSoon,
    leaseEndState,
    leaseTermLabel,
    tenureSinceLabel,
} from '@/lib/lease-term';
import { tr } from '@/hooks/useLanguage';

/** Display labels for lease / renewal status values (values themselves stay untouched). */
const STATUS_LABELS: Record<string, string> = {
    active: 'Active',
    pending: 'Pending',
    pending_signature: 'Pending Signature',
    pending_tenant_signature: 'Awaiting Tenant Signature',
    pending_landlord_signature: 'Awaiting Landlord Signature',
    draft: 'Draft',
    approved: 'Approved',
    rejected: 'Declined',
    declined: 'Declined',
    expired: 'Expired',
    terminated: 'Terminated',
    cancelled: 'Cancelled',
    ended: 'Ended',
    completed: 'Completed',
};

/** Fixed-term leases ending within this many days count as "expiring" on mobile. */
const MOBILE_EXPIRING_DAYS = 60;

interface TenantProfile {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url?: string | null;
}

interface LeaseItem {
    id: string;
    status: string;
    start_date: string;
    /** Null for open-ended (month-to-month) leases. */
    end_date: string | null;
    term_type?: string | null;
    monthly_rent: number;
    security_deposit: number;
    signed_at: string | null;
    created_at: string;
    unit?: {
        id: string;
        name: string;
        beds: number;
        baths: number;
        property?: {
            id: string;
            name: string;
            address: string;
        };
    };
    tenant?: TenantProfile | null;
}

interface RenewalRequestItem {
    id: string;
    status: string;
    created_at: string;
    proposed_start_date: string;
    proposed_end_date: string;
    proposed_monthly_rent: number;
    proposed_security_deposit: number;
    landlord_notes?: string | null;
    current_lease?: {
        id: string;
        start_date: string;
        end_date: string | null;
        term_type?: string | null;
        monthly_rent: number;
        security_deposit: number;
        unit?: {
            name: string;
            beds: number;
            baths: number;
            property?: {
                id: string;
                name: string;
                address: string;
            };
        };
        tenant?: TenantProfile | null;
    };
}

export function LandlordLeasesView() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'all';

    const { selectedPropertyId } = useProperty();
    const { t, locale, language } = useLanguageContext();
    const [leases, setLeases] = useState<LeaseItem[]>([]);
    const [renewals, setRenewals] = useState<RenewalRequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'renewals' | 'expiring' | 'active'>(
        initialTab === 'renewals' ? 'renewals' : initialTab === 'expiring' ? 'expiring' : 'all'
    );
    const [searchQuery, setSearchQuery] = useState('');

    // Renewal decision modal state
    const [selectedRenewal, setSelectedRenewal] = useState<RenewalRequestItem | null>(null);
    const [decisionMode, setDecisionMode] = useState<'approve' | 'reject' | null>(null);
    const [rejectNotes, setRejectNotes] = useState('');
    const [actionSubmitting, setActionSubmitting] = useState(false);

    // Lease preview modal state
    const [previewLease, setPreviewLease] = useState<LeaseData | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const propertyParam = selectedPropertyId && selectedPropertyId !== 'all' 
                ? `?propertyId=${encodeURIComponent(selectedPropertyId)}` 
                : '';

            const [leasesRes, renewalsRes] = await Promise.all([
                fetch(`/api/landlord/leases${propertyParam}`),
                fetch(`/api/landlord/renewals${propertyParam}`)
            ]);

            if (leasesRes.ok) {
                const data = await leasesRes.json();
                setLeases(Array.isArray(data) ? data : []);
            }

            if (renewalsRes.ok) {
                const data = await renewalsRes.json();
                setRenewals(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Failed to load landlord leases:', err);
            toast.error(tr('Failed to load lease agreements'));
        } finally {
            setLoading(false);
        }
    }, [selectedPropertyId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (amt?: number) => {
        if (typeof amt !== 'number') return '₱0.00';
        return `₱${amt.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return t('N/A');
        const d = new Date(dateStr);
        return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Only fixed-term leases expire; open-ended leases never show up here.
    const isExpiringLease = (l: LeaseItem) => l.status === 'active' && isLeaseExpiringSoon(l, MOBILE_EXPIRING_DAYS);

    // Calculate metrics
    const metrics = useMemo(() => {
        const activeCount = leases.filter(l => l.status === 'active').length;
        const expiringSoon = leases.filter(isExpiringLease).length;
        const pendingRenewals = renewals.filter(r => r.status === 'pending').length;
        const totalRentRoll = leases
            .filter(l => l.status === 'active')
            .reduce((sum, l) => sum + (l.monthly_rent || 0), 0);

        return { activeCount, expiringSoon, pendingRenewals, totalRentRoll };
    }, [leases, renewals]);

    // Filter leases according to tab & search
    const filteredLeases = useMemo(() => {
        let list = leases;
        if (activeTab === 'expiring') {
            list = list.filter(isExpiringLease);
        } else if (activeTab === 'active') {
            list = list.filter(l => l.status === 'active');
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(l => {
                const tenantName = l.tenant?.full_name?.toLowerCase() || '';
                const unitName = l.unit?.name?.toLowerCase() || '';
                const propName = l.unit?.property?.name?.toLowerCase() || '';
                return tenantName.includes(q) || unitName.includes(q) || propName.includes(q);
            });
        }

        return list;
    }, [leases, activeTab, searchQuery]);

    const filteredRenewals = useMemo(() => {
        let list = renewals;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(r => {
                const tenantName = r.current_lease?.tenant?.full_name?.toLowerCase() || '';
                const unitName = r.current_lease?.unit?.name?.toLowerCase() || '';
                return tenantName.includes(q) || unitName.includes(q);
            });
        }
        return list;
    }, [renewals, searchQuery]);

    // Handle Renewal Decision (Approve / Reject)
    const handleRenewalDecision = async (action: 'approve' | 'reject') => {
        if (!selectedRenewal) return;
        setActionSubmitting(true);
        triggerHaptic('medium');

        try {
            const body: any = { action };
            if (action === 'reject') {
                body.landlord_notes = rejectNotes.trim() || 'Declined by property manager';
            }

            const res = await fetch(`/api/landlord/renewals/${selectedRenewal.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || t('Failed to update renewal request'));
            }

            toast.success(action === 'approve' ? t('Renewal request approved!') : t('Renewal request declined.'));
            setSelectedRenewal(null);
            setDecisionMode(null);
            setRejectNotes('');
            fetchData();
        } catch (err: any) {
            console.error('Renewal decision error:', err);
            toast.error(tr(err.message || t('Action failed')));
        } finally {
            setActionSubmitting(false);
        }
    };

    // Open Contract View
    const handleViewContract = async (lease: LeaseItem) => {
        triggerHaptic('light');
        setPreviewLoading(true);
        try {
            const res = await fetch(`/api/landlord/leases/${lease.id}`);
            if (res.ok) {
                const data = await res.json();
                setPreviewLease(data);
                setPreviewOpen(true);
            } else {
                toast.error(t('Could not load lease contract details'));
            }
        } catch (e) {
            toast.error(t('Failed to load contract'));
        } finally {
            setPreviewLoading(false);
        }
    };

    return (
        <PullToRefresh onRefresh={fetchData}>
            <div className="flex flex-col gap-3.5 p-4 pb-20">
                {/* Property Filter Banner */}
                <div className="flex items-center justify-between gap-2">
                    <MobilePropertySelector className="flex-1" />
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            fetchData();
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-2xs"
                        aria-label={t("Refresh")}
                    >
                        <RefreshCw className={cn("size-4", loading && "animate-spin text-primary")} />
                    </button>
                </div>

                {/* Summary Metrics Chips */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            {t('Active')}
                        </span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-xl font-black text-foreground">
                                {metrics.activeCount}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">{t("units")}</span>
                        </div>
                    </div>

                    <div 
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('expiring');
                        }}
                        className={cn(
                            "p-3 rounded-2xl border flex flex-col justify-between cursor-pointer active:scale-97 transition-all",
                            metrics.expiringSoon > 0
                                ? "bg-amber-500/10 border-amber-500/30"
                                : "bg-card border-slate-200 dark:border-white/10"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                {t('Expiring')}
                            </span>
                            {metrics.expiringSoon > 0 && (
                                <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                            )}
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-xl font-black text-foreground">
                                {metrics.expiringSoon}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">{t("<60d")}</span>
                        </div>
                    </div>

                    <div 
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('renewals');
                        }}
                        className={cn(
                            "p-3 rounded-2xl border flex flex-col justify-between cursor-pointer active:scale-97 transition-all",
                            metrics.pendingRenewals > 0
                                ? "bg-blue-500/10 border-blue-500/30"
                                : "bg-card border-slate-200 dark:border-white/10"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                {t('Renewals')}
                            </span>
                            {metrics.pendingRenewals > 0 && (
                                <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
                            )}
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-xl font-black text-foreground">
                                {metrics.pendingRenewals}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">{t("action")}</span>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t("Search tenant, unit, or property...")}
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
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 overflow-x-auto [scrollbar-width:none]">
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('all');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap text-center",
                            activeTab === 'all'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {t('All ({count})', { count: leases.length })}
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('renewals');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap text-center relative",
                            activeTab === 'renewals'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {t('Renewals')}
                        {metrics.pendingRenewals > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-blue-500 text-white text-[9px] font-black">
                                {metrics.pendingRenewals}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('expiring');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap text-center",
                            activeTab === 'expiring'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {t('Expiring')}
                        {metrics.expiringSoon > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-black">
                                {metrics.expiringSoon}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('active');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap text-center",
                            activeTab === 'active'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {t('Active')}
                    </button>
                </div>

                {/* Content Section */}
                {activeTab === 'renewals' ? (
                    /* RENEWALS TAB */
                    <div className="space-y-3">
                        {filteredRenewals.length === 0 ? (
                            <div className="p-8 text-center rounded-2xl bg-card border border-slate-200 dark:border-white/10 flex flex-col items-center gap-2.5">
                                <CheckCircle2 className="size-10 text-emerald-500/50 stroke-1" />
                                <h4 className="text-sm font-bold text-foreground">{t("No Pending Renewals")}</h4>
                                <p className="text-xs text-muted-foreground max-w-xs">
                                    {t('All tenant lease renewal requests have been reviewed and processed.')}
                                </p>
                            </div>
                        ) : (
                            filteredRenewals.map((renewal) => {
                                const isPending = renewal.status === 'pending';
                                return (
                                    <div
                                        key={renewal.id}
                                        className={cn(
                                            "rounded-2xl p-4 bg-card border shadow-xs transition-all flex flex-col gap-3",
                                            isPending 
                                                ? "border-blue-500/30 hover:border-blue-500/50" 
                                                : "border-slate-200 dark:border-white/10 opacity-75"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                                                    <Building2 className="size-3" />
                                                    <span>{renewal.current_lease?.unit?.property?.name || t('Property')}</span>
                                                </div>
                                                <h3 className="text-sm font-black text-foreground mt-0.5">
                                                    {t('Unit {unit}', { unit: renewal.current_lease?.unit?.name || t('N/A') })}
                                                </h3>
                                                <p className="text-xs font-medium text-foreground/80 mt-0.5">
                                                    {t('Tenant: {name}', { name: renewal.current_lease?.tenant?.full_name || t('Assigned Tenant') })}
                                                </p>
                                            </div>
                                            <span className={cn(
                                                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                renewal.status === 'pending'
                                                    ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                                    : renewal.status === 'approved'
                                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                    : "bg-red-500/15 text-red-600 dark:text-red-400"
                                            )}>
                                                {t(STATUS_LABELS[renewal.status] ?? renewal.status)}
                                            </span>
                                        </div>

                                        {/* Renewal Comparison Box */}
                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-[10px] text-muted-foreground block font-bold uppercase">{t("Proposed Period")}</span>
                                                <span className="font-semibold text-foreground">
                                                    {formatDate(renewal.proposed_start_date)} - {formatDate(renewal.proposed_end_date)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-muted-foreground block font-bold uppercase">{t("Proposed Rent")}</span>
                                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(renewal.proposed_monthly_rent)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        {isPending && (
                                            <div className="flex items-center gap-2 pt-1">
                                                <button
                                                    onClick={() => {
                                                        triggerHaptic('medium');
                                                        setSelectedRenewal(renewal);
                                                        setDecisionMode('approve');
                                                    }}
                                                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                                                >
                                                    <Check className="size-3.5" />
                                                    {t('Approve')}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        triggerHaptic('light');
                                                        setSelectedRenewal(renewal);
                                                        setDecisionMode('reject');
                                                    }}
                                                    className="py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 active:scale-98 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                                                >
                                                    <X className="size-3.5" />
                                                    {t('Decline')}
                                                </button>
                                                {renewal.current_lease?.tenant?.id && (
                                                    <Link
                                                        href={`/mobile/landlord/messages?tenantId=${renewal.current_lease.tenant.id}`}
                                                        className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                                                        aria-label={t("Message tenant")}
                                                    >
                                                        <MessageSquare className="size-4" />
                                                    </Link>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    /* LEASES TAB (ALL / EXPIRING / ACTIVE) */
                    <div className="space-y-3">
                        {filteredLeases.length === 0 ? (
                            <div className="p-8 text-center rounded-2xl bg-card border border-slate-200 dark:border-white/10 flex flex-col items-center gap-2.5">
                                <FileText className="size-10 text-muted-foreground/40 stroke-1" />
                                <h4 className="text-sm font-bold text-foreground">{t("No Leases Found")}</h4>
                                <p className="text-xs text-muted-foreground max-w-xs">
                                    {searchQuery ? t('Try adjusting your search query.') : t('No leases match the selected tab filter.')}
                                </p>
                            </div>
                        ) : (
                            filteredLeases.map((lease) => {
                                const isActive = lease.status === 'active';
                                const termState = leaseEndState(lease);
                                const isExpiring = isExpiringLease(lease);
                                const isUrgent = isExpiring && termState.kind === 'fixed' && termState.urgent;
                                const isMovingOut = isActive && termState.kind === 'moving_out';
                                const isOpenEnded = termState.kind === 'open_ended';
                                const statusLabel = t(STATUS_LABELS[lease.status] ?? lease.status);
                                const statusChip = !isActive
                                    ? statusLabel
                                    : termState.kind === 'fixed' && isExpiring
                                        ? t('{days}d left', { days: termState.daysLeft })
                                        : termState.kind === 'moving_out'
                                            ? t('Moving out · {days}d', { days: termState.daysLeft })
                                            : termState.kind === 'ended'
                                                ? t('Ended')
                                                : isOpenEnded
                                                    ? t('Open-ended')
                                                    : statusLabel;

                                return (
                                    <div
                                        key={lease.id}
                                        className={cn(
                                            "rounded-2xl p-4 bg-card border shadow-xs transition-all flex flex-col gap-3",
                                            isUrgent
                                                ? "border-red-500/40"
                                                : isExpiring || isMovingOut
                                                ? "border-amber-500/40"
                                                : "border-slate-200 dark:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                                                    <Building2 className="size-3" />
                                                    <span>{lease.unit?.property?.name || t('Property')}</span>
                                                </div>
                                                <h3 className="text-sm font-black text-foreground mt-0.5">
                                                    {t('Unit {unit}', { unit: lease.unit?.name || t('N/A') })}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-xs font-semibold text-foreground">
                                                        {lease.tenant?.full_name || t('Occupied Unit')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                    isActive
                                                        ? isUrgent
                                                            ? "bg-red-500/15 text-red-600 dark:text-red-400"
                                                            : isExpiring || isMovingOut
                                                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                        : "bg-slate-500/15 text-muted-foreground"
                                                )}>
                                                    {statusChip}
                                                </span>
                                                {isActive && (
                                                    <span className="text-[10px] text-muted-foreground text-right">
                                                        {isOpenEnded
                                                            ? `${tenureSinceLabel(lease.start_date, language)}${formatTenure(lease.start_date, undefined, language) ? ` · ${formatTenure(lease.start_date, undefined, language)}` : ''}`
                                                            : leaseTermLabel(lease, undefined, language)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Financial & Terms Row */}
                                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs">
                                            <div>
                                                <span className="text-[10px] text-muted-foreground block font-bold uppercase">{t("Monthly Rent")}</span>
                                                <span className="font-bold text-foreground">
                                                    {formatCurrency(lease.monthly_rent)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-muted-foreground block font-bold uppercase">{t("Deposit")}</span>
                                                <span className="font-semibold text-muted-foreground">
                                                    {formatCurrency(lease.security_deposit)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-muted-foreground block font-bold uppercase">{t("Bed / Bath")}</span>
                                                <span className="font-semibold text-muted-foreground">
                                                    {t('{beds} Bed • {baths} Bath', { beds: lease.unit?.beds || 1, baths: lease.unit?.baths || 1 })}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] text-muted-foreground block font-bold uppercase">
                                                    {isOpenEnded ? t('Tenure') : t('Term')}
                                                </span>
                                                <span className="font-semibold text-muted-foreground">
                                                    {isOpenEnded
                                                        ? (formatTenure(lease.start_date, undefined, language) || t('Month-to-month'))
                                                        : leaseTermLabel(lease, undefined, language)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Quick Actions Footer */}
                                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                                            <button
                                                onClick={() => handleViewContract(lease)}
                                                className="text-xs font-bold text-primary flex items-center gap-1 active:scale-95 transition-all"
                                            >
                                                <FileText className="size-3.5" />
                                                {t('View Agreement')}
                                            </button>

                                            <div className="flex items-center gap-1.5">
                                                {lease.tenant?.phone && (
                                                    <a
                                                        href={`tel:${lease.tenant.phone}`}
                                                        className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                                                        aria-label={t("Call tenant")}
                                                    >
                                                        <Phone className="size-3.5" />
                                                    </a>
                                                )}
                                                {lease.tenant?.id && (
                                                    <Link
                                                        href={`/mobile/landlord/messages?tenantId=${lease.tenant.id}`}
                                                        className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                                                        aria-label={t("Message tenant")}
                                                    >
                                                        <MessageSquare className="size-3.5" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* DECISION DRAWER / MODAL */}
                {selectedRenewal && decisionMode && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                        <div className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-black text-foreground">
                                    {decisionMode === 'approve' ? t('Approve Lease Extension') : t('Decline Renewal Request')}
                                </h3>
                                <button
                                    onClick={() => {
                                        setSelectedRenewal(null);
                                        setDecisionMode(null);
                                    }}
                                    className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                                    aria-label={t('Close')}
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs space-y-1.5">
                                <div className="font-bold text-foreground">
                                    {t('Unit {unit}', { unit: selectedRenewal.current_lease?.unit?.name ?? '' })} • {selectedRenewal.current_lease?.tenant?.full_name}
                                </div>
                                <div className="text-muted-foreground">
                                    {t('Proposed Period: {start} - {end}', { start: formatDate(selectedRenewal.proposed_start_date), end: formatDate(selectedRenewal.proposed_end_date) })}
                                </div>
                                <div className="text-muted-foreground font-semibold">
                                    {t('Monthly Rent: {amount}', { amount: formatCurrency(selectedRenewal.proposed_monthly_rent) })}
                                </div>
                            </div>

                            {decisionMode === 'reject' && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground">
                                        {t('Reason for Declining (Sent to Tenant)')}
                                    </label>
                                    <textarea
                                        value={rejectNotes}
                                        onChange={(e) => setRejectNotes(e.target.value)}
                                        rows={3}
                                        placeholder={t("e.g., Scheduled unit maintenance or rate adjustments...")}
                                        className="w-full p-3 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            )}

                            {decisionMode === 'approve' && (
                                <p className="text-xs text-muted-foreground">
                                    {t('Approving will notify the tenant and prepare the renewed lease terms based on their proposed schedule.')}
                                </p>
                            )}

                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    disabled={actionSubmitting}
                                    onClick={() => {
                                        setSelectedRenewal(null);
                                        setDecisionMode(null);
                                    }}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-98 transition-all"
                                >
                                    {t('Cancel')}
                                </button>
                                <button
                                    disabled={actionSubmitting}
                                    onClick={() => handleRenewalDecision(decisionMode)}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl text-white text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs",
                                        decisionMode === 'approve'
                                            ? "bg-emerald-600 hover:bg-emerald-700"
                                            : "bg-red-600 hover:bg-red-700"
                                    )}
                                >
                                    {actionSubmitting ? (
                                        <RefreshCw className="size-4 animate-spin" />
                                    ) : decisionMode === 'approve' ? (
                                        <>
                                            <Check className="size-4" />
                                            {t('Confirm Approval')}
                                        </>
                                    ) : (
                                        <>
                                            <X className="size-4" />
                                            {t('Confirm Decline')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* LEASE PREVIEW MODAL */}
                {previewLease && (
                    <LeaseModal
                        open={previewOpen}
                        onOpenChange={setPreviewOpen}
                        leaseData={previewLease}
                    />
                )}
            </div>
        </PullToRefresh>
    );
}
