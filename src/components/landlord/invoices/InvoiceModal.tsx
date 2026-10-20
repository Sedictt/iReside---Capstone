"use client";

/**
 * One invoice, opened from the Finance Hub, the dashboard or a chat message.
 *
 * Built for older landlords who are not confident with apps, so it is one scrolling
 * page in a fixed order, with no tabs and nothing hidden behind hover:
 *   1. Who and how much, with a plain-words status: what is happening right now.
 *   2. "What to do now": at most two text buttons. Confirming money asks once, with the
 *      amount, tenant and method restated, and the buttons name the outcome.
 *   3. What the tenant sent (method, reference number, receipt photo, account paid into).
 *   4. What the bill is for, meter readings, and a plain history.
 * After an action the page stays open and says what happened and what comes next;
 * it never closes by itself.
 *
 * The tenant sees the same page without the landlord's buttons, plus "Pay now".
 */

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    Bell,
    CheckCircle2,
    HandCoins,
    Loader2,
    Trash2,
    Upload,
    X,
    ZoomIn,
    type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useLanguageContext } from "@/context/LanguageContext";
import { tr } from "@/hooks/useLanguage";
import { playSound } from "@/hooks/useSound";
import { FieldError } from "@/components/ui/field-error";
import { formatDateLong, formatPhpCurrency } from "@/lib/billing/utils";
import { INVOICE_TONE_CLASSES, describeInvoice, resolveInvoicePlainState, type InvoicePlainStatus } from "@/lib/billing/invoice-plain-status";
import { formatAccountNumber, maskAccountNumber, paymentMethodLabel } from "@/lib/billing/payment-methods";
import { handleMediaSelection, MEDIA_ACCEPT_STRINGS } from "@/lib/validation";
import { moneyRule } from "@/lib/validation/rules";
import { BILLING_LIMITS, rejectionReasonRule, roundCentavos } from "@/lib/validation/schemas/billing.schema";
import { cn } from "@/lib/utils";

function ModalButton({
    variant = "primary",
    size = "md",
    icon: Icon,
    loading = false,
    disabled = false,
    onClick,
    children,
    className,
    type = "button",
}: {
    variant?: "primary" | "secondary" | "danger";
    size?: "sm" | "md" | "lg";
    icon?: LucideIcon;
    loading?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    children?: React.ReactNode;
    className?: string;
    type?: "button" | "submit";
}) {
    const variantStyles = {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs font-bold",
        secondary: "bg-card text-foreground border border-border hover:bg-muted font-bold shadow-xs",
        danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-xs font-bold",
    };
    const sizeStyles = {
        sm: "min-h-9 px-3.5 py-1.5 text-xs rounded-xl",
        md: "min-h-11 px-4 py-2 text-sm rounded-xl",
        lg: "min-h-12 px-5 py-2.5 text-base rounded-2xl",
    };
    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={cn(
                "inline-flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                variantStyles[variant] ?? variantStyles.primary,
                sizeStyles[size] ?? sizeStyles.md,
                className
            )}
        >
            {loading ? <Loader2 className="size-4 animate-spin" /> : Icon ? <Icon className="size-4 shrink-0" /> : null}
            <span>{children}</span>
        </button>
    );
}

