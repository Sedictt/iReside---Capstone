import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PropertyRulesSelector } from "@/components/landlord/properties/PropertyRulesSelector";

describe("PropertyRulesSelector Component", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ customRules: [] }),
        } as any);
    });

    it("renders default standard rules list", async () => {
        const handleChange = vi.fn();
        await act(async () => {
            render(
                <PropertyRulesSelector
                    selectedRules={[]}
                    onChange={handleChange}
                    landlordId="test-landlord"
                />
            );
        });

        expect(screen.getByText("Standard Rules")).toBeInTheDocument();
        expect(screen.getByText("No Smoking")).toBeInTheDocument();
        expect(screen.getByText("Quiet Hours (10 PM - 8 AM)")).toBeInTheDocument();
        expect(screen.getByText("No Unauthorized Pets")).toBeInTheDocument();
        expect(screen.getByText("0 Defined")).toBeInTheDocument();
    });

    it("toggles rule selection on click and calls onChange", async () => {
        const handleChange = vi.fn();
        await act(async () => {
            render(
                <PropertyRulesSelector
                    selectedRules={["No Smoking"]}
                    onChange={handleChange}
                    landlordId="test-landlord"
                />
            );
        });

        expect(screen.getByText("1 Defined")).toBeInTheDocument();

        // Click "Quiet Hours (10 PM - 8 AM)" to select it
        const quietHoursButton = screen.getByRole("button", { name: /Quiet Hours \(10 PM - 8 AM\)/i });
        await act(async () => {
            fireEvent.click(quietHoursButton);
        });
        expect(handleChange).toHaveBeenCalledWith(["No Smoking", "Quiet Hours (10 PM - 8 AM)"]);

        // Click "No Smoking" to unselect it
        const smokingButton = screen.getByRole("button", { name: /No Smoking/i });
        await act(async () => {
            fireEvent.click(smokingButton);
        });
        expect(handleChange).toHaveBeenCalledWith([]);
    });

    it("allows adding a custom rule, selects it immediately, and saves to localStorage", async () => {
        const handleChange = vi.fn();
        await act(async () => {
            render(
                <PropertyRulesSelector
                    selectedRules={["No Smoking"]}
                    onChange={handleChange}
                    landlordId="test-landlord"
                />
            );
        });

        const input = screen.getByPlaceholderText(/e\.g\. No Videoke Starting 10pm to 9am/i);
        const addButton = screen.getByRole("button", { name: /Add Rule/i });

        await act(async () => {
            fireEvent.change(input, { target: { value: "No Videoke Starting 10pm to 9am" } });
            fireEvent.click(addButton);
        });

        expect(handleChange).toHaveBeenCalledWith([
            "No Smoking",
            "No Videoke Starting 10pm to 9am",
        ]);

        const stored = JSON.parse(
            localStorage.getItem("ireside_custom_rules_test-landlord") || "[]"
        );
        expect(stored).toContain("No Videoke Starting 10pm to 9am");
    });

    it("renders previously saved custom rules from localStorage", async () => {
        localStorage.setItem(
            "ireside_custom_rules_test-landlord",
            JSON.stringify(["No Videoke Starting 10pm to 9am", "Visitors must register at lobby"])
        );

        const handleChange = vi.fn();
        await act(async () => {
            render(
                <PropertyRulesSelector
                    selectedRules={["No Videoke Starting 10pm to 9am"]}
                    onChange={handleChange}
                    landlordId="test-landlord"
                />
            );
        });

        expect(screen.getByText("Your Custom Rules")).toBeInTheDocument();
        expect(screen.getByText("No Videoke Starting 10pm to 9am")).toBeInTheDocument();
        expect(screen.getByText("Visitors must register at lobby")).toBeInTheDocument();
        expect(screen.getByText("Saved for your account")).toBeInTheDocument();
    });

    it("removes a custom rule choice when clicking the delete button", async () => {
        localStorage.setItem(
            "ireside_custom_rules_test-landlord",
            JSON.stringify(["No Videoke Starting 10pm to 9am"])
        );

        const handleChange = vi.fn();
        await act(async () => {
            render(
                <PropertyRulesSelector
                    selectedRules={["No Videoke Starting 10pm to 9am"]}
                    onChange={handleChange}
                    landlordId="test-landlord"
                />
            );
        });

        const deleteButton = screen.getByRole("button", {
            name: /Delete custom rule choice No Videoke Starting 10pm to 9am/i,
        });
        await act(async () => {
            fireEvent.click(deleteButton);
        });

        // Should unselect it
        expect(handleChange).toHaveBeenCalledWith([]);

        // Should update localStorage
        const stored = JSON.parse(
            localStorage.getItem("ireside_custom_rules_test-landlord") || "[]"
        );
        expect(stored).toEqual([]);
    });

    it("does not show tooltip or title when rule fits without truncation", async () => {
        const handleChange = vi.fn();
        await act(async () => {
            render(
                <PropertyRulesSelector
                    selectedRules={[]}
                    onChange={handleChange}
                    landlordId="test-landlord"
                />
            );
        });

        const smokingButton = screen.getByRole("button", { name: /No Smoking/i });
        expect(smokingButton).not.toHaveAttribute("title");
        expect(smokingButton).not.toHaveAttribute("data-state");
    });

    it("displays full text via tooltip and title when rule text is truncated", async () => {
        const longRule = "No Videoke or High-Decibel Sound Systems Starting 10pm to 9am on Weekdays";
        localStorage.setItem(
            "ireside_custom_rules_test-landlord",
            JSON.stringify([longRule])
        );

        // Mock scrollWidth and clientWidth to simulate truncation on the long rule span
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
                if (this.textContent?.includes("Videoke")) {
                    return 300;
                }
                return 50;
            },
        });

        Object.defineProperty(HTMLElement.prototype, "clientWidth", {
            configurable: true,
            get() {
                if (this.textContent?.includes("Videoke")) {
                    return 100;
                }
                return 50;
            },
        });

        try {
            const handleChange = vi.fn();
            await act(async () => {
                render(
                    <PropertyRulesSelector
                        selectedRules={[]}
                        onChange={handleChange}
                        landlordId="test-landlord"
                    />
                );
            });

            const chipButton = screen.getByRole("button", {
                name: longRule,
            });

            await act(async () => {
                fireEvent.mouseEnter(chipButton);
            });

            expect(chipButton).toHaveAttribute("title", longRule);
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
