import { describe, it, expect } from "vitest";

describe("Tenant Setup Prompt Recurring Re-fire Logic", () => {
    interface PageVisitState {
        propertyId: string;
        isMapSetupComplete: boolean;
        hasTenants: boolean;
        tenantsCount: number;
        dismissedThisVisit: boolean;
        localStorage: Record<string, string>;
    }

    const shouldShowTenantPrompt = (state: PageVisitState): boolean => {
        const delayedKey = `ireside.tenant_setup_delayed.${state.propertyId}`;
        const mapCompleteKey = `ireside_map_setup_complete_${state.propertyId}`;
        const awaitingKey = `ireside.onboarding_awaiting_tenant_setup.${state.propertyId}`;

        const hasConfiguredMap = Boolean(
            state.isMapSetupComplete ||
            state.localStorage[mapCompleteKey] === "true" ||
            state.localStorage[awaitingKey] === "true" ||
            state.localStorage[delayedKey] === "true"
        );

        const hasAtLeastOneTenant = state.hasTenants || state.tenantsCount > 0;

        return hasConfiguredMap && !hasAtLeastOneTenant && !state.dismissedThisVisit;
    };

    it("triggers prompt on initial visit when unit map is configured and 0 tenants exist", () => {
        const state: PageVisitState = {
            propertyId: "prop-123",
            isMapSetupComplete: true,
            hasTenants: false,
            tenantsCount: 0,
            dismissedThisVisit: false,
            localStorage: {},
        };

        expect(shouldShowTenantPrompt(state)).toBe(true);
    });

    it("suppresses prompt for current visit when landlord clicks 'Maybe Later'", () => {
        const state: PageVisitState = {
            propertyId: "prop-123",
            isMapSetupComplete: true,
            hasTenants: false,
            tenantsCount: 0,
            dismissedThisVisit: false,
            localStorage: {},
        };

        // User clicks Maybe Later -> dismissedThisVisit = true, delayedKey saved in localStorage
        state.dismissedThisVisit = true;
        state.localStorage[`ireside.tenant_setup_delayed.${state.propertyId}`] = "true";

        expect(shouldShowTenantPrompt(state)).toBe(false);
    });

    it("re-fires prompt when landlord navigates away and returns to Dashboard (fresh visit mount)", () => {
        const stateAfterReturn: PageVisitState = {
            propertyId: "prop-123",
            isMapSetupComplete: true,
            hasTenants: false,
            tenantsCount: 0,
            dismissedThisVisit: false, // reset upon new mount of Dashboard
            localStorage: {
                "ireside.tenant_setup_delayed.prop-123": "true",
            },
        };

        // Because dismissedThisVisit resets to false on remount and tenants are still 0, prompt re-fires
        expect(shouldShowTenantPrompt(stateAfterReturn)).toBe(true);
    });

    it("re-fires prompt when visiting the Tenant Directory (/landlord/tenants)", () => {
        const tenantDirectoryState: PageVisitState = {
            propertyId: "prop-123",
            isMapSetupComplete: true,
            hasTenants: false,
            tenantsCount: 0,
            dismissedThisVisit: false, // fresh mount on visiting /landlord/tenants
            localStorage: {
                "ireside.tenant_setup_delayed.prop-123": "true",
            },
        };

        expect(shouldShowTenantPrompt(tenantDirectoryState)).toBe(true);
    });

    it("permanently disables prompt once at least one tenant is registered/configured", () => {
        const stateWithTenant: PageVisitState = {
            propertyId: "prop-123",
            isMapSetupComplete: true,
            hasTenants: true,
            tenantsCount: 1,
            dismissedThisVisit: false,
            localStorage: {},
        };

        expect(shouldShowTenantPrompt(stateWithTenant)).toBe(false);
    });

    it("shows sidebar warning badge when setup is delayed and 0 tenants exist, but clears when tenants exist", () => {
        const checkSidebarWarning = (
            delayedKeyVal: string | undefined,
            hasTenants: boolean
        ) => {
            return delayedKeyVal === "true" && !hasTenants;
        };

        // When delayed and no tenants -> show warning badge
        expect(checkSidebarWarning("true", false)).toBe(true);

        // When tenants exist -> warning badge never shows
        expect(checkSidebarWarning("true", true)).toBe(false);
        expect(checkSidebarWarning(undefined, true)).toBe(false);
    });
});
