'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { 
    CreditCard, 
    Upload, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    QrCode, 
    Copy, 
    X, 
    Maximize2, 
    FileText,
    Calendar,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';

interface PaymentOverviewItem {
    id: string;
    amount: number;
    paidAmount: number;
    balanceRemaining: number;
    dueDate: string;
    billingCycle?: string;
    status: 'paid' | 'pending' | 'overdue' | 'processing' | 'partial';
    workflowStatus?: string;
    referenceNumber?: string;
    paymentProofUrl?: string | null;
    invoiceNumber?: string;
    notes?: string;
}

interface PaymentOverviewResponse {
    lease?: {
        monthlyRent: number;
        propertyName: string;
        unitName: string;
    };
    payments?: PaymentOverviewItem[];
    overdueTotal?: number;
    unpaidTotal?: number;
}

export function TenantPayView() {
    const [data, setData] = useState<PaymentOverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
    
    // Upload Proof modal state
    const [selectedInvoice, setSelectedInvoice] = useState<PaymentOverviewItem | null>(null);
    const [referenceNumber, setReferenceNumber] = useState('');
    const [note, setNote] = useState('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Lightbox for inspecting submitted receipts
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [copiedAccount, setCopiedAccount] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await fetch('/api/tenant/payments');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error('[TenantPay] Failed to load payments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const payments = data?.payments || [];
    const unpaidTotal = data?.unpaidTotal || 0;
    const overdueTotal = data?.overdueTotal || 0;

    const filteredPayments = useMemo(() => {
        return payments.filter((p) => {
            if (filter === 'pending') {
                return p.status === 'pending' || p.status === 'overdue' || p.status === 'processing' || p.status === 'partial';
            }
            if (filter === 'paid') {
                return p.status === 'paid';
            }
            return true;
        });
    }, [payments, filter]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setReceiptFile(file);
            const reader = new FileReader();
            reader.onload = () => setReceiptPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitProof = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;
        if (!referenceNumber.trim()) {
            setToast({ type: 'error', message: 'Please enter your reference number (e.g. GCash Ref #).' });
            return;
        }

        setSubmitting(true);
        setToast(null);

        try {
            const formData = new FormData();
            formData.append('method', 'gcash');
            formData.append('referenceNumber', referenceNumber.trim());
            if (note.trim()) formData.append('note', note.trim());
            if (receiptFile) formData.append('receipt', receiptFile);

            const res = await fetch(`/api/tenant/payments/${selectedInvoice.id}/submit`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.error || 'Failed to submit payment proof.');
            }

            setToast({ type: 'success', message: 'Payment proof submitted! Landlord will verify shortly.' });
            setSelectedInvoice(null);
            setReceiptFile(null);
            setReceiptPreview(null);
            setReferenceNumber('');
            setNote('');
            fetchPayments();
        } catch (err: any) {
            setToast({ type: 'error', message: err?.message || 'Error submitting proof.' });
        } finally {
            setSubmitting(false);
        }
    };

    const copyPaymentInfo = () => {
        navigator.clipboard?.writeText('0917-123-4567');
        setCopiedAccount(true);
        setTimeout(() => setCopiedAccount(false), 2000);
    };

    const formatCurrency = (amt: number) => `₱${amt.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

    return (
        <PullToRefresh onRefresh={fetchPayments}>
            <div className="flex flex-col gap-3 pb-3">
                {/* Balance & Overview Card */}
                <div className="px-4">
                    <div className="rounded-2xl p-4 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 shadow-xs flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider">
                                <CreditCard className="size-3.5" />
                                <span>Total Payable Balance</span>
                            </div>
                            {overdueTotal > 0 && (
                                <span className="text-[10px] font-bold bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full">
                                    Overdue: {formatCurrency(overdueTotal)}
                                </span>
                            )}
                        </div>

                        <div className="mt-0.5">
                            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                                {formatCurrency(unpaidTotal > 0 ? unpaidTotal : 0)}
                            </h2>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {unpaidTotal > 0 ? 'Pending verification or upcoming due' : 'All invoices are up to date!'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Toast Notification */}
                {toast && (
                    <div className={cn(
                        "mx-4 p-3 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in duration-200",
                        toast.type === 'success' 
                            ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400" 
                            : "bg-red-500/15 border border-red-500/30 text-red-400"
                    )}>
                        <span>{toast.message}</span>
                        <button onClick={() => setToast(null)} className="p-1">
                            <X className="size-3.5" />
                        </button>
                    </div>
                )}

                {/* Payment Instructions / Account Card */}
                <div className="px-4">
                    <div className="rounded-2xl p-3 bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="size-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
                                <QrCode className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-bold text-foreground">GCash / Maya Payment</h4>
                                <p className="text-[10px] text-muted-foreground truncate">0917-123-4567 • Property Account</p>
                            </div>
                        </div>
                        <button
                            onClick={copyPaymentInfo}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-muted text-xs font-bold text-foreground flex items-center gap-1 active:scale-95 transition-all hover:bg-slate-200 shrink-0"
                            aria-label="Copy account number"
                        >
                            <Copy className="size-3" />
                            <span>{copiedAccount ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="px-4 flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                            filter === 'all' 
                                ? "bg-primary text-primary-foreground shadow-xs" 
                                : "bg-slate-100/90 dark:bg-card/70 border border-slate-300/80 dark:border-white/15 text-muted-foreground"
                        )}
                    >
                        All Invoices
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                            filter === 'pending' 
                                ? "bg-primary text-primary-foreground shadow-xs" 
                                : "bg-slate-100/90 dark:bg-card/70 border border-slate-300/80 dark:border-white/15 text-muted-foreground"
                        )}
                    >
                        Unpaid / Due
                    </button>
                    <button
                        onClick={() => setFilter('paid')}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                            filter === 'paid' 
                                ? "bg-primary text-primary-foreground shadow-xs" 
                                : "bg-slate-100/90 dark:bg-card/70 border border-slate-300/80 dark:border-white/15 text-muted-foreground"
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
                            <span className="text-xs text-muted-foreground">Loading payment records…</span>
                        </div>
                    ) : filteredPayments.length === 0 ? (
                        <div className="rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-card/50 p-6 text-center flex flex-col items-center justify-center shadow-xs">
                            <CheckCircle2 className="size-8 text-emerald-500/60 mb-1.5" />
                            <h4 className="text-xs font-bold text-foreground">No invoices in this category</h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {filter === 'pending' ? 'All dues are settled!' : 'No payment records found.'}
                            </p>
                        </div>
                    ) : (
                        filteredPayments.map((inv) => {
                            const isPaid = inv.status === 'paid';
                            const isPending = inv.status === 'pending' || inv.status === 'processing';
                            const isOverdue = inv.status === 'overdue';

                            return (
                                <div
                                    key={inv.id}
                                    className="rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-card/80 p-3.5 shadow-xs flex flex-col gap-2.5 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                {inv.billingCycle || 'Monthly Rent'}
                                            </span>
                                            <h4 className="text-base font-black text-foreground">
                                                {formatCurrency(inv.amount)}
                                            </h4>
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Calendar className="size-3" />
                                                Due: {new Date(inv.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>

                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                                            isPaid && "bg-emerald-500/15 text-emerald-500",
                                            isPending && "bg-amber-500/15 text-amber-500",
                                            isOverdue && "bg-red-500/15 text-red-500"
                                        )}>
                                            {inv.workflowStatus || inv.status}
                                        </span>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                                        {inv.paymentProofUrl ? (
                                            <button
                                                onClick={() => setLightboxUrl(inv.paymentProofUrl || null)}
                                                className="text-[10px] font-bold text-primary flex items-center gap-1 active:scale-95 transition-all hover:underline"
                                            >
                                                <Maximize2 className="size-3" />
                                                <span>View Uploaded Proof</span>
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground">
                                                No proof submitted
                                            </span>
                                        )}

                                        {!isPaid && (
                                            <button
                                                onClick={() => {
                                                    setSelectedInvoice(inv);
                                                    setReceiptFile(null);
                                                    setReceiptPreview(null);
                                                    setReferenceNumber(inv.referenceNumber || '');
                                                }}
                                                className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 shadow-xs hover:brightness-105 active:scale-95 transition-all"
                                            >
                                                <Upload className="size-3" />
                                                <span>{inv.paymentProofUrl ? 'Resubmit Proof' : 'Upload Proof'}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Upload Payment Proof Modal */}
            {mounted && selectedInvoice && createPortal(
                <div 
                    className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setSelectedInvoice(null);
                    }}
                >
                    <div 
                        className="w-full max-w-md bg-card border-t sm:border border-slate-300 dark:border-white/15 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                            <div>
                                <h3 className="text-sm font-black text-foreground">Upload Proof of Payment</h3>
                                <p className="text-[10px] text-muted-foreground">
                                    Invoice amount: {formatCurrency(selectedInvoice.amount)}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
                                aria-label="Close modal"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitProof} className="flex flex-col gap-3">
                            <div>
                                <label className="text-[11px] font-bold text-foreground block mb-1">
                                    Reference Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 13-digit GCash Ref / Bank Ref"
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-foreground block mb-1">
                                    Note / Remarks (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Paid via BPI / GCash, etc."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-foreground block mb-1">
                                    Receipt Screenshot / Photo
                                </label>
                                <label className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-all">
                                    {receiptPreview ? (
                                        <div className="relative size-24 rounded-lg overflow-hidden border border-border">
                                            <Image src={receiptPreview} alt="Receipt preview" fill sizes="96px" className="object-cover" />
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="size-5 text-muted-foreground" />
                                            <span className="text-xs font-bold text-foreground">Tap to select photo</span>
                                            <span className="text-[10px] text-muted-foreground">PNG, JPG up to 5MB</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
                            >
                                {submitting ? 'Submitting…' : 'Confirm & Submit Proof'}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Receipt Lightbox */}
            {mounted && lightboxUrl && createPortal(
                <div className="fixed inset-0 z-[130] bg-black/90 backdrop-blur-md flex flex-col p-4 animate-in fade-in duration-200">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setLightboxUrl(null)}
                            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                            aria-label="Close photo"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                    <div className="flex-1 relative my-3 flex items-center justify-center overflow-hidden rounded-xl">
                        <Image src={lightboxUrl} alt="Enlarged receipt" fill sizes="100vw" className="object-contain" />
                    </div>
                </div>,
                document.body
            )}
        </PullToRefresh>
    );
}
