import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { TenantSetupPromptModal } from "../TenantSetupPromptModal";

describe("TenantSetupPromptModal", () => {
    it("renders stage 1 inquiry when opened", () => {
        render(
            <TenantSetupPromptModal
                isOpen={true}
                onClose={vi.fn()}
                onSelectReusableLink={vi.fn()}
                onSelectAddManually={vi.fn()}
                onMaybeLater={vi.fn()}
                propertyName="Pinecrest Residences"
            />
        );

        expect(screen.getByText("Configure Your Tenants")).toBeDefined();
        expect(screen.getByText("Step 4 of Onboarding")).toBeDefined();
        expect(screen.getByText("Pinecrest Residences")).toBeDefined();
        expect(screen.getByText("Yes, Configure Tenants")).toBeDefined();
        expect(screen.getByText("Maybe Later")).toBeDefined();
    });

    it("does not render when isOpen is false", () => {
        const { container } = render(
            <TenantSetupPromptModal
                isOpen={false}
                onClose={vi.fn()}
                onSelectReusableLink={vi.fn()}
                onSelectAddManually={vi.fn()}
                onMaybeLater={vi.fn()}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it("triggers onMaybeLater when 'Maybe Later' is clicked", () => {
        const handleMaybeLater = vi.fn();
        render(
            <TenantSetupPromptModal
                isOpen={true}
                onClose={vi.fn()}
                onSelectReusableLink={vi.fn()}
                onSelectAddManually={vi.fn()}
                onMaybeLater={handleMaybeLater}
            />
        );

        fireEvent.click(screen.getByText("Maybe Later"));
        expect(handleMaybeLater).toHaveBeenCalledTimes(1);
    });

    it("advances to stage 2 and displays both setup methods upon selecting 'Yes, Configure Tenants'", () => {
        const handleReusableLink = vi.fn();
        const handleAddManually = vi.fn();

        render(
            <TenantSetupPromptModal
                isOpen={true}
                onClose={vi.fn()}
                onSelectReusableLink={handleReusableLink}
                onSelectAddManually={handleAddManually}
                onMaybeLater={vi.fn()}
            />
        );

        // Click Yes
        fireEvent.click(screen.getByText("Yes, Configure Tenants"));

        // Stage 2 UI checks
        expect(screen.getByText("How would you like to add tenants?")).toBeDefined();
        expect(screen.getByText("Invite via Reusable Link")).toBeDefined();
        expect(screen.getByText(/group chat \(Messenger, Viber, WhatsApp\)/i)).toBeDefined();
        expect(screen.getByText("Add Tenants Manually")).toBeDefined();
        expect(screen.getByText("Select Unit:")).toBeDefined();
        expect(screen.getByText("Resident Info:")).toBeDefined();
        expect(screen.getByText("Lease Terms:")).toBeDefined();

        // Click Reusable Link option
        fireEvent.click(screen.getByText("Invite via Reusable Link"));
        expect(handleReusableLink).toHaveBeenCalledTimes(1);

        // Click Manual Form button
        fireEvent.click(screen.getByText("Open Manual Resident Form"));
        expect(handleAddManually).toHaveBeenCalledTimes(1);
    });

    it("returns to stage 1 when Back button is clicked in stage 2", () => {
        render(
            <TenantSetupPromptModal
                isOpen={true}
                onClose={vi.fn()}
                onSelectReusableLink={vi.fn()}
                onSelectAddManually={vi.fn()}
                onMaybeLater={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Yes, Configure Tenants"));
        expect(screen.getByText("How would you like to add tenants?")).toBeDefined();

        fireEvent.click(screen.getByText("Back"));
        expect(screen.getByText("Configure Your Tenants")).toBeDefined();
    });

    it("triggers onSelectQuickAdd and onSelectWalkIn when 3 modes are rendered", () => {
        const handleReusableLink = vi.fn();
        const handleQuickAdd = vi.fn();
        const handleWalkIn = vi.fn();

        render(
            <TenantSetupPromptModal
                isOpen={true}
                onClose={vi.fn()}
                onSelectReusableLink={handleReusableLink}
                onSelectQuickAdd={handleQuickAdd}
                onSelectWalkIn={handleWalkIn}
                onMaybeLater={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Yes, Configure Tenants"));

        expect(screen.getByText("Walk-in Application")).toBeDefined();
        expect(screen.getByText("In-Person Leasing")).toBeDefined();

        fireEvent.click(screen.getByText("Walk-in Application"));
        expect(handleWalkIn).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByText("Open Manual Resident Form"));
        expect(handleQuickAdd).toHaveBeenCalledTimes(1);
    });
});
