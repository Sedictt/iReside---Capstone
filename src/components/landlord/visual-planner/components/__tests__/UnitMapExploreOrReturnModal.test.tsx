import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { UnitMapExploreOrReturnModal } from "../UnitMapExploreOrReturnModal";

describe("UnitMapExploreOrReturnModal", () => {
    it("renders modal when isOpen is true", () => {
        render(
            <UnitMapExploreOrReturnModal
                isOpen={true}
                onReturnToDashboard={vi.fn()}
                onContinueExploring={vi.fn()}
                propertyName="Pinecrest Residences"
            />
        );

        expect(screen.getByText("Floor Plan Ready")).toBeDefined();
        expect(screen.getByText("Layout Saved")).toBeDefined();
        expect(screen.getByText("Pinecrest Residences")).toBeDefined();
        expect(screen.getByText("Return to Dashboard")).toBeDefined();
        expect(screen.getByText("Continue Exploring Map")).toBeDefined();
    });

    it("does not render when isOpen is false", () => {
        const { container } = render(
            <UnitMapExploreOrReturnModal
                isOpen={false}
                onReturnToDashboard={vi.fn()}
                onContinueExploring={vi.fn()}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it("triggers onReturnToDashboard when 'Return to Dashboard' button is clicked", () => {
        const handleReturn = vi.fn();
        render(
            <UnitMapExploreOrReturnModal
                isOpen={true}
                onReturnToDashboard={handleReturn}
                onContinueExploring={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Return to Dashboard"));
        expect(handleReturn).toHaveBeenCalledTimes(1);
    });

    it("triggers onContinueExploring when 'Continue Exploring Map' button is clicked", () => {
        const handleExplore = vi.fn();
        render(
            <UnitMapExploreOrReturnModal
                isOpen={true}
                onReturnToDashboard={vi.fn()}
                onContinueExploring={handleExplore}
            />
        );

        fireEvent.click(screen.getByText("Continue Exploring Map"));
        expect(handleExplore).toHaveBeenCalledTimes(1);
    });

    it("triggers onContinueExploring when Escape key is pressed", () => {
        const handleExplore = vi.fn();
        render(
            <UnitMapExploreOrReturnModal
                isOpen={true}
                onReturnToDashboard={vi.fn()}
                onContinueExploring={handleExplore}
            />
        );

        fireEvent.keyDown(window, { key: "Escape" });
        expect(handleExplore).toHaveBeenCalledTimes(1);
    });
});
