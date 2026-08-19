import { describe, it, expect } from "vitest";
import { generateUnitName, generateUnitList } from "@/lib/unit-naming";

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
});
