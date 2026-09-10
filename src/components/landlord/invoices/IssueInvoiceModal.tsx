"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { m as motion, AnimatePresence } from "framer-motion";
import {
    X,
    FileText,
    User,
    Building2,
    Calendar,
    Plus,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ReceiptText,
    Zap,
    Droplets,
    Send,
    DollarSign,
    ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhpCurrency } from "@/lib/billing/utils";

interface ActiveLease {
    id: string;
    monthly_rent: number;
    start_date: string;
    end_date: string;
    unit?: {
        id: string;
        name: string;
        property?: {
            id: string;
            name: string;
            address: string;
        };
    };
    tenant?: {
        id: string;
        full_name?: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        phone_number?: string;
    } | null;
}

function getTenantDisplayName(lease: ActiveLease): string {
    if (lease.tenant?.full_name) return lease.tenant.full_name;
    const parts = [lease.tenant?.first_name, lease.tenant?.last_name].filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
    if (lease.tenant?.email) return lease.tenant.email;
    return "Active Tenant";
}

interface InvoiceItemDraft {
    id: string;
    label: string;
    amount: number | "";
    category: "rent" | "water" | "electricity" | "maintenance" | "other";
    removable?: boolean;
}

interface IssueInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onIssued?: () => void;
    defaultUnitId?: string | null;
    propertyId?: string;
}

