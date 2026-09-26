import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRequireAuthenticatedUser = vi.fn();
const mockAdminFrom = vi.fn();
const mockListUsers = vi.fn();
const mockCreateUser = vi.fn();

vi.mock("@/lib/api/auth-guard", () => ({
    requireAuthenticatedUser: (...args: unknown[]) => mockRequireAuthenticatedUser(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: () => ({
        auth: {
            admin: {
                listUsers: mockListUsers,
                createUser: mockCreateUser,
            },
        },
        from: mockAdminFrom,
    }),
    createServiceRoleSupabaseClient: () => ({
        auth: {
            admin: {
                listUsers: mockListUsers,
                createUser: mockCreateUser,
            },
        },
        from: mockAdminFrom,
    }),
}));

import { POST } from "../../app/api/landlord/tenants/manual/route";

describe("Manual Tenant Onboarding API (/api/landlord/tenants/manual)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRequireAuthenticatedUser.mockResolvedValue({
            userId: "landlord-123",
            userRole: "landlord",
        });
        mockListUsers.mockResolvedValue({ data: { users: [] }, error: null });
        mockCreateUser.mockResolvedValue({
            data: { user: { id: "new-tenant-id" } },
            error: null,
        });
    });

    it("rejects request if end date is earlier than or equal to start date", async () => {
        const req = new Request("http://localhost:3000/api/landlord/tenants/manual", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Lyle Cannon",
                email: "lyle@example.com",
                phone: "09123456789",
                propertyId: "prop-1",
                unitId: "unit-1",
                startDate: "2026-10-09",
                endDate: "2026-07-31", // before start date!
                monthlyRent: 20000,
                securityDeposit: 20000,
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe("Lease end date must be after start date.");
    });

    it("rejects request if dates have invalid year (e.g., year 0019)", async () => {
        const req = new Request("http://localhost:3000/api/landlord/tenants/manual", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Lyle Cannon",
                email: "lyle@example.com",
                phone: "09123456789",
                propertyId: "prop-1",
                unitId: "unit-1",
                startDate: "0019-10-09",
                endDate: "0019-11-09",
                monthlyRent: 20000,
                securityDeposit: 20000,
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe("Dates must include a valid 4-digit year (e.g., 2026).");
    });

    it("rejects request with invalid email format", async () => {
        const req = new Request("http://localhost:3000/api/landlord/tenants/manual", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Lyle Cannon",
                email: "not-an-email",
                phone: "09123456789",
                propertyId: "prop-1",
                unitId: "unit-1",
                startDate: "2026-10-09",
                endDate: "2027-10-09",
                monthlyRent: 20000,
                securityDeposit: 20000,
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe("Please enter a valid email address.");
    });

    it("successfully creates lease and upfront payment records when advance is collected", async () => {
        const mockInsertPayment = vi.fn().mockResolvedValue({ error: null });
        const mockInsertLease = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                    data: { id: "lease-999" },
                    error: null,
                }),
            }),
        });
        const mockUpdateUnit = vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
        });

        mockAdminFrom.mockImplementation((table: string) => {
            if (table === "units") {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            maybeSingle: vi.fn().mockResolvedValue({
                                data: {
                                    id: "unit-1",
                                    property_id: "prop-1",
                                    properties: { landlord_id: "landlord-123" },
                                },
                                error: null,
                            }),
                        }),
                    }),
                    update: mockUpdateUnit,
                };
            }
            if (table === "profiles") {
                return {
                    select: vi.fn().mockReturnValue({
                        ilike: vi.fn().mockReturnValue({
                            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                        }),
                    }),
                    upsert: vi.fn().mockResolvedValue({ error: null }),
                };
            }
            if (table === "leases") {
                return {
                    insert: mockInsertLease,
                };
            }
            if (table === "payments") {
                return {
                    insert: mockInsertPayment,
                };
            }
            return {};
        });

        const req = new Request("http://localhost:3000/api/landlord/tenants/manual", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Lyle Cannon",
                email: "lyle@example.com",
                phone: "09123456789",
                propertyId: "prop-1",
                unitId: "unit-1",
                startDate: "2026-10-09",
                endDate: "2027-10-09",
                monthlyRent: 20000,
                securityDeposit: 20000,
                advancePayment: 20000,
                advanceMonths: 1,
                advancePaid: true,
                securityDepositPaid: true,
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.leaseId).toBe("lease-999");
        expect(mockInsertPayment).toHaveBeenCalledTimes(2); // advance rent + security deposit
    });

    it("rejects request if full name contains digits", async () => {
        const req = new Request("http://localhost:3000/api/landlord/tenants/manual", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Lyle Cannon 123",
                email: "lyle@example.com",
                phone: "09123456789",
                propertyId: "prop-1",
                unitId: "unit-1",
                startDate: "2026-10-09",
                endDate: "2027-10-09",
                monthlyRent: 20000,
                securityDeposit: 20000,
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe("Resident full name cannot contain numbers.");
    });
});
