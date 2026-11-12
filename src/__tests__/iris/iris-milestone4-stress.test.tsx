import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { POST as quickSettleRoute } from "@/app/api/landlord/iris/payments/quick-settle/route";
import { POST as quickUpdateTicketRoute } from "@/app/api/landlord/iris/maintenance/quick-update/route";
import { POST as renewalOfferRoute } from "@/app/api/landlord/iris/leases/renewal-offer/route";
import * as authGuard from "@/lib/api/auth-guard";
import {
  IrisOperationsService,
  recordQuickSettlement,
  updateMaintenanceTicketStatus,
  QuickSettlementInputSchema,
  roundCentavos,
  type ActiveLeaseSummary,
  type MaintenanceTicketSummary,
  type LandlordOperationsContext,
} from "@/lib/services/iris";
import {
  QuickSettlementCard,
  MaintenanceTicketCard,
  LeaseRenewalCard,
  TenantDirectoryCard,
} from "@/components/landlord/iris/tools";
import { IrisAssistantWorkspace } from "@/components/landlord/iris/IrisAssistantWorkspace";
import { IrisContextualDrawer } from "@/components/landlord/iris/IrisContextualDrawer";
import { ContactList } from "@/components/landlord/messages/ContactList";

// Mocks
vi.mock("@/lib/api/auth-guard", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/context/LanguageContext", () => ({
  useLanguageContext: () => ({
    t: (key: string) => key,
    language: "en",
    setLanguage: vi.fn(),
  }),
}));

