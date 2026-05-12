"use client";

import { m as motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
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
    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute inset-y-0 right-0 z-50 w-[400px] border-l border-white/10 bg-[#0A0A0A]/95 backdrop-blur-2xl p-8 shadow-2xl"
            >
                <div className="flex flex-col h-full">
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-white">Bulk Organizer</h3>
                            <div className={cn(
                                "flex flex-col items-end px-3 py-1 rounded-xl border",
                                Object.values(floorDistribution).reduce((a, b) => a + b, 0) > totalUnits
                                    ? "border-rose-500/30 bg-rose-500/10"
                                    : "border-primary/30 bg-primary/10"
                            )}>
                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Remaining</span>
                                <span className={cn(
                                    "text-xs font-black",
                                    totalUnits - Object.values(floorDistribution).reduce((a, b) => a + b, 0) < 0 ? "text-rose-400" : "text-primary"
                                )}>
                                    {totalUnits - Object.values(floorDistribution).reduce((a, b) => a + b, 0)}
                                </span>
                            </div>
                        </div>
                        <p className="mt-2 text-xs font-medium text-neutral-500 leading-relaxed">
                            Distribute your <span className="text-white font-black">{totalUnits} units</span> across floors.
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 no-scrollbar">
                        {floorConfigs.map(fc => {
                            const currentVal = floorDistribution[fc.floor_number] || 0;

                            return (
                                <div key={fc.floor_key} className="group/item space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.04]">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover/item:text-primary transition-colors">
                                            {floorDisplayName(fc)}
                                        </label>
                                        <span className="text-xs font-black text-white">{currentVal} Units</span>
                                    </div>
                                    <div className="relative flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max={totalUnits}
                                            value={currentVal}
                                            onChange={(e) => {
                                                const newVal = parseInt(e.target.value, 10);
                                                // Calculate max allowed for this floor (remaining units + current value)
                                                const otherFloorsTotal = Object.entries(floorDistribution)
                                                    .reduce((sum, [key, val]) => key === String(fc.floor_number) ? sum : sum + val, 0);
                                                const maxAllowed = totalUnits - otherFloorsTotal;
                                                const constrainedVal = Math.min(newVal, maxAllowed);

                                                const newDist = { ...floorDistribution, [fc.floor_number]: constrainedVal };
                                                setFloorDistribution(newDist);
                                                redistributeUnitsSequentially(newDist);
                                            }}
                                            className="flex-1 h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            max={totalUnits}
                                            value={currentVal}
                                            onChange={(e) => {
                                                const inputVal = parseInt(e.target.value, 10) || 0;
                                                // Calculate max allowed for this floor (remaining units + current value)
                                                const otherFloorsTotal = Object.entries(floorDistribution)
                                                    .reduce((sum, [key, val]) => key === String(fc.floor_number) ? sum : sum + val, 0);
                                                const maxAllowed = totalUnits - otherFloorsTotal;
                                                const newVal = Math.max(0, Math.min(inputVal, maxAllowed));

                                                const newDist = { ...floorDistribution, [fc.floor_number]: newVal };
                                                setFloorDistribution(newDist);
                                                redistributeUnitsSequentially(newDist);
                                            }}
                                            className="w-12 bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-xs font-black text-center focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-8 border-t border-white/5 mt-auto">
                        <div className="mb-4 flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Total Assigned</span>
                            <span className={cn(
                                "text-xs font-black",
                                Object.values(floorDistribution).reduce((a, b) => a + b, 0) === totalUnits ? "text-emerald-400" : "text-rose-400"
                            )}>
                                {Object.values(floorDistribution).reduce((a, b) => a + b, 0)} / {totalUnits}
                            </span>
                        </div>

                        <button
                            onClick={handleApplyDistribution}
                            disabled={isSaving || Object.values(floorDistribution).reduce((a, b) => a + b, 0) !== totalUnits}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-black font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                        >
                            {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Save & Close"}
                        </button>

                        <p className="mt-4 text-[10px] text-center text-neutral-600 font-black uppercase tracking-widest">
                            Changes are saved automatically as you move.
                        </p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}