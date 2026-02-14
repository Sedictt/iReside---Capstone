"use client";

import { useState } from "react";
import { DndContext, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";

function DraggableUnit({ id, name }: { id: string; name: string }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: id,
    });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
        : undefined;

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border border-blue-500/20 bg-blue-600/10 p-2 text-center text-xs font-medium text-blue-400 backdrop-blur-sm transition-colors hover:border-blue-500 hover:bg-blue-600/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {name}
        </motion.div>
    );
}

function DroppableArea({ id, children }: { id: string; children: React.ReactNode }) {
    const { isOver, setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`relative flex min-h-[400px] w-full flex-wrap gap-4 rounded-xl border-2 border-dashed p-8 transition-colors ${isOver
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-slate-800 bg-slate-900/50"
                }`}
        >
            {children}
            {/* Background Grid */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>
    );
}

export default function VisualPlannerPage() {
    const [parent, setParent] = useState<Record<string, string>>({
        "unit-1": "staging",
        "unit-2": "staging",
        "unit-3": "floor-1",
    });

    const handleDragEnd = (event: any) => {
        const { over, active } = event;
        if (over) {
            setParent((prev) => ({
                ...prev,
                [active.id]: over.id,
            }));
        }
    };

    const units = [
        { id: "unit-1", name: "Unit 101" },
        { id: "unit-2", name: "Unit 102" },
        { id: "unit-3", name: "Unit 201" },
        { id: "unit-4", name: "Penthouse" },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Visual Floor Planner</h1>
                    <p className="text-slate-400">Drag and drop units to arrange floor plans</p>
                </div>
            </div>

            <DndContext onDragEnd={handleDragEnd}>
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Staging Area */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-300">Staging Area</h2>
                        <DroppableArea id="staging">
                            {units
                                .filter((u) => parent[u.id] === "staging" || !parent[u.id])
                                .map((u) => (
                                    <DraggableUnit key={u.id} id={u.id} name={u.name} />
                                ))}
                        </DroppableArea>
                    </div>

                    {/* Floor 1 */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-300">Floor 1 Layout</h2>
                        <DroppableArea id="floor-1">
                            {units
                                .filter((u) => parent[u.id] === "floor-1")
                                .map((u) => (
                                    <DraggableUnit key={u.id} id={u.id} name={u.name} />
                                ))}
                        </DroppableArea>
                    </div>
                </div>
            </DndContext>
        </div>
    );
}
