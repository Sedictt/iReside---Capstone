import { describe, expect, it } from "vitest";
import {
    DEFAULT_CHECKLIST,
    DEFAULT_EMPLOYMENT,
    validateFormStep,
    isUnitOccupied,
    isUnitOngoing,
    isUnitAvailable,
    getUnitOptionLabel,
    type WalkInFormData,
} from "./application-intake";

function buildForm(overrides: Partial<WalkInFormData> = {}): WalkInFormData {
    return {
        applicant_name: "Maria Dela Cruz",
        applicant_phone: "+639171234567",
        applicant_email: "maria@example.com",
        move_in_date: "2026-05-01",
        emergency_contact_name: "Juan Dela Cruz",
        emergency_contact_phone: "+639181112222",
        employment_info: {
            ...DEFAULT_EMPLOYMENT,
            occupation: "Engineer",
            employer: "Stark Industries",
            monthly_income: 45000,
        },
        requirements_checklist: { ...DEFAULT_CHECKLIST },
        message: "",
        ...overrides,
    };
}

describe("validateFormStep", () => {
    it("requires unit selection when configured", () => {
        const errors = validateFormStep(0, "", buildForm(), { requireUnit: true });
        expect(errors.unit).toBeTruthy();
    });

    it("allows missing unit when the caller disables the unit requirement", () => {
        const errors = validateFormStep(0, "", buildForm(), { requireUnit: false });
        expect(errors.unit).toBeUndefined();
    });

    it("rejects invalid income data on employment step", () => {
        const errors = validateFormStep(1, "unit-1", buildForm({
            employment_info: {
                occupation: "Engineer",
                employer: "Stark Industries",
                monthly_income: 0,
            },
        }));
        expect(errors.monthly_income).toBeTruthy();
    });
});

describe("unit availability and labeling helpers", () => {
    const availableUnit = {
        id: "u-1",
        name: "Villa 101",
        rent_amount: 15000,
        property_id: "p-1",
        property_name: "Skyline Lofts",
        status: "vacant",
    };

    const occupiedUnit = {
        id: "u-2",
        name: "Villa 102",
        rent_amount: 18000,
        property_id: "p-1",
        property_name: "Skyline Lofts",
        status: "occupied",
    };

    const ongoingFlagUnit = {
        id: "u-3",
        name: "Villa 103",
        rent_amount: 20000,
        property_id: "p-1",
        property_name: "Skyline Lofts",
        status: "vacant",
        has_ongoing_application: true,
    };

    const underNegotiationUnit = {
        id: "u-4",
        name: "Villa 104",
        rent_amount: 22000,
        property_id: "p-1",
        property_name: "Skyline Lofts",
        status: "under_negotiation",
    };

    it("correctly identifies occupied units", () => {
        expect(isUnitOccupied(availableUnit)).toBe(false);
        expect(isUnitOccupied(occupiedUnit)).toBe(true);
        expect(isUnitOccupied(ongoingFlagUnit)).toBe(false);
    });

    it("correctly identifies units that are ongoing or under negotiation", () => {
        expect(isUnitOngoing(availableUnit)).toBe(false);
        expect(isUnitOngoing(occupiedUnit)).toBe(false);
        expect(isUnitOngoing(ongoingFlagUnit)).toBe(true);
        expect(isUnitOngoing(underNegotiationUnit)).toBe(true);
        expect(isUnitOngoing({ ...availableUnit, application_status: "reviewing" })).toBe(true);
    });

    it("correctly determines available units", () => {
        expect(isUnitAvailable(availableUnit)).toBe(true);
        expect(isUnitAvailable(occupiedUnit)).toBe(false);
        expect(isUnitAvailable(ongoingFlagUnit)).toBe(false);
        expect(isUnitAvailable(underNegotiationUnit)).toBe(false);
    });

    it("generates correct option labels with (On-going — Unavailable) and (Occupied — Unavailable)", () => {
        expect(getUnitOptionLabel(availableUnit)).toBe("Villa 101 — ₱15,000/mo");
        expect(getUnitOptionLabel(availableUnit, true)).toBe("Villa 101 — Skyline Lofts — ₱15,000/mo");

        expect(getUnitOptionLabel(occupiedUnit)).toBe("Villa 102 • (Occupied — Unavailable)");
        expect(getUnitOptionLabel(occupiedUnit, true)).toBe("Villa 102 — Skyline Lofts • (Occupied — Unavailable)");

        expect(getUnitOptionLabel(ongoingFlagUnit)).toBe("Villa 103 • (On-going — Unavailable)");
        expect(getUnitOptionLabel(ongoingFlagUnit, true)).toBe("Villa 103 — Skyline Lofts • (On-going — Unavailable)");

        expect(getUnitOptionLabel(underNegotiationUnit)).toBe("Villa 104 • (On-going — Unavailable)");
        expect(getUnitOptionLabel(underNegotiationUnit, true)).toBe("Villa 104 — Skyline Lofts • (On-going — Unavailable)");
    });
});
