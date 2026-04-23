"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, History, Loader2, QrCode, Receipt, Waves } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { InvoiceListItem } from "@/lib/billing/server";
import { formatPhpCurrency } from "@/lib/billing/utils";
import { cn } from "@/lib/utils";

type PaymentsPayload = {
    nextPayment: (InvoiceListItem & { paymentItems?: Array<{ id: string; label: string; amount: number; category: string }> }) | null;
    history: InvoiceListItem[];
};

const PREVIEW_INVOICE_ID = "preview-face-to-face-invoice";

function buildFaceToFacePreviewPayload(source: PaymentsPayload | null): PaymentsPayload {
    if (source?.nextPayment) {
        return {
            nextPayment: {
                ...source.nextPayment,
                status: "pending",
                paymentItems: source.nextPayment.paymentItems?.length
                    ? source.nextPayment.paymentItems
                    : [
                        { id: "mock-rent", label: "Monthly rent", amount: 12500, category: "rent" },
                        { id: "mock-water", label: "Water service", amount: 650, category: "water" },
                        { id: "mock-electric", label: "Electricity service", amount: 920, category: "electricity" },
                    ],
            },
            history: source.history,
        };
    }

    return {
        nextPayment: {
            id: PREVIEW_INVOICE_ID,
            invoiceNumber: "INV-PREVIEW-0426",
            tenant: "Tenant Preview",
            property: "Maple Heights Residences",
            unit: "Unit 4B",
            amount: 14070,
            subtotal: 14070,
            balanceRemaining: 14070,
            dueDate: "2026-05-05",
            issuedDate: "2026-04-23",
            status: "pending",
            type: "Rent + Utilities",
            proofStatus: "none",
            paymentMethod: null,
            itemCount: 3,
            hasReceipt: false,
            paymentItems: [
                { id: "mock-rent", label: "Monthly rent", amount: 12500, category: "rent" },
                { id: "mock-water", label: "Water service", amount: 650, category: "water" },
                { id: "mock-electric", label: "Electricity service", amount: 920, category: "electricity" },
            ],
        },
        history: [
            {
                id: "preview-history-1",
                invoiceNumber: "INV-0326-001",
                tenant: "Tenant Preview",
                property: "Maple Heights Residences",
                unit: "Unit 4B",
                amount: 13890,
                subtotal: 13890,
                balanceRemaining: 0,
                dueDate: "2026-04-05",
                issuedDate: "2026-03-28",
                status: "paid",
                type: "Rent + Utilities",
                proofStatus: "confirmed",
                paymentMethod: "gcash",
                itemCount: 3,
                hasReceipt: true,
            },
        ],
    };
}

