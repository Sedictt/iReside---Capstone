"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Clock3, Loader2, QrCode, Receipt, Send, X, XCircle } from "lucide-react";
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

    const statusTone = invoice?.status === "paid"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
        : invoice?.status === "overdue"
            ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
            : invoice?.status === "processing"
                ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
                : "border-white/10 bg-white/5 text-slate-200";

    const content = (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0e1a2c] shadow-[0_32px_90px_-44px_rgba(15,23,42,0.95)]">
                <div className="flex items-start justify-between border-b border-white/10 bg-[#132238] px-6 py-5">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Invoice detail</p>
                        <h2 className="mt-2 text-2xl font-black text-white">{invoice?.invoiceNumber ?? "Loading invoice"}</h2>
                        {invoice && <p className="mt-2 text-sm text-slate-400">{invoice.tenant?.full_name} • {invoice.property?.name} • {invoice.unit?.name}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                        {invoice && <span className={cn("rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]", statusTone)}>{invoice.status}</span>}
                        <button onClick={onClose} className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
                    </div>
                </div>

                <div className="grid flex-1 gap-0 overflow-y-auto lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-6 p-6">
                        {loading || !invoice ? (
                            <div className="flex min-h-[320px] items-center justify-center text-slate-300"><Loader2 className="mr-3 h-5 w-5 animate-spin" />Loading invoice details...</div>
                        ) : (
                            <>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Metric label="Total due" value={formatPhpCurrency(invoice.totalAmount)} />
                                    <Metric label="Balance" value={formatPhpCurrency(invoice.balanceRemaining)} />
                                    <Metric label="Submitted" value={invoice.paymentSubmittedAt ? formatDateLong(invoice.paymentSubmittedAt) : "Not yet"} />
                                </div>

                                <Panel title="Line items">
                                    <div className="space-y-3">
                                        {invoice.lineItems.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{item.label}</p>
                                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.category}</p>
                                                </div>
                                                <span className="text-sm font-bold text-white">{formatPhpCurrency(item.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Panel>

                                <Panel title="Utility readings">
                                    <div className="space-y-3">
                                        {invoice.readings.length === 0 && <p className="text-sm text-slate-400">No readings attached to this invoice yet.</p>}
                                        {invoice.readings.map((reading) => (
                                            <div key={reading.id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div>
                                                        <p className="text-sm font-semibold capitalize text-white">{reading.utility_type}</p>
                                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{formatDateLong(reading.billing_period_start)} to {formatDateLong(reading.billing_period_end)}</p>
                                                    </div>
                                                    <span className={cn("rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]", reading.billing_mode === "included_in_rent" ? "bg-slate-500/15 text-slate-200" : "bg-blue-500/15 text-blue-200")}>{reading.billing_mode === "included_in_rent" ? "Bundled" : "Tenant paid"}</span>
                                                </div>
                                                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                                                    <TinyMetric label="Previous" value={reading.previous_reading.toString()} />
                                                    <TinyMetric label="Current" value={reading.current_reading.toString()} />
                                                    <TinyMetric label="Usage" value={reading.usage.toString()} />
                                                    <TinyMetric label="Charge" value={formatPhpCurrency(reading.computed_charge)} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Panel>
                            </>
                        )}
                    </div>

                    <div className="space-y-5 border-l border-white/10 bg-[#132238]/85 p-6">
                        {invoice && (
                            <>
                                <Panel title="Tenant submission">
                                    <div className="space-y-3 text-sm text-slate-300">
                                        <InfoRow label="Method" value={invoice.paymentMethod ?? "Not selected"} />
                                        <InfoRow label="Reference" value={invoice.referenceNumber ?? "None"} />
                                        <InfoRow label="Receipt no." value={invoice.receiptNumber ?? "Pending"} />
                                        <InfoRow label="Proof" value={invoice.paymentProofUrl ? "Uploaded" : "Not uploaded"} />
                                        {invoice.paymentDestination && (
                                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                <div className="mb-3 flex items-center gap-2 text-white"><QrCode className="h-4 w-4 text-blue-300" />GCash destination</div>
                                                <p className="text-sm font-semibold text-white">{invoice.paymentDestination.account_name}</p>
                                                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{invoice.paymentDestination.account_number}</p>
                                            </div>
                                        )}
                                    </div>
                                </Panel>

                                <Panel title="Landlord actions">
                                    <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={4} className="w-full rounded-2xl border border-white/10 bg-[#0b1626] px-4 py-3 text-sm text-white outline-none" placeholder="Add review note or correction request." />
                                    <div className="mt-4 grid gap-3">
                                        <ActionButton onClick={() => runAction("confirm")} loading={actionLoading === "confirm"} icon={<CheckCircle2 className="h-4 w-4" />} className="bg-emerald-500 text-white hover:bg-emerald-400">Confirm payment</ActionButton>
                                        <ActionButton onClick={() => runAction("reject")} loading={actionLoading === "reject"} icon={<XCircle className="h-4 w-4" />} className="bg-rose-500/15 text-rose-100 hover:bg-rose-500/25">Reject proof</ActionButton>
                                        <ActionButton onClick={() => runAction("remind")} loading={actionLoading === "remind"} icon={<Send className="h-4 w-4" />} className="bg-white/5 text-white hover:bg-white/10">Send reminder</ActionButton>
                                    </div>
                                </Panel>

                                <Panel title="Receipt history">
                                    <div className="space-y-3">
                                        {invoice.receipts.length === 0 && <p className="text-sm text-slate-400">No receipts issued yet.</p>}
                                        {invoice.receipts.map((receipt) => (
                                            <div key={receipt.id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-2 text-white"><Receipt className="h-4 w-4 text-emerald-300" />{receipt.receipt_number}</div>
                                                    <span className="text-sm font-bold text-white">{formatPhpCurrency(receipt.amount)}</span>
                                                </div>
                                                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{formatDateLong(receipt.issued_at)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Panel>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return typeof window === "undefined" ? null : createPortal(content, document.body);
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
    return <section><h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><Clock3 className="h-4 w-4 text-slate-400" />{title}</h3><div>{children}</div></section>;
}

function Metric({ label, value }: { label: string; value: string }) {
    return <div className="rounded-2xl border border-white/8 bg-white/5 p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p><p className="mt-3 text-lg font-black text-white">{value}</p></div>;
}

function TinyMetric({ label, value }: { label: string; value: string }) {
    return <div className="rounded-2xl border border-white/8 bg-[#0b1626] px-3 py-3"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 text-sm font-semibold text-white">{value}</p></div>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3"><span className="text-slate-400">{label}</span><span className="text-right text-white">{value}</span></div>;
}

function ActionButton({
    children,
    className,
    icon,
    loading,
    onClick,
}: {
    children: ReactNode;
    className: string;
    icon: ReactNode;
    loading: boolean;
    onClick: () => void;
}) {
    return <button onClick={onClick} disabled={loading} className={cn("inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition disabled:opacity-60", className)}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}{children}</button>;
}
