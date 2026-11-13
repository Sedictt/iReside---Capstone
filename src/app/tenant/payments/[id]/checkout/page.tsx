"use client";

import { useEffect, useMemo, useState, Suspense, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, QrCode, ShieldCheck, Upload, Wallet, Receipt, TrendingUp, Info, HelpCircle, HandCoins, ChevronRight, AlertCircle, Landmark } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { m as motion, AnimatePresence } from "framer-motion";

import { formatDateLong, formatPhpCurrency } from "@/lib/billing/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { OfflineStorage, OfflineBlobStorage } from "@/lib/offline/offlineStorage";
import { mutationQueue } from "@/lib/offline/mutationQueue";
import { handleMediaSelection, MEDIA_ACCEPT_STRINGS } from "@/lib/validation";
import { useFormValidation } from "@/hooks/useFormValidation";
import { FieldError, fieldErrorClass } from "@/components/ui/field-error";
import { textRule } from "@/lib/validation/rules";
import { BILLING_LIMITS, BANK_REFERENCE_REQUIRED_MESSAGE, PROOF_LIMITS, REFERENCE_REQUIRED_MESSAGE } from "@/lib/validation/schemas/billing.schema";
import { isProofMethod, paymentMethodLabel, type CheckoutMethod } from "@/lib/billing/payment-methods";
import { BankTransferDetails, CopyValueButton, GcashLimitNotice } from "@/components/shared/payment-methods/PaymentMethodBits";
import { useLanguageContext } from "@/context/LanguageContext";
import { tr } from "@/hooks/useLanguage";

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
            business_permits: [],
            two_factor_enabled: false,
            two_factor_email: null,
            gmail_access_token: null,
            gmail_refresh_token: null,
            created_at: now,
            updated_at: now,
        } as any,
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
            business_permits: [],
            two_factor_enabled: false,
            two_factor_email: null,
            gmail_access_token: null,
            gmail_refresh_token: null,
            created_at: now,
            updated_at: now,
        } as any,
        property: {
            id: "preview-property",
            landlord_id: "preview-landlord",
            name: "Maple Heights Residences",
            address: "123 Mango Ave",
            city: "Cebu City",
            description: "Preview property record",
            type: "apartment",

            amenities: ["WiFi", "CCTV", "Laundry"],
            house_rules: ["Quiet hours after 10PM"],
            contract_template: null,
            images: [],
            is_featured: false,
            total_units: 24,
            total_floors: 6,
            base_rent_amount: 12500,
            renewal_window_days: 90,
            renewal_settings: {},
            advance_rent_months: 1,
            map_decorations: null,
            security_deposit_months: 1,
            created_at: now,
            updated_at: now,
        } as any,
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
        } as any,
        paymentDestinations: {
            gcash: {
                id: "preview-destination",
                landlord_id: "preview-landlord",
                provider: "gcash",
                bank_name: null,
                account_name: "Landlord Preview",
                account_number: "09179876543",
                qr_image_path: null,
                qr_image_url: null,
                is_enabled: true,
                created_at: now,
                updated_at: now,
            },
            bank_transfer: null,
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
            business_permits: [],
            two_factor_enabled: false,
            two_factor_email: null,
            gmail_access_token: null,
            gmail_refresh_token: null,
            created_at: now,
            updated_at: now,
        } as any,
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
            business_permits: [],
            two_factor_enabled: false,
            two_factor_email: null,
            gmail_access_token: null,
            gmail_refresh_token: null,
            created_at: now,
            updated_at: now,
        } as any,
        property: {
            id: "preview-property",
            landlord_id: "preview-landlord",
            name: "Skyline Heights Apartments",
            address: "88 Orchid Blvd",
            city: "Makati City",
            description: "Standard residential complex",
            type: "apartment",

            amenities: ["Pool", "Gym", "Concierge"],
            house_rules: ["Standard rules apply"],
            contract_template: null,
            images: [],
            is_featured: false,
            total_units: 120,
            total_floors: 42,
            base_rent_amount: 45000,
            renewal_window_days: 90,
            renewal_settings: {},
            advance_rent_months: 1,
            map_decorations: null,
            security_deposit_months: 1,
            created_at: now,
            updated_at: now,
        } as any,
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
        } as any,
        paymentDestinations: {
            gcash: {
                id: "dest-selective",
                landlord_id: "landlord-selective",
                provider: "gcash",
                bank_name: null,
                account_name: "Skyline Heights Apartments",
                account_number: "09170001122",
                qr_image_path: null,
                qr_image_url: null,
                is_enabled: true,
                created_at: now,
                updated_at: now,
            },
            bank_transfer: {
                id: "dest-selective-bank",
                landlord_id: "landlord-selective",
                provider: "bank_transfer",
                bank_name: "BDO Unibank",
                account_name: "Skyline Heights Apartments",
                account_number: "001234567890",
                qr_image_path: null,
                qr_image_url: null,
                is_enabled: true,
                created_at: now,
                updated_at: now,
            },
        },
        leaseTermsSummary: {
            dueDay: 1,
            lateFeeAmount: 500,
            allowPartialPayments: true,
            utilitiesDescription: "Standard luxury utility billing.",
        },
    };
}

