"use client";

import { m as motion, AnimatePresence } from "framer-motion";
import { Loader2, X, SlidersHorizontal } from "lucide-react";
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
                                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                                    <SlidersHorizontal className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-foreground">Bulk Organizer</h3>
                                    <p className="text-xs text-muted-foreground">Distribute units across floors</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex size-8 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                                title="Close panel"
                                aria-label="Close bulk organizer panel"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Balance pill */}
                        <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/70">
                            <span className="text-xs font-medium text-muted-foreground">Remaining to assign:</span>
                            <span className={cn(
                                "text-xs font-black px-2.5 py-0.5 rounded-md",
                                remaining === 0
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    : remaining < 0
                                        ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                        : "bg-primary/10 text-primary border border-primary/20"
                            )}>
                                {remaining} {remaining === 1 ? "unit" : "units"}
                            </span>
                        </div>
                    </div>

                    {/* Sliders list */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-4 no-scrollbar">
                        {floorConfigs.map(fc => {
                            const currentVal = floorDistribution[fc.floor_number] || 0;

                            return (
                                <div key={fc.floor_key} className="space-y-2.5 p-4 rounded-2xl bg-muted/30 border border-border/70 transition-all hover:bg-muted/50">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-foreground">
                                            {floorDisplayName(fc)}
                                        </label>
                                        <span className="text-xs font-black text-primary">{currentVal} Units</span>
                                    </div>
                                    <div className="relative flex items-center gap-3">
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
                                        <input
                                            type="number"
                                            min="0"
                                            max={totalUnits}
                                            value={currentVal}
                                            onChange={(e) => {
                                                const inputVal = parseInt(e.target.value, 10) || 0;
                                                const otherFloorsTotal = Object.entries(floorDistribution)
                                                    .reduce((sum, [key, val]) => key === String(fc.floor_number) ? sum : sum + val, 0);
                                                const maxAllowed = totalUnits - otherFloorsTotal;
                                                const newVal = Math.max(0, Math.min(inputVal, maxAllowed));

                                                const newDist = { ...floorDistribution, [fc.floor_number]: newVal };
                                                setFloorDistribution(newDist);
                                                redistributeUnitsSequentially(newDist);
                                            }}
                                            className="w-14 bg-card border border-border rounded-lg py-1 px-2 text-xs font-black text-foreground text-center focus:border-primary outline-none"
                                        />
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
                                {totalAssigned} of {totalUnits} Units
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleApplyDistribution}
                            disabled={isSaving || totalAssigned !== totalUnits}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                        >
                            {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Apply Distribution"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}