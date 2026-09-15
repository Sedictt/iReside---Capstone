import { describe, it, expect } from "vitest";
import {
    getInvoiceFilterCategory,
    getInvoiceDisplayStatus,
    getInvoiceStatus,
} from "../utils";

describe("Billing Utils - Invoice Categorization & Display Status", () => {
    describe("getInvoiceFilterCategory", () => {
        it("categorizes fully paid invoices (balanceRemaining <= 0) as 'paid'", () => {
            const invoice = {
                status: "pending",
                workflowStatus: "pending" as const,
                proofStatus: "none" as const,
                balanceRemaining: 0,
                dueDate: "2026-05-05",
            };
            expect(getInvoiceFilterCategory(invoice)).toBe("paid");
        });

        it("categorizes completed or receipted invoices as 'paid'", () => {
            const invoice = {
                status: "completed",
                workflowStatus: "receipted" as const,
                proofStatus: "confirmed" as const,
                balanceRemaining: 0,
                dueDate: "2026-10-05",
            };
            expect(getInvoiceFilterCategory(invoice)).toBe("paid");
        });

        it("categorizes invoices awaiting verification as 'under_review'", () => {
            const invoice = {
                status: "pending",
                workflowStatus: "under_review" as const,
                proofStatus: "submitted" as const,
                balanceRemaining: 0, // provisional balance deduction from submit
                dueDate: "2026-10-10",
            };
            expect(getInvoiceFilterCategory(invoice)).toBe("under_review");
        });

        it("categorizes invoices with balance > 0 and past due date as 'overdue'", () => {
            const invoice = {
                status: "pending",
                workflowStatus: "confirmed" as const, // stale or partial confirmed
                proofStatus: "none" as const,
                balanceRemaining: 18200,
                dueDate: "2020-01-01", // in the past
            };
            expect(getInvoiceFilterCategory(invoice)).toBe("overdue");
        });

        it("categorizes active unpaid invoices with future due date as 'pending'", () => {
            const invoice = {
                status: "pending",
                workflowStatus: "pending" as const,
                proofStatus: "none" as const,
                balanceRemaining: 18200,
                dueDate: "2099-12-31", // in the future
            };
            expect(getInvoiceFilterCategory(invoice)).toBe("pending");
        });

        it("ensures filter categories are mutually exclusive across diverse invoices", () => {
            const invoices = [
                { status: "completed", balanceRemaining: 0, dueDate: "2026-01-01" },
                { status: "pending", workflowStatus: "pending", balanceRemaining: 0, dueDate: "2026-05-05" }, // previously misclassified
                { status: "pending", workflowStatus: "under_review", proofStatus: "submitted", balanceRemaining: 0, dueDate: "2026-10-10" },
                { status: "overdue", balanceRemaining: 5000, dueDate: "2026-01-01" },
                { status: "pending", workflowStatus: "confirmed", balanceRemaining: 18200, dueDate: "2099-01-01" },
                { status: "pending", workflowStatus: "awaiting_in_person", balanceRemaining: 12000, dueDate: "2099-01-01" },
            ];

            const counts = { overdue: 0, under_review: 0, pending: 0, paid: 0 };
            for (const inv of invoices) {
                const cat = getInvoiceFilterCategory(inv as any);
                counts[cat]++;
            }

            expect(counts.paid + counts.under_review + counts.overdue + counts.pending).toBe(invoices.length);
            expect(counts.paid).toBe(2);
            expect(counts.under_review).toBe(1);
            expect(counts.overdue).toBe(1);
            expect(counts.pending).toBe(2);
        });
    });

    describe("getInvoiceDisplayStatus", () => {
        it("returns 'paid' or 'receipted' for invoices with 0 balance, never 'pending'", () => {
            const paidInvoice = {
                status: "pending", // DB status was pending, but fully paid
                workflowStatus: "pending" as const,
                balanceRemaining: 0,
                dueDate: "2026-05-05",
                hasReceipt: false,
            };
            expect(getInvoiceDisplayStatus(paidInvoice)).toBe("paid");

            const receiptedInvoice = {
                status: "completed",
                workflowStatus: "receipted" as const,
                balanceRemaining: 0,
                dueDate: "2026-05-05",
                hasReceipt: true,
            };
            expect(getInvoiceDisplayStatus(receiptedInvoice)).toBe("receipted");
        });

        it("returns 'under_review' when payment proof is submitted and not finalized", () => {
            const underReviewInvoice = {
                status: "under_review",
                workflowStatus: "under_review" as const,
                proofStatus: "submitted" as const,
                balanceRemaining: 0,
                dueDate: "2026-10-10",
            };
            expect(getInvoiceDisplayStatus(underReviewInvoice)).toBe("under_review");
        });

        it("returns 'overdue' for invoices with balance remaining and past due date", () => {
            const overdueInvoice = {
                status: "pending",
                workflowStatus: "confirmed" as const,
                balanceRemaining: 18200,
                dueDate: "2020-01-01",
            };
            expect(getInvoiceDisplayStatus(overdueInvoice)).toBe("overdue");
        });

        it("returns 'awaiting_in_person' for active cash collection intents", () => {
            const cashInvoice = {
                status: "pending",
                workflowStatus: "awaiting_in_person" as const,
                balanceRemaining: 15000,
                dueDate: "2099-01-01",
            };
            expect(getInvoiceDisplayStatus(cashInvoice)).toBe("awaiting_in_person");
        });
    });

    describe("getInvoiceStatus", () => {
        it("resolves to 'paid' when balanceRemaining <= 0", () => {
            const status = getInvoiceStatus({
                status: "pending",
                workflowStatus: "pending",
                dueDate: "2026-05-05",
                balanceRemaining: 0,
            });
            expect(status).toBe("paid");
        });

        it("preserves 'under_review' even when balanceRemaining is 0 during review", () => {
            const status = getInvoiceStatus({
                status: "pending",
                workflowStatus: "under_review",
                dueDate: "2026-05-05",
                balanceRemaining: 0,
            });
            expect(status).toBe("under_review");
        });
    });
});
