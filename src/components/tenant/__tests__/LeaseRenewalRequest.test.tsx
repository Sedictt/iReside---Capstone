import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import LeaseRenewalRequest from "../LeaseRenewalRequest";
import { OPEN_ENDED_NOTICE_DAYS, toIsoDate } from "@/lib/lease-term";
import { addDaysIso } from "@/lib/validation/schemas/tenant-lifecycle.schema";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const today = toIsoDate(new Date());

function mockFetch() {
    vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url.includes("/move-out/status")) {
                return { ok: true, json: async () => ({ request: null }) } as Response;
            }
            return { ok: true, json: async () => [] } as Response;
        })
    );
}

describe("LeaseRenewalRequest", () => {
    beforeEach(() => {
        mockFetch();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("shows a 'No renewal needed' card instead of the form for an open-ended lease", () => {
        render(
            <LeaseRenewalRequest
                leaseId="lease-1"
                lease={{ term_type: "open_ended", end_date: null, start_date: "2024-03-01" }}
                existingRequest={null}
            />
        );

        expect(screen.getByText("No renewal needed")).toBeDefined();
        expect(screen.getByText(new RegExp(`${OPEN_ENDED_NOTICE_DAYS} days' notice`))).toBeDefined();
        expect(screen.getByRole("button", { name: /request a move-out/i })).toBeDefined();
        expect(screen.queryByText("Lease Renewal")).toBeNull();
        expect(screen.queryByText("Request Renewal")).toBeNull();
        expect(screen.queryByText("Locked")).toBeNull();
    });

    it("renders nothing for an open-ended lease in the headless variant", () => {
        const { container } = render(
            <LeaseRenewalRequest
                variant="none"
                autoOpen
                leaseId="lease-1"
                lease={{ term_type: "open_ended", end_date: null, start_date: "2024-03-01" }}
                existingRequest={null}
            />
        );

        expect(container.textContent).toBe("");
        expect(document.body.textContent).not.toContain("Lease Renewal Request");
    });

    it("keeps the renewal form for a fixed-term lease inside the renewal window", () => {
        render(
            <LeaseRenewalRequest
                leaseId="lease-2"
                lease={{ term_type: "fixed", end_date: addDaysIso(today, 45), start_date: "2024-03-01" }}
                existingRequest={null}
            />
        );

        expect(screen.getByText("Lease Renewal")).toBeDefined();
        expect(screen.getByRole("button", { name: /request renewal/i })).toBeDefined();
        expect(screen.queryByText("No renewal needed")).toBeNull();
    });

    it("locks renewal for a fixed-term lease outside the window and counts down to eligibility", () => {
        render(
            <LeaseRenewalRequest
                leaseId="lease-3"
                lease={{ term_type: "fixed", end_date: addDaysIso(today, 120), start_date: "2024-03-01" }}
                existingRequest={null}
            />
        );

        expect(screen.getByRole("button", { name: /locked/i })).toBeDefined();
        expect(screen.getByText(/in 30 days/)).toBeDefined();
    });

    it("still surfaces a pending request on an open-ended lease", () => {
        render(
            <LeaseRenewalRequest
                leaseId="lease-4"
                lease={{ term_type: "open_ended", end_date: null, start_date: "2024-03-01" }}
                existingRequest={{ status: "pending", current_lease_id: "lease-4" }}
            />
        );

        expect(screen.getByText("Under Review")).toBeDefined();
        expect(screen.queryByText("No renewal needed")).toBeNull();
    });
});
