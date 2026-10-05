"use client";

import React, { useEffect } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { 
    X, 
    Layers, 
    ArrowRight, 
    CheckCircle2,
    Building2,
    Move,
    Footprints,
    TreePine
} from "lucide-react";
import { cn } from "@/lib/utils";

export type LayoutPresetType = "double-loaded" | "single-loaded" | "u-shape" | "l-shape";

interface PresetOption {
    id: LayoutPresetType;
    title: string;
    laymanSubtitle: string;
    badgeText: string;
    isRecommended?: boolean;
    description: string;
    diagram: React.ReactNode;
}

interface FirstTimePresetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onChooseManual: () => void;
    onSelectPreset: (presetType: LayoutPresetType) => void;
    isDark?: boolean;
    unitCount?: number;
    floorCount?: number;
}

export const FirstTimePresetModal = ({
    isOpen,
    onClose,
    onChooseManual,
    onSelectPreset,
    isDark = false,
    unitCount = 0,
    floorCount = 1,
}: FirstTimePresetModalProps) => {
    // Handle Escape key to dismiss/switch to manual layout
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onChooseManual();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onChooseManual]);

    const presets: PresetOption[] = [
        {
            id: "double-loaded",
            title: "Double Loaded",
            laymanSubtitle: "Rooms on Both Sides of Hallway",
            badgeText: "Most Common • Recommended",
            isRecommended: true,
            description: "Rooms face each other along a central hallway. The standard, most popular layout for apartments, dorms, and boarding houses.",
            diagram: (
                <div className="flex h-28 sm:h-32 w-full flex-col justify-between rounded-xl border-2 border-border/80 bg-muted/40 p-3 shadow-inner">
                    {/* Top unit row */}
                    <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4].map((i) => (
                            <div 
                                key={`dl-top-${i}`} 
                                className="h-7 sm:h-8 flex-1 rounded-lg bg-primary/15 border-2 border-primary/40 flex items-center justify-center font-bold text-xs text-primary shadow-xs"
                            >
                                Room
                            </div>
                        ))}
                    </div>
                    {/* Central Corridor */}
                    <div className="h-6 sm:h-7 w-full rounded-lg bg-blue-500/15 border-2 border-blue-500/35 flex items-center justify-center gap-1.5 px-2">
                        <Footprints className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                            Central Hallway
                        </span>
                    </div>
                    {/* Bottom unit row */}
                    <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4].map((i) => (
                            <div 
                                key={`dl-bot-${i}`} 
                                className="h-7 sm:h-8 flex-1 rounded-lg bg-primary/15 border-2 border-primary/40 flex items-center justify-center font-bold text-xs text-primary shadow-xs"
                            >
                                Room
                            </div>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            id: "single-loaded",
            title: "Single Loaded",
            laymanSubtitle: "Rooms in One Single Line",
            badgeText: "Single Row",
            description: "All rooms in a single row with an open walkway or front balcony. Best for open-air motel or studio corridor styles.",
            diagram: (
                <div className="flex h-28 sm:h-32 w-full flex-col justify-center gap-3 rounded-xl border-2 border-border/80 bg-muted/40 p-3 shadow-inner">
                    {/* Single unit row */}
                    <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4].map((i) => (
                            <div 
                                key={`sl-top-${i}`} 
                                className="h-10 sm:h-12 flex-1 rounded-lg bg-primary/15 border-2 border-primary/40 flex items-center justify-center font-bold text-xs text-primary shadow-xs"
                            >
                                Room
                            </div>
                        ))}
                    </div>
                    {/* Open walkway */}
                    <div className="h-6 sm:h-7 w-full rounded-lg bg-blue-500/15 border-2 border-blue-500/35 flex items-center justify-center gap-1.5 px-2">
                        <Footprints className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                            Front Walkway / Balcony
                        </span>
                    </div>
                </div>
            ),
        },
        {
            id: "u-shape",
            title: "U-Shape",
            laymanSubtitle: "Three Wings Around Courtyard",
            badgeText: "Courtyard Center",
            description: "Rooms wrap around three sides surrounding an open garden, patio, or central light court.",
            diagram: (
                <div className="relative h-28 sm:h-32 w-full rounded-xl border-2 border-border/80 bg-muted/40 p-2.5 shadow-inner flex flex-col justify-between">
                    {/* Top wing */}
                    <div className="h-6 w-full rounded-lg bg-primary/15 border-2 border-primary/40 flex items-center justify-center font-bold text-xs text-primary shadow-xs">
                        Top Wing
                    </div>
                    {/* Middle wings with center courtyard */}
                    <div className="flex justify-between items-stretch gap-2 flex-1 mt-1.5">
                        <div className="w-16 rounded-lg bg-primary/15 border-2 border-primary/40 flex items-center justify-center font-bold text-xs text-primary shadow-xs">
                            Left Wing
                        </div>
                        <div className="flex-1 rounded-lg border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 flex items-center justify-center gap-1.5 px-1">
                            <TreePine className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                                Courtyard
                            </span>
                        </div>
                        <div className="w-16 rounded-lg bg-primary/15 border-2 border-primary/40 flex items-center justify-center font-bold text-xs text-primary shadow-xs">
                            Right Wing
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: "l-shape",
            title: "L-Shape",
            laymanSubtitle: "Two Connected Corner Wings",
            badgeText: "Corner Building",
            description: "Rooms form an L-shape across two wings. Ideal for corner lots or properties with two wings.",
            diagram: (
                <div className="relative h-28 sm:h-32 w-full rounded-xl border-2 border-border/80 bg-muted/40 p-2.5 shadow-inner flex flex-col justify-between">
                    {/* Top wing */}
                    <div className="h-6 w-full rounded-lg bg-primary/15 border-2 border-primary/40 flex items-center justify-center font-bold text-xs text-primary shadow-xs">
                        Main Wing
                    </div>
                    {/* Side wing and open area */}
                    <div className="flex justify-between items-stretch gap-2 flex-1 mt-1.5">
                        <div className="w-20 rounded-lg bg-primary/15 border-2 border-primary/40 flex items-center justify-center font-bold text-xs text-primary shadow-xs">
                            Side Wing
                        </div>
                        <div className="flex-1 rounded-lg border-2 border-dashed border-border/80 bg-background/60 flex items-center justify-center">
                            <span className="text-xs font-bold text-muted-foreground/75">
                                Open Lot / Yard
                            </span>
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div 
                    className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="layout-preset-modal-title"
                >
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
                        onClick={onChooseManual}
                    />

                    {/* Modal Window */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className={cn(
                            "relative w-full max-w-4xl max-h-[92vh] flex flex-col",
                            "rounded-[2.5rem] border border-border bg-card text-card-foreground shadow-2xl",
                            "overflow-hidden z-10"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={onChooseManual}
                            title="Close and edit manually"
                            className="absolute right-5 top-5 z-20 rounded-full p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        >
                            <X className="size-5" />
                        </button>

                        {/* Header Section */}
                        <div className="p-6 sm:p-8 pb-5 border-b border-border/70 bg-muted/20">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.18em] text-primary">
                                    <Layers className="size-4" />
                                    Step 2 of 5 • Unit Map Setup
                                </span>
                                {unitCount > 0 && (
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                        {unitCount} {unitCount === 1 ? "Room" : "Rooms"} • {floorCount} {floorCount === 1 ? "Floor" : "Floors"}
                                    </span>
                                )}
                            </div>
                            
                            <h2 
                                id="layout-preset-modal-title"
                                className="text-2xl sm:text-3xl font-black tracking-tight text-foreground"
                            >
                                Choose a Unit-map Layout
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-3xl font-medium">
                                Your units are on the canvas but haven&apos;t been organized into a final unit-map layout yet. Pick a ready-made layout below for instant setup, or lay them out manually by drag and dropping the units themselves and add elements such as stairs from the sidebar.
                            </p>
                        </div>

                        {/* Presets Cards Grid */}
                        <div className="flex-1 overflow-y-auto p-5 sm:p-8 py-5 custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                {presets.map((preset) => (
                                    <div
                                        key={preset.id}
                                        onClick={() => onSelectPreset(preset.id)}
                                        className={cn(
                                            "group text-left flex flex-col justify-between rounded-2xl border-2 p-5 cursor-pointer",
                                            "transition-all duration-200 active:scale-[0.99]",
                                            preset.isRecommended
                                                ? "border-primary/60 bg-primary/[0.03] shadow-md hover:border-primary hover:shadow-primary/10"
                                                : "border-border/80 bg-card hover:border-primary/50 hover:shadow-md",
                                            "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                                        )}
                                    >
                                        <div className="w-full">
                                            {/* Diagram Preview */}
                                            <div className="mb-4 w-full overflow-hidden transition-transform group-hover:scale-[1.01]">
                                                {preset.diagram}
                                            </div>

                                            {/* Header with Title and Badge */}
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div>
                                                    <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                                        <span>{preset.title}</span>
                                                        {preset.isRecommended && (
                                                            <CheckCircle2 className="size-4 text-primary shrink-0" />
                                                        )}
                                                    </h3>
                                                    <p className="text-xs font-bold text-primary mt-0.5">
                                                        {preset.laymanSubtitle}
                                                    </p>
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 border",
                                                    preset.isRecommended 
                                                        ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                                                        : "bg-muted text-muted-foreground border-border/80"
                                                )}>
                                                    {preset.badgeText}
                                                </span>
                                            </div>

                                            {/* Layman Description */}
                                            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                                {preset.description}
                                            </p>
                                        </div>

                                        {/* Apply Action Button - 48px touch target for elderly ergonomics */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectPreset(preset.id);
                                            }}
                                            className={cn(
                                                "mt-4 w-full h-11 min-h-[44px] rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer",
                                                preset.isRecommended
                                                    ? "bg-primary text-primary-foreground hover:brightness-105 shadow-primary/20"
                                                    : "bg-muted/80 hover:bg-primary hover:text-primary-foreground text-foreground border border-border"
                                            )}
                                        >
                                            <span>Apply {preset.title}</span>
                                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer / Manual Layout Banner */}
                        <div className="p-5 sm:p-6 border-t border-border/70 bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Move className="size-4 text-primary" />
                                    Want to design your own custom layout?
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    You can skip the presets and arrange rooms and doors freely on the canvas.
                                </p>
                            </div>
                            
                            <button
                                type="button"
                                onClick={onChooseManual}
                                className={cn(
                                    "shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold",
                                    "border-2 border-border bg-card hover:bg-muted text-foreground hover:border-primary/50",
                                    "transition-all active:scale-95 shadow-sm min-h-[48px] cursor-pointer"
                                )}
                            >
                                <span>Lay Out Manually</span>
                                <ArrowRight className="size-4 text-muted-foreground" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

