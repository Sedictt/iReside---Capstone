import { X, CreditCard, Search, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

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
}

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80";

export function PaymentModal({ isOpen, onClose, category, paymentsByCategory }: PaymentModalProps) {
    const [confirmedPayments, setConfirmedPayments] = useState<string[]>([]);

    if (!category) return null;

    const payments = paymentsByCategory[category] || [];

    const handleConfirm = (e: React.MouseEvent, paymentId: string) => {
        e.stopPropagation();
        setConfirmedPayments(prev => [...prev, paymentId]);
    };

    const getStatusStyles = () => {
        switch (category) {
            case "Overdue": return "text-red-400 bg-red-500/10 border-red-500/20";
            case "Near Due": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
            case "Paid": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
        }
    };

    const getDotColor = () => {
        switch (category) {
            case "Overdue": return "bg-red-500";
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
                        className="fixed inset-0 h-screen w-screen bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-[45%] z-[101] flex max-h-[85vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl dark:border-white/10 dark:bg-[#0a0a0a]"
                    >
                        {/* Header */}
                        <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/50 p-6 dark:border-white/5 dark:bg-neutral-900/50">
                            <div className="flex items-center gap-4">
                                <div className="rounded-2xl bg-muted p-3 dark:bg-white/5">
                                    <CreditCard className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="flex items-center gap-2 text-xl font-bold text-foreground dark:text-white">
                                        {category} Payments
                                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground dark:bg-white/10 dark:text-neutral-300">
                                            {payments.length}
                                        </span>
                                    </h2>
                                    <p className="mt-1 text-xs text-muted-foreground">Detailed list of all {category.toLowerCase()} transactions.</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="shrink-0 border-b border-border p-6 dark:border-white/5">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder={`Search ${category.toLowerCase()} payments...`}
                                    className="w-full rounded-xl border border-border bg-background py-3 pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500"
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                            {payments.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 dark:border-white/10 dark:bg-black/20">
                                    <p className="text-sm font-semibold text-foreground dark:text-neutral-200">No {category.toLowerCase()} payments found.</p>
                                    <p className="mt-1 text-xs text-muted-foreground">New payment records will appear here once available.</p>
                                </div>
                            ) : (
                                payments.map((payment) => (
                                    <div key={payment.id} className="group flex cursor-pointer items-center justify-between rounded-2xl border border-transparent bg-muted/20 p-4 transition-all hover:border-border hover:bg-muted/50 dark:bg-white/[0.02] dark:hover:border-white/5 dark:hover:bg-white/[0.04]">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img src={payment.avatar || FALLBACK_AVATAR} alt={payment.tenant} className="h-12 w-12 rounded-full border-2 border-background object-cover transition-transform duration-300 group-hover:scale-105" />
                                                <div className={cn(
                                                    "absolute -bottom-0 -right-0 h-3.5 w-3.5 rounded-full border-2 border-background",
                                                    confirmedPayments.includes(payment.id) || category === "Paid" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : getDotColor()
                                                )} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground transition-colors group-hover:text-primary dark:text-white">{payment.tenant}</h4>
                                                <p className="text-xs font-medium text-muted-foreground dark:text-neutral-400">{payment.unit}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end relative overflow-hidden min-w-[120px]">
                                            <h4 className={cn(
                                                "mb-0.5 text-sm font-bold text-foreground transition-all dark:text-white",
                                                !confirmedPayments.includes(payment.id) && category !== "Paid" && "group-hover:opacity-0"
                                            )}>₱{payment.amount.toLocaleString()}</h4>
                                            <div className={cn(
                                                "flex items-center justify-end gap-1.5 mt-1 transition-all",
                                                !confirmedPayments.includes(payment.id) && category !== "Paid" && "group-hover:opacity-0"
                                            )}>
                                                <span className={cn(
                                                    "text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border",
                                                    confirmedPayments.includes(payment.id) || category === "Paid" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : getStatusStyles()
                                                )}>
                                                    {confirmedPayments.includes(payment.id) ? "Paid" : category}
                                                </span>
                                                <span className="text-[10px] font-medium text-muted-foreground">{payment.date}</span>
                                            </div>

                                            {/* Hover Confirm Button */}
                                            {category !== "Paid" && !confirmedPayments.includes(payment.id) && (
                                                <button
                                                    onClick={(e) => handleConfirm(e, payment.id)}
                                                    className="absolute inset-y-0 right-0 flex translate-x-4 items-center gap-2 rounded-xl bg-primary px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter text-primary-foreground opacity-0 transition-all whitespace-nowrap group-hover:translate-x-0 group-hover:opacity-100 active:scale-95"
                                                >
                                                    <CreditCard className="w-3.5 h-3.5" />
                                                    Confirm Payment
                                                </button>
                                            )}

                                            {/* Success State */}
                                            {confirmedPayments.includes(payment.id) && (
                                                <div className="absolute inset-y-0 right-0 flex items-center text-emerald-500 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-right-2 duration-300">
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                                    Invoice Sent
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
