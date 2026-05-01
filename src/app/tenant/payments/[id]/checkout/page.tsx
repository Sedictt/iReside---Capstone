"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, QrCode, ShieldCheck, Upload, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { formatDateLong, formatPhpCurrency } from "@/lib/billing/utils";
import { cn } from "@/lib/utils";

type InvoiceDetail = NonNullable<Awaited<ReturnType<typeof import("@/lib/billing/server").getInvoiceDetailForActor>>>;

function buildFaceToFacePreviewInvoice(invoiceId: string): InvoiceDetail {
    const now = new Date().toISOString();

    return {
        id: invoiceId,
        invoiceNumber: "INV-PREVIEW-0426",
        status: "pending",
        workflowStatus: "pending",
        tenant: {
            id: "preview-tenant",
            email: "tenant.preview@ireside.local",
            full_name: "Tenant Preview",
            role: "tenant",
            avatar_url: null,
            avatar_bg_color: null,
            phone: "09171234567",
            bio: null,
            website: null,
            address: null,
            cover_url: null,
            socials: {},
            business_permit_url: null,
            business_permit_number: null,
            business_name: null,
            created_at: now,
            updated_at: now,
        },
        landlord: {
            id: "preview-landlord",
            email: "landlord.preview@ireside.local",
            full_name: "Landlord Preview",
            role: "landlord",
            avatar_url: null,
            avatar_bg_color: null,
            phone: "09179876543",
            bio: null,
            website: null,
            address: null,
            cover_url: null,
            socials: {},
            business_permit_url: null,
            business_permit_number: null,
            business_name: null,
            created_at: now,
            updated_at: now,
        },
        property: {
            id: "preview-property",
            landlord_id: "preview-landlord",
            name: "Maple Heights Residences",
            address: "123 Mango Ave",
            city: "Cebu City",
            description: "Preview property record",
            type: "apartment",
            lat: null,
            lng: null,
            amenities: ["WiFi", "CCTV", "Laundry"],
            house_rules: ["Quiet hours after 10PM"],
            contract_template: null,
            images: [],
            is_featured: false,
            created_at: now,
            updated_at: now,
        },
        unit: {
            id: "preview-unit",
            property_id: "preview-property",
            name: "Unit 4B",
            floor: 4,
            status: "occupied",
            rent_amount: 12500,
            sqft: 28,
            beds: 1,
            baths: 1,
            created_at: now,
            updated_at: now,
        },
        dueDate: "2026-05-05",
        issuedDate: "2026-04-23",
        billingCycle: "2026-04-01",
        invoicePeriodStart: "2026-04-01",
        invoicePeriodEnd: "2026-04-30",
        subtotal: 14070,
        totalAmount: 14070,
        paidAmount: 0,
        balanceRemaining: 14070,
        lateFeeAmount: 250,
        allowPartialPayments: true,
        description: "Preview monthly invoice",
        paymentMethod: null,
        referenceNumber: null,
        paymentSubmittedAt: null,
        paymentProofUrl: null,
        paymentNote: null,
        receiptNumber: null,
        amountTag: null,
        reviewAction: null,
        rejectionReason: null,
        intentMethod: null,
        inPersonIntentExpiresAt: null,
        landlordConfirmed: false,
        lineItems: [
            {
                id: "preview-item-rent",
                payment_id: invoiceId,
                label: "Monthly rent",
                amount: 12500,
                category: "rent",
                sort_order: 0,
                utility_type: null,
                billing_mode: null,
                reading_id: null,
                metadata: {},
                created_at: now,
            },
            {
                id: "preview-item-water",
                payment_id: invoiceId,
                label: "Water service",
                amount: 650,
                category: "water",
                sort_order: 10,
                utility_type: "water",
                billing_mode: "tenant_paid",
                reading_id: "preview-reading-water",
                metadata: { usage: 13, rate: 50 },
                created_at: now,
            },
            {
                id: "preview-item-electric",
                payment_id: invoiceId,
                label: "Electricity service",
                amount: 920,
                category: "electricity",
                sort_order: 20,
                utility_type: "electricity",
                billing_mode: "tenant_paid",
                reading_id: "preview-reading-electric",
                metadata: { usage: 46, rate: 20 },
                created_at: now,
            },
        ],
        readings: [
            {
                id: "preview-reading-water",
                utility_type: "water",
                billing_mode: "tenant_paid",
                billing_period_start: "2026-04-01",
                billing_period_end: "2026-04-30",
                previous_reading: 118,
                current_reading: 131,
                usage: 13,
                billed_rate: 50,
                computed_charge: 650,
                note: "Preview utility reading",
                proof_image_url: null,
                entered_at: now,
            },
            {
                id: "preview-reading-electric",
                utility_type: "electricity",
                billing_mode: "tenant_paid",
                billing_period_start: "2026-04-01",
                billing_period_end: "2026-04-30",
                previous_reading: 2452,
                current_reading: 2498,
                usage: 46,
                billed_rate: 20,
                computed_charge: 920,
                note: "Preview utility reading",
                proof_image_url: null,
                entered_at: now,
            },
        ],
        receipts: [],
        paymentDestination: {
            id: "preview-destination",
            landlord_id: "preview-landlord",
            provider: "gcash",
            account_name: "Landlord Preview",
            account_number: "09179876543",
            qr_image_path: null,
            qr_image_url: null,
            is_enabled: true,
            created_at: now,
            updated_at: now,
        },
        leaseTermsSummary: {
            dueDay: 5,
            lateFeeAmount: 250,
            allowPartialPayments: true,
            utilitiesDescription: "Water and electricity billed by usage.",
        },
    };
}

