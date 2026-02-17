"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { flushSync } from "react-dom";
import styles from "./blueprint.module.css";
// We are using Material Icons via the CDN link in layout.tsx, so we use standard <span> tags for icons.

interface Unit {
    id: string;
    name: string;
    type: "Studio" | "1BR" | "2BR" | "3BR";
    status: "occupied" | "vacant" | "maintenance" | "neardue";
    tenant?: string;
    x: number;
    y: number;
    w: number;
    h: number;
    details?: string;
    leaseStart?: string;
    leaseEnd?: string;
}

interface DragGhostState {
    unitId: string;
    kind: "unit" | "corridor" | "structure";
    label?: string;
    structureType?: "elevator" | "stairwell";
    stairVariant?: Structure["variant"];
    stairRotation?: number;
    x: number;
    y: number;
    w: number;
    h: number;
    isValid: boolean;
}

interface Corridor {
    id: string;
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

type FloorId = string;

interface FloorLayout {
    units: Unit[];
    corridors: Corridor[];
    structures: Structure[];
}

type CorridorResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";



type SidebarBlockType = "studio" | "1br" | "2br" | "3br" | "corridor" | "elevator" | "stair-straight" | "stair-l" | "stair-u" | "stair-spiral";
type CanvasItemKind = "unit" | "corridor" | "structure";

interface Structure {
    id: string;
    type: "elevator" | "stairwell";
    variant?: "straight" | "l-shape" | "u-shape" | "spiral";
    rotation?: number;
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

interface SelectedCanvasItem {
    kind: CanvasItemKind;
    id: string;
}

interface PendingDeleteState {
    item: SelectedCanvasItem;
    source: "keyboard" | "trash";
}

interface SidebarBlockGhost {
    blockType: SidebarBlockType;
    unitType?: Unit["type"];
    stairVariant?: Structure["variant"];
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
    isValid: boolean;
}

const INITIAL_UNITS: Unit[] = [
    {
        id: "101",
        name: "Unit 101",
        type: "1BR",
        status: "occupied",
        tenant: "J. Doe",
        x: 20,
        y: 20,
        w: 200,
        h: 140,
        details: "1BR Standard",
        leaseStart: "2023-01-01",
        leaseEnd: "2024-01-01"
    },
    {
        id: "102",
        name: "Unit 102",
        type: "1BR",
        status: "vacant",
        x: 240,
        y: 20,
        w: 200,
        h: 140,
        details: "Listed 2d ago"
    },
    {
        id: "103",
        name: "Unit 103",
        type: "2BR",
        status: "maintenance",
        x: 460,
        y: 20,
        w: 200,
        h: 140,
        details: "HVAC Repair",
        leaseEnd: "ETA: 2 Days"
    },
    {
        id: "104",
        name: "Unit 104 (Suite)",
        type: "3BR",
        status: "neardue",
        tenant: "M. Scott",
        x: 680,
        y: 20,
        w: 280,
        h: 140,
        leaseStart: "2023-05-01",
        leaseEnd: "2024-05-01",
        details: "Lease ends in 15 days"
    },
];

const LEGEND_VISIBILITY_STORAGE_KEY = "ireside.visualPlanner.legendVisible";
const FLOOR_LAYOUTS_STORAGE_KEY = "ireside.visualPlanner.floorLayouts";
const ACTIVE_FLOOR_STORAGE_KEY = "ireside.visualPlanner.activeFloor";
const EMPTY_FLOOR_LAYOUT: FloorLayout = { units: [], corridors: [], structures: [] };
const DEFAULT_ACTIVE_FLOOR = "floor1";
const DEFAULT_FLOOR_LAYOUTS: Record<FloorId, FloorLayout> = {
    ground: { units: [], corridors: [], structures: [] },
    floor1: { units: INITIAL_UNITS, corridors: [], structures: [] },
    floor2: { units: [], corridors: [], structures: [] },
};

const parseFloorNumber = (floorId: FloorId) => {
    const match = /^floor(\d+)$/i.exec(floorId);
    if (!match) return null;
    const parsed = Number.parseInt(match[1], 10);
    return Number.isFinite(parsed) ? parsed : null;
};

const getFloorDisplayLabel = (floorId: FloorId) => {
    if (floorId === "ground") return "Ground";
    const floorNumber = parseFloorNumber(floorId);
    if (floorNumber !== null) return `Floor ${floorNumber}`;
    return floorId.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatFloorWatermark = (floorId: FloorId) => getFloorDisplayLabel(floorId).toUpperCase();

export default function VisualBuilder() {
    const GRID_SIZE = 20;
    const PAN_MARGIN = 280;
    const BLUEPRINT_MARGIN = 20;
    const SIDEBAR_BLOCK_DRAG_TYPE = "ireside/block";

    const [scale, setScale] = useState(1);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [activeFloor, setActiveFloor] = useState<FloorId>(DEFAULT_ACTIVE_FLOOR);
    const [draggingUnitId, setDraggingUnitId] = useState<string | null>(null);
    const [draggingCorridorId, setDraggingCorridorId] = useState<string | null>(null);
    const [draggingStructureId, setDraggingStructureId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const blueprintRef = useRef<HTMLDivElement>(null);
    const minimapRef = useRef<HTMLDivElement>(null);
    const minimapDragOffsetRef = useRef({ x: 0, y: 0 });
    const overlapToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const deleteToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isPanningRef = useRef(false);
    const panPointerIdRef = useRef<number | null>(null);
    const panStartPointerRef = useRef({ x: 0, y: 0 });
    const panStartPositionRef = useRef({ x: 0, y: 0 });
    const [units, setUnits] = useState(INITIAL_UNITS);
    const [isMinimapDragging, setIsMinimapDragging] = useState(false);
    const [viewportSize, setViewportSize] = useState({ width: 1280, height: 900 });
    const [showOverlapToast, setShowOverlapToast] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [dragGhost, setDragGhost] = useState<DragGhostState | null>(null);
    const [corridors, setCorridors] = useState<Corridor[]>([]);
    const [structures, setStructures] = useState<Structure[]>([]);
    const [selectedItem, setSelectedItem] = useState<SelectedCanvasItem | null>(null);
    const [pendingDelete, setPendingDelete] = useState<PendingDeleteState | null>(null);
    const [isTrashHot, setIsTrashHot] = useState(false);
    const [showDeleteToast, setShowDeleteToast] = useState(false);
    const [showLegend, setShowLegend] = useState(true);
    const [sidebarBlockGhost, setSidebarBlockGhost] = useState<SidebarBlockGhost | null>(null);
    const [resizingCorridorId, setResizingCorridorId] = useState<string | null>(null);
    const [floorLayouts, setFloorLayouts] = useState<Record<FloorId, FloorLayout>>(DEFAULT_FLOOR_LAYOUTS);
    const [hasHydratedFloorState, setHasHydratedFloorState] = useState(false);
    const [showFloorTabsScrollHint, setShowFloorTabsScrollHint] = useState(false);
    const scaleRef = useRef(scale);
    const trashRef = useRef<HTMLDivElement>(null);
    const floorTabsScrollRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<FloorLayout[]>([DEFAULT_FLOOR_LAYOUTS[DEFAULT_ACTIVE_FLOOR]]);
    const historyIndexRef = useRef(0);
    const isUndoingRef = useRef(false);

    // Helper to update undo availability state
    const [undoAvailable, setUndoAvailable] = useState(false);

    // Auto-record history on changes
    useEffect(() => {
        if (isUndoingRef.current) {
            isUndoingRef.current = false;
            return;
        }

        const currentLayout: FloorLayout = {
            units,
            corridors,
            structures,
        };

        const lastLayout = historyRef.current[historyIndexRef.current];

        // Deep compare to avoid duplicates
        if (JSON.stringify(currentLayout) === JSON.stringify(lastLayout)) return;

        // If we are not at the end of history, truncate the future
        const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
        newHistory.push(currentLayout);

        // Limit history size
        if (newHistory.length > 50) {
            newHistory.shift();
        }

        historyRef.current = newHistory;
        historyIndexRef.current = newHistory.length - 1;
        setUndoAvailable(historyIndexRef.current > 0);
    }, [units, corridors, structures]);

    const performUndo = useCallback(() => {
        if (historyIndexRef.current <= 0) return;

        // Mark as undoing so the effect doesn't record this state change as a new action
        isUndoingRef.current = true;

        historyIndexRef.current -= 1;
        const previousLayout = historyRef.current[historyIndexRef.current];

        setUnits(previousLayout.units);
        setCorridors(previousLayout.corridors);
        setStructures(previousLayout.structures);
        setUndoAvailable(historyIndexRef.current > 0);
    }, []);

    const [extraDimensions, setExtraDimensions] = useState({ width: 0, height: 0 });

    const BLUEPRINT_WIDTH = Math.max(420, viewportSize.width - BLUEPRINT_MARGIN * 2) + extraDimensions.width;
    const BLUEPRINT_HEIGHT = Math.max(320, viewportSize.height - BLUEPRINT_MARGIN * 2) + extraDimensions.height;
    const WORLD_WIDTH = BLUEPRINT_WIDTH + BLUEPRINT_MARGIN * 2;
    const WORLD_HEIGHT = BLUEPRINT_HEIGHT + BLUEPRINT_MARGIN * 2;

    const extraDimensionsRef = useRef(extraDimensions);
    const worldDimensionsRef = useRef({ width: WORLD_WIDTH, height: WORLD_HEIGHT });

    useEffect(() => {
        extraDimensionsRef.current = extraDimensions;
        worldDimensionsRef.current = { width: WORLD_WIDTH, height: WORLD_HEIGHT };
    }, [extraDimensions, WORLD_WIDTH, WORLD_HEIGHT]);

    const updateCanvasDimensions = useCallback((
        activeItem?: { kind: CanvasItemKind; id: string; x: number; y: number; w: number; h: number }
    ) => {
        const padding = 100;
        const MIN_BLUEPRINT_WIDTH = Math.max(420, viewportSize.width - BLUEPRINT_MARGIN * 2);
        const MIN_BLUEPRINT_HEIGHT = Math.max(320, viewportSize.height - BLUEPRINT_MARGIN * 2);

        let maxX = 0;
        let maxY = 0;

        const consider = (x: number, y: number, w: number, h: number) => {
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);
        };

        units.forEach(u => {
            if (activeItem?.kind === "unit" && activeItem.id === u.id) return;
            consider(u.x, u.y, u.w, u.h);
        });
        corridors.forEach(c => {
            if (activeItem?.kind === "corridor" && activeItem.id === c.id) return;
            consider(c.x, c.y, c.w, c.h);
        });
        structures.forEach(s => {
            if (activeItem?.kind === "structure" && activeItem.id === s.id) return;
            consider(s.x, s.y, s.w, s.h);
        });

        if (activeItem) {
            consider(activeItem.x, activeItem.y, activeItem.w, activeItem.h);
        }

        const newExtraW = Math.max(0, maxX + padding - MIN_BLUEPRINT_WIDTH);
        const newExtraH = Math.max(0, maxY + padding - MIN_BLUEPRINT_HEIGHT);

        if (newExtraW !== extraDimensionsRef.current.width || newExtraH !== extraDimensionsRef.current.height) {
            setExtraDimensions({ width: newExtraW, height: newExtraH });
        }
    }, [units, corridors, structures, viewportSize]);

    const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;
    const clampUnitAxis = (value: number, size: number, maxSize: number) => Math.max(0, Math.min(maxSize - size, value));
    const getSnappedUnitPosition = (unit: Unit, offsetX: number, offsetY: number) => {
        const rawX = unit.x + offsetX;
        const rawY = unit.y + offsetY;
        const snappedX = snapToGrid(rawX);
        const snappedY = snapToGrid(rawY);
        return {
            x: clampUnitAxis(snappedX, unit.w, BLUEPRINT_WIDTH),
            y: clampUnitAxis(snappedY, unit.h, BLUEPRINT_HEIGHT),
        };
    };

    const doesOverlap = (
        movingUnit: Unit,
        nextX: number,
        nextY: number,
        allUnits: Unit[]
    ) => allUnits.some((otherUnit) => {
        if (otherUnit.id === movingUnit.id) return false;

        return (
            nextX < otherUnit.x + otherUnit.w &&
            nextX + movingUnit.w > otherUnit.x &&
            nextY < otherUnit.y + otherUnit.h &&
            nextY + movingUnit.h > otherUnit.y
        );
    });

    const doesRectOverlap = (
        rectA: { x: number; y: number; w: number; h: number },
        rectB: { x: number; y: number; w: number; h: number }
    ) => (
        rectA.x < rectB.x + rectB.w &&
        rectA.x + rectA.w > rectB.x &&
        rectA.y < rectB.y + rectB.h &&
        rectA.y + rectA.h > rectB.y
    );

    const hasCollisionWithPlacedItems = (
        rect: { x: number; y: number; w: number; h: number },
        ignoredItem?: SelectedCanvasItem
    ) => {
        const collidesWithUnits = units.some((unit) => {
            if (ignoredItem?.kind === "unit" && ignoredItem.id === unit.id) return false;
            return doesRectOverlap(rect, unit);
        });
        if (collidesWithUnits) return true;

        const collidesWithCorridors = corridors.some((corridor) => {
            if (ignoredItem?.kind === "corridor" && ignoredItem.id === corridor.id) return false;
            return doesRectOverlap(rect, corridor);
        });
        if (collidesWithCorridors) return true;

        return structures.some((structure) => {
            if (ignoredItem?.kind === "structure" && ignoredItem.id === structure.id) return false;
            return doesRectOverlap(rect, structure);
        });
    };

    const handleCorridorResizeStart = (corridor: Corridor, handle: CorridorResizeHandle) => (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        setSelectedItem({ kind: "corridor", id: corridor.id });
        setResizingCorridorId(corridor.id);

        const startPointerX = e.clientX;
        const startPointerY = e.clientY;
        const startLeft = corridor.x;
        const startTop = corridor.y;
        const startRight = corridor.x + corridor.w;
        const startBottom = corridor.y + corridor.h;
        const minSize = GRID_SIZE * 2;

        const onPointerMove = (moveEvent: PointerEvent) => {
            const deltaX = (moveEvent.clientX - startPointerX) / scaleRef.current;
            const deltaY = (moveEvent.clientY - startPointerY) / scaleRef.current;

            let left = startLeft;
            let top = startTop;
            let right = startRight;
            let bottom = startBottom;

            if (handle.includes("w")) left = snapToGrid(startLeft + deltaX);
            if (handle.includes("e")) right = snapToGrid(startRight + deltaX);
            if (handle.includes("n")) top = snapToGrid(startTop + deltaY);
            if (handle.includes("s")) bottom = snapToGrid(startBottom + deltaY);

            if (right - left < minSize) {
                if (handle.includes("w") && !handle.includes("e")) {
                    left = right - minSize;
                } else {
                    right = left + minSize;
                }
            }

            if (bottom - top < minSize) {
                if (handle.includes("n") && !handle.includes("s")) {
                    top = bottom - minSize;
                } else {
                    bottom = top + minSize;
                }
            }

            if (left < 0) {
                if (handle.includes("w") && !handle.includes("e")) {
                    left = 0;
                } else {
                    right = right - left;
                    left = 0;
                }
            }
            if (top < 0) {
                if (handle.includes("n") && !handle.includes("s")) {
                    top = 0;
                } else {
                    bottom = bottom - top;
                    top = 0;
                }
            }
            if (right > BLUEPRINT_WIDTH) {
                if (handle.includes("e") && !handle.includes("w")) {
                    right = BLUEPRINT_WIDTH;
                } else {
                    left = left - (right - BLUEPRINT_WIDTH);
                    right = BLUEPRINT_WIDTH;
                }
            }
            if (bottom > BLUEPRINT_HEIGHT) {
                if (handle.includes("s") && !handle.includes("n")) {
                    bottom = BLUEPRINT_HEIGHT;
                } else {
                    top = top - (bottom - BLUEPRINT_HEIGHT);
                    bottom = BLUEPRINT_HEIGHT;
                }
            }

            left = Math.max(0, left);
            top = Math.max(0, top);

            const resizedRect = {
                x: left,
                y: top,
                w: Math.max(minSize, right - left),
                h: Math.max(minSize, bottom - top),
            };

            const hasCollision = hasCollisionWithPlacedItems(resizedRect, { kind: "corridor", id: corridor.id });
            if (hasCollision) return;

            setCorridors(prev => prev.map(existing => (
                existing.id === corridor.id
                    ? { ...existing, ...resizedRect }
                    : existing
            )));
        };

        const onPointerEnd = () => {
            setResizingCorridorId(null);
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerEnd);
            window.removeEventListener("pointercancel", onPointerEnd);
        };

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerEnd);
        window.addEventListener("pointercancel", onPointerEnd);
    };

