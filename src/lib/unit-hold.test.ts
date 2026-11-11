import { describe, expect, it } from "vitest";
import {
    resolveHoldExpiryIso,
    isHoldExpired,
    parseUnitHoldMapFromTemplate,
    getActiveUnitHold,
    setUnitHoldInTemplate,
} from "./unit-hold";

describe("unit-hold utility functions", () => {
    const baseDate = new Date("2026-05-01T12:00:00Z");

    describe("resolveHoldExpiryIso", () => {
        it("returns 24 hours in the future for '24h'", () => {
            const result = resolveHoldExpiryIso("24h", baseDate);
            expect(result).toBe("2026-05-02T12:00:00.000Z");
        });

        it("returns 48 hours in the future for '48h'", () => {
            const result = resolveHoldExpiryIso("48h", baseDate);
            expect(result).toBe("2026-05-03T12:00:00.000Z");
        });

        it("returns 72 hours in the future for '72h'", () => {
            const result = resolveHoldExpiryIso("72h", baseDate);
            expect(result).toBe("2026-05-04T12:00:00.000Z");
        });

        it("returns null for 'manual'", () => {
            const result = resolveHoldExpiryIso("manual", baseDate);
            expect(result).toBeNull();
        });
    });

    describe("isHoldExpired", () => {
        it("returns true if hold is null or undefined", () => {
            expect(isHoldExpired(null)).toBe(true);
            expect(isHoldExpired(undefined)).toBe(true);
        });

        it("returns false if hold has no expiration (manual hold)", () => {
            expect(isHoldExpired({ held_for_name: "John Doe", hold_expires_at: null }, baseDate)).toBe(false);
        });

        it("returns false if expiration is in the future", () => {
            expect(
                isHoldExpired(
                    { held_for_name: "John Doe", hold_expires_at: "2026-05-02T12:00:00Z" },
                    baseDate
                )
            ).toBe(false);
        });

        it("returns true if expiration is in the past or now", () => {
            expect(
                isHoldExpired(
                    { held_for_name: "John Doe", hold_expires_at: "2026-05-01T11:59:59Z" },
                    baseDate
                )
            ).toBe(true);
            expect(
                isHoldExpired(
                    { held_for_name: "John Doe", hold_expires_at: "2026-05-01T12:00:00Z" },
                    baseDate
                )
            ).toBe(true);
        });
    });

    describe("parseUnitHoldMapFromTemplate & getActiveUnitHold", () => {
        it("handles null or malformed contractTemplate gracefully", () => {
            expect(parseUnitHoldMapFromTemplate(null)).toEqual({});
            expect(parseUnitHoldMapFromTemplate(undefined)).toEqual({});
            expect(parseUnitHoldMapFromTemplate("invalid")).toEqual({});
            expect(parseUnitHoldMapFromTemplate([])).toEqual({});
            expect(parseUnitHoldMapFromTemplate({})).toEqual({});
        });

        it("filters out expired holds automatically", () => {
            const template = {
                unit_holds: {
                    "u-active": {
                        held_for_name: "Maria Dela Cruz",
                        hold_expires_at: "2026-05-02T12:00:00Z",
                        hold_note: "Waiting for GCash",
                    },
                    "u-manual": {
                        held_for_name: "Pedro Penduko",
                        hold_expires_at: null,
                    },
                    "u-expired": {
                        held_for_name: "Juan Tamad",
                        hold_expires_at: "2026-05-01T10:00:00Z",
                    },
                },
            };

            const parsed = parseUnitHoldMapFromTemplate(template, baseDate);
            expect(parsed["u-active"]?.held_for_name).toBe("Maria Dela Cruz");
            expect(parsed["u-manual"]?.held_for_name).toBe("Pedro Penduko");
            expect(parsed["u-expired"]).toBeUndefined();

            expect(getActiveUnitHold(template, "u-active", baseDate)?.held_for_name).toBe("Maria Dela Cruz");
            expect(getActiveUnitHold(template, "u-expired", baseDate)).toBeNull();
            expect(getActiveUnitHold(template, "u-unknown", baseDate)).toBeNull();
        });
    });

    describe("setUnitHoldInTemplate", () => {
        it("adds a new hold without destroying other contract_template fields", () => {
            const template = {
                house_rules: ["No smoking"],
                unit_holds: {},
            };

            const updated = setUnitHoldInTemplate(
                template,
                "u-1",
                {
                    held_for_name: "Alice",
                    held_by_application_id: "app-1",
                    hold_expires_at: "2026-05-02T12:00:00Z",
                    hold_note: "Hold for 24h",
                },
                baseDate
            );

            expect(updated.house_rules).toEqual(["No smoking"]);
            const holds = updated.unit_holds as Record<string, any>;
            expect(holds["u-1"]?.held_for_name).toBe("Alice");
            expect(holds["u-1"]?.held_by_application_id).toBe("app-1");
        });

        it("clears a hold when null is passed", () => {
            const template = {
                unit_holds: {
                    "u-1": {
                        held_for_name: "Alice",
                        hold_expires_at: "2026-05-02T12:00:00Z",
                    },
                    "u-2": {
                        held_for_name: "Bob",
                        hold_expires_at: "2026-05-02T12:00:00Z",
                    },
                },
            };

            const updated = setUnitHoldInTemplate(template, "u-1", null, baseDate);
            const holds = updated.unit_holds as Record<string, any>;
            expect(holds["u-1"]).toBeUndefined();
            expect(holds["u-2"]?.held_for_name).toBe("Bob");
        });
    });
});
