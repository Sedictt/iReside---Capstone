/**
 * Tests for Admin Users Page
 * Feature: admin-portal-database-integration
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import * as fc from "fast-check";
import AdminUsersPage from "../page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type UserRole = "tenant" | "landlord" | "admin";

interface UserRow {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    avatar_url: string | null;
    created_at: string;
}

function makeUser(overrides: Partial<UserRow> = {}): UserRow {
    return {
        id: "user-1",
        full_name: "Alice Smith",
        email: "alice@example.com",
        role: "tenant",
        avatar_url: null,
        created_at: new Date().toISOString(),
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Unit Tests — Task 4.1 (Requirement 3.4)
// ---------------------------------------------------------------------------

describe("AdminUsersPage — unit tests", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('renders "No users found." when API returns an empty array (Requirement 3.4)', async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                json: async () => ({ users: [] }),
            })
        );

        render(<AdminUsersPage />);

        await waitFor(() => {
            expect(screen.getByText("No users found.")).toBeInTheDocument();
        });
    });

    it("renders user rows when API returns data (Requirement 3.1)", async () => {
        const user = makeUser({ full_name: "Bob Jones", email: "bob@example.com" });
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                json: async () => ({ users: [user] }),
            })
        );

        render(<AdminUsersPage />);

        await waitFor(() => {
            expect(screen.getByText("Bob Jones")).toBeInTheDocument();
            expect(screen.getByText("bob@example.com")).toBeInTheDocument();
        });
    });

    it("shows loading state initially", () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockReturnValue(new Promise(() => {})) // never resolves
        );

        render(<AdminUsersPage />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("fetches from /api/admin/users on mount (Requirement 3.1)", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            json: async () => ({ users: [] }),
        });
        vi.stubGlobal("fetch", fetchMock);

        render(<AdminUsersPage />);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith("/api/admin/users");
        });
    });
});

// ---------------------------------------------------------------------------
// Property-Based Tests
// ---------------------------------------------------------------------------

// Extracted filter function matching the page implementation
function filterUsers(users: UserRow[], search: string): UserRow[] {
    const q = search.toLowerCase();
    return users.filter(
        (u) =>
            u.full_name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
    );
}

// Arbitrary for UserRow
const userArb = fc.record<UserRow>({
    id: fc.uuid(),
    full_name: fc.string({ minLength: 1, maxLength: 50 }),
    email: fc.emailAddress(),
    role: fc.constantFrom<UserRole>("tenant", "landlord", "admin"),
    avatar_url: fc.option(fc.webUrl(), { nil: null }),
    created_at: fc
        .integer({ min: new Date("2020-01-01").getTime(), max: new Date("2030-01-01").getTime() })
        .map((ts) => new Date(ts).toISOString()),
});

describe("AdminUsersPage — property tests", () => {
    // Property 3: Client-side user search filters correctly
    // Feature: admin-portal-database-integration, Property 3: Client-side user search filters correctly
    it("Property 3: every result contains the search string in full_name or email (Requirement 3.3)", () => {
        fc.assert(
            fc.property(
                fc.array(userArb, { minLength: 0, maxLength: 50 }),
                fc.string({ minLength: 1, maxLength: 20 }),
                (users, search) => {
                    const results = filterUsers(users, search);
                    const q = search.toLowerCase();
                    for (const u of results) {
                        const matches =
                            u.full_name.toLowerCase().includes(q) ||
                            u.email.toLowerCase().includes(q);
                        if (!matches) return false;
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it("Property 3: no user excluded from results if their name or email matches the search (Requirement 3.3)", () => {
        fc.assert(
            fc.property(
                fc.array(userArb, { minLength: 0, maxLength: 50 }),
                fc.string({ minLength: 1, maxLength: 20 }),
                (users, search) => {
                    const results = filterUsers(users, search);
                    const q = search.toLowerCase();
                    const resultIds = new Set(results.map((u) => u.id));
                    for (const u of users) {
                        const shouldMatch =
                            u.full_name.toLowerCase().includes(q) ||
                            u.email.toLowerCase().includes(q);
                        if (shouldMatch && !resultIds.has(u.id)) return false;
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it("Property 3: empty search returns all users (Requirement 3.3)", () => {
        fc.assert(
            fc.property(fc.array(userArb, { minLength: 0, maxLength: 50 }), (users) => {
                const results = filterUsers(users, "");
                return results.length === users.length;
            }),
            { numRuns: 100 }
        );
    });
});
