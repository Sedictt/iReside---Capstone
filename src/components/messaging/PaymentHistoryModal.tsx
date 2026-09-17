"use client";

import { useState, useMemo } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
    X,
    Wallet,
    CreditCard,
    Calendar,
    Search,
    CheckCircle2,
    Clock,
    AlertCircle,
    RotateCcw,
    Receipt,
    TrendingUp,
    Building2,
    Coins,
    Sparkles,
    ArrowUpRight,
    Filter
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { RoleBadge, type BadgeRole } from "@/components/profile/RoleBadge";
import type { ContactItem } from "@/components/landlord/messages/types";
import type { PaymentHistoryEntry } from "@/lib/messages/client";

interface PaymentHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact: ContactItem | null;
    payments: PaymentHistoryEntry[];
    totalPaid: number;
    isLoading?: boolean;
    role?: "landlord" | "tenant";
}

type StatusFilter = "all" | "paid" | "pending" | "failed" | "refunded";

function getMethodIcon(methodLabel: string = "") {
    const lower = methodLabel.toLowerCase();
    if (lower.includes("gcash")) return <Coins className="size-3.5 text-blue-400" />;
    if (lower.includes("maya")) return <Sparkles className="size-3.5 text-emerald-400" />;
    if (lower.includes("cash")) return <Wallet className="size-3.5 text-green-400" />;
    if (lower.includes("bank") || lower.includes("transfer")) return <Building2 className="size-3.5 text-cyan-400" />;
    if (lower.includes("card")) return <CreditCard className="size-3.5 text-indigo-400" />;
    return <Wallet className="size-3.5 text-primary" />;
}

function getStatusBadge(statusTone: PaymentHistoryEntry["statusTone"], statusLabel: string) {
    switch (statusTone) {
        case "paid":
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 whitespace-nowrap shrink-0">
                    <CheckCircle2 className="size-3 shrink-0" />
                    <span>{statusLabel || "Paid"}</span>
                </span>
            );
        case "pending":
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 whitespace-nowrap shrink-0">
                    <Clock className="size-3 shrink-0" />
                    <span>{statusLabel || "Pending"}</span>
                </span>
            );
        case "failed":
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 whitespace-nowrap shrink-0">
                    <AlertCircle className="size-3 shrink-0" />
                    <span>{statusLabel || "Failed"}</span>
                </span>
            );
        case "refunded":
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 whitespace-nowrap shrink-0">
                    <RotateCcw className="size-3 shrink-0" />
                    <span>{statusLabel || "Refunded"}</span>
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-surface-3 text-medium border border-divider whitespace-nowrap shrink-0">
                    <span>{statusLabel || "Status"}</span>
                </span>
            );
    }
}

