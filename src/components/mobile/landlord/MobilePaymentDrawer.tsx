'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Search,
    CheckCircle2,
    MessageSquare,
    AlertCircle,
    Zap,
    TrendingUp,
    ChevronRight,
    ArrowUpRight,
    Banknote,
    Send,
    Receipt,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageContext } from '@/context/LanguageContext';
import { DEFAULT_AVATAR_URL, getSafeAvatarBgColor } from '@/lib/constants';

export interface MobilePaymentItem {
    id: string;
    tenant: string;
    unit: string;
    amount: number;
    status: 'Overdue' | 'Near Due' | 'Paid';
    date: string;
    avatar: string | null;
    avatarBgColor?: string | null;
}

interface MobilePaymentDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    category: 'Overdue' | 'Near Due' | 'Paid' | null;
    paymentsByCategory: Record<'Overdue' | 'Near Due' | 'Paid', MobilePaymentItem[]>;
    onPaymentSettled?: () => void;
    onRecordPayment?: (invoiceId: string) => void;
}

const CATEGORY_META = {
    Overdue: {
        title: 'Unpaid Rent',
        subtitle: 'Unpaid invoices past their scheduled due date.',
        icon: Zap,
        badgeBg: 'bg-rose-500/15 text-rose-500 border-rose-500/20',
        emptyTitle: 'All Caught Up!',
        emptyDesc: 'No overdue rent balances found. All tenant accounts are in good standing.',
    },
    'Near Due': {
        title: 'Due in Next 7 Days',
        subtitle: 'Upcoming invoices due within the current week.',
        icon: TrendingUp,
        badgeBg: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
        emptyTitle: 'Clear Horizon',
        emptyDesc: 'No invoices are due in the next 7 days.',
    },
    Paid: {
        title: 'Recently Received Rent',
        subtitle: 'Most recent payments settled across your units.',
        icon: CheckCircle2,
        badgeBg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
        emptyTitle: 'No Recent Records',
        emptyDesc: 'No recent payment transactions recorded in this period.',
    },
};

