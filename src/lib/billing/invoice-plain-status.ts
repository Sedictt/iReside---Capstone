/**
 * Plain-language invoice status for the landlord and tenant screens.
 *
 * Our users are often older and not confident with apps, so every invoice state is
 * described the same way everywhere: a short tag (an adjective, sentence case, shown
 * with its colour but never colour alone), a headline sentence that says what is
 * happening, a detail sentence that says what to do next, and the name of the one
 * action that moves it forward. Screens render these words; they never invent their own.
 *
 * The groups are mutually exclusive and cover every invoice, so the list filter can
 * answer "what do I need to do today?" without the landlord learning workflow states.
 *
 * Client-safe: no server-only imports. Callers pass `t` so the words translate.
 */

import { formatDateLong, formatPhpCurrency } from "./utils";
import { paymentMethodLabel } from "./payment-methods";

type Translate = (phrase: string, params?: Record<string, string | number>) => string;

/** The four piles an invoice can be in, from the landlord's point of view. */
export type InvoiceAttentionGroup = "attention" | "late" | "waiting" | "paid";

export type InvoiceTone = "success" | "warning" | "danger" | "info" | "neutral";

export interface InvoiceStatusInput {
    status: string;
    workflowStatus?: string | null;
    proofStatus?: string | null;
    balanceRemaining: number;
    dueDate?: string | null;
    hasReceipt?: boolean;
    paymentMethod?: string | null;
    hasRefundRequest?: boolean;
    refundSent?: boolean;
    /** Tenant's full name, used in sentences ("Miguel sent a payment"). */
    tenantName?: string | null;
    amount?: number;
    paidAmount?: number;
    /** When the tenant reported the payment (payment_submitted_at). */
    paymentSubmittedAt?: string | null;
}

export interface InvoicePlainStatus {
    group: InvoiceAttentionGroup;
    tone: InvoiceTone;
    /** Short tag for lists: "Paid", "Late", "Payment to check". */
    tag: string;
    /** One sentence: what is happening. */
    headline: string;
    /** One sentence: what to do next (or that nothing is needed). */
    detail: string;
    /** Label of the button that moves this invoice forward, or null when nothing is needed. */
    actionLabel: string | null;
}

/** Whole days from today to `dateIso` (positive = in the future, negative = in the past). */
export function daysFromToday(dateIso: string | null | undefined, now = new Date()): number | null {
    if (!dateIso) return null;
    const due = new Date(dateIso);
    if (Number.isNaN(due.getTime())) return null;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    return Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86_400_000);
}

/**
 * The one state an invoice is in, from the landlord's point of view. The list, the
 * "things to do" cards and the open bill all read this, so they can never disagree.
 *
 * Order matters: a refund the tenant is waiting for beats everything; a cash hand-over
 * the landlord must confirm beats "under review" (an in-person intent also stamps
 * payment_submitted_at); a payment under review beats "paid" because the balance is
 * provisionally reduced when the tenant uploads proof; only then does the due date count.
 */
export type InvoicePlainState =
    | "refund_sent"
    | "refund_pending"
    | "cash_to_confirm"
    | "under_review"
    | "paid"
    | "overdue"
    | "intent_submitted"
    | "rejected"
    | "reminder_sent"
    | "pending";

export function resolveInvoicePlainState(invoice: InvoiceStatusInput): InvoicePlainState {
    if (invoice.hasRefundRequest && invoice.refundSent) return "refund_sent";
    if (invoice.hasRefundRequest) return "refund_pending";

    const settled =
        invoice.balanceRemaining <= 0 ||
        invoice.status === "completed" ||
        invoice.status === "paid" ||
        invoice.workflowStatus === "receipted" ||
        invoice.workflowStatus === "confirmed";
    const reviewing =
        (invoice.workflowStatus === "under_review" || invoice.status === "under_review" || invoice.proofStatus === "submitted") &&
        invoice.workflowStatus !== "confirmed" &&
        invoice.workflowStatus !== "receipted" &&
        invoice.status !== "completed";

    if (invoice.workflowStatus === "awaiting_in_person" && !settled) return "cash_to_confirm";
    if (reviewing) return "under_review";
    if (settled) return "paid";

    const days = daysFromToday(invoice.dueDate);
    if (invoice.status === "overdue" || invoice.workflowStatus === "overdue" || (days !== null && days < 0)) return "overdue";
    if (invoice.workflowStatus === "intent_submitted") return "intent_submitted";
    if (invoice.workflowStatus === "rejected") return "rejected";
    if (invoice.workflowStatus === "reminder_sent") return "reminder_sent";
    return "pending";
}

