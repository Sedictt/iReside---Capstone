/**
 * Turns GET /api/tenant/payments (`{ nextPayment, history, ... }` from getTenantPaymentOverview)
 * into the invoice list and totals the mobile Pay tab shows.
 */

export type MobilePayStatus = "paid" | "pending" | "overdue" | "processing" | "partial";

export interface MobilePayItem {
    id: string;
    amount: number;
    paidAmount: number;
    balanceRemaining: number;
    dueDate: string;
    /** Short label for the card, e.g. "Monthly Rent". */
    label: string;
    status: MobilePayStatus;
    workflowStatus?: string;
    referenceNumber?: string;
    paymentProofUrl?: string | null;
    invoiceNumber?: string;
}

/** The fields of an InvoiceListItem (src/lib/billing/server.ts) this screen reads. */
export interface OverviewInvoice {
    id: string;
    invoiceNumber?: string | null;
    amount?: number | string | null;
    balanceRemaining?: number | string | null;
    dueDate: string;
    status?: string | null;
    workflowStatus?: string | null;
    type?: string | null;
    referenceNumber?: string | null;
    paymentProofUrl?: string | null;
}

export interface OverviewResponse {
    nextPayment?: OverviewInvoice | null;
    history?: OverviewInvoice[] | null;
}

const PAID_STATUSES = new Set(["paid", "receipted", "confirmed", "refunded"]);
const PROCESSING_STATUSES = new Set(["processing", "under_review", "awaiting_in_person", "intent_submitted"]);

const money = (value: unknown) => {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

/** Local calendar date as YYYY-MM-DD (due dates are plain dates). */
export function localIsoDate(date = new Date()): string {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}

export function toMobilePayStatus(invoice: OverviewInvoice, amount: number, balance: number, today = localIsoDate()): MobilePayStatus {
    const status = invoice.status ?? "pending";
    const workflow = invoice.workflowStatus ?? "";
    if (PAID_STATUSES.has(status) || PAID_STATUSES.has(workflow)) return "paid";
    if (PROCESSING_STATUSES.has(status) || PROCESSING_STATUSES.has(workflow)) return "processing";
    // A reminder or a rejected proof does not stop a bill from being past due.
    if (status === "overdue" || (balance > 0 && invoice.dueDate.slice(0, 10) < today)) return "overdue";
    if (balance > 0 && balance < amount) return "partial";
    return "pending";
}

export function toMobilePayItems(overview: OverviewResponse | null | undefined, today = localIsoDate()): MobilePayItem[] {
    const all = [overview?.nextPayment, ...(overview?.history ?? [])].filter(
        (invoice): invoice is OverviewInvoice => Boolean(invoice?.id),
    );
    const seen = new Set<string>();
    const items: MobilePayItem[] = [];
    for (const invoice of all) {
        if (seen.has(invoice.id)) continue;
        seen.add(invoice.id);
        const amount = money(invoice.amount);
        const status = toMobilePayStatus(invoice, amount, money(invoice.balanceRemaining), today);
        const balance = status === "paid" ? 0 : money(invoice.balanceRemaining);
        items.push({
            id: invoice.id,
            amount,
            balanceRemaining: balance,
            paidAmount: Math.max(0, money(amount - balance)),
            dueDate: invoice.dueDate,
            label: invoice.type || "Monthly Rent",
            status,
            workflowStatus: invoice.workflowStatus ?? undefined,
            referenceNumber: invoice.referenceNumber ?? undefined,
            paymentProofUrl: invoice.paymentProofUrl ?? null,
            invoiceNumber: invoice.invoiceNumber ?? undefined,
        });
    }
    // Bills still to pay first (soonest due), then paid ones (newest first).
    return items.sort((a, b) => {
        const aPaid = a.status === "paid";
        const bPaid = b.status === "paid";
        if (aPaid !== bPaid) return aPaid ? 1 : -1;
        return aPaid ? b.dueDate.localeCompare(a.dueDate) : a.dueDate.localeCompare(b.dueDate);
    });
}

/**
 * Totals for the balance card: what is still owed, the overdue part of it, and how many
 * submitted payments are waiting for the landlord (those no longer count as owed).
 */
export function mobilePayTotals(items: MobilePayItem[]) {
    let unpaidTotal = 0;
    let overdueTotal = 0;
    let awaitingReview = 0;
    for (const item of items) {
        if (item.status === "paid") continue;
        if (item.status === "processing") awaitingReview += 1;
        unpaidTotal += item.balanceRemaining;
        if (item.status === "overdue") overdueTotal += item.balanceRemaining;
    }
    return { unpaidTotal: money(unpaidTotal), overdueTotal: money(overdueTotal), awaitingReview };
}
