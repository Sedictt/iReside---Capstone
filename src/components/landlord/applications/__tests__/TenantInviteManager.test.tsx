import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { TenantInviteManager } from "../TenantInviteManager";

// Mock toast hook
vi.mock("@/hooks/useAppToast", () => ({
    useAppToast: () => ({
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
    }),
}));

// Mock Tooltip
vi.mock("@/components/ui/tooltip", () => ({
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockAvailableUnits = [
    {
        id: "unit-1",
        name: "101",
        rent_amount: 15000,
        property_id: "prop-1",
        property_name: "Pinecrest Residences",
        status: "vacant" as const,
    },
    {
        id: "unit-2",
        name: "102",
        rent_amount: 18000,
        property_id: "prop-1",
        property_name: "Pinecrest Residences",
        status: "vacant" as const,
    },
];

describe("TenantInviteManager", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders Simple mode by default with generator settings", () => {
        render(
            <TenantInviteManager
                availableUnits={mockAvailableUnits}
                invites={[]}
                onRefresh={vi.fn()}
            />
        );

        expect(screen.getByText("Private Links & QR Codes")).toBeDefined();
        expect(screen.getByText("Generator Settings")).toBeDefined();
        expect(screen.getByText("Simple")).toBeDefined();
        expect(screen.getByText("Advanced")).toBeDefined();
        expect(screen.getByText("Select Property")).toBeDefined();
        expect(screen.getByText("Link Expiration")).toBeDefined();
        expect(screen.getByText("Generate Invite")).toBeDefined();

        // Advanced controls are hidden in Simple mode
        expect(screen.queryByText("1. Select Scope")).toBeNull();
        expect(screen.queryByText("2. Application Mode")).toBeNull();
    });

    it("reveals Scope and Screening Mode when toggled to Advanced mode", () => {
        render(
            <TenantInviteManager
                availableUnits={mockAvailableUnits}
                invites={[]}
                onRefresh={vi.fn()}
            />
        );

        // Click Advanced toggle
        fireEvent.click(screen.getByText("Advanced"));

        expect(screen.getByText("1. Select Scope")).toBeDefined();
        expect(screen.getByText("Property Wide")).toBeDefined();
        expect(screen.getByText("Specific Unit")).toBeDefined();
        expect(screen.getByText("2. Application Mode")).toBeDefined();
        expect(screen.getByText("In-Person")).toBeDefined();
        expect(screen.getByText("Online App")).toBeDefined();
    });

    it("shows Required Documents section when Online App mode is active in Advanced mode", () => {
        render(
            <TenantInviteManager
                availableUnits={mockAvailableUnits}
                invites={[]}
                onRefresh={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Advanced"));
        expect(screen.queryByText("3. Required Documents")).toBeNull();

        // Switch to Online App
        fireEvent.click(screen.getByText("Online App"));
        expect(screen.getByText("3. Required Documents")).toBeDefined();
        expect(screen.getByText(/Tenant must upload these/i)).toBeDefined();
    });

    it("switches back to Simple mode and hides advanced controls", () => {
        render(
            <TenantInviteManager
                availableUnits={mockAvailableUnits}
                invites={[]}
                onRefresh={vi.fn()}
            />
        );

        // Switch to Advanced
        fireEvent.click(screen.getByText("Advanced"));
        expect(screen.getByText("1. Select Scope")).toBeDefined();

        // Switch back to Simple
        fireEvent.click(screen.getByText("Simple"));
        expect(screen.queryByText("1. Select Scope")).toBeNull();
        expect(screen.getByText("Select Property")).toBeDefined();
    });

    it("submits invite creation in Simple mode", async () => {
        const handleRefresh = vi.fn();
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                invite: {
                    id: "inv-1",
                    token: "token-123",
                    shareUrl: "https://ireside.ph/apply/token-123",
                    qrUrl: "data:image/png;base64,mock",
                    status: "active",
                    propertyId: "prop-1",
                    propertyName: "Pinecrest Residences",
                    unitId: null,
                    unitName: null,
                    mode: "property",
                    applicationType: "face_to_face",
                    requiredRequirements: [],
                    expiresAt: "2026-10-01T00:00:00.000Z",
                    useCount: 0,
                    maxUses: 1,
                    lastUsedAt: null,
                    createdAt: "2026-09-26T00:00:00.000Z",
                },
            }),
        });
        globalThis.fetch = fetchMock;

        render(
            <TenantInviteManager
                availableUnits={mockAvailableUnits}
                invites={[]}
                onRefresh={handleRefresh}
            />
        );

        fireEvent.click(screen.getByText("Generate Invite"));

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                "/api/landlord/invites",
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                })
            );
            expect(handleRefresh).toHaveBeenCalledTimes(1);
        });
    });
});
