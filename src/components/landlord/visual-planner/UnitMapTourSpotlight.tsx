"use client";

import React from "react";
import { ArrowRight, ArrowLeft, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UnitMapTourStep {
    id: number;
    title: string;
    description: string;
    targetElementLabel: string;
    tip?: string;
}

export const UNIT_MAP_TOUR_STEPS: UnitMapTourStep[] = [
    {
        id: 1,
        title: "Step 1: Automatic Distribution & Renumbering",
        description: "Quickly distribute units evenly across floors, bulk allocate unit counts, or renumber sequential prefixes automatically.",
        targetElementLabel: "Distribution & Renumber Actions",
        tip: "Use 'Distribute Evenly' or 'Bulk Distribute' to allocate units across levels automatically.",
    },
    {
        id: 2,
        title: "Step 2: Drag & Drop to Organize Units",
        description: "Drag unit cards directly between floor lanes to customize assignments. Grab any unit card by its handle and drop it into your desired level or unassigned holding area.",
        targetElementLabel: "Draggable Unit Card & Floor Dropzone",
        tip: "Hovering over any floor lane reveals its drop target ring. Release to immediately update the unit's floor level and number.",
    },
    {
        id: 3,
        title: "Step 3: Add & Manage Floor Levels",
        description: "Need additional levels or basements? Click '+ Add Floor' to create more stories. You can also reorder levels or delete empty floors.",
        targetElementLabel: "+ Add Floor Button",
        tip: "Floors can be reordered by number, and units will carry their floor prefixes automatically.",
    },
    {
        id: 4,
        title: "Step 4: Generate Interactive Unit Map",
        description: "When all units have a floor assignment, click 'Generate Unit-map' in the header. iReside will synthesize your 2D architectural blueprint layout.",
        targetElementLabel: "Generate Unit-map Button",
        tip: "After generation, you can pick a hallway architectural preset or freely drag units on the canvas.",
    },
];

export interface UnitMapTourSpotlightProps {
    isOpen: boolean;
    currentStepIndex: number;
    onNext: () => void;
    onPrev: () => void;
    onClose: () => void;
    onGenerate: () => void;
    isGenerating?: boolean;
    isAllAssigned?: boolean;
}

export function UnitMapTourSpotlight({
    isOpen,
    currentStepIndex,
    onNext,
    onPrev,
    onClose,
    onGenerate,
    isGenerating = false,
    isAllAssigned = false,
}: UnitMapTourSpotlightProps) {
    if (!isOpen) return null;

    const step = UNIT_MAP_TOUR_STEPS[currentStepIndex] || UNIT_MAP_TOUR_STEPS[0];
    const isFirst = currentStepIndex === 0;
    const isLast = currentStepIndex === UNIT_MAP_TOUR_STEPS.length - 1;

    return (
        <div 
            className="fixed bottom-6 right-6 z-[250] max-w-[420px] w-full pointer-events-auto"
            role="dialog"
            aria-modal="false"
            aria-labelledby="unit-map-tour-title"
        >
            <div className="rounded-3xl border border-primary/30 bg-card/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                            {step.id}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            Tour: Step {step.id} of {UNIT_MAP_TOUR_STEPS.length}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        aria-label="Exit tour"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Target Highlight Beacon Pill */}
                {step.targetElementLabel && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary">
                        <span className="relative flex size-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full size-2 bg-primary"></span>
                        </span>
                        <span className="truncate">Highlighted: {step.targetElementLabel}</span>
                    </div>
                )}

                {/* Content */}
                <div className="space-y-1.5">
                    <h3 id="unit-map-tour-title" className="text-base font-bold text-foreground tracking-tight">
                        {step.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {step.description}
                    </p>
                </div>

                {step.tip && (
                    <div className="rounded-xl bg-primary/5 border border-primary/15 p-2.5 text-[11px] text-muted-foreground leading-snug">
                        <span className="font-semibold text-primary">Note: </span>
                        {step.tip}
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                    <button
                        type="button"
                        onClick={onPrev}
                        disabled={isFirst}
                        className={cn(
                            "h-9 px-3 rounded-xl border border-border text-xs font-semibold flex items-center gap-1.5 transition-all",
                            isFirst ? "opacity-30 cursor-not-allowed" : "hover:bg-muted cursor-pointer"
                        )}
                    >
                        <ArrowLeft className="size-3" />
                        <span>Back</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {!isLast ? (
                            <button
                                type="button"
                                onClick={onNext}
                                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                                <span>Next</span>
                                <ArrowRight className="size-3" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onGenerate}
                                disabled={isGenerating}
                                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-all cursor-pointer shadow-md shadow-primary/25 active:scale-95 disabled:opacity-50"
                            >
                                <CheckCircle2 className="size-3.5" />
                                <span>{isGenerating ? "Generating..." : "Generate Unit-map"}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