    const clampPosition = (nextX: number, nextY: number, currentScale = scale) => {
        const container = containerRef.current;
        if (!container) return { x: nextX, y: nextY };

        // Use ref values if available to ensure latest state in event handlers
        const currentWorldWidth = worldDimensionsRef.current.width;
        const currentWorldHeight = worldDimensionsRef.current.height;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const scaledWorldWidth = currentWorldWidth * currentScale;
        const scaledWorldHeight = currentWorldHeight * currentScale;

        const centerX = (containerWidth - scaledWorldWidth) / 2;
        const centerY = (containerHeight - scaledWorldHeight) / 2;

        const minX = scaledWorldWidth <= containerWidth
            ? centerX - PAN_MARGIN
            : containerWidth - scaledWorldWidth - PAN_MARGIN;
        const maxX = scaledWorldWidth <= containerWidth
            ? centerX + PAN_MARGIN
            : PAN_MARGIN;

        const minY = scaledWorldHeight <= containerHeight
            ? centerY - PAN_MARGIN
            : containerHeight - scaledWorldHeight - PAN_MARGIN;
        const maxY = scaledWorldHeight <= containerHeight
            ? centerY + PAN_MARGIN
            : PAN_MARGIN;

        const clampedX = Math.max(minX, Math.min(maxX, nextX));
        const clampedY = Math.max(minY, Math.min(maxY, nextY));

        return { x: clampedX, y: clampedY };
    };

    const syncViewportSize = () => {
        const container = containerRef.current;
        if (!container) return;
        setViewportSize({
            width: container.clientWidth,
            height: container.clientHeight,
        });
    };

    const triggerOverlapToast = () => {
        setShowOverlapToast(true);
        if (overlapToastTimeoutRef.current) {
            clearTimeout(overlapToastTimeoutRef.current);
        }
        overlapToastTimeoutRef.current = setTimeout(() => {
            setShowOverlapToast(false);
            overlapToastTimeoutRef.current = null;
        }, 1300);
    };

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
    const handleFit = () => {
        setScale(1);
        setPosition(clampPosition(0, 0, 1));
        setExtraDimensions({ width: 0, height: 0 });
    };

    const handleUndo = () => {
        performUndo();
    };

    const totalArea = 42500;

    const switchFloor = (nextFloor: FloorId) => {
        if (nextFloor === activeFloor) return;

        const snapshot: FloorLayout = {
            units,
            corridors,
            structures,
        };

        const nextLayout = floorLayouts[nextFloor] ?? EMPTY_FLOOR_LAYOUT;

        setFloorLayouts((prev) => ({
            ...prev,
            [activeFloor]: snapshot,
        }));

        setUnits(nextLayout.units);
        setCorridors(nextLayout.corridors);
        setStructures(nextLayout.structures);

        setActiveFloor(nextFloor);
        setSelectedItem(null);
        setDragGhost(null);
        setSidebarBlockGhost(null);
        setPendingDelete(null);
        setDraggingUnitId(null);
        setDraggingCorridorId(null);
        setDraggingStructureId(null);
        setIsTrashHot(false);
        setResizingCorridorId(null);

        // Reset History on floor switch for the NEW floor's initial state
        isUndoingRef.current = true; // Prevent effect from double recording
        historyRef.current = [{
            units: nextLayout.units,
            corridors: nextLayout.corridors,
            structures: nextLayout.structures
        }];
        historyIndexRef.current = 0;
        setUndoAvailable(false);

        setExtraDimensions({ width: 0, height: 0 });
    };

    const createFloor = () => {
        const existingFloorNumbers = Object.keys(floorLayouts)
            .map((floorId) => parseFloorNumber(floorId))
            .filter((floorNumber): floorNumber is number => floorNumber !== null);

        const nextFloorNumber = existingFloorNumbers.length > 0 ? Math.max(...existingFloorNumbers) + 1 : 1;
        const nextFloorId = `floor${nextFloorNumber}`;

        if (nextFloorId === activeFloor) return;

        const snapshot: FloorLayout = {
            units,
            corridors,
            structures,
        };

        setFloorLayouts((prev) => ({
            ...prev,
            [activeFloor]: snapshot,
            [nextFloorId]: prev[nextFloorId] ?? EMPTY_FLOOR_LAYOUT,
        }));

        setActiveFloor(nextFloorId);
        setUnits([]);
        setCorridors([]);
        setStructures([]);
        setSelectedItem(null);
        setDragGhost(null);
        setSidebarBlockGhost(null);
        setPendingDelete(null);
        setDraggingUnitId(null);
        setDraggingCorridorId(null);
        setDraggingStructureId(null);
        setIsTrashHot(false);
        setResizingCorridorId(null);
        // Reset History for new floor
        isUndoingRef.current = true; // Prevent effect from double recording
        historyRef.current = [EMPTY_FLOOR_LAYOUT];
        historyIndexRef.current = 0;
        setUndoAvailable(false);

        setExtraDimensions({ width: 0, height: 0 });
    };

    const handleViewportPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (draggingUnitId !== null || draggingCorridorId !== null || draggingStructureId !== null || e.button !== 0) return;
        if ((e.target as HTMLElement).closest('[data-unit-card="true"]')) return;
        if ((e.target as HTMLElement).closest('[data-corridor-card="true"]')) return;
        if ((e.target as HTMLElement).closest('[data-structure-card="true"]')) return;

        setSelectedItem(null);

        isPanningRef.current = true;
        setIsPanning(true);
        panPointerIdRef.current = e.pointerId;
        panStartPointerRef.current = { x: e.clientX, y: e.clientY };
        panStartPositionRef.current = position;
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handleViewportPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isPanningRef.current || panPointerIdRef.current !== e.pointerId) return;

