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
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <CheckCircle2 className="size-3" />
                    {statusLabel || "Paid"}
                </span>
            );
        case "pending":
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Clock className="size-3" />
                    {statusLabel || "Pending"}
                </span>
            );
        case "failed":
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                    <AlertCircle className="size-3" />
                    {statusLabel || "Failed"}
                </span>
            );
        case "refunded":
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <RotateCcw className="size-3" />
                    {statusLabel || "Refunded"}
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-surface-3 text-medium border border-divider">
                    {statusLabel || "Status"}
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                        "relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col",
                        "rounded-[2.5rem] border border-border bg-card shadow-2xl overflow-hidden"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-divider/60 bg-surface-1/40">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-inner">
                                <Receipt className="size-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-black tracking-tight text-high">
                                        Payment History
                                    </h3>
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                        Ledger
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-medium mt-0.5">
                                    {contact?.name ? `Transactions with ${contact.name}` : "Conversation Payment Records"}
                                    {contact?.unit ? ` • ${contact.unit}` : ""}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-2xl p-2.5 text-medium hover:text-high hover:bg-surface-2 transition-all active:scale-95"
                            aria-label="Close modal"
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 p-6 pb-2">
                        <div className="p-4 rounded-2xl neumorphic-inset-card border border-divider/40 flex flex-col justify-between">
                            <div className="flex items-center gap-1.5 text-disabled text-[10px] font-black uppercase tracking-wider">
                                <TrendingUp className="size-3.5 text-emerald-500" />
                                <span>Total Paid</span>
                            </div>
                            <div className="text-lg font-black text-emerald-500 mt-2">
                                ₱{totalPaid.toLocaleString()}
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl neumorphic-inset-card border border-divider/40 flex flex-col justify-between">
                            <div className="flex items-center gap-1.5 text-disabled text-[10px] font-black uppercase tracking-wider">
                                <Receipt className="size-3.5 text-primary" />
                                <span>Transactions</span>
                            </div>
                            <div className="text-lg font-black text-high mt-2">
                                {payments.length}
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl neumorphic-inset-card border border-divider/40 flex flex-col justify-between">
                            <div className="flex items-center gap-1.5 text-disabled text-[10px] font-black uppercase tracking-wider">
                                <Calendar className="size-3.5 text-blue-400" />
                                <span>Latest Payment</span>
                            </div>
                            <div className="text-xs font-black text-medium mt-2 truncate">
                                {latestDate || "None"}
                            </div>
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="px-6 py-3 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between border-b border-divider/40">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-disabled" />
                            <input
                                type="text"
                                placeholder="Search by type, date, or amount..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl neumorphic-inset-card border border-divider/60 bg-surface-2/60 text-high placeholder:text-disabled focus:outline-none focus:border-primary/50 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-disabled hover:text-high text-xs"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Status Filter Chips */}
                        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar-premium py-0.5">
                            {(["all", "paid", "pending", "failed", "refunded"] as StatusFilter[]).map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setStatusFilter(tab)}
                                    className={cn(
                                        "px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
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
                    <div className="flex-1 overflow-y-auto p-6 space-y-2.5 custom-scrollbar-premium min-h-[220px]">
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
                                    className="flex items-center justify-between p-3.5 rounded-2xl neumorphic-inset-card border border-divider/50 hover:border-primary/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="p-2.5 rounded-xl bg-surface-2 border border-divider/60 shrink-0 group-hover:scale-105 transition-transform">
                                            {getMethodIcon(payment.methodLabel)}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-high truncate">
                                                    {payment.typeLabel || "Payment"}
                                                </span>
                                                {payment.monthLabel && (
                                                    <span className="text-[10px] font-medium text-disabled hidden sm:inline-block">
                                                        • {payment.monthLabel}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-medium text-disabled">
                                                    {payment.dateLabel}
                                                </span>
                                                {payment.methodLabel && (
                                                    <span className="text-[10px] font-medium text-medium px-1.5 py-0.2 rounded bg-surface-2">
                                                        {payment.methodLabel}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        {getStatusBadge(payment.statusTone, payment.statusLabel)}
                                        <div className="text-right">
                                            <span className="text-sm font-black text-emerald-500">
                                                ₱{payment.amount.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-divider/60 bg-surface-1/40 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-disabled">
                            Showing {filteredPayments.length} of {payments.length} transactions
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs font-black text-high transition-all active:scale-95"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
