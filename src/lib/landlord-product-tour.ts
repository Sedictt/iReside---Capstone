export const LANDLORD_PRODUCT_TOUR_ROUTE = "/landlord/tour";

export const LANDLORD_PRODUCT_TOUR_STEPS = [
    {
        id: "welcome",
        title: "Welcome to iReside",
        description: "Welcome to your Landlord Portal! We're excited to help you manage your properties more efficiently. Let's take a quick 1-minute tour of the key features.",
        route: "/landlord/dashboard",
        anchorId: null,
    },
    {
        id: "nav_unit_map",
        title: "Locating the Unit Map",
        description: "You can access your property layout and unit status anytime from the sidebar. This is your primary tool for visual management.",
        route: "/landlord/dashboard",
        anchorId: "nav-unit-map",
        fallback: "Look for the 'Unit Map' icon in your sidebar to see your property layout.",
    },
    {
        id: "unit_map",
        title: "Visual Unit Map",
        description: "This is the heart of your property management. Use the Visual Planner to map out your units, track occupancy, and see your building layout at a glance.",
        route: "/landlord/unit-map",
        anchorId: "tour-unit-map",
        fallback: "The Unit Map allows you to visually interact with your property floors and units.",
    },
    {
        id: "nav_properties",
        title: "Finding Properties",
        description: "Manage your entire portfolio by clicking 'Properties' here. You can add new buildings and update property-wide settings.",
        route: "/landlord/unit-map",
        anchorId: "nav-properties",
        fallback: "The 'Properties' section in the sidebar is where you manage your registered buildings.",
    },
    {
        id: "properties_portfolio",
        title: "Properties & Portfolio",
        description: "Manage your entire portfolio here. You can add new properties, update building details, and configure amenities for each location.",
        route: "/landlord/properties",
        anchorId: "tour-properties-list",
        fallback: "View and manage all your registered properties in one central hub.",
    },
    {
        id: "nav_tenants",
        title: "Accessing Tenants",
        description: "Everything related to your residents—from applications to lease renewals—is found in the Tenant Hub.",
        route: "/landlord/properties",
        anchorId: "nav-tenant-hub",
        fallback: "Click 'Tenants' in the sidebar to access resident management tools.",
    },
    {
        id: "tenant_management",
        title: "Tenant Hub",
        description: "Review applications, manage active tenants, and handle lease renewals. Everything related to your residents is consolidated here.",
        route: "/landlord/tenants",
        anchorId: "tour-tenant-hub",
        fallback: "The Tenant Hub is where you find all resident information and active lease agreements.",
    },
    {
        id: "nav_finance",
        title: "Monitoring Finances",
        description: "Finally, keep track of your revenue and expenses by accessing the Finance Hub from this menu.",
        route: "/landlord/tenants",
        anchorId: "nav-finance-hub",
        fallback: "The 'Finance Hub' in the sidebar provides access to your unified ledger and invoicing.",
    },
    {
        id: "finance_hub",
        title: "Finance & Payments",
        description: "Track your revenue, manage invoices, and monitor utility billing. Our integrated ledger keeps your finances transparent and organized.",
        route: "/landlord/invoices",
        anchorId: "tour-finance-hub",
        fallback: "Monitor your property's financial health and manage all incoming payments.",
    },
] as const;

export type LandlordProductTourStepId = (typeof LANDLORD_PRODUCT_TOUR_STEPS)[number]["id"];
export type LandlordProductTourStatus = "not_started" | "in_progress" | "skipped" | "completed";
export type LandlordProductTourEventType =
    | "tour_started"
    | "tour_step_completed"
    | "tour_skipped"
    | "tour_completed"
    | "tour_replayed"
    | "tour_failed";
export type LandlordProductTourTriggerSource =
    | "onboarding_handoff"
    | "auto_portal_entry"
    | "manual"
    | "resume"
    | "replay"
    | "step_progression"
    | "fallback"
    | "system";

export type LandlordProductTourState = {
    landlord_id: string;
    status: LandlordProductTourStatus;
    current_step_index: number;
    started_at: string | null;
    completed_at: string | null;
    skipped_at: string | null;
    skip_suppressed_until: string | null;
    replay_count: number;
    last_event_at: string | null;
    last_route: string | null;
    last_anchor_id: string | null;
    metadata: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
};

