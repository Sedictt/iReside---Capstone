/**
 * Landlord setup (onboarding) state resolver.
 *
 * Single source of truth for "what does this landlord still need to set up?".
 * Every onboarding surface (layout guard, sidebar lock, welcome / unit-map
 * lightboxes, dashboard prompts, utility-billing orientation) must derive its
 * behaviour from `resolveLandlordSetup` instead of re-computing stages.
 *
 * Principles:
 *  - Authoritative data (database records) decides completion.
 *  - Local browser hints may only mark a step complete *sooner* (optimistic,
 *    same-session); they can never make a step incomplete.
 *  - Unknown data (loading, failed request, missing profile) is never treated
 *    as "not set up". Unknown → no prompts and no navigation locks.
 *
 * @module lib/landlord-setup
 */

export type LandlordSetupStepId = "property" | "unit_map" | "billing" | "first_tenant";

export const LANDLORD_SETUP_STEP_ORDER: readonly LandlordSetupStepId[] = [
    "property",
    "unit_map",
    "billing",
    "first_tenant",
] as const;

export const LANDLORD_SETUP_STEP_LABELS: Record<LandlordSetupStepId, string> = {
    property: "Register your property",
    unit_map: "Arrange your unit map",
    billing: "Set up payments & utility rates",
    first_tenant: "Add your first tenant",
};

/** Matches `SidebarLockStage` in RoleSidebar. */
export type LandlordSetupLockStage = "no_property" | "no_unit_map" | "no_billing_rails" | "no_tenant" | null;

/** Persistent, server-side setup signals returned by GET /api/landlord/setup-status. */
export interface LandlordSetupSignals {
    hasPaymentDestination: boolean;
    utilityRatePropertyIds: string[];
    billingDeferredAt: string | null;
    tenantDeferredAt: string | null;
    dashboardTourDone: boolean;
}

/** Same-session optimistic hints read from browser storage. */
export interface LandlordSetupLocalHints {
    mapCompletePropertyIds: string[];
    billingComplete: boolean;
    billingDeferred: boolean;
    tenantDeferred: boolean;
    dashboardTourDone: boolean;
}

export const EMPTY_LOCAL_HINTS: LandlordSetupLocalHints = {
    mapCompletePropertyIds: [],
    billingComplete: false,
    billingDeferred: false,
    tenantDeferred: false,
    dashboardTourDone: false,
};

export interface LandlordSetupPropertyInput {
    id: string;
    isMapSetupComplete?: boolean;
    placedCount?: number;
    hasTenants?: boolean;
    units?: Array<{ status?: string | null }>;
}

export type LandlordSetupDataStatus = "loading" | "ready" | "error";

export interface LandlordSetupInput {
    /** Status of the authoritative property + setup-signal load. */
    status: LandlordSetupDataStatus;
    /** Whether the current account is subject to landlord onboarding. */
    isLandlord: boolean;
    properties: LandlordSetupPropertyInput[];
    /** null when setup signals could not be loaded (unknown, not "unset"). */
    signals: LandlordSetupSignals | null;
    hints?: LandlordSetupLocalHints;
}

/** `null` completion = unknown (data unavailable). */
export interface LandlordSetupStepState {
    id: LandlordSetupStepId;
    label: string;
    complete: boolean | null;
    deferred: boolean;
}

export interface LandlordSetupState {
    /**
     * loading         → still determining, render nothing onboarding-related
     * error           → could not determine, behave like a normal dashboard
     * not_applicable  → not a landlord account
     * ready           → steps are authoritative
     */
    status: "loading" | "error" | "not_applicable" | "ready";
    steps: LandlordSetupStepState[];
    /** First step that is not complete (deferred steps included). */
    nextStep: LandlordSetupStepId | null;
    /** First step that is incomplete AND not deferred — the only step allowed to interrupt. */
    promptStep: LandlordSetupStepId | null;
    lockStage: LandlordSetupLockStage;
    completedCount: number;
    totalCount: number;
    /** Every step is complete (deferrals do not count). */
    isComplete: boolean;
    /** Dashboard tour is completed or skipped (persisted or local). */
    dashboardTourDone: boolean;
    /** Convenience flags for legacy consumers. */
    hasProperty: boolean;
    hasConfiguredMap: boolean;
    hasConfiguredBilling: boolean;
    hasTenant: boolean;
}

