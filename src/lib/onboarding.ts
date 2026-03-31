export const ONBOARDING_STEPS = [
    "profile",
    "lease_acknowledged",
    "payment_readiness",
    "support_handoff",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
export type OnboardingStatus = "pending" | "in_progress" | "completed";
export type ReminderTriggerSource = "manual" | "automated";

export type TenantOnboardingState = {
    tenant_id: string;
    status: OnboardingStatus;
    current_step: OnboardingStep;
    steps: Record<OnboardingStep, boolean>;
    step_data: Record<string, unknown>;
    started_at: string | null;
    completed_at: string | null;
    last_reminder_sent_at: string | null;
    reminder_send_count: number;
    reminder_window_started_at: string | null;
    created_at?: string;
    updated_at?: string;
};

export type ReminderEligibility =
    | {
          eligible: true;
      }
    | {
          eligible: false;
          reason: "completed" | "cooldown" | "daily_limit";
          nextEligibleAt: string | null;
      };

type OnboardingEventType =
    | "onboarding_started"
    | "step_completed"
    | "onboarding_completed"
    | "reminder_sent"
    | "reminder_failed";

const DEFAULT_COOLDOWN_MINUTES = 30;
const DEFAULT_DAILY_LIMIT = 3;

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

export const isGuidedTenantOnboardingEnabled = () =>
    parseBoolean(
        process.env.GUIDED_TENANT_ONBOARDING_ENABLED ?? process.env.NEXT_PUBLIC_GUIDED_TENANT_ONBOARDING_ENABLED,
        false
    );

export const getOnboardingReminderCooldownMinutes = () =>
    parsePositiveNumber(process.env.ONBOARDING_REMINDER_COOLDOWN_MINUTES, DEFAULT_COOLDOWN_MINUTES);

export const getOnboardingReminderDailyLimit = () =>
    parsePositiveNumber(process.env.ONBOARDING_REMINDER_DAILY_LIMIT, DEFAULT_DAILY_LIMIT);

export const buildDefaultOnboardingSteps = (): Record<OnboardingStep, boolean> => ({
    profile: false,
    lease_acknowledged: false,
    payment_readiness: false,
    support_handoff: false,
});

const normalizeStep = (value: unknown): value is OnboardingStep =>
    typeof value === "string" && (ONBOARDING_STEPS as readonly string[]).includes(value);

export const normalizeOnboardingSteps = (input: unknown): Record<OnboardingStep, boolean> => {
    const defaults = buildDefaultOnboardingSteps();

    if (!input || typeof input !== "object" || Array.isArray(input)) {
        return defaults;
    }

    const record = input as Record<string, unknown>;
    for (const step of ONBOARDING_STEPS) {
        defaults[step] = Boolean(record[step]);
    }

    return defaults;
};

export const getFirstIncompleteOnboardingStep = (
    steps: Record<OnboardingStep, boolean>
): OnboardingStep | null => {
    for (const step of ONBOARDING_STEPS) {
        if (!steps[step]) {
            return step;
        }
    }
    return null;
};

export const areAllOnboardingStepsComplete = (steps: Record<OnboardingStep, boolean>) =>
    ONBOARDING_STEPS.every((step) => steps[step]);

const normalizeOnboardingState = (tenantId: string, row: any): TenantOnboardingState => {
    const normalizedSteps = normalizeOnboardingSteps(row?.steps);
    const fallbackStep = getFirstIncompleteOnboardingStep(normalizedSteps) ?? ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1];
    const currentStep = normalizeStep(row?.current_step) ? row.current_step : fallbackStep;

    return {
        tenant_id: tenantId,
        status: (row?.status as OnboardingStatus) ?? "pending",
        current_step: currentStep,
        steps: normalizedSteps,
        step_data: row?.step_data && typeof row.step_data === "object" && !Array.isArray(row.step_data) ? row.step_data : {},
        started_at: row?.started_at ?? null,
        completed_at: row?.completed_at ?? null,
        last_reminder_sent_at: row?.last_reminder_sent_at ?? null,
        reminder_send_count: Number(row?.reminder_send_count ?? 0) || 0,
        reminder_window_started_at: row?.reminder_window_started_at ?? null,
        created_at: row?.created_at ?? undefined,
        updated_at: row?.updated_at ?? undefined,
    };
};

