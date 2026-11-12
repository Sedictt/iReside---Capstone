import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// API Route Handlers
import { GET as contextRoute } from "@/app/api/landlord/iris/context/route";
import { POST as invoiceDraftRoute } from "@/app/api/landlord/iris/invoice-draft/route";
import { POST as quickSettleRoute } from "@/app/api/landlord/iris/payments/quick-settle/route";
import { POST as quickUpdateRoute } from "@/app/api/landlord/iris/maintenance/quick-update/route";
import { POST as renewalOfferRoute } from "@/app/api/landlord/iris/leases/renewal-offer/route";
import { POST as broadcastRoute } from "@/app/api/landlord/iris/broadcast/route";
import { POST as commitRoute } from "@/app/api/landlord/iris/invoices/commit/route";

// Auth Guard & Services
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import {
  IrisOperationsService,
  recordQuickSettlement,
  updateMaintenanceTicketStatus,
  validateReadingDelta,
  calculateUtilityCharge,
  buildDraftInvoiceItems,
  roundCentavos,
  formatPhpCurrency,
  sanitizeTemplateInput,
  renderTemplate,
  QuickSettlementInputSchema,
  type ActiveLeaseSummary,
  type MaintenanceTicketSummary,
  type InvoiceBuildContext,
  type CustomItem,
  type QuickSettlementInput,
} from "@/lib/services/iris";

