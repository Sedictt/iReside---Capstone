"use client";

import React, { useState, useEffect, useMemo } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { 
    X, 
    Search, 
    Receipt, 
    CheckCircle2, 
    Calendar, 
    Building2, 
    AlertCircle, 
    Sparkles, 
    Banknote, 
    Loader2, 
    RefreshCw, 
    Check, 
    HelpCircle,
    Landmark,
    Send,
    Layers,
    Filter,
    CheckSquare,
    Square
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProperty } from "@/context/PropertyContext";
import type { InvoiceListItem } from "@/lib/billing/server";
import { formatPhpCurrency } from "@/lib/billing/utils";

interface CollectPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPaymentRecorded?: () => void;
}

type PaymentMethodType = "cash" | "gcash" | "bank_transfer";
type FilterStatusType = "all" | "overdue" | "pending";

// Custom GCash SVG Icon
function GCashIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 8h-4a4 4 0 1 0 0 8h4v-4h-4" />
        </svg>
    );
}

const PAYMENT_METHODS: Array<{ id: PaymentMethodType; title: string; subtitle?: string; icon: React.ElementType }> = [
    { id: "cash", title: "Cash", subtitle: "Hand-to-Hand", icon: Banknote },
    { id: "gcash", title: "GCash", icon: GCashIcon },
    { id: "bank_transfer", title: "Bank", subtitle: "Transfer", icon: Landmark },
];

function formatWithCommas(value: string | number): string {
    if (value === undefined || value === null) return "";
    const str = value.toString().replace(/,/g, "");
    if (str === "") return "";
    const parts = str.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
}