const buildCompletedSteps = (): Record<OnboardingStep, boolean> => ({
    profile: true,
    lease_acknowledged: true,
    payment_readiness: true,
    support_handoff: true,
});

const addHours = (date: Date, hours: number) => {
    const copy = new Date(date);
    copy.setHours(copy.getHours() + hours);
    return copy;
};

export const logOnboardingEvent = async (
    client: any,
    {
        tenantId,
        eventType,
        actorId,
        triggerSource,
        metadata,
    }: {
        tenantId: string;
        eventType: OnboardingEventType;
        actorId?: string | null;
        triggerSource?: ReminderTriggerSource;
        metadata?: Record<string, unknown>;
    }
) => {
    await client.from("tenant_onboarding_events").insert({
        tenant_id: tenantId,
        event_type: eventType,
        actor_id: actorId ?? null,
        trigger_source: triggerSource ?? null,
        metadata: metadata ?? {},
    });
};

export const getTenantOnboardingState = async (client: any, tenantId: string): Promise<TenantOnboardingState | null> => {
    const { data, error } = await client
        .from("tenant_onboarding_states")
        .select(
            "tenant_id, status, current_step, steps, step_data, started_at, completed_at, last_reminder_sent_at, reminder_send_count, reminder_window_started_at, created_at, updated_at"
        )
        .eq("tenant_id", tenantId)
        .maybeSingle();

    if (error) {
        throw new Error(`Failed to fetch onboarding state: ${error.message}`);
    }

    if (!data) {
        return null;
    }

    return normalizeOnboardingState(tenantId, data);
};

export const ensureTenantOnboardingState = async (
    client: any,
    tenantId: string,
    options?: { markCompleted?: boolean }
): Promise<TenantOnboardingState> => {
    const existing = await getTenantOnboardingState(client, tenantId);
    if (existing) {
        return existing;
    }

    const markCompleted = Boolean(options?.markCompleted);
    const nowIso = new Date().toISOString();
    const steps = markCompleted ? buildCompletedSteps() : buildDefaultOnboardingSteps();
    const status: OnboardingStatus = markCompleted ? "completed" : "pending";
    const currentStep = markCompleted ? ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1] : ONBOARDING_STEPS[0];

    const payload = {
        tenant_id: tenantId,
        status,
        current_step: currentStep,
        steps,
        step_data: {},
        started_at: markCompleted ? nowIso : null,
        completed_at: markCompleted ? nowIso : null,
        reminder_send_count: 0,
        reminder_window_started_at: null,
        last_reminder_sent_at: null,
    };

    const { data, error } = await client.from("tenant_onboarding_states").insert(payload).select("*").single();
    if (error) {
        throw new Error(`Failed to create onboarding state: ${error.message}`);
    }

    return normalizeOnboardingState(tenantId, data);
};

export const completeTenantOnboardingStep = async (
    client: any,
    {
        tenantId,
        step,
        actorId,
        stepData,
    }: {
        tenantId: string;
        step: OnboardingStep;
        actorId: string;
        stepData?: Record<string, unknown>;
    }
) => {
    const state = await ensureTenantOnboardingState(client, tenantId);
    const requiredStep = getFirstIncompleteOnboardingStep(state.steps);

    if (!requiredStep) {
        return { state, changed: false };
    }

    if (requiredStep !== step) {
        const error = new Error(`Step order violation: required step is ${requiredStep}`);
        (error as any).status = 409;
        throw error;
    }

    const nowIso = new Date().toISOString();
    const nextSteps = { ...state.steps, [step]: true };
    const nextRequiredStep = getFirstIncompleteOnboardingStep(nextSteps);
    const completed = !nextRequiredStep;
    const mergedStepData = {
        ...state.step_data,
        [step]: stepData ?? {},
    };

    const status: OnboardingStatus = completed ? "completed" : "in_progress";
    const currentStep = completed ? step : nextRequiredStep;

    const updatePayload: Record<string, unknown> = {
        steps: nextSteps,
        step_data: mergedStepData,
        status,
        current_step: currentStep,
        completed_at: completed ? nowIso : null,
        started_at: state.started_at ?? nowIso,
    };

    const { data, error } = await client
        .from("tenant_onboarding_states")
        .update(updatePayload)
        .eq("tenant_id", tenantId)
        .select("*")
        .single();

    if (error) {
        throw new Error(`Failed to update onboarding step: ${error.message}`);
    }

    if (state.status === "pending") {
        await logOnboardingEvent(client, {
            tenantId,
            eventType: "onboarding_started",
            actorId,
            metadata: { first_step: step },
        });
    }

    await logOnboardingEvent(client, {
        tenantId,
        eventType: "step_completed",
        actorId,
        metadata: { step },
    });

    if (completed && state.status !== "completed") {
        await logOnboardingEvent(client, {
            tenantId,
            eventType: "onboarding_completed",
            actorId,
            metadata: { completed_step: step },
        });
    }

    return { state: normalizeOnboardingState(tenantId, data), changed: true };
};

