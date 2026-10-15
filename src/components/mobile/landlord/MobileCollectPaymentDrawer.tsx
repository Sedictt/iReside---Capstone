'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Search,
    Receipt,
    CheckCircle2,
    Calendar,
    AlertCircle,
    Banknote,
    Landmark,
    RefreshCw,
    Check,
    DollarSign,
    Smartphone,
    CreditCard,
    ChevronRight,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProperty } from '@/context/PropertyContext';
import { useLanguageContext } from '@/context/LanguageContext';
import { triggerHaptic } from '@/lib/haptics';
import { toast } from 'sonner';

export type MobileCollectMethod = 'cash' | 'gcash' | 'bank_transfer';

export interface CollectibleInvoice {
    id: string;
    invoiceNumber?: string;
    tenantName: string;
    unitNumber: string;
    propertyName?: string;
    amount: number;
    paidAmount?: number;
    balanceRemaining: number;
    status: string;
    dueDate?: string;
}

export interface MobileCollectPaymentDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initialInvoiceId?: string | null;
    onPaymentRecorded?: () => void;
}

const PAYMENT_METHODS: Array<{ id: MobileCollectMethod; label: string; icon: React.ElementType; desc: string }> = [
    { id: 'cash', label: 'Cash', icon: Banknote, desc: 'Direct hand-to-hand cash' },
    { id: 'gcash', label: 'GCash', icon: Smartphone, desc: 'Mobile wallet transfer' },
    { id: 'bank_transfer', label: 'Bank', icon: Landmark, desc: 'InstaPay / PESONet transfer' },
];