function CheckoutPageContent() {
    const { t } = useLanguageContext();
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const paymentId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
    const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [method, setMethod] = useState<CheckoutMethod>("gcash");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [note, setNote] = useState("");
    const [receipt, setReceipt] = useState<File | null>(null);
    const [partialAmount, setPartialAmount] = useState("");
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [selectedReadingIds, setSelectedReadingIds] = useState<string[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [inPersonTriggered, setInPersonTriggered] = useState(false);
    const { back } = useRouter();
    const isFaceToFacePreview = searchParams?.get("preview") === "face_to_face";
    const isSelectivePreview = searchParams?.get("preview") === "selective";

    useEffect(() => {
        let alive = true;
        const load = async () => {
            if (isFaceToFacePreview || isSelectivePreview) {
                if (alive) {
                    const previewData = isSelectivePreview 
                        ? buildSelectivePreviewInvoice(paymentId || "preview")
                        : buildFaceToFacePreviewInvoice(paymentId || "preview");
                    setInvoice(previewData);
                    setSelectedItemIds(previewData.lineItems.map(i => i.id));
                    setSelectedReadingIds(previewData.readings.map(r => r.id));
                    setLoading(false);
                }
                return;
            }

            if (!paymentId) {
                if (alive) setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/tenant/payments/${paymentId}`, { cache: "no-store" });
                if (!response.ok) {
                    if (alive) setLoading(false);
                    return;
                }
                const payload = await response.json();
                if (alive && payload.invoice) {
                    setInvoice(payload.invoice);
                    setSelectedItemIds(payload.invoice.lineItems?.map((item: any) => item.id) || []);
                    setSelectedReadingIds(payload.invoice.readings?.map((r: any) => r.id) || []);
                }
            } catch (err) {
                console.error("[Checkout] Failed to load invoice:", err);
            } finally {
                if (alive) setLoading(false);
            }
        };
        void load();
        return () => {
            alive = false;
        };
    }, [isFaceToFacePreview, isSelectivePreview, paymentId]);

    useEffect(() => {
        if (isFaceToFacePreview && invoice) {
            setSelectedItemIds(invoice.lineItems.map(i => i.id));
            setSelectedReadingIds(invoice.readings.map(r => r.id));
        }
    }, [isFaceToFacePreview, invoice]);

    // Methods the landlord turned on. Cash is always possible; when nothing is set up yet
    // GCash stays visible, as before bank transfer existed.
    const gcashDestination = invoice?.paymentDestinations?.gcash ?? invoice?.paymentDestination ?? null;
    const bankDestination = invoice?.paymentDestinations?.bank_transfer?.is_enabled ? invoice.paymentDestinations.bank_transfer : null;
    const gcashAvailable = Boolean(gcashDestination?.is_enabled) || !bankDestination;
    const availableMethods = useMemo<CheckoutMethod[]>(
        () => [...(gcashAvailable ? (["gcash"] as const) : []), ...(bankDestination ? (["bank_transfer"] as const) : []), "cash"],
        [gcashAvailable, bankDestination],
    );

    useEffect(() => {
        if (isFaceToFacePreview || isSelectivePreview) {
            setMethod(isFaceToFacePreview ? "cash" : "gcash");
        }
    }, [isFaceToFacePreview, isSelectivePreview]);

    // Keep the selection on a method this landlord accepts (e.g. bank only → start on bank).
    useEffect(() => {
        if (!availableMethods.includes(method)) setMethod(availableMethods[0]);
    }, [availableMethods, method]);

    // A reading billed through a line item (item.reading_id) is already in that item's amount.
    const readingsInItems = useMemo(
        () => new Set((invoice?.lineItems ?? []).map((item) => item.reading_id).filter(Boolean) as string[]),
        [invoice],
    );

    const amountDue = useMemo(() => {
        if (!invoice) return 0;
        
        const selectedItemsTotal = invoice.lineItems
            .filter(item => selectedItemIds.includes(item.id))
            .reduce((sum, item) => sum + item.amount, 0);
            
        const selectedReadingsTotal = invoice.readings
            .filter(r => selectedReadingIds.includes(r.id) && !readingsInItems.has(r.id))
            .reduce((sum, r) => sum + (r.billing_mode === 'included_in_rent' ? 0 : r.computed_charge), 0);
            
        const totalSelected = selectedItemsTotal + selectedReadingsTotal;
        return Math.max(0, totalSelected - invoice.paidAmount);
    }, [invoice, selectedItemIds, selectedReadingIds, readingsInItems]);

    const paymentValues = useMemo(() => ({ referenceNumber, receipt, note }), [referenceNumber, receipt, note]);
    const paymentForm = useFormValidation(paymentValues, {
        referenceNumber: (value) => {
            if (!isProofMethod(method)) return undefined;
            if (!String(value ?? "").trim()) return t(method === "bank_transfer" ? BANK_REFERENCE_REQUIRED_MESSAGE : REFERENCE_REQUIRED_MESSAGE);
            return textRule(value, { label: "Reference number", max: BILLING_LIMITS.reference });
        },
        receipt: (value) => (isProofMethod(method) && !value ? t("A clear payment proof image is required.") : undefined),
        note: (value) => textRule(value, { label: "Note", max: BILLING_LIMITS.paymentNote }),
    });

    const stageOfflinePayment = async (finalAmount: number, isFullPayment: boolean) => {
        if (!invoice) return;

        let receiptDataUrl: string | null = null;
        if (receipt) {
            receiptDataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => resolve("");
                reader.readAsDataURL(receipt);
            });

            if (receiptDataUrl) {
                await OfflineBlobStorage.saveBlob(
                    `payment_receipt_${invoice.id}`,
                    receiptDataUrl,
                    {
                        contentType: receipt.type,
                        name: receipt.name,
                        createdAt: new Date().toISOString(),
                    }
                );
            }
        }

        const payload = {
            invoiceId: invoice.id,
            method,
            referenceNumber,
            note,
            selectedItemIds: JSON.stringify(selectedItemIds),
            selectedReadingIds: JSON.stringify(selectedReadingIds),
            partialAmount: !isFullPayment || partialAmount ? finalAmount : undefined,
            receiptBlobKey: receiptDataUrl ? `payment_receipt_${invoice.id}` : null,
            submittedAt: new Date().toISOString(),
        };

        OfflineStorage.set(`offline_payment_${invoice.id}`, payload, null, "payments");

        mutationQueue.enqueue(
            "STAGE_PAYMENT_PROOF",
            `/api/tenant/payments/${invoice.id}/submit`,
            "POST",
            payload,
            `Offline ${paymentMethodLabel(method)} payment for Invoice #${invoice.invoiceNumber}`
        );

        toast.success(t("Payment proof saved offline! It will submit to your Landlord automatically once online."));
    };

    const submitPayment = async () => {
        if (!invoice) return;
        if (!isProofMethod(method)) return;
        if (submitting) return; // double-click guard
        if (!paymentForm.validateAll()) return;
        setSubmitting(true);
        try {
            if (isFaceToFacePreview) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                setSubmitted(true);
                return;
            }

            const isFullPayment = invoice.lineItems.length === selectedItemIds.length && 
                                invoice.readings.length === selectedReadingIds.length && 
                                !partialAmount;
            const finalAmount = partialAmount ? Number(partialAmount) : amountDue;

            const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

            if (isOffline) {
                await stageOfflinePayment(finalAmount, isFullPayment);
                setSubmitted(true);
                return;
            }

            const formData = new FormData();
            formData.append("method", method);
            formData.append("referenceNumber", referenceNumber);
            formData.append("note", note);
            formData.append("selectedItemIds", JSON.stringify(selectedItemIds));
            formData.append("selectedReadingIds", JSON.stringify(selectedReadingIds));
            
            if (!isFullPayment || partialAmount) formData.append("partialAmount", finalAmount.toString());
            if (receipt) formData.append("receipt", receipt);

            let response: Response | null = null;
            try {
                response = await fetch(`/api/tenant/payments/${invoice.id}/submit`, {
                    method: "POST",
                    body: formData,
                });
            } catch (networkErr) {
                console.warn("[Checkout] Online submit failed, falling back to offline queue:", networkErr);
            }

            if (response && response.status >= 400 && response.status < 500) {
                // The server rejected the submission (validation / duplicate / ownership):
                // show why instead of queueing a request that can never succeed.
                const data = await response.json().catch(() => ({}));
                paymentForm.setServerErrors(data?.fieldErrors);
                toast.error(tr(data?.error || t("Your payment could not be submitted. Check the details and try again.")));
                return;
            }

            if (!response || !response.ok) {
                await stageOfflinePayment(finalAmount, isFullPayment);
            }
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
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                toast.error(tr(data?.error || t("Could not notify your landlord. Please try again.")));
                return;
            }
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
        return <div className="flex min-h-[60vh] items-center justify-center text-foreground"><Loader2 className="mr-3 size-5 animate-spin" />{t("Loading invoice checkout...")}</div>;
    }

    if (!invoice) {
        return (
            <div className="mx-auto max-w-xl rounded-[2.5rem] border border-border/60 neumorphic-panel p-8 sm:p-10 text-center relative overflow-hidden mt-8">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                    <AlertCircle className="size-7" />
                </div>
                <h2 className="text-xl font-black text-foreground">{t("Invoice Unavailable")}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t("This billing record could not be loaded or may have already been settled. You can check your active balance and payment history in the Finance Hub.")}
                </p>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/tenant/payments"
                        className="w-full sm:w-auto rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-wider neumorphic-primary"
                    >
                        {t("Go to Finance Hub")}
                    </Link>
                    <Link
                        href="/tenant/dashboard"
                        className="w-full sm:w-auto rounded-2xl border border-border/70 px-6 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                    >
                        {t("Back to Dashboard")}
                    </Link>
                </div>
            </div>
        );
    }

    if (submitted || ["paid", "under_review", "awaiting_in_person", "confirmed", "receipted"].includes(invoice.status)) {
        const isSettled = ["paid", "receipted"].includes(invoice.status);
        const isProcessing = ["under_review", "awaiting_in_person", "confirmed"].includes(invoice.status);

        return (
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-emerald-500/20 neumorphic-panel p-10 text-center relative overflow-hidden">
                <div className="absolute -top-24 -right-24 size-48 bg-emerald-500/10 blur-3xl rounded-full" />
                <CheckCircle2 className={cn("mx-auto mb-5 size-12", isSettled ? "text-emerald-400" : "text-amber-400")} />
                <h1 className="text-3xl font-black text-foreground">
                    {isSettled ? t("Invoice already paid") : t("Payment submitted for review")}
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {isSettled
                        ? t("This transaction has been successfully settled and confirmed by your landlord. You can view the receipt in your payment history.")
                        : invoice.status === "awaiting_in_person"
                            ? t("You've notified your landlord of an in-person payment. Once they confirm receipt of the cash, this invoice will be marked as paid.")
                            : t("Your landlord has the proof, reference details, and invoice context. We kept the billing record open until they confirm the payment.")}
                </p>
                <div className="mt-6 flex justify-center gap-3">
                    <Link href="/tenant/payments" className="rounded-2xl border border-border px-5 py-3 text-sm font-black text-foreground transition hover:bg-muted">{t("Back to payments")}</Link>
                    <Link href="/tenant/dashboard" className="rounded-2xl px-5 py-3 text-sm font-black transition hover:bg-primary/90 neumorphic-primary">{t("Go to dashboard")}</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl pb-8">
            <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_360px] items-start">
                <div className="space-y-4">
                    {/* Compact Header */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                            <button 
                                onClick={() => back()} 
                                aria-label={t("Back")} className="group flex size-11 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-card text-foreground shadow-xs transition-all hover:bg-muted hover:scale-105 active:scale-95"
                            >
                                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
                            </button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{t("Checkout Hub")}</p>
                                    <span className="size-1 rounded-full bg-border" />
                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{invoice.property?.name}</p>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">{invoice.invoiceNumber}</h1>
                            </div>
                        </div>
                    </header>

                    {/* Step 1: Payment Method */}
                    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-muted/70 p-1.5 shadow-xs">
                        <div
                            role="radiogroup"
                            aria-label={t("Payment method")}
                            className={cn("grid gap-1.5", availableMethods.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2")}
                        >
                            {availableMethods.map((option) => {
                                const meta = {
                                    gcash: { icon: QrCode, title: "GCash Wallet", caption: "Digital Settlement", tone: "border-primary/40 bg-primary/10 text-primary" },
                                    bank_transfer: { icon: Landmark, title: "Bank Transfer", caption: "InstaPay / PESONet", tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
                                    cash: { icon: Wallet, title: "Cash / In-Person", caption: "Face-to-Face", tone: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400" },
                                }[option];
                                const Icon = meta.icon;
                                const selected = method === option;
                                const locked = isFaceToFacePreview && option !== "cash";
                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        data-method={option}
                                        onClick={() => setMethod(option)}
                                        disabled={locked}
                                        className={cn(
                                            "relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 border-2",
                                            selected
                                                ? "border-primary bg-card text-foreground shadow-sm"
                                                : "border-transparent text-foreground/75 hover:bg-card/80 hover:text-foreground",
                                            locked && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex size-10 shrink-0 items-center justify-center rounded-xl border transition-all",
                                            selected ? meta.tone : "border-zinc-200 dark:border-zinc-700 bg-muted text-muted-foreground"
                                        )}>
                                            <Icon className="size-5" />
                                        </div>
                                        <div className="text-left min-w-0">
                                            <p className="text-sm font-black tracking-tight">{t(meta.title)}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t(meta.caption)}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {method === "gcash" && (
                        <GcashLimitNotice
                            amount={partialAmount ? Number(partialAmount) : amountDue}
                            onSwitchToBank={bankDestination ? () => setMethod("bank_transfer") : undefined}
                        />
                    )}

                    {/* Step 2: Payment Details */}
                    <div>
                        <AnimatePresence mode="wait">
                            {isProofMethod(method) ? (
                                <motion.div 
                                    key={method}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                >
                                    <div className="grid gap-5 md:grid-cols-[1fr_270px] items-start">
                                        <div className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card p-5 shadow-sm">
                                            <Field label="Reference number">
                                                <input maxLength={60}
                                                    {...paymentForm.fieldProps("referenceNumber")}
                                                    value={referenceNumber}
                                                    onChange={(event) => setReferenceNumber(event.target.value)}
                                                    className={cn("w-full rounded-xl border-2 border-zinc-300 dark:border-zinc-700 bg-background px-4 py-3 text-sm font-bold text-foreground outline-none transition-all placeholder:text-muted-foreground/80 focus:border-primary focus:ring-4 focus:ring-primary/15", paymentForm.errorFor("referenceNumber") && fieldErrorClass)}
                                                    placeholder={t(method === "bank_transfer" ? "Bank reference or trace no." : "13-digit GCash Ref #")}
                                                />
                                                <FieldError id={paymentForm.errorId("referenceNumber")} message={paymentForm.errorFor("referenceNumber")} />
                                            </Field>
                                            
                                            <Field label="Transaction Receipt">
                                                <label className={cn(
                                                    "group relative flex items-center gap-4 rounded-xl border-2 border-dashed px-4 py-4 transition-all cursor-pointer",
                                                    receipt
                                                        ? "border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10"
                                                        : "border-zinc-300 dark:border-zinc-700 bg-muted/40 hover:bg-muted/70 hover:border-primary"
                                                )}>
                                                    <div className={cn(
                                                        "flex size-11 shrink-0 items-center justify-center rounded-full transition-all",
                                                        receipt ? "bg-emerald-600 text-white" : "bg-card border border-zinc-200 dark:border-zinc-700 text-foreground group-hover:text-primary"
                                                    )}>
                                                        {receipt ? <CheckCircle2 className="size-5" /> : <Upload className="size-5" />}
                                                    </div>
                                                    <div className="min-w-0 text-left space-y-0.5">
                                                        <p className={cn("text-sm font-bold text-foreground", receipt && "truncate")}>
                                                            {receipt ? receipt.name : t(method === "bank_transfer" ? "Upload Screenshot or Deposit Slip" : "Upload Screenshot")}
                                                        </p>
                                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                            {t("JPG, PNG or WebP up to 8MB")}
                                                        </p>
                                                    </div>
                                                    <input
                                                        {...paymentForm.fieldProps("receipt")}
                                                        type="file"
                                                        accept={MEDIA_ACCEPT_STRINGS.image}
                                                        className="sr-only"
                                                        onChange={(event) => {
                                                            // Images only: the landlord reviews the proof as an image and the server rejects other types.
                                                            const validFile = handleMediaSelection(event, {
                                                                preset: "image",
                                                                maxSizeBytes: PROOF_LIMITS.paymentProofMaxBytes,
                                                                notify: (message, description) => toast.error(tr(message), { description }),
                                                            });
                                                            setReceipt(validFile);
                                                            paymentForm.touch("receipt");
                                                        }}
                                                    />
                                                </label>
                                                <FieldError id={paymentForm.errorId("receipt")} message={paymentForm.errorFor("receipt")} />
                                            </Field>

                                            <Field label="Optional Note">
                                                <textarea maxLength={250} 
                                                    rows={2} 
                                                    value={note} 
                                                    onChange={(event) => setNote(event.target.value)} 
                                                    className="w-full rounded-xl border-2 border-zinc-300 dark:border-zinc-700 bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/80 focus:border-primary focus:ring-4 focus:ring-primary/15" 
                                                    placeholder={t("Add a comment for the landlord...")} 
                                                />
                                            </Field>
                                        </div>

                                        {method === "bank_transfer" && bankDestination ? (
                                            <BankTransferDetails
                                                className="order-first md:order-none"
                                                amount={partialAmount ? Number(partialAmount) : amountDue}
                                                destination={{
                                                    bankName: bankDestination.bank_name,
                                                    accountName: bankDestination.account_name,
                                                    accountNumber: bankDestination.account_number,
                                                    qrImageUrl: bankDestination.qr_image_url,
                                                }}
                                            />
                                        ) : (
                                        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card p-5 text-center flex flex-col justify-center shadow-sm">
                                            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">{t("Destination QR")}</p>
                                            <div className="group relative mx-auto mb-4 aspect-square w-full max-w-[168px] overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white p-2.5 shadow-xs transition-all hover:scale-[1.02]">
                                                {gcashDestination?.qr_image_url ? (
                                                    <Image 
                                                        src={gcashDestination.qr_image_url} 
                                                        alt={t("Destination QR")} 
                                                        width={300} 
                                                        height={300} 
                                                        className="h-full w-full object-cover rounded-xl"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center rounded-xl bg-zinc-50 border border-dashed border-zinc-300">
                                                        <QrCode className="size-10 text-zinc-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-foreground truncate">{gcashDestination?.account_name || t("Landlord Wallet")}</p>
                                                <p className="font-mono text-sm font-black tracking-wider text-primary">{gcashDestination?.account_number || "---"}</p>
                                                {gcashDestination?.account_number && (
                                                    <CopyValueButton className="mx-auto mt-2" value={gcashDestination.account_number} label={t("Copy GCash number")} />
                                                )}
                                            </div>
                                        </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="cash"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="space-y-4"
                                >
                                    <div className="rounded-2xl border-2 border-amber-500/40 bg-card p-5 shadow-sm space-y-4">
                                        <div className="flex items-center gap-3 text-base font-black text-foreground">
                                            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                                <HandCoins className="size-5" />
                                            </div>
                                            {t("In-Person Settlement")}
                                        </div>
                                        <p className="text-sm leading-relaxed text-foreground/80 font-medium max-w-2xl">
                                            {t("Coordinate with your landlord or building manager to settle this invoice via cash. Once paid, trigger the intent below so they can officially confirm the receipt.")}
                                        </p>

                                        <Field label="Optional Note">
                                            <textarea maxLength={250} 
                                                rows={2} 
                                                value={note} 
                                                onChange={(event) => setNote(event.target.value)} 
                                                className="w-full rounded-xl border-2 border-zinc-300 dark:border-zinc-700 bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/80 focus:border-primary focus:ring-4 focus:ring-primary/15" 
                                                placeholder={t("Add a comment for the landlord...")} 
                                            />
                                        </Field>
                                        
                                        {inPersonTriggered ? (
                                            <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-700 dark:text-emerald-300">
                                                <CheckCircle2 className="size-5 shrink-0" />
                                                <div className="text-sm">
                                                    <p className="font-black">{t("Intent Successfully Triggered")}</p>
                                                    <p className="opacity-90">{t("Waiting for landlord to confirm your cash payment.")}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <button
                                                    onClick={triggerInPersonIntent}
                                                    disabled={submitting}
                                                    className="inline-flex items-center justify-center gap-2.5 rounded-full bg-amber-600 px-6 py-3.5 text-sm font-black text-white transition-all hover:bg-amber-700 active:scale-95 shadow-sm disabled:opacity-60"
                                                >
                                                    {submitting ? <Loader2 className="size-5 animate-spin" /> : <Wallet className="size-5" />}
                                                    {t("Notify Landlord of Payment")}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>

                {/* Right Column: Sticky Summary & Breakdown */}
                <aside className="lg:sticky lg:top-20 space-y-4">
                    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card p-5 shadow-sm">
                        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-zinc-200/80 dark:border-zinc-800">
                            <Receipt className="size-5 text-primary" />
                            <h2 className="text-base font-black text-foreground tracking-tight">{t("Invoice Summary")}</h2>
                        </div>

                        <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1.5 custom-scrollbar">
                            {invoice.lineItems.map((item) => {
                                const metadata = (invoice.metadata as any) || {};
                                const paidIds = metadata.paid_item_ids || [];
                                const pendingIds = metadata.pending_item_ids || [];
                                const isAlreadyPaid = paidIds.includes(item.id);
                                const isUnderReview = pendingIds.includes(item.id);
                                
                                if (isAlreadyPaid || isUnderReview) {
                                    return (
                                        <div key={item.id} className="flex items-center gap-3 py-1 opacity-50">
                                            <div className={cn(
                                                "size-5 rounded-md border flex items-center justify-center shrink-0",
                                                isAlreadyPaid ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/40 bg-amber-500/10"
                                            )}>
                                                {isAlreadyPaid ? (
                                                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                ) : (
                                                    <Loader2 className="size-3.5 text-amber-600 animate-spin" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-foreground truncate">{item.label}</p>
                                                <p className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider",
                                                    isAlreadyPaid ? "text-emerald-600" : "text-amber-600"
                                                )}>
                                                    {isAlreadyPaid ? t("Already Paid") : t("Under Review")}
                                                </p>
                                            </div>
                                            <span className="text-sm font-bold tabular-nums text-foreground line-through opacity-60">{formatPhpCurrency(item.amount)}</span>
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
                                            !isMandatory && "cursor-pointer",
                                            !isSelected && "opacity-60"
                                        )}
                                    >
                                        {!isMandatory && (
                                            <div className={cn(
                                                "size-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                                                isSelected ? "border-primary bg-primary text-white" : "border-zinc-300 dark:border-zinc-700 bg-background"
                                            )}>
                                                {isSelected && <CheckCircle2 className="size-3.5" />}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-foreground truncate">{item.label}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t(item.category.charAt(0).toUpperCase() + item.category.slice(1).replace(/_/g, " "))}</p>
                                        </div>
                                        <span className="text-sm font-black tabular-nums text-foreground whitespace-nowrap">{formatPhpCurrency(item.amount)}</span>
                                    </div>
                                );
                            })}
                            
                            {invoice.readings.map((reading) => {
                                // Shown (and charged) through its line item instead.
                                if (readingsInItems.has(reading.id)) return null;
                                const metadata = (invoice.metadata as any) || {};
                                const paidIds = metadata.paid_reading_ids || [];
                                const pendingIds = metadata.pending_reading_ids || [];
                                const isAlreadyPaid = paidIds.includes(reading.id);
                                const isUnderReview = pendingIds.includes(reading.id);

                                if (isAlreadyPaid || isUnderReview) {
                                    return (
                                        <div key={reading.id} className="flex items-center gap-3 py-1 opacity-50">
                                            <div className={cn(
                                                "size-5 rounded-md border flex items-center justify-center shrink-0",
                                                isAlreadyPaid ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/40 bg-amber-500/10"
                                            )}>
                                                {isAlreadyPaid ? (
                                                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                ) : (
                                                    <Loader2 className="size-3.5 text-amber-600 animate-spin" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold capitalize text-foreground truncate">{t(reading.utility_type === "electricity" ? "Electricity Consumption" : reading.utility_type === "water" ? "Water Consumption" : "{type} Consumption", { type: reading.utility_type })}</p>
                                                <p className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider",
                                                    isAlreadyPaid ? "text-emerald-600" : "text-amber-600"
                                                )}>
                                                    {isAlreadyPaid ? t("Already Paid") : t("Under Review")}
                                                </p>
                                            </div>
                                            <span className="text-sm font-bold tabular-nums text-foreground line-through opacity-60">
                                                {reading.billing_mode === "included_in_rent" ? t("Bundled") : formatPhpCurrency(reading.computed_charge)}
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
                                            !isMandatory && "cursor-pointer",
                                            !isSelected && "opacity-60"
                                        )}
                                    >
                                        {!isMandatory && (
                                            <div className={cn(
                                                "size-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                                                isSelected ? "border-primary bg-primary text-white" : "border-zinc-300 dark:border-zinc-700 bg-background"
                                            )}>
                                                {isSelected && <CheckCircle2 className="size-3.5" />}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold capitalize text-foreground truncate">{t(reading.utility_type === "electricity" ? "Electricity Consumption" : reading.utility_type === "water" ? "Water Consumption" : "{type} Consumption", { type: reading.utility_type })}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("Usage: {count} Units", { count: reading.usage })}</p>
                                        </div>
                                        <span className={cn(
                                            "text-sm font-black tabular-nums whitespace-nowrap",
                                            reading.billing_mode === "included_in_rent" ? "text-primary/80" : "text-foreground"
                                        )}>
                                            {reading.billing_mode === "included_in_rent" ? t("Bundled") : formatPhpCurrency(reading.computed_charge)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 space-y-4 pt-4 border-t border-dashed border-zinc-300 dark:border-zinc-700">
                            <div className="flex items-end justify-between gap-2">
                                <div className="space-y-0.5">
                                    {invoice.paidAmount > 0 && (
                                        <div className="flex flex-col mb-1.5">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider line-through decoration-muted-foreground/50">
                                                {t("Original Total: {amount}", { amount: formatPhpCurrency(invoice.totalAmount) })}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="size-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                                    {t("Paid to Date: {amount}", { amount: formatPhpCurrency(invoice.paidAmount) })}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                        {amountDue < (invoice.paidAmount > 0 ? invoice.balanceRemaining : invoice.totalAmount) ? t("Selection Total") : (invoice.paidAmount > 0 ? t("Remaining Balance") : t("Total Amount Due"))}
                                    </p>
                                    <p className={cn(
                                        "text-2xl sm:text-3xl font-black tracking-tight tabular-nums",
                                        amountDue < invoice.totalAmount ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                                    )}>
                                        {formatPhpCurrency(amountDue)}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("Due Date")}</p>
                                    <p className="text-xs font-black text-foreground">{formatDateLong(invoice.dueDate)}</p>
                                </div>
                            </div>
                            
                            {amountDue === 0 && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold">
                                    <Info className="size-4 shrink-0" /> {t("Select at least one item to pay")}
                                </div>
                            )}

                            {isProofMethod(method) && (
                                <button 
                                    onClick={submitPayment}
                                    disabled={submitting || amountDue === 0}
                                    className={cn(
                                        "group flex w-full items-center justify-center gap-2.5 rounded-full py-3.5 text-sm font-black transition-all shadow-md",
                                        submitting || amountDue === 0
                                            ? "cursor-not-allowed border border-zinc-200 dark:border-zinc-700 bg-muted text-muted-foreground shadow-none" 
                                            : "bg-gradient-to-r from-primary to-blue-600 text-white hover:opacity-95 active:scale-[0.99]"
                                    )}
                                >
                                    {submitting ? <Loader2 className="size-5 animate-spin" /> : <ShieldCheck className="size-5 transition-transform group-hover:scale-110" />}
                                    {t("Confirm & Settle Now")}
                                </button>
                            )}

                            <p className="text-[10px] text-center text-muted-foreground font-semibold uppercase tracking-wider leading-relaxed">
                                {t("Secure processing provided by iReside.")} {t("All payments are subject to landlord review.")}
                            </p>
                        </div>
                    </section>

                    {/* Support Link */}
                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card px-5 py-3.5 shadow-xs flex items-center justify-between gap-3">
                        <p className="text-xs font-bold text-muted-foreground">{t("Having Trouble?")}</p>
                        <Link href="/tenant/messages" className="text-xs font-black text-primary hover:underline flex items-center gap-1.5">
                            <HelpCircle className="size-4" />
                            {t("Contact Property Manager")}
                        </Link>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    const { t } = useLanguageContext();
    return <label className="block space-y-2"><span className="block text-xs font-bold uppercase tracking-wider text-foreground/85">{t(label)}</span>{children}</label>;
}

export default function CheckoutPage() {
    const { t } = useLanguageContext();
    return (
        <Suspense fallback={
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-foreground">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t("Loading invoice checkout...")}</p>
            </div>
        }>
            <CheckoutPageContent />
        </Suspense>
    );
}