function ModalNotice({
    tone = "info",
    title,
    children,
    action,
}: {
    tone?: "info" | "warning" | "danger" | "success";
    title?: string;
    children?: React.ReactNode;
    action?: React.ReactNode;
    live?: boolean;
}) {
    const toneStyles = {
        info: "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
        warning: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
        danger: "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
        success: "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    };
    return (
        <div className={cn("rounded-2xl border p-4 text-sm flex items-start justify-between gap-3 shadow-xs", toneStyles[tone])}>
            <div>
                {title && <p className="font-bold text-base mb-1">{title}</p>}
                <div className="leading-relaxed text-sm opacity-90">{children}</div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

function modalInputClass(hasError = false, extra = ""): string {
    return cn(
        "w-full rounded-xl border bg-background px-4 py-2.5 text-base text-foreground transition-all outline-none",
        "focus:border-primary focus:ring-2 focus:ring-primary/20",
        hasError ? "border-rose-500 ring-rose-500/20" : "border-border hover:border-slate-400 dark:hover:border-zinc-700",
        extra
    );
}

const SettingsButton = ModalButton;
const SettingsNotice = ModalNotice;
const settingsInputClass = modalInputClass;

type InvoiceDetail = Awaited<ReturnType<typeof import("@/lib/billing/server").getInvoiceDetailForActor>>;
type Invoice = NonNullable<InvoiceDetail>;

type ReviewAction = "confirm" | "confirm_received" | "reject" | "request_completion";
type IssueType = "insufficient_amount" | "excessive_amount" | "not_received" | "invalid_proof" | "other";
type NonExactAction = "accept_partial" | "request_completion" | "reject";

interface ReviewPayload {
    action: ReviewAction;
    note?: string;
    amountTag: string;
    acceptedAmount: number;
    mismatchResolution?: NonExactAction;
    rejectionReason?: string;
    paymentDiscrepancyType?: IssueType;
    shortfallAmount?: number;
}

/** A money action waiting for the landlord's "yes". */
interface PendingAction {
    /** "review" posts the payload to /review; "refund" calls /mark-refunded instead. */
    kind: "review" | "refund";
    payload: ReviewPayload;
    title: string;
    /** Facts restated so the landlord checks them before pressing yes. */
    facts: Array<{ label: string; value: string }>;
    whatHappens: string;
    confirmLabel: string;
    tone: "primary" | "danger";
}

interface DoneState {
    title: string;
    detail: string;
}

const PROOF_MAX_BYTES = 5 * 1024 * 1024;

/** Where the tenant wants an overpayment sent back (payments.metadata.refund_preference). */
interface RefundPreference {
    method?: string | null;
    gcash_number?: string | null;
    qr_url?: string | null;
    bank_name?: string | null;
    bank_account_name?: string | null;
    bank_account_number?: string | null;
}

function invoiceMetadata(invoice: Invoice | null): Record<string, unknown> {
    const value = invoice?.metadata;
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function refundPreference(invoice: Invoice | null): RefundPreference | null {
    const value = invoiceMetadata(invoice).refund_preference;
    return value && typeof value === "object" ? (value as RefundPreference) : null;
}

function refundProofUrl(invoice: Invoice | null): string | null {
    const value = invoiceMetadata(invoice).refund_proof_url;
    return typeof value === "string" && value ? value : null;
}

function errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
}

export function InvoiceModal({
    invoiceId,
    onClose,
    onUpdated,
    role = "landlord",
    refundMessage,
}: {
    invoiceId: string | null;
    onClose: () => void;
    onUpdated: () => void;
    role?: "landlord" | "tenant";
    /** The chat message that opened this bill, when it carries the tenant's refund details. */
    refundMessage?: { hasRefundDetails?: boolean } | Record<string, unknown> | null;
}) {
    const { t } = useLanguageContext();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const [mode, setMode] = useState<"actions" | "problem">("actions");
    const [note, setNote] = useState("");
    const [processing, setProcessing] = useState<ReviewAction | "remind" | "refund" | null>(null);
    const [pending, setPending] = useState<PendingAction | null>(null);
    const [done, setDone] = useState<DoneState | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [refundProofFile, setRefundProofFile] = useState<File | null>(null);

    // Everything starts fresh each time a different invoice opens.
    useEffect(() => {
        if (!invoiceId) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMode("actions");
        setNote("");
        setPending(null);
        setDone(null);
        setActionError(null);
        setRefundProofFile(null);
        setLightboxUrl(null);
        setLoadError(null);
        setLoading(true);

        let alive = true;
        const load = async () => {
            try {
                if (invoiceId.startsWith("preview-") || invoiceId.startsWith("selective-") || invoiceId === "demo-invoice") {
                    if (alive) setInvoice(mockInvoice(invoiceId));
                    return;
                }
                const endpoint = role === "landlord" ? `/api/landlord/invoices/${invoiceId}` : `/api/tenant/payments/${invoiceId}`;
                const response = await fetch(endpoint, { cache: "no-store" });
                if (!response.ok) throw new Error(String(response.status));
                const payload = await response.json();
                if (alive) setInvoice(payload.invoice ?? null);
            } catch (error) {
                console.error("[InvoiceModal] Load error:", error);
                if (alive) {
                    setInvoice(null);
                    setLoadError(t("We could not open this bill. Check your internet connection and try again."));
                }
            } finally {
                if (alive) setLoading(false);
            }
        };
        void load();
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoiceId, role, reloadKey]);

    if (!invoiceId) return null;

    const tenantName = invoice?.tenant?.full_name?.trim() || t("The tenant");
    const refund = refundPreference(invoice);
    const refundDone = !!refundProofUrl(invoice);
    const plain: InvoicePlainStatus | null = invoice
        ? describeInvoice(
              {
                  ...invoice,
                  amount: invoice.totalAmount,
                  tenantName: invoice.tenant?.full_name,
                  hasRefundRequest: !!refund || !!(refundMessage as { hasRefundDetails?: boolean } | null | undefined)?.hasRefundDetails,
                  refundSent: refundDone,
                  hasReceipt: invoice.receipts.length > 0,
              },
              t,
              role,
          )
        : null;

    const isCash = invoice?.paymentMethod === "in_person" || invoice?.paymentMethod === "cash" || invoice?.workflowStatus === "awaiting_in_person";
    const isSettled = plain?.group === "paid";
    const canSendReminder = !!invoice && !isSettled && invoice.workflowStatus !== "confirmed" && invoice.workflowStatus !== "receipted";

    const refreshInvoice = async () => {
        if (!invoiceId) return;
        try {
            const endpoint = role === "landlord" ? `/api/landlord/invoices/${invoiceId}` : `/api/tenant/payments/${invoiceId}`;
            const response = await fetch(endpoint, { cache: "no-store" });
            if (response.ok) {
                const payload = await response.json();
                if (payload.invoice) setInvoice(payload.invoice);
            }
        } catch {
            // The success message already tells the landlord what happened.
        }
    };

    /** Sends a review to the server. Called only after the landlord said yes. */
    const submitReview = async (action: PendingAction) => {
        if (processing || !invoice) return;
        setProcessing(action.payload.action);
        setActionError(null);
        try {
            const formData = new FormData();
            formData.append("json", JSON.stringify(action.payload));
            const response = await fetch(`/api/landlord/invoices/${invoiceId}/review`, { method: "POST", body: formData });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || t("We could not record this. Please try again."));
            }
            const isMoneyIn = action.payload.action === "confirm" || action.payload.action === "confirm_received";
            if (isMoneyIn) playSound("payment");
            setPending(null);
            setMode("actions");
            setDone(
                action.payload.action === "confirm_received"
                    ? { title: t("Cash payment recorded."), detail: t("{name} got a receipt and this bill is now marked as paid. Nothing more to do.", { name: tenantName }) }
                    : action.payload.action === "confirm"
                      ? { title: t("Payment confirmed."), detail: t("{name} got a receipt and this bill is now marked as paid. Nothing more to do.", { name: tenantName }) }
                      : action.payload.action === "request_completion"
                        ? { title: t("Message sent."), detail: t("{name} was told how much is still owed. The bill stays open until the rest is paid.", { name: tenantName }) }
                        : { title: t("Payment not accepted."), detail: t("{name} was told what went wrong and asked to pay again. The bill stays open.", { name: tenantName }) },
            );
            await refreshInvoice();
            onUpdated();
        } catch (error) {
            setPending(null);
            setActionError(tr(errorMessage(error, t("We could not record this. Please try again."))));
        } finally {
            setProcessing(null);
        }
    };

    const sendReminder = async () => {
        if (processing) return;
        setProcessing("remind");
        setActionError(null);
        try {
            const response = await fetch(`/api/landlord/invoices/${invoiceId}/reminder`, { method: "POST" });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || t("We could not send the reminder. Please try again."));
            }
            setDone({ title: t("Reminder sent."), detail: t("{name} got a message and a notification about this bill. Nothing on the bill changed.", { name: tenantName }) });
            await refreshInvoice();
            onUpdated();
        } catch (error) {
            setActionError(tr(errorMessage(error, t("We could not send the reminder. Please try again."))));
        } finally {
            setProcessing(null);
        }
    };

    const markRefunded = async () => {
        if (processing) return;
        setProcessing("refund");
        setActionError(null);
        try {
            const formData = new FormData();
            if (refundProofFile) formData.append("refundProofFile", refundProofFile);
            const response = await fetch(`/api/landlord/invoices/${invoiceId}/mark-refunded`, { method: "POST", body: formData });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || t("We could not record the refund. Please try again."));
            }
            setRefundProofFile(null);
            setPending(null);
            setDone({ title: t("Refund recorded."), detail: t("{name} was told the refund is on its way. This bill is now settled.", { name: tenantName }) });
            await refreshInvoice();
            onUpdated();
        } catch (error) {
            setPending(null);
            setActionError(tr(errorMessage(error, t("We could not record the refund. Please try again."))));
        } finally {
            setProcessing(null);
        }
    };

    const basePayload = (action: ReviewAction): ReviewPayload => ({
        action,
        note: note.trim() || undefined,
        amountTag: invoice?.amountTag ?? "exact",
        acceptedAmount: roundCentavos(Number(invoice?.totalAmount ?? 0)),
        mismatchResolution: invoice?.amountTag && invoice.amountTag !== "exact" ? "accept_partial" : undefined,
        paymentDiscrepancyType: refund ? "excessive_amount" : undefined,
    });

    const methodLabel = invoice?.paymentMethod ? t(paymentMethodLabel(invoice.paymentMethod)) : null;

    const askConfirmPayment = () => {
        if (!invoice) return;
        setPending({
            kind: "review",
            payload: basePayload("confirm"),
            title: t("Confirm this payment?"),
            facts: [
                { label: t("invoice.fact.from", undefined, "From"), value: tenantName },
                { label: t("Amount"), value: formatPhpCurrency(invoice.paidAmount > 0 ? invoice.paidAmount : invoice.totalAmount) },
                { label: t("Paid with"), value: methodLabel ?? t("Not specified") },
                { label: t("Reference number"), value: invoice.referenceNumber || t("None") },
            ],
            whatHappens: t("The bill will be marked as paid and {name} will get a receipt. You cannot undo this from here.", { name: tenantName }),
            confirmLabel: t("Yes, the payment is correct"),
            tone: "primary",
        });
    };

    const askConfirmCash = () => {
        if (!invoice) return;
        setPending({
            kind: "review",
            payload: basePayload("confirm_received"),
            title: t("Did you receive the cash?"),
            facts: [
                { label: t("invoice.fact.from", undefined, "From"), value: tenantName },
                { label: t("Amount"), value: formatPhpCurrency(invoice.balanceRemaining > 0 ? invoice.balanceRemaining : invoice.totalAmount) },
                { label: t("Paid with"), value: t("Cash") },
            ],
            whatHappens: t("Only press yes if the money is already in your hands. The bill will be marked as paid and {name} will get a receipt.", { name: tenantName }),
            confirmLabel: t("Yes, I received the cash"),
            tone: "primary",
        });
    };

    const askMarkRefunded = () => {
        if (!invoice || !refund) return;
        setPending({
            kind: "refund",
            payload: basePayload("confirm"), // not sent; markRefunded() runs instead
            title: t("Did you send the refund?"),
            facts: [
                { label: t("invoice.fact.to", undefined, "To"), value: tenantName },
                { label: t("Sent with"), value: t(paymentMethodLabel(refund.method ?? "gcash")) },
                { label: t("Account"), value: refund.method === "bank_transfer" ? formatAccountNumber(refund.bank_account_number ?? "") : refund.gcash_number || t("Shown on the QR code") },
            ],
            whatHappens: t("Only press yes if you already sent the money. {name} will be told the refund is on its way.", { name: tenantName }),
            confirmLabel: t("Yes, I sent the refund"),
            tone: "primary",
        });
    };

    const handleClose = () => {
        setRefundProofFile(null);
        onClose();
    };

    const headerSubtitle = invoice
        ? [invoice.unit?.name ? t("Unit {unit}", { unit: invoice.unit.name }) : null, invoice.property?.name ?? null].filter(Boolean).join(" · ")
        : "";

    return (
        <Dialog.Root open={!!invoiceId} onOpenChange={(open) => { if (!open && !processing) handleClose(); }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[150] bg-black/70" />
                <Dialog.Content
                    aria-describedby={undefined}
                    onEscapeKeyDown={(event) => { if (processing || pending || lightboxUrl) event.preventDefault(); }}
                    onPointerDownOutside={(event) => { if (processing || pending || lightboxUrl) event.preventDefault(); }}
                    className={cn(
                        "fixed inset-0 z-[151] flex flex-col bg-background focus:outline-none",
                        "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[94vh] sm:w-[calc(100vw-2rem)] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border sm:border-border sm:bg-card sm:shadow-2xl",
                    )}
                >
                    {/* Top bar: where am I, and the way out. Always visible. */}
                    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/50 bg-card/60 px-6 py-5 sm:rounded-t-[2.5rem]">
                        <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{t("Rent Bill")}</p>
                            <Dialog.Title className="truncate text-2xl font-black text-foreground sm:text-3xl mt-0.5">
                                {loading ? t("Loading…") : invoice ? invoice.tenant?.full_name || t("Unknown tenant") : t("Bill")}
                            </Dialog.Title>
                            {headerSubtitle && <p className="truncate text-xs sm:text-sm text-muted-foreground mt-0.5">{headerSubtitle}</p>}
                        </div>
                        <Dialog.Close asChild>
                            <button
                                type="button"
                                disabled={!!processing}
                                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 cursor-pointer"
                                aria-label={t("Close")}
                            >
                                <X className="size-5" aria-hidden />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
                        {loading && (
                            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
                                <Loader2 className="size-10 animate-spin text-foreground" aria-hidden />
                                <p className="text-lg font-semibold text-muted-foreground">{t("Opening the bill…")}</p>
                            </div>
                        )}

                        {!loading && loadError && (
                            <SettingsNotice tone="danger" live title={t("Something went wrong")} action={<SettingsButton variant="secondary" onClick={() => setReloadKey((key) => key + 1)}>{t("Try again")}</SettingsButton>}>
                                {loadError}
                            </SettingsNotice>
                        )}

                        {!loading && invoice && plain && (
                            <div className="space-y-8">
                                {/* 1. What is happening */}
                                <section aria-labelledby="invoice-status-heading" className={cn("rounded-3xl border-2 p-5 sm:p-6", INVOICE_TONE_CLASSES[plain.tone])}>
                                    <span className="inline-flex items-center gap-2 rounded-full border-2 border-current/40 bg-background/70 px-3 py-1 text-base font-bold">
                                        {plain.group === "paid" && <CheckCircle2 className="size-5" aria-hidden />}
                                        {plain.group === "late" && <AlertCircle className="size-5" aria-hidden />}
                                        {plain.tag}
                                    </span>
                                    <h2 id="invoice-status-heading" className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
                                        {done ? done.title : plain.headline}
                                    </h2>
                                    <p className="mt-2 text-lg leading-relaxed">{done ? done.detail : plain.detail}</p>
                                    <dl className="mt-5 grid grid-cols-2 gap-4 border-t-2 border-current/15 pt-4 sm:grid-cols-3">
                                        <div>
                                            <dt className="text-base font-semibold opacity-80">{t("Bill amount")}</dt>
                                            <dd className="text-2xl font-black">{formatPhpCurrency(invoice.totalAmount)}</dd>
                                        </div>
                                        {invoice.paidAmount > 0 && invoice.balanceRemaining > 0 && (
                                            <div>
                                                <dt className="text-base font-semibold opacity-80">{t("Still owed")}</dt>
                                                <dd className="text-2xl font-black">{formatPhpCurrency(invoice.balanceRemaining)}</dd>
                                            </div>
                                        )}
                                        <div>
                                            <dt className="text-base font-semibold opacity-80">{t("Due date")}</dt>
                                            <dd className="text-xl font-bold">{formatDateLong(invoice.dueDate)}</dd>
                                        </div>
                                    </dl>
                                </section>

                                {actionError && (
                                    <SettingsNotice tone="danger" live title={t("That did not work")}>
                                        {actionError} {t("Nothing on the bill was changed.")}
                                    </SettingsNotice>
                                )}

                                {/* 2. What to do now */}
                                {done ? (
                                    <section className="rounded-2xl border border-border bg-muted/30 p-5 sm:p-6 shadow-xs">
                                        <h2 className="text-xl font-bold text-foreground">{t("You are done here")}</h2>
                                        <p className="mt-1 text-base text-muted-foreground">{t("You can close this bill. The list behind it is already up to date.")}</p>
                                        <SettingsButton size="lg" className="mt-5 w-full sm:w-auto" onClick={handleClose}>{t("Close this bill")}</SettingsButton>
                                    </section>
                                ) : role === "landlord" ? (
                                    <LandlordActions
                                        invoice={invoice}
                                        plain={plain}
                                        tenantName={tenantName}
                                        refund={refund}
                                        refundDone={refundDone}
                                        isCash={isCash}
                                        canSendReminder={canSendReminder}
                                        mode={mode}
                                        setMode={setMode}
                                        note={note}
                                        setNote={setNote}
                                        processing={processing}
                                        refundProofFile={refundProofFile}
                                        setRefundProofFile={setRefundProofFile}
                                        onConfirmPayment={askConfirmPayment}
                                        onConfirmCash={askConfirmCash}
                                        onSendReminder={() => void sendReminder()}
                                        onMarkRefunded={askMarkRefunded}
                                        onProblemReady={(action) => setPending(action)}
                                        onOpenImage={setLightboxUrl}
                                    />
                                ) : (
                                    !isSettled && (
                                        <section className="rounded-2xl border border-border bg-muted/30 p-5 sm:p-6 shadow-xs">
                                            <h2 className="text-xl font-bold text-foreground">{t("What to do now")}</h2>
                                            <p className="mt-1 text-base text-muted-foreground">{t("Pay with GCash, bank transfer, or cash. You will be able to upload your receipt.")}</p>
                                            <Link href={`/tenant/payments/${invoiceId}/checkout`} className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-primary px-7 text-lg font-bold text-primary-foreground hover:brightness-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 sm:w-auto">
                                                {t("Pay now")}
                                            </Link>
                                        </section>
                                    )
                                )}

                                {/* 3. What the tenant sent */}
                                {(invoice.paymentMethod || invoice.paymentProofUrl || invoice.referenceNumber || invoice.paymentSubmittedAt) && (
                                    <section aria-labelledby="invoice-payment-heading" className="space-y-4 rounded-2xl border border-border bg-muted/30 p-5 sm:p-6 shadow-xs">
                                        <h2 id="invoice-payment-heading" className="text-xl font-bold text-foreground">{role === "tenant" ? t("Your payment") : t("What the tenant sent")}</h2>
                                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <Fact label={t("Paid with")} value={methodLabel ?? t("Not specified")} />
                                            <Fact label={t("Reference number")} help={isCash ? undefined : t("From the GCash or bank text message")} value={invoice.referenceNumber || t("None given")} mono={!!invoice.referenceNumber} />
                                            {invoice.paymentSubmittedAt && <Fact label={t("Sent on")} value={formatDateLong(invoice.paymentSubmittedAt)} />}
                                            {invoice.paymentNote && <Fact label={t("Note from the tenant")} value={invoice.paymentNote} />}
                                        </dl>

                                        <PaidToAccount invoice={invoice} />

                                        {invoice.paymentProofUrl ? (
                                            <div className="space-y-3">
                                                <p className="text-lg font-bold text-foreground">{t("Receipt photo")}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setLightboxUrl(invoice.paymentProofUrl)}
                                                    className="group relative block w-full overflow-hidden rounded-2xl border-2 border-foreground/20 bg-muted focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50"
                                                    aria-label={t("See the receipt photo larger")}
                                                >
                                                    <span className="relative block aspect-[4/3] w-full">
                                                        <Image src={invoice.paymentProofUrl} alt={t("Receipt photo sent by the tenant")} fill className="object-contain" sizes="(max-width: 768px) 100vw, 700px" />
                                                    </span>
                                                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-2xl bg-foreground px-4 py-2 text-base font-bold text-background shadow-lg">
                                                        <ZoomIn className="size-5" aria-hidden />
                                                        {t("See it larger")}
                                                    </span>
                                                </button>
                                            </div>
                                        ) : (
                                            !isCash && (
                                                <p className="rounded-2xl border-2 border-dashed border-foreground/20 p-4 text-base text-muted-foreground">
                                                    {t("No receipt photo was sent with this payment.")}
                                                </p>
                                            )
                                        )}

                                        {refundProofUrl(invoice) && (
                                            <div className="space-y-3 border-t-2 border-foreground/10 pt-4">
                                                <p className="text-lg font-bold text-foreground">{t("Refund receipt")}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setLightboxUrl(refundProofUrl(invoice))}
                                                    className="relative block w-full overflow-hidden rounded-2xl border-2 border-foreground/20 bg-muted focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50"
                                                    aria-label={t("See the refund receipt larger")}
                                                >
                                                    <span className="relative block aspect-[4/3] w-full">
                                                        <Image src={refundProofUrl(invoice)!} alt={t("Refund receipt")} fill className="object-contain" sizes="(max-width: 768px) 100vw, 700px" />
                                                    </span>
                                                </button>
                                            </div>
                                        )}
                                    </section>
                                )}

                                {/* 4. What the bill is for */}
                                <section aria-labelledby="invoice-items-heading" className="space-y-4 rounded-2xl border border-border bg-muted/30 p-5 sm:p-6 shadow-xs">
                                    <div>
                                        <h2 id="invoice-items-heading" className="text-xl font-bold text-foreground">{t("What this bill is for")}</h2>
                                        <p className="text-base text-muted-foreground">
                                            {t("Invoice number")} {invoice.invoiceNumber}
                                            {invoice.invoicePeriodStart && invoice.invoicePeriodEnd ? ` · ${t("For {start} to {end}", { start: formatDateLong(invoice.invoicePeriodStart), end: formatDateLong(invoice.invoicePeriodEnd) })}` : ""}
                                        </p>
                                    </div>
                                    <ul className="divide-y-2 divide-foreground/10 rounded-2xl border border-border/50 bg-card/60">
                                        {invoice.lineItems.map((item) => (
                                            <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
                                                <div className="min-w-0">
                                                    <p className="text-lg font-semibold text-foreground">{item.label}</p>
                                                    <p className="text-base capitalize text-muted-foreground">{t(item.category)}</p>
                                                </div>
                                                <p className="shrink-0 text-lg font-bold text-foreground">{formatPhpCurrency(item.amount)}</p>
                                            </li>
                                        ))}
                                        {invoice.lineItems.length === 0 && (
                                            <li className="flex items-center justify-between gap-4 px-4 py-3">
                                                <p className="text-lg font-semibold text-foreground">{invoice.description || t("Monthly rent")}</p>
                                                <p className="shrink-0 text-lg font-bold text-foreground">{formatPhpCurrency(invoice.subtotal)}</p>
                                            </li>
                                        )}
                                        <li className="flex items-center justify-between gap-4 bg-muted/60 px-4 py-3">
                                            <p className="text-lg font-bold text-foreground">{t("Total")}</p>
                                            <p className="text-2xl font-black text-foreground">{formatPhpCurrency(invoice.totalAmount)}</p>
                                        </li>
                                        {invoice.paidAmount > 0 && (
                                            <>
                                                <li className="flex items-center justify-between gap-4 px-4 py-3">
                                                    <p className="text-lg font-semibold text-foreground">{t("Paid so far")}</p>
                                                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatPhpCurrency(invoice.paidAmount)}</p>
                                                </li>
                                                <li className="flex items-center justify-between gap-4 px-4 py-3">
                                                    <p className="text-lg font-bold text-foreground">{t("Still owed")}</p>
                                                    <p className="text-2xl font-black text-foreground">{formatPhpCurrency(invoice.balanceRemaining)}</p>
                                                </li>
                                            </>
                                        )}
                                    </ul>
                                    {invoice.lateFeeAmount > 0 && (
                                        <p className="text-base text-muted-foreground">{t("Late fee if paid after the due date: {amount}", { amount: formatPhpCurrency(invoice.lateFeeAmount) })}</p>
                                    )}
                                </section>

                                {/* 5. Meter readings */}
                                {invoice.readings.length > 0 && (
                                    <section aria-labelledby="invoice-readings-heading" className="space-y-4 rounded-2xl border border-border bg-muted/30 p-5 sm:p-6 shadow-xs">
                                        <h2 id="invoice-readings-heading" className="text-xl font-bold text-foreground">{t("Meter readings on this bill")}</h2>
                                        <ul className="space-y-3">
                                            {invoice.readings.map((reading) => (
                                                <li key={reading.id} className="rounded-2xl border border-border/50 bg-card/60 p-4">
                                                    <p className="text-lg font-bold capitalize text-foreground">{t(reading.utility_type)}</p>
                                                    <p className="text-base text-muted-foreground">
                                                        {formatDateLong(reading.billing_period_start)} – {formatDateLong(reading.billing_period_end)}
                                                        {reading.billing_mode === "included_in_rent" ? ` · ${t("Included in the rent")}` : ""}
                                                    </p>
                                                    <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                        <Fact label={t("Previous reading")} value={String(reading.previous_reading)} />
                                                        <Fact label={t("This reading")} value={String(reading.current_reading)} />
                                                        <Fact label={t("Used")} value={String(reading.usage)} />
                                                        <Fact label={t("Charge")} value={formatPhpCurrency(reading.computed_charge)} />
                                                    </dl>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {/* 6. History */}
                                <section aria-labelledby="invoice-history-heading" className="space-y-4 rounded-2xl border border-border bg-muted/30 p-5 sm:p-6 shadow-xs">
                                    <h2 id="invoice-history-heading" className="text-xl font-bold text-foreground">{t("What happened so far")}</h2>
                                    <ol className="space-y-3">
                                        <HistoryRow date={invoice.issuedDate} text={t("Bill sent to {name}", { name: tenantName })} />
                                        {invoice.paymentSubmittedAt && <HistoryRow date={invoice.paymentSubmittedAt} text={methodLabel ? t("{name} sent a payment by {method}", { name: tenantName, method: methodLabel }) : t("{name} sent a payment", { name: tenantName })} />}
                                        {invoice.rejectionReason && invoice.workflowStatus === "rejected" && <HistoryRow text={t("Problem reported to the tenant: “{reason}”", { reason: invoice.rejectionReason })} />}
                                        {invoice.receipts.map((receipt) => (
                                            <HistoryRow key={receipt.id} date={receipt.issued_at} text={t("Receipt {number} issued for {amount}", { number: receipt.receipt_number ?? "", amount: formatPhpCurrency(receipt.amount) })} done />
                                        ))}
                                        {refundDone && <HistoryRow text={t("Refund sent to {name}", { name: tenantName })} done />}
                                    </ol>
                                </section>

                                <div className="pb-2">
                                    <SettingsButton variant="secondary" size="lg" icon={ArrowLeft} onClick={handleClose} disabled={!!processing}>
                                        {t("Back to the list")}
                                    </SettingsButton>
                                </div>
                            </div>
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>

            {/* One question before money changes hands. Facts restated; buttons name the outcome. */}
            <Dialog.Root open={!!pending} onOpenChange={(open) => { if (!open && !processing) setPending(null); }}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-[200] bg-black/60" />
                    <Dialog.Content
                        className="fixed left-1/2 top-1/2 z-[201] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl focus:outline-none"
                        onEscapeKeyDown={(event) => { if (processing) event.preventDefault(); }}
                        onPointerDownOutside={(event) => { if (processing) event.preventDefault(); }}
                    >
                        {pending && (
                            <>
                                <div className="flex items-start gap-4">
                                    <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                        <AlertTriangle className="size-7" />
                                    </span>
                                    <div className="min-w-0 space-y-2">
                                        <Dialog.Title className="text-2xl font-bold text-foreground">{pending.title}</Dialog.Title>
                                        <Dialog.Description className="text-lg leading-relaxed text-muted-foreground">{t("Please check these details first.")}</Dialog.Description>
                                    </div>
                                </div>
                                <dl className="mt-5 divide-y-2 divide-foreground/10 rounded-2xl border border-border/50 bg-card/60">
                                    {pending.facts.map((fact) => (
                                        <div key={fact.label} className="flex items-baseline justify-between gap-4 px-4 py-3">
                                            <dt className="text-base font-semibold text-muted-foreground">{fact.label}</dt>
                                            <dd className="text-right text-lg font-bold text-foreground">{fact.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                                <p className="mt-4 text-base leading-relaxed text-foreground">{pending.whatHappens}</p>
                                <div className="mt-6 flex flex-col gap-3">
                                    <SettingsButton
                                        variant={pending.tone}
                                        size="lg"
                                        icon={CheckCircle2}
                                        loading={!!processing}
                                        onClick={() => {
                                            if (pending.kind === "refund") void markRefunded();
                                            else void submitReview(pending);
                                        }}
                                    >
                                        {pending.confirmLabel}
                                    </SettingsButton>
                                    <SettingsButton variant="secondary" size="lg" onClick={() => setPending(null)} disabled={!!processing}>
                                        {t("No, go back")}
                                    </SettingsButton>
                                </div>
                            </>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Receipt photo, full size */}
            <Dialog.Root open={!!lightboxUrl} onOpenChange={(open) => { if (!open) setLightboxUrl(null); }}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-[250] bg-black/90" />
                    <Dialog.Content className="fixed inset-0 z-[251] flex flex-col focus:outline-none" aria-describedby={undefined}>
                        <div className="flex shrink-0 items-center justify-between gap-4 bg-black/60 px-4 py-3">
                            <Dialog.Title className="text-lg font-bold text-white">{t("Receipt photo")}</Dialog.Title>
                            <Dialog.Close asChild>
                                <button type="button" className="inline-flex min-h-12 items-center gap-2 rounded-2xl border-2 border-white/40 bg-black/40 px-4 text-base font-bold text-white hover:bg-black/70 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60">
                                    <X className="size-5" aria-hidden />
                                    <span>{t("Close")}</span>
                                </button>
                            </Dialog.Close>
                        </div>
                        <div className="relative min-h-0 flex-1 overflow-auto p-2 sm:p-6">
                            {lightboxUrl && (
                                <div className="relative mx-auto h-full w-full max-w-5xl">
                                    <Image src={lightboxUrl} alt={t("Receipt photo, full size")} fill className="object-contain" sizes="100vw" />
                                </div>
                            )}
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </Dialog.Root>
    );
}

// ---------------------------------------------------------------------------
// Landlord: what to do now
// ---------------------------------------------------------------------------

interface LandlordActionsProps {
    invoice: Invoice;
    plain: InvoicePlainStatus;
    tenantName: string;
    refund: RefundPreference | null;
    refundDone: boolean;
    isCash: boolean;
    canSendReminder: boolean;
    mode: "actions" | "problem";
    setMode: (mode: "actions" | "problem") => void;
    note: string;
    setNote: (value: string) => void;
    processing: string | null;
    refundProofFile: File | null;
    setRefundProofFile: (file: File | null) => void;
    onConfirmPayment: () => void;
    onConfirmCash: () => void;
    onSendReminder: () => void;
    onMarkRefunded: () => void;
    onProblemReady: (action: PendingAction) => void;
    onOpenImage: (url: string) => void;
}

function LandlordActions(props: LandlordActionsProps) {
    const { t } = useLanguageContext();
    const { invoice, plain, tenantName, refund, refundDone, isCash, canSendReminder, mode, setMode, note, setNote, processing, onConfirmPayment, onConfirmCash, onSendReminder, onMarkRefunded, onProblemReady } = props;
    const noteId = useId();

    if (plain.group === "paid" && !(refund && !refundDone)) return null;

    // Refund owed to the tenant (they paid too much and gave their account).
    if (refund && !refundDone) {
        return (
            <section aria-labelledby="invoice-actions-heading" className="space-y-5 rounded-3xl border-2 border-amber-600/50 bg-card p-5 sm:p-6 dark:border-amber-400/50">
                <div>
                    <h2 id="invoice-actions-heading" className="text-xl font-bold text-foreground">{t("What to do now")}</h2>
                    <p className="mt-1 text-base text-muted-foreground">{t("Send the extra money back to {name} using the details below. Then come back here and press the button.", { name: tenantName })}</p>
                </div>
                <dl className="divide-y-2 divide-foreground/10 rounded-2xl border border-border/50 bg-card/60">
                    <FactRow label={t("Send with")} value={t(paymentMethodLabel(refund.method ?? "gcash"))} />
                    {refund.method === "bank_transfer" && refund.bank_name && <FactRow label={t("Bank")} value={refund.bank_name} />}
                    {refund.method === "bank_transfer" && refund.bank_account_name && <FactRow label={t("Account name")} value={refund.bank_account_name} />}
                    <FactRow label={t("Account number")} value={refund.method === "bank_transfer" ? formatAccountNumber(refund.bank_account_number ?? "") : refund.gcash_number || t("Shown on the QR code")} mono />
                </dl>
                {refund.qr_url && (
                    <div className="space-y-2">
                        <p className="text-lg font-bold text-foreground">{t("Tenant's GCash QR code")}</p>
                        <div className="relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-2xl border-2 border-foreground/20 bg-white p-2">
                            <Image src={refund.qr_url} alt={t("Tenant's GCash QR code")} fill className="object-contain" sizes="260px" />
                        </div>
                    </div>
                )}
                <RefundProofPicker file={props.refundProofFile} onChange={props.setRefundProofFile} />
                <SettingsButton size="lg" icon={CheckCircle2} className="w-full sm:w-auto" onClick={onMarkRefunded} loading={processing === "refund"} disabled={!!processing && processing !== "refund"}>
                    {t("Mark refund as sent")}
                </SettingsButton>
            </section>
        );
    }

    if (mode === "problem") {
        return (
            <ProblemFlow
                invoice={invoice}
                tenantName={tenantName}
                note={note}
                onCancel={() => setMode("actions")}
                onReady={onProblemReady}
            />
        );
    }

    const state = resolveInvoicePlainState({ ...invoice, amount: invoice.totalAmount, hasRefundRequest: !!refund, refundSent: refundDone });
    const underReview = state === "under_review";
    const cashToConfirm = state === "cash_to_confirm";

    return (
        <section aria-labelledby="invoice-actions-heading" className="space-y-5 rounded-2xl border border-border bg-muted/30 p-5 sm:p-6 shadow-xs">
            <div>
                <h2 id="invoice-actions-heading" className="text-xl font-bold text-foreground">{t("What to do now")}</h2>
                <p className="mt-1 text-base text-muted-foreground">
                    {underReview
                        ? t("Look at the receipt photo and the reference number below. Compare them with your own GCash or bank record.")
                        : cashToConfirm
                          ? t("Wait for {name} to hand you the cash. Press the button only once the money is in your hands.", { name: tenantName })
                          : t("Pick one of the buttons. Each one tells you what it does.")}
                </p>
            </div>

            {(underReview || cashToConfirm) && (
                <div className="space-y-2">
                    <label htmlFor={noteId} className="block text-lg font-bold text-foreground">
                        {t("Message to {name}", { name: tenantName })} <span className="text-base font-semibold text-muted-foreground">({t("optional")})</span>
                    </label>
                    <textarea
                        id={noteId}
                        value={note}
                        maxLength={BILLING_LIMITS.reviewNote}
                        onChange={(event) => setNote(event.target.value)}
                        rows={2}
                        placeholder={t("For example: Thank you for paying on time.")}
                        className={settingsInputClass(false, "min-h-0 resize-y")}
                    />
                </div>
            )}

            <div className="flex flex-col gap-3">
                {underReview && !isCash && (
                    <>
                        <SettingsButton size="lg" icon={CheckCircle2} onClick={onConfirmPayment} loading={processing === "confirm"} disabled={!!processing && processing !== "confirm"}>
                            {t("Yes, the payment is correct")}
                        </SettingsButton>
                        <SettingsButton size="lg" variant="secondary" icon={AlertTriangle} onClick={() => setMode("problem")} disabled={!!processing}>
                            {t("No, there is a problem with it")}
                        </SettingsButton>
                    </>
                )}
                {(cashToConfirm || (underReview && isCash)) && (
                    <>
                        <SettingsButton size="lg" icon={HandCoins} onClick={onConfirmCash} loading={processing === "confirm_received"} disabled={!!processing && processing !== "confirm_received"}>
                            {t("Confirm cash received")}
                        </SettingsButton>
                        {underReview && (
                            <SettingsButton size="lg" variant="secondary" icon={AlertTriangle} onClick={() => setMode("problem")} disabled={!!processing}>
                                {t("There is a problem with this payment")}
                            </SettingsButton>
                        )}
                    </>
                )}
                {!underReview && !cashToConfirm && canSendReminder && (
                    <>
                        <SettingsButton size="lg" icon={Bell} onClick={onSendReminder} loading={processing === "remind"} disabled={!!processing && processing !== "remind"}>
                            {t("Send {name} a reminder", { name: tenantName })}
                        </SettingsButton>
                        <p className="text-base text-muted-foreground">{t("This sends a message and a notification about this bill. It does not change the bill.")}</p>
                        <SettingsButton size="lg" variant="secondary" icon={HandCoins} onClick={onConfirmCash} loading={processing === "confirm_received"} disabled={!!processing && processing !== "confirm_received"}>
                            {t("{name} paid me in cash", { name: tenantName })}
                        </SettingsButton>
                        <p className="text-base text-muted-foreground">{t("Use this if you already received the full amount in cash. The bill will be marked as paid.")}</p>
                    </>
                )}
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// "There is a problem with this payment" — three short steps, Back at every step
// ---------------------------------------------------------------------------

type ProblemType = "amount" | "proof" | "not_received" | "other";
type AmountChoice = "request_rest" | "credit_next" | "reject";

function ProblemFlow({ invoice, tenantName, note, onCancel, onReady }: { invoice: Invoice; tenantName: string; note: string; onCancel: () => void; onReady: (action: PendingAction) => void }) {
    const { t } = useLanguageContext();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [problem, setProblem] = useState<ProblemType | null>(null);
    const [received, setReceived] = useState<string>("");
    const [receivedTouched, setReceivedTouched] = useState(false);
    const [amountChoice, setAmountChoice] = useState<AmountChoice | null>(null);
    const [reason, setReason] = useState("");
    const [reasonTouched, setReasonTouched] = useState(false);
    const receivedId = useId();
    const reasonId = useId();

    const billTotal = roundCentavos(Number(invoice.totalAmount));
    const receivedNumber = received === "" ? null : Number(received);
    const receivedError = moneyRule(received, { label: "Amount received", positive: true });
    const difference = receivedNumber === null || receivedError ? null : roundCentavos(billTotal - receivedNumber);
    const isShort = difference !== null && difference > 0;
    const isOver = difference !== null && difference < 0;
    const isExact = difference !== null && difference === 0;

    const needsReason = problem !== "amount" || amountChoice !== "credit_next";
    const reasonError = rejectionReasonRule(reason, { required: needsReason });

    const prefillReason = (type: ProblemType, choice: AmountChoice | null) => {
        if (type === "proof") return t("The receipt you sent is unreadable or does not match this bill. Please send a clear photo of the correct receipt.");
        if (type === "not_received") return t("We could not find your payment in our account. Please check the transaction and send the proof again.");
        if (type === "amount" && choice === "request_rest" && difference) return t("Thank you. The payment was {short} less than the bill. Please pay the remaining {short}.", { short: formatPhpCurrency(difference) });
        if (type === "amount" && choice === "credit_next" && difference) return t("Thank you. You paid {extra} more than the bill. We will count it toward your next month's rent.", { extra: formatPhpCurrency(Math.abs(difference)) });
        if (type === "amount" && choice === "reject") return t("The amount you sent does not match this bill. Please pay the exact amount of {amount}.", { amount: formatPhpCurrency(billTotal) });
        return "";
    };

    const goToMessage = (type: ProblemType, choice: AmountChoice | null) => {
        setReason(prefillReason(type, choice));
        setReasonTouched(false);
        setStep(3);
    };

    const finish = () => {
        setReasonTouched(true);
        if (reasonError) return;
        const base = { amountTag: invoice.amountTag ?? "exact", note: note.trim() || undefined };
        let payload: ReviewPayload;
        let title: string;
        let whatHappens: string;
        let confirmLabel: string;
        let tone: "primary" | "danger" = "danger";

        if (problem === "amount" && amountChoice === "request_rest" && difference) {
            payload = { ...base, action: "request_completion", acceptedAmount: roundCentavos(receivedNumber ?? 0), rejectionReason: reason.trim(), paymentDiscrepancyType: "insufficient_amount", shortfallAmount: difference };
            title = t("Ask for the remaining {amount}?", { amount: formatPhpCurrency(difference) });
            whatHappens = t("The {received} you received will be recorded. {name} will get your message and the bill stays open for the rest.", { received: formatPhpCurrency(receivedNumber ?? 0), name: tenantName });
            confirmLabel = t("Yes, send this message");
            tone = "primary";
        } else if (problem === "amount" && amountChoice === "credit_next" && difference) {
            payload = { ...base, action: "confirm", acceptedAmount: roundCentavos(receivedNumber ?? 0), mismatchResolution: "accept_partial", paymentDiscrepancyType: "excessive_amount", shortfallAmount: difference, note: reason.trim() || base.note };
            title = t("Accept the payment and credit the extra?");
            whatHappens = t("The bill will be marked as paid and {name} will get a receipt and your message. Remember to lower next month's bill by {extra}.", { name: tenantName, extra: formatPhpCurrency(Math.abs(difference)) });
            confirmLabel = t("Yes, accept and credit the extra");
            tone = "primary";
        } else {
            const issue: IssueType = problem === "proof" ? "invalid_proof" : problem === "not_received" ? "not_received" : problem === "amount" ? (isShort ? "insufficient_amount" : "excessive_amount") : "other";
            payload = { ...base, action: "reject", acceptedAmount: billTotal, rejectionReason: reason.trim(), paymentDiscrepancyType: issue, shortfallAmount: difference ?? undefined };
            title = t("Send the payment back for correction?");
            whatHappens = t("The payment will not be accepted. {name} will get your message and will be asked to pay again. The bill stays open.", { name: tenantName });
            confirmLabel = t("Yes, do not accept it");
        }

        onReady({
            kind: "review",
            payload,
            title,
            facts: [
                { label: t("Tenant"), value: tenantName },
                { label: t("Bill amount"), value: formatPhpCurrency(billTotal) },
                ...(receivedNumber !== null && problem === "amount" ? [{ label: t("You received"), value: formatPhpCurrency(receivedNumber) }] : []),
                { label: t("Your message"), value: reason.trim() ? reason.trim() : t("None") },
            ],
            whatHappens,
            confirmLabel,
            tone,
        });
    };

    const stepTitle = step === 1 ? t("What is wrong with the payment?") : step === 2 ? t("How much did you actually receive?") : t("Your message to {name}", { name: tenantName });

    return (
        <section aria-labelledby="invoice-problem-heading" className="space-y-5 rounded-3xl border-2 border-amber-600/50 bg-card p-5 sm:p-6 dark:border-amber-400/50">
            <div>
                <p className="text-base font-semibold text-muted-foreground">{t("Report a problem · Step {step} of {total}", { step, total: problem === "amount" ? 3 : 2 })}</p>
                <h2 id="invoice-problem-heading" className="mt-1 text-xl font-bold text-foreground">{stepTitle}</h2>
            </div>

            {step === 1 && (
                <>
                    <ChoiceList<ProblemType>
                        legend={t("Choose one")}
                        value={problem}
                        onChange={setProblem}
                        options={[
                            { value: "amount", label: t("The amount is wrong"), description: t("{name} paid more or less than the bill.", { name: tenantName }) },
                            { value: "proof", label: t("The receipt is unreadable or wrong"), description: t("The photo is blurry, cut off, or for a different payment.") },
                            { value: "not_received", label: t("The money did not arrive"), description: t("You cannot find this payment in your GCash or bank account.") },
                            { value: "other", label: t("Something else"), description: t("You will write what is wrong in the next step.") },
                        ]}
                    />
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <SettingsButton size="lg" disabled={!problem} onClick={() => { if (problem === "amount") setStep(2); else if (problem) goToMessage(problem, null); }}>
                            {t("Continue")}
                        </SettingsButton>
                        <SettingsButton size="lg" variant="secondary" icon={ArrowLeft} onClick={onCancel}>{t("Cancel, go back")}</SettingsButton>
                    </div>
                </>
            )}

            {step === 2 && (
                <>
                    <p className="text-base text-muted-foreground">{t("The bill is {amount}. Type the amount that really arrived in your account or hands.", { amount: formatPhpCurrency(billTotal) })}</p>
                    <div className="space-y-2">
                        <label htmlFor={receivedId} className="block text-lg font-bold text-foreground">{t("Amount received")}</label>
                        <div className="relative">
                            <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">₱</span>
                            <input
                                id={receivedId}
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step="0.01"
                                value={received}
                                onChange={(event) => setReceived(event.target.value)}
                                onBlur={() => setReceivedTouched(true)}
                                aria-invalid={receivedTouched && receivedError ? true : undefined}
                                aria-describedby={receivedTouched && receivedError ? `${receivedId}-error` : undefined}
                                className={settingsInputClass(!!(receivedTouched && receivedError), "pl-10 text-2xl font-bold")}
                                placeholder="0.00"
                            />
                        </div>
                        <FieldError id={`${receivedId}-error`} message={receivedTouched ? receivedError : undefined} className="text-base" />
                    </div>

                    {difference !== null && (
                        <SettingsNotice tone={isExact ? "success" : "info"} live>
                            {isShort && t("That is {amount} less than the bill.", { amount: formatPhpCurrency(difference) })}
                            {isOver && t("That is {amount} more than the bill.", { amount: formatPhpCurrency(Math.abs(difference)) })}
                            {isExact && t("That is the full amount. If the payment is correct, go back and press “Yes, the payment is correct”.")}
                        </SettingsNotice>
                    )}

                    {(isShort || isOver) && (
                        <ChoiceList<AmountChoice>
                            legend={t("What do you want to do?")}
                            value={amountChoice}
                            onChange={setAmountChoice}
                            options={
                                isShort
                                    ? [
                                          { value: "request_rest", label: t("Keep it and ask for the rest"), description: t("Record the {received} and ask {name} to pay the remaining {short}.", { received: formatPhpCurrency(receivedNumber ?? 0), name: tenantName, short: formatPhpCurrency(difference ?? 0) }) },
                                          { value: "reject", label: t("Do not accept it"), description: t("Ask {name} to pay the full {amount} again.", { name: tenantName, amount: formatPhpCurrency(billTotal) }) },
                                      ]
                                    : [
                                          { value: "credit_next", label: t("Accept it and credit the extra"), description: t("Mark the bill as paid and count the extra {extra} toward next month.", { extra: formatPhpCurrency(Math.abs(difference ?? 0)) }) },
                                          { value: "reject", label: t("Do not accept it"), description: t("Ask {name} to send the exact {amount} instead.", { name: tenantName, amount: formatPhpCurrency(billTotal) }) },
                                      ]
                            }
                        />
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <SettingsButton size="lg" disabled={!amountChoice || !(isShort || isOver)} onClick={() => goToMessage("amount", amountChoice)}>
                            {t("Continue")}
                        </SettingsButton>
                        <SettingsButton size="lg" variant="secondary" icon={ArrowLeft} onClick={() => setStep(1)}>{t("Back")}</SettingsButton>
                    </div>
                </>
            )}

            {step === 3 && (
                <>
                    <p className="text-base text-muted-foreground">{t("{name} will see this message. You can change the words.", { name: tenantName })}</p>
                    <div className="space-y-2">
                        <label htmlFor={reasonId} className="block text-lg font-bold text-foreground">
                            {t("invoice.field.message", undefined, "Message")} {!needsReason && <span className="text-base font-semibold text-muted-foreground">({t("optional")})</span>}
                        </label>
                        <textarea
                            id={reasonId}
                            value={reason}
                            maxLength={BILLING_LIMITS.rejectionReason}
                            onChange={(event) => setReason(event.target.value)}
                            onBlur={() => setReasonTouched(true)}
                            rows={4}
                            aria-invalid={reasonTouched && reasonError ? true : undefined}
                            aria-describedby={reasonTouched && reasonError ? `${reasonId}-error` : undefined}
                            className={settingsInputClass(!!(reasonTouched && reasonError), "min-h-0 resize-y")}
                        />
                        <FieldError id={`${reasonId}-error`} message={reasonTouched ? reasonError : undefined} className="text-base" />
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <SettingsButton size="lg" icon={CheckCircle2} onClick={finish}>{t("Continue")}</SettingsButton>
                        <SettingsButton size="lg" variant="secondary" icon={ArrowLeft} onClick={() => setStep(problem === "amount" ? 2 : 1)}>{t("Back")}</SettingsButton>
                    </div>
                </>
            )}
        </section>
    );
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

function ChoiceList<V extends string>({ legend, value, onChange, options }: { legend: string; value: V | null; onChange: (value: V) => void; options: Array<{ value: V; label: string; description?: string }> }) {
    const name = useId();
    return (
        <fieldset className="space-y-3">
            <legend className="text-lg font-bold text-foreground">{legend}</legend>
            <div className="grid grid-cols-1 gap-3">
                {options.map((option) => {
                    const selected = option.value === value;
                    return (
                        <label
                            key={option.value}
                            className={cn(
                                "relative flex min-h-16 cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-colors",
                                "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/50",
                                selected ? "border-foreground/70 bg-primary/20" : "border-foreground/15 bg-background hover:border-foreground/40",
                            )}
                        >
                            <input type="radio" name={name} value={option.value} checked={selected} onChange={() => onChange(option.value)} className="sr-only" />
                            <span aria-hidden className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-foreground bg-foreground text-background" : "border-foreground/40 bg-background")}>
                                {selected && <CheckCircle2 className="size-5" />}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-lg font-bold text-foreground">{option.label}</span>
                                {option.description && <span className="mt-0.5 block text-base leading-snug text-muted-foreground">{option.description}</span>}
                            </span>
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
}

function Fact({ label, value, help, mono }: { label: string; value: string; help?: string; mono?: boolean }) {
    return (
        <div className="rounded-2xl border border-border/50 bg-card/60 px-4 py-3">
            <dt className="text-base font-semibold text-muted-foreground">
                {label}
                {help && <span className="block text-sm font-normal">{help}</span>}
            </dt>
            <dd className={cn("mt-0.5 break-words text-lg font-bold text-foreground", mono && "font-mono tracking-wide")}>{value}</dd>
        </div>
    );
}

function FactRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="text-base font-semibold text-muted-foreground">{label}</dt>
            <dd className={cn("text-right text-lg font-bold text-foreground", mono && "font-mono tracking-wide")}>{value}</dd>
        </div>
    );
}

function HistoryRow({ date, text, done }: { date?: string | null; text: string; done?: boolean }) {
    const Icon: LucideIcon = done ? CheckCircle2 : AlertCircle;
    return (
        <li className="flex items-start gap-3">
            <Icon className={cn("mt-1 size-5 shrink-0", done ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground")} aria-hidden />
            <div>
                {date && <p className="text-base font-semibold text-muted-foreground">{formatDateLong(date)}</p>}
                <p className="text-lg text-foreground">{text}</p>
            </div>
        </li>
    );
}

/** The account the tenant says they paid into: the bank for transfers, GCash otherwise. */
function PaidToAccount({ invoice }: { invoice: Invoice }) {
    const { t } = useLanguageContext();
    if (!invoice.paymentMethod || invoice.paymentMethod === "cash" || invoice.paymentMethod === "in_person") return null;
    const isBank = invoice.paymentMethod === "bank_transfer";
    const paidTo = isBank ? invoice.paymentDestinations?.bank_transfer : invoice.paymentDestination;
    if (!paidTo) return null;
    return (
        <div className="rounded-2xl border border-border/50 bg-card/60 px-4 py-3">
            <p className="text-base font-semibold text-muted-foreground">{t("Paid into your account")}</p>
            {isBank && paidTo.bank_name && <p className="text-lg font-bold text-foreground">{paidTo.bank_name}</p>}
            <p className="text-lg font-bold text-foreground">{paidTo.account_name}</p>
            <p className="font-mono text-lg tracking-wide text-foreground">{isBank ? maskAccountNumber(paidTo.account_number) : paidTo.account_number}</p>
        </div>
    );
}

function RefundProofPicker({ file, onChange }: { file: File | null; onChange: (file: File | null) => void }) {
    const { t } = useLanguageContext();
    const inputId = useId();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!file) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <div className="space-y-2">
            <p className="text-lg font-bold text-foreground">
                {t("Photo of the refund receipt")} <span className="text-base font-semibold text-muted-foreground">({t("optional")})</span>
            </p>
            <p className="text-base text-muted-foreground">{t("A screenshot of the GCash or bank transfer helps the tenant see that the refund was sent.")}</p>
            {file && previewUrl ? (
                <div className="space-y-3">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-foreground/20 bg-muted">
                        <Image src={previewUrl} alt={t("Refund receipt you chose")} fill className="object-contain" sizes="(max-width: 768px) 100vw, 700px" />
                    </div>
                    <SettingsButton variant="secondary" icon={Trash2} onClick={() => onChange(null)}>{t("Remove this photo")}</SettingsButton>
                </div>
            ) : (
                <label htmlFor={inputId} className="flex min-h-16 cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-foreground/30 bg-background px-4 text-lg font-bold text-foreground hover:border-foreground/60 hover:bg-muted has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/50">
                    <Upload className="size-6" aria-hidden />
                    <span>{t("Choose a photo")}</span>
                    <input
                        id={inputId}
                        type="file"
                        className="sr-only"
                        accept={MEDIA_ACCEPT_STRINGS.image}
                        onChange={(event) => {
                            const picked = handleMediaSelection(event, {
                                preset: "image",
                                maxSizeBytes: PROOF_MAX_BYTES,
                                notify: (message, description) => toast.error(tr(message), { description }),
                            });
                            onChange(picked);
                        }}
                    />
                </label>
            )}
        </div>
    );
}

/** Demo data for preview ids (unit-map previews, docs). */
function mockInvoice(targetInvoiceId: string): Invoice {
    const now = new Date().toISOString();
    const isSelective = targetInvoiceId.includes("selective");
    const isF2FPreview = targetInvoiceId.includes("preview") || targetInvoiceId.includes("in_person");
    return {
        id: targetInvoiceId,
        invoiceNumber: isSelective ? "INV-SEL-2026-MOCK" : `INV-PREVIEW-${targetInvoiceId.slice(0, 4).toUpperCase()}`,
        status: "pending",
        workflowStatus: isF2FPreview ? "awaiting_in_person" : "pending",
        totalAmount: isSelective ? 52020.5 : 14070,
        subtotal: isSelective ? 52020.5 : 14070,
        balanceRemaining: isSelective ? 52020.5 : 14070,
        paidAmount: 0,
        dueDate: "2026-06-01",
        issuedDate: now,
        billingCycle: "2026-05-01",
        invoicePeriodStart: "2026-05-01",
        invoicePeriodEnd: "2026-05-31",
        tenant: { full_name: isSelective ? "Selective Payment Demo" : "Tenant Preview", email: "demo@ireside.local", avatar_url: null } as unknown as Invoice["tenant"],
        landlord: null,
        property: { name: "Skyline Heights Apartments", address: "88 Orchid Blvd" } as unknown as Invoice["property"],
        unit: { name: isSelective ? "Unit 42A" : "Unit 4B", floor: 42 } as unknown as Invoice["unit"],
        paymentMethod: isF2FPreview ? "in_person" : null,
        lineItems: [
            { id: "1", label: isSelective ? "Parking Slot B12" : "Monthly rent", amount: isSelective ? 5000 : 12500, category: isSelective ? "parking" : "rent" },
            { id: "2", label: "Water Consumption", amount: 540, category: "water" },
            { id: "3", label: "Electricity Consumption", amount: 1480.5, category: "electricity" },
        ] as unknown as Invoice["lineItems"],
        readings: [],
        receipts: [],
        paymentSubmittedAt: null,
        paymentProofUrl: null,
        paymentNote: null,
        referenceNumber: null,
        receiptNumber: null,
        amountTag: isSelective ? "partial" : "exact",
        reviewAction: null,
        rejectionReason: null,
        intentMethod: null,
        inPersonIntentExpiresAt: null,
        landlordConfirmed: false,
        lateFeeAmount: 0,
        allowPartialPayments: false,
        description: null,
        metadata: {},
        paymentDestination: null,
        paymentDestinations: { gcash: null, bank_transfer: null },
        leaseTermsSummary: { dueDay: 5, lateFeeAmount: 0, allowPartialPayments: false, utilitiesDescription: null },
    } as unknown as Invoice;
}

