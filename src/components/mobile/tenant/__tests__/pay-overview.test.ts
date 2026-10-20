import { describe, expect, it } from "vitest";

import { mobilePayTotals, toMobilePayItems } from "../pay-overview";

const TODAY = "2026-10-01";

const invoice = (id: string, extra: Record<string, unknown>) => ({
    id,
    invoiceNumber: `INV-${id}`,
    amount: 6428,
    balanceRemaining: 6428,
    dueDate: "2026-10-05",
    status: "pending",
    workflowStatus: "pending",
    type: "Rent + Utilities",
    referenceNumber: null,
    paymentProofUrl: null,
    ...extra,
});

describe("mobile Pay tab overview mapping", () => {
    it("lists nextPayment and history from the API, unpaid first", () => {
        const items = toMobilePayItems({
            nextPayment: invoice("oct", { status: "overdue", workflowStatus: "reminder_sent" }),
            history: [
                invoice("aug", { dueDate: "2026-08-05", status: "receipted", workflowStatus: "receipted", balanceRemaining: 0 }),
                invoice("sep", { dueDate: "2026-09-05", status: "paid", workflowStatus: "receipted", balanceRemaining: 0 }),
                invoice("nov", { dueDate: "2026-11-05" }),
            ],
        }, TODAY);
        expect(items.map((item) => [item.id, item.status])).toEqual([
            ["oct", "overdue"],
            ["nov", "pending"],
            ["sep", "paid"],
            ["aug", "paid"],
        ]);
        expect(items[0].label).toBe("Rent + Utilities");
        expect(items[2].paidAmount).toBe(6428);
    });

    it("marks proofs awaiting review as processing and part-paid bills as partial", () => {
        const [review, partial] = toMobilePayItems({
            history: [
                invoice("review", { status: "under_review", workflowStatus: "under_review", balanceRemaining: 0 }),
                invoice("partial", { dueDate: "2026-12-05", balanceRemaining: "1428.00" }),
            ],
        }, TODAY);
        expect(review.status).toBe("processing");
        expect(partial.status).toBe("partial");
        expect(partial.paidAmount).toBe(5000);
    });

    it("totals what is still owed and the overdue part", () => {
        const items = toMobilePayItems({
            nextPayment: invoice("oct", { status: "overdue" }),
            history: [
                invoice("nov", { dueDate: "2026-11-05", balanceRemaining: 5000.5 }),
                invoice("sep", { status: "paid", balanceRemaining: 0 }),
                invoice("review", { status: "under_review", workflowStatus: "under_review", balanceRemaining: 0 }),
            ],
        }, TODAY);
        expect(mobilePayTotals(items)).toEqual({ unpaidTotal: 11428.5, overdueTotal: 6428, awaitingReview: 1 });
    });

    it("handles an empty or missing response", () => {
        expect(toMobilePayItems(null)).toEqual([]);
        expect(toMobilePayItems({ nextPayment: null, history: [] })).toEqual([]);
        expect(mobilePayTotals([])).toEqual({ unpaidTotal: 0, overdueTotal: 0, awaitingReview: 0 });
    });

    it("treats an unpaid bill past its due date as overdue even after a reminder", () => {
        const [late] = toMobilePayItems({ nextPayment: invoice("oct", { status: "reminder_sent", workflowStatus: "reminder_sent" }) }, "2026-10-19");
        expect(late.status).toBe("overdue");
        const [notYet] = toMobilePayItems({ nextPayment: invoice("oct", { status: "reminder_sent" }) }, "2026-10-05");
        expect(notYet.status).toBe("pending");
    });

    it("does not list the next payment twice", () => {
        const next = invoice("oct", {});
        expect(toMobilePayItems({ nextPayment: next, history: [next] })).toHaveLength(1);
    });
});
