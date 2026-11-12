import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

import {
  type ActiveLeaseSummary,
  filterAudience,
  IrisOperationsService,
} from "@/lib/services/iris/iris-operations.service";
import {
  renderTemplate,
  sanitizeTemplateInput,
  type IrisTemplateKey,
} from "@/lib/services/iris/iris-templates";
import {
  RecipientPreviewTable,
  IrisBroadcastModal,
} from "@/components/landlord/iris/broadcast";
import { POST as broadcastRoute } from "@/app/api/landlord/iris/broadcast/route";
import * as authGuard from "@/lib/api/auth-guard";

// Mock auth-guard
vi.mock("@/lib/api/auth-guard", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

describe("Milestone 3: Iris Bulk Reminders & Announcements", () => {
  const sampleLeases: ActiveLeaseSummary[] = [
    {
      id: "lease-1",
      tenantId: "tenant-1",
      tenantName: "Juan Dela Cruz",
      tenantEmail: "juan@example.com",
      tenantPhone: "+639171234567",
      unitId: "unit-101",
      unitName: "101",
      propertyId: "prop-alpha",
      propertyName: "Alpha Residences",
      monthlyRent: 15000,
      startDate: "2026-01-01",
      endDate: "2027-05-31",
      outstandingBalance: 15000,
      daysOverdue: 12,
      dueDate: "2026-11-01",
    },
    {
      id: "lease-2",
      tenantId: "tenant-2",
      tenantName: "Maria Santos",
      tenantEmail: "maria@example.com",
      tenantPhone: "+639187654321",
      unitId: "unit-102",
      unitName: "102",
      propertyId: "prop-alpha",
      propertyName: "Alpha Residences",
      monthlyRent: 18000,
      startDate: "2026-02-01",
      endDate: "2026-11-25", // Expiring within 13 days of Nov 12
      outstandingBalance: 18000,
      daysOverdue: 0,
      dueDate: "2026-11-15", // Due within 3 days
    },
    {
      id: "lease-3",
      tenantId: "tenant-3",
      tenantName: "Pedro Penduko",
      unitId: "unit-201",
      unitName: "201",
      propertyId: "prop-beta",
      propertyName: "Beta Tower",
      monthlyRent: 22000,
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
  // 1. Audience Filtering & Template Rendering Integration
  // =========================================================================
  describe("1. Audience Filtering & Template Rendering", () => {
    it("filters overdue_5d audience accurately", () => {
      const overdue = filterAudience(sampleLeases, "overdue_5d", {
        referenceDate: "2026-11-12",
      });
      expect(overdue).toHaveLength(1);
      expect(overdue[0].id).toBe("lease-1");
      expect(overdue[0].tenantName).toBe("Juan Dela Cruz");
    });

    it("filters due_soon audience within 5 days threshold", () => {
      const dueSoon = filterAudience(sampleLeases, "due_soon", {
        referenceDate: "2026-11-12",
        dueSoonDaysThreshold: 5,
      });
      // lease-2 is due on 2026-11-15 (3 days from Nov 12) with balance 18000
      expect(dueSoon).toHaveLength(1);
      expect(dueSoon[0].id).toBe("lease-2");
    });

    it("filters expiring_leases_60d audience", () => {
      const expiring = filterAudience(sampleLeases, "expiring_leases_60d", {
        referenceDate: "2026-11-12",
      });
      // lease-2 ends 2026-11-25 (within 60 days)
      expect(expiring).toHaveLength(1);
      expect(expiring[0].id).toBe("lease-2");
    });

    it("filters by propertyId correctly", () => {
      const alphaAll = filterAudience(sampleLeases, "all_active_tenants", {
        propertyId: "prop-alpha",
      });
      expect(alphaAll).toHaveLength(2);
      expect(alphaAll.map((l) => l.unitName)).toEqual(["101", "102"]);

      const betaAll = filterAudience(sampleLeases, "all_active_tenants", {
        propertyId: "prop-beta",
      });
      expect(betaAll).toHaveLength(1);
      expect(betaAll[0].propertyName).toBe("Beta Tower");
    });

    it("renders payment_overdue template with sanitized tokens", () => {
      const rendered = renderTemplate("payment_overdue", {
        tenant_name: "Juan Dela Cruz",
        unit: "101",
        property_name: "Alpha Residences",
        amount: "₱15,000.00",
        due_date: "2026-11-01",
        days_overdue: "12",
      });

      expect(rendered).toContain("URGENT NOTICE: Dear Juan Dela Cruz");
      expect(rendered).toContain("₱15,000.00");
      expect(rendered).toContain("12 days");
      expect(rendered).toContain("2026-11-01");
    });

    it("renders general_notice and strips malicious <script> tags", () => {
      const malicious = "Please pay attention! <script>alert('pwned')</script> Thank you.";
      const rendered = renderTemplate("general_notice", {
        property_name: "Alpha Residences",
        custom_message: malicious,
      });

      expect(rendered).not.toContain("<script>");
      expect(rendered).not.toContain("alert");
      expect(rendered).toContain("Please pay attention!  Thank you.");
    });

    it("renders maintenance_advisory with scheduled date and details", () => {
      const rendered = renderTemplate("maintenance_advisory", {
        property_name: "Alpha Residences",
        unit: "101",
        maintenance_date: "2026-11-20",
        custom_message: "Elevator modernization work will take place between 9 AM and 5 PM.",
      });

      expect(rendered).toContain("Maintenance Advisory for Alpha Residences (101)");
      expect(rendered).toContain("2026-11-20");
      expect(rendered).toContain("Elevator modernization work");
    });
  });

  // =========================================================================
  // 2. RecipientPreviewTable Component Tests
  // =========================================================================
  describe("2. RecipientPreviewTable Component", () => {
    it("renders table with all recipients, units, and selected counts", () => {
      const onToggleSelect = vi.fn();
      const onToggleAll = vi.fn();

      render(
        React.createElement(RecipientPreviewTable, {
          recipients: sampleLeases,
          selectedLeaseIds: new Set(["lease-1", "lease-2"]),
          onToggleSelect,
          onToggleAll,
          templateKey: "payment_gentle",
        })
      );

      // Verify tenant names are rendered
      expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
      expect(screen.getByText("Maria Santos")).toBeInTheDocument();
      expect(screen.getByText("Pedro Penduko")).toBeInTheDocument();

      // Verify selected count summary
      const counter = screen.getByTestId("selected-counter");
      expect(counter).toHaveTextContent("2 of 3 selected");
    });

    it("renders contextual metric badges accurately", () => {
      render(
        React.createElement(RecipientPreviewTable, {
          recipients: sampleLeases,
          selectedLeaseIds: new Set(["lease-1"]),
          onToggleSelect: vi.fn(),
          onToggleAll: vi.fn(),
          templateKey: "payment_overdue",
        })
      );

      // Overdue recipient badge (lease-1 has 15000 overdue by 12 days)
      const badge1 = screen.getByTestId("metric-badge-lease-1");
      expect(badge1).toHaveTextContent("₱15,000.00 • 12 days unpaid");

      // Due soon / due date badge (lease-2 has due date 2026-11-15)
      const badge2 = screen.getByTestId("metric-badge-lease-2");
      expect(badge2).toHaveTextContent(/days left|Due 2026-11-15/);
    });

    it("handles row selection toggle", () => {
      const onToggleSelect = vi.fn();
      render(
        React.createElement(RecipientPreviewTable, {
          recipients: sampleLeases,
          selectedLeaseIds: new Set(["lease-1"]),
          onToggleSelect,
          onToggleAll: vi.fn(),
          templateKey: "payment_gentle",
        })
      );

      const checkbox = screen.getByLabelText("Select Maria Santos");
      fireEvent.click(checkbox);
      expect(onToggleSelect).toHaveBeenCalledWith("lease-2");
    });

    it("handles Select All toggle via master checkbox", () => {
      const onToggleAll = vi.fn();
      render(
        React.createElement(RecipientPreviewTable, {
          recipients: sampleLeases,
          selectedLeaseIds: new Set(["lease-1", "lease-2", "lease-3"]),
          onToggleSelect: vi.fn(),
          onToggleAll,
          templateKey: "payment_gentle",
        })
      );

      const masterCheckbox = screen.getByLabelText("Select all recipients") as HTMLInputElement;
      expect(masterCheckbox.checked).toBe(true);

      // Deselect all
      fireEvent.click(masterCheckbox);
      expect(onToggleAll).toHaveBeenCalledWith(false);
    });

    it("opens and closes inline message preview dialog with substituted text", async () => {
      render(
        React.createElement(RecipientPreviewTable, {
          recipients: sampleLeases,
          selectedLeaseIds: new Set(["lease-1"]),
          onToggleSelect: vi.fn(),
          onToggleAll: vi.fn(),
          templateKey: "payment_overdue",
        })
      );

      // Click "Preview Message" on Juan's row
      const previewBtn = screen.getByTestId("preview-btn-lease-1");
      fireEvent.click(previewBtn);

      // Dialog should appear
      const dialog = await screen.findByTestId("preview-dialog");
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText(/URGENT NOTICE: Dear Juan Dela Cruz/)).toBeInTheDocument();
      expect(dialog).toHaveTextContent("₱15,000.00");

      // Dismiss dialog
      const closeBtn = screen.getByLabelText("Close preview");
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByTestId("preview-dialog")).not.toBeInTheDocument();
      });
    });

    it("renders empty state with plain English copy when no recipients match", () => {
      render(
        React.createElement(RecipientPreviewTable, {
          recipients: [],
          selectedLeaseIds: new Set(),
          onToggleSelect: vi.fn(),
          onToggleAll: vi.fn(),
          templateKey: "payment_overdue",
        })
      );

      const emptyState = screen.getByTestId("recipient-empty-state");
      expect(emptyState).toBeInTheDocument();
      expect(
        screen.getByText("All Good! No residents currently match this filter.")
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 3. API Route Integration Tests (POST /api/landlord/iris/broadcast)
  // =========================================================================
  describe("3. API Route (POST /api/landlord/iris/broadcast)", () => {
    const mockAuthLandlord = (mockSupabase: any) => {
      vi.mocked(authGuard.requireAuthenticatedUser).mockResolvedValue({
        userId: "landlord-1",
        userRole: "landlord",
        supabase: mockSupabase,
      } as any);
    };

    it("returns 401 when request is unauthenticated", async () => {
      vi.mocked(authGuard.requireAuthenticatedUser).mockResolvedValue(
        new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }) as any
      );

      const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const res = await broadcastRoute(req);
      expect(res.status).toBe(401);
    });

    it("returns 403 when user is not a landlord", async () => {
      vi.mocked(authGuard.requireAuthenticatedUser).mockResolvedValue({
        userId: "tenant-1",
        userRole: "tenant",
        supabase: {} as any,
      } as any);

      const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const res = await broadcastRoute(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/Forbidden/);
    });

    it("returns 400 when body fails Zod validation (e.g. no delivery channel selected)", async () => {
      mockAuthLandlord({} as any);

      const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
        method: "POST",
        body: JSON.stringify({
          filterType: "overdue_5d",
          templateKey: "payment_overdue",
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
    });

    it("returns 403 when property ownership verification fails", async () => {
      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        }),
      };
      mockAuthLandlord(mockSupabase);

      const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
        method: "POST",
        body: JSON.stringify({
          filterType: "overdue_5d",
          propertyId: "unowned-property",
          templateKey: "payment_overdue",
          channels: { inAppNotification: true },
        }),
      });

      const res = await broadcastRoute(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/Property not found or unauthorized/);
    });

    it("successfully sends In-App notifications with batch insert", async () => {
      const insertedNotifications: any[] = [];

      // Spy on IrisOperationsService methods
      vi.spyOn(IrisOperationsService, "verifyLandlordPropertyOwnership").mockResolvedValue(true);
      vi.spyOn(IrisOperationsService, "getLandlordOperationalContext").mockResolvedValue({
        landlordId: "landlord-1",
        properties: [{ id: "prop-alpha", name: "Alpha Residences", totalUnits: 2, occupiedUnits: 2 }],
        activeLeases: sampleLeases,
        overdueLeases: [sampleLeases[0]],
        openTickets: [],
        totalReceivables: 33000,
        occupancyRate: 100,
      });

      const mockSupabase = {
        from: (table: string) => ({
          insert: async (data: any) => {
            if (table === "notifications") {
              insertedNotifications.push(...(Array.isArray(data) ? data : [data]));
              return { data, error: null };
            }
            return { data: null, error: null };
          },
        }),
      };
      mockAuthLandlord(mockSupabase);

      const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
        method: "POST",
        body: JSON.stringify({
          filterType: "overdue_5d",
          templateKey: "payment_overdue",
          channels: { inAppNotification: true, directMessage: false },
        }),
      });

      const res = await broadcastRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.count).toBe(1);
      expect(json.channelsDelivered).toContain("in_app_notification");
      expect(insertedNotifications).toHaveLength(1);
      expect(insertedNotifications[0].user_id).toBe("tenant-1");
      expect(insertedNotifications[0].type).toBe("payment");
      expect(insertedNotifications[0].title).toBe("Urgent: Unpaid Rent Notice");
      expect(insertedNotifications[0].message).toContain("Juan Dela Cruz");
      expect(insertedNotifications[0].message).toContain("₱15,000.00");
    });

    it("successfully creates 1-on-1 direct message and updates conversation updated_at", async () => {
      const insertedMessages: any[] = [];
      const updatedConversations: any[] = [];

      vi.spyOn(IrisOperationsService, "getLandlordOperationalContext").mockResolvedValue({
        landlordId: "landlord-1",
        properties: [{ id: "prop-alpha", name: "Alpha Residences", totalUnits: 2, occupiedUnits: 2 }],
        activeLeases: [sampleLeases[1]], // Maria Santos
        overdueLeases: [],
        openTickets: [],
        totalReceivables: 18000,
        occupancyRate: 100,
      });

      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { conversation_id: "conv-101" },
                error: null,
              }),
            }),
          }),
          insert: async (data: any) => {
            if (table === "messages") {
              insertedMessages.push(data);
            }
            return { data, error: null };
          },
          update: (updates: any) => ({
            eq: (col: string, val: string) => {
              if (table === "conversations") {
                updatedConversations.push({ col, val, updates });
              }
              return { data: null, error: null };
            },
          }),
        }),
      };
      mockAuthLandlord(mockSupabase);

      const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
        method: "POST",
        body: JSON.stringify({
          filterType: "expiring_leases_60d",
          templateKey: "lease_renewal",
          channels: { inAppNotification: false, directMessage: true },
        }),
      });

      const res = await broadcastRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.count).toBe(1);
      expect(json.channelsDelivered).toContain("direct_message");
      expect(insertedMessages).toHaveLength(1);
      expect(insertedMessages[0].type).toBe("system");
      expect(insertedMessages[0].content).toContain("Hello Maria Santos");
      expect(insertedMessages[0].content).toContain("Alpha Residences");
      expect(updatedConversations).toHaveLength(1);
    });

    it("filters out unauthorized or non-matching selectedLeaseIds gracefully", async () => {
      const insertedNotifications: any[] = [];

      vi.spyOn(IrisOperationsService, "getLandlordOperationalContext").mockResolvedValue({
        landlordId: "landlord-1",
        properties: [{ id: "prop-alpha", name: "Alpha Residences", totalUnits: 2, occupiedUnits: 2 }],
        activeLeases: sampleLeases,
        overdueLeases: [sampleLeases[0]],
        openTickets: [],
        totalReceivables: 33000,
        occupancyRate: 100,
      });

      const mockSupabase = {
        from: (table: string) => ({
          insert: async (data: any) => {
            if (table === "notifications") {
              insertedNotifications.push(...(Array.isArray(data) ? data : [data]));
            }
            return { data, error: null };
          },
        }),
      };
      mockAuthLandlord(mockSupabase);

      // Juan is overdue (lease-1), but we also maliciously request "unauthorized-lease-999"
      const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
        method: "POST",
        body: JSON.stringify({
          filterType: "overdue_5d",
          templateKey: "payment_overdue",
          selectedLeaseIds: ["lease-1", "unauthorized-lease-999"],
          channels: { inAppNotification: true },
        }),
      });

      const res = await broadcastRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      // Only the genuine matching lease-1 was dispatched
      expect(json.count).toBe(1);
      expect(insertedNotifications).toHaveLength(1);
      expect(insertedNotifications[0].user_id).toBe("tenant-1");
    });

    it("returns count: 0 gracefully when audience is empty", async () => {
      vi.spyOn(IrisOperationsService, "getLandlordOperationalContext").mockResolvedValue({
        landlordId: "landlord-1",
        properties: [],
        activeLeases: [],
        overdueLeases: [],
        openTickets: [],
        totalReceivables: 0,
        occupancyRate: 0,
      });

      mockAuthLandlord({} as any);

      const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
        method: "POST",
        body: JSON.stringify({
          filterType: "overdue_5d",
          templateKey: "payment_overdue",
          channels: { inAppNotification: true },
        }),
      });

      const res = await broadcastRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.count).toBe(0);
      expect(json.recipients).toEqual([]);
    });

    it("sanitizes malicious <script> input in customMessage on API level", async () => {
      const insertedNotifications: any[] = [];

      vi.spyOn(IrisOperationsService, "getLandlordOperationalContext").mockResolvedValue({
        landlordId: "landlord-1",
        properties: [{ id: "prop-alpha", name: "Alpha Residences", totalUnits: 1, occupiedUnits: 1 }],
        activeLeases: [sampleLeases[0]],
        overdueLeases: [],
        openTickets: [],
        totalReceivables: 15000,
        occupancyRate: 100,
      });

      const mockSupabase = {
        from: (table: string) => ({
          insert: async (data: any) => {
            if (table === "notifications") {
              insertedNotifications.push(...(Array.isArray(data) ? data : [data]));
            }
            return { data, error: null };
          },
        }),
      };
      mockAuthLandlord(mockSupabase);

      const req = new Request("http://localhost:3000/api/landlord/iris/broadcast", {
        method: "POST",
        body: JSON.stringify({
          filterType: "all_active_tenants",
          templateKey: "general_notice",
          customMessage: "Routine power drill <script>window.location='evil.com'</script> maintenance.",
          channels: { inAppNotification: true },
        }),
      });

      const res = await broadcastRoute(req);
      expect(res.status).toBe(200);
      expect(insertedNotifications).toHaveLength(1);
      expect(insertedNotifications[0].message).not.toContain("<script>");
      expect(insertedNotifications[0].message).not.toContain("window.location");
      expect(insertedNotifications[0].message).toContain("Routine power drill");
    });
  });

  // =========================================================================
  // 4. IrisBroadcastModal Component Tests
  // =========================================================================
  describe("4. IrisBroadcastModal Component", () => {
    it("renders nothing when isOpen is false", () => {
      const { container } = render(
        React.createElement(IrisBroadcastModal, {
          isOpen: false,
          onClose: vi.fn(),
        })
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders modal with controls, audience filter, and channels when isOpen is true", async () => {
      // Mock global.fetch for context loading
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            properties: [{ id: "prop-alpha", name: "Alpha Residences" }],
            activeLeases: sampleLeases,
          },
        }),
      } as any);

      await act(async () => {
        render(
          React.createElement(IrisBroadcastModal, {
            isOpen: true,
            onClose: vi.fn(),
            initialFilter: "overdue_5d",
          })
        );
      });

      expect(screen.getByText("Send Reminders & Announcements")).toBeInTheDocument();
      expect(screen.getByText("Target Audience Filter")).toBeInTheDocument();
      expect(screen.getByText("Unpaid Rent (Overdue 5+ Days)")).toBeInTheDocument();
      expect(screen.getByText("In-App Notification")).toBeInTheDocument();
      expect(screen.getByText("Direct Chat Message")).toBeInTheDocument();
    });

    it("triggers onClose when clicking Cancel button or close icon", async () => {
      const onClose = vi.fn();
      await act(async () => {
        render(
          React.createElement(IrisBroadcastModal, {
            isOpen: true,
            onClose,
          })
        );
      });

      const cancelBtn = screen.getByText("Cancel");
      fireEvent.click(cancelBtn);
      expect(onClose).toHaveBeenCalled();
    });
  });
});

