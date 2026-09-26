import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { DashboardTourCompletionModal } from "../DashboardTourCompletionModal";

describe("DashboardTourCompletionModal", () => {
    it("renders nothing when isOpen is false", () => {
        const { container } = render(
            <DashboardTourCompletionModal
                isOpen={false}
                onClose={vi.fn()}
                onNavigate={vi.fn()}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it("renders celebration modal content when open", () => {
        render(
            <DashboardTourCompletionModal
                isOpen={true}
                onClose={vi.fn()}
                onNavigate={vi.fn()}
                propertyName="Pinecrest Tower"
            />
        );

        expect(screen.getByText("Onboarding Complete")).toBeDefined();
        expect(screen.getByText("All Features Unlocked")).toBeDefined();
        expect(screen.getByText("You're All Set Up!")).toBeDefined();
        expect(screen.getByText("Pinecrest Tower")).toBeDefined();
        expect(screen.getByText("Open 2D Visual Map")).toBeDefined();
        expect(screen.getByText("Manage Resident Directory")).toBeDefined();
        expect(screen.getByText("Explore Operational Dashboard")).toBeDefined();
    });

    it("triggers onNavigate when destination buttons are clicked", () => {
        const handleNavigate = vi.fn();
        render(
            <DashboardTourCompletionModal
                isOpen={true}
                onClose={vi.fn()}
                onNavigate={handleNavigate}
            />
        );

        fireEvent.click(screen.getByText("Open 2D Visual Map"));
        expect(handleNavigate).toHaveBeenCalledWith("/landlord/unit-map");

        fireEvent.click(screen.getByText("Manage Resident Directory"));
        expect(handleNavigate).toHaveBeenCalledWith("/landlord/tenants");
    });

    it("triggers onClose when Explore Operational Dashboard is clicked", () => {
        const handleClose = vi.fn();
        render(
            <DashboardTourCompletionModal
                isOpen={true}
                onClose={handleClose}
                onNavigate={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Explore Operational Dashboard"));
        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
