"use client";

import { useEffect, useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
    X,
    Receipt,
    Calendar,
    Send,
    Loader2,
    CheckCircle2,
    Clock,
    AlertCircle,
    RotateCcw,
    CreditCard,
    Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContactItem } from "./types";
import { sendConversationMessage } from "@/lib/messages/client";
import Link from "next/link";

interface InvoiceEntry {
    id: string;
    amount: number;
    statusLabel: string;
    statusTone: "paid" | "pending" | "failed" | "refunded";
    methodLabel: string;
    typeLabel: string;
    monthLabel: string;
    dateLabel: string;
}

interface AttachInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: string;
    contact: ContactItem | null;
    onSuccess: () => void;
}

function getStatusBadge(statusTone: InvoiceEntry["statusTone"], statusLabel: string) {
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

export function AttachInvoiceModal({
    isOpen,
    onClose,
    conversationId,
    contact,
    onSuccess,
}: AttachInvoiceModalProps) {
    const [invoices, setInvoices] = useState<InvoiceEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [attachingId, setAttachingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !conversationId) return;

        let isMounted = true;
        setIsLoading(true);
        setError(null);

        const fetchInvoices = async () => {
            try {
                const res = await fetch(`/api/messages/conversations/${conversationId}/payments`);
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) {
                        setInvoices(data.payments || []);
                    }
                } else {
                    if (isMounted) {
                        setInvoices([]);
                    }
                }
            } catch (err) {
                console.error("Failed to load invoices for attachment:", err);
                if (isMounted) {
                    setError("Could not load invoices. Please try again.");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void fetchInvoices();

        return () => {
            isMounted = false;
        };
    }, [isOpen, conversationId]);

    const handleAttachInvoice = async (item: InvoiceEntry) => {
        if (!contact || attachingId) return;
        setAttachingId(item.id);
        setError(null);

        try {
            // First attempt to trigger through reminder API if pending
            let sentViaReminder = false;
            if (item.statusTone !== "paid") {
                try {
                    const reminderRes = await fetch(`/api/landlord/invoices/${item.id}/reminder`, {
                        method: "POST",
                    });
                    if (reminderRes.ok) {
                        sentViaReminder = true;
                    }
                } catch {
                    // Fall back to direct system message
                }
            }

            if (!sentViaReminder) {
                const description = item.typeLabel || "Monthly Rent";
                const content = `Invoice for ${description} (₱${item.amount.toLocaleString()}) has been attached.`;
                const isPaid = item.statusTone === "paid";
                
                await sendConversationMessage(
                    conversationId,
                    content,
                    {
                        systemType: isPaid ? "invoice" : "reminder_sent",
                        invoiceId: item.id,
                        amount: String(item.amount),
                        description,
                        status: item.statusLabel,
                        date: item.dateLabel,
                        unit: contact.unit,
                        tenantName: contact.name,
                        actionLabel: isPaid ? "View Receipt" : "Pay Now",
                        payNowPath: `/tenant/payments/${item.id}/checkout`,
                    },
                    "system"
                );
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Failed to attach invoice to chat:", err);
            setError(err.message || "Failed to attach invoice to chat.");
        } finally {
            setAttachingId(null);
        }
    };

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
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] neumorphic-panel p-6 shadow-2xl z-10 border border-white/10 bg-surface-1"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-divider">
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                                <Receipt className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight text-high">
                                    Attach Bill or Invoice
                                </h3>
                                <p className="text-xs font-medium text-medium">
                                    {contact?.name ? `${contact.name} (${contact.unit})` : "Resident"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-full p-2 text-disabled hover:text-high hover:bg-surface-3 transition-colors"
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-500 font-medium flex items-center gap-2">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Content List */}
                    <div className="mt-4 max-h-96 overflow-y-auto custom-scrollbar-premium space-y-3">
                        {isLoading ? (
                            <div className="space-y-3 py-4">
                                {Array.from({ length: 3 }).map((_, idx) => (
                                    <div key={`inv-skel-${idx}`} className="h-20 w-full rounded-2xl bg-surface-2 animate-pulse" />
                                ))}
                            </div>
                        ) : invoices.length === 0 ? (
                            <div className="py-12 px-4 text-center">
                                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-surface-2 text-disabled mb-3">
                                    <Receipt className="size-6" />
                                </div>
                                <h4 className="text-sm font-bold text-high">No Invoices Found</h4>
                                <p className="text-xs text-disabled mt-1 max-w-xs mx-auto">
                                    There are no pending or past bills recorded for this resident.
                                </p>
                                <Link
                                    href="/landlord/invoices?action=create"
                                    onClick={onClose}
                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl neumorphic-primary text-white text-xs font-black shadow-md hover:scale-105 transition-all"
                                >
                                    <Plus className="size-3.5" />
                                    Create New Invoice
                                </Link>
                            </div>
                        ) : (
                            invoices.map((invoice) => {
                                const isAttaching = attachingId === invoice.id;
                                return (
                                    <div
                                        key={invoice.id}
                                        className="flex items-center justify-between p-4 rounded-2xl neumorphic-inset-card transition-all hover:border-primary/20"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                                            <div className="flex size-10 items-center justify-center rounded-xl bg-surface-3 text-high shrink-0">
                                                <CreditCard className="size-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-black text-high truncate">
                                                        {invoice.typeLabel || "Monthly Rent"}
                                                    </span>
                                                    {getStatusBadge(invoice.statusTone, invoice.statusLabel)}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-[10px] text-disabled">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="size-3" />
                                                        {invoice.dateLabel || invoice.monthLabel}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-sm font-black text-high">
                                                ₱{invoice.amount.toLocaleString()}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleAttachInvoice(invoice)}
                                                disabled={isAttaching || Boolean(attachingId)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all",
                                                    isAttaching
                                                        ? "bg-primary/20 text-primary cursor-not-allowed"
                                                        : "neumorphic-primary text-white hover:scale-105 active:scale-95 shadow-sm"
                                                )}
                                            >
                                                {isAttaching ? (
                                                    <>
                                                        <Loader2 className="size-3.5 animate-spin" />
                                                        Sending…
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="size-3.5" />
                                                        Attach
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
