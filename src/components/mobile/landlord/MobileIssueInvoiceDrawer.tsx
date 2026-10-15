'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    X,
    FileText,
    Calendar,
    Plus,
    Trash2,
    DollarSign,
    Building2,
    User,
    Check,
    RefreshCw,
    Receipt,
    Zap,
    Droplets
} from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguageContext } from '@/context/LanguageContext';
import { tr } from '@/hooks/useLanguage';

export interface ActiveLeaseOption {
    id: string;
    monthly_rent?: number | null;
    unit?: {
        id: string;
        name: string;
        property?: {
            id: string;
            name: string;
        };
    };
    tenant?: {
        id: string;
        full_name?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
    } | null;
}

export interface LineItem {
    id: string;
    label: string;
    amount: string;
    category: 'rent' | 'water' | 'electricity' | 'maintenance' | 'other';
    removable: boolean;
}

interface MobileIssueInvoiceDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onIssued?: () => void;
    propertyId?: string | null;
}

export function MobileIssueInvoiceDrawer({
    isOpen,
    onClose,
    onIssued,
    propertyId,
}: MobileIssueInvoiceDrawerProps) {
    const { t } = useLanguageContext();
    const [leases, setLeases] = useState<ActiveLeaseOption[]>([]);
    const [loadingLeases, setLoadingLeases] = useState(false);
    const [selectedLeaseId, setSelectedLeaseId] = useState<string>('');

    // Dates
    const today = new Date();
    const defaultMonth = today.toISOString().slice(0, 7); // YYYY-MM
    const [billingMonth, setBillingMonth] = useState(defaultMonth);

    const defaultDueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() < 5 ? 5 : today.getDate() < 15 ? 15 : 25)
        .toISOString()
        .slice(0, 10);
    const [dueDate, setDueDate] = useState(defaultDueDate);
    const [notes, setNotes] = useState('');

    // Items
    const [items, setItems] = useState<LineItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Fetch leases on open
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        setLoadingLeases(true);

        const fetchLeases = async () => {
            try {
                const params = new URLSearchParams();
                params.set('status', 'active,expiring_soon');
                if (propertyId && propertyId !== 'all') {
                    params.set('propertyId', propertyId);
                }

                let res = await fetch(`/api/landlord/leases?${params.toString()}`);
                let data = res.ok ? await res.json() : [];

                if (Array.isArray(data) && data.length === 0 && propertyId && propertyId !== 'all') {
                    const fallbackRes = await fetch('/api/landlord/leases?status=active,expiring_soon');
                    if (fallbackRes.ok) data = await fallbackRes.json();
                }

                if (!isMounted) return;
                const leaseList = Array.isArray(data) ? data : (Array.isArray(data?.leases) ? data.leases : []);
                setLeases(leaseList);

                if (leaseList.length > 0 && !selectedLeaseId) {
                    setSelectedLeaseId(leaseList[0].id);
                }
            } catch (err) {
                console.error('Error fetching leases for invoice:', err);
                toast.error(t('Failed to load active leases'));
            } finally {
                if (isMounted) setLoadingLeases(false);
            }
        };

        fetchLeases();

        return () => {
            isMounted = false;
        };
    }, [isOpen, propertyId, selectedLeaseId, t]);

    const selectedLease = useMemo(() => {
        return leases.find(l => l.id === selectedLeaseId) || null;
    }, [leases, selectedLeaseId]);

    // Pre-populate items when selected lease changes
    useEffect(() => {
        if (!selectedLease) {
            setItems([]);
            return;
        }

        const rent = selectedLease.monthly_rent || (selectedLease as any).rent_amount || (selectedLease as any).rent || 0;
        setItems([
            {
                id: 'item-rent',
                label: 'Monthly Base Rent',
                amount: rent > 0 ? String(rent) : '',
                category: 'rent',
                removable: false,
            },
            {
                id: 'item-water',
                label: 'Water Utility Service',
                amount: '',
                category: 'water',
                removable: true,
            },
            {
                id: 'item-electric',
                label: 'Electricity Utility Service',
                amount: '',
                category: 'electricity',
                removable: true,
            },
        ]);
    }, [selectedLease]);

    // Total Amount computation
    const totalAmount = useMemo(() => {
        return items.reduce((sum, it) => {
            const val = parseFloat(it.amount);
            return sum + (!isNaN(val) && val > 0 ? val : 0);
        }, 0);
    }, [items]);

    const handleAddItem = () => {
        triggerHaptic('light');
        const newId = `item-custom-${Date.now()}`;
        setItems(prev => [
            ...prev,
            {
                id: newId,
                label: '',
                amount: '',
                category: 'other',
                removable: true,
            },
        ]);
    };

    const handleRemoveItem = (id: string) => {
        triggerHaptic('light');
        setItems(prev => prev.filter(it => it.id !== id));
    };

    const handleUpdateItem = (id: string, field: 'label' | 'amount' | 'category', value: string) => {
        setItems(prev =>
            prev.map(it => (it.id === id ? { ...it, [field]: value } : it))
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        if (!selectedLease) {
            toast.error(t('Please select a tenant'));
            return;
        }

        const validItems = items
            .filter(it => {
                const num = parseFloat(it.amount);
                return !isNaN(num) && num > 0 && it.label.trim().length > 0;
            })
            .map(it => ({
                label: it.label.trim(),
                amount: parseFloat(it.amount),
                category: it.category,
            }));

        if (validItems.length === 0) {
            toast.error(t('Please provide at least one charge item with an amount > 0'));
            return;
        }

        setSubmitting(true);
        triggerHaptic('medium');

        try {
            const res = await fetch('/api/landlord/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leaseId: selectedLease.id,
                    billingMonth: `${billingMonth}-01`,
                    dueDate,
                    notes: notes.trim() || undefined,
                    items: validItems,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || t('Failed to issue invoice'));
            }

            toast.success(t('Invoice issued successfully!'));
            triggerHaptic('success');
            if (onIssued) onIssued();
            onClose();
        } catch (err: any) {
            console.error('Invoice issuance error:', err);
            toast.error(t(err.message || t('Failed to issue invoice')));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full sm:max-w-lg bg-background rounded-t-3xl sm:rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200 max-h-[92vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Receipt className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-foreground">{t('Issue Custom Invoice')}</h3>
                            <p className="text-[10px] text-muted-foreground font-semibold">
                                {t('Create and bill charges to an active tenant')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                        aria-label={t('Close')}
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Tenant & Lease Selection */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {t('Select Tenant / Unit')}
                        </label>
                        {loadingLeases ? (
                            <div className="p-3 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs text-muted-foreground flex items-center gap-2">
                                <RefreshCw className="size-3.5 animate-spin" />
                                <span>{t('Loading active leases...')}</span>
                            </div>
                        ) : leases.length === 0 ? (
                            <div className="p-3 rounded-xl bg-card border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400">
                                {t('No active leases found to bill.')}
                            </div>
                        ) : (
                            <select
                                value={selectedLeaseId}
                                onChange={(e) => setSelectedLeaseId(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                            >
                                {leases.map((lease) => {
                                    const tenantName = lease.tenant?.full_name || lease.tenant?.email || t('Active Resident');
                                    const unitName = lease.unit?.name || t('Unit');
                                    const propName = lease.unit?.property?.name;
                                    return (
                                        <option key={lease.id} value={lease.id}>
                                            {unitName} • {tenantName} {propName ? `(${propName})` : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        )}
                    </div>

                    {/* Dates: Billing Month & Due Date */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {t('Billing Month')}
                            </label>
                            <input
                                type="month"
                                required
                                value={billingMonth}
                                onChange={(e) => setBillingMonth(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {t('Due Date')}
                            </label>
                            <input
                                type="date"
                                required
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                            />
                        </div>
                    </div>

                    {/* Line Items Breakdown */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {t('Charge Items')}
                            </label>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                            >
                                <Plus className="size-3" />
                                <span>{t('Add Item')}</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 shadow-2xs flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        placeholder={t('Item description...')}
                                        value={item.label}
                                        onChange={(e) => handleUpdateItem(item.id, 'label', e.target.value)}
                                        className="flex-1 min-w-0 p-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    <div className="relative w-28 shrink-0">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                            ₱
                                        </span>
                                        <input
                                            type="number"
                                            step="any"
                                            min="0"
                                            placeholder="0.00"
                                            value={item.amount}
                                            onChange={(e) => handleUpdateItem(item.id, 'amount', e.target.value)}
                                            className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-right"
                                        />
                                    </div>
                                    {item.removable && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="p-1 rounded-lg text-muted-foreground hover:text-red-500 active:scale-90 transition-all shrink-0"
                                            aria-label={t('Remove item')}
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total Summary */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground">{t('Total Invoice Amount:')}</span>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            ₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Notes Field */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {t('Invoice Notes (Optional)')}
                        </label>
                        <textarea
                            rows={2}
                            placeholder={t('e.g., Includes repair surcharge or utility adjustment...')}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            maxLength={250}
                            className="w-full p-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                        />
                    </div>

                    {/* Submit & Cancel */}
                    <div className="flex items-center gap-2 pt-1">
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-98 transition-all"
                        >
                            {t('Cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || totalAmount <= 0}
                            className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                        >
                            {submitting ? (
                                <RefreshCw className="size-4 animate-spin" />
                            ) : (
                                <>
                                    <Check className="size-4" />
                                    {t('Issue Invoice')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
