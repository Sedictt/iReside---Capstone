"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    TENANT_PRODUCT_TOUR_STEPS,
    type TenantProductTourState,
} from "@/lib/product-tour";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, MapPinned, SkipForward } from "lucide-react";

type TourApiPayload = {
    enabled?: boolean;
    eligible?: boolean;
    state?: TenantProductTourState | null;
    reason?: string;
    error?: string;
};

type StepProgressPayload = {
    success?: boolean;
    state?: TenantProductTourState;
    nextStep?: (typeof TENANT_PRODUCT_TOUR_STEPS)[number] | null;
    completed?: boolean;
    requiredStep?: (typeof TENANT_PRODUCT_TOUR_STEPS)[number] | null;
    error?: string;
};

const isTourEnabledClient = () => {
    const value = process.env.NEXT_PUBLIC_GUIDED_TENANT_PRODUCT_TOUR_ENABLED ?? "";
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

type TourUiState = {
    loading: boolean;
    submitting: boolean;
    tourState: TenantProductTourState | null;
    eligible: boolean;
    error: string | null;
};

type TourUiAction =
    | { type: "REFRESH_NOT_ENABLED" }
    | { type: "REFRESH_START" }
    | { type: "REFRESH_SUCCESS"; payload: { eligible: boolean; state: TenantProductTourState | null } }
    | { type: "REFRESH_ERROR"; error: string }
    | { type: "COMPLETE_STEP_START" }
    | { type: "COMPLETE_STEP_SUCCESS"; state: TenantProductTourState }
    | { type: "COMPLETE_STEP_ERROR"; error: string }
    | { type: "SKIP_TOUR_START" }
    | { type: "SKIP_TOUR_SUCCESS"; state: TenantProductTourState }
    | { type: "SKIP_TOUR_ERROR"; error: string };

const INITIAL_TOUR_UI_STATE: TourUiState = {
    loading: true,
    submitting: false,
    tourState: null,
    eligible: false,
    error: null,
};

function tourUiReducer(state: TourUiState, action: TourUiAction): TourUiState {
    switch (action.type) {
        case "REFRESH_NOT_ENABLED":
            return { ...state, loading: false };
        case "REFRESH_START":
            return { ...state, loading: true, error: null };
        case "REFRESH_SUCCESS":
            return { ...state, loading: false, eligible: action.payload.eligible, tourState: action.payload.state, error: null };
        case "REFRESH_ERROR":
            return { ...state, loading: false, error: action.error };
        case "COMPLETE_STEP_START":
            return { ...state, submitting: true, error: null };
        case "COMPLETE_STEP_SUCCESS":
            return { ...state, submitting: false, tourState: action.state, error: null };
        case "COMPLETE_STEP_ERROR":
            return { ...state, submitting: false, error: action.error };
        case "SKIP_TOUR_START":
            return { ...state, submitting: true, error: null };
        case "SKIP_TOUR_SUCCESS":
            return { ...state, submitting: false, tourState: action.state, error: null };
        case "SKIP_TOUR_ERROR":
            return { ...state, submitting: false, error: action.error };
        default:
            return state;
    }
}

export function TenantProductTourOverlay() {
    const pathname = usePathname();
    const router = useRouter();
    const [tourUi, dispatchTourUi] = useReducer(tourUiReducer, INITIAL_TOUR_UI_STATE);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

    // Derived state from tourUi
    const loading = tourUi.loading;
    const submitting = tourUi.submitting;
    const tourState = tourUi.tourState;
    const eligible = tourUi.eligible;
    const error = tourUi.error;

    const stepIndex = tourState?.current_step_index ?? 0;
    const activeStep = TENANT_PRODUCT_TOUR_STEPS[stepIndex] ?? null;
    const previousStep = stepIndex > 0 ? TENANT_PRODUCT_TOUR_STEPS[stepIndex - 1] : null;
    const isInProgress = tourState?.status === "in_progress";
    const isTourRoute = pathname.startsWith("/tenant/tour");
    const isOnStepRoute = Boolean(activeStep && pathname === activeStep.route);
    const isAnchorVisible = Boolean(anchorRect);
    const isLastStep = stepIndex >= TENANT_PRODUCT_TOUR_STEPS.length - 1;

    const refreshState = useCallback(async () => {
        if (!isTourEnabledClient()) {
            dispatchTourUi({ type: "REFRESH_NOT_ENABLED" });
            return;
        }

        try {
            const response = await fetch("/api/tenant/tour?start=0", { cache: "no-store" });
            const payload = (await response.json()) as TourApiPayload;
            if (!response.ok) {
                throw new Error(payload.error ?? "Failed to load tour state.");
            }

            dispatchTourUi({ type: "REFRESH_SUCCESS", payload: { eligible: Boolean(payload.enabled && payload.eligible), state: payload.state ?? null } });
        } catch (caught) {
            dispatchTourUi({ type: "REFRESH_ERROR", error: caught instanceof Error ? caught.message : "Failed to load tour state." });
        }
    }, []);

    useEffect(() => {
        void refreshState();
    }, [refreshState]);

    useEffect(() => {
        if (!isInProgress || !activeStep || !isOnStepRoute) {
            setAnchorRect(null);
            return;
        }

        let cancelled = false;
        const selector = `[data-tour-id="${activeStep.anchorId}"]`;

        const updateAnchorRect = () => {
            if (cancelled) return;
            const target = document.querySelector<HTMLElement>(selector);
            if (!target) {
                setAnchorRect(null);
                return;
            }
            setAnchorRect(target.getBoundingClientRect());
        };

        updateAnchorRect();
        const interval = window.setInterval(updateAnchorRect, 600);
        window.addEventListener("resize", updateAnchorRect);
        window.addEventListener("scroll", updateAnchorRect, true);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
            window.removeEventListener("resize", updateAnchorRect);
            window.removeEventListener("scroll", updateAnchorRect, true);
        };
    }, [activeStep, isInProgress, isOnStepRoute]);

    const completeCurrentStep = useCallback(async () => {
        if (!activeStep) return;
        dispatchTourUi({ type: "COMPLETE_STEP_START" });

        try {
            const response = await fetch("/api/tenant/tour/step", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    stepId: activeStep.id,
                    route: pathname,
                    anchorId: activeStep.anchorId,
                    anchorFound: isAnchorVisible,
                    metadata: {
                        fallback_used: !isAnchorVisible,
                    },
                }),
            });

            const payload = (await response.json()) as StepProgressPayload;
            if (!response.ok || !payload.state) {
                throw new Error(payload.error ?? "Failed to complete step.");
            }

            dispatchTourUi({ type: "COMPLETE_STEP_SUCCESS", state: payload.state });
            if (payload.completed) {
                router.push("/tenant/tour?completed=1");
                return;
            }

            const nextStep = payload.nextStep ?? TENANT_PRODUCT_TOUR_STEPS[payload.state.current_step_index] ?? null;
            if (nextStep && nextStep.route !== pathname) {
                router.push(nextStep.route);
            }
        } catch (caught) {
            dispatchTourUi({ type: "COMPLETE_STEP_ERROR", error: caught instanceof Error ? caught.message : "Failed to complete step." });
        }
    }, [activeStep, isAnchorVisible, pathname, router]);

    const skipTour = useCallback(async () => {
        if (!activeStep) return;
        dispatchTourUi({ type: "SKIP_TOUR_START" });

        try {
            const response = await fetch("/api/tenant/tour/skip", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    stepId: activeStep.id,
                    metadata: {
                        route: pathname,
                    },
                }),
            });

            const payload = (await response.json()) as { state?: TenantProductTourState; error?: string };
            if (!response.ok || !payload.state) {
                throw new Error(payload.error ?? "Failed to skip tour.");
            }

            dispatchTourUi({ type: "SKIP_TOUR_SUCCESS", state: payload.state });
        } catch (caught) {
            dispatchTourUi({ type: "SKIP_TOUR_ERROR", error: caught instanceof Error ? caught.message : "Failed to skip tour." });
        }
    }, [activeStep, pathname]);

    useEffect(() => {
        if (!isInProgress || !activeStep || !isOnStepRoute) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            const tagName = (event.target as HTMLElement | null)?.tagName;
            if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
                return;
            }

            if (event.key === "ArrowRight" || event.key === "Enter") {
                event.preventDefault();
                void completeCurrentStep();
            }
            if ((event.key === "ArrowLeft" || event.key === "Backspace") && previousStep) {
                event.preventDefault();
                router.push(previousStep.route);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeStep, completeCurrentStep, isInProgress, isOnStepRoute, previousStep, router]);

    const panelTitle = useMemo(() => {
        if (!activeStep) return "Guided Tour";
        return `${stepIndex + 1}/${TENANT_PRODUCT_TOUR_STEPS.length}: ${activeStep.title}`;
    }, [activeStep, stepIndex]);

    if (!isTourEnabledClient() || loading || !eligible || !isInProgress || !activeStep || isTourRoute) {
        return null;
    }

    if (!isOnStepRoute) {
        return (
            <div className="fixed bottom-5 right-5 z-[95] w-[22rem] rounded-2xl border border-primary/30 bg-neutral-950/95 p-4 shadow-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Guided Tour</p>
                <h3 className="mt-1 text-base font-black text-white">{panelTitle}</h3>
                <p className="mt-2 text-sm text-neutral-300">{activeStep.description}</p>
                <div className="mt-4 flex gap-2">
                    <button
                        type="button"
                        onClick={() => router.push(activeStep.route)}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-black text-black"
                    >
                        <MapPinned className="size-4" />
                        Go to step
                    </button>
                    <button
                        type="button"
                        onClick={() => void skipTour()}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
                    >
                        <SkipForward className="size-4" />
                        Skip
                    </button>
                </div>
                {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
            </div>
        );
    }

    return (
        <>
            {isAnchorVisible && anchorRect && (
                <div
                    className="pointer-events-none fixed z-[90] rounded-2xl border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] transition-all"
                    style={{
                        top: Math.max(anchorRect.top - 8, 8),
                        left: Math.max(anchorRect.left - 8, 8),
                        width: anchorRect.width + 16,
                        height: anchorRect.height + 16,
                    }}
                />
            )}

            <div className="fixed bottom-5 right-5 z-[95] w-[24rem] rounded-2xl border border-white/20 bg-neutral-950/95 p-4 shadow-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Guided Tour</p>
                <h3 className="mt-1 text-base font-black text-white">{panelTitle}</h3>
                <p className="mt-2 text-sm text-neutral-300">{activeStep.description}</p>

                {!isAnchorVisible && (
                    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                        <div className="flex items-center gap-2 font-black text-amber-300">
                            <AlertTriangle className="size-3.5" />
                            Fallback guidance enabled
                        </div>
                        <p className="mt-1 leading-relaxed">{activeStep.fallback}</p>
                    </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => previousStep && router.push(previousStep.route)}
                        disabled={!previousStep || submitting}
                        className="inline-flex items-center gap-1 rounded-xl border border-white/20 px-3 py-2 text-xs font-black text-white disabled:opacity-40"
                    >
                        <ArrowLeft className="size-3.5" />
                        Previous
                    </button>
                    <button
                        type="button"
                        onClick={() => void completeCurrentStep()}
                        disabled={submitting}
                        className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-black text-black disabled:opacity-60"
                    >
                        {isLastStep ? <CheckCircle2 className="size-3.5" /> : <ArrowRight className="size-3.5" />}
                        {isLastStep ? "Finish Tour" : "Next Step"}
                    </button>
                    <button
                        type="button"
                        onClick={() => void skipTour()}
                        disabled={submitting}
                        className="inline-flex items-center gap-1 rounded-xl border border-white/20 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
                    >
                        <SkipForward className="size-3.5" />
                        Skip
                    </button>
                </div>
                <p className="mt-3 text-[11px] text-neutral-400">
                    Keyboard shortcuts: <span className="font-black text-neutral-200">Enter / →</span> next,{" "}
                    <span className="font-black text-neutral-200">←</span> previous.
                </p>
                {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
            </div>
        </>
    );
}

