// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks (route-level tests)
// ---------------------------------------------------------------------------

const mockRequireAuthenticatedUser = vi.fn();
const adminTables: Record<string, { data?: unknown; error?: unknown }> = {};
const adminUpdates: Array<{ table: string; payload: unknown }> = [];

function makeQuery(table: string) {
    const result = () => adminTables[table] ?? { data: null, error: null };
    const query: any = {
        select: () => query,
        insert: () => query,
        update: (payload: unknown) => {
            adminUpdates.push({ table, payload });
            return query;
        },
        delete: () => query,
        eq: () => query,
        in: () => query,
        order: () => query,
        limit: () => query,
        contains: () => query,
        single: () => Promise.resolve(result()),
        maybeSingle: () => Promise.resolve(result()),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve),
    };
    return query;
}

const adminClient = {
    from: (table: string) => makeQuery(table),
    storage: { from: () => ({ upload: vi.fn(), getPublicUrl: () => ({ data: { publicUrl: "https://x/y.png" } }) }) },
};

vi.mock("@/lib/api/auth-guard", () => ({
    requireAuthenticatedUser: (...args: unknown[]) => mockRequireAuthenticatedUser(...args),
}));
vi.mock("@/lib/supabase/admin", () => ({
    createServiceRoleSupabaseClient: () => adminClient,
    createAdminClient: () => adminClient,
}));
vi.mock("@/lib/billing/workflow", () => ({
    expireInPersonIntents: vi.fn().mockResolvedValue(undefined),
    insertPaymentAuditEvent: vi.fn().mockResolvedValue(undefined),
    sendPaymentNotifications: vi.fn().mockResolvedValue(undefined),
    sendPaymentSystemMessage: vi.fn().mockResolvedValue(undefined),
    toWorkflowSnapshot: (p: unknown) => p,
    computeAmountTag: () => "exact",
    getInPersonIntentExpiry: () => new Date().toISOString(),
}));
vi.mock("@/lib/billing/server", () => ({
    upsertPaymentReceipt: vi.fn().mockResolvedValue({ receipt_number: "R-1" }),
    generateNextMonthInvoice: vi.fn().mockResolvedValue(null),
    generateMonthlyInvoices: vi.fn().mockResolvedValue({ created: 0, updated: 0, skipped: 0 }),
    listLandlordInvoices: vi.fn().mockResolvedValue({ invoices: [] }),
    createMultiMonthAdvancePayment: vi.fn().mockResolvedValue({ invoices: [] }),
}));
vi.mock("@/lib/billing/storage", () => ({
    BILLING_BUCKETS: { paymentProofs: "payment-proofs", readingProofs: "utility-reading-proofs", landlordQr: "landlord-payment-qr" },
    uploadBillingFile: vi.fn().mockResolvedValue({ path: "p", publicUrl: "https://x/p.png" }),
}));
vi.mock("@/lib/audit/audit-logger", () => ({ logUserActivity: vi.fn().mockResolvedValue(undefined) }));

import {
    advancePaymentSchema,
    applicationPaymentSubmitSchema,
    billingMonthRule,
    collectPaymentSchema,
    computeInvoiceTotal,
    currentReadingRule,
    expenseSchema,
    gcashNumberRule,
    invoiceGenerateSchema,
    invoiceReviewSchema,
    meterReadingRule,
    outstandingBalance,
    amountWithinBalanceRule,
    proofFileRule,
    refundInfoSchema,
    rejectionReasonRule,
    tenantPaymentIntentSchema,
    tenantPaymentSubmitSchema,
    utilityReadingBulkSchema,
    utilityReadingSchema,
    PROOF_LIMITS,
} from "@/lib/validation/schemas/billing.schema";
import { todayIsoDate } from "@/lib/validation/rules";

/** 4 KB buffer with a real PNG signature, so the server-side content sniff accepts it. */
const pngBytes = () => {
    const bytes = new Uint8Array(4096);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    return bytes;
};


const LEASE_ID = "11111111-1111-4111-8111-111111111111";
const INVOICE_ID = "22222222-2222-4222-8222-222222222222";
const ITEM_ID = "33333333-3333-4333-8333-333333333333";

