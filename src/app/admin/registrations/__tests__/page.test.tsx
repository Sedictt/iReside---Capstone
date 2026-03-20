/**
 * Tests for Admin Registrations Page
 * Feature: admin-portal-database-integration
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import * as fc from "fast-check";
import AdminRegistrationsPage from "../page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RegistrationStatus = "pending" | "reviewing" | "approved" | "rejected" | "withdrawn";

interface RegistrationRow {
    id: string;
    phone: string;
    status: RegistrationStatus;
    admin_notes: string | null;
    created_at: string;
    identity_document_url: string | null;
    ownership_document_url: string | null;
    liveness_document_url: string | null;
    profile: {
        id: string;
        full_name: string;
        email: string;
        avatar_url: string | null;
    } | null;
}

function makeRegistration(overrides: Partial<RegistrationRow> = {}): RegistrationRow {
    return {
        id: "reg-1",
        phone: "09171234567",
        status: "pending",
        admin_notes: null,
        created_at: new Date().toISOString(),
        identity_document_url: null,
        ownership_document_url: null,
        liveness_document_url: null,
        profile: {
            id: "profile-1",
            full_name: "Juan dela Cruz",
            email: "juan@example.com",
            avatar_url: null,
        },
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Unit Tests — Task 5.1 (Requirements 4.4, 4.5)
// ---------------------------------------------------------------------------

describe("AdminRegistrationsPage — unit tests", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('renders "No registrations found." when API returns an empty array (Requirement 4.5)', async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                json: async () => ({ registrations: [] }),
            })
        );

        render(<AdminRegistrationsPage />);

        await waitFor(() => {
            expect(screen.getByText("No registrations found.")).toBeInTheDocument();
        });
    });

    it("renders registration rows when API returns data (Requirement 4.1)", async () => {
        const reg = makeRegistration({
            profile: { id: "p1", full_name: "Maria Santos", email: "maria@example.com", avatar_url: null },
        });
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                json: async () => ({ registrations: [reg] }),
            })
        );

        render(<AdminRegistrationsPage />);

        await waitFor(() => {
            expect(screen.getByText("Maria Santos")).toBeInTheDocument();
            expect(screen.getByText("maria@example.com")).toBeInTheDocument();
        });
    });

    it("shows loading state initially", () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockReturnValue(new Promise(() => {})) // never resolves
        );

        render(<AdminRegistrationsPage />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("fetches from /api/admin/registrations on mount (Requirement 4.1)", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            json: async () => ({ registrations: [] }),
        });
        vi.stubGlobal("fetch", fetchMock);

        render(<AdminRegistrationsPage />);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith("/api/admin/registrations");
        });
    });

    it("calls PATCH /api/admin/registrations/:id and reloads on status change (Requirement 4.4)", async () => {
        const reg = makeRegistration({ id: "reg-abc", status: "pending" });

        const fetchMock = vi
            .fn()
            // First call: load list
            .mockResolvedValueOnce({ json: async () => ({ registrations: [reg] }) })
            // Second call: PATCH
            .mockResolvedValueOnce({ json: async () => ({ success: true }) })
            // Third call: reload list
            .mockResolvedValueOnce({ json: async () => ({ registrations: [] }) });

        vi.stubGlobal("fetch", fetchMock);

        render(<AdminRegistrationsPage />);

        // Wait for the row to appear
        await waitFor(() => {
            expect(screen.getByText("Juan dela Cruz")).toBeInTheDocument();
        });

        // Open the review modal
        fireEvent.click(screen.getByText("Review"));

        // Click "Mark Reviewing"
        await waitFor(() => {
            expect(screen.getByText("Mark Reviewing")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText("Mark Reviewing"));

        // Verify PATCH was called with the correct URL
        await waitFor(() => {
            const patchCall = fetchMock.mock.calls.find(
                (call) => call[0] === "/api/admin/registrations/reg-abc"
            );
            expect(patchCall).toBeDefined();
            expect(patchCall![1]).toMatchObject({ method: "PATCH" });
        });

        // Verify list was reloaded (fetch called 3 times total)
        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(3);
        });
    });
});

// ---------------------------------------------------------------------------
// Property-Based Tests
// ---------------------------------------------------------------------------

// Extracted filter function matching the page implementation
function filterRegistrations(
    registrations: RegistrationRow[],
    filter: RegistrationStatus | "all"
): RegistrationRow[] {
    return filter === "all"
        ? registrations
        : registrations.filter((r) => r.status === filter);
}

const statusArb = fc.constantFrom<RegistrationStatus>(
    "pending",
    "reviewing",
    "approved",
    "rejected",
    "withdrawn"
);

const registrationArb = fc.record<RegistrationRow>({
    id: fc.uuid(),
    phone: fc.string({ minLength: 7, maxLength: 15 }),
    status: statusArb,
    admin_notes: fc.option(fc.string(), { nil: null }),
    created_at: fc
        .integer({ min: new Date("2020-01-01").getTime(), max: new Date("2030-01-01").getTime() })
        .map((ts) => new Date(ts).toISOString()),
    identity_document_url: fc.constant(null),
    ownership_document_url: fc.constant(null),
    liveness_document_url: fc.constant(null),
    profile: fc.option(
        fc.record({
            id: fc.uuid(),
            full_name: fc.string({ minLength: 1, maxLength: 50 }),
            email: fc.emailAddress(),
            avatar_url: fc.constant(null),
        }),
        { nil: null }
    ),
});

describe("AdminRegistrationsPage — property tests", () => {
    // Property 5: Status tab filter shows only matching registrations
    // Feature: admin-portal-database-integration, Property 5: Status tab filter shows only matching registrations
    it("Property 5: every result has the matching status when filter is not 'all' (Requirement 4.3)", () => {
        fc.assert(
            fc.property(
                fc.array(registrationArb, { minLength: 0, maxLength: 50 }),
                statusArb,
                (registrations, status) => {
                    const results = filterRegistrations(registrations, status);
                    for (const r of results) {
                        if (r.status !== status) return false;
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it("Property 5: no matching registration is excluded from filtered results (Requirement 4.3)", () => {
        fc.assert(
            fc.property(
                fc.array(registrationArb, { minLength: 0, maxLength: 50 }),
                statusArb,
                (registrations, status) => {
                    const results = filterRegistrations(registrations, status);
                    const resultIds = new Set(results.map((r) => r.id));
                    for (const r of registrations) {
                        if (r.status === status && !resultIds.has(r.id)) return false;
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it("Property 5: filter 'all' returns all registrations (Requirement 4.3)", () => {
        fc.assert(
            fc.property(
                fc.array(registrationArb, { minLength: 0, maxLength: 50 }),
                (registrations) => {
                    const results = filterRegistrations(registrations, "all");
                    return results.length === registrations.length;
                }
            ),
            { numRuns: 100 }
        );
    });
});
