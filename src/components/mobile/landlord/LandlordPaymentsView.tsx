'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useProperty } from '@/context/PropertyContext';
import Image from 'next/image';
import { 
    CreditCard, 
    Search, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Maximize2, 
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobileConfirmModal } from '@/components/mobile/shared/MobileConfirmModal';
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector';

interface InvoiceItem {
    id: string;
    invoiceNumber?: string;
    tenantName: string;
    unitNumber: string;
    propertyName?: string;
    amount: number;
    status: string;
    dueDate: string;
    paymentProofUrl?: string | null;
    createdAt?: string;
    notes?: string;
}

export function LandlordPaymentsView() {
    const { selectedPropertyId } = useProperty();
    const searchParams = useSearchParams();
    const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'proofs' | 'overdue' | 'paid'>('all');

    useEffect(() => {
        const s = searchParams?.get('search') || searchParams?.get('id') || searchParams?.get('paymentId');
        const t = searchParams?.get('tab');
        if (s) {
            setSearchQuery(s);
        }
        if (t && ['all', 'proofs', 'overdue', 'paid'].includes(t)) {
            setActiveTab(t as any);
        }
    }, [searchParams]);
    
    // Lightbox state for inspecting payment proof receipts
    const [inspectInvoice, setInspectInvoice] = useState<InvoiceItem | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [pendingReview, setPendingReview] = useState<{ invoice: InvoiceItem; action: 'confirm' | 'reject' } | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchInvoices = async () => {
        try {
            const queryParam = selectedPropertyId && selectedPropertyId !== 'all' 
                ? `?propertyId=${selectedPropertyId}` 
                : '';
            const res = await fetch(`/api/landlord/invoices${queryParam}`);
            if (res.ok) {
                const data = await res.json();
                const rawList = Array.isArray(data) ? data : Array.isArray(data?.invoices) ? data.invoices : [];
                const formattedInvoices: InvoiceItem[] = rawList.map((inv: any) => ({
                    id: inv.id,
                    invoiceNumber: inv.invoiceNumber || inv.invoice_number,
                    tenantName: inv.tenantName || inv.tenant || 'Unknown tenant',
                    unitNumber: inv.unitNumber || inv.unit || 'N/A',
                    propertyName: inv.propertyName || inv.property,
                    amount: Number(inv.amount || 0),
                    status: (inv.status || 'pending').toLowerCase(),
                    dueDate: inv.dueDate || inv.due_date || '',
                    paymentProofUrl: inv.paymentProofUrl || inv.payment_proof_url || null,
                    createdAt: inv.createdAt || inv.issuedDate || inv.created_at,
                    notes: inv.notes || inv.type,
                }));
                setInvoices(formattedInvoices);
            }
        } catch (err) {
            console.error('[MobilePayments] Failed to fetch invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchInvoices();
    }, [selectedPropertyId]);

    // Filter logic
    const pendingProofsCount = useMemo(() => {
        return invoices.filter(inv => 
            (inv.status === 'pending' || inv.status === 'under_review' || inv.status === 'intent_submitted') && 
            Boolean(inv.paymentProofUrl)
        ).length;
    }, [invoices]);

    const filteredInvoices = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return invoices.filter((inv) => {
            // Instant search filter on any character typed
            if (q) {
                const matchesSearch = 
                    (inv.id || '').toLowerCase().includes(q) ||
                    (inv.tenantName || '').toLowerCase().includes(q) ||
                    (inv.unitNumber || '').toLowerCase().includes(q) ||
                    (inv.invoiceNumber || '').toLowerCase().includes(q) ||
                    (inv.status || '').toLowerCase().includes(q) ||
                    String(inv.amount || '').includes(q);
                if (!matchesSearch) return false;
            }

            // Tab filter
            if (activeTab === 'proofs') {
                return (inv.status === 'pending' || inv.status === 'under_review' || inv.status === 'intent_submitted') && Boolean(inv.paymentProofUrl);
            }
            if (activeTab === 'overdue') {
                return inv.status === 'overdue';
            }
            if (activeTab === 'paid') {
                return inv.status === 'paid' || inv.status === 'completed' || inv.status === 'confirmed';
            }
            return true; // 'all'
        });
    }, [invoices, searchQuery, activeTab]);

    // Handle review (approve / reject)
    const handleReviewPayment = async (invoiceId: string, action: 'confirm' | 'reject', reason?: string) => {
        setProcessingId(invoiceId);
        setActionMessage(null);
        try {
            const res = await fetch(`/api/landlord/invoices/${invoiceId}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    note: action === 'confirm' ? 'Approved via iReside Mobile' : reason || 'Payment rejected via mobile',
                    rejectionReason: action === 'reject' ? (reason || 'Invalid payment receipt') : undefined,
                    nonExactAction: action === 'confirm' ? 'accept_partial' : 'reject',
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to review payment.');
            }

            setActionMessage({
                type: 'success',
                text: action === 'confirm' ? 'Payment approved successfully!' : 'Payment marked as rejected.',
            });
            setInspectInvoice(null);
            setPendingReview(null);
            fetchInvoices();
        } catch (err: any) {
            setActionMessage({
                type: 'error',
                text: err?.message || 'Action failed. Please try again.',
            });
            setPendingReview(null);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <PullToRefresh onRefresh={fetchInvoices}>
            <div className="flex flex-col gap-3 pb-6">
                {/* 1. Property Selector (Desktop-Matched Neumorphic Design) */}
                <div className="px-4 pt-2.5 shrink-0">
                    <MobilePropertySelector />
                </div>

                {/* 2. Sticky Search & Tab Filter Bar (Matching Maintenance Page Behavior) */}
                <div className="sticky top-[calc(var(--mobile-header-height,56px)+env(safe-area-inset-top,0px))] z-30 bg-background/95 backdrop-blur-md pb-2.5 pt-1 flex flex-col gap-2.5 border-b border-slate-200/80 dark:border-white/10 shadow-xs">
                    {/* Search Bar with Neumorphic Inset */}
                    <div className="px-4 flex items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="SEARCH TENANT, UNIT, INVOICE…"
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

                    {/* Notification Banner */}
                    {actionMessage && (
                        <div className="px-4">
                            <div className={cn(
                                "p-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-between neumorphic-inset animate-in fade-in duration-200",
                                actionMessage.type === 'success' 
                                    ? "text-emerald-500" 
                                    : "text-red-500"
                            )}>
                                <span>{actionMessage.text}</span>
                                <button onClick={() => setActionMessage(null)} className="p-1 text-muted-foreground hover:text-foreground">
                                    <X className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tab Filters (Neumorphic Buttons matching Overview tabs) */}
                    <div className="px-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
                        {(['all', 'proofs', 'overdue', 'paid'] as const).map((tab) => {
                            const isActive = activeTab === tab;
                            const label = tab === 'all' ? 'All' : tab === 'proofs' ? 'Proofs' : tab === 'overdue' ? 'Overdue' : 'Paid';
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "flex-1 min-w-0 py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer",
                                        isActive
                                            ? "neumorphic-primary text-white shadow-xs"
                                            : "neumorphic-extruded text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <span>{label}</span>
                                    {tab === 'proofs' && pendingProofsCount > 0 && (
                                        <span className={cn(
                                            "px-1.5 py-0.2 rounded-full text-[9px] font-black",
                                            isActive ? "bg-white text-primary" : "bg-primary/15 text-primary"
                                        )}>
                                            {pendingProofsCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Invoices List (Desktop Neumorphic Extruded Cards) */}
                <div className="px-4 flex flex-col gap-3">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
                            <span className="text-xs text-muted-foreground font-medium">Loading payments…</span>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="rounded-[2rem] neumorphic-panel p-8 text-center flex flex-col items-center justify-center shadow-sm my-2">
                            <div className="neumorphic-inset-card flex size-12 items-center justify-center rounded-2xl text-muted-foreground/50 mb-3">
                                <CreditCard className="size-6" />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-foreground">No invoices found</h4>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                {activeTab === 'proofs' ? 'No pending tenant receipts awaiting verification.' : 'No invoices match the selected filter.'}
                            </p>
                        </div>
                    ) : (
                        filteredInvoices.map((invoice) => {
                            const hasProof = Boolean(invoice.paymentProofUrl);
                            const isPaid = invoice.status === 'paid' || invoice.status === 'completed' || invoice.status === 'confirmed';
                            const isOverdue = invoice.status === 'overdue';
                            const isUnderReview = invoice.status === 'under_review' || invoice.status === 'intent_submitted';
                            const isPending = invoice.status === 'pending' || invoice.status === 'reminder_sent' || invoice.status === 'awaiting_in_person';
                            const canReview = hasProof && (isPending || isUnderReview);

                            return (
                                <div 
                                    key={invoice.id} 
                                    className="neumorphic-extruded rounded-[1.75rem] p-4 flex flex-col gap-3 transition-all hover:scale-[1.01]"
                                >
                                    {/* Top Row: Tenant & Amount */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-black text-foreground tracking-tight truncate">
                                                {invoice.tenantName}
                                            </h4>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80 mt-0.5 block">
                                                {invoice.unitNumber.toLowerCase().startsWith('unit') ? invoice.unitNumber : `Unit ${invoice.unitNumber}`}
                                            </span>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-sm sm:text-base font-black text-foreground tracking-tight">
                                                ₱{invoice.amount.toLocaleString()}
                                            </div>
                                            <span className={cn(
                                                "inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mt-1 border",
                                                isPaid && "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
                                                isOverdue && "border-red-500/30 bg-red-500/10 text-red-500",
                                                (isUnderReview || (isPending && hasProof)) && "border-blue-500/30 bg-blue-500/10 text-blue-500",
                                                isPending && !hasProof && "border-amber-500/30 bg-amber-500/10 text-amber-500"
                                            )}>
                                                {isPaid ? 'Paid' : isOverdue ? 'Overdue' : hasProof ? 'Proof Attached' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Due Date Row with Inset Icon */}
                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                                        <div className="flex items-center gap-1.5">
                                            <div className="neumorphic-inset-card flex size-5 items-center justify-center rounded-md text-muted-foreground shrink-0">
                                                <Clock className="size-3" />
                                            </div>
                                            <span className="font-semibold text-[11px]">
                                                Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                            </span>
                                        </div>
                                        {invoice.propertyName && (
                                            <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[140px]">
                                                {invoice.propertyName}
                                            </span>
                                        )}
                                    </div>

                                    {/* Proof Screenshot Preview Container (Neumorphic Inset Tray) */}
                                    {hasProof && invoice.paymentProofUrl && (
                                        <div className="neumorphic-inset rounded-2xl p-2.5 px-3 flex items-center justify-between gap-3 mt-0.5">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="relative size-11 rounded-xl overflow-hidden neumorphic-inset-card shrink-0">
                                                    <Image 
                                                        src={invoice.paymentProofUrl} 
                                                        alt="Proof" 
                                                        fill 
                                                        sizes="44px"
                                                        className="object-cover" 
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-foreground truncate">Payment Screenshot</p>
                                                    <p className="text-[10px] text-muted-foreground">Tap to inspect details</p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setInspectInvoice(invoice)}
                                                className="neumorphic-extruded rounded-xl px-3 py-1.5 text-primary text-[10px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 shrink-0 hover:scale-105 cursor-pointer"
                                            >
                                                <span>Inspect</span>
                                                <Maximize2 className="size-3" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Quick Review Actions for Pending Proofs */}
                                    {canReview && (
                                        <div className="flex items-center gap-2 mt-1 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setPendingReview({ invoice, action: 'confirm' })}
                                                disabled={processingId === invoice.id}
                                                className="flex-1 py-2.5 px-3 rounded-xl neumorphic-primary text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 shadow-sm disabled:opacity-50 cursor-pointer"
                                            >
                                                <CheckCircle2 className="size-3.5" />
                                                <span>{processingId === invoice.id ? 'Saving…' : 'Approve'}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setRejectionReason('');
                                                    setPendingReview({ invoice, action: 'reject' });
                                                }}
                                                disabled={processingId === invoice.id}
                                                className="py-2.5 px-4 rounded-xl neumorphic-extruded border border-red-500/25 bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                                            >
                                                <XCircle className="size-3.5" />
                                                <span>Reject</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Tap-to-Enlarge Lightbox Modal */}
                {inspectInvoice && inspectInvoice.paymentProofUrl && typeof document !== 'undefined' && createPortal(
                    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex flex-col p-4 animate-in fade-in duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 text-white border-b border-white/10">
                            <div>
                                <h4 className="text-xs font-bold">
                                    {inspectInvoice.tenantName} - {inspectInvoice.unitNumber.toLowerCase().startsWith('unit') ? inspectInvoice.unitNumber : `Unit ${inspectInvoice.unitNumber}`}
                                </h4>
                                <p className="text-[10px] text-white/70">₱{inspectInvoice.amount.toLocaleString()} Receipt Proof</p>
                            </div>
                            <button
                                onClick={() => setInspectInvoice(null)}
                                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                                aria-label="Close proof inspection"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Screenshot Container */}
                        <div className="flex-1 relative my-3 flex items-center justify-center overflow-hidden rounded-2xl bg-black/50">
                            <Image
                                src={inspectInvoice.paymentProofUrl}
                                alt="Full Payment Proof"
                                fill
                                sizes="100vw"
                                className="object-contain"
                            />
                        </div>

                        {/* Actions inside Lightbox */}
                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => setPendingReview({ invoice: inspectInvoice, action: 'confirm' })}
                                disabled={processingId === inspectInvoice.id}
                                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-black text-xs uppercase tracking-tight flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                <CheckCircle2 className="size-4" />
                                <span>{processingId === inspectInvoice.id ? 'Approving…' : 'Approve Payment'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setRejectionReason('');
                                    setPendingReview({ invoice: inspectInvoice, action: 'reject' });
                                }}
                                disabled={processingId === inspectInvoice.id}
                                className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 font-black text-xs uppercase tracking-tight flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                <XCircle className="size-4" />
                                <span>Reject</span>
                            </button>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Payment Review Confirmation Modal */}
                {pendingReview && (
                    <MobileConfirmModal
                        isOpen={Boolean(pendingReview)}
                        title={pendingReview.action === 'confirm' ? 'Approve Payment?' : 'Reject Payment Proof?'}
                        description={
                            pendingReview.action === 'confirm' ? (
                                <span>
                                    Are you sure you want to approve the payment of{' '}
                                    <strong className="text-foreground font-bold">₱{pendingReview.invoice.amount.toLocaleString()}</strong>{' '}
                                    submitted by <strong className="text-foreground font-bold">{pendingReview.invoice.tenantName}</strong> ({pendingReview.invoice.unitNumber})? This will mark the invoice as paid.
                                </span>
                            ) : (
                                <div className="flex flex-col gap-2.5">
                                    <span>
                                        Are you sure you want to reject the payment proof from{' '}
                                        <strong className="text-foreground font-bold">{pendingReview.invoice.tenantName}</strong>?
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Reason (optional, e.g. blurry receipt)"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-card border border-slate-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            )
                        }
                        confirmLabel={pendingReview.action === 'confirm' ? 'Approve' : 'Reject Proof'}
                        cancelLabel="Cancel"
                        variant={pendingReview.action === 'confirm' ? 'success' : 'danger'}
                        isLoading={processingId === pendingReview.invoice.id}
                        icon={pendingReview.action === 'confirm' ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
                        onConfirm={() => handleReviewPayment(pendingReview.invoice.id, pendingReview.action, rejectionReason)}
                        onCancel={() => !processingId && setPendingReview(null)}
                    />
                )}
            </div>
        </PullToRefresh>
    );
}
