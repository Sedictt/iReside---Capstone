'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
    X,
    CreditCard,
    Search,
    CheckCircle2,
    MessageSquare,
    AlertTriangle,
    Zap,
    TrendingUp,
    ChevronRight,
    ArrowUpRight,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
}

const CATEGORY_META = {
    Overdue: {
        title: 'Past Due Rent',
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
    onPaymentSettled,
}: MobilePaymentDrawerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPayment, setSelectedPayment] = useState<MobilePaymentItem | null>(null);
    const [isConfirmingSettle, setIsConfirmingSettle] = useState(false);
    const [settledIds, setSettledIds] = useState<string[]>([]);

    if (!category) return null;

    const meta = CATEGORY_META[category];
    const Icon = meta.icon;
    const rawPayments = paymentsByCategory[category] || [];

    const payments = rawPayments.filter(
        (p) =>
            p.tenant.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.unit.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleConfirmSettlement = (id: string) => {
        setSettledIds((prev) => [...prev, id]);
        setIsConfirmingSettle(false);
        setSelectedPayment(null);
        if (onPaymentSettled) onPaymentSettled();
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
                        onClick={onClose}
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
                                            {meta.title}
                                        </h2>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black border bg-muted/60 text-foreground tabular-nums">
                                            {rawPayments.length}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground truncate">{meta.subtitle}</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="size-9 min-h-[36px] min-w-[36px] rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95 shrink-0"
                                aria-label="Close sheet"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Search Bar (Only shown if items exist or search active) */}
                        {rawPayments.length > 0 && (
                            <div className="px-5 py-2.5 border-b border-border/30 bg-muted/10 shrink-0">
                                <div className="relative flex items-center">
                                    <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Filter by tenant or unit..."
                                        maxLength={60}
                                        className="w-full rounded-xl bg-background border border-border/60 py-2 pl-10 pr-9 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 custom-scrollbar-premium">
                            {payments.length === 0 ? (
                                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 p-7 text-center flex flex-col items-center justify-center my-4">
                                    <div className="size-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shadow-xs mb-3">
                                        <CheckCircle2 className="size-6" />
                                    </div>
                                    <h3 className="text-sm font-black text-foreground">
                                        {searchQuery ? 'No matching entries' : meta.emptyTitle}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                                        {searchQuery
                                            ? `No records found matching "${searchQuery}". Try a different keyword.`
                                            : meta.emptyDesc}
                                    </p>
                                    <Link
                                        href="/mobile/landlord/payments"
                                        onClick={onClose}
                                        className="mt-4 px-4 py-2 rounded-xl neumorphic-extruded text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5 active:scale-95 transition-all"
                                    >
                                        <span>View Payments Ledger</span>
                                        <ArrowUpRight className="size-3.5" />
                                    </Link>
                                </div>
                            ) : (
                                payments.map((item) => {
                                    const isSettled = settledIds.includes(item.id) || category === 'Paid';
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedPayment(item)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
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
                                                            isSettled
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

                                            <div className="text-right shrink-0 pl-2">
                                                <span className="text-xs font-black text-foreground tabular-nums">
                                                    PHP {item.amount.toLocaleString()}
                                                </span>
                                                <div className="mt-0.5">
                                                    <span
                                                        className={cn(
                                                            'px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider',
                                                            isSettled
                                                                ? 'bg-emerald-500/10 text-emerald-500'
                                                                : category === 'Overdue'
                                                                ? 'bg-rose-500/10 text-rose-500'
                                                                : 'bg-amber-500/10 text-amber-500'
                                                        )}
                                                    >
                                                        {isSettled ? 'Settled' : category}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Bottom Actions Footer */}
                        <div className="p-4 border-t border-border/50 bg-card/95 shrink-0 flex items-center justify-between gap-3">
                            <Link
                                href="/mobile/landlord/payments"
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl border border-border/60 bg-muted/30 text-xs font-bold text-muted-foreground hover:text-foreground text-center active:scale-95 transition-all"
                            >
                                Open Full Ledger
                            </Link>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl neumorphic-primary text-xs font-black uppercase tracking-wider text-primary-foreground active:scale-95 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>

                    {/* Secondary Action Popover: Settle / Message */}
                    <AnimatePresence>
                        {selectedPayment && (
                            <div className="fixed inset-0 z-[170] flex items-end justify-center">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => {
                                        setSelectedPayment(null);
                                        setIsConfirmingSettle(false);
                                    }}
                                    className="fixed inset-0 bg-black/75 backdrop-blur-xs cursor-pointer"
                                />

                                <motion.div
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    exit={{ y: '100%' }}
                                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                                    className="relative z-10 w-full max-w-lg rounded-t-[2.5rem] border-t border-border bg-card p-5 shadow-2xl text-card-foreground flex flex-col gap-4"
                                >
                                    <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20 mx-auto -mt-1 mb-1 shrink-0" />

                                    {!isConfirmingSettle ? (
                                        <>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="relative size-12 rounded-full overflow-hidden border border-border"
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
                                                    <div>
                                                        <h3 className="text-sm font-black text-foreground">
                                                            {selectedPayment.tenant}
                                                        </h3>
                                                        <p className="text-[11px] font-bold text-muted-foreground uppercase">
                                                            {selectedPayment.unit}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPayment(null)}
                                                    className="size-8 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                            </div>

                                            <div className="rounded-2xl bg-muted/30 p-3.5 border border-border/50 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                                        Total Due
                                                    </span>
                                                    <h4 className="text-xl font-black text-foreground tabular-nums">
                                                        PHP {selectedPayment.amount.toLocaleString()}
                                                    </h4>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">
                                                    Due: {selectedPayment.date}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                <Link
                                                    href={`/mobile/landlord/messages?search=${encodeURIComponent(selectedPayment.tenant)}`}
                                                    onClick={() => {
                                                        setSelectedPayment(null);
                                                        onClose();
                                                    }}
                                                    className="py-3 rounded-xl border border-border/60 bg-muted/40 flex items-center justify-center gap-2 text-xs font-bold text-foreground active:scale-95 transition-all"
                                                >
                                                    <MessageSquare className="size-4 text-primary" />
                                                    <span>Message</span>
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={() => setIsConfirmingSettle(true)}
                                                    className="py-3 rounded-xl neumorphic-primary text-xs font-black uppercase tracking-wider text-primary-foreground flex items-center justify-center gap-2 active:scale-95 transition-all"
                                                >
                                                    <CheckCircle2 className="size-4" />
                                                    <span>Settle</span>
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-2 space-y-3">
                                            <div className="mx-auto size-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                                                <AlertTriangle className="size-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-foreground">Confirm Settlement</h3>
                                                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                                                    Mark PHP {selectedPayment.amount.toLocaleString()} from {selectedPayment.tenant} as paid?
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleConfirmSettlement(selectedPayment.id)}
                                                    className="w-full py-3 rounded-xl neumorphic-primary text-xs font-black uppercase tracking-wider text-primary-foreground active:scale-95 transition-all"
                                                >
                                                    Confirm & Mark Paid
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsConfirmingSettle(false)}
                                                    className="w-full py-2.5 rounded-xl border border-border/50 text-xs font-bold text-muted-foreground active:scale-95 transition-all"
                                                >
                                                    Go Back
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </AnimatePresence>
    );
}
