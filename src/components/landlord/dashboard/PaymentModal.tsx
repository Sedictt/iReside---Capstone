import { X, CreditCard, Search, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: "Overdue" | "Near Due" | "Paid" | null;
}

const mockPayments = {
    "Overdue": [
        { tenant: "Marcus Johnson", unit: "Unit 102", amount: 13000, date: "Feb 20, 2026", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80" },
        { tenant: "Emily Thorne", unit: "Unit 405", amount: 14500, date: "Feb 15, 2026", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" }
    ],
    "Near Due": [
        { tenant: "Alex Reyes", unit: "Unit 201", amount: 15000, date: "Mar 5, 2026", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
        { tenant: "Jason Lee", unit: "Unit 101", amount: 12000, date: "Mar 7, 2026", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" }
    ],
    "Paid": [
        { tenant: "Sarah Wilson", unit: "Studio A", amount: 12500, date: "Feb 28, 2026", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80" },
        { tenant: "Michael Chen", unit: "Unit 305", amount: 18000, date: "Feb 27, 2026", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
        { tenant: "Jessica Alba", unit: "Unit 202", amount: 15500, date: "Feb 25, 2026", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" },
        { tenant: "David Kim", unit: "Unit 301", amount: 17000, date: "Feb 25, 2026", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80" }
    ]
};

export function PaymentModal({ isOpen, onClose, category }: PaymentModalProps) {
    if (!category) return null;

    const payments = mockPayments[category] || [];
    const [confirmedPayments, setConfirmedPayments] = useState<string[]>([]);

    const handleConfirm = (e: React.MouseEvent, tenant: string) => {
        e.stopPropagation();
        setConfirmedPayments(prev => [...prev, tenant]);
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
                        className="fixed left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl z-[101] overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-neutral-900/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/5 rounded-2xl">
                                    <CreditCard className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        {category} Payments
                                        <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-bold text-neutral-300">
                                            {payments.length}
                                        </span>
                                    </h2>
                                    <p className="text-xs text-neutral-400 mt-1">Detailed list of all {category.toLowerCase()} transactions.</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="p-6 border-b border-white/5 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                                <input
                                    type="text"
                                    placeholder={`Search ${category.toLowerCase()} payments...`}
                                    className="w-full bg-neutral-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                            {payments.map((payment, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-transparent hover:border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <img src={payment.avatar} alt={payment.tenant} className="w-12 h-12 rounded-full object-cover border-2 border-[#0a0a0a] group-hover:scale-105 transition-transform duration-300" />
                                            <div className={cn(
                                                "absolute -bottom-0 -right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0a]",
                                                confirmedPayments.includes(payment.tenant) || category === "Paid" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : getDotColor()
                                            )} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{payment.tenant}</h4>
                                            <p className="text-xs text-neutral-400 font-medium">{payment.unit}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end relative overflow-hidden min-w-[120px]">
                                        <h4 className={cn(
                                            "text-sm font-bold text-white mb-0.5 transition-all",
                                            !confirmedPayments.includes(payment.tenant) && category !== "Paid" && "group-hover:opacity-0"
                                        )}>₱{payment.amount.toLocaleString()}</h4>
                                        <div className={cn(
                                            "flex items-center justify-end gap-1.5 mt-1 transition-all",
                                            !confirmedPayments.includes(payment.tenant) && category !== "Paid" && "group-hover:opacity-0"
                                        )}>
                                            <span className={cn(
                                                "text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border",
                                                confirmedPayments.includes(payment.tenant) || category === "Paid" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : getStatusStyles()
                                            )}>
                                                {confirmedPayments.includes(payment.tenant) ? "Paid" : category}
                                            </span>
                                            <span className="text-[10px] text-neutral-500 font-medium">{payment.date}</span>
                                        </div>

                                        {/* Hover Confirm Button */}
                                        {category !== "Paid" && !confirmedPayments.includes(payment.tenant) && (
                                            <button
                                                onClick={(e) => handleConfirm(e, payment.tenant)}
                                                className="absolute inset-y-0 right-0 opacity-0 group-hover:opacity-100 flex items-center gap-2 bg-primary text-black px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all translate-x-4 group-hover:translate-x-0 active:scale-95 whitespace-nowrap"
                                            >
                                                <CreditCard className="w-3.5 h-3.5" />
                                                Confirm Payment
                                            </button>
                                        )}

                                        {/* Success State */}
                                        {confirmedPayments.includes(payment.tenant) && (
                                            <div className="absolute inset-y-0 right-0 flex items-center text-emerald-500 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-right-2 duration-300">
                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                                Invoice Sent
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
