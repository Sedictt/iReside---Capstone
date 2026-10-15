import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { TenantLeaseView } from "../TenantLeaseView";
import { toIsoDate } from "@/lib/lease-term";
import { addDaysIso } from "@/lib/validation/schemas/tenant-lifecycle.schema";
import type { LeaseData } from "@/types/lease";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/haptics", () => ({ triggerHaptic: vi.fn() }));
vi.mock("@/components/mobile/shared/PullToRefresh", () => ({
    PullToRefresh: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/tenant/LeaseModal", () => ({ default: () => null }));

const today = toIsoDate(new Date());

function buildLease(overrides: Partial<LeaseData>): LeaseData {
    return {
        id: "lease-1",
        start_date: "2024-03-01",
        end_date: null,
        term_type: "open_ended",
        monthly_rent: 12000,
        security_deposit: 24000,
        signed_at: "2024-02-20",
        signed_document_url: null,
        status: "active",
        terms: { rent_due_day: 5 },
        unit: {
            id: "unit-1",
            name: "2B",
            floor: 2,
            sqft: null,
            beds: 1,
            baths: 1,
            property: {
                id: "prop-1",
                name: "Pinecrest Residences",
                address: "123 Mountain View Ave",
                city: "Baguio City",
                images: [],
                house_rules: [],
                amenities: [],
            },
        },
        landlord: {
            id: "landlord-1",
            full_name: "Maria Santos",
            avatar_url: "",
            avatar_bg_color: "#ccc",
            phone: "0917",
        },
        tenant: { full_name: "Juan Dela Cruz" },
        ...overrides,
    };
}

function mockFetch(lease: LeaseData) {
    vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes("/api/tenant/lease/move-out/status")) {
                return { ok: true, json: async () => ({ request: null }) } as Response;
            }
            if (url.includes("/api/tenant/renewals")) {
                return { ok: true, json: async () => [] } as Response;
            }
            if (url.includes("/api/tenant/lease")) {
                return { ok: true, json: async () => ({ lease }) } as Response;
            }
            return { ok: false, json: async () => ({}) } as Response;
        })
    );
}

describe("TenantLeaseView (mobile)", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("shows tenure and the open-ended state instead of a countdown or renewal picker", async () => {
        mockFetch(buildLease({}));
        render(<TenantLeaseView />);

        await waitFor(() => expect(screen.getByText("Unit 2B")).toBeDefined());

        expect(screen.getAllByText("Open-ended").length).toBeGreaterThan(0);
        expect(screen.getByText(/Since Mar 2024/)).toBeDefined();
        expect(screen.getByText("Open-ended · month-to-month")).toBeDefined();
        expect(screen.getByTestId("open-ended-notice")).toBeDefined();
        expect(screen.getByText("No renewal needed.")).toBeDefined();

        expect(screen.queryByText(/days left/)).toBeNull();
        expect(screen.queryByText("Term Ended")).toBeNull();
        expect(screen.queryByText("Expiring Soon")).toBeNull();
        expect(screen.queryByText("Request Lease Extension")).toBeNull();
    });

    it("shows the agreed move-out date for an open-ended lease with an end date", async () => {
        mockFetch(buildLease({ end_date: addDaysIso(today, 48) }));
        render(<TenantLeaseView />);

        await waitFor(() => expect(screen.getByText("Unit 2B")).toBeDefined());

        expect(screen.getByText("Moving Out")).toBeDefined();
        expect(screen.getByText("48 days to go")).toBeDefined();
        expect(screen.getByText("Move-out Date")).toBeDefined();
        expect(screen.queryByText("Expiring Soon")).toBeNull();
        expect(screen.queryByText("Request Lease Extension")).toBeNull();
    });

    it("keeps the countdown and renewal flow for a fixed-term lease", async () => {
        mockFetch(buildLease({ term_type: "fixed", end_date: addDaysIso(today, 60) }));
        render(<TenantLeaseView />);

        await waitFor(() => expect(screen.getByText("Unit 2B")).toBeDefined());

        expect(screen.getByText("Expiring Soon")).toBeDefined();
        expect(screen.getByText("60 days left")).toBeDefined();
        expect(screen.getByText("Request Lease Extension")).toBeDefined();
        expect(screen.queryByTestId("open-ended-notice")).toBeNull();
    });
});
