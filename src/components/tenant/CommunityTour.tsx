"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, SkipForward, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TENANT_COMMUNITY_TOUR_STEPS as TOUR_STEPS } from "@/lib/product-tour";

export function CommunityTour() {
    const [stepIndex, setStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        // Check if the user has already seen the community tour
        const hasSeenTour = localStorage.getItem("ireside_community_tour_completed");
        if (!hasSeenTour) {
            // Add a small delay for the UI to settle
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const activeStep = TOUR_STEPS[stepIndex];
    const isLastStep = stepIndex === TOUR_STEPS.length - 1;

    useEffect(() => {
        if (!isVisible || !activeStep || !activeStep.anchorId) {
            setAnchorRect(null);
            return;
        }

        const selector = `[data-tour-id="${activeStep.anchorId}"]`;
        let element = document.querySelector<HTMLElement>(selector);

        const updateRect = () => {
            element = document.querySelector<HTMLElement>(selector);
            if (element) {
                setAnchorRect(element.getBoundingClientRect());
                const rect = element.getBoundingClientRect();
                const isInView = (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                );
                
                if (!isInView) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                setAnchorRect(null);
            }
        };

        updateRect();
        const interval = setInterval(updateRect, 500);
        
        window.addEventListener("scroll", updateRect, true);
        window.addEventListener("resize", updateRect, true);

        return () => {
            clearInterval(interval);
            window.removeEventListener("scroll", updateRect, true);
            window.removeEventListener("resize", updateRect, true);
        };
    }, [activeStep, isVisible]);

    const completeTour = () => {
        setIsVisible(false);
        localStorage.setItem("ireside_community_tour_completed", "true");
    };

    const nextStep = () => {
        if (isLastStep) {
            completeTour();
        } else {
            setStepIndex((prev) => prev + 1);
        }
    };

    const prevStep = () => {
        setStepIndex((prev) => Math.max(0, prev - 1));
    };

    if (!isVisible || !activeStep) return null;

    const hasHighlight = activeStep.anchorId && anchorRect;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {hasHighlight ? (
                <div 
                    className="absolute rounded-2xl border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] transition-all duration-300 pointer-events-none bg-transparent"
                    style={{
                        top: anchorRect.top - 8,
                        left: anchorRect.left - 8,
                        width: anchorRect.width + 16,
                        height: anchorRect.height + 16,
                    }}
                />
            ) : (
                <div className="absolute inset-0 bg-black/70 transition-opacity duration-300 pointer-events-auto" />
            )}

            <div 
                className={cn(
                    "fixed z-[101] w-[340px] bg-[#121212] border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-6 pointer-events-auto transition-all duration-300 ease-in-out backdrop-blur-xl",
                    !hasHighlight && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                )}
                style={hasHighlight ? {
                    top: anchorRect.bottom + 24 + 200 > window.innerHeight 
                        ? Math.max(16, anchorRect.top - 200)
                        : anchorRect.bottom + 24,
                    left: Math.max(16, Math.min(window.innerWidth - 356, anchorRect.left)),
                } : {}}
            >
                <div className="flex items-start justify-between mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                        Community Tour ({stepIndex + 1}/{TOUR_STEPS.length})
                    </p>
                    <button 
                        onClick={completeTour}
                        className="text-white/40 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                    {activeStep.title}
                </h3>
                
                <p className="text-sm text-white/60 mb-8 leading-relaxed">
                    {activeStep.description}
                </p>

                <div className="flex items-center justify-between mt-auto">
                    <button
                        onClick={completeTour}
                        className="text-xs font-semibold text-white/40 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                        <SkipForward className="w-3.5 h-3.5" />
                        Skip tour
                    </button>
                    
                    <div className="flex items-center gap-2">
                        {stepIndex > 0 && (
                            <button
                                onClick={prevStep}
                                className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={nextStep}
                            className="h-10 px-5 flex items-center justify-center gap-2 rounded-xl bg-primary text-black font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                        >
                            {isLastStep ? "Finish" : "Next"}
                            {isLastStep ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