// Mock Auth Guard
vi.mock("@/lib/api/auth-guard", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

describe("Milestone 5: Adversarial Hardening & Stress-Testing Suite", () => {
  const mockLandlordSupabase = (overrides?: Partial<any>) => ({
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
      ...overrides?.[table],
    })),
    ...overrides,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Cross-Tenant IDOR and Authorization Guards
  // =========================================================================
  describe("1. Cross-Tenant IDOR and Authorization Guards", () => {
    describe("1.1 Unauthenticated Requests (401 Unauthorized)", () => {
      beforeEach(() => {
        vi.mocked(requireAuthenticatedUser).mockResolvedValue(
          NextResponse.json({ error: "Unauthorized" }, { status: 401 }) as any
        );
      });

      it("rejects unauthenticated GET /api/landlord/iris/context with 401", async () => {
        const req = new Request("http://localhost:3000/api/landlord/iris/context");
        const res = await contextRoute(req);
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.error).toBe("Unauthorized");
      });

      it("rejects unauthenticated POST /api/landlord/iris/invoice-draft with 401", async () => {
        const req = new Request("http://localhost:3000/api/landlord/iris/invoice-draft", {
          method: "POST",
          body: JSON.stringify({ leaseId: "lease-123" }),
        });
        const res = await invoiceDraftRoute(req);
        expect(res.status).toBe(401);
      });

      it("rejects unauthenticated POST /api/landlord/iris/payments/quick-settle with 401", async () => {
        const req = new Request(
          "http://localhost:3000/api/landlord/iris/payments/quick-settle",
          {
            method: "POST",
            body: JSON.stringify({
              invoiceId: "inv-123",
              amount: 5000,
              method: "cash",
              paymentDate: "2026-11-12",
            }),
          }
        );
        const res = await quickSettleRoute(req);
        expect(res.status).toBe(401);
      });

      it("rejects unauthenticated POST /api/landlord/iris/maintenance/quick-update with 401", async () => {
        const req = new Request(
          "http://localhost:3000/api/landlord/iris/maintenance/quick-update",
          {
            method: "POST",
            body: JSON.stringify({ ticketId: "ticket-123", status: "in_progress" }),
          }
        );
        const res = await quickUpdateRoute(req);
        expect(res.status).toBe(401);
      });

      it("rejects unauthenticated POST /api/landlord/iris/leases/renewal-offer with 401", async () => {
        const req = new Request(
          "http://localhost:3000/api/landlord/iris/leases/renewal-offer",
          {
            method: "POST",
            body: JSON.stringify({
              leaseId: "lease-123",
              proposedRent: 15000,
              renewalTermMonths: 12,
            }),
          }
        );
        const res = await renewalOfferRoute(req);
        expect(res.status).toBe(401);
      });

      it("rejects unauthenticated POST /api/landlord/iris/broadcast with 401", async () => {
        const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
          method: "POST",
          body: JSON.stringify({
            filterType: "all_active_tenants",
            templateKey: "general_notice",
            channels: { inAppNotification: true },
          }),
        });
        const res = await broadcastRoute(req);
        expect(res.status).toBe(401);
      });

      it("rejects unauthenticated POST /api/landlord/iris/invoices/commit with 401", async () => {
        const req = new Request(
          "http://localhost:3000/api/landlord/iris/invoices/commit",
          {
            method: "POST",
            body: JSON.stringify({ leaseId: "lease-123" }),
          }
        );
        const res = await commitRoute(req);
        expect(res.status).toBe(401);
      });
    });

    describe("1.2 Tenant-Role Callers Blocked (403 Forbidden)", () => {
      beforeEach(() => {
        vi.mocked(requireAuthenticatedUser).mockResolvedValue({
          userId: "tenant-attacker-id",
          userEmail: "tenant@attacker.com",
          userRole: "tenant",
          supabase: mockLandlordSupabase(),
        } as any);
      });

      it("blocks tenant from GET /api/landlord/iris/context with 403", async () => {
        const req = new Request("http://localhost:3000/api/landlord/iris/context");
        const res = await contextRoute(req);
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error).toMatch(/landlord role required/i);
      });

      it("blocks tenant from POST /api/landlord/iris/invoice-draft with 403", async () => {
        const req = new Request("http://localhost:3000/api/landlord/iris/invoice-draft", {
          method: "POST",
          body: JSON.stringify({ leaseId: "lease-123" }),
        });
        const res = await invoiceDraftRoute(req);
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error).toMatch(/landlord role required/i);
      });

      it("blocks tenant from POST /api/landlord/iris/payments/quick-settle with 403", async () => {
        const req = new Request(
          "http://localhost:3000/api/landlord/iris/payments/quick-settle",
          {
            method: "POST",
            body: JSON.stringify({
              invoiceId: "inv-123",
              amount: 5000,
              method: "cash",
              paymentDate: "2026-11-12",
            }),
          }
        );
        const res = await quickSettleRoute(req);
        expect(res.status).toBe(403);
      });

      it("blocks tenant from POST /api/landlord/iris/maintenance/quick-update with 403", async () => {
        const req = new Request(
          "http://localhost:3000/api/landlord/iris/maintenance/quick-update",
          {
            method: "POST",
            body: JSON.stringify({ ticketId: "ticket-123", status: "resolved" }),
          }
        );
        const res = await quickUpdateRoute(req);
        expect(res.status).toBe(403);
      });

      it("blocks tenant from POST /api/landlord/iris/leases/renewal-offer with 403", async () => {
        const req = new Request(
          "http://localhost:3000/api/landlord/iris/leases/renewal-offer",
          {
            method: "POST",
            body: JSON.stringify({
              leaseId: "lease-123",
              proposedRent: 15000,
              renewalTermMonths: 12,
            }),
          }
        );
        const res = await renewalOfferRoute(req);
        expect(res.status).toBe(403);
      });

      it("blocks tenant from POST /api/landlord/iris/broadcast with 403", async () => {
        const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
          method: "POST",
          body: JSON.stringify({
            filterType: "all_active_tenants",
            templateKey: "general_notice",
            channels: { inAppNotification: true },
          }),
        });
        const res = await broadcastRoute(req);
        expect(res.status).toBe(403);
      });

      it("blocks tenant from POST /api/landlord/iris/invoices/commit with 403", async () => {
        const req = new Request(
          "http://localhost:3000/api/landlord/iris/invoices/commit",
          {
            method: "POST",
            body: JSON.stringify({ leaseId: "lease-123" }),
          }
        );
        const res = await commitRoute(req);
        expect(res.status).toBe(403);
      });
    });

    describe("1.3 Cross-Landlord IDOR Protections (Landlord A attacking Landlord B)", () => {
      const landlordAId = "landlord-alpha-uuid";
      let mockSupabase: any;

      beforeEach(() => {
        mockSupabase = mockLandlordSupabase();
        vi.mocked(requireAuthenticatedUser).mockResolvedValue({
          userId: landlordAId,
          userEmail: "landlord-a@test.com",
          userRole: "landlord",
          supabase: mockSupabase,
        } as any);
      });

      it("blocks Landlord A from accessing Landlord B's property operational context (404 Not Found)", async () => {
        // Landlord A tries to probe Landlord B's propertyId "prop-victim-b"
        vi.spyOn(
          IrisOperationsService,
          "verifyLandlordPropertyOwnership"
        ).mockResolvedValue(false);

        const req = new Request(
          "http://localhost:3000/api/landlord/iris/context?propertyId=prop-victim-b"
        );
        const res = await contextRoute(req);
        expect(res.status).toBe(404);
        const json = await res.json();
        expect(json.error).toMatch(/property not found or unauthorized/i);
      });

      it("blocks Landlord A from drafting invoices for Landlord B's lease (404 Not Found)", async () => {
        vi.spyOn(
          IrisOperationsService,
          "verifyLandlordLeaseOwnership"
        ).mockResolvedValue(false);

        const req = new Request(
          "http://localhost:3000/api/landlord/iris/invoice-draft",
          {
            method: "POST",
            body: JSON.stringify({ leaseId: "lease-victim-b" }),
          }
        );
        const res = await invoiceDraftRoute(req);
        expect(res.status).toBe(404);
        const json = await res.json();
        expect(json.error).toMatch(/lease not found or unauthorized/i);
      });

      it("blocks Landlord A from settling payments on Landlord B's invoice (403 Forbidden)", async () => {
        // Invoice exists in database, but its lease belongs to Landlord B
        mockSupabase.from = vi.fn((table: string) => {
          if (table === "payments") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "inv-victim-b",
                  lease_id: "lease-victim-b",
                  tenant_id: "tenant-b",
                  landlord_id: "landlord-b",
                  amount: 15000,
                  paid_amount: 0,
                  balance_remaining: 15000,
                  status: "pending",
                },
                error: null,
              }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        // verifyLandlordLeaseOwnership returns false because Landlord A does not own lease-victim-b
        vi.spyOn(
          IrisOperationsService,
          "verifyLandlordLeaseOwnership"
        ).mockResolvedValue(false);

        const req = new Request(
          "http://localhost:3000/api/landlord/iris/payments/quick-settle",
          {
            method: "POST",
            body: JSON.stringify({
              invoiceId: "inv-victim-b",
              amount: 15000,
              method: "cash",
              paymentDate: "2026-11-12",
            }),
          }
        );
        const res = await quickSettleRoute(req);
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error).toMatch(/lease does not belong to landlord/i);
      });

      it("blocks Landlord A from updating maintenance ticket of Landlord B (403 Forbidden)", async () => {
        // Ticket exists in database belonging to Landlord B's unit
        mockSupabase.from = vi.fn((table: string) => {
          if (table === "maintenance_requests") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "ticket-victim-b",
                  unit_id: "unit-victim-b",
                  tenant_id: "tenant-b",
                  landlord_id: "landlord-b",
                  title: "Leaking AC",
                  description: "Water leakage",
                  priority: "high",
                  status: "pending",
                },
                error: null,
              }),
            };
          }
          if (table === "units") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "unit-victim-b",
                  name: "Unit 301",
                  property_id: "prop-victim-b",
                },
                error: null,
              }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        });

        // Landlord A does not own prop-victim-b
        vi.spyOn(
          IrisOperationsService,
          "verifyLandlordPropertyOwnership"
        ).mockResolvedValue(false);

        const req = new Request(
          "http://localhost:3000/api/landlord/iris/maintenance/quick-update",
          {
            method: "POST",
            body: JSON.stringify({
              ticketId: "ticket-victim-b",
              status: "resolved",
            }),
          }
        );
        const res = await quickUpdateRoute(req);
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error).toMatch(/does not belong to landlord's properties/i);
      });

      it("blocks Landlord A from submitting lease renewal offer for Landlord B's lease (403 Forbidden)", async () => {
        vi.spyOn(
          IrisOperationsService,
          "verifyLandlordLeaseOwnership"
        ).mockResolvedValue(false);

        const req = new Request(
          "http://localhost:3000/api/landlord/iris/leases/renewal-offer",
          {
            method: "POST",
            body: JSON.stringify({
              leaseId: "lease-victim-b",
              proposedRent: 20000,
              renewalTermMonths: 12,
            }),
          }
        );
        const res = await renewalOfferRoute(req);
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error).toMatch(/lease does not belong to landlord/i);
      });

      it("blocks Landlord A from broadcasting to Landlord B's property (403 Forbidden)", async () => {
        vi.spyOn(
          IrisOperationsService,
          "verifyLandlordPropertyOwnership"
        ).mockResolvedValue(false);

        const req = new Request(
          "http://localhost:3000/api/landlord/iris/broadcast",
          {
            method: "POST",
            body: JSON.stringify({
              filterType: "all_active_tenants",
              propertyId: "prop-victim-b",
              templateKey: "general_notice",
              channels: { inAppNotification: true },
            }),
          }
        );
        const res = await broadcastRoute(req);
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error).toMatch(/property not found or unauthorized/i);
      });

      it("blocks Landlord A from committing an invoice for Landlord B's lease (404 Not Found)", async () => {
        vi.spyOn(
          IrisOperationsService,
          "verifyLandlordLeaseOwnership"
        ).mockResolvedValue(false);

        const req = new Request(
          "http://localhost:3000/api/landlord/iris/invoices/commit",
          {
            method: "POST",
            body: JSON.stringify({ leaseId: "lease-victim-b" }),
          }
        );
        const res = await commitRoute(req);
        expect(res.status).toBe(404);
        const json = await res.json();
        expect(json.error).toMatch(/lease not found or unauthorized/i);
      });
    });
  });

  // =========================================================================
  // 2. Malicious Payloads, Injection & Sanitization
  // =========================================================================
  describe("2. Malicious Payloads, Injection & Sanitization", () => {
    describe("2.1 XSS & Script Injection in Templates & Inputs", () => {
      it("sanitizes <script>alert(1)</script> tags completely", () => {
        const payload = "<script>alert('XSS-ATTACK')</script>";
        const sanitized = sanitizeTemplateInput(payload);
        expect(sanitized).toBe("");
        expect(sanitized).not.toContain("<script>");
        expect(sanitized).not.toContain("alert");
      });

      it("neutralizes javascript: pseudo-protocol", () => {
        const payload = "javascript:alert(document.cookie)";
        const sanitized = sanitizeTemplateInput(payload);
        expect(sanitized).not.toContain("javascript:");
      });

      it("neutralizes <img src=x onerror=...> handlers", () => {
        const payload = '<img src="x" onerror="window.location=\'http://evil.com\'">';
        const sanitized = sanitizeTemplateInput(payload);
        expect(sanitized).not.toContain("<img");
        expect(sanitized).not.toContain("onerror");
        expect(sanitized).not.toContain("window.location");
      });

      it("neutralizes <svg/onload=...> and iframe payloads", () => {
        const payload = '<svg onload="alert(1)"><iframe src="https://attacker.site"></iframe>';
        const sanitized = sanitizeTemplateInput(payload);
        expect(sanitized).not.toContain("<svg");
        expect(sanitized).not.toContain("onload");
        expect(sanitized).not.toContain("<iframe");
      });

      it("safely substitutes and neutralizes malicious XSS in renderTemplate", () => {
        const result = renderTemplate("general_notice", {
          property_name: "<script>alert('prop-xss')</script>Sunshine Towers",
          custom_message: '<img src=x onerror="fetch(\'evil.com\')">Emergency water shutoff',
        });

        expect(result).not.toContain("<script>");
        expect(result).not.toContain("<img");
        expect(result).not.toContain("onerror");
        expect(result).toContain("Sunshine Towers");
        expect(result).toContain("Emergency water shutoff");
      });

      it("sanitizes malicious script in broadcast API customMessage", async () => {
        const insertedNotifications: any[] = [];
        const mockSupabase = mockLandlordSupabase({
          notifications: {
            insert: vi.fn(async (data: any) => {
              insertedNotifications.push(...(Array.isArray(data) ? data : [data]));
              return { data, error: null };
            }),
          },
        });

        vi.mocked(requireAuthenticatedUser).mockResolvedValue({
          userId: "landlord-1",
          userEmail: "landlord@test.com",
          userRole: "landlord",
          supabase: mockSupabase,
        } as any);

        const sampleLease: ActiveLeaseSummary = {
          id: "lease-101",
          tenantId: "tenant-101",
          tenantName: "Juan Dela Cruz",
          unitId: "unit-101",
          unitName: "101",
          propertyId: "prop-101",
          propertyName: "Test Manor",
          monthlyRent: 15000,
          startDate: "2026-01-01",
          endDate: "2026-12-31",
          outstandingBalance: 15000,
          daysOverdue: 10,
          dueDate: "2026-11-01",
        };

        vi.spyOn(
          IrisOperationsService,
          "getLandlordOperationalContext"
        ).mockResolvedValue({
          landlordId: "landlord-1",
          properties: [
            { id: "prop-101", name: "Test Manor", totalUnits: 1, occupiedUnits: 1 },
          ],
          activeLeases: [sampleLease],
          overdueLeases: [sampleLease],
          openTickets: [],
          totalReceivables: 15000,
          occupancyRate: 100,
        });

        const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
          method: "POST",
          body: JSON.stringify({
            filterType: "all_active_tenants",
            templateKey: "general_notice",
            customMessage:
              "Rent reminder <script>window.pwned=true;</script> please settle.",
            channels: { inAppNotification: true },
          }),
        });

        const res = await broadcastRoute(req);
        expect(res.status).toBe(200);
        expect(insertedNotifications).toHaveLength(1);
        expect(insertedNotifications[0].message).not.toContain("<script>");
        expect(insertedNotifications[0].message).not.toContain("window.pwned");
        expect(insertedNotifications[0].message).toContain("Rent reminder");
      });
    });

    describe("2.2 Extreme String Lengths, Homoglyphs, Emojis, and Null Bytes", () => {
      it("rejects customMessage exceeding 500 characters in broadcast route (Zod schema boundary)", async () => {
        vi.mocked(requireAuthenticatedUser).mockResolvedValue({
          userId: "landlord-1",
          userEmail: "landlord@test.com",
          userRole: "landlord",
          supabase: mockLandlordSupabase(),
        } as any);

        const extremeString = "A".repeat(10000);
        const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
          method: "POST",
          body: JSON.stringify({
            filterType: "all_active_tenants",
            templateKey: "general_notice",
            customMessage: extremeString,
            channels: { inAppNotification: true },
          }),
        });

        const res = await broadcastRoute(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Validation failed");
      });

      it("rejects notes exceeding 250 characters in quickUpdateRoute", async () => {
        vi.mocked(requireAuthenticatedUser).mockResolvedValue({
          userId: "landlord-1",
          userEmail: "landlord@test.com",
          userRole: "landlord",
          supabase: mockLandlordSupabase(),
        } as any);

        const extremeNote = "B".repeat(500);
        const req = new Request(
          "http://localhost:3000/api/landlord/iris/maintenance/quick-update",
          {
            method: "POST",
            body: JSON.stringify({
              ticketId: "t-1",
              status: "in_progress",
              notes: extremeNote,
            }),
          }
        );

        const res = await quickUpdateRoute(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Validation failed");
      });

      it("rejects assignedTechnician exceeding 60 characters in quickUpdateRoute", async () => {
        vi.mocked(requireAuthenticatedUser).mockResolvedValue({
          userId: "landlord-1",
          userEmail: "landlord@test.com",
          userRole: "landlord",
          supabase: mockLandlordSupabase(),
        } as any);

        const extremeTech = "Technician ".repeat(20);
        const req = new Request(
          "http://localhost:3000/api/landlord/iris/maintenance/quick-update",
          {
            method: "POST",
            body: JSON.stringify({
              ticketId: "t-1",
              status: "assigned",
              assignedTechnician: extremeTech,
            }),
          }
        );

        const res = await quickUpdateRoute(req);
        expect(res.status).toBe(400);
      });

      it("handles null bytes (\\0) gracefully without crashing or corrupting memory", () => {
        const payloadWithNull = "Notice\0with\0embedded\0nulls";
        const sanitized = sanitizeTemplateInput(payloadWithNull);
        expect(sanitized).toBeDefined();
        expect(typeof sanitized).toBe("string");
      });

      it("handles Unicode homoglyphs and RTL overrides without ReDoS or catastrophic backtracking", () => {
        // Cyrillic 'а', zero-width spaces, RTL override character \u202E
        const unicodePayload = "P\u0430yment\u200B \u202EReminder for Unit 101";
        const sanitized = sanitizeTemplateInput(unicodePayload);
        expect(sanitized).toContain("yment");
      });

      it("preserves multi-byte emojis cleanly without truncation or surrogate pair breaking", () => {
        const emojiPayload = "⚠️ Emergency Water Shutoff! 🛠️🔧 Settle: ₱15,000 💸";
        const sanitized = sanitizeTemplateInput(emojiPayload);
        expect(sanitized).toContain("⚠️");
        expect(sanitized).toContain("🛠️🔧");
        expect(sanitized).toContain("💸");
      });
    });

    describe("2.3 Extreme Numbers, NaN, Infinity, and Decimal Overflows", () => {
      it("rejects negative amount in QuickSettlementInputSchema", () => {
        const invalidInput = {
          invoiceId: "inv-1",
          amount: -5000,
          method: "cash",
          paymentDate: "2026-11-12",
        };
        const parseResult = QuickSettlementInputSchema.safeParse(invalidInput);
        expect(parseResult.success).toBe(false);
      });

      it("rejects zero amount in QuickSettlementInputSchema", () => {
        const invalidInput = {
          invoiceId: "inv-1",
          amount: 0,
          method: "cash",
          paymentDate: "2026-11-12",
        };
        const parseResult = QuickSettlementInputSchema.safeParse(invalidInput);
        expect(parseResult.success).toBe(false);
      });

      it("rejects NaN and Infinity in QuickSettlementInputSchema", () => {
        expect(
          QuickSettlementInputSchema.safeParse({
            invoiceId: "inv-1",
            amount: NaN,
            method: "cash",
            paymentDate: "2026-11-12",
          }).success
        ).toBe(false);

        expect(
          QuickSettlementInputSchema.safeParse({
            invoiceId: "inv-1",
            amount: Infinity,
            method: "cash",
            paymentDate: "2026-11-12",
          }).success
        ).toBe(false);
      });

      it("roundCentavos immune to NaN, Infinity, and -Infinity", () => {
        expect(roundCentavos(NaN)).toBe(0);
        expect(roundCentavos(Infinity)).toBe(0);
        expect(roundCentavos(-Infinity)).toBe(0);
      });

      it("roundCentavos handles decimal overflows and IEEE 754 precision anomalies", () => {
        expect(roundCentavos(123.456789)).toBe(123.46);
        expect(roundCentavos(0.1 + 0.2)).toBe(0.3);
        expect(roundCentavos(0.005)).toBe(0.01);
        expect(roundCentavos(0.00499)).toBe(0.0);
        expect(roundCentavos(10.555)).toBe(10.56);
        expect(roundCentavos(10.554)).toBe(10.55);
      });

      it("roundCentavos handles massive numbers (1e15) without crashing", () => {
        expect(roundCentavos(1e15)).toBe(1000000000000000);
      });

      it("rejects massive proposedRent (1e15) in renewal offer route (exceeds max limit)", async () => {
        vi.mocked(requireAuthenticatedUser).mockResolvedValue({
          userId: "landlord-1",
          userEmail: "landlord@test.com",
          userRole: "landlord",
          supabase: mockLandlordSupabase(),
        } as any);

        const req = new Request(
          "http://localhost:3000/api/landlord/iris/leases/renewal-offer",
          {
            method: "POST",
            body: JSON.stringify({
              leaseId: "lease-1",
              proposedRent: 1e15,
              renewalTermMonths: 12,
            }),
          }
        );

        const res = await renewalOfferRoute(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("Validation failed");
      });

      it("calculateUtilityCharge throws for negative utility rates or negative consumption", () => {
        expect(() => calculateUtilityCharge(-5, 10, "tenant_paid")).toThrow(
          /must be non-negative/i
        );
        expect(() => calculateUtilityCharge(10, -5, "tenant_paid")).toThrow(
          /must be non-negative/i
        );
      });

      it("validateReadingDelta rejects negative readings", () => {
        const resPrevNeg = validateReadingDelta(-100, 200);
        expect(resPrevNeg.valid).toBe(false);
        expect(resPrevNeg.error).toMatch(/cannot be negative/i);

        const resCurrNeg = validateReadingDelta(100, -20);
        expect(resCurrNeg.valid).toBe(false);
        expect(resCurrNeg.error).toMatch(/cannot be negative/i);
      });
    });
  });

  // =========================================================================
  // 3. Concurrency & Double-Settlement Defense
  // =========================================================================
  describe("3. Concurrency & Double-Settlement Defense", () => {
    describe("3.1 Quick Settlement Concurrency & Balance Floor Defense", () => {
      it("prevents balance from dropping below zero when settling larger than balance", () => {
        const currentInvoice = {
          id: "inv-conc-1",
          totalAmount: 10000,
          currentBalance: 3000,
        };

        const input: QuickSettlementInput = {
          invoiceId: "inv-conc-1",
          amount: 5000, // exceeds current balance 3000
          method: "cash",
          paymentDate: "2026-11-12",
        };

        const result = recordQuickSettlement(input, currentInvoice);
        expect(result.success).toBe(true);
        expect(result.remainingBalance).toBe(0); // Floor at zero
        expect(result.remainingBalance).not.toBeLessThan(0);
        expect(result.status).toBe("completed");
      });

      it("rejects settlement when invoice is already fully settled (balance === 0)", () => {
        const settledInvoice = {
          id: "inv-conc-2",
          totalAmount: 10000,
          currentBalance: 0,
        };

        const input: QuickSettlementInput = {
          invoiceId: "inv-conc-2",
          amount: 1000,
          method: "cash",
          paymentDate: "2026-11-12",
        };

        expect(() => recordQuickSettlement(input, settledInvoice)).toThrow(
          "Cannot record payment: invoice is already fully settled"
        );
      });

      it("deterministically handles parallel / simultaneous settlements on an invoice", () => {
        // Initial state: 10,000 balance
        let sharedInvoice = {
          id: "inv-conc-3",
          totalAmount: 10000,
          currentBalance: 10000,
        };

        // Two payments arrive concurrently:
        // Settlement A: 6,000
        // Settlement B: 6,000
        const settlementA = recordQuickSettlement(
          {
            invoiceId: "inv-conc-3",
            amount: 6000,
            method: "cash",
            paymentDate: "2026-11-12",
          },
          sharedInvoice,
          "TXNAA"
        );

        expect(settlementA.remainingBalance).toBe(4000);
        expect(settlementA.status).toBe("partial");

        // State mutates
        sharedInvoice = {
          ...sharedInvoice,
          currentBalance: settlementA.remainingBalance,
        };

        // Settlement B executes against updated state
        const settlementB = recordQuickSettlement(
          {
            invoiceId: "inv-conc-3",
            amount: 6000,
            method: "bank_transfer",
            paymentDate: "2026-11-12",
          },
          sharedInvoice,
          "TXNBB"
        );

        expect(settlementB.remainingBalance).toBe(0);
        expect(settlementB.status).toBe("completed");

        // State mutates to 0
        sharedInvoice = {
          ...sharedInvoice,
          currentBalance: settlementB.remainingBalance,
        };

        // Third settlement C attempted after completion must throw
        expect(() =>
          recordQuickSettlement(
            {
              invoiceId: "inv-conc-3",
              amount: 1000,
              method: "in_person",
              paymentDate: "2026-11-12",
            },
            sharedInvoice
          )
        ).toThrow("Cannot record payment: invoice is already fully settled");
      });

      it("processes rapid batch of micro-settlements without floating point drift", () => {
        let currentBalance = 10000;
        const total = 10000;
        const microPayments = [1500.5, 2499.5, 3000, 1000, 1999.99, 0.01];

        microPayments.forEach((amt, idx) => {
          const res = recordQuickSettlement(
            {
              invoiceId: "inv-micro",
              amount: amt,
              method: "cash",
              paymentDate: "2026-11-12",
            },
            { id: "inv-micro", totalAmount: total, currentBalance }
          );
          currentBalance = res.remainingBalance;
        });

        // Exact match to 0
        expect(currentBalance).toBe(0);
      });
    });

    describe("3.2 Maintenance Ticket Concurrency & State Mutation Guards", () => {
      const baseTicket: MaintenanceTicketSummary = {
        id: "ticket-conc-1",
        unitId: "unit-101",
        unitName: "101",
        propertyId: "prop-1",
        propertyName: "Alpha Residences",
        tenantName: "Juan Dela Cruz",
        title: "Roof Leak",
        description: "Heavy leak during rain",
        priority: "urgent",
        status: "pending",
        createdAt: "2026-11-10T10:00:00Z",
      };

      it("enforces legal ticket state transitions and prevents illegal jumps", () => {
        // Pending cannot jump straight to closed or resolved
        expect(() =>
          updateMaintenanceTicketStatus(baseTicket, "closed")
        ).toThrow(/Illegal ticket status transition from pending to closed/i);

        expect(() =>
          updateMaintenanceTicketStatus(baseTicket, "resolved")
        ).toThrow(/Illegal ticket status transition from pending to resolved/i);
      });

      it("requires technician when transitioning to assigned status", () => {
        expect(() =>
          updateMaintenanceTicketStatus(baseTicket, "assigned")
        ).toThrow("Cannot assign ticket without specifying a technician");

        const assigned = updateMaintenanceTicketStatus(baseTicket, "assigned", {
          assignedTechnician: "Bob the Plumber",
        });
        expect(assigned.status).toBe("assigned");
        expect(assigned.assignedTechnician).toBe("Bob the Plumber");
      });

      it("prevents conflicting mutations when ticket is cancelled concurrently", () => {
        // First mutation cancels the ticket
        const cancelledTicket = updateMaintenanceTicketStatus(
          baseTicket,
          "cancelled"
        );
        expect(cancelledTicket.status).toBe("cancelled");

        // Concurrent mutation attempting to transition to in_progress or resolved must fail
        expect(() =>
          updateMaintenanceTicketStatus(cancelledTicket, "in_progress")
        ).toThrow(/Illegal ticket status transition from cancelled to in_progress/i);

        expect(() =>
          updateMaintenanceTicketStatus(cancelledTicket, "resolved")
        ).toThrow(/Illegal ticket status transition from cancelled to resolved/i);
      });

      it("enforces closed ticket state: only reopening to in_progress allowed", () => {
        const resolvedTicket = updateMaintenanceTicketStatus(
          { ...baseTicket, status: "in_progress" },
          "resolved"
        );
        const closedTicket = updateMaintenanceTicketStatus(
          resolvedTicket,
          "closed"
        );
        expect(closedTicket.status).toBe("closed");

        // Cannot jump back to assigned or resolved directly
        expect(() =>
          updateMaintenanceTicketStatus(closedTicket, "assigned")
        ).toThrow(/Illegal ticket status transition from closed to assigned/i);

        expect(() =>
          updateMaintenanceTicketStatus(closedTicket, "resolved")
        ).toThrow(/Illegal ticket status transition from closed to resolved/i);

        // Reopening to in_progress is permitted
        const reopenedTicket = updateMaintenanceTicketStatus(
          closedTicket,
          "in_progress"
        );
        expect(reopenedTicket.status).toBe("in_progress");
      });
    });
  });

  // =========================================================================
  // 4. Meter Reading & Invoice Edge Cases
  // =========================================================================
  describe("4. Meter Reading & Invoice Edge Cases", () => {
    describe("4.1 High Meter Rollover & Capacity Logic", () => {
      it("calculates rollover correctly on 5-digit analog meters (99999 to 00010)", () => {
        const delta = validateReadingDelta(99999, 10, { hasRollover: true });
        expect(delta.valid).toBe(true);
        // Automatic capacity calculation: 5 digits => 100,000 capacity
        // Usage = (100,000 - 99,999) + 10 = 11
        expect(delta.usage).toBe(11);
      });

      it("calculates rollover on 6-digit commercial meter with explicit maxReading", () => {
        const delta = validateReadingDelta(999980, 45, {
          hasRollover: true,
          maxReading: 1000000,
        });
        expect(delta.valid).toBe(true);
        // Usage = (1,000,000 - 999,980) + 45 = 65
        expect(delta.usage).toBe(65);
      });

      it("rejects rollover if hasRollover is omitted/false", () => {
        const delta = validateReadingDelta(99999, 10, { hasRollover: false });
        expect(delta.valid).toBe(false);
        expect(delta.usage).toBe(0);
        expect(delta.error).toMatch(/is less than previous reading/i);
      });

      it("handles meter replacement / reset to zero with allowMeterReset: true", () => {
        // Meter replaced with new one, reading starts from 0 up to 15
        const delta = validateReadingDelta(84520, 15, { allowMeterReset: true });
        expect(delta.valid).toBe(true);
        expect(delta.usage).toBe(15);
      });

      it("catches impossible rollover capacity error", () => {
        // maxReading is smaller than previous reading
        const delta = validateReadingDelta(500, 10, {
          hasRollover: true,
          maxReading: 400,
        });
        expect(delta.valid).toBe(false);
        expect(delta.error).toMatch(/negative usage/i);
      });
    });

    describe("4.2 Zero Consumption with Positive Tariff Rates", () => {
      it("calculates zero usage when previous and current readings are identical", () => {
        const delta = validateReadingDelta(1500, 1500);
        expect(delta.valid).toBe(true);
        expect(delta.usage).toBe(0);

        const charge = calculateUtilityCharge(0, 55.5, "tenant_paid");
        expect(charge).toBe(0);
      });

      it("includes zero-consumption utility line items cleanly in draft invoice items", () => {
        const context: InvoiceBuildContext = {
          leaseId: "lease-zero-util",
          tenantId: "tenant-1",
          tenantName: "Maria Santos",
          unitId: "unit-102",
          unitName: "Unit 102",
          propertyId: "prop-1",
          propertyName: "Alpha Residences",
          billingMonth: "2026-11",
          dueDate: "2026-11-20",
          monthlyRent: 20000,
          water: {
            previousReading: 1200,
            currentReading: 1200, // Zero consumption
            ratePerUnit: 45.0,
            billingMode: "tenant_paid",
          },
          electricity: {
            previousReading: 3450,
            currentReading: 3450, // Zero consumption
            ratePerUnit: 12.5,
            billingMode: "tenant_paid",
          },
        };

        const draft = buildDraftInvoiceItems(context);
        expect(draft.waterUsage).toBe(0);
        expect(draft.waterCharge).toBe(0);
        expect(draft.electricityUsage).toBe(0);
        expect(draft.electricityCharge).toBe(0);
        expect(draft.subtotal).toBe(20000);
        expect(draft.totalAmount).toBe(20000);

        const waterItem = draft.items.find((i) => i.category === "water");
        const electricityItem = draft.items.find((i) => i.category === "electricity");
        expect(waterItem).toBeDefined();
        expect(waterItem?.amount).toBe(0);
        expect(electricityItem).toBeDefined();
        expect(electricityItem?.amount).toBe(0);
      });
    });

    describe("4.3 Multiple Simultaneous Custom Additions & Penalties", () => {
      it("accurately computes rent, utilities, multiple additions, and penalties without floating-point skew", () => {
        const customItems: CustomItem[] = [
          {
            id: "cust-1",
            label: "Covered Parking Slot #4",
            amount: 2500.0,
            category: "other",
          },
          {
            id: "cust-2",
            label: "Association & Community Dues",
            amount: 1800.0,
            category: "other",
          },
          {
            id: "cust-3",
            label: "High-Speed Fiber Internet",
            amount: 1499.0,
            category: "other",
          },
          {
            id: "cust-4",
            label: "Late Payment Penalty (5% Surcharge)",
            amount: 1250.0,
            category: "penalty",
          },
          {
            id: "cust-5",
            label: "Interest on Arrears",
            amount: 350.75,
            category: "penalty",
          },
          {
            id: "cust-6",
            label: "Window Mesh Repair",
            amount: 850.5,
            category: "maintenance",
          },
        ];

        const context: InvoiceBuildContext = {
          leaseId: "lease-heavy-additions",
          tenantId: "tenant-juan",
          tenantName: "Juan Dela Cruz",
          unitId: "unit-101",
          unitName: "101",
          propertyId: "prop-alpha",
          propertyName: "Alpha Residences",
          billingMonth: "2026-11",
          dueDate: "2026-11-25",
          monthlyRent: 25000.0,
          water: {
            previousReading: 100,
            currentReading: 120, // 20 units @ 45 = 900
            ratePerUnit: 45.0,
            billingMode: "tenant_paid",
          },
          electricity: {
            previousReading: 500,
            currentReading: 650, // 150 kWh @ 12.50 = 1875
            ratePerUnit: 12.5,
            billingMode: "tenant_paid",
          },
          customItems,
          notes: "Adversarial multi-charge stress test invoice",
        };

        const draft = buildDraftInvoiceItems(context);

        // Verification of items count: Rent (1) + Water (1) + Electricity (1) + Custom (6) = 9
        expect(draft.items).toHaveLength(9);

        // Breakdown amounts:
        // Rent: 25,000.00
        // Water: 20 * 45 = 900.00
        // Electricity: 150 * 12.50 = 1875.00
        // Custom Total: 2500 + 1800 + 1499 + 1250 + 350.75 + 850.50 = 8250.25
        // Expected Subtotal: 25000 + 900 + 1875 + 8250.25 = 36025.25
        expect(draft.rentAmount).toBe(25000.0);
        expect(draft.waterCharge).toBe(900.0);
        expect(draft.electricityCharge).toBe(1875.0);
        expect(draft.customTotal).toBe(8250.25);
        expect(draft.subtotal).toBe(36025.25);
        expect(draft.totalAmount).toBe(36025.25);

        // Verify sortOrder indexing:
        expect(draft.items[0].sortOrder).toBe(0); // Rent
        expect(draft.items[1].sortOrder).toBe(10); // Water
        expect(draft.items[2].sortOrder).toBe(20); // Electricity
        expect(draft.items[3].sortOrder).toBe(30); // Custom 0
        expect(draft.items[4].sortOrder).toBe(31); // Custom 1
        expect(draft.items[5].sortOrder).toBe(32); // Custom 2
        expect(draft.items[6].sortOrder).toBe(33); // Custom 3
        expect(draft.items[7].sortOrder).toBe(34); // Custom 4
        expect(draft.items[8].sortOrder).toBe(35); // Custom 5

        // Verify currency formatting matches standard Philippine peso representation
        expect(formatPhpCurrency(draft.totalAmount)).toBe("₱36,025.25");
      });
    });

    describe("4.4 Malformed JSON Request Handling across all iRis Endpoints", () => {
      beforeEach(() => {
        vi.mocked(requireAuthenticatedUser).mockResolvedValue({
          userId: "landlord-alpha",
          userEmail: "landlord@example.ph",
          userRole: "landlord",
          supabase: mockLandlordSupabase(),
        } as any);
      });

      it("returns 400 for malformed JSON on invoice-draft endpoint", async () => {
        const req = new Request("http://localhost:3000/api/landlord/iris/invoice-draft", {
          method: "POST",
          body: "{bad json: syntax error",
        });
        const res = await invoiceDraftRoute(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toMatch(/invalid json request body/i);
      });

      it("returns 400 for malformed JSON on quick-settle endpoint", async () => {
        const req = new Request(
          "http://localhost:3000/api/landlord/iris/payments/quick-settle",
          {
            method: "POST",
            body: "{not-valid-json",
          }
        );
        const res = await quickSettleRoute(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toMatch(/invalid json request body/i);
      });

      it("returns 400 for malformed JSON on quick-update endpoint", async () => {
        const req = new Request(
          "http://localhost:3000/api/landlord/iris/maintenance/quick-update",
          {
            method: "POST",
            body: "{malformed_payload",
          }
        );
        const res = await quickUpdateRoute(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toMatch(/invalid json request body/i);
      });

      it("returns 400 for malformed JSON on renewal-offer endpoint", async () => {
        const req = new Request(
          "http://localhost:3000/api/landlord/iris/leases/renewal-offer",
          {
            method: "POST",
            body: "<xml>not json</xml>",
          }
        );
        const res = await renewalOfferRoute(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toMatch(/invalid json request body/i);
      });

      it("returns 400 for malformed JSON on broadcast endpoint", async () => {
        const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
          method: "POST",
          body: "corrupted stream content",
        });
        const res = await broadcastRoute(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toMatch(/invalid json request body/i);
      });

      it("returns 400 for malformed JSON on commit invoice endpoint", async () => {
        const req = new Request(
          "http://localhost:3000/api/landlord/iris/invoices/commit",
          {
            method: "POST",
            body: "---yaml format not json",
          }
        );
        const res = await commitRoute(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toMatch(/invalid json request body/i);
      });
    });
  });
});