describe("Milestone 4: Adversarial Stress & Empirical Verification Test Suite", () => {
  const sampleLeases: ActiveLeaseSummary[] = [
    {
      id: "lease-alpha-101",
      tenantId: "tenant-juan",
      tenantName: "Juan Dela Cruz",
      tenantEmail: "juan@example.ph",
      tenantPhone: "+639171234567",
      unitId: "unit-101",
      unitName: "Unit 101",
      propertyId: "prop-alpha",
      propertyName: "Alpha Residences",
      monthlyRent: 20000,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      outstandingBalance: 20000,
      daysOverdue: 15,
      dueDate: "2026-11-01",
    },
    {
      id: "lease-alpha-102",
      tenantId: "tenant-maria",
      tenantName: "Maria Santos",
      tenantEmail: "maria@example.ph",
      tenantPhone: "+639189876543",
      unitId: "unit-102",
      unitName: "Unit 102",
      propertyId: "prop-alpha",
      propertyName: "Alpha Residences",
      monthlyRent: 25000,
      startDate: "2026-02-01",
      endDate: "2026-11-30",
      outstandingBalance: 0,
      daysOverdue: 0,
      dueDate: "2026-12-01",
    },
  ];

  const sampleTickets: MaintenanceTicketSummary[] = [
    {
      id: "ticket-101",
      unitId: "unit-101",
      unitName: "Unit 101",
      propertyId: "prop-alpha",
      propertyName: "Alpha Residences",
      tenantName: "Juan Dela Cruz",
      title: "Broken Main Water Pipe",
      description: "Water leaking heavily in kitchen ceiling.",
      priority: "urgent",
      status: "pending",
      createdAt: "2026-11-10T08:00:00Z",
    },
    {
      id: "ticket-102",
      unitId: "unit-102",
      unitName: "Unit 102",
      propertyId: "prop-alpha",
      propertyName: "Alpha Residences",
      tenantName: "Maria Santos",
      title: "Faulty Outlet",
      description: "Bedroom socket sparking when plugged.",
      priority: "high",
      status: "assigned",
      assignedTechnician: "Kuya Bert (Electrician)",
      createdAt: "2026-11-11T10:00:00Z",
    },
  ];

  const sampleContext: LandlordOperationsContext = {
    properties: [
      {
        id: "prop-alpha",
        name: "Alpha Residences",
        totalUnits: 10,
        occupiedUnits: 8,
      },
    ],
    activeLeases: sampleLeases,
    openTickets: sampleTickets,
    expiringLeases: [sampleLeases[1]],
    overdueLeases: [sampleLeases[0]],
    totalReceivables: 20000,
    occupancyRate: 80,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockAuth(role: "landlord" | "tenant", supabaseMock: any) {
    (authGuard.requireAuthenticatedUser as any).mockResolvedValue({
      userId: "landlord-stress-master",
      userRole: role,
      supabase: supabaseMock,
    });
  }

  // =========================================================================
  // SUITE 1: Floating-Point, Centavo Precision & Overpayment Stress Probes
  // =========================================================================
  describe("Suite 1: Floating-Point & Precision Stress Probes", () => {
    it("empirically tests sub-centavo rounding boundaries (0.001, 0.004, 0.005, 0.009)", () => {
      // 0.001 * 100 = 0.1 -> 0
      expect(roundCentavos(0.001)).toBe(0);
      // 0.004 * 100 = 0.4 -> 0
      expect(roundCentavos(0.004)).toBe(0);
      // 0.005 * 100 = 0.5 -> rounds to 1 centavo in JS (0.01)
      expect(roundCentavos(0.005)).toBe(0.01);
      // 0.009 * 100 = 0.9 -> rounds to 1 centavo (0.01)
      expect(roundCentavos(0.009)).toBe(0.01);
    });

    it("verifies IEEE-754 precision drift mitigation (0.1 + 0.2)", () => {
      const rawSum = 0.1 + 0.2; // 0.30000000000000004
      expect(rawSum).not.toBe(0.3);
      expect(roundCentavos(rawSum)).toBe(0.3);
    });

    it("handles fractional centavo settlements without balance corruption", () => {
      const invoice = {
        id: "inv-fractional",
        totalAmount: 1000.0,
        currentBalance: 1000.0,
      };

      const result = recordQuickSettlement(
        {
          invoiceId: "inv-fractional",
          amount: 250.006, // Rounds up to 250.01
          method: "cash",
          paymentDate: "2026-11-12",
        },
        invoice
      );

      expect(result.amountPaid).toBe(250.01);
      expect(result.remainingBalance).toBe(749.99);
      expect(result.status).toBe("partial");
    });

    it("handles full overpayment by clamping remaining balance to 0 and marking completed", () => {
      const invoice = {
        id: "inv-overpay",
        totalAmount: 500.0,
        currentBalance: 500.0,
      };

      const result = recordQuickSettlement(
        {
          invoiceId: "inv-overpay",
          amount: 750.0, // Overpaying by 250
          method: "bank_transfer",
          paymentDate: "2026-11-12",
        },
        invoice
      );

      expect(result.amountPaid).toBe(750.0);
      expect(result.remainingBalance).toBe(0);
      expect(result.status).toBe("completed");
    });

    it("rejects settlement on an already fully settled invoice (balance <= 0)", () => {
      const invoice = {
        id: "inv-zero-bal",
        totalAmount: 500.0,
        currentBalance: 0,
      };

      expect(() =>
        recordQuickSettlement(
          {
            invoiceId: "inv-zero-bal",
            amount: 100,
            method: "cash",
            paymentDate: "2026-11-12",
          },
          invoice
        )
      ).toThrow("Cannot record payment: invoice is already fully settled");
    });

    it("QuickSettlementInputSchema rejects non-positive amounts (0 and negative numbers)", () => {
      expect(() =>
        QuickSettlementInputSchema.parse({
          invoiceId: "inv-1",
          amount: 0,
          method: "cash",
          paymentDate: "2026-11-12",
        })
      ).toThrow();

      expect(() =>
        QuickSettlementInputSchema.parse({
          invoiceId: "inv-1",
          amount: -50,
          method: "cash",
          paymentDate: "2026-11-12",
        })
      ).toThrow();
    });

    it("backend route rejects overpayment if invoice balance is already 0 with 500", async () => {
      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "inv-settled",
                  lease_id: "lease-101",
                  amount: 5000,
                  paid_amount: 5000,
                  balance_remaining: 0,
                },
                error: null,
              }),
            }),
          }),
        }),
      };
      mockAuth("landlord", mockSupabase);
      vi.spyOn(IrisOperationsService, "verifyLandlordLeaseOwnership").mockResolvedValue(true);

      const req = new Request("http://localhost/api/landlord/iris/payments/quick-settle", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: "inv-settled",
          amount: 100,
          method: "cash",
          paymentDate: "2026-11-12",
        }),
      });

      const res = await quickSettleRoute(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toContain("already fully settled");
    });

    it("backend renewal route enforces maximum allowable proposed rent boundary (9,999,999.99)", async () => {
      mockAuth("landlord", {});

      const req = new Request("http://localhost/api/landlord/iris/leases/renewal-offer", {
        method: "POST",
        body: JSON.stringify({
          leaseId: "lease-101",
          proposedRent: 10000000.0, // Exceeds 9,999,999.99 max
          renewalTermMonths: 12,
        }),
      });

      const res = await renewalOfferRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Validation failed");
    });

    it("backend renewal route rejects non-integer renewal term months", async () => {
      mockAuth("landlord", {});

      const req = new Request("http://localhost/api/landlord/iris/leases/renewal-offer", {
        method: "POST",
        body: JSON.stringify({
          leaseId: "lease-101",
          proposedRent: 20000,
          renewalTermMonths: 12.5, // Non-integer
        }),
      });

      const res = await renewalOfferRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Validation failed");
    });
  });

  // =========================================================================
  // SUITE 2: State Machine & Ticket Status Transition Adversarial Probes
  // =========================================================================
  describe("Suite 2: State Machine & Ticket Status Transition Adversarial Probes", () => {
    const pendingTicket: MaintenanceTicketSummary = {
      id: "t-pending",
      unitId: "u-1",
      unitName: "101",
      propertyId: "p-1",
      propertyName: "Sunset",
      tenantName: "Juan",
      title: "Broken Lock",
      description: "Front door lock jammed",
      priority: "high",
      status: "pending",
      createdAt: "2026-11-12T00:00:00Z",
    };

    it("strictly rejects illegal jump from pending directly to closed", () => {
      expect(() =>
        updateMaintenanceTicketStatus(pendingTicket, "closed")
      ).toThrow("Illegal ticket status transition from pending to closed");
    });

    it("strictly rejects illegal jump from pending directly to resolved", () => {
      expect(() =>
        updateMaintenanceTicketStatus(pendingTicket, "resolved")
      ).toThrow("Illegal ticket status transition from pending to resolved");
    });

    it("strictly rejects transition to 'assigned' without assigning a technician", () => {
      expect(() =>
        updateMaintenanceTicketStatus(pendingTicket, "assigned", {
          assignedTechnician: "",
        })
      ).toThrow("Cannot assign ticket without specifying a technician");
    });

    it("strictly rejects illegal backward transition from resolved to pending", () => {
      const resolvedTicket: MaintenanceTicketSummary = {
        ...pendingTicket,
        status: "resolved",
      };
      expect(() =>
        updateMaintenanceTicketStatus(resolvedTicket, "pending")
      ).toThrow("Illegal ticket status transition from resolved to pending");
    });

    it("strictly rejects illegal jump from cancelled directly to resolved", () => {
      const cancelledTicket: MaintenanceTicketSummary = {
        ...pendingTicket,
        status: "cancelled",
      };
      expect(() =>
        updateMaintenanceTicketStatus(cancelledTicket, "resolved")
      ).toThrow("Illegal ticket status transition from cancelled to resolved");
    });

    it("permits legal reopen transitions (closed -> in_progress, cancelled -> pending)", () => {
      const closedTicket: MaintenanceTicketSummary = {
        ...pendingTicket,
        status: "closed",
      };
      const reopened = updateMaintenanceTicketStatus(closedTicket, "in_progress");
      expect(reopened.status).toBe("in_progress");

      const cancelledTicket: MaintenanceTicketSummary = {
        ...pendingTicket,
        status: "cancelled",
      };
      const uncancelled = updateMaintenanceTicketStatus(cancelledTicket, "pending");
      expect(uncancelled.status).toBe("pending");
    });

    it("maintenance quick-update route returns 400 when an illegal transition is attempted", async () => {
      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "t-pending",
                  unit_id: "unit-101",
                  tenant_id: "tenant-juan",
                  landlord_id: "landlord-stress-master",
                  title: "Broken Window",
                  description: "Glass crack",
                  priority: "medium",
                  status: "pending",
                  third_party_name: null,
                },
                error: null,
              }),
            }),
          }),
        }),
      };
      mockAuth("landlord", mockSupabase);

      const req = new Request("http://localhost/api/landlord/iris/maintenance/quick-update", {
        method: "POST",
        body: JSON.stringify({
          ticketId: "t-pending",
          status: "closed", // Illegal from pending
        }),
      });

      const res = await quickUpdateTicketRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Illegal ticket status transition");
    });

    it("maintenance quick-update route returns 400 if trying to assign without technician", async () => {
      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "t-pending",
                  unit_id: "unit-101",
                  tenant_id: "tenant-juan",
                  landlord_id: "landlord-stress-master",
                  title: "Broken Window",
                  description: "Glass crack",
                  priority: "medium",
                  status: "pending",
                  third_party_name: null,
                },
                error: null,
              }),
            }),
          }),
        }),
      };
      mockAuth("landlord", mockSupabase);

      const req = new Request("http://localhost/api/landlord/iris/maintenance/quick-update", {
        method: "POST",
        body: JSON.stringify({
          ticketId: "t-pending",
          status: "assigned",
          assignedTechnician: "", // Empty technician
        }),
      });

      const res = await quickUpdateTicketRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Cannot assign ticket without specifying a technician");
    });

    it("maintenance quick-update route rejects invalid status enum string with 400", async () => {
      mockAuth("landlord", {});

      const req = new Request("http://localhost/api/landlord/iris/maintenance/quick-update", {
        method: "POST",
        body: JSON.stringify({
          ticketId: "t-pending",
          status: "obliterated", // Invalid enum
        }),
      });

      const res = await quickUpdateTicketRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Validation failed");
    });
  });

  // =========================================================================
  // SUITE 3: IDOR Boundary & Cross-Landlord Isolation Probes
  // =========================================================================
  describe("Suite 3: IDOR Boundary & Cross-Landlord Isolation Probes", () => {
    it("quick-settle returns 404 if the requested invoice ID does not exist", async () => {
      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      };
      mockAuth("landlord", mockSupabase);

      const req = new Request("http://localhost/api/landlord/iris/payments/quick-settle", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: "inv-ghost-id",
          amount: 1000,
          method: "cash",
          paymentDate: "2026-11-12",
        }),
      });

      const res = await quickSettleRoute(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain("Invoice not found");
    });

    it("quick-settle returns 403 Forbidden if invoice belongs to another landlord's lease (IDOR check)", async () => {
      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "inv-foreign-101",
                  lease_id: "lease-foreign-999",
                  amount: 10000,
                  balance_remaining: 10000,
                },
                error: null,
              }),
            }),
          }),
        }),
      };
      mockAuth("landlord", mockSupabase);
      vi.spyOn(IrisOperationsService, "verifyLandlordLeaseOwnership").mockResolvedValue(false);

      const req = new Request("http://localhost/api/landlord/iris/payments/quick-settle", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: "inv-foreign-101",
          amount: 5000,
          method: "cash",
          paymentDate: "2026-11-12",
        }),
      });

      const res = await quickSettleRoute(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Lease does not belong to landlord");
    });

    it("maintenance quick-update returns 404 if ticket does not exist", async () => {
      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      };
      mockAuth("landlord", mockSupabase);

      const req = new Request("http://localhost/api/landlord/iris/maintenance/quick-update", {
        method: "POST",
        body: JSON.stringify({
          ticketId: "ticket-ghost-404",
          status: "in_progress",
        }),
      });

      const res = await quickUpdateTicketRoute(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain("Maintenance ticket not found");
    });

    it("maintenance quick-update returns 403 Forbidden if ticket belongs to another landlord's unit (IDOR check)", async () => {
      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => {
                if (table === "maintenance_requests") {
                  return {
                    data: {
                      id: "ticket-foreign",
                      unit_id: "unit-foreign-888",
                      landlord_id: "other-landlord-999",
                      status: "pending",
                    },
                    error: null,
                  };
                }
                if (table === "units") {
                  return {
                    data: {
                      id: "unit-foreign-888",
                      name: "Unit 888",
                      property_id: "prop-foreign-777",
                    },
                    error: null,
                  };
                }
                return { data: null, error: null };
              },
            }),
          }),
        }),
      };
      mockAuth("landlord", mockSupabase);
      vi.spyOn(IrisOperationsService, "verifyLandlordPropertyOwnership").mockResolvedValue(false);

      const req = new Request("http://localhost/api/landlord/iris/maintenance/quick-update", {
        method: "POST",
        body: JSON.stringify({
          ticketId: "ticket-foreign",
          status: "in_progress",
        }),
      });

      const res = await quickUpdateTicketRoute(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("does not belong to landlord's properties");
    });

    it("lease renewal offer returns 403 Forbidden if lease is owned by another landlord", async () => {
      mockAuth("landlord", {});
      vi.spyOn(IrisOperationsService, "verifyLandlordLeaseOwnership").mockResolvedValue(false);

      const req = new Request("http://localhost/api/landlord/iris/leases/renewal-offer", {
        method: "POST",
        body: JSON.stringify({
          leaseId: "lease-victim-101",
          proposedRent: 15000,
          renewalTermMonths: 12,
        }),
      });

      const res = await renewalOfferRoute(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Lease does not belong to landlord");
    });

    it("all three endpoints strictly reject tenant role callers with 403", async () => {
      mockAuth("tenant", {});

      const settleRes = await quickSettleRoute(
        new Request("http://localhost/api/landlord/iris/payments/quick-settle", {
          method: "POST",
          body: JSON.stringify({
            invoiceId: "inv-1",
            amount: 5000,
            method: "cash",
            paymentDate: "2026-11-12",
          }),
        })
      );
      expect(settleRes.status).toBe(403);

      const ticketRes = await quickUpdateTicketRoute(
        new Request("http://localhost/api/landlord/iris/maintenance/quick-update", {
          method: "POST",
          body: JSON.stringify({
            ticketId: "ticket-1",
            status: "in_progress",
          }),
        })
      );
      expect(ticketRes.status).toBe(403);

      const renewalRes = await renewalOfferRoute(
        new Request("http://localhost/api/landlord/iris/leases/renewal-offer", {
          method: "POST",
          body: JSON.stringify({
            leaseId: "lease-1",
            proposedRent: 15000,
            renewalTermMonths: 12,
          }),
        })
      );
      expect(renewalRes.status).toBe(403);
    });
  });

  // =========================================================================
  // SUITE 4: UI Tool Cards Input Adversarial Probes & Injection Resistance
  // =========================================================================
  describe("Suite 4: UI Tool Cards Input Adversarial Probes & Injection Resistance", () => {
    it("QuickSettlementCard neutralizes multiple decimal points (12.34.56.78 -> 12.34)", () => {
      render(
        React.createElement(QuickSettlementCard, {
          leases: sampleLeases,
          preselectedLeaseId: "lease-alpha-101",
        })
      );

      const amountInput = screen.getByLabelText(/Payment Amount/i) as HTMLInputElement;

      // Type in excessive decimal points
      fireEvent.change(amountInput, { target: { value: "12.34.56.78" } });
      expect(amountInput.value).toBe("12.34");
    });

    it("QuickSettlementCard strips currency symbols and non-numeric letters cleanly", () => {
      render(
        React.createElement(QuickSettlementCard, {
          leases: sampleLeases,
          preselectedLeaseId: "lease-alpha-101",
        })
      );

      const amountInput = screen.getByLabelText(/Payment Amount/i) as HTMLInputElement;

      fireEvent.change(amountInput, { target: { value: "₱15,000.50!# abc" } });
      expect(amountInput.value).toBe("15000.50");
    });

    it("QuickSettlementCard prevents client-side overpayment submission and displays alert", async () => {
      const fetchSpy = vi.spyOn(global, "fetch");

      render(
        React.createElement(QuickSettlementCard, {
          leases: sampleLeases,
          preselectedLeaseId: "lease-alpha-101", // Balance is 20,000
        })
      );

      const amountInput = screen.getByLabelText(/Payment Amount/i) as HTMLInputElement;
      fireEvent.change(amountInput, { target: { value: "25000.00" } });

      const submitBtn = screen.getByRole("button", { name: /Issue Receipt & Settle/i });
      fireEvent.click(submitBtn);

      expect(
        screen.getByText(/cannot exceed the balance of ₱20000\.00/i)
      ).toBeInTheDocument();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("QuickSettlementCard safely handles XSS payload in note field without executing", () => {
      render(
        React.createElement(QuickSettlementCard, {
          leases: sampleLeases,
          preselectedLeaseId: "lease-alpha-101",
        })
      );

      const noteInput = screen.getByLabelText(/Note \/ Transaction Memo/i) as HTMLTextAreaElement;
      const xssPayload = `<script>alert('xss-exploit')</script>`;
      fireEvent.change(noteInput, { target: { value: xssPayload } });

      expect(noteInput.value).toBe(xssPayload);
    });

    it("MaintenanceTicketCard blocks assignment when technician input is only whitespace", async () => {
      const fetchSpy = vi.spyOn(global, "fetch");

      render(
        React.createElement(MaintenanceTicketCard, {
          tickets: [sampleTickets[0]], // pending ticket
        })
      );

      // Open technician assignment drawer
      const assignBtn = screen.getByRole("button", { name: /Assign Tech/i });
      fireEvent.click(assignBtn);

      const techInput = screen.getByLabelText(/Technician \/ Contractor Name/i) as HTMLInputElement;
      fireEvent.change(techInput, { target: { value: "     " } });

      const confirmBtn = screen.getByRole("button", { name: /Confirm Update/i });
      fireEvent.click(confirmBtn);

      expect(
        screen.getByText(/Please enter the technician or contractor's name/i)
      ).toBeInTheDocument();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("MaintenanceTicketCard accepts special characters and non-English names safely", () => {
      render(
        React.createElement(MaintenanceTicketCard, {
          tickets: [sampleTickets[0]],
        })
      );

      const assignBtn = screen.getByRole("button", { name: /Assign Tech/i });
      fireEvent.click(assignBtn);

      const techInput = screen.getByLabelText(/Technician \/ Contractor Name/i) as HTMLInputElement;
      fireEvent.change(techInput, { target: { value: "Mang Ñorberto & Sons (Air-con & Tubo) 🔧" } });

      expect(techInput.value).toBe("Mang Ñorberto & Sons (Air-con & Tubo) 🔧");
    });

    it("LeaseRenewalCard neutralizes multiple decimal points in rent input (25000.50.75 -> 25000.50)", () => {
      render(
        React.createElement(LeaseRenewalCard, {
          expiringLeases: [sampleLeases[1]],
        })
      );

      const rentInput = screen.getByLabelText(/Proposed Monthly Rent/i) as HTMLInputElement;
      fireEvent.change(rentInput, { target: { value: "25000.50.75" } });
      expect(rentInput.value).toBe("25000.50");
    });

    it("LeaseRenewalCard prevents submission with 0 or negative rent", async () => {
      const fetchSpy = vi.spyOn(global, "fetch");

      render(
        React.createElement(LeaseRenewalCard, {
          expiringLeases: [sampleLeases[1]],
        })
      );

      const rentInput = screen.getByLabelText(/Proposed Monthly Rent/i) as HTMLInputElement;
      fireEvent.change(rentInput, { target: { value: "0" } });

      const sendOfferBtn = screen.getByRole("button", { name: /Send Renewal Offer/i });
      fireEvent.click(sendOfferBtn);

      expect(
        screen.getByText(/Proposed monthly rent must be greater than zero/i)
      ).toBeInTheDocument();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("TenantDirectoryCard handles regex special characters in search without regex crashing", () => {
      render(
        React.createElement(TenantDirectoryCard, {
          leases: sampleLeases,
        })
      );

      const searchInput = screen.getByPlaceholderText(/Search resident name/i) as HTMLInputElement;

      // Test characters that would break RegExp if unescaped: (, [, *, +, ?, ^, $, \
      const dangerousPatterns = ["(", "[", ".*", "+?^$", "\\"];
      for (const pattern of dangerousPatterns) {
        expect(() => {
          fireEvent.change(searchInput, { target: { value: pattern } });
        }).not.toThrow();
        // Since no resident names contain these symbols, list shows "No Residents Found"
        expect(screen.getByText(/No Residents Found/i)).toBeInTheDocument();
      }
    });

    it("TenantDirectoryCard search query is case-insensitive and trims leading/trailing spaces", () => {
      render(
        React.createElement(TenantDirectoryCard, {
          leases: sampleLeases,
        })
      );

      const searchInput = screen.getByPlaceholderText(/Search resident name/i) as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: "  MARIA  " } });
      expect(screen.getByText("Maria Santos")).toBeInTheDocument();
      expect(screen.queryByText("Juan Dela Cruz")).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // SUITE 5: Pinned Assistant ID Collision Handling & Workspace Integration
  // =========================================================================
  describe("Suite 5: Pinned Assistant ID Collision & Workspace Integration Probes", () => {
    it("ContactList renders pinned 'iris-assistant' tile at top with special styling and handles selection", () => {
      const handleSelect = vi.fn();

      render(
        React.createElement(ContactList, {
          contacts: [
            {
              id: "contact-1",
              participant: { id: "user-1", fullName: "Regular Tenant", email: "tenant@ph.com" },
              lastMessage: null,
              unreadCount: 0,
            },
          ],
          activeConversationId: "iris-assistant",
          setActiveConversationId: handleSelect,
          isSidebarLoading: false,
          searchQuery: "",
          setSearchQuery: vi.fn(),
          userSearchResults: [],
          isSearchingUsers: false,
          userSearchError: null,
          handleStartConversation: vi.fn(),
          conversationsError: null,
          setConversationsError: vi.fn(),
        })
      );

      // Verify Pinned Assistant Tile exists
      const assistantTile = screen.getByRole("button", { name: /iRis Operations Assistant/i });
      expect(assistantTile).toBeInTheDocument();

      // Check active styling class
      expect(assistantTile.className).toContain("neumorphic-inset");

      // Clicking calls setActiveConversationId with 'iris-assistant'
      fireEvent.click(assistantTile);
      expect(handleSelect).toHaveBeenCalledWith("iris-assistant");
    });

    it("IrisAssistantWorkspace renders resiliently with zero leases and zero tickets", () => {
      const emptyContext: LandlordOperationsContext = {
        properties: [],
        activeLeases: [],
        openTickets: [],
        expiringLeases: [],
        overdueLeases: [],
        totalReceivables: 0,
        occupancyRate: 0,
      };

      render(
        React.createElement(IrisAssistantWorkspace, {
          initialContext: emptyContext,
        })
      );

      // Verify zero state rendering
      expect(screen.getByText("₱0.00")).toBeInTheDocument();
      expect(screen.getByText("0%")).toBeInTheDocument();
      expect(screen.getByText(/Total Unpaid Balance/i)).toBeInTheDocument();
    });

    it("IrisAssistantWorkspace allows smooth tab switching across all 5 operational views", () => {
      render(
        React.createElement(IrisAssistantWorkspace, {
          initialContext: sampleContext,
        })
      );

      // Switch to Record Payment
      const payNavBtn = screen.getByRole("button", { name: /Record Payment/i });
      fireEvent.click(payNavBtn);
      expect(screen.getByRole("heading", { name: /Record Payment Settlement/i })).toBeInTheDocument();

      // Switch to Maintenance Triage
      const triageNavBtn = screen.getByRole("button", { name: /Maintenance Triage/i });
      fireEvent.click(triageNavBtn);
      expect(screen.getByRole("heading", { name: /Maintenance & Repairs/i })).toBeInTheDocument();

      // Switch to Lease Expiry Check
      const renewalsNavBtn = screen.getByRole("button", { name: /Lease Expiry Check/i });
      fireEvent.click(renewalsNavBtn);
      expect(screen.getByRole("heading", { name: /Lease Expiry & Renewal Offers/i })).toBeInTheDocument();

      // Switch to Resident Directory via Resident Lookup button
      const directoryNavBtn = screen.getByRole("button", { name: /Resident Lookup/i });
      fireEvent.click(directoryNavBtn);
      expect(screen.getByRole("heading", { name: /Resident Directory/i })).toBeInTheDocument();

      // Return to Dashboard
      const dashNavBtn = screen.getByRole("button", { name: "Dashboard" });
      fireEvent.click(dashNavBtn);
      expect(screen.getByText(/Total Unpaid Balance/i)).toBeInTheDocument();
    });

    it("IrisAssistantWorkspace cross-tool action from directory switches to settlement view", () => {
      render(
        React.createElement(IrisAssistantWorkspace, {
          initialContext: sampleContext,
        })
      );

      // Go to Directory
      const directoryNavBtn = screen.getByRole("button", { name: /Resident Lookup/i });
      fireEvent.click(directoryNavBtn);

      // In directory, Juan Dela Cruz has outstanding balance of 20,000 -> click "Record Payment"
      const juanPayBtn = screen.getAllByRole("button", { name: /Record Payment/i })[0];
      fireEvent.click(juanPayBtn);

      // Should automatically transition to settlement view preselected with Juan's lease
      expect(screen.getByRole("heading", { name: /Record Payment Settlement/i })).toBeInTheDocument();
      expect(screen.getByText("₱20,000.00")).toBeInTheDocument();
    });

    it("IrisContextualDrawer renders safely and handles tabs and close actions", async () => {
      const handleClose = vi.fn();

      vi.spyOn(global, "fetch").mockImplementation(async (url: any) => {
        if (url === "/api/landlord/iris/context") {
          return {
            ok: true,
            json: async () => ({ success: true, data: sampleContext }),
          } as any;
        }
        return {
          ok: true,
          json: async () => ({ success: true }),
        } as any;
      });

      const { rerender } = render(
        React.createElement(IrisContextualDrawer, {
          isOpen: false,
          onClose: handleClose,
        })
      );

      // When closed, renders null
      expect(screen.queryByText(/Resident Tools/i)).not.toBeInTheDocument();

      // Rerender as open
      rerender(
        React.createElement(IrisContextualDrawer, {
          isOpen: true,
          onClose: handleClose,
          activeTenantName: "Juan Dela Cruz",
          activeUnitName: "Unit 101",
        })
      );

      await waitFor(() => {
        expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
      });

      // Test Tab navigation: Repairs tab
      const repairsTab = screen.getByRole("button", { name: /Repairs/i });
      fireEvent.click(repairsTab);
      expect(screen.getByRole("heading", { name: /Maintenance & Repairs/i })).toBeInTheDocument();

      // Test close button
      const closeBtn = screen.getByRole("button", { name: /Close Drawer/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
