export const TENANT_PRODUCT_TOUR_ROUTE = "/tenant/tour";

export const TENANT_PRODUCT_TOUR_STEPS = [
    {
        id: "dashboard_overview",
        title: "Tenant Dashboard",
        description: "Start here to monitor due dates, lease health, and your most important tenant actions.",
        route: "/tenant/dashboard",
        anchorId: "tour-dashboard-overview",
        fallback:
            "If the dashboard hero is unavailable, check the top summary card on your dashboard for payment due dates and status.",
    },
    {
        id: "lease_overview",
        title: "Lease Hub",
        description: "Review contract terms, timeline status, and key provisions in your lease workspace.",
        route: "/tenant/lease",
        anchorId: "tour-lease-summary",
        fallback:
            "If this lease card is missing, open your lease page and look for the primary lease summary panel near the top.",
    },
    {
        id: "payments_center",
        title: "Payments Center",
        description: "Track upcoming invoices and complete payments from your financial dashboard.",
        route: "/tenant/payments",
        anchorId: "tour-payments-balance",
        fallback:
            "If the highlighted payment card is unavailable, use the Payments page to review your next invoice and settlement action.",
    },
    {
        id: "maintenance_request",
        title: "Maintenance Request",
        description: "Use quick actions to file maintenance concerns and keep landlords informed.",
        route: "/tenant/dashboard",
        anchorId: "tour-maintenance-quick-action",
        fallback:
            "If the maintenance quick action is hidden on your screen size, open the dashboard quick actions and select Request Repair.",
    },
    {
        id: "messages_hub",
        title: "Messages",
        description: "Chat with your landlord and support contacts from a single inbox.",
        route: "/tenant/messages",
        anchorId: "tour-messages-sidebar",
        fallback:
            "If the contact sidebar is unavailable, open Messages and pick any contact to continue the tour.",
    },
] as const;

export const TENANT_DASHBOARD_TOUR_STEPS = [
    {
        id: "welcome",
        title: "Welcome to your Dashboard",
        description: "Let's take a quick tour to help you get familiarized with the system and find what you need.",
        anchorId: null,
    },
    {
        id: "dashboard-hero",
        title: "Payment Overview",
        description: "Here you can see your next upcoming payment, the time remaining, and pay directly with a single click.",
        anchorId: "tour-dashboard-overview",
    },
    {
        id: "quick-actions",
        title: "Quick Actions",
        description: "Need a repair? Have a question? Use these fast links to get things done quickly.",
        anchorId: "tour-quick-actions",
    },
    {
        id: "lease-details",
        title: "Lease & Utilities",
        description: "Keep track of your active lease timeline exactly, along with your recent utility bills.",
        anchorId: "tour-lease-details",
    },
    {
        id: "message-sidebar",
        title: "Message Sidebar",
        description: "Access your conversations, contacts, and chat with iRis Assistant directly from your dashboard.",
        anchorId: "tour-messages-sidebar",
    }
] as const;

export const TENANT_COMMUNITY_TOUR_STEPS = [
    {
        id: "welcome",
        title: "Welcome to Community Hub",
        description: "This is where you can connect with your neighbors, view announcements, and participate in discussions.",
        anchorId: null,
    },
    {
        id: "announcements",
        title: "Stay Informed",
        description: "Management announcements and utility alerts are pinned here so you never miss important updates.",
        anchorId: "tour-community-announcements",
    },
    {
        id: "create-post",
        title: "Join the Conversation",
        description: "Share thoughts, ask questions, or start a poll. Note that all posts are moderated for safety.",
        anchorId: "tour-community-create-post",
    },
    {
        id: "navigation",
        title: "Browse Content",
        description: "Switch between the live feed, your own posts, and saved favorites.",
        anchorId: "tour-community-tabs",
    },
    {
        id: "rules",
        title: "Community Rules",
        description: "Check the community guidelines anytime to ensure a friendly environment for everyone.",
        anchorId: "tour-community-rules",
    }
] as const;

