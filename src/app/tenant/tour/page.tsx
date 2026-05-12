"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    TENANT_PRODUCT_TOUR_STEPS,
    getTenantProductTourRequiredStep,
    type TenantProductTourState,
} from "@/lib/product-tour";
import { CheckCircle2, Loader2, PlayCircle, RotateCcw, SkipForward } from "lucide-react";

type TourResponse = {
    enabled?: boolean;
    eligible?: boolean;
    reason?: string;
    state?: TenantProductTourState | null;
    requiredStep?: (typeof TENANT_PRODUCT_TOUR_STEPS)[number] | null;
    error?: string;
};

const reasonLabel: Record<string, string> = {
    feature_disabled: "Feature flag is disabled.",
    non_tenant: "Only tenant accounts can access this tour.",
    onboarding_incomplete: "Complete onboarding before starting the product tour.",
    completed: "You have already completed this tour.",
    skip_cooldown: "Tour auto-start is suppressed because you recently skipped it.",
};

export default function TenantTourPage() {
    const { push } = useRouter();
    const { get } = useSearchParams();
    const source = get("source") ?? "manual";

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const [eligible, setEligible] = useState(false);
    const [reason, setReason] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [state, setState] = useState<TenantProductTourState | null>(null);
    const [requiredStep, setRequiredStep] = useState<(typeof TENANT_PRODUCT_TOUR_STEPS)[number] | null>(null);

    const loadTour = useCallback(
        async (start = true) => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `/api/tenant/tour?start=${start ? "1" : "0"}&source=${encodeURIComponent(source)}`,
                    { cache: "no-store" }
                );
                const payload = (await response.json()) as TourResponse;
                if (!response.ok) {
                    throw new Error(payload.error ?? "Failed to load tour.");
                }

                setEnabled(Boolean(payload.enabled));
                setEligible(Boolean(payload.eligible));
                setReason(payload.reason ?? null);
                setState(payload.state ?? null);
                setRequiredStep(payload.requiredStep ?? (payload.state ? getTenantProductTourRequiredStep(payload.state) : null));
            } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Failed to load tour.");
            } finally {
                setLoading(false);
            }
        },
        [source]
    );

    useEffect(() => {
        void loadTour(true);
    }, [loadTour]);

    const progressLabel = useMemo(() => {
        if (!state) return `0/${TENANT_PRODUCT_TOUR_STEPS.length}`;
        const current = Math.min(state.current_step_index, TENANT_PRODUCT_TOUR_STEPS.length);
        return `${current}/${TENANT_PRODUCT_TOUR_STEPS.length}`;
    }, [state]);

    const openRequiredStep = () => {
        const step = requiredStep ?? (state ? getTenantProductTourRequiredStep(state) : null);
        if (!step) {
            push("/tenant/dashboard");
            return;
        }

        push(step.route);
    };

    const replayTour = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const response = await fetch("/api/tenant/tour/replay", {
                method: "POST",
            });
            const payload = (await response.json()) as { state?: TenantProductTourState; error?: string };
            if (!response.ok || !payload.state) {
                throw new Error(payload.error ?? "Failed to replay tour.");
            }
            setState(payload.state);
            setEligible(true);
            setRequiredStep(getTenantProductTourRequiredStep(payload.state));
            push((getTenantProductTourRequiredStep(payload.state) ?? TENANT_PRODUCT_TOUR_STEPS[0]).route);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to replay tour.");
        } finally {
            setSubmitting(false);
        }
    };

    const skipTour = async () => {
        const step = requiredStep ?? (state ? getTenantProductTourRequiredStep(state) : null);
        setSubmitting(true);
        setError(null);
        try {
            const response = await fetch("/api/tenant/tour/skip", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    stepId: step?.id,
                }),
            });
            const payload = (await response.json()) as { state?: TenantProductTourState; error?: string };
            if (!response.ok || !payload.state) {
                throw new Error(payload.error ?? "Failed to skip tour.");
            }
            setState(payload.state);
            setEligible(false);
            setReason("skip_cooldown");
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to skip tour.");
        } finally {
            setSubmitting(false);
        }
    };

    return loading ? (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading product tour...
            </div>
        </div>
    ) : (
        <div className="mx-auto max-w-3xl py-10 space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary font-black">Tenant Product Tour</p>
                <h1 className="text-3xl font-black tracking-tight">Explore your tenant portal in five guided steps</h1>
                <p className="text-sm text-muted-foreground">
                    This walkthrough highlights your dashboard, lease hub, payments, maintenance, and messaging workflows.
                </p>

                <div className="rounded-xl border border-border bg-background/50 px-4 py-3 text-sm">
                    Progress: <span className="font-black">{progressLabel}</span>
                </div>

                <div className="grid gap-2">
                    {TENANT_PRODUCT_TOUR_STEPS.map((step, index) => {
                        const completed = (state?.current_step_index ?? 0) > index || state?.status === "completed";
                        const active = requiredStep?.id === step.id && state?.status === "in_progress";
                        return (
                            <div
                                key={step.id}
                                className={`rounded-lg border p-3 ${active ? "border-primary/40 bg-primary/5" : "border-border bg-background/40"}`}
                            >
                                <p className="text-sm font-black flex items-center gap-2">
                                    {completed ? <CheckCircle2 className="size-4 text-green-500" /> : <span>{index + 1}.</span>}
                                    {step.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                            </div>
                        );
                    })}
                </div>

                {!enabled && <p className="text-sm text-amber-400">Guided tour is currently disabled.</p>}
                {reason && reasonLabel[reason] && <p className="text-sm text-muted-foreground">{reasonLabel[reason]}</p>}
                {error && <p className="text-sm text-red-400">{error}</p>}
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 flex flex-wrap gap-3">
                {state?.status === "completed" ? (
                    <button
                        type="button"
                        onClick={() => void replayTour()}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-black text-black disabled:opacity-60"
                    >
                        <RotateCcw className="size-4" />
                        Replay Tour
                    </button>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={openRequiredStep}
                            disabled={!eligible || submitting}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-black text-black disabled:opacity-60"
                        >
                            <PlayCircle className="size-4" />
                            {state?.status === "in_progress" ? "Resume Tour" : "Start Tour"}
                        </button>
                        <button
                            type="button"
                            onClick={() => void skipTour()}
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-black text-foreground disabled:opacity-60"
                        >
                            <SkipForward className="size-4" />
                            Skip for Now
                        </button>
                        <button
                            type="button"
                            onClick={() => void replayTour()}
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-black text-foreground disabled:opacity-60"
                        >
                            <RotateCcw className="size-4" />
                            Replay from Start
                        </button>
                    </>
                )}
                <Link href="/tenant/dashboard" className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-black">
                    Back to Dashboard
                </Link>
            </section>
        </div>
    );
}
