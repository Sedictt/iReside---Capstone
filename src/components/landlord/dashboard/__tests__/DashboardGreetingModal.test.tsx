import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { DashboardGreetingModal } from "../DashboardGreetingModal";

describe("DashboardGreetingModal", () => {
    it("renders nothing when isOpen is false", () => {
        const { container } = render(
            <DashboardGreetingModal
                isOpen={false}
                onClose={vi.fn()}
                onStartTour={vi.fn()}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it("renders Step 5 greeting content with 3 feature points when open", () => {
        render(
            <DashboardGreetingModal
                isOpen={true}
                onClose={vi.fn()}
                onStartTour={vi.fn()}
                propertyName="Pinecrest Tower"
            />
        );

        expect(screen.getByText("Step 5 of 5 • Final Stage")).toBeDefined();
        expect(screen.getByText("Master Your Dashboard")).toBeDefined();
        expect(screen.getByText("Pinecrest Tower")).toBeDefined();
        expect(screen.getByText("1. Action Launchpad")).toBeDefined();
        expect(screen.getByText("2. Real-Time Operational Pulse")).toBeDefined();
        expect(screen.getByText("3. Revenue Stream & Settlement")).toBeDefined();
        expect(screen.getByText("Start Guided Tour")).toBeDefined();
        expect(screen.getByText("Explore First")).toBeDefined();
    });

    it("triggers onStartTour callback when Start Guided Tour is clicked", () => {
        const handleStartTour = vi.fn();
        render(
            <DashboardGreetingModal
                isOpen={true}
                onClose={vi.fn()}
                onStartTour={handleStartTour}
            />
        );

        fireEvent.click(screen.getByText("Start Guided Tour"));
        expect(handleStartTour).toHaveBeenCalledTimes(1);
    });

    it("triggers onClose callback when Explore First is clicked", () => {
        const handleClose = vi.fn();
        render(
            <DashboardGreetingModal
                isOpen={true}
                onClose={handleClose}
                onStartTour={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Explore First"));
        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
