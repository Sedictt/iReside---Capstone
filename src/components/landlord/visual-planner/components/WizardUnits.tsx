"use client";

import { Layers, Trash2, GripVertical, Move } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";

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

const floorDisplayName = (fc: FloorConfig) => {
    if (fc.display_name) return fc.display_name;
    if (fc.floor_number === 0) return "Ground Floor";
    return `Floor ${fc.floor_number}`;
};

function SortableUnit({ unit, isOverlay = false }: { unit: DbUnit; isOverlay?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: unit.id, data: { unit } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const bedLabel = unit.beds === 0 ? "Studio" : `${unit.beds} Bed`;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative flex items-center justify-between gap-3 rounded-xl border p-2.5 sm:p-3 transition-all cursor-grab active:cursor-grabbing select-none",
                isDragging ? "opacity-30 grayscale ring-2 ring-primary" : "opacity-100",
                isOverlay
                    ? "z-50 border-primary bg-background shadow-2xl ring-2 ring-primary/40 scale-105"
                    : "border-border/90 bg-background hover:border-primary/50 hover:bg-accent/40 hover:shadow-xs hover:-translate-y-0.5 text-foreground shadow-2xs active:scale-[0.98]"
            )}
            {...attributes}
            {...listeners}
            role="button"
            tabIndex={0}
            title={`Drag ${unit.name} to another floor`}
            aria-label={`Drag ${unit.name} to another floor, ${bedLabel}`}
        >
            <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <GripVertical className="size-3.5" />
                </div>
                <span className="truncate text-xs font-bold text-foreground tracking-tight">{unit.name}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-semibold text-muted-foreground bg-muted/70 px-2 py-0.5 rounded-md border border-border/50">
                    {bedLabel}
                </span>
            </div>
        </div>
    );
}

function FloorLane({
    floor,
    units,
    onRemove,
    canRemove = true,
}: {
    floor: FloorConfig;
    units: DbUnit[];
    onRemove: () => void;
    canRemove?: boolean;
}) {
    const { setNodeRef, isOver } = useSortable({
        id: `floor-${floor.floor_number}`,
        data: { type: "floor", floorNumber: floor.floor_number },
    });

    const isUnassigned = floor.floor_number === -1;
    const floorShort = isUnassigned ? "!" : floor.floor_number === 0 ? "GF" : `${floor.floor_number}F`;
    const floorSubtitle = isUnassigned 
        ? "Units needing assignment" 
        : floor.floor_number === 0 
            ? "Ground Floor" 
            : `Level ${floor.floor_number}`;

    return (
        <div className={cn(
            "rounded-2xl border bg-card/90 shadow-xs overflow-hidden flex flex-col transition-all",
            isUnassigned 
                ? "border-amber-500/40 bg-amber-500/[0.02]" 
                : "border-border/80 hover:border-border",
            isOver && "ring-2 ring-primary/50 border-primary bg-primary/[0.03]"
        )}>
            {/* Integrated Architectural Floor Header */}
            <div className={cn(
                "px-5 py-3.5 flex items-center justify-between border-b transition-colors",
                isUnassigned
                    ? "bg-amber-500/10 border-amber-500/20"
                    : isOver
                        ? "bg-primary/10 border-primary/20"
                        : "bg-muted/40 border-border/70"
            )}>
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "flex size-9 items-center justify-center rounded-xl font-bold text-xs border shadow-2xs",
                        isUnassigned
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : "bg-primary/10 text-primary border-primary/20"
                    )}>
                        {floorShort}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold tracking-tight text-foreground">
                                {floorDisplayName(floor)}
                            </h3>
                            {canRemove && !isUnassigned && (
                                <button
                                    type="button"
                                    onClick={onRemove}
                                    className="size-6 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                                    title={`Remove ${floorDisplayName(floor)}`}
                                    aria-label={`Remove ${floorDisplayName(floor)}`}
                                >
                                    <Trash2 className="size-3.5" />
                                </button>
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium">
                            {floorSubtitle}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/80">
                        <Move className="size-3 text-muted-foreground/60" />
                        <span>Drag units to move</span>
                    </span>
                    <span className="text-muted-foreground/30 hidden sm:inline">•</span>
                    <span className={cn(
                        "text-xs font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs",
                        isUnassigned
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-background text-foreground border-border/80"
                    )}>
                        {units.length} {units.length === 1 ? "Unit" : "Units"}
                    </span>
                </div>
            </div>

            {/* Floor Lane Dropzone Tray */}
            <div
                ref={setNodeRef}
                className={cn(
                    "p-4 sm:p-5 flex-1 min-h-[160px] transition-all",
                    units.length === 0 && "flex items-center justify-center bg-muted/10 border-2 border-dashed border-border/60 m-3 rounded-xl",
                    isOver && "bg-primary/[0.02]"
                )}
            >
                <SortableContext items={units.map((u) => u.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {units.map((unit) => (
                            <SortableUnit key={unit.id} unit={unit} />
                        ))}
                    </div>
                </SortableContext>

                {units.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center p-6">
                        <Layers className="size-6 text-muted-foreground/30 mb-1.5" />
                        <p className="text-xs font-semibold text-muted-foreground">
                            No units on this floor
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                            Drag units from other floors to assign them here
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export { SortableUnit, FloorLane, floorDisplayName };
export type { DbUnit, FloorConfig };