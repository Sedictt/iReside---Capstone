'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    FileCheck,
    Search,
    Phone,
    Mail,
    Building2,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    RefreshCw,
    X,
    ChevronRight,
    Check,
    Briefcase,
    DollarSign,
    Shield,
    FileText,
    ExternalLink,
    UserCheck,
    Sparkles
} from 'lucide-react';
import { useProperty } from '@/context/PropertyContext';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ApplicantData {
    name: string;
    email: string;
    phone: string;
    occupation: string;
    monthlyIncome: number | null;
    avatar?: string | null;
    avatarBgColor?: string | null;
}

interface ApplicationItem {
    id: string;
    source?: 'walk_in_application' | 'invite_link';
    applicant: ApplicantData;
    propertyName: string;
    propertyId?: string | null;
    unitNumber: string;
    requestedMoveIn: string | null;
    monthlyRent: number | null;
    status: 'pending' | 'reviewing' | 'payment_pending' | 'approved' | 'rejected' | 'withdrawn';
    submittedDate: string;
    notes?: string | null;
    documents?: string[];
    emergencyContact?: {
        name: string | null;
        phone: string | null;
    };
}

export function LandlordApplicationsView() {
    const router = useRouter();
    const { selectedPropertyId } = useProperty();

    const [applications, setApplications] = useState<ApplicationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [searchQuery, setSearchQuery] = useState('');

    // Detail & Decision state
    const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
    const [decisionMode, setDecisionMode] = useState<'approve' | 'reject' | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [submittingAction, setSubmittingAction] = useState(false);

    const fetchApplications = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedPropertyId && selectedPropertyId !== 'all') {
                params.set('propertyId', selectedPropertyId);
            }

            const res = await fetch(`/api/landlord/applications?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to load applications');
            const data = await res.json();
            setApplications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching landlord applications:', err);
            toast.error('Failed to load rental applications');
        } finally {
            setLoading(false);
        }
    }, [selectedPropertyId]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const formatCurrency = (amt?: number | null) => {
        if (typeof amt !== 'number') return '₱0.00';
        return `₱${amt.toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Calculate metrics
    const metrics = useMemo(() => {
        const total = applications.length;
        const pendingCount = applications.filter(a => a.status === 'pending' || a.status === 'reviewing').length;
        const approvedCount = applications.filter(a => a.status === 'approved' || a.status === 'payment_pending').length;
        const rejectedCount = applications.filter(a => a.status === 'rejected').length;
        return { total, pendingCount, approvedCount, rejectedCount };
    }, [applications]);

    // Filtered list
    const filteredApps = useMemo(() => {
        let list = applications;

        if (activeTab === 'pending') {
            list = list.filter(a => a.status === 'pending' || a.status === 'reviewing');
        } else if (activeTab === 'approved') {
            list = list.filter(a => a.status === 'approved' || a.status === 'payment_pending');
        } else if (activeTab === 'rejected') {
            list = list.filter(a => a.status === 'rejected');
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(a => {
                const nameMatch = (a.applicant?.name || '').toLowerCase().includes(q);
                const unitMatch = (a.unitNumber || '').toLowerCase().includes(q);
                const propMatch = (a.propertyName || '').toLowerCase().includes(q);
                const occMatch = (a.applicant?.occupation || '').toLowerCase().includes(q);
                return nameMatch || unitMatch || propMatch || occMatch;
            });
        }

        return list;
    }, [applications, activeTab, searchQuery]);

    // Handle Quick Approve
    const handleQuickApprove = async () => {
        if (!selectedApp) return;
        setSubmittingAction(true);
        triggerHaptic('medium');

        try {
            const res = await fetch(`/api/landlord/applications/${selectedApp.id}/quick-approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to approve application');
            }

            toast.success(`Application for ${selectedApp.applicant.name} approved!`);
            setSelectedApp(null);
            setDecisionMode(null);
            fetchApplications();
        } catch (err: any) {
            console.error('Approve error:', err);
            toast.error(err.message || 'Action failed');
        } finally {
            setSubmittingAction(false);
        }
    };

    // Handle Decline / Reject
    const handleReject = async () => {
        if (!selectedApp) return;
        setSubmittingAction(true);
        triggerHaptic('medium');

        try {
            const res = await fetch(`/api/landlord/applications/${selectedApp.id}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'rejected',
                    rejection_reason: rejectionReason.trim() || 'Application was not selected.'
                })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to decline application');
            }

            toast.success('Application declined.');
            setSelectedApp(null);
            setDecisionMode(null);
            setRejectionReason('');
            fetchApplications();
        } catch (err: any) {
            console.error('Reject error:', err);
            toast.error(err.message || 'Action failed');
        } finally {
            setSubmittingAction(false);
        }
    };

    return (
        <PullToRefresh onRefresh={fetchApplications}>
            <div className="flex flex-col gap-3.5 p-4 pb-20">
                {/* Property Scope & Refresh */}
                <div className="flex items-center justify-between gap-2">
                    <MobilePropertySelector className="flex-1" />
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            fetchApplications();
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-2xs"
                        aria-label="Refresh applications"
                    >
                        <RefreshCw className={cn("size-4", loading && "animate-spin text-primary")} />
                    </button>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-4 gap-2">
                    <div 
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('pending');
                        }}
                        className={cn(
                            "p-2.5 rounded-2xl border flex flex-col justify-between cursor-pointer active:scale-97 transition-all",
                            metrics.pendingCount > 0
                                ? "bg-amber-500/10 border-amber-500/30"
                                : "bg-card border-slate-200 dark:border-white/10"
                        )}
                    >
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending</span>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-black text-foreground mt-0.5">{metrics.pendingCount}</span>
                            {metrics.pendingCount > 0 && (
                                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                            )}
                        </div>
                    </div>

                    <div 
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('approved');
                        }}
                        className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between cursor-pointer active:scale-97 transition-all"
                    >
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Approved</span>
                        <span className="text-lg font-black text-foreground mt-0.5">{metrics.approvedCount}</span>
                    </div>

                    <div 
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('rejected');
                        }}
                        className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col justify-between cursor-pointer active:scale-97 transition-all"
                    >
                        <span className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Declined</span>
                        <span className="text-lg font-black text-foreground mt-0.5">{metrics.rejectedCount}</span>
                    </div>

                    <div 
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('all');
                        }}
                        className="p-2.5 rounded-2xl bg-card border border-slate-200 dark:border-white/10 flex flex-col justify-between cursor-pointer active:scale-97 transition-all"
                    >
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total</span>
                        <span className="text-lg font-black text-foreground mt-0.5">{metrics.total}</span>
                    </div>
                </div>

                {/* Live Search Input */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search applicant, unit, or occupation..."
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
                            setActiveTab('pending');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center relative",
                            activeTab === 'pending'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Pending
                        {metrics.pendingCount > 0 && (
                            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-black">
                                {metrics.pendingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('approved');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeTab === 'approved'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Approved
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('rejected');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeTab === 'rejected'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Declined
                    </button>
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
                        All ({applications.length})
                    </button>
                </div>

                {/* Applications Roster */}
                <div className="space-y-3">
                    {filteredApps.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl bg-card border border-slate-200 dark:border-white/10 flex flex-col items-center gap-2.5">
                            <FileCheck className="size-10 text-muted-foreground/40 stroke-1" />
                            <h4 className="text-sm font-bold text-foreground">No Applications</h4>
                            <p className="text-xs text-muted-foreground max-w-xs">
                                {searchQuery ? 'No applicants match your search filter.' : 'No applications found in this tab.'}
                            </p>
                        </div>
                    ) : (
                        filteredApps.map((app) => {
                            const isPending = app.status === 'pending' || app.status === 'reviewing';
                            const isApproved = app.status === 'approved' || app.status === 'payment_pending';
                            const isRejected = app.status === 'rejected';

                            const income = app.applicant?.monthlyIncome || 0;
                            const rent = app.monthlyRent || 0;
                            const incomeRatio = rent > 0 && income > 0 ? (income / rent).toFixed(1) : null;

                            return (
                                <div
                                    key={app.id}
                                    className={cn(
                                        "rounded-2xl p-4 bg-card border shadow-xs transition-all flex flex-col gap-3",
                                        isPending
                                            ? "border-amber-500/40 hover:border-amber-500/60"
                                            : isApproved
                                            ? "border-emerald-500/30"
                                            : "border-slate-200 dark:border-white/10 opacity-80"
                                    )}
                                >
                                    {/* Header Row */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div 
                                            onClick={() => {
                                                triggerHaptic('light');
                                                setSelectedApp(app);
                                            }}
                                            className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                                        >
                                            <div 
                                                className="size-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200 dark:border-white/10"
                                                style={{ backgroundColor: app.applicant?.avatarBgColor || '#e2e8f0' }}
                                            >
                                                <span className="text-slate-800">
                                                    {(app.applicant?.name || 'A').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-black text-foreground truncate">
                                                    {app.applicant?.name || 'Prospective Tenant'}
                                                </h3>
                                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 truncate">
                                                    <span className="font-bold text-foreground">
                                                        Unit {app.unitNumber}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="truncate">{app.propertyName}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <span className={cn(
                                            "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0",
                                            isPending
                                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                                : isApproved
                                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                : "bg-red-500/15 text-red-600 dark:text-red-400"
                                        )}>
                                            {app.status}
                                        </span>
                                    </div>

                                    {/* Snapshot Metrics */}
                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs">
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block font-bold uppercase">Occupation</span>
                                            <span className="font-semibold text-foreground truncate max-w-[110px] block">
                                                {app.applicant?.occupation || 'Not stated'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block font-bold uppercase">Income</span>
                                            <span className="font-bold text-foreground">
                                                {formatCurrency(app.applicant?.monthlyIncome)}
                                                {incomeRatio ? <span className="text-[10px] text-emerald-600 ml-1">({incomeRatio}x)</span> : null}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block font-bold uppercase">Submitted</span>
                                            <span className="font-semibold text-muted-foreground">
                                                {formatDate(app.submittedDate)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quick Actions Footer */}
                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                                        <button
                                            onClick={() => {
                                                triggerHaptic('light');
                                                setSelectedApp(app);
                                            }}
                                            className="text-xs font-bold text-primary flex items-center gap-1 active:scale-95 transition-all"
                                        >
                                            Review Dossier
                                            <ChevronRight className="size-3.5" />
                                        </button>

                                        <div className="flex items-center gap-1.5">
                                            {isPending && (
                                                <button
                                                    onClick={() => {
                                                        triggerHaptic('medium');
                                                        setSelectedApp(app);
                                                        setDecisionMode('approve');
                                                    }}
                                                    className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all shadow-xs"
                                                >
                                                    <Check className="size-3" />
                                                    Approve
                                                </button>
                                            )}

                                            {app.applicant?.phone && (
                                                <a
                                                    href={`tel:${app.applicant.phone}`}
                                                    onClick={() => triggerHaptic('light')}
                                                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                                                    aria-label="Call applicant"
                                                >
                                                    <Phone className="size-3.5" />
                                                </a>
                                            )}
                                            {app.applicant?.email && (
                                                <a
                                                    href={`mailto:${app.applicant.email}`}
                                                    onClick={() => triggerHaptic('light')}
                                                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                                                    aria-label="Email applicant"
                                                >
                                                    <Mail className="size-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* DOSSIER & DECISION DRAWER */}
                {selectedApp && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                        <div className="w-full sm:max-w-md max-h-[85vh] bg-background rounded-t-3xl sm:rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xl flex flex-col gap-4 overflow-y-auto animate-in slide-in-from-bottom duration-200">
                            {/* Drawer Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="size-12 rounded-full flex items-center justify-center font-bold text-base shrink-0 border border-slate-200 dark:border-white/10"
                                        style={{ backgroundColor: selectedApp.applicant?.avatarBgColor || '#e2e8f0' }}
                                    >
                                        <span className="text-slate-800">
                                            {(selectedApp.applicant?.name || 'A').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-foreground">
                                            {selectedApp.applicant?.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Unit {selectedApp.unitNumber} • {selectedApp.propertyName}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedApp(null);
                                        setDecisionMode(null);
                                    }}
                                    className="p-1.5 rounded-full text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Contact Triggers */}
                            <div className="grid grid-cols-2 gap-2">
                                {selectedApp.applicant?.phone && (
                                    <a
                                        href={`tel:${selectedApp.applicant.phone}`}
                                        onClick={() => triggerHaptic('light')}
                                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center gap-2 text-xs font-bold text-foreground active:scale-98 transition-all"
                                    >
                                        <Phone className="size-4 text-emerald-500" />
                                        Call ({selectedApp.applicant.phone})
                                    </a>
                                )}
                                {selectedApp.applicant?.email && (
                                    <a
                                        href={`mailto:${selectedApp.applicant.email}`}
                                        onClick={() => triggerHaptic('light')}
                                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center gap-2 text-xs font-bold text-foreground active:scale-98 transition-all"
                                    >
                                        <Mail className="size-4 text-blue-500" />
                                        Send Email
                                    </a>
                                )}
                            </div>

                            {/* Financial & Tenancy Request */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 space-y-2 text-xs">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                    Application Profile
                                </span>
                                <div className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-white/5">
                                    <span className="text-muted-foreground">Occupation:</span>
                                    <span className="font-semibold text-foreground">
                                        {selectedApp.applicant?.occupation || 'Not stated'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-white/5">
                                    <span className="text-muted-foreground">Monthly Income:</span>
                                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(selectedApp.applicant?.monthlyIncome)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-white/5">
                                    <span className="text-muted-foreground">Target Monthly Rent:</span>
                                    <span className="font-black text-foreground">
                                        {formatCurrency(selectedApp.monthlyRent)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-white/5">
                                    <span className="text-muted-foreground">Requested Move-in:</span>
                                    <span className="font-semibold text-foreground">
                                        {formatDate(selectedApp.requestedMoveIn)}
                                    </span>
                                </div>
                                {selectedApp.emergencyContact?.name && (
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-muted-foreground">Emergency Contact:</span>
                                        <span className="font-semibold text-foreground">
                                            {selectedApp.emergencyContact.name} ({selectedApp.emergencyContact.phone || 'N/A'})
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Rejection Form Mode */}
                            {decisionMode === 'reject' && (
                                <div className="space-y-1.5 animate-in fade-in duration-150">
                                    <label className="text-xs font-bold text-muted-foreground">
                                        Reason for Declining (Sent to Applicant)
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows={3}
                                        placeholder="e.g., Unit is currently under exclusive hold, or income requirements not met."
                                        className="w-full p-3 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            )}

                            {/* Decision Actions */}
                            {(selectedApp.status === 'pending' || selectedApp.status === 'reviewing') && (
                                <div className="flex items-center gap-2 pt-2">
                                    {decisionMode === 'reject' ? (
                                        <>
                                            <button
                                                disabled={submittingAction}
                                                onClick={() => setDecisionMode(null)}
                                                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-98 transition-all"
                                            >
                                                Back
                                            </button>
                                            <button
                                                disabled={submittingAction}
                                                onClick={handleReject}
                                                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                            >
                                                {submittingAction ? <RefreshCw className="size-4 animate-spin" /> : 'Confirm Decline'}
                                            </button>
                                        </>
                                    ) : decisionMode === 'approve' ? (
                                        <>
                                            <button
                                                disabled={submittingAction}
                                                onClick={() => setDecisionMode(null)}
                                                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-98 transition-all"
                                            >
                                                Back
                                            </button>
                                            <button
                                                disabled={submittingAction}
                                                onClick={handleQuickApprove}
                                                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                            >
                                                {submittingAction ? <RefreshCw className="size-4 animate-spin" /> : 'Confirm Approval'}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    triggerHaptic('medium');
                                                    setDecisionMode('approve');
                                                }}
                                                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-xs"
                                            >
                                                <Check className="size-4" />
                                                Quick Approve
                                            </button>
                                            <button
                                                onClick={() => {
                                                    triggerHaptic('light');
                                                    setDecisionMode('reject');
                                                }}
                                                className="py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold active:scale-98 transition-all"
                                            >
                                                Decline
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </PullToRefresh>
    );
}
