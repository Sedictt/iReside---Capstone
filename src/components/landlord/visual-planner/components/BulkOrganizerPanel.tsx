"use client";

import { m as motion, AnimatePresence } from "framer-motion";
import { Loader2, X, SlidersHorizontal, Plus, Minus, Equal } from "lucide-react";
import { cn } from "@/lib/utils";
import { floorDisplayName } from "./WizardUnits";
import type { DbUnit, FloorConfig } from "./WizardUnits";

interface BulkOrganizerPanelProps {
    floorDistribution: Record<number, number>;
    setFloorDistribution: (d: Record<number, number>) => void;
    units: DbUnit[];
    totalUnits: number;
    floorConfigs: FloorConfig[];
    redistributeUnitsSequentially: (d: Record<number, number>) => void;
    handleApplyDistribution: () => Promise<void>;
    isSaving: boolean;
    onClose: () => void;
}

export function BulkOrganizerPanel({
    floorDistribution,
    setFloorDistribution,
    totalUnits,
    floorConfigs,
    redistributeUnitsSequentially,
    handleApplyDistribution,
    isSaving,
    onClose,
}: BulkOrganizerPanelProps) {
    const totalAssigned = Object.values(floorDistribution).reduce((a, b) => a + b, 0);
    const remaining = totalUnits - totalAssigned;

    const handleStepChange = (floorNum: number, delta: number) => {
        const currentVal = floorDistribution[floorNum] || 0;
        const otherFloorsTotal = Object.entries(floorDistribution)
            .reduce((sum, [key, val]) => key === String(floorNum) ? sum : sum + val, 0);
        const maxAllowed = totalUnits - otherFloorsTotal;
        const targetVal = Math.max(0, Math.min(currentVal + delta, maxAllowed));

        const newDist = { ...floorDistribution, [floorNum]: targetVal };
        setFloorDistribution(newDist);
        redistributeUnitsSequentially(newDist);
    };

    const handleSplitEvenly = () => {
        if (floorConfigs.length === 0) return;
        const countPerFloor = Math.floor(totalUnits / floorConfigs.length);
        let remainder = totalUnits % floorConfigs.length;

        const newDist: Record<number, number> = {};
        for (const fc of floorConfigs) {
            newDist[fc.floor_number] = countPerFloor + (remainder > 0 ? 1 : 0);
            if (remainder > 0) remainder--;
        }
        setFloorDistribution(newDist);
        redistributeUnitsSequentially(newDist);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute inset-y-0 right-0 z-50 w-[420px] max-w-full border-l border-border bg-card/98 text-card-foreground backdrop-blur-2xl p-6 sm:p-8 shadow-2xl flex flex-col"
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="mb-6 pb-4 border-b border-border/70">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                                    <SlidersHorizontal className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-foreground">Rooms Per Floor</h3>
                                    <p className="text-xs text-muted-foreground">Set how many rooms are on each floor</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex size-8 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                                title="Close panel"
                                aria-label="Close rooms per floor panel"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Balance pill & Split Evenly shortcut */}
                        <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/70">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-semibold text-muted-foreground">Unassigned rooms:</span>
                                <span className={cn(
                                    "text-xs font-bold",
                                    remaining === 0
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : remaining < 0
                                            ? "text-rose-500"
                                            : "text-primary"
                                )}>
                                    {remaining === 0 ? "All rooms assigned!" : `${remaining} left to place`}
                                </span>
                            </div>

                            {floorConfigs.length > 1 && (
                                <button
                                    type="button"
                                    onClick={handleSplitEvenly}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all cursor-pointer shadow-2xs"
                                >
                                    <Equal className="size-3 text-primary" />
                                    <span>Split Evenly</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Floor Steppers & Sliders list */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-4 no-scrollbar">
                        {floorConfigs.map(fc => {
                            const currentVal = floorDistribution[fc.floor_number] || 0;

                            return (
                                <div key={fc.floor_key} className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/70 transition-all hover:bg-muted/50">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-foreground">
                                            {floorDisplayName(fc)}
                                        </label>
                                        
                                        {/* Stepper Buttons for Seniors */}
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleStepChange(fc.floor_number, -1)}
                                                disabled={currentVal <= 0}
                                                className="size-8 rounded-lg border border-border/80 bg-card flex items-center justify-center text-foreground font-bold hover:bg-muted active:scale-95 disabled:opacity-30 cursor-pointer shadow-2xs transition-all"
                                                title="Decrease rooms"
                                                aria-label={`Decrease rooms for ${floorDisplayName(fc)}`}
                                            >
                                                <Minus className="size-3.5" />
                                            </button>

                                            <span className="w-10 text-center font-bold text-sm text-foreground tabular-nums">
                                                {currentVal}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => handleStepChange(fc.floor_number, 1)}
                                                disabled={remaining <= 0}
                                                className="size-8 rounded-lg border border-border/80 bg-card flex items-center justify-center text-foreground font-bold hover:bg-muted active:scale-95 disabled:opacity-30 cursor-pointer shadow-2xs transition-all"
                                                title="Increase rooms"
                                                aria-label={`Increase rooms for ${floorDisplayName(fc)}`}
                                            >
                                                <Plus className="size-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Fine adjustment slider */}
                                    <div className="relative flex items-center gap-3 pt-1">
                                        <input
                                            type="range"
                                            min="0"
                                            max={totalUnits}
                                            value={currentVal}
                                            onChange={(e) => {
                                                const newVal = parseInt(e.target.value, 10);
                                                const otherFloorsTotal = Object.entries(floorDistribution)
                                                    .reduce((sum, [key, val]) => key === String(fc.floor_number) ? sum : sum + val, 0);
                                                const maxAllowed = totalUnits - otherFloorsTotal;
                                                const constrainedVal = Math.min(newVal, maxAllowed);

                                                const newDist = { ...floorDistribution, [fc.floor_number]: constrainedVal };
                                                setFloorDistribution(newDist);
                                                redistributeUnitsSequentially(newDist);
                                            }}
                                            className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                                        />
                                        <span className="text-xs font-semibold text-muted-foreground w-12 text-right">
                                            {currentVal} {currentVal === 1 ? "room" : "rooms"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom CTA */}
                    <div className="pt-6 border-t border-border mt-auto space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
                            <span>Total Assigned</span>
                            <span className={cn(
                                "font-black",
                                totalAssigned === totalUnits ? "text-emerald-500" : "text-amber-500"
                            )}>
                                {totalAssigned} of {totalUnits} Rooms
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleApplyDistribution}
                            disabled={isSaving || totalAssigned !== totalUnits}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                        >
                            {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Save Rooms Per Floor"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}