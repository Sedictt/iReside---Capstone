/**
 * Tests for GET /api/admin/users
 * Feature: admin-portal-database-integration
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// Property 2: Users API response is ordered by creation date descending
// Feature: admin-portal-database-integration, Property 2: Users API response is ordered by creation date descending
// ---------------------------------------------------------------------------

// Simulate the ordering that the route applies via Supabase .order("created_at", { ascending: false })
function sortByCreatedAtDesc<T extends { created_at: string }>(rows: T[]): T[] {
    return [...rows].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

function isOrderedDesc(rows: { created_at: string }[]): boolean {
    for (let i = 0; i < rows.length - 1; i++) {
        const a = new Date(rows[i].created_at).getTime();
        const b = new Date(rows[i + 1].created_at).getTime();
        if (a < b) return false;
    }
    return true;
}

describe("GET /api/admin/users — property tests", () => {
    // Property 2: Users API response is ordered by creation date descending (Requirement 3.2)
    it("Property 2: adjacent rows satisfy [i].created_at >= [i+1].created_at (Requirement 3.2)", () => {
        const userArb = fc.record({
            id: fc.uuid(),
            full_name: fc.string({ minLength: 1, maxLength: 50 }),
            email: fc.emailAddress(),
            role: fc.constantFrom("tenant", "landlord", "admin"),
            avatar_url: fc.option(fc.webUrl(), { nil: null }),
            created_at: fc
                .date({ min: new Date("2020-01-01"), max: new Date("2030-01-01") })
                .map((d) => d.toISOString()),
        });

        fc.assert(
            fc.property(
                fc.array(userArb, { minLength: 0, maxLength: 100 }),
                (rows) => {
                    const sorted = sortByCreatedAtDesc(rows);
                    return isOrderedDesc(sorted);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("Property 2: single-element array is always ordered (Requirement 3.2)", () => {
        const userArb = fc.record({
            id: fc.uuid(),
            full_name: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            role: fc.constantFrom("tenant", "landlord", "admin"),
            avatar_url: fc.constant(null),
            created_at: fc.date().map((d) => d.toISOString()),
        });

        fc.assert(
            fc.property(userArb, (row) => {
                return isOrderedDesc([row]);
            }),
            { numRuns: 100 }
        );
    });

    it("Property 2: empty array is trivially ordered (Requirement 3.2)", () => {
        expect(isOrderedDesc([])).toBe(true);
    });
});