export function CollectPaymentModal({ isOpen, onClose, onPaymentRecorded }: CollectPaymentModalProps) {
    const { selectedPropertyId } = useProperty();
    
    // State
    const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<FilterStatusType>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [amount, setAmount] = useState<string>("");
    const [method, setMethod] = useState<PaymentMethodType>("cash");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isSendingReminder, setIsSendingReminder] = useState(false);
    const [reminderSuccessMsg, setReminderSuccessMsg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successResult, setSuccessResult] = useState<{
        receiptNumber: string;
        amount: number;
        tenant: string;
        unit: string;
        isFullyPaid: boolean;
        isBulk?: boolean;
        count?: number;
    } | null>(null);

    // Fetch invoices on open
    useEffect(() => {
        if (!isOpen) return;

        setError(null);
        setReminderSuccessMsg(null);
        setSuccessResult(null);
        setIsConfirmDialogOpen(false);
        setSelectedInvoiceIds([]);
        setStatusFilter("all");
        setAmount("");
        setReferenceNumber("");
        setNote("");
        setMethod("cash");

        const fetchInvoices = async () => {
            setLoadingInvoices(true);
            try {
                const params = new URLSearchParams();
                if (selectedPropertyId && selectedPropertyId !== "all") {
                    params.set("propertyId", selectedPropertyId);
                }
                const res = await fetch(`/api/landlord/invoices?${params.toString()}`);
                if (!res.ok) throw new Error("Failed to load invoices");
                const data = await res.json();
                const fetchedInvoices: InvoiceListItem[] = data.invoices || [];
                setInvoices(fetchedInvoices);

                // Auto-select first unpaid invoice if available
                const firstCollectible = fetchedInvoices.find(
                    (inv) => inv.balanceRemaining > 0 || !["paid", "receipted", "confirmed"].includes(inv.status)
                );
                if (firstCollectible) {
                    setSelectedInvoiceIds([firstCollectible.id]);
                    const dueAmount = firstCollectible.balanceRemaining > 0 ? firstCollectible.balanceRemaining : firstCollectible.amount;
                    setAmount(formatWithCommas(dueAmount.toFixed(2)));
                }
            } catch (err: any) {
                console.error("Error loading collectible invoices:", err);
                setError("Unable to load invoices. Please try again.");
            } finally {
                setLoadingInvoices(false);
            }
        };

        fetchInvoices();
    }, [isOpen, selectedPropertyId]);

    // Unpaid / Collectible Invoices Filter
    const collectibleInvoices = useMemo(() => {
        return invoices.filter((inv) => {
            const hasBalance = inv.balanceRemaining > 0;
            const isUnpaid = !["paid", "receipted", "confirmed"].includes(inv.status) || hasBalance;
            return isUnpaid;
        });
    }, [invoices]);

    // Filtered by status and search query
    const filteredInvoices = useMemo(() => {
        return collectibleInvoices.filter((inv) => {
            // Status filter
            if (statusFilter === "overdue" && inv.status !== "overdue") return false;
            if (statusFilter === "pending" && inv.status === "overdue") return false;

            // Search filter
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                inv.tenant.toLowerCase().includes(q) ||
                inv.unit.toLowerCase().includes(q) ||
                inv.invoiceNumber.toLowerCase().includes(q) ||
                inv.property.toLowerCase().includes(q)
            );
        });
    }, [collectibleInvoices, statusFilter, searchQuery]);

    // Counts for filter pills
    const overdueCount = useMemo(() => collectibleInvoices.filter(i => i.status === "overdue").length, [collectibleInvoices]);
    const pendingCount = useMemo(() => collectibleInvoices.filter(i => i.status !== "overdue").length, [collectibleInvoices]);

    // Active selected invoices list
    const selectedInvoicesList = useMemo(() => {
        return collectibleInvoices.filter((inv) => selectedInvoiceIds.includes(inv.id));
    }, [collectibleInvoices, selectedInvoiceIds]);

    // Single active invoice (when 1 selected)
    const singleSelectedInvoice = useMemo(() => {
        return selectedInvoicesList.length === 1 ? selectedInvoicesList[0] : null;
    }, [selectedInvoicesList]);

    // Total due for all selected
    const totalSelectedDue = useMemo(() => {
        return selectedInvoicesList.reduce((sum, inv) => {
            const due = inv.balanceRemaining > 0 ? inv.balanceRemaining : inv.amount;
            return sum + due;
        }, 0);
    }, [selectedInvoicesList]);

    // Handle single click selection
    const handleSelectSingle = (inv: InvoiceListItem) => {
        setSelectedInvoiceIds([inv.id]);
        const dueAmount = inv.balanceRemaining > 0 ? inv.balanceRemaining : inv.amount;
        setAmount(formatWithCommas(dueAmount.toFixed(2)));
        setError(null);
        setReminderSuccessMsg(null);
    };

    // Handle toggle checkbox
    const handleToggleCheckbox = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedInvoiceIds((prev) => {
            const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
            if (next.length === 1) {
                const inv = collectibleInvoices.find(i => i.id === next[0]);
                if (inv) {
                    const due = inv.balanceRemaining > 0 ? inv.balanceRemaining : inv.amount;
                    setAmount(formatWithCommas(due.toFixed(2)));
                }
            }
            return next;
        });
        setError(null);
        setReminderSuccessMsg(null);
    };

    // Toggle Select All Visible
    const handleToggleSelectAll = () => {
        const visibleIds = filteredInvoices.map((i) => i.id);
        const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedInvoiceIds.includes(id));
        if (allVisibleSelected) {
            setSelectedInvoiceIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
        } else {
            setSelectedInvoiceIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
        }
        setError(null);
        setReminderSuccessMsg(null);
    };

    const isAllVisibleSelected = filteredInvoices.length > 0 && filteredInvoices.every((i) => selectedInvoiceIds.includes(i.id));

    // Calculate live numbers for single selection
    const numAmount = parseFloat(amount.replace(/,/g, "")) || 0;
    const invoiceDueAmount = singleSelectedInvoice
        ? singleSelectedInvoice.balanceRemaining > 0 
            ? singleSelectedInvoice.balanceRemaining 
            : singleSelectedInvoice.amount
        : 0;
    const remainingBalance = singleSelectedInvoice 
        ? Math.max(0, invoiceDueAmount - numAmount)
        : 0;
    const isFullyPaid = remainingBalance <= 0 && numAmount > 0;

    // Send Invoice & Reminder to Tenant(s)
    const handleSendInvoice = async () => {
        if (selectedInvoiceIds.length === 0) return;
        setIsSendingReminder(true);
        setReminderSuccessMsg(null);
        setError(null);

        try {
            const results = await Promise.allSettled(
                selectedInvoiceIds.map((id) =>
                    fetch(`/api/landlord/invoices/${id}/reminder`, { method: "POST" })
                )
            );
            const successfulCount = results.filter((r) => r.status === "fulfilled").length;

            if (selectedInvoiceIds.length === 1 && singleSelectedInvoice) {
                setReminderSuccessMsg(`Invoice & Pay Now reminder sent to ${singleSelectedInvoice.tenant}!`);
            } else {
                setReminderSuccessMsg(`Sent invoice reminders to ${successfulCount} tenant${successfulCount > 1 ? "s" : ""}!`);
            }
            setTimeout(() => setReminderSuccessMsg(null), 5000);
        } catch (err: any) {
            console.error("Reminder error:", err);
            setError(err.message || "Failed to send invoice reminder.");
        } finally {
            setIsSendingReminder(false);
        }
    };

    // Open Confirmation Dialog
    const handlePromptRecord = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedInvoiceIds.length === 0) {
            setError("Please select at least one invoice.");
            return;
        }

        if (selectedInvoiceIds.length === 1 && numAmount <= 0) {
            setError("Payment amount must be greater than ₱0.00.");
            return;
        }

        setError(null);
        setIsConfirmDialogOpen(true);
    };

    // Execute Confirmed Payment Collection (Single or Bulk)
    const handleExecuteSubmit = async () => {
        if (selectedInvoiceIds.length === 0) return;

        setIsSubmitting(true);
        setError(null);

        try {
            if (selectedInvoiceIds.length === 1 && singleSelectedInvoice) {
                // Single Collection
                const res = await fetch("/api/landlord/payments/collect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        invoiceId: singleSelectedInvoice.id,
                        amount: numAmount,
                        method,
                        referenceNumber: referenceNumber.trim() || undefined,
                        paymentDate,
                        note: note.trim() || undefined,
                    }),
                });

                const data = await res.json();
                if (!res.ok || !data.ok) throw new Error(data.error || "Failed to record payment.");

                setIsConfirmDialogOpen(false);
                setSuccessResult({
                    receiptNumber: data.receiptNumber || `REC-${Date.now().toString().slice(-6)}`,
                    amount: numAmount,
                    tenant: singleSelectedInvoice.tenant,
                    unit: singleSelectedInvoice.unit,
                    isFullyPaid: data.isFullyPaid,
                });
            } else {
                // Bulk Collection
                const results = await Promise.allSettled(
                    selectedInvoicesList.map((inv) => {
                        const due = inv.balanceRemaining > 0 ? inv.balanceRemaining : inv.amount;
                        return fetch("/api/landlord/payments/collect", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                invoiceId: inv.id,
                                amount: due,
                                method,
                                referenceNumber: referenceNumber.trim() || undefined,
                                paymentDate,
                                note: note.trim() ? `[Bulk Collection] ${note.trim()}` : "[Bulk Collection]",
                            }),
                        });
                    })
                );

                const succeeded = results.filter((r) => r.status === "fulfilled").length;
                setIsConfirmDialogOpen(false);
                setSuccessResult({
                    receiptNumber: `BULK-${Date.now().toString().slice(-6)}`,
                    amount: totalSelectedDue,
                    tenant: `${succeeded} Residents Settled`,
                    unit: `${succeeded} Units`,
                    isFullyPaid: true,
                    isBulk: true,
                    count: succeeded,
                });
            }

            if (onPaymentRecorded) {
                onPaymentRecorded();
            }
        } catch (err: any) {
            console.error("Collection error:", err);
            setError(err.message || "Failed to record payment. Please check your connection.");
            setIsConfirmDialogOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 15 }}
                    className="relative w-full max-w-5xl overflow-hidden rounded-[2.25rem] border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0f1117]/95 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.7)] z-10 my-auto"
                >
                    {/* Top Action Bar */}
                    <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                                ₱
                            </span>
                            <h2 className="text-sm font-bold text-slate-800 dark:text-neutral-200">Rent Collection & Invoicing</h2>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => window.open("/landlord/docs", "_blank")}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-semibold text-slate-600 dark:text-neutral-300 transition-colors"
                            >
                                <HelpCircle className="size-4 text-slate-500 dark:text-neutral-400" />
                                <span>Need Help?</span>
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex size-9 items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                                aria-label="Close"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>

                    {/* Modal Content */}
                    <div className="px-6 sm:px-8 pb-8 max-h-[calc(90vh-80px)] overflow-y-auto custom-scrollbar-premium">
                        {successResult ? (
                            /* Success Screen */
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-in zoom-in-95 duration-300">
                                <div className="relative">
                                    <div className="size-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                        <CheckCircle2 className="size-10 animate-bounce" />
                                    </div>
                                    <Sparkles className="absolute -top-1 -right-1 size-6 text-amber-400 animate-pulse" />
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                        {successResult.isBulk ? "Bulk Settlements Recorded!" : "Payment Recorded Successfully!"}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-neutral-400">
                                        {successResult.isBulk
                                            ? `Successfully processed and issued receipts for ${successResult.count} tenants.`
                                            : <>Official Receipt <span className="font-bold text-slate-900 dark:text-white">#{successResult.receiptNumber}</span> has been issued.</>}
                                    </p>
                                </div>

                                {/* Summary Box */}
                                <div className="w-full max-w-md rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-left space-y-3">
                                    <div className="flex justify-between items-center text-sm border-b border-slate-200/60 dark:border-white/10 pb-2">
                                        <span className="text-slate-500 dark:text-neutral-400">Tenant / Unit</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{successResult.tenant}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-slate-200/60 dark:border-white/10 pb-2">
                                        <span className="text-slate-500 dark:text-neutral-400">Total Collected</span>
                                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">{formatPhpCurrency(successResult.amount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 dark:text-neutral-400">Status</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                            {successResult.isFullyPaid ? "Fully Settled ✓" : "Partial Payment Logged"}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 w-full max-w-md pt-2">
                                    <button
                                        onClick={() => {
                                            setSuccessResult(null);
                                            setSelectedInvoiceIds([]);
                                            setAmount("");
                                        }}
                                        className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 font-bold text-sm text-slate-700 dark:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="size-4" />
                                        Record Another
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-black text-sm text-white transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* 2-Column Split Layout */
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                                {/* ── LEFT COLUMN: Search, Filters & Invoices List (5 of 12 cols) ── */}
                                <div className="lg:col-span-5 flex flex-col space-y-3.5 lg:border-r lg:border-slate-200/80 dark:lg:border-white/10 lg:pr-6">
                                    {/* Header with Select All */}
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={handleToggleSelectAll}
                                            className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-neutral-300 hover:text-emerald-600 transition-colors"
                                        >
                                            {isAllVisibleSelected ? (
                                                <CheckSquare className="size-4 text-emerald-500" />
                                            ) : (
                                                <Square className="size-4 text-slate-400" />
                                            )}
                                            <span>
                                                {selectedInvoiceIds.length > 0 
                                                    ? `${selectedInvoiceIds.length} Selected` 
                                                    : "Select All"}
                                            </span>
                                        </button>

                                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                                            {collectibleInvoices.length} pending
                                        </span>
                                    </div>

                                    {/* Status Filter Pills */}
                                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl">
                                        <button
                                            type="button"
                                            onClick={() => setStatusFilter("all")}
                                            className={cn(
                                                "flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center",
                                                statusFilter === "all"
                                                    ? "bg-white dark:bg-[#1e2330] text-slate-900 dark:text-white shadow-sm"
                                                    : "text-slate-500 dark:text-neutral-400 hover:text-slate-900"
                                            )}
                                        >
                                            All ({collectibleInvoices.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStatusFilter("overdue")}
                                            className={cn(
                                                "flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1",
                                                statusFilter === "overdue"
                                                    ? "bg-white dark:bg-[#1e2330] text-rose-500 shadow-sm"
                                                    : "text-slate-500 dark:text-neutral-400 hover:text-rose-500"
                                            )}
                                        >
                                            Overdue ({overdueCount})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStatusFilter("pending")}
                                            className={cn(
                                                "flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center",
                                                statusFilter === "pending"
                                                    ? "bg-white dark:bg-[#1e2330] text-amber-500 shadow-sm"
                                                    : "text-slate-500 dark:text-neutral-400 hover:text-amber-500"
                                            )}
                                        >
                                            Pending ({pendingCount})
                                        </button>
                                    </div>

                                    {/* Search Input */}
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-neutral-500" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search tenant, unit, inv #..."
                                            className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                                        />
                                    </div>

                                    {/* Invoices List */}
                                    <div className="max-h-[390px] overflow-y-auto space-y-2 pr-1 custom-scrollbar-premium">
                                        {loadingInvoices ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2 text-xs">
                                                <Loader2 className="size-5 animate-spin text-emerald-500" />
                                                Loading invoices...
                                            </div>
                                        ) : filteredInvoices.length === 0 ? (
                                            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 text-xs">
                                                No matching invoices found.
                                            </div>
                                        ) : (
                                            filteredInvoices.map((inv) => {
                                                const isChecked = selectedInvoiceIds.includes(inv.id);
                                                const dueAmount = inv.balanceRemaining > 0 ? inv.balanceRemaining : inv.amount;
                                                const isOverdue = inv.status === "overdue";

                                                return (
                                                    <div
                                                        key={inv.id}
                                                        onClick={() => handleSelectSingle(inv)}
                                                        className={cn(
                                                            "group relative flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all",
                                                            isChecked
                                                                ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-500/15 shadow-sm ring-1 ring-emerald-500/30"
                                                                : "border-slate-200/70 dark:border-white/5 bg-slate-50/40 dark:bg-white/[0.02] hover:bg-slate-100/60 dark:hover:bg-white/5"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                                            {/* Custom Checkbox Button */}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleToggleCheckbox(inv.id, e)}
                                                                className={cn(
                                                                    "size-5 rounded-lg border flex items-center justify-center transition-colors shrink-0",
                                                                    isChecked
                                                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                                                        : "border-slate-300 dark:border-white/20 bg-white dark:bg-black/20"
                                                                )}
                                                            >
                                                                {isChecked && <Check className="size-3.5 stroke-[3]" />}
                                                            </button>

                                                            <div className="min-w-0">
                                                                <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                                                                    {inv.tenant}
                                                                </p>
                                                                <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate mt-0.5">
                                                                    {inv.unit} • {inv.invoiceNumber}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="text-right shrink-0">
                                                            <p className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                                                                {formatPhpCurrency(dueAmount)}
                                                            </p>
                                                            <span className={cn(
                                                                "text-[9px] font-bold uppercase tracking-wider block mt-0.5",
                                                                isOverdue ? "text-rose-500" : "text-amber-500"
                                                            )}>
                                                                {isOverdue ? "Overdue" : "Pending"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* ── RIGHT COLUMN: Exact Match Form & Action Controls (7 of 12 cols) ── */}
                                <div className="lg:col-span-7">
                                    {selectedInvoiceIds.length === 1 && singleSelectedInvoice ? (
                                        /* ── SINGLE INVOICE SELECTION FORM (Exact match to approved design) ── */
                                        <form onSubmit={handlePromptRecord} className="space-y-5">
                                            {error && (
                                                <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                                                    <AlertCircle className="size-4 shrink-0" />
                                                    <span>{error}</span>
                                                </div>
                                            )}

                                            {reminderSuccessMsg && (
                                                <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-in fade-in duration-200">
                                                    <CheckCircle2 className="size-4 shrink-0" />
                                                    <span>{reminderSuccessMsg}</span>
                                                </div>
                                            )}

                                            {/* Selected Invoice Banner */}
                                            <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl border border-emerald-400/40 dark:border-emerald-500/25 bg-[#F0FDF4] dark:bg-emerald-950/20">
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div className="size-11 sm:size-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                                        <Check className="size-6 stroke-[3]" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-emerald-400/80 block">
                                                            Selected Invoice
                                                        </span>
                                                        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                                                            {singleSelectedInvoice.tenant} • {singleSelectedInvoice.unit}
                                                        </h3>
                                                        <p className="text-[11px] text-slate-400 dark:text-neutral-400 font-mono mt-0.5">
                                                            {singleSelectedInvoice.invoiceNumber}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0 ml-4">
                                                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-neutral-400 block">
                                                        Balance Due
                                                    </span>
                                                    <span className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                                        {formatPhpCurrency(invoiceDueAmount)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* 2. Amount Collected & 3. Payment Method */}
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-start">
                                                {/* Left: 2. AMOUNT COLLECTED (PHP) (5 cols) */}
                                                <div className="md:col-span-5 space-y-2">
                                                    <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 block">
                                                        2. AMOUNT COLLECTED (PHP)
                                                    </label>
                                                    <div className="relative flex items-center">
                                                        <span className="absolute left-4 text-slate-700 dark:text-neutral-300 font-bold text-base select-none">₱</span>
                                                        <input
                                                            type="text"
                                                            value={amount}
                                                            onChange={(e) => {
                                                                const raw = e.target.value.replace(/,/g, "");
                                                                if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                                                                    setAmount(formatWithCommas(raw));
                                                                }
                                                            }}
                                                            onBlur={() => {
                                                                const raw = amount.replace(/,/g, "");
                                                                const parsed = parseFloat(raw);
                                                                if (!isNaN(parsed) && parsed > 0) {
                                                                    setAmount(formatWithCommas(parsed.toFixed(2)));
                                                                }
                                                            }}
                                                            placeholder="18,200.00"
                                                            className="w-full pl-9 pr-4 py-3.5 text-base sm:text-lg font-black text-slate-900 dark:text-white bg-slate-50/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder:text-slate-400"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                {/* Right: 3. PAYMENT METHOD (7 cols) */}
                                                <div className="md:col-span-7 space-y-2">
                                                    <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 block">
                                                        3. PAYMENT METHOD
                                                    </label>
                                                    <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                                                        {PAYMENT_METHODS.map((pm) => {
                                                            const isSelected = method === pm.id;
                                                            const Icon = pm.icon;
                                                            return (
                                                                <button
                                                                    key={pm.id}
                                                                    type="button"
                                                                    onClick={() => setMethod(pm.id)}
                                                                    className={cn(
                                                                        "flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border text-center transition-all h-[76px]",
                                                                        isSelected
                                                                            ? "border-2 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                                                            : "border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-white/10"
                                                                    )}
                                                                >
                                                                    <Icon className={cn("size-5 mb-1", isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-neutral-400")} />
                                                                    <span className="text-[11px] font-bold leading-tight block truncate w-full">
                                                                        {pm.title}
                                                                    </span>
                                                                    {pm.subtitle && (
                                                                        <span className="text-[9px] font-medium leading-tight block opacity-80 truncate w-full">
                                                                            {pm.subtitle}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reference # & Date Received */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-600 dark:text-neutral-400">
                                                        Reference # (Optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={referenceNumber}
                                                        onChange={(e) => setReferenceNumber(e.target.value)}
                                                        placeholder={method === "gcash" ? "GCash Ref Number" : method === "bank_transfer" ? "Bank Ref Number" : "Cash Receipt / Slip / OR #"}
                                                        className="w-full px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-50/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder:text-slate-400 transition-all"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-slate-600 dark:text-neutral-400">
                                                        Date Received
                                                    </label>
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="date"
                                                            value={paymentDate}
                                                            onChange={(e) => setPaymentDate(e.target.value)}
                                                            className="w-full px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-50/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all pr-10"
                                                        />
                                                        <Calendar className="absolute right-3.5 size-4 text-slate-400 dark:text-neutral-500 pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notes / Remarks */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-600 dark:text-neutral-400">
                                                    Notes / Remarks (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={note}
                                                    onChange={(e) => setNote(e.target.value)}
                                                    placeholder="e.g. Handed personally in management office"
                                                    className="w-full px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-50/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder:text-slate-400 transition-all"
                                                />
                                            </div>

                                            {/* Live Remaining Balance & Settlement Banner */}
                                            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.03]">
                                                <div>
                                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 block">
                                                        Remaining Balance
                                                    </span>
                                                    <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                                                        {formatPhpCurrency(remainingBalance)}
                                                    </span>
                                                </div>

                                                <div className="text-right">
                                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 block">
                                                        Settlement
                                                    </span>
                                                    <span className={cn("text-xs sm:text-sm font-bold flex items-center gap-1", isFullyPaid ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500")}>
                                                        {isFullyPaid ? "✓ Full Settlement" : "⚠ Partial Payment"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Dual Action Bar: Send Invoice Button + Record Payment Button */}
                                            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={handleSendInvoice}
                                                    disabled={isSendingReminder || isSubmitting}
                                                    className="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                                >
                                                    {isSendingReminder ? (
                                                        <>
                                                            <Loader2 className="size-4 animate-spin text-emerald-500" />
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="size-4 text-emerald-500" />
                                                            Send Invoice to Tenant
                                                        </>
                                                    )}
                                                </button>

                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting || numAmount <= 0}
                                                    className="w-full sm:flex-1 py-3.5 sm:py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
                                                >
                                                    <Receipt className="size-4 sm:size-5" />
                                                    Record {numAmount > 0 ? formatPhpCurrency(numAmount) : "Payment"} & Settle
                                                </button>
                                            </div>
                                        </form>
                                    ) : selectedInvoiceIds.length > 1 ? (
                                        /* ── BULK SELECTION ACTIONS PANEL (Send Invoice Only) ── */
                                        <div className="space-y-5">
                                            {error && (
                                                <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                                                    <AlertCircle className="size-4 shrink-0" />
                                                    <span>{error}</span>
                                                </div>
                                            )}

                                            {reminderSuccessMsg && (
                                                <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-in fade-in duration-200">
                                                    <CheckCircle2 className="size-4 shrink-0" />
                                                    <span>{reminderSuccessMsg}</span>
                                                </div>
                                            )}

                                            {/* Bulk Header Card */}
                                            <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl border border-emerald-400/40 dark:border-emerald-500/25 bg-[#F0FDF4] dark:bg-emerald-950/20">
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div className="size-11 sm:size-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                                        <Layers className="size-6 stroke-[2.5]" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-emerald-400/80 block">
                                                            Bulk Action Mode
                                                        </span>
                                                        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                                                            {selectedInvoiceIds.length} Invoices Selected
                                                        </h3>
                                                        <p className="text-[11px] text-slate-400 dark:text-neutral-400 mt-0.5">
                                                            Send digital invoices & reminders in bulk
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0 ml-4">
                                                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-neutral-400 block">
                                                        Total Outstanding
                                                    </span>
                                                    <span className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                                        {formatPhpCurrency(totalSelectedDue)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Selected Items Breakdown List */}
                                            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 p-4 space-y-2.5">
                                                <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                                                    <span>Selected Residents ({selectedInvoicesList.length})</span>
                                                    <span>Balance Due</span>
                                                </div>
                                                <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar-premium pr-1">
                                                    {selectedInvoicesList.map((inv) => (
                                                        <div key={inv.id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-200/50 dark:border-white/5 last:border-none">
                                                            <div className="min-w-0 pr-2">
                                                                <p className="font-bold text-slate-900 dark:text-white truncate">
                                                                    {inv.tenant}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500 dark:text-neutral-400">
                                                                    {inv.unit} • {inv.invoiceNumber}
                                                                </p>
                                                            </div>
                                                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs shrink-0">
                                                                {formatPhpCurrency(inv.balanceRemaining > 0 ? inv.balanceRemaining : inv.amount)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Informational Guidance Box */}
                                            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
                                                <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-500" />
                                                <p className="leading-relaxed">
                                                    <strong className="font-bold">Settlement is disabled for multi-select.</strong> To record individual payment collections and issue receipts, select a single resident from the list on the left.
                                                </p>
                                            </div>

                                            {/* Primary Bulk Action: Send Invoices & Reminders Only */}
                                            <button
                                                type="button"
                                                onClick={handleSendInvoice}
                                                disabled={isSendingReminder}
                                                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
                                            >
                                                {isSendingReminder ? (
                                                    <>
                                                        <Loader2 className="size-5 animate-spin" />
                                                        Sending Invoices to {selectedInvoiceIds.length} Tenants...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="size-5" />
                                                        Send Invoices & Reminders to All ({selectedInvoiceIds.length})
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        /* ── EMPTY STATE ── */
                                        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-6 text-slate-400 space-y-3">
                                            <div className="size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                                                <Banknote className="size-7" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Select Invoices to Begin</h4>
                                                <p className="text-xs max-w-xs text-slate-500 dark:text-neutral-400">
                                                    Select one or multiple outstanding invoices from the left to record payments or send reminders.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirmation Popup Modal Layer */}
                    <AnimatePresence>
                        {isConfirmDialogOpen && (
                            <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131722] p-6 shadow-2xl space-y-5"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                                            <Receipt className="size-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                                                {selectedInvoiceIds.length > 1 ? "Confirm Bulk Settlement" : "Confirm Rent Settlement"}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-neutral-400">Please double-check payment details before proceeding.</p>
                                        </div>
                                    </div>

                                    {/* Confirmation Breakdown Box */}
                                    <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 p-4 space-y-2.5 text-xs">
                                        <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-white/5 pb-2">
                                            <span className="text-slate-500 dark:text-neutral-400 font-medium">
                                                {selectedInvoiceIds.length > 1 ? "Selected Invoices" : "Tenant"}
                                            </span>
                                            <span className="font-bold text-slate-900 dark:text-white">
                                                {selectedInvoiceIds.length > 1 
                                                    ? `${selectedInvoiceIds.length} Residents` 
                                                    : `${singleSelectedInvoice?.tenant} (${singleSelectedInvoice?.unit})`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-white/5 pb-2">
                                            <span className="text-slate-500 dark:text-neutral-400 font-medium">Payment Method</span>
                                            <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                                                {method === "cash" ? "Cash (Hand-to-Hand)" : method === "gcash" ? "GCash Transfer" : "Bank Deposit"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-white/5 pb-2">
                                            <span className="text-slate-500 dark:text-neutral-400 font-medium">Total Amount</span>
                                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                                {formatPhpCurrency(selectedInvoiceIds.length > 1 ? totalSelectedDue : numAmount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 dark:text-neutral-400 font-medium">Resulting Status</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                ✓ Full Settlement
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                                        Confirming will record this settlement in the ledger, issue official digital receipts, and notify the resident(s).
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2.5 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsConfirmDialogOpen(false)}
                                            disabled={isSubmitting}
                                            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 font-bold text-xs text-slate-700 dark:text-white transition-all"
                                        >
                                            Cancel / Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleExecuteSubmit}
                                            disabled={isSubmitting}
                                            className="flex-[1.5] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="size-3.5 animate-spin" />
                                                    Recording...
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="size-4 stroke-[3]" />
                                                    Yes, Settle & Issue Receipt
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
