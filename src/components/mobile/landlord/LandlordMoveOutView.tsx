'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    DoorOpen,
    Search,
    Phone,
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
    Check,
    ClipboardCheck,
    DollarSign,
    Shield,
    Sparkles,
    Key,
    Home,
    Trash2
} from 'lucide-react';
import { useProperty } from '@/context/PropertyContext';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MoveOutRequestItem {
    id: string;
    lease_id: string;
    landlord_id: string;
    intended_move_out_date: string;
    reason: string;
    status: 'pending' | 'approved' | 'denied' | 'completed';
    created_at: string;
    inspection_date?: string | null;
    inspection_notes?: string | null;
    deductions?: number | null;
    lease?: {
        id: string;
        monthly_rent: number;
        security_deposit: number;
        start_date: string;
        end_date: string;
        unit?: {
            name: string;
            property?: {
                id: string;
                name: string;
                address: string;
            };
        };
        tenant?: {
            id: string;
            full_name: string;
            email: string;
            phone: string;
        };
    };
}

const CHECKLIST_ITEMS = [
    { id: 'keys', label: 'Key & Access Handover', description: 'All unit keys, fobs, and gate openers returned' },
    { id: 'walls', label: 'Walls & Paint Condition', description: 'No major holes, unauthorized paint, or water damage' },
    { id: 'appliances', label: 'Appliances & Electrical', description: 'Air conditioning, lights, and outlets operational' },
    { id: 'plumbing', label: 'Plumbing & Bathroom', description: 'No active leaks, faucets and toilet functioning' },
    { id: 'cleanliness', label: 'Cleanliness & Trash Cleared', description: 'Unit cleaned and all personal belongings removed' },
];