/** Which pile the invoice belongs to. Refunds and payments to check always come first. */
export function getInvoiceAttentionGroup(invoice: InvoiceStatusInput): InvoiceAttentionGroup {
    switch (resolveInvoicePlainState(invoice)) {
        case "refund_pending":
        case "cash_to_confirm":
        case "under_review":
            return "attention";
        case "refund_sent":
        case "paid":
            return "paid";
        case "overdue":
            return "late";
        default:
            return "waiting";
    }
}

/** "Due today", "Due in 3 days", "5 days late" — or null when there is no usable date. */
export function describeDueDate(dueDate: string | null | undefined, t: Translate): string | null {
    const days = daysFromToday(dueDate);
    if (days === null) return null;
    if (days === 0) return t("Due today");
    if (days === 1) return t("Due tomorrow");
    if (days > 1) return t("Due in {days} days", { days });
    if (days === -1) return t("1 day late");
    return t("{days} days late", { days: Math.abs(days) });
}

/**
 * The words for one invoice. `role` picks whose point of view the sentences take:
 * the landlord reads "Miguel sent a payment", the tenant reads "Your payment is being checked".
 */
export function describeInvoice(invoice: InvoiceStatusInput, t: Translate, role: "landlord" | "tenant" = "landlord"): InvoicePlainStatus {
    const group = getInvoiceAttentionGroup(invoice);
    const name = invoice.tenantName?.trim() || t("The tenant");
    const dueText = formatDateLong(invoice.dueDate);
    const days = daysFromToday(invoice.dueDate);
    const owed = formatPhpCurrency(invoice.balanceRemaining > 0 ? invoice.balanceRemaining : invoice.amount ?? 0);
    const method = invoice.paymentMethod ? t(paymentMethodLabel(invoice.paymentMethod)) : null;
    const isTenant = role === "tenant";

    const state = resolveInvoicePlainState(invoice);

    if (state === "refund_sent") {
        return {
            group,
            tone: "success",
            tag: t("Refund sent"),
            headline: t("The refund was sent."),
            detail: isTenant ? t("Your landlord sent the refund to the account you gave.") : t("This bill is settled. Nothing more to do."),
            actionLabel: null,
        };
    }

    if (state === "refund_pending") {
        return {
            group,
            tone: "warning",
            tag: t("Refund to send"),
            headline: isTenant ? t("You asked for a refund.") : t("{name} asked for a refund.", { name }),
            detail: isTenant
                ? t("Your landlord will send it to the account you gave.")
                : t("Send the money to the account shown below. Then press “Mark refund as sent”."),
            actionLabel: isTenant ? null : t("Send refund"),
        };
    }

    switch (state) {
        case "under_review":
            return {
                group,
                tone: "warning",
                tag: t("Payment to check"),
                headline: isTenant
                    ? t("Your payment is being checked.")
                    : t("{name} sent a payment of {amount}.", { name, amount: formatPhpCurrency(invoice.paidAmount && invoice.paidAmount > 0 ? invoice.paidAmount : invoice.amount ?? invoice.balanceRemaining) }),
                detail: isTenant
                    ? t("Your landlord will confirm it soon. You do not need to do anything.")
                    : t("Compare the receipt below with your own account. Then confirm it, or report a problem."),
                actionLabel: isTenant ? null : t("Check payment"),
            };
        case "paid": {
            const paidOn = invoice.paymentSubmittedAt ? formatDateLong(invoice.paymentSubmittedAt) : null;
            const how = [paidOn ? t("Paid on {date}", { date: paidOn }) : null, method ? t("by {method}", { method }) : null].filter(Boolean).join(" ");
            return {
                group,
                tone: "success",
                tag: t("Paid"),
                headline: isTenant ? t("You have paid this bill.") : t("This bill is paid."),
                detail: how ? `${how}. ${t("Nothing more to do.")}` : t("Nothing more to do."),
                actionLabel: null,
            };
        }
        case "overdue":
            return {
                group,
                tone: "danger",
                tag: days !== null && days === -1 ? t("1 day late") : t("{days} days late", { days: Math.abs(days ?? 0) }),
                headline: t("This bill is late."),
                detail: isTenant
                    ? t("It was due on {date}. Please pay it as soon as you can.", { date: dueText })
                    : t("It was due on {date}. {name} has not paid yet. You can send a reminder.", { date: dueText, name }),
                actionLabel: isTenant ? t("Pay now") : t("Send reminder"),
            };
        case "cash_to_confirm":
            return {
                group,
                tone: "info",
                tag: t("Cash to confirm"),
                headline: isTenant ? t("You chose to pay in cash.") : t("{name} will pay {amount} in cash.", { name, amount: owed }),
                detail: isTenant
                    ? t("Hand the payment to your landlord. They will confirm it here.")
                    : t("When the cash is in your hands, press “Confirm cash received”."),
                actionLabel: isTenant ? null : t("Confirm cash"),
            };
        case "intent_submitted":
            return {
                group,
                tone: "info",
                tag: t("Payment on the way"),
                headline: isTenant ? t("You said you are paying this bill.") : t("{name} said they are paying.", { name }),
                detail: isTenant
                    ? t("Finish the payment and upload the receipt so your landlord can confirm it.")
                    : t("Wait for the payment to arrive, then check it here."),
                actionLabel: isTenant ? t("Pay now") : null,
            };
        case "rejected":
            return {
                group,
                tone: "danger",
                tag: t("Problem reported"),
                headline: isTenant ? t("There was a problem with your payment.") : t("You reported a problem with the payment."),
                detail: isTenant
                    ? t("Read the message from your landlord, then pay again.")
                    : t("{name} was asked to send it again.", { name }),
                actionLabel: isTenant ? t("Pay now") : t("Send reminder"),
            };
        case "reminder_sent":
            return {
                group,
                tone: "neutral",
                tag: t("Reminder sent"),
                headline: t("Not paid yet. A reminder was sent."),
                detail: isTenant ? t("Due on {date}.", { date: dueText }) : t("Due on {date}. You can send another reminder.", { date: dueText }),
                actionLabel: isTenant ? t("Pay now") : t("Send reminder"),
            };
        default: {
            const partial = invoice.paidAmount && invoice.paidAmount > 0 && invoice.balanceRemaining > 0;
            return {
                group,
                tone: "neutral",
                tag: describeDueDate(invoice.dueDate, t) ?? t("Not paid yet"),
                headline: partial
                    ? t("Partly paid. {amount} is still owed.", { amount: formatPhpCurrency(invoice.balanceRemaining) })
                    : t("Not paid yet."),
                detail: isTenant ? t("Due on {date}.", { date: dueText }) : t("Due on {date}. No payment has been sent yet.", { date: dueText }),
                actionLabel: isTenant ? t("Pay now") : t("Send reminder"),
            };
        }
    }
}

/** Tailwind classes for a status tag, light and dark. Text and border carry the meaning; colour supports it. */
export const INVOICE_TONE_CLASSES: Record<InvoiceTone, string> = {
    success: "border-emerald-600/50 bg-emerald-50 text-emerald-900 dark:border-emerald-400/50 dark:bg-emerald-500/15 dark:text-emerald-200",
    warning: "border-amber-600/50 bg-amber-50 text-amber-950 dark:border-amber-400/50 dark:bg-amber-500/15 dark:text-amber-100",
    danger: "border-rose-600/50 bg-rose-50 text-rose-900 dark:border-rose-400/50 dark:bg-rose-500/15 dark:text-rose-200",
    info: "border-sky-600/50 bg-sky-50 text-sky-950 dark:border-sky-400/50 dark:bg-sky-500/15 dark:text-sky-100",
    neutral: "border-foreground/30 bg-muted text-foreground",
};
