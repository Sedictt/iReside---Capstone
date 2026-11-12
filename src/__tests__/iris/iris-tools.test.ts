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
  type ActiveLeaseSummary,
  type MaintenanceTicketSummary,
} from "@/lib/services/iris";
import {
  QuickSettlementCard,
  MaintenanceTicketCard,
  LeaseRenewalCard,
  TenantDirectoryCard,
} from "@/components/landlord/iris/tools";

vi.mock("@/lib/api/auth-guard", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

describe("Milestone 4: Iris Operations Assistant Tools & UI Integration", () => {
  const sampleLeases: ActiveLeaseSummary[] = [
    {
      id: "lease-101",
      tenantId: "tenant-juan",
      tenantName: "Juan Dela Cruz",
      tenantEmail: "juan@example.com",
      tenantPhone: "09171234567",
      unitId: "unit-101",
      unitName: "101",
      propertyId: "prop-1",
      propertyName: "Sunrise Apartments",
      monthlyRent: 15000,
      startDate: "2026-01-01",
      endDate: "2026-12-15",
      outstandingBalance: 15000,
      daysOverdue: 10,
      dueDate: "2026-11-01",
    },
    {
      id: "lease-102",
      tenantId: "tenant-maria",
      tenantName: "Maria Clara",
      tenantEmail: "maria@example.com",
      tenantPhone: "09189876543",
      unitId: "unit-102",
      unitName: "102",
      propertyId: "prop-1",
      propertyName: "Sunrise Apartments",
      monthlyRent: 18000,
      startDate: "2026-01-01",
      endDate: "2026-11-30", // <60 days remaining
      outstandingBalance: 0,
      daysOverdue: 0,
      dueDate: "2026-12-01",
    },
  ];

  const sampleTickets: MaintenanceTicketSummary[] = [
    {
      id: "ticket-1",
      unitId: "unit-101",
      unitName: "101",
      propertyId: "prop-1",
      propertyName: "Sunrise Apartments",
      tenantName: "Juan Dela Cruz",
      title: "Leaking Faucet",
      description: "Kitchen sink faucet is dripping continuously.",
      priority: "medium",
      status: "pending",
      createdAt: "2026-11-10T10:00:00Z",
    },
    {
      id: "ticket-2",
      unitId: "unit-102",
      unitName: "102",
      propertyId: "prop-1",
      propertyName: "Sunrise Apartments",
      tenantName: "Maria Clara",
      title: "Broken Aircon",
      description: "AC not blowing cold air and making rattling noise.",
      priority: "urgent",
      status: "assigned",
      assignedTechnician: "Kuya Bert (HVAC)",
      createdAt: "2026-11-11T08:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockAuth(role: "landlord" | "tenant", supabaseMock: any) {
    (authGuard.requireAuthenticatedUser as any).mockResolvedValue({
      userId: "landlord-123",
      userRole: role,
      supabase: supabaseMock,
    });
  }

  // =========================================================================
  // 1. Backend API: Quick Settlement Route
  // =========================================================================
  describe("1. Quick Settlement Endpoint (payments/quick-settle)", () => {
    it("rejects unauthorized non-landlord requests with 403", async () => {
      mockAuth("tenant", {});
      const req = new Request("http://localhost/api/landlord/iris/payments/quick-settle", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: "inv-1",
          amount: 5000,
          method: "cash",
          paymentDate: "2026-11-12",
        }),
      });

      const res = await quickSettleRoute(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Landlord role required");
    });

    it("rejects invalid request bodies with 400", async () => {
      mockAuth("landlord", {});
      const req = new Request("http://localhost/api/landlord/iris/payments/quick-settle", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: "",
          amount: -500, // Invalid negative amount
          method: "bitcoin", // Invalid method
          paymentDate: "invalid-date",
        }),
      });

      const res = await quickSettleRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Validation failed");
    });

    it("verifies lease ownership and rejects unauthorized lease access with 403", async () => {
      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "inv-unauth",
                  lease_id: "lease-other",
                  tenant_id: "tenant-other",
                  landlord_id: "other-landlord",
                  amount: 10000,
                  balance_remaining: 10000,
                  paid_amount: 0,
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
          invoiceId: "inv-unauth",
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

    it("executes full settlement, updates payment status to completed, issues receipt, and notifies tenant", async () => {
      const updatedPayments: any[] = [];
      const insertedNotifications: any[] = [];
      const insertedMessages: any[] = [];

      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => {
                if (table === "payments") {
                  return {
                    data: {
                      id: "inv-101",
                      lease_id: "lease-101",
                      tenant_id: "tenant-juan",
                      landlord_id: "landlord-123",
                      amount: 15000,
                      balance_remaining: 15000,
                      paid_amount: 0,
                      metadata: {},
                    },
                    error: null,
                  };
                }
                return { data: null, error: null };
              },
              in: () => ({
                maybeSingle: async () => ({ data: { conversation_id: "conv-101" } }),
              }),
            }),
          }),
          update: (payload: any) => ({
            eq: async (col: string, val: string) => {
              updatedPayments.push({ ...payload, [col]: val });
              return { data: payload, error: null };
            },
          }),
          insert: async (data: any) => {
            if (table === "notifications") {
              insertedNotifications.push(data);
            }
            if (table === "messages") {
              insertedMessages.push(data);
            }
            return { data, error: null };
          },
        }),
      };

      mockAuth("landlord", mockSupabase);
      vi.spyOn(IrisOperationsService, "verifyLandlordLeaseOwnership").mockResolvedValue(true);

      const req = new Request("http://localhost/api/landlord/iris/payments/quick-settle", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: "inv-101",
          amount: 15000,
          method: "cash",
          referenceNumber: "CASH-OFFICE-01",
          paymentDate: "2026-11-12",
          note: "Direct in-person cash settlement at admin desk",
        }),
      });

      const res = await quickSettleRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.amountPaid).toBe(15000);
      expect(json.remainingBalance).toBe(0);
      expect(json.status).toBe("completed");
      expect(json.receiptNumber).toMatch(/^REC-202611-[A-Z0-9]{5}$/);

      // Verify DB update
      expect(updatedPayments).toHaveLength(1);
      expect(updatedPayments[0].status).toBe("completed");
      expect(updatedPayments[0].workflow_status).toBe("receipted");
      expect(updatedPayments[0].balance_remaining).toBe(0);
      expect(updatedPayments[0].paid_amount).toBe(15000);

      // Verify notification
      expect(insertedNotifications).toHaveLength(1);
      expect(insertedNotifications[0].user_id).toBe("tenant-juan");
      expect(insertedNotifications[0].title).toBe("Payment Receipt Issued");

      // Verify direct message
      expect(insertedMessages).toHaveLength(1);
      expect(insertedMessages[0].type).toBe("system");
      expect(insertedMessages[0].metadata.systemType).toBe("receipt");
      expect(insertedMessages[0].metadata.amountPaid).toBe(15000);
    });

    it("executes partial settlement and computes remaining balance accurately", async () => {
      const updatedPayments: any[] = [];
      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "inv-101",
                  lease_id: "lease-101",
                  tenant_id: "tenant-juan",
                  landlord_id: "landlord-123",
                  amount: 15000,
                  balance_remaining: 15000,
                  paid_amount: 0,
                },
                error: null,
              }),
            }),
          }),
          update: (payload: any) => ({
            eq: async () => {
              updatedPayments.push(payload);
              return { data: payload, error: null };
            },
          }),
          insert: async () => ({ data: null, error: null }),
        }),
      };

      mockAuth("landlord", mockSupabase);
      vi.spyOn(IrisOperationsService, "verifyLandlordLeaseOwnership").mockResolvedValue(true);

      const req = new Request("http://localhost/api/landlord/iris/payments/quick-settle", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: "inv-101",
          amount: 7500, // 50% partial payment
          method: "bank_transfer",
          paymentDate: "2026-11-12",
        }),
      });

      const res = await quickSettleRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.amountPaid).toBe(7500);
      expect(json.remainingBalance).toBe(7500);
      expect(json.status).toBe("partial");
      expect(updatedPayments[0].status).toBe("pending");
      expect(updatedPayments[0].workflow_status).toBe("receipted");
      expect(updatedPayments[0].balance_remaining).toBe(7500);
    });
  });

  // =========================================================================
  // 2. Backend API: Maintenance Ticket Quick Update Route
  // =========================================================================
  describe("2. Maintenance Ticket Quick Update (maintenance/quick-update)", () => {
    it("rejects unauthorized ticket access with 403", async () => {
      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "ticket-foreign",
                  landlord_id: "other-landlord",
                  unit_id: "unit-999",
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
          ticketId: "ticket-foreign",
          status: "in_progress",
        }),
      });

      const res = await quickUpdateTicketRoute(req);
      expect(res.status).toBe(403);
    });

    it("rejects assignment without technician name with 400", async () => {
      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => {
                if (table === "maintenance_requests") {
                  return {
                    data: {
                      id: "ticket-1",
                      landlord_id: "landlord-123",
                      unit_id: "unit-101",
                      status: "pending",
                      priority: "medium",
                      title: "Leak",
                      description: "Drip",
                      created_at: "2026-11-10T00:00:00Z",
                    },
                    error: null,
                  };
                }
                return { data: { name: "101", property_id: "prop-1" }, error: null };
              },
            }),
          }),
        }),
      };
      mockAuth("landlord", mockSupabase);
      vi.spyOn(IrisOperationsService, "verifyLandlordPropertyOwnership").mockResolvedValue(true);

      const req = new Request("http://localhost/api/landlord/iris/maintenance/quick-update", {
        method: "POST",
        body: JSON.stringify({
          ticketId: "ticket-1",
          status: "assigned",
          // technician omitted
        }),
      });

      const res = await quickUpdateTicketRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("specifying a technician");
    });

    it("successfully assigns ticket and dispatches notification to tenant", async () => {
      const updatedTickets: any[] = [];
      const insertedNotifications: any[] = [];

      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => {
                if (table === "maintenance_requests") {
                  return {
                    data: {
                      id: "ticket-1",
                      landlord_id: "landlord-123",
                      tenant_id: "tenant-juan",
                      unit_id: "unit-101",
                      status: "pending",
                      priority: "medium",
                      title: "Leaking Faucet",
                      description: "Drip",
                      created_at: "2026-11-10T00:00:00Z",
                    },
                    error: null,
                  };
                }
                if (table === "units") {
                  return { data: { name: "101", property_id: "prop-1" }, error: null };
                }
                if (table === "properties") {
                  return { data: { name: "Sunrise Apartments" }, error: null };
                }
                return { data: { full_name: "Juan Dela Cruz" }, error: null };
              },
            }),
          }),
          update: (payload: any) => ({
            eq: async () => {
              updatedTickets.push(payload);
              return { data: payload, error: null };
            },
          }),
          insert: async (data: any) => {
            if (table === "notifications") {
              insertedNotifications.push(data);
            }
            return { data, error: null };
          },
        }),
      };

      mockAuth("landlord", mockSupabase);
      vi.spyOn(IrisOperationsService, "verifyLandlordPropertyOwnership").mockResolvedValue(true);

      const req = new Request("http://localhost/api/landlord/iris/maintenance/quick-update", {
        method: "POST",
        body: JSON.stringify({
          ticketId: "ticket-1",
          status: "assigned",
          assignedTechnician: "Mang Carding (Plumbing)",
          notes: "Scheduled for tomorrow morning",
        }),
      });

      const res = await quickUpdateTicketRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.status).toBe("assigned");
      expect(json.assignedTechnician).toBe("Mang Carding (Plumbing)");
      expect(updatedTickets).toHaveLength(1);
      expect(updatedTickets[0].status).toBe("assigned");
      expect(updatedTickets[0].third_party_name).toBe("Mang Carding (Plumbing)");

      expect(insertedNotifications).toHaveLength(1);
      expect(insertedNotifications[0].user_id).toBe("tenant-juan");
      expect(insertedNotifications[0].title).toBe("Maintenance Ticket Updated");
      expect(insertedNotifications[0].message).toContain("Mang Carding (Plumbing)");
    });
  });

  // =========================================================================
  // 3. Backend API: Lease Renewal Offer Route
  // =========================================================================
  describe("3. Lease Renewal Offer (leases/renewal-offer)", () => {
    it("verifies lease ownership and rejects unauthorized landlord with 403", async () => {
      mockAuth("landlord", {});
      vi.spyOn(IrisOperationsService, "verifyLandlordLeaseOwnership").mockResolvedValue(false);

      const req = new Request("http://localhost/api/landlord/iris/leases/renewal-offer", {
        method: "POST",
        body: JSON.stringify({
          leaseId: "lease-unauth",
          proposedRent: 16000,
          renewalTermMonths: 12,
        }),
      });

      const res = await renewalOfferRoute(req);
      expect(res.status).toBe(403);
    });

    it("renders pre-vetted template, dispatches system chat and notification", async () => {
      const insertedNotifications: any[] = [];
      const insertedMessages: any[] = [];

      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => {
                if (table === "leases") {
                  return {
                    data: {
                      id: "lease-102",
                      tenant_id: "tenant-maria",
                      unit_id: "unit-102",
                      monthly_rent: 18000,
                      end_date: "2026-11-30",
                    },
                    error: null,
                  };
                }
                if (table === "units") {
                  return { data: { name: "102", property_id: "prop-1" }, error: null };
                }
                if (table === "properties") {
                  return { data: { name: "Sunrise Apartments" }, error: null };
                }
                return { data: { full_name: "Maria Clara" }, error: null };
              },
            }),
          }),
          insert: async (data: any) => {
            if (table === "notifications") insertedNotifications.push(data);
            if (table === "messages") insertedMessages.push(data);
            return { data, error: null };
          },
        }),
      };

      mockAuth("landlord", mockSupabase);
      vi.spyOn(IrisOperationsService, "verifyLandlordLeaseOwnership").mockResolvedValue(true);

      const req = new Request("http://localhost/api/landlord/iris/leases/renewal-offer", {
        method: "POST",
        body: JSON.stringify({
          leaseId: "lease-102",
          proposedRent: 19500,
          renewalTermMonths: 12,
          customMessage: "Thank you for being a wonderful resident. We are happy to offer renewed terms.",
        }),
      });

      const res = await renewalOfferRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.leaseId).toBe("lease-102");
      expect(json.message).toContain("Hello Maria Clara");
      expect(json.message).toContain("Sunrise Apartments");
      expect(json.message).toContain("12 months");
      expect(json.message).toContain("19,500.00");

      expect(insertedNotifications).toHaveLength(1);
      expect(insertedNotifications[0].user_id).toBe("tenant-maria");
      expect(insertedNotifications[0].title).toBe("Lease Renewal Offer");

      expect(insertedMessages).toHaveLength(1);
      expect(insertedMessages[0].type).toBe("system");
      expect(insertedMessages[0].metadata.systemType).toBe("lease_renewal");
    });
  });

  // =========================================================================
  // 4. UI Tool Cards Component Testing
  // =========================================================================
  describe("4. Operations Assistant Tool Cards UI", () => {
    it("QuickSettlementCard renders preset chips and sanitizes decimal input in real time", () => {
      render(
        React.createElement(QuickSettlementCard, {
          leases: sampleLeases,
          preselectedLeaseId: "lease-101",
        })
      );

      // Verify resident and balance displayed
      expect(screen.getByText(/Total Balance Due/i)).toBeInTheDocument();
      expect(screen.getByText("₱15,000.00")).toBeInTheDocument();

      // Find amount input
      const amountInput = screen.getByLabelText(/Payment Amount/i) as HTMLInputElement;
      expect(amountInput.value).toBe("15000.00");

      // Test 50% preset chip
      const halfChip = screen.getByRole("button", { name: "50%" });
      fireEvent.click(halfChip);
      expect(amountInput.value).toBe("7500.00");

      // Test Full Balance preset chip
      const fullChip = screen.getByRole("button", { name: "Full Balance" });
      fireEvent.click(fullChip);
      expect(amountInput.value).toBe("15000.00");

      // Test real-time non-numeric character sanitization
      fireEvent.change(amountInput, { target: { value: "abc8500.50xyz" } });
      expect(amountInput.value).toBe("8500.50");
    });

    it("MaintenanceTicketCard renders priority badges and toggles technician assignment drawer", async () => {
      const handleUpdated = vi.fn();
      render(
        React.createElement(MaintenanceTicketCard, {
          tickets: sampleTickets,
          onTicketUpdated: handleUpdated,
        })
      );

      // Verify urgent badge rendered
      expect(screen.getByText(/2 tickets/i)).toBeInTheDocument();
      expect(screen.getByText(/Kitchen sink faucet is dripping/i)).toBeInTheDocument();

      // Click "Assign Tech" button to expand input
      const assignButton = screen.getByRole("button", { name: /Assign Tech/i });
      fireEvent.click(assignButton);

      // Technician input should appear
      const techInput = screen.getByLabelText(/Technician \/ Contractor Name/i);
      expect(techInput).toBeInTheDocument();

      // Typing technician name
      fireEvent.change(techInput, { target: { value: "Mang Carding" } });
      expect((techInput as HTMLInputElement).value).toBe("Mang Carding");
    });

    it("LeaseRenewalCard renders expiring lease info, term chips, and handles custom message", () => {
      render(
        React.createElement(LeaseRenewalCard, {
          expiringLeases: [sampleLeases[1]], // Maria lease expiring in Nov
        })
      );

      expect(screen.getByText(/Maria Clara/i)).toBeInTheDocument();
      expect(screen.getByText(/Unit 102/i)).toBeInTheDocument();
      expect(screen.getByText(/Current Monthly Rent/i)).toBeInTheDocument();
      expect(screen.getByText("₱18,000.00")).toBeInTheDocument();

      // Term chips
      const term24 = screen.getByRole("button", { name: /24 Months/i });
      fireEvent.click(term24);

      // Note input with character counter
      const noteInput = screen.getByLabelText(/Message to Resident/i) as HTMLTextAreaElement;
      fireEvent.change(noteInput, { target: { value: "Special discounted rate" } });
      expect(noteInput.value).toBe("Special discounted rate");
      expect(screen.getByText(/23 \/ 250/i)).toBeInTheDocument();
    });

    it("TenantDirectoryCard filters residents by search query and renders action shortcuts", () => {
      const handleBill = vi.fn();
      const handlePay = vi.fn();
      const handleMsg = vi.fn();

      render(
        React.createElement(TenantDirectoryCard, {
          leases: sampleLeases,
          onIssueBill: handleBill,
          onRecordPayment: handlePay,
          onMessageResident: handleMsg,
        })
      );

      expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
      expect(screen.getByText("Maria Clara")).toBeInTheDocument();

      // Filter by "101"
      const searchInput = screen.getByPlaceholderText(/Search resident name/i);
      fireEvent.change(searchInput, { target: { value: "101" } });

      expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
      expect(screen.queryByText("Maria Clara")).not.toBeInTheDocument();

      // Click "Record Payment" button
      const payButton = screen.getByRole("button", { name: /Record Payment/i });
      fireEvent.click(payButton);
      expect(handlePay).toHaveBeenCalledWith("lease-101");
    });
  });
});