export function LandlordMoveOutView() {
    const router = useRouter();
    const { selectedPropertyId } = useProperty();

    const [requests, setRequests] = useState<MoveOutRequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'completed' | 'all'>('pending');
    const [searchQuery, setSearchQuery] = useState('');

    // Inspection Drawer State
    const [activeInspectionReq, setActiveInspectionReq] = useState<MoveOutRequestItem | null>(null);
    const [checklistState, setChecklistState] = useState<Record<string, boolean>>({
        keys: true,
        walls: true,
        appliances: true,
        plumbing: true,
        cleanliness: true,
    });
    const [inspectionNotes, setInspectionNotes] = useState('');
    const [deductionAmount, setDeductionAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/landlord/move-out');
            if (!res.ok) throw new Error('Failed to load move-out requests');
            const data = await res.json();
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching move-out requests:', err);
            toast.error('Failed to load move-out notices');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

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
        const total = requests.length;
        const pendingCount = requests.filter(r => r.status === 'pending').length;
        const approvedCount = requests.filter(r => r.status === 'approved').length;
        const completedCount = requests.filter(r => r.status === 'completed').length;
        return { total, pendingCount, approvedCount, completedCount };
    }, [requests]);

    // Filtered requests
    const filteredRequests = useMemo(() => {
        let list = requests;

        if (activeTab === 'pending') {
            list = list.filter(r => r.status === 'pending');
        } else if (activeTab === 'approved') {
            list = list.filter(r => r.status === 'approved');
        } else if (activeTab === 'completed') {
            list = list.filter(r => r.status === 'completed');
        }

        if (selectedPropertyId && selectedPropertyId !== 'all') {
            list = list.filter(r => r.lease?.unit?.property?.id === selectedPropertyId);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(r => {
                const tenantName = (r.lease?.tenant?.full_name || '').toLowerCase();
                const unitName = (r.lease?.unit?.name || '').toLowerCase();
                const propName = (r.lease?.unit?.property?.name || '').toLowerCase();
                const reason = (r.reason || '').toLowerCase();
                return tenantName.includes(q) || unitName.includes(q) || propName.includes(q) || reason.includes(q);
            });
        }

        return list;
    }, [requests, activeTab, selectedPropertyId, searchQuery]);

    // Handle Quick Notice Approval (Schedule Inspection)
    const handleApproveNotice = async (req: MoveOutRequestItem) => {
        triggerHaptic('medium');
        setSubmitting(true);
        try {
            const res = await fetch(`/api/landlord/move-out/${req.id}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inspection_date: req.intended_move_out_date }),
            });

            if (!res.ok) throw new Error('Failed to approve move-out notice');
            toast.success('Move-out notice acknowledged and scheduled.');
            fetchRequests();
        } catch (err: any) {
            toast.error(err.message || 'Action failed');
        } finally {
            setSubmitting(false);
        }
    };

    // Open Walkthrough Inspection Drawer
    const openInspectionDrawer = (req: MoveOutRequestItem) => {
        triggerHaptic('light');
        setActiveInspectionReq(req);
        setInspectionNotes(req.inspection_notes || '');
        setDeductionAmount(req.deductions ? String(req.deductions) : '');
    };

    // Submit Inspection & Finalize
    const handleFinalizeMoveOut = async () => {
        if (!activeInspectionReq) return;
        setSubmitting(true);
        triggerHaptic('medium');

        try {
            const deductionVal = parseFloat(deductionAmount) || 0;
            const depositVal = activeInspectionReq.lease?.security_deposit || 0;
            const refundVal = Math.max(0, depositVal - deductionVal);

            // 1. Submit Inspection details
            await fetch(`/api/landlord/move-out/${activeInspectionReq.id}/inspection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inspection_date: new Date().toISOString().split('T')[0],
                    inspection_notes: inspectionNotes.trim() || 'Walkthrough completed via mobile.',
                    checklist_data: checklistState,
                    deposit_deductions: deductionVal,
                    deposit_refund_amount: refundVal,
                }),
            });

            // 2. Finalize move-out and release unit
            const completeRes = await fetch(`/api/landlord/move-out/${activeInspectionReq.id}/complete`, {
                method: 'PUT',
            });

            if (!completeRes.ok) {
                const data = await completeRes.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to complete move-out');
            }

            toast.success('Inspection complete! Unit has been marked as Vacant.');
            setActiveInspectionReq(null);
            fetchRequests();
        } catch (err: any) {
            console.error('Error completing move-out:', err);
            toast.error(err.message || 'Failed to complete move-out');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PullToRefresh onRefresh={fetchRequests}>
            <div className="flex flex-col gap-3.5 p-4 pb-20">
                {/* Property Scope & Refresh */}
                <div className="flex items-center justify-between gap-2">
                    <MobilePropertySelector className="flex-1" />
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            fetchRequests();
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-2xs"
                        aria-label="Refresh move-out notices"
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
                        className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col justify-between cursor-pointer active:scale-97 transition-all"
                    >
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Inspect</span>
                        <span className="text-lg font-black text-foreground mt-0.5">{metrics.approvedCount}</span>
                    </div>

                    <div 
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('completed');
                        }}
                        className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between cursor-pointer active:scale-97 transition-all"
                    >
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Done</span>
                        <span className="text-lg font-black text-foreground mt-0.5">{metrics.completedCount}</span>
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
                        placeholder="Search tenant, unit, or move-out reason..."
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
                        Inspection
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('completed');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeTab === 'completed'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Completed
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
                        All ({requests.length})
                    </button>
                </div>

                {/* Move-Out Requests List */}
                <div className="space-y-3">
                    {filteredRequests.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl bg-card border border-slate-200 dark:border-white/10 flex flex-col items-center gap-2.5">
                            <DoorOpen className="size-10 text-muted-foreground/40 stroke-1" />
                            <h4 className="text-sm font-bold text-foreground">No Move-Out Notices</h4>
                            <p className="text-xs text-muted-foreground max-w-xs">
                                {searchQuery ? 'No move-out requests match your search.' : 'All units in this tab are settled.'}
                            </p>
                        </div>
                    ) : (
                        filteredRequests.map((req) => {
                            const isPending = req.status === 'pending';
                            const isApproved = req.status === 'approved';
                            const isDone = req.status === 'completed';

                            return (
                                <div
                                    key={req.id}
                                    className={cn(
                                        "rounded-2xl p-4 bg-card border shadow-xs transition-all flex flex-col gap-3",
                                        isPending
                                            ? "border-amber-500/40"
                                            : isApproved
                                            ? "border-blue-500/40"
                                            : "border-slate-200 dark:border-white/10 opacity-80"
                                    )}
                                >
                                    {/* Header Row */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                                                <Building2 className="size-3" />
                                                <span>{req.lease?.unit?.property?.name || 'Property'}</span>
                                            </div>
                                            <h3 className="text-sm font-black text-foreground mt-0.5">
                                                Unit {req.lease?.unit?.name || 'N/A'}
                                            </h3>
                                            <p className="text-xs font-semibold text-foreground/90 mt-0.5">
                                                Tenant: {req.lease?.tenant?.full_name || 'Occupant'}
                                            </p>
                                        </div>

                                        <span className={cn(
                                            "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0",
                                            isPending
                                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                                : isApproved
                                                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                        )}>
                                            {isPending ? 'Pending Notice' : isApproved ? 'Scheduled Walkthrough' : 'Turnover Done'}
                                        </span>
                                    </div>

                                    {/* Snapshot Box */}
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 space-y-2 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase">Target Move-Out</span>
                                            <span className="font-bold text-foreground">
                                                {formatDate(req.intended_move_out_date)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase">Security Deposit Held</span>
                                            <span className="font-semibold text-foreground">
                                                {formatCurrency(req.lease?.security_deposit)}
                                            </span>
                                        </div>
                                        {req.reason && (
                                            <div className="pt-1 border-t border-slate-200/40 dark:border-white/5 text-[11px] text-muted-foreground">
                                                <span className="font-semibold text-foreground">Reason: </span>
                                                {req.reason}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Row */}
                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                                        {isPending ? (
                                            <button
                                                disabled={submitting}
                                                onClick={() => handleApproveNotice(req)}
                                                className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
                                            >
                                                <Check className="size-3.5" />
                                                Acknowledge & Schedule
                                            </button>
                                        ) : isApproved ? (
                                            <button
                                                onClick={() => openInspectionDrawer(req)}
                                                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
                                            >
                                                <ClipboardCheck className="size-3.5" />
                                                Conduct Walkthrough
                                            </button>
                                        ) : (
                                            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                                                <CheckCircle2 className="size-3.5 text-emerald-500" />
                                                Unit Vacated
                                            </span>
                                        )}

                                        <div className="flex items-center gap-1.5">
                                            {req.lease?.tenant?.phone && (
                                                <a
                                                    href={`tel:${req.lease.tenant.phone}`}
                                                    onClick={() => triggerHaptic('light')}
                                                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                                                    aria-label="Call tenant"
                                                >
                                                    <Phone className="size-3.5" />
                                                </a>
                                            )}
                                            {req.lease?.tenant?.id && (
                                                <Link
                                                    href={`/mobile/landlord/messages?tenantId=${req.lease.tenant.id}`}
                                                    onClick={() => triggerHaptic('light')}
                                                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                                                    aria-label="Message tenant"
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

                {/* WALKTHROUGH INSPECTION DRAWER */}
                {activeInspectionReq && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                        <div className="w-full sm:max-w-md max-h-[88vh] bg-background rounded-t-3xl sm:rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xl flex flex-col gap-4 overflow-y-auto animate-in slide-in-from-bottom duration-200">
                            {/* Drawer Header */}
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider">
                                        <ClipboardCheck className="size-3.5" />
                                        <span>Turnkey Inspection</span>
                                    </div>
                                    <h3 className="text-base font-black text-foreground mt-0.5">
                                        Unit {activeInspectionReq.lease?.unit?.name} Walkthrough
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Tenant: {activeInspectionReq.lease?.tenant?.full_name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveInspectionReq(null)}
                                    className="p-1.5 rounded-full text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Checklist Section */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Condition Checklist
                                </span>
                                <div className="space-y-2">
                                    {CHECKLIST_ITEMS.map((item) => {
                                        const checked = checklistState[item.id] ?? false;
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    triggerHaptic('light');
                                                    setChecklistState(prev => ({ ...prev, [item.id]: !checked }));
                                                }}
                                                className={cn(
                                                    "p-3 rounded-xl border flex items-start gap-3 cursor-pointer active:scale-98 transition-all",
                                                    checked
                                                        ? "bg-emerald-500/5 border-emerald-500/25"
                                                        : "bg-red-500/5 border-red-500/25"
                                                )}
                                            >
                                                <div className={cn(
                                                    "size-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-white transition-colors",
                                                    checked ? "bg-emerald-500" : "bg-red-500"
                                                )}>
                                                    {checked ? <Check className="size-3.5 stroke-[3]" /> : <X className="size-3.5 stroke-[3]" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-xs font-bold text-foreground block">
                                                        {item.label}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                                                        {item.description}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Deductions & Security Deposit Calculator */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 space-y-2.5 text-xs">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Deposit Settlement
                                </span>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Original Deposit Held:</span>
                                    <span className="font-bold text-foreground">
                                        {formatCurrency(activeInspectionReq.lease?.security_deposit)}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-muted-foreground block">
                                        Repair / Cleaning Deductions (₱):
                                    </label>
                                    <input
                                        type="number"
                                        value={deductionAmount}
                                        onChange={(e) => setDeductionAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full p-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div className="flex justify-between items-center pt-1 border-t border-slate-200/40 dark:border-white/5">
                                    <span className="font-semibold text-foreground">Est. Refund to Tenant:</span>
                                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(
                                            Math.max(0, (activeInspectionReq.lease?.security_deposit || 0) - (parseFloat(deductionAmount) || 0))
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Inspection Notes */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">
                                    Walkthrough Notes
                                </label>
                                <textarea
                                    value={inspectionNotes}
                                    onChange={(e) => setInspectionNotes(e.target.value)}
                                    rows={2}
                                    placeholder="e.g. Unit in good condition, slight wear on bedroom wall."
                                    className="w-full p-3 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            {/* Decision Buttons */}
                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    disabled={submitting}
                                    onClick={() => setActiveInspectionReq(null)}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-98 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={submitting}
                                    onClick={handleFinalizeMoveOut}
                                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                >
                                    {submitting ? (
                                        <RefreshCw className="size-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="size-4" />
                                            Complete & Release Unit
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PullToRefresh>
    );
}
