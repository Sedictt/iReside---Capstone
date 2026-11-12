import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import {
  UnitSelectorStep,
  MeterReadingInputStep,
  CustomItemsStep,
  InvoiceReviewCard,
  IrisInvoiceWizard,
} from "@/components/landlord/iris/guided-invoice";
import type { ActiveLeaseSummary, InvoiceBuildContext, CustomItem } from "@/lib/services/iris";

describe("Iris Guided Invoice Generator Components", () => {
  const sampleLeases: ActiveLeaseSummary[] = [
    {
      id: "lease-101",
      tenantId: "tenant-101",
      tenantName: "Juan Dela Cruz",
      tenantEmail: "juan@example.com",
      unitId: "unit-101",
      unitName: "101",
      propertyId: "prop-1",
      propertyName: "Sunset Apartments",
      monthlyRent: 15000,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      outstandingBalance: 0,
      daysOverdue: 0,
      dueDate: "2026-11-05",
    },
    {
      id: "lease-102",
      tenantId: "tenant-102",
      tenantName: "Maria Santos",
      tenantEmail: "maria@example.com",
      unitId: "unit-102",
      unitName: "102",
      propertyId: "prop-1",
      propertyName: "Sunset Apartments",
      monthlyRent: 18500,
      startDate: "2026-02-01",
      endDate: "2027-01-31",
      outstandingBalance: 0,
      daysOverdue: 0,
      dueDate: "2026-11-05",
    },
  ];

  const sampleContext: InvoiceBuildContext = {
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
      ratePerUnit: 55,
      previousReading: 120,
      currentReading: 135,
    },
    electricity: {
      billingMode: "tenant_paid",
      ratePerUnit: 14.5,
      previousReading: 450,
      currentReading: 510,
    },
    customItems: [
      { id: "c1", label: "Parking Slot #4", amount: 1500, category: "other" },
    ],
    notes: "Please transfer via GCash or BDO.",
  };

  describe("UnitSelectorStep", () => {
    it("renders lease cards and filters dynamically by search query", () => {
      const onSelect = vi.fn();
      render(
        <UnitSelectorStep
          leases={sampleLeases}
          selectedLeaseId={null}
          onSelectLease={onSelect}
        />
      );

      expect(screen.getByText("Unit 101")).toBeInTheDocument();
      expect(screen.getByText("Unit 102")).toBeInTheDocument();
      expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
      expect(screen.getByText("Maria Santos")).toBeInTheDocument();

      // Search filter
      const searchInput = screen.getByPlaceholderText(/Search unit, tenant, or property/i);
      expect(searchInput).toHaveAttribute("maxLength", "60");

      fireEvent.change(searchInput, { target: { value: "Maria" } });
      expect(screen.queryByText("Unit 101")).not.toBeInTheDocument();
      expect(screen.getByText("Unit 102")).toBeInTheDocument();

      // Clear search
      fireEvent.change(searchInput, { target: { value: "" } });
      expect(screen.getByText("Unit 101")).toBeInTheDocument();
    });

    it("triggers onSelectLease callback when a unit card is clicked", () => {
      const onSelect = vi.fn();
      render(
        <UnitSelectorStep
          leases={sampleLeases}
          selectedLeaseId="lease-101"
          onSelectLease={onSelect}
        />
      );

      const unit2Button = screen.getByRole("radio", { name: /Unit 102/i });
      fireEvent.click(unit2Button);
      expect(onSelect).toHaveBeenCalledWith("lease-102");
    });

    it("displays empty state when search produces no matches", () => {
      render(
        <UnitSelectorStep
          leases={sampleLeases}
          selectedLeaseId={null}
          onSelectLease={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search unit/i);
      fireEvent.change(searchInput, { target: { value: "NonexistentUnit" } });
      expect(screen.getByText("No units match your search.")).toBeInTheDocument();
    });
  });

  describe("MeterReadingInputStep", () => {
    it("sanitizes alphabetical input and calculates live usage and charge", () => {
      const onChangeReading = vi.fn();
      render(
        <MeterReadingInputStep
          utilityType="water"
          unitName="101"
          previousReading={100}
          currentReading={125}
          ratePerUnit={50}
          billingMode="tenant_paid"
          allowMeterReset={false}
          skipped={false}
          onChangeReading={onChangeReading}
          onToggleMeterReset={vi.fn()}
          onToggleSkip={vi.fn()}
        />
      );

      expect(screen.getByText("Water Submeter Reading")).toBeInTheDocument();
      expect(screen.getByText(/Usage:/)).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument(); // 125 - 100 = 25
      expect(screen.getByText("₱1,250.00")).toBeInTheDocument(); // 25 * 50 = 1250

      const input = screen.getByPlaceholderText("100") as HTMLInputElement;
      expect(input).toHaveAttribute("maxLength", "7");
      expect(input).toHaveAttribute("inputMode", "decimal");

      // Typing with letters: should strip non-digits
      fireEvent.change(input, { target: { value: "140abc" } });
      expect(onChangeReading).toHaveBeenCalledWith(140);
    });

    it("displays regression alert when current reading is less than previous without reset", () => {
      render(
        <MeterReadingInputStep
          utilityType="electricity"
          unitName="101"
          previousReading={500}
          currentReading={480}
          ratePerUnit={15}
          billingMode="tenant_paid"
          allowMeterReset={false}
          skipped={false}
          onChangeReading={vi.fn()}
          onToggleMeterReset={vi.fn()}
          onToggleSkip={vi.fn()}
        />
      );

      expect(screen.getByText("Reading lower than previous")).toBeInTheDocument();
    });

    it("calculates usage from zero when meter reset is toggled", () => {
      render(
        <MeterReadingInputStep
          utilityType="electricity"
          unitName="101"
          previousReading={500}
          currentReading={25}
          ratePerUnit={10}
          billingMode="tenant_paid"
          allowMeterReset={true}
          skipped={false}
          onChangeReading={vi.fn()}
          onToggleMeterReset={vi.fn()}
          onToggleSkip={vi.fn()}
        />
      );

      expect(screen.queryByText("Reading lower than previous")).not.toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument(); // Full current reading used as usage
      expect(screen.getByText("₱250.00")).toBeInTheDocument(); // 25 * 10
    });

    it("displays informative banner when utility is included in rent", () => {
      render(
        <MeterReadingInputStep
          utilityType="water"
          unitName="101"
          previousReading={0}
          currentReading={undefined}
          ratePerUnit={0}
          billingMode="included_in_rent"
          allowMeterReset={false}
          skipped={false}
          onChangeReading={vi.fn()}
          onToggleMeterReset={vi.fn()}
          onToggleSkip={vi.fn()}
        />
      );

      expect(screen.getByText("Included in Monthly Rent")).toBeInTheDocument();
    });
  });

  describe("CustomItemsStep", () => {
    it("applies quick presets and adds valid custom items", () => {
      const onAdd = vi.fn();
      const onRemove = vi.fn();

      render(
        <CustomItemsStep
          items={[]}
          onAddItem={onAdd}
          onRemoveItem={onRemove}
        />
      );

      expect(screen.getByText("No additional charges added.")).toBeInTheDocument();

      // Click preset
      const presetButton = screen.getByRole("button", { name: /Parking Slot/i });
      fireEvent.click(presetButton);

      const labelInput = screen.getByLabelText(/Description/i) as HTMLInputElement;
      expect(labelInput.value).toBe("Parking Slot");
      expect(labelInput).toHaveAttribute("maxLength", "50");

      const amountInput = screen.getByLabelText(/Amount/i) as HTMLInputElement;
      expect(amountInput.value).toBe("1500");

      // Click Add Item
      const addButton = screen.getByRole("button", { name: /Add Item/i });
      fireEvent.click(addButton);

      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          label: "Parking Slot",
          amount: 1500,
          category: "other",
        })
      );
    });

    it("renders added items table with formatted totals and removes items", () => {
      const items: CustomItem[] = [
        { id: "item-1", label: "Late Fee", amount: 500, category: "penalty" },
        { id: "item-2", label: "AC Repair", amount: 1200, category: "maintenance" },
      ];
      const onRemove = vi.fn();

      render(
        <CustomItemsStep
          items={items}
          onAddItem={vi.fn()}
          onRemoveItem={onRemove}
        />
      );

      expect(screen.getByText("Late Fee")).toBeInTheDocument();
      expect(screen.getByText("₱500.00")).toBeInTheDocument();
      expect(screen.getByText("AC Repair")).toBeInTheDocument();
      expect(screen.getByText("₱1,200.00")).toBeInTheDocument();
      expect(screen.getByText("₱1,700.00")).toBeInTheDocument(); // Running total

      // Delete an item
      const removeButton = screen.getByRole("button", { name: /Remove Late Fee/i });
      fireEvent.click(removeButton);
      expect(onRemove).toHaveBeenCalledWith("item-1");
    });
  });

  describe("InvoiceReviewCard", () => {
    it("renders itemized line items, totals, and triggers onConfirm", () => {
      const onConfirm = vi.fn();
      const onBack = vi.fn();

      render(
        <InvoiceReviewCard
          context={sampleContext}
          onConfirm={onConfirm}
          onBack={onBack}
        />
      );

      expect(screen.getByText(/Monthly Rent \(2026-11\)/)).toBeInTheDocument();
      expect(screen.getByText(/Water Utility/)).toBeInTheDocument();
      expect(screen.getByText(/Electricity Utility/)).toBeInTheDocument();
      expect(screen.getByText("Parking Slot #4")).toBeInTheDocument();

      // Total Due: 15000 + (15 * 55 = 825) + (60 * 14.5 = 870) + 1500 = 18195.00
      expect(screen.getByText("₱18,195.00")).toBeInTheDocument();

      // Landlord notes
      const notesTextarea = screen.getByPlaceholderText(/Please send GCash/i) as HTMLTextAreaElement;
      expect(notesTextarea).toHaveAttribute("maxLength", "250");
      expect(screen.getByText("33 / 250")).toBeInTheDocument();

      // Submit
      const submitBtn = screen.getByRole("button", { name: /Issue & Send Invoice/i });
      fireEvent.click(submitBtn);

      expect(onConfirm).toHaveBeenCalledWith({
        dueDate: "2026-11-20",
        notes: "Please transfer via GCash or BDO.",
      });
    });

    it("shows loading state when submitting", () => {
      render(
        <InvoiceReviewCard
          context={sampleContext}
          onConfirm={vi.fn()}
          onBack={vi.fn()}
          submitting={true}
        />
      );

      const submitBtn = screen.getByRole("button", { name: /Issuing & Sending/i });
      expect(submitBtn).toBeDisabled();
      expect(submitBtn).toHaveAttribute("aria-busy", "true");
    });
  });

  describe("IrisInvoiceWizard Integration", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("navigates through steps when pre-filled context is supplied", async () => {
      render(
        <IrisInvoiceWizard
          initialContext={sampleContext}
          initialLeases={sampleLeases}
        />
      );

      // Starts at Step 2 (Water Submeter) because context is loaded
      expect(screen.getByText("Water Submeter Reading")).toBeInTheDocument();
      expect(screen.getByText(/Step 2 of 5/)).toBeInTheDocument();

      // Click Continue to Electricity
      const toElectricBtn = screen.getByRole("button", { name: /Continue to Electricity/i });
      fireEvent.click(toElectricBtn);

      // Now at Step 3
      expect(screen.getByText("Electricity Submeter Reading")).toBeInTheDocument();
      expect(screen.getByText(/Step 3 of 5/)).toBeInTheDocument();

      // Click Continue to Extra Charges
      const toCustomBtn = screen.getByRole("button", { name: /Continue to Extra Charges/i });
      fireEvent.click(toCustomBtn);

      // Now at Step 4
      expect(screen.getByText("Extra Charges & Fees")).toBeInTheDocument();
      expect(screen.getByText(/Step 4 of 5/)).toBeInTheDocument();

      // Click Review Statement
      const toReviewBtn = screen.getByRole("button", { name: /Review Statement/i });
      fireEvent.click(toReviewBtn);

      // Now at Step 5
      expect(screen.getByText("Review & Issue Statement")).toBeInTheDocument();
      expect(screen.getByText(/Step 5 of 5/)).toBeInTheDocument();

      // Click Back returns to Extra Charges
      const backBtn = screen.getByRole("button", { name: /Back/i });
      fireEvent.click(backBtn);
      expect(screen.getByText("Extra Charges & Fees")).toBeInTheDocument();
    });

    it("completes full wizard flow and displays completion card upon successful commit", async () => {
      const onSuccess = vi.fn();
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/landlord/iris/invoices/commit")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              invoiceId: "inv-999",
              invoiceNumber: "INV-202611-0001",
              totalAmount: 18195,
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      render(
        <IrisInvoiceWizard
          initialContext={sampleContext}
          initialLeases={sampleLeases}
          onSuccess={onSuccess}
        />
      );

      // Jump to review step
      fireEvent.click(screen.getByRole("button", { name: /Continue to Electricity/i }));
      fireEvent.click(screen.getByRole("button", { name: /Continue to Extra Charges/i }));
      fireEvent.click(screen.getByRole("button", { name: /Review Statement/i }));

      // Commit
      const issueBtn = screen.getByRole("button", { name: /Issue & Send Invoice/i });
      fireEvent.click(issueBtn);

      await waitFor(() => {
        expect(screen.getByText("Invoice Issued Successfully!")).toBeInTheDocument();
      });

      expect(screen.getByText(/#INV-202611-0001/)).toBeInTheDocument();
      expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
      expect(screen.getByText("Unit 101")).toBeInTheDocument();
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceId: "inv-999",
          invoiceNumber: "INV-202611-0001",
          totalAmount: 18195,
          tenantName: "Juan Dela Cruz",
        })
      );
    });
  });
});
