import { describe, expect, it } from "vitest";
import {
    unitHoldSchema,
    reassignApplicationUnitSchema,
    HOLD_DURATION_PRESETS,
} from "@/lib/validation/schemas/tenant-lifecycle.schema";

const VALID_UUID = "11111111-2222-3333-4444-555555555555";
const VALID_UUID_2 = "99999999-8888-7777-6666-555555555555";

describe("unitHoldSchema validation", () => {
    it("accepts valid hold payload with defaults", () => {
        const parsed = unitHoldSchema.parse({
            held_for_name: "Juan Luna",
        });
        expect(parsed.held_for_name).toBe("Juan Luna");
        expect(parsed.duration_preset).toBe("48h");
        expect(parsed.notify_other_applicants).toBe(false);
        expect(parsed.hold_note).toBeNull();
    });

    it("accepts all duration presets", () => {
        for (const preset of HOLD_DURATION_PRESETS) {
            const parsed = unitHoldSchema.parse({
                held_for_name: "Maria Santos",
                duration_preset: preset,
            });
            expect(parsed.duration_preset).toBe(preset);
        }
    });

    it("accepts an optional application ID and hold note", () => {
        const parsed = unitHoldSchema.parse({
            held_for_name: "Maria Santos",
            held_by_application_id: VALID_UUID,
            duration_preset: "24h",
            hold_note: "Applicant requested 24 hours to secure security deposit via BDO transfer.",
            notify_other_applicants: true,
        });
        expect(parsed.held_by_application_id).toBe(VALID_UUID);
        expect(parsed.hold_note).toContain("Applicant requested");
        expect(parsed.notify_other_applicants).toBe(true);
    });

    it("rejects short or empty applicant name", () => {
        expect(() => unitHoldSchema.parse({ held_for_name: "" })).toThrow();
        expect(() => unitHoldSchema.parse({ held_for_name: "A" })).toThrow(/at least 2 characters/);
    });

    it("rejects names longer than 50 characters", () => {
        expect(() =>
            unitHoldSchema.parse({ held_for_name: "A".repeat(51) })
        ).toThrow(/cannot exceed 50 characters/);
    });

    it("rejects notes longer than 250 characters", () => {
        expect(() =>
            unitHoldSchema.parse({
                held_for_name: "Maria Santos",
                hold_note: "N".repeat(251),
            })
        ).toThrow();
    });

    it("rejects invalid duration presets", () => {
        expect(() =>
            unitHoldSchema.parse({
                held_for_name: "Maria Santos",
                duration_preset: "1year",
            })
        ).toThrow();
    });
});

describe("reassignApplicationUnitSchema validation", () => {
    it("accepts a valid target unit id", () => {
        const parsed = reassignApplicationUnitSchema.parse({
            target_unit_id: VALID_UUID_2,
        });
        expect(parsed.target_unit_id).toBe(VALID_UUID_2);
        expect(parsed.notify_applicant).toBe(true);
        expect(parsed.landlord_note).toBeNull();
    });

    it("accepts custom landlord note and notification toggle", () => {
        const parsed = reassignApplicationUnitSchema.parse({
            target_unit_id: VALID_UUID_2,
            landlord_note: "We would love to welcome you in Unit 202 instead!",
            notify_applicant: false,
        });
        expect(parsed.target_unit_id).toBe(VALID_UUID_2);
        expect(parsed.landlord_note).toBe("We would love to welcome you in Unit 202 instead!");
        expect(parsed.notify_applicant).toBe(false);
    });

    it("rejects invalid UUID for target_unit_id", () => {
        expect(() =>
            reassignApplicationUnitSchema.parse({
                target_unit_id: "not-a-uuid",
            })
        ).toThrow();
    });

    it("rejects landlord notes longer than 250 characters", () => {
        expect(() =>
            reassignApplicationUnitSchema.parse({
                target_unit_id: VALID_UUID_2,
                landlord_note: "X".repeat(251),
            })
        ).toThrow();
    });
});