type LandlordProductTourDbRow = {
    landlord_id: string;
    status: LandlordProductTourStatus;
    current_step_index: number;
    started_at: string | null;
    completed_at: string | null;
    skipped_at: string | null;
    skip_suppressed_until: string | null;
    replay_count: number;
    last_event_at: string | null;
    last_route: string | null;
    last_anchor_id: string | null;
    metadata: Record<string, unknown> | null;
    created_at?: string;
    updated_at?: string;
};

type ProductTourEligibilityReason =
    | "feature_disabled"
    | "non_landlord"
    | "onboarding_incomplete"
    | "completed"
    | "skip_cooldown"
    | "eligible_first_run"
    | "eligible_resume"
    | "eligible_reprompt";

export type LandlordProductTourEligibility = {
    eligible: boolean;
    reason: ProductTourEligibilityReason;
    state: LandlordProductTourState | null;
    suppressUntil: string | null;
};

const DEFAULT_SKIP_COOLDOWN_DAYS = 7;

const parseBoolean = (value: string | undefined, defaultValue: boolean) => {
    if (!value) return defaultValue;
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
};

const parsePositiveNumber = (value: string | undefined, defaultValue: number) => {
    if (!value) return defaultValue;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return defaultValue;
    return parsed;
};

const clampStepIndex = (value: unknown) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.min(Math.floor(parsed), LANDLORD_PRODUCT_TOUR_STEPS.length);
};

const isTourStatus = (value: unknown): value is LandlordProductTourStatus =>
    value === "not_started" || value === "in_progress" || value === "skipped" || value === "completed";

const normalizeTourState = (landlordId: string, row: Partial<LandlordProductTourDbRow>): LandlordProductTourState => ({
    landlord_id: landlordId,
    status: isTourStatus(row.status) ? row.status : "not_started",
    current_step_index: clampStepIndex(row.current_step_index),
    started_at: row.started_at ?? null,
    completed_at: row.completed_at ?? null,
    skipped_at: row.skipped_at ?? null,
    skip_suppressed_until: row.skip_suppressed_until ?? null,
    replay_count: Number(row.replay_count ?? 0) || 0,
    last_event_at: row.last_event_at ?? null,
    last_route: row.last_route ?? null,
    last_anchor_id: row.last_anchor_id ?? null,
    metadata: row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? row.metadata : {},
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
});

const toIso = (value: Date) => value.toISOString();

const addDays = (value: Date, days: number) => {
    const next = new Date(value);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
};

export const isGuidedLandlordProductTourEnabled = () =>
    parseBoolean(
        process.env.GUIDED_LANDLORD_PRODUCT_TOUR_ENABLED ?? process.env.NEXT_PUBLIC_GUIDED_LANDLORD_PRODUCT_TOUR_ENABLED,
        true // Enabled by default for landlords since it's new
    );

export const getLandlordProductTourSkipCooldownDays = () =>
    parsePositiveNumber(process.env.LANDLORD_PRODUCT_TOUR_SKIP_COOLDOWN_DAYS, DEFAULT_SKIP_COOLDOWN_DAYS);

export const getLandlordProductTourStepById = (stepId: string) =>
    LANDLORD_PRODUCT_TOUR_STEPS.find((step) => step.id === stepId) ?? null;

export const getLandlordProductTourRequiredStep = (state: LandlordProductTourState) =>
    LANDLORD_PRODUCT_TOUR_STEPS[state.current_step_index] ?? null;

export const isNextProductTourStepSubmission = (state: LandlordProductTourState, stepId: string) =>
    getLandlordProductTourRequiredStep(state)?.id === stepId;

export const getLandlordProductTourState = async (
    client: any,
    landlordId: string
): Promise<LandlordProductTourState | null> => {
    const { data, error } = await client
        .from("landlord_product_tour_states")
        .select(
            "landlord_id, status, current_step_index, started_at, completed_at, skipped_at, skip_suppressed_until, replay_count, last_event_at, last_route, last_anchor_id, metadata, created_at, updated_at"
        )
        .eq("landlord_id", landlordId)
        .maybeSingle();

    if (error) {
        throw new Error(`Failed to fetch product tour state: ${error.message}`);
    }

    if (!data) return null;
    return normalizeTourState(landlordId, data as LandlordProductTourDbRow);
};