        const deltaX = e.clientX - panStartPointerRef.current.x;
        const deltaY = e.clientY - panStartPointerRef.current.y;
        setPosition(clampPosition(
            panStartPositionRef.current.x + deltaX,
            panStartPositionRef.current.y + deltaY,
            scaleRef.current
        ));
    };

    const endViewportPan = (e: React.PointerEvent<HTMLDivElement>) => {
        if (panPointerIdRef.current !== e.pointerId) return;
        isPanningRef.current = false;
        setIsPanning(false);
        panPointerIdRef.current = null;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
    };

    useEffect(() => {
        scaleRef.current = scale;
    }, [scale]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            const isZoomGesture = e.ctrlKey || e.metaKey;
            if (isZoomGesture) {
                e.preventDefault();
                setScale(prevScale => {
                    const nextScale = prevScale - e.deltaY * 0.001;
                    return Math.min(Math.max(nextScale, 0.5), 3);
                });
                return;
            }

            e.preventDefault();
            const horizontalDelta = e.shiftKey && e.deltaX === 0 ? e.deltaY : e.deltaX;
            const verticalDelta = e.shiftKey && e.deltaX === 0 ? 0 : e.deltaY;
            setPosition(prev => clampPosition(
                prev.x - horizontalDelta,
                prev.y - verticalDelta,
                scaleRef.current
            ));
        };

        // Add non-passive event listener to allow preventing default
        container.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            container.removeEventListener("wheel", handleWheel);
        };
    }, []);

    useEffect(() => {
        syncViewportSize();
        window.addEventListener("resize", syncViewportSize);
        return () => window.removeEventListener("resize", syncViewportSize);
    }, []);

    useEffect(() => () => {
        if (overlapToastTimeoutRef.current) {
            clearTimeout(overlapToastTimeoutRef.current);
        }
        if (deleteToastTimeoutRef.current) {
            clearTimeout(deleteToastTimeoutRef.current);
        }
    }, []);

    useEffect(() => {
        setPosition(prev => clampPosition(prev.x, prev.y));
    }, [scale]);

    useEffect(() => {
        setUnits(prevUnits => {
            let changed = false;
            const nextUnits = prevUnits.map((unit) => {
                const nextX = clampUnitAxis(unit.x, unit.w, BLUEPRINT_WIDTH);
                const nextY = clampUnitAxis(unit.y, unit.h, BLUEPRINT_HEIGHT);
                if (nextX !== unit.x || nextY !== unit.y) {
                    changed = true;
                    return { ...unit, x: nextX, y: nextY };
                }
                return unit;
            });
            return changed ? nextUnits : prevUnits;
        });
        setCorridors(prevCorridors => {
            let changed = false;
            const nextCorridors = prevCorridors.map((corridor) => {
                const nextX = clampUnitAxis(corridor.x, corridor.w, BLUEPRINT_WIDTH);
                const nextY = clampUnitAxis(corridor.y, corridor.h, BLUEPRINT_HEIGHT);
                if (nextX !== corridor.x || nextY !== corridor.y) {
                    changed = true;
                    return { ...corridor, x: nextX, y: nextY };
                }
                return corridor;
            });
            return changed ? nextCorridors : prevCorridors;
        });
        setStructures(prevStructures => {
            let changed = false;
            const nextStructures = prevStructures.map((structure) => {
                const nextX = clampUnitAxis(structure.x, structure.w, BLUEPRINT_WIDTH);
                const nextY = clampUnitAxis(structure.y, structure.h, BLUEPRINT_HEIGHT);
                if (nextX !== structure.x || nextY !== structure.y) {
                    changed = true;
                    return { ...structure, x: nextX, y: nextY };
                }
                return structure;
            });
            return changed ? nextStructures : prevStructures;
        });
    }, [BLUEPRINT_WIDTH, BLUEPRINT_HEIGHT]);

    useEffect(() => {
        if (draggingUnitId || draggingCorridorId || draggingStructureId || sidebarBlockGhost) return;
        updateCanvasDimensions();
    }, [units, corridors, structures, updateCanvasDimensions, draggingUnitId, draggingCorridorId, draggingStructureId, sidebarBlockGhost]);

    const deleteCanvasItem = (item: SelectedCanvasItem) => {
        if (item.kind === "unit") {
            setUnits(prev => prev.filter(unit => unit.id !== item.id));
        } else if (item.kind === "corridor") {
            setCorridors(prev => prev.filter(corridor => corridor.id !== item.id));
        } else {
            setStructures(prev => prev.filter(structure => structure.id !== item.id));
        }
    };

    const getCanvasItemLabel = (item: SelectedCanvasItem) => {
        if (item.kind === "unit") {
            return units.find(unit => unit.id === item.id)?.name ?? "Unit";
        }
        if (item.kind === "corridor") {
            return corridors.find(corridor => corridor.id === item.id)?.label ?? "Corridor";
        }
        return structures.find(structure => structure.id === item.id)?.label ?? "Structure";
    };

    const triggerDeleteToast = () => {
        setShowDeleteToast(true);
        if (deleteToastTimeoutRef.current) {
            clearTimeout(deleteToastTimeoutRef.current);
        }
        deleteToastTimeoutRef.current = setTimeout(() => {
            setShowDeleteToast(false);
            deleteToastTimeoutRef.current = null;
        }, 1300);
    };

    const requestDeleteItem = (item: SelectedCanvasItem, source: "keyboard" | "trash") => {
        setPendingDelete({ item, source });
    };

    const isLivingUnitBlock = (blockType?: SidebarBlockType): blockType is "studio" | "1br" | "2br" | "3br" => {
        return blockType === "studio" || blockType === "1br" || blockType === "2br" || blockType === "3br";
    };

    const confirmDeleteItem = () => {
        if (!pendingDelete) return;
        deleteCanvasItem(pendingDelete.item);
        setSelectedItem(current => current?.kind === pendingDelete.item.kind && current.id === pendingDelete.item.id ? null : current);
        setPendingDelete(null);
        triggerDeleteToast();
    };

    const cancelDeleteItem = () => {
        setPendingDelete(null);
    };

    const isPointerNearTrash = (pointX: number, pointY: number) => {
        const trash = trashRef.current;
        if (!trash) return false;

        const rect = trash.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.hypot(pointX - centerX, pointY - centerY);

        return distance <= 90;
    };

    const updateTrashHotState = (pointX: number, pointY: number) => {
        setIsTrashHot(isPointerNearTrash(pointX, pointY));
    };

    const rotateSelectedItem = (item: SelectedCanvasItem) => {
        const rotateRect = (rect: { x: number; y: number; w: number; h: number }) => {
            const nextWidth = rect.h;
            const nextHeight = rect.w;
            const centerX = rect.x + rect.w / 2;
            const centerY = rect.y + rect.h / 2;

            return {
                x: snapToGrid(centerX - nextWidth / 2),
                y: snapToGrid(centerY - nextHeight / 2),
                w: nextWidth,
                h: nextHeight,
            };
        };

        if (item.kind === "unit") {
            const unit = units.find(u => u.id === item.id);
            if (!unit) return;

            // Swap w/h for simple rotation
            const newW = unit.h;
            const newH = unit.w;

            // Calculate new position to keep it centered as much as possible
            const centerX = unit.x + unit.w / 2;
            const centerY = unit.y + unit.h / 2;
            const newX = snapToGrid(centerX - newW / 2);
            const newY = snapToGrid(centerY - newH / 2);

            const nextX = clampUnitAxis(newX, newW, BLUEPRINT_WIDTH);
            const nextY = clampUnitAxis(newY, newH, BLUEPRINT_HEIGHT);

            const newRect = { x: nextX, y: nextY, w: newW, h: newH };

            if (hasCollisionWithPlacedItems(newRect, item)) {
                triggerOverlapToast();
                return;
            }

            setUnits(prev => prev.map(u =>
                u.id === unit.id ? { ...u, ...newRect } : u
            ));

            return;
        }

        if (item.kind === "corridor") {
            const corridor = corridors.find(c => c.id === item.id);
            if (!corridor) return;

            // Swap w/h for simple rotation
            const newW = corridor.h;
            const newH = corridor.w;

            // Calculate new position to keep it centered as much as possible
            const centerX = corridor.x + corridor.w / 2;
            const centerY = corridor.y + corridor.h / 2;
            const newX = snapToGrid(centerX - newW / 2);
            const newY = snapToGrid(centerY - newH / 2);

            const nextX = clampUnitAxis(newX, newW, BLUEPRINT_WIDTH);
            const nextY = clampUnitAxis(newY, newH, BLUEPRINT_HEIGHT);

            const newRect = { x: nextX, y: nextY, w: newW, h: newH };

            if (hasCollisionWithPlacedItems(newRect, item)) {
                triggerOverlapToast();
                return;
            }

            setCorridors(prev => prev.map(c =>
                c.id === corridor.id ? { ...c, ...newRect } : c
            ));

            return;
        }

        const structure = structures.find(existingStructure => existingStructure.id === item.id);
        if (!structure) return;

        const rotatedRect = rotateRect(structure);
        const nextRotation = ((structure.rotation ?? 0) + 90) % 360;

        // Reposition if out of bounds after rotation
        const nextX = clampUnitAxis(rotatedRect.x, rotatedRect.w, BLUEPRINT_WIDTH);
        const nextY = clampUnitAxis(rotatedRect.y, rotatedRect.h, BLUEPRINT_HEIGHT);

        const finalRect = { ...rotatedRect, x: nextX, y: nextY };

        if (hasCollisionWithPlacedItems(finalRect, item)) {
            triggerOverlapToast();
            return;
        }

        setStructures(prev => prev.map((existingStructure) => (
            existingStructure.id === structure.id
                ? {
                    ...existingStructure,
                    rotation: nextRotation,
                    w: rotatedRect.w,
                    h: rotatedRect.h,
                    x: nextX,
                    y: nextY,
                }
                : existingStructure
        )));
        setSelectedItem({ kind: "structure", id: item.id });
    };
    useEffect(() => {
        const storedVisibility = window.localStorage.getItem(LEGEND_VISIBILITY_STORAGE_KEY);
        if (storedVisibility === "hidden") {
            setShowLegend(false);
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem(LEGEND_VISIBILITY_STORAGE_KEY, showLegend ? "visible" : "hidden");
    }, [showLegend]);

    useEffect(() => {
        try {
            const storedLayoutsRaw = window.localStorage.getItem(FLOOR_LAYOUTS_STORAGE_KEY);
            const storedActiveFloorRaw = window.localStorage.getItem(ACTIVE_FLOOR_STORAGE_KEY);

            const storedLayouts = storedLayoutsRaw
                ? JSON.parse(storedLayoutsRaw) as Record<FloorId, FloorLayout>
                : null;

            const normalizedLayouts: Record<FloorId, FloorLayout> = {
                ...DEFAULT_FLOOR_LAYOUTS,
                ...(storedLayouts ?? {}),
            };

            const nextActiveFloor: FloorId = storedActiveFloorRaw && normalizedLayouts[storedActiveFloorRaw]
                ? storedActiveFloorRaw
                : DEFAULT_ACTIVE_FLOOR;

            setFloorLayouts(normalizedLayouts);

            setActiveFloor(nextActiveFloor);
            setUnits(normalizedLayouts[nextActiveFloor]?.units ?? []);
            setCorridors(normalizedLayouts[nextActiveFloor]?.corridors ?? []);
            setStructures(normalizedLayouts[nextActiveFloor]?.structures ?? []);
        } catch {
            setActiveFloor(DEFAULT_ACTIVE_FLOOR);
            setFloorLayouts(DEFAULT_FLOOR_LAYOUTS);
            setUnits(DEFAULT_FLOOR_LAYOUTS[DEFAULT_ACTIVE_FLOOR].units);
            setCorridors(DEFAULT_FLOOR_LAYOUTS[DEFAULT_ACTIVE_FLOOR].corridors);
            setStructures(DEFAULT_FLOOR_LAYOUTS[DEFAULT_ACTIVE_FLOOR].structures);
        } finally {
            setHasHydratedFloorState(true);
        }
    }, []);

    useEffect(() => {
        if (!hasHydratedFloorState) return;

        const layoutsToPersist: Record<FloorId, FloorLayout> = {
            ...floorLayouts,
            [activeFloor]: {
                units,
                corridors,
                structures,
            },
        };

        window.localStorage.setItem(FLOOR_LAYOUTS_STORAGE_KEY, JSON.stringify(layoutsToPersist));
        window.localStorage.setItem(ACTIVE_FLOOR_STORAGE_KEY, activeFloor);
    }, [hasHydratedFloorState, floorLayouts, activeFloor, units, corridors, structures]);

    useEffect(() => {
        const tabsScroller = floorTabsScrollRef.current;
        if (!tabsScroller) return;

        const updateScrollHintVisibility = () => {
            const hasOverflow = tabsScroller.scrollWidth > tabsScroller.clientWidth + 1;
            const canScrollRight = tabsScroller.scrollLeft + tabsScroller.clientWidth < tabsScroller.scrollWidth - 1;
            setShowFloorTabsScrollHint(hasOverflow && canScrollRight);
        };

        updateScrollHintVisibility();
        tabsScroller.addEventListener("scroll", updateScrollHintVisibility, { passive: true });
        window.addEventListener("resize", updateScrollHintVisibility);

        return () => {
            tabsScroller.removeEventListener("scroll", updateScrollHintVisibility);
            window.removeEventListener("resize", updateScrollHintVisibility);
        };
    }, [floorLayouts, activeFloor, units.length, corridors.length, structures.length]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (!selectedItem) return;

            const target = event.target as HTMLElement | null;
            if (target) {
                const tag = target.tagName;
                if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
                    return;
                }
            }

            if (event.key.toLowerCase() === "r") {
                event.preventDefault();
                rotateSelectedItem(selectedItem);
                return;
            }

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
                event.preventDefault();
                performUndo();
                return;
            }

            if (event.key !== "Delete" && event.key !== "Backspace") return;

            event.preventDefault();
            requestDeleteItem(selectedItem, "keyboard");
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [selectedItem, units, corridors, structures, performUndo, rotateSelectedItem]);

    const handleSidebarBlockDragStart = (blockType: SidebarBlockType) => (e: React.DragEvent<HTMLDivElement>) => {
        const payload = blockType === "studio"
            ? { blockType, label: "Studio", unitType: "Studio" as const, w: 180, h: 120 }
            : blockType === "1br"
                ? { blockType, label: "1 BR Std", unitType: "1BR" as const, w: 200, h: 140 }
                : blockType === "2br"
                    ? { blockType, label: "2 BR Corner", unitType: "2BR" as const, w: 220, h: 140 }
                    : blockType === "3br"
                        ? { blockType, label: "3 BR Suite", unitType: "3BR" as const, w: 280, h: 140 }
                        : blockType === "corridor"
                            ? { blockType, label: "Corridor", w: 260, h: 60 }
                            : blockType === "elevator"
                                ? { blockType, label: "Elevator", w: 100, h: 100 }
                                : blockType === "stair-straight"
                                    ? { blockType, label: "Straight Flight", w: 80, h: 160, variant: "straight" }
                                    : blockType === "stair-l"
                                        ? { blockType, label: "L-Shape Stair", w: 120, h: 120, variant: "l-shape" }
                                        : blockType === "stair-u"
                                            ? { blockType, label: "U-Shape Stair", w: 120, h: 100, variant: "u-shape" }
                                            : { blockType, label: "Spiral Stair", w: 120, h: 120, variant: "spiral" };
        e.dataTransfer.setData(SIDEBAR_BLOCK_DRAG_TYPE, JSON.stringify(payload));
        e.dataTransfer.effectAllowed = "copy";
    };

    const handleSidebarBlockDragEnd = () => {
        setSidebarBlockGhost(null);
    };

    const handleBlueprintDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        if (e.dataTransfer.types.includes(SIDEBAR_BLOCK_DRAG_TYPE)) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";

            const serialized = e.dataTransfer.getData(SIDEBAR_BLOCK_DRAG_TYPE);
            if (!serialized) {
                setSidebarBlockGhost(null);
                return;
            }

            const parsed = JSON.parse(serialized) as { blockType?: SidebarBlockType; label?: string; unitType?: Unit["type"]; w?: number; h?: number; variant?: Structure["variant"] };
            if (!parsed.blockType || !parsed.w || !parsed.h) {
                setSidebarBlockGhost(null);
                return;
            }

            const rect = e.currentTarget.getBoundingClientRect();
            const droppedX = (e.clientX - rect.left) / scaleRef.current;
            const droppedY = (e.clientY - rect.top) / scaleRef.current;
            const snappedX = snapToGrid(droppedX - parsed.w / 2);
            const snappedY = snapToGrid(droppedY - parsed.h / 2);
            const clampedX = clampUnitAxis(snappedX, parsed.w, BLUEPRINT_WIDTH);
            const clampedY = clampUnitAxis(snappedY, parsed.h, BLUEPRINT_HEIGHT);
            const hasCollision = hasCollisionWithPlacedItems({
                x: clampedX,
                y: clampedY,
                w: parsed.w,
                h: parsed.h,
            });

            updateCanvasDimensions({
                kind: "unit", // generic kind for ghost sizing
                id: "sidebar-ghost",
                x: clampedX,
                y: clampedY,
                w: parsed.w,
                h: parsed.h
            });

            setSidebarBlockGhost({
                blockType: parsed.blockType,
                unitType: parsed.unitType,
                stairVariant: parsed.variant,
                label: parsed.label ?? "Unit",
                x: clampedX,
                y: clampedY,
                w: parsed.w,
                h: parsed.h,
                isValid: !hasCollision,
            });
        }
    };

    const handleBlueprintDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        const nextTarget = e.relatedTarget as Node | null;
        if (nextTarget && e.currentTarget.contains(nextTarget)) return;
        setSidebarBlockGhost(null);
    };

    const handleBlueprintDrop = (e: React.DragEvent<HTMLDivElement>) => {
        const serialized = e.dataTransfer.getData(SIDEBAR_BLOCK_DRAG_TYPE);
        if (!serialized) return;

        e.preventDefault();
        setSidebarBlockGhost(null);
        const parsed = JSON.parse(serialized) as { blockType?: SidebarBlockType; label?: string; unitType?: Unit["type"]; w?: number; h?: number; variant?: string };
        if (!parsed.blockType || !parsed.w || !parsed.h) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const droppedX = (e.clientX - rect.left) / scaleRef.current;
        const droppedY = (e.clientY - rect.top) / scaleRef.current;
        const blockWidth = parsed.w;
        const blockHeight = parsed.h;

        const snappedX = snapToGrid(droppedX - blockWidth / 2);
        const snappedY = snapToGrid(droppedY - blockHeight / 2);
        const clampedX = clampUnitAxis(snappedX, blockWidth, BLUEPRINT_WIDTH);
        const clampedY = clampUnitAxis(snappedY, blockHeight, BLUEPRINT_HEIGHT);
        const dropRect = { x: clampedX, y: clampedY, w: blockWidth, h: blockHeight };

        if (hasCollisionWithPlacedItems(dropRect)) {
            triggerOverlapToast();
            return;
        }

        updateCanvasDimensions({
            kind: parsed.blockType === "corridor" ? "corridor" : (parsed.blockType?.includes("stair") || parsed.blockType === "elevator") ? "structure" : "unit",
            id: "temp-drop-check",
            x: clampedX,
            y: clampedY,
            w: blockWidth,
            h: blockHeight
        });

        if (parsed.blockType === "corridor") {
            setCorridors(prev => ([
                ...prev,
                {
                    id: `corridor-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    label: parsed.label ?? "Corridor",
                    x: clampedX,
                    y: clampedY,
                    w: blockWidth,
                    h: blockHeight,
                },
            ]));
            return;
        }

        if (parsed.blockType === "studio" || parsed.blockType === "1br" || parsed.blockType === "2br" || parsed.blockType === "3br") {
            setUnits(prev => {
                const highestNumericId = prev.reduce((highest, unit) => {
                    const numeric = Number.parseInt(unit.id, 10);
                    return Number.isNaN(numeric) ? highest : Math.max(highest, numeric);
                }, 100);
                const nextNumericId = highestNumericId + 1;
                const nextId = String(nextNumericId);

                return [
                    ...prev,
                    {
                        id: nextId,
                        name: `Unit ${nextId}`,
                        type: parsed.unitType ?? "Studio",
                        status: "vacant",
                        x: clampedX,
                        y: clampedY,
                        w: blockWidth,
                        h: blockHeight,
                        details: parsed.label,
                    },
                ];
            });
            return;
        }

        const structureType: Structure["type"] = parsed.blockType === "elevator" ? "elevator" : "stairwell";

        setStructures(prev => ([
            ...prev,
            {
                id: `structure-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                type: structureType,
                variant: parsed.variant as Structure["variant"],
                rotation: 0,
                label: parsed.label ?? (structureType === "elevator" ? "Elevator" : "Stairwell"),
                x: clampedX,
                y: clampedY,
                w: blockWidth,
                h: blockHeight,
            },
        ]));
    };

    const getViewportInMinimap = () => {
        const minimap = minimapRef.current;
        if (!minimap) {
            return { left: 0, top: 0, width: 0, height: 0 };
        }

        const minimapWidth = minimap.clientWidth;
        const minimapHeight = minimap.clientHeight;
        const worldViewportX = -position.x / scale;
        const worldViewportY = -position.y / scale;
        const worldViewportWidth = viewportSize.width / scale;
        const worldViewportHeight = viewportSize.height / scale;

        const width = Math.min(minimapWidth, (worldViewportWidth / WORLD_WIDTH) * minimapWidth);
        const height = Math.min(minimapHeight, (worldViewportHeight / WORLD_HEIGHT) * minimapHeight);
        const maxLeft = Math.max(0, minimapWidth - width);
        const maxTop = Math.max(0, minimapHeight - height);

        const left = Math.max(0, Math.min(maxLeft, (worldViewportX / WORLD_WIDTH) * minimapWidth));
        const top = Math.max(0, Math.min(maxTop, (worldViewportY / WORLD_HEIGHT) * minimapHeight));

        return { left, top, width, height };
    };

    const moveViewportFromMinimapPoint = (minimapX: number, minimapY: number) => {
        const minimap = minimapRef.current;
        if (!minimap) return;

        const minimapWidth = minimap.clientWidth;
        const minimapHeight = minimap.clientHeight;
        const worldViewportWidth = viewportSize.width / scale;
        const worldViewportHeight = viewportSize.height / scale;

        const targetWorldX = (minimapX / minimapWidth) * WORLD_WIDTH;
        const targetWorldY = (minimapY / minimapHeight) * WORLD_HEIGHT;

        const centeredWorldX = targetWorldX - worldViewportWidth / 2;
        const centeredWorldY = targetWorldY - worldViewportHeight / 2;

        const nextX = -centeredWorldX * scale;
        const nextY = -centeredWorldY * scale;

        setPosition(clampPosition(nextX, nextY));
    };

    const handleMinimapPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const minimap = minimapRef.current;
        if (!minimap) return;

        const rect = minimap.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        moveViewportFromMinimapPoint(clickX, clickY);
    };

    const handleMinimapViewportPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const minimap = minimapRef.current;
        if (!minimap) return;

        const rect = minimap.getBoundingClientRect();
        const viewport = getViewportInMinimap();
        minimapDragOffsetRef.current = {
            x: e.clientX - rect.left - viewport.left,
            y: e.clientY - rect.top - viewport.top,
        };
        setIsMinimapDragging(true);
    };

    useEffect(() => {
        if (!isMinimapDragging) return;

        const handlePointerMove = (e: PointerEvent) => {
            const minimap = minimapRef.current;
            if (!minimap) return;
            const rect = minimap.getBoundingClientRect();
            const dragX = e.clientX - rect.left - minimapDragOffsetRef.current.x;
            const dragY = e.clientY - rect.top - minimapDragOffsetRef.current.y;
            const viewport = getViewportInMinimap();

            const centerX = dragX + viewport.width / 2;
            const centerY = dragY + viewport.height / 2;
            moveViewportFromMinimapPoint(centerX, centerY);
        };

        const handlePointerUp = () => {
            setIsMinimapDragging(false);
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [isMinimapDragging, position, scale, viewportSize]);

    const getRotatedArtworkStyle = (width: number, height: number, rotation: number): React.CSSProperties => {
        const normalizedRotation = ((rotation % 360) + 360) % 360;
        const isQuarterTurn = normalizedRotation % 180 !== 0;

        if (!isQuarterTurn) {
            return {
                position: "absolute",
                inset: 0,
                transform: `rotate(${normalizedRotation}deg)`,
                transformOrigin: "center",
            };
        }

        return {
            position: "absolute",
            width: height,
            height: width,
            left: (width - height) / 2,
            top: (height - width) / 2,
            transform: `rotate(${normalizedRotation}deg)`,
            transformOrigin: "center",
        };
    };

    const minimapViewport = getViewportInMinimap();
    const isDraggingCanvasItem = draggingUnitId !== null || draggingCorridorId !== null || draggingStructureId !== null;
    const floorWatermarkLabel = formatFloorWatermark(activeFloor);
    const floorLayoutsWithActiveSnapshot: Record<FloorId, FloorLayout> = {
        ...floorLayouts,
        [activeFloor]: {
            units,
            corridors,
            structures,
        },
    };
    const floorTabs: Array<{ id: FloorId; title: string; floorNumber: number | null }> = Object.keys(floorLayoutsWithActiveSnapshot)
        .sort((leftFloor, rightFloor) => {
            if (leftFloor === "ground") return -1;
            if (rightFloor === "ground") return 1;

            const leftNumber = parseFloorNumber(leftFloor);
            const rightNumber = parseFloorNumber(rightFloor);

            if (leftNumber !== null && rightNumber !== null) return leftNumber - rightNumber;
            if (leftNumber !== null) return -1;
            if (rightNumber !== null) return 1;

            return leftFloor.localeCompare(rightFloor);
        })
        .map((floorId) => ({
            id: floorId,
            title: getFloorDisplayLabel(floorId),
            floorNumber: parseFloorNumber(floorId),
        }));

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-display h-screen flex flex-col overflow-hidden antialiased selection:bg-primary/30">
            {/* Header */}
            <header className="h-16 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
                        <span className="material-icons-round">apartment</span>
                        iReside
                    </div>
                    <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-2"></div>
                    <div>
                        <h1 className="text-sm font-semibold text-slate-900 dark:text-white">Sunset Heights Complex</h1>
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            <span>All systems operational</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-slate-100 dark:bg-background-dark p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 min-w-0 max-w-[620px] relative">
                        <div ref={floorTabsScrollRef} className={`flex items-center gap-1 overflow-x-auto min-w-0 ${styles.scrollbarHide}`}>
                            {floorTabs.map((floorTab) => {
                                const layout = floorLayoutsWithActiveSnapshot[floorTab.id];
                                const totalItems = layout.units.length + layout.corridors.length + layout.structures.length;
                                const isActive = activeFloor === floorTab.id;

                                return (
                                    <button
                                        key={floorTab.id}
                                        onClick={() => switchFloor(floorTab.id)}
                                        className={`shrink-0 min-w-[88px] px-2.5 py-1.5 rounded-lg transition-all text-left border ${isActive
                                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                            : "bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/70"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="flex items-center gap-1.5">
                                                {floorTab.id === "ground" ? (
                                                    <span className={`material-icons-round text-sm ${isActive ? "text-white" : "text-primary"}`}>terrain</span>
                                                ) : (
                                                    <span className={`w-4 h-4 rounded-[3px] border text-[10px] leading-none font-bold flex items-center justify-center ${isActive ? "border-white/40 bg-white/15 text-white" : "border-primary/40 bg-primary/10 text-primary"}`}>
                                                        {floorTab.floorNumber ?? "?"}
                                                    </span>
                                                )}
                                                <span className={`text-[11px] ${isActive ? "font-bold" : "font-semibold"}`}>{floorTab.title}</span>
                                            </span>
                                            <span className={`text-[10px] font-mono rounded px-1.5 py-0.5 border ${isActive ? "border-white/30 bg-white/10 text-white" : "border-slate-500/30 text-slate-500 dark:text-slate-300"}`}>
                                                {totalItems}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {showFloorTabsScrollHint && (
                            <div className="pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 flex items-center gap-1 pl-6 pr-2 py-1 rounded-md bg-gradient-to-l from-slate-100/95 via-slate-100/85 dark:from-background-dark/95 dark:via-background-dark/85 to-transparent backdrop-blur-[1px]">
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Scroll</span>
                                <span className="material-icons-round text-xs text-primary animate-pulse">chevron_right</span>
                            </div>
                        )}
                        <button onClick={createFloor} className="shrink-0 p-1 text-slate-500 hover:text-primary rounded-md" title="Add floor">
                            <span className="material-icons-round text-sm">add</span>
                        </button>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-200 dark:border-slate-600">
                        <span className="material-icons-round text-sm">save_alt</span>
                        Draft
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-medium shadow-lg shadow-primary/20 transition-colors">
                        <span className="material-icons-round text-sm">publish</span>
                        Publish Changes
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 relative bg-background-dark overflow-hidden flex flex-col">
                    <div className={`flex-1 overflow-hidden relative ${isPanning ? 'cursor-grabbing' : 'cursor-grab'} bg-background-dark ${styles.bgGridPattern}`} ref={containerRef}>
                        <motion.div
                            className="absolute inset-0 w-full h-full origin-top-left"
                            style={{
                                x: position.x,
                                y: position.y,
                                scale: scale,
                            }}
                            onPointerDown={handleViewportPointerDown}
                            onPointerMove={handleViewportPointerMove}
                            onPointerUp={endViewportPan}
                            onPointerCancel={endViewportPan}
                        >
                            {/* Blueprint Area */}
                            <div
                                ref={blueprintRef}
                                onDragOver={handleBlueprintDragOver}
                                onDragLeave={handleBlueprintDragLeave}
                                onDrop={handleBlueprintDrop}
                                className={`absolute top-[20px] left-[20px] bg-slate-800/30 border border-slate-700/50 rounded-xl ${styles.bgDotPattern} relative`}
                                style={{
                                    width: BLUEPRINT_WIDTH,
                                    height: BLUEPRINT_HEIGHT,
                                }}
                            >
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none">
                                    <span className="text-[72px] md:text-[110px] font-black tracking-[0.18em] text-slate-500/10">
                                        {floorWatermarkLabel}
                                    </span>
                                </div>

                                {sidebarBlockGhost && (
                                    <div
                                        className="absolute pointer-events-none"
                                        style={{
                                            left: sidebarBlockGhost.x,
                                            top: sidebarBlockGhost.y,
                                            width: sidebarBlockGhost.w,
                                            height: sidebarBlockGhost.h,
                                            zIndex: 24,
                                        }}
                                    >
                                        {isLivingUnitBlock(sidebarBlockGhost.blockType) ? (
                                            <div className={`w-full h-full bg-slate-800/70 relative shadow-sm overflow-hidden select-none rounded-[1px] border ${sidebarBlockGhost.isValid ? 'border-emerald-400/70' : 'border-red-400/80'}`}>
                                                <div className="absolute inset-0 border-[2px] border-slate-500"></div>
                                                <div className="absolute inset-[4px] border border-slate-600"></div>
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[6px] bg-slate-800 z-10 border-x-2 border-slate-500"></div>
                                                <div className="absolute top-0 left-1/4 right-1/4 h-[6px] bg-slate-800 z-10 flex items-center justify-center border-x border-slate-500">
                                                    <div className="w-full h-px bg-slate-600"></div>
                                                </div>
                                                <div className={`absolute inset-0 opacity-20 ${sidebarBlockGhost.isValid ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 z-20">
                                                    <div className={`w-2 h-2 rounded-full mb-2 ${sidebarBlockGhost.isValid ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]'}`}></div>
                                                    <h4 className="font-bold text-xs text-slate-200 drop-shadow-md">{sidebarBlockGhost.label}</h4>
                                                    <span className={`text-[9px] font-bold uppercase mt-1 tracking-wider px-1 rounded ${sidebarBlockGhost.isValid ? 'text-emerald-300 border border-emerald-400/40 bg-emerald-500/10' : 'text-red-300 border border-red-400/40 bg-red-500/10'}`}>{sidebarBlockGhost.isValid ? 'Preview' : 'Blocked'}</span>
                                                </div>
                                            </div>
                                        ) : sidebarBlockGhost.blockType === "corridor" ? (
                                            <div className={`w-full h-full border-y flex items-center justify-center rounded-[1px] ${sidebarBlockGhost.isValid ? 'bg-emerald-500/15 border-emerald-400/80' : 'bg-red-500/15 border-red-400/80'}`}>
                                                <div className="absolute inset-0 opacity-15 pointer-events-none bg-slate-900"></div>
                                                <div className="relative z-10 flex flex-col items-center justify-center">
                                                    <span className={`text-xs font-bold uppercase tracking-[0.5em] ${sidebarBlockGhost.isValid ? 'text-emerald-300' : 'text-red-300'}`}>{sidebarBlockGhost.label}</span>
                                                    <span className={`mt-1 text-[9px] font-bold uppercase tracking-wider px-1 rounded ${sidebarBlockGhost.isValid ? 'text-emerald-300 border border-emerald-400/40 bg-emerald-500/10' : 'text-red-300 border border-red-400/40 bg-red-500/10'}`}>{sidebarBlockGhost.isValid ? 'Preview' : 'Blocked'}</span>
                                                </div>
                                            </div>
                                        ) : sidebarBlockGhost.blockType === "elevator" ? (
                                            <div className={`w-full h-full border rounded-sm flex items-center justify-center ${sidebarBlockGhost.isValid ? 'bg-emerald-500/15 border-emerald-400/80' : 'bg-red-500/20 border-red-400/80'}`}>
                                                <div className="border-2 border-slate-500 w-full h-full m-2 flex items-center justify-center relative">
                                                    <span className={`material-icons-round ${sidebarBlockGhost.isValid ? 'text-emerald-300' : 'text-red-300'}`}>elevator</span>
                                                </div>
                                                <span className={`absolute bottom-1 text-[9px] font-bold uppercase tracking-wider px-1 rounded ${sidebarBlockGhost.isValid ? 'text-emerald-300 border border-emerald-400/40 bg-emerald-500/10' : 'text-red-300 border border-red-400/40 bg-red-500/10'}`}>{sidebarBlockGhost.isValid ? 'Preview' : 'Blocked'}</span>
                                            </div>
                                        ) : (
                                            <div className={`w-full h-full border rounded-sm relative overflow-hidden ${sidebarBlockGhost.isValid ? 'bg-emerald-500/15 border-emerald-400/80' : 'bg-red-500/20 border-red-400/80'}`}>
                                                {sidebarBlockGhost.stairVariant === "straight" ? (
                                                    <>
                                                        <div className="absolute inset-0 border-[2px] border-slate-500"></div>
                                                        <div className="absolute inset-[4px] border border-slate-600"></div>
                                                        <div className="absolute left-[15%] right-[15%] top-[10%] bottom-[10%] flex flex-col justify-between">
                                                            {[...Array(12)].map((_, i) => (
                                                                <div key={`ghost-straight-${i}`} className="w-full h-px bg-slate-400/50"></div>
                                                            ))}
                                                        </div>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="h-[60%] w-px bg-slate-300 relative">
                                                                <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-r border-slate-300 rotate-[-45deg]"></div>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : sidebarBlockGhost.stairVariant === "l-shape" ? (
                                                    <>
                                                        <div className="absolute inset-0 border-[2px] border-slate-500"></div>
                                                        <div className="absolute top-0 right-0 w-1/2 h-1/2 border-b border-l border-slate-500"></div>
                                                        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 border-l border-slate-500 flex flex-col justify-between py-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <div key={`ghost-l-v-${i}`} className="w-full h-px bg-slate-400/50"></div>
                                                            ))}
                                                        </div>
                                                        <div className="absolute top-0 left-0 w-1/2 h-1/2 border-b border-slate-500 flex flex-row justify-between px-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <div key={`ghost-l-h-${i}`} className="h-full w-px bg-slate-400/50"></div>
                                                            ))}
                                                        </div>
                                                        <div className="absolute top-[25%] left-[10%] right-[10%] bottom-[10%] pointer-events-none">
                                                            <svg className="w-full h-full text-slate-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M 85 90 L 85 25 L 10 25" />
                                                                <path d="M 15 20 L 10 25 L 15 30" />
                                                            </svg>
                                                        </div>
                                                    </>
                                                ) : sidebarBlockGhost.stairVariant === "u-shape" ? (
                                                    <>
                                                        <div className="absolute inset-0 border-[2px] border-slate-500"></div>
                                                        <div className="absolute top-0 left-0 right-0 h-[30%] border-b border-slate-500 bg-slate-700/30"></div>
                                                        <div className="absolute top-[30%] bottom-0 left-1/2 -translate-x-1/2 w-1 bg-slate-500"></div>
                                                        <div className="absolute top-[30%] bottom-0 left-0 right-1/2 flex flex-col justify-between py-1 border-r border-slate-500/50">
                                                            {[...Array(7)].map((_, i) => (
                                                                <div key={`ghost-u-l-${i}`} className="w-full h-px bg-slate-400/50"></div>
                                                            ))}
                                                        </div>
                                                        <div className="absolute top-[30%] bottom-0 left-1/2 right-0 flex flex-col justify-between py-1 border-l border-slate-500/50">
                                                            {[...Array(7)].map((_, i) => (
                                                                <div key={`ghost-u-r-${i}`} className="w-full h-px bg-slate-400/50"></div>
                                                            ))}
                                                        </div>
                                                        <div className="absolute inset-0 pointer-events-none p-2">
                                                            <svg className="w-full h-full text-slate-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M 75 90 L 75 15 L 25 15 L 25 90" />
                                                                <path d="M 20 85 L 25 90 L 30 85" />
                                                            </svg>
                                                        </div>
                                                    </>
                                                ) : sidebarBlockGhost.stairVariant === "spiral" ? (
                                                    <>
                                                        <div className="absolute inset-0 rounded-full border-[2px] border-slate-500"></div>
                                                        <div className="absolute inset-[35%] border border-slate-500 rounded-full bg-slate-900 z-10"></div>
                                                        {[...Array(12)].map((_, i) => (
                                                            <div
                                                                key={`ghost-spiral-${i}`}
                                                                className="absolute inset-0 border-t border-slate-500/50 origin-center"
                                                                style={{ transform: `rotate(${i * 30}deg)` }}
                                                            ></div>
                                                        ))}
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="absolute inset-0 border-[2px] border-slate-500"></div>
                                                        <div className="absolute inset-[4px] border border-slate-600"></div>
                                                    </>
                                                )}
                                                <div className={`absolute inset-0 opacity-20 ${sidebarBlockGhost.isValid ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                <span className={`absolute top-1 right-1 text-[9px] font-bold uppercase tracking-wider px-1 rounded ${sidebarBlockGhost.isValid ? 'text-emerald-300 border border-emerald-400/40 bg-emerald-500/10' : 'text-red-300 border border-red-400/40 bg-red-500/10'}`}>{sidebarBlockGhost.isValid ? 'Preview' : 'Blocked'}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {dragGhost && (
                                    <div
                                        className="absolute pointer-events-none"
                                        style={{
                                            left: dragGhost.x,
                                            top: dragGhost.y,
                                            width: dragGhost.w,
                                            height: dragGhost.h,
                                            zIndex: 25,
                                        }}
                                    >
                                        {dragGhost.kind === "unit" ? (
                                            <div className={`w-full h-full bg-slate-800/70 relative shadow-sm overflow-hidden select-none rounded-[1px] border ${dragGhost.isValid ? 'border-emerald-400/70' : 'border-red-400/80'}`}>
                                                <div className="absolute inset-0 border-[2px] border-slate-500"></div>
                                                <div className="absolute inset-[4px] border border-slate-600"></div>
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[6px] bg-slate-800 z-10 border-x-2 border-slate-500"></div>
                                                <div className="absolute top-0 left-1/4 right-1/4 h-[6px] bg-slate-800 z-10 flex items-center justify-center border-x border-slate-500">
                                                    <div className="w-full h-px bg-slate-600"></div>
                                                </div>
                                                <div className={`absolute inset-0 opacity-20 ${dragGhost.isValid ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                            </div>
                                        ) : dragGhost.kind === "corridor" ? (
                                            <div className={`w-full h-full border-y flex items-center justify-center rounded-[1px] ${dragGhost.isValid ? 'bg-emerald-500/15 border-emerald-400/80' : 'bg-red-500/15 border-red-400/80'}`}>
                                                <span className={`text-xs font-bold uppercase tracking-[0.5em] ${dragGhost.isValid ? 'text-emerald-300' : 'text-red-300'}`}>{dragGhost.label ?? 'Corridor'}</span>
                                            </div>
                                        ) : dragGhost.structureType === "elevator" ? (
                                            <div className={`w-full h-full border rounded-sm flex items-center justify-center ${dragGhost.isValid ? 'bg-emerald-500/15 border-emerald-400/80' : 'bg-red-500/20 border-red-400/80'}`}>
                                                <div className="border-2 border-slate-500 w-full h-full m-2 flex items-center justify-center relative">
                                                    <span className={`material-icons-round ${dragGhost.isValid ? 'text-emerald-300' : 'text-red-300'}`}>elevator</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`w-full h-full border rounded-sm relative overflow-hidden ${dragGhost.isValid ? 'bg-emerald-500/15 border-emerald-400/80' : 'bg-red-500/20 border-red-400/80'}`}>
                                                <div style={getRotatedArtworkStyle(dragGhost.w, dragGhost.h, dragGhost.stairRotation ?? 0)}>
                                                    {dragGhost.stairVariant === "straight" ? (
                                                        <>
                                                            <div className="absolute inset-0 border-[2px] border-slate-500"></div>
                                                            <div className="absolute inset-[4px] border border-slate-600"></div>
                                                            <div className="absolute left-[15%] right-[15%] top-[10%] bottom-[10%] flex flex-col justify-between">
                                                                {[...Array(12)].map((_, i) => (
                                                                    <div key={`drag-straight-${i}`} className="w-full h-px bg-slate-400/50"></div>
                                                                ))}
                                                            </div>
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="h-[60%] w-px bg-slate-300 relative">
                                                                    <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-r border-slate-300 rotate-[-45deg]"></div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : dragGhost.stairVariant === "l-shape" ? (
                                                        <>
                                                            <div className="absolute inset-0 border-[2px] border-slate-500"></div>
                                                            <div className="absolute top-0 right-0 w-1/2 h-1/2 border-b border-l border-slate-500"></div>
                                                            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 border-l border-slate-500 flex flex-col justify-between py-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <div key={`drag-l-v-${i}`} className="w-full h-px bg-slate-400/50"></div>
                                                                ))}
                                                            </div>
                                                            <div className="absolute top-0 left-0 w-1/2 h-1/2 border-b border-slate-500 flex flex-row justify-between px-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <div key={`drag-l-h-${i}`} className="h-full w-px bg-slate-400/50"></div>
                                                                ))}
                                                            </div>
                                                            <div className="absolute top-[25%] left-[10%] right-[10%] bottom-[10%] pointer-events-none">
                                                                <svg className="w-full h-full text-slate-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M 85 90 L 85 25 L 10 25" />
                                                                    <path d="M 15 20 L 10 25 L 15 30" />
                                                                </svg>
                                                            </div>
                                                        </>
                                                    ) : dragGhost.stairVariant === "u-shape" ? (
                                                        <>
                                                            <div className="absolute inset-0 border-[2px] border-slate-500"></div>
                                                            <div className="absolute top-0 left-0 right-0 h-[30%] border-b border-slate-500 bg-slate-700/30"></div>
                                                            <div className="absolute top-[30%] bottom-0 left-1/2 -translate-x-1/2 w-1 bg-slate-500"></div>
                                                            <div className="absolute top-[30%] bottom-0 left-0 right-1/2 flex flex-col justify-between py-1 border-r border-slate-500/50">
                                                                {[...Array(7)].map((_, i) => (
                                                                    <div key={`drag-u-l-${i}`} className="w-full h-px bg-slate-400/50"></div>
                                                                ))}
                                                            </div>
                                                            <div className="absolute top-[30%] bottom-0 left-1/2 right-0 flex flex-col justify-between py-1 border-l border-slate-500/50">
                                                                {[...Array(7)].map((_, i) => (
                                                                    <div key={`drag-u-r-${i}`} className="w-full h-px bg-slate-400/50"></div>
                                                                ))}
                                                            </div>
                                                            <div className="absolute inset-0 pointer-events-none p-2">
                                                                <svg className="w-full h-full text-slate-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M 75 90 L 75 15 L 25 15 L 25 90" />
                                                                    <path d="M 20 85 L 25 90 L 30 85" />
                                                                </svg>
                                                            </div>
                                                        </>
                                                    ) : dragGhost.stairVariant === "spiral" ? (
                                                        <>
                                                            <div className="absolute inset-0 rounded-full border-[2px] border-slate-500"></div>
                                                            <div className="absolute inset-[35%] border border-slate-500 rounded-full bg-slate-900 z-10"></div>
                                                            {[...Array(12)].map((_, i) => (
                                                                <div
                                                                    key={`drag-spiral-${i}`}
                                                                    className="absolute inset-0 border-t border-slate-500/50 origin-center"
                                                                    style={{ transform: `rotate(${i * 30}deg)` }}
                                                                ></div>
                                                            ))}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="absolute inset-0 border-[2px] border-slate-500"></div>
                                                            <div className="absolute inset-[4px] border border-slate-600"></div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className={`absolute inset-0 opacity-20 ${dragGhost.isValid ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Units */}
                                {corridors.map((corridor) => (
                                    <motion.div
                                        key={corridor.id}
                                        data-corridor-card="true"
                                        className={`absolute group cursor-pointer ${selectedItem?.kind === "corridor" && selectedItem.id === corridor.id ? 'ring-2 ring-primary ring-offset-1 ring-offset-slate-900' : ''}`}
                                        style={{
                                            left: corridor.x,
                                            top: corridor.y,
                                            width: corridor.w,
                                            height: corridor.h,
                                            zIndex: draggingCorridorId === corridor.id ? 28 : 8,
                                        }}
                                        drag={resizingCorridorId === null}
                                        dragConstraints={blueprintRef}
                                        dragElastic={0}
                                        dragMomentum={false}
                                        dragSnapToOrigin
                                        transition={{ duration: 0 }}
                                        onPointerDown={() => setSelectedItem({ kind: "corridor", id: corridor.id })}
                                        onDragStart={() => {
                                            setSelectedItem({ kind: "corridor", id: corridor.id });
                                            setDraggingCorridorId(corridor.id);
                                            setIsTrashHot(false);
                                            setDragGhost({
                                                unitId: corridor.id,
                                                kind: "corridor",
                                                label: corridor.label,
                                                x: corridor.x,
                                                y: corridor.y,
                                                w: corridor.w,
                                                h: corridor.h,
                                                isValid: true,
                                            });
                                        }}
                                        onDrag={(_, info) => {
                                            const worldOffsetX = info.offset.x / scaleRef.current;
                                            const worldOffsetY = info.offset.y / scaleRef.current;
                                            const nextX = clampUnitAxis(snapToGrid(corridor.x + worldOffsetX), corridor.w, BLUEPRINT_WIDTH);
                                            const nextY = clampUnitAxis(snapToGrid(corridor.y + worldOffsetY), corridor.h, BLUEPRINT_HEIGHT);
                                            updateCanvasDimensions({ kind: "corridor", id: corridor.id, x: nextX, y: nextY, w: corridor.w, h: corridor.h });
                                            const hasCollision = hasCollisionWithPlacedItems({ x: nextX, y: nextY, w: corridor.w, h: corridor.h }, { kind: "corridor", id: corridor.id });
                                            updateTrashHotState(info.point.x, info.point.y);
                                            setDragGhost({
                                                unitId: corridor.id,
                                                kind: "corridor",
                                                label: corridor.label,
                                                x: nextX,
                                                y: nextY,
                                                w: corridor.w,
                                                h: corridor.h,
                                                isValid: !hasCollision,
                                            });
                                        }}
                                        onDragEnd={(_, info) => {
                                            const shouldDelete = isPointerNearTrash(info.point.x, info.point.y);
                                            if (shouldDelete) {
                                                requestDeleteItem({ kind: "corridor", id: corridor.id }, "trash");
                                                setDragGhost(null);
                                                setDraggingCorridorId(current => current === corridor.id ? null : current);
                                                setIsTrashHot(false);
                                                return;
                                            }

                                            const worldOffsetX = info.offset.x / scale;
                                            const worldOffsetY = info.offset.y / scale;
                                            const nextX = clampUnitAxis(snapToGrid(corridor.x + worldOffsetX), corridor.w, BLUEPRINT_WIDTH);
                                            const nextY = clampUnitAxis(snapToGrid(corridor.y + worldOffsetY), corridor.h, BLUEPRINT_HEIGHT);
                                            const hasCollision = hasCollisionWithPlacedItems({ x: nextX, y: nextY, w: corridor.w, h: corridor.h }, { kind: "corridor", id: corridor.id });

                                            if (hasCollision) {
                                                triggerOverlapToast();
                                            } else {
                                                setCorridors(prev => prev.map((existing) => (
                                                    existing.id === corridor.id
                                                        ? { ...existing, x: nextX, y: nextY }
                                                        : existing
                                                )));
                                            }
                                            setDragGhost(null);
                                            setDraggingCorridorId(current => current === corridor.id ? null : current);
                                            setIsTrashHot(false);
                                        }}
                                    >
                                        <div className="w-full h-full bg-slate-800 relative shadow-sm overflow-hidden select-none rounded-[1px]">
                                            <div className="absolute inset-0 border-[2px] border-slate-500"></div>
                                            <div className="absolute inset-[4px] border border-slate-600"></div>
                                            <div className="absolute inset-[10px] border border-slate-700/80 border-dashed"></div>
                                            <div className="absolute left-[10px] right-[10px] top-1/2 -translate-y-1/2 h-px bg-slate-500/80"></div>
                                            <div className="absolute inset-[8px] opacity-10"
                                                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}
                                            ></div>
                                            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-blue-500"></div>
                                            <div className="absolute inset-0 flex items-center justify-center z-20">
                                                <span className="text-xs font-bold text-slate-300 uppercase tracking-[0.4em]">{corridor.label}</span>
                                            </div>

                                            {selectedItem?.kind === "corridor" && selectedItem.id === corridor.id && (
                                                <>
                                                    <div
                                                        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 h-4 w-12 cursor-ns-resize"
                                                        onPointerDown={handleCorridorResizeStart(corridor, "n")}
                                                    />
                                                    <div
                                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-30 h-4 w-12 cursor-ns-resize"
                                                        onPointerDown={handleCorridorResizeStart(corridor, "s")}
                                                    />
                                                    <div
                                                        className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 h-12 w-4 cursor-ew-resize"
                                                        onPointerDown={handleCorridorResizeStart(corridor, "w")}
                                                    />
                                                    <div
                                                        className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-30 h-12 w-4 cursor-ew-resize"
                                                        onPointerDown={handleCorridorResizeStart(corridor, "e")}
                                                    />

                                                    <div
                                                        className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 z-30 h-4 w-4 cursor-nwse-resize rounded-full border border-white bg-primary"
                                                        onPointerDown={handleCorridorResizeStart(corridor, "nw")}
                                                    />
                                                    <div
                                                        className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 z-30 h-4 w-4 cursor-nesw-resize rounded-full border border-white bg-primary"
                                                        onPointerDown={handleCorridorResizeStart(corridor, "ne")}
                                                    />
                                                    <div
                                                        className="absolute left-0 bottom-0 -translate-x-1/2 translate-y-1/2 z-30 h-4 w-4 cursor-nesw-resize rounded-full border border-white bg-primary"
                                                        onPointerDown={handleCorridorResizeStart(corridor, "sw")}
                                                    />
                                                    <div
                                                        className="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 z-30 h-4 w-4 cursor-nwse-resize rounded-full border border-white bg-primary"
                                                        onPointerDown={handleCorridorResizeStart(corridor, "se")}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {structures.map((structure) => (
                                    <motion.div
                                        key={structure.id}
                                        data-structure-card="true"
                                        className={`absolute group cursor-pointer ${selectedItem?.kind === "structure" && selectedItem.id === structure.id ? 'ring-2 ring-primary ring-offset-1 ring-offset-slate-900' : ''}`}
                                        style={{
                                            left: structure.x,
                                            top: structure.y,
                                            width: structure.w,
                                            height: structure.h,
                                            zIndex: draggingStructureId === structure.id ? 29 : 9,
                                        }}
                                        drag
                                        dragConstraints={blueprintRef}
                                        dragElastic={0}
                                        dragMomentum={false}
                                        dragSnapToOrigin
                                        transition={{ duration: 0 }}
                                        onPointerDown={() => setSelectedItem({ kind: "structure", id: structure.id })}
                                        onDragStart={() => {
                                            setSelectedItem({ kind: "structure", id: structure.id });
                                            setDraggingStructureId(structure.id);
                                            setIsTrashHot(false);
                                            setDragGhost({
                                                unitId: structure.id,
                                                kind: "structure",
                                                structureType: structure.type,
                                                stairVariant: structure.variant,
                                                stairRotation: structure.rotation ?? 0,
                                                label: structure.label,
                                                x: structure.x,
                                                y: structure.y,
                                                w: structure.w,
                                                h: structure.h,
                                                isValid: true,
                                            });
                                        }}
                                        onDrag={(_, info) => {
                                            const worldOffsetX = info.offset.x / scaleRef.current;
                                            const worldOffsetY = info.offset.y / scaleRef.current;
                                            const nextX = clampUnitAxis(snapToGrid(structure.x + worldOffsetX), structure.w, BLUEPRINT_WIDTH);
                                            const nextY = clampUnitAxis(snapToGrid(structure.y + worldOffsetY), structure.h, BLUEPRINT_HEIGHT);
                                            updateCanvasDimensions({ kind: "structure", id: structure.id, x: nextX, y: nextY, w: structure.w, h: structure.h });
                                            const hasCollision = hasCollisionWithPlacedItems({ x: nextX, y: nextY, w: structure.w, h: structure.h }, { kind: "structure", id: structure.id });
                                            updateTrashHotState(info.point.x, info.point.y);
                                            setDragGhost({
                                                unitId: structure.id,
                                                kind: "structure",
                                                structureType: structure.type,
                                                stairVariant: structure.variant,
                                                stairRotation: structure.rotation ?? 0,
                                                label: structure.label,
                                                x: nextX,
                                                y: nextY,
                                                w: structure.w,
                                                h: structure.h,
                                                isValid: !hasCollision,
                                            });
                                        }}
                                        onDragEnd={(_, info) => {
                                            const shouldDelete = isPointerNearTrash(info.point.x, info.point.y);
                                            if (shouldDelete) {
                                                requestDeleteItem({ kind: "structure", id: structure.id }, "trash");
                                                setDragGhost(null);
                                                setDraggingStructureId(current => current === structure.id ? null : current);
                                                setIsTrashHot(false);
                                                return;
                                            }

                                            const worldOffsetX = info.offset.x / scale;
                                            const worldOffsetY = info.offset.y / scale;
                                            const nextX = clampUnitAxis(snapToGrid(structure.x + worldOffsetX), structure.w, BLUEPRINT_WIDTH);
                                            const nextY = clampUnitAxis(snapToGrid(structure.y + worldOffsetY), structure.h, BLUEPRINT_HEIGHT);
                                            const hasCollision = hasCollisionWithPlacedItems({ x: nextX, y: nextY, w: structure.w, h: structure.h }, { kind: "structure", id: structure.id });

                                            if (hasCollision) {
                                                triggerOverlapToast();
                                            } else {
                                                setStructures(prev => prev.map((existing) => (
                                                    existing.id === structure.id
                                                        ? { ...existing, x: nextX, y: nextY }
                                                        : existing
                                                )));
                                            }
                                            setDragGhost(null);
                                            setDraggingStructureId(current => current === structure.id ? null : current);
                                            setIsTrashHot(false);
                                        }}
                                    >
                                        {structure.type === "elevator" ? (
                                            <div className="w-full h-full bg-slate-800 relative shadow-sm overflow-hidden select-none rounded-[1px]">
                                                <div className="absolute inset-0 border-[2px] border-slate-500"></div>
                                                <div className="absolute inset-[4px] border border-slate-600"></div>
                                                <div className="absolute inset-[10px] border border-slate-700 rounded-[1px]"></div>
                                                <div className="absolute inset-x-[18%] top-[14%] bottom-[18%] border border-slate-600 flex bg-slate-800/80">
                                                    <div className="w-1/2 border-r border-slate-600"></div>
                                                    <div className="w-1/2"></div>
                                                </div>
                                                <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-500"></div>
                                                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-blue-500"></div>
                                                <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 flex items-center gap-1 text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                                                    <span className="material-icons-round text-[12px]">elevator</span>
                                                    <span>Elevator</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full relative overflow-hidden">
                                                <div style={getRotatedArtworkStyle(structure.w, structure.h, structure.rotation ?? 0)}>
                                                    {structure.variant === "straight" ? (
                                                        /* Straight Flight */
                                                        <div className="w-full h-full bg-slate-800 relative shadow-sm overflow-hidden select-none rounded-[1px]">
                                                            <div className="absolute inset-0 border-[2px] border-slate-500"></div>
                                                            <div className="absolute inset-[4px] border border-slate-600"></div>
                                                            {/* Steps */}
                                                            <div className="absolute left-[15%] right-[15%] top-[10%] bottom-[10%] flex flex-col justify-between">
                                                                {[...Array(12)].map((_, i) => (
                                                                    <div key={i} className="w-full h-px bg-slate-400/50"></div>
                                                                ))}
                                                            </div>
                                                            {/* Arrow */}
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="h-[60%] w-px bg-slate-300 relative">
                                                                    <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-r border-slate-300 rotate-[-45deg]"></div>
                                                                </div>
                                                            </div>
                                                            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-blue-500"></div>
                                                        </div>
                                                    ) : structure.variant === "l-shape" ? (
                                                        /* L-Shape */
                                                        <div className="w-full h-full bg-slate-800 relative shadow-sm overflow-hidden select-none rounded-[1px]">
                                                            <div className="absolute inset-0 border-[2px] border-slate-500"></div>
                                                            {/* Landing - Top Right */}
                                                            <div className="absolute top-0 right-0 w-1/2 h-1/2 border-b border-l border-slate-500"></div>
                                                            {/* Flight 1 - Bottom Right (Vertical) */}
                                                            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 border-l border-slate-500 flex flex-col justify-between py-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <div key={i} className="w-full h-px bg-slate-400/50"></div>
                                                                ))}
                                                            </div>
                                                            {/* Flight 2 - Top Left (Horizontal) */}
                                                            <div className="absolute top-0 left-0 w-1/2 h-1/2 border-b border-slate-500 flex flex-row justify-between px-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <div key={i} className="h-full w-px bg-slate-400/50"></div>
                                                                ))}
                                                            </div>
                                                            {/* Direction Line */}
                                                            <div className="absolute top-[25%] left-[10%] right-[10%] bottom-[10%] pointer-events-none">
                                                                <svg className="w-full h-full text-slate-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M 85 90 L 85 25 L 10 25" />
                                                                    <path d="M 15 20 L 10 25 L 15 30" />
                                                                </svg>
                                                            </div>
                                                            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-blue-500"></div>
                                                        </div>
                                                    ) : structure.variant === "u-shape" ? (
                                                        /* U-Shape */
                                                        <div className="w-full h-full bg-slate-800 relative shadow-sm overflow-hidden select-none rounded-[1px]">
                                                            <div className="absolute inset-0 border-[2px] border-slate-500"></div>
                                                            {/* Landing - Top */}
                                                            <div className="absolute top-0 left-0 right-0 h-[30%] border-b border-slate-500 bg-slate-700/30"></div>
                                                            {/* Divider Wall */}
                                                            <div className="absolute top-[30%] bottom-0 left-1/2 -translate-x-1/2 w-1 bg-slate-500"></div>
                                                            {/* Left Flight */}
                                                            <div className="absolute top-[30%] bottom-0 left-0 right-1/2 flex flex-col justify-between py-1 border-r border-slate-500/50">
                                                                {[...Array(7)].map((_, i) => (
                                                                    <div key={i} className="w-full h-px bg-slate-400/50"></div>
                                                                ))}
                                                            </div>
                                                            {/* Right Flight */}
                                                            <div className="absolute top-[30%] bottom-0 left-1/2 right-0 flex flex-col justify-between py-1 border-l border-slate-500/50">
                                                                {[...Array(7)].map((_, i) => (
                                                                    <div key={i} className="w-full h-px bg-slate-400/50"></div>
                                                                ))}
                                                            </div>
                                                            {/* Direction Line */}
                                                            <div className="absolute inset-0 pointer-events-none p-2">
                                                                <svg className="w-full h-full text-slate-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M 75 90 L 75 15 L 25 15 L 25 90" />
                                                                    <path d="M 20 85 L 25 90 L 30 85" />
                                                                </svg>
                                                            </div>
                                                            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-blue-500"></div>
                                                        </div>
                                                    ) : structure.variant === "spiral" ? (
                                                        /* Spiral */
                                                        <div className="w-full h-full bg-slate-800 relative shadow-sm overflow-hidden select-none rounded-full border-[2px] border-slate-500">
                                                            <div className="absolute inset-[35%] border border-slate-500 rounded-full bg-slate-900 z-10"></div>
                                                            {/* Radial Steps */}
                                                            {[...Array(12)].map((_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="absolute inset-0 border-t border-slate-500/50 origin-center"
                                                                    style={{ transform: `rotate(${i * 30}deg)` }}
                                                                ></div>
                                                            ))}
                                                            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-blue-500 rounded-full"></div>
                                                        </div>
                                                    ) : (
                                                        /* Default / Fallback */
                                                        <div className="w-full h-full bg-slate-800 relative shadow-sm overflow-hidden select-none rounded-[1px]">
                                                            <div className="absolute inset-0 border-[2px] border-slate-500"></div>
                                                            <div className="absolute inset-[4px] border border-slate-600"></div>
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className="text-[10px] text-slate-400 uppercase">Stairwell</span>
                                                            </div>
                                                            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-blue-500"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}

                                {units.map((unit) => (
                                    <motion.div
                                        key={unit.id}
                                        data-unit-card="true"
                                        className={`absolute group cursor-pointer ${selectedItem?.kind === "unit" && selectedItem.id === unit.id ? 'ring-2 ring-primary ring-offset-1 ring-offset-slate-900' : ''}`}
                                        style={{
                                            left: unit.x,
                                            top: unit.y,
                                            width: unit.w,
                                            height: unit.h,
                                            zIndex: draggingUnitId === unit.id ? 30 : 10,
                                        }}
                                        drag
                                        dragConstraints={blueprintRef}
                                        dragElastic={0}
                                        dragMomentum={false}
                                        dragSnapToOrigin
                                        transition={{ duration: 0 }}
                                        onPointerDown={() => setSelectedItem({ kind: "unit", id: unit.id })}
                                        onDragStart={() => {
                                            setSelectedItem({ kind: "unit", id: unit.id });
                                            setDraggingUnitId(unit.id);
                                            setIsTrashHot(false);
                                            setDragGhost({
                                                unitId: unit.id,
                                                kind: "unit",
                                                label: unit.name,
                                                x: unit.x,
                                                y: unit.y,
                                                w: unit.w,
                                                h: unit.h,
                                                isValid: true,
                                            });
                                        }}
                                        onDrag={(_, info) => {
                                            const worldOffsetX = info.offset.x / scaleRef.current;
                                            const worldOffsetY = info.offset.y / scaleRef.current;
                                            const snappedPosition = getSnappedUnitPosition(unit, worldOffsetX, worldOffsetY);
                                            updateCanvasDimensions({ kind: "unit", id: unit.id, x: snappedPosition.x, y: snappedPosition.y, w: unit.w, h: unit.h });
                                            const hasCollision = hasCollisionWithPlacedItems(
                                                { x: snappedPosition.x, y: snappedPosition.y, w: unit.w, h: unit.h },
                                                { kind: "unit", id: unit.id }
                                            );
                                            updateTrashHotState(info.point.x, info.point.y);
                                            setDragGhost({
                                                unitId: unit.id,
                                                kind: "unit",
                                                label: unit.name,
                                                x: snappedPosition.x,
                                                y: snappedPosition.y,
                                                w: unit.w,
                                                h: unit.h,
                                                isValid: !hasCollision,
                                            });
                                        }}
                                        onDragEnd={(_, info) => {
                                            const shouldDelete = isPointerNearTrash(info.point.x, info.point.y);
                                            if (shouldDelete) {
                                                requestDeleteItem({ kind: "unit", id: unit.id }, "trash");
                                                setDragGhost(null);
                                                setDraggingUnitId(current => current === unit.id ? null : current);
                                                setIsTrashHot(false);
                                                return;
                                            }

                                            flushSync(() => {
                                                setUnits(prevUnits => {
                                                    const currentUnit = prevUnits.find((u) => u.id === unit.id);
                                                    if (!currentUnit) return prevUnits;

                                                    const worldOffsetX = info.offset.x / scale;
                                                    const worldOffsetY = info.offset.y / scale;
                                                    const snappedPosition = getSnappedUnitPosition(currentUnit, worldOffsetX, worldOffsetY);
                                                    const hasCollision = hasCollisionWithPlacedItems(
                                                        { x: snappedPosition.x, y: snappedPosition.y, w: currentUnit.w, h: currentUnit.h },
                                                        { kind: "unit", id: currentUnit.id }
                                                    );

                                                    if (hasCollision) {
                                                        triggerOverlapToast();
                                                        return prevUnits;
                                                    }

                                                    return prevUnits.map((existingUnit) =>
                                                        existingUnit.id === unit.id
                                                            ? {
                                                                ...existingUnit,
                                                                x: snappedPosition.x,
                                                                y: snappedPosition.y,
                                                            }
                                                            : existingUnit
                                                    );
                                                });
                                            });
                                            setDragGhost(null);
                                            setDraggingUnitId(current => current === unit.id ? null : current);
                                            setIsTrashHot(false);
                                        }}
                                    >
                                        {/* Blueprint Architectural Rendering - Dark Mode */}
                                        <div className="w-full h-full bg-neutral-800 relative shadow-sm overflow-hidden select-none rounded-[1px]">
                                            {/* Outer Walls - Lighter for dark mode */}
                                            <div className="absolute inset-0 border-[2px] border-neutral-500"></div>
                                            <div className="absolute inset-[4px] border border-neutral-600"></div>

                                            {/* Door - Bottom Center */}
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[6px] bg-neutral-800 z-10 border-x-2 border-neutral-500"></div>

                                            {/* Windows - Top Center */}
                                            <div className="absolute top-0 left-1/4 right-1/4 h-[6px] bg-neutral-800 z-10 flex items-center justify-center border-x border-neutral-500">
                                                <div className="w-full h-px bg-neutral-600"></div>
                                            </div>

                                            {/* Windows - Sides */}
                                            <div className="absolute top-1/4 bottom-1/4 left-0 w-[6px] bg-neutral-800 z-10 flex flex-col justify-center border-y border-neutral-500">
                                                <div className="h-full w-px bg-neutral-500 mx-auto"></div>
                                            </div>
                                            <div className="absolute top-1/4 bottom-1/4 right-0 w-[6px] bg-neutral-800 z-10 flex flex-col justify-center border-y border-neutral-500">
                                                <div className="h-full w-px bg-neutral-500 mx-auto"></div>
                                            </div>

                                            {/* Interior Elements (Columns/Corners) */}
                                            <div className="absolute top-[8px] right-[8px] w-5 h-5 border border-neutral-600"></div>
                                            <div className="absolute bottom-[8px] left-[8px] w-4 h-4 border border-neutral-600 flex flex-col gap-0.5 p-0.5">
                                                <div className="w-full h-full border border-neutral-700"></div>
                                            </div>
                                            <div className="absolute bottom-[8px] right-[8px] w-4 h-4 border border-neutral-600 flex flex-col gap-0.5 p-0.5">
                                                <div className="w-full h-full border border-neutral-700"></div>
                                            </div>

                                            {/* Grid floor pattern inside unit */}
                                            <div className="absolute inset-[8px] opacity-10"
                                                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}
                                            ></div>

                                            {/* Status Highlight Overlay - Always visible */}
                                            <div className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity ${unit.status === 'occupied' ? 'bg-status-occupied' :
                                                unit.status === 'vacant' ? 'bg-status-vacant' :
                                                    unit.status === 'maintenance' ? 'bg-status-maintenance' : 'bg-status-due'
                                                }`}></div>

                                            {/* Info Content Overlay */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 z-20">
                                                {/* Mini Status Indicator */}
                                                <div className={`w-2 h-2 rounded-full mb-2 shadow-[0_0_8px_rgba(0,0,0,0.5)] ${unit.status === 'occupied' ? 'bg-status-occupied' :
                                                    unit.status === 'vacant' ? 'bg-status-vacant' :
                                                        unit.status === 'maintenance' ? 'bg-status-maintenance' : 'bg-status-due'
                                                    }`}></div>

                                                <h4 className="font-bold text-xs text-neutral-200 drop-shadow-md">{unit.name}</h4>

                                                {unit.status !== 'vacant' && unit.tenant && (
                                                    <p className="text-[10px] text-neutral-400 font-mono mt-1">{unit.tenant}</p>
                                                )}
                                                {unit.status === 'vacant' && (
                                                    <span className="text-[9px] text-blue-400 font-bold uppercase mt-1 tracking-wider border border-blue-500/30 px-1 rounded bg-blue-500/10">Vacant</span>
                                                )}
                                                {unit.status === 'maintenance' && (
                                                    <span className="text-[9px] text-red-400 font-bold uppercase mt-1 tracking-wider border border-red-500/30 px-1 rounded bg-red-500/10">Maint</span>
                                                )}
                                            </div>

                                            {/* Resize Handle */}
                                            <div className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize border-b-2 border-r-2 border-neutral-500 rounded-br-sm opacity-0 group-hover:opacity-100"></div>
                                        </div>
                                    </motion.div>
                                ))}

                            </div>
                        </motion.div>

                    </div>

                    {/* Legend */}
                    <div className="absolute bottom-6 right-6 flex flex-col gap-4 z-20 pointer-events-none">
                        {showLegend ? (
                            <div className="bg-surface-dark border border-neutral-700 p-3 rounded-lg shadow-xl backdrop-blur-sm bg-opacity-90 pointer-events-auto">
                                <div className="flex items-center justify-between mb-2 gap-2">
                                    <h4 className="text-[10px] uppercase font-bold text-neutral-400">Legend</h4>
                                    <button
                                        type="button"
                                        onClick={() => setShowLegend(false)}
                                        className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 hover:text-neutral-200 border border-neutral-600 hover:border-neutral-500 rounded px-1.5 py-0.5 transition-colors"
                                    >
                                        Hide
                                    </button>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-sm bg-status-vacant"></div>
                                        <span className="text-xs text-neutral-300">Vacant</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-sm bg-status-occupied"></div>
                                        <span className="text-xs text-neutral-300">Occupied</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-sm bg-status-due"></div>
                                        <span className="text-xs text-neutral-300">Near-due</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-sm bg-status-maintenance"></div>
                                        <span className="text-xs text-neutral-300">Maintenance</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowLegend(true)}
                                className="self-end bg-surface-dark border border-neutral-700 px-2.5 py-1.5 rounded-lg shadow-xl backdrop-blur-sm bg-opacity-90 pointer-events-auto text-[10px] font-semibold uppercase tracking-wide text-neutral-300 hover:text-neutral-100 hover:border-neutral-500 transition-colors"
                            >
                                Show Legend
                            </button>
                        )}

                        {/* Controls */}
                        <div className="flex gap-4 items-end pointer-events-auto">
                            {/* Minimap */}
                            <div className="w-48 h-32 bg-surface-dark border border-neutral-700 rounded-lg shadow-xl overflow-hidden relative group hidden md:block">
                                <div className="absolute inset-0 p-2">
                                    <div
                                        ref={minimapRef}
                                        onPointerDown={handleMinimapPointerDown}
                                        className="w-full h-full bg-neutral-800 rounded opacity-50 relative overflow-hidden cursor-pointer"
                                    >
                                        <div
                                            className="absolute border border-neutral-600/60"
                                            style={{
                                                top: `${(BLUEPRINT_MARGIN / WORLD_HEIGHT) * 100}%`,
                                                left: `${(BLUEPRINT_MARGIN / WORLD_WIDTH) * 100}%`,
                                                width: `${(BLUEPRINT_WIDTH / WORLD_WIDTH) * 100}%`,
                                                height: `${(BLUEPRINT_HEIGHT / WORLD_HEIGHT) * 100}%`,
                                            }}
                                        ></div>

                                        {units.map((unit) => (
                                            <div
                                                key={`minimap-${unit.id}`}
                                                className={`absolute rounded-[1px] ${unit.status === 'occupied' ? 'bg-status-occupied/70' :
                                                    unit.status === 'vacant' ? 'bg-status-vacant/70' :
                                                        unit.status === 'maintenance' ? 'bg-status-maintenance/70' : 'bg-status-due/70'
                                                    }`}
                                                style={{
                                                    left: `${((BLUEPRINT_MARGIN + unit.x) / WORLD_WIDTH) * 100}%`,
                                                    top: `${((BLUEPRINT_MARGIN + unit.y) / WORLD_HEIGHT) * 100}%`,
                                                    width: `${(unit.w / WORLD_WIDTH) * 100}%`,
                                                    height: `${(unit.h / WORLD_HEIGHT) * 100}%`,
                                                }}
                                            ></div>
                                        ))}

                                        {corridors.map((corridor) => (
                                            <div
                                                key={`minimap-corridor-${corridor.id}`}
                                                className="absolute bg-neutral-500/70 rounded-[1px]"
                                                style={{
                                                    left: `${((BLUEPRINT_MARGIN + corridor.x) / WORLD_WIDTH) * 100}%`,
                                                    top: `${((BLUEPRINT_MARGIN + corridor.y) / WORLD_HEIGHT) * 100}%`,
                                                    width: `${(corridor.w / WORLD_WIDTH) * 100}%`,
                                                    height: `${(corridor.h / WORLD_HEIGHT) * 100}%`,
                                                }}
                                            ></div>
                                        ))}

                                        {structures.map((structure) => (
                                            <div
                                                key={`minimap-structure-${structure.id}`}
                                                className="absolute bg-neutral-300/70 rounded-[1px]"
                                                style={{
                                                    left: `${((BLUEPRINT_MARGIN + structure.x) / WORLD_WIDTH) * 100}%`,
                                                    top: `${((BLUEPRINT_MARGIN + structure.y) / WORLD_HEIGHT) * 100}%`,
                                                    width: `${(structure.w / WORLD_WIDTH) * 100}%`,
                                                    height: `${(structure.h / WORLD_HEIGHT) * 100}%`,
                                                }}
                                            ></div>
                                        ))}

                                        <div
                                            onPointerDown={handleMinimapViewportPointerDown}
                                            className="absolute border-2 border-primary bg-primary/20 cursor-move"
                                            style={{
                                                left: minimapViewport.left,
                                                top: minimapViewport.top,
                                                width: minimapViewport.width,
                                                height: minimapViewport.height,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col bg-surface-dark border border-neutral-700 rounded-lg shadow-xl overflow-hidden">
                                <button onClick={handleZoomIn} className="p-2 hover:bg-neutral-700 text-neutral-300 transition-colors border-b border-neutral-700"><span className="material-icons-round text-lg">add</span></button>
                                <button onClick={handleZoomOut} className="p-2 hover:bg-neutral-700 text-neutral-300 transition-colors border-b border-neutral-700"><span className="material-icons-round text-lg">remove</span></button>
                                <button onClick={handleFit} className="p-2 hover:bg-neutral-700 text-neutral-300 transition-colors border-b border-neutral-700"><span className="material-icons-round text-lg">aspect_ratio</span></button>
                                <button
                                    onClick={handleUndo}
                                    disabled={!undoAvailable}
                                    className={`p-2 transition-colors ${undoAvailable ? 'hover:bg-neutral-700 text-neutral-300' : 'text-neutral-600 cursor-not-allowed'}`}
                                    title="Undo (Ctrl+Z)"
                                >
                                    <span className="material-icons-round text-lg">undo</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className="absolute bottom-6 left-6 bg-surface-dark/90 backdrop-blur border border-neutral-700 py-2 px-4 rounded-lg shadow-lg z-20 pointer-events-auto">
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex flex-col">
                                <span className="text-neutral-400">Total Units</span>
                                <span className="font-mono text-white">{units.length}</span>
                            </div>
                            <div className="h-6 w-px bg-neutral-700"></div>
                            <div className="flex flex-col">
                                <span className="text-neutral-400">Total Area</span>
                                <span className="font-mono text-white">{totalArea.toLocaleString()} sqft</span>
                            </div>
                            <div className="h-6 w-px bg-neutral-700"></div>
                            <div className="flex flex-col">
                                <span className="text-neutral-400">Cursor</span>
                                <span className="font-mono text-primary">X: {Math.round(position.x)} Y: {Math.round(position.y)}</span>
                            </div>
                        </div>
                    </div>

                    {showOverlapToast && (
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg border border-red-500/50 bg-red-500/15 text-red-200 text-sm font-medium shadow-lg pointer-events-none">
                            Units overlap
                        </div>
                    )}

                    {showDeleteToast && (
                        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg border border-emerald-500/50 bg-emerald-500/15 text-emerald-200 text-sm font-medium shadow-lg pointer-events-none">
                            Item deleted
                        </div>
                    )}

                    {isDraggingCanvasItem && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                            <div
                                ref={trashRef}
                                className={`w-16 h-16 rounded-full border-2 flex items-center justify-center shadow-xl transition-all ${isTrashHot ? 'border-red-400 bg-red-500/25 scale-110' : 'border-neutral-500 bg-neutral-800/80'}`}
                            >
                                <span className={`material-icons-round text-2xl ${isTrashHot ? 'text-red-300' : 'text-neutral-300'}`}>delete</span>
                            </div>
                        </div>
                    )}

                    {pendingDelete && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-950/55 p-4">
                            <div className="w-full max-w-sm rounded-xl border border-neutral-700 bg-surface-dark shadow-2xl">
                                <div className="p-5">
                                    <h3 className="text-sm font-semibold text-white">Confirm deletion</h3>
                                    <p className="mt-2 text-xs text-neutral-300">
                                        Delete {getCanvasItemLabel(pendingDelete.item)}?
                                    </p>
                                    <p className="mt-1 text-[11px] text-neutral-400">
                                        {pendingDelete.source === "trash" ? "You dropped this item near the trash." : "You used keyboard delete."}
                                    </p>
                                </div>
                                <div className="flex items-center justify-end gap-2 border-t border-neutral-700 p-3">
                                    <button
                                        onClick={cancelDeleteItem}
                                        className="rounded-md border border-neutral-600 bg-neutral-700/50 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDeleteItem}
                                        className="rounded-md border border-red-500/60 bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/30"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Sidebar */}
                <aside className="w-72 bg-white dark:bg-surface-dark border-l border-slate-200 dark:border-slate-700 flex flex-col z-10 shadow-2xl">
                    {selectedItem?.kind === "unit" ? (
                        <UnitDetailsPanel
                            unit={units.find(u => u.id === selectedItem.id)!}
                            onUpdate={(updates) => {
                                setUnits(prev => prev.map(u => u.id === selectedItem.id ? { ...u, ...updates } : u));
                            }}
                            onDelete={() => {
                                deleteCanvasItem({ kind: "unit", id: selectedItem.id });
                                setSelectedItem(null);
                                triggerDeleteToast();
                            }}
                            onClose={() => setSelectedItem(null)}
                        />
                    ) : (
                        <SidebarBlockLibrary
                            onDragStart={handleSidebarBlockDragStart}
                            styles={styles}
                        />
                    )}
                </aside>
            </div>
        </div>
    );
}

