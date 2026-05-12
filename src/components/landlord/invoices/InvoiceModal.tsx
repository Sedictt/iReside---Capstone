"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { 
    CheckCircle2, Clock3, Loader2, QrCode, Receipt, Send, X, XCircle, 
    FileText, User, Building2, Hash, ArrowUpRight, ShieldCheck, 
    AlertTriangle, Info, ChevronRight, MessageSquare, History,
    CheckCircle, AlertCircle, HelpCircle, Wallet
} from "lucide-react";
import { createPortal } from "react-dom";
import { m as motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import { formatDateLong, formatPhpCurrency } from "@/lib/billing/utils";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Upload, Camera, Trash2 } from "lucide-react";

type InvoiceDetail = Awaited<ReturnType<typeof import("@/lib/billing/server").getInvoiceDetailForActor>>;

export function InvoiceModal({
    invoiceId,
    onClose,
    onUpdated,
    role = "landlord",
    refundMessage
}: {
    invoiceId: string | null;
    onClose: () => void;
    onUpdated: () => void;
    role?: "landlord" | "tenant";
    refundMessage?: any;
}) {
    const [invoice, setInvoice] = useState<InvoiceDetail>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<"confirm" | "confirm_received" | "reject" | "request_completion" | "remind" | null>(null);
    const [pendingAction, setPendingAction] = useState<{ type: any; label: string; desc: string; isCrucial?: boolean } | null>(null);
    const [confirmCountdown, setConfirmCountdown] = useState(0);
    const [reviewNote, setReviewNote] = useState("");
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [issueType, setIssueType] = useState<"insufficient_amount" | "excessive_amount" | "not_received" | "invalid_proof" | "other" | "">("");
    const [shortfallAmount, setShortfallAmount] = useState<number | "">("");
    const [showRejectionWarning, setShowRejectionWarning] = useState(false);
    const [nonExactAction, setNonExactAction] = useState<"accept_partial" | "request_completion" | "reject">("accept_partial");
    const [activeTab, setActiveTab] = useState<"approve" | "issue">("approve");
    const [refundProofFile, setRefundProofFile] = useState<File | null>(null);

    useEffect(() => {
        if (!invoiceId) return;
        
        // Reset all state when opening a new invoice to prevent data leak between tenants/invoices
        setRefundProofFile(null);
        setReviewNote("");
        setRejectionReason("");
        setIssueType("");
        setShortfallAmount("");
        setNonExactAction("accept_partial");
        // Always open on approve tab (RefundCenter shows there when refund details exist)
        setActiveTab("approve");
        setPendingAction(null);
        setConfirmCountdown(0);
        setShowRejectionWarning(false);
        
        let alive = true;
        setLoading(true);
        document.body.style.overflow = "hidden";

        const load = async () => {
            try {
                // Handle Preview Mode / Mock Data for Demonstration
                if (invoiceId.startsWith("preview-") || invoiceId.startsWith("selective-") || invoiceId === "demo-invoice") {
                    const mock = mockInvoice(invoiceId);
                    if (alive) {
                        setInvoice(mock);
                        setLoading(false);
                    }
                    return;
                }

                const endpoint = role === "landlord" 
                    ? `/api/landlord/invoices/${invoiceId}` 
                    : `/api/tenant/payments/${invoiceId}`;
                const response = await fetch(endpoint, { cache: "no-store" });
                
                if (!response.ok) {
                    console.warn(`[InvoiceModal] Failed to fetch invoice ${invoiceId}: ${response.status}`);
                    // Fallback to mock if API fails in dev/preview environments
                    if (alive) {
                        setInvoice(mockInvoice(invoiceId));
                        setLoading(false);
                    }
                    return;
                }

                const payload = await response.json();
                if (alive) {
                    setInvoice(payload.invoice ?? null);
                    if (payload.invoice?.amountTag !== "exact") {
                        setNonExactAction("accept_partial");
                    }
                }
            } catch (err) {
                console.error("[InvoiceModal] Load Error:", err);
                if (alive) setInvoice(mockInvoice(invoiceId));
            } finally {
                if (alive) setLoading(false);
            }
        };

        void load();
        return () => {
            alive = false;
            document.body.style.overflow = "unset";
        };
    }, [invoiceId]);

    // Safety Timer Logic
    useEffect(() => {
        if (confirmCountdown > 0) {
            const timer = setTimeout(() => setConfirmCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [confirmCountdown]);

    if (!invoiceId) return null;

    const runAction = async (action: "confirm" | "confirm_received" | "reject" | "request_completion" | "remind") => {
        // Intercept if not already confirmed
        if (!pendingAction && action !== "remind") {
            const config = {
                confirm: { label: "Issue Official Receipt", desc: "This will officially record the payment and generate a permanent receipt for the tenant. This action is financially binding.", isCrucial: true },
                confirm_received: { label: "Confirm Cash Received", desc: "By clicking this, you confirm you have physically received the cash amount. This will update the property ledger immediately.", isCrucial: true },
                reject: { label: "Reject This Payment", desc: "The tenant's submission will be cancelled. They will be notified to correct their proof or amount and resubmit.", isCrucial: true },
                request_completion: { label: "Request Missing Balance", desc: "The tenant will be notified that they still owe a balance, but their current payment will be recorded.", isCrucial: true },
                remind: { label: "Send Gentle Nudge", desc: "Sends a notification without changing status.", isCrucial: false }
            };
            const c = config[action];
            setPendingAction({ type: action, ...c });
            if (c.isCrucial) setConfirmCountdown(3);
            else setConfirmCountdown(0);
            return;
        }

        // Validate rejection reason before proceeding
        const needsRejectionReason = action === "reject" || action === "request_completion" || nonExactAction === "reject" || nonExactAction === "request_completion";
        if (needsRejectionReason && !rejectionReason.trim()) {
            setShowRejectionWarning(true);
            return;
        }

        setShowRejectionWarning(false);
        setActionLoading(action);
        console.log("[InvoiceModal] runAction called:", action, "pendingAction:", pendingAction, "refundProofFile:", !!refundProofFile);
        try {
            const endpoint = action === "remind" ? "reminder" : "review";
            const amountTag = invoice?.amountTag ?? "exact";
            const effectiveIssueType = issueType || ((invoice?.metadata as any)?.refund_preference ? "excessive_amount" : undefined);
            
            const payload = {
                action,
                note: reviewNote || undefined,
                amountTag,
                acceptedAmount: shortfallAmount !== "" 
                    ? Number(invoice?.totalAmount ?? 0) - Number(shortfallAmount)
                    : Number(invoice?.totalAmount ?? 0),
                nonExactAction: amountTag !== "exact" && (action === "confirm" || action === "confirm_received")
                    ? nonExactAction
                    : undefined,
                rejectionReason:
                    action === "reject" || action === "request_completion" || nonExactAction === "reject" || nonExactAction === "request_completion"
                        ? rejectionReason || undefined
                        : undefined,
                issueType: effectiveIssueType,
                shortfallAmount: shortfallAmount !== "" ? Number(shortfallAmount) : undefined,
            };

            let body: any;
            let headers: any = undefined;

            if (action === "remind") {
                body = undefined;
            } else {
                const formData = new FormData();
                formData.append("json", JSON.stringify(payload));
                if (refundProofFile) {
                    formData.append("refundProofFile", refundProofFile);
                }
                body = formData;
            }

            const response = await fetch(`/api/landlord/invoices/${invoiceId}/${endpoint}`, {
                method: "POST",
                headers,
                body,
            });
            console.log("[InvoiceModal] API Response:", response.status, response.statusText);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to process review");
            }

            // Reload invoice data to show updated state
            await new Promise(resolve => setTimeout(resolve, 500));
            const reloadResponse = await fetch(`/api/landlord/invoices/${invoiceId}`, { cache: "no-store" });
            if (reloadResponse.ok) {
                const reloadData = await reloadResponse.json();
                if (reloadData.invoice) {
                    setInvoice(reloadData.invoice);
                }
            }

            onUpdated();
            
            // Delay closing to show the updated state
            await new Promise(resolve => setTimeout(resolve, 1000));
            setRefundProofFile(null);
            onClose();
        } catch (error: any) {
            console.error("[InvoiceModal] Action failed:", error);
            alert(error.message || "An unexpected error occurred. Please try again.");
        } finally {
            setActionLoading(null);
        }
        setPendingAction(null);
    };

    const statusConfig = {
        paid: {
            classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            label: "Paid",
            dot: "bg-emerald-400"
        },
        overdue: {
            classes: "bg-rose-500/10 text-rose-400 border-rose-500/20",
            label: "Overdue",
            dot: "bg-rose-400"
        },
        processing: {
            classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            label: "Processing",
            dot: "bg-amber-400"
        },
        reminder_sent: {
            classes: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            label: "Reminder Sent",
            dot: "bg-blue-400",
        },
        intent_submitted: {
            classes: "bg-primary/10 text-primary border-primary/20",
            label: "Intent Submitted",
            dot: "bg-primary",
        },
        under_review: {
            classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            label: "Under Review",
            dot: "bg-amber-400",
        },
        awaiting_in_person: {
            classes: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
            label: "Awaiting In-Person",
            dot: "bg-cyan-400",
        },
        confirmed: {
            classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            label: "Confirmed",
            dot: "bg-emerald-400",
        },
        rejected: {
            classes: "bg-rose-500/10 text-rose-400 border-rose-500/20",
            label: "Rejected",
            dot: "bg-rose-400",
        },
        receipted: {
            classes: "bg-lime-500/10 text-lime-300 border-lime-500/20",
            label: "Receipted",
            dot: "bg-lime-300",
        },
        pending: {
            classes: "bg-zinc-500/10 text-zinc-400 border-white/10",
            label: "Pending",
            dot: "bg-zinc-400"
        }
    };

    const currentStatus = ((invoice?.workflowStatus ?? invoice?.status) as keyof typeof statusConfig) || "pending";
     const statusStyle = statusConfig[currentStatus] || statusConfig.pending;

     const handleClose = () => {
         setRefundProofFile(null);
         onClose();
     };

     const content = (
         <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
             <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                 onClick={handleClose}
             />
             
             <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-surface-0 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)]"
            >
                
                {/* Header Section */}
                <div className="relative shrink-0 overflow-hidden border-b border-white/5 bg-surface-1/50 px-8 py-8">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 size-64 rounded-full bg-primary/5 blur-3xl transition-opacity animate-pulse" />
                    
                    <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-surface-2 border border-white/10 shadow-inner">
                                    <FileText className="size-5 text-text-medium" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-[0.25em] text-text-medium">Invoice Specification</span>
                            </div>
                            
                            <h2 className="text-4xl font-black tracking-tight text-text-high">
                                {invoice?.invoiceNumber ?? "Loading..."}
                            </h2>
                            
                            {invoice && (
                                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-text-medium">
                                    <span className="flex items-center gap-2 rounded-full bg-surface-2/50 px-3 py-1 text-text-high border border-white/5 shadow-sm">
                                        <User className="size-3.5 text-primary" />
                                        {invoice.tenant?.full_name}
                                    </span>
                                    <div className="size-1 rounded-full bg-white/10" />
                                    <span className="flex items-center gap-2 rounded-full bg-surface-2/50 px-3 py-1 border border-white/5 shadow-sm">
                                        <Building2 className="size-3.5 text-text-disabled" />
                                        {invoice.property?.name}
                                    </span>
                                    <div className="size-1 rounded-full bg-white/10" />
                                    <span className="rounded-full bg-surface-2/50 px-3 py-1 border border-white/5 shadow-sm">
                                        Unit {invoice.unit?.name}
                                    </span>
                                    {invoice.paymentSubmittedAt && (
                                        <>
                                            <div className="size-1 rounded-full bg-white/10" />
                                            <span className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary border border-primary/20 shadow-sm animate-in fade-in slide-in-from-left-2 duration-500">
                                                <Clock3 className="size-3.5" />
                                                Paid on {formatDateLong(invoice.paymentSubmittedAt)}
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {invoice && (
                                <div className={cn("flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] shadow-lg", statusStyle.classes)}>
                                    <span className={cn("size-1.5 rounded-full animate-pulse", statusStyle.dot)} />
                                    {statusStyle.label}
                                </div>
                             )}
                             <button 
                                 onClick={handleClose} 
                                 className="group flex size-10 items-center justify-center rounded-full border border-white/10 bg-surface-2 text-text-medium transition-all hover:bg-surface-3 hover:text-text-high active:scale-95 shadow-lg"
                             >
                                 <X className="size-5 transition-transform group-hover:rotate-90" />
                             </button>
                        </div>
                    </div>
                </div>

                <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[1.1fr_0.9fr]">
                    {/* Left Column: Details & Items */}
                    <div className="space-y-8 p-8 overflow-y-auto custom-scrollbar-premium bg-surface-0">
                        {loading || !invoice ? (
                            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-text-medium text-center">
                                <div className="relative">
                                    <Loader2 className="size-12 animate-spin text-primary" />
                                    <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
                                </div>
                                <p className="text-sm font-medium">Synchronizing ledger details...</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-text-high tracking-tight">Financial Overview</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-disabled">Ledger Reconciliation</p>
                                </div>

                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-high">
                                            <Hash className="size-4 text-primary" />
                                            Itemized Breakdown
                                        </h3>
                                    </div>
                                    <div className="grid gap-3">
                                        {invoice.lineItems.map((item) => (
                                            <div key={item.id} className="group flex items-center justify-between rounded-2xl border border-white/5 bg-surface-1 p-5 transition-all hover:bg-surface-2 hover:border-white/10 shadow-sm">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-text-high">{item.label}</p>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-disabled">{item.category}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-base font-black text-text-high">{formatPhpCurrency(item.amount)}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {invoice.paidAmount === 0 && (
                                            <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 shadow-inner">
                                                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Total Payable</p>
                                                <p className="text-lg font-black text-primary">{formatPhpCurrency(invoice.totalAmount)}</p>
                                            </div>
                                        )}

                                        {invoice.paidAmount > 0 && (
                                            <>
                                                <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-surface-2/30 px-5 py-3 mt-4">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-disabled">Paid to Date</p>
                                                    <p className="text-sm font-black text-emerald-400">-{formatPhpCurrency(invoice.paidAmount)}</p>
                                                </div>
                                                <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 shadow-inner">
                                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Remaining Balance</p>
                                                    <p className="text-lg font-black text-primary">{formatPhpCurrency(invoice.balanceRemaining)}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-high">
                                        <Clock3 className="size-4 text-primary" />
                                        Utility Consumption
                                    </h3>
                                    <div className="grid gap-4">
                                        {invoice.readings.length === 0 && (
                                            <div className="rounded-3xl border-2 border-dashed border-white/5 bg-surface-1/30 p-8 text-center">
                                                <p className="text-sm font-medium text-text-disabled">No metered readings associated with this period.</p>
                                            </div>
                                        )}
                                        {invoice.readings.map((reading) => (
                                            <div key={reading.id} className="overflow-hidden rounded-3xl border border-white/5 bg-surface-1 shadow-sm">
                                                <div className="flex items-center justify-between bg-surface-2/50 px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-2 rounded-full bg-primary" />
                                                        <p className="text-sm font-black capitalize text-text-high">{reading.utility_type} Service</p>
                                                    </div>
                                                    <span className={cn("rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider", reading.billing_mode === "included_in_rent" ? "bg-white/5 text-text-medium" : "bg-primary/10 text-primary")}>
                                                        {reading.billing_mode === "included_in_rent" ? "Bundled" : "Unit Standard"}
                                                    </span>
                                                </div>
                                                <div className="p-6">
                                                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                                                        <ReadingField label="Prev" value={reading.previous_reading} />
                                                        <ReadingField label="Curr" value={reading.current_reading} />
                                                        <ReadingField label="Usage" value={reading.usage} highlight />
                                                        <ReadingField label="Charge" value={formatPhpCurrency(reading.computed_charge)} highlight />
                                                    </div>
                                                    <div className="mt-5 border-t border-white/5 pt-4">
                                                        <p className="text-[10px] font-medium uppercase tracking-widest text-text-disabled">
                                                            Billing Period: {formatDateLong(reading.billing_period_start)} â€“ {formatDateLong(reading.billing_period_end)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-high">
                                            <Receipt className="size-4 text-primary" />
                                            Proof of Payment
                                        </h3>
                                    </div>

                                    {invoice.paymentProofUrl ? (
                                        <button 
                                            onClick={() => setLightboxUrl(invoice.paymentProofUrl)}
                                            className="group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-surface-1 p-2 transition-all hover:border-primary/30 cursor-zoom-in"
                                        >
                                            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-2">
                                                <Image
                                                    src={invoice.paymentProofUrl}
                                                    alt="Proof of Payment"
                                                    fill
                                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="flex size-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md border border-white/20">
                                                        <ArrowUpRight className="size-6" />
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Click to Expand Receipt</p>
                                                </div>
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="relative overflow-hidden rounded-[2rem] border-2 border-dashed border-white/5 bg-surface-1/30 p-10 text-center group transition-all hover:border-white/10">
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-20" />
                                            <div className="relative flex flex-col items-center gap-4">
                                                <div className="flex size-16 items-center justify-center rounded-2xl bg-surface-2 border border-white/5 text-text-disabled shadow-inner group-hover:scale-110 transition-transform">
                                                    <Receipt className="size-8 opacity-20" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-text-medium">No Proof Attached</p>
                                                    <p className="text-[10px] font-medium text-text-disabled max-w-[200px] mx-auto leading-relaxed">
                                                        The tenant has not uploaded a digital receipt for this transaction yet.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {(invoice.metadata as any)?.refund_proof_url && (
                                        <div className="space-y-4 pt-8 border-t border-white/5 text-left">
                                            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text-high">
                                                <Wallet className="size-4 text-amber-400" />
                                                Proof of Refund
                                            </h3>
                                            <button 
                                                onClick={() => setLightboxUrl((invoice.metadata as any).refund_proof_url)}
                                                className="group relative w-full overflow-hidden rounded-3xl border border-amber-500/10 bg-amber-500/5 p-2 transition-all hover:border-amber-500/30 cursor-zoom-in text-left"
                                            >
                                                <div className="relative aspect-video overflow-hidden rounded-2xl bg-surface-2">
                                                    <Image
                                                        src={(invoice.metadata as any).refund_proof_url}
                                                        alt="Proof of Refund"
                                                        fill
                                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="flex size-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md border border-white/20">
                                                            <ArrowUpRight className="size-6" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </section>
                            </>
                        )}
                    </div>

                    {/* Right Column: Decisions Hub (Hidden for Tenants) */}
                    {role === "landlord" && (
                        <div className="relative border-l border-white/5 bg-surface-1/40 backdrop-blur-xl overflow-y-auto custom-scrollbar-premium">
                            <div className="space-y-6 p-8 pb-12">
                            {invoice && (
                                <>
                                    {/* Verification Section */}
                                    <section className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-medium">Payment Verification</h3>
                                            {invoice.paymentProofUrl && (
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                    <ShieldCheck className="size-3" />
                                                    Attachment Provided
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="grid gap-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <StatusLine label="Payment Method" value={invoice.paymentMethod ?? "Not specified"} icon={<CreditCardIcon className="size-3.5" />} />
                                                <StatusLine label="Reference #" value={invoice.referenceNumber ?? "None"} icon={<Hash className="size-3.5" />} />
                                            </div>

                                            {invoice.paymentProofUrl && (
                                                <a 
                                                    href={invoice.paymentProofUrl} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="group relative overflow-hidden flex items-center justify-between rounded-2xl border border-white/10 bg-surface-2 p-5 transition-all hover:bg-surface-3 hover:border-primary/40 shadow-sm"
                                                >
                                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="flex items-center gap-4 relative">
                                                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-inner">
                                                            <Receipt className="size-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-text-high">Review Payment Proof</p>
                                                            <p className="text-[10px] text-text-medium font-medium">Click to view uploaded receipt image</p>
                                                        </div>
                                                    </div>
                                                    <ArrowUpRight className="size-5 text-text-disabled transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-primary" />
                                                </a>
                                            )}

                                            {invoice.paymentDestination && (
                                                <div className="rounded-2xl border border-white/10 bg-surface-2 p-5 space-y-3 shadow-sm">
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-disabled">
                                                        <QrCode className="size-3.5" />
                                                        Paid To
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-text-high">{invoice.paymentDestination.account_name}</p>
                                                        <p className="text-xs font-black text-primary mt-0.5 tracking-wider">{invoice.paymentDestination.account_number}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* Decisions Hub */}
                                    <section className="space-y-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-medium">Action Center</h3>
                                            <div className="flex bg-surface-2 p-1 rounded-xl border border-white/5 shadow-inner">
                                                <button 
                                                    onClick={() => setActiveTab("approve")}
                                                    className={cn(
                                                        "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                                                        activeTab === "approve" ? "bg-primary text-primary-foreground shadow-sm" : "text-text-disabled hover:text-text-medium"
                                                    )}
                                                >
                                                    Confirm
                                                </button>
                                                <button 
                                                    onClick={() => setActiveTab("issue")}
                                                    className={cn(
                                                        "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                                                        activeTab === "issue" ? "bg-amber-500 text-white shadow-sm" : "text-text-disabled hover:text-text-medium"
                                                    )}
                                                >
                                                    Report Issue
                                                </button>
                                            </div>
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {activeTab === "approve" ? (
                                                <motion.div 
                                                    key="approve-tab"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -10 }}
                                                    className="space-y-4"
                                                >
                                                    {(invoice.metadata as any)?.refund_preference || refundMessage?.hasRefundDetails ? (
                                                        <RefundCenter 
                                                            invoice={invoice} 
                                                            runAction={runAction} 
                                                            actionLoading={actionLoading}
                                                            proofFile={refundProofFile}
                                                            onProofChange={setRefundProofFile}
                                                            refundMessage={refundMessage}
                                                            onRefundSuccess={() => {
                                                                setRefundProofFile(null);
                                                                onUpdated();
                                                                setTimeout(() => onClose(), 1200);
                                                            }}
                                                        />
                                                    ) : invoice.paymentMethod === "in_person" || invoice.paymentMethod === "cash" ? (
                                                        <F2FActionCenter 
                                                            invoice={invoice}
                                                            runAction={runAction}
                                                            actionLoading={actionLoading}
                                                            reviewNote={reviewNote}
                                                            setReviewNote={setReviewNote}
                                                        />
                                                    ) : (
                                                        <>
                                                            <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-5 space-y-3">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                                                                        <CheckCircle className="size-3" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-xs font-black text-text-high leading-tight">Proceed with Confirmation</p>
                                                                        <p className="text-[10px] text-text-medium font-medium leading-relaxed">Everything looks correct. Confirming will finalize the payment and issue a formal receipt to the tenant.</p>
                                                                    </div>
                                                                </div>
                                                            </div>
 
                                                            <div className="space-y-4">
                                                                <div className="relative group">
                                                                    <textarea 
                                                                        value={reviewNote} 
                                                                        onChange={(event) => setReviewNote(event.target.value)} 
                                                                        rows={3} 
                                                                        className="w-full resize-none rounded-2xl border border-white/10 bg-surface-2 px-5 py-4 text-sm text-text-high placeholder:text-text-disabled focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner" 
                                                                        placeholder="Add an optional message for the tenant (e.g. 'Thank you for the prompt payment!')" 
                                                                    />
                                                                    <div className="absolute right-4 bottom-4 opacity-30 group-focus-within:opacity-100 transition-opacity">
                                                                        <MessageSquare className="size-4 text-primary" />
                                                                    </div>
                                                                </div>
 
                                                                <div className="space-y-3">
                                                                    <ActionButton 
                                                                        onClick={() => runAction("confirm")} 
                                                                        loading={actionLoading === "confirm"} 
                                                                        variant="primary"
                                                                        fullWidth
                                                                        icon={<CheckCircle2 className="size-5" />}
                                                                    >
                                                                        Confirm & Issue Receipt
                                                                    </ActionButton>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </motion.div>
                                            ) : (
                                                <motion.div 
                                                    key="issue-tab"
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.98 }}
                                                    className="space-y-6"
                                                >
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-black text-text-high">Resolution Wizard</h4>
                                                        <p className="text-[10px] font-medium text-text-disabled uppercase tracking-widest">Step-by-step issue management</p>
                                                    </div>

                                                    <WizardFlow 
                                                        invoice={invoice} 
                                                        runAction={runAction} 
                                                        actionLoading={actionLoading}
                                                        reviewNote={reviewNote}
                                                        setReviewNote={setReviewNote}
                                                        rejectionReason={rejectionReason}
                                                        setRejectionReason={setRejectionReason}
                                                        nonExactAction={nonExactAction}
                                                        setNonExactAction={setNonExactAction}
                                                        showRejectionWarning={showRejectionWarning}
                                                        setShowRejectionWarning={setShowRejectionWarning}
                                                        issueType={issueType}
                                                        setIssueType={setIssueType}
                                                        shortfallAmount={shortfallAmount}
                                                        setShortfallAmount={setShortfallAmount}
                                                    />

                                                    <div className="pt-4 border-t border-white/5">
                                                        <div className="relative group/nudge">
                                                            <button 
                                                                onClick={() => runAction("remind")}
                                                                disabled={!!actionLoading}
                                                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-surface-2/30 py-3 text-[10px] font-black uppercase tracking-widest text-text-medium transition-all hover:bg-surface-3 hover:text-text-high hover:border-white/20 group"
                                                            >
                                                                {actionLoading === "remind" ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />}
                                                                Send a Gentle Nudge
                                                                <HelpCircle className="size-3 text-text-disabled group-hover:text-amber-400 transition-colors" />
                                                            </button>

                                                            {/* Custom Premium Tooltip */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 pointer-events-none opacity-0 group-hover/nudge:opacity-100 translate-y-2 group-hover/nudge:translate-y-0 transition-all duration-300 z-50">
                                                                <div className="relative rounded-2xl bg-surface-3 border border-white/10 p-4 shadow-2xl backdrop-blur-xl">
                                                                    <div className="flex gap-3">
                                                                        <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                                                                            <Info className="size-3" />
                                                                        </div>
                                                                        <p className="text-[10px] font-medium leading-relaxed text-text-medium">
                                                                            This sends a message to the tenant <span className="text-amber-400 font-black">without changing anything</span>. Use this if you just want to tell them you're still reviewing their payment.
                                                                        </p>
                                                                    </div>
                                                                    {/* Tooltip Arrow */}
                                                                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-surface-3" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </section>

                                    {/* History Section */}
                                    <section className="space-y-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <History className="size-3.5 text-text-disabled" />
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-medium">Audit History</h3>
                                        </div>
                                        <div className="space-y-3">
                                            {invoice.receipts.length === 0 && (
                                                <div className="rounded-2xl bg-surface-2/30 border border-white/5 p-6 text-center">
                                                    <p className="text-[10px] italic text-text-disabled">No transactions recorded yet for this invoice.</p>
                                                </div>
                                            )}
                                            {invoice.receipts.map((receipt) => (
                                                <div key={receipt.id} className="group flex items-center justify-between rounded-2xl border border-white/5 bg-surface-2/50 px-5 py-4 transition-all hover:bg-surface-3 shadow-sm">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                        <div>
                                                            <p className="text-[11px] font-black text-text-high tracking-tight">{receipt.receipt_number}</p>
                                                            <p className="text-[9px] font-medium uppercase tracking-wider text-text-disabled mt-0.5">{formatDateLong(receipt.issued_at)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-text-high">{formatPhpCurrency(receipt.amount)}</p>
                                                        <p className="text-[8px] font-black uppercase text-emerald-400 mt-0.5">Verified</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </>
                            )}
                        </div>
                    </div>
                    )}

                    {role === "tenant" && (
                        <div className="relative border-l border-white/5 bg-surface-1/40 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center">
                            <div className="space-y-8">
                                <div className="flex justify-center">
                                    <div className="size-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                                        <ShieldCheck className="size-10" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-text-high tracking-tight">Verified Statement</h3>
                                    <p className="text-sm text-text-medium leading-relaxed max-w-[280px]">
                                        This invoice has been officially logged in the iReside ledger. You can download a digital copy or pay through the checkout.
                                    </p>
                                </div>
                                {invoice?.status !== 'paid' && (
                                    <Link 
                                        href={`/tenant/payments/${invoiceId}/checkout`}
                                        className="w-full bg-primary hover:bg-primary-dark text-white py-5 px-8 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
                                    >
                                        Proceed to Payment <ArrowUpRight className="size-5" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Safety Confirmation Dialog Overlay */}
            <AnimatePresence>
                {pendingAction && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                            onClick={() => setPendingAction(null)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-surface-1 shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
                        >
                            <div className="p-10 space-y-8">
                                <div className="flex justify-center">
                                    <div className="flex size-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-400 shadow-inner">
                                        <ShieldCheck className="size-10" />
                                    </div>
                                </div>

                                <div className="space-y-3 text-center">
                                    <h3 className="text-2xl font-black text-text-high tracking-tight">Confirm Action</h3>
                                    <p className="text-sm font-medium leading-relaxed text-text-medium">
                                        You are about to <span className="text-amber-400 font-black underline decoration-amber-500/30 underline-offset-4">{pendingAction.label}</span>. 
                                        {pendingAction.desc}
                                    </p>
                                </div>

                                <div className="grid gap-3">
                                    <button 
                                        disabled={confirmCountdown > 0}
                                        onClick={() => runAction(pendingAction.type)}
                                        className={cn(
                                            "relative h-14 overflow-hidden rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98]",
                                            confirmCountdown > 0 
                                                ? "bg-white/5 text-text-disabled cursor-not-allowed" 
                                                : "bg-primary text-primary-foreground hover:brightness-110 shadow-lg"
                                        )}
                                    >
                                        {/* Progress Bar for Crucial Timer */}
                                        {confirmCountdown > 0 && (
                                            <motion.div 
                                                key="countdown-overlay"
                                                initial={{ scaleX: 1 }}
                                                animate={{ scaleX: 0 }}
                                                transition={{ duration: 3, ease: "linear" }}
                                                className="absolute inset-0 bg-amber-500/30 origin-left z-0"
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {confirmCountdown > 0 ? (
                                                <>
                                                    <Clock3 className="size-4 animate-pulse" />
                                                    Hold to Confirm ({confirmCountdown}s)
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="size-4" />
                                                    Yes, Proceed
                                                </>
                                            )}
                                        </span>
                                    </button>
                                    <button 
                                        onClick={() => setPendingAction(null)}
                                        className="h-14 rounded-2xl border border-white/10 bg-transparent text-sm font-black text-text-medium transition-all hover:bg-white/5"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* Lightbox for Proof of Payment */}
            <AnimatePresence>
                {lightboxUrl && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-10">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
                            onClick={() => setLightboxUrl(null)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative max-h-full max-w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.8)]"
                        >
                            <Image src={lightboxUrl} alt="Enlarged Proof" width={1200} height={900} className="object-contain" style={{maxHeight: '85vh', width: 'auto'}} />
                            <div className="absolute top-4 right-4">
                                <button 
                                    onClick={() => setLightboxUrl(null)}
                                    className="flex size-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 hover:bg-black/60 transition-all shadow-lg"
                                >
                                    <X className="size-6" />
                                </button>
                            </div>
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/5">
                                    Full Evidence Inspection
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );

    return typeof window === "undefined" ? null : createPortal(content, document.body);
}

function F2FActionCenter({ 
    invoice, 
    runAction, 
    actionLoading, 
    reviewNote, 
    setReviewNote 
}: {
    invoice: NonNullable<InvoiceDetail>;
    runAction: (action: any) => void;
    actionLoading: any;
    reviewNote: string;
    setReviewNote: (v: string) => void;
}) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="rounded-[2rem] border border-cyan-500/20 bg-cyan-500/10 p-6 text-center space-y-4">
                <div className="flex justify-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-cyan-400/20 text-cyan-400 shadow-inner">
                        <Building2 className="size-7" />
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-black text-white">Physical Cash Collection</p>
                    <p className="text-[10px] font-medium text-cyan-100/60 leading-relaxed uppercase tracking-wider">Face-to-Face Transaction</p>
                </div>
            </div>

            <div className="space-y-5">
                <div className="rounded-2xl border border-white/5 bg-surface-2 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-disabled">Amount to Receive</p>
                        <p className="text-sm font-black text-primary">{formatPhpCurrency(invoice?.balanceRemaining ?? 0)}</p>
                    </div>
                    <div className="h-[1px] bg-white/5" />
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-disabled">Handover Status</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-center">
                                <p className="text-[10px] font-black text-primary">In Person</p>
                            </div>
                            <div className="rounded-xl border border-white/5 bg-surface-3 p-3 text-center opacity-40">
                                <p className="text-[10px] font-black text-text-disabled">Other</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative group">
                    <textarea 
                        value={reviewNote} 
                        onChange={(event) => setReviewNote(event.target.value)} 
                        rows={2} 
                        className="w-full resize-none rounded-2xl border border-white/10 bg-surface-2 px-5 py-4 text-sm text-text-high placeholder:text-text-disabled focus:border-primary/50 outline-none transition-all" 
                        placeholder="Note (e.g. 'Received at unit 202')" 
                    />
                </div>

                <ActionButton 
                    onClick={() => runAction("confirm_received")} 
                    loading={actionLoading === "confirm_received"} 
                    variant="primary"
                    fullWidth
                    icon={<ShieldCheck className="size-5" />}
                >
                    Confirm Cash Received
                </ActionButton>
            </div>
        </div>
    );
}

function WizardFlow({ 
    invoice, 
    runAction, 
    actionLoading, 
    reviewNote, 
    setReviewNote, 
    rejectionReason, 
    setRejectionReason, 
    nonExactAction, 
    setNonExactAction,
    showRejectionWarning,
    setShowRejectionWarning,
    issueType,
    setIssueType,
    shortfallAmount,
    setShortfallAmount
}: {
    invoice: NonNullable<InvoiceDetail>;
    runAction: (action: any) => void;
    actionLoading: any;
    reviewNote: string;
    setReviewNote: (v: string) => void;
    rejectionReason: string;
    setRejectionReason: (v: string) => void;
    nonExactAction: string;
    setNonExactAction: (v: any) => void;
    showRejectionWarning: boolean;
    setShowRejectionWarning: (v: boolean) => void;
    issueType: string;
    setIssueType: (v: any) => void;
    shortfallAmount: number | "";
    setShortfallAmount: (v: number | "") => void;
}) {
    const [step, setStep] = useState<"diagnose" | "adjust" | "resolve" | "communicate">("diagnose");
    const [diagnosis, setDiagnosis] = useState<"amount" | "proof" | "other" | null>(null);
    const [receivedAmount, setReceivedAmount] = useState<number | "">("");

    const handleDiagnosis = (d: "amount" | "proof" | "other") => {
        setDiagnosis(d);
        if (d === "proof") {
            setNonExactAction("reject");
            setStep("communicate");
        } else if (d === "amount") {
            setStep("adjust");
        } else {
            setNonExactAction("other");
            setStep("communicate");
        }
    };

    return (
        <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
                {step === "diagnose" && (
                    <motion.div 
                        key="step-diagnose"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        <p className="text-[11px] font-black text-text-medium">What seems to be the problem?</p>
                        <div className="grid gap-3">
                            <DiagnosisCard 
                                icon={<AlertTriangle className="size-5" />}
                                title="Amount is Incorrect"
                                desc="The tenant paid more or less than required"
                                onClick={() => handleDiagnosis("amount")}
                            />
                            <DiagnosisCard 
                                icon={<FileText className="size-5" />}
                                title="Invalid Proof"
                                desc="Receipt is blurry, fake, or incorrect"
                                onClick={() => handleDiagnosis("proof")}
                            />
                            <DiagnosisCard 
                                icon={<MessageSquare className="size-5" />}
                                title="Something Else"
                                desc="Another issue not listed above"
                                onClick={() => handleDiagnosis("other")}
                            />
                        </div>
                    </motion.div>
                )}

                {step === "adjust" && (
                    <motion.div 
                        key="step-adjust"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-2">
                            <button onClick={() => setStep("diagnose")} className="text-text-disabled hover:text-text-medium transition-colors">
                                <ChevronRight className="size-4 rotate-180" />
                            </button>
                            <p className="text-[11px] font-black text-text-medium">Enter actual payment details</p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-surface-2 p-5 space-y-4 shadow-inner">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-disabled">Expected Amount</p>
                                <p className="text-sm font-black text-text-high">{formatPhpCurrency(invoice.balanceRemaining)}</p>
                            </div>
                            <div className="h-[1px] bg-white/5" />
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-disabled">Actual Amount Received</p>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-disabled group-focus-within:text-primary transition-colors font-black text-sm">â‚±</div>
                                    <input 
                                        type="number"
                                        value={receivedAmount}
                                        onChange={(e) => setReceivedAmount(e.target.value ? Number(e.target.value) : "")}
                                        className="w-full rounded-xl border border-white/10 bg-surface-3 pl-8 pr-4 py-3 text-sm font-black text-text-high outline-none focus:border-primary/50 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        <ActionButton 
                            onClick={() => {
                                if (receivedAmount === "") return;
                                const diff = invoice.balanceRemaining - receivedAmount;
                                setShortfallAmount(diff);
                                setStep("resolve");
                            }}
                            disabled={receivedAmount === ""}
                            variant="primary"
                            fullWidth
                            icon={<ChevronRight className="size-4" />}
                        >
                            Continue to Resolution
                        </ActionButton>
                    </motion.div>
                )}

                {step === "resolve" && (
                    <motion.div 
                        key="step-resolve"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-2">
                            <button onClick={() => setStep(diagnosis === "amount" ? "adjust" : "diagnose")} className="text-text-disabled hover:text-text-medium transition-colors">
                                <ChevronRight className="size-4 rotate-180" />
                            </button>
                            <p className="text-[11px] font-black text-text-medium">How would you like to handle this?</p>
                        </div>
                        <div className="grid gap-3">
                            {diagnosis === "amount" && (
                                <>
                                    <div className="rounded-xl bg-surface-2 p-3 flex items-center justify-between border border-white/5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-text-disabled">Adjustment</p>
                                        <p className={cn(
                                            "text-[10px] font-black",
                                            (shortfallAmount as number) > 0 ? "text-amber-400" : "text-emerald-400"
                                        )}>
                                            {(shortfallAmount as number) > 0 
                                                ? `Shortfall: ${formatPhpCurrency(shortfallAmount as number)}` 
                                                : `Excess: ${formatPhpCurrency(Math.abs(shortfallAmount as number))}`}
                                        </p>
                                    </div>

                                    {(shortfallAmount as number) > 0 && (
                                        <ResolutionCard 
                                            active={issueType === "insufficient_amount"}
                                            title="Insufficient Amount"
                                            desc="Ask the tenant to pay the remaining balance."
                                            onClick={() => { 
                                                setIssueType("insufficient_amount"); 
                                                setNonExactAction("request_completion"); 
                                                setRejectionReason(`The payment amount is insufficient. Please pay the remaining balance of ${formatPhpCurrency(shortfallAmount as number)}.`);
                                                setStep("communicate"); 
                                            }}
                                        />
                                    )}

                                    {(shortfallAmount as number) < 0 && (
                                        <ResolutionCard 
                                            active={issueType === "excessive_amount"}
                                            title="Too Much Amount"
                                            desc="Credit the overpayment to next month."
                                            onClick={() => { 
                                                setIssueType("excessive_amount"); 
                                                setNonExactAction("accept_partial"); 
                                                setRejectionReason(`The payment amount is excessive by ${formatPhpCurrency(Math.abs(shortfallAmount as number))}. We will credit the excess to your next month's rent.`);
                                                setStep("communicate"); 
                                            }}
                                        />
                                    )}
                                </>
                            )}
                            {diagnosis === "proof" && (
                                <ResolutionCard 
                                    active={issueType === "not_received"}
                                    title="Not Received"
                                    desc="The funds haven't arrived in the account."
                                    onClick={() => { 
                                        setIssueType("not_received"); 
                                        setNonExactAction("reject"); 
                                        setRejectionReason("We did not receive the payment in our records. Please verify the transaction details and resubmit proof.");
                                        setStep("communicate"); 
                                    }}
                                />
                            )}
                            <ResolutionCard 
                                active={nonExactAction === "reject" && issueType === "invalid_proof"}
                                title="Reject Entirely"
                                desc="Tell the tenant the evidence is invalid"
                                onClick={() => { 
                                    setIssueType("invalid_proof");
                                    setNonExactAction("reject"); 
                                    setRejectionReason("The proof of payment provided is invalid or unreadable. Please resubmit.");
                                    setStep("communicate"); 
                                }}
                            />
                        </div>
                    </motion.div>
                )}

                {step === "communicate" && (
                    <motion.div 
                        key="step-communicate"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-2">
                            <button onClick={() => setStep(diagnosis === "amount" ? "resolve" : "diagnose")} className="text-text-disabled hover:text-text-medium transition-colors">
                                <ChevronRight className="size-4 rotate-180" />
                            </button>
                            <p className="text-[11px] font-black text-text-medium">Finalize and Notify Tenant</p>
                        </div>

                        <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4 space-y-2">
                            <p className="text-[10px] font-black uppercase text-amber-500/80 tracking-widest flex items-center gap-2">
                                <Info className="size-3" />
                                Effect of this action
                            </p>
                            <p className="text-[11px] text-text-medium leading-relaxed font-medium">
                                {nonExactAction === "reject" && "The payment will be cancelled. The tenant will be asked to resubmit a valid payment proof and amount."}
                                {nonExactAction === "request_completion" && "The tenant will be notified that they still owe a balance, but their current payment will be recorded."}
                                {nonExactAction === "accept_partial" && "The payment will be accepted and the invoice will be marked as partially paid."}
                                {nonExactAction === "other" && "The payment will be flagged with your custom reason and the tenant will be notified."}
                            </p>
                        </div>

                        {showRejectionWarning && (
                            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 flex items-start gap-3">
                                <AlertTriangle className="size-5 text-rose-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-rose-400">Rejection reason required</p>
                                    <p className="text-xs text-rose-300/70 mt-1">Please enter a reason for the tenant before rejecting or requesting completion.</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative group">
                                <textarea 
                                    value={rejectionReason} 
                                    onChange={(event) => setRejectionReason(event.target.value)} 
                                    rows={3} 
                                    className="w-full resize-none rounded-2xl border border-white/10 bg-surface-2 px-5 py-4 text-sm text-text-high placeholder:text-text-disabled focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all shadow-inner" 
                                    placeholder="Add a reason for the tenant (e.g. 'The receipt is unreadable' or 'The amount is missing â‚±100')" 
                                />
                                <div className="absolute right-4 bottom-4 opacity-30 group-focus-within:opacity-100 transition-opacity">
                                    <MessageSquare className="size-4 text-amber-500" />
                                </div>
                            </div>

                            <ActionButton 
                                onClick={() => {
                                    if (nonExactAction === "accept_partial") runAction("confirm");
                                    else if (nonExactAction === "request_completion") runAction("request_completion");
                                    else runAction("reject");
                                }} 
                                loading={actionLoading === "reject" || actionLoading === "request_completion" || actionLoading === "confirm"} 
                                variant="danger"
                                fullWidth
                                icon={<CheckCircle2 className="size-5" />}
                            >
                                Submit Resolution
                            </ActionButton>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function DiagnosisCard({ icon, title, desc, onClick }: { icon: ReactNode, title: string, desc: string, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className="flex items-center gap-4 w-full p-4 rounded-2xl border border-white/5 bg-surface-2/50 hover:bg-surface-3 hover:border-white/10 transition-all text-left group"
        >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-text-disabled group-hover:text-primary group-hover:bg-primary/10 transition-all">
                {icon}
            </div>
            <div className="space-y-0.5">
                <p className="text-xs font-black text-text-high">{title}</p>
                <p className="text-[10px] text-text-disabled font-medium">{desc}</p>
            </div>
            <ChevronRight className="size-4 text-text-disabled ml-auto group-hover:translate-x-1 transition-transform" />
        </button>
    );
}

function ResolutionCard({ title, desc, onClick, active, disabled }: { title: string, desc: string, onClick: () => void, active?: boolean, disabled?: boolean }) {
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex flex-col items-start w-full p-4 rounded-2xl border transition-all text-left group",
                active ? "bg-amber-500/10 border-amber-500/40" : "bg-surface-2/50 border-white/5 hover:border-white/10 hover:bg-surface-3",
                disabled && "opacity-30 grayscale cursor-not-allowed"
            )}
        >
            <div className="flex items-center justify-between w-full">
                <p className={cn("text-xs font-black", active ? "text-amber-400" : "text-text-high")}>{title}</p>
                <div className={cn("size-2 rounded-full", active ? "bg-amber-500" : "bg-white/10")} />
            </div>
            <p className="text-[10px] text-text-disabled font-medium mt-1">{desc}</p>
        </button>
    );
}

function Metric({ label, value, accent, warning }: { label: string; value: string; accent?: boolean; warning?: boolean }) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-[2.25rem] border p-5 sm:p-6 transition-all duration-500 hover:shadow-xl group",
            accent ? "border-primary/30 bg-primary/5 shadow-[0_20px_40px_-20px_rgba(109,152,56,0.15)]" : "border-white/5 bg-surface-1",
            warning && !accent && "border-amber-500/20 bg-amber-500/5 shadow-[0_20px_40px_-20px_rgba(245,158,11,0.1)]"
        )}>
            {accent && <div className="absolute -top-6 -right-6 size-24 bg-primary/10 blur-3xl rounded-full animate-pulse" />}
            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-text-medium group-hover:text-primary transition-colors">{label}</p>
            <p className={cn(
                "mt-2 sm:mt-3 text-lg sm:text-xl lg:text-2xl font-black tracking-tight transition-transform group-hover:scale-[1.02] origin-left break-words leading-tight",
                accent ? "text-primary" : "text-text-high",
                warning && !accent && "text-amber-400"
            )}>
                {value}
            </p>
        </div>
    );
}

function ReadingField({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
    return (
        <div className={cn(
            "space-y-1.5 rounded-2xl p-4 border transition-all", 
            highlight ? "bg-surface-2 border-white/10 shadow-sm" : "bg-transparent border-white/5"
        )}>
            <p className="text-[9px] font-black uppercase tracking-widest text-text-disabled">{label}</p>
            <p className={cn("text-sm font-black leading-none", highlight ? "text-primary" : "text-text-high")}>{value}</p>
        </div>
    );
}

function StatusLine({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
    return (
        <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-surface-1 p-4 shadow-sm hover:border-white/20 transition-all group">
            <div className="flex items-center gap-2">
                <span className="text-text-disabled group-hover:text-primary transition-colors">{icon}</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-disabled">{label}</span>
            </div>
            <span className="text-xs font-black text-text-high truncate">{value}</span>
        </div>
    );
}

function ActionButton({
    children,
    icon,
    loading = false,
    onClick,
    variant = "ghost",
    fullWidth = false,
    disabled = false,
}: {
    children: ReactNode;
    icon: ReactNode;
    loading?: boolean;
    onClick: () => void;
    variant?: "primary" | "danger" | "ghost";
    fullWidth?: boolean;
    disabled?: boolean;
}) {
    const variants = {
        primary: "bg-primary text-primary-foreground hover:brightness-110 shadow-[0_12px_24px_-8px_rgba(109,152,56,0.5)] border-t border-white/20",
        danger: "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20",
        ghost: "bg-transparent border border-white/10 text-text-medium hover:bg-surface-2 hover:text-text-high shadow-sm",
    };

    return (
        <button 
            onClick={onClick} 
            disabled={loading || disabled} 
            className={cn(
                "group relative flex items-center justify-center gap-3 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-40 overflow-hidden", 
                fullWidth ? "w-full" : "",
                variants[variant]
            )}
        >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            {loading ? <Loader2 className="size-5 animate-spin" /> : (
                <>
                    <span className="relative z-10 transition-transform group-hover:scale-110">{icon}</span>
                    <span className="relative z-10">{children}</span>
                </>
            )}
        </button>
    );
}

function RefundCenter({ 
    invoice, 
    runAction, 
    actionLoading,
    proofFile,
    onProofChange,
    refundMessage,
    onRefundSuccess
}: { 
    invoice: InvoiceDetail; 
    runAction: (action: any) => void;
    actionLoading: string | null;
    proofFile: File | null;
    onProofChange: (file: File | null) => void;
    refundMessage?: any;
    onRefundSuccess?: () => void;
}) {
    if (!invoice) return null;
    const refund = (invoice.metadata as any)?.refund_preference;
    if (!refund) return null;

    const refundProofUrl = (invoice.metadata as any)?.refund_proof_url;
    const isAlreadyRefunded = !!refundProofUrl;

    if (isAlreadyRefunded) {
        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-8 text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-400 shadow-inner">
                            <CheckCircle2 className="size-8" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-lg font-black text-white">Refund Processed</p>
                        <p className="text-xs font-medium text-emerald-100/60 leading-relaxed uppercase tracking-widest">Transaction Reconciled</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-disabled ml-1">Submitted Proof</p>
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-surface-2 shadow-lg">
                        <Image
                            src={refundProofUrl}
                            alt="Refund Proof"
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-2 border border-white/5 text-center">
                    <p className="text-[10px] text-text-medium font-medium leading-relaxed">
                        The refund has been officially recorded. No further action is required for this reconciliation.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-5 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                        <Wallet className="size-3" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-black text-text-high leading-tight">Tenant Refund Request</p>
                        <p className="text-[10px] text-text-medium font-medium leading-relaxed">
                            The tenant has requested a refund for the excess payment. Please process this via GCash.
                        </p>
                    </div>
                </div>

                <div className="grid gap-3 p-3 rounded-xl bg-surface-2 border border-white/5 shadow-inner">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-disabled">Method</p>
                        <p className="text-[10px] font-black text-text-high uppercase tracking-widest">GCash</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-disabled">Account Number</p>
                        <p className="text-sm font-black text-primary tracking-wider font-mono">
                            {refund.gcash_number || "Provided via QR"}
                        </p>
                    </div>
                    {refund.qr_url && (
                        <div className="pt-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-disabled mb-2">Recipient QR Code</p>
                            <div className="relative group aspect-square w-full max-w-[200px] mx-auto overflow-hidden rounded-xl border border-white/10 bg-white p-2">
                                <Image
                                    src={refund.qr_url}
                                    alt="Tenant GCash QR"
                                    fill
                                    className="object-contain"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">View Full Size</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-disabled ml-1">Upload Proof of Refund</p>
                <div className="relative">
                    {!proofFile ? (
                        <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/10 bg-surface-1 py-8 text-text-disabled transition-all hover:border-primary/30 hover:bg-surface-2 cursor-pointer group">
                            <div className="p-3 rounded-full bg-surface-3 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <Upload className="size-5" />
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-black text-text-high group-hover:text-primary transition-colors">Select Proof Image</p>
                                <p className="text-[10px] font-medium">PNG, JPG or WebP (Max 5MB)</p>
                            </div>
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => onProofChange(e.target.files?.[0] || null)}
                            />
                        </label>
                    ) : (
                        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-surface-2">
                            <Image
                                src={URL.createObjectURL(proofFile)}
                                alt="Refund Proof Preview"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => onProofChange(null)}
                                    className="p-3 rounded-2xl bg-red-500 text-white shadow-xl active:scale-90 transition-all"
                                    title="Remove Image"
                                >
                                    <Trash2 className="size-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <RefundSubmitButton
                invoiceId={(invoice as any)?.id}
                proofFile={proofFile}
                onProofChange={onProofChange}
                onSuccess={onRefundSuccess}
            />
        </div>
    );
}

function RefundSubmitButton({
    invoiceId,
    proofFile,
    onProofChange,
    onSuccess
}: {
    invoiceId: string;
    proofFile: File | null;
    onProofChange: (file: File | null) => void;
    onSuccess?: () => void;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();
            if (proofFile) {
                formData.append("refundProofFile", proofFile);
            }

            const response = await fetch(
                `/api/landlord/invoices/${invoiceId}/mark-refunded`,
                { method: "POST", body: formData }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || "Failed to mark refund as processed.");
            }

            onProofChange(null);
            onSuccess?.();
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-3 pt-2">
            {error && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 flex items-start gap-2">
                    <AlertTriangle className="size-4 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-medium text-rose-400 leading-relaxed">{error}</p>
                </div>
            )}
            <p className="text-[10px] font-black uppercase tracking-widest text-text-disabled text-center mb-1">Finalize Resolution</p>
            <ActionButton
                onClick={handleSubmit}
                loading={isSubmitting}
                variant="primary"
                fullWidth
                icon={<CheckCircle2 className="size-5" />}
            >
                Mark as Refunded
            </ActionButton>
            <p className="text-[9px] text-text-disabled text-center leading-relaxed px-4">
                By clicking this, you confirm that you have manually sent the refund to the tenant&apos;s provided details.
            </p>
        </div>
    );
}
function CreditCardIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
    );
}

function mockInvoice(id: string): any {
    const now = new Date().toISOString();
    const isSelective = id.includes("selective");
    const isF2FPreview = id.includes("preview") || id.includes("in_person");
    
    return {
        id,
        invoiceNumber: isSelective ? "INV-SEL-2026-MOCK" : `INV-PREVIEW-${id.slice(0, 4).toUpperCase()}`,
        status: "pending",
        workflowStatus: isF2FPreview ? "awaiting_in_person" : "pending",
        totalAmount: isSelective ? 52020.50 : 14070,
        balanceRemaining: isSelective ? 52020.50 : 14070,
        paidAmount: 0,
        dueDate: "2026-06-01",
        issuedDate: now,
        billingCycle: "2026-05-01",
        invoicePeriodStart: "2026-05-01",
        invoicePeriodEnd: "2026-05-31",
        tenant: {
            full_name: isSelective ? "Selective Payment Demo" : "Tenant Preview",
            email: "demo@ireside.local",
            avatar_url: null,
        },
        property: {
            name: "Skyline Heights Apartments",
            address: "88 Orchid Blvd",
        },
        unit: {
            name: isSelective ? "Unit 42A" : "Unit 4B",
            floor: 42,
        },
        paymentMethod: isF2FPreview ? "in_person" : null,
        lineItems: [
            { id: "1", label: isSelective ? "Parking Slot B12" : "Monthly rent", amount: isSelective ? 5000 : 12500, category: isSelective ? "parking" : "rent" },
            { id: "2", label: "Water Consumption", amount: 540, category: "water" },
            { id: "3", label: "Electricity Consumption", amount: 1480.50, category: "electricity" }
        ],
        readings: [],
        receipts: [],
        paymentSubmittedAt: null,
        paymentProofUrl: null,
        amountTag: isSelective ? "partial" : "exact"
    };
}

