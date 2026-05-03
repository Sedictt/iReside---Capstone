"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    LANDLORD_PRODUCT_TOUR_STEPS,
    type LandlordProductTourState,
} from "@/lib/landlord-product-tour";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, MapPinned, SkipForward } from "lucide-react";

type TourApiPayload = {
    enabled?: boolean;
    eligible?: boolean;
    state?: LandlordProductTourState | null;
    reason?: string;
    error?: string;
};

type StepProgressPayload = {
    success?: boolean;
    state?: LandlordProductTourState;
    nextStep?: (typeof LANDLORD_PRODUCT_TOUR_STEPS)[number] | null;
    completed?: boolean;
    requiredStep?: (typeof LANDLORD_PRODUCT_TOUR_STEPS)[number] | null;
    error?: string;
};

const isTourEnabledClient = () => {
    const value = process.env.NEXT_PUBLIC_GUIDED_LANDLORD_PRODUCT_TOUR_ENABLED ?? "true";
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

export function LandlordProductTourOverlay() {
    const pathname = usePathname();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [tourState, setTourState] = useState<LandlordProductTourState | null>(null);
    const [eligible, setEligible] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

    const stepIndex = tourState?.current_step_index ?? 0;
    const activeStep = LANDLORD_PRODUCT_TOUR_STEPS[stepIndex] ?? null;
    const previousStep = stepIndex > 0 ? LANDLORD_PRODUCT_TOUR_STEPS[stepIndex - 1] : null;
    const isInProgress = tourState?.status === "in_progress";
    const isTourRoute = pathname.startsWith("/landlord/tour");
    const isOnStepRoute = Boolean(activeStep && pathname === activeStep.route);
    const isAnchorVisible = Boolean(anchorRect);
    const isLastStep = stepIndex >= LANDLORD_PRODUCT_TOUR_STEPS.length - 1;

    const refreshState = useCallback(async () => {
        if (!isTourEnabledClient()) {
            setLoading(false);
            return;
        }

        try {
            const startParam = pathname === "/landlord/dashboard" ? "1" : "0";
            const sourceParam = pathname === "/landlord/dashboard" ? "auto_portal_entry" : "manual";
            const response = await fetch(`/api/landlord/tour?start=${startParam}&source=${sourceParam}`, { cache: "no-store" });
            const payload = (await response.json()) as TourApiPayload;
            if (!response.ok) {
                throw new Error(payload.error ?? "Failed to load tour state.");
            }

            setEligible(Boolean(payload.enabled && payload.eligible));
            setTourState(payload.state ?? null);
            setError(null);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to load tour state.");
        } finally {
            setLoading(false);
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
        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/landlord/tour/step", {
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

            setTourState(payload.state);
            if (payload.completed) {
                router.push("/landlord/dashboard"); // Or a special tour completion page
                return;
            }

            const nextStep = payload.nextStep ?? LANDLORD_PRODUCT_TOUR_STEPS[payload.state.current_step_index] ?? null;
            if (nextStep && nextStep.route !== pathname) {
                router.push(nextStep.route);
            }
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to complete step.");
        } finally {
            setSubmitting(false);
        }
    }, [activeStep, isAnchorVisible, pathname, router]);

    const skipTour = useCallback(async () => {
        if (!activeStep) return;
        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/landlord/tour/skip", {
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

            const payload = (await response.json()) as { state?: LandlordProductTourState; error?: string };
            if (!response.ok || !payload.state) {
                throw new Error(payload.error ?? "Failed to skip tour.");
            }

            setTourState(payload.state);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to skip tour.");
        } finally {
            setSubmitting(false);
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

        const handleClick = (event: MouseEvent) => {
            if (!activeStep.anchorId) return;
            
            const target = event.target as HTMLElement;
            const anchor = document.querySelector(`[data-tour-id="${activeStep.anchorId}"]`);
            
            if (anchor && anchor.contains(target)) {
                // User interacted with the highlighted element, advance step
                void completeCurrentStep();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("mousedown", handleClick, true); // Use capture to ensure we catch it before navigation
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("mousedown", handleClick, true);
        };
    }, [activeStep, completeCurrentStep, isInProgress, isOnStepRoute, previousStep, router]);

    const panelTitle = useMemo(() => {
        if (!activeStep) return "Getting Started Guide";
        return `${stepIndex + 1}/${LANDLORD_PRODUCT_TOUR_STEPS.length}: ${activeStep.title}`;
    }, [activeStep, stepIndex]);

    if (!isTourEnabledClient() || loading || !eligible || !isInProgress || !activeStep || isTourRoute) {
        return null;
    }

    if (!isOnStepRoute) {
        return (
            <div className="fixed bottom-5 right-5 z-[95] w-[22rem] rounded-2xl border border-primary/30 bg-neutral-950/95 p-4 shadow-2xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Getting Started Guide</p>
                <h3 className="mt-1 text-base font-semibold text-white">{panelTitle}</h3>
                <p className="mt-2 text-sm text-neutral-300">{activeStep.description}</p>
                <div className="mt-4 flex gap-2">
                    <button
                        type="button"
                        onClick={() => router.push(activeStep.route)}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-black"
                    >
                        <MapPinned className="h-4 w-4" />
                        Go to step
                    </button>
                    <button
                        type="button"
                        onClick={() => void skipTour()}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                        <SkipForward className="h-4 w-4" />
                        Skip
                    </button>
                </div>
                {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
            </div>
        );
    }

    const isLightbox = !activeStep.anchorId;

    return (
        <>
            {isLightbox ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
                    <div className="relative w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-neutral-950 p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Getting Started Guide</p>
                        <h2 className="mt-2 text-3xl font-black text-white">{activeStep.title}</h2>
                        <p className="mt-4 text-lg leading-relaxed text-neutral-300">{activeStep.description}</p>
                        
                        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => void completeCurrentStep()}
                                disabled={submitting}
                                className="flex-1 rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                Start Tour
                            </button>
                            <button
                                type="button"
                                onClick={() => void skipTour()}
                                disabled={submitting}
                                className="flex-1 rounded-2xl border border-white/10 bg-transparent py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 transition-all hover:bg-white/5"
                            >
                                Not Now
                            </button>
                        </div>
                        {error && <p className="mt-4 text-center text-xs text-red-400">{error}</p>}
                    </div>
                </div>
            ) : (
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

                    {(activeStep as any).nonInteractive && (
                        <div className="fixed inset-0 z-[92] bg-transparent cursor-not-allowed" />
                    )}

                    <div className="fixed bottom-5 right-5 z-[95] w-[24rem] rounded-2xl border border-white/20 bg-neutral-950/95 p-4 shadow-2xl">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Getting Started Guide</p>
                        <h3 className="mt-1 text-base font-semibold text-white">{panelTitle}</h3>
                        <p className="mt-2 text-sm text-neutral-300">{activeStep.description}</p>

                        {!isAnchorVisible && (activeStep as any).fallback && (
                            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                                <div className="flex items-center gap-2 font-semibold text-amber-300">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Context Guide
                                </div>
                                <p className="mt-1 leading-relaxed">{(activeStep as any).fallback}</p>
                            </div>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => previousStep && router.push(previousStep.route)}
                                disabled={!previousStep || submitting}
                                className="inline-flex items-center gap-1 rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Previous
                            </button>
                            <button
                                type="button"
                                onClick={() => void completeCurrentStep()}
                                disabled={submitting}
                                className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-black disabled:opacity-60"
                            >
                                {isLastStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                                {isLastStep ? "Finish Tour" : "Next Step"}
                            </button>
                            <button
                                type="button"
                                onClick={() => void skipTour()}
                                disabled={submitting}
                                className="inline-flex items-center gap-1 rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                            >
                                <SkipForward className="h-3.5 w-3.5" />
                                Skip
                            </button>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                            <p className="text-[10px] text-neutral-400">
                                Keyboard: <span className="font-semibold text-neutral-200">Enter / →</span> next,{" "}
                                <span className="font-semibold text-neutral-200">←</span> prev.
                            </p>
                            <p className="text-[10px] font-bold text-primary/80">iReside Landlord Portal</p>
                        </div>
                        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
                    </div>
                </>
            )}
        </>
    );
}
