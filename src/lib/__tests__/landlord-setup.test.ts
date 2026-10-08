import { describe, it, expect } from "vitest";
import {
    EMPTY_LOCAL_HINTS,
    resolveLandlordSetup,
    type LandlordSetupInput,
    type LandlordSetupSignals,
} from "@/lib/landlord-setup";

const noSignals: LandlordSetupSignals = {
    hasPaymentDestination: false,
    utilityRatePropertyIds: [],
    billingDeferredAt: null,
    tenantDeferredAt: null,
    dashboardTourDone: false,
};

const property = (overrides: Partial<LandlordSetupInput["properties"][number]> = {}) => ({
    id: "prop-1",
    isMapSetupComplete: false,
    placedCount: 0,
    hasTenants: false,
    units: [{ status: "vacant" }],
    ...overrides,
});

const resolve = (overrides: Partial<LandlordSetupInput> = {}) =>
    resolveLandlordSetup({
        status: "ready",
        isLandlord: true,
        properties: [],
        signals: noSignals,
        hints: EMPTY_LOCAL_HINTS,
        ...overrides,
    });

describe("resolveLandlordSetup", () => {
    it("never prompts or locks while data is loading", () => {
        const state = resolve({ status: "loading", properties: [] });
        expect(state.status).toBe("loading");
        expect(state.promptStep).toBeNull();
        expect(state.lockStage).toBeNull();
    });

    it("never treats a failed property request as 'no property'", () => {
        const state = resolve({ status: "error", properties: [] });
        expect(state.status).toBe("error");
        expect(state.promptStep).toBeNull();
        expect(state.lockStage).toBeNull();
    });

    it("does not apply landlord onboarding to non-landlord accounts", () => {
        const state = resolve({ isLandlord: false, properties: [] });
        expect(state.status).toBe("not_applicable");
        expect(state.promptStep).toBeNull();
        expect(state.lockStage).toBeNull();
    });

    it("asks a new landlord with no properties to register one", () => {
        const state = resolve({ properties: [] });
        expect(state.promptStep).toBe("property");
        expect(state.lockStage).toBe("no_property");
    });

    it("skips property setup when a property exists and moves to the unit map", () => {
        const state = resolve({ properties: [property()] });
        expect(state.steps[0].complete).toBe(true);
        expect(state.promptStep).toBe("unit_map");
        expect(state.lockStage).toBe("no_unit_map");
    });

    it("recognises billing configured in the database (another device / after re-login)", () => {
        const state = resolve({
            properties: [property({ isMapSetupComplete: true, placedCount: 3 })],
            signals: { ...noSignals, hasPaymentDestination: true },
        });
        expect(state.steps.find((s) => s.id === "billing")?.complete).toBe(true);
        expect(state.promptStep).toBe("first_tenant");
        expect(state.lockStage).toBe("no_tenant");
    });

    it("counts utility rates only for the landlord's current properties", () => {
        const base = { properties: [property({ placedCount: 2 })] };
        expect(
            resolve({ ...base, signals: { ...noSignals, utilityRatePropertyIds: ["deleted-prop"] } }).promptStep
        ).toBe("billing");
        expect(
            resolve({ ...base, signals: { ...noSignals, utilityRatePropertyIds: ["prop-1"] } }).promptStep
        ).toBe("first_tenant");
    });

    it("does not prompt for billing when billing evidence is unavailable", () => {
        const state = resolve({ properties: [property({ placedCount: 2 })], signals: null });
        expect(state.steps.find((s) => s.id === "billing")?.complete).toBeNull();
        expect(state.promptStep).toBeNull();
        expect(state.lockStage).toBeNull();
    });

    it("a persisted billing deferral stops the prompt and the billing lock but keeps the step next", () => {
        const state = resolve({
            properties: [property({ placedCount: 2 })],
            signals: { ...noSignals, billingDeferredAt: "2026-10-01T00:00:00Z" },
        });
        expect(state.nextStep).toBe("billing");
        expect(state.steps.find((s) => s.id === "billing")?.deferred).toBe(true);
        expect(state.hasConfiguredBilling).toBe(true);
        expect(state.promptStep).toBe("first_tenant");
        expect(state.lockStage).toBe("no_tenant");
    });

    it("a persisted tenant deferral stops the prompt and unlocks navigation, keeping the step next", () => {
        const state = resolve({
            properties: [property({ placedCount: 2 })],
            signals: { ...noSignals, hasPaymentDestination: true, tenantDeferredAt: "2026-10-01T00:00:00Z" },
        });
        expect(state.nextStep).toBe("first_tenant");
        expect(state.promptStep).toBeNull();
        expect(state.lockStage).toBeNull();
        expect(state.isComplete).toBe(false);
    });

    it("unlocks everything when both billing and tenant steps are postponed", () => {
        const state = resolve({
            properties: [property({ placedCount: 2 })],
            signals: {
                ...noSignals,
                billingDeferredAt: "2026-10-01T00:00:00Z",
                tenantDeferredAt: "2026-10-02T00:00:00Z",
            },
        });
        expect(state.nextStep).toBe("billing");
        expect(state.promptStep).toBeNull();
        expect(state.lockStage).toBeNull();
    });

    it("a billing deferral never counts as billing completion", () => {
        const state = resolve({
            properties: [property({ placedCount: 2 })],
            signals: { ...noSignals, billingDeferredAt: "2026-10-01T00:00:00Z" },
        });
        expect(state.steps.find((s) => s.id === "billing")?.complete).toBe(false);
        expect(state.isComplete).toBe(false);
    });

    it("treats a landlord with tenants as fully set up, even with no billing records", () => {
        const state = resolve({
            properties: [property({ hasTenants: true }), property({ id: "prop-2" })],
            signals: null,
        });
        expect(state.isComplete).toBe(true);
        expect(state.promptStep).toBeNull();
        expect(state.lockStage).toBeNull();
    });

    it("does not ask for a first property when several exist", () => {
        const state = resolve({
            properties: [property({ id: "a", placedCount: 1 }), property({ id: "b" })],
            signals: { ...noSignals, utilityRatePropertyIds: ["b"] },
        });
        expect(state.steps[0].complete).toBe(true);
        expect(state.steps[1].complete).toBe(true);
        expect(state.promptStep).toBe("first_tenant");
    });

    it("returns to property setup when the only property is deleted", () => {
        const state = resolve({ properties: [], signals: { ...noSignals, hasPaymentDestination: true } });
        expect(state.promptStep).toBe("property");
    });

    it("lets same-session hints complete a step sooner but never un-complete one", () => {
        const withHint = resolve({
            properties: [property()],
            hints: { ...EMPTY_LOCAL_HINTS, mapCompletePropertyIds: ["prop-1"], billingComplete: true },
        });
        expect(withHint.promptStep).toBe("first_tenant");

        const dbComplete = resolve({
            properties: [property({ placedCount: 4 })],
            hints: EMPTY_LOCAL_HINTS,
        });
        expect(dbComplete.steps.find((s) => s.id === "unit_map")?.complete).toBe(true);
    });

    it("counts occupied units as tenant evidence", () => {
        const state = resolve({ properties: [property({ units: [{ status: "Occupied" }] })] });
        expect(state.hasTenant).toBe(true);
        expect(state.isComplete).toBe(true);
    });
});
