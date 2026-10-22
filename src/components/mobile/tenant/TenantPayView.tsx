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
    ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { useLanguageContext } from '@/context/LanguageContext';

/** Turns a status value like "under_review" into an English display label ("Under Review"). */
const toStatusLabel = (value: string) =>
    value
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

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
            setToast({ type: 'error', message: t('Please enter your reference number (e.g. GCash Ref #).') });
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

    const copyPaymentInfo = () => {
        navigator.clipboard?.writeText('0917-123-4567');
        setCopiedAccount(true);
        setTimeout(() => setCopiedAccount(false), 2000);
    };

    const formatCurrency = (amt: number) => `₱${amt.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

    return (
        <PullToRefresh onRefresh={fetchPayments}>
            <div className="m-stagger flex flex-col gap-4 pb-4">
                {/* Balance & Overview Card */}
                <div className="px-4 pt-1">
                    <div className="m-hero m-hero-deep p-5 flex flex-col gap-3">
                        <div className="relative flex items-center justify-between gap-2">
                            <span className="m-eyebrow flex items-center gap-1.5">
                                <CreditCard className="size-3.5" />
                                {t('Total Payable Balance')}
                            </span>
                            {overdueTotal > 0 && (
                                <span className="m-pill m-pill-ghost">
                                    {t('Overdue: {amount}', { amount: formatCurrency(overdueTotal) })}
                                </span>
                            )}
                        </div>

                        <div className="relative">
                            <h2 className="m-amount text-[36px]">
                                {formatCurrency(unpaidTotal > 0 ? unpaidTotal : 0)}
                            </h2>
                            <p className="m-hero-muted text-sm mt-2">
                                {unpaidTotal > 0 ? t('Pending verification or upcoming due') : t('All invoices are up to date!')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Toast Notification */}
                {toast && (
                    <div className={cn(
                        "mx-4 p-3.5 rounded-2xl text-sm font-bold flex items-center justify-between animate-in fade-in duration-200",
                        toast.type === 'success'
                            ? "bg-[var(--m-teal-tint)] text-[var(--m-teal-text)]"
                            : "bg-[var(--m-coral-tint)] text-[var(--m-coral-text)]"
                    )}>
                        <span>{toast.message}</span>
                        <button onClick={() => setToast(null)} className="p-1" aria-label={t('Dismiss')}>
                            <X className="size-3.5" />
                        </button>
                    </div>
                )}

                {/* Payment Instructions / Account Card */}
                <div className="px-4">
                    <div className="m-card p-3.5 flex items-center gap-3.5">
                        <div className="m-tile m-tile-teal size-11">
                            <QrCode className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="text-[15px] font-bold text-foreground">{t('GCash / Maya Payment')}</h4>
                            <p className="text-[13px] text-muted-foreground truncate">0917-123-4567 • {t('Property Account')}</p>
                        </div>
                        <button
                            onClick={copyPaymentInfo}
                            className="m-btn m-btn-tint min-h-[40px] px-3.5 text-[13px] shrink-0"
                            aria-label={t('Copy account number')}
                        >
                            <Copy className="size-4" />
                            <span>{copiedAccount ? t('Copied!') : t('Copy')}</span>
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="px-4 flex gap-2 overflow-x-auto scrollbar-none pb-1" role="tablist" aria-label={t('Invoice filter')}>
                    <button
                        role="tab"
                        aria-selected={filter === 'all'}
                        onClick={() => setFilter('all')}
                        className={cn(
                            "m-btn min-h-[40px] px-4 text-[13px] shrink-0",
                            filter === 'all' ? "m-btn-primary" : "m-btn-surface text-muted-foreground"
                        )}
                    >
                        {t('All Invoices')}
                    </button>
                    <button
                        role="tab"
                        aria-selected={filter === 'pending'}
                        onClick={() => setFilter('pending')}
                        className={cn(
                            "m-btn min-h-[40px] px-4 text-[13px] shrink-0",
                            filter === 'pending' ? "m-btn-primary" : "m-btn-surface text-muted-foreground"
                        )}
                    >
                        {t('Unpaid / Due')}
                    </button>
                    <button
                        role="tab"
                        aria-selected={filter === 'paid'}
                        onClick={() => setFilter('paid')}
                        className={cn(
                            "m-btn min-h-[40px] px-4 text-[13px] shrink-0",
                            filter === 'paid' ? "m-btn-primary" : "m-btn-surface text-muted-foreground"
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
                        <div className="m-card p-6 text-center flex flex-col items-center justify-center gap-1">
                            <div className="m-tile m-tile-teal size-12 mb-1.5">
                                <CheckCircle2 className="size-6" />
                            </div>
                            <h4 className="text-[15px] font-bold text-foreground">{t('No invoices in this category')}</h4>
                            <p className="text-[13px] text-muted-foreground">
                                {filter === 'pending' ? t('All dues are settled!') : t('No payment records found.')}
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
                                    className="m-card p-4 flex flex-col gap-3 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="m-eyebrow">
                                                {inv.billingCycle || t('Monthly Rent')}
                                            </span>
                                            <h4 className="m-amount text-[22px] text-foreground mt-1">
                                                {formatCurrency(inv.amount)}
                                            </h4>
                                            <p className="text-[13px] text-muted-foreground flex items-center gap-1.5 mt-1.5">
                                                <Calendar className="size-3.5" />
                                                {t('Due: {date}', { date: new Date(inv.dueDate).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) })}
                                            </p>
                                        </div>

                                        <span className={cn(
                                            "m-pill capitalize",
                                            isPaid && "m-pill-teal",
                                            isPending && "m-pill-amber",
                                            isOverdue && "m-pill-coral",
                                            !isPaid && !isPending && !isOverdue && "m-pill-brand"
                                        )}>
                                            {t(toStatusLabel(inv.workflowStatus || inv.status))}
                                        </span>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="pt-3 border-t border-[rgba(49,37,120,0.08)] dark:border-white/10 flex items-center justify-between gap-2">
                                        {inv.paymentProofUrl ? (
                                            <button
                                                onClick={() => setLightboxUrl(inv.paymentProofUrl || null)}
                                                className="text-[13px] font-bold text-primary flex items-center gap-1.5 active:scale-95 transition-all hover:underline"
                                            >
                                                <Maximize2 className="size-3.5" />
                                                <span>{t('View Uploaded Proof')}</span>
                                            </button>
                                        ) : (
                                            <span className="text-[13px] text-muted-foreground">
                                                {t('No proof submitted')}
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
                                                className="m-btn m-btn-primary min-h-[40px] px-4 text-[13px]"
                                            >
                                                <Upload className="size-4" />
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
                        className="w-full max-w-md bg-card rounded-t-[28px] sm:rounded-[28px] p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="m-display text-[18px] text-foreground">{t('Upload Proof of Payment')}</h3>
                                <p className="text-[13px] text-muted-foreground mt-0.5">
                                    {t('Invoice amount: {amount}', { amount: formatCurrency(selectedInvoice.amount) })}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="m-btn m-btn-surface size-11 px-0 shrink-0 text-muted-foreground"
                                aria-label={t('Close modal')}
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitProof} className="flex flex-col gap-3.5">
                            <div>
                                <label className="text-[13px] font-bold text-foreground block mb-1.5">
                                    {t('Reference Number')} <span className="text-[var(--m-coral-text)]">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder={t('e.g. 13-digit GCash Ref / Bank Ref')}
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    required
                                    className="m-input text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-[13px] font-bold text-foreground block mb-1.5">
                                    {t('Note / Remarks (Optional)')}
                                </label>
                                <input
                                    type="text"
                                    placeholder={t('Paid via BPI / GCash, etc.')}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="m-input text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-[13px] font-bold text-foreground block mb-1.5">
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
                                        <label className="flex flex-col items-center justify-center gap-1.5 min-h-[88px] p-3.5 rounded-2xl border-[1.5px] border-dashed border-[rgba(49,37,120,0.18)] bg-[var(--m-ground)] cursor-pointer active:scale-[0.98] transition-all text-center">
                                            <Camera className="size-[22px] text-[var(--brand-primary-900)] dark:text-primary" />
                                            <span className="text-[13px] font-bold text-foreground">{t('Take Photo')}</span>
                                            <span className="text-xs text-muted-foreground">{t('Open Camera')}</span>
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
                                        <label className="flex flex-col items-center justify-center gap-1.5 min-h-[88px] p-3.5 rounded-2xl border-[1.5px] border-dashed border-[rgba(49,37,120,0.18)] bg-[var(--m-ground)] cursor-pointer active:scale-[0.98] transition-all text-center">
                                            <Upload className="size-[22px] text-[var(--brand-primary-900)] dark:text-primary" />
                                            <span className="text-[13px] font-bold text-foreground">{t('Photo Gallery')}</span>
                                            <span className="text-xs text-muted-foreground">{t('PNG, JPG up to 5MB')}</span>
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
                                className="m-btn m-btn-primary w-full min-h-[52px] text-[15px] mt-1"
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
