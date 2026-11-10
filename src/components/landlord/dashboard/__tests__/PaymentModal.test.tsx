import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { PaymentModal } from "../PaymentModal";

const mockPayments = {
    Overdue: [
        {
            id: "inv-101",
            tenant: "Juan Dela Cruz",
            unit: "Unit 204",
            amount: 12500,
            date: "Nov 5, 2026",
            avatar: null,
            avatarBgColor: "#8B5CF6",
        },
    ],
    "Near Due": [],
    Paid: [],
};

describe("PaymentModal", () => {
    it("renders clear search input microcopy and zero-results filter state", () => {
        render(
            <PaymentModal
                isOpen={true}
                onClose={vi.fn()}
                category="Overdue"
                paymentsByCategory={mockPayments}
            />
        );

        const searchInput = screen.getByPlaceholderText("Search by tenant name or unit number...");
        expect(searchInput).toBeDefined();

        fireEvent.change(searchInput, { target: { value: "NonExistentTenant" } });
        expect(screen.getByText(/No results found matching "NonExistentTenant"/i)).toBeDefined();

        const clearBtn = screen.getByText("Clear All Filters");
        fireEvent.click(clearBtn);
        expect(screen.getByText("Juan Dela Cruz")).toBeDefined();
    });

    it("opens safe follow-up & payment collection actions instead of blind settlement confirmation", () => {
        const handleRecordPayment = vi.fn();
        const handleClose = vi.fn();

        render(
            <PaymentModal
                isOpen={true}
                onClose={handleClose}
                category="Overdue"
                paymentsByCategory={mockPayments}
                onRecordPayment={handleRecordPayment}
            />
        );

        fireEvent.click(screen.getByText("Juan Dela Cruz"));

        // Verify safe actions are displayed and legacy blind "Record Settlement" / "Double Check" is gone
        expect(screen.queryByText("Record Settlement")).toBeNull();
        expect(screen.queryByText("Double Check")).toBeNull();
        expect(screen.getByText("Record Payment")).toBeDefined();
        expect(screen.getByText("Verify payment method, amount, and receipt details")).toBeDefined();
        expect(screen.getByText("Send Payment Reminder")).toBeDefined();
        expect(screen.getByText("Message Tenant")).toBeDefined();
        expect(screen.getByText("View Invoice")).toBeDefined();

        // Clicking Record Payment delegates to full CollectPaymentModal with the invoice ID
        fireEvent.click(screen.getByText("Record Payment"));
        expect(handleRecordPayment).toHaveBeenCalledWith("inv-101");
        expect(handleClose).toHaveBeenCalled();
    });
});
