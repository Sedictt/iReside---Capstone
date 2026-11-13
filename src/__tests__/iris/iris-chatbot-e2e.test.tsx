import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";

import { IrisAssistantWorkspace } from "@/components/landlord/iris/IrisAssistantWorkspace";
import type { LandlordOperationsContext } from "@/lib/services/iris";

const sampleContext: LandlordOperationsContext = {
  landlordId: "landlord-1",
  properties: [
    { id: "prop-1", name: "Fernando Gonzales Dormitory", totalUnits: 10, occupiedUnits: 8 },
  ],
  activeLeases: [
    {
      id: "lease-1",
      tenantId: "tenant-1",
      tenantName: "Juan Dela Cruz",
      unitId: "unit-1",
      unitName: "Room 101",
      propertyId: "prop-1",
      propertyName: "Fernando Gonzales Dormitory",
      monthlyRent: 4500,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      outstandingBalance: 9000,
      daysOverdue: 12,
      dueDate: "2026-11-01",
    },
    {
      id: "lease-2",
      tenantId: "tenant-2",
      tenantName: "Maria Santos",
      unitId: "unit-2",
      unitName: "Room 202",
      propertyId: "prop-1",
      propertyName: "Fernando Gonzales Dormitory",
      monthlyRent: 5000,
      startDate: "2026-02-01",
      endDate: "2026-11-30",
      outstandingBalance: 0,
      daysOverdue: 0,
      dueDate: "2026-12-01",
    },
  ],
  overdueLeases: [
    {
      id: "lease-1",
      tenantId: "tenant-1",
      tenantName: "Juan Dela Cruz",
      unitId: "unit-1",
      unitName: "Room 101",
      propertyId: "prop-1",
      propertyName: "Fernando Gonzales Dormitory",
      monthlyRent: 4500,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      outstandingBalance: 9000,
      daysOverdue: 12,
      dueDate: "2026-11-01",
    },
  ],
  openTickets: [
    {
      id: "ticket-1",
      unitId: "unit-1",
      unitName: "Room 101",
      propertyId: "prop-1",
      propertyName: "Fernando Gonzales Dormitory",
      tenantName: "Juan Dela Cruz",
      title: "Leaking bathroom faucet",
      description: "Dripping continuously",
      priority: "high",
      status: "pending",
      createdAt: "2026-11-10T10:00:00Z",
    },
  ],
  expiringLeases: [
    {
      id: "lease-2",
      tenantId: "tenant-2",
      tenantName: "Maria Santos",
      unitId: "unit-2",
      unitName: "Room 202",
      propertyId: "prop-1",
      propertyName: "Fernando Gonzales Dormitory",
      monthlyRent: 5000,
      startDate: "2026-02-01",
      endDate: "2026-11-30",
      outstandingBalance: 0,
      daysOverdue: 0,
      dueDate: "2026-12-01",
    },
  ],
  totalReceivables: 9000,
  occupancyRate: 80,
};

const emptyContext: LandlordOperationsContext = {
  landlordId: "landlord-1",
  properties: [],
  activeLeases: [],
  overdueLeases: [],
  openTickets: [],
  expiringLeases: [],
  totalReceivables: 0,
  occupancyRate: 0,
};

function advanceTyping() {
  act(() => {
    vi.advanceTimersByTime(900);
  });
}

async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("iRis Landlord Chatbot — End-to-End & Edge Case Suite", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("E2E Flow 1: Create Invoice for Specific Tenant with Water & Electric Readings", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ invoiceNumber: "INV-202611-001", totalAmount: 5200 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<IrisAssistantWorkspace initialContext={sampleContext} />);

    const input = screen.getByRole("textbox", { name: /Message iRis Assistant/i });
    fireEvent.change(input, { target: { value: "hey, i want some help with creating invoice" } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/i }));
    advanceTyping();

    expect(screen.getByText(/Sure! Who is this invoice for\?/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Specific Tenant/i }));
    advanceTyping();
    expect(screen.getByText(/Which tenant or unit is this invoice for\?/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Juan Dela Cruz \(Room 101\)/i }));
    advanceTyping();
    expect(screen.getByText(/What should we include\?/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Rent \+ Utilities/i }));
    advanceTyping();
    expect(screen.getByText(/current water meter reading/i)).toBeInTheDocument();

    // Reject negative water reading
    fireEvent.change(input, { target: { value: "-50" } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/i }));
    advanceTyping();
    expect(screen.getByText(/valid water meter number between 0 and 9,999,999/i)).toBeInTheDocument();

    // Valid water reading
    fireEvent.change(input, { target: { value: "125" } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/i }));
    advanceTyping();
    expect(screen.getByText(/current electricity meter reading/i)).toBeInTheDocument();

    // Valid electricity reading
    fireEvent.change(input, { target: { value: "450" } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/i }));
    advanceTyping();
    expect(screen.getByText(/Water Reading: 125 m³/i)).toBeInTheDocument();
    expect(screen.getByText(/Electricity Reading: 450 kWh/i)).toBeInTheDocument();

    // Confirm & Send
    fireEvent.click(screen.getByRole("button", { name: /Confirm & Send Invoice/i }));
    await flushAsync();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/landlord/iris/invoices/commit",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          leaseId: "lease-1",
          water: { currentReading: 125 },
          electricity: { currentReading: 450 },
        }),
      })
    );
    expect(screen.getByText(/Done! Invoice \(INV-202611-001\)/i)).toBeInTheDocument();
  });

  it("E2E Flow 2: Batch Invoice for Everyone", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ invoiceNumber: "INV-BATCH", totalAmount: 4500 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<IrisAssistantWorkspace initialContext={sampleContext} />);

    fireEvent.click(screen.getByRole("button", { name: /Create an Invoice/i }));
    advanceTyping();

    fireEvent.click(screen.getByRole("button", { name: /Everyone \(2 Active Tenants\)/i }));
    advanceTyping();
    expect(screen.getByText(/send this month's rent invoice to all 2 active tenants\?/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Yes, Send to All \(2\)/i }));
    await flushAsync();

    const commitCalls = fetchMock.mock.calls.filter(
      ([url]) => url === "/api/landlord/iris/invoices/commit"
    );
    expect(commitCalls).toHaveLength(2);
    expect(screen.getByText(/Done! Sent 2 of 2 monthly rent invoices\./i)).toBeInTheDocument();
  });

  it("E2E Flow 3: Broadcast Notice with Custom Message", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ sentCount: 1 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<IrisAssistantWorkspace initialContext={sampleContext} />);

    fireEvent.click(screen.getByRole("button", { name: /Broadcast a Notice/i }));
    advanceTyping();

    fireEvent.click(screen.getByRole("button", { name: /Overdue Tenants Only/i }));
    advanceTyping();

    fireEvent.click(screen.getByRole("button", { name: /Overdue Rent Notice/i }));
    advanceTyping();

    const input = screen.getByRole("textbox", { name: /Message iRis Assistant/i });
    fireEvent.change(input, { target: { value: "Please settle by Friday 5PM." } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/i }));
    advanceTyping();

    fireEvent.click(screen.getByRole("button", { name: /Send Notice Now/i }));
    await flushAsync();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/landlord/iris/broadcast",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          filterType: "overdue_5d",
          templateKey: "payment_overdue",
          customMessage: "Please settle by Friday 5PM.",
          channels: { inAppNotification: true, directMessage: true },
        }),
      })
    );
    expect(screen.getByText(/Notice sent to 1 recipient/i)).toBeInTheDocument();
  });

  it("E2E Flow 4: Record Payment with Overpayment & Negative Guards", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ receiptNumber: "REC-202611-ABCDE" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<IrisAssistantWorkspace initialContext={sampleContext} />);

    fireEvent.click(screen.getByRole("button", { name: /Record a Payment/i }));
    advanceTyping();

    fireEvent.click(screen.getByRole("button", { name: /Juan Dela Cruz/i }));
    advanceTyping();

    const input = screen.getByRole("textbox", { name: /Message iRis Assistant/i });

    // Reject negative amount
    fireEvent.change(input, { target: { value: "-500" } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/i }));
    advanceTyping();
    expect(screen.getByText(/valid peso amount/i)).toBeInTheDocument();

    // Reject overpayment (> 9000)
    fireEvent.change(input, { target: { value: "15000" } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/i }));
    advanceTyping();
    expect(screen.getByText(/exceeds the outstanding balance/i)).toBeInTheDocument();

    // Valid partial payment
    fireEvent.change(input, { target: { value: "4500" } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/i }));
    advanceTyping();

    fireEvent.click(screen.getByRole("button", { name: /Bank Transfer \/ GCash/i }));
    advanceTyping();

    fireEvent.click(screen.getByRole("button", { name: /Confirm Payment/i }));
    await flushAsync();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/landlord/iris/payments/quick-settle",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"amount":4500'),
      })
    );
    expect(screen.getByText(/Payment recorded!.*REC-202611-ABCDE/i)).toBeInTheDocument();
  });

  it("E2E Flow 5: Maintenance Ticket Update & Lease Renewal Offer", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<IrisAssistantWorkspace initialContext={sampleContext} />);

    // Maintenance update
    fireEvent.click(screen.getByRole("button", { name: /Open Repair Tickets/i }));
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Update a Ticket/i }));
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Room 101: Leaking bathroom faucet/i }));
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Mark Resolved/i }));
    await flushAsync();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/landlord/iris/maintenance/quick-update",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ ticketId: "ticket-1", status: "resolved" }),
      })
    );
    expect(screen.getByText(/Updated "Leaking bathroom faucet" \(Room 101\) to resolved\./i)).toBeInTheDocument();

    // Lease renewal offer
    fireEvent.click(screen.getAllByRole("button", { name: /Expiring Leases/i }).at(-1)!);
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Send Renewal Offer/i }));
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Maria Santos \(Room 202\)/i }));
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Send 12-Month Offer/i }));
    await flushAsync();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/landlord/iris/leases/renewal-offer",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          leaseId: "lease-2",
          proposedRent: 5000,
          renewalTermMonths: 12,
        }),
      })
    );
    expect(screen.getByText(/Sent a 12-month lease renewal offer/i)).toBeInTheDocument();
  });

  it("Edge Case: Zero-Data Portfolio handles all menu actions gracefully without crashing", () => {
    render(<IrisAssistantWorkspace initialContext={emptyContext} />);

    fireEvent.click(screen.getByRole("button", { name: /Create an Invoice/i }));
    advanceTyping();
    expect(screen.getByText(/don't have any active leases yet/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Check Unpaid Rent/i }).at(-1)!);
    advanceTyping();
    expect(screen.getByText(/All active residents are up to date/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Open Repair Tickets/i }).at(-1)!);
    advanceTyping();
    expect(screen.getAllByText(/no open repair tickets right now/i).length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getAllByRole("button", { name: /Expiring Leases/i }).at(-1)!);
    advanceTyping();
    expect(screen.getByText(/No leases are expiring within the next 60 days/i)).toBeInTheDocument();
  });

  it("Edge Case: Taglish keywords, XSS payload safety, and Rapid Double-Click protection", () => {
    render(<IrisAssistantWorkspace initialContext={sampleContext} />);

    const input = screen.getByRole("textbox", { name: /Message iRis Assistant/i });

    // Taglish unpaid query + rapid double-click protection
    fireEvent.change(input, { target: { value: "sinong may utang?" } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/i }));
    // Second click while typing should be ignored
    fireEvent.click(screen.getByRole("button", { name: /Check Unpaid Rent/i }));
    advanceTyping();

    expect(screen.getAllByText(/sinong may utang\?/i)).toHaveLength(1);
    expect(screen.getByText(/unpaid rent totaling/i)).toBeInTheDocument();

    // XSS payload renders as literal text and falls back to menu safely
    fireEvent.change(input, { target: { value: "<script>alert('xss')</script>" } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/i }));
    advanceTyping();
    expect(screen.getByText(/I didn't quite catch that/i)).toBeInTheDocument();
  });

  it("Edge Case: Network failure during invoice commit recovers cleanly without stuck typing state", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network down"));
    vi.stubGlobal("fetch", fetchMock);

    render(<IrisAssistantWorkspace initialContext={sampleContext} />);

    const input = screen.getByRole("textbox", { name: /Message iRis Assistant/i });
    fireEvent.change(input, { target: { value: "create invoice for Juan" } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/i }));
    advanceTyping();

    fireEvent.click(screen.getByRole("button", { name: /Rent Only/i }));
    advanceTyping();

    fireEvent.click(screen.getByRole("button", { name: /Confirm & Send Invoice/i }));
    await flushAsync();

    expect(screen.queryByLabelText(/iRis is typing/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Network error while sending the invoice/i)).toBeInTheDocument();
  });

  it("Edge Case: Stop-word and substring safety prevents false tenant match (e.g. 'and' vs 'Andrew')", () => {
    const contextWithAndrew: LandlordOperationsContext = {
      ...sampleContext,
      activeLeases: [
        ...sampleContext.activeLeases,
        {
          ...sampleContext.activeLeases[0],
          id: "lease-andrew",
          tenantId: "tenant-andrew",
          tenantName: "Andrew Reyes",
          unitName: "Room 305",
        },
      ],
    };

    render(<IrisAssistantWorkspace initialContext={contextWithAndrew} />);

    const input = screen.getByRole("textbox", { name: /Message iRis Assistant/i });
    fireEvent.change(input, { target: { value: "how do i create an invoice and send it?" } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/i }));
    advanceTyping();

    // Should ask "Who is this invoice for?" instead of falsely matching "Andrew" on "and"
    expect(screen.getByText(/Sure! Who is this invoice for\?/i)).toBeInTheDocument();
  });

  it("Edge Case: Clicking an expired button from a previous flow recovers gracefully", () => {
    render(<IrisAssistantWorkspace initialContext={sampleContext} />);

    // Start invoice flow
    fireEvent.click(screen.getByRole("button", { name: /Create an Invoice/i }));
    advanceTyping();

    // Cancel flow
    fireEvent.click(screen.getByRole("button", { name: /^Cancel$/i }));
    advanceTyping();
    expect(screen.getByText(/Cancelled\. What else can I help you with\?/i)).toBeInTheDocument();

    // Now click the stale "Specific Tenant" button from the cancelled flow
    fireEvent.click(screen.getByRole("button", { name: /Specific Tenant/i }));
    advanceTyping();
    expect(screen.getByText(/That action has already finished or expired/i)).toBeInTheDocument();
  });

  it("Edge Case: Batch Invoice partial failure (1 success, 1 409 conflict) reports exact count", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ invoiceNumber: "INV-1" }) })
      .mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ error: "Duplicate" }) })
      .mockResolvedValue({ ok: true, json: async () => ({ data: sampleContext }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<IrisAssistantWorkspace initialContext={sampleContext} />);

    fireEvent.click(screen.getByRole("button", { name: /Create an Invoice/i }));
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Everyone \(2 Active Tenants\)/i }));
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Yes, Send to All \(2\)/i }));
    await flushAsync();

    expect(screen.getByText(/Done! Sent 1 of 2 monthly rent invoices\./i)).toBeInTheDocument();
  });

  it("Edge Case: API 400/500 errors on Broadcast and Payment surface clean error replies", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: "No recipients matched" }) })
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: "Database timeout" }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<IrisAssistantWorkspace initialContext={sampleContext} />);

    // Broadcast 400
    fireEvent.click(screen.getByRole("button", { name: /Broadcast a Notice/i }));
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Due Soon/i }));
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Rent Reminder/i }));
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Use Default Message/i }));
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Send Notice Now/i }));
    await flushAsync();
    expect(screen.getByText(/Could not send notice: No recipients matched/i)).toBeInTheDocument();

    // Payment 500
    fireEvent.click(screen.getAllByRole("button", { name: /Record a Payment/i }).at(-1)!);
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Juan Dela Cruz/i }));
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Full Balance/i }));
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /^Cash$/i }));
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Confirm Payment/i }));
    await flushAsync();
    expect(screen.getByText(/Could not record payment: Database timeout/i)).toBeInTheDocument();
  });

  it("Edge Case: Header Main Menu button cancels active typing animation and resets chat", () => {
    render(<IrisAssistantWorkspace initialContext={sampleContext} />);

    fireEvent.click(screen.getByRole("button", { name: /Check Unpaid Rent/i }));
    expect(screen.getByLabelText(/iRis is typing/i)).toBeInTheDocument();

    // Click header "Main Menu" while typing
    fireEvent.click(screen.getByRole("button", { name: /Main Menu/i }));
    expect(screen.queryByLabelText(/iRis is typing/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Pick an option below or type what you need/i)).toBeInTheDocument();
  });

  it("Edge Case: Pagination ('Show More') lets menu-only users reach residents beyond the first 6", () => {
    const manyLeases = Array.from({ length: 8 }, (_, idx) => ({
      ...sampleContext.activeLeases[0],
      id: `lease-${idx + 1}`,
      tenantId: `tenant-${idx + 1}`,
      tenantName: `Resident ${idx + 1}`,
      unitName: `Room 10${idx + 1}`,
    }));
    const largeContext: LandlordOperationsContext = {
      ...sampleContext,
      activeLeases: manyLeases,
    };

    render(<IrisAssistantWorkspace initialContext={largeContext} />);

    fireEvent.click(screen.getByRole("button", { name: /Find a Resident/i }));
    advanceTyping();

    expect(screen.getByRole("button", { name: /Resident 1 \(Room 101\)/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Resident 8 \(Room 108\)/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Show More \(2 left\)/i }));
    advanceTyping();

    expect(screen.getByRole("button", { name: /Resident 8 \(Room 108\)/i })).toBeInTheDocument();
  });

  it("Edge Case: Enforces upper numeric bounds on meter readings (> 9,999,999)", () => {
    render(<IrisAssistantWorkspace initialContext={sampleContext} />);

    fireEvent.click(screen.getByRole("button", { name: /Create an Invoice/i }));
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Specific Tenant/i }));
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Juan Dela Cruz/i }));
    advanceTyping();
    fireEvent.click(screen.getByRole("button", { name: /Rent \+ Utilities/i }));
    advanceTyping();

    const input = screen.getByRole("textbox", { name: /Message iRis Assistant/i });
    fireEvent.change(input, { target: { value: "99999999" } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/i }));
    advanceTyping();

    expect(screen.getByText(/between 0 and 9,999,999/i)).toBeInTheDocument();
  });

  it("Edge Case: Context fetch failure shows Retry banner and recovers on retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: "Server error" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: sampleContext }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<IrisAssistantWorkspace />);
    await flushAsync();

    expect(screen.getByText(/Server error/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Retry$/i }));
    await flushAsync();

    expect(screen.queryByText(/Server error/i)).not.toBeInTheDocument();
  });
});
