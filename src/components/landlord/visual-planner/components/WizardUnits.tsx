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

function SortableUnit({
    unit,
    isOverlay = false,
    onRemove,
    canRemove = true,
    isHighlighted = false,
}: {
    unit: DbUnit;
    isOverlay?: boolean;
    onRemove?: (unit: DbUnit) => void;
    canRemove?: boolean;
    isHighlighted?: boolean;
}) {
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

    const isDeletable = canRemove && unit.status?.toLowerCase() !== "occupied";

    return (
        <div
            ref={setNodeRef}
            style={style}
            data-tour-id={isHighlighted ? "tour-wizard-draggable-unit" : undefined}
            className={cn(
                "group relative flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 transition-all select-none",
                isDragging ? "opacity-30 grayscale ring-2 ring-primary cursor-grabbing" : "opacity-100 cursor-grab active:cursor-grabbing",
                isOverlay
                    ? "z-50 border-primary bg-background shadow-2xl ring-2 ring-primary/40 scale-105"
                    : isHighlighted
                        ? "border-primary bg-primary/10 ring-4 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_30px_rgba(155,119,255,0.85)] animate-pulse scale-102 z-30"
                        : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30 hover:shadow-xs text-foreground shadow-2xs active:scale-[0.99]"
            )}
            {...attributes}
            {...listeners}
            role="button"
            tabIndex={0}
            title={`Drag ${unit.name} to another floor`}
            aria-label={`Drag ${unit.name} to another floor`}
        >
            <div className="flex items-center gap-2.5 min-w-0">
                {isHighlighted && (
                    <span className="relative flex size-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full size-2 bg-primary"></span>
                    </span>
                )}
                
                <div className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md transition-colors",
                    isHighlighted ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground/60 group-hover:text-primary group-hover:bg-primary/10"
                )}>
                    <GripVertical className="size-4" />
                </div>
                
                {/* Room Name - Clear, Bold, High Contrast for Senior Readability */}
                <span className="font-bold text-sm text-foreground tracking-tight whitespace-nowrap">
                    {unit.name}
                </span>

                {isHighlighted && (
                    <span className="inline-flex items-center text-[10px] font-bold text-primary bg-primary/20 px-2 py-0.5 rounded-full border border-primary/30 shrink-0">
                        Drag Me
                    </span>
                )}
            </div>

            {onRemove && isDeletable && !isOverlay && (
                <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onRemove(unit);
                    }}
                    className="size-7 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                    title={`Remove ${unit.name}`}
                    aria-label={`Remove ${unit.name}`}
                >
                    <Trash2 className="size-3.5" />
                </button>
            )}
        </div>
    );
}

function FloorLane({
    floor,
    units,
    onRemove,
    canRemove = true,
    onRemoveUnit,
    canRemoveUnit = true,
    highlightedUnitId,
    isDropHighlighted = false,
}: {
    floor: FloorConfig;
    units: DbUnit[];
    onRemove: () => void;
    canRemove?: boolean;
    onRemoveUnit?: (unit: DbUnit) => void;
    canRemoveUnit?: boolean;
    highlightedUnitId?: string;
    isDropHighlighted?: boolean;
}) {
    const { setNodeRef, isOver } = useSortable({
        id: `floor-${floor.floor_number}`,
        data: { type: "floor", floorNumber: floor.floor_number },
    });

    const isUnassigned = floor.floor_number === -1;
    const floorShort = isUnassigned ? "!" : floor.floor_number === 0 ? "GF" : `${floor.floor_number}F`;
    const isEmpty = units.length === 0;

    return (
        <div className={cn(
            "rounded-2xl border bg-card shadow-xs overflow-hidden flex flex-col transition-all",
            isUnassigned 
                ? "border-amber-500/40 bg-amber-500/[0.02]" 
                : isEmpty 
                    ? "border-dashed border-border/70 bg-muted/[0.08]"
                    : "border-border/80 hover:border-border",
            isOver && "ring-2 ring-primary/50 border-primary bg-primary/[0.03]"
        )}>
            {/* Clean Floor Header */}
            <div className={cn(
                "px-4 sm:px-5 py-3 flex items-center justify-between border-b transition-colors",
                isUnassigned
                    ? "bg-amber-500/10 border-amber-500/20"
                    : isOver
                        ? "bg-primary/10 border-primary/20"
                        : "bg-muted/30 border-border/60"
            )}>
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "flex size-8 sm:size-9 items-center justify-center rounded-xl font-bold text-xs border shadow-2xs",
                        isUnassigned
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : "bg-primary/10 text-primary border-primary/20"
                    )}>
                        {floorShort}
                    </div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground">
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
                </div>

                <div className="flex items-center gap-2.5">
                    {isDropHighlighted ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/15 px-3 py-1 rounded-full border border-primary/30 animate-pulse shadow-xs">
                            <Move className="size-3 animate-bounce" />
                            <span>Target Drop Zone</span>
                        </span>
                    ) : null}
                    
                    <span className={cn(
                        "text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs",
                        isUnassigned
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : isEmpty
                                ? "bg-muted text-muted-foreground border-border/60"
                                : "bg-background text-foreground border-border/80"
                    )}>
                        {units.length} {units.length === 1 ? "Room" : "Rooms"}
                    </span>
                </div>
            </div>

            {/* Floor Lane Dropzone Tray */}
            <div
                ref={setNodeRef}
                data-tour-id={isDropHighlighted ? "tour-wizard-dropzone" : undefined}
                className={cn(
                    "p-3 sm:p-4 flex-1 transition-all",
                    isEmpty ? "min-h-[56px] flex items-center justify-center" : "min-h-[100px]",
                    isOver && "bg-primary/[0.02]",
                    isDropHighlighted && "ring-2 ring-primary/40 border-primary/40 bg-primary/[0.03] border-dashed"
                )}
            >
                {units.length > 0 ? (
                    <SortableContext items={units.map((u) => u.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {units.map((unit) => (
                                <SortableUnit
                                    key={unit.id}
                                    unit={unit}
                                    onRemove={onRemoveUnit}
                                    canRemove={canRemoveUnit}
                                    isHighlighted={unit.id === highlightedUnitId}
                                />
                            ))}
                        </div>
                    </SortableContext>
                ) : (
                    <div className="flex items-center justify-center gap-2 py-2 text-center">
                        <Layers className="size-4 text-muted-foreground/40" />
                        <p className="text-xs font-medium text-muted-foreground">
                            Empty floor • Drag rooms here to assign
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export { SortableUnit, FloorLane, floorDisplayName };
export type { DbUnit, FloorConfig };