"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

type OnboardingStep = "profile" | "lease_acknowledged" | "payment_readiness" | "support_handoff";
type OnboardingStatus = "pending" | "in_progress" | "completed";

type OnboardingState = {
    tenant_id: string;
    status: OnboardingStatus;
    current_step: OnboardingStep;
    steps: Record<OnboardingStep, boolean>;
    step_data: Record<string, unknown>;
    completed_at: string | null;
};

const STEP_TITLES: Record<OnboardingStep, string> = {
    profile: "Complete your profile",
    lease_acknowledged: "Acknowledge lease readiness",
    payment_readiness: "Confirm payment readiness",
    support_handoff: "Review support guidance",
};

const STEP_DESCRIPTIONS: Record<OnboardingStep, string> = {
    profile: "Confirm your contact details so your landlord can reach you.",
    lease_acknowledged: "Confirm that you understand the lease signing process.",
    payment_readiness: "Confirm your preferred payment method and readiness for billing.",
    support_handoff: "Acknowledge where to get support during your tenancy.",
};

const ORDERED_STEPS: OnboardingStep[] = [
    "profile",
    "lease_acknowledged",
    "payment_readiness",
    "support_handoff",
];

const getNextIncompleteStep = (steps: Record<OnboardingStep, boolean>) =>
    ORDERED_STEPS.find((step) => !steps[step]) ?? null;

const getSafeDestinationCandidate = (candidate: string | null) => {
    if (!candidate) return null;
    if (!candidate.startsWith("/tenant/")) return null;
    if (candidate.startsWith("/tenant/onboarding")) return null;
    return candidate;
};

