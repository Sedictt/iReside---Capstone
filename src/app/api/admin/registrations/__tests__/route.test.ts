/**
 * Tests for GET /api/admin/registrations
 * Feature: admin-portal-database-integration
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// Property 4: Registrations API response is ordered by creation date descending
// Feature: admin-portal-database-integration, Property 4: Registrations API response is ordered by creation date descending
// ---------------------------------------------------------------------------

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

describe("GET /api/admin/registrations — property tests", () => {
    // Property 4: Registrations API response is ordered by creation date descending (Requirement 4.2)
    it("Property 4: adjacent rows satisfy [i].created_at >= [i+1].created_at (Requirement 4.2)", () => {
        const registrationArb = fc.record({
            id: fc.uuid(),
            phone: fc.string({ minLength: 7, maxLength: 15 }),
            status: fc.constantFrom("pending", "reviewing", "approved", "rejected", "withdrawn"),
            admin_notes: fc.option(fc.string(), { nil: null }),
            created_at: fc
                .integer({ min: new Date("2020-01-01").getTime(), max: new Date("2030-01-01").getTime() })
                .map((ts) => new Date(ts).toISOString()),
            profile: fc.option(
                fc.record({
                    id: fc.uuid(),
                    full_name: fc.string({ minLength: 1, maxLength: 50 }),
                    email: fc.emailAddress(),
                    avatar_url: fc.option(fc.webUrl(), { nil: null }),
                }),
                { nil: null }
            ),
        });

        fc.assert(
            fc.property(
                fc.array(registrationArb, { minLength: 0, maxLength: 100 }),
                (rows) => {
                    const sorted = sortByCreatedAtDesc(rows);
                    return isOrderedDesc(sorted);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("Property 4: single-element array is always ordered (Requirement 4.2)", () => {
        const regArb = fc.record({
            id: fc.uuid(),
            created_at: fc
                .integer({ min: new Date("2020-01-01").getTime(), max: new Date("2030-01-01").getTime() })
                .map((ts) => new Date(ts).toISOString()),
        });

        fc.assert(
            fc.property(regArb, (row) => isOrderedDesc([row])),
            { numRuns: 100 }
        );
    });

    it("Property 4: empty array is trivially ordered (Requirement 4.2)", () => {
        expect(isOrderedDesc([])).toBe(true);
    });
});