const OCCUPIED_STATUSES = new Set(["occupied", "leased"]);

export function propertyHasTenant(property: LandlordSetupPropertyInput): boolean {
    return Boolean(
        property.hasTenants ||
            property.units?.some((u) => OCCUPIED_STATUSES.has((u.status ?? "").toLowerCase()))
    );
}

export function propertyHasConfiguredMap(property: LandlordSetupPropertyInput): boolean {
    return Boolean(property.isMapSetupComplete || (property.placedCount ?? 0) > 0 || propertyHasTenant(property));
}

function emptyState(status: LandlordSetupState["status"]): LandlordSetupState {
    return {
        status,
        steps: LANDLORD_SETUP_STEP_ORDER.map((id) => ({
            id,
            label: LANDLORD_SETUP_STEP_LABELS[id],
            complete: null,
            deferred: false,
        })),
        nextStep: null,
        promptStep: null,
        lockStage: null,
        completedCount: 0,
        totalCount: LANDLORD_SETUP_STEP_ORDER.length,
        isComplete: false,
        dashboardTourDone: false,
        hasProperty: false,
        hasConfiguredMap: false,
        hasConfiguredBilling: false,
        hasTenant: false,
    };
}

const LOCK_STAGE_BY_STEP: Record<LandlordSetupStepId, Exclude<LandlordSetupLockStage, null>> = {
    property: "no_property",
    unit_map: "no_unit_map",
    billing: "no_billing_rails",
    first_tenant: "no_tenant",
};

/**
 * Deterministically resolve the landlord's setup state from authoritative data.
 * Pure function — safe to unit test and to call on every render.
 */
export function resolveLandlordSetup(input: LandlordSetupInput): LandlordSetupState {
    if (input.status === "loading") return emptyState("loading");
    if (!input.isLandlord) return emptyState("not_applicable");
    // Property list itself unavailable → we know nothing; never assume "no property".
    if (input.status === "error") return emptyState("error");

    const hints = input.hints ?? EMPTY_LOCAL_HINTS;
    const { properties, signals } = input;

    const hasProperty = properties.length > 0;
    const hasTenant = properties.some(propertyHasTenant);
    const hintedMapIds = new Set(hints.mapCompletePropertyIds);
    const hasConfiguredMap = properties.some((p) => propertyHasConfiguredMap(p) || hintedMapIds.has(p.id));

    // Billing: tenants imply billing was handled; otherwise needs DB evidence or a same-session hint.
    let billingComplete: boolean | null;
    if (hasTenant || hints.billingComplete) {
        billingComplete = true;
    } else if (signals) {
        const propertyIds = new Set(properties.map((p) => p.id));
        billingComplete =
            signals.hasPaymentDestination || signals.utilityRatePropertyIds.some((id) => propertyIds.has(id));
    } else {
        billingComplete = null;
    }

    const billingDeferred = Boolean(signals?.billingDeferredAt) || hints.billingDeferred;
    const tenantDeferred = Boolean(signals?.tenantDeferredAt) || hints.tenantDeferred;

    const steps: LandlordSetupStepState[] = [
        { id: "property", label: LANDLORD_SETUP_STEP_LABELS.property, complete: hasProperty, deferred: false },
        { id: "unit_map", label: LANDLORD_SETUP_STEP_LABELS.unit_map, complete: hasConfiguredMap, deferred: false },
        { id: "billing", label: LANDLORD_SETUP_STEP_LABELS.billing, complete: billingComplete, deferred: billingComplete === false && billingDeferred },
        { id: "first_tenant", label: LANDLORD_SETUP_STEP_LABELS.first_tenant, complete: hasTenant, deferred: !hasTenant && tenantDeferred },
    ];

    let nextStep: LandlordSetupStepId | null = null;
    let promptStep: LandlordSetupStepId | null = null;
    let lockStage: LandlordSetupLockStage = null;

    for (const step of steps) {
        if (step.complete === true) continue;
        // Unknown completion: stop here without prompting or locking anything.
        if (step.complete === null) break;

        if (nextStep === null) nextStep = step.id;
        // A postponed step neither interrupts nor gates navigation; it stays as a dashboard reminder.
        if (step.deferred) continue;
        promptStep = step.id;
        if (lockStage === null) lockStage = LOCK_STAGE_BY_STEP[step.id];
        break;
    }

    const completedCount = steps.filter((s) => s.complete === true).length;

    return {
        status: "ready",
        steps,
        nextStep,
        promptStep,
        lockStage,
        completedCount,
        totalCount: steps.length,
        isComplete: completedCount === steps.length,
        dashboardTourDone: Boolean(signals?.dashboardTourDone) || hints.dashboardTourDone,
        hasProperty,
        hasConfiguredMap,
        hasConfiguredBilling: billingComplete === true || billingDeferred,
        hasTenant,
    };
}

