'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, LogOut, 
    Calendar, 
    Clock, 
    CheckCircle2, 
    AlertTriangle, 
    Building2, 
    Home, 
    ShieldCheck, 
    RefreshCw, 
    ArrowUpRight, 
    MessageSquare, 
    Shield, 
    Sparkles, 
    Bed, 
    Bath, 
    X,
    Loader2,
    DollarSign, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import LeaseModal from '@/components/tenant/LeaseModal';
import { MobileMoveOutDrawer } from '@/components/mobile/tenant/MobileMoveOutDrawer';
import { MobileAmenityBookingDrawer } from '@/components/mobile/tenant/MobileAmenityBookingDrawer';
import { LeaseData } from '@/types/lease';
import { getSafeAvatarBgColor } from '@/lib/constants';
import {
    OPEN_ENDED_NOTICE_DAYS,
    formatLeaseDate,
    formatTenure,
    isOpenEnded,
    leaseEndState,
    tenureSinceLabel,
} from '@/lib/lease-term';
import { toast } from 'sonner';
import { useLanguageContext } from '@/context/LanguageContext';
import { formatPhMobile } from "@/lib/phone";

interface RenewalRequestItem {
    id: string;
    current_lease_id: string;
    status: 'pending' | 'approved' | 'rejected' | 'signed' | string;
    proposed_start_date?: string | null;
    proposed_end_date?: string | null;
    proposed_monthly_rent?: number | null;
    created_at?: string;
    landlord_notes?: string | null;
}

const RENEWAL_OPTIONS = [
    { months: 6, label: '6 Months', desc: 'Short-term extension' },
    { months: 12, label: '1 Year (12 Mos)', desc: 'Standard extension', popular: true },
    { months: 24, label: '2 Years (24 Mos)', desc: 'Long-term stability' },
];

