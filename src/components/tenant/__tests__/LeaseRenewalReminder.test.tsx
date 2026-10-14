import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import LeaseRenewalReminder from "../LeaseRenewalReminder";
import { toIsoDate } from "@/lib/lease-term";
import { addDaysIso } from "@/lib/validation/schemas/tenant-lifecycle.schema";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const today = toIsoDate(new Date());

describe("LeaseRenewalReminder", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        sessionStorage.clear();
        localStorage.clear();
        vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => [] }) as Response));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it("never renders for an open-ended lease", async () => {
        const { container } = render(
            <LeaseRenewalReminder
                leaseId="lease-open"
                hasOngoingRequest={false}
                lease={{ term_type: "open_ended", end_date: null, start_date: "2024-03-01" }}
            />
        );

        await act(async () => {
            await vi.advanceTimersByTimeAsync(5000);
        });

        expect(container.innerHTML).toBe("");
        expect(screen.queryByText("Lease Renewal Available")).toBeNull();
        expect(sessionStorage.getItem("ireside_renewal_reminder_shown_lease-open")).toBeNull();
    });

    it("never renders for an open-ended lease even when a move-out date is set", async () => {
        const { container } = render(
            <LeaseRenewalReminder
                leaseId="lease-moving"
                hasOngoingRequest={false}
                lease={{ term_type: "open_ended", end_date: addDaysIso(today, 20), start_date: "2024-03-01" }}
            />
        );

        await act(async () => {
            await vi.advanceTimersByTimeAsync(5000);
        });

        expect(container.innerHTML).toBe("");
    });

    it("shows the reminder for a fixed-term lease inside the 90-day window", async () => {
        render(
            <LeaseRenewalReminder
                leaseId="lease-fixed"
                hasOngoingRequest={false}
                lease={{ term_type: "fixed", end_date: addDaysIso(today, 45), start_date: "2024-03-01" }}
            />
        );

        await act(async () => {
            await vi.advanceTimersByTimeAsync(2500);
        });

        expect(screen.getByText("Lease Renewal Available")).toBeDefined();
        expect(screen.getByText(/45 Days Left/)).toBeDefined();
    });

    it("stays hidden for a fixed-term lease outside the window", async () => {
        const { container } = render(
            <LeaseRenewalReminder
                leaseId="lease-far"
                hasOngoingRequest={false}
                lease={{ term_type: "fixed", end_date: addDaysIso(today, 200), start_date: "2024-03-01" }}
            />
        );

        await act(async () => {
            await vi.advanceTimersByTimeAsync(5000);
        });

        expect(container.innerHTML).toBe("");
    });
});
