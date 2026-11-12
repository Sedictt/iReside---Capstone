import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const mockRequireAuthenticatedUser = vi.fn();
const mockVerifyLandlordPropertyOwnership = vi.fn();
const mockGetLandlordOperationalContext = vi.fn();

vi.mock("@/lib/api/auth-guard", () => ({
  requireAuthenticatedUser: (...args: unknown[]) => mockRequireAuthenticatedUser(...args),
}));

vi.mock("@/lib/services/iris", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/services/iris")>();
  return {
    ...actual,
    IrisOperationsService: {
      ...actual.IrisOperationsService,
      verifyLandlordPropertyOwnership: (...args: unknown[]) =>
        mockVerifyLandlordPropertyOwnership(...args),
      getLandlordOperationalContext: (...args: unknown[]) =>
        mockGetLandlordOperationalContext(...args),
    },
  };
});

import {
  type ActiveLeaseSummary,
  filterAudience,
  IrisOperationsService,
} from "@/lib/services/iris/iris-operations.service";
import {
  renderTemplate,
  sanitizeTemplateInput,
  validateTemplateContext,
  type IrisTemplateKey,
} from "@/lib/services/iris/iris-templates";
import {
  RecipientPreviewTable,
  IrisBroadcastModal,
} from "@/components/landlord/iris/broadcast";
import { POST as broadcastRoute } from "@/app/api/landlord/iris/broadcast/route";

