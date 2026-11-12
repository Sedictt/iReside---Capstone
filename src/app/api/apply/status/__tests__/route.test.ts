import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import {
    generateApplicationStatusToken,
    generateRoomOfferToken,
} from "@/lib/jwt";

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
    createServiceRoleSupabaseClient: () => ({
        from: mockFrom,
    }),
}));

function makeQueryChain(result: { data: unknown; error: unknown }) {
    const chain: Record<string, unknown> = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue(result),
        then: (resolve: (val: unknown) => void) => Promise.resolve(result).then(resolve),
    };
    return chain;
}

describe("GET /api/apply/status", () => {
    beforeAll(() => {
        if (!process.env.JWT_SECRET) {
            process.env.JWT_SECRET = "test-secret-key-for-jwt-signing";
        }
    });

    beforeEach(() => {
        vi.clearAllMocks();
        mockFrom.mockReset();
    });

    it("returns 400 when token is missing and sets Cache-Control: no-store", async () => {
        const { GET } = await import("../route");
        const res = await GET(new Request("http://localhost/api/apply/status"));

        expect(res.status).toBe(400);
        expect(res.headers.get("cache-control")).toBe("no-store");
    });

    it("returns 401 for an invalid or wrong-type token", async () => {
        const { GET } = await import("../route");
        const wrongToken = generateRoomOfferToken("app-1", "unit-1");
        const res = await GET(
            new Request(`http://localhost/api/apply/status?token=${encodeURIComponent(wrongToken)}`)
        );

        expect(res.status).toBe(401);
        expect(res.headers.get("cache-control")).toBe("no-store");
    });

    it("returns 401 for an expired token", async () => {
        const jwt = require("jsonwebtoken");
        const expiredToken = jwt.sign(
            { applicationId: "app-123", type: "application_status" },
            process.env.JWT_SECRET,
            { expiresIn: "-5s" }
        );

        const { GET } = await import("../route");
        const res = await GET(
            new Request(`http://localhost/api/apply/status?token=${encodeURIComponent(expiredToken)}`)
        );

        expect(res.status).toBe(401);
        expect(res.headers.get("cache-control")).toBe("no-store");
    });

    it("returns 404 when application does not exist without exposing DB errors", async () => {
        mockFrom.mockImplementation((table: string) => {
            if (table === "applications") {
                return makeQueryChain({
                    data: null,
                    error: { message: "postgres relation error detail" },
                });
            }
            return makeQueryChain({ data: null, error: null });
        });

        const token = generateApplicationStatusToken("11111111-1111-4111-8111-111111111111");
        const { GET } = await import("../route");
        const res = await GET(
            new Request(`http://localhost/api/apply/status?token=${encodeURIComponent(token)}`)
        );
        const body = await res.json();

        expect(res.status).toBe(404);
        expect(res.headers.get("cache-control")).toBe("no-store");
        expect(body.error).toBe("Application not found.");
        expect(JSON.stringify(body)).not.toContain("postgres");
    });

    it("returns sanitized status payload with zero PII fields", async () => {
        const appId = "abcdef12-3456-4789-abcd-1234567890ab";

        mockFrom.mockImplementation((table: string) => {
            if (table === "applications") {
                return makeQueryChain({
                    data: {
                        id: appId,
                        unit_id: "unit-1",
                        status: "reviewing",
                        created_at: "2026-11-10T08:00:00.000Z",
                        updated_at: "2026-11-11T10:00:00.000Z",
                        // Even if extra PII fields were hypothetically returned by mock, route must omit them
                        applicant_email: "secret@example.com",
                        applicant_phone: "09171234567",
                        applicant_name: "Maria Santos",
                        emergency_contact_name: "Jose Santos",
                        emergency_contact_phone: "09181234567",
                        employment_info: { employer: "Acme Corp", monthly_income: 50000 },
                        monthly_income: 50000,
                        documents: ["https://storage.example/id.png"],
                        landlord_id: "landlord-999",
                        message: "Internal note",
                        requirements_checklist: {
                            valid_id: true,
                            pending_unit_offer: {
                                target_unit_id: "unit-2",
                                target_unit_name: "Room 202",
                                landlord_note: "Private note from landlord",
                                status: "pending",
                            },
                        },
                    },
                    error: null,
                });
            }
            if (table === "units") {
                return makeQueryChain({
                    data: { id: "unit-1", name: "Room 101", property_id: "prop-1" },
                    error: null,
                });
            }
            if (table === "properties") {
                return makeQueryChain({
                    data: {
                        id: "prop-1",
                        name: "Sunrise Residences",
                        contract_template: {
                            unit_holds: {
                                "unit-1": {
                                    held_for_name: "Other Applicant",
                                    held_by_application_id: "other-app-id",
                                    hold_expires_at: "2099-01-01T00:00:00.000Z",
                                    hold_note: "Secret hold note",
                                },
                            },
                        },
                    },
                    error: null,
                });
            }
            return makeQueryChain({ data: null, error: null });
        });

        const token = generateApplicationStatusToken(appId);
        const { GET } = await import("../route");
        const res = await GET(
            new Request(`http://localhost/api/apply/status?token=${encodeURIComponent(token)}`)
        );
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(res.headers.get("cache-control")).toBe("no-store");
        expect(body).toEqual({
            referenceCode: "ABCDEF12",
            propertyName: "Sunrise Residences",
            unitName: "Room 101",
            status: "reviewing",
            appliedAt: "2026-11-10T08:00:00.000Z",
            updatedAt: "2026-11-11T10:00:00.000Z",
            paymentStage: null,
            unitOnHold: true,
            roomOffer: {
                status: "pending",
                offeredUnitName: "Room 202",
            },
        });

        // Strict zero-PII assertions
        const serialized = JSON.stringify(body);
        expect(body).not.toHaveProperty("applicant_email");
        expect(body).not.toHaveProperty("applicant_phone");
        expect(body).not.toHaveProperty("applicant_name");
        expect(body).not.toHaveProperty("emergency_contact_name");
        expect(body).not.toHaveProperty("emergency_contact_phone");
        expect(body).not.toHaveProperty("employment_info");
        expect(body).not.toHaveProperty("monthly_income");
        expect(body).not.toHaveProperty("documents");
        expect(serialized).not.toContain("secret@example.com");
        expect(serialized).not.toContain("09171234567");
        expect(serialized).not.toContain("Maria Santos");
        expect(serialized).not.toContain("Other Applicant");
        expect(serialized).not.toContain("Private note from landlord");
        expect(serialized).not.toContain("Secret hold note");
    });

    it("distinguishes awaiting payment upload vs awaiting landlord verification", async () => {
        const appId = "12345678-0000-4000-8000-000000000000";

        let paymentRows: Array<{ requirement_type: string; status: string }> = [
            { requirement_type: "advance_rent", status: "pending" },
            { requirement_type: "security_deposit", status: "pending" },
        ];

        mockFrom.mockImplementation((table: string) => {
            if (table === "applications") {
                return makeQueryChain({
                    data: {
                        id: appId,
                        unit_id: "unit-1",
                        status: "payment_pending",
                        created_at: "2026-11-10T08:00:00.000Z",
                        updated_at: "2026-11-11T10:00:00.000Z",
                        requirements_checklist: null,
                    },
                    error: null,
                });
            }
            if (table === "units") {
                return makeQueryChain({
                    data: { id: "unit-1", name: "Room 101", property_id: "prop-1" },
                    error: null,
                });
            }
            if (table === "properties") {
                return makeQueryChain({
                    data: { id: "prop-1", name: "Sunrise Residences", contract_template: null },
                    error: null,
                });
            }
            if (table === "application_payment_requests") {
                return makeQueryChain({ data: paymentRows, error: null });
            }
            return makeQueryChain({ data: null, error: null });
        });

        const token = generateApplicationStatusToken(appId);
        const { GET } = await import("../route");

        const uploadRes = await GET(
            new Request(`http://localhost/api/apply/status?token=${encodeURIComponent(token)}`)
        );
        expect((await uploadRes.json()).paymentStage).toBe("awaiting_upload");

        paymentRows = [
            { requirement_type: "advance_rent", status: "processing" },
            { requirement_type: "security_deposit", status: "processing" },
        ];
        const verifyRes = await GET(
            new Request(`http://localhost/api/apply/status?token=${encodeURIComponent(token)}`)
        );
        expect((await verifyRes.json()).paymentStage).toBe("awaiting_verification");

        paymentRows = [
            { requirement_type: "advance_rent", status: "rejected" },
            { requirement_type: "security_deposit", status: "processing" },
        ];
        const actionRes = await GET(
            new Request(`http://localhost/api/apply/status?token=${encodeURIComponent(token)}`)
        );
        expect((await actionRes.json()).paymentStage).toBe("action_needed");
    });
});