export function TenantLeaseView() {
    const { t, locale, language } = useLanguageContext();
    const [lease, setLease] = useState<LeaseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [renewalRequest, setRenewalRequest] = useState<RenewalRequestItem | null>(null);

    // Modals
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [isRenewalSheetOpen, setIsRenewalSheetOpen] = useState(false);
    const [selectedTerm, setSelectedTerm] = useState<number>(12);
    const [submittingRenewal, setSubmittingRenewal] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [showAmenities, setShowAmenities] = useState(false);
    const [isAmenityDrawerOpen, setIsAmenityDrawerOpen] = useState(false);
    const [selectedAmenityId, setSelectedAmenityId] = useState<string | null>(null);
    const [isMoveOutDrawerOpen, setIsMoveOutDrawerOpen] = useState(false);
    const [moveOutStatus, setMoveOutStatus] = useState<string | null>(null);

    const fetchLeaseData = async () => {
        try {
            const [leaseRes, renewalsRes, moveOutRes] = await Promise.all([
                fetch('/api/tenant/lease', { cache: 'no-store' }),
                fetch('/api/tenant/renewals', { cache: 'no-store' }).catch(() => null),
                fetch('/api/tenant/lease/move-out/status', { cache: 'no-store' }).catch(() => null),
            ]);

            if (leaseRes.ok) {
                const leaseData = await leaseRes.json();
                if (leaseData.lease) {
                    setLease(leaseData.lease as LeaseData);

                    if (renewalsRes && renewalsRes.ok) {
                        const renewals = await renewalsRes.json();
                        if (Array.isArray(renewals)) {
                            const active = renewals.find((r: RenewalRequestItem) => 
                                r.current_lease_id === leaseData.lease.id && (r.status === 'pending' || r.status === 'approved')
                            ) || renewals.find((r: RenewalRequestItem) => r.current_lease_id === leaseData.lease.id);
                            setRenewalRequest(active || null);
                        }
                    }

                    if (moveOutRes && moveOutRes.ok) {
                        const moveOutData = await moveOutRes.json();
                        if (moveOutData?.hasRequest && moveOutData?.request) {
                            setMoveOutStatus(moveOutData.request.status);
                        } else {
                            setMoveOutStatus(null);
                        }
                    }
                } else {
                    setLease(null);
                }
            }
        } catch (err) {
            console.error('[TenantLeaseView] Error loading lease data:', err);
            toast.error(t('Unable to load lease details'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaseData();
    }, []);

    // Open-ended leases (the default) have no end date: tenure replaces the countdown and renewal never applies.
    const endState = useMemo(() => leaseEndState(lease), [lease]);
    const daysRemaining = Math.max(0, endState.daysLeft ?? 0);
    const isOpenEndedLease = endState.kind === 'open_ended';
    const isMovingOut = endState.kind === 'moving_out';
    // Month-to-month leases (with or without an agreed move-out) are never renewed.
    const isMonthToMonth = Boolean(lease) && isOpenEnded(lease);
    const isExpiringSoon = endState.kind === 'fixed' && endState.expiringSoon && daysRemaining > 0;
    const isExpired = endState.kind === 'ended';

    const formatCurrency = (amount?: number) => {
        if (amount === undefined || amount === null) return '₱0.00';
        return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return t('Not set');
        try {
            return new Date(dateStr).toLocaleDateString(locale, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const handleRenewalSubmit = async () => {
        if (!lease?.id) return;
        setSubmittingRenewal(true);
        triggerHaptic('medium');

        try {
            const res = await fetch(`/api/tenant/lease/${lease.id}/renew`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ term_months: selectedTerm }),
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(t('Renewal Request Failed'), {
                    description: data.error || t('Could not submit renewal request'),
                });
                return;
            }

            toast.success(t('Renewal Request Sent!'), {
                description: t('Your {months}-month extension request has been sent to your landlord.', { months: selectedTerm }),
            });

            setRenewalRequest({
                id: data.id || 'new',
                current_lease_id: lease.id,
                status: 'pending',
                created_at: new Date().toISOString(),
            });

            setIsRenewalSheetOpen(false);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('lease-renewal-submitted', { detail: { leaseId: lease.id } }));
            }
        } catch (err: any) {
            toast.error(t('Submission Error'), {
                description: err.message || t('Please check your connection'),
            });
        } finally {
            setSubmittingRenewal(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="size-10 rounded-full border-2 border-muted border-t-primary animate-spin" />
                <span className="text-xs text-muted-foreground font-medium">{t('Loading lease details…')}</span>
            </div>
        );
    }

    if (!lease) {
        return (
            <PullToRefresh onRefresh={fetchLeaseData}>
                <div className="p-4 flex flex-col items-center justify-center min-h-[65vh] text-center gap-4">
                    <div className="size-14 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center">
                        <FileText className="size-7" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-foreground">{t('No Active Lease Agreement')}</h2>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                            {t('You currently do not have an active lease agreement linked to this account. Contact your property manager if you believe this is an error.')}
                        </p>
                    </div>
                    <Link
                        href="/mobile/tenant/messages"
                        className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                        <MessageSquare className="size-4" />
                        <span>{t('Message Landlord')}</span>
                    </Link>
                </div>
        </PullToRefresh>
        );
    }

    return (
        <PullToRefresh onRefresh={fetchLeaseData}>
            <div className="flex flex-col gap-3 p-4 pb-12">
                {/* 1. Header / Hero Card */}
                <div className="rounded-2xl p-4 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 shadow-xs relative overflow-hidden">
                    <div className="flex items-start justify-between gap-3 relative z-10">
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider mb-1">
                                <Building2 className="size-3.5 shrink-0" />
                                <span className="truncate">{lease.unit?.property?.name || t('My Residence')}</span>
                            </div>
                            <h1 className="text-xl font-black text-foreground tracking-tight">
                                {lease.unit?.name ? t('Unit {unit}', { unit: lease.unit.name }) : t('Assigned Unit')}
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {lease.unit?.property?.address ? `${lease.unit.property.address}, ${lease.unit.property.city || ''}` : t('Property Address')}
                            </p>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 flex flex-col items-end gap-1">
                            {renewalRequest?.status === 'pending' ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                                    <Clock className="size-3" />
                                    <span>{t('In Review')}</span>
                                </span>
                            ) : isExpired ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center gap-1">
                                    <AlertTriangle className="size-3" />
                                    <span>{t('Expired')}</span>
                                </span>
                            ) : isMovingOut ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    <span>{t('Moving Out')}</span>
                                </span>
                            ) : isExpiringSoon ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                    <Clock className="size-3" />
                                    <span>{t('Expiring Soon')}</span>
                                </span>
                            ) : isOpenEndedLease ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                    <Home className="size-3" />
                                    <span>{t('Open-ended')}</span>
                                </span>
                            ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                    <CheckCircle2 className="size-3" />
                                    <span>{t('Active')}</span>
                                </span>
                            )}

                            <span className="text-[11px] font-bold text-muted-foreground text-right">
                                {isOpenEndedLease
                                    ? `${tenureSinceLabel(lease.start_date, language)} · ${formatTenure(lease.start_date, undefined, language)}`
                                    : isMovingOut
                                        ? daysRemaining === 0 ? t('Moving out today') : daysRemaining === 1 ? t('1 day to go') : t('{count} days to go', { count: daysRemaining })
                                        : isExpired
                                            ? t('Term Ended')
                                            : t('{count} days left', { count: daysRemaining })}
                            </span>
                        </div>
                    </div>

                    {/* Timeline Pill */}
                    <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{t('Start Date')}</span>
                            <span className="font-bold text-foreground text-xs">{formatDate(lease.start_date)}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                {isOpenEndedLease ? t('Term') : isMovingOut ? t('Move-out Date') : t('End Date')}
                            </span>
                            <span className="font-bold text-foreground text-xs">
                                {isOpenEndedLease ? t('Open-ended · month-to-month') : formatDate(lease.end_date)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Open-ended reassurance (no countdown, no renewal needed) */}
                {isOpenEndedLease && (
                    <div className="rounded-2xl p-3.5 bg-primary/5 border border-primary/20 flex items-start gap-2.5 shadow-xs" data-testid="open-ended-notice">
                        <Home className="size-4 text-primary shrink-0 mt-0.5" />
                        <div className="min-w-0 text-xs">
                            <h4 className="font-bold text-foreground">{t('No renewal needed')}</h4>
                            <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">
                                {t("Your lease is open-ended. You can stay for as long as rent is paid, and you can request a move-out at any time with {days} days' notice.", { days: OPEN_ENDED_NOTICE_DAYS })}
                            </p>
                        </div>
                    </div>
                )}

                {/* Agreed move-out (open-ended lease with an approved move-out date) */}
                {isMovingOut && (
                    <div className="rounded-2xl p-3.5 bg-blue-500/10 border border-blue-500/25 flex items-start gap-2.5 shadow-xs">
                        <Calendar className="size-4 text-blue-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 text-xs">
                            <h4 className="font-bold text-blue-600 dark:text-blue-400">{t('Moving out {date}', { date: formatLeaseDate(lease.end_date, undefined, language) })}</h4>
                            <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">
                                {t('Your move-out has been agreed. Keep rent current until then and complete the clearance checklist below.')}
                            </p>
                        </div>
                    </div>
                )}

                {/* 2. Pending Renewal Notice Banner (if active) */}
                {renewalRequest?.status === 'pending' && (
                    <div className="rounded-2xl p-3.5 bg-blue-500/10 border border-blue-500/25 flex items-start gap-2.5 shadow-xs">
                        <Clock className="size-4 text-blue-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 text-xs">
                            <h4 className="font-bold text-blue-600 dark:text-blue-400">{t('Lease Renewal Request Under Review')}</h4>
                            <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">
                                {t('Your renewal request submitted on {date} is being reviewed by your landlord.', { date: formatDate(renewalRequest.created_at) })}
                            </p>
                            {renewalRequest.landlord_notes && (
                                <div className="mt-1.5 p-2 rounded-lg bg-background/80 border border-border/40 text-[11px]">
                                    <span className="font-bold text-foreground">{t('Landlord note:')} </span>
                                    <span className="text-muted-foreground">{renewalRequest.landlord_notes}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. Expiring Soon Alert Banner (if within 90 days and not requested yet) */}
                {isExpiringSoon && renewalRequest?.status !== 'pending' && (
                    <div className="rounded-2xl p-3.5 bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <AlertTriangle className="size-4 text-amber-500 shrink-0" />
                            <div className="min-w-0">
                                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">{t('Lease Expiring in {count} Days', { count: daysRemaining })}</h4>
                                <p className="text-[11px] text-muted-foreground truncate">{t('Secure your room by requesting a renewal extension.')}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                setIsRenewalSheetOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold shrink-0 active:scale-95 transition-all shadow-xs cursor-pointer"
                        >
                            {t('Renew')}
                        </button>
                    </div>
                )}

                {/* 4. Financial Breakdown Card (Read-Only) */}
                <div className="rounded-2xl p-4 bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <ShieldCheck className="size-4" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                                {t('Rental & Financial Terms')}
                            </h3>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">{t('Read-Only')}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                {t('Monthly Rent')}
                            </span>
                            <span className="text-base font-black text-foreground mt-0.5 block">
                                {formatCurrency(lease.monthly_rent)}
                            </span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                                {t('Due Day {day} of month', { day: lease.terms?.rent_due_day || lease.terms?.due_day || 1 })}
                            </span>
                        </div>

                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                {t('Security Deposit')}
                            </span>
                            <span className="text-base font-black text-foreground mt-0.5 block">
                                {formatCurrency(lease.security_deposit)}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5 flex items-center gap-0.5">
                                <CheckCircle2 className="size-2.5 inline" />
                                <span>{t('Held by Landlord')}</span>
                            </span>
                        </div>
                    </div>

                    <div className="text-[11px] text-muted-foreground space-y-1 pt-1 border-t border-border/30">
                        <div className="flex items-center justify-between">
                            <span>{t('Grace Period:')}</span>
                            <span className="font-bold text-foreground">{t('{count} calendar days', { count: lease.terms?.grace_period_days ?? 5 })}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>{t('Late Penalty Fee:')}</span>
                            <span className="font-bold text-foreground">{formatCurrency(lease.terms?.late_fee ?? 250)}</span>
                        </div>
                    </div>
                </div>

                {/* 5. Unit Specifications Card (Read-Only) */}
                <div className="rounded-2xl p-4 bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
                                <Home className="size-4" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                                {t('Unit Specifications')}
                            </h3>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">{t('Room Specs')}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('Floor')}</span>
                            <span className="text-xs font-black text-foreground">{lease.unit?.floor ? t('Floor {floor}', { floor: lease.unit.floor }) : t('1st Floor')}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('Beds')}</span>
                            <span className="text-xs font-black text-foreground flex items-center gap-1">
                                <Bed className="size-3 text-muted-foreground" />
                                <span>{t('{count} Bed', { count: lease.unit?.beds ?? 1 })}</span>
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('Baths')}</span>
                            <span className="text-xs font-black text-foreground flex items-center gap-1">
                                <Bath className="size-3 text-muted-foreground" />
                                <span>{t('{count} Bath', { count: lease.unit?.baths ?? 1 })}</span>
                            </span>
                        </div>
                    </div>

                    {lease.unit?.sqft && (
                        <div className="text-[11px] text-muted-foreground flex items-center justify-between px-1 pt-1">
                            <span>{t('Estimated Area:')}</span>
                            <span className="font-bold text-foreground">{lease.unit.sqft} sq.m / sq.ft</span>
                        </div>
                    )}
                </div>

                {/* 6. Digital Contract Viewer Card */}
                <div className="rounded-2xl p-4 bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                                <FileText className="size-4" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                                    {t('Signed Contract')}
                                </h3>
                                <p className="text-[10px] text-muted-foreground">{t('Digital Agreement')}</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="size-2.5" />
                            <span>{t('Executed')}</span>
                        </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {t('Your agreement has been digitally signed by both you and your property manager. You can inspect the full terms or export as PDF below.')}
                    </p>

                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic('light');
                            setIsContractModalOpen(true);
                        }}
                        className="w-full py-2.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all border border-border/50 shadow-2xs cursor-pointer"
                    >
                        <FileText className="size-3.5 text-primary" />
                        <span>{t('View Full Contract Document')}</span>
                        <ArrowUpRight className="size-3.5 text-muted-foreground" />
                    </button>
                </div>

                {/* 7. Companion Actions (Renewal & Move-Out) */}
                <div className="rounded-2xl p-4 bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs space-y-2.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground mb-1">
                        {t('Lease Actions')}
                    </h3>

                    {/* Renewal Action Button (fixed-term only; open-ended leases never need renewing) */}
                    {isMonthToMonth && renewalRequest?.status !== 'pending' ? (
                        <div className="w-full p-3 rounded-xl bg-muted/40 border border-border/50 text-xs flex items-center gap-2.5">
                            <ShieldCheck className="size-4 text-primary shrink-0" />
                            <span className="text-muted-foreground">
                                <span className="font-bold text-foreground">{t('No renewal needed.')}</span>{' '}
                                {isMovingOut ? t('Your move-out date is already agreed.') : t('Your open-ended lease continues month to month.')}
                            </span>
                        </div>
                    ) : (
                    <button
                        type="button"
                        disabled={renewalRequest?.status === 'pending' || isExpired}
                        onClick={() => {
                            triggerHaptic('medium');
                            setIsRenewalSheetOpen(true);
                        }}
                        className={cn(
                            "w-full p-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer",
                            renewalRequest?.status === 'pending'
                                ? "bg-blue-500/10 text-blue-500 border border-blue-500/20 opacity-90 cursor-not-allowed"
                                : "bg-primary text-primary-foreground shadow-xs hover:brightness-105 active:scale-[0.98]"
                        )}
                    >
                        <div className="flex items-center gap-2.5">
                            <RefreshCw className={cn("size-4", renewalRequest?.status === 'pending' && "animate-spin")} />
                            <span>
                                {renewalRequest?.status === 'pending' 
                                    ? t('Renewal Request Under Review')
                                    : t('Request Lease Extension')}
                            </span>
                        </div>
                        <ArrowUpRight className="size-4" />
                    </button>
                    )}

                    {/* Move Out Action Card */}
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('medium');
                                setIsMoveOutDrawerOpen(true);
                            }}
                            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-card hover:bg-muted/40 transition-all flex items-center justify-between text-left cursor-pointer active:scale-98 shadow-2xs"
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "size-10 rounded-xl flex items-center justify-center shrink-0",
                                    moveOutStatus === 'pending' ? "bg-amber-500/10 text-amber-500" :
                                    moveOutStatus === 'approved' ? "bg-blue-500/10 text-blue-500" :
                                    moveOutStatus === 'completed' ? "bg-emerald-500/10 text-emerald-500" :
                                    "bg-rose-500/10 text-rose-500"
                                )}>
                                    <LogOut className="size-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-foreground">
                                        {moveOutStatus === 'pending' ? t('Move-Out: Pending Review') :
                                         moveOutStatus === 'approved' ? t('Move-Out: Approved') :
                                         moveOutStatus === 'completed' ? t('Move-Out: Completed') :
                                         moveOutStatus === 'denied' ? t('Move-Out: Denied') :
                                         t('Notice to Vacate')}
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        {moveOutStatus
                                            ? t('View clearance progress & checklist')
                                            : t('Initiate residency termination protocol')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                                <span>{moveOutStatus ? t('Status') : t('Request')}</span>
                                <ArrowUpRight className="size-3.5" />
                            </div>
                        </button>
                    </div>
                </div>

                {/* 8. Landlord / Property Manager Contact Card */}
                {lease.landlord && (
                    <div className="rounded-2xl p-4 bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs space-y-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                            {t('Property Manager')}
                        </span>

                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div 
                                    className="size-10 rounded-full flex items-center justify-center font-black text-sm text-foreground shrink-0 overflow-hidden border border-border/40"
                                    style={{ backgroundColor: getSafeAvatarBgColor(lease.landlord.avatar_bg_color) }}
                                >
                                    {lease.landlord.avatar_url ? (
                                        <Image
                                            src={lease.landlord.avatar_url}
                                            alt={lease.landlord.full_name}
                                            width={40}
                                            height={40}
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <span>{lease.landlord.full_name?.charAt(0) || 'L'}</span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-foreground truncate">
                                        {lease.landlord.full_name}
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                        {formatPhMobile(lease.landlord.phone) || lease.landlord.email || t('Contact Landlord')}
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/mobile/tenant/messages"
                                onClick={() => triggerHaptic('light')}
                                className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center gap-1 active:scale-95 transition-all hover:bg-primary/20 shrink-0"
                            >
                                <MessageSquare className="size-3.5" />
                                <span>{t('Message')}</span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* 9. House Rules & Amenities Collapsibles (Read-Only) */}
                <div className="space-y-2">
                    {lease.unit?.property?.house_rules && lease.unit.property.house_rules.length > 0 && (
                        <div className="rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-card/80 overflow-hidden shadow-xs">
                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic('light');
                                    setShowRules(!showRules);
                                }}
                                className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-foreground cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <Shield className="size-4 text-primary" />
                                    <span>{t('House Rules ({count})', { count: lease.unit.property.house_rules.length })}</span>
                                </div>
                                {showRules ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                            </button>
                            {showRules && (
                                <div className="px-4 pb-3.5 pt-1 border-t border-border/40 text-xs text-muted-foreground space-y-1.5">
                                    {lease.unit.property.house_rules.map((rule, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-[11px]">
                                            <span className="text-primary font-bold mt-0.5">•</span>
                                            <span className="leading-relaxed">{rule}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {lease.unit?.property?.amenities && lease.unit.property.amenities.length > 0 && (
                        <div className="rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-card/80 overflow-hidden shadow-xs">
                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic('light');
                                    setShowAmenities(!showAmenities);
                                }}
                                className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-foreground cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="size-4 text-amber-500" />
                                    <span>{t('Building Amenities ({count})', { count: lease.unit.property.amenities.length })}</span>
                                </div>
                                {showAmenities ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                            </button>
                            {showAmenities && (
                                <div className="px-4 pb-3.5 pt-1 border-t border-border/40 flex flex-col gap-2.5">
                                    <div className="flex flex-wrap gap-1.5">
                                        {lease.unit.property.amenities.map((amenity) => (
                                            <button
                                                key={amenity.id}
                                                type="button"
                                                onClick={() => {
                                                    triggerHaptic('light');
                                                    setSelectedAmenityId(amenity.id);
                                                    setIsAmenityDrawerOpen(true);
                                                }}
                                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-muted/60 hover:bg-muted text-foreground border border-border/40 active:scale-95 transition-all flex items-center gap-1"
                                            >
                                                <span>{amenity.name}</span>
                                                <ArrowUpRight className="size-2.5 text-muted-foreground" />
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic('medium');
                                            setSelectedAmenityId(null);
                                            setIsAmenityDrawerOpen(true);
                                        }}
                                        className="w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                                    >
                                        <Calendar className="size-3.5" />
                                        <span>Reserve Facility / View Schedule</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Radix Modal Contract Viewer */}
            {isContractModalOpen && lease && (
                <LeaseModal
                    open={isContractModalOpen}
                    onOpenChange={setIsContractModalOpen}
                    leaseData={lease}
                />
            )}

            {/* Mobile Bottom Sheet: Lease Renewal Intent (fixed-term leases only) */}
            {isRenewalSheetOpen && !isMonthToMonth && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
                    <div 
                        className="w-full max-w-lg bg-background border-t border-border/50 rounded-t-3xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-border/40">
                            <div className="flex items-center gap-2">
                                <RefreshCw className="size-4 text-primary" />
                                <h3 className="text-sm font-black text-foreground">{t('Request Lease Extension')}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsRenewalSheetOpen(false)}
                                aria-label={t('Close')}
                                className="size-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            {t('Choose your preferred extension period. Your request will be sent to the landlord for formal approval.')}
                        </p>

                        {/* Extension Options */}
                        <div className="space-y-2">
                            {RENEWAL_OPTIONS.map((opt) => (
                                <button
                                    key={opt.months}
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic('light');
                                        setSelectedTerm(opt.months);
                                    }}
                                    className={cn(
                                        "w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer",
                                        selectedTerm === opt.months
                                            ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/20"
                                            : "bg-card border-border hover:border-border/80"
                                    )}
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-foreground">{t(opt.label)}</span>
                                            {opt.popular && (
                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                                                    {t('Recommended')}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground block mt-0.5">{t(opt.desc)}</span>
                                    </div>
                                    <div className={cn(
                                        "size-4 rounded-full border flex items-center justify-center",
                                        selectedTerm === opt.months ? "border-primary bg-primary text-white" : "border-muted-foreground/40"
                                    )}>
                                        {selectedTerm === opt.months && <div className="size-1.5 rounded-full bg-white" />}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Confirmation Button */}
                        <div className="pt-2 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsRenewalSheetOpen(false)}
                                className="flex-1 py-2.5 rounded-xl border border-border bg-muted/40 text-foreground font-bold text-xs hover:bg-muted active:scale-[0.98] transition-all cursor-pointer"
                            >
                                {t('Cancel')}
                            </button>
                            <button
                                type="button"
                                disabled={submittingRenewal}
                                onClick={handleRenewalSubmit}
                                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                            >
                                {submittingRenewal ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>{t('Sending…')}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{t('Send Request')}</span>
                                        <ArrowUpRight className="size-3.5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Amenity Booking Drawer */}
            <MobileAmenityBookingDrawer
                isOpen={isAmenityDrawerOpen}
                onClose={() => {
                    setIsAmenityDrawerOpen(false);
                    setSelectedAmenityId(null);
                }}
                initialAmenityId={selectedAmenityId}
            />

            {/* Mobile Move-Out & Clearance Drawer */}
            <MobileMoveOutDrawer
                isOpen={isMoveOutDrawerOpen}
                onClose={() => setIsMoveOutDrawerOpen(false)}
                leaseEndDate={lease.end_date ?? null}
                onSubmitted={fetchLeaseData}
            />
        </PullToRefresh>
    );
}