export function IssueInvoiceModal({
    isOpen,
    onClose,
    onIssued,
    defaultUnitId,
    propertyId
}: IssueInvoiceModalProps) {
    const [leases, setLeases] = useState<ActiveLease[]>([]);
    const [loadingLeases, setLoadingLeases] = useState(true);
    const [selectedLeaseId, setSelectedLeaseId] = useState<string>("");
    
    // Billing Period & Due Date
    const today = new Date();
    const defaultMonth = today.toISOString().slice(0, 7); // YYYY-MM
    const [billingMonth, setBillingMonth] = useState<string>(defaultMonth);
    
    // Default due date to the 5th of current month or 7 days from now
    const defaultDueDate = new Date(today.getFullYear(), today.getMonth(), 5 > today.getDate() ? 5 : 15)
        .toISOString()
        .slice(0, 10);
    const [dueDate, setDueDate] = useState<string>(defaultDueDate);
    const [notes, setNotes] = useState<string>("");

    // Line items
    const [items, setItems] = useState<InvoiceItemDraft[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Fetch active leases on open
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        setLoadingLeases(true);
        setErrorMsg(null);

        const fetchLeases = async () => {
            try {
                const params = new URLSearchParams();
                params.set("status", "active,expiring_soon");
                if (propertyId && propertyId !== "all") {
                    params.set("propertyId", propertyId);
                }

                let res = await fetch(`/api/landlord/leases?${params.toString()}`, { cache: "no-store" });
                let data: ActiveLease[] = res.ok ? await res.json() : [];

                // If no leases found for the selected property filter, fallback to all active landlord leases
                if (data.length === 0 && propertyId && propertyId !== "all") {
                    const fallbackRes = await fetch("/api/landlord/leases?status=active,expiring_soon", { cache: "no-store" });
                    if (fallbackRes.ok) {
                        const fallbackData = await fallbackRes.json();
                        if (fallbackData.length > 0) {
                            data = fallbackData;
                        }
                    }
                }

                if (!isMounted) return;
                setLeases(data);
                
                // Preselect lease if unit matches or first available
                if (defaultUnitId) {
                    const matched = data.find((l) => l.unit?.id === defaultUnitId);
                    if (matched) {
                        setSelectedLeaseId(matched.id);
                        return;
                    }
                }
                if (data.length > 0 && (!selectedLeaseId || !data.some((l) => l.id === selectedLeaseId))) {
                    setSelectedLeaseId(data[0].id);
                }
            } catch {
                if (isMounted) setErrorMsg("Failed to load active leases.");
            } finally {
                if (isMounted) setLoadingLeases(false);
            }
        };

        fetchLeases();

        return () => {
            isMounted = false;
        };
    }, [isOpen, defaultUnitId, propertyId]);

    // Active selected lease
    const selectedLease = useMemo(() => {
        return leases.find((l) => l.id === selectedLeaseId) ?? null;
    }, [leases, selectedLeaseId]);

    // Populate initial items when lease changes
    useEffect(() => {
        if (!selectedLease) {
            setItems([]);
            return;
        }

        const baseRent = Number(selectedLease.monthly_rent || 0);
        setItems([
            {
                id: "item-rent",
                label: "Monthly Base Rent",
                amount: baseRent,
                category: "rent",
                removable: false,
            },
            {
                id: "item-water",
                label: "Water Utility Service",
                amount: "",
                category: "water",
                removable: true,
            },
            {
                id: "item-electricity",
                label: "Electricity Utility Service",
                amount: "",
                category: "electricity",
                removable: true,
            },
        ]);
    }, [selectedLease]);

    // Total computation
    const totalAmount = useMemo(() => {
        return items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
    }, [items]);

    const handleAddItem = () => {
        const newId = `item-custom-${Date.now()}`;
        setItems((prev) => [
            ...prev,
            {
                id: newId,
                label: "Additional Charge",
                amount: "",
                category: "other",
                removable: true,
            },
        ]);
    };

    const handleRemoveItem = (id: string) => {
        setItems((prev) => prev.filter((it) => it.id !== id));
    };

    const handleUpdateItem = (id: string, field: "label" | "amount" | "category", value: any) => {
        setItems((prev) =>
            prev.map((it) => {
                if (it.id !== id) return it;
                if (field === "amount") {
                    const parsed = value === "" ? "" : Math.max(0, parseFloat(value) || 0);
                    return { ...it, amount: parsed };
                }
                return { ...it, [field]: value };
            })
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLease) {
            setErrorMsg("Please select a tenant with an active lease.");
            return;
        }

        const validItems = items
            .filter((it) => it.label.trim() && Number(it.amount) > 0)
            .map((it) => ({
                label: it.label.trim(),
                amount: Number(it.amount),
                category: it.category,
            }));

        if (validItems.length === 0) {
            setErrorMsg("Please provide at least one charge item with an amount greater than 0.");
            return;
        }

        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            const response = await fetch("/api/landlord/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leaseId: selectedLease.id,
                    billingMonth: `${billingMonth}-01`,
                    dueDate,
                    notes: notes.trim() || undefined,
                    items: validItems,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.error || "Failed to issue invoice.");
            }

            if (onIssued) onIssued();
            onClose();
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "An unexpected error occurred while issuing invoice.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                className="relative flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)]"
            >
                {/* Header */}
                <div className="relative shrink-0 border-b border-border/50 bg-background/50 px-6 py-6 sm:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                                <ReceiptText className="size-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-foreground">Issue Invoice</h2>
                                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                                    Send an itemized monthly bill for rent and utilities directly to a tenant.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="Close modal"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
                    {errorMsg && (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Tenant & Lease Selection */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <User className="size-3.5 text-primary" />
                            Select Recipient Tenant & Unit
                        </label>

                        {loadingLeases ? (
                            <div className="flex items-center justify-center py-4 rounded-2xl border border-border/60 bg-muted/20 text-xs text-muted-foreground">
                                <Loader2 className="size-4 animate-spin mr-2" />
                                Loading active leases...
                            </div>
                        ) : leases.length === 0 ? (
                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300">
                                No active tenant leases found. An active lease is required to issue monthly invoices.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <select
                                    value={selectedLeaseId}
                                    onChange={(e) => setSelectedLeaseId(e.target.value)}
                                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-xs sm:text-sm font-bold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                >
                                    {leases.map((lease) => (
                                        <option key={lease.id} value={lease.id}>
                                            {getTenantDisplayName(lease)} • {lease.unit?.name || "Unit"} ({lease.unit?.property?.name || "Property"}) — {formatPhpCurrency(lease.monthly_rent)}/mo
                                        </option>
                                    ))}
                                </select>

                                {selectedLease && (
                                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="size-3.5 text-primary" />
                                            <span className="font-bold text-foreground">{selectedLease.unit?.property?.name}</span>
                                            <span className="text-muted-foreground">• Unit {selectedLease.unit?.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <span>Base Rent:</span>
                                            <span className="font-black text-foreground">{formatPhpCurrency(selectedLease.monthly_rent)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Billing Month & Due Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-primary" />
                                Billing Month
                            </label>
                            <input
                                type="month"
                                value={billingMonth}
                                onChange={(e) => setBillingMonth(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-bold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-primary" />
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-bold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    {/* Itemized Charges Review */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <DollarSign className="size-3.5 text-primary" />
                                Review Rent & Utility Dues
                            </label>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-muted/40 hover:bg-muted text-[11px] font-bold text-foreground transition-all cursor-pointer"
                            >
                                <Plus className="size-3" />
                                Add Line Item
                            </button>
                        </div>

                        <div className="space-y-2.5">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 p-3 transition-all focus-within:border-primary/50"
                                >
                                    <div className="flex size-8 items-center justify-center rounded-xl bg-muted shrink-0 text-muted-foreground">
                                        {item.category === "rent" ? (
                                            <Building2 className="size-4 text-primary" />
                                        ) : item.category === "water" ? (
                                            <Droplets className="size-4 text-sky-500" />
                                        ) : item.category === "electricity" ? (
                                            <Zap className="size-4 text-amber-500" />
                                        ) : (
                                            <FileText className="size-4" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <input
                                            type="text"
                                            value={item.label}
                                            disabled={!item.removable}
                                            onChange={(e) => handleUpdateItem(item.id, "label", e.target.value)}
                                            className="w-full bg-transparent text-xs font-bold text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-80"
                                            placeholder="Charge Description"
                                        />
                                    </div>

                                    <div className="relative w-32 shrink-0">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₱</span>
                                        <input
                                            type="number"
                                            step="any"
                                            min="0"
                                            value={item.amount}
                                            onChange={(e) => handleUpdateItem(item.id, "amount", e.target.value)}
                                            placeholder="0.00"
                                            className="w-full rounded-xl border border-border bg-card py-1.5 pl-7 pr-3 text-right text-xs font-bold font-mono text-foreground outline-none focus:border-primary"
                                        />
                                    </div>

                                    {item.removable && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                            title="Remove item"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total Summary Card */}
                    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Bill Amount</span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-foreground tracking-tight">
                                    {formatPhpCurrency(totalAmount)}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                                    Pending
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-right">
                            <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                            <span>Direct delivery to tenant phone portal</span>
                        </div>
                    </div>

                    {/* Optional Note */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                            Notes / Memo for Tenant (Optional)
                        </label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Regular monthly rent and recorded utility consumption."
                            className="w-full rounded-xl border border-border bg-background p-3 text-xs font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="relative shrink-0 border-t border-border/50 bg-background/50 px-6 py-4 sm:px-8 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedLease || totalAmount <= 0}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="size-3.5 animate-spin" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Send className="size-3.5" />
                                <span>Issue Invoice</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );

    if (typeof document === "undefined") return null;
    return createPortal(modalContent, document.body);
}
