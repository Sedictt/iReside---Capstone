'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, 
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
import MoveOutRequest from '@/components/tenant/MoveOutRequest';
import { LeaseData } from '@/types/lease';
import { getSafeAvatarBgColor } from '@/lib/constants';
import { toast } from 'sonner';

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

    const fetchLeaseData = async () => {
        try {
            const [leaseRes, renewalsRes] = await Promise.all([
                fetch('/api/tenant/lease', { cache: 'no-store' }),
                fetch('/api/tenant/renewals', { cache: 'no-store' }).catch(() => null)
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
                } else {
                    setLease(null);
                }
            }
        } catch (err) {
            console.error('[TenantLeaseView] Error loading lease data:', err);
            toast.error('Unable to load lease details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaseData();
    }, []);

    // Days remaining calculation
    const daysRemaining = useMemo(() => {
        if (!lease?.end_date) return 0;
        const now = new Date();
        const end = new Date(lease.end_date);
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff);
    }, [lease?.end_date]);

    const isExpiringSoon = daysRemaining <= 90 && daysRemaining > 0;
    const isExpired = daysRemaining === 0 && Boolean(lease?.end_date);

    const formatCurrency = (amount?: number) => {
        if (amount === undefined || amount === null) return '₱0.00';
        return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return 'Not set';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
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
                toast.error('Renewal Request Failed', {
                    description: data.error || 'Could not submit renewal request',
                });
                return;
            }

            toast.success('Renewal Request Sent!', {
                description: `Your ${selectedTerm}-month extension request has been sent to your landlord.`,
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
            toast.error('Submission Error', {
                description: err.message || 'Please check your connection',
            });
        } finally {
            setSubmittingRenewal(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="size-10 rounded-full border-2 border-muted border-t-primary animate-spin" />
                <span className="text-xs text-muted-foreground font-medium">Loading lease details…</span>
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
                        <h2 className="text-base font-black text-foreground">No Active Lease Agreement</h2>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                            You currently do not have an active lease agreement linked to this account. Contact your property manager if you believe this is an error.
                        </p>
                    </div>
                    <Link
                        href="/mobile/tenant/messages"
                        className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                        <MessageSquare className="size-4" />
                        <span>Message Landlord</span>
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
                                <span className="truncate">{lease.unit?.property?.name || 'My Residence'}</span>
                            </div>
                            <h1 className="text-xl font-black text-foreground tracking-tight">
                                Unit {lease.unit?.name || 'Assigned'}
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {lease.unit?.property?.address ? `${lease.unit.property.address}, ${lease.unit.property.city || ''}` : 'Property Address'}
                            </p>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 flex flex-col items-end gap-1">
                            {renewalRequest?.status === 'pending' ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                                    <Clock className="size-3" />
                                    <span>In Review</span>
                                </span>
                            ) : isExpired ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center gap-1">
                                    <AlertTriangle className="size-3" />
                                    <span>Expired</span>
                                </span>
                            ) : isExpiringSoon ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                    <Clock className="size-3" />
                                    <span>Expiring Soon</span>
                                </span>
                            ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                    <CheckCircle2 className="size-3" />
                                    <span>Active</span>
                                </span>
                            )}

                            <span className="text-[11px] font-bold text-muted-foreground">
                                {isExpired ? 'Term Ended' : `${daysRemaining} days left`}
                            </span>
                        </div>
                    </div>

                    {/* Timeline Pill */}
                    <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Start Date</span>
                            <span className="font-bold text-foreground text-xs">{formatDate(lease.start_date)}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">End Date</span>
                            <span className="font-bold text-foreground text-xs">{formatDate(lease.end_date)}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Pending Renewal Notice Banner (if active) */}
                {renewalRequest?.status === 'pending' && (
                    <div className="rounded-2xl p-3.5 bg-blue-500/10 border border-blue-500/25 flex items-start gap-2.5 shadow-xs">
                        <Clock className="size-4 text-blue-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 text-xs">
                            <h4 className="font-bold text-blue-600 dark:text-blue-400">Lease Renewal Request Under Review</h4>
                            <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">
                                Your renewal request submitted on {formatDate(renewalRequest.created_at)} is being reviewed by your landlord.
                            </p>
                            {renewalRequest.landlord_notes && (
                                <div className="mt-1.5 p-2 rounded-lg bg-background/80 border border-border/40 text-[11px]">
                                    <span className="font-bold text-foreground">Landlord note: </span>
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
                                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">Lease Expiring in {daysRemaining} Days</h4>
                                <p className="text-[11px] text-muted-foreground truncate">Secure your room by requesting a renewal extension.</p>
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
                            Renew
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
                                Rental & Financial Terms
                            </h3>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">Read-Only</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                Monthly Rent
                            </span>
                            <span className="text-base font-black text-foreground mt-0.5 block">
                                {formatCurrency(lease.monthly_rent)}
                            </span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                                Due Day {lease.terms?.rent_due_day || lease.terms?.due_day || 1} of month
                            </span>
                        </div>

                        <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                Security Deposit
                            </span>
                            <span className="text-base font-black text-foreground mt-0.5 block">
                                {formatCurrency(lease.security_deposit)}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5 flex items-center gap-0.5">
                                <CheckCircle2 className="size-2.5 inline" />
                                <span>Held by Landlord</span>
                            </span>
                        </div>
                    </div>

                    <div className="text-[11px] text-muted-foreground space-y-1 pt-1 border-t border-border/30">
                        <div className="flex items-center justify-between">
                            <span>Grace Period:</span>
                            <span className="font-bold text-foreground">{lease.terms?.grace_period_days ?? 5} calendar days</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Late Penalty Fee:</span>
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
                                Unit Specifications
                            </h3>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">Room Specs</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Floor</span>
                            <span className="text-xs font-black text-foreground">{lease.unit?.floor ? `Floor ${lease.unit.floor}` : '1st Floor'}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Beds</span>
                            <span className="text-xs font-black text-foreground flex items-center gap-1">
                                <Bed className="size-3 text-muted-foreground" />
                                <span>{lease.unit?.beds ?? 1} Bed</span>
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Baths</span>
                            <span className="text-xs font-black text-foreground flex items-center gap-1">
                                <Bath className="size-3 text-muted-foreground" />
                                <span>{lease.unit?.baths ?? 1} Bath</span>
                            </span>
                        </div>
                    </div>

                    {lease.unit?.sqft && (
                        <div className="text-[11px] text-muted-foreground flex items-center justify-between px-1 pt-1">
                            <span>Estimated Area:</span>
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
                                    Signed Contract
                                </h3>
                                <p className="text-[10px] text-muted-foreground">Digital Agreement</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="size-2.5" />
                            <span>Executed</span>
                        </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Your agreement has been digitally signed by both you and your property manager. You can inspect the full terms or export as PDF below.
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
                        <span>View Full Contract Document</span>
                        <ArrowUpRight className="size-3.5 text-muted-foreground" />
                    </button>
                </div>

                {/* 7. Companion Actions (Renewal & Move-Out) */}
                <div className="rounded-2xl p-4 bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs space-y-2.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground mb-1">
                        Lease Actions
                    </h3>

                    {/* Renewal Action Button */}
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
                                    ? 'Renewal Request Under Review' 
                                    : 'Request Lease Extension'}
                            </span>
                        </div>
                        <ArrowUpRight className="size-4" />
                    </button>

                    {/* Move Out Trigger */}
                    <div className="pt-1">
                        <MoveOutRequest variant="hub" />
                    </div>
                </div>

                {/* 8. Landlord / Property Manager Contact Card */}
                {lease.landlord && (
                    <div className="rounded-2xl p-4 bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs space-y-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                            Property Manager
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
                                        {lease.landlord.phone || lease.landlord.email || 'Contact Landlord'}
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/mobile/tenant/messages"
                                onClick={() => triggerHaptic('light')}
                                className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center gap-1 active:scale-95 transition-all hover:bg-primary/20 shrink-0"
                            >
                                <MessageSquare className="size-3.5" />
                                <span>Message</span>
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
                                    <span>House Rules ({lease.unit.property.house_rules.length})</span>
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
                                    <span>Building Amenities ({lease.unit.property.amenities.length})</span>
                                </div>
                                {showAmenities ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                            </button>
                            {showAmenities && (
                                <div className="px-4 pb-3.5 pt-1 border-t border-border/40 flex flex-wrap gap-1.5">
                                    {lease.unit.property.amenities.map((amenity) => (
                                        <span
                                            key={amenity.id}
                                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-muted/60 text-foreground border border-border/40"
                                        >
                                            {amenity.name}
                                        </span>
                                    ))}
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

            {/* Mobile Bottom Sheet: Lease Renewal Intent */}
            {isRenewalSheetOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
                    <div 
                        className="w-full max-w-lg bg-background border-t border-border/50 rounded-t-3xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-border/40">
                            <div className="flex items-center gap-2">
                                <RefreshCw className="size-4 text-primary" />
                                <h3 className="text-sm font-black text-foreground">Request Lease Extension</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsRenewalSheetOpen(false)}
                                className="size-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Choose your preferred extension period. Your request will be sent to the landlord for formal approval.
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
                                            <span className="text-xs font-bold text-foreground">{opt.label}</span>
                                            {opt.popular && (
                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                                                    Recommended
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground block mt-0.5">{opt.desc}</span>
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
                                Cancel
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
                                        <span>Sending…</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Send Request</span>
                                        <ArrowUpRight className="size-3.5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PullToRefresh>
    );
}
