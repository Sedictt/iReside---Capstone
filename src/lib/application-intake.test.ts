import { describe, expect, it } from "vitest";
import { DEFAULT_CHECKLIST, DEFAULT_EMPLOYMENT, validateFormStep, type WalkInFormData } from "./application-intake";

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
