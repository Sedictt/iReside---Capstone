"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, QrCode, ShieldCheck, Upload, Wallet, Receipt, TrendingUp, Info, HelpCircle, HandCoins, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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
            total_units: 24,
            total_floors: 6,
            base_rent_amount: 12500,
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
        paymentMethod: "in_person",
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
        metadata: {},
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

function buildSelectivePreviewInvoice(invoiceId: string): InvoiceDetail {
    const now = new Date().toISOString();

    return {
        id: invoiceId,
        invoiceNumber: "INV-SEL-2026",
        status: "pending",
        workflowStatus: "pending",
        tenant: {
            id: "preview-tenant",
            email: "tenant.preview@ireside.local",
            full_name: "Selective Payment Demo",
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
            full_name: "Premium Property Management",
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
            name: "Skyline Heights Apartments",
            address: "88 Orchid Blvd",
            city: "Makati City",
            description: "Standard residential complex",
            type: "apartment",
            lat: null,
            lng: null,
            amenities: ["Pool", "Gym", "Concierge"],
            house_rules: ["Standard rules apply"],
            contract_template: null,
            images: [],
            is_featured: false,
            total_units: 120,
            total_floors: 42,
            base_rent_amount: 45000,
            created_at: now,
            updated_at: now,
        },
        unit: {
            id: "preview-unit",
            property_id: "preview-property",
            name: "Unit 42A",
            floor: 42,
            status: "occupied",
            rent_amount: 45000,
            sqft: 120,
            beds: 3,
            baths: 3,
            created_at: now,
            updated_at: now,
        },
        dueDate: "2026-06-01",
        issuedDate: "2026-05-15",
        billingCycle: "2026-05-01",
        invoicePeriodStart: "2026-05-01",
        invoicePeriodEnd: "2026-05-31",
        subtotal: 52450,
        totalAmount: 52450,
        paidAmount: 0,
        balanceRemaining: 52450,
        lateFeeAmount: 500,
        allowPartialPayments: true,
        description: "Selective payment preview",
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
        metadata: {},
        lineItems: [
            {
                id: "item-rent",
                payment_id: invoiceId,
                label: "Monthly Rent",
                amount: 45000,
                category: "rent",
                sort_order: 0,
                utility_type: null,
                billing_mode: null,
                reading_id: null,
                metadata: {},
                created_at: now,
            },
            {
                id: "item-parking",
                payment_id: invoiceId,
                label: "Parking Slot B12",
                amount: 5000,
                category: "parking",
                sort_order: 5,
                utility_type: null,
                billing_mode: null,
                reading_id: null,
                metadata: {},
                created_at: now,
            }
        ],
        readings: [
            {
                id: "reading-water",
                utility_type: "water",
                billing_mode: "tenant_paid",
                billing_period_start: "2026-05-01",
                billing_period_end: "2026-05-31",
                previous_reading: 500,
                current_reading: 512,
                usage: 12,
                billed_rate: 45,
                computed_charge: 540,
                note: null,
                proof_image_url: null,
                entered_at: now,
            },
            {
                id: "reading-electric",
                utility_type: "electricity",
                billing_mode: "tenant_paid",
                billing_period_start: "2026-05-01",
                billing_period_end: "2026-05-31",
                previous_reading: 1250,
                current_reading: 1320,
                usage: 70,
                billed_rate: 21.15,
                computed_charge: 1480.5,
                note: null,
                proof_image_url: null,
                entered_at: now,
            },
        ],
        receipts: [],
        paymentDestination: {
            id: "dest-selective",
            landlord_id: "landlord-selective",
            provider: "gcash",
            account_name: "Skyline Heights Apartments",
            account_number: "09170001122",
            qr_image_path: null,
            qr_image_url: null,
            is_enabled: true,
            created_at: now,
            updated_at: now,
        },
        leaseTermsSummary: {
            dueDay: 1,
            lateFeeAmount: 500,
            allowPartialPayments: true,
            utilitiesDescription: "Standard luxury utility billing.",
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
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [selectedReadingIds, setSelectedReadingIds] = useState<string[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [inPersonTriggered, setInPersonTriggered] = useState(false);
    const isFaceToFacePreview = searchParams.get("preview") === "face_to_face";
    const isSelectivePreview = searchParams.get("preview") === "selective";

    useEffect(() => {
        let alive = true;
        const load = async () => {
            if (isFaceToFacePreview || isSelectivePreview) {
                if (alive) {
                    const previewData = isSelectivePreview 
                        ? buildSelectivePreviewInvoice(params.id)
                        : buildFaceToFacePreviewInvoice(params.id);
                    setInvoice(previewData);
                    setSelectedItemIds(previewData.lineItems.map(i => i.id));
                    setSelectedReadingIds(previewData.readings.map(r => r.id));
                    setLoading(false);
                }
                return;
            }

            try {
                const response = await fetch(`/api/tenant/payments/${params.id}`, { cache: "no-store" });
                if (!response.ok) throw new Error();
                const payload = await response.json();
                if (alive && payload.invoice) {
                    setInvoice(payload.invoice);
                    setSelectedItemIds(payload.invoice.lineItems.map((item: any) => item.id));
                    setSelectedReadingIds(payload.invoice.readings.map((r: any) => r.id));
                }
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
        if (isFaceToFacePreview && invoice) {
            setSelectedItemIds(invoice.lineItems.map(i => i.id));
            setSelectedReadingIds(invoice.readings.map(r => r.id));
        }
    }, [isFaceToFacePreview, invoice]);

    useEffect(() => {
        if (isFaceToFacePreview || isSelectivePreview) {
            setMethod(isFaceToFacePreview ? "cash" : "gcash");
        }
    }, [isFaceToFacePreview, isSelectivePreview]);

    const amountDue = useMemo(() => {
        if (!invoice) return 0;
        
        const selectedItemsTotal = invoice.lineItems
            .filter(item => selectedItemIds.includes(item.id))
            .reduce((sum, item) => sum + item.amount, 0);
            
        const selectedReadingsTotal = invoice.readings
            .filter(r => selectedReadingIds.includes(r.id))
            .reduce((sum, r) => sum + (r.billing_mode === 'included_in_rent' ? 0 : r.computed_charge), 0);
            
        const totalSelected = selectedItemsTotal + selectedReadingsTotal;
        return Math.max(0, totalSelected - invoice.paidAmount);
    }, [invoice, selectedItemIds, selectedReadingIds]);

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
            formData.append("selectedItemIds", JSON.stringify(selectedItemIds));
            formData.append("selectedReadingIds", JSON.stringify(selectedReadingIds));
            
            // If the user hasn't selected everything, it's a partial payment
            const isFullPayment = invoice.lineItems.length === selectedItemIds.length && 
                                invoice.readings.length === selectedReadingIds.length && 
                                !partialAmount;
            
            const finalAmount = partialAmount ? Number(partialAmount) : amountDue;
            if (!isFullPayment || partialAmount) formData.append("partialAmount", finalAmount.toString());
            
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
                body: JSON.stringify({ 
                    note,
                    partialAmount: amountDue < invoice.totalAmount ? amountDue : undefined,
                    selectedItemIds,
                    selectedReadingIds,
                    paymentMethod: "in_person"
                }),
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

    if (submitted || ["paid", "under_review", "awaiting_in_person", "confirmed", "receipted"].includes(invoice.status)) {
        const isSettled = ["paid", "receipted"].includes(invoice.status);
        const isProcessing = ["under_review", "awaiting_in_person", "confirmed"].includes(invoice.status);

        return (
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-emerald-500/20 bg-card p-10 text-center shadow-sm relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full" />
                <CheckCircle2 className={cn("mx-auto mb-5 h-12 w-12", isSettled ? "text-emerald-400" : "text-amber-400")} />
                <h1 className="text-3xl font-black text-foreground">
                    {isSettled ? "Invoice already paid" : "Payment submitted for review"}
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {isSettled
                        ? "This transaction has been successfully settled and confirmed by your landlord. You can view the receipt in your payment history."
                        : invoice.status === "awaiting_in_person"
                            ? "You've notified your landlord of an in-person payment. Once they confirm receipt of the cash, this invoice will be marked as paid."
                            : "Your landlord has the proof, reference details, and invoice context. We kept the billing record open until they confirm the payment."}
                </p>
                <div className="mt-6 flex justify-center gap-3">
                    <Link href="/tenant/payments" className="rounded-2xl border border-border px-5 py-3 text-sm font-bold text-foreground transition hover:bg-muted">Back to payments</Link>
                    <Link href="/tenant/dashboard" className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90">Go to dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl pb-20">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_380px] items-start">
                <div className="space-y-6">
                    {/* Compact Header */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => router.back()} 
                                className="group flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-card/50 text-foreground transition-all hover:bg-muted hover:scale-105 active:scale-95"
                            >
                                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                            </button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Checkout Hub</p>
                                    <span className="h-1 w-1 rounded-full bg-border" />
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{invoice.property?.name}</p>
                                </div>
                                <h1 className="text-2xl font-black tracking-tight text-foreground">{invoice.invoiceNumber}</h1>
                            </div>
                        </div>
                    </header>

                    {/* Step 1: Payment Method */}
                    <section className="rounded-[2rem] border border-border/40 bg-card/40 p-1 backdrop-blur-xl shadow-sm">
                        <div className="grid grid-cols-2 gap-1">
                            <button
                                onClick={() => setMethod("gcash")}
                                disabled={isFaceToFacePreview}
                                className={cn(
                                    "relative flex items-center gap-3 rounded-[1.7rem] px-6 py-4 transition-all duration-300",
                                    method === "gcash" ? "bg-background shadow-md ring-1 ring-border/50" : "text-muted-foreground hover:bg-white/5",
                                    isFaceToFacePreview && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <div className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-xl border transition-all",
                                    method === "gcash" ? "border-primary/30 bg-primary/10 text-primary" : "border-border/50 bg-muted/50"
                                )}>
                                    <QrCode className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-black tracking-tight">GCash Wallet</p>
                                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Digital Settlement</p>
                                </div>
                                {method === "gcash" && <motion.div layoutId="active-pill" className="absolute inset-0 rounded-[1.7rem] border-2 border-primary/20 pointer-events-none" />}
                            </button>

                            <button
                                onClick={() => setMethod("cash")}
                                className={cn(
                                    "relative flex items-center gap-3 rounded-[1.7rem] px-6 py-4 transition-all duration-300",
                                    method === "cash" ? "bg-background shadow-md ring-1 ring-border/50" : "text-muted-foreground hover:bg-white/5"
                                )}
                            >
                                <div className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-xl border transition-all",
                                    method === "cash" ? "border-amber-500/30 bg-amber-500/10 text-amber-500" : "border-border/50 bg-muted/50"
                                )}>
                                    <Wallet className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-black tracking-tight">Cash / In-Person</p>
                                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Face-to-Face</p>
                                </div>
                                {method === "cash" && <motion.div layoutId="active-pill" className="absolute inset-0 rounded-[1.7rem] border-2 border-primary/20 pointer-events-none" />}
                            </button>
                        </div>
                    </section>

                    {/* Step 2: Payment Details */}
                    <div className="min-h-[400px]">
                        <AnimatePresence mode="wait">
                            {method === "gcash" ? (
                                <motion.div 
                                    key="gcash"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="grid gap-6 md:grid-cols-[1fr_280px]">
                                        <div className="space-y-6 rounded-[2rem] border border-border/40 bg-card/60 p-8 shadow-xl backdrop-blur-3xl">
                                            <div className="space-y-5">
                                                <Field label="Reference number">
                                                    <input 
                                                        value={referenceNumber} 
                                                        onChange={(event) => setReferenceNumber(event.target.value)} 
                                                        className="w-full rounded-2xl border border-border/50 bg-background/50 px-5 py-4 text-sm font-black text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10" 
                                                        placeholder="13-digit GCash Ref #" 
                                                    />
                                                </Field>
                                                
                                                <Field label="Transaction Receipt">
                                                    <label className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 bg-background/30 px-5 py-8 text-center transition-all hover:bg-background/50 hover:border-primary/40 cursor-pointer">
                                                        <div className={cn(
                                                            "flex h-12 w-12 items-center justify-center rounded-full transition-all",
                                                            receipt ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "bg-muted text-muted-foreground group-hover:text-primary"
                                                        )}>
                                                            {receipt ? <CheckCircle2 className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-black text-foreground truncate max-w-[240px]">
                                                                {receipt ? receipt.name : "Upload Screenshot"}
                                                            </p>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                                JPG, PNG or PDF up to 5MB
                                                            </p>
                                                        </div>
                                                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} />
                                                    </label>
                                                </Field>
                                            </div>
                                        </div>

                                        <div className="rounded-[2rem] border border-border/40 bg-card/60 p-6 shadow-xl backdrop-blur-3xl text-center flex flex-col justify-center">
                                            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Destination QR</p>
                                            <div className="group relative mx-auto mb-6 aspect-square w-full max-w-[200px] overflow-hidden rounded-3xl border border-border/50 bg-white p-3 shadow-md transition-all hover:scale-[1.02]">
                                                {invoice.paymentDestination?.qr_image_url ? (
                                                    <Image 
                                                        src={invoice.paymentDestination.qr_image_url} 
                                                        alt="Destination QR" 
                                                        width={300} 
                                                        height={300} 
                                                        className="h-full w-full object-cover rounded-2xl"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                                                        <QrCode className="h-12 w-12 text-slate-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-foreground truncate">{invoice.paymentDestination?.account_name || "Landlord Wallet"}</p>
                                                <p className="text-[11px] font-black tracking-[0.1em] text-primary">{invoice.paymentDestination?.account_number || "---"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Optional Note moved inside for better density */}
                                    <div className="mt-6">
                                        <Field label="Optional Note">
                                            <textarea 
                                                rows={2} 
                                                value={note} 
                                                onChange={(event) => setNote(event.target.value)} 
                                                className="w-full rounded-2xl border border-border/50 bg-background/50 px-5 py-4 text-sm font-black text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10" 
                                                placeholder="Add a comment for the landlord..." 
                                            />
                                        </Field>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="cash"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full"
                                >
                                    <div className="grid gap-6 md:grid-cols-[1fr_280px] h-full">
                                        <div className="md:col-span-2 rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-8 shadow-xl backdrop-blur-3xl h-full flex flex-col justify-center">
                                            <div className="flex items-center gap-3 text-lg font-black text-foreground">
                                                <HandCoins className="h-6 w-6 text-amber-500" />
                                                In-Person Settlement
                                            </div>
                                            <p className="mt-4 text-sm leading-relaxed text-muted-foreground font-medium max-w-2xl">
                                                Coordinate with your landlord or building manager to settle this invoice via cash. Once paid, trigger the intent below so they can officially confirm the receipt.
                                            </p>
                                            
                                            {inPersonTriggered ? (
                                                <div className="mt-8 flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5 text-emerald-600 dark:text-emerald-400 self-start">
                                                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                                                    <div className="text-sm">
                                                        <p className="font-black">Intent Successfully Triggered</p>
                                                        <p className="opacity-80">Waiting for landlord to confirm your cash payment.</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-8">
                                                    <button
                                                        onClick={triggerInPersonIntent}
                                                        disabled={submitting}
                                                        className="inline-flex items-center justify-center gap-3 rounded-full bg-amber-500 px-8 py-4 text-sm font-black text-white transition-all hover:bg-amber-600 hover:scale-[1.02] active:scale-95 shadow-lg shadow-amber-500/20 disabled:opacity-60"
                                                    >
                                                        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wallet className="h-5 w-5" />}
                                                        Notify Landlord of Payment
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Optional Note moved inside for better density */}
                                    <div className="mt-6 rounded-[2rem] border border-border/40 bg-card/60 p-8 shadow-sm backdrop-blur-md">
                                        <Field label="Optional Note">
                                            <textarea 
                                                rows={2} 
                                                value={note} 
                                                onChange={(event) => setNote(event.target.value)} 
                                                className="w-full rounded-2xl border border-border/50 bg-background/50 px-5 py-4 text-sm font-black text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10" 
                                                placeholder="Add a comment for the landlord..." 
                                            />
                                        </Field>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>

                {/* Right Column: Sticky Summary & Breakdown */}
                <aside className="lg:sticky lg:top-24 space-y-6">
                    <section className="rounded-[2.5rem] border border-border/50 bg-card/80 p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-border/50">
                        <div className="flex items-center gap-3 mb-6">
                            <Receipt className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-black text-foreground tracking-tight">Invoice Summary</h2>
                        </div>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {invoice.lineItems.map((item) => {
                                const metadata = (invoice.metadata as any) || {};
                                const paidIds = metadata.paid_item_ids || [];
                                const pendingIds = metadata.pending_item_ids || [];
                                const isAlreadyPaid = paidIds.includes(item.id);
                                const isUnderReview = pendingIds.includes(item.id);
                                
                                if (isAlreadyPaid || isUnderReview) {
                                    return (
                                        <div key={item.id} className="flex items-center gap-3 py-1 opacity-40 grayscale-[0.8]">
                                            <div className={cn(
                                                "w-5 h-5 rounded-md border flex items-center justify-center",
                                                isAlreadyPaid ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"
                                            )}>
                                                {isAlreadyPaid ? (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                ) : (
                                                    <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-foreground truncate">{item.label}</p>
                                                <p className={cn(
                                                    "text-[9px] font-bold uppercase tracking-widest",
                                                    isAlreadyPaid ? "text-emerald-500" : "text-amber-500"
                                                )}>
                                                    {isAlreadyPaid ? "Already Paid" : "Under Review"}
                                                </p>
                                            </div>
                                            <span className="text-xs font-black text-foreground line-through opacity-50">{formatPhpCurrency(item.amount)}</span>
                                        </div>
                                    );
                                }

                                const isSelected = selectedItemIds.includes(item.id);
                                const isMandatory = !invoice.allowPartialPayments;
                                
                                return (
                                    <div 
                                        key={item.id} 
                                        onClick={() => {
                                            if (isMandatory) return;
                                            setSelectedItemIds(prev => 
                                                isSelected ? prev.filter(id => id !== item.id) : [...prev, item.id]
                                            );
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 py-1 group transition-opacity",
                                            !isSelected && "opacity-60 grayscale-[0.5]"
                                        )}
                                    >
                                        {!isMandatory && (
                                            <div className={cn(
                                                "w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer",
                                                isSelected ? "bg-primary border-primary text-white shadow-sm shadow-primary/20" : "bg-card border-border group-hover:border-primary/50"
                                            )}>
                                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-foreground truncate">{item.label}</p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{item.category}</p>
                                        </div>
                                        <span className="text-xs font-black text-foreground whitespace-nowrap">{formatPhpCurrency(item.amount)}</span>
                                    </div>
                                );
                            })}
                            
                            {invoice.readings.map((reading) => {
                                const metadata = (invoice.metadata as any) || {};
                                const paidIds = metadata.paid_reading_ids || [];
                                const pendingIds = metadata.pending_reading_ids || [];
                                const isAlreadyPaid = paidIds.includes(reading.id);
                                const isUnderReview = pendingIds.includes(reading.id);

                                if (isAlreadyPaid || isUnderReview) {
                                    return (
                                        <div key={reading.id} className="flex items-center gap-3 py-1 opacity-40 grayscale-[0.8]">
                                            <div className={cn(
                                                "w-5 h-5 rounded-md border flex items-center justify-center",
                                                isAlreadyPaid ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"
                                            )}>
                                                {isAlreadyPaid ? (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                ) : (
                                                    <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black capitalize text-foreground truncate">{reading.utility_type} Consumption</p>
                                                <p className={cn(
                                                    "text-[9px] font-bold uppercase tracking-widest",
                                                    isAlreadyPaid ? "text-emerald-500" : "text-amber-500"
                                                )}>
                                                    {isAlreadyPaid ? "Already Paid" : "Under Review"}
                                                </p>
                                            </div>
                                            <span className="text-xs font-black text-foreground line-through opacity-50">
                                                {reading.billing_mode === "included_in_rent" ? "Bundled" : formatPhpCurrency(reading.computed_charge)}
                                            </span>
                                        </div>
                                    );
                                }

                                const isSelected = selectedReadingIds.includes(reading.id);
                                const isMandatory = !invoice.allowPartialPayments;
                                
                                return (
                                    <div 
                                        key={reading.id} 
                                        onClick={() => {
                                            if (isMandatory) return;
                                            setSelectedReadingIds(prev => 
                                                isSelected ? prev.filter(id => id !== reading.id) : [...prev, reading.id]
                                            );
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 py-1 group transition-opacity",
                                            !isSelected && "opacity-60 grayscale-[0.5]"
                                        )}
                                    >
                                        {!isMandatory && (
                                            <div className={cn(
                                                "w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer",
                                                isSelected ? "bg-primary border-primary text-white shadow-sm shadow-primary/20" : "bg-card border-border group-hover:border-primary/50"
                                            )}>
                                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black capitalize text-foreground truncate">{reading.utility_type} Consumption</p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Usage: {reading.usage} Units</p>
                                        </div>
                                        <span className={cn(
                                            "text-xs font-black whitespace-nowrap",
                                            reading.billing_mode === "included_in_rent" ? "text-primary/60" : "text-foreground"
                                        )}>
                                            {reading.billing_mode === "included_in_rent" ? "Bundled" : formatPhpCurrency(reading.computed_charge)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 space-y-6 pt-6 border-t border-dashed border-border/50">
                            <div className="flex items-end justify-between">
                                <div className="space-y-1">
                                    {invoice.paidAmount > 0 && (
                                        <div className="flex flex-col mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest line-through decoration-muted-foreground/50">
                                                    Original Total: {formatPhpCurrency(invoice.totalAmount)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                                                    Paid to Date: {formatPhpCurrency(invoice.paidAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                        {amountDue < (invoice.paidAmount > 0 ? invoice.balanceRemaining : invoice.totalAmount) ? "Selection Total" : (invoice.paidAmount > 0 ? "Remaining Balance" : "Total Amount Due")}
                                    </p>
                                    <p className={cn(
                                        "text-3xl font-black tracking-tighter",
                                        amountDue < invoice.totalAmount ? "text-amber-500" : "text-foreground"
                                    )}>
                                        {formatPhpCurrency(amountDue)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Due Date</p>
                                    <p className="text-xs font-bold text-foreground">{formatDateLong(invoice.dueDate)}</p>
                                </div>
                            </div>
                            
                            {amountDue === 0 && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                                    <Info className="w-3.5 h-3.5" /> Select at least one item to pay
                                </div>
                            )}

                            {method === "gcash" && (
                                <button 
                                    onClick={submitPayment} 
                                    disabled={submitting || !receipt || !referenceNumber.trim() || amountDue === 0} 
                                    className={cn(
                                        "group flex w-full items-center justify-center gap-3 rounded-full py-5 text-sm font-black transition-all shadow-xl",
                                        submitting || !receipt || !referenceNumber.trim() || amountDue === 0
                                            ? "cursor-not-allowed border border-border/50 bg-background/50 text-muted-foreground shadow-none" 
                                            : "bg-gradient-to-r from-primary to-blue-600 text-white hover:scale-[1.02] hover:shadow-primary/25 active:scale-95"
                                    )}
                                >
                                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5 transition-transform group-hover:scale-110" />}
                                    Confirm & Settle Now
                                </button>
                            )}

                            <p className="text-[9px] text-center text-muted-foreground font-medium uppercase tracking-widest leading-relaxed">
                                Secure processing provided by iReside. <br/>All payments are subject to landlord review.
                            </p>
                        </div>
                    </section>

                    {/* Support Link */}
                    <div className="rounded-[2rem] border border-border/40 bg-card/40 p-6 text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Having Trouble?</p>
                        <Link href="/tenant/messages" className="text-xs font-black text-primary hover:underline flex items-center justify-center gap-1.5">
                            <HelpCircle className="h-3.5 w-3.5" />
                            Contact Property Manager
                        </Link>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return <label className="block space-y-2.5"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</span>{children}</label>;
}