export default function PaymentsPage() {
    const searchParams = useSearchParams();
    const [payload, setPayload] = useState<PaymentsPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const isFaceToFacePreview = searchParams.get("preview") === "face_to_face";

    useEffect(() => {
        let alive = true;
        const load = async () => {
            try {
                const response = await fetch("/api/tenant/payments", { cache: "no-store" });
                if (!response.ok) throw new Error();
                const next = (await response.json()) as PaymentsPayload;
                if (alive) setPayload(next);
            } finally {
                if (alive) setLoading(false);
            }
        };
        void load();
        return () => {
            alive = false;
        };
    }, []);

    const effectivePayload = useMemo(
        () => (isFaceToFacePreview ? buildFaceToFacePreviewPayload(payload) : payload),
        [isFaceToFacePreview, payload],
    );

    if (loading) {
        return <div className="flex min-h-[50vh] items-center justify-center text-foreground"><Loader2 className="mr-3 h-5 w-5 animate-spin" />Loading your payment dashboard...</div>;
    }

    const nextPayment = effectivePayload?.nextPayment ?? null;
    const history = effectivePayload?.history ?? [];
    const checkoutHref = nextPayment
        ? `/tenant/payments/${nextPayment.id}/checkout${isFaceToFacePreview ? "?preview=face_to_face" : ""}`
        : "";

    return (
        <div className="space-y-8">
            <section className="relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-gradient-to-br from-card/80 via-card/50 to-muted/30 p-10 shadow-xl backdrop-blur-3xl">
                <div className="absolute -left-[20%] -top-[20%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
                <div className="absolute -right-[10%] -bottom-[20%] h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
                <div className="relative z-10 max-w-2xl">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/80 py-1.5 px-4 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground shadow-sm backdrop-blur-md">
                        <Receipt className="h-3.5 w-3.5 text-primary" />
                        Tenant Billing
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl leading-tight">Clear invoices, readable utilities, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">cleaner checkout</span></h1>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground max-w-xl">Review the full monthly bill, see how meter readings affect the total, and submit payment with the right landlord destination every time.</p>
                    {!isFaceToFacePreview && (
                        <Link href="/tenant/payments?preview=face_to_face" className="mt-5 inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/15">
                            Preview Face-to-Face Flow
                        </Link>
                    )}
                </div>
            </section>

            {isFaceToFacePreview && (
                <section className="rounded-3xl border border-primary/20 bg-primary/5 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-bold text-foreground">Preview mode is active. Checkout is preconfigured for the cash / face-to-face flow.</p>
                        <Link href="/tenant/payments" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-500 transition-colors hover:bg-muted hover:text-red-600">
                            Clear Preview
                        </Link>
                    </div>
                </section>
            )}

            <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                <section className="rounded-[2.5rem] border border-border/50 bg-card/60 p-8 shadow-xl backdrop-blur-xl flex flex-col">
                    <div className="mb-8 flex items-center gap-4">
                        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3.5 text-primary shadow-sm"><Waves className="h-6 w-6" /></div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Next invoice</p>
                            <h2 className="mt-1.5 text-3xl font-black text-foreground">{nextPayment ? nextPayment.invoiceNumber : "You're all settled"}</h2>
                        </div>
                    </div>

                    {nextPayment ? (
                        <div className="space-y-6 flex-1 flex flex-col">
                            <div className="rounded-[2rem] border border-border/50 bg-background/60 p-6 shadow-inner backdrop-blur-md">
                                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                                    <div>
                                        <p className="text-base font-black text-foreground">{nextPayment.property} <span className="mx-1 text-border">•</span> {nextPayment.unit}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm">{nextPayment.status}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">due {nextPayment.dueDate}</span>
                                        </div>
                                    </div>
                                    <div className="md:text-right">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Balance due</p>
                                        <p className="mt-1 text-4xl font-black text-primary">{formatPhpCurrency(nextPayment.balanceRemaining)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 flex-1">
                                {(nextPayment.paymentItems ?? []).map((item) => (
                                    <div key={item.id} className="group flex items-center justify-between rounded-[1.6rem] border border-border/50 bg-background/80 px-5 py-4 transition-all hover:bg-background hover:scale-[1.01] hover:border-primary/30 shadow-sm backdrop-blur-md">
                                        <div>
                                            <p className="text-sm font-black text-foreground">{item.label}</p>
                                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{item.category}</p>
                                        </div>
                                        <span className="text-base font-black text-foreground group-hover:text-primary transition-colors">{formatPhpCurrency(item.amount)}</span>
                                    </div>
                                ))}
                            </div>

                            <Link href={checkoutHref} className="group mt-auto inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-primary to-blue-600 px-6 py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
                                Continue to checkout <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 p-12 text-center shadow-inner">
                            <div className="mb-6 rounded-full bg-emerald-500/20 p-4">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                            </div>
                            <p className="text-2xl font-black text-foreground">No pending balance</p>
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-sm">Your landlord has no invoice waiting for payment right now. You are completely caught up!</p>
                        </div>
                    )}
                </section>

                <section className="rounded-[2.5rem] border border-border/50 bg-card/60 p-8 shadow-xl backdrop-blur-xl flex flex-col max-h-[85vh]">
                    <div className="mb-8 flex items-center gap-4 shrink-0">
                        <div className="rounded-2xl border border-border/50 bg-background/80 p-3.5 text-foreground shadow-sm"><History className="h-6 w-6" /></div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Ledger</p>
                            <h2 className="mt-1.5 text-3xl font-black text-foreground">Recent invoices</h2>
                        </div>
                    </div>
                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        {history.length === 0 && <div className="rounded-[2rem] border border-border/50 bg-background/50 p-12 text-center text-sm font-medium text-muted-foreground shadow-inner">No completed invoices yet.</div>}
                        {history.map((invoice) => (
                            <div key={invoice.id} className="group rounded-[1.8rem] border border-border/50 bg-background/80 p-5 shadow-sm backdrop-blur-md transition-all hover:bg-background hover:scale-[1.01] hover:border-border hover:shadow-md">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-base font-black text-foreground">{invoice.invoiceNumber}</p>
                                        <p className="mt-1 text-xs font-medium text-muted-foreground">{invoice.property} <span className="mx-1 text-border">•</span> {invoice.unit}</p>
                                    </div>
                                            <span className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm", invoice.status === "paid" || invoice.status === "receipted" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : invoice.status === "under_review" || invoice.status === "intent_submitted" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20" : invoice.status === "awaiting_in_person" ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20" : invoice.status === "rejected" ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20" : "bg-muted text-muted-foreground border border-border")}>{invoice.workflowStatus ?? invoice.status}</span>
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">due {invoice.dueDate}</span>
                                    <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{formatPhpCurrency(invoice.amount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 shrink-0 rounded-[2rem] border border-primary/20 bg-primary/5 p-5 text-sm text-foreground shadow-inner">
                        <div className="flex items-center gap-2.5 font-black"><QrCode className="h-5 w-5 text-primary" />Landlord-specific checkout</div>
                        <p className="mt-2.5 leading-relaxed text-muted-foreground text-xs font-medium">Each invoice now securely loads the active landlord GCash destination instead of a shared hardcoded QR.</p>
                    </div>
                </section>
            </div>
        </div>
    );
}