describe("Milestone 3 Challenger Adversarial & Stress Probes", () => {
  const mockLandlordLeases: ActiveLeaseSummary[] = [
    {
      id: "lease-alpha-1",
      tenantId: "tenant-alpha-1",
      tenantName: "Juan Dela Cruz",
      tenantEmail: "juan@alpha.ph",
      tenantPhone: "+639171234567",
      unitId: "unit-101",
      unitName: "Unit 101",
      propertyId: "prop-alpha",
      propertyName: "Alpha Residences",
      monthlyRent: 20000,
      startDate: "2026-01-01",
      endDate: "2027-01-01",
      outstandingBalance: 20000,
      daysOverdue: 15,
      dueDate: "2026-11-01",
    },
    {
      id: "lease-alpha-2",
      tenantId: "tenant-alpha-2",
      tenantName: "Maria Santos",
      tenantEmail: "maria@alpha.ph",
      unitId: "unit-102",
      unitName: "Unit 102",
      propertyId: "prop-alpha",
      propertyName: "Alpha Residences",
      monthlyRent: 25000,
      startDate: "2026-02-01",
      endDate: "2026-11-30",
      outstandingBalance: 25000,
      daysOverdue: 0,
      dueDate: "2026-11-14",
    },
    {
      id: "lease-beta-1",
      tenantId: "tenant-beta-1",
      tenantName: "Carlos Garcia",
      tenantEmail: "carlos@beta.ph",
      unitId: "unit-201",
      unitName: "Unit 201",
      propertyId: "prop-beta",
      propertyName: "Beta Tower",
      monthlyRent: 30000,
      startDate: "2026-03-01",
      endDate: "2027-03-01",
      outstandingBalance: 0,
      daysOverdue: 0,
      dueDate: "2026-12-01",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. Malicious / Adversarial Inputs & Sanitization Probing
  // =========================================================================
  describe("1. Malicious / Adversarial Inputs & Sanitization", () => {
    it("strips classic <script>alert(1)</script> XSS payload", () => {
      const malicious = "Notice: <script>alert(1)</script> Elevator is down.";
      const sanitized = sanitizeTemplateInput(malicious);
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("alert(1)");
      expect(sanitized).toContain("Notice:  Elevator is down.");
    });

    it("neutralizes image tag with onerror event handler: <img src=x onerror=alert(1)>", () => {
      const payload = "Hello resident <img src=x onerror=alert('hacked')> please pay.";
      const sanitized = sanitizeTemplateInput(payload);
      expect(sanitized).not.toContain("<img");
      expect(sanitized).not.toContain("onerror");
      expect(sanitized).not.toContain("alert");
      expect(sanitized).toBe("Hello resident  please pay.");
    });

    it("strips javascript: pseudo-protocol vectors", () => {
      const payload = "Click here: <a href='javascript:evil()'>Portal</a> or javascript:doEvil()";
      const sanitized = sanitizeTemplateInput(payload);
      expect(sanitized).not.toContain("javascript:");
      expect(sanitized).not.toContain("<a");
    });

    it("strips iframe injection and nested tags", () => {
      const payload = "Important: <iframe src='https://malicious-site.com/steal'></iframe> Nested: <b><strong>Clean</strong></b>";
      const sanitized = sanitizeTemplateInput(payload);
      expect(sanitized).not.toContain("<iframe");
      expect(sanitized).not.toContain("malicious-site.com");
      expect(sanitized).not.toContain("<b>");
      expect(sanitized).toContain("Important:  Nested: Clean");
    });

    it("handles complex unicode, Filipino Baybayin, emoji, and RTL control sequences safely", () => {
      const complexMsg = "Mabuhay! ᜋᜊᜓ his 🏢 Special notice \u202Ereversed text\u202C 🎉";
      const rendered = renderTemplate("general_notice", {
        property_name: "Alpha Residences",
        custom_message: complexMsg,
      });

      expect(rendered).toContain("Alpha Residences");
      expect(rendered).toContain("🏢");
      expect(rendered).toContain("🎉");
      expect(rendered).toContain("ᜋᜊᜓ");
    });

    it("handles null, undefined, empty string, and whitespace-only custom messages gracefully", () => {
      const renderedEmpty = renderTemplate("general_notice", {
        property_name: "Alpha Residences",
        custom_message: "",
      });
      // Should fall back to DEFAULT_FALLBACKS.custom_message
      expect(renderedEmpty).toContain("Please contact management for additional details.");

      const renderedWhitespace = renderTemplate("general_notice", {
        property_name: "Alpha Residences",
        custom_message: "    ",
      });
      expect(renderedWhitespace).toContain("Please contact management for additional details.");
    });

    it("API rejects customMessage exceeding 500 characters with 400 Bad Request", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-1",
        userRole: "landlord",
        supabase: {} as any,
      });

      const longMessage = "A".repeat(501);
      const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
        method: "POST",
        body: JSON.stringify({
          filterType: "all_active_tenants",
          templateKey: "general_notice",
          customMessage: longMessage,
          channels: { inAppNotification: true },
        }),
      });

      const res = await broadcastRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Validation failed");
      expect(JSON.stringify(json.details)).toContain("Custom message cannot exceed 500 characters");
    });

    it("API accepts customMessage of exactly 500 characters", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-1",
        userRole: "landlord",
        supabase: {
          from: () => ({
            insert: async () => ({ data: [], error: null }),
          }),
        } as any,
      });

      mockGetLandlordOperationalContext.mockResolvedValue({
        landlordId: "landlord-1",
        properties: [{ id: "prop-alpha", name: "Alpha Residences" }],
        activeLeases: [mockLandlordLeases[0]],
        overdueLeases: [mockLandlordLeases[0]],
        openTickets: [],
        totalReceivables: 20000,
        occupancyRate: 100,
      });

      const maxMessage = "M".repeat(500);
      const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
        method: "POST",
        body: JSON.stringify({
          filterType: "all_active_tenants",
          templateKey: "general_notice",
          customMessage: maxMessage,
          channels: { inAppNotification: true },
        }),
      });

      const res = await broadcastRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  // =========================================================================
  // 2. Boundary Conditions & Selection Mechanics
  // =========================================================================
  describe("2. Boundary Conditions & Selection Mechanics", () => {
    it("handles 0 recipients cleanly in RecipientPreviewTable without NaN or division by zero", () => {
      const onToggleSelect = vi.fn();
      const onToggleAll = vi.fn();

      const { container } = render(
        React.createElement(RecipientPreviewTable, {
          recipients: [],
          selectedLeaseIds: new Set(),
          onToggleSelect,
          onToggleAll,
          templateKey: "general_notice",
        })
      );

      expect(screen.getByTestId("recipient-empty-state")).toBeInTheDocument();
      expect(screen.getByText(/All Good! No residents currently match this filter./)).toBeInTheDocument();
      // Counter bar should not crash or render NaN
      expect(container.textContent).not.toContain("NaN");
    });

    it("handles boundary: exactly 1 recipient in RecipientPreviewTable (Select All toggles single row)", () => {
      const onToggleAll = vi.fn();
      const singleLease = [mockLandlordLeases[0]];

      render(
        React.createElement(RecipientPreviewTable, {
          recipients: singleLease,
          selectedLeaseIds: new Set(["lease-alpha-1"]),
          onToggleSelect: vi.fn(),
          onToggleAll,
          templateKey: "payment_overdue",
        })
      );

      const counter = screen.getByTestId("selected-counter");
      expect(counter).toHaveTextContent("1 of 1 selected");

      const masterCheckbox = screen.getByLabelText("Select all recipients") as HTMLInputElement;
      expect(masterCheckbox.checked).toBe(true);
      expect(masterCheckbox.indeterminate).toBe(false);

      // Toggle off
      fireEvent.click(masterCheckbox);
      expect(onToggleAll).toHaveBeenCalledWith(false);
    });

    it("sets indeterminate state on master checkbox when 1 out of 3 recipients is selected", () => {
      render(
        React.createElement(RecipientPreviewTable, {
          recipients: mockLandlordLeases,
          selectedLeaseIds: new Set(["lease-alpha-1"]),
          onToggleSelect: vi.fn(),
          onToggleAll: vi.fn(),
          templateKey: "general_notice",
        })
      );

      const counter = screen.getByTestId("selected-counter");
      expect(counter).toHaveTextContent("1 of 3 selected");

      const masterCheckbox = screen.getByLabelText("Select all recipients") as HTMLInputElement;
      expect(masterCheckbox.indeterminate).toBe(true);
      expect(masterCheckbox.checked).toBe(false);
    });

    it("sets master checkbox checked when all 3 recipients are selected", () => {
      render(
        React.createElement(RecipientPreviewTable, {
          recipients: mockLandlordLeases,
          selectedLeaseIds: new Set(["lease-alpha-1", "lease-alpha-2", "lease-beta-1"]),
          onToggleSelect: vi.fn(),
          onToggleAll: vi.fn(),
          templateKey: "general_notice",
        })
      );

      const counter = screen.getByTestId("selected-counter");
      expect(counter).toHaveTextContent("3 of 3 selected");

      const masterCheckbox = screen.getByLabelText("Select all recipients") as HTMLInputElement;
      expect(masterCheckbox.indeterminate).toBe(false);
      expect(masterCheckbox.checked).toBe(true);
    });

    it("allows passing selectedLeaseIds as array as well as Set", () => {
      render(
        React.createElement(RecipientPreviewTable, {
          recipients: mockLandlordLeases,
          selectedLeaseIds: ["lease-alpha-2"],
          onToggleSelect: vi.fn(),
          onToggleAll: vi.fn(),
          templateKey: "general_notice",
        })
      );

      const counter = screen.getByTestId("selected-counter");
      expect(counter).toHaveTextContent("1 of 3 selected");
      const rowCheckbox = screen.getByLabelText("Select Maria Santos") as HTMLInputElement;
      expect(rowCheckbox.checked).toBe(true);
    });

    it("rejects request if neither inAppNotification nor directMessage is selected", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-1",
        userRole: "landlord",
        supabase: {} as any,
      });

      const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
        method: "POST",
        body: JSON.stringify({
          filterType: "all_active_tenants",
          templateKey: "general_notice",
          channels: {
            inAppNotification: false,
            directMessage: false,
          },
        }),
      });

      const res = await broadcastRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Validation failed");
      expect(JSON.stringify(json.details)).toContain("At least one delivery channel");
    });

    it("rejects request if channels object is missing or empty", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-1",
        userRole: "landlord",
        supabase: {} as any,
      });

      const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
        method: "POST",
        body: JSON.stringify({
          filterType: "all_active_tenants",
          templateKey: "general_notice",
          channels: {},
        }),
      });

      const res = await broadcastRoute(req);
      expect(res.status).toBe(400);
    });

    it("allows delivery when only directMessage is true", async () => {
      const insertedMessages: any[] = [];
      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { conversation_id: "dm-conv-alpha-1" },
                error: null,
              }),
            }),
          }),
          insert: async (data: any) => {
            if (table === "messages") insertedMessages.push(data);
            return { data: null, error: null };
          },
          update: () => ({
            eq: () => ({ data: null, error: null }),
          }),
        }),
      };

      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-1",
        userRole: "landlord",
        supabase: mockSupabase,
      });

      mockGetLandlordOperationalContext.mockResolvedValue({
        landlordId: "landlord-1",
        properties: [{ id: "prop-alpha", name: "Alpha Residences" }],
        activeLeases: [mockLandlordLeases[0]],
        overdueLeases: [mockLandlordLeases[0]],
        openTickets: [],
        totalReceivables: 20000,
        occupancyRate: 100,
      });

      const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
        method: "POST",
        body: JSON.stringify({
          filterType: "overdue_5d",
          templateKey: "payment_overdue",
          channels: { inAppNotification: false, directMessage: true },
        }),
      });

      const res = await broadcastRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.channelsDelivered).toEqual(["direct_message"]);
      expect(insertedMessages).toHaveLength(1);
    });
  });

  // =========================================================================
  // 3. Multi-Property Scoping & Cross-Tenant IDOR Prevention
  // =========================================================================
  describe("3. Multi-Property Scoping & Cross-Tenant IDOR Prevention", () => {
    it("property scoping: filters exclusively to Property Alpha when specified", () => {
      const alphaRecipients = filterAudience(mockLandlordLeases, "all_active_tenants", {
        propertyId: "prop-alpha",
      });

      expect(alphaRecipients).toHaveLength(2);
      expect(alphaRecipients.map((r) => r.propertyId)).toEqual(["prop-alpha", "prop-alpha"]);
      expect(alphaRecipients.some((r) => r.propertyId === "prop-beta")).toBe(false);
    });

    it("property scoping: filters exclusively to Property Beta when specified", () => {
      const betaRecipients = filterAudience(mockLandlordLeases, "all_active_tenants", {
        propertyId: "prop-beta",
      });

      expect(betaRecipients).toHaveLength(1);
      expect(betaRecipients[0].propertyId).toBe("prop-beta");
      expect(betaRecipients[0].tenantName).toBe("Carlos Garcia");
    });

    it("IDOR defense: drops foreign lease IDs belonging to another landlord/property", async () => {
      const insertedNotifications: any[] = [];
      const mockSupabase = {
        from: (table: string) => ({
          insert: async (data: any) => {
            if (table === "notifications") {
              insertedNotifications.push(...(Array.isArray(data) ? data : [data]));
            }
            return { data: null, error: null };
          },
        }),
      };

      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-1",
        userRole: "landlord",
        supabase: mockSupabase,
      });

      // Landlord-1 only owns mockLandlordLeases
      mockGetLandlordOperationalContext.mockResolvedValue({
        landlordId: "landlord-1",
        properties: [{ id: "prop-alpha", name: "Alpha Residences" }],
        activeLeases: [mockLandlordLeases[0]], // only lease-alpha-1
        overdueLeases: [mockLandlordLeases[0]],
        openTickets: [],
        totalReceivables: 20000,
        occupancyRate: 100,
      });

      // Attacker attempts to inject foreign lease IDs belonging to other landlords
      const maliciousForeignLeaseIds = [
        "victim-lease-other-landlord-999",
        "victim-lease-bank-777",
        "lease-alpha-1", // legitimate
      ];

      const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
        method: "POST",
        body: JSON.stringify({
          filterType: "overdue_5d",
          templateKey: "payment_overdue",
          selectedLeaseIds: maliciousForeignLeaseIds,
          channels: { inAppNotification: true },
        }),
      });

      const res = await broadcastRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      // Only the legitimate lease belonging to landlord-1 is processed
      expect(json.count).toBe(1);
      expect(json.recipients).toEqual([
        {
          leaseId: "lease-alpha-1",
          tenantId: "tenant-alpha-1",
          tenantName: "Juan Dela Cruz",
          unitName: "Unit 101",
          propertyName: "Alpha Residences",
        },
      ]);
      expect(insertedNotifications).toHaveLength(1);
      expect(insertedNotifications[0].user_id).toBe("tenant-alpha-1");
    });

    it("IDOR defense: returns count 0 safely if selectedLeaseIds contains ONLY foreign leases", async () => {
      const insertedNotifications: any[] = [];
      const mockSupabase = {
        from: (table: string) => ({
          insert: async (data: any) => {
            insertedNotifications.push(data);
            return { data: null, error: null };
          },
        }),
      };

      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-1",
        userRole: "landlord",
        supabase: mockSupabase,
      });

      mockGetLandlordOperationalContext.mockResolvedValue({
        landlordId: "landlord-1",
        properties: [{ id: "prop-alpha", name: "Alpha Residences" }],
        activeLeases: [mockLandlordLeases[0]],
        overdueLeases: [mockLandlordLeases[0]],
        openTickets: [],
        totalReceivables: 20000,
        occupancyRate: 100,
      });

      const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
        method: "POST",
        body: JSON.stringify({
          filterType: "overdue_5d",
          templateKey: "payment_overdue",
          selectedLeaseIds: ["foreign-lease-111", "foreign-lease-222"],
          channels: { inAppNotification: true },
        }),
      });

      const res = await broadcastRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.count).toBe(0);
      expect(json.recipients).toEqual([]);
      expect(json.message).toBe("No matching recipients to send to");
      expect(insertedNotifications).toHaveLength(0);
    });

    it("IDOR defense: returns 403 Forbidden if propertyId belongs to another landlord", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-1",
        userRole: "landlord",
        supabase: {} as any,
      });

      mockVerifyLandlordPropertyOwnership.mockResolvedValue(false);

      const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
        method: "POST",
        body: JSON.stringify({
          filterType: "all_active_tenants",
          propertyId: "victim-property-of-another-landlord",
          templateKey: "general_notice",
          channels: { inAppNotification: true },
        }),
      });

      const res = await broadcastRoute(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/Property not found or unauthorized/);
    });
  });
});
