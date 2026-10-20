'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { 
    CreditCard, 
    Upload, 
    Camera,
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
    ChevronUp,
    Landmark
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { useLanguageContext } from '@/context/LanguageContext';
import { formatAccountNumber, type ProofMethod } from '@/lib/billing/payment-methods';
import { BankTransferDetails, GcashLimitNotice, type BankDestinationView } from '@/components/shared/payment-methods/PaymentMethodBits';
import { mobilePayTotals, toMobilePayItems, type MobilePayItem, type OverviewResponse } from './pay-overview';

/** Turns a status value like "under_review" into an English display label ("Under Review"). */
const toStatusLabel = (value: string) =>
    value
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

type PaymentOverviewItem = MobilePayItem;

/** GET /api/tenant/payments: `nextPayment` + `history` (see getTenantPaymentOverview) plus the landlord's accounts. */
interface PaymentOverviewResponse extends OverviewResponse {
    lease?: {
        monthlyRent: number;
        propertyName: string;
        unitName: string;
    } | null;
    /** The landlord's turned-on GCash wallet and bank account (null when off or not set up). */
    paymentDestinations?: {
        gcash: BankDestinationView | null;
        bank_transfer: BankDestinationView | null;
    };
}

export function TenantPayView() {
    const { t, locale } = useLanguageContext();
    const [data, setData] = useState<PaymentOverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
    
    // Upload Proof modal state
    const [selectedInvoice, setSelectedInvoice] = useState<PaymentOverviewItem | null>(null);
    const [referenceNumber, setReferenceNumber] = useState('');
    const [note, setNote] = useState('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Lightbox for inspecting submitted receipts
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [copiedAccount, setCopiedAccount] = useState<ProofMethod | null>(null);
    const [payMethod, setPayMethod] = useState<ProofMethod>('gcash');
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

    const payments = useMemo(() => toMobilePayItems(data), [data]);
    const { unpaidTotal, overdueTotal, awaitingReview } = useMemo(() => mobilePayTotals(payments), [payments]);
    const gcashDestination = data?.paymentDestinations?.gcash ?? null;
    const bankDestination = data?.paymentDestinations?.bank_transfer ?? null;
    // GCash stays the default when the landlord has not set anything up yet.
    const proofMethods: ProofMethod[] = [
        ...(gcashDestination || !bankDestination ? (['gcash'] as const) : []),
        ...(bankDestination ? (['bank_transfer'] as const) : []),
    ];
    const selectedAmount = selectedInvoice
        ? (selectedInvoice.balanceRemaining > 0 ? selectedInvoice.balanceRemaining : selectedInvoice.amount)
        : 0;

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
            triggerHaptic('medium');
            setReceiptFile(file);
            const reader = new FileReader();
            reader.onload = () => setReceiptPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleClearReceipt = () => {
        triggerHaptic('light');
        setReceiptFile(null);
        setReceiptPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    const handleSubmitProof = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;
        if (!referenceNumber.trim()) {
            triggerHaptic('warning');
            setToast({
                type: 'error',
                message: payMethod === 'bank_transfer'
                    ? t('Please enter the reference number from your bank receipt.')
                    : t('Please enter your reference number (e.g. GCash Ref #).'),
            });
            return;
        }

        setSubmitting(true);
        setToast(null);

        try {
            const formData = new FormData();
            formData.append('method', payMethod);
            formData.append('referenceNumber', referenceNumber.trim());
            if (note.trim()) formData.append('note', note.trim());
            if (receiptFile) formData.append('receipt', receiptFile);

            const res = await fetch(`/api/tenant/payments/${selectedInvoice.id}/submit`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.error || t('Failed to submit payment proof.'));
            }

            triggerHaptic('success');
            setToast({ type: 'success', message: t('Payment proof submitted! Landlord will verify shortly.') });
            setSelectedInvoice(null);
            setReceiptFile(null);
            setReceiptPreview(null);
            setReferenceNumber('');
            setNote('');
            fetchPayments();
        } catch (err: any) {
            triggerHaptic('error');
            setToast({ type: 'error', message: err?.message || t('Error submitting proof.') });
        } finally {
            setSubmitting(false);
        }
    };

    const copyPaymentInfo = (method: ProofMethod, value: string) => {
        navigator.clipboard?.writeText(value.replace(/\s/g, ''));
        setCopiedAccount(method);
        setTimeout(() => setCopiedAccount(null), 2000);
    };

    const openProofSheet = (inv: PaymentOverviewItem) => {
        setSelectedInvoice(inv);
        setReceiptFile(null);
        setReceiptPreview(null);
        setReferenceNumber(inv.referenceNumber || '');
        setPayMethod(proofMethods[0] ?? 'gcash');
    };

    const formatCurrency = (amt: number) => `₱${amt.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

    return (
        <PullToRefresh onRefresh={fetchPayments}>
            <div className="flex flex-col gap-3 pb-3">
                {/* Balance & Overview Card */}
                <div className="px-4 pt-2.5">
                    <div className="rounded-2xl p-4 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/25 shadow-xs flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider">
                                <CreditCard className="size-3.5" />
                                <span>{t('Total Payable Balance')}</span>
                            </div>
                            {overdueTotal > 0 && (
                                <span className="text-[10px] font-bold bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full">
                                    {t('Overdue: {amount}', { amount: formatCurrency(overdueTotal) })}
                                </span>
                            )}
                        </div>

                        <div className="mt-0.5">
                            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                                {formatCurrency(unpaidTotal > 0 ? unpaidTotal : 0)}
                            </h2>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {unpaidTotal > 0
                                    ? t('Pending verification or upcoming due')
                                    : awaitingReview === 1
                                        ? t('1 payment is waiting for your landlord to confirm.')
                                        : awaitingReview > 1
                                            ? t('{count} payments are waiting for your landlord to confirm.', { count: awaitingReview })
                                            : t('All invoices are up to date!')}
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
                        <button onClick={() => setToast(null)} className="p-1" aria-label={t('Dismiss')}>
                            <X className="size-3.5" />
                        </button>
                    </div>
                )}

                {/* Where to send money: the landlord's GCash and/or bank account */}
                {(gcashDestination || bankDestination) && (
                    <div className="px-4 flex flex-col gap-2">
                        {[
                            gcashDestination && { method: 'gcash' as const, icon: QrCode, tone: 'bg-blue-500/15 text-blue-500', title: t('GCash'), name: gcashDestination.accountName, number: gcashDestination.accountNumber ?? '' },
                            bankDestination && { method: 'bank_transfer' as const, icon: Landmark, tone: 'bg-emerald-500/15 text-emerald-600', title: bankDestination.bankName || t('Bank Transfer'), name: bankDestination.accountName, number: formatAccountNumber(bankDestination.accountNumber) },
                        ].filter((card): card is NonNullable<typeof card> => Boolean(card)).map((card) => {
                            const Icon = card.icon;
                            return (
                                <div key={card.method} className="rounded-2xl p-3 bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={cn('size-8 rounded-xl flex items-center justify-center shrink-0', card.tone)}>
                                            <Icon className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-bold text-foreground truncate">{card.title}</h4>
                                            <p className="text-[10px] text-muted-foreground truncate">{card.number} • {card.name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copyPaymentInfo(card.method, card.number)}
                                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-muted text-xs font-bold text-foreground flex items-center gap-1 active:scale-95 transition-all hover:bg-slate-200 shrink-0"
                                        aria-label={t('Copy account number')}
                                    >
                                        <Copy className="size-3" />
                                        <span>{copiedAccount === card.method ? t('Copied!') : t('Copy')}</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

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
                        {t('All Invoices')}
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
                        {t('Unpaid / Due')}
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
                        {t('Paid')}
                    </button>
                </div>

                {/* Invoices List */}
                <div className="px-4 flex flex-col gap-2.5">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
                            <span className="text-xs text-muted-foreground">{t('Loading payment records…')}</span>
                        </div>
                    ) : filteredPayments.length === 0 ? (
                        <div className="rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-card/50 p-6 text-center flex flex-col items-center justify-center shadow-xs">
                            <CheckCircle2 className="size-8 text-emerald-500/60 mb-1.5" />
                            <h4 className="text-xs font-bold text-foreground">{t('No invoices in this category')}</h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {filter === 'pending' ? t('All dues are settled!') : t('No payment records found.')}
                            </p>
                        </div>
                    ) : (
                        filteredPayments.map((inv) => {
                            const isPaid = inv.status === 'paid';
                            const isPending = inv.status === 'pending' || inv.status === 'processing' || inv.status === 'partial';
                            // A proof already waiting for the landlord blocks a second one (the server refuses it too).
                            const canUploadProof = !isPaid && inv.workflowStatus !== 'under_review';
                            const isOverdue = inv.status === 'overdue';

                            return (
                                <div
                                    key={inv.id}
                                    className="rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-card/80 p-3.5 shadow-xs flex flex-col gap-2.5 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                {t(inv.label)}
                                            </span>
                                            <h4 className="text-base font-black text-foreground">
                                                {formatCurrency(inv.amount)}
                                            </h4>
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Calendar className="size-3" />
                                                {t('Due: {date}', { date: new Date(inv.dueDate).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) })}
                                            </p>
                                        </div>

                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                                            isPaid && "bg-emerald-500/15 text-emerald-500",
                                            isPending && "bg-amber-500/15 text-amber-500",
                                            isOverdue && "bg-red-500/15 text-red-500"
                                        )}>
                                            {t(toStatusLabel(inv.workflowStatus || inv.status))}
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
                                                <span>{t('View Uploaded Proof')}</span>
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground">
                                                {t('No proof submitted')}
                                            </span>
                                        )}

                                        {canUploadProof && (
                                            <button
                                                onClick={() => openProofSheet(inv)}
                                                className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 shadow-xs hover:brightness-105 active:scale-95 transition-all"
                                            >
                                                <Upload className="size-3" />
                                                <span>{inv.paymentProofUrl ? t('Resubmit Proof') : t('Upload Proof')}</span>
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
                                <h3 className="text-sm font-black text-foreground">{t('Upload Proof of Payment')}</h3>
                                <p className="text-[10px] text-muted-foreground">
                                    {t('Invoice amount: {amount}', { amount: formatCurrency(selectedInvoice.amount) })}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
                                aria-label={t('Close modal')}
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitProof} className="flex flex-col gap-3">
                            {proofMethods.length > 1 && (
                                <div role="radiogroup" aria-label={t('How did you pay?')} className="grid grid-cols-2 gap-1.5 rounded-2xl bg-muted/40 p-1">
                                    {proofMethods.map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            role="radio"
                                            aria-checked={payMethod === option}
                                            onClick={() => setPayMethod(option)}
                                            className={cn(
                                                'flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all',
                                                payMethod === option ? 'bg-background text-foreground shadow-xs ring-1 ring-border' : 'text-muted-foreground'
                                            )}
                                        >
                                            {option === 'gcash' ? <QrCode className="size-3.5" /> : <Landmark className="size-3.5" />}
                                            {option === 'gcash' ? t('GCash') : t('Bank Transfer')}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {payMethod === 'gcash' && (
                                <GcashLimitNotice
                                    amount={selectedAmount}
                                    onSwitchToBank={bankDestination ? () => setPayMethod('bank_transfer') : undefined}
                                />
                            )}

                            {payMethod === 'bank_transfer' && bankDestination && (
                                <BankTransferDetails compact destination={bankDestination} amount={selectedAmount} />
                            )}

                            <div>
                                <label className="text-[11px] font-bold text-foreground block mb-1">
                                    {t('Reference Number')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder={payMethod === 'bank_transfer' ? t('Bank reference or trace no.') : t('e.g. 13-digit GCash Ref / Bank Ref')}
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-foreground block mb-1">
                                    {t('Note / Remarks (Optional)')}
                                </label>
                                <input
                                    type="text"
                                    placeholder={t('Paid via BPI / GCash, etc.')}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-foreground block mb-1">
                                    {t('Receipt Screenshot / Photo')}
                                </label>
                                {receiptPreview ? (
                                    <div className="relative rounded-xl border border-border p-2.5 bg-muted/20 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="relative size-14 rounded-lg overflow-hidden border border-border shrink-0 bg-background">
                                                <Image src={receiptPreview} alt={t('Receipt preview')} fill sizes="56px" className="object-cover" />
                                            </div>
                                            <div className="flex flex-col min-w-0 text-left">
                                                <span className="text-xs font-bold text-foreground truncate">{receiptFile?.name || 'receipt_photo.jpg'}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {receiptFile?.size ? t('{size} KB • Attached', { size: (receiptFile.size / 1024).toFixed(0) }) : t('Ready to submit')}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleClearReceipt}
                                            className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-95 transition-all text-xs font-bold shrink-0"
                                            title={t('Remove photo')}
                                            aria-label={t('Remove photo')}
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {/* Direct Camera Capture */}
                                        <label className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border-2 border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 cursor-pointer active:scale-[0.98] transition-all text-center">
                                            <Camera className="size-5 text-primary" />
                                            <span className="text-xs font-bold text-foreground">{t('Take Photo')}</span>
                                            <span className="text-[9px] text-muted-foreground">{t('Open Camera')}</span>
                                            <input
                                                ref={cameraInputRef}
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>

                                        {/* Gallery Upload */}
                                        <label className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border-2 border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 cursor-pointer active:scale-[0.98] transition-all text-center">
                                            <Upload className="size-5 text-muted-foreground" />
                                            <span className="text-xs font-bold text-foreground">{t('Photo Gallery')}</span>
                                            <span className="text-[9px] text-muted-foreground">{t('PNG, JPG up to 5MB')}</span>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*,application/pdf"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
                            >
                                {submitting ? t('Submitting…') : t('Confirm & Submit Proof')}
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
                            aria-label={t('Close photo')}
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                    <div className="flex-1 relative my-3 flex items-center justify-center overflow-hidden rounded-xl">
                        <Image src={lightboxUrl} alt={t('Enlarged receipt')} fill sizes="100vw" className="object-contain" />
                    </div>
                </div>,
                document.body
            )}
        </PullToRefresh>
    );
}
