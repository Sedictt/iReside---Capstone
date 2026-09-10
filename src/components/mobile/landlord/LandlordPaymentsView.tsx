'use client';

import { useState, useEffect, useMemo } from 'react';
import { useProperty } from '@/context/PropertyContext';
import Image from 'next/image';
import { 
    CreditCard, 
    Search, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    AlertTriangle, 
    FileText, 
    Maximize2, 
    X, 
    Filter, 
    ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';

interface InvoiceItem {
    id: string;
    tenantName: string;
    unitNumber: string;
    propertyName?: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue' | 'cancelled';
    dueDate: string;
    paymentProofUrl?: string | null;
    createdAt?: string;
    notes?: string;
}

export function LandlordPaymentsView() {
    const { selectedPropertyId } = useProperty();
    const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'proofs' | 'all' | 'overdue' | 'paid'>('proofs');
    
    // Lightbox state for inspecting payment proof receipts
    const [inspectInvoice, setInspectInvoice] = useState<InvoiceItem | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchInvoices = async () => {
        try {
            const queryParam = selectedPropertyId && selectedPropertyId !== 'all' 
                ? `?propertyId=${selectedPropertyId}` 
                : '';
            const res = await fetch(`/api/landlord/invoices${queryParam}`);
            if (res.ok) {
                const data = await res.json();
                setInvoices(Array.isArray(data) ? data : []);
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
        return invoices.filter(inv => inv.status === 'pending' && Boolean(inv.paymentProofUrl)).length;
    }, [invoices]);

    const filteredInvoices = useMemo(() => {
        return invoices.filter((inv) => {
            // Search filter
            const matchesSearch = 
                inv.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inv.unitNumber.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;

            // Tab filter
            if (activeTab === 'proofs') {
                return inv.status === 'pending' && Boolean(inv.paymentProofUrl);
            }
            if (activeTab === 'overdue') {
                return inv.status === 'overdue';
            }
            if (activeTab === 'paid') {
                return inv.status === 'paid';
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
            fetchInvoices();
        } catch (err: any) {
            setActionMessage({
                type: 'error',
                text: err?.message || 'Action failed. Please try again.',
            });
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <PullToRefresh onRefresh={fetchInvoices}>
            <div className="flex flex-col gap-3.5 pb-6">
                {/* Search Bar */}
                <div className="px-4 pt-1 flex items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search tenant or unit…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-card/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>

            {/* Notification Banner */}
            {actionMessage && (
                <div className={cn(
                    "mx-4 p-3 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in duration-200",
                    actionMessage.type === 'success' 
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400" 
                        : "bg-red-500/15 border border-red-500/30 text-red-400"
                )}>
                    <span>{actionMessage.text}</span>
                    <button onClick={() => setActionMessage(null)} className="p-1">
                        <X className="size-3.5" />
                    </button>
                </div>
            )}

            {/* Tab Filters */}
            <div className="px-4 flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                <button
                    onClick={() => setActiveTab('proofs')}
                    className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5",
                        activeTab === 'proofs'
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-card/70 border border-white/10 text-muted-foreground"
                    )}
                >
                    <span>Proofs to Review</span>
                    {pendingProofsCount > 0 && (
                        <span className={cn(
                            "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                            activeTab === 'proofs' ? "bg-white text-primary" : "bg-primary/20 text-primary"
                        )}>
                            {pendingProofsCount}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('all')}
                    className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                        activeTab === 'all'
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-card/70 border border-white/10 text-muted-foreground"
                    )}
                >
                    All Invoices
                </button>

                <button
                    onClick={() => setActiveTab('overdue')}
                    className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                        activeTab === 'overdue'
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-card/70 border border-white/10 text-muted-foreground"
                    )}
                >
                    Overdue
                </button>

                <button
                    onClick={() => setActiveTab('paid')}
                    className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                        activeTab === 'paid'
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-card/70 border border-white/10 text-muted-foreground"
                    )}
                >
                    Paid
                </button>
            </div>

            {/* Invoices List */}
            <div className="px-4 flex flex-col gap-2.5">
                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
                        <span className="text-xs text-muted-foreground">Loading payments…</span>
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-card/50 p-8 text-center flex flex-col items-center justify-center">
                        <CreditCard className="size-8 text-muted-foreground/50 mb-2" />
                        <h4 className="text-xs font-bold text-foreground">No invoices found</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            {activeTab === 'proofs' ? 'No pending tenant receipts awaiting verification.' : 'No invoices match the selected filter.'}
                        </p>
                    </div>
                ) : (
                    filteredInvoices.map((invoice) => {
                        const hasProof = Boolean(invoice.paymentProofUrl);
                        const isPending = invoice.status === 'pending';
                        const isOverdue = invoice.status === 'overdue';
                        const isPaid = invoice.status === 'paid';

                        return (
                            <div 
                                key={invoice.id} 
                                className="rounded-2xl border border-white/10 bg-card/80 p-3.5 shadow-xs flex flex-col gap-2.5"
                            >
                                {/* Top Row: Tenant & Amount */}
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 className="text-xs font-bold text-foreground">{invoice.tenantName}</h4>
                                        <span className="text-[11px] text-muted-foreground">Unit {invoice.unitNumber}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-black text-foreground">
                                            ₱{invoice.amount.toLocaleString()}
                                        </div>
                                        <span className={cn(
                                            "inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mt-0.5",
                                            isPaid && "bg-emerald-500/10 text-emerald-500",
                                            isOverdue && "bg-red-500/10 text-red-500",
                                            isPending && "bg-amber-500/10 text-amber-500"
                                        )}>
                                            {isPaid ? 'Paid' : isOverdue ? 'Overdue' : hasProof ? 'Proof Attached' : 'Pending'}
                                        </span>
                                    </div>
                                </div>

                                {/* Due Date / Info */}
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-white/5">
                                    <span className="flex items-center gap-1">
                                        <Clock className="size-3 text-muted-foreground" />
                                        Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                    </span>
                                </div>

                                {/* Proof Screenshot Preview (if submitted) */}
                                {hasProof && invoice.paymentProofUrl && (
                                    <div className="mt-1 p-2 rounded-xl bg-background/60 border border-white/5 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="relative size-12 rounded-lg overflow-hidden border border-white/10 bg-black/40 shrink-0">
                                                <Image 
                                                    src={invoice.paymentProofUrl} 
                                                    alt="Proof" 
                                                    fill 
                                                    sizes="48px"
                                                    className="object-cover" 
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold text-foreground truncate">Payment Screenshot</p>
                                                <p className="text-[10px] text-muted-foreground">Tap to inspect details</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setInspectInvoice(invoice)}
                                            className="px-2.5 py-1.5 rounded-lg bg-primary/15 text-primary text-[11px] font-black uppercase tracking-tight flex items-center gap-1 hover:bg-primary/25 shrink-0"
                                        >
                                            <span>Inspect</span>
                                            <Maximize2 className="size-3" />
                                        </button>
                                    </div>
                                )}

                                {/* Quick Review Actions for Pending Proofs */}
                                {isPending && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <button
                                            onClick={() => handleReviewPayment(invoice.id, 'confirm')}
                                            disabled={processingId === invoice.id}
                                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            <CheckCircle2 className="size-3.5" />
                                            <span>{processingId === invoice.id ? 'Saving…' : 'Approve'}</span>
                                        </button>
                                        <button
                                            onClick={() => handleReviewPayment(invoice.id, 'reject')}
                                            disabled={processingId === invoice.id}
                                            className="py-2 px-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-500/25 active:scale-95 transition-all disabled:opacity-50"
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
            {inspectInvoice && inspectInvoice.paymentProofUrl && (
                <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex flex-col p-4 animate-in fade-in duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 text-white border-b border-white/10">
                        <div>
                            <h4 className="text-xs font-bold">{inspectInvoice.tenantName} - Unit {inspectInvoice.unitNumber}</h4>
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
                    <div className="flex-1 relative my-3 flex items-center justify-center overflow-hidden rounded-xl bg-black/50">
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
                            onClick={() => handleReviewPayment(inspectInvoice.id, 'confirm')}
                            disabled={processingId === inspectInvoice.id}
                            className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-black text-xs uppercase tracking-tight flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
                        >
                            <CheckCircle2 className="size-4" />
                            <span>{processingId === inspectInvoice.id ? 'Approving…' : 'Approve Payment'}</span>
                        </button>
                        <button
                            onClick={() => handleReviewPayment(inspectInvoice.id, 'reject')}
                            disabled={processingId === inspectInvoice.id}
                            className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 font-black text-xs uppercase tracking-tight flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                        >
                            <XCircle className="size-4" />
                            <span>Reject</span>
                        </button>
                    </div>
                </div>
            )}
            </div>
        </PullToRefresh>
    );
}
