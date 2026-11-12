import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRequireAuthenticatedUser = vi.fn();
const mockVerifyLandlordLeaseOwnership = vi.fn();
const mockGetLeaseInvoiceContext = vi.fn();
const mockRecordUtilityReading = vi.fn();
const mockGetOrCreateDirectConversation = vi.fn();

vi.mock("@/lib/api/auth-guard", () => ({
  requireAuthenticatedUser: (...args: unknown[]) => mockRequireAuthenticatedUser(...args),
}));

vi.mock("@/lib/services/iris", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/services/iris")>();
  return {
    ...actual,
    IrisOperationsService: {
      ...actual.IrisOperationsService,
      verifyLandlordLeaseOwnership: (...args: unknown[]) =>
        mockVerifyLandlordLeaseOwnership(...args),
      getLeaseInvoiceContext: (...args: unknown[]) => mockGetLeaseInvoiceContext(...args),
    },
  };
});

vi.mock("@/lib/billing/server", () => ({
  recordUtilityReading: (...args: unknown[]) => mockRecordUtilityReading(...args),
}));

vi.mock("@/lib/billing/workflow", () => ({
  getOrCreateDirectConversation: (...args: unknown[]) =>
    mockGetOrCreateDirectConversation(...args),
}));

import { POST } from "@/app/api/landlord/iris/invoices/commit/route";
import type { InvoiceBuildContext } from "@/lib/services/iris";