export function PaymentHistoryModal({
    isOpen,
    onClose,
    contact,
    payments = [],
    totalPaid = 0,
    isLoading = false,
    role = "landlord"
}: PaymentHistoryModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    const filteredPayments = useMemo(() => {
        return payments.filter((item) => {
            if (statusFilter !== "all" && item.statusTone !== statusFilter) {
                return false;
            }
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const matchesType = (item.typeLabel || "").toLowerCase().includes(query);
                const matchesMethod = (item.methodLabel || "").toLowerCase().includes(query);
                const matchesMonth = (item.monthLabel || "").toLowerCase().includes(query);
                const matchesDate = (item.dateLabel || "").toLowerCase().includes(query);
                const matchesAmount = item.amount.toString().includes(query);
                const matchesStatus = (item.statusLabel || "").toLowerCase().includes(query);
                return matchesType || matchesMethod || matchesMonth || matchesDate || matchesAmount || matchesStatus;
            }
            return true;
        });
    }, [payments, statusFilter, searchQuery]);

    const latestDate = useMemo(() => {
        if (!payments.length) return null;
        return payments[0]?.dateLabel || null;
    }, [payments]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-background/80 backdrop-blur-md"
                />

                {/* Modal Dialog */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
                    className={cn(
                        "relative z-10 w-full max-w-xl max-h-[90vh] flex flex-col",
                        "rounded-3xl sm:rounded-[2.5rem] border border-border bg-card shadow-2xl overflow-hidden"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-5 border-b border-divider/60 bg-surface-1/40">
                        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                            <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-inner shrink-0">
                                <Receipt className="size-5 sm:size-6" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base sm:text-xl font-black tracking-tight text-high truncate">
                                        Payment History
                                    </h3>
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                                        Ledger
                                    </span>
                                </div>
                                <p className="text-[11px] sm:text-xs font-medium text-medium mt-0.5 truncate">
                                    {contact?.name ? `Transactions with ${contact.name}` : "Conversation Payment Records"}
                                    {contact?.unit ? ` • ${contact.unit}` : ""}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-2xl p-2 sm:p-2.5 text-medium hover:text-high hover:bg-surface-2 transition-all active:scale-95 shrink-0 ml-2"
                            aria-label="Close modal"
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 px-4 sm:px-6 pt-3.5 sm:pt-5 pb-2">
                        <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl neumorphic-inset-card border border-divider/40 flex flex-col justify-between overflow-hidden">
                            <div className="flex items-center gap-1 sm:gap-1.5 text-disabled text-[8.5px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-wider truncate">
                                <TrendingUp className="size-3 sm:size-3.5 text-emerald-500 shrink-0" />
                                <span className="truncate">Total Paid</span>
                            </div>
                            <div className="text-xs sm:text-lg font-black text-emerald-500 mt-1.5 sm:mt-2 truncate">
                                ₱{totalPaid.toLocaleString()}
                            </div>
                        </div>

                        <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl neumorphic-inset-card border border-divider/40 flex flex-col justify-between overflow-hidden">
                            <div className="flex items-center gap-1 sm:gap-1.5 text-disabled text-[8.5px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-wider truncate">
                                <Receipt className="size-3 sm:size-3.5 text-primary shrink-0" />
                                <span className="truncate">Records</span>
                            </div>
                            <div className="text-xs sm:text-lg font-black text-high mt-1.5 sm:mt-2">
                                {payments.length}
                            </div>
                        </div>

                        <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl neumorphic-inset-card border border-divider/40 flex flex-col justify-between overflow-hidden">
                            <div className="flex items-center gap-1 sm:gap-1.5 text-disabled text-[8.5px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-wider truncate">
                                <Calendar className="size-3 sm:size-3.5 text-blue-400 shrink-0" />
                                <span className="truncate">Latest</span>
                            </div>
                            <div className="text-[10px] sm:text-xs font-black text-medium mt-1.5 sm:mt-2 truncate" title={latestDate || undefined}>
                                {latestDate || "None"}
                            </div>
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between border-b border-divider/40">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-disabled" />
                            <input
                                type="text"
                                placeholder="Search by type, date, or amount..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 text-xs rounded-xl neumorphic-inset-card border border-divider/60 bg-surface-2/60 text-high placeholder:text-disabled focus:outline-none focus:border-primary/50 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-disabled hover:text-high text-xs"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Status Filter Chips */}
                        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar-premium py-0.5 no-scrollbar">
                            {(["all", "paid", "pending", "failed", "refunded"] as StatusFilter[]).map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setStatusFilter(tab)}
                                    className={cn(
                                        "px-2.5 py-1 sm:py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                                        statusFilter === tab
                                            ? "bg-primary text-white shadow-md shadow-primary/20 scale-100"
                                            : "bg-surface-2 text-medium hover:text-high hover:bg-surface-3"
                                    )}
                                >
                                    {tab === "all" ? "All" : tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable Transaction List */}
                    <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-3 sm:py-4 space-y-2.5 custom-scrollbar-premium min-h-[220px]">
                        {isLoading ? (
                            <div className="space-y-3 py-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-surface-2" />
                                ))}
                            </div>
                        ) : filteredPayments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center neumorphic-inset rounded-3xl">
                                <div className="p-3.5 rounded-full bg-surface-2 mb-3">
                                    <Wallet className="size-6 text-disabled" />
                                </div>
                                <p className="text-sm font-black text-high">No payment records found</p>
                                <p className="text-xs font-medium text-disabled mt-1 max-w-xs">
                                    {searchQuery || statusFilter !== "all"
                                        ? "Try adjusting your filters or search keywords."
                                        : "There are no logged payment transactions for this conversation yet."}
                                </p>
                            </div>
                        ) : (
                            filteredPayments.map((payment, idx) => (
                                <div
                                    key={payment.id || `full-pay-${payment.dateLabel || idx}-${idx}`}
                                    className="p-3 sm:p-3.5 rounded-2xl neumorphic-inset-card border border-divider/50 hover:border-primary/30 transition-all flex flex-col gap-2 group"
                                >
                                    {/* Top Line: Icon + Title + Amount */}
                                    <div className="flex items-center justify-between gap-2.5">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="p-2 sm:p-2.5 rounded-xl bg-surface-2 border border-divider/60 shrink-0 group-hover:scale-105 transition-transform">
                                                {getMethodIcon(payment.methodLabel)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <h4 className="text-xs sm:text-sm font-black text-high truncate">
                                                        {payment.typeLabel || "Payment"}
                                                    </h4>
                                                    {payment.monthLabel && (
                                                        <span className="text-[10px] font-medium text-disabled truncate">
                                                            • {payment.monthLabel}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="text-xs sm:text-sm font-black text-emerald-500">
                                                ₱{payment.amount.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bottom Line: Date + Method Badge + Status Badge */}
                                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-divider/30 text-[10px]">
                                        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                                            <span className="font-semibold text-disabled whitespace-nowrap">
                                                {payment.dateLabel}
                                            </span>
                                            {payment.methodLabel && (
                                                <span className="font-medium text-medium px-1.5 py-0.5 rounded-md bg-surface-2 border border-divider/40 whitespace-nowrap">
                                                    {payment.methodLabel}
                                                </span>
                                            )}
                                        </div>

                                        <div className="shrink-0">
                                            {getStatusBadge(payment.statusTone, payment.statusLabel)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-divider/60 bg-surface-1/40 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-disabled">
                            Showing {filteredPayments.length} of {payments.length} transactions
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs font-black text-high transition-all active:scale-95"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
