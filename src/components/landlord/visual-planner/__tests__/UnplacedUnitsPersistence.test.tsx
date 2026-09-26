import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React, { useState } from "react";
import { SidebarBlockLibrary } from "../VisualBuilder";
import { DbUnit, FloorId } from "../types";

describe("UnplacedUnitsPersistence", () => {
    const mockUnplacedUnit1: DbUnit = {
        id: "unit-101",
        name: "Unit 101",
        floor: 1,
        status: "vacant",
        rent_amount: 12000,
        beds: 1,
        baths: 1,
        sqft: 28,
        position: null,
    };

    const mockUnplacedUnit2: DbUnit = {
        id: "unit-102",
        name: "Unit 102",
        floor: 1,
        status: "vacant",
        rent_amount: 15000,
        beds: 2,
        baths: 1,
        sqft: 40,
        position: null,
    };

    it("renders unplaced units in sidebar with count and names", () => {
        render(
            <SidebarBlockLibrary
                onDragStart={() => vi.fn()}
                onDragEnd={vi.fn()}
                onUnitClick={vi.fn()}
                styles={{}}
                isDark={false}
                unplacedUnits={[mockUnplacedUnit1, mockUnplacedUnit2]}
                isPropertyMode={true}
                setPendingClearFloor={vi.fn()}
                activeFloorItemCount={0}
                onApplyPreset={vi.fn()}
            />
        );

        expect(screen.getByText("Unplaced Units (2)")).toBeDefined();
        expect(screen.getByText("Unit 101")).toBeDefined();
        expect(screen.getByText("Unit 102")).toBeDefined();
    });

    it("hides unplaced units banner when there are no unplaced units", () => {
        render(
            <SidebarBlockLibrary
                onDragStart={() => vi.fn()}
                onDragEnd={vi.fn()}
                onUnitClick={vi.fn()}
                styles={{}}
                isDark={false}
                unplacedUnits={[]}
                isPropertyMode={true}
                setPendingClearFloor={vi.fn()}
                activeFloorItemCount={0}
                onApplyPreset={vi.fn()}
            />
        );

        expect(screen.queryByText(/Unplaced Units/)).toBeNull();
    });

    it("triggers onUnitClick when clicking an unplaced unit in the sidebar", () => {
        const handleUnitClick = vi.fn();
        render(
            <SidebarBlockLibrary
                onDragStart={() => vi.fn()}
                onDragEnd={vi.fn()}
                onUnitClick={handleUnitClick}
                styles={{}}
                isDark={false}
                unplacedUnits={[mockUnplacedUnit1]}
                isPropertyMode={true}
                setPendingClearFloor={vi.fn()}
                activeFloorItemCount={0}
                onApplyPreset={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Unit 101"));
        expect(handleUnitClick).toHaveBeenCalledWith(mockUnplacedUnit1);
    });

    it("maintains unplaced units in the sidebar across floor switches", () => {
        const FloorSwitchSimulator = () => {
            const [activeFloor, setActiveFloor] = useState<FloorId>("floor1");
            const [unplacedUnits, setUnplacedUnits] = useState<DbUnit[]>([mockUnplacedUnit1]);

            return (
                <div>
                    <div data-testid="current-floor">{activeFloor}</div>
                    <button onClick={() => setActiveFloor("floor2")}>Switch to Floor 2</button>
                    <button onClick={() => setActiveFloor("floor1")}>Switch to Floor 1</button>
                    <SidebarBlockLibrary
                        onDragStart={() => vi.fn()}
                        onDragEnd={vi.fn()}
                        onUnitClick={(u) => {
                            // When placed on activeFloor, remove from unplaced
                            setUnplacedUnits(prev => prev.filter(x => x.id !== u.id));
                        }}
                        styles={{}}
                        isDark={false}
                        unplacedUnits={unplacedUnits}
                        isPropertyMode={true}
                        setPendingClearFloor={vi.fn()}
                        activeFloorItemCount={0}
                        onApplyPreset={vi.fn()}
                    />
                </div>
            );
        };

        render(<FloorSwitchSimulator />);

        // Initially on Floor 1 with Unit 101 in sidebar
        expect(screen.getByTestId("current-floor").textContent).toBe("floor1");
        expect(screen.getByText("Unplaced Units (1)")).toBeDefined();
        expect(screen.getByText("Unit 101")).toBeDefined();

        // Switch to Floor 2: Unit 101 MUST still remain in the sidebar!
        fireEvent.click(screen.getByText("Switch to Floor 2"));
        expect(screen.getByTestId("current-floor").textContent).toBe("floor2");
        expect(screen.getByText("Unplaced Units (1)")).toBeDefined();
        expect(screen.getByText("Unit 101")).toBeDefined();

        // Switch back to Floor 1: Unit 101 still stays in sidebar
        fireEvent.click(screen.getByText("Switch to Floor 1"));
        expect(screen.getByTestId("current-floor").textContent).toBe("floor1");
        expect(screen.getByText("Unplaced Units (1)")).toBeDefined();
        expect(screen.getByText("Unit 101")).toBeDefined();

        // Placing the unit on Floor 2 removes it from the sidebar
        fireEvent.click(screen.getByText("Switch to Floor 2"));
        fireEvent.click(screen.getByText("Unit 101"));
        expect(screen.queryByText(/Unplaced Units/)).toBeNull();
    });
});
