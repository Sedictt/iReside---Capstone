import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { AddTenantModal } from "../AddTenantModal";

// Mock framer-motion
vi.mock("framer-motion", () => ({
    m: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock PropertyContext
vi.mock("@/context/PropertyContext", () => ({
    useProperty: () => ({
        properties: [
            {
                id: "prop-1",
                name: "Pinecrest Residences",
                address: "123 Main St",
                units: [
                    { id: "u-1", name: "101", status: "vacant", rentAmount: 12000 },
                ],
            },
        ],
        refreshProperties: vi.fn(),
    }),
}));

describe("AddTenantModal", () => {
    it("renders quick_add tab by default when isOpen is true", () => {
        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
            />
        );

        expect(screen.getByText("Onboard Residents")).toBeDefined();
        expect(screen.getByText("Quick Add")).toBeDefined();
        expect(screen.getByText("Invite Link")).toBeDefined();
        expect(screen.getByText("Walk-in Application")).toBeDefined();
        expect(screen.getByText("Resident Profile")).toBeDefined();
    });

    it("renders invite tab directly when initialTab is set to 'invite'", () => {
        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
                initialTab="invite"
            />
        );

        expect(screen.getByText("Onboard Residents")).toBeDefined();
        expect(screen.getByText("Self-Onboarding Link")).toBeDefined();
        expect(screen.getByText("Generate Onboarding Link")).toBeDefined();
        expect(screen.getByText("Simple")).toBeDefined();
        expect(screen.getByText("Advanced")).toBeDefined();
    });

    it("renders walk_in tab directly when initialTab is set to 'walk_in'", () => {
        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
                initialTab="walk_in"
            />
        );

        expect(screen.getByText("In-Person Walk-in Application")).toBeDefined();
        expect(screen.getByText("4-Step Intake Process")).toBeDefined();
        expect(screen.getByText("Start Walk-in Application")).toBeDefined();
    });

    it("switches across all 3 modes on tab clicks", () => {
        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
            />
        );

        // Initially in Quick Add
        expect(screen.getByText("Resident Profile")).toBeDefined();

        // Switch to Invite Link
        fireEvent.click(screen.getByText("Invite Link"));
        expect(screen.getByText("Self-Onboarding Link")).toBeDefined();

        // Switch to Walk-in
        fireEvent.click(screen.getByText("Walk-in Application"));
        expect(screen.getByText("In-Person Walk-in Application")).toBeDefined();

        // Switch back to Quick Add
        fireEvent.click(screen.getByText("Quick Add"));
        expect(screen.getByText("Resident Profile")).toBeDefined();
    });

    it("toggles simple and advanced mode in the invite tab", () => {
        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
                initialTab="invite"
            />
        );

        // Default is simple mode
        expect(screen.queryByText("Invite Scope")).toBeNull();

        // Toggle advanced
        fireEvent.click(screen.getByText("Advanced"));
        expect(screen.getByText("Invite Scope")).toBeDefined();
        expect(screen.getByText("Screening Mode")).toBeDefined();

        // Toggle back to simple
        fireEvent.click(screen.getByText("Simple"));
        expect(screen.queryByText("Invite Scope")).toBeNull();
    });

    it("triggers onOpenWalkIn when walk-in is started", () => {
        const handleOpenWalkIn = vi.fn();
        const handleClose = vi.fn();

        render(
            <AddTenantModal
                isOpen={true}
                onClose={handleClose}
                onSuccess={vi.fn()}
                initialTab="walk_in"
                onOpenWalkIn={handleOpenWalkIn}
            />
        );

        fireEvent.click(screen.getByText("Start Walk-in Application"));
        expect(handleOpenWalkIn).toHaveBeenCalledWith("prop-1", "u-1");
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("renders Move-In Payment Terms with Advance Rent and Security Deposit in Quick Add", () => {
        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
                initialTab="quick_add"
            />
        );

        expect(screen.getByText("Move-In Payment Terms")).toBeDefined();
        expect(screen.getByText("Advance Rent")).toBeDefined();
        expect(screen.getByText("Security Deposit")).toBeDefined();
        expect(screen.getByText("Total Inception Settlement")).toBeDefined();
    });

    it("validates that end date cannot be earlier than start date in Quick Add", () => {
        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
                initialTab="quick_add"
            />
        );

        const startDateInput = screen.getByLabelText("Start Date");
        const endDateInput = screen.getByLabelText("End Date");

        fireEvent.change(startDateInput, { target: { value: "2026-10-09" } });
        fireEvent.change(endDateInput, { target: { value: "2026-07-31" } });

        expect(screen.getByText("End date must be after start date.")).toBeDefined();
    });

    it("allows configuring advance rent and security deposit directly and via presets", () => {
        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
                initialTab="quick_add"
            />
        );

        // Rent is auto-set to 12000 from unit 101 mock
        const advanceInput = screen.getByLabelText("Advance Rent Amount") as HTMLInputElement;
        const depositInput = screen.getByLabelText("Security Deposit Amount") as HTMLInputElement;

        expect(advanceInput).not.toBeNull();
        expect(depositInput).not.toBeNull();

        // Custom amount configuration
        fireEvent.change(advanceInput, { target: { value: "25000" } });
        fireEvent.change(depositInput, { target: { value: "15000" } });

        expect(advanceInput.value).toBe("25000");
        expect(depositInput.value).toBe("15000");
        expect(screen.getByText("₱40,000")).toBeDefined();

        // Preset chip test
        const noneButtons = screen.getAllByRole("button", { name: "None" });
        fireEvent.click(noneButtons[0]); // Advance None
        expect(advanceInput.value).toBe("0");
        expect(screen.getByText("₱15,000")).toBeDefined();

        const twoMoButtons = screen.getAllByRole("button", { name: "2 Mo" });
        fireEvent.click(twoMoButtons[0]); // Advance 2 Mo (2 * 12,000 = 24,000)
        expect(advanceInput.value).toBe("24000");
        expect(screen.getByText("₱39,000")).toBeDefined();
    });

    it("sanitizes financial amounts by stripping letters and invalid characters", () => {
        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
                initialTab="quick_add"
            />
        );

        const advanceInput = screen.getByLabelText("Advance Rent Amount") as HTMLInputElement;
        const depositInput = screen.getByLabelText("Security Deposit Amount") as HTMLInputElement;

        // User typed letters mixed with numbers (like in the bug screenshot)
        fireEvent.change(advanceInput, { target: { value: "20000xasxasxaxxasxas" } });
        fireEvent.change(depositInput, { target: { value: "20000xsax" } });

        // Sanitizer strips letters immediately
        expect(advanceInput.value).toBe("20000");
        expect(depositInput.value).toBe("20000");
        expect(screen.getByText("₱40,000")).toBeDefined();
    });

    it("validates email and phone formats on blur with clear error messages", () => {
        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
                initialTab="quick_add"
            />
        );

        const emailInput = screen.getByLabelText("Email Address");
        const phoneInput = screen.getByLabelText("Phone Number");

        // Invalid email typed and blurred
        fireEvent.change(emailInput, { target: { value: "xsaxasx" } });
        fireEvent.blur(emailInput);
        expect(screen.getByText("Please enter a valid email address.")).toBeDefined();

        // Letters typed into phone are stripped; when blurred while empty, shows required message
        fireEvent.change(phoneInput, { target: { value: "asxasaxas" } });
        fireEvent.blur(phoneInput);
        expect(screen.getByText("Phone number is required.")).toBeDefined();

        // Insufficient digits
        fireEvent.change(phoneInput, { target: { value: "091234" } });
        fireEvent.blur(phoneInput);
        expect(screen.getByText("Please enter a valid phone number (10–15 digits).")).toBeDefined();
    });

    it("does not accept digits in full name and strips them in real time", () => {
        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
                initialTab="quick_add"
            />
        );

        const nameInput = screen.getByLabelText("Full Name") as HTMLInputElement;

        // Digits entered into name field are automatically stripped
        fireEvent.change(nameInput, { target: { value: "Juan Dela Cruz 123" } });
        expect(nameInput.value).toBe("Juan Dela Cruz ");

        // Typing only numbers results in empty field
        fireEvent.change(nameInput, { target: { value: "12345" } });
        expect(nameInput.value).toBe("");
        fireEvent.blur(nameInput);
        expect(screen.getByText("Full name is required.")).toBeDefined();
    });

    it("renders Move-In Payment Terms with Advance Rent and Security Deposit in Invite Link tab", () => {
        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
                initialTab="invite"
            />
        );

        expect(screen.getByText("Self-Onboarding Link")).toBeDefined();
        expect(screen.getByText("Move-In Payment Terms")).toBeDefined();
        expect(screen.getByText("Advance Rent")).toBeDefined();
        expect(screen.getByText("Security Deposit")).toBeDefined();
        expect(screen.getByText("Total Move-In Settlement Preview")).toBeDefined();
    });

    it("allows configuring advance rent and security deposit directly and via presets in Invite Link tab", () => {
        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
                initialTab="invite"
            />
        );

        const advanceInput = screen.getByLabelText("Advance Rent Amount") as HTMLInputElement;
        const depositInput = screen.getByLabelText("Security Deposit Amount") as HTMLInputElement;

        expect(advanceInput).toBeDefined();
        expect(depositInput).toBeDefined();

        // Rent is 12000 from unit 101 mock
        // Direct custom configuration
        fireEvent.change(advanceInput, { target: { value: "24000" } });
        fireEvent.change(depositInput, { target: { value: "12000" } });
        expect(advanceInput.value).toBe("24000");
        expect(depositInput.value).toBe("12000");
        expect(screen.getByText("₱36,000")).toBeDefined();

        // Preset chip test
        const noneButtons = screen.getAllByRole("button", { name: "None" });
        fireEvent.click(noneButtons[0]); // Advance None
        expect(advanceInput.value).toBe("0");
        expect(screen.getByText("₱12,000")).toBeDefined();

        const twoMoButtons = screen.getAllByRole("button", { name: "2 Mo" });
        fireEvent.click(twoMoButtons[1]); // Deposit 2 Mo (2 * 12,000 = 24,000)
        expect(depositInput.value).toBe("24000");
        expect(screen.getByText("₱24,000")).toBeDefined();
    });

    it("sanitizes financial amounts by stripping letters in Invite Link tab", () => {
        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
                initialTab="invite"
            />
        );

        const advanceInput = screen.getByLabelText("Advance Rent Amount") as HTMLInputElement;
        const depositInput = screen.getByLabelText("Security Deposit Amount") as HTMLInputElement;

        fireEvent.change(advanceInput, { target: { value: "15000abc" } });
        fireEvent.change(depositInput, { target: { value: "25000xyz" } });

        expect(advanceInput.value).toBe("15000");
        expect(depositInput.value).toBe("25000");
        expect(screen.getByText("₱40,000")).toBeDefined();
    });

    it("submits paymentTerms payload when generating an onboarding link", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                invite: {
                    shareUrl: "http://localhost:3000/apply/test-token",
                    qrUrl: "http://localhost:3000/api/qr/test-token",
                },
            }),
        });
        global.fetch = fetchMock;

        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
                initialTab="invite"
            />
        );

        const advanceInput = screen.getByLabelText("Advance Rent Amount") as HTMLInputElement;
        const depositInput = screen.getByLabelText("Security Deposit Amount") as HTMLInputElement;

        fireEvent.change(advanceInput, { target: { value: "15000" } });
        fireEvent.change(depositInput, { target: { value: "15000" } });

        const generateBtn = screen.getByRole("button", { name: "Generate Onboarding Link" });
        fireEvent.click(generateBtn);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith("/api/landlord/invites", expect.objectContaining({
                method: "POST",
                body: expect.stringContaining('"paymentTerms"'),
            }));
        });

        const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(requestBody.paymentTerms).toEqual({
            advanceMonths: -1,
            securityDepositMonths: -1,
            customAdvanceAmount: 15000,
            customSecurityDepositAmount: 15000,
        });
        expect(requestBody.propertyId).toBe("prop-1");
        expect(requestBody.previewUnitId).toBe("u-1");
    });
});
