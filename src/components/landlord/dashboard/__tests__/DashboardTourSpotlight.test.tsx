import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { DashboardTourSpotlight, DASHBOARD_TOUR_STEPS } from "../DashboardTourSpotlight";

describe("DashboardTourSpotlight", () => {
    it("renders nothing when isOpen is false", () => {
        const { container } = render(
            <DashboardTourSpotlight
                isOpen={false}
                currentStepIndex={0}
                onNext={vi.fn()}
                onPrev={vi.fn()}
                onClose={vi.fn()}
                onCompleteTour={vi.fn()}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it("renders Step 1: Quick Actions", () => {
        render(
            <DashboardTourSpotlight
                isOpen={true}
                currentStepIndex={0}
                onNext={vi.fn()}
                onPrev={vi.fn()}
                onClose={vi.fn()}
                onCompleteTour={vi.fn()}
            />
        );

        expect(screen.getByText("Tour: Step 1 of 4")).toBeDefined();
        expect(screen.getByRole("heading", { name: "Step 1: Quick Actions" })).toBeDefined();
        expect(screen.getByText(/Highlighted: Quick Actions/i)).toBeDefined();
        expect(screen.getByText("Next")).toBeDefined();
    });

    it("renders Step 2: Intelligence Hub", () => {
        render(
            <DashboardTourSpotlight
                isOpen={true}
                currentStepIndex={1}
                onNext={vi.fn()}
                onPrev={vi.fn()}
                onClose={vi.fn()}
                onCompleteTour={vi.fn()}
            />
        );

        expect(screen.getByText("Tour: Step 2 of 4")).toBeDefined();
        expect(screen.getByRole("heading", { name: "Step 2: Intelligence Hub" })).toBeDefined();
        expect(screen.getByText(/Highlighted: Intelligence Hub/i)).toBeDefined();
        expect(screen.getByText("Previous")).toBeDefined();
        expect(screen.getByText("Next")).toBeDefined();
    });

    it("renders Step 3: Cash Flow Ledger", () => {
        render(
            <DashboardTourSpotlight
                isOpen={true}
                currentStepIndex={2}
                onNext={vi.fn()}
                onPrev={vi.fn()}
                onClose={vi.fn()}
                onCompleteTour={vi.fn()}
            />
        );

        expect(screen.getByText("Tour: Step 3 of 4")).toBeDefined();
        expect(screen.getByRole("heading", { name: "Step 3: Cash Flow Ledger" })).toBeDefined();
        expect(screen.getByText(/Highlighted: Cash Flow Ledger/i)).toBeDefined();
    });

    it("renders Step 4: Property Selector & Navigation with Complete Tour CTA", () => {
        const handleComplete = vi.fn();
        render(
            <DashboardTourSpotlight
                isOpen={true}
                currentStepIndex={3}
                onNext={vi.fn()}
                onPrev={vi.fn()}
                onClose={vi.fn()}
                onCompleteTour={handleComplete}
            />
        );

        expect(screen.getByText("Tour: Step 4 of 4")).toBeDefined();
        expect(screen.getByText("Step 4: Property Selector & Navigation")).toBeDefined();
        const finishBtn = screen.getByText("Finish Tour");
        expect(finishBtn).toBeDefined();

        fireEvent.click(finishBtn);
        expect(handleComplete).toHaveBeenCalledTimes(1);
    });

    it("triggers navigation callbacks on Next and Back", () => {
        const handleNext = vi.fn();
        const handlePrev = vi.fn();
        const handleClose = vi.fn();

        render(
            <DashboardTourSpotlight
                isOpen={true}
                currentStepIndex={1}
                onNext={handleNext}
                onPrev={handlePrev}
                onClose={handleClose}
                onCompleteTour={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Next"));
        expect(handleNext).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByText("Previous"));
        expect(handlePrev).toHaveBeenCalledTimes(1);

        const closeBtn = screen.getByLabelText("Exit tour");
        fireEvent.click(closeBtn);
        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
