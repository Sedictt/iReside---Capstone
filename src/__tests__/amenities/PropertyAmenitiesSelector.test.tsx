import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PropertyAmenitiesSelector } from "@/components/landlord/properties/PropertyAmenitiesSelector";

describe("PropertyAmenitiesSelector Component", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ customAmenities: [] }),
        } as any);
    });

    it("renders default amenities list", async () => {
        const handleChange = vi.fn();
        await act(async () => {
            render(
                <PropertyAmenitiesSelector
                    selectedAmenities={[]}
                    onChange={handleChange}
                    landlordId="test-landlord"
                />
            );
        });

        expect(screen.getByText("Standard Amenities")).toBeInTheDocument();
        expect(screen.getByText("Wi-Fi")).toBeInTheDocument();
        expect(screen.getByText("Gym")).toBeInTheDocument();
        expect(screen.getByText("Pool")).toBeInTheDocument();
        expect(screen.getByText("0 Selected")).toBeInTheDocument();
    });

    it("toggles amenity on click and calls onChange", async () => {
        const handleChange = vi.fn();
        await act(async () => {
            render(
                <PropertyAmenitiesSelector
                    selectedAmenities={["Wi-Fi"]}
                    onChange={handleChange}
                    landlordId="test-landlord"
                />
            );
        });

        expect(screen.getByText("1 Selected")).toBeInTheDocument();

        // Click Gym to select it
        const gymButton = screen.getByRole("button", { name: /Gym/i });
        await act(async () => {
            fireEvent.click(gymButton);
        });
        expect(handleChange).toHaveBeenCalledWith(["Wi-Fi", "Gym"]);

        // Click Wi-Fi to unselect it
        const wifiButton = screen.getByRole("button", { name: /Wi-Fi/i });
        await act(async () => {
            fireEvent.click(wifiButton);
        });
        expect(handleChange).toHaveBeenCalledWith([]);
    });

    it("allows adding a custom amenity and selects it immediately", async () => {
        const handleChange = vi.fn();
        await act(async () => {
            render(
                <PropertyAmenitiesSelector
                    selectedAmenities={["Wi-Fi"]}
                    onChange={handleChange}
                    landlordId="test-landlord"
                />
            );
        });

        const input = screen.getByPlaceholderText(/e\.g\. Rooftop Lounge/i);
        const addButton = screen.getByRole("button", { name: /Add/i });

        await act(async () => {
            fireEvent.change(input, { target: { value: "Rooftop Lounge" } });
            fireEvent.click(addButton);
        });

        expect(handleChange).toHaveBeenCalledWith(["Wi-Fi", "Rooftop Lounge"]);
    });

    it("renders previously saved custom amenities from localStorage", async () => {
        localStorage.setItem(
            "ireside_custom_amenities_test-landlord",
            JSON.stringify(["Study Lounge", "Sauna"])
        );

        const handleChange = vi.fn();
        await act(async () => {
            render(
                <PropertyAmenitiesSelector
                    selectedAmenities={["Study Lounge"]}
                    onChange={handleChange}
                    landlordId="test-landlord"
                />
            );
        });

        expect(screen.getByText("Your Custom Amenities")).toBeInTheDocument();
        expect(screen.getByText("Study Lounge")).toBeInTheDocument();
        expect(screen.getByText("Sauna")).toBeInTheDocument();
    });

    it("removes a custom amenity choice when clicking the delete button", async () => {
        localStorage.setItem(
            "ireside_custom_amenities_test-landlord",
            JSON.stringify(["Sauna"])
        );

        const handleChange = vi.fn();
        await act(async () => {
            render(
                <PropertyAmenitiesSelector
                    selectedAmenities={["Sauna"]}
                    onChange={handleChange}
                    landlordId="test-landlord"
                />
            );
        });

        const deleteButton = screen.getByRole("button", {
            name: /Delete custom amenity choice Sauna/i,
        });
        await act(async () => {
            fireEvent.click(deleteButton);
        });

        // Should unselect it
        expect(handleChange).toHaveBeenCalledWith([]);

        // Should update localStorage
        const stored = JSON.parse(
            localStorage.getItem("ireside_custom_amenities_test-landlord") || "[]"
        );
        expect(stored).toEqual([]);
    });
});
