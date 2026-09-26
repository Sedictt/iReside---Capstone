import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { UnitMapTourSpotlight, UNIT_MAP_TOUR_STEPS } from "../UnitMapTourSpotlight";

describe("UnitMapTourSpotlight", () => {
    it("renders nothing when isOpen is false", () => {
        const { container } = render(
            <UnitMapTourSpotlight
                isOpen={false}
                currentStepIndex={0}
                onNext={vi.fn()}
                onPrev={vi.fn()}
                onClose={vi.fn()}
                onGenerate={vi.fn()}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it("renders Step 1: Automatic Distribution & Renumbering", () => {
        render(
            <UnitMapTourSpotlight
                isOpen={true}
                currentStepIndex={0}
                onNext={vi.fn()}
                onPrev={vi.fn()}
                onClose={vi.fn()}
                onGenerate={vi.fn()}
            />
        );

        expect(screen.getByText("Tour: Step 1 of 4")).toBeDefined();
        expect(screen.getByText("Step 1: Automatic Distribution & Renumbering")).toBeDefined();
        expect(screen.getByText("Highlighted: Distribution & Renumber Actions")).toBeDefined();
        expect(screen.getByText("Next")).toBeDefined();
    });

    it("renders Step 2: Drag & Drop to Organize Units guide", () => {
        render(
            <UnitMapTourSpotlight
                isOpen={true}
                currentStepIndex={1}
                onNext={vi.fn()}
                onPrev={vi.fn()}
                onClose={vi.fn()}
                onGenerate={vi.fn()}
            />
        );

        expect(screen.getByText("Tour: Step 2 of 4")).toBeDefined();
        expect(screen.getByText("Step 2: Drag & Drop to Organize Units")).toBeDefined();
        expect(screen.getByText(/Drag unit cards directly between floor lanes to customize assignments/i)).toBeDefined();
        expect(screen.getByText("Highlighted: Draggable Unit Card & Floor Dropzone")).toBeDefined();
        expect(screen.getByText(/Hovering over any floor lane reveals its drop target ring/i)).toBeDefined();
    });

    it("renders Step 3: Add & Manage Floor Levels", () => {
        render(
            <UnitMapTourSpotlight
                isOpen={true}
                currentStepIndex={2}
                onNext={vi.fn()}
                onPrev={vi.fn()}
                onClose={vi.fn()}
                onGenerate={vi.fn()}
            />
        );

        expect(screen.getByText("Tour: Step 3 of 4")).toBeDefined();
        expect(screen.getByText("Step 3: Add & Manage Floor Levels")).toBeDefined();
        expect(screen.getByText("Highlighted: + Add Floor Button")).toBeDefined();
    });

    it("renders Step 4: Generate Interactive Unit Map as the final step with generate button", () => {
        const handleGenerate = vi.fn();
        render(
            <UnitMapTourSpotlight
                isOpen={true}
                currentStepIndex={3}
                onNext={vi.fn()}
                onPrev={vi.fn()}
                onClose={vi.fn()}
                onGenerate={handleGenerate}
            />
        );

        expect(screen.getByText("Tour: Step 4 of 4")).toBeDefined();
        expect(screen.getByText("Step 4: Generate Interactive Unit Map")).toBeDefined();
        expect(screen.getByText("Highlighted: Generate Unit-map Button")).toBeDefined();
        
        const generateBtn = screen.getByRole("button", { name: /generate unit-map/i });
        expect(generateBtn).toBeDefined();

        fireEvent.click(generateBtn);
        expect(handleGenerate).toHaveBeenCalledTimes(1);
    });

    it("calls onNext and onPrev when navigation buttons are clicked", () => {
        const handleNext = vi.fn();
        const handlePrev = vi.fn();

        render(
            <UnitMapTourSpotlight
                isOpen={true}
                currentStepIndex={1}
                onNext={handleNext}
                onPrev={handlePrev}
                onClose={vi.fn()}
                onGenerate={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Next"));
        expect(handleNext).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByText("Back"));
        expect(handlePrev).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when close button is clicked", () => {
        const handleClose = vi.fn();
        render(
            <UnitMapTourSpotlight
                isOpen={true}
                currentStepIndex={0}
                onNext={vi.fn()}
                onPrev={vi.fn()}
                onClose={handleClose}
                onGenerate={vi.fn()}
            />
        );

        const closeBtn = screen.getByLabelText("Exit tour");
        fireEvent.click(closeBtn);
        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