export const createLandlordProductTourState = async (
    client: any,
    {
        landlordId,
        status = "not_started",
        currentStepIndex = 0,
        metadata = {},
    }: {
        landlordId: string;
        status?: LandlordProductTourStatus;
        currentStepIndex?: number;
        metadata?: Record<string, unknown>;
    }
) => {
    const payload = {
        landlord_id: landlordId,
        status,
        current_step_index: clampStepIndex(currentStepIndex),
        metadata,
    };

    const { data, error } = await client.from("landlord_product_tour_states").insert(payload).select("*").single();
    if (error) {
        throw new Error(`Failed to create product tour state: ${error.message}`);
    }

    return normalizeTourState(landlordId, data as LandlordProductTourDbRow);
};

export const ensureLandlordProductTourState = async (client: any, landlordId: string): Promise<LandlordProductTourState> => {
    const existing = await getLandlordProductTourState(client, landlordId);
    if (existing) return existing;
    return createLandlordProductTourState(client, { landlordId, status: "not_started" });
};

export const logLandlordProductTourEvent = async (
    client: any,
    {
        landlordId,
        eventType,
        stepId,
        triggerSource,
        isReplay,
        payload,
    }: {
        landlordId: string;
        eventType: LandlordProductTourEventType;
        stepId?: LandlordProductTourStepId | null;
        triggerSource: LandlordProductTourTriggerSource;
        isReplay?: boolean;
        payload?: Record<string, unknown>;
    }
) => {
    const { error } = await client.from("landlord_product_tour_events").insert({
        landlord_id: landlordId,
        event_type: eventType,
        step_id: stepId ?? null,
        trigger_source: triggerSource,
        is_replay: Boolean(isReplay),
        payload: payload ?? {},
    });
    if (error) {
        throw new Error(`Failed to log product tour event: ${error.message}`);
    }
};

export const startLandlordProductTour = async (
    client: any,
    {
        landlordId,
        triggerSource,
        route,
        anchorId,
        metadata,
    }: {
        landlordId: string;
        triggerSource: LandlordProductTourTriggerSource;
        route?: string | null;
        anchorId?: string | null;
        metadata?: Record<string, unknown>;
    }
) => {
    const existing = await ensureLandlordProductTourState(client, landlordId);
    const nowIso = toIso(new Date());
    const replay = existing.replay_count > 0;

    if (existing.status === "completed") {
        return { state: existing, started: false };
    }

    if (
        existing.status === "skipped" &&
        existing.skip_suppressed_until &&
        new Date(existing.skip_suppressed_until).getTime() > Date.now()
    ) {
        return { state: existing, started: false };
    }

    if (existing.status === "in_progress") {
        return { state: existing, started: false };
    }

    const { data, error } = await client
        .from("landlord_product_tour_states")
        .update({
            status: "in_progress",
            started_at: existing.started_at ?? nowIso,
            skipped_at: null,
            skip_suppressed_until: null,
            last_event_at: nowIso,
            last_route: route ?? existing.last_route,
            last_anchor_id: anchorId ?? existing.last_anchor_id,
            metadata: {
                ...existing.metadata,
                ...(metadata ?? {}),
            },
        })
        .eq("landlord_id", landlordId)
        .select("*")
        .single();

    if (error) {
        throw new Error(`Failed to start product tour: ${error.message}`);
    }

    const state = normalizeTourState(landlordId, data as LandlordProductTourDbRow);
    const requiredStep = getLandlordProductTourRequiredStep(state);
    await logLandlordProductTourEvent(client, {
        landlordId,
        eventType: "tour_started",
        stepId: requiredStep?.id ?? null,
        triggerSource,
        isReplay: replay,
        payload: {
            route: route ?? null,
            anchorId: anchorId ?? null,
            replay_count: state.replay_count,
            session_kind: replay ? "replay" : "first_run",
        },
    });

    return { state, started: true };
};

export const progressLandlordProductTourStep = async (
    client: any,
    {
        landlordId,
        stepId,
        triggerSource,
        route,
        anchorId,
        anchorFound,
        metadata,
    }: {
        landlordId: string;
        stepId: LandlordProductTourStepId;
        triggerSource: LandlordProductTourTriggerSource;
        route?: string | null;
        anchorId?: string | null;
        anchorFound?: boolean;
        metadata?: Record<string, unknown>;
    }
) => {
    const state = await ensureLandlordProductTourState(client, landlordId);
    const current = state.status === "in_progress" ? state : (await startLandlordProductTour(client, {
          landlordId,
          triggerSource: "resume",
      })).state;

    const requiredStep = getLandlordProductTourRequiredStep(current);
    if (!requiredStep) {
        return {
            state: current,
            changed: false,
            requiredStep: null,
            nextStep: null,
            completed: true,
        };
    }

    if (requiredStep.id !== stepId) {
        const error = new Error(`Step order violation: required step is ${requiredStep.id}`);
        (error as any).status = 409;
        (error as any).requiredStep = requiredStep.id;
        throw error;
    }

    const nowIso = toIso(new Date());
    const nextIndex = current.current_step_index + 1;
    const completed = nextIndex >= LANDLORD_PRODUCT_TOUR_STEPS.length;

    const { data, error } = await client
        .from("landlord_product_tour_states")
        .update({
            status: completed ? "completed" : "in_progress",
            current_step_index: nextIndex,
            completed_at: completed ? nowIso : null,
            last_event_at: nowIso,
            last_route: route ?? requiredStep.route ?? current.last_route,
            last_anchor_id: anchorId ?? requiredStep.anchorId ?? current.last_anchor_id,
            metadata: {
                ...current.metadata,
                ...(metadata ?? {}),
            },
        })
        .eq("landlord_id", landlordId)
        .select("*")
        .single();

    if (error) {
        throw new Error(`Failed to advance product tour step: ${error.message}`);
    }

    const nextState = normalizeTourState(landlordId, data as LandlordProductTourDbRow);
    const nextStep = getLandlordProductTourRequiredStep(nextState);

    await logLandlordProductTourEvent(client, {
        landlordId,
        eventType: "tour_step_completed",
        stepId,
        triggerSource,
        isReplay: nextState.replay_count > 0,
        payload: {
            route: route ?? requiredStep.route,
            anchor_id: anchorId ?? requiredStep.anchorId,
            anchor_found: anchorFound ?? null,
        },
    });

    if (completed) {
        await logLandlordProductTourEvent(client, {
            landlordId,
            eventType: "tour_completed",
            stepId,
            triggerSource,
            isReplay: nextState.replay_count > 0,
            payload: {
                session_kind: nextState.replay_count > 0 ? "replay" : "first_run",
            },
        });
    }

    return {
        state: nextState,
        changed: true,
        requiredStep: requiredStep.id,
        nextStep,
        completed,
    };
};

export const skipLandlordProductTour = async (
    client: any,
    {
        landlordId,
        triggerSource,
        stepId,
        metadata,
        now = new Date(),
    }: {
        landlordId: string;
        triggerSource: LandlordProductTourTriggerSource;
        stepId?: LandlordProductTourStepId | null;
        metadata?: Record<string, unknown>;
        now?: Date;
    }
) => {
    const state = await ensureLandlordProductTourState(client, landlordId);
    const nowIso = toIso(now);
    const suppressUntilIso = toIso(addDays(now, getLandlordProductTourSkipCooldownDays()));

    const { data, error } = await client
        .from("landlord_product_tour_states")
        .update({
            status: "skipped",
            skipped_at: nowIso,
            skip_suppressed_until: suppressUntilIso,
            last_event_at: nowIso,
            metadata: {
                ...state.metadata,
                ...(metadata ?? {}),
            },
        })
        .eq("landlord_id", landlordId)
        .select("*")
        .single();

    if (error) {
        throw new Error(`Failed to skip product tour: ${error.message}`);
    }

    const nextState = normalizeTourState(landlordId, data as LandlordProductTourDbRow);
    await logLandlordProductTourEvent(client, {
        landlordId,
        eventType: "tour_skipped",
        stepId: stepId ?? getLandlordProductTourRequiredStep(nextState)?.id ?? null,
        triggerSource,
        isReplay: nextState.replay_count > 0,
        payload: {
            suppress_until: suppressUntilIso,
        },
    });

    return nextState;
};