export function MobileCollectPaymentDrawer({
    isOpen,
    onClose,
    initialInvoiceId,
    onPaymentRecorded,
}: MobileCollectPaymentDrawerProps) {
    const { selectedPropertyId } = useProperty();
    const { t } = useLanguageContext();

    const [invoices, setInvoices] = useState<CollectibleInvoice[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(initialInvoiceId || null);
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<MobileCollectMethod>('cash');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Success modal state
    const [successData, setSuccessData] = useState<{
        receiptNumber: string;
        amount: number;
        isFullyPaid: boolean;
        tenantName: string;
        unitNumber: string;
    } | null>(null);

    // Fetch unpaid / collectible invoices on drawer open
    useEffect(() => {
        if (!isOpen) {
            setSuccessData(null);
            setErrorMsg(null);
            return;
        }

        const loadInvoices = async () => {
            setLoadingInvoices(true);
            try {
                const queryParam = selectedPropertyId && selectedPropertyId !== 'all'
                    ? `?propertyId=${selectedPropertyId}`
                    : '';
                const res = await fetch(`/api/landlord/invoices${queryParam}`);
                if (!res.ok) throw new Error('Failed to load invoices');
                const data = await res.json();
                const rawList = Array.isArray(data) ? data : Array.isArray(data?.invoices) ? data.invoices : [];

                const parsed: CollectibleInvoice[] = rawList
                    .map((inv: any) => {
                        const amt = Number(inv.amount || 0);
                        const paid = Number(inv.paidAmount ?? inv.paid_amount ?? 0);
                        const balance = Number(inv.balanceRemaining ?? inv.balance_remaining ?? Math.max(0, amt - paid));
                        return {
                            id: inv.id,
                            invoiceNumber: inv.invoiceNumber || inv.invoice_number,
                            tenantName: inv.tenantName || inv.tenant || 'Resident',
                            unitNumber: inv.unitNumber || inv.unit || 'N/A',
                            propertyName: inv.propertyName || inv.property,
                            amount: amt,
                            paidAmount: paid,
                            balanceRemaining: balance > 0 ? balance : amt,
                            status: String(inv.status || 'pending').toLowerCase(),
                            dueDate: inv.dueDate || inv.due_date || '',
                        };
                    })
                    .filter((inv: CollectibleInvoice) => {
                        const isSettled = ['paid', 'receipted', 'completed', 'confirmed'].includes(inv.status);
                        return !isSettled || inv.balanceRemaining > 0;
                    });

                setInvoices(parsed);

                // Pre-select if initialInvoiceId specified, otherwise pick first
                if (initialInvoiceId && parsed.some(i => i.id === initialInvoiceId)) {
                    setSelectedInvoiceId(initialInvoiceId);
                    const target = parsed.find(i => i.id === initialInvoiceId);
                    if (target) {
                        setAmount(String(target.balanceRemaining));
                    }
                } else if (parsed.length > 0 && !selectedInvoiceId) {
                    setSelectedInvoiceId(parsed[0].id);
                    setAmount(String(parsed[0].balanceRemaining));
                }
            } catch (err: any) {
                console.error('Failed to load collectible invoices:', err);
                setErrorMsg(err.message || 'Unable to load invoices');
            } finally {
                setLoadingInvoices(false);
            }
        };

        void loadInvoices();
    }, [isOpen, selectedPropertyId, initialInvoiceId]);

    // Filter visible invoices by search query
    const filteredInvoices = useMemo(() => {
        if (!searchQuery.trim()) return invoices;
        const q = searchQuery.toLowerCase().trim();
        return invoices.filter(
            (inv) =>
                inv.tenantName.toLowerCase().includes(q) ||
                inv.unitNumber.toLowerCase().includes(q) ||
                (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q))
        );
    }, [invoices, searchQuery]);

    const selectedInvoice = useMemo(() => {
        return invoices.find((inv) => inv.id === selectedInvoiceId) || null;
    }, [invoices, selectedInvoiceId]);

    const activeDue = selectedInvoice ? selectedInvoice.balanceRemaining : 0;
    const numAmount = parseFloat(amount) || 0;
    const remainingAfter = Math.max(0, activeDue - numAmount);
    const isFullSettlement = remainingAfter <= 0 && numAmount > 0;

    // Select invoice
    const handleSelectInvoice = (inv: CollectibleInvoice) => {
        triggerHaptic('light');
        setSelectedInvoiceId(inv.id);
        setAmount(String(inv.balanceRemaining));
        setErrorMsg(null);
    };

    // Quick full amount shortcut
    const handleApplyFullDue = () => {
        triggerHaptic('light');
        if (selectedInvoice) {
            setAmount(String(selectedInvoice.balanceRemaining));
        }
    };

    // Submit offline payment intake
    const handleSubmitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoiceId || !selectedInvoice) {
            setErrorMsg('Please select an invoice to collect.');
            return;
        }
        if (numAmount <= 0) {
            setErrorMsg('Please enter a valid amount greater than 0.');
            return;
        }
        if (numAmount > activeDue) {
            setErrorMsg(`Amount cannot exceed the total balance due (₱${activeDue.toLocaleString()}).`);
            return;
        }

        setSubmitting(true);
        setErrorMsg(null);
        triggerHaptic('medium');

        try {
            const res = await fetch('/api/landlord/payments/collect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: selectedInvoiceId,
                    amount: numAmount,
                    method,
                    referenceNumber: referenceNumber.trim() || undefined,
                    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
                    note: note.trim() || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to record payment');
            }

            triggerHaptic('success');
            toast.success(t('Payment recorded successfully!'));

            setSuccessData({
                receiptNumber: data.receiptNumber || 'OR-PENDING',
                amount: numAmount,
                isFullyPaid: Boolean(data.isFullyPaid),
                tenantName: selectedInvoice.tenantName,
                unitNumber: selectedInvoice.unitNumber,
            });

            if (onPaymentRecorded) {
                onPaymentRecorded();
            }
        } catch (err: any) {
            console.error('Collect payment error:', err);
            setErrorMsg(err.message || 'Payment recording failed.');
            toast.error(err.message || 'Payment recording failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-end justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
                    />

                    {/* Drawer Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="relative z-10 w-full max-w-lg rounded-t-[2.5rem] border-t border-border/80 bg-background text-foreground shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
                    >
                        {/* Top Handle */}
                        <div className="pt-3 pb-1 shrink-0 flex justify-center">
                            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
                        </div>

                        {/* Sheet Header */}
                        <div className="px-5 pt-2 pb-3 border-b border-border/50 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-2xs">
                                    <Receipt className="size-5" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base font-black text-foreground tracking-tight truncate">
                                        {t('Record Offline Payment')}
                                    </h2>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                        {t('Instant cash, check, or bank collection receipt')}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="size-9 min-h-[36px] min-w-[36px] rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center active:scale-95 transition-all shrink-0"
                                aria-label="Close drawer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Success Receipt State */}
                        {successData ? (
                            <div className="p-6 overflow-y-auto flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                                <div className="size-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shadow-lg">
                                    <CheckCircle2 className="size-8 stroke-[2.5]" />
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        {successData.isFullyPaid ? t('Invoice Fully Settled') : t('Partial Payment Recorded')}
                                    </span>
                                    <h3 className="text-xl font-black text-foreground mt-1">
                                        ₱{successData.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {successData.tenantName} • Unit {successData.unitNumber}
                                    </p>
                                </div>

                                {/* Digital Official Receipt Card */}
                                <div className="w-full p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2.5 text-xs text-left">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-semibold">{t('Receipt Number')}</span>
                                        <span className="font-mono font-black text-foreground">#{successData.receiptNumber}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-semibold">{t('Method')}</span>
                                        <span className="font-bold uppercase text-foreground">{method}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-semibold">{t('Recorded At')}</span>
                                        <span className="text-foreground font-semibold">{new Date().toLocaleDateString('en-PH', { dateStyle: 'medium' })}</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider active:scale-98 transition-all shadow-md"
                                >
                                    {t('Done & Return to Ledger')}
                                </button>
                            </div>
                        ) : (
                            /* Form Content */
                            <form onSubmit={handleSubmitPayment} className="p-5 overflow-y-auto space-y-4 pb-20">
                                {errorMsg && (
                                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                                        <AlertCircle className="size-4 shrink-0" />
                                        <span>{errorMsg}</span>
                                    </div>
                                )}

                                {/* 1. Invoice Target Selection */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block">
                                        {t('Target Invoice / Resident')} <span className="text-rose-500">*</span>
                                    </label>

                                    {loadingInvoices ? (
                                        <div className="py-6 flex items-center justify-center gap-2 text-muted-foreground text-xs">
                                            <RefreshCw className="size-4 animate-spin text-primary" />
                                            <span>{t('Loading unpaid invoices…')}</span>
                                        </div>
                                    ) : invoices.length === 0 ? (
                                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 text-center text-xs text-muted-foreground">
                                            {t('No pending or overdue invoices found across selected scope.')}
                                        </div>
                                    ) : (
                                        <>
                                            {/* Search box if multiple invoices */}
                                            {invoices.length > 3 && (
                                                <div className="relative flex items-center">
                                                    <Search className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        placeholder={t('Search tenant or unit…')}
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full rounded-xl bg-card border border-border/70 py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                                                    />
                                                </div>
                                            )}

                                            {/* Scrollable Horizontal or Stacked Invoice Cards */}
                                            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar-premium">
                                                {filteredInvoices.map((inv) => {
                                                    const isSelected = inv.id === selectedInvoiceId;
                                                    return (
                                                        <div
                                                            key={inv.id}
                                                            onClick={() => handleSelectInvoice(inv)}
                                                            className={cn(
                                                                "p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]",
                                                                isSelected
                                                                    ? "bg-primary/10 border-primary shadow-xs"
                                                                    : "bg-card border-border/70 hover:border-border"
                                                            )}
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-xs font-black text-foreground truncate">
                                                                        {inv.tenantName}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                                        • Unit {inv.unitNumber}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                                                    {inv.propertyName || 'Property'} {inv.invoiceNumber ? `• #${inv.invoiceNumber}` : ''}
                                                                </p>
                                                            </div>

                                                            <div className="text-right shrink-0">
                                                                <span className="text-xs font-black text-foreground block">
                                                                    ₱{inv.balanceRemaining.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                                </span>
                                                                <span className={cn(
                                                                    "text-[9px] font-bold uppercase tracking-wider",
                                                                    inv.status === 'overdue' ? 'text-rose-500' : 'text-amber-500'
                                                                )}>
                                                                    {inv.status === 'overdue' ? t('Overdue') : t('Due')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </> 
                                    )}
                                </div>

                                {/* 2. Payment Method Selector */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block">
                                        {t('Payment Method')}
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {PAYMENT_METHODS.map((m) => {
                                            const isSelected = method === m.id;
                                            const MethodIcon = m.icon;
                                            return (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => {
                                                        triggerHaptic('light');
                                                        setMethod(m.id);
                                                    }}
                                                    className={cn(
                                                        "py-2.5 px-2 rounded-2xl border flex flex-col items-center justify-center gap-1 active:scale-95 transition-all text-center",
                                                        isSelected
                                                            ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                                                            : "bg-card border-border/70 text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    <MethodIcon className="size-4" />
                                                    <span className="text-[11px] font-black uppercase tracking-wider">{m.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 3. Amount Collected with 1-Tap Full Chip */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                                            {t('Amount Collected (₱)')} <span className="text-rose-500">*</span>
                                        </label>
                                        {activeDue > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleApplyFullDue}
                                                className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline flex items-center gap-0.5 active:scale-95"
                                            >
                                                <Sparkles className="size-3" />
                                                <span>{t('Pay Full (₱{due})', { due: activeDue.toLocaleString() })}</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="relative flex items-center">
                                        <span className="absolute left-3.5 text-sm font-black text-muted-foreground pointer-events-none">
                                            ₱
                                        </span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            max={activeDue > 0 ? activeDue : undefined}
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            required
                                            className="w-full rounded-2xl bg-card border border-border/70 py-3 pl-8 pr-4 text-sm font-black text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                                        />
                                    </div>

                                    {/* Live Settlement Status Feedback */}
                                    {activeDue > 0 && numAmount > 0 && (
                                        <div className={cn(
                                            "p-2.5 rounded-xl border text-[11px] font-medium flex items-center justify-between gap-2",
                                            isFullSettlement
                                                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                                                : "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400"
                                        )}>
                                            <span>
                                                {isFullSettlement
                                                    ? t('Full payment settles invoice completely.')
                                                    : t('Partial payment leaves ₱{rem} remaining balance.', { rem: remainingAfter.toLocaleString('en-PH', { minimumFractionDigits: 2 }) })}
                                            </span>
                                            <span className="font-bold uppercase tracking-wider text-[10px]">
                                                {isFullSettlement ? t('Exact') : t('Partial')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* 4. Date Received & Reference Number Row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                            {t('Date Received')}
                                        </label>
                                        <input
                                            type="date"
                                            value={paymentDate}
                                            onChange={(e) => setPaymentDate(e.target.value)}
                                            className="w-full p-2.5 rounded-xl bg-card border border-border/70 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                            {t('Ref / Check #')}
                                        </label>
                                        <input
                                            type="text"
                                            value={referenceNumber}
                                            onChange={(e) => setReferenceNumber(e.target.value)}
                                            placeholder={method === 'cash' ? t('Optional') : 'e.g. 10294821'}
                                            className="w-full p-2.5 rounded-xl bg-card border border-border/70 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                {/* 5. Note / Memo */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                        {t('Receipt Memo (Optional)')}
                                    </label>
                                    <input
                                        type="text"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="e.g. Handed directly at unit door"
                                        className="w-full p-2.5 rounded-xl bg-card border border-border/70 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={onClose}
                                        className="flex-1 py-3 rounded-2xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground active:scale-98 transition-all"
                                    >
                                        {t('Cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !selectedInvoiceId || numAmount <= 0}
                                        className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <RefreshCw className="size-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Check className="size-4 stroke-[3]" />
                                                <span>{t('Record Collection')}</span>
                                            </> 
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}