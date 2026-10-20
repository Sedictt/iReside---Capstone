"use client";

import { useState, useMemo, useEffect } from "react";
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
import { useLanguageContext } from "@/context/LanguageContext";

const STATUS_FILTER_LABELS: Record<string, string> = {
    all: "All",
    paid: "Paid",
    pending: "Pending",
    failed: "Failed",
    refunded: "Refunded",
};

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

function getStatusBadge(statusTone: PaymentHistoryEntry["statusTone"], rawStatusLabel: string, t: (phrase: string) => string) {
    const statusLabel = rawStatusLabel ? t(rawStatusLabel) : "";
    switch (statusTone) {
        case "paid":
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <CheckCircle2 className="size-3" />
                    {statusLabel || t("Paid")}
                </span>
            );
        case "pending":
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Clock className="size-3" />
                    {statusLabel || t("Pending")}
                </span>
            );
        case "failed":
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap bg-red-500/10 text-red-500 border border-red-500/20">
                    <AlertCircle className="size-3" />
                    {statusLabel || t("Failed")}
                </span>
            );
        case "refunded":
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <RotateCcw className="size-3" />
                    {statusLabel || t("Refunded")}
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap bg-surface-3 text-medium border border-divider">
                    {statusLabel || t("Status")}
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
    const { t } = useLanguageContext();
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

    // Phone widths get a bottom sheet that slides up; wider screens keep the centered dialog.
    const [isSheet, setIsSheet] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 639px)");
        const update = () => setIsSheet(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    return (
        <AnimatePresence>
            {isOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-background/80 backdrop-blur-md"
                />

                {/* Modal Dialog: slides up as a sheet on phones, scales in as a dialog otherwise */}
                <motion.div
                    initial={isSheet ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 15 }}
                    animate={isSheet ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
                    exit={isSheet ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 15 }}
                    transition={isSheet ? { type: "spring", stiffness: 420, damping: 40, mass: 0.9 } : { type: "spring", duration: 0.4, bounce: 0.1 }}
                    data-framer-sheet=""
                    className={cn(
                        "relative z-10 w-full max-w-2xl max-h-[90dvh] sm:max-h-[85vh] flex flex-col",
                        "rounded-t-[2rem] sm:rounded-[2.5rem] border border-border bg-card shadow-2xl overflow-hidden"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 p-5 sm:p-6 border-b border-divider/60 bg-surface-1/40">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                                <Receipt className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-black tracking-tight text-high truncate">
                                    {t("Payment History")}
                                </h3>
                                <p className="text-[13px] font-medium text-medium mt-0.5 truncate">
                                    {contact?.name ? t("Transactions with {name}", { name: contact.name }) : t("Conversation Payment Records")}
                                    {contact?.unit ? ` • ${contact.unit}` : ""}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-medium hover:text-high hover:bg-surface-2 transition-all active:scale-95"
                            aria-label={t("Close modal")}
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-2.5 px-5 sm:px-6 pt-5 pb-2">
                        <div className="p-3.5 rounded-2xl neumorphic-inset-card border border-divider/40 flex flex-col gap-2 min-w-0">
                            <div className="flex items-center gap-1.5 text-disabled text-xs font-semibold leading-tight">
                                <TrendingUp className="size-3.5 shrink-0 text-emerald-500" />
                                <span>{t("Total Paid")}</span>
                            </div>
                            <div className="text-base font-black text-emerald-500 tabular-nums leading-tight break-words">
                                ₱{totalPaid.toLocaleString()}
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl neumorphic-inset-card border border-divider/40 flex flex-col gap-2 min-w-0">
                            <div className="flex items-center gap-1.5 text-disabled text-xs font-semibold leading-tight">
                                <Receipt className="size-3.5 shrink-0 text-primary" />
                                <span>{t("Transactions")}</span>
                            </div>
                            <div className="text-base font-black text-high tabular-nums leading-tight">
                                {payments.length}
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl neumorphic-inset-card border border-divider/40 flex flex-col gap-2 min-w-0">
                            <div className="flex items-center gap-1.5 text-disabled text-xs font-semibold leading-tight">
                                <Calendar className="size-3.5 shrink-0 text-blue-400" />
                                <span>{t("Latest Payment")}</span>
                            </div>
                            <div className="text-sm font-bold text-high leading-tight">
                                {latestDate || t("None")}
                            </div>
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="px-5 sm:px-6 py-3 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between border-b border-divider/40">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-disabled" />
                            <input maxLength={60}
                                type="text"
                                placeholder={t("Search by type, date, or amount...")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full min-h-[44px] pl-10 pr-10 text-sm rounded-2xl neumorphic-inset-card border border-divider/60 bg-surface-2/60 text-high placeholder:text-disabled focus:outline-none focus:border-primary/50 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    aria-label={t("Clear search")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-disabled hover:text-high"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>

                        {/* Status Filter Chips */}
                        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar-premium py-0.5 -mx-5 px-5 sm:mx-0 sm:px-0">
                            {(["all", "paid", "pending", "failed", "refunded"] as StatusFilter[]).map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setStatusFilter(tab)}
                                    aria-pressed={statusFilter === tab}
                                    className={cn(
                                        "min-h-[36px] px-3.5 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap shrink-0",
                                        statusFilter === tab
                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                            : "bg-surface-2 text-medium hover:text-high hover:bg-surface-3"
                                    )}
                                >
                                    {t(STATUS_FILTER_LABELS[tab] ?? tab)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable Transaction List */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-2.5 custom-scrollbar-premium min-h-[220px]">
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
                                <p className="text-sm font-black text-high">{t("No payment records found")}</p>
                                <p className="text-xs font-medium text-disabled mt-1 max-w-xs">
                                    {searchQuery || statusFilter !== "all"
                                        ? t("Try adjusting your filters or search keywords.")
                                        : t("There are no logged payment transactions for this conversation yet.")}
                                </p>
                            </div>
                        ) : (
                            filteredPayments.map((payment, idx) => (
                                <div
                                    key={payment.id || `full-pay-${payment.dateLabel || idx}-${idx}`}
                                    className="flex flex-col gap-3 p-4 rounded-2xl neumorphic-inset-card border border-divider/50 hover:border-primary/30 transition-all"
                                >
                                    {/* Row 1: what, when, how much */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 border border-divider/60">
                                            {getMethodIcon(payment.methodLabel)}
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-sm font-bold text-high truncate">
                                                {payment.typeLabel ? t(payment.typeLabel) : t("Payment")}
                                            </span>
                                            <span className="text-xs font-medium text-disabled mt-0.5 truncate">
                                                {payment.dateLabel}
                                                {payment.monthLabel ? ` • ${payment.monthLabel}` : ""}
                                            </span>
                                        </div>
                                        <span className="text-base font-black text-emerald-500 tabular-nums shrink-0">
                                            ₱{payment.amount.toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Row 2: status and method */}
                                    <div className="flex items-center justify-between gap-3">
                                        {getStatusBadge(payment.statusTone, payment.statusLabel, t)}
                                        {payment.methodLabel && (
                                            <span className="text-xs font-semibold text-medium px-2.5 py-1 rounded-full bg-surface-2 whitespace-nowrap">
                                                {t(payment.methodLabel)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4 border-t border-divider/60 bg-surface-1/40 flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-disabled">
                            {t("Showing {shown} of {total} transactions", { shown: filteredPayments.length, total: payments.length })}
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="min-h-[44px] px-5 rounded-full bg-surface-2 hover:bg-surface-3 text-sm font-semibold text-high transition-all active:scale-95 whitespace-nowrap"
                        >
                            {t("Close")}
                        </button>
                    </div>
                </motion.div>
            </div>
            )}
        </AnimatePresence>
    );
}