export const completeLandlordProductTour = async (
    client: any,
    {
        landlordId,
        triggerSource,
        stepId,
    }: {
        landlordId: string;
        triggerSource: LandlordProductTourTriggerSource;
        stepId?: LandlordProductTourStepId | null;
    }
) => {
    const state = await ensureLandlordProductTourState(client, landlordId);
    const nowIso = toIso(new Date());

    const { data, error } = await client
        .from("landlord_product_tour_states")
        .update({
            status: "completed",
            current_step_index: LANDLORD_PRODUCT_TOUR_STEPS.length,
            completed_at: nowIso,
            skipped_at: null,
            skip_suppressed_until: null,
            last_event_at: nowIso,
        })
        .eq("landlord_id", landlordId)
        .select("*")
        .single();

    if (error) {
        throw new Error(`Failed to complete product tour: ${error.message}`);
    }

    const nextState = normalizeTourState(landlordId, data as LandlordProductTourDbRow);
    await logLandlordProductTourEvent(client, {
        landlordId,
        eventType: "tour_completed",
        stepId: stepId ?? null,
        triggerSource,
        isReplay: nextState.replay_count > 0,
        payload: {
            session_kind: nextState.replay_count > 0 ? "replay" : "first_run",
        },
    });

    return nextState;
};

export const replayLandlordProductTour = async (
    client: any,
    {
        landlordId,
        triggerSource = "replay",
    }: {
        landlordId: string;
        triggerSource?: LandlordProductTourTriggerSource;
    }
) => {
    const state = await ensureLandlordProductTourState(client, landlordId);
    const nowIso = toIso(new Date());
    const replayCount = state.replay_count + 1;

    const { data, error } = await client
        .from("landlord_product_tour_states")
        .update({
            status: "in_progress",
            current_step_index: 0,
            started_at: nowIso,
            completed_at: null,
            skipped_at: null,
            skip_suppressed_until: null,
            replay_count: replayCount,
            last_event_at: nowIso,
        })
        .eq("landlord_id", landlordId)
        .select("*")
        .single();

    if (error) {
        throw new Error(`Failed to replay product tour: ${error.message}`);
    }

    const nextState = normalizeTourState(landlordId, data as LandlordProductTourDbRow);
    const firstStep = getLandlordProductTourRequiredStep(nextState);

    await logLandlordProductTourEvent(client, {
        landlordId,
        eventType: "tour_replayed",
        stepId: firstStep?.id ?? null,
        triggerSource,
        isReplay: true,
        payload: {
            replay_count: replayCount,
            previous_status: state.status,
        },
    });

    await logLandlordProductTourEvent(client, {
        landlordId,
        eventType: "tour_started",
        stepId: firstStep?.id ?? null,
        triggerSource,
        isReplay: true,
        payload: {
            replay_count: replayCount,
            session_kind: "replay",
        },
    });

    return nextState;
};

export const evaluateLandlordProductTourEligibility = ({
    role,
    onboardingCompleted,
    state,
    now = new Date(),
}: {
    role: string | null | undefined;
    onboardingCompleted: boolean;
    state: LandlordProductTourState | null;
    now?: Date;
}): Omit<LandlordProductTourEligibility, "state"> => {
    if (!isGuidedLandlordProductTourEnabled()) {
        return { eligible: false, reason: "feature_disabled", suppressUntil: null };
    }

    if (role !== "landlord") {
        return { eligible: false, reason: "non_landlord", suppressUntil: null };
    }

    if (!onboardingCompleted) {
        return { eligible: false, reason: "onboarding_incomplete", suppressUntil: null };
    }

    if (!state) {
        return { eligible: true, reason: "eligible_first_run", suppressUntil: null };
    }

    if (state.status === "completed") {
        return { eligible: false, reason: "completed", suppressUntil: null };
    }

    if (state.status === "in_progress") {
        return { eligible: true, reason: "eligible_resume", suppressUntil: null };
    }

    if (state.status === "skipped") {
        const suppressUntil = state.skip_suppressed_until ? new Date(state.skip_suppressed_until) : null;
        if (suppressUntil && suppressUntil.getTime() > now.getTime()) {
            return { eligible: false, reason: "skip_cooldown", suppressUntil: toIso(suppressUntil) };
        }
        return { eligible: true, reason: "eligible_reprompt", suppressUntil: null };
    }

    return { eligible: true, reason: "eligible_first_run", suppressUntil: null };
};

export const resolveLandlordProductTourEligibility = async (
    client: any,
    {
        landlordId,
        role,
        onboardingCompleted,
        now,
    }: {
        landlordId: string;
        role: string | null | undefined;
        onboardingCompleted: boolean;
        now?: Date;
    }
): Promise<LandlordProductTourEligibility> => {
    const state = await getLandlordProductTourState(client, landlordId);
    const result = evaluateLandlordProductTourEligibility({
        role,
        onboardingCompleted,
        state,
        now,
    });

    return {
        ...result,
        state,
    };
};