export function MobilePaymentDrawer({
    isOpen,
    onClose,
    category,
    paymentsByCategory,
    onRecordPayment,
}: MobilePaymentDrawerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPayment, setSelectedPayment] = useState<MobilePaymentItem | null>(null);
    const [isSendingReminder, setIsSendingReminder] = useState(false);
    const [reminderFeedback, setReminderFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const { t } = useLanguageContext();

    if (!category) return null;

    const meta = CATEGORY_META[category];
    const Icon = meta.icon;
    const rawPayments = paymentsByCategory[category] || [];
    const trimmedQuery = searchQuery.trim();

    const payments = rawPayments.filter(
        (p) =>
            p.tenant.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
            p.unit.toLowerCase().includes(trimmedQuery.toLowerCase())
    );

    const handleCloseTarget = () => {
        setSelectedPayment(null);
        setReminderFeedback(null);
        setIsSendingReminder(false);
    };

    const handleSendReminder = async (item: MobilePaymentItem) => {
        setIsSendingReminder(true);
        setReminderFeedback(null);
        try {
            const res = await fetch(`/api/landlord/invoices/${item.id}/reminder`, {
                method: 'POST',
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Unable to send reminder right now.');
            }
            setReminderFeedback({
                type: 'success',
                message: t('Payment reminder sent to {tenant}!', { tenant: item.tenant }),
            });
        } catch (err: any) {
            setReminderFeedback({
                type: 'error',
                message: t(err?.message || 'Unable to send reminder right now.'),
            });
        } finally {
            setIsSendingReminder(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-end justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            handleCloseTarget();
                            onClose();
                        }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
                    />

                    {/* Native Mobile Bottom Sheet Container */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="relative z-10 w-full max-w-lg rounded-t-[2.5rem] border-t border-border/80 bg-card text-card-foreground shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
                    >
                        {/* Drag Handle Indicator */}
                        <div className="pt-3 pb-1 shrink-0 flex justify-center">
                            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
                        </div>

                        {/* Sheet Header */}
                        <div className="px-5 pt-2 pb-3.5 border-b border-border/50 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={cn('size-10 rounded-2xl flex items-center justify-center shrink-0 border', meta.badgeBg)}>
                                    <Icon className="size-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-black text-foreground tracking-tight truncate">
                                            {t(meta.title)}
                                        </h2>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black border bg-muted/60 text-foreground tabular-nums">
                                            {payments.length}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground truncate">{t(meta.subtitle)}</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    handleCloseTarget();
                                    onClose();
                                }}
                                className="size-9 min-h-[36px] min-w-[36px] rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95 shrink-0"
                                aria-label={t('Close sheet')}
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Search Bar - High Visual Affordance */}
                        <div className="px-5 py-3 border-b border-border/40 bg-muted/20 shrink-0">
                            <div className="relative group flex items-center">
                                <Search
                                    className="absolute left-3.5 size-4 text-slate-400 dark:text-neutral-400 group-focus-within:text-primary pointer-events-none transition-colors"
                                    aria-hidden="true"
                                />
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('Search by tenant name or unit number...')}
                                    aria-label={t('Search by tenant name or unit number...')}
                                    maxLength={60}
                                    className="w-full rounded-xl bg-white dark:bg-neutral-950/90 border-2 border-slate-200/90 dark:border-white/15 py-2.5 pl-10 pr-9 text-xs font-medium text-foreground shadow-xs placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        aria-label={t('Clear search')}
                                        className="absolute right-2.5 flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 custom-scrollbar-premium overscroll-contain">
                            {payments.length === 0 ? (
                                trimmedQuery ? (
                                    <div className="rounded-3xl border border-border/60 bg-card p-7 text-center flex flex-col items-center justify-center my-4">
                                        <div className="size-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center shadow-xs mb-3">
                                            <Search className="size-6" />
                                        </div>
                                        <h3 className="text-sm font-black text-foreground">
                                            {t('No results found matching "{query}"', { query: trimmedQuery })}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                                            {t('Try searching with a different tenant name or unit number.')}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="mt-4 px-4 py-2 rounded-xl border border-border bg-background text-xs font-bold text-foreground active:scale-95 transition-all"
                                        >
                                            {t('Clear All Filters')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 p-7 text-center flex flex-col items-center justify-center my-4">
                                        <div className="size-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shadow-xs mb-3">
                                            <CheckCircle2 className="size-6" />
                                        </div>
                                        <h3 className="text-sm font-black text-foreground">
                                            {t(meta.emptyTitle)}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                                            {t(meta.emptyDesc)}
                                        </p>
                                        <Link
                                            href="/mobile/landlord/payments"
                                            onClick={onClose}
                                            className="mt-4 px-4 py-2 rounded-xl neumorphic-extruded text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5 active:scale-95 transition-all"
                                        >
                                            <span>{t('View Bills & Receipts')}</span>
                                            <ArrowUpRight className="size-3.5" />
                                        </Link>
                                    </div>
                                )
                            ) : (
                                payments.map((item) => {
                                    const isPaidCategory = category === 'Paid';
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                setReminderFeedback(null);
                                                setSelectedPayment(item);
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setReminderFeedback(null);
                                                    setSelectedPayment(item);
                                                }
                                            }}
                                            className="group relative flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-card hover:bg-muted/30 active:scale-[0.99] transition-all cursor-pointer shadow-2xs"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="relative shrink-0">
                                                    <div
                                                        className="relative size-11 rounded-full border border-border/80 overflow-hidden"
                                                        style={{
                                                            backgroundColor: getSafeAvatarBgColor(item.avatarBgColor),
                                                        }}
                                                    >
                                                        <Image
                                                            src={item.avatar || DEFAULT_AVATAR_URL}
                                                            alt={item.tenant}
                                                            fill
                                                            sizes="44px"
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            'absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card',
                                                            isPaidCategory
                                                                ? 'bg-emerald-500'
                                                                : category === 'Overdue'
                                                                ? 'bg-rose-500'
                                                                : 'bg-amber-500'
                                                        )}
                                                    />
                                                </div>

                                                <div className="min-w-0">
                                                    <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors truncate">
                                                        {item.tenant}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                            {item.unit}
                                                        </span>
                                                        <span className="text-muted-foreground/40">•</span>
                                                        <span className="text-[10px] text-muted-foreground">{item.date}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 pl-2">
                                                <div className="text-right">
                                                    <span className="text-xs font-black text-foreground tabular-nums">
                                                        PHP {item.amount.toLocaleString()}
                                                    </span>
                                                    <div className="mt-0.5">
                                                        <span
                                                            className={cn(
                                                                'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider',
                                                                isPaidCategory
                                                                    ? 'bg-emerald-500/10 text-emerald-500'
                                                                    : category === 'Overdue'
                                                                    ? 'bg-rose-500/10 text-rose-500'
                                                                    : 'bg-amber-500/10 text-amber-500'
                                                            )}
                                                        >
                                                            {t(category)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="size-4 text-muted-foreground/60" aria-hidden="true" />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Bottom Actions Footer */}
                        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-border/50 bg-card/95 shrink-0 flex items-center justify-between gap-3">
                            <Link
                                href="/mobile/landlord/payments"
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl border border-border/60 bg-muted/30 text-xs font-bold text-muted-foreground hover:text-foreground text-center active:scale-95 transition-all"
                            >
                                {t('View Bills & Receipts')}
                            </Link>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl neumorphic-primary text-xs font-black uppercase tracking-wider text-primary-foreground active:scale-95 transition-all"
                            >
                                {t('Done')}
                            </button>
                        </div>
                    </motion.div>

                    {/* Secondary Action Bottom Sheet: Record Payment / Remind / Message / Inspect */}
                    <AnimatePresence>
                        {selectedPayment && (
                            <div className="fixed inset-0 z-[170] flex items-end justify-center">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={handleCloseTarget}
                                    className="fixed inset-0 bg-black/75 backdrop-blur-xs cursor-pointer"
                                />

                                <motion.div
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    exit={{ y: '100%' }}
                                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                                    className="relative z-10 w-full max-w-lg rounded-t-[2.5rem] border-t border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl text-card-foreground flex flex-col gap-4"
                                >
                                    <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20 mx-auto -mt-1 mb-1 shrink-0" />

                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className="relative size-12 rounded-full overflow-hidden border border-border shrink-0"
                                                style={{
                                                    backgroundColor: getSafeAvatarBgColor(selectedPayment.avatarBgColor),
                                                }}
                                            >
                                                <Image
                                                    src={selectedPayment.avatar || DEFAULT_AVATAR_URL}
                                                    alt={selectedPayment.tenant}
                                                    fill
                                                    sizes="48px"
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-black text-foreground truncate">
                                                    {selectedPayment.tenant}
                                                </h3>
                                                <p className="text-[11px] font-bold text-muted-foreground uppercase">
                                                    {selectedPayment.unit}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCloseTarget}
                                            className="size-8 min-h-[36px] min-w-[36px] rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground shrink-0"
                                            aria-label={t('Close')}
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>

                                    <div className="rounded-2xl bg-muted/30 p-3.5 border border-border/50 flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                                                {category === 'Paid' ? t('Amount Paid') : t('Amount Due')}
                                            </span>
                                            <h4 className="text-xl font-black text-foreground tabular-nums">
                                                PHP {selectedPayment.amount.toLocaleString()}
                                            </h4>
                                        </div>
                                        <span className="text-[11px] font-semibold text-muted-foreground">
                                            {category === 'Paid'
                                                ? t('Paid: {date}', { date: selectedPayment.date })
                                                : t('Due: {date}', { date: selectedPayment.date })}
                                        </span>
                                    </div>

                                    {reminderFeedback && (
                                        <div
                                            className={cn(
                                                'flex items-center gap-2 rounded-xl border p-3 text-xs font-bold',
                                                reminderFeedback.type === 'success'
                                                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                    : 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                            )}
                                            role="status"
                                        >
                                            {reminderFeedback.type === 'success' ? (
                                                <CheckCircle2 className="size-4 shrink-0" />
                                            ) : (
                                                <AlertCircle className="size-4 shrink-0" />
                                            )}
                                            <span>{reminderFeedback.message}</span>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2.5 pt-1">
                                        {category !== 'Paid' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const targetId = selectedPayment.id;
                                                        handleCloseTarget();
                                                        onClose();
                                                        if (onRecordPayment) {
                                                            onRecordPayment(targetId);
                                                        }
                                                    }}
                                                    className="w-full min-h-[48px] px-4 py-3 rounded-xl neumorphic-primary text-primary-foreground flex items-center justify-between gap-2 active:scale-95 transition-all"
                                                >
                                                    <div className="flex items-center gap-2.5 text-left">
                                                        <Banknote className="size-4 shrink-0" />
                                                        <div>
                                                            <span className="block text-xs font-black uppercase tracking-wider">
                                                                {t('Record Payment')}
                                                            </span>
                                                            <span className="block text-[10px] font-medium opacity-85">
                                                                {t('Verify payment method, amount, and receipt details')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="size-4 shrink-0 opacity-80" />
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={isSendingReminder}
                                                    onClick={() => handleSendReminder(selectedPayment)}
                                                    className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-center gap-2 text-xs font-bold text-foreground active:scale-95 transition-all disabled:opacity-60"
                                                >
                                                    {isSendingReminder ? (
                                                        <Loader2 className="size-4 animate-spin text-primary" />
                                                    ) : (
                                                        <Send className="size-4 text-primary" />
                                                    )}
                                                    <span>
                                                        {isSendingReminder
                                                            ? t('Sending Reminder...')
                                                            : t('Send Payment Reminder')}
                                                    </span>
                                                </button>
                                            </>
                                        )}

                                        <div className="grid grid-cols-2 gap-2">
                                            <Link
                                                href={`/mobile/landlord/messages?search=${encodeURIComponent(selectedPayment.tenant)}`}
                                                onClick={() => {
                                                    handleCloseTarget();
                                                    onClose();
                                                }}
                                                className="min-h-[44px] py-2.5 rounded-xl border border-border/60 bg-muted/40 flex items-center justify-center gap-2 text-xs font-bold text-foreground active:scale-95 transition-all"
                                            >
                                                <MessageSquare className="size-4 text-primary" />
                                                <span>{t('Message Tenant')}</span>
                                            </Link>

                                            <Link
                                                href="/mobile/landlord/payments"
                                                onClick={() => {
                                                    handleCloseTarget();
                                                    onClose();
                                                }}
                                                className="min-h-[44px] py-2.5 rounded-xl border border-border/60 bg-muted/40 flex items-center justify-center gap-1.5 text-xs font-bold text-foreground active:scale-95 transition-all"
                                            >
                                                <Receipt className="size-4 text-primary" />
                                                <span>{t('View Invoice')}</span>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </AnimatePresence>
    );
}