describe("Iris Invoice Commit API (/api/landlord/iris/invoices/commit)", () => {
  let mockSupabase: any;
  let mockPayments: any[];
  let mockPaymentItems: any[];
  let mockNotifications: any[];
  let mockMessages: any[];
  let mockUtilityReadings: any[];

  const baseContext: InvoiceBuildContext = {
    leaseId: "lease-101",
    tenantId: "tenant-101",
    tenantName: "Juan Dela Cruz",
    unitId: "unit-101",
    unitName: "101",
    propertyId: "prop-1",
    propertyName: "Sunset Apartments",
    monthlyRent: 15000,
    billingMonth: "2026-11",
    dueDate: "2026-11-20",
    water: {
      billingMode: "tenant_paid",
      ratePerUnit: 50,
      previousReading: 100,
      currentReading: 120,
    },
    electricity: {
      billingMode: "tenant_paid",
      ratePerUnit: 12,
      previousReading: 400,
      currentReading: 450,
    },
    customItems: [{ id: "c1", label: "Parking", amount: 1000, category: "other" }],
    notes: "Official November Statement",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPayments = [];
    mockPaymentItems = [];
    mockNotifications = [];
    mockMessages = [];
    mockUtilityReadings = [];

    mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        const queryState: any = {
          filters: {},
        };

        const builder: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((col: string, val: any) => {
            queryState.filters[col] = val;
            return builder;
          }),
          delete: vi.fn().mockReturnThis(),
          update: vi.fn().mockImplementation((updates: any) => {
            return {
              eq: vi.fn().mockResolvedValue({ data: updates, error: null }),
            };
          }),
          insert: vi.fn().mockImplementation((payload: any) => {
            const records = Array.isArray(payload) ? payload : [payload];
            if (table === "payments") {
              const inserted = {
                id: "pay-new-123",
                invoice_number: records[0].invoice_number || "INV-202611-0001",
                ...records[0],
              };
              mockPayments.push(inserted);
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: inserted, error: null }),
                }),
              };
            }
            if (table === "payment_items") {
              mockPaymentItems.push(...records);
              return Promise.resolve({ data: records, error: null });
            }
            if (table === "notifications") {
              mockNotifications.push(...records);
              return Promise.resolve({ data: records, error: null });
            }
            if (table === "messages") {
              const inserted = { id: "msg-123", ...records[0] };
              mockMessages.push(inserted);
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: inserted, error: null }),
                }),
              };
            }
            if (table === "utility_readings") {
              mockUtilityReadings.push(...records);
              return Promise.resolve({ data: records, error: null });
            }
            return Promise.resolve({ data: records, error: null });
          }),
          maybeSingle: vi.fn().mockImplementation(() => {
            if (table === "payments") {
              const found = mockPayments.find(
                (p) =>
                  p.lease_id === queryState.filters.lease_id &&
                  p.billing_cycle === queryState.filters.billing_cycle
              );
              return Promise.resolve({ data: found || null, error: null });
            }
            if (table === "leases") {
              return Promise.resolve({
                data: { terms: { dueDay: 5, lateFeeAmount: 500, allowPartialPayments: true } },
                error: null,
              });
            }
            return Promise.resolve({ data: null, error: null });
          }),
          single: vi.fn().mockImplementation(() => {
            return Promise.resolve({ data: null, error: null });
          }),
        };

        return builder;
      }),
    };

    mockRequireAuthenticatedUser.mockResolvedValue({
      userId: "landlord-1",
      userRole: "landlord",
      supabase: mockSupabase,
    });

    mockVerifyLandlordLeaseOwnership.mockResolvedValue(true);
    mockGetLeaseInvoiceContext.mockResolvedValue(baseContext);
    mockRecordUtilityReading.mockResolvedValue({ id: "util-reading-1" });
    mockGetOrCreateDirectConversation.mockResolvedValue("conv-direct-101");
  });

  it("rejects unauthenticated requests", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    );

    const req = new Request("http://localhost:3000/api/landlord/iris/invoices/commit", {
      method: "POST",
      body: JSON.stringify({ leaseId: "lease-101" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("rejects non-landlord users with 403", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      userId: "tenant-1",
      userRole: "tenant",
      supabase: mockSupabase,
    });

    const req = new Request("http://localhost:3000/api/landlord/iris/invoices/commit", {
      method: "POST",
      body: JSON.stringify({ leaseId: "lease-101" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Landlord role required");
  });

  it("returns 400 when leaseId is missing", async () => {
    const req = new Request("http://localhost:3000/api/landlord/iris/invoices/commit", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("leaseId is required");
  });

  it("returns 404 when lease does not belong to landlord", async () => {
    mockVerifyLandlordLeaseOwnership.mockResolvedValue(false);

    const req = new Request("http://localhost:3000/api/landlord/iris/invoices/commit", {
      method: "POST",
      body: JSON.stringify({ leaseId: "lease-unknown" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toContain("Lease not found or unauthorized");
  });

  it("returns 409 when invoice for the billing month already exists", async () => {
    // Add existing payment for same cycle
    mockPayments.push({
      id: "pay-existing",
      lease_id: "lease-101",
      billing_cycle: "2026-11-01",
    });

    const req = new Request("http://localhost:3000/api/landlord/iris/invoices/commit", {
      method: "POST",
      body: JSON.stringify({ context: baseContext }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain("already exists");
  });

  it("returns 400 on meter reading regression without meter reset", async () => {
    const invalidContext: InvoiceBuildContext = {
      ...baseContext,
      water: {
        billingMode: "tenant_paid",
        ratePerUnit: 50,
        previousReading: 100,
        currentReading: 80, // Regression!
        allowMeterReset: false,
      },
    };

    const req = new Request("http://localhost:3000/api/landlord/iris/invoices/commit", {
      method: "POST",
      body: JSON.stringify({ context: invalidContext }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Water reading error");
  });

  it("successfully commits invoice, writes payments, items, readings, notification, and chat message", async () => {
    const req = new Request("http://localhost:3000/api/landlord/iris/invoices/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: baseContext,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.invoiceId).toBe("pay-new-123");
    expect(json.conversationId).toBe("conv-direct-101");
    expect(json.messageId).toBe("msg-123");
    // Totals: Rent 15000 + Water (20 * 50 = 1000) + Elec (50 * 12 = 600) + Custom 1000 = 17600
    expect(json.totalAmount).toBe(17600);

    // Verify payment was inserted
    expect(mockPayments.length).toBe(1);
    expect(mockPayments[0].amount).toBe(17600);
    expect(mockPayments[0].lease_id).toBe("lease-101");

    // Verify line items inserted
    expect(mockPaymentItems.length).toBe(4); // Rent, Water, Elec, Parking

    // Verify tenant notification was created
    expect(mockNotifications.length).toBe(1);
    expect(mockNotifications[0].user_id).toBe("tenant-101");
    expect(mockNotifications[0].title).toBe("New Invoice Issued");

    // Verify system chat message was dispatched
    expect(mockMessages.length).toBe(1);
    expect(mockMessages[0].conversation_id).toBe("conv-direct-101");
    expect(mockMessages[0].type).toBe("system");
    expect(mockMessages[0].content).toContain("Official Invoice #");
    expect(mockMessages[0].content).toContain("17,600.00");
    expect(mockMessages[0].metadata.systemType).toBe("invoice");
  });
});
