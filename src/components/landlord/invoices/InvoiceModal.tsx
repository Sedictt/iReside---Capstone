"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Clock3, Loader2, QrCode, Receipt, Send, X, XCircle, FileText, User, Building2, Hash, ArrowUpRight } from "lucide-react";
import { createPortal } from "react-dom";

import { formatDateLong, formatPhpCurrency } from "@/lib/billing/utils";
import { cn } from "@/lib/utils";

type InvoiceDetail = Awaited<ReturnType<typeof import("@/lib/billing/server").getInvoiceDetailForActor>>;

export function InvoiceModal({
    invoiceId,
    onClose,
    onUpdated,
}: {
    invoiceId: string | null;
    onClose: () => void;
    onUpdated: () => void;
}) {
    const [invoice, setInvoice] = useState<InvoiceDetail>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<"confirm" | "reject" | "remind" | null>(null);
    const [reviewNote, setReviewNote] = useState("");

    useEffect(() => {
        if (!invoiceId) return;
        let alive = true;
        setLoading(true);
        document.body.style.overflow = "hidden";

        const load = async () => {
            try {
                const response = await fetch(`/api/landlord/invoices/${invoiceId}`, { cache: "no-store" });
                if (!response.ok) throw new Error();
                const payload = await response.json();
                if (alive) setInvoice(payload.invoice ?? null);
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

    if (!invoiceId) return null;

    const runAction = async (action: "confirm" | "reject" | "remind") => {
        setActionLoading(action);
        try {
            const endpoint = action === "remind" ? "reminder" : "review";
            const response = await fetch(`/api/landlord/invoices/${invoiceId}/${endpoint}`, {
                method: "POST",
                headers: action === "remind" ? undefined : { "Content-Type": "application/json" },
                body: action === "remind" ? undefined : JSON.stringify({
                    decision: action === "confirm" ? "confirm" : "reject",
                    note: reviewNote || undefined,
                }),
            });
            if (!response.ok) throw new Error();
            onUpdated();
            onClose();
        } finally {
            setActionLoading(null);
        }
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
        pending: {
            classes: "bg-slate-500/10 text-slate-400 border-white/10",
            label: "Pending",
            dot: "bg-slate-400"
        }
    };

    const currentStatus = (invoice?.status as keyof typeof statusConfig) || "pending";
    const statusStyle = statusConfig[currentStatus] || statusConfig.pending;

    const content = (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-surface-0 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-300">
                
                {/* Header Section */}
                <div className="relative overflow-hidden border-b border-white/5 bg-surface-1/50 px-8 py-8">
                    {/* Decorative Background Element */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl transition-opacity animate-pulse" />
                    
                    <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 border border-white/10">
                                    <FileText className="h-5 w-5 text-text-medium" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-[0.25em] text-text-medium">Invoice Specification</span>
                            </div>
                            
                            <h2 className="text-4xl font-black tracking-tight text-text-high">
                                {invoice?.invoiceNumber ?? "Loading..."}
                            </h2>
                            
                            {invoice && (
                                <div className="flex flex-wrap items-center gap-px text-sm font-medium text-text-medium">
                                    <span className="flex items-center gap-2 rounded-full bg-surface-2/50 px-3 py-1 text-text-high">
                                        <User className="h-3.5 w-3.5" />
                                        {invoice.tenant?.full_name}
                                    </span>
                                    <span className="mx-2 opacity-30">•</span>
                                    <span className="flex items-center gap-2 rounded-full bg-surface-2/50 px-3 py-1">
                                        <Building2 className="h-3.5 w-3.5" />
                                        {invoice.property?.name}
                                    </span>
                                    <span className="mx-2 opacity-30">•</span>
                                    <span className="rounded-full bg-surface-2/50 px-3 py-1">
                                        Unit {invoice.unit?.name}
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {invoice && (
                                <div className={cn("flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.1em]", statusStyle.classes)}>
                                    <span className={cn("h-1.5 w-1.5 rounded-full", statusStyle.dot)} />
                                    {statusStyle.label}
                                </div>
                            )}
                            <button 
                                onClick={onClose} 
                                className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-surface-2 text-text-medium transition-all hover:bg-surface-3 hover:text-text-high active:scale-95"
                            >
                                <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid flex-1 gap-0 overflow-y-auto lg:grid-cols-[1.1fr_0.9fr] custom-scrollbar-premium">
                    {/* Left Column: Details & Items */}
                    <div className="space-y-8 p-8">
                        {loading || !invoice ? (
                            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-text-medium">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-sm font-medium animate-pulse">Synchronizing ledger details...</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Metric label="Total payable" value={formatPhpCurrency(invoice.totalAmount)} accent />
                                    <Metric label="Current Balance" value={formatPhpCurrency(invoice.balanceRemaining)} warning={invoice.balanceRemaining > 0} />
                                    <Metric label="Payment Date" value={invoice.paymentSubmittedAt ? formatDateLong(invoice.paymentSubmittedAt) : "Awaiting"} />
                                </div>

                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-high">
                                            <Hash className="h-4 w-4 text-primary" />
                                            Itemized Breakdown
                                        </h3>
                                    </div>
                                    <div className="grid gap-3">
                                        {invoice.lineItems.map((item) => (
                                            <div key={item.id} className="group flex items-center justify-between rounded-2xl border border-white/5 bg-surface-1 p-5 transition-all hover:bg-surface-2 hover:border-white/10">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-text-high">{item.label}</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-disabled">{item.category}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-base font-black text-text-high">{formatPhpCurrency(item.amount)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-high">
                                        <Clock3 className="h-4 w-4 text-primary" />
                                        Utility Consumption
                                    </h3>
                                    <div className="grid gap-4">
                                        {invoice.readings.length === 0 && (
                                            <div className="rounded-2xl border-2 border-dashed border-white/5 bg-surface-1/30 p-8 text-center">
                                                <p className="text-sm font-medium text-text-disabled">No metered readings associated with this period.</p>
                                            </div>
                                        )}
                                        {invoice.readings.map((reading) => (
                                            <div key={reading.id} className="overflow-hidden rounded-2xl border border-white/5 bg-surface-1">
                                                <div className="flex items-center justify-between bg-surface-2/50 px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                                        <p className="text-sm font-bold capitalize text-text-high">{reading.utility_type} Service</p>
                                                    </div>
                                                    <span className={cn("rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider", reading.billing_mode === "included_in_rent" ? "bg-white/5 text-text-medium" : "bg-primary/10 text-primary")}>
                                                        {reading.billing_mode === "included_in_rent" ? "Bundled" : "Unit Standard"}
                                                    </span>
                                                </div>
                                                <div className="p-5">
                                                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                                                        <ReadingField label="Prev" value={reading.previous_reading} />
                                                        <ReadingField label="Curr" value={reading.current_reading} />
                                                        <ReadingField label="Usage" value={reading.usage} highlight />
                                                        <ReadingField label="Charge" value={formatPhpCurrency(reading.computed_charge)} highlight />
                                                    </div>
                                                    <div className="mt-4 border-t border-white/5 pt-3">
                                                        <p className="text-[10px] uppercase tracking-widest text-text-disabled">
                                                            Billing Period: {formatDateLong(reading.billing_period_start)} – {formatDateLong(reading.billing_period_end)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </>
                        )}
                    </div>

                    {/* Right Column: Actions & History */}
                    <div className="relative border-l border-white/5 bg-surface-1/30">
                        <div className="sticky top-0 space-y-6 p-8">
                            {invoice && (
                                <>
                                    <section className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-medium">Verification Status</h3>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <StatusLine label="Method" value={invoice.paymentMethod ?? "—"} />
                                                <StatusLine label="Ref No." value={invoice.referenceNumber ?? "—"} />
                                            </div>
                                            <StatusLine label="Control ID" value={invoice.receiptNumber ?? "Pending"} full />
                                            
                                            {invoice.paymentProofUrl && (
                                                <a 
                                                    href={invoice.paymentProofUrl} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="group flex items-center justify-between rounded-xl border border-white/10 bg-surface-2 p-4 transition-all hover:bg-surface-3 hover:border-primary/30"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                                                            <Receipt className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-text-high">Payment Receipt</p>
                                                            <p className="text-[10px] text-text-medium">Visual proof provided</p>
                                                        </div>
                                                    </div>
                                                    <ArrowUpRight className="h-4 w-4 text-text-disabled transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                                                </a>
                                            )}

                                            {invoice.paymentDestination && (
                                                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                                                        <QrCode className="h-3.5 w-3.5" />
                                                        Destination Account
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-text-high">{invoice.paymentDestination.account_name}</p>
                                                        <p className="text-xs font-medium text-text-medium tracking-wide">PH {invoice.paymentDestination.account_number}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-medium">Administrative Actions</h3>
                                        <div className="space-y-4">
                                            <textarea 
                                                value={reviewNote} 
                                                onChange={(event) => setReviewNote(event.target.value)} 
                                                rows={3} 
                                                className="w-full resize-none rounded-2xl border border-white/10 bg-surface-2 px-5 py-4 text-sm text-text-high placeholder:text-text-disabled focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all" 
                                                placeholder="Enter internal notes or instructions for the tenant..." 
                                            />
                                            <div className="grid grid-cols-1 gap-3">
                                                <ActionButton 
                                                    onClick={() => runAction("confirm")} 
                                                    loading={actionLoading === "confirm"} 
                                                    variant="primary"
                                                    icon={<CheckCircle2 className="h-4 w-4" />}
                                                >
                                                    Approve & Confirm
                                                </ActionButton>
                                                
                                                <div className="grid grid-cols-2 gap-3">
                                                    <ActionButton 
                                                        onClick={() => runAction("reject")} 
                                                        loading={actionLoading === "reject"} 
                                                        variant="danger"
                                                        icon={<XCircle className="h-4 w-4" />}
                                                    >
                                                        Decline
                                                    </ActionButton>
                                                    <ActionButton 
                                                        onClick={() => runAction("remind")} 
                                                        loading={actionLoading === "remind"} 
                                                        variant="ghost"
                                                        icon={<Send className="h-4 w-4" />}
                                                    >
                                                        Remind
                                                    </ActionButton>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4 pt-4 border-t border-white/5">
                                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-medium">Activity Logs</h3>
                                        <div className="space-y-3">
                                            {invoice.receipts.length === 0 && (
                                                <p className="text-xs italic text-text-disabled">No transactions recorded yet.</p>
                                            )}
                                            {invoice.receipts.map((receipt) => (
                                                <div key={receipt.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-surface-2/50 px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                        <div>
                                                            <p className="text-[11px] font-bold text-text-high">{receipt.receipt_number}</p>
                                                            <p className="text-[9px] uppercase tracking-tighter text-text-disabled">{formatDateLong(receipt.issued_at)}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-black text-text-high">{formatPhpCurrency(receipt.amount)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return typeof window === "undefined" ? null : createPortal(content, document.body);
}

function Metric({ label, value, accent, warning }: { label: string; value: string; accent?: boolean; warning?: boolean }) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl border p-5 transition-all",
            accent ? "border-primary/20 bg-primary/5" : "border-white/5 bg-surface-1",
            warning && !accent && "border-amber-500/20 bg-amber-500/5"
        )}>
            {accent && <div className="absolute -top-1 -right-1 h-12 w-12 bg-primary/10 blur-xl rounded-full" />}
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-medium">{label}</p>
            <p className={cn(
                "mt-2 text-2xl font-black tracking-tight",
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
        <div className={cn("space-y-1 rounded-xl p-3 border border-white/5", highlight ? "bg-surface-2" : "bg-transparent")}>
            <p className="text-[9px] font-black uppercase tracking-widest text-text-disabled">{label}</p>
            <p className="text-sm font-bold text-text-high leading-none">{value}</p>
        </div>
    );
}

function StatusLine({ label, value, full }: { label: string; value: string; full?: boolean }) {
    return (
        <div className={cn("flex flex-col gap-1 rounded-xl border border-white/10 bg-surface-1 p-3", full ? "col-span-2" : "")}>
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-text-disabled">{label}</span>
            <span className="text-xs font-bold text-text-high truncate">{value}</span>
        </div>
    );
}

function ActionButton({
    children,
    icon,
    loading,
    onClick,
    variant = "ghost",
}: {
    children: ReactNode;
    icon: ReactNode;
    loading: boolean;
    onClick: () => void;
    variant?: "primary" | "danger" | "ghost";
}) {
    const variants = {
        primary: "bg-primary text-primary-foreground hover:bg-primary-dark shadow-[0_8px_20px_-8px_rgba(109,152,56,0.5)]",
        danger: "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20",
        ghost: "bg-transparent border border-white/10 text-text-medium hover:bg-surface-2 hover:text-text-high",
    };

    return (
        <button 
            onClick={onClick} 
            disabled={loading} 
            className={cn(
                "group flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black tracking-tight transition-all active:scale-[0.98] disabled:opacity-40", 
                variants[variant]
            )}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <span className="transition-transform group-hover:scale-110">{icon}</span>
            )}
            {children}
        </button>
    );
}

