"use client";

import React, { useEffect } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { 
    X, 
    LayoutGrid, 
    Columns, 
    Grid2X2, 
    Compass, 
    ArrowRight, 
    Layers, 
    Move
} from "lucide-react";
import { cn } from "@/lib/utils";

export type LayoutPresetType = "double-loaded" | "single-loaded" | "u-shape" | "l-shape";

interface PresetOption {
    id: LayoutPresetType;
    title: string;
    tag: string;
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
            tag: "Central Corridor",
            description: "Units arranged on both sides of a central hallway. Maximizes footprint efficiency for apartments and dorms.",
            diagram: (
                <div className="flex h-24 w-full flex-col justify-between rounded-xl border border-border/80 bg-muted/40 p-2.5">
                    {/* Top unit row */}
                    <div className="flex gap-1.5 justify-center">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={`dl-top-${i}`} className="h-5 flex-1 rounded bg-primary/25 border border-primary/40 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-primary">Unit</span>
                            </div>
                        ))}
                    </div>
                    {/* Central Corridor */}
                    <div className="h-4 w-full rounded bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                        <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Hallway</span>
                    </div>
                    {/* Bottom unit row */}
                    <div className="flex gap-1.5 justify-center">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={`dl-bot-${i}`} className="h-5 flex-1 rounded bg-primary/25 border border-primary/40 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-primary">Unit</span>
                            </div>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            id: "single-loaded",
            title: "Single Loaded",
            tag: "Linear Wing",
            description: "Single row of units along an open hallway. Ideal for exterior balconies, motel-style corridors, or narrow sites.",
            diagram: (
                <div className="flex h-24 w-full flex-col justify-center gap-2 rounded-xl border border-border/80 bg-muted/40 p-2.5">
                    {/* Top unit row */}
                    <div className="flex gap-1.5 justify-center">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={`sl-top-${i}`} className="h-7 flex-1 rounded bg-primary/25 border border-primary/40 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-primary">Unit</span>
                            </div>
                        ))}
                    </div>
                    {/* Single Corridor */}
                    <div className="h-5 w-full rounded bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                        <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Open Corridor</span>
                    </div>
                </div>
            ),
        },
        {
            id: "u-shape",
            title: "U-Shape",
            tag: "Courtyard Core",
            description: "Three connected wings wrapping a central courtyard or open space. Offers natural airflow and garden views.",
            diagram: (
                <div className="relative h-24 w-full rounded-xl border border-border/80 bg-muted/40 p-2">
                    {/* Top wing */}
                    <div className="h-4.5 w-full rounded bg-primary/25 border border-primary/40 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-primary">North Wing</span>
                    </div>
                    <div className="mt-1 flex justify-between h-13">
                        {/* West wing */}
                        <div className="w-8 rounded bg-primary/25 border border-primary/40 flex items-center justify-center">
                            <span className="text-[7px] font-bold text-primary -rotate-90">West</span>
                        </div>
                        {/* Center Courtyard */}
                        <div className="flex-1 mx-1.5 rounded border border-dashed border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center">
                            <span className="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Courtyard</span>
                        </div>
                        {/* East wing */}
                        <div className="w-8 rounded bg-primary/25 border border-primary/40 flex items-center justify-center">
                            <span className="text-[7px] font-bold text-primary rotate-90">East</span>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: "l-shape",
            title: "L-Shape",
            tag: "Corner Wing",
            description: "Two perpendicular wings connecting at a central joint. Designed for corner lots and dual-exposure buildings.",
            diagram: (
                <div className="relative h-24 w-full rounded-xl border border-border/80 bg-muted/40 p-2">
                    {/* Top wing */}
                    <div className="h-5 w-full rounded bg-primary/25 border border-primary/40 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-primary">Main Wing</span>
                    </div>
                    <div className="mt-1 flex justify-between h-13">
                        {/* Left side wing */}
                        <div className="w-10 rounded bg-primary/25 border border-primary/40 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-primary -rotate-90">Side Wing</span>
                        </div>
                        {/* Open yard */}
                        <div className="flex-1 ml-1.5 rounded border border-dashed border-border/60 bg-background/40 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-muted-foreground/60">Open Lot Area</span>
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
                    className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
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
                            "rounded-[2.5rem] border border-border/90 bg-card text-card-foreground shadow-2xl",
                            "overflow-hidden z-10"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={onChooseManual}
                            title="Close and edit manually"
                            className="absolute right-6 top-6 z-20 rounded-full p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                        >
                            <X className="size-5" />
                        </button>

                        {/* Header Section */}
                        <div className="p-7 sm:p-9 pb-5 border-b border-border/60 bg-muted/20">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                    <Layers className="size-3.5" />
                                    Step 2 of Onboarding • Unit Map Setup
                                </span>
                                {unitCount > 0 && (
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                        {unitCount} {unitCount === 1 ? "Unit" : "Units"} • {floorCount} {floorCount === 1 ? "Floor" : "Floors"}
                                    </span>
                                )}
                            </div>
                            
                            <h2 
                                id="layout-preset-modal-title"
                                className="text-2xl sm:text-3xl font-black tracking-tight text-foreground"
                            >
                                Choose a Unit-map Layout
                            </h2>
                            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl font-medium">
                                Your units are on the canvas but haven&apos;t been organized into a final unit-map layout yet. Choose a preset to automatically organize units and hallways, or lay them out manually by dragging and dropping units and adding elements like stairs from the sidebar.
                            </p>
                        </div>

                        {/* Presets Cards Grid */}
                        <div className="flex-1 overflow-y-auto p-7 sm:p-9 py-6 custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {presets.map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => onSelectPreset(preset.id)}
                                        className={cn(
                                            "group text-left flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 sm:p-5",
                                            "transition-all duration-200 hover:border-primary hover:shadow-lg hover:shadow-primary/5 active:scale-[0.99]",
                                            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                        )}
                                    >
                                        <div className="w-full">
                                            {/* Diagram Preview */}
                                            <div className="mb-3.5 w-full overflow-hidden transition-transform group-hover:scale-[1.01]">
                                                {preset.diagram}
                                            </div>

                                            {/* Details */}
                                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                                <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                                                    {preset.title}
                                                </h3>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                                    {preset.tag}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed font-normal">
                                                {preset.description}
                                            </p>
                                        </div>

                                        {/* Apply Action Link */}
                                        <div className="mt-4 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary group-hover:underline">
                                            <span>Apply {preset.title}</span>
                                            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Footer / Manual Layout Banner */}
                        <div className="p-6 sm:p-7 border-t border-border/60 bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                                    <Move className="size-3.5 text-primary" />
                                    Prefer to arrange it yourself?
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    You can lay out your units manually by drag and dropping the units themselves and add elements such as stairs from the sidebar.
                                </p>
                            </div>
                            
                            <button
                                type="button"
                                onClick={onChooseManual}
                                className={cn(
                                    "shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider",
                                    "border border-border/90 bg-card hover:bg-muted text-foreground hover:border-primary/50",
                                    "transition-all active:scale-95 shadow-sm"
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
