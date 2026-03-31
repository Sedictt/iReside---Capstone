"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, SkipForward, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TENANT_LEASE_TOUR_STEPS as TOUR_STEPS } from "@/lib/product-tour";

export function LeaseTour() {
    const [stepIndex, setStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        // Check if the user has already seen the tour
        const hasSeenTour = localStorage.getItem("ireside_lease_tour_completed");
        if (!hasSeenTour) {
            // Add a small delay for the UI to settle
            const timer = setTimeout(() => setIsVisible(true), 1000);
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
                // Smooth scroll to the element if it's not fully in view
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
        
        // Listen to scroll and resize to update highlight position
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
        localStorage.setItem("ireside_lease_tour_completed", "true");
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
            {/* The Dimmed Background layer with Highlight Hole */}
            {hasHighlight ? (
                <div 
                    className="absolute rounded-xl border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] transition-all duration-300 pointer-events-none bg-transparent"
                    style={{
                        top: anchorRect.top - 8,
                        left: anchorRect.left - 8,
                        width: anchorRect.width + 16,
                        height: anchorRect.height + 16,
                    }}
                />
            ) : (
                <div className="absolute inset-0 bg-black/65 transition-opacity duration-300 pointer-events-auto" />
            )}

            {/* Tour Tooltip */}
            <div 
                className={cn(
                    "fixed z-[101] w-[320px] bg-card border border-border/60 rounded-2xl shadow-2xl p-5 pointer-events-auto transition-all duration-300 ease-in-out",
                    !hasHighlight && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                )}
                style={hasHighlight ? {
                    // Position dynamically based on the highlight
                    top: anchorRect.bottom + 24 + 200 > window.innerHeight 
                        ? Math.max(16, anchorRect.top - 200) // Position above if no space below
                        : anchorRect.bottom + 24, // Position below
                    left: Math.max(16, Math.min(window.innerWidth - 340, anchorRect.left)),
                } : {}}
            >
                <div className="flex items-start justify-between mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                        Guided Tour ({stepIndex + 1}/{TOUR_STEPS.length})
                    </p>
                    <button 
                        onClick={completeTour}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Close tour"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                <h3 className="text-lg font-bold text-foreground mb-2">
                    {activeStep.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    {activeStep.description}
                </p>

                <div className="flex items-center justify-between mt-auto">
                    <button
                        onClick={completeTour}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                        <SkipForward className="w-3.5 h-3.5" />
                        Skip
                    </button>
                    
                    <div className="flex items-center gap-2">
                        {stepIndex > 0 && (
                            <button
                                onClick={prevStep}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={nextStep}
                            className="h-8 px-4 flex items-center justify-center gap-2 rounded-lg bg-primary text-black font-bold text-xs hover:bg-primary/90 transition-colors"
                        >
                            {isLastStep ? "Finish" : "Next"}
                            {isLastStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
