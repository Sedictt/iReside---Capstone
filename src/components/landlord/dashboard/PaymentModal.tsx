import Image from "next/image";
import { X, CreditCard, Search, CheckCircle2, ChevronRight, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, m as motion } from "framer-motion";
import { DEFAULT_AVATAR_URL, getSafeAvatarBgColor } from "@/lib/constants";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: "Overdue" | "Near Due" | "Paid" | null;
    paymentsByCategory: Record<"Overdue" | "Near Due" | "Paid", PaymentListItem[]>;
}

interface PaymentListItem {
    id: string;
    tenant: string;
    unit: string;
    amount: number;
    date: string;
    avatar: string | null;
    avatarBgColor?: string | null;
}

const FALLBACK_AVATAR = DEFAULT_AVATAR_URL;
const CATEGORY_COPY: Record<"Overdue" | "Near Due" | "Paid", { title: string; description: string; filterLabel: string; emptyState: string }> = {
    Overdue: {
        title: "Past Due Rent",
        description: "Unpaid invoices past their due date.",
        filterLabel: "overdue",
        emptyState: "No overdue rent found",
    },
    "Near Due": {
        title: "Due in Next 7 Days",
        description: "Pending invoices due within one week.",
        filterLabel: "due soon",
        emptyState: "No invoices due this week",
    },
    Paid: {
        title: "Recently Paid Rent",
        description: "Most recent rent payments already received.",
        filterLabel: "paid",
        emptyState: "No recent payments found",
    },
};

