"use client";

import React, { useState, useEffect, useCallback } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { 
    X, 
    ChevronLeft, 
    ChevronRight, 
    CheckCircle2, 
    ExternalLink, 
    Maximize2, 
    Minimize2, 
    Sparkles, 
    Image as ImageIcon,
    HelpCircle,
    RotateCcw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
    type MissionConfig, 
    type MissionSlide, 
    MISSION_ICONS 
} from "@/lib/missions-config";

interface MissionSlideshowModalProps {
    mission: MissionConfig | null;
    isOpen: boolean;
    onClose: () => void;
    onCompleteMission?: (missionId: string) => void;
    isCompleted?: boolean;
}

export function MissionSlideshowModal({
    mission,
    isOpen,
    onClose,
    onCompleteMission,
    isCompleted = false,
}: MissionSlideshowModalProps) {
    const router = useRouter();
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});
    const [isCompleting, setIsCompleting] = useState(false);
    const [justCompleted, setJustCompleted] = useState(false);

    // Reset state when mission changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentSlideIndex(0);
            setJustCompleted(false);
        }
    }, [isOpen, mission?.id]);

    const slides: MissionSlide[] = mission?.slides || [];
    const totalSlides = slides.length;
    const currentSlide = slides[currentSlideIndex];
    const isLastSlide = currentSlideIndex === totalSlides - 1;
    const isFirstSlide = currentSlideIndex === 0;

    const handleNext = useCallback(() => {
        if (currentSlideIndex < totalSlides - 1) {
            setCurrentSlideIndex((prev) => prev + 1);
        }
    }, [currentSlideIndex, totalSlides]);

    const handlePrev = useCallback(() => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex((prev) => prev - 1);
        }
    }, [currentSlideIndex]);

    const handleFinish = async () => {
        if (!mission) return;
        setIsCompleting(true);
        try {
            // Call tour step completion API if needed
            const res = await fetch("/api/landlord/tour/quest/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questId: mission.id }),
            });

            // Mark mission completed in client
            if (onCompleteMission) {
                onCompleteMission(mission.id);
            }

            // Dispatch global event for trigger button & other components to refresh
            window.dispatchEvent(new CustomEvent("quest-progress-updated"));

            setJustCompleted(true);
            setTimeout(() => {
                setIsCompleting(false);
            }, 1200);
        } catch (err) {
            console.error("Failed to complete mission:", err);
            setIsCompleting(false);
        }
    };

    const handleGoToFeature = () => {
        if (!mission?.targetRoute) return;
        onClose();
        router.push(mission.targetRoute);
    };

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" || e.key === "Space") {
                e.preventDefault();
                if (isLastSlide) {
                    handleFinish();
                } else {
                    handleNext();
                }
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                handlePrev();
            } else if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isLastSlide, handleNext, handlePrev, onClose]);

    if (!isOpen || !mission) return null;

    const Icon = MISSION_ICONS[mission.iconName] || Sparkles;
    const progressPercent = Math.round(((currentSlideIndex + 1) / totalSlides) * 100);
    const hasImageError = currentSlide ? imageErrorMap[currentSlide.image] : false;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 md:p-6">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-background/80 backdrop-blur-xl"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 15 }}
                    transition={{ type: "spring", damping: 26, stiffness: 280 }}
                    className={cn(
                        "relative z-[151] flex flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-card/95 shadow-[0_0_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-300",
                        isFullscreen 
                            ? "h-[98vh] w-[98vw] max-w-none" 
                            : "h-[90vh] max-h-[880px] w-full max-w-5xl"
                    )}
                >
                    {/* Header */}
                    <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4 sm:px-8">
                        <div className="flex items-center gap-3.5">
                            <div className="flex size-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                                <Icon className="size-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-black tracking-tight text-foreground sm:text-lg">
                                        {mission.title}
                                    </h2>
                                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                                        {mission.category}
                                    </span>
                                </div>
                                <p className="text-[11px] font-medium text-muted-foreground">
                                    Step {currentSlideIndex + 1} of {totalSlides} • {mission.estimatedTime}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="flex size-9 items-center justify-center rounded-xl bg-white/5 text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
                                aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                            >
                                {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                            </button>
                            <button
                                onClick={onClose}
                                className="flex size-9 items-center justify-center rounded-xl bg-white/5 text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
                                aria-label="Close Slideshow"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>

                    {/* Thin Progress Line */}
                    <div className="relative h-1 w-full bg-white/5">
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-primary transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    {/* Main Stage (Screenshot Viewer) */}
                    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black/40 p-4 sm:p-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${mission.id}-${currentSlideIndex}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="relative flex size-full items-center justify-center"
                            >
                                {!hasImageError && currentSlide?.image ? (
                                    <div className="relative flex max-h-full max-w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-surface-1 shadow-2xl">
                                        <img
                                            src={currentSlide.image}
                                            alt={currentSlide.title}
                                            className="max-h-[52vh] w-auto max-w-full object-contain select-none"
                                            onError={() => {
                                                setImageErrorMap((prev) => ({
                                                    ...prev,
                                                    [currentSlide.image]: true,
                                                }));
                                            }}
                                        />
                                    </div>
                                ) : (
                                    /* Graceful Placeholder when image file has not yet been placed */
                                    <div className="flex max-w-md flex-col items-center justify-center rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-8 text-center backdrop-blur-md">
                                        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <ImageIcon className="size-7" />
                                        </div>
                                        <h3 className="mb-1 text-base font-black tracking-tight text-foreground">
                                            {currentSlide?.title}
                                        </h3>
                                        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                                            Custom screenshot ready for upload. Drop your annotated image at:
                                        </p>
                                        <code className="mb-4 rounded-xl border border-white/10 bg-black/50 px-3 py-1.5 font-mono text-[11px] text-primary select-all">
                                            {currentSlide?.image}
                                        </code>
                                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/70">
                                            <HelpCircle className="size-3.5" />
                                            <span>Place arrows and highlights directly on your screenshot file.</span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Floating Arrow Nav Buttons */}
                        <button
                            onClick={handlePrev}
                            disabled={isFirstSlide}
                            aria-label="Previous Slide"
                            className={cn(
                                "absolute left-4 z-10 flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-card/80 text-foreground shadow-xl backdrop-blur-md transition-all hover:bg-white/10 hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none",
                            )}
                        >
                            <ChevronLeft className="size-5" />
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={isLastSlide}
                            aria-label="Next Slide"
                            className={cn(
                                "absolute right-4 z-10 flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-card/80 text-foreground shadow-xl backdrop-blur-md transition-all hover:bg-white/10 hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none",
                            )}
                        >
                            <ChevronRight className="size-5" />
                        </button>
                    </div>

                    {/* Bottom Content & Navigation Bar */}
                    <div className="shrink-0 border-t border-white/5 bg-surface-1/90 p-5 sm:px-8 sm:py-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            {/* Slide Text Info */}
                            <div className="max-w-2xl space-y-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-black tracking-tight text-foreground sm:text-base">
                                        {currentSlide?.title}
                                    </h4>
                                    {currentSlide?.tip && (
                                        <span className="hidden rounded-lg bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 sm:inline-block">
                                            Tip
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                    {currentSlide?.description}
                                </p>
                            </div>

                            {/* Action Buttons & Step Dots */}
                            <div className="flex flex-wrap items-center justify-between gap-4 md:justify-end">
                                {/* Slide Step Dots / Indicators */}
                                <div className="flex items-center gap-1.5">
                                    {slides.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentSlideIndex(idx)}
                                            aria-label={`Jump to step ${idx + 1}`}
                                            className={cn(
                                                "h-2 rounded-full transition-all duration-300",
                                                idx === currentSlideIndex 
                                                    ? "w-6 bg-primary" 
                                                    : idx < currentSlideIndex 
                                                        ? "w-2 bg-primary/40" 
                                                        : "w-2 bg-white/10 hover:bg-white/20"
                                            )}
                                        />
                                    ))}
                                </div>

                                <div className="flex items-center gap-2.5">
                                    {/* Direct Link to Feature */}
                                    <button
                                        onClick={handleGoToFeature}
                                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-foreground transition-all hover:bg-white/10 hover:border-white/20"
                                    >
                                        <span>{mission.actionLabel}</span>
                                        <ExternalLink className="size-3.5 text-muted-foreground" />
                                    </button>

                                    {/* Next / Complete Button */}
                                    {!isLastSlide ? (
                                        <button
                                            onClick={handleNext}
                                            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95"
                                        >
                                            <span>Next Step</span>
                                            <ChevronRight className="size-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleFinish}
                                            disabled={isCompleting}
                                            className={cn(
                                                "flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-black transition-all shadow-lg active:scale-95",
                                                justCompleted || isCompleted
                                                    ? "bg-emerald-500 text-white shadow-emerald-500/25 hover:bg-emerald-600"
                                                    : "bg-primary text-primary-foreground shadow-primary/20 hover:brightness-110"
                                            )}
                                        >
                                            <CheckCircle2 className="size-4" />
                                            <span>
                                                {justCompleted 
                                                    ? "Completed!" 
                                                    : isCompleted 
                                                        ? "Mission Completed" 
                                                        : "Complete Mission"}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
