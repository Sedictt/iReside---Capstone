import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { FirstTimePresetModal } from "../FirstTimePresetModal";
import { generatePresetLayout } from "../../utils/presets";
import { DbUnit } from "../../types";

const mockDbUnits: DbUnit[] = [
    { id: "u-1", name: "Unit 101", floor: 1, status: "vacant", beds: 1, baths: 1, sqft: 500, position: null },
    { id: "u-2", name: "Unit 102", floor: 1, status: "vacant", beds: 2, baths: 1, sqft: 750, position: null },
    { id: "u-3", name: "Unit 103", floor: 1, status: "vacant", beds: 0, baths: 1, sqft: 400, position: null },
    { id: "u-4", name: "Unit 104", floor: 1, status: "vacant", beds: 3, baths: 2, sqft: 1100, position: null },
];

describe("FirstTimePresetModal", () => {
    it("renders modal title and the required onboarding subhead", () => {
        render(
            <FirstTimePresetModal
                isOpen={true}
                onClose={vi.fn()}
                onChooseManual={vi.fn()}
                onSelectPreset={vi.fn()}
                unitCount={4}
                floorCount={1}
            />
        );

        expect(screen.getByText("Choose a Unit-map Layout")).toBeDefined();
        expect(
            screen.getByText(/Your units are on the canvas but haven't been organized into a final unit-map layout yet/i)
        ).toBeDefined();
        expect(
            screen.getByText(/drag and dropping the units themselves and add elements such as stairs from the sidebar/i)
        ).toBeDefined();
    });

    it("renders all 4 layout preset options", () => {
        render(
            <FirstTimePresetModal
                isOpen={true}
                onClose={vi.fn()}
                onChooseManual={vi.fn()}
                onSelectPreset={vi.fn()}
            />
        );

        expect(screen.getByText("Double Loaded")).toBeDefined();
        expect(screen.getByText("Single Loaded")).toBeDefined();
        expect(screen.getByText("U-Shape")).toBeDefined();
        expect(screen.getByText("L-Shape")).toBeDefined();
    });

    it("triggers onSelectPreset when a preset card is clicked", () => {
        const handleSelect = vi.fn();
        render(
            <FirstTimePresetModal
                isOpen={true}
                onClose={vi.fn()}
                onChooseManual={vi.fn()}
                onSelectPreset={handleSelect}
            />
        );

        fireEvent.click(screen.getByText("Double Loaded"));
        expect(handleSelect).toHaveBeenCalledWith("double-loaded");
    });

    it("triggers onChooseManual when Lay Out Manually button is clicked", () => {
        const handleManual = vi.fn();
        render(
            <FirstTimePresetModal
                isOpen={true}
                onClose={vi.fn()}
                onChooseManual={handleManual}
                onSelectPreset={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Lay Out Manually"));
        expect(handleManual).toHaveBeenCalledTimes(1);
    });

    it("triggers onChooseManual on Escape key press", () => {
        const handleManual = vi.fn();
        render(
            <FirstTimePresetModal
                isOpen={true}
                onClose={vi.fn()}
                onChooseManual={handleManual}
                onSelectPreset={vi.fn()}
            />
        );

        fireEvent.keyDown(window, { key: "Escape" });
        expect(handleManual).toHaveBeenCalledTimes(1);
    });
});

describe("generatePresetLayout utility", () => {
    it("generates double-loaded layout with central corridor", () => {
        const layout = generatePresetLayout("double-loaded", mockDbUnits, 1);
        expect(layout.units.length).toBe(4);
        expect(layout.corridors.length).toBe(1);
        expect(layout.corridors[0].label).toBe("Central Corridor");
    });

    it("generates single-loaded layout with main corridor", () => {
        const layout = generatePresetLayout("single-loaded", mockDbUnits, 1);
        expect(layout.units.length).toBe(4);
        expect(layout.corridors.length).toBe(1);
        expect(layout.corridors[0].label).toBe("Main Corridor");
    });

    it("generates u-shape layout with wing corridors", () => {
        const layout = generatePresetLayout("u-shape", mockDbUnits, 1);
        expect(layout.units.length).toBe(4);
        expect(layout.corridors.length).toBeGreaterThanOrEqual(1);
        expect(layout.corridors.some(c => c.label.includes("Wing"))).toBe(true);
    });

    it("generates l-shape layout with main and side wing corridors", () => {
        const layout = generatePresetLayout("l-shape", mockDbUnits, 1);
        expect(layout.units.length).toBe(4);
        expect(layout.corridors.length).toBeGreaterThanOrEqual(2);
        expect(layout.corridors.some(c => c.label === "Main Wing")).toBe(true);
        expect(layout.corridors.some(c => c.label === "Side Wing")).toBe(true);
    });
});