export default function TenantOnboardingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const destination = getSafeDestinationCandidate(searchParams.get("next"));
    const previewMode = ["1", "true", "yes"].includes((searchParams.get("preview") ?? "").toLowerCase());

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [state, setState] = useState<OnboardingState | null>(null);

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [preferredMethod, setPreferredMethod] = useState("gcash");

    const buildPreviewState = (): OnboardingState => ({
        tenant_id: "preview-tenant",
        status: "pending",
        current_step: "profile",
        steps: {
            profile: false,
            lease_acknowledged: false,
            payment_readiness: false,
            support_handoff: false,
        },
        step_data: {},
        completed_at: null,
    });

    const loadState = async () => {
        if (previewMode) {
            setState(buildPreviewState());
            setError(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/tenant/onboarding", { cache: "no-store" });
            const payload = (await response.json()) as {
                enabled?: boolean;
                state?: OnboardingState | null;
                error?: string;
            };

            if (!response.ok) {
                throw new Error(payload.error ?? "Failed to load onboarding state.");
            }

            if (payload.enabled === false) {
                router.replace("/tenant/dashboard");
                return;
            }

            const nextState = payload.state ?? null;
            if (!nextState) {
                throw new Error("Missing onboarding state.");
            }

            setState(nextState);
            const profileData = (nextState.step_data?.profile as Record<string, unknown> | undefined) ?? {};
            if (typeof profileData.full_name === "string") {
                setFullName(profileData.full_name);
            }
            if (typeof profileData.phone === "string") {
                setPhone(profileData.phone);
            }
            const paymentReadinessData = nextState.step_data?.payment_readiness;
            if (
                paymentReadinessData &&
                typeof paymentReadinessData === "object" &&
                !Array.isArray(paymentReadinessData) &&
                typeof (paymentReadinessData as Record<string, unknown>).preferred_method === "string"
            ) {
                setPreferredMethod((paymentReadinessData as Record<string, string>).preferred_method);
            }
        } catch (caught) {
            const message = caught instanceof Error ? caught.message : "Failed to load onboarding.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadState();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const activeStep = useMemo(() => {
        if (!state) return null;
        return getNextIncompleteStep(state.steps) ?? state.current_step;
    }, [state]);

    const completeStep = async (step: OnboardingStep, data: Record<string, unknown>) => {
        if (previewMode) {
            setSubmitting(true);
            setError(null);
            setState((previous) => {
                if (!previous) return previous;
                const nextSteps = {
                    ...previous.steps,
                    [step]: true,
                };
                const nextIncomplete = getNextIncompleteStep(nextSteps);
                const completed = nextIncomplete === null;

                return {
                    ...previous,
                    status: completed ? "completed" : "in_progress",
                    current_step: completed ? step : nextIncomplete,
                    steps: nextSteps,
                    step_data: {
                        ...previous.step_data,
                        [step]: data,
                    },
                    completed_at: completed ? new Date().toISOString() : null,
                };
            });
            setSubmitting(false);
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/tenant/onboarding/step", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ step, data }),
            });

            const payload = (await response.json()) as {
                success?: boolean;
                error?: string;
                state?: OnboardingState;
            };

            if (!response.ok || !payload.state) {
                throw new Error(payload.error ?? "Failed to complete onboarding step.");
            }

            setState(payload.state);
        } catch (caught) {
            const message = caught instanceof Error ? caught.message : "Failed to complete onboarding step.";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const finalizeOnboarding = async () => {
        if (previewMode) {
            router.replace(destination ?? "/tenant/dashboard");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/tenant/onboarding/complete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    next: destination ?? undefined,
                }),
            });

            const payload = (await response.json()) as {
                success?: boolean;
                error?: string;
                redirectTo?: string;
            };

            if (!response.ok || !payload.success) {
                throw new Error(payload.error ?? "Failed to finalize onboarding.");
            }

            router.replace(payload.redirectTo ?? destination ?? "/tenant/dashboard");
        } catch (caught) {
            const message = caught instanceof Error ? caught.message : "Failed to finalize onboarding.";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const onProfileSubmit = async (event: FormEvent) => {
        event.preventDefault();
        await completeStep("profile", {
            full_name: fullName,
            phone,
        });
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading onboarding...
                </div>
            </div>
        );
    }

    if (!state) {
        return (
            <div className="max-w-xl mx-auto py-16">
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                    {error ?? "Failed to load onboarding state."}
                </div>
            </div>
        );
    }

    const completedCount = ORDERED_STEPS.filter((step) => state.steps[step]).length;
    const isComplete = state.status === "completed";

    return (
        <div className="max-w-3xl mx-auto py-10 space-y-8">
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold">Tenant Onboarding</p>
                <h1 className="text-3xl font-bold tracking-tight">Let&apos;s get your account move-in ready</h1>
                <p className="text-sm text-muted-foreground">
                    Complete these required steps to unlock your full tenant portal access.
                </p>
                {previewMode && (
                    <p className="text-xs text-amber-400">
                        Preview mode enabled. This walkthrough does not update tenant onboarding records.
                    </p>
                )}

                <div className="pt-2 grid gap-3">
                    {ORDERED_STEPS.map((step) => {
                        const done = state.steps[step];
                        const current = !done && activeStep === step;
                        return (
                            <div
                                key={step}
                                className={`rounded-xl border p-3 flex items-start gap-3 ${
                                    current ? "border-primary/40 bg-primary/5" : "border-border bg-background/40"
                                }`}
                            >
                                <div className="mt-0.5">
                                    {done ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Circle className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-semibold">{STEP_TITLES[step]}</p>
                                    <p className="text-xs text-muted-foreground">{STEP_DESCRIPTIONS[step]}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <p className="text-xs text-muted-foreground">
                    Progress: {completedCount}/{ORDERED_STEPS.length} required steps complete
                </p>
            </section>

            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">{error}</div>
            )}

            {!isComplete && activeStep === "profile" && (
                <form onSubmit={onProfileSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <h2 className="text-lg font-semibold">Profile Information</h2>
                    <div className="space-y-2">
                        <label htmlFor="full-name" className="text-sm font-medium">
                            Full name
                        </label>
                        <input
                            id="full-name"
                            type="text"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium">
                            Phone number
                        </label>
                        <input
                            id="phone"
                            type="text"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                        {submitting ? "Saving..." : "Save and Continue"}
                    </button>
                </form>
            )}

            {!isComplete && activeStep === "lease_acknowledged" && (
                <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <h2 className="text-lg font-semibold">Lease Acknowledgement</h2>
                    <p className="text-sm text-muted-foreground">
                        I understand that my lease must be fully reviewed and signed before move-in can proceed.
                    </p>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => completeStep("lease_acknowledged", { acknowledged: true })}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                        {submitting ? "Saving..." : "Acknowledge and Continue"}
                    </button>
                </section>
            )}

            {!isComplete && activeStep === "payment_readiness" && (
                <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <h2 className="text-lg font-semibold">Payment Readiness</h2>
                    <p className="text-sm text-muted-foreground">
                        Confirm that you are ready to use the tenant payment portal.
                    </p>
                    <div className="space-y-2">
                        <label htmlFor="preferred-method" className="text-sm font-medium">
                            Preferred payment method
                        </label>
                        <select
                            id="preferred-method"
                            value={preferredMethod}
                            onChange={(event) => setPreferredMethod(event.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        >
                            <option value="gcash">GCash</option>
                            <option value="maya">Maya</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cash">Cash</option>
                        </select>
                    </div>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() =>
                            completeStep("payment_readiness", {
                                ready: true,
                                preferred_method: preferredMethod,
                            })
                        }
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                        {submitting ? "Saving..." : "Confirm and Continue"}
                    </button>
                </section>
            )}

            {!isComplete && activeStep === "support_handoff" && (
                <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <h2 className="text-lg font-semibold">Support Handoff</h2>
                    <p className="text-sm text-muted-foreground">
                        For account concerns, contact your landlord first. For platform issues, use support channels in the tenant portal.
                    </p>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => completeStep("support_handoff", { confirmed: true })}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                        {submitting ? "Saving..." : "Confirm Guidance"}
                    </button>
                </section>
            )}

            {(isComplete || completedCount === ORDERED_STEPS.length) && (
                <section className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-green-500">Onboarding complete</h2>
                    <p className="text-sm text-muted-foreground">
                        Your account is now ready. Continue to your tenant portal.
                    </p>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => void finalizeOnboarding()}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                        {submitting ? "Finalizing..." : "Go to Tenant Dashboard"}
                    </button>
                </section>
            )}
        </div>
    );
}