export function PaymentModal({ isOpen, onClose, category, paymentsByCategory }: PaymentModalProps) {
    const [confirmedPayments, setConfirmedPayments] = useState<string[]>([]);
    const [selectedActionPayment, setSelectedActionPayment] = useState<PaymentListItem | null>(null);
    const [isConfirmingAction, setIsConfirmingAction] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    if (!category) return null;

    const payments = paymentsByCategory[category] || [];
    const categoryCopy = CATEGORY_COPY[category];

    const filteredPayments = payments.filter(payment => 
        payment.tenant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.unit.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleConfirm = (paymentId: string) => {
        setConfirmedPayments(prev => [...prev, paymentId]);
        setSelectedActionPayment(null);
    };

    const getStatusStyles = () => {
        switch (category) {
            case "Overdue": return "text-rose-600 dark:text-red-400 bg-rose-50 dark:bg-red-500/10 border-rose-100 dark:border-red-500/20";
            case "Near Due": return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20";
            case "Paid": return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20";
        }
    };

    const getDotColor = () => {
        switch (category) {
            case "Overdue": return "bg-rose-500 dark:bg-red-500";
            case "Near Due": return "bg-amber-500";
            case "Paid": return "bg-emerald-500";
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 h-screen w-screen bg-black/50 dark:bg-black/80 backdrop-blur-md z-[100] transition-opacity"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 z-[101] flex max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl neumorphic-panel"
                    >
                        {/* Header */}
                        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200/50 dark:border-white/5 bg-neutral-100/60 dark:bg-neutral-900/50 p-6 sm:p-8 backdrop-blur-xl">
                            <div className="flex items-center gap-4 sm:gap-5">
                                <div className="rounded-2xl neumorphic-inset-card p-3.5 sm:p-4 text-primary shrink-0">
                                    <CreditCard className="size-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="flex items-center gap-3 text-xl sm:text-2xl font-black text-foreground text-balance">
                                        {categoryCopy.title}
                                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary border border-primary/20 tabular-nums">
                                            {filteredPayments.length}
                                        </span>
                                    </h2>
                                    <p className="mt-1 text-xs font-medium text-muted-foreground text-pretty">{categoryCopy.description}</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="group flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl neumorphic-extruded text-muted-foreground transition-all hover:text-primary hover:rotate-90 active:scale-95"
                                aria-label="Close dialog"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Search Bar - Premium Glass */}
                        <div className="shrink-0 border-b border-neutral-200/50 dark:border-white/5 p-4 sm:p-6 bg-neutral-50/30 dark:bg-white/[0.02]">
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input maxLength={60}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={`Filter ${categoryCopy.filterLabel} entries…`}
                                    className="w-full rounded-2xl neumorphic-inset bg-background py-3.5 pl-14 pr-6 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar-premium bg-gradient-to-b from-transparent to-black/[0.03] dark:to-black/20">
                            {filteredPayments.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-white/10 bg-neutral-100/30 dark:bg-white/5 p-12 text-center backdrop-blur-sm">
                                    <p className="text-sm font-black uppercase tracking-widest text-muted-foreground/40">{categoryCopy.emptyState}</p>
                                </div>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        onClick={() => setSelectedActionPayment(payment)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedActionPayment(payment); }}}
                                        tabIndex={0}
                                        role="button"
                                        className="group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-2xl border border-neutral-200/50 dark:border-white/5 bg-card p-4 sm:p-5 transition-all hover:bg-neutral-50/80 dark:hover:bg-white/[0.06] hover:shadow-[4px_4px_12px_rgba(163,177,198,0.25)] dark:hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.01)] hover:border-primary/20 active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="relative">
                                                <div
                                                    className="relative size-12 sm:size-14 rounded-full border-2 border-background overflow-hidden transition-all duration-500 group-hover:scale-110"
                                                    style={{ backgroundColor: getSafeAvatarBgColor(payment.avatarBgColor) }}
                                                >
                                                    <Image src={payment.avatar || FALLBACK_AVATAR} alt={payment.tenant} fill sizes="56px" className="object-cover" />
                                                </div>
                                                <div className={cn(
                                                    "absolute -bottom-0.5 -right-0.5 size-3.5 sm:size-4 rounded-full border-2 border-background shadow-lg",
                                                    confirmedPayments.includes(payment.id) || category === "Paid" ? "bg-emerald-500" : getDotColor()
                                                )} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm sm:text-base font-black text-foreground transition-colors group-hover:text-primary truncate">{payment.tenant}</h4>
                                                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">{payment.unit}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="text-right flex flex-col items-end relative z-10">
                                            <h4 className="mb-1 text-sm sm:text-base font-black text-foreground tracking-tight tabular-nums">PHP {payment.amount.toLocaleString()}</h4>
                                            <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-widest">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full border border-neutral-200 dark:border-white/5 bg-neutral-100 dark:bg-white/5",
                                                    confirmedPayments.includes(payment.id) || category === "Paid" ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" : getStatusStyles()
                                                )}>
                                                    {confirmedPayments.includes(payment.id) ? "Acknowledged" : category}
                                                </span>
                                                <span className="text-muted-foreground/60">{payment.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Secondary Action Popout (Higher Z-Index) */}
                    <AnimatePresence>
                        {selectedActionPayment && (
                            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/75 backdrop-blur-md"
                                    onClick={() => {
                                        setSelectedActionPayment(null);
                                        setIsConfirmingAction(false);
                                    }}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedActionPayment(null); setIsConfirmingAction(false); }}}
                                    tabIndex={0}
                                    role="button"
                                />
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl neumorphic-panel"
                                >
                                    {!isConfirmingAction ? (
                                        <>
                                            <div className="p-6 sm:p-8 text-center pt-8 sm:pt-10">
                                                <div 
                                                    className="relative mx-auto mb-6 size-20 sm:size-24 rounded-full border-4 border-neutral-200 dark:border-primary/20 overflow-hidden"
                                                    style={{ backgroundColor: getSafeAvatarBgColor(selectedActionPayment.avatarBgColor) }}
                                                >
                                                    <Image
                                                        src={selectedActionPayment.avatar || FALLBACK_AVATAR}
                                                        alt={selectedActionPayment.tenant}
                                                        fill
                                                        sizes="96px"
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute -bottom-1 -right-1 size-6 sm:size-7 rounded-full border-4 border-background bg-emerald-500 shadow-lg" />
                                                </div>
                                                <h3 className="text-xl sm:text-2xl font-black text-foreground text-balance">{selectedActionPayment.tenant}</h3>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">{selectedActionPayment.unit}</p>
                                                
                                                <div className="mt-6 sm:mt-8 flex flex-col gap-2 rounded-2xl bg-neutral-100/50 dark:bg-white/[0.02] p-5 sm:p-6 border border-neutral-200 dark:border-white/5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Settlement Due</p>
                                                    <h4 className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter tabular-nums">PHP {selectedActionPayment.amount.toLocaleString()}</h4>
                                                </div>
                                            </div>

                                            <div className="grid gap-3 p-6 sm:p-8 pt-0">
                                                <button 
                                                    onClick={() => setIsConfirmingAction(true)}
                                                    className="group flex min-h-[48px] items-center justify-between rounded-xl bg-primary px-6 py-3.5 transition-all hover:scale-[1.02] hover:brightness-105 active:scale-95"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex size-8 items-center justify-center rounded-lg bg-white/20">
                                                            <CheckCircle2 className="size-4 text-white" />
                                                        </div>
                                                        <span className="text-xs sm:text-sm font-black uppercase tracking-tight text-white">Record Settlement</span>
                                                    </div>
                                                    <ChevronRight className="size-4 text-white/60 transition-transform group-hover:translate-x-1" />
                                                </button>

                                                <button 
                                                    onClick={() => setSelectedActionPayment(null)}
                                                    className="flex min-h-[44px] items-center justify-center rounded-xl neumorphic-extruded py-3 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-all hover:text-foreground hover:scale-[1.02] active:scale-95"
                                                >
                                                    Dismiss
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-6 sm:p-8 text-center pt-8 sm:pt-10 animate-in slide-in-from-right-4 duration-300">
                                            <div className="mx-auto mb-6 flex size-16 sm:size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                                <AlertTriangle className="size-8 sm:size-10" />
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight text-balance">Double Check</h3>
                                            
                                            <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
                                                <p className="text-xs font-black leading-relaxed text-primary/80 text-pretty">
                                                    Make sure that the tenant has already paid their rent. Seek proof of payment for GCash payments.
                                                </p>
                                            </div>

                                            <div className="mt-8 flex flex-col gap-3">
                                                <button 
                                                    onClick={() => handleConfirm(selectedActionPayment.id)}
                                                    className="w-full min-h-[48px] rounded-xl bg-primary py-3.5 text-xs sm:text-sm font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-95"
                                                >
                                                    Confirm Record
                                                </button>
                                                <button 
                                                    onClick={() => setIsConfirmingAction(false)}
                                                    className="w-full min-h-[44px] rounded-xl neumorphic-extruded py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:text-foreground hover:scale-[1.02] active:scale-95"
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
                </>
            )}
        </AnimatePresence>
    );
}
