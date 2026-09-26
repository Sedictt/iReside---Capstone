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

    it("renders Step 1: Operational Action Launchpad", () => {
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
        expect(screen.getByText("Step 1: Operational Action Launchpad")).toBeDefined();
        expect(screen.getByText(/Quick Action Launchpad/i)).toBeDefined();
        expect(screen.getByText("Next")).toBeDefined();
    });

    it("renders Step 2: Real-Time Command Pulse", () => {
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
        expect(screen.getByText("Step 2: Real-Time Command Pulse")).toBeDefined();
        expect(screen.getByText(/Command Center Pulse/i)).toBeDefined();
        expect(screen.getByText("Previous")).toBeDefined();
        expect(screen.getByText("Next")).toBeDefined();
    });

    it("renders Step 3: Revenue Stream & Direct Settlement", () => {
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
        expect(screen.getByText("Step 3: Revenue Stream & Direct Settlement")).toBeDefined();
        expect(screen.getByText(/Cash Flow Ledger/i)).toBeDefined();
    });

    it("renders Step 4: Portfolio Switcher & Hub with Complete Tour CTA", () => {
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
        expect(screen.getByText("Step 4: Portfolio Switcher & Operations Hub")).toBeDefined();
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
