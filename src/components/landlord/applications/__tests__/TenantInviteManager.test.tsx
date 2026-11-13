import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { TenantInviteManager, type InviteListItem } from "../TenantInviteManager";

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

function makeMockInvites(count: number): InviteListItem[] {
    return Array.from({ length: count }, (_, idx) => ({
        id: `inv-${idx + 1}`,
        mode: "property",
        applicationType: "face_to_face",
        requiredRequirements: [],
        status: idx === 0 ? "active" : "consumed",
        propertyId: "prop-1",
        propertyName: `Pinecrest Residences ${idx + 1}`,
        unitId: null,
        unitName: null,
        expiresAt: "2026-12-01T00:00:00.000Z",
        useCount: idx === 0 ? 1 : 5,
        maxUses: 5,
        lastUsedAt: null,
        createdAt: "2026-11-01T00:00:00.000Z",
        shareUrl: `https://ireside.ph/apply/token-${idx + 1}`,
        qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=token-${idx + 1}`,
    }));
}

describe("TenantInviteManager", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders streamlined 3-step invite creator by default", () => {
        render(
            <TenantInviteManager
                availableUnits={mockAvailableUnits}
                invites={[]}
                onRefresh={vi.fn()}
            />
        );

        expect(screen.getByText("Invite a Tenant")).toBeDefined();
        expect(screen.getByText("Which property and room?")).toBeDefined();
        expect(screen.getByText("How will the tenant apply?")).toBeDefined();
        expect(screen.getByText("Link limits & move-in payment")).toBeDefined();
        expect(screen.getByText("How many people can use this link?")).toBeDefined();
        expect(screen.getAllByText("Create Invite Link").length).toBeGreaterThan(0);

        // Specific unit dropdown and online docs are hidden until selected
        expect(screen.queryByText("Choose Vacant Room")).toBeNull();
        expect(screen.queryByText("Documents the tenant must upload:")).toBeNull();
    });

    it("reveals room combobox when One Specific Room is selected and filters suggestions", () => {
        render(
            <TenantInviteManager
                availableUnits={mockAvailableUnits}
                invites={[]}
                onRefresh={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("One Specific Room"));
        expect(screen.getByText("Choose Vacant Room")).toBeDefined();

        const combobox = screen.getByRole("combobox", { name: "Choose Vacant Room" });
        fireEvent.focus(combobox);
        expect(screen.getByText("101")).toBeDefined();
        expect(screen.getByText("102")).toBeDefined();

        fireEvent.change(combobox, { target: { value: "102" } });
        expect(screen.queryByRole("option", { name: /101/ })).toBeNull();
        expect(screen.getByRole("option", { name: /102/ })).toBeDefined();

        fireEvent.click(screen.getByRole("option", { name: /102/ }));
        expect((combobox as HTMLInputElement).value).toBe("102");
    });

    it("reveals document checkboxes when Online Application is selected", () => {
        render(
            <TenantInviteManager
                availableUnits={mockAvailableUnits}
                invites={[]}
                onRefresh={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Online Application"));
        expect(screen.getByText("Documents the tenant must upload:")).toBeDefined();
        expect(screen.getByText("Valid ID")).toBeDefined();
        expect(screen.getByText("Proof of Income")).toBeDefined();
    });

    it("submits selected maxUses limit when creating an invite", async () => {
        const handleRefresh = vi.fn();
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                invite: {
                    id: "inv-1",
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
                    expiresAt: "2026-12-01T00:00:00.000Z",
                    useCount: 0,
                    maxUses: 5,
                    lastUsedAt: null,
                    createdAt: "2026-11-13T00:00:00.000Z",
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

        fireEvent.click(screen.getByText("5 People"));
        fireEvent.click(screen.getAllByText("Create Invite Link")[0]);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                "/api/landlord/invites",
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                })
            );
            const [, init] = fetchMock.mock.calls[0];
            const parsedBody = JSON.parse((init as RequestInit).body as string);
            expect(parsedBody.maxUses).toBe(5);
            expect(handleRefresh).toHaveBeenCalledTimes(1);
        });
    });

    it("supports custom maxUses input and paginates Past Links", () => {
        const invites = makeMockInvites(6);
        render(
            <TenantInviteManager
                availableUnits={mockAvailableUnits}
                invites={invites}
                onRefresh={vi.fn()}
            />
        );

        // Switch to Past Links tab
        fireEvent.click(screen.getByRole("tab", { name: /Past Links/i }));

        expect(screen.getByText("Showing 1–4 of 6")).toBeDefined();
        expect(screen.getByText("Pinecrest Residences 1")).toBeDefined();
        expect(screen.queryByText("Pinecrest Residences 5")).toBeNull();

        fireEvent.click(screen.getByText("Next"));
        expect(screen.getByText("Showing 5–6 of 6")).toBeDefined();
        expect(screen.getByText("Pinecrest Residences 5")).toBeDefined();
    });
});