/** 1-based position of a step, for "Step X of N" copy. */
export function getLandlordSetupStepNumber(stepId: LandlordSetupStepId): number {
    return LANDLORD_SETUP_STEP_ORDER.indexOf(stepId) + 1;
}

/* ------------------------------------------------------------------ */
/*  Browser hint storage (same-session, optimistic only)               */
/* ------------------------------------------------------------------ */

/** Event dispatched whenever a local setup hint changes. */
export const LANDLORD_SETUP_CHANGED_EVENT = "landlord-setup-changed";

/** Legacy events that also signal a local hint change. */
export const LEGACY_SETUP_EVENTS = [
    "unit-map-setup-completed",
    "unit-map-guidance-changed",
    "billing-rails-setup-completed",
    "billing-rails-delayed-changed",
    "tenant-setup-delayed-changed",
    "dashboard-tour-completed",
] as const;

/**
 * Read the optimistic hints left by setup flows in this browser.
 * Keys are wiped on login, so these never outlive the session that set them.
 */
export function readLandlordSetupLocalHints(propertyIds: string[]): LandlordSetupLocalHints {
    if (typeof window === "undefined") return EMPTY_LOCAL_HINTS;
    try {
        const ls = window.localStorage;
        const isTrue = (key: string) => ls.getItem(key) === "true";

        const mapCompletePropertyIds = propertyIds.filter(
            (id) =>
                isTrue(`ireside_map_setup_complete_${id}`) ||
                isTrue(`ireside.explore_modal_shown.${id}`) ||
                isTrue(`ireside.awaiting_tenant_setup.${id}`) ||
                isTrue(`ireside.onboarding_awaiting_tenant_setup.${id}`)
        );

        return {
            mapCompletePropertyIds,
            billingComplete:
                isTrue("ireside.billing_rails_complete") ||
                propertyIds.some((id) => isTrue(`ireside.billing_rails_complete.${id}`)),
            billingDeferred:
                isTrue("ireside.billing_rails_delayed") ||
                propertyIds.some((id) => isTrue(`ireside.billing_rails_delayed.${id}`)),
            tenantDeferred: propertyIds.some((id) => isTrue(`ireside.tenant_setup_delayed.${id}`)),
            dashboardTourDone:
                isTrue("ireside.dashboard_tour_complete") || isTrue("ireside.onboarding_completed"),
        };
    } catch {
        return EMPTY_LOCAL_HINTS;
    }
}
