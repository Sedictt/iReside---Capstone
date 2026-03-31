import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    areAllOnboardingStepsComplete,
    buildDefaultOnboardingSteps,
    completeTenantOnboardingStep,
    ensureOnboardingReadyForReminder,
    finalizeTenantOnboarding,
    getFirstIncompleteOnboardingStep,
    normalizeOnboardingSteps,
    registerReminderAttempt,
    type TenantOnboardingState,
} from "../onboarding";

const baseState = (overrides?: Partial<TenantOnboardingState>): TenantOnboardingState => ({
    tenant_id: "tenant-1",
    status: "pending",
    current_step: "profile",
    steps: buildDefaultOnboardingSteps(),
    step_data: {},
    started_at: null,
    completed_at: null,
    last_reminder_sent_at: null,
    reminder_send_count: 0,
    reminder_window_started_at: null,
    ...overrides,
});

describe("onboarding helpers", () => {
    const originalCooldown = process.env.ONBOARDING_REMINDER_COOLDOWN_MINUTES;
    const originalDailyLimit = process.env.ONBOARDING_REMINDER_DAILY_LIMIT;

    beforeEach(() => {
        process.env.ONBOARDING_REMINDER_COOLDOWN_MINUTES = "30";
        process.env.ONBOARDING_REMINDER_DAILY_LIMIT = "3";
    });

    afterEach(() => {
        process.env.ONBOARDING_REMINDER_COOLDOWN_MINUTES = originalCooldown;
        process.env.ONBOARDING_REMINDER_DAILY_LIMIT = originalDailyLimit;
    });

    it("builds default onboarding steps as incomplete", () => {
        expect(buildDefaultOnboardingSteps()).toEqual({
            profile: false,
            lease_acknowledged: false,
            payment_readiness: false,
            support_handoff: false,
        });
    });

    it("normalizes unknown onboarding step payload safely", () => {
        expect(normalizeOnboardingSteps({ profile: true, unknown: true })).toEqual({
            profile: true,
            lease_acknowledged: false,
            payment_readiness: false,
            support_handoff: false,
        });
    });

    it("resolves first incomplete onboarding step", () => {
        const first = getFirstIncompleteOnboardingStep({
            profile: true,
            lease_acknowledged: false,
            payment_readiness: false,
            support_handoff: false,
        });
        expect(first).toBe("lease_acknowledged");
    });

    it("detects when all onboarding steps are complete", () => {
        expect(
            areAllOnboardingStepsComplete({
                profile: true,
                lease_acknowledged: true,
                payment_readiness: true,
                support_handoff: true,
            })
        ).toBe(true);
    });

    it("blocks reminders for completed onboarding", () => {
        const state = baseState({ status: "completed" });
        const result = ensureOnboardingReadyForReminder(state, new Date("2026-03-30T12:00:00.000Z"));
        expect(result).toEqual({
            eligible: false,
            reason: "completed",
            nextEligibleAt: null,
        });
    });

    it("enforces resend cooldown window", () => {
        const state = baseState({
            status: "in_progress",
            last_reminder_sent_at: "2026-03-30T11:45:00.000Z",
            reminder_send_count: 1,
            reminder_window_started_at: "2026-03-30T11:00:00.000Z",
        });

        const result = ensureOnboardingReadyForReminder(state, new Date("2026-03-30T12:00:00.000Z"));
        expect(result.eligible).toBe(false);
        if (!result.eligible) {
            expect(result.reason).toBe("cooldown");
            expect(result.nextEligibleAt).toBe("2026-03-30T12:15:00.000Z");
        }
    });

    it("enforces daily resend limit within active window", () => {
        const state = baseState({
            status: "in_progress",
            reminder_send_count: 3,
            reminder_window_started_at: "2026-03-30T06:00:00.000Z",
            last_reminder_sent_at: "2026-03-30T10:00:00.000Z",
        });

        const result = ensureOnboardingReadyForReminder(state, new Date("2026-03-30T12:00:00.000Z"));
        expect(result.eligible).toBe(false);
        if (!result.eligible) {
            expect(result.reason).toBe("daily_limit");
            expect(result.nextEligibleAt).toBe("2026-03-31T06:00:00.000Z");
        }
    });

    it("allows reminders when cooldown and daily limits are clear", () => {
        const state = baseState({
            status: "in_progress",
            reminder_send_count: 1,
            reminder_window_started_at: "2026-03-28T06:00:00.000Z",
            last_reminder_sent_at: "2026-03-29T06:00:00.000Z",
        });

        expect(ensureOnboardingReadyForReminder(state, new Date("2026-03-30T12:00:00.000Z"))).toEqual({
            eligible: true,
        });
    });

    it("records successful reminder telemetry and audit event", async () => {
        const updates: Array<Record<string, unknown>> = [];
        const events: Array<Record<string, unknown>> = [];
        const now = new Date("2026-03-30T12:00:00.000Z");

        const mockState = baseState({
            status: "in_progress",
            reminder_send_count: 1,
            reminder_window_started_at: "2026-03-30T08:00:00.000Z",
        });

        const mockClient = {
            from: (table: string) => {
                if (table === "tenant_onboarding_states") {
                    return {
                        select: () => ({
                            eq: () => ({
                                maybeSingle: async () => ({ data: mockState, error: null }),
                            }),
                        }),
                        update: (payload: Record<string, unknown>) => ({
                            eq: async () => {
                                updates.push(payload);
                                return { error: null };
                            },
                        }),
                    };
                }

                if (table === "tenant_onboarding_events") {
                    return {
                        insert: async (payload: Record<string, unknown>) => {
                            events.push(payload);
                            return { error: null };
                        },
                    };
                }

                throw new Error(`Unexpected table ${table}`);
            },
        };

        await registerReminderAttempt(mockClient as never, {
            tenantId: "tenant-1",
            actorId: "admin-1",
            triggerSource: "manual",
            success: true,
            metadata: { source: "test" },
            now,
        });

        expect(updates).toHaveLength(1);
        expect(updates[0].reminder_send_count).toBe(2);
        expect(updates[0].last_reminder_sent_at).toBe("2026-03-30T12:00:00.000Z");

        expect(events).toHaveLength(1);
        expect(events[0].event_type).toBe("reminder_sent");
        expect(events[0].trigger_source).toBe("manual");
    });

    it("records failed reminder telemetry and audit event", async () => {
        const events: Array<Record<string, unknown>> = [];
        const now = new Date("2026-03-30T12:00:00.000Z");

        const mockState = baseState({
            status: "in_progress",
            reminder_send_count: 0,
            reminder_window_started_at: null,
        });

        const mockClient = {
            from: (table: string) => {
                if (table === "tenant_onboarding_states") {
                    return {
                        select: () => ({
                            eq: () => ({
                                maybeSingle: async () => ({ data: mockState, error: null }),
                            }),
                        }),
                        update: () => ({
                            eq: async () => ({ error: null }),
                        }),
                    };
                }

                if (table === "tenant_onboarding_events") {
                    return {
                        insert: async (payload: Record<string, unknown>) => {
                            events.push(payload);
                            return { error: null };
                        },
                    };
                }

                throw new Error(`Unexpected table ${table}`);
            },
        };

        await registerReminderAttempt(mockClient as never, {
            tenantId: "tenant-1",
            actorId: "admin-1",
            triggerSource: "automated",
            success: false,
            metadata: { source: "test" },
            now,
        });

        expect(events).toHaveLength(1);
        expect(events[0].event_type).toBe("reminder_failed");
        expect(events[0].trigger_source).toBe("automated");
    });

    it("enforces ordered step transitions and advances to next step", async () => {
        const updates: Array<Record<string, unknown>> = [];
        const events: Array<Record<string, unknown>> = [];

        const mockState = baseState({
            status: "pending",
            current_step: "profile",
            steps: {
                profile: false,
                lease_acknowledged: false,
                payment_readiness: false,
                support_handoff: false,
            },
        });

        const mockClient = {
            from: (table: string) => {
                if (table === "tenant_onboarding_states") {
                    return {
                        select: () => ({
                            eq: () => ({
                                maybeSingle: async () => ({ data: mockState, error: null }),
                            }),
                        }),
                        update: (payload: Record<string, unknown>) => ({
                            eq: () => ({
                                select: () => ({
                                    single: async () => {
                                        updates.push(payload);
                                        return {
                                            data: {
                                                ...mockState,
                                                ...payload,
                                            },
                                            error: null,
                                        };
                                    },
                                }),
                            }),
                        }),
                    };
                }

                if (table === "tenant_onboarding_events") {
                    return {
                        insert: async (payload: Record<string, unknown>) => {
                            events.push(payload);
                            return { error: null };
                        },
                    };
                }

                throw new Error(`Unexpected table ${table}`);
            },
        };

        const result = await completeTenantOnboardingStep(mockClient as never, {
            tenantId: "tenant-1",
            step: "profile",
            actorId: "tenant-1",
            stepData: {
                full_name: "Test Tenant",
                phone: "+639171234567",
            },
        });

        expect(result.changed).toBe(true);
        expect(result.state.steps.profile).toBe(true);
        expect(result.state.status).toBe("in_progress");
        expect(updates[0].current_step).toBe("lease_acknowledged");
        expect(events.map((event) => event.event_type)).toEqual(["onboarding_started", "step_completed"]);
    });

    it("finalizes onboarding state and stamps completion", async () => {
        const events: Array<Record<string, unknown>> = [];

        const mockState = baseState({
            status: "in_progress",
            current_step: "support_handoff",
            steps: {
                profile: true,
                lease_acknowledged: true,
                payment_readiness: true,
                support_handoff: true,
            },
            started_at: "2026-03-30T10:00:00.000Z",
            completed_at: null,
        });

        const mockClient = {
            from: (table: string) => {
                if (table === "tenant_onboarding_states") {
                    return {
                        select: () => ({
                            eq: () => ({
                                maybeSingle: async () => ({ data: mockState, error: null }),
                            }),
                        }),
                        update: (payload: Record<string, unknown>) => ({
                            eq: () => ({
                                select: () => ({
                                    single: async () => ({
                                        data: {
                                            ...mockState,
                                            ...payload,
                                        },
                                        error: null,
                                    }),
                                }),
                            }),
                        }),
                    };
                }

                if (table === "tenant_onboarding_events") {
                    return {
                        insert: async (payload: Record<string, unknown>) => {
                            events.push(payload);
                            return { error: null };
                        },
                    };
                }

                throw new Error(`Unexpected table ${table}`);
            },
        };

        const result = await finalizeTenantOnboarding(mockClient as never, "tenant-1", "tenant-1");
        expect(result.status).toBe("completed");
        expect(result.completed_at).toBeTruthy();
        expect(events).toHaveLength(1);
        expect(events[0].event_type).toBe("onboarding_completed");
    });
});