export type TenantProductTourStepId = (typeof TENANT_PRODUCT_TOUR_STEPS)[number]["id"];
export type TenantProductTourStatus = "not_started" | "in_progress" | "skipped" | "completed";
export type TenantProductTourEventType =
    | "tour_started"
    | "tour_step_completed"
    | "tour_skipped"
    | "tour_completed"
    | "tour_replayed"
    | "tour_failed";
export type TenantProductTourTriggerSource =
    | "onboarding_handoff"
    | "auto_portal_entry"
    | "manual"
    | "resume"
    | "replay"
    | "step_progression"
    | "fallback"
    | "system";

export type TenantProductTourState = {
    tenant_id: string;
    status: TenantProductTourStatus;
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

type TenantProductTourDbRow = {
    tenant_id: string;
    status: TenantProductTourStatus;
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
    | "non_tenant"
    | "onboarding_incomplete"
    | "completed"
    | "skip_cooldown"
    | "eligible_first_run"
    | "eligible_resume"
    | "eligible_reprompt";

export type TenantProductTourEligibility = {
    eligible: boolean;
    reason: ProductTourEligibilityReason;
    state: TenantProductTourState | null;
    suppressUntil: string | null;
};

const DEFAULT_SKIP_COOLDOWN_DAYS = 14;

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
    return Math.min(Math.floor(parsed), TENANT_PRODUCT_TOUR_STEPS.length);
};

const isTourStatus = (value: unknown): value is TenantProductTourStatus =>
    value === "not_started" || value === "in_progress" || value === "skipped" || value === "completed";

const normalizeTourState = (tenantId: string, row: Partial<TenantProductTourDbRow>): TenantProductTourState => ({
    tenant_id: tenantId,
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

export const isGuidedTenantProductTourEnabled = () =>
    parseBoolean(
        process.env.GUIDED_TENANT_PRODUCT_TOUR_ENABLED ?? process.env.NEXT_PUBLIC_GUIDED_TENANT_PRODUCT_TOUR_ENABLED,
        false
    );

export const getTenantProductTourSkipCooldownDays = () =>
    parsePositiveNumber(process.env.TENANT_PRODUCT_TOUR_SKIP_COOLDOWN_DAYS, DEFAULT_SKIP_COOLDOWN_DAYS);

export const getTenantProductTourStepById = (stepId: string) =>
    TENANT_PRODUCT_TOUR_STEPS.find((step) => step.id === stepId) ?? null;

export const getTenantProductTourRequiredStep = (state: TenantProductTourState) =>
    TENANT_PRODUCT_TOUR_STEPS[state.current_step_index] ?? null;

export const isNextProductTourStepSubmission = (state: TenantProductTourState, stepId: string) =>
    getTenantProductTourRequiredStep(state)?.id === stepId;

export const getTenantProductTourState = async (
    client: any,
    tenantId: string
): Promise<TenantProductTourState | null> => {
    const { data, error } = await client
        .from("tenant_product_tour_states")
        .select(
            "tenant_id, status, current_step_index, started_at, completed_at, skipped_at, skip_suppressed_until, replay_count, last_event_at, last_route, last_anchor_id, metadata, created_at, updated_at"
        )
        .eq("tenant_id", tenantId)
        .maybeSingle();

    if (error) {
        throw new Error(`Failed to fetch product tour state: ${error.message}`);
    }

    if (!data) return null;
    return normalizeTourState(tenantId, data as TenantProductTourDbRow);
};

export const createTenantProductTourState = async (
    client: any,
    {
        tenantId,
        status = "not_started",
        currentStepIndex = 0,
        metadata = {},
    }: {
        tenantId: string;
        status?: TenantProductTourStatus;
        currentStepIndex?: number;
        metadata?: Record<string, unknown>;
    }
) => {
    const payload = {
        tenant_id: tenantId,
        status,
        current_step_index: clampStepIndex(currentStepIndex),
        metadata,
    };

    const { data, error } = await client.from("tenant_product_tour_states").insert(payload).select("*").single();
    if (error) {
        throw new Error(`Failed to create product tour state: ${error.message}`);
    }

    return normalizeTourState(tenantId, data as TenantProductTourDbRow);
};

export const ensureTenantProductTourState = async (client: any, tenantId: string): Promise<TenantProductTourState> => {
    const existing = await getTenantProductTourState(client, tenantId);
    if (existing) return existing;
    return createTenantProductTourState(client, { tenantId, status: "not_started" });
};

export const logTenantProductTourEvent = async (
    client: any,
    {
        tenantId,
        eventType,
        stepId,
        triggerSource,
        isReplay,
        payload,
    }: {
        tenantId: string;
        eventType: TenantProductTourEventType;
        stepId?: TenantProductTourStepId | null;
        triggerSource: TenantProductTourTriggerSource;
        isReplay?: boolean;
        payload?: Record<string, unknown>;
    }
) => {
    const { error } = await client.from("tenant_product_tour_events").insert({
        tenant_id: tenantId,
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

export const startTenantProductTour = async (
    client: any,
    {
        tenantId,
        triggerSource,
        route,
        anchorId,
        metadata,
    }: {
        tenantId: string;
        triggerSource: TenantProductTourTriggerSource;
        route?: string | null;
        anchorId?: string | null;
        metadata?: Record<string, unknown>;
    }
) => {
    const existing = await ensureTenantProductTourState(client, tenantId);
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
        .from("tenant_product_tour_states")
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
        .eq("tenant_id", tenantId)
        .select("*")
        .single();

    if (error) {
        throw new Error(`Failed to start product tour: ${error.message}`);
    }

    const state = normalizeTourState(tenantId, data as TenantProductTourDbRow);
    const requiredStep = getTenantProductTourRequiredStep(state);
    await logTenantProductTourEvent(client, {
        tenantId,
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

export const progressTenantProductTourStep = async (
    client: any,
    {
        tenantId,
        stepId,
        triggerSource,
        route,
        anchorId,
        anchorFound,
        metadata,
    }: {
        tenantId: string;
        stepId: TenantProductTourStepId;
        triggerSource: TenantProductTourTriggerSource;
        route?: string | null;
        anchorId?: string | null;
        anchorFound?: boolean;
        metadata?: Record<string, unknown>;
    }
) => {
    const state = await ensureTenantProductTourState(client, tenantId);
    const current = state.status === "in_progress" ? state : (await startTenantProductTour(client, {
          tenantId,
          triggerSource: "resume",
      })).state;

    const requiredStep = getTenantProductTourRequiredStep(current);
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
    const completed = nextIndex >= TENANT_PRODUCT_TOUR_STEPS.length;

    const { data, error } = await client
        .from("tenant_product_tour_states")
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
        .eq("tenant_id", tenantId)
        .select("*")
        .single();

    if (error) {
        throw new Error(`Failed to advance product tour step: ${error.message}`);
    }

    const nextState = normalizeTourState(tenantId, data as TenantProductTourDbRow);
    const nextStep = getTenantProductTourRequiredStep(nextState);

    await logTenantProductTourEvent(client, {
        tenantId,
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
        await logTenantProductTourEvent(client, {
            tenantId,
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

export const skipTenantProductTour = async (
    client: any,
    {
        tenantId,
        triggerSource,
        stepId,
        metadata,
        now = new Date(),
    }: {
        tenantId: string;
        triggerSource: TenantProductTourTriggerSource;
        stepId?: TenantProductTourStepId | null;
        metadata?: Record<string, unknown>;
        now?: Date;
    }
) => {
    const state = await ensureTenantProductTourState(client, tenantId);
    const nowIso = toIso(now);
    const suppressUntilIso = toIso(addDays(now, getTenantProductTourSkipCooldownDays()));

    const { data, error } = await client
        .from("tenant_product_tour_states")
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
        .eq("tenant_id", tenantId)
        .select("*")
        .single();

    if (error) {
        throw new Error(`Failed to skip product tour: ${error.message}`);
    }

    const nextState = normalizeTourState(tenantId, data as TenantProductTourDbRow);
    await logTenantProductTourEvent(client, {
        tenantId,
        eventType: "tour_skipped",
        stepId: stepId ?? getTenantProductTourRequiredStep(nextState)?.id ?? null,
        triggerSource,
        isReplay: nextState.replay_count > 0,
        payload: {
            suppress_until: suppressUntilIso,
        },
    });

    return nextState;
};

export const completeTenantProductTour = async (
    client: any,
    {
        tenantId,
        triggerSource,
        stepId,
    }: {
        tenantId: string;
        triggerSource: TenantProductTourTriggerSource;
        stepId?: TenantProductTourStepId | null;
    }
) => {
    const state = await ensureTenantProductTourState(client, tenantId);
    const nowIso = toIso(new Date());

    const { data, error } = await client
        .from("tenant_product_tour_states")
        .update({
            status: "completed",
            current_step_index: TENANT_PRODUCT_TOUR_STEPS.length,
            completed_at: nowIso,
            skipped_at: null,
            skip_suppressed_until: null,
            last_event_at: nowIso,
        })
        .eq("tenant_id", tenantId)
        .select("*")
        .single();

    if (error) {
        throw new Error(`Failed to complete product tour: ${error.message}`);
    }

    const nextState = normalizeTourState(tenantId, data as TenantProductTourDbRow);
    await logTenantProductTourEvent(client, {
        tenantId,
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

export const replayTenantProductTour = async (
    client: any,
    {
        tenantId,
        triggerSource = "replay",
    }: {
        tenantId: string;
        triggerSource?: TenantProductTourTriggerSource;
    }
) => {
    const state = await ensureTenantProductTourState(client, tenantId);
    const nowIso = toIso(new Date());
    const replayCount = state.replay_count + 1;

    const { data, error } = await client
        .from("tenant_product_tour_states")
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
        .eq("tenant_id", tenantId)
        .select("*")
        .single();

    if (error) {
        throw new Error(`Failed to replay product tour: ${error.message}`);
    }

    const nextState = normalizeTourState(tenantId, data as TenantProductTourDbRow);
    const firstStep = getTenantProductTourRequiredStep(nextState);

    await logTenantProductTourEvent(client, {
        tenantId,
        eventType: "tour_replayed",
        stepId: firstStep?.id ?? null,
        triggerSource,
        isReplay: true,
        payload: {
            replay_count: replayCount,
            previous_status: state.status,
        },
    });

    await logTenantProductTourEvent(client, {
        tenantId,
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

export const evaluateTenantProductTourEligibility = ({
    role,
    onboardingCompleted,
    state,
    now = new Date(),
}: {
    role: string | null | undefined;
    onboardingCompleted: boolean;
    state: TenantProductTourState | null;
    now?: Date;
}): Omit<TenantProductTourEligibility, "state"> => {
    if (!isGuidedTenantProductTourEnabled()) {
        return { eligible: false, reason: "feature_disabled", suppressUntil: null };
    }

    if (role !== "tenant") {
        return { eligible: false, reason: "non_tenant", suppressUntil: null };
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

    if (state.status === "in_progress" || state.status === "not_started") {
        return { eligible: true, reason: "eligible_resume", suppressUntil: null };
    }

    if (state.status === "skipped" && state.skip_suppressed_until) {
        const suppressUntil = new Date(state.skip_suppressed_until);
        if (!Number.isNaN(suppressUntil.getTime()) && suppressUntil > now) {
            return {
                eligible: false,
                reason: "skip_cooldown",
                suppressUntil: state.skip_suppressed_until,
            };
        }
    }

    return { eligible: true, reason: "eligible_reprompt", suppressUntil: null };
};

export const resolveTenantProductTourEligibility = async (
    client: any,
    {
        tenantId,
        role,
        onboardingCompleted,
        now,
    }: {
        tenantId: string;
        role: string | null | undefined;
        onboardingCompleted: boolean;
        now?: Date;
    }
): Promise<TenantProductTourEligibility> => {
    const state = await getTenantProductTourState(client, tenantId);
    const result = evaluateTenantProductTourEligibility({
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
