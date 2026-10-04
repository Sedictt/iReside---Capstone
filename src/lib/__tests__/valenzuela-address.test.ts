import { describe, it, expect } from "vitest";
import { 
    VALENZUELA_BARANGAYS, 
    formatValenzuelaAddress, 
    parseValenzuelaAddress 
} from "@/lib/constants/valenzuela-address";

describe("Valenzuela City Address Directory", () => {
    it("contains all 33 official Valenzuela barangays", () => {
        expect(VALENZUELA_BARANGAYS).toHaveLength(33);
        const names = VALENZUELA_BARANGAYS.map((b) => b.name);
        expect(names).toContain("Karuhatan");
        expect(names).toContain("Gen. T. de Leon");
        expect(names).toContain("Marulas");
        expect(names).toContain("Malinta");
        expect(names).toContain("Paso de Blas");
    });

    it("correctly formats a Valenzuela address with ZIP code", () => {
        const formatted = formatValenzuelaAddress(
            "123 MacArthur Highway",
            "Karuhatan",
            "Valenzuela City",
            "1441"
        );
        expect(formatted).toBe("123 MacArthur Highway, Karuhatan, Valenzuela City, 1441");
    });

    it("correctly parses a Valenzuela address string into components", () => {
        const raw = "Block 4 Lot 12 Tamaraw Hills, Karuhatan, Valenzuela City, 1441";
        const parsed = parseValenzuelaAddress(raw);

        expect(parsed.isValenzuela).toBe(true);
        expect(parsed.barangay).toBe("Karuhatan");
        expect(parsed.city).toBe("Valenzuela City");
        expect(parsed.zipCode).toBe("1441");
        expect(parsed.street).toContain("Block 4 Lot 12 Tamaraw Hills");
    });

    it("handles non-Valenzuela addresses by returning freeform street", () => {
        const raw = "123 Rizal Street, Barangay Poblacion, Makati City";
        const parsed = parseValenzuelaAddress(raw);

        expect(parsed.isValenzuela).toBe(false);
        expect(parsed.street).toBe(raw);
    });
});