export default function CheckoutPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [method, setMethod] = useState<"gcash" | "cash">("gcash");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [note, setNote] = useState("");
    const [receipt, setReceipt] = useState<File | null>(null);
    const [partialAmount, setPartialAmount] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [inPersonTriggered, setInPersonTriggered] = useState(false);
    const isFaceToFacePreview = searchParams.get("preview") === "face_to_face";

    useEffect(() => {
        let alive = true;
        const load = async () => {
            if (isFaceToFacePreview) {
                if (alive) {
                    setInvoice(buildFaceToFacePreviewInvoice(params.id));
                    setLoading(false);
                }
                return;
            }

            try {
                const response = await fetch(`/api/tenant/payments/${params.id}`, { cache: "no-store" });
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
        };
    }, [isFaceToFacePreview, params.id]);

    useEffect(() => {
        if (isFaceToFacePreview) {
            setMethod("cash");
        }
    }, [isFaceToFacePreview]);

    const amountDue = useMemo(() => {
        if (!invoice) return 0;
        return invoice.balanceRemaining;
    }, [invoice]);

    const submitPayment = async () => {
        if (!invoice) return;
        if (method !== "gcash") return;
        setSubmitting(true);
        try {
            if (isFaceToFacePreview) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                setSubmitted(true);
                return;
            }

            const formData = new FormData();
            formData.append("method", method);
            formData.append("referenceNumber", referenceNumber);
            formData.append("note", note);
            if (partialAmount) formData.append("partialAmount", partialAmount);
            if (receipt) formData.append("receipt", receipt);

            const response = await fetch(`/api/tenant/payments/${invoice.id}/submit`, {
                method: "POST",
                body: formData,
            });
            if (!response.ok) throw new Error();
            setSubmitted(true);
        } finally {
            setSubmitting(false);
        }
    };

    const triggerInPersonIntent = async () => {
        if (!invoice) return;
        setSubmitting(true);
        try {
            if (isFaceToFacePreview) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                setInPersonTriggered(true);
                return;
            }

            const response = await fetch(`/api/tenant/payments/${invoice.id}/intent`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ note }),
            });
            if (!response.ok) throw new Error();
            const payload = await response.json();
            setInvoice((current) =>
                current
                    ? {
                          ...current,
                          workflowStatus: "awaiting_in_person",
                          inPersonIntentExpiresAt: payload.expiresAt ?? current.inPersonIntentExpiresAt,
                      }
                    : current,
            );
            setInPersonTriggered(true);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex min-h-[60vh] items-center justify-center text-foreground"><Loader2 className="mr-3 h-5 w-5 animate-spin" />Loading invoice checkout...</div>;
    }

    if (!invoice) {
        return <div className="rounded-3xl border border-border bg-card p-8 text-center text-muted-foreground">Invoice unavailable.</div>;
    }

    if (submitted) {
        return (
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-emerald-500/20 bg-card p-10 text-center shadow-sm">
                <CheckCircle2 className="mx-auto mb-5 h-12 w-12 text-emerald-400" />
                <h1 className="text-3xl font-black text-foreground">Payment submitted for review</h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">Your landlord has the proof, reference details, and invoice context. We kept the billing record open until they confirm the payment.</p>
                <div className="mt-6 flex justify-center gap-3">
                    <Link href="/tenant/payments" className="rounded-2xl border border-border px-5 py-3 text-sm font-bold text-foreground transition hover:bg-muted">Back to payments</Link>
                    <Link href="/tenant/dashboard" className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90">Go to dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto grid max-w-6xl gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[2.5rem] border border-border/40 bg-card/60 p-8 shadow-xl backdrop-blur-3xl relative overflow-hidden">
                <div className="absolute -left-[10%] -top-[10%] h-[300px] w-[300px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />
                <div className="relative z-10 mb-8 flex items-center justify-between">
                    <button onClick={() => router.back()} className="group inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-5 py-2.5 text-sm font-bold text-foreground shadow-sm backdrop-blur-md transition-all hover:bg-muted hover:scale-105 active:scale-95"><ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />Back</button>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 shadow-sm"><ShieldCheck className="h-3.5 w-3.5" />Secure checkout</div>
                </div>

                {isFaceToFacePreview && (
                    <div className="relative z-10 mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Preview mode: Face-to-face payment</p>
                            <Link href={`/tenant/payments/${params.id}/checkout`} className="rounded-full border border-border bg-background px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-red-500 transition-colors hover:bg-muted hover:text-red-600">
                                Clear Preview
                            </Link>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">This preview does not write to the database. Submitting here only shows the success state so you can validate the full flow safely.</p>
                    </div>
                )}

                <div className="relative z-10 mb-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Checkout</p>
                    <h1 className="mt-2 text-4xl font-black text-foreground md:text-5xl tracking-tight">{invoice.invoiceNumber}</h1>
                    <p className="mt-4 text-sm font-medium text-muted-foreground">{invoice.property?.name} <span className="mx-1 text-border">•</span> {invoice.unit?.name} <span className="mx-1 text-border">•</span> due <span className="text-foreground">{formatDateLong(invoice.dueDate)}</span></p>
                </div>

                <div className="relative z-10 grid gap-5 md:grid-cols-2">
                    <MethodCard
                        active={method === "gcash"}
                        disabled={isFaceToFacePreview}
                        onClick={() => setMethod("gcash")}
                        icon={<QrCode className="h-6 w-6" />}
                        title="GCash"
                        body={isFaceToFacePreview ? "Disabled in face-to-face preview mode." : "Use the landlord's saved wallet destination and upload proof."}
                    />
                    <MethodCard active={method === "cash"} onClick={() => setMethod("cash")} icon={<Wallet className="h-6 w-6" />} title="Cash / in person" body="Record your intent and let the landlord confirm receipt." />
                </div>

                {method === "gcash" ? (
                    <div className="relative z-10 mt-8 grid gap-6 lg:grid-cols-[1fr_260px]">
                        <div className="space-y-5">
                            <Field label="Reference number"><input value={referenceNumber} onChange={(event) => setReferenceNumber(event.target.value)} className="w-full rounded-2xl border border-border/50 bg-background/80 px-5 py-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10 hover:bg-background" placeholder="GCash reference" /></Field>
                            {invoice.allowPartialPayments && <Field label="Partial amount (optional)"><input value={partialAmount} onChange={(event) => setPartialAmount(event.target.value)} className="w-full rounded-2xl border border-border/50 bg-background/80 px-5 py-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10 hover:bg-background" placeholder={amountDue.toString()} /></Field>}
                            <Field label="Payment proof">
                                <label className="flex cursor-pointer overflow-hidden items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-background/50 px-5 py-5 text-sm font-bold text-foreground transition-all hover:bg-background/80 hover:border-primary/40 hover:shadow-sm">
                                    <Upload className={cn("h-5 w-5", receipt ? "text-primary" : "text-muted-foreground")} />
                                    <span className="truncate max-w-[200px]">{receipt ? receipt.name : "Upload screenshot"}</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} />
                                </label>
                            </Field>
                        </div>
                        <div className="rounded-[2rem] border border-border/40 bg-background/50 p-5 text-center shadow-inner">
                            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Destination QR</p>
                            <div className="rounded-[1.6rem] border border-border/50 bg-card p-4 shadow-md transition-transform hover:scale-[1.02]">
                                <div className="mb-4 aspect-square overflow-hidden rounded-2xl border border-border/50 bg-white p-2">
                                    {invoice.paymentDestination?.qr_image_url ? <Image src={invoice.paymentDestination.qr_image_url} alt="Landlord GCash QR" width={320} height={320} unoptimized className="h-full w-full object-cover rounded-xl" /> : <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400"><QrCode className="h-12 w-12" /></div>}
                                </div>
                                <p className="text-sm font-black text-foreground truncate">{invoice.paymentDestination?.account_name ?? invoice.landlord?.full_name ?? "Landlord"}</p>
                                <p className="mt-1.5 text-[10px] uppercase tracking-[0.25em] text-primary">{invoice.paymentDestination?.account_number ?? invoice.landlord?.phone ?? "No number"}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative z-10 mt-8 rounded-[2rem] border border-primary/20 bg-primary/5 p-6 shadow-inner">
                        <div className="flex items-center gap-3 text-sm font-black text-foreground"><CreditCard className="h-5 w-5 text-primary" />Cash payment instructions</div>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-medium">Bring the exact amount to your landlord or building manager, then trigger the in-person intent so the landlord can confirm receipt.</p>
                        {invoice.inPersonIntentExpiresAt && (
                            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary">
                                Intent expires: {formatDateLong(invoice.inPersonIntentExpiresAt)}
                            </p>
                        )}
                        {inPersonTriggered && (
                            <p className="mt-3 text-sm font-semibold text-emerald-400">
                                In-person intent submitted. Waiting for landlord confirmation.
                            </p>
                        )}
                        <button
                            onClick={triggerInPersonIntent}
                            disabled={submitting}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                            Trigger In-Person Payment
                        </button>
                    </div>
                )}

                <label className="relative z-10 mt-8 block space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Note to landlord</span>
                    <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} className="w-full rounded-2xl border border-border/50 bg-background/80 px-5 py-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10 hover:bg-background" placeholder="Optional note for the landlord..." />
                </label>

                {method === "gcash" && (
                    <button onClick={submitPayment} disabled={submitting || !receipt || !referenceNumber.trim()} className={cn("relative z-10 group mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-full px-6 py-4 text-sm font-bold transition-all shadow-lg", submitting || !receipt || !referenceNumber.trim() ? "cursor-not-allowed border border-border/50 bg-background/50 text-muted-foreground shadow-none" : "bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:scale-[1.02] hover:shadow-primary/20 active:scale-95")}>
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5 transition-transform group-hover:scale-110" />}
                    Confirm & Submit Payment
                    </button>
                )}
            </section>

            <section className="rounded-[2.5rem] border border-border/50 bg-card/60 p-8 shadow-xl backdrop-blur-xl flex flex-col h-fit">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Invoice breakdown</p>
                <h2 className="mt-2 text-2xl font-black text-foreground lg:text-3xl">What you are paying for</h2>

                <div className="mt-8 space-y-4">
                    {invoice.lineItems.map((item) => (
                        <div key={item.id} className="group rounded-[1.6rem] border border-border/50 bg-background/80 px-5 py-4 shadow-sm backdrop-blur-md transition-all hover:bg-background hover:scale-[1.02] hover:border-border">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-black text-foreground">{item.label}</p>
                                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{item.category}</p>
                                </div>
                                <span className="text-base font-black text-foreground group-hover:text-primary transition-colors">{formatPhpCurrency(item.amount)}</span>
                            </div>
                        </div>
                    ))}
                    {invoice.readings.map((reading) => (
                        <div key={reading.id} className="group rounded-[1.6rem] border border-border/50 bg-background/80 px-5 py-4 shadow-sm backdrop-blur-md transition-all hover:bg-background hover:scale-[1.02] hover:border-border">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-black capitalize text-foreground">{reading.utility_type} reading</p>
                                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{reading.previous_reading} to {reading.current_reading} <span className="mx-1">•</span> usage <span className="text-foreground">{reading.usage}</span></p>
                                </div>
                                <span className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm", reading.billing_mode === "included_in_rent" ? "bg-muted text-muted-foreground border border-border/50" : "bg-primary/10 text-primary border border-primary/20")}>{reading.billing_mode === "included_in_rent" ? "bundled" : formatPhpCurrency(reading.computed_charge)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 rounded-[2rem] border border-border/50 bg-background/60 p-6 shadow-inner backdrop-blur-md">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Total due</p>
                            <p className="mt-1 text-4xl font-black text-foreground tracking-tight">{formatPhpCurrency(amountDue)}</p>
                        </div>
                        <div className="sm:text-right">
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Partial payments</p>
                            <p className="mt-1 text-sm font-black text-foreground">{invoice.allowPartialPayments ? "Allowed" : "Not enabled"}</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return <label className="block space-y-2.5"><span className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">{label}</span>{children}</label>;
}

function MethodCard({
    active,
    body,
    disabled = false,
    icon,
    onClick,
    title,
}: {
    active: boolean;
    body: string;
    disabled?: boolean;
    icon: ReactNode;
    onClick: () => void;
    title: string;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "relative overflow-hidden rounded-[2rem] border p-6 text-left transition-all",
                disabled ? "cursor-not-allowed opacity-55" : "hover:scale-[1.02]",
                active ? "border-primary/40 bg-primary/5 shadow-md" : "border-border/50 bg-background/60 hover:bg-background hover:border-border/80",
            )}
        >
            {active && <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />}
            <div className={cn("relative z-10 mb-5 inline-flex rounded-2xl border p-3.5 transition-colors", active ? "border-primary/30 bg-primary/10 text-primary shadow-sm" : "border-border/50 bg-card text-muted-foreground")}>{icon}</div>
            <p className="relative z-10 text-xl font-black text-foreground">{title}</p>
            <p className="relative z-10 mt-2 text-sm leading-relaxed text-muted-foreground font-medium">{body}</p>
        </button>
    );
}
