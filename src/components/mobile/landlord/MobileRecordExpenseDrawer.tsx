'use client';

import React, { useState } from 'react';
import {
    X,
    Receipt,
    Calendar,
    DollarSign,
    Check,
    RefreshCw,
    Wrench,
    Zap,
    Building2,
    FileSpreadsheet,
    HelpCircle
} from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguageContext } from '@/context/LanguageContext';
import { useProperty } from '@/context/PropertyContext';
import { tr } from '@/hooks/useLanguage';

interface MobileRecordExpenseDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved?: () => void;
    propertyId?: string | null;
}

const CATEGORIES = [
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-orange-500 bg-orange-500/10 border-orange-500/25' },
    { id: 'utilities', label: 'Utilities', icon: Zap, color: 'text-blue-500 bg-blue-500/10 border-blue-500/25' },
    { id: 'taxes', label: 'Taxes & Fees', icon: Building2, color: 'text-purple-500 bg-purple-500/10 border-purple-500/25' },
    { id: 'other', label: 'Other', icon: FileSpreadsheet, color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/25' },
] as const;

export function MobileRecordExpenseDrawer({
    isOpen,
    onClose,
    onSaved,
    propertyId,
}: MobileRecordExpenseDrawerProps) {
    const { t } = useLanguageContext();
    const { properties } = useProperty();

    const [category, setCategory] = useState<'maintenance' | 'utilities' | 'taxes' | 'other'>('maintenance');
    const [amount, setAmount] = useState('');
    const [dateIncurred, setDateIncurred] = useState(() => new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [selectedPropId, setSelectedPropId] = useState<string>(propertyId && propertyId !== 'all' ? propertyId : '');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error(t('Please enter a valid expense amount greater than 0'));
            return;
        }

        if (!description.trim()) {
            toast.error(t('Please enter an expense description'));
            return;
        }

        setSubmitting(true);
        triggerHaptic('medium');

        try {
            const res = await fetch('/api/landlord/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category,
                    amount: numAmount,
                    date_incurred: dateIncurred,
                    description: description.trim(),
                    propertyId: selectedPropId && selectedPropId !== 'all' ? selectedPropId : undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || t('Failed to record expense'));
            }

            toast.success(t('Operating expense recorded!'));
            triggerHaptic('success');
            setAmount('');
            setDescription('');
            if (onSaved) onSaved();
            onClose();
        } catch (err: any) {
            console.error('Error recording expense:', err);
            toast.error(t(err.message || t('Failed to record expense')));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                            <Receipt className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-foreground">{t('Record Expense')}</h3>
                            <p className="text-[10px] text-muted-foreground font-semibold">
                                {t('Log building maintenance, utilities or fees')}
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

                <form onSubmit={handleSubmit} className="space-y-3.5">
                    {/* Category Selection Chips */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {t('Expense Category')}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const isSelected = category === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic('light');
                                            setCategory(cat.id);
                                        }}
                                        className={cn(
                                            "p-2.5 rounded-xl border flex items-center gap-2 transition-all text-xs font-bold",
                                            isSelected
                                                ? cat.color + " shadow-2xs font-black"
                                                : "bg-card border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="size-4 shrink-0" />
                                        <span>{t(cat.label)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Amount & Date Incurred */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {t('Amount (₱)')}
                            </label>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                required
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {t('Date Incurred')}
                            </label>
                            <input
                                type="date"
                                required
                                max={new Date().toISOString().split('T')[0]}
                                value={dateIncurred}
                                onChange={(e) => setDateIncurred(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                            />
                        </div>
                    </div>

                    {/* Property Association (Optional) */}
                    {properties.length > 0 && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {t('Associated Property (Optional)')}
                            </label>
                            <select
                                value={selectedPropId}
                                onChange={(e) => setSelectedPropId(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                            >
                                <option value="">{t('Portfolio-Wide / General')}</option>
                                {properties.map((prop) => (
                                    <option key={prop.id} value={prop.id}>
                                        {prop.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {t('Expense Description')}
                        </label>
                        <textarea
                            rows={3}
                            required
                            placeholder={t('e.g., Replaced hallway lightbulbs, Plumbing repairs, Trash collection fee...')}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={300}
                            className="w-full p-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                        />
                    </div>

                    {/* Actions */}
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
                            disabled={submitting || !amount || !description.trim()}
                            className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                        >
                            {submitting ? (
                                <RefreshCw className="size-4 animate-spin" />
                            ) : (
                                <>
                                    <Check className="size-4" />
                                    {t('Record Expense')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
