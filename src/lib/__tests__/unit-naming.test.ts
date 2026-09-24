import { describe, it, expect } from "vitest";
import { generateUnitName, generateUnitList, detectPrefixFromUnits, renumberUnitsList } from "../unit-naming";

describe("unit-naming helper", () => {
    it("generates floor-based unit names for ground floor", () => {
        const name = generateUnitName(0, 0, 1, {
            prefix: "Room",
            numberingStyle: "floor_based",
        });
        expect(name).toBe("Room G01");
    });

    it("generates floor-based unit names for upper floors (e.g. 101, 201)", () => {
        const name1 = generateUnitName(0, 1, 1, {
            prefix: "Unit",
            numberingStyle: "floor_based",
        });
        const name2 = generateUnitName(1, 1, 2, {
            prefix: "Unit",
            numberingStyle: "floor_based",
        });
        const name3 = generateUnitName(10, 2, 1, {
            prefix: "Unit",
            numberingStyle: "floor_based",
        });

        expect(name1).toBe("Unit 101");
        expect(name2).toBe("Unit 102");
        expect(name3).toBe("Unit 201");
    });

    it("generates sequential unit names with custom start number", () => {
        const name1 = generateUnitName(0, 1, 1, {
            prefix: "Studio",
            numberingStyle: "sequential",
            startingNumber: 101,
        });
        const name2 = generateUnitName(1, 1, 2, {
            prefix: "Studio",
            numberingStyle: "sequential",
            startingNumber: 101,
        });
        expect(name1).toBe("Studio 101");
        expect(name2).toBe("Studio 102");
    });

    it("generates full unit list partitioned evenly across floors", () => {
        const list = generateUnitList(4, 2, {
            prefix: "Villa",
            numberingStyle: "floor_based",
        });

        expect(list).toEqual([
            { name: "Villa 101", floor: 1 },
            { name: "Villa 102", floor: 1 },
            { name: "Villa 201", floor: 2 },
            { name: "Villa 202", floor: 2 },
        ]);
    });

    it("detects existing unit prefix correctly", () => {
        expect(detectPrefixFromUnits([{ name: "TR 101" }, { name: "TR 102" }])).toBe("TR");
        expect(detectPrefixFromUnits([{ name: "Room 101" }, { name: "Room 102" }])).toBe("Room");
        expect(detectPrefixFromUnits([{ name: "101" }, { name: "102" }])).toBe("");
    });

    it("renumbers units list on floor change and adapts sequence", () => {
        // Floor 1 with 3 units, Floor 2 with 3 units
        const units = [
            { id: "u1", name: "TR 101", floor: 1 },
            { id: "u2", name: "TR 102", floor: 1 },
            { id: "u3", name: "TR 103", floor: 1 },
            { id: "u4", name: "TR 201", floor: 2 },
            { id: "u5", name: "TR 202", floor: 2 },
            { id: "u6", name: "TR 203", floor: 2 },
        ];

        // Move u5 (TR 202) to Floor 1:
        const moved = units.map(u => u.id === "u5" ? { ...u, floor: 1 } : u);
        const renumbered = renumberUnitsList(moved);

        expect(renumbered.find(u => u.id === "u1")?.name).toBe("TR 101");
        expect(renumbered.find(u => u.id === "u2")?.name).toBe("TR 102");
        expect(renumbered.find(u => u.id === "u3")?.name).toBe("TR 103");
        expect(renumbered.find(u => u.id === "u5")?.name).toBe("TR 104"); // Adapted to Floor 1!
        expect(renumbered.find(u => u.id === "u4")?.name).toBe("TR 201");
        expect(renumbered.find(u => u.id === "u6")?.name).toBe("TR 202"); // Floor 2 adjusted!
    });

    it("renumbers units list when a unit is removed", () => {
        const units = [
            { id: "u1", name: "TR 101", floor: 1 },
            { id: "u2", name: "TR 102", floor: 1 },
            { id: "u3", name: "TR 103", floor: 1 },
        ];

        // Remove u2
        const remaining = units.filter(u => u.id !== "u2");
        const renumbered = renumberUnitsList(remaining);

        expect(renumbered).toEqual([
            { id: "u1", name: "TR 101", floor: 1 },
            { id: "u3", name: "TR 102", floor: 1 },
        ]);
    });
});

