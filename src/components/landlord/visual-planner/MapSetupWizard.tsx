"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
    Grid2X2,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronRight,
    ArrowRight,
    Layout,
    Equal,
    SlidersHorizontal,
    Eye,
    Plus,
    Layers,
    Hash,
    X
} from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { generateUnitList, type NumberingStyle } from "@/lib/unit-naming";
import { useAppToast } from "@/hooks/useAppToast";

import { SortableUnit, FloorLane, floorDisplayName } from "./components/WizardUnits";
import type { DbUnit, FloorConfig } from "./components/WizardUnits";
import { BulkOrganizerPanel } from "./components/BulkOrganizerPanel";

interface MapSetupWizardProps {
    propertyId: string;
    propertyName: string;
    onSetupComplete: () => void;
    previewEmptyFloors?: boolean;
}

const sortUnitsSequential = (unitList: DbUnit[]) => {
    return [...unitList].sort((a, b) => {
        const aNum = parseInt(a.name.replace(/\D/g, ""), 10);
        const bNum = parseInt(b.name.replace(/\D/g, ""), 10);
        const aHas = !isNaN(aNum);
        const bHas = !isNaN(bNum);
        if (aHas && bHas && aNum !== bNum) return aNum - bNum;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    });
};

export function MapSetupWizard({ propertyId, propertyName, onSetupComplete, previewEmptyFloors = false }: MapSetupWizardProps) {
    const toast = useAppToast();
    const [units, setUnits] = useState<DbUnit[]>([]);
    const [floorConfigs, setFloorConfigs] = useState<FloorConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [placedCount, setPlacedCount] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [activeUnit, setActiveUnit] = useState<DbUnit | null>(null);
    const [isBulkOrganizerOpen, setIsBulkOrganizerOpen] = useState(false);
    const [floorDistribution, setFloorDistribution] = useState<Record<number, number>>({});
    const [isRenumberModalOpen, setIsRenumberModalOpen] = useState(false);
    const [renumberPrefix, setRenumberPrefix] = useState("Unit");
    const [renumberStyle, setRenumberStyle] = useState<NumberingStyle>("floor_based");
    const [renumberStartingNumber, setRenumberStartingNumber] = useState(101);
    const [isRenumbering, setIsRenumbering] = useState(false);

    // Initialize distribution on load
    useEffect(() => {
        if (units.length > 0 && floorConfigs.length > 0) {
            const initialDist: Record<number, number> = {};
            floorConfigs.forEach(fc => {
                initialDist[fc.floor_number] = units.filter(u => u.floor === fc.floor_number).length;
            });
            setFloorDistribution(initialDist);
        }
    }, [units.length, floorConfigs.length]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const loadData = useCallback(async () => {
        if (previewEmptyFloors) {
            setUnits([
                { id: "preview-u1", name: "Unit 101", floor: -1, status: "vacant", beds: 1, baths: 1, sqft: 450, position: null },
                { id: "preview-u2", name: "Unit 102", floor: -1, status: "vacant", beds: 2, baths: 1, sqft: 600, position: null },
                { id: "preview-u3", name: "Unit 103", floor: -1, status: "vacant", beds: 1, baths: 1, sqft: 450, position: null },
                { id: "preview-u4", name: "Unit 201", floor: -1, status: "vacant", beds: 2, baths: 2, sqft: 750, position: null },
                { id: "preview-u5", name: "Unit 202", floor: -1, status: "vacant", beds: 1, baths: 1, sqft: 500, position: null },
            ]);
            setFloorConfigs([]);
            setPlacedCount(0);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const res = await fetch(`/api/landlord/unit-map?propertyId=${propertyId}`);
            const data = (await res.json()) as {
                units: DbUnit[];
                floorConfigs: FloorConfig[];
                placedCount: number;
                isSetupComplete: boolean;
            };
            setUnits(data.units);
            setFloorConfigs(data.floorConfigs);
            setPlacedCount(data.placedCount);

            if (data.isSetupComplete) {
                onSetupComplete();
            }
        } catch {
            setError("Unable to load property floor plan.");
        } finally {
            setIsLoading(false);
        }
    }, [propertyId, onSetupComplete, previewEmptyFloors]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const totalUnits = units.length;
    const progress = totalUnits > 0 ? Math.round((placedCount / totalUnits) * 100) : 0;

    const handleAddFloor = async (floorNum?: number) => {
        setIsSaving(true);
        try {
            const nextFloorNumber = floorNum !== undefined
                ? floorNum
                : (floorConfigs.length > 0 
                    ? Math.max(...floorConfigs.map(fc => fc.floor_number)) + 1 
                    : 1);
            
            // Optimistic update: add floor to state immediately
            const newFloor: FloorConfig = {
                id: `temp-${Date.now()}`, // Temporary ID
                floor_number: nextFloorNumber,
                floor_key: nextFloorNumber === 0 ? "ground" : `floor${nextFloorNumber}`,
                display_name: null,
                sort_order: nextFloorNumber
            };
            setFloorConfigs(prev => [...prev, newFloor]);
            
            if (previewEmptyFloors) {
                setError(null);
                setIsSaving(false);
                return;
            }

            // Send to server
            const res = await fetch("/api/landlord/unit-map/floor-configs", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ propertyId, floorNumber: nextFloorNumber }),
            });

            if (!res.ok) {
                // Rollback on error
                setFloorConfigs(prev => prev.filter(f => f.id !== newFloor.id));
                throw new Error("Failed to add floor");
            }
            setError(null);
        } catch (err) {
            setError("Failed to add new floor.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveFloor = async (floorKey: string) => {
        if (floorConfigs.length <= 1) {
            setError("You must have at least one floor.");
            return;
        }

        setIsSaving(true);
        try {
            // Save current state for rollback
            const previousFloors = floorConfigs;
            
            // Optimistic update: remove floor from state immediately
            setFloorConfigs(prev => prev.filter(f => f.floor_key !== floorKey));
            
            // Move units on deleted floor to first available floor
            const deletedFloor = floorConfigs.find(f => f.floor_key === floorKey);
            const nextFloor = floorConfigs.find(f => f.floor_key !== floorKey);
            if (deletedFloor && nextFloor) {
                setUnits(prev => prev.map(u => u.floor === deletedFloor.floor_number ? { ...u, floor: nextFloor.floor_number } : u));
            }
            
            // Send to server
            const res = await fetch(`/api/landlord/unit-map/floor-configs?propertyId=${propertyId}&floorKey=${floorKey}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                // Rollback on error
                setFloorConfigs(previousFloors);
                await loadData(); // Reload to sync units back
                throw new Error("Failed to remove floor");
            }
            setError(null);
        } catch (err) {
            setError("Failed to remove floor.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDistributeEvenly = async () => {
        if (floorConfigs.length <= 1 || units.length === 0) return;
        setIsSaving(true);
        try {
            const sortedUnits = [...units].sort((a, b) => {
                const aNum = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
                const bNum = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
                if (aNum !== bNum) return aNum - bNum;
                return a.name.localeCompare(b.name, undefined, { numeric: true });
            });

            const sortedFloors = [...floorConfigs].sort((a, b) => a.sort_order - b.sort_order || a.floor_number - b.floor_number);
            const unitsPerFloor = Math.ceil(sortedUnits.length / sortedFloors.length);

            const newUnits: DbUnit[] = sortedUnits.map((u, idx) => {
                const floorIdx = Math.min(sortedFloors.length - 1, Math.floor(idx / unitsPerFloor));
                return { ...u, floor: sortedFloors[floorIdx].floor_number };
            });

            setUnits(newUnits);

            const promises = newUnits.map(u => 
                fetch(`/api/landlord/unit-map/units/${u.id}/floor`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ floor: u.floor }),
                })
            );
            await Promise.all(promises);
            setError(null);
            toast.success("Units distributed evenly across floors!");
        } catch {
            setError("Failed to distribute units evenly across floors.");
            toast.error("Failed to distribute units evenly across floors.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleApplyRenumber = async () => {
        setIsRenumbering(true);
        try {
            const res = await fetch("/api/landlord/unit-map/batch-rename", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    propertyId,
                    prefix: renumberPrefix,
                    numberingStyle: renumberStyle,
                    startingNumber: renumberStartingNumber,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to rename units.");
            if (data.units) {
                setUnits(data.units);
            }
            setIsRenumberModalOpen(false);
            setError(null);
            toast.success("Units successfully renumbered!", {
                description: `Applied ${renumberStyle === "floor_based" ? "floor-based" : "sequential"} numbering with prefix "${renumberPrefix}".`,
            });
        } catch (err: any) {
            setError(err.message || "Failed to batch rename units.");
            toast.error(err.message || "Failed to batch rename units.");
        } finally {
            setIsRenumbering(false);
        }
    };

    const handleUpdateUnitFloor = async (unitId: string, newFloor: number) => {
        setUnits(prev => prev.map(u => u.id === unitId ? { ...u, floor: newFloor } : u));
        try {
            await fetch(`/api/landlord/unit-map/units/${unitId}/floor`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ floor: newFloor }),
            });
        } catch {
            setError("Failed to save changes. Please check your connection.");
        }
    };

    const redistributeUnitsSequentially = (newDistribution: Record<number, number>) => {
        const sortedUnits = units.toSorted((a, b) => {
            const aNum = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
            const bNum = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
            return aNum - bNum;
        });

        const newUnits: DbUnit[] = [];
        let unitIdx = 0;

        for (const fc of floorConfigs) {
            const count = newDistribution[fc.floor_number] || 0;
            for (let i = 0; i < count; i++) {
                if (unitIdx < sortedUnits.length) {
                    newUnits.push({ ...sortedUnits[unitIdx], floor: fc.floor_number });
                    unitIdx++;
                }
            }
        }

        // Put remaining units into "Unassigned" state (using -1 as a convention for unassigned)
        while (unitIdx < sortedUnits.length) {
            newUnits.push({ ...sortedUnits[unitIdx], floor: -1 });
            unitIdx++;
        }

        setUnits(newUnits);
        return newUnits;
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const unit = units.find(u => u.id === active.id);
        if (unit) setActiveUnit(unit);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const overFloor = over.data.current?.floorNumber;
        if (overFloor !== undefined) {
            const unit = units.find(u => u.id === activeId);
            if (unit && unit.floor !== overFloor) {
                setUnits(prev => prev.map(u => u.id === activeId ? { ...u, floor: overFloor } : u));
            }
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveUnit(null);

        if (!over) return;

        const unitId = active.id as string;
        let newFloor = -1;

        if (String(over.id).startsWith("floor-")) {
            newFloor = over.data.current?.floorNumber;
        } else {
            const targetUnit = units.find(u => u.id === over.id);
            if (targetUnit) newFloor = targetUnit.floor;
        }

        if (newFloor !== -1) {
            await handleUpdateUnitFloor(unitId, newFloor);
        }
    };

    const handleAutoPlace = async () => {
        setIsSaving(true);
        try {
            const BLUEPRINT_WIDTH = 1600;
            const PADDING = 40;

            const positions: Array<{
                unitId: string;
                floorKey: string;
                x: number;
                y: number;
                w: number;
                h: number;
            }> = [];

            for (const fc of floorConfigs) {
                const floorUnits = [...units].filter(u => u.floor === fc.floor_number);
                
                // Sort units numerically by name (e.g., "101", "102", "201")
                floorUnits.sort((a, b) => {
                    const numA = parseInt(a.name.replace(/\D/g, "")) || 0;
                    const numB = parseInt(b.name.replace(/\D/g, "")) || 0;
                    if (numA !== numB) return numA - numB;
                    return a.name.localeCompare(b.name, undefined, { numeric: true });
                });

                const count = floorUnits.length;
                if (count === 0) continue;

                // Dynamically decide columns based on unit count
                let cols = 4;
                if (count <= 2) cols = 2;
                else if (count <= 6) cols = 3;
                else if (count <= 12) cols = 4;
                else if (count <= 24) cols = 5;
                else cols = 6;

                // Calculate width to fit the blueprint dynamically
                const availableWidth = BLUEPRINT_WIDTH - (PADDING * 2);
                const unitW = (availableWidth - (cols - 1) * PADDING) / cols;
                
                // Cap height to prevent overly tall units, but keep a reasonable aspect ratio
                const unitH = Math.min(180, unitW * 0.65);

                floorUnits.forEach((unit, idx) => {
                    const col = idx % cols;
                    const row = Math.floor(idx / cols);
                    positions.push({
                        unitId: unit.id,
                        floorKey: fc.floor_key,
                        x: PADDING + col * (unitW + PADDING),
                        y: PADDING + row * (unitH + PADDING),
                        w: Math.round(unitW),
                        h: Math.round(unitH),
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
            setError("Generation failed. Please try placing units manually.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleApplyDistribution = async () => {
        setIsSaving(true);
        try {
            const sortedUnits = units.toSorted((a, b) => {
                const aNum = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
                const bNum = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
                return aNum - bNum;
            });

            const newUnits: DbUnit[] = [];
            let unitIdx = 0;

            // Follow the user's specified counts
            for (const fc of floorConfigs) {
                const count = floorDistribution[fc.floor_number] || 0;
                for (let i = 0; i < count; i++) {
                    if (unitIdx < sortedUnits.length) {
                        newUnits.push({ ...sortedUnits[unitIdx], floor: fc.floor_number });
                        unitIdx++;
                    }
                }
            }

            // If there are leftovers, put them on the last floor
            while (unitIdx < sortedUnits.length) {
                const lastFloor = floorConfigs[floorConfigs.length - 1].floor_number;
                newUnits.push({ ...sortedUnits[unitIdx], floor: lastFloor });
                unitIdx++;
            }

            setUnits(newUnits);

            const promises = newUnits.map(u => 
                fetch(`/api/landlord/unit-map/units/${u.id}/floor`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ floor: u.floor }),
                })
            );
            await Promise.all(promises);
            
            setIsBulkOrganizerOpen(false);
            setError(null);
        } catch {
            setError("Failed to reorganize units. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#080808]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="size-10 text-primary animate-spin" />
                    <p className="text-neutral-500 text-sm font-black uppercase tracking-widest">Building Layout…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-[#050505] text-white">
            {/* Top Navigation / Header */}
            <header className="flex h-20 shrink-0 items-center justify-between border-b border-white/5 bg-white/[0.02] px-8 backdrop-blur-xl">
                    <div data-tour-id="tour-wizard-header" className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-black">
                            <Layout className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight">{propertyName}</h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Floor Plan Organizer</p>
                        </div>
                    </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Progress</span>
                            <span className="text-xs font-black text-primary">{placedCount === totalUnits ? "Ready to Launch" : `${progress}% Assigned`}</span>
                        </div>
                        <div className="h-1 w-32 rounded-full bg-white/10 overflow-hidden">
                            <motion.div 
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            data-tour-id="tour-wizard-bulk"
                            onClick={() => setIsBulkOrganizerOpen(!isBulkOrganizerOpen)}
                            disabled={isSaving}
                            title="Open Bulk Organizer"
                            className={cn(
                                "flex size-11 items-center justify-center rounded-2xl border transition-all active:scale-95 disabled:opacity-50",
                                isBulkOrganizerOpen 
                                    ? "bg-primary border-primary text-black" 
                                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                            )}
                        >
                            <SlidersHorizontal className="size-4" />
                        </button>
                        
                        <button
                            data-tour-id="tour-wizard-generate"
                            onClick={handleAutoPlace}
                            disabled={isSaving}
                            className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-primary px-6 py-3 text-sm font-black uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                            Generate Map
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden relative">
                {/* Bulk Organizer Side Panel */}
                {isBulkOrganizerOpen && (
                    <BulkOrganizerPanel
                        floorDistribution={floorDistribution}
                        setFloorDistribution={setFloorDistribution}
                        units={units}
                        totalUnits={totalUnits}
                        floorConfigs={floorConfigs}
                        redistributeUnitsSequentially={redistributeUnitsSequentially}
                        handleApplyDistribution={handleApplyDistribution}
                        isSaving={isSaving}
                        onClose={() => setIsBulkOrganizerOpen(false)}
                    />
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex h-full gap-8 p-8">
                        {/* Floor Boards Section */}
                        <div className="flex-1 overflow-y-auto no-scrollbar rounded-[2.5rem] bg-white/[0.01] border border-white/5 p-8">
                            <div className="mb-10 flex items-start justify-between gap-6">
                                <div className="max-w-lg">
                                    <h2 className="text-3xl font-black tracking-tight text-white">Organize Units by Floor</h2>
                                    <p className="mt-2 text-sm leading-relaxed text-neutral-400 font-medium">
                                        Drag and drop units into their respective floors. This will determine how they appear on your property&apos;s visual map.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsRenumberModalOpen(true)}
                                        disabled={isSaving || units.length === 0}
                                        className="group flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50 text-white"
                                    >
                                        <Hash className="size-4 text-primary" />
                                        <span className="text-xs font-black uppercase tracking-widest">Renumber Units</span>
                                    </button>
                                    {floorConfigs.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={handleDistributeEvenly}
                                            disabled={isSaving}
                                            className="group flex shrink-0 items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-3 transition-all hover:bg-primary/20 active:scale-95 disabled:opacity-50"
                                        >
                                            <Equal className="size-4 text-primary" />
                                            <span className="text-xs font-black uppercase tracking-widest text-primary">Distribute Evenly</span>
                                        </button>
                                    )}
                                    <button
                                        data-tour-id="tour-wizard-add-floor"
                                        onClick={() => handleAddFloor()}
                                        disabled={isSaving}
                                        className="group flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50"
                                    >
                                        <div className="flex size-6 items-center justify-center rounded-lg bg-primary/20 text-primary group-hover:bg-primary group-hover:text-black transition-all">
                                            <Plus className="size-4" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest">Add New Floor</span>
                                    </button>
                                </div>
                            </div>

                            <div data-tour-id="tour-wizard-lanes" className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Holding Area for Unassigned Units */}
                                {units.some(u => u.floor === -1) && (
                                    <div className="col-span-1 lg:col-span-2 mb-4">
                                        <FloorLane
                                            floor={{ id: "unassigned", floor_number: -1, floor_key: "unassigned", display_name: "Unassigned Units (Holding Area)", sort_order: -999 }}
                                            units={sortUnitsSequential(units.filter(u => u.floor === -1))}
                                            onRemove={() => {}}
                                        />
                                    </div>
                                )}

                                {floorConfigs.length === 0 ? (
                                    <div className="col-span-1 lg:col-span-2 flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-primary/20 bg-primary/[0.02] p-8 sm:p-12 text-center transition-all animate-in fade-in zoom-in-95 duration-300">
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 rounded-3xl bg-primary/20 animate-pulse blur-xl pointer-events-none" />
                                            <div className="relative flex size-16 items-center justify-center rounded-3xl border border-primary/30 bg-primary/10 text-primary shadow-inner">
                                                <Layers className="size-8" />
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black tracking-tight text-white mb-2">
                                            No Floors Created Yet
                                        </h3>
                                        <p className="max-w-md text-xs font-medium leading-relaxed text-neutral-400 mb-8">
                                            Your building needs at least one floor level before units can be placed on the architectural map. Add your property&apos;s levels below to begin.
                                        </p>

                                        {/* Step Guide Cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl mb-8 text-left">
                                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                                                <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary text-[11px] font-black mb-2">1</div>
                                                <p className="text-xs font-black text-white">Create Levels</p>
                                                <p className="text-[10px] text-neutral-400 leading-relaxed mt-1">Add Ground Floor, Floor 1, Floor 2, etc.</p>
                                            </div>
                                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                                                <div className="flex size-6 items-center justify-center rounded-lg bg-white/10 text-neutral-300 text-[11px] font-black mb-2">2</div>
                                                <p className="text-xs font-black text-white">Assign Units</p>
                                                <p className="text-[10px] text-neutral-400 leading-relaxed mt-1">Drag units from the pool to their floors.</p>
                                            </div>
                                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                                                <div className="flex size-6 items-center justify-center rounded-lg bg-white/10 text-neutral-300 text-[11px] font-black mb-2">3</div>
                                                <p className="text-xs font-black text-white">Generate Map</p>
                                                <p className="text-[10px] text-neutral-400 leading-relaxed mt-1">Auto-build your high-fidelity canvas layout.</p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap items-center justify-center gap-3">
                                            <button
                                                onClick={() => handleAddFloor(1)}
                                                disabled={isSaving}
                                                className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
                                            >
                                                {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4 stroke-[3px]" />}
                                                Add First Floor (Floor 1)
                                            </button>
                                            <button
                                                onClick={() => handleAddFloor(0)}
                                                disabled={isSaving}
                                                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50"
                                            >
                                                <Plus className="size-4" />
                                                Add Ground Floor
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    floorConfigs.map((fc) => (
                                        <FloorLane
                                            key={fc.floor_key}
                                            floor={fc}
                                            units={sortUnitsSequential(units.filter((u) => u.floor === fc.floor_number))}
                                            onRemove={() => handleRemoveFloor(fc.floor_key)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Sidebar / Instructions */}
                        <div className="hidden xl:flex w-80 shrink-0 flex-col gap-6">
                            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Instructions</h4>
                                <ul className="mt-6 space-y-6">
                                    <li className="flex gap-4">
                                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-white">1</div>
                                        <p className="text-xs font-medium leading-relaxed text-neutral-400">
                                            Verify that each unit is assigned to its correct floor.
                                        </p>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-white">2</div>
                                        <p className="text-xs font-medium leading-relaxed text-neutral-400">
                                            Drag units between floor boards to reassign them instantly.
                                        </p>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-white">3</div>
                                        <p className="text-xs font-medium leading-relaxed text-neutral-400">
                                            Click <span className="font-black text-white">&quot;Generate Map&quot;</span> to auto-layout your unit map.
                                        </p>
                                    </li>
                                </ul>
                            </div>

                            <div className="mt-auto rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
                                <div className="flex items-center gap-3">
                                    <div className="size-2 rounded-full bg-primary animate-pulse" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">System Ready</p>
                                </div>
                                <p className="mt-3 text-xs font-medium text-neutral-500">
                                    All assignments are saved in real-time. You can always refine layouts on the canvas later.
                                </p>
                            </div>

                            {error && (
                                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3">
                                    <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-[10px] font-black text-red-200 uppercase leading-normal">{error}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <DragOverlay dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: {
                                active: {
                                    opacity: '0.4',
                                },
                            },
                        }),
                    }}>
                        {activeUnit ? (
                            <SortableUnit unit={activeUnit} isOverlay />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </main>

            {/* Batch Renumber & Rename Modal */}
            <AnimatePresence>
                {isRenumberModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <Hash className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white">Customize Unit Numbering</h3>
                                        <p className="text-xs text-neutral-400 font-medium">Batch renumber and label all units</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsRenumberModalOpen(false)}
                                    className="flex size-8 items-center justify-center rounded-xl bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white transition-all"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Prefix */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Unit Prefix / Label</label>
                                    <div className="flex flex-wrap gap-2">
                                        {["Unit", "Room", "Studio", "Apt", "Suite", "Villa", "Bed"].map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => setRenumberPrefix(preset)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                                    renumberPrefix === preset
                                                        ? "bg-primary text-black"
                                                        : "bg-white/5 text-white/70 hover:bg-white/10"
                                                }`}
                                            >
                                                {preset}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={renumberPrefix}
                                        onChange={(e) => setRenumberPrefix(e.target.value)}
                                        placeholder="Or type custom prefix (e.g. Tower A-)"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-xs font-black text-white outline-none focus:border-primary/50"
                                    />
                                </div>

                                {/* Scheme */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Numbering Pattern</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setRenumberStyle("floor_based")}
                                            className={`p-3.5 rounded-2xl border text-left transition-all ${
                                                renumberStyle === "floor_based"
                                                    ? "bg-primary/10 border-primary/50 text-white"
                                                    : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                                            }`}
                                        >
                                            <p className="text-xs font-black">Floor-Based</p>
                                            <p className="text-[10px] text-neutral-400 mt-0.5">101, 102 / 201, 202</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setRenumberStyle("sequential")}
                                            className={`p-3.5 rounded-2xl border text-left transition-all ${
                                                renumberStyle === "sequential"
                                                    ? "bg-primary/10 border-primary/50 text-white"
                                                    : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                                            }`}
                                        >
                                            <p className="text-xs font-black">Sequential</p>
                                            <p className="text-[10px] text-neutral-400 mt-0.5">1, 2, 3... or custom start</p>
                                        </button>
                                    </div>

                                    {renumberStyle === "sequential" && (
                                        <div className="pt-1">
                                            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Starting Number</label>
                                            <input
                                                type="number"
                                                value={renumberStartingNumber}
                                                onChange={(e) => setRenumberStartingNumber(parseInt(e.target.value) || 1)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-2.5 text-xs font-black text-white outline-none focus:border-primary/50 mt-1"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Preview */}
                                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                                        <Eye className="size-3.5 text-primary" />
                                        <span>Preview ({units.length} total units):</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {generateUnitList(
                                            Math.min(6, units.length),
                                            Math.max(1, floorConfigs.length),
                                            {
                                                prefix: renumberPrefix,
                                                numberingStyle: renumberStyle,
                                                startingNumber: renumberStartingNumber,
                                            }
                                        ).map((item, idx) => (
                                            <span key={idx} className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-[10px] font-black text-primary">
                                                {item.name}
                                            </span>
                                        ))}
                                        {units.length > 6 && (
                                            <span className="text-[10px] font-bold text-neutral-500">
                                                +{units.length - 6} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsRenumberModalOpen(false)}
                                    disabled={isRenumbering}
                                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleApplyRenumber}
                                    disabled={isRenumbering}
                                    className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
                                >
                                    {isRenumbering ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                                    Apply & Save
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}


