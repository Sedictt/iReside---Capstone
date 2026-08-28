"use client";

import { Layers, Trash2, GripVertical } from "lucide-react";
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative flex items-center gap-2 rounded-xl border p-3 transition-all cursor-grab active:cursor-grabbing",
                isDragging ? "opacity-30 grayscale" : "opacity-100",
                isOverlay
                    ? "z-50 border-primary bg-primary/10 shadow-2xl shadow-primary/20 scale-105"
                    : "border-border/70 bg-card hover:border-primary/40 hover:bg-muted/40 text-card-foreground shadow-xs active:scale-95"
            )}
            {...attributes}
            {...listeners}
        >
            <GripVertical className="size-3.5 text-muted-foreground/60 transition-colors group-hover:text-foreground" />
            <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-black text-foreground">{unit.name}</p>
            </div>
            <div className="flex size-5 items-center justify-center rounded-md bg-muted text-[10px] font-black text-muted-foreground">
                {unit.beds}B
            </div>
        </div>
    );
}

function FloorLane({ floor, units, onRemove }: { floor: FloorConfig; units: DbUnit[]; onRemove: () => void }) {
    const { setNodeRef } = useSortable({
        id: `floor-${floor.floor_number}`,
        data: { type: "floor", floorNumber: floor.floor_number },
    });

    return (
        <div className="group flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Layers className="size-3.5" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
                        {floorDisplayName(floor)}
                    </h3>
                    <button
                        onClick={onRemove}
                        className="ml-2 size-7 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500/60 hover:bg-rose-500 hover:text-white transition-all shadow-xs"
                        title="Remove Floor"
                    >
                        <Trash2 className="size-3.5" />
                    </button>
                </div>
                <span className="text-[10px] font-black text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full border border-border/60">
                    {units.length} Units
                </span>
            </div>

            <div
                ref={setNodeRef}
                className={cn(
                    "relative min-h-[110px] rounded-[1.75rem] border-2 border-dashed p-4 transition-colors bg-muted/20 border-border/60",
                    units.length === 0 && "border-border/40"
                )}
            >
                <SortableContext items={units.map(u => u.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {units.map((unit) => (
                            <SortableUnit key={unit.id} unit={unit} />
                        ))}
                    </div>
                </SortableContext>

                {units.length === 0 && (
                    <div className="flex h-16 items-center justify-center text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            Drop units here
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export { SortableUnit, FloorLane, floorDisplayName };
export type { DbUnit, FloorConfig };