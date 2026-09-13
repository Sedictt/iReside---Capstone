import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { UnitTooltip } from "../UnitTooltip";
import { Unit } from "../../types";

const createMockUnit = (overrides?: Partial<Unit>): Unit => ({
    id: "unit-1",
    name: "Unit 113",
    status: "vacant",
    x: 400,
    y: 350,
    w: 200,
    h: 140,
    type: "1-Bedroom",
    ...overrides,
});

describe("UnitTooltip", () => {
    it("deduplicates 'Unit' in title correctly", () => {
        const unit = createMockUnit({ name: "Unit 113" });
        render(
            <UnitTooltip
                unit={unit}
                onClose={vi.fn()}
                onAction={vi.fn()}
                isDark={false}
            />
        );

        expect(screen.getByText("Unit 113")).toBeDefined();
        expect(screen.queryByText("Unit Unit 113")).toBeNull();
    });

    it("adds 'Unit' prefix if not present", () => {
        const unit = createMockUnit({ name: "101" });
        render(
            <UnitTooltip
                unit={unit}
                onClose={vi.fn()}
                onAction={vi.fn()}
                isDark={false}
            />
        );

        expect(screen.getByText("Unit 101")).toBeDefined();
    });

    it("positions above unit when unit.y >= 220 (bottom arrow)", () => {
        const unit = createMockUnit({ x: 400, y: 350, w: 200, h: 140 });
        const { container } = render(
            <UnitTooltip
                unit={unit}
                onClose={vi.fn()}
                onAction={vi.fn()}
                isDark={false}
                zoom={1}
            />
        );

        const outer = container.querySelector('[data-tooltip="true"]') as HTMLElement;
        expect(outer).not.toBeNull();
        // left: unit.x + unit.w / 2 = 400 + 100 = 500
        expect(outer.style.left).toBe("500px");
        // top: unit.y - 12 = 350 - 12 = 338
        expect(outer.style.top).toBe("338px");

        const inner = outer.firstElementChild as HTMLElement;
        expect(inner.style.transform).toContain("translate(-50%, -100%)");
        expect(inner.style.transformOrigin).toBe("bottom center");

        // Arrow should be at bottom
        const arrow = inner.querySelector(".rotate-45") as HTMLElement;
        expect(arrow.className).toContain("-bottom-[6px]");
    });

    it("positions below unit when unit.y < 220 (top arrow)", () => {
        const unit = createMockUnit({ x: 200, y: 80, w: 200, h: 140 });
        const { container } = render(
            <UnitTooltip
                unit={unit}
                onClose={vi.fn()}
                onAction={vi.fn()}
                isDark={false}
                zoom={1}
            />
        );

        const outer = container.querySelector('[data-tooltip="true"]') as HTMLElement;
        expect(outer).not.toBeNull();
        // left: 200 + 100 = 300
        expect(outer.style.left).toBe("300px");
        // top: unit.y + unit.h + 12 = 80 + 140 + 12 = 232
        expect(outer.style.top).toBe("232px");

        const inner = outer.firstElementChild as HTMLElement;
        expect(inner.style.transform).toContain("translate(-50%, 0%)");
        expect(inner.style.transformOrigin).toBe("top center");

        // Arrow should be at top
        const arrow = inner.querySelector(".rotate-45") as HTMLElement;
        expect(arrow.className).toContain("-top-[6px]");
    });

    it("applies inverse zoom scale so tooltip does not shrink when zooming out", () => {
        const unit = createMockUnit();
        const { container } = render(
            <UnitTooltip
                unit={unit}
                onClose={vi.fn()}
                onAction={vi.fn()}
                isDark={false}
                zoom={0.5}
            />
        );

        const outer = container.querySelector('[data-tooltip="true"]') as HTMLElement;
        const inner = outer.firstElementChild as HTMLElement;
        // 1 / 0.5 = 2
        expect(inner.style.transform).toContain("scale(2)");
    });

    it("calls onAction and onClose on button clicks", () => {
        const onAction = vi.fn();
        const onClose = vi.fn();
        const unit = createMockUnit({ status: "vacant" });

        render(
            <UnitTooltip
                unit={unit}
                onClose={onClose}
                onAction={onAction}
                isDark={false}
            />
        );

        fireEvent.click(screen.getByText("Transfer Request"));
        expect(onAction).toHaveBeenCalledWith("transfer");
        expect(onClose).toHaveBeenCalled();

        fireEvent.click(screen.getByText("Report / Complain"));
        expect(onAction).toHaveBeenCalledWith("complain");
    });

    it("renders close button and triggers onClose", () => {
        const onClose = vi.fn();
        const unit = createMockUnit();

        render(
            <UnitTooltip
                unit={unit}
                onClose={onClose}
                onAction={vi.fn()}
                isDark={false}
            />
        );

        const closeBtn = screen.getByTitle("Close");
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalled();
    });
});
