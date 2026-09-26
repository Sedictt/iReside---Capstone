import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { AddTenantModal } from "../AddTenantModal";

// Mock framer-motion
vi.mock("framer-motion", () => ({
    m: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock PropertyContext
vi.mock("@/context/PropertyContext", () => ({
    useProperty: () => ({
        properties: [
            {
                id: "prop-1",
                name: "Pinecrest Residences",
                address: "123 Main St",
                units: [
                    { id: "u-1", name: "101", status: "vacant", rentAmount: 12000 },
                ],
            },
        ],
    }),
}));

describe("AddTenantModal", () => {
    it("renders manual tab by default when isOpen is true", () => {
        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
            />
        );

        expect(screen.getByText("Onboard Residents")).toBeDefined();
        expect(screen.getByText("Manual Entry")).toBeDefined();
        expect(screen.getByText("Invite Link")).toBeDefined();
        expect(screen.getByText("Resident Profile")).toBeDefined();
    });

    it("renders invite tab directly when initialTab is set to 'invite'", () => {
        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
                initialTab="invite"
            />
        );

        expect(screen.getByText("Onboard Residents")).toBeDefined();
        expect(screen.getByText("Self-Onboarding Link")).toBeDefined();
        expect(screen.getByText("Generate Onboarding Link")).toBeDefined();
    });

    it("switches tabs between manual and invite on user click", () => {
        render(
            <AddTenantModal
                isOpen={true}
                onClose={vi.fn()}
                onSuccess={vi.fn()}
            />
        );

        // Initially in Manual tab
        expect(screen.getByText("Resident Profile")).toBeDefined();

        // Switch to Invite tab
        fireEvent.click(screen.getByText("Invite Link"));
        expect(screen.getByText("Self-Onboarding Link")).toBeDefined();

        // Switch back to Manual tab
        fireEvent.click(screen.getByText("Manual Entry"));
        expect(screen.getByText("Resident Profile")).toBeDefined();
    });
});
