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

    it("does not show tooltip or title when amenity text fits without truncation", async () => {
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

        const gymButton = screen.getByRole("button", { name: /Gym/i });
        expect(gymButton).not.toHaveAttribute("title");
        expect(gymButton).not.toHaveAttribute("data-state");
    });

    it("displays full text via tooltip and title when amenity text is truncated", async () => {
        const longAmenity = "FUNCTION ROOM & EVENT HALL";
        localStorage.setItem(
            "ireside_custom_amenities_test-landlord",
            JSON.stringify([longAmenity])
        );

        // Mock scrollWidth and clientWidth to simulate truncation on the long amenity span
        const originalScrollWidth = Object.getOwnPropertyDescriptor(
            HTMLElement.prototype,
            "scrollWidth"
        );
        const originalClientWidth = Object.getOwnPropertyDescriptor(
            HTMLElement.prototype,
            "clientWidth"
        );

        Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
            configurable: true,
            get() {
                if (this.textContent?.includes("FUNCTION ROOM")) {
                    return 200;
                }
                return 50;
            },
        });

        Object.defineProperty(HTMLElement.prototype, "clientWidth", {
            configurable: true,
            get() {
                if (this.textContent?.includes("FUNCTION ROOM")) {
                    return 60;
                }
                return 50;
            },
        });

        try {
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

            const chipButton = screen.getByRole("button", {
                name: longAmenity,
            });

            // Trigger mouseEnter to guarantee truncation check fires
            await act(async () => {
                fireEvent.mouseEnter(chipButton);
            });

            // Expect accessible title with the full amenity text
            expect(chipButton).toHaveAttribute("title", longAmenity);
            // Expect Radix tooltip trigger attribute indicating it is wrapped in Tooltip
            expect(chipButton).toHaveAttribute("data-state");
        } finally {
            if (originalScrollWidth) {
                Object.defineProperty(HTMLElement.prototype, "scrollWidth", originalScrollWidth);
            } else {
                delete (HTMLElement.prototype as any).scrollWidth;
            }
            if (originalClientWidth) {
                Object.defineProperty(HTMLElement.prototype, "clientWidth", originalClientWidth);
            } else {
                delete (HTMLElement.prototype as any).clientWidth;
            }
        }
    });
});

