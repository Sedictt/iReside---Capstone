"use client";

import React, { useState, useEffect, useMemo } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { 
    X, 
    Search, 
    Wallet, 
    CreditCard, 
    Receipt, 
    CheckCircle2, 
    Calendar, 
    ArrowRight, 
    Building2, 
    User, 
    AlertCircle, 
    Sparkles, 
    Banknote, 
    FileCheck,
    Loader2,
    RefreshCw
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

type PaymentMethodType = "cash" | "gcash" | "bank_transfer" | "check";

const PAYMENT_METHODS: Array<{ id: PaymentMethodType; label: string; icon: any; hint: string }> = [
    { id: "cash", label: "Cash / Hand-to-Hand", icon: Banknote, hint: "Physical cash received" },
    { id: "gcash", label: "GCash", icon: CreditCard, hint: "Mobile wallet transfer" },
    { id: "bank_transfer", label: "Bank Transfer", icon: Building2, hint: "Direct bank deposit" },
    { id: "check", label: "Check", icon: Receipt, hint: "Bank check clearing" },
];

export function CollectPaymentModal({ isOpen, onClose, onPaymentRecorded }: CollectPaymentModalProps) {
    const { selectedPropertyId } = useProperty();
    
    // State
    const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [amount, setAmount] = useState<string>("");
    const [method, setMethod] = useState<PaymentMethodType>("cash");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successResult, setSuccessResult] = useState<{
        receiptNumber: string;
        amount: number;
        tenant: string;
        unit: string;
        isFullyPaid: boolean;
    } | null>(null);

    // Fetch invoices on open
    useEffect(() => {
        if (!isOpen) return;

        setError(null);
        setSuccessResult(null);
        setSelectedInvoiceId(null);
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
                setInvoices(data.invoices || []);
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

    // Filtered by search query
    const filteredInvoices = useMemo(() => {
        if (!searchQuery.trim()) return collectibleInvoices;
        const q = searchQuery.toLowerCase();
        return collectibleInvoices.filter(
            (inv) =>
                inv.tenant.toLowerCase().includes(q) ||
                inv.unit.toLowerCase().includes(q) ||
                inv.invoiceNumber.toLowerCase().includes(q) ||
                inv.property.toLowerCase().includes(q)
        );
    }, [collectibleInvoices, searchQuery]);

    // Active selected invoice
    const selectedInvoice = useMemo(() => {
        return invoices.find((inv) => inv.id === selectedInvoiceId) || null;
    }, [invoices, selectedInvoiceId]);

    // Handle invoice selection
    const handleSelectInvoice = (inv: InvoiceListItem) => {
        setSelectedInvoiceId(inv.id);
        const dueAmount = inv.balanceRemaining > 0 ? inv.balanceRemaining : inv.amount;
        setAmount(dueAmount.toString());
        setError(null);
    };

    // Calculate live numbers
    const numAmount = parseFloat(amount) || 0;
    const remainingBalance = selectedInvoice 
        ? Math.max(0, (selectedInvoice.balanceRemaining > 0 ? selectedInvoice.balanceRemaining : selectedInvoice.amount) - numAmount)
        : 0;
    const isFullyPaid = remainingBalance <= 0;

    // Submit collection
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoiceId || !selectedInvoice) {
            setError("Please select an invoice or tenant to record payment.");
            return;
        }

        if (numAmount <= 0) {
            setError("Payment amount must be greater than ₱0.00.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/landlord/payments/collect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invoiceId: selectedInvoiceId,
                    amount: numAmount,
                    method,
                    referenceNumber: referenceNumber.trim() || undefined,
                    paymentDate,
                    note: note.trim() || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.error || "Failed to record payment.");
            }

            setSuccessResult({
                receiptNumber: data.receiptNumber || `REC-${Date.now().toString().slice(-6)}`,
                amount: numAmount,
                tenant: selectedInvoice.tenant,
                unit: selectedInvoice.unit,
                isFullyPaid: data.isFullyPaid,
            });

            if (onPaymentRecorded) {
                onPaymentRecorded();
            }
        } catch (err: any) {
            console.error("Collection error:", err);
            setError(err.message || "Failed to record payment. Please check your connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-border/80 bg-card/95 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.6)] z-10 my-auto"
                >
                    {/* Header with Emerald Gradient Glow */}
                    <div className="relative border-b border-border/50 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent px-6 sm:px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                    <Banknote className="size-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-black text-foreground tracking-tight">Record Rent Payment</h2>
                                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 border border-emerald-500/20">
                                            Instant Receipt
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                                        Log cash or offline payments directly and issue official receipts.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="group flex size-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                                aria-label="Close"
                            >
                                <X className="size-4 transition-transform group-hover:rotate-90" />
                            </button>
                        </div>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6 sm:p-8 max-h-[calc(85vh-120px)] overflow-y-auto custom-scrollbar-premium">
                        {successResult ? (
                            /* Success Screen */
                            <div className="flex flex-col items-center justify-center py-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
                                <div className="relative">
                                    <div className="size-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                        <CheckCircle2 className="size-10 animate-bounce" />
                                    </div>
                                    <Sparkles className="absolute -top-1 -right-1 size-6 text-amber-400 animate-pulse" />
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-foreground">Payment Recorded Successfully!</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Official Receipt <span className="font-bold text-foreground">#{successResult.receiptNumber}</span> has been issued.
                                    </p>
                                </div>

                                {/* Summary Box */}
                                <div className="w-full max-w-md rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-left space-y-3">
                                    <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                                        <span className="text-muted-foreground">Tenant</span>
                                        <span className="font-bold text-foreground">{successResult.tenant}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                                        <span className="text-muted-foreground">Unit</span>
                                        <span className="font-bold text-foreground">{successResult.unit}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                                        <span className="text-muted-foreground">Amount Collected</span>
                                        <span className="font-black text-emerald-500 text-base">{formatPhpCurrency(successResult.amount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Status</span>
                                        <span className="font-bold text-emerald-400">
                                            {successResult.isFullyPaid ? "Fully Settled ✓" : "Partial Payment Logged"}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 w-full max-w-md pt-2">
                                    <button
                                        onClick={() => {
                                            setSuccessResult(null);
                                            setSelectedInvoiceId(null);
                                            setAmount("");
                                        }}
                                        className="flex-1 py-3 px-4 rounded-xl border border-border bg-muted/50 hover:bg-muted font-bold text-sm text-foreground transition-all flex items-center justify-center gap-2"
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
                            /* Entry Form */
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                                        <AlertCircle className="size-5 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Step 1: Select Tenant / Invoice */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                            1. Select Outstanding Rent Invoice
                                        </label>
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {collectibleInvoices.length} pending
                                        </span>
                                    </div>

                                    {/* Search Input */}
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search tenant name, unit (e.g. Unit 304), or invoice #..."
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-foreground placeholder:text-muted-foreground/60"
                                        />
                                    </div>

                                    {/* Invoices List / Combobox */}
                                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar-premium">
                                        {loadingInvoices ? (
                                            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 text-sm">
                                                <Loader2 className="size-4 animate-spin text-primary" />
                                                Loading invoices...
                                            </div>
                                        ) : filteredInvoices.length === 0 ? (
                                            <div className="p-6 text-center border border-dashed border-border rounded-2xl text-muted-foreground text-sm">
                                                No pending invoices found matching your search.
                                            </div>
                                        ) : (
                                            filteredInvoices.map((inv) => {
                                                const isSelected = inv.id === selectedInvoiceId;
                                                const dueAmount = inv.balanceRemaining > 0 ? inv.balanceRemaining : inv.amount;
                                                const isOverdue = inv.status === "overdue";

                                                return (
                                                    <div
                                                        key={inv.id}
                                                        onClick={() => handleSelectInvoice(inv)}
                                                        className={cn(
                                                            "group flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all",
                                                            isSelected
                                                                ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                                                                : "border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className={cn(
                                                                "size-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors",
                                                                isSelected 
                                                                    ? "bg-emerald-500 text-white" 
                                                                    : "bg-muted text-muted-foreground group-hover:text-foreground"
                                                            )}>
                                                                {inv.tenant.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-bold text-foreground text-sm truncate">{inv.tenant}</p>
                                                                    <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                                                                        {inv.unit}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                                    {inv.invoiceNumber} • {inv.property}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="text-right shrink-0 ml-3">
                                                            <p className="font-black text-foreground text-sm">
                                                                {formatPhpCurrency(dueAmount)}
                                                            </p>
                                                            <span className={cn(
                                                                "text-[10px] font-bold uppercase tracking-wider",
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

                                {selectedInvoice && (
                                    <div className="space-y-6 pt-2 border-t border-border/50 animate-in fade-in duration-200">
                                        {/* Step 2: Payment Amount & Methods */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                                    2. Amount Collected (PHP)
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const full = selectedInvoice.balanceRemaining > 0 ? selectedInvoice.balanceRemaining : selectedInvoice.amount;
                                                            setAmount(full.toString());
                                                        }}
                                                        className="text-[11px] font-bold text-emerald-500 hover:underline"
                                                    >
                                                        Full: {formatPhpCurrency(selectedInvoice.balanceRemaining > 0 ? selectedInvoice.balanceRemaining : selectedInvoice.amount)}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-muted-foreground">₱</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="1"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full pl-10 pr-4 py-3 text-xl font-black rounded-2xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                                    required
                                                />
                                            </div>

                                            {/* Payment Method Selector */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                                    3. Payment Method
                                                </label>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                    {PAYMENT_METHODS.map((pm) => {
                                                        const isMethodSelected = method === pm.id;
                                                        const Icon = pm.icon;
                                                        return (
                                                            <button
                                                                key={pm.id}
                                                                type="button"
                                                                onClick={() => setMethod(pm.id)}
                                                                className={cn(
                                                                    "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center gap-1.5",
                                                                    isMethodSelected
                                                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold shadow-sm"
                                                                        : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted hover:text-foreground"
                                                                )}
                                                            >
                                                                <Icon className="size-5" />
                                                                <span className="text-xs font-bold leading-tight">{pm.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Optional Reference & Date */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-muted-foreground">
                                                        Reference / Receipt # (Optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={referenceNumber}
                                                        onChange={(e) => setReferenceNumber(e.target.value)}
                                                        placeholder={method === "gcash" ? "GCash Ref Number" : method === "check" ? "Check Number" : "Offline Ref / Cash Slip"}
                                                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-muted-foreground">
                                                        Date Received
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={paymentDate}
                                                        onChange={(e) => setPaymentDate(e.target.value)}
                                                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                    />
                                                </div>
                                            </div>

                                            {/* Note / Remarks */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-muted-foreground">
                                                    Notes / Remarks (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={note}
                                                    onChange={(e) => setNote(e.target.value)}
                                                    placeholder="e.g., Handed personally in management office"
                                                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                />
                                            </div>

                                            {/* Summary Calculation */}
                                            <div className="rounded-2xl bg-muted/40 p-4 border border-border/60 flex items-center justify-between text-sm">
                                                <div>
                                                    <span className="text-xs text-muted-foreground block">Resulting Balance</span>
                                                    <span className="font-black text-foreground">
                                                        {formatPhpCurrency(remainingBalance)}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs text-muted-foreground block">Settlement Type</span>
                                                    <span className={cn("font-bold text-xs", isFullyPaid ? "text-emerald-500" : "text-amber-500")}>
                                                        {isFullyPaid ? "✓ Full Settlement" : "⚠ Partial Payment"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Confirmation CTA */}
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || numAmount <= 0}
                                            className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="size-5 animate-spin" />
                                                    Recording & Generating Receipt...
                                                </>
                                            ) : (
                                                <>
                                                    <Receipt className="size-5" />
                                                    Record {formatPhpCurrency(numAmount)} & Issue Receipt
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
