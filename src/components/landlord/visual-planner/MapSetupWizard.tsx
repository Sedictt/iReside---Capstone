"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Grid2X2, CheckCircle2, AlertCircle, Loader2, Move } from "lucide-react";

interface DbUnit {
    id: string;
    name: string;
    floor: number;
    status: string;
    beds: number;
    baths: number;
    sqft: number | null;
    position: { floor_key: string; x: number; y: number; w: number; h: number } | null;
}

interface FloorConfig {
    id: string;
    floor_number: number;
    floor_key: string;
    display_name: string | null;
    sort_order: number;
}

interface MapSetupWizardProps {
    propertyId: string;
    propertyName: string;
    onSetupComplete: () => void;
}

const floorDisplayName = (fc: FloorConfig) => {
    if (fc.display_name) return fc.display_name;
    if (fc.floor_number === 0) return "Ground Floor";
    return `Floor ${fc.floor_number}`;
};

export function MapSetupWizard({ propertyId, propertyName, onSetupComplete }: MapSetupWizardProps) {
    const [units, setUnits] = useState<DbUnit[]>([]);
    const [floorConfigs, setFloorConfigs] = useState<FloorConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [placedCount, setPlacedCount] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(`/api/landlord/unit-map?propertyId=${propertyId}`);
                const data = await res.json() as {
                    units: DbUnit[];
                    floorConfigs: FloorConfig[];
                    placedCount: number;
                    isSetupComplete: boolean;
                };
                setUnits(data.units);
                setFloorConfigs(data.floorConfigs);
                setPlacedCount(data.placedCount);

                // If already complete, skip wizard
                if (data.isSetupComplete) {
                    onSetupComplete();
                }
            } catch {
                setError("Failed to load property data.");
            } finally {
                setIsLoading(false);
            }
        };
        void load();
    }, [propertyId, onSetupComplete]);

    const totalUnits = units.length;
    const progress = totalUnits > 0 ? Math.round((placedCount / totalUnits) * 100) : 0;

    // Group unplaced units by floor number
    const unplacedByFloor = floorConfigs.map(fc => ({
        floorConfig: fc,
        units: units.filter(u => u.position === null && u.floor === fc.floor_number),
    })).filter(group => group.units.length > 0);

    const handleSkipToCanvas = () => {
        onSetupComplete();
    };

    const handleAutoPlace = async () => {
        setIsSaving(true);
        try {
            const BLUEPRINT_WIDTH = 1600;
            const COLS = 4;
            const UNIT_W = 200;
            const UNIT_H = 140;
            const PADDING = 20;
            const COL_STRIDE = UNIT_W + PADDING;

            const positions: Array<{
                unitId: string;
                floorKey: string;
                x: number;
                y: number;
                w: number;
                h: number;
            }> = [];

            // For each floor, lay out unplaced units in a grid
            for (const fc of floorConfigs) {
                const floorUnits = units.filter(u => u.floor === fc.floor_number && u.position === null);
                floorUnits.forEach((unit, idx) => {
                    const col = idx % COLS;
                    const row = Math.floor(idx / COLS);
                    positions.push({
                        unitId: unit.id,
                        floorKey: fc.floor_key,
                        x: PADDING + col * COL_STRIDE,
                        y: PADDING + row * (UNIT_H + PADDING),
                        w: UNIT_W,
                        h: UNIT_H,
                    });
                });

                // Also re-position already-placed units for this floor to keep grid clean
                const alreadyPlaced = units.filter(u => u.floor === fc.floor_number && u.position !== null);
                alreadyPlaced.forEach((unit, idx) => {
                    const startIdx = floorUnits.length + idx;
                    const col = startIdx % COLS;
                    const row = Math.floor(startIdx / COLS);
                    positions.push({
                        unitId: unit.id,
                        floorKey: fc.floor_key,
                        x: PADDING + col * COL_STRIDE,
                        y: PADDING + row * (UNIT_H + PADDING),
                        w: UNIT_W,
                        h: UNIT_H,
                    });
                });
            }

            await fetch("/api/landlord/unit-map", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ propertyId, positions }),
            });

            onSetupComplete();
        } catch {
            setError("Auto-placement failed. You can place units manually from the canvas.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#080808]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-neutral-400 text-sm">Loading property data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-center justify-center bg-[#080808] p-6 overflow-y-auto">
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-2xl space-y-6"
                >
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                            <Layers className="w-3.5 h-3.5" />
                            First-Time Setup
                        </div>
                        <h1 className="text-3xl font-extrabold text-white">
                            Set Up Your Unit Map
                        </h1>
                        <p className="text-neutral-400 text-sm max-w-md mx-auto">
                            <span className="text-white font-semibold">{propertyName}</span> has{" "}
                            <span className="text-primary font-bold">{totalUnits} units</span> across{" "}
                            <span className="text-primary font-bold">{floorConfigs.length} floor{floorConfigs.length !== 1 ? "s" : ""}</span>.
                            Place all units on the map to activate the visual planner.
                        </p>
                    </div>

                    {/* Progress */}
                    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-neutral-300">Placement Progress</span>
                            <span className="text-sm font-bold text-primary">{placedCount} / {totalUnits} placed</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full bg-primary rounded-full"
                            />
                        </div>
                        {placedCount === totalUnits && totalUnits > 0 ? (
                            <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                All units placed! Ready to activate.
                            </p>
                        ) : (
                            <p className="text-xs text-neutral-500">
                                {totalUnits - placedCount} unit{totalUnits - placedCount !== 1 ? "s" : ""} still need placement
                            </p>
                        )}
                    </div>

                    {/* Unplaced units by floor */}
                    {unplacedByFloor.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Unplaced Units</p>
                            <div className="space-y-2">
                                {unplacedByFloor.map(({ floorConfig, units: floorUnits }) => (
                                    <div key={floorConfig.floor_key} className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Grid2X2 className="w-4 h-4 text-primary" />
                                            <span className="text-sm font-bold text-white">{floorDisplayName(floorConfig)}</span>
                                            <span className="text-xs text-neutral-500 ml-auto">{floorUnits.length} unplaced</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {floorUnits.map(unit => (
                                                <div
                                                    key={unit.id}
                                                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-neutral-300 font-medium"
                                                >
                                                    {unit.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleAutoPlace}
                            disabled={isSaving}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_24px_rgba(var(--primary),0.3)] hover:shadow-[0_0_36px_rgba(var(--primary),0.4)]"
                        >
                            {isSaving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Placing Units...</>
                            ) : (
                                <><Move className="w-4 h-4" /> Auto-Place All Units</>
                            )}
                        </button>
                        <button
                            onClick={handleSkipToCanvas}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 text-white font-semibold text-sm hover:bg-white/10 transition-all border border-white/10"
                        >
                            Place Manually on Canvas
                        </button>
                    </div>

                    <p className="text-center text-xs text-neutral-600">
                        You can drag units to their exact positions after auto-placement.
                        All changes auto-save to the database.
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
