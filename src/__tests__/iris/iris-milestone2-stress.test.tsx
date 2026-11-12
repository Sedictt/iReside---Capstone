import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

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

import {
  UnitSelectorStep,
  MeterReadingInputStep,
  CustomItemsStep,
  InvoiceReviewCard,
  IrisInvoiceWizard,
} from "@/components/landlord/iris/guided-invoice";
import { validateReadingDelta, roundCentavos } from "@/lib/services/iris/iris-invoice-flow";
import { POST as commitInvoiceRoute } from "@/app/api/landlord/iris/invoices/commit/route";
import type { ActiveLeaseSummary, InvoiceBuildContext, CustomItem } from "@/lib/services/iris";

describe("Milestone 2 Aggressive Stress & Boundary Testing", () => {
  const sampleLeases: ActiveLeaseSummary[] = [
    {
      id: "lease-stress-1",
      tenantId: "tenant-stress-1",
      tenantName: "Stress Test Tenant",
      tenantEmail: "stress@example.com",
      unitId: "unit-stress-1",
      unitName: "101-STRESS",
      propertyId: "prop-stress-1",
      propertyName: "Stress Heights Tower",
      monthlyRent: 22000,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      outstandingBalance: 0,
      daysOverdue: 0,
      dueDate: "2026-11-15",
    },
  ];

  const sampleContext: InvoiceBuildContext = {
    leaseId: "lease-stress-1",
    tenantId: "tenant-stress-1",
    tenantName: "Stress Test Tenant",
    unitId: "unit-stress-1",
    unitName: "101-STRESS",
    propertyId: "prop-stress-1",
    propertyName: "Stress Heights Tower",
    monthlyRent: 22000,
    billingMonth: "2026-11",
    dueDate: "2026-11-20",
    water: {
      billingMode: "tenant_paid",
      ratePerUnit: 60,
      previousReading: 200,
      currentReading: 225,
    },
    electricity: {
      billingMode: "tenant_paid",
      ratePerUnit: 15,
      previousReading: 800,
      currentReading: 890,
    },
    customItems: [],
    notes: "",
  };

  describe("1. Meter Reading Boundaries & Sanitization", () => {
    it("handles zero reading with allowMeterReset=true cleanly", () => {
      const res = validateReadingDelta(150, 0, { allowMeterReset: true });
      expect(res.valid).toBe(true);
      expect(res.usage).toBe(0);
    });

    it("rejects negative previous and current meter readings in core validator", () => {
      const negPrev = validateReadingDelta(-10, 100);
      expect(negPrev.valid).toBe(false);
      expect(negPrev.error).toContain("Previous meter reading cannot be negative");

      const negCurr = validateReadingDelta(100, -5);
      expect(negCurr.valid).toBe(false);
      expect(negCurr.error).toContain("Current meter reading cannot be negative");
    });

    it("sanitizes negative inputs and non-numeric characters in MeterReadingInputStep", () => {
      const onChange = vi.fn();
      render(
        <MeterReadingInputStep
          utilityType="water"
          unitName="101"
          previousReading={100}
          currentReading={undefined}
          ratePerUnit={50}
          billingMode="tenant_paid"
          allowMeterReset={false}
          skipped={false}
          onChangeReading={onChange}
          onToggleMeterReset={vi.fn()}
          onToggleSkip={vi.fn()}
        />
      );

      const input = screen.getByLabelText(/Current Meter Reading/i) as HTMLInputElement;

      // Negative sign stripped: "-50.5" -> "50.5"
      fireEvent.change(input, { target: { value: "-50.5" } });
      expect(onChange).toHaveBeenLastCalledWith(50.5);

      // Alphabetic characters stripped: "abc" -> undefined
      fireEvent.change(input, { target: { value: "abc" } });
      expect(onChange).toHaveBeenLastCalledWith(undefined);

      // Special symbols and characters stripped: "12$#@!3.4" -> 123.4
      fireEvent.change(input, { target: { value: "12$#@!3.4" } });
      expect(onChange).toHaveBeenLastCalledWith(123.4);
    });

    it("sanitizes multiple decimal dots (e.g. '12.34.56' -> 12.3456 and '.5.5' -> 0.55)", () => {
      const onChange = vi.fn();
      render(
        <MeterReadingInputStep
          utilityType="water"
          unitName="101"
          previousReading={100}
          currentReading={undefined}
          ratePerUnit={50}
          billingMode="tenant_paid"
          allowMeterReset={false}
          skipped={false}
          onChangeReading={onChange}
          onToggleMeterReset={vi.fn()}
          onToggleSkip={vi.fn()}
        />
      );

      const input = screen.getByLabelText(/Current Meter Reading/i);

      // Multiple dots collapsed into single decimal dot
      fireEvent.change(input, { target: { value: "12.34.56" } });
      expect(onChange).toHaveBeenLastCalledWith(12.3456);

      fireEvent.change(input, { target: { value: ".5.5" } });
      expect(onChange).toHaveBeenLastCalledWith(0.55);
    });

    it("enforces maxLength={7} on meter input", () => {
      render(
        <MeterReadingInputStep
          utilityType="electricity"
          unitName="101"
          previousReading={100}
          currentReading={120}
          ratePerUnit={15}
          billingMode="tenant_paid"
          allowMeterReset={false}
          skipped={false}
          onChangeReading={vi.fn()}
          onToggleMeterReset={vi.fn()}
          onToggleSkip={vi.fn()}
        />
      );

      const input = screen.getByLabelText(/Current Meter Reading/i);
      expect(input).toHaveAttribute("maxLength", "7");
    });

    it("triggers regression warning alert when current reading is lower than previous and allowMeterReset is false", () => {
      render(
        <MeterReadingInputStep
          utilityType="water"
          unitName="101"
          previousReading={150}
          currentReading={120}
          ratePerUnit={50}
          billingMode="tenant_paid"
          allowMeterReset={false}
          skipped={false}
          onChangeReading={vi.fn()}
          onToggleMeterReset={vi.fn()}
          onToggleSkip={vi.fn()}
        />
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/Reading lower than previous/i);
      expect(alert).toHaveTextContent("120");
      expect(alert).toHaveTextContent("150");
    });

    it("clears regression alert and calculates usage when allowMeterReset is true", () => {
      render(
        <MeterReadingInputStep
          utilityType="water"
          unitName="101"
          previousReading={150}
          currentReading={120}
          ratePerUnit={50}
          billingMode="tenant_paid"
          allowMeterReset={true}
          skipped={false}
          onChangeReading={vi.fn()}
          onToggleMeterReset={vi.fn()}
          onToggleSkip={vi.fn()}
        />
      );

      expect(screen.queryByText(/Reading lower than previous/i)).not.toBeInTheDocument();
      // Usage is calculated from 0 (current reading 120 * rate 50 = 6000)
      expect(screen.getByText("120")).toBeInTheDocument();
      expect(screen.getByText("₱6,000.00")).toBeInTheDocument();
    });

    it("supports dial rollover calculation (hasRollover)", () => {
      // 4-digit meter: rolled past 9999 to 50
      const rolloverRes = validateReadingDelta(9950, 50, { hasRollover: true, maxReading: 10000 });
      expect(rolloverRes.valid).toBe(true);
      expect(rolloverRes.usage).toBe(100);

      // Auto-detected capacity (e.g. 9800 to 20 -> capacity = 10000)
      const autoRes = validateReadingDelta(9800, 20, { hasRollover: true });
      expect(autoRes.valid).toBe(true);
      expect(autoRes.usage).toBe(220);

      // Negative rollover usage when invalid numbers passed
      const invalidRollover = validateReadingDelta(15000, 10, { hasRollover: true, maxReading: 10000 });
      expect(invalidRollover.valid).toBe(false);
      expect(invalidRollover.error).toContain("Rollover calculation resulted in negative usage");
    });
  });

  describe("2. Custom Items Boundaries & Integrity", () => {
    it("rejects zero and negative amounts with validation message", () => {
      const onAdd = vi.fn();
      render(<CustomItemsStep items={[]} onAddItem={onAdd} onRemoveItem={vi.fn()} />);

      const labelInput = screen.getByLabelText(/Description/i);
      const amountInput = screen.getByLabelText(/Amount/i);
      const addButton = screen.getByRole("button", { name: /Add Item/i });

      // Description filled, but amount is 0
      fireEvent.change(labelInput, { target: { value: "Trash Fee" } });
      fireEvent.change(amountInput, { target: { value: "0" } });
      fireEvent.click(addButton);

      expect(onAdd).not.toHaveBeenCalled();
      expect(screen.getByRole("alert")).toHaveTextContent("Please enter a valid amount greater than ₱0.00.");

      // Empty amount
      fireEvent.change(amountInput, { target: { value: "" } });
      fireEvent.click(addButton);
      expect(onAdd).not.toHaveBeenCalled();
      expect(screen.getByRole("alert")).toHaveTextContent("Please enter a valid amount greater than ₱0.00.");
    });

    it("rejects empty or whitespace-only labels", () => {
      const onAdd = vi.fn();
      render(<CustomItemsStep items={[]} onAddItem={onAdd} onRemoveItem={vi.fn()} />);

      const labelInput = screen.getByLabelText(/Description/i);
      const amountInput = screen.getByLabelText(/Amount/i);
      const addButton = screen.getByRole("button", { name: /Add Item/i });

      fireEvent.change(labelInput, { target: { value: "   " } });
      fireEvent.change(amountInput, { target: { value: "500" } });
      fireEvent.click(addButton);

      expect(onAdd).not.toHaveBeenCalled();
      expect(screen.getByRole("alert")).toHaveTextContent("Please enter an item description or choose a preset.");
    });

    it("enforces clamp on enormous numbers (> 9,999,999.99 limit)", () => {
      render(<CustomItemsStep items={[]} onAddItem={vi.fn()} onRemoveItem={vi.fn()} />);

      const amountInput = screen.getByLabelText(/Amount/i) as HTMLInputElement;

      // 100,000,000 exceeds limit and is rejected / not set
      fireEvent.change(amountInput, { target: { value: "100000000" } });
      expect(amountInput.value).toBe("");

      // 9,999,999.99 is within limit and accepted
      fireEvent.change(amountInput, { target: { value: "9999999.99" } });
      expect(amountInput.value).toBe("9999999.99");
    });

    it("enforces description maxLength of 50 characters", () => {
      render(<CustomItemsStep items={[]} onAddItem={vi.fn()} onRemoveItem={vi.fn()} />);
      const labelInput = screen.getByLabelText(/Description/i);
      expect(labelInput).toHaveAttribute("maxLength", "50");
    });

    it("preserves math integrity across multiple additions and deletions", () => {
      let currentItems: CustomItem[] = [];
      const onAddItem = vi.fn((item: CustomItem) => {
        currentItems.push(item);
      });
      const onRemoveItem = vi.fn((id: string) => {
        currentItems = currentItems.filter((i) => i.id !== id);
      });

      const { rerender } = render(
        <CustomItemsStep items={currentItems} onAddItem={onAddItem} onRemoveItem={onRemoveItem} />
      );

      const labelInput = screen.getByLabelText(/Description/i);
      const amountInput = screen.getByLabelText(/Amount/i);
      const addButton = screen.getByRole("button", { name: /Add Item/i });

      // Add Item 1: 1500.25
      fireEvent.change(labelInput, { target: { value: "Parking Slot" } });
      fireEvent.change(amountInput, { target: { value: "1500.25" } });
      fireEvent.click(addButton);

      expect(onAddItem).toHaveBeenCalledTimes(1);
      expect(currentItems[0].amount).toBe(1500.25);

      // Re-render with Item 1 added
      rerender(<CustomItemsStep items={[...currentItems]} onAddItem={onAddItem} onRemoveItem={onRemoveItem} />);
      expect(screen.getAllByText("₱1,500.25").length).toBeGreaterThanOrEqual(1);

      // Add Item 2: 749.80
      fireEvent.change(labelInput, { target: { value: "Aircon Cleaning" } });
      fireEvent.change(amountInput, { target: { value: "749.80" } });
      fireEvent.click(addButton);

      expect(onAddItem).toHaveBeenCalledTimes(2);
      expect(currentItems[1].amount).toBe(749.80);

      rerender(<CustomItemsStep items={[...currentItems]} onAddItem={onAddItem} onRemoveItem={onRemoveItem} />);
      expect(screen.getByText("₱749.80")).toBeInTheDocument();

      // Add Item 3: 250.00
      fireEvent.change(labelInput, { target: { value: "Key Replacement" } });
      fireEvent.change(amountInput, { target: { value: "250.00" } });
      fireEvent.click(addButton);

      rerender(<CustomItemsStep items={[...currentItems]} onAddItem={onAddItem} onRemoveItem={onRemoveItem} />);

      // Math verification: 1500.25 + 749.80 + 250.00 = 2500.05
      const total = currentItems.reduce((acc, it) => roundCentavos(acc + it.amount), 0);
      expect(total).toBe(2500.05);

      // Remove middle item (Aircon Cleaning)
      const airconCleaningId = currentItems[1].id;
      const deleteAirconBtn = screen.getByRole("button", { name: /Remove Aircon Cleaning/i });
      fireEvent.click(deleteAirconBtn);
      expect(onRemoveItem).toHaveBeenCalledWith(airconCleaningId);

      rerender(<CustomItemsStep items={[...currentItems]} onAddItem={onAddItem} onRemoveItem={onRemoveItem} />);
      const remainingTotal = currentItems.reduce((acc, it) => roundCentavos(acc + it.amount), 0);
      expect(remainingTotal).toBe(1750.25); // 1500.25 + 250.00
    });
  });

  describe("3. Review Card & Wizard Edge Cases", () => {
    it("enforces note character limit (250 chars) and displays live counter", () => {
      render(
        <InvoiceReviewCard
          context={sampleContext}
          onConfirm={vi.fn()}
          onBack={vi.fn()}
        />
      );

      const notesTextarea = screen.getByLabelText(/Landlord Note/i) as HTMLTextAreaElement;
      expect(notesTextarea).toHaveAttribute("maxLength", "250");
      expect(screen.getByText("0 / 250")).toBeInTheDocument();

      const testNote = "Please remit payment via GCash or Bank Transfer before the 15th.";
      fireEvent.change(notesTextarea, { target: { value: testNote } });
      expect(screen.getByText(`${testNote.length} / 250`)).toBeInTheDocument();
    });

    it("does not preemptively disable submit button; shows validation alert on missing due date without crash", () => {
      const onConfirm = vi.fn();
      const contextWithoutDueDate: InvoiceBuildContext = {
        ...sampleContext,
        dueDate: "",
      };

      render(
        <InvoiceReviewCard
          context={contextWithoutDueDate}
          onConfirm={onConfirm}
          onBack={vi.fn()}
        />
      );

      const submitButton = screen.getByRole("button", { name: /Issue & Send Invoice/i });
      expect(submitButton).not.toBeDisabled();

      fireEvent.click(submitButton);

      expect(onConfirm).not.toHaveBeenCalled();
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Please select a payment due date.");
    });

    it("supports full Back button unwinding across wizard steps without data corruption", async () => {
      render(
        <IrisInvoiceWizard
          initialLeases={sampleLeases}
          initialContext={sampleContext}
        />
      );

      // Starts at Step 2 (Water Submeter) because initialContext is loaded
      expect(screen.getByText("Water Submeter Reading")).toBeInTheDocument();

      // Enter water reading 230 and continue
      const waterInput = screen.getByLabelText(/Current Meter Reading/i);
      fireEvent.change(waterInput, { target: { value: "230" } });
      fireEvent.click(screen.getByRole("button", { name: /Continue to Electricity/i }));

      // Now at Step 3 (Electricity Submeter)
      expect(screen.getByText("Electricity Submeter Reading")).toBeInTheDocument();
      const electricInput = screen.getByLabelText(/Current Meter Reading/i);
      fireEvent.change(electricInput, { target: { value: "910" } });
      fireEvent.click(screen.getByRole("button", { name: /Continue to Extra Charges/i }));

      // Now at Step 4 (Extra Charges)
      expect(screen.getByText("Extra Charges & Fees")).toBeInTheDocument();

      // Add a custom item
      const itemDesc = screen.getByLabelText(/Description/i);
      const itemAmount = screen.getByLabelText(/Amount/i);
      fireEvent.change(itemDesc, { target: { value: "Late Fine" } });
      fireEvent.change(itemAmount, { target: { value: "500" } });
      fireEvent.click(screen.getByRole("button", { name: /Add Item/i }));

      expect(screen.getByText("Late Fine")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /Review Statement/i }));

      // Now at Step 5 (Review & Send Statement)
      expect(screen.getByText("Review & Issue Statement")).toBeInTheDocument();
      expect(screen.getByText("Late Fine")).toBeInTheDocument();

      // --- UNWIND BACKWARDS ---
      // Back from Step 5 -> Step 4
      fireEvent.click(screen.getByRole("button", { name: /Back/i }));
      expect(screen.getByText("Extra Charges & Fees")).toBeInTheDocument();
      expect(screen.getByText("Late Fine")).toBeInTheDocument(); // preserved!

      // Back from Step 4 -> Step 3
      fireEvent.click(screen.getByRole("button", { name: /Back to Electricity/i }));
      expect(screen.getByText("Electricity Submeter Reading")).toBeInTheDocument();

      // Back from Step 3 -> Step 2
      fireEvent.click(screen.getByRole("button", { name: /Back/i }));
      expect(screen.getByText("Water Submeter Reading")).toBeInTheDocument();

      // --- RE-ADVANCE FORWARDS WITHOUT CORRUPTION ---
      fireEvent.click(screen.getByRole("button", { name: /Continue to Electricity/i }));
      expect(screen.getByText("Electricity Submeter Reading")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Continue to Extra Charges/i }));
      expect(screen.getByText("Extra Charges & Fees")).toBeInTheDocument();
      expect(screen.getByText("Late Fine")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Review Statement/i }));
      expect(screen.getByText("Review & Issue Statement")).toBeInTheDocument();
      expect(screen.getByText("Late Fine")).toBeInTheDocument();
    });

    it("displays error alert and blocks progression when water reading is lower than previous without reset checked", () => {
      render(
        <IrisInvoiceWizard
          initialLeases={sampleLeases}
          initialContext={sampleContext}
        />
      );

      // Water previous is 200; input 180 (lower) without reset checked
      const waterInput = screen.getByLabelText(/Current Meter Reading/i);
      fireEvent.change(waterInput, { target: { value: "180" } });
      fireEvent.click(screen.getByRole("button", { name: /Continue to Electricity/i }));

      // Must show error alert and stay on water step
      expect(screen.getByText(/Water reading \(180\) cannot be less than previous \(200\) without meter reset checked/i)).toBeInTheDocument();
      expect(screen.getByText("Water Submeter Reading")).toBeInTheDocument();
    });
  });

  describe("4. Commit Route Security, Boundaries & Stress", () => {
    let mockSupabase: any;
    let mockPayments: any[];
    let mockPaymentItems: any[];
    let mockNotifications: any[];
    let mockMessages: any[];

    beforeEach(() => {
      vi.clearAllMocks();
      mockPayments = [];
      mockPaymentItems = [];
      mockNotifications = [];
      mockMessages = [];

      mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          const queryState: any = { filters: {} };
          const builder: any = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((col: string, val: any) => {
              queryState.filters[col] = val;
              return builder;
            }),
            delete: vi.fn().mockReturnThis(),
            update: vi.fn().mockImplementation((updates: any) => ({
              eq: vi.fn().mockResolvedValue({ data: updates, error: null }),
            })),
            insert: vi.fn().mockImplementation((payload: any) => {
              const records = Array.isArray(payload) ? payload : [payload];
              if (table === "payments") {
                const inserted = {
                  id: "payment-stress-999",
                  invoice_number: records[0].invoice_number || "INV-202611-STRESS",
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
                const inserted = { id: "msg-stress-1", ...records[0] };
                mockMessages.push(inserted);
                return {
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: inserted, error: null }),
                  }),
                };
              }
              if (table === "utility_readings") {
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
                  data: { terms: { dueDay: 15, lateFeeAmount: 500, allowPartialPayments: false } },
                  error: null,
                });
              }
              return Promise.resolve({ data: null, error: null });
            }),
            single: vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
          };
          return builder;
        }),
      };

      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "landlord-stress-1",
        userRole: "landlord",
        supabase: mockSupabase,
      });

      mockVerifyLandlordLeaseOwnership.mockResolvedValue(true);
      mockGetLeaseInvoiceContext.mockResolvedValue(sampleContext);
      mockRecordUtilityReading.mockResolvedValue({ id: "util-rec-1" });
      mockGetOrCreateDirectConversation.mockResolvedValue("conv-stress-1");
    });

    it("rejects unauthenticated requests with 401", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue(
        new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
      );

      const req = new Request("http://localhost:3000/api/landlord/iris/invoices/commit", {
        method: "POST",
        body: JSON.stringify({ leaseId: "lease-stress-1" }),
      });

      const res = await commitInvoiceRoute(req);
      expect(res.status).toBe(401);
    });

    it("rejects non-landlord role with 403 Forbidden", async () => {
      mockRequireAuthenticatedUser.mockResolvedValue({
        userId: "tenant-stress-1",
        userRole: "tenant",
        supabase: mockSupabase,
      });

      const req = new Request("http://localhost:3000/api/landlord/iris/invoices/commit", {
        method: "POST",
        body: JSON.stringify({ leaseId: "lease-stress-1" }),
      });

      const res = await commitInvoiceRoute(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Landlord role required");
    });

    it("returns 404 when lease is not owned by landlord", async () => {
      mockVerifyLandlordLeaseOwnership.mockResolvedValue(false);

      const req = new Request("http://localhost:3000/api/landlord/iris/invoices/commit", {
        method: "POST",
        body: JSON.stringify({ leaseId: "lease-stress-1" }),
      });

      const res = await commitInvoiceRoute(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain("Lease not found or unauthorized");
    });

    it("returns 400 when request body is malformed JSON or empty", async () => {
      const corruptReq = new Request("http://localhost:3000/api/landlord/iris/invoices/commit", {
        method: "POST",
        body: "{ bad json",
      });

      const corruptRes = await commitInvoiceRoute(corruptReq);
      expect(corruptRes.status).toBe(400);
      const corruptJson = await corruptRes.json();
      expect(corruptJson.error).toContain("Invalid JSON");

      const emptyReq = new Request("http://localhost:3000/api/landlord/iris/invoices/commit", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const emptyRes = await commitInvoiceRoute(emptyReq);
      expect(emptyRes.status).toBe(400);
      const emptyJson = await emptyRes.json();
      expect(emptyJson.error).toBe("leaseId is required");
    });

    it("rejects meter reading regression with 400 when allowMeterReset is false", async () => {
      const req = new Request("http://localhost:3000/api/landlord/iris/invoices/commit", {
        method: "POST",
        body: JSON.stringify({
          leaseId: "lease-stress-1",
          water: {
            billingMode: "tenant_paid",
            previousReading: 200,
            currentReading: 150, // regression!
            ratePerUnit: 60,
            allowMeterReset: false,
          },
        }),
      });

      const res = await commitInvoiceRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Water reading error");
    });

    it("returns 409 Conflict when duplicate invoice for lease and billing cycle exists", async () => {
      mockPayments.push({
        id: "existing-payment-1",
        lease_id: "lease-stress-1",
        billing_cycle: "2026-11-01",
      });

      const req = new Request("http://localhost:3000/api/landlord/iris/invoices/commit", {
        method: "POST",
        body: JSON.stringify({
          leaseId: "lease-stress-1",
          billingMonth: "2026-11",
        }),
      });

      const res = await commitInvoiceRoute(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toContain("already exists");
    });

    it("gracefully falls back when chat conversation creation or message dispatch fails", async () => {
      mockGetOrCreateDirectConversation.mockRejectedValue(new Error("Chat service unavailable"));

      const req = new Request("http://localhost:3000/api/landlord/iris/invoices/commit", {
        method: "POST",
        body: JSON.stringify({
          context: sampleContext,
        }),
      });

      const res = await commitInvoiceRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.invoiceId).toBe("payment-stress-999");
      expect(json.conversationId).toBeNull();
      expect(mockPayments.length).toBe(1);
    });

    it("cleans up payment record when payment items insertion fails", async () => {
      const deleteSpy = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === "payment_items") {
          return {
            insert: vi.fn().mockResolvedValue({ error: { message: "DB Error inserting items" } }),
          };
        }
        if (table === "payments") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "pay-rollback-1", invoice_number: "INV-FAIL" },
                  error: null,
                }),
              }),
            }),
            delete: deleteSpy,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === "leases") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const req = new Request("http://localhost:3000/api/landlord/iris/invoices/commit", {
        method: "POST",
        body: JSON.stringify({ context: sampleContext }),
      });

      const res = await commitInvoiceRoute(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Failed to insert invoice line items.");
      expect(deleteSpy).toHaveBeenCalled();
    });
  });
});