export const finalizeTenantOnboarding = async (
    client: any,
    tenantId: string,
    actorId: string
): Promise<TenantOnboardingState> => {
    const state = await ensureTenantOnboardingState(client, tenantId);
    const nowIso = new Date().toISOString();

    const completeSteps = buildCompletedSteps();
    const payload = {
        status: "completed",
        current_step: ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1],
        steps: completeSteps,
        completed_at: nowIso,
        started_at: state.started_at ?? nowIso,
    };

    const { data, error } = await client
        .from("tenant_onboarding_states")
        .update(payload)
        .eq("tenant_id", tenantId)
        .select("*")
        .single();

    if (error) {
        throw new Error(`Failed to finalize onboarding: ${error.message}`);
    }

    if (state.status !== "completed") {
        await logOnboardingEvent(client, {
            tenantId,
            eventType: "onboarding_completed",
            actorId,
            metadata: { forced_completion: false },
        });
    }

    return normalizeOnboardingState(tenantId, data);
};

export const ensureOnboardingReadyForReminder = (
    state: TenantOnboardingState,
    now = new Date()
): ReminderEligibility => {
    if (state.status === "completed") {
        return { eligible: false, reason: "completed", nextEligibleAt: null };
    }

    const cooldownMinutes = getOnboardingReminderCooldownMinutes();
    const dailyLimit = getOnboardingReminderDailyLimit();

    if (state.last_reminder_sent_at) {
        const lastReminderAt = new Date(state.last_reminder_sent_at);
        const nextCooldownAt = new Date(lastReminderAt.getTime() + cooldownMinutes * 60 * 1000);
        if (nextCooldownAt > now) {
            return { eligible: false, reason: "cooldown", nextEligibleAt: nextCooldownAt.toISOString() };
        }
    }

    const windowStart = state.reminder_window_started_at ? new Date(state.reminder_window_started_at) : null;
    if (windowStart) {
        const windowEndsAt = addHours(windowStart, 24);
        if (windowEndsAt > now && state.reminder_send_count >= dailyLimit) {
            return { eligible: false, reason: "daily_limit", nextEligibleAt: windowEndsAt.toISOString() };
        }
    }

    return { eligible: true };
};

export const registerReminderAttempt = async (
    client: any,
    {
        tenantId,
        actorId,
        triggerSource,
        success,
        metadata,
        now = new Date(),
    }: {
        tenantId: string;
        actorId?: string | null;
        triggerSource: ReminderTriggerSource;
        success: boolean;
        metadata?: Record<string, unknown>;
        now?: Date;
    }
) => {
    const state = await ensureTenantOnboardingState(client, tenantId);
    const nowIso = now.toISOString();

    let sendCount = state.reminder_send_count;
    const windowStart = state.reminder_window_started_at ? new Date(state.reminder_window_started_at) : null;
    const windowExpired = !windowStart || addHours(windowStart, 24) <= now;

    if (windowExpired) {
        sendCount = 0;
    }
    sendCount += 1;

    const updatePayload = {
        reminder_send_count: sendCount,
        reminder_window_started_at: windowExpired ? nowIso : state.reminder_window_started_at,
        last_reminder_sent_at: nowIso,
    };

    await client.from("tenant_onboarding_states").update(updatePayload).eq("tenant_id", tenantId);

    await logOnboardingEvent(client, {
        tenantId,
        eventType: success ? "reminder_sent" : "reminder_failed",
        actorId: actorId ?? null,
        triggerSource,
        metadata: metadata ?? {},
    });
};

