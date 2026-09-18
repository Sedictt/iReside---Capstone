import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    DEFAULT_PROPERTY_AMENITIES,
    normalizeAmenityName,
    isAmenityDuplicate,
    mergeAmenities,
} from "@/lib/constants/amenities";
import { renderHook, act } from "@testing-library/react";
import { useCustomAmenities } from "@/hooks/useCustomAmenities";

describe("Custom Amenities Utilities", () => {
    it("should provide the standard 9 property amenities", () => {
        expect(DEFAULT_PROPERTY_AMENITIES).toEqual([
            "Wi-Fi",
            "Gym",
            "Pool",
            "Laundry",
            "Parking",
            "Security",
            "CCTV",
            "Garden",
            "Elevator",
        ]);
    });

    it("should normalize amenity names properly", () => {
        expect(normalizeAmenityName("   rooftop lounge   ")).toBe("Rooftop Lounge");
        expect(normalizeAmenityName("Study Hall")).toBe("Study Hall");
        expect(normalizeAmenityName("24/7 Concierge")).toBe("24/7 Concierge");
        expect(normalizeAmenityName("   ")).toBe("");
    });

    it("should detect case-insensitive duplicates", () => {
        expect(isAmenityDuplicate("wi-fi", DEFAULT_PROPERTY_AMENITIES)).toBe(true);
        expect(isAmenityDuplicate("WI-FI", DEFAULT_PROPERTY_AMENITIES)).toBe(true);
        expect(isAmenityDuplicate("pool", DEFAULT_PROPERTY_AMENITIES)).toBe(true);
        expect(isAmenityDuplicate("Rooftop Garden", DEFAULT_PROPERTY_AMENITIES)).toBe(false);
    });

    it("should merge default and custom amenities without duplicates", () => {
        const customList = ["Rooftop Deck", "gym", "Study Lounge", "Wi-Fi"];
        const merged = mergeAmenities(DEFAULT_PROPERTY_AMENITIES, customList);

        expect(merged).toContain("Rooftop Deck");
        expect(merged).toContain("Study Lounge");
        // Should not duplicate "Gym" or "Wi-Fi"
        expect(merged.filter((item) => item.toLowerCase() === "gym")).toHaveLength(1);
        expect(merged.filter((item) => item.toLowerCase() === "wi-fi")).toHaveLength(1);
        expect(merged.length).toBe(DEFAULT_PROPERTY_AMENITIES.length + 2);
    });
});

describe("useCustomAmenities Hook", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ customAmenities: [] }),
        } as any);
    });

    it("should initialize with default amenities and empty customs if nothing is stored", async () => {
        let result: any;
        await act(async () => {
            const hook = renderHook(() => useCustomAmenities({ landlordId: "landlord-1" }));
            result = hook.result;
        });

        expect(result.current.defaultAmenities).toEqual(DEFAULT_PROPERTY_AMENITIES);
        expect(result.current.customAmenities).toEqual([]);
        expect(result.current.allChoices).toEqual(DEFAULT_PROPERTY_AMENITIES);
    });

    it("should allow adding a valid custom amenity and persist it", async () => {
        let result: any;
        await act(async () => {
            const hook = renderHook(() => useCustomAmenities({ landlordId: "landlord-1" }));
            result = hook.result;
        });

        act(() => {
            const res = result.current.addCustomAmenity("Rooftop Deck");
            expect(res.success).toBe(true);
            expect(res.name).toBe("Rooftop Deck");
        });

        expect(result.current.customAmenities).toContain("Rooftop Deck");
        expect(result.current.allChoices).toContain("Rooftop Deck");

        // Verify localStorage persistence
        const stored = JSON.parse(localStorage.getItem("ireside_custom_amenities_landlord-1") || "[]");
        expect(stored).toContain("Rooftop Deck");
    });

    it("should reject adding an amenity that duplicates a standard amenity", async () => {
        let result: any;
        await act(async () => {
            const hook = renderHook(() => useCustomAmenities({ landlordId: "landlord-1" }));
            result = hook.result;
        });

        act(() => {
            const res = result.current.addCustomAmenity("wi-fi");
            expect(res.success).toBe(false);
            expect(res.error).toContain("already included in standard amenities");
        });

        expect(result.current.customAmenities).toHaveLength(0);
    });

    it("should reject adding an amenity that is already in custom amenities", async () => {
        let result: any;
        await act(async () => {
            const hook = renderHook(() => useCustomAmenities({ landlordId: "landlord-1" }));
            result = hook.result;
        });

        act(() => {
            result.current.addCustomAmenity("Study Lounge");
        });

        act(() => {
            const duplicateRes = result.current.addCustomAmenity("study lounge");
            expect(duplicateRes.success).toBe(false);
            expect(duplicateRes.error).toContain("already in your custom amenities list");
        });

        expect(result.current.customAmenities).toHaveLength(1);
    });

    it("should reject names that are too short", async () => {
        let result: any;
        await act(async () => {
            const hook = renderHook(() => useCustomAmenities({ landlordId: "landlord-1" }));
            result = hook.result;
        });

        act(() => {
            const res = result.current.addCustomAmenity("A");
            expect(res.success).toBe(false);
            expect(res.error).toContain("at least 2 characters");
        });

        expect(result.current.customAmenities).toHaveLength(0);
    });

    it("should remove a custom amenity on request", async () => {
        let result: any;
        await act(async () => {
            const hook = renderHook(() => useCustomAmenities({ landlordId: "landlord-1" }));
            result = hook.result;
        });

        act(() => {
            result.current.addCustomAmenity("Study Lounge");
            result.current.addCustomAmenity("Game Room");
        });

        expect(result.current.customAmenities).toHaveLength(2);

        act(() => {
            result.current.removeCustomAmenity("Study Lounge");
        });

        expect(result.current.customAmenities).toEqual(["Game Room"]);
        const stored = JSON.parse(localStorage.getItem("ireside_custom_amenities_landlord-1") || "[]");
        expect(stored).toEqual(["Game Room"]);
    });

    it("should remember previously saved custom amenities on next mount/session", async () => {
        // Simulate a previous session where landlord saved "Basketball Court"
        localStorage.setItem(
            "ireside_custom_amenities_landlord-2",
            JSON.stringify(["Basketball Court"])
        );

        let result: any;
        await act(async () => {
            const hook = renderHook(() => useCustomAmenities({ landlordId: "landlord-2" }));
            result = hook.result;
        });

        expect(result.current.customAmenities).toContain("Basketball Court");
        expect(result.current.allChoices).toContain("Basketball Court");
    });
});