const UnitDetailsPanel = ({
    unit,
    onUpdate,
    onDelete,
    onClose
}: {
    unit: Unit;
    onUpdate: (updates: Partial<Unit>) => void;
    onDelete: () => void;
    onClose: () => void;
}) => {
    const [isEditing, setIsEditing] = useState(false);

    // Status configuration for consistent styling
    const statusConfig = {
        occupied: { color: 'text-emerald-400', label: 'Occupied', icon: 'check_circle' },
        vacant: { color: 'text-blue-400', label: 'Available Now', icon: 'vpn_key' },
        maintenance: { color: 'text-amber-400', label: 'Maintenance', icon: 'build' },
        neardue: { color: 'text-rose-400', label: 'Near Due', icon: 'warning' }
    };

    const currentStatus = statusConfig[unit.status] || statusConfig.vacant;

    // Helper to calculate days remaining
    const getDaysRemaining = () => {
        if (!unit.leaseEnd) return null;
        const end = new Date(unit.leaseEnd).getTime();
        const now = Date.now();
        const diff = end - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    const daysRemaining = getDaysRemaining();

    return (
        <div className="flex flex-col h-full bg-[#1a1c23] border-l border-slate-800 shadow-2xl overflow-hidden relative font-sans">

            {/* Hero Header Section */}
            <div className="relative h-64 w-full shrink-0 group overflow-hidden">
                {/* Background Image / Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 mix-blend-overlay opacity-20 z-0"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-80 z-0 grayscale-[0.2] transition-transform duration-700 group-hover:scale-105"></div>

                {/* Overlay Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c23] via-transparent to-transparent z-10"></div>
                <div className="absolute inset-0 bg-black/20 z-10"></div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white border border-white/10 transition-all"
                >
                    <span className="material-icons-round text-lg">close</span>
                </button>

                {/* Bottom Content */}
                <div className="absolute bottom-6 left-6 right-6 z-20">
                    <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-lg mb-2">{unit.name}</h1>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="material-icons-round text-xs text-primary-400">king_bed</span>
                            <span className="text-xs font-medium text-white/90">
                                {unit.type === '1BR' ? '1 Bed / 1 Bath' :
                                    unit.type === '2BR' ? '2 Bed / 2 Bath' :
                                        unit.type === '3BR' ? '3 Bed / 2.5 Bath' : 'Studio / 1 Bath'}
                            </span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-white/30"></div>
                        <div className="flex items-center gap-1.5">
                            <span className={`material-icons-round text-xs ${currentStatus.color}`}>event_available</span>
                            <span className="text-xs font-medium text-white/90">{currentStatus.label}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 relative z-0 mb-24 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-slate-600/80">

                {!isEditing ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">



                        {/* Tenant Section */}
                        <div className="mt-4">
                            <h3 className="text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-4 pl-1">
                                Current Tenant
                            </h3>
                            <div className="flex items-center justify-between group px-1">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full p-0.5 border-2 border-sky-500 relative">
                                            <div className="w-full h-full rounded-full bg-slate-700 overflow-hidden">
                                                <img
                                                    src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop"
                                                    alt="Tenant"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {/* Status Dot */}
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#1a1c23] rounded-full translate-x-1 translate-y-1"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-white tracking-wide">{unit.tenant || "No Tenant"}</p>
                                        <p className="text-xs text-slate-500 font-medium italic">"Unit Lease Holder"</p>
                                    </div>
                                </div>
                                <button className="w-10 h-10 rounded-full flex items-center justify-center text-sky-500 hover:bg-sky-500/10 transition-colors">
                                    <span className="material-icons-round text-2xl">chat_bubble_outline</span>
                                </button>
                            </div>


                        </div>

                        {/* Lease Status */}
                        {(unit.status === 'occupied' || unit.status === 'neardue') && (
                            <div className="bg-[#23242f] border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center">
                                <h3 className="text-primary-400 text-[10px] font-bold tracking-widest uppercase mb-6 self-start w-full">
                                    Lease Timeline
                                </h3>

                                <div className="relative w-56 h-28 mb-2 overflow-hidden">
                                    {/* Meter Gauge */}
                                    <svg className="w-full h-full transform rotate-0" viewBox="0 0 200 100">
                                        {/* Background Arc */}
                                        <path
                                            d="M 20 100 A 80 80 0 0 1 180 100"
                                            fill="none"
                                            stroke="#334155"
                                            strokeWidth="12"
                                            strokeLinecap="round"
                                            className="opacity-30"
                                        />
                                        {/* Progress Arc */}
                                        <path
                                            d="M 20 100 A 80 80 0 0 1 180 100"
                                            fill="none"
                                            stroke="url(#gradient)"
                                            strokeWidth="12"
                                            strokeLinecap="round"
                                            strokeDasharray="251.2"
                                            strokeDashoffset={251.2 - ((() => {
                                                if (!unit.leaseStart || !unit.leaseEnd) return 0;
                                                const start = new Date(unit.leaseStart).getTime();
                                                const end = new Date(unit.leaseEnd).getTime();
                                                const now = Date.now();
                                                const total = end - start;
                                                const elapsed = now - start;
                                                const percent = Math.min(100, Math.max(0, (elapsed / total) * 100));
                                                return (percent / 100) * 251.2;
                                            })())}
                                            className="transition-all duration-1000 ease-out"
                                        />
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#d4b996" />
                                                <stop offset="100%" stopColor="#a89070" />
                                            </linearGradient>
                                        </defs>
                                    </svg>

                                    {/* Center Content */}
                                    <div className="absolute inset-x-0 bottom-0 text-center">
                                        <span className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#d4b996] to-white`}>
                                            {daysRemaining !== null ? (
                                                daysRemaining < 0 ? 'Overdue' : daysRemaining
                                            ) : '--'}
                                        </span>
                                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest -mt-1">
                                            {daysRemaining !== null && daysRemaining < 0 ? 'Days Past' : 'Days Left'}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full flex justify-between text-[10px] uppercase font-bold text-slate-500 tracking-wider px-4 mt-2">
                                    <span>{unit.leaseStart ? new Date(unit.leaseStart).toLocaleDateString() : 'Start'}</span>
                                    <span>{unit.leaseEnd ? new Date(unit.leaseEnd).toLocaleDateString() : 'End'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Edit Form */}
                        <section className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-primary-400 text-[10px] font-bold tracking-widest uppercase block mb-4">Edit Details</label>

                                <div className="space-y-4">
                                    <div className="group relative">
                                        <input
                                            type="text"
                                            value={unit.name}
                                            onChange={(e) => onUpdate({ name: e.target.value })}
                                            className="block w-full px-4 py-3 bg-[#23242f] border border-slate-700/50 rounded-xl text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all peer placeholder-transparent"
                                            placeholder="Unit Name"
                                            id="unitName"
                                        />
                                        <label htmlFor="unitName" className="absolute left-4 -top-2.5 bg-[#1a1c23] px-2 text-[10px] font-bold text-primary transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:text-primary">
                                            Name
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group relative">
                                            <select
                                                value={unit.type}
                                                onChange={(e) => onUpdate({ type: e.target.value as Unit["type"] })}
                                                className="block w-full px-4 py-3 bg-[#23242f] border border-slate-700/50 rounded-xl text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all appearance-none"
                                            >
                                                <option value="Studio">Studio</option>
                                                <option value="1BR">1 Bedroom</option>
                                                <option value="2BR">2 Bedroom</option>
                                                <option value="3BR">3 Bedroom</option>
                                            </select>
                                            <label className="absolute left-4 -top-2.5 bg-[#1a1c23] px-2 text-[10px] font-bold text-primary">
                                                Type
                                            </label>
                                        </div>

                                        <div className="group relative">
                                            <select
                                                value={unit.status}
                                                onChange={(e) => onUpdate({ status: e.target.value as Unit["status"] })}
                                                className="block w-full px-4 py-3 bg-[#23242f] border border-slate-700/50 rounded-xl text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all appearance-none"
                                            >
                                                <option value="occupied">Occupied</option>
                                                <option value="vacant">Vacant</option>
                                                <option value="maintenance">Maint.</option>
                                                <option value="neardue">Near Due</option>
                                            </select>
                                            <label className="absolute left-4 -top-2.5 bg-[#1a1c23] px-2 text-[10px] font-bold text-primary">
                                                Status
                                            </label>
                                        </div>
                                    </div>

                                    <div className="group relative mt-6">
                                        <input
                                            type="text"
                                            value={unit.tenant || ''}
                                            onChange={(e) => onUpdate({ tenant: e.target.value })}
                                            className="block w-full px-4 py-3 bg-[#23242f] border border-slate-700/50 rounded-xl text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary transition-all peer placeholder-transparent"
                                            placeholder="Tenant Name"
                                            id="tenantName"
                                        />
                                        <label htmlFor="tenantName" className="absolute left-4 -top-2.5 bg-[#1a1c23] px-2 text-[10px] font-bold text-primary transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:text-primary">
                                            Tenant Name
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </div>

            {/* Footer */}
            {isEditing ? (
                <div className="p-6 border-t border-slate-800 bg-[#1a1c23]/90 backdrop-blur-xl absolute bottom-0 w-full z-20 flex gap-4">
                    <button
                        onClick={onDelete}
                        className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-all"
                    >
                        <span className="material-icons-round">delete</span>
                    </button>
                    <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-primary/20"
                    >
                        Save Changes
                    </button>
                </div>
            ) : (
                <div className="p-6 border-t border-slate-800 bg-[#1a1c23]/90 backdrop-blur-xl absolute bottom-0 w-full z-20">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-primary/20"
                    >
                        Edit Residence
                    </button>
                </div>
            )}
        </div>
    );
};

/* End of Details Panel */

/* Extracted Sidebar Library Component for cleaner main render */
const SidebarBlockLibrary = ({
    onDragStart,
    styles
}: {
    onDragStart: (type: SidebarBlockType) => (e: React.DragEvent<HTMLDivElement>) => void;
    styles: { readonly [key: string]: string; }
}) => {
    const handleSidebarBlockDragEnd = () => {
        // Optional cleanup if needed inside component, but parent tracks ghost
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Building Blocks</h2>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="material-icons-round text-slate-400 text-lg">search</span>
                    </span>
                    <input className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-600 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-700 dark:text-slate-200 placeholder-slate-400" placeholder="Search components..." type="text" />
                </div>
            </div>
            <div className={`flex-1 overflow-y-auto p-4 space-y-6 ${styles['scrollbarHide'] || ''}`}>
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                        <span className="material-icons-round text-primary text-sm">bedroom_parent</span>
                        Living Units
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            className="group cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-600 hover:border-primary dark:hover:border-primary rounded-lg p-3 flex flex-col items-center gap-2 transition-all hover:shadow-md"
                            draggable="true"
                            onDragStart={onDragStart("studio")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className="w-10 h-8 bg-slate-200 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-500 group-hover:bg-primary/10 group-hover:border-primary/50 transition-colors"></div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Studio</p>
                                <p className="text-[10px] text-slate-500">400 sqft</p>
                            </div>
                        </div>
                        <div
                            className="group cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-600 hover:border-primary dark:hover:border-primary rounded-lg p-3 flex flex-col items-center gap-2 transition-all hover:shadow-md"
                            draggable="true"
                            onDragStart={onDragStart("1br")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className="w-12 h-8 bg-slate-200 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-500 flex"><div className="w-1/2 border-r border-slate-400 dark:border-slate-600"></div></div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">1 BR Std</p>
                                <p className="text-[10px] text-slate-500">650 sqft</p>
                            </div>
                        </div>
                        <div
                            className="group cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-600 hover:border-primary dark:hover:border-primary rounded-lg p-3 flex flex-col items-center gap-2 transition-all hover:shadow-md"
                            draggable="true"
                            onDragStart={onDragStart("2br")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className="w-12 h-10 bg-slate-200 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-500 relative"><div className="absolute inset-0 grid grid-cols-2 grid-rows-1"><div className="border-r border-slate-400 dark:border-slate-600"></div></div></div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">2 BR Corner</p>
                                <p className="text-[10px] text-slate-500">950 sqft</p>
                            </div>
                        </div>
                        <div
                            className="group cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-600 hover:border-primary dark:hover:border-primary rounded-lg p-3 flex flex-col items-center gap-2 transition-all hover:shadow-md"
                            draggable="true"
                            onDragStart={onDragStart("3br")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className="w-14 h-10 bg-slate-200 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-500 relative"><div className="absolute inset-0 grid grid-cols-3 grid-rows-1"><div className="border-r border-slate-400 dark:border-slate-600"></div><div className="border-r border-slate-400 dark:border-slate-600"></div></div></div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">3 BR Suite</p>
                                <p className="text-[10px] text-slate-500">1200 sqft</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                        <span className="material-icons-round text-primary text-sm">architecture</span>
                        Structural
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            className="group cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-600 hover:border-primary dark:hover:border-primary rounded-lg p-3 flex flex-col items-center gap-2 transition-all hover:shadow-md"
                            draggable="true"
                            onDragStart={onDragStart("corridor")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className="w-14 h-8 bg-slate-900/80 border-y border-slate-700 rounded-[1px]" />
                            <div className="text-center"><p className="text-xs font-medium text-slate-700 dark:text-slate-200">Corridor</p></div>
                        </div>
                        <div
                            className="group cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-600 hover:border-primary dark:hover:border-primary rounded-lg p-3 flex flex-col items-center gap-2 transition-all hover:shadow-md"
                            draggable="true"
                            onDragStart={onDragStart("elevator")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded flex items-center justify-center">
                                <span className="material-icons-round text-slate-500 dark:text-slate-400 text-sm">elevator</span>
                            </div>
                            <div className="text-center"><p className="text-xs font-medium text-slate-700 dark:text-slate-200">Elevator</p></div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                        <span className="material-icons-round text-primary text-sm">stairs</span>
                        Stairwells
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            className="group cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-600 hover:border-primary dark:hover:border-primary rounded-lg p-3 flex flex-col items-center gap-2 transition-all hover:shadow-md"
                            draggable="true"
                            onDragStart={onDragStart("stair-straight")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className="w-6 h-10 bg-slate-300 dark:bg-slate-600 rounded border border-slate-400 dark:border-slate-500 flex flex-col justify-evenly px-0.5">
                                {[...Array(6)].map((_, i) => <div key={i} className="w-full h-px bg-slate-400 dark:bg-slate-400/50"></div>)}
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Straight</p>
                            </div>
                        </div>
                        <div
                            className="group cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-600 hover:border-primary dark:hover:border-primary rounded-lg p-3 flex flex-col items-center gap-2 transition-all hover:shadow-md"
                            draggable="true"
                            onDragStart={onDragStart("stair-l")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded border border-slate-400 dark:border-slate-500 relative">
                                <div className="absolute top-0 right-0 w-1/2 h-1/2 border-l border-b border-slate-400 dark:border-slate-400/50"></div>
                                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 border-l border-slate-400 dark:border-slate-400/50 flex flex-col justify-evenly">
                                    {[...Array(3)].map((_, i) => <div key={i} className="w-full h-px bg-slate-400 dark:bg-slate-400/50"></div>)}
                                </div>
                                <div className="absolute top-0 left-0 w-1/2 h-1/2 border-b border-slate-400 dark:border-slate-400/50 flex flex-row justify-evenly">
                                    {[...Array(3)].map((_, i) => <div key={i} className="h-full w-px bg-slate-400 dark:bg-slate-400/50"></div>)}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">L-Shape</p>
                            </div>
                        </div>
                        <div
                            className="group cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-600 hover:border-primary dark:hover:border-primary rounded-lg p-3 flex flex-col items-center gap-2 transition-all hover:shadow-md"
                            draggable="true"
                            onDragStart={onDragStart("stair-u")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded border border-slate-400 dark:border-slate-500 relative">
                                <div className="absolute top-0 left-0 right-0 h-[30%] border-b border-slate-400 dark:border-slate-400/50"></div>
                                <div className="absolute top-[30%] bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-slate-400 dark:bg-slate-400/50"></div>
                                <div className="absolute top-[30%] bottom-0 left-0 right-1/2 flex flex-col justify-evenly border-r border-slate-400 dark:border-slate-400/50">
                                    {[...Array(4)].map((_, i) => <div key={i} className="w-full h-px bg-slate-400 dark:bg-slate-400/50"></div>)}
                                </div>
                                <div className="absolute top-[30%] bottom-0 right-0 left-1/2 flex flex-col justify-evenly border-l border-slate-400 dark:border-slate-400/50">
                                    {[...Array(4)].map((_, i) => <div key={i} className="w-full h-px bg-slate-400 dark:bg-slate-400/50"></div>)}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">U-Shape</p>
                            </div>
                        </div>
                        <div
                            className="group cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-600 hover:border-primary dark:hover:border-primary rounded-lg p-3 flex flex-col items-center gap-2 transition-all hover:shadow-md"
                            draggable="true"
                            onDragStart={onDragStart("stair-spiral")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded-full border border-slate-400 dark:border-slate-500 relative flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full border border-slate-400 dark:border-slate-400/50"></div>
                                {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                                    <div key={deg} className="absolute inset-0 border-t border-slate-400/50 dark:border-slate-400/30" style={{ transform: `rotate(${deg}deg)` }}></div>
                                ))}
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Spiral</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                        <span className="material-icons-round text-primary text-sm">pool</span>
                        Amenities
                    </h3>
                    <div className="space-y-2">
                        <div className="cursor-grab active:cursor-grabbing w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" draggable="true">
                            <span className="material-icons-round text-slate-400 text-lg">fitness_center</span>
                            <span className="text-xs text-slate-300">Gym / Fitness</span>
                        </div>
                        <div className="cursor-grab active:cursor-grabbing w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" draggable="true">
                            <span className="material-icons-round text-slate-400 text-lg">local_laundry_service</span>
                            <span className="text-xs text-slate-300">Laundry Room</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