function addDays(iso: string, days: number) {
    const date = new Date(`${iso}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

function issuesOf(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
    return Object.fromEntries((result.error?.issues ?? []).map((issue) => [issue.path.join("."), issue.message]));
}

// ---------------------------------------------------------------------------
// Pure rules
// ---------------------------------------------------------------------------

describe("billing rules", () => {
    it("meterReadingRule rejects negatives, NaN, and >2 decimals", () => {
        expect(meterReadingRule("12.5", { label: "Reading" })).toBeUndefined();
        expect(meterReadingRule("-1", { label: "Reading" })).toBe("Reading cannot be negative.");
        expect(meterReadingRule("abc", { label: "Reading" })).toBe("Reading must be a number.");
        expect(meterReadingRule("1.234", { label: "Reading" })).toMatch(/2 decimal/);
        expect(meterReadingRule("", { label: "Reading" })).toBe("Reading is required.");
    });

    it("currentReadingRule enforces current >= previous", () => {
        expect(currentReadingRule("100", 100)).toBeUndefined();
        expect(currentReadingRule("99.99", 100)).toBe("Current reading cannot be lower than the previous reading.");
        expect(currentReadingRule("", 100, { required: false })).toBeUndefined();
    });

    it("billingMonthRule accepts YYYY-MM and YYYY-MM-DD, rejects impossible months", () => {
        expect(billingMonthRule("2026-10")).toBeUndefined();
        expect(billingMonthRule("2026-10-01")).toBeUndefined();
        expect(billingMonthRule("2026-13")).toMatch(/valid month/);
        expect(billingMonthRule("2026-02-30")).toMatch(/valid month/);
        expect(billingMonthRule("", { required: true })).toBe("Billing month is required.");
    });

    it("gcashNumberRule accepts PH mobile formats only", () => {
        expect(gcashNumberRule("0917 123 4567")).toBeUndefined();
        expect(gcashNumberRule("+639171234567")).toBeUndefined();
        expect(gcashNumberRule("12345")).toMatch(/valid GCash number/);
        expect(gcashNumberRule("", { required: true })).toBe("GCash number is required.");
    });

    it("rejectionReasonRule requires a reason only when rejecting", () => {
        expect(rejectionReasonRule("  ", { required: true })).toBe("Rejection reason is required.");
        expect(rejectionReasonRule("", { required: false })).toBeUndefined();
        expect(rejectionReasonRule("x".repeat(501), { required: true })).toMatch(/cannot exceed 500/);
    });

    it("amountWithinBalanceRule blocks zero and overpayment", () => {
        expect(amountWithinBalanceRule("500", 1000)).toBeUndefined();
        expect(amountWithinBalanceRule("1000", 1000)).toBeUndefined();
        expect(amountWithinBalanceRule("1000.01", 1000)).toMatch(/cannot exceed the balance due/);
        expect(amountWithinBalanceRule("0", 1000)).toMatch(/greater than/);
        expect(amountWithinBalanceRule("10.555", 1000)).toMatch(/2 decimal/);
    });

    it("outstandingBalance falls back to amount - paid for legacy zero balances", () => {
        expect(outstandingBalance({ amount: 1000, paid_amount: 200, balance_remaining: 800 })).toBe(800);
        expect(outstandingBalance({ amount: 1000, paid_amount: 200, balance_remaining: 0 })).toBe(800);
        expect(outstandingBalance({ amount: 1000, paid_amount: 1000, balance_remaining: 0 })).toBe(0);
    });

    it("proofFileRule checks type and size", () => {
        const png = { size: 4096, type: "image/png" };
        expect(proofFileRule(png, { maxBytes: PROOF_LIMITS.paymentProofMaxBytes })).toBeUndefined();
        expect(proofFileRule(null, { required: true, maxBytes: 10 })).toBe("Payment proof is required.");
        expect(proofFileRule({ size: 4096, type: "application/pdf" }, { maxBytes: 99999 })).toMatch(/JPG, PNG/);
        expect(proofFileRule({ size: 4096, type: "application/pdf" }, { maxBytes: 99999, allowPdf: true })).toBeUndefined();
        expect(proofFileRule({ size: 4096, type: "text/html" }, { maxBytes: 99999, allowPdf: true })).toMatch(/must be a/);
        expect(proofFileRule({ size: 100, type: "image/png" }, { maxBytes: 99999, minBytes: 2048 })).toMatch(/unreadable/);
        expect(proofFileRule({ size: 9 * 1024 * 1024, type: "image/png" }, { maxBytes: 8 * 1024 * 1024 })).toMatch(/8 MB or smaller/);
    });

    it("computeInvoiceTotal recomputes and rounds to centavos", () => {
        expect(computeInvoiceTotal([{ amount: 0.1 }, { amount: 0.2 }])).toBe(0.3);
    });
});

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

describe("invoiceGenerateSchema", () => {
    const valid = {
        leaseId: LEASE_ID,
        billingMonth: "2026-10-01",
        dueDate: "2026-10-05",
        items: [{ label: "Monthly Base Rent", amount: 15000, category: "rent" }],
    };

    it("accepts a valid itemized invoice", () => {
        expect(invoiceGenerateSchema.safeParse(valid).success).toBe(true);
    });

    it("requires item descriptions and non-negative amounts with <= 2 decimals", () => {
        const result = invoiceGenerateSchema.safeParse({
            ...valid,
            items: [
                { label: "   ", amount: 100 },
                { label: "Water", amount: -5 },
                { label: "Power", amount: 1.234 },
            ],
        });
        expect(result.success).toBe(false);
        const issues = issuesOf(result as never);
        expect(issues["items.0.label"]).toBe("Item description is required.");
        expect(issues["items.1.amount"]).toBe("Item amount cannot be negative.");
        expect(issues["items.2.amount"]).toMatch(/2 decimal/);
    });

    it("rejects a zero total, an unknown category, an invalid due date and a non-UUID lease", () => {
        const zero = invoiceGenerateSchema.safeParse({ ...valid, items: [{ label: "Rent", amount: 0 }] });
        expect(issuesOf(zero as never).items).toBe("Invoice total must be greater than ₱0.");
        const category = invoiceGenerateSchema.safeParse({ ...valid, items: [{ label: "Rent", amount: 1, category: "bribe" }] });
        expect(category.success).toBe(false);
        expect(invoiceGenerateSchema.safeParse({ ...valid, dueDate: "2026-02-30" }).success).toBe(false);
        expect(invoiceGenerateSchema.safeParse({ ...valid, leaseId: "lease-1" }).success).toBe(false);
        expect(invoiceGenerateSchema.safeParse({ ...valid, billingMonth: "2026-13" }).success).toBe(false);
    });
});

describe("invoiceReviewSchema", () => {
    it("requires a rejection reason when rejecting or requesting completion", () => {
        const reject = invoiceReviewSchema.safeParse({ action: "reject" });
        expect(issuesOf(reject as never).rejectionReason).toBe("Rejection reason is required.");
        const viaResolution = invoiceReviewSchema.safeParse({ action: "confirm", nonExactAction: "request_completion", rejectionReason: "  " });
        expect(issuesOf(viaResolution as never).rejectionReason).toBe("Rejection reason is required.");
        expect(invoiceReviewSchema.safeParse({ action: "reject", rejectionReason: "Blurry receipt" }).success).toBe(true);
    });

    it("maps the modal's mismatchResolution / paymentDiscrepancyType aliases", () => {
        const result = invoiceReviewSchema.safeParse({
            action: "confirm",
            mismatchResolution: "accept_partial",
            paymentDiscrepancyType: "excessive_amount",
            shortfallAmount: -250.5,
        });
        expect(result.success).toBe(true);
        expect(result.data?.nonExactAction).toBe("accept_partial");
        expect(result.data?.issueType).toBe("excessive_amount");
        expect(result.data?.shortfallAmount).toBe(-250.5);
    });

    it("rejects tampered enums, non-positive accepted amounts and non-http refund URLs", () => {
        expect(invoiceReviewSchema.safeParse({ action: "approve_everything" }).success).toBe(false);
        expect(invoiceReviewSchema.safeParse({ action: "confirm", acceptedAmount: 0 }).success).toBe(false);
        expect(invoiceReviewSchema.safeParse({ action: "confirm", amountTag: "free" }).success).toBe(false);
        expect(invoiceReviewSchema.safeParse({ action: "confirm", refundProofUrl: "javascript:alert(1)" }).success).toBe(false);
    });
});

describe("collectPaymentSchema", () => {
    it("validates amount, method enum and date received", () => {
        expect(collectPaymentSchema.safeParse({ invoiceId: INVOICE_ID, amount: "1,500.50", method: "cash" }).data?.amount).toBe(1500.5);
        expect(collectPaymentSchema.safeParse({ invoiceId: INVOICE_ID, amount: 0 }).success).toBe(false);
        expect(collectPaymentSchema.safeParse({ invoiceId: INVOICE_ID, amount: 10, method: "credit_card" }).success).toBe(false);
        const future = collectPaymentSchema.safeParse({ invoiceId: INVOICE_ID, amount: 10, paymentDate: addDays(todayIsoDate(), 2) });
        expect(issuesOf(future as never).paymentDate).toBe("Date received cannot be in the future.");
        expect(collectPaymentSchema.safeParse({ invoiceId: INVOICE_ID, amount: 10, paymentDate: "2026-02-30" }).success).toBe(false);
        expect(collectPaymentSchema.safeParse({ invoiceId: INVOICE_ID, amount: 10, referenceNumber: "x".repeat(101) }).success).toBe(false);
    });
});

describe("tenant payment schemas", () => {
    it("submit: requires GCash, a trimmed reference and well-formed id lists", () => {
        const ok = tenantPaymentSubmitSchema.safeParse({
            method: "gcash",
            referenceNumber: "  1002938410291 ",
            partialAmount: "",
            selectedItemIds: JSON.stringify([ITEM_ID, ITEM_ID]),
        });
        expect(ok.success).toBe(true);
        expect(ok.data?.referenceNumber).toBe("1002938410291");
        expect(ok.data?.partialAmount).toBeUndefined();
        expect(ok.data?.selectedItemIds).toEqual([ITEM_ID]);

        expect(issuesOf(tenantPaymentSubmitSchema.safeParse({ method: "cash", referenceNumber: "1" }) as never).method).toMatch(/in-person intent/);
        expect(issuesOf(tenantPaymentSubmitSchema.safeParse({ method: "gcash", referenceNumber: "   " }) as never).referenceNumber).toBe(
            "Reference number is required for GCash submissions.",
        );
        expect(tenantPaymentSubmitSchema.safeParse({ method: "gcash", referenceNumber: "1", selectedItemIds: "{not json" }).success).toBe(false);
        expect(tenantPaymentSubmitSchema.safeParse({ method: "gcash", referenceNumber: "1", selectedItemIds: '["drop table"]' }).success).toBe(false);
        expect(tenantPaymentSubmitSchema.safeParse({ method: "gcash", referenceNumber: "1", partialAmount: "-5" }).success).toBe(false);
    });

    it("intent: only UUID lists", () => {
        expect(tenantPaymentIntentSchema.safeParse({ selectedItemIds: [ITEM_ID] }).success).toBe(true);
        expect(tenantPaymentIntentSchema.safeParse({ selectedItemIds: ["1"] }).success).toBe(false);
    });

    it("advance: month and count bounds", () => {
        expect(advancePaymentSchema.safeParse({ targetMonth: "2026-11", monthsCount: 3 }).success).toBe(true);
        expect(advancePaymentSchema.safeParse({ targetMonth: "2026-13" }).success).toBe(false);
        expect(advancePaymentSchema.safeParse({ monthsCount: 13 }).success).toBe(false);
        expect(advancePaymentSchema.safeParse({ monthsCount: 1.5 }).success).toBe(false);
    });

    it("refund info: action enum and GCash number format", () => {
        expect(refundInfoSchema.safeParse({ action: "refund", gcashNumber: "0917-123-4567" }).data?.gcashNumber).toBe("09171234567");
        expect(refundInfoSchema.safeParse({ action: "steal" }).success).toBe(false);
        expect(refundInfoSchema.safeParse({ action: "refund", gcashNumber: "abc" }).success).toBe(false);
        expect(refundInfoSchema.safeParse({ action: "credit", gcashNumber: null }).success).toBe(true);
    });

    it("application payment: method enum and GCash reference", () => {
        expect(applicationPaymentSubmitSchema.safeParse({ method: " GCash ", referenceNumber: "123" }).data?.method).toBe("gcash");
        expect(applicationPaymentSubmitSchema.safeParse({ method: "bitcoin" }).success).toBe(false);
        expect(issuesOf(applicationPaymentSubmitSchema.safeParse({ method: "gcash" }) as never).referenceNumber).toMatch(/required/);
        expect(applicationPaymentSubmitSchema.safeParse({ method: "cash", paymentRequestId: "not-a-uuid" }).success).toBe(false);
        expect(applicationPaymentSubmitSchema.safeParse({ method: "cash" }).data?.paymentRequestId).toBe("all");
    });
});

describe("utility reading schemas", () => {
    const valid = {
        leaseId: LEASE_ID,
        utilityType: "water",
        billingPeriodStart: "2026-10-01",
        billingPeriodEnd: "2026-10-31",
        previousReading: 100,
        currentReading: "125.5",
    };

    it("accepts a valid reading (strings coerced)", () => {
        const result = utilityReadingSchema.safeParse(valid);
        expect(result.success).toBe(true);
        expect(result.data?.currentReading).toBe(125.5);
    });

    it("enforces current >= previous and period end >= start", () => {
        const result = utilityReadingSchema.safeParse({ ...valid, currentReading: 99, billingPeriodEnd: "2026-09-30" });
        const issues = issuesOf(result as never);
        expect(issues.currentReading).toBe("Current reading cannot be lower than the previous reading.");
        expect(issues.billingPeriodEnd).toMatch(/on or after the billing period start/);
    });

    it("rejects tampered utility types, NaN and invalid dates", () => {
        expect(utilityReadingSchema.safeParse({ ...valid, utilityType: "gas" }).success).toBe(false);
        expect(utilityReadingSchema.safeParse({ ...valid, currentReading: "NaN" }).success).toBe(false);
        expect(utilityReadingSchema.safeParse({ ...valid, billingPeriodStart: "2026-02-30" }).success).toBe(false);
    });

    it("bulk: reports the failing row path", () => {
        const result = utilityReadingBulkSchema.safeParse({ readings: [valid, { ...valid, currentReading: -1 }] });
        expect(Object.keys(issuesOf(result as never))).toContain("readings.1.currentReading");
        expect(utilityReadingBulkSchema.safeParse({ readings: [] }).success).toBe(false);
    });
});

describe("expenseSchema", () => {
    const valid = { category: "maintenance", amount: 1500, date_incurred: todayIsoDate(), description: "Fixed faucet" };

    it("accepts a valid expense and normalizes 'all' property to null", () => {
        const result = expenseSchema.safeParse({ ...valid, propertyId: "all" });
        expect(result.success).toBe(true);
        expect(result.data?.propertyId).toBeNull();
    });

    it("rejects zero amounts, unknown categories, future dates and blank descriptions", () => {
        expect(issuesOf(expenseSchema.safeParse({ ...valid, amount: 0 }) as never).amount).toMatch(/greater than/);
        expect(expenseSchema.safeParse({ ...valid, category: "salary" }).success).toBe(false);
        expect(issuesOf(expenseSchema.safeParse({ ...valid, date_incurred: addDays(todayIsoDate(), 1) }) as never).date_incurred).toBe(
            "Date incurred cannot be in the future.",
        );
        expect(issuesOf(expenseSchema.safeParse({ ...valid, description: "   " }) as never).description).toBe("Description is required.");
        expect(expenseSchema.safeParse({ ...valid, propertyId: "prop-1" }).success).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Route handlers: malformed input must be a 400/404/409, never a 500
// ---------------------------------------------------------------------------

const jsonRequest = (url: string, body: unknown) =>
    new Request(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });

const params = <T extends Record<string, string>>(value: T) => ({ params: Promise.resolve(value) });

describe("money routes reject bad input", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        for (const key of Object.keys(adminTables)) delete adminTables[key];
        adminUpdates.length = 0;
        mockRequireAuthenticatedUser.mockResolvedValue({ userId: "landlord-1", userRole: "landlord", supabase: adminClient });
    });

    it("POST /api/landlord/utility-readings: bad reading is a 400 with fieldErrors (was a thrown parse)", async () => {
        const { POST } = await import("@/app/api/landlord/utility-readings/route");
        const res = await POST(
            jsonRequest("http://localhost/api/landlord/utility-readings", {
                leaseId: LEASE_ID,
                utilityType: "water",
                billingPeriodStart: "2026-10-01",
                billingPeriodEnd: "2026-10-31",
                previousReading: 100,
                currentReading: 50,
            }),
        );
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toBe("Current reading cannot be lower than the previous reading.");
        expect(body.fieldErrors.currentReading).toBeDefined();
    });

    it("POST /api/landlord/utility-readings: malformed JSON and bad month are 400", async () => {
        const { POST } = await import("@/app/api/landlord/utility-readings/route");
        expect((await POST(jsonRequest("http://localhost/api/landlord/utility-readings", "{oops"))).status).toBe(400);
        const bulk = await POST(jsonRequest("http://localhost/api/landlord/utility-readings", { readings: [{}], month: "2026-13" }));
        expect(bulk.status).toBe(400);
    });

    it("POST /api/landlord/expenses: future date / bad category are 400", async () => {
        const { POST } = await import("@/app/api/landlord/expenses/route");
        const res = await POST(
            jsonRequest("http://localhost/api/landlord/expenses", {
                category: "salary",
                amount: "abc",
                date_incurred: addDays(todayIsoDate(), 3),
                description: " ",
            }),
        );
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(Object.keys(body.fieldErrors)).toEqual(expect.arrayContaining(["category", "amount", "date_incurred", "description"]));
    });

    it("POST /api/landlord/payments/collect: amount above the balance is 400; settled invoice is 409", async () => {
        const { POST } = await import("@/app/api/landlord/payments/collect/route");
        adminTables.payments = {
            data: { id: INVOICE_ID, amount: 1000, paid_amount: 400, balance_remaining: 600, status: "pending", workflow_status: "pending", landlord_id: "landlord-1", tenant_id: "t-1" },
            error: null,
        };
        const over = await POST(jsonRequest("http://localhost/api/landlord/payments/collect", { invoiceId: INVOICE_ID, amount: 600.01 }));
        expect(over.status).toBe(400);
        expect((await over.json()).fieldErrors.amount).toMatch(/cannot exceed the balance due/);
        expect(adminUpdates).toHaveLength(0);

        adminTables.payments = {
            data: { id: INVOICE_ID, amount: 1000, paid_amount: 1000, balance_remaining: 0, status: "completed", workflow_status: "receipted" },
            error: null,
        };
        const settled = await POST(jsonRequest("http://localhost/api/landlord/payments/collect", { invoiceId: INVOICE_ID, amount: 10 }));
        expect(settled.status).toBe(409);
    });

    it("POST /api/landlord/invoices: zero-total itemized invoice and bad lease id are 400", async () => {
        const { POST } = await import("@/app/api/landlord/invoices/route");
        const res = await POST(
            jsonRequest("http://localhost/api/landlord/invoices", { leaseId: LEASE_ID, items: [{ label: "Rent", amount: 0 }] }),
        );
        expect(res.status).toBe(400);
        expect((await res.json()).error).toBe("Invoice total must be greater than ₱0.");
        const bad = await POST(jsonRequest("http://localhost/api/landlord/invoices", { leaseIds: ["x"] }));
        expect(bad.status).toBe(400);
    });

    it("POST /api/landlord/invoices/[id]/review: JSON reject without reason is 400; malformed multipart json is 400; bad id is 404", async () => {
        const { POST } = await import("@/app/api/landlord/invoices/[id]/review/route");
        const res = await POST(jsonRequest(`http://localhost/api/landlord/invoices/${INVOICE_ID}/review`, { action: "reject" }), params({ id: INVOICE_ID }));
        expect(res.status).toBe(400);
        expect((await res.json()).fieldErrors.rejectionReason).toBe("Rejection reason is required.");

        const form = new FormData();
        form.append("json", "{not json");
        const malformed = await POST(new Request(`http://localhost/api/landlord/invoices/${INVOICE_ID}/review`, { method: "POST", body: form }), params({ id: INVOICE_ID }));
        expect(malformed.status).toBe(400);

        const badId = await POST(jsonRequest("http://localhost/api/landlord/invoices/abc/review", { action: "confirm" }), params({ id: "abc" }));
        expect(badId.status).toBe(404);
    });

    it("POST /api/landlord/invoices/[id]/review: a receipted invoice cannot be rejected", async () => {
        const { POST } = await import("@/app/api/landlord/invoices/[id]/review/route");
        adminTables.payment_workflow_audit_events = { data: null, error: null };
        adminTables.payments = {
            data: { id: INVOICE_ID, amount: 1000, paid_amount: 1000, balance_remaining: 0, workflow_status: "receipted", status: "completed", metadata: {} },
            error: null,
        };
        const res = await POST(
            jsonRequest(`http://localhost/api/landlord/invoices/${INVOICE_ID}/review`, { action: "reject", rejectionReason: "Fake" }),
            params({ id: INVOICE_ID }),
        );
        expect(res.status).toBe(409);
        expect(adminUpdates).toHaveLength(0);
    });

    it("POST /api/tenant/payments/[id]/submit: malformed ids / wrong proof type are 400; second submit while under review is 409", async () => {
        const { POST } = await import("@/app/api/tenant/payments/[id]/submit/route");
        mockRequireAuthenticatedUser.mockResolvedValue({ userId: "tenant-1", userRole: "tenant", supabase: adminClient });
        const image = new File([pngBytes()], "proof.png", { type: "image/png" });

        const build = (overrides: Record<string, string | File> = {}) => {
            const form = new FormData();
            const fields: Record<string, string | File> = { method: "gcash", referenceNumber: "1002938410291", receipt: image, ...overrides };
            for (const [key, value] of Object.entries(fields)) form.append(key, value);
            return new Request(`http://localhost/api/tenant/payments/${INVOICE_ID}/submit`, { method: "POST", body: form });
        };

        expect((await POST(build({ selectedItemIds: "{bad" }), params({ id: INVOICE_ID }))).status).toBe(400);
        const pdf = new File([new Uint8Array(4096)], "proof.pdf", { type: "application/pdf" });
        expect((await POST(build({ receipt: pdf }), params({ id: INVOICE_ID }))).status).toBe(400);
        const renamed = new File([new TextEncoder().encode("<script>alert(1)</script>".padEnd(4096, " "))], "proof.png", { type: "image/png" });
        const renamedRes = await POST(build({ receipt: renamed }), params({ id: INVOICE_ID }));
        expect(renamedRes.status).toBe(400);
        expect((await renamedRes.json()).error).toMatch(/could not be read as a valid image/);

        adminTables.payments = {
            data: { id: INVOICE_ID, tenant_id: "tenant-1", amount: 1000, paid_amount: 1000, balance_remaining: 0, workflow_status: "under_review", reference_number: "OTHER", payment_proof_url: "https://x" },
            error: null,
        };
        const duplicate = await POST(build(), params({ id: INVOICE_ID }));
        expect(duplicate.status).toBe(409);
        expect(adminUpdates).toHaveLength(0);
    });

    it("POST /api/tenant/payments/[id]/submit: amount above the balance is 400", async () => {
        const { POST } = await import("@/app/api/tenant/payments/[id]/submit/route");
        mockRequireAuthenticatedUser.mockResolvedValue({ userId: "tenant-1", userRole: "tenant", supabase: adminClient });
        adminTables.payments = {
            data: { id: INVOICE_ID, tenant_id: "tenant-1", amount: 1000, paid_amount: 0, balance_remaining: 1000, allow_partial_payments: true, workflow_status: "pending" },
            error: null,
        };
        const form = new FormData();
        form.append("method", "gcash");
        form.append("referenceNumber", "123");
        form.append("partialAmount", "1500");
        form.append("receipt", new File([pngBytes()], "proof.png", { type: "image/png" }));
        const res = await POST(new Request(`http://localhost/api/tenant/payments/${INVOICE_ID}/submit`, { method: "POST", body: form }), params({ id: INVOICE_ID }));
        expect(res.status).toBe(400);
        expect((await res.json()).fieldErrors.partialAmount).toMatch(/cannot exceed/);
    });

    it("POST /api/tenant/payments/advance: out-of-range months is 400 and errors never leak stacks", async () => {
        const { POST } = await import("@/app/api/tenant/payments/advance/route");
        mockRequireAuthenticatedUser.mockResolvedValue({ userId: "tenant-1", userRole: "tenant", supabase: adminClient });
        const res = await POST(jsonRequest("http://localhost/api/tenant/payments/advance", { monthsCount: 24 }));
        expect(res.status).toBe(400);

        const server = await import("@/lib/billing/server");
        vi.mocked(server.createMultiMonthAdvancePayment).mockRejectedValueOnce(new Error("relation does not exist"));
        const failed = await POST(new Request("http://localhost/api/tenant/payments/advance", { method: "POST" }));
        expect(failed.status).toBe(500);
        const body = await failed.json();
        expect(body.error).toBe("Failed to create advance payment");
        expect(body.stack).toBeUndefined();
    });

    it("POST /api/cron/monthly-invoices: invalid month is 400", async () => {
        const { POST } = await import("@/app/api/cron/monthly-invoices/route");
        const res = await POST(new Request("http://localhost/api/cron/monthly-invoices?month=2026-13", { method: "POST" }));
        expect(res.status).toBe(400);
    });
});
