"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import Link from "next/link";
import styles from "./blueprint.module.css";
// We are using Material Icons via the CDN link in layout.tsx, so we use standard <span> tags for icons.
import { Logo } from "@/components/ui/Logo";
import { useProperty } from "@/context/PropertyContext";

export interface Unit {
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
    name?: string;
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

type QuickActionType = "start-maintenance" | "mark-vacant" | "mark-occupied";

interface QuickActionGuardResult {
    allowed: boolean;
    requiresConfirmation: boolean;
    nextStatus?: Unit["status"];
    reason?: string;
    confirmMessage?: string;
}

interface TenantActionMenuState {
    isOpen: boolean;
}

type UnitNotesState = Record<string, string>;

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
const UNIT_NOTES_STORAGE_KEY = "ireside.visualPlanner.unitNotes";
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

const getFloorDisplayLabel = (floorId: FloorId, customName?: string) => {
    if (customName) return customName;
    if (floorId === "ground") return "Ground";
    const floorNumber = parseFloorNumber(floorId);
    if (floorNumber !== null) return `Floor ${floorNumber}`;
    return floorId.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatFloorWatermark = (floorId: FloorId, customName?: string) => getFloorDisplayLabel(floorId, customName).toUpperCase();

const QUICK_ACTIONS_BY_STATUS: Record<Unit["status"], QuickActionType[]> = {
    occupied: ["start-maintenance", "mark-vacant"],
    neardue: ["start-maintenance", "mark-vacant"],
    vacant: ["mark-occupied", "start-maintenance"],
    maintenance: ["mark-vacant", "mark-occupied"],
};

const QUICK_ACTION_META: Record<QuickActionType, { label: string; icon: string }> = {
    "start-maintenance": { label: "Start maintenance", icon: "build" },
    "mark-vacant": { label: "Mark vacant", icon: "vpn_key" },
    "mark-occupied": { label: "Mark occupied", icon: "check_circle" },
};

const evaluateQuickAction = (
    currentStatus: Unit["status"],
    action: QuickActionType
): QuickActionGuardResult => {
    const validActions = QUICK_ACTIONS_BY_STATUS[currentStatus] ?? [];
    if (!validActions.includes(action)) {
        return {
            allowed: false,
            requiresConfirmation: false,
            reason: `Action is not allowed while unit is ${currentStatus}.`,
        };
    }

    if (action === "start-maintenance") {
        return { allowed: true, requiresConfirmation: false, nextStatus: "maintenance" };
    }

    if (action === "mark-occupied") {
        return { allowed: true, requiresConfirmation: false, nextStatus: "occupied" };
    }

    const isHighRiskVacancyTransition = currentStatus === "occupied" || currentStatus === "neardue";
    return {
        allowed: true,
        requiresConfirmation: isHighRiskVacancyTransition,
        nextStatus: "vacant",
        confirmMessage: isHighRiskVacancyTransition
            ? "This unit is currently active. Marking it vacant can disrupt tracking. Continue?"
            : undefined,
    };
};

export default function VisualBuilder({ readOnly = false }: { readOnly?: boolean } = {}) {
    const { selectedPropertyId } = useProperty();
    
    // Scoped storage keys to ensure each property has its own map
    const getScopedKey = (base: string) => `${base}.${selectedPropertyId}`;
    
    const SCOPED_FLOOR_LAYOUTS_KEY = getScopedKey(FLOOR_LAYOUTS_STORAGE_KEY);
    const SCOPED_ACTIVE_FLOOR_KEY = getScopedKey(ACTIVE_FLOOR_STORAGE_KEY);
    const SCOPED_UNIT_NOTES_KEY = getScopedKey(UNIT_NOTES_STORAGE_KEY);
    const SCOPED_LEGEND_VISIBILITY_KEY = getScopedKey(LEGEND_VISIBILITY_STORAGE_KEY);

    const GRID_SIZE = 20;
    const PAN_MARGIN = 280;
    const BLUEPRINT_MARGIN = 20;
    const SIDEBAR_BLOCK_DRAG_TYPE = "ireside/block";
    const { resolvedTheme } = useTheme();
    const [hasMounted, setHasMounted] = useState(false);
    const isDark = hasMounted && resolvedTheme === "dark";

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
    const [isRenamingFloor, setIsRenamingFloor] = useState(false);
    const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
    const [unitNotes, setUnitNotes] = useState<UnitNotesState>({});

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = window.localStorage.getItem(SCOPED_UNIT_NOTES_KEY);
            if (!raw) {
                setUnitNotes({});
                return;
            }
            const parsed = JSON.parse(raw) as UnitNotesState;
            if (parsed && typeof parsed === "object") {
                setUnitNotes(parsed);
            }
        } catch {
            setUnitNotes({});
        }
    }, [SCOPED_UNIT_NOTES_KEY]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const timeoutId = window.setTimeout(() => {
            window.localStorage.setItem(SCOPED_UNIT_NOTES_KEY, JSON.stringify(unitNotes));
        }, 250);
        return () => window.clearTimeout(timeoutId);
    }, [unitNotes, SCOPED_UNIT_NOTES_KEY]);
    const [editingFloorName, setEditingFloorName] = useState("");
    const scaleRef = useRef(scale);
    const trashRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<FloorLayout[]>([DEFAULT_FLOOR_LAYOUTS[DEFAULT_ACTIVE_FLOOR]]);
    const historyIndexRef = useRef(0);
    const isUndoingRef = useRef(false);

    // Helper to update undo availability state
    const [undoAvailable, setUndoAvailable] = useState(false);

    // Tenant transfer request state
    const [transferModalUnit, setTransferModalUnit] = useState<Unit | null>(null);
    const [transferReason, setTransferReason] = useState("");
    const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
    const [transferError, setTransferError] = useState<string | null>(null);
    const [transferSuccess, setTransferSuccess] = useState(false);

    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transferModalUnit) return;
        setIsSubmittingTransfer(true);
        setTransferError(null);
        try {
            const res = await fetch("/api/tenant/unit-map", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requestedUnitId: transferModalUnit.id,
                    reason: transferReason
                })
            });
            const data = await res.json();
            if (!res.ok) {
                // For prototype local IDs, mock success
                if (transferModalUnit.id.length < 20) {
                    setTransferSuccess(true);
                    setTimeout(() => {
                        setTransferModalUnit(null);
                        setTransferSuccess(false);
                    }, 2000);
                } else {
                    setTransferError(data.error || "Failed to submit request");
                }
            } else {
                setTransferSuccess(true);
                setTimeout(() => {
                    setTransferModalUnit(null);
                    setTransferSuccess(false);
                }, 2000);
            }
        } catch (err) {
            setTransferError("An error occurred. Please try again.");
        } finally {
            setIsSubmittingTransfer(false);
        }
    };

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

    useEffect(() => {
        if (selectedItem?.kind !== "unit") {
            setIsNotesPanelOpen(false);
        }
    }, [selectedItem]);

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
            ...(floorLayouts[activeFloor] || {}),
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
            ...(floorLayouts[activeFloor] || {}),
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
        const storedVisibility = window.localStorage.getItem(SCOPED_LEGEND_VISIBILITY_KEY);
        if (storedVisibility === "hidden") {
            setShowLegend(false);
        } else {
            setShowLegend(true);
        }
    }, [SCOPED_LEGEND_VISIBILITY_KEY, readOnly]);

    useEffect(() => {
        window.localStorage.setItem(SCOPED_LEGEND_VISIBILITY_KEY, showLegend ? "visible" : "hidden");
    }, [showLegend, SCOPED_LEGEND_VISIBILITY_KEY]);

    useEffect(() => {
        try {
            const storedLayoutsRaw = window.localStorage.getItem(SCOPED_FLOOR_LAYOUTS_KEY);
            const storedActiveFloorRaw = window.localStorage.getItem(SCOPED_ACTIVE_FLOOR_KEY);

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
    }, [SCOPED_FLOOR_LAYOUTS_KEY, SCOPED_ACTIVE_FLOOR_KEY]);

    useEffect(() => {
        if (!hasHydratedFloorState || readOnly) return;

        const layoutsToPersist: Record<FloorId, FloorLayout> = {
            ...floorLayouts,
            [activeFloor]: {
                ...(floorLayouts[activeFloor] || {}),
                units,
                corridors,
                structures,
            },
        };

        window.localStorage.setItem(SCOPED_FLOOR_LAYOUTS_KEY, JSON.stringify(layoutsToPersist));
        window.localStorage.setItem(SCOPED_ACTIVE_FLOOR_KEY, activeFloor);
    }, [hasHydratedFloorState, floorLayouts, activeFloor, units, corridors, structures, readOnly, SCOPED_FLOOR_LAYOUTS_KEY, SCOPED_ACTIVE_FLOOR_KEY]);

    useEffect(() => {
        if (readOnly) return;

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
    }, [selectedItem, units, corridors, structures, performUndo, rotateSelectedItem, readOnly]);

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
    const floorLayoutsWithActiveSnapshot: Record<FloorId, FloorLayout> = {
        ...floorLayouts,
        [activeFloor]: {
            ...(floorLayouts[activeFloor] || {}),
            units,
            corridors,
            structures,
        },
    };
    const floorWatermarkLabel = formatFloorWatermark(activeFloor, floorLayoutsWithActiveSnapshot[activeFloor]?.name);
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
            title: getFloorDisplayLabel(floorId, floorLayoutsWithActiveSnapshot[floorId]?.name),
            floorNumber: parseFloorNumber(floorId),
        }));
    const activeFloorLayout = floorLayoutsWithActiveSnapshot[activeFloor];
    const activeFloorItemCount = activeFloorLayout
        ? activeFloorLayout.units.length + activeFloorLayout.corridors.length + activeFloorLayout.structures.length
        : 0;
    const selectedUnit = selectedItem?.kind === "unit"
        ? units.find((unit) => unit.id === selectedItem.id) ?? null
        : null;
    const selectedUnitNote = selectedUnit ? (unitNotes[selectedUnit.id] ?? "") : "";

    return (
        <div className={`${isDark ? 'bg-background-dark text-slate-100' : 'bg-background text-slate-800'} font-display h-screen flex flex-col overflow-hidden antialiased selection:bg-primary/30${readOnly ? ' pointer-events-auto' : ''}`}>
            {/* Header */}
            <header className={`h-16 flex items-center justify-between px-6 shrink-0 z-20 backdrop-blur ${isDark ? 'bg-surface-dark border-b border-slate-800 shadow-none' : 'bg-card/95 border-b border-border shadow-sm'}`}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Logo className="h-6 w-auto" />
                    </div>
                    <div className={`mx-2 h-6 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                    <div>
                        <h1 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Sunset Heights Complex</h1>
                        <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            <span>All systems operational</span>
                        </div>
                    </div>
                    {readOnly && (
                        <div className="flex items-center gap-1.5 ml-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                            <span className="material-icons-round text-emerald-400 text-[14px]">visibility</span>
                                <span className={`text-xs font-semibold tracking-wide ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>View Only</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3 min-w-0">
                        <div className={`${isDark ? 'bg-background-dark/90 border-slate-700 shadow-none' : 'bg-background/90 border-border shadow-sm'} p-1 rounded-xl border flex items-center backdrop-blur-sm`}>
                            <div className={`flex items-center pl-2 pr-1 border-r hidden sm:flex ${isDark ? 'border-slate-700' : 'border-border'}`} title="Current Level">
                                <span className={`material-icons-round text-[18px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>layers</span>
                        </div>
                        
                        {!readOnly && isRenamingFloor ? (
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    setFloorLayouts(prev => ({
                                        ...prev,
                                        [activeFloor]: {
                                            ...prev[activeFloor],
                                            name: editingFloorName.trim() || undefined
                                        }
                                    }));
                                    setIsRenamingFloor(false);
                                }}
                                className="flex items-center mx-1"
                            >
                                <input
                                    autoFocus
                                    type="text"
                                    value={editingFloorName}
                                    onChange={(e) => setEditingFloorName(e.target.value)}
                                    onBlur={() => {
                                        setFloorLayouts(prev => ({
                                            ...prev,
                                            [activeFloor]: {
                                                ...prev[activeFloor],
                                                name: editingFloorName.trim() || undefined
                                            }
                                        }));
                                        setIsRenamingFloor(false);
                                    }}
                                    className={`border border-primary text-sm font-bold px-2 py-1 rounded w-[120px] md:w-[150px] focus:outline-none ${isDark ? 'bg-background-dark text-slate-100' : 'bg-card text-slate-800'}`}
                                    placeholder="Floor Name"
                                />
                            </form>
                        ) : (
                            <div className={`relative flex items-center mx-1 group cursor-pointer transition-colors rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-white'}`}>
                                <select
                                    id="floor-selector"
                                    value={activeFloor}
                                    onChange={(event) => switchFloor(event.target.value)}
                                    className={`appearance-none bg-transparent pl-3 pr-8 py-1.5 text-sm font-bold w-[140px] md:w-[180px] cursor-pointer focus:outline-none z-10 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}
                                >
                                    {floorTabs.map((floorTab) => (
                                        <option key={floorTab.id} value={floorTab.id}>
                                            {floorTab.title}
                                        </option>
                                    ))}
                                </select>
                                <div className={`absolute right-2 pointer-events-none transition-colors flex items-center group-hover:text-primary ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    <span className="material-icons-round text-[18px]">unfold_more</span>
                                </div>
                            </div>
                        )}
                        
                        <div className={`flex items-center gap-1 pl-1 pr-1 border-l ${isDark ? 'border-slate-700' : 'border-border'}`}>
                            {!readOnly && !isRenamingFloor && (
                                <button 
                                    onClick={() => {
                                        setEditingFloorName(floorLayoutsWithActiveSnapshot[activeFloor].name || getFloorDisplayLabel(activeFloor));
                                        setIsRenamingFloor(true);
                                    }}
                                    className={`flex items-center justify-center w-7 h-7 border rounded-md transition-all hover:text-primary ${isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-400' : 'bg-white hover:bg-slate-200 border-border text-slate-500 shadow-sm'}`}
                                    title="Rename Floor"
                                >
                                    <span className="material-icons-round text-[16px]">edit</span>
                                </button>
                            )}
                            <div className={`flex items-center border rounded-md px-2 py-1 h-7 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-border shadow-sm'}`} title={`${activeFloorItemCount} items on this floor`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/80 mr-2"></span>
                                <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                    {activeFloorItemCount}
                                </span>
                            </div>
                            {!readOnly && (
                                <button 
                                    onClick={createFloor} 
                                    className={`flex items-center justify-center w-7 h-7 border rounded-md transition-all hover:bg-primary hover:border-primary hover:text-white ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-border text-slate-600 shadow-sm'}`}
                                    title="Add New Floor"
                                >
                                    <span className="material-icons-round text-[18px]">add</span>
                                </button>
                            )}
                        </div>
                    </div>
                    {!readOnly && (
                        <>
                            <div className={`h-6 w-px mx-1 ${isDark ? 'bg-slate-700' : 'bg-border'}`}></div>
                            <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-border'}`}>
                                <span className="material-icons-round text-sm">save_alt</span>
                                Draft
                            </button>
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-medium shadow-lg shadow-primary/20 transition-colors">
                                <span className="material-icons-round text-sm">publish</span>
                                Publish Changes
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <main className={`flex-1 relative overflow-hidden flex flex-col ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
                    <div className={`flex-1 overflow-hidden relative ${isPanning ? 'cursor-grabbing' : 'cursor-grab'} ${isDark ? 'bg-[#0b0d11]' : 'bg-[radial-gradient(circle_at_top_left,rgba(173,200,125,0.08),transparent_28%),linear-gradient(180deg,#f8faf6,#f1f5ef)]'} ${styles.bgGridPattern}`} ref={containerRef}>
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
                                onDragOver={readOnly ? undefined : handleBlueprintDragOver}
                                onDragLeave={readOnly ? undefined : handleBlueprintDragLeave}
                                onDrop={readOnly ? undefined : handleBlueprintDrop}
                                className={`absolute top-[20px] left-[20px] rounded-xl ${styles.bgDotPattern} relative ${isDark ? 'bg-[#171a1f] border border-slate-700/70 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.75)]' : 'bg-white/75 border border-slate-300/70 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.18)]'}`}
                                style={{
                                    width: BLUEPRINT_WIDTH,
                                    height: BLUEPRINT_HEIGHT,
                                }}
                            >
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none">
                                    <span className={`text-[72px] md:text-[110px] font-black tracking-[0.18em] ${isDark ? 'text-white/5' : 'text-slate-400/20'}`}>
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
                                            <div className={`w-full h-full bg-white/85 relative shadow-sm overflow-hidden select-none rounded-[1px] border ${sidebarBlockGhost.isValid ? 'border-emerald-400/70' : 'border-red-400/80'}`}>
                                                <div className="absolute inset-0 border-[2px] border-slate-400"></div>
                                                <div className="absolute inset-[4px] border border-slate-300"></div>
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[6px] bg-slate-100 z-10 border-x-2 border-slate-400"></div>
                                                <div className="absolute top-0 left-1/4 right-1/4 h-[6px] bg-slate-100 z-10 flex items-center justify-center border-x border-slate-400">
                                                    <div className="w-full h-px bg-slate-300"></div>
                                                </div>
                                                <div className={`absolute inset-0 opacity-20 ${sidebarBlockGhost.isValid ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 z-20">
                                                    <div className={`w-2 h-2 rounded-full mb-2 ${sidebarBlockGhost.isValid ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]'}`}></div>
                                                    <h4 className="font-bold text-xs text-slate-700 drop-shadow-md">{sidebarBlockGhost.label}</h4>
                                                    <span className={`text-[9px] font-bold uppercase mt-1 tracking-wider px-1 rounded ${sidebarBlockGhost.isValid ? 'text-emerald-700 border border-emerald-400/40 bg-emerald-500/10' : 'text-red-700 border border-red-400/40 bg-red-500/10'}`}>{sidebarBlockGhost.isValid ? 'Preview' : 'Blocked'}</span>
                                                </div>
                                            </div>
                                        ) : sidebarBlockGhost.blockType === "corridor" ? (
                                            <div className={`w-full h-full border-y flex items-center justify-center rounded-[1px] ${sidebarBlockGhost.isValid ? 'bg-emerald-500/15 border-emerald-400/80' : 'bg-red-500/15 border-red-400/80'}`}>
                                                <div className="absolute inset-0 opacity-15 pointer-events-none bg-slate-200/50"></div>
                                                <div className="relative z-10 flex flex-col items-center justify-center">
                                                    <span className={`text-xs font-bold uppercase tracking-[0.5em] ${sidebarBlockGhost.isValid ? 'text-emerald-700' : 'text-red-700'}`}>{sidebarBlockGhost.label}</span>
                                                    <span className={`mt-1 text-[9px] font-bold uppercase tracking-wider px-1 rounded ${sidebarBlockGhost.isValid ? 'text-emerald-700 border border-emerald-400/40 bg-emerald-500/10' : 'text-red-700 border border-red-400/40 bg-red-500/10'}`}>{sidebarBlockGhost.isValid ? 'Preview' : 'Blocked'}</span>
                                                </div>
                                            </div>
                                        ) : sidebarBlockGhost.blockType === "elevator" ? (
                                            <div className={`w-full h-full border rounded-sm flex items-center justify-center ${sidebarBlockGhost.isValid ? 'bg-emerald-500/15 border-emerald-400/80' : 'bg-red-500/20 border-red-400/80'}`}>
                                                <div className="border-2 border-slate-400 w-full h-full m-2 flex items-center justify-center relative">
                                                    <span className={`material-icons-round ${sidebarBlockGhost.isValid ? 'text-emerald-700' : 'text-red-700'}`}>elevator</span>
                                                </div>
                                                <span className={`absolute bottom-1 text-[9px] font-bold uppercase tracking-wider px-1 rounded ${sidebarBlockGhost.isValid ? 'text-emerald-700 border border-emerald-400/40 bg-emerald-500/10' : 'text-red-700 border border-red-400/40 bg-red-500/10'}`}>{sidebarBlockGhost.isValid ? 'Preview' : 'Blocked'}</span>
                                            </div>
                                        ) : (
                                            <div className={`w-full h-full border rounded-sm relative overflow-hidden ${sidebarBlockGhost.isValid ? 'bg-emerald-500/15 border-emerald-400/80' : 'bg-red-500/20 border-red-400/80'}`}>
                                                {sidebarBlockGhost.stairVariant === "straight" ? (
                                                    <>
                                                        <div className="absolute inset-0 border-[2px] border-slate-400"></div>
                                                        <div className="absolute inset-[4px] border border-slate-300"></div>
                                                        <div className="absolute left-[15%] right-[15%] top-[10%] bottom-[10%] flex flex-col justify-between">
                                                            {[...Array(12)].map((_, i) => (
                                                                <div key={`ghost-straight-${i}`} className="w-full h-px bg-slate-400/80"></div>
                                                            ))}
                                                        </div>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="h-[60%] w-px bg-slate-400 relative">
                                                                <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-r border-slate-300 rotate-[-45deg]"></div>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : sidebarBlockGhost.stairVariant === "l-shape" ? (
                                                    <>
                                                        <div className="absolute inset-0 border-[2px] border-slate-400"></div>
                                                        <div className="absolute top-0 right-0 w-1/2 h-1/2 border-b border-l border-slate-400"></div>
                                                        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 border-l border-slate-400 flex flex-col justify-between py-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <div key={`ghost-l-v-${i}`} className="w-full h-px bg-slate-400/80"></div>
                                                            ))}
                                                        </div>
                                                        <div className="absolute top-0 left-0 w-1/2 h-1/2 border-b border-slate-400 flex flex-row justify-between px-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <div key={`ghost-l-h-${i}`} className="h-full w-px bg-slate-400/80"></div>
                                                            ))}
                                                        </div>
                                                        <div className="absolute top-[25%] left-[10%] right-[10%] bottom-[10%] pointer-events-none">
                                                            <svg className="w-full h-full text-slate-400" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M 85 90 L 85 25 L 10 25" />
                                                                <path d="M 15 20 L 10 25 L 15 30" />
                                                            </svg>
                                                        </div>
                                                    </>
                                                ) : sidebarBlockGhost.stairVariant === "u-shape" ? (
                                                    <>
                                                        <div className="absolute inset-0 border-[2px] border-slate-400"></div>
                                                        <div className="absolute top-0 left-0 right-0 h-[30%] border-b border-slate-400 bg-slate-200/60"></div>
                                                        <div className="absolute top-[30%] bottom-0 left-1/2 -translate-x-1/2 w-1 bg-slate-500"></div>
                                                        <div className="absolute top-[30%] bottom-0 left-0 right-1/2 flex flex-col justify-between py-1 border-r border-slate-400">
                                                            {[...Array(7)].map((_, i) => (
                                                                <div key={`ghost-u-l-${i}`} className="w-full h-px bg-slate-400/80"></div>
                                                            ))}
                                                        </div>
                                                        <div className="absolute top-[30%] bottom-0 left-1/2 right-0 flex flex-col justify-between py-1 border-l border-slate-400">
                                                            {[...Array(7)].map((_, i) => (
                                                                <div key={`ghost-u-r-${i}`} className="w-full h-px bg-slate-400/80"></div>
                                                            ))}
                                                        </div>
                                                        <div className="absolute inset-0 pointer-events-none p-2">
                                                            <svg className="w-full h-full text-slate-400" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M 75 90 L 75 15 L 25 15 L 25 90" />
                                                                <path d="M 20 85 L 25 90 L 30 85" />
                                                            </svg>
                                                        </div>
                                                    </>
                                                ) : sidebarBlockGhost.stairVariant === "spiral" ? (
                                                    <>
                                                        <div className="absolute inset-0 rounded-full border-[2px] border-slate-400"></div>
                                                        <div className="absolute inset-[35%] border border-slate-400 rounded-full bg-slate-100 z-10"></div>
                                                        {[...Array(12)].map((_, i) => (
                                                            <div
                                                                key={`ghost-spiral-${i}`}
                                                                className="absolute inset-0 border-t border-slate-400 origin-center"
                                                                style={{ transform: `rotate(${i * 30}deg)` }}
                                                            ></div>
                                                        ))}
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="absolute inset-0 border-[2px] border-slate-400"></div>
                                                        <div className="absolute inset-[4px] border border-slate-300"></div>
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
                                            <div className={`w-full h-full bg-white/85 relative shadow-sm overflow-hidden select-none rounded-[1px] border ${dragGhost.isValid ? 'border-emerald-400/70' : 'border-red-400/80'}`}>
                                                <div className="absolute inset-0 border-[2px] border-slate-400"></div>
                                                <div className="absolute inset-[4px] border border-slate-300"></div>
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[6px] bg-slate-100 z-10 border-x-2 border-slate-400"></div>
                                                <div className="absolute top-0 left-1/4 right-1/4 h-[6px] bg-slate-100 z-10 flex items-center justify-center border-x border-slate-400">
                                                    <div className="w-full h-px bg-slate-300"></div>
                                                </div>
                                                <div className={`absolute inset-0 opacity-20 ${dragGhost.isValid ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                            </div>
                                        ) : dragGhost.kind === "corridor" ? (
                                            <div className={`w-full h-full border-y flex items-center justify-center rounded-[1px] ${dragGhost.isValid ? 'bg-emerald-500/15 border-emerald-400/80' : 'bg-red-500/15 border-red-400/80'}`}>
                                                <span className={`text-xs font-bold uppercase tracking-[0.5em] ${dragGhost.isValid ? 'text-emerald-300' : 'text-red-300'}`}>{dragGhost.label ?? 'Corridor'}</span>
                                            </div>
                                        ) : dragGhost.structureType === "elevator" ? (
                                            <div className={`w-full h-full border rounded-sm flex items-center justify-center ${dragGhost.isValid ? 'bg-emerald-500/15 border-emerald-400/80' : 'bg-red-500/20 border-red-400/80'}`}>
                                                <div className="border-2 border-slate-400 w-full h-full m-2 flex items-center justify-center relative">
                                                    <span className={`material-icons-round ${dragGhost.isValid ? 'text-emerald-700' : 'text-red-700'}`}>elevator</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`w-full h-full border rounded-sm relative overflow-hidden ${dragGhost.isValid ? 'bg-emerald-500/15 border-emerald-400/80' : 'bg-red-500/20 border-red-400/80'}`}>
                                                <div style={getRotatedArtworkStyle(dragGhost.w, dragGhost.h, dragGhost.stairRotation ?? 0)}>
                                                    {dragGhost.stairVariant === "straight" ? (
                                                        <>
                                                            <div className="absolute inset-0 border-[2px] border-slate-400"></div>
                                                            <div className="absolute inset-[4px] border border-slate-300"></div>
                                                            <div className="absolute left-[15%] right-[15%] top-[10%] bottom-[10%] flex flex-col justify-between">
                                                                {[...Array(12)].map((_, i) => (
                                                                    <div key={`drag-straight-${i}`} className="w-full h-px bg-slate-400/80"></div>
                                                                ))}
                                                            </div>
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="h-[60%] w-px bg-slate-400 relative">
                                                                    <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-r border-slate-300 rotate-[-45deg]"></div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : dragGhost.stairVariant === "l-shape" ? (
                                                        <>
                                                            <div className="absolute inset-0 border-[2px] border-slate-400"></div>
                                                            <div className="absolute top-0 right-0 w-1/2 h-1/2 border-b border-l border-slate-400"></div>
                                                            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 border-l border-slate-400 flex flex-col justify-between py-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <div key={`drag-l-v-${i}`} className="w-full h-px bg-slate-400/80"></div>
                                                                ))}
                                                            </div>
                                                            <div className="absolute top-0 left-0 w-1/2 h-1/2 border-b border-slate-400 flex flex-row justify-between px-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <div key={`drag-l-h-${i}`} className="h-full w-px bg-slate-400/80"></div>
                                                                ))}
                                                            </div>
                                                            <div className="absolute top-[25%] left-[10%] right-[10%] bottom-[10%] pointer-events-none">
                                                                <svg className="w-full h-full text-slate-400" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M 85 90 L 85 25 L 10 25" />
                                                                    <path d="M 15 20 L 10 25 L 15 30" />
                                                                </svg>
                                                            </div>
                                                        </>
                                                    ) : dragGhost.stairVariant === "u-shape" ? (
                                                        <>
                                                            <div className="absolute inset-0 border-[2px] border-slate-400"></div>
                                                            <div className="absolute top-0 left-0 right-0 h-[30%] border-b border-slate-400 bg-slate-200/60"></div>
                                                            <div className="absolute top-[30%] bottom-0 left-1/2 -translate-x-1/2 w-1 bg-slate-500"></div>
                                                            <div className="absolute top-[30%] bottom-0 left-0 right-1/2 flex flex-col justify-between py-1 border-r border-slate-400">
                                                                {[...Array(7)].map((_, i) => (
                                                                    <div key={`drag-u-l-${i}`} className="w-full h-px bg-slate-400/80"></div>
                                                                ))}
                                                            </div>
                                                            <div className="absolute top-[30%] bottom-0 left-1/2 right-0 flex flex-col justify-between py-1 border-l border-slate-400">
                                                                {[...Array(7)].map((_, i) => (
                                                                    <div key={`drag-u-r-${i}`} className="w-full h-px bg-slate-400/80"></div>
                                                                ))}
                                                            </div>
                                                            <div className="absolute inset-0 pointer-events-none p-2">
                                                                <svg className="w-full h-full text-slate-400" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M 75 90 L 75 15 L 25 15 L 25 90" />
                                                                    <path d="M 20 85 L 25 90 L 30 85" />
                                                                </svg>
                                                            </div>
                                                        </>
                                                    ) : dragGhost.stairVariant === "spiral" ? (
                                                        <>
                                                            <div className="absolute inset-0 rounded-full border-[2px] border-slate-400"></div>
                                                            <div className="absolute inset-[35%] border border-slate-400 rounded-full bg-slate-100 z-10"></div>
                                                            {[...Array(12)].map((_, i) => (
                                                                <div
                                                                    key={`drag-spiral-${i}`}
                                                                    className="absolute inset-0 border-t border-slate-400 origin-center"
                                                                    style={{ transform: `rotate(${i * 30}deg)` }}
                                                                ></div>
                                                            ))}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="absolute inset-0 border-[2px] border-slate-400"></div>
                                                            <div className="absolute inset-[4px] border border-slate-300"></div>
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
                                        className={`absolute group cursor-pointer ${selectedItem?.kind === "corridor" && selectedItem.id === corridor.id ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}
                                        style={{
                                            left: corridor.x,
                                            top: corridor.y,
                                            width: corridor.w,
                                            height: corridor.h,
                                            zIndex: draggingCorridorId === corridor.id ? 28 : 8,
                                        }}
                                        drag={!readOnly && resizingCorridorId === null}
                                        dragConstraints={blueprintRef}
                                        dragElastic={0}
                                        dragMomentum={false}
                                        dragSnapToOrigin
                                        transition={{ duration: 0 }}
                                        onPointerDown={readOnly ? undefined : () => setSelectedItem({ kind: "corridor", id: corridor.id })}
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
                                        <div className={`w-full h-full relative shadow-sm overflow-hidden select-none rounded-[1px] ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                                            <div className={`absolute inset-0 border-[2px] ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                            <div className={`absolute inset-[4px] border ${isDark ? 'border-neutral-600' : 'border-slate-300'}`}></div>
                                            <div className={`absolute inset-[10px] border border-dashed ${isDark ? 'border-neutral-500/80' : 'border-slate-700/80'}`}></div>
                                            <div className={`absolute left-[10px] right-[10px] top-1/2 -translate-y-1/2 h-px ${isDark ? 'bg-neutral-500/80' : 'bg-slate-500/80'}`}></div>
                                            <div className="absolute inset-[8px] opacity-10"
                                                style={{ backgroundImage: isDark ? 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)' : 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}
                                            ></div>
                                            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-blue-500"></div>
                                            <div className="absolute inset-0 flex items-center justify-center z-20">
                                                <span className={`text-xs font-bold uppercase tracking-[0.4em] ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>{corridor.label}</span>
                                            </div>

                                            {!readOnly && selectedItem?.kind === "corridor" && selectedItem.id === corridor.id && (
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
                                        className={`absolute group cursor-pointer ${selectedItem?.kind === "structure" && selectedItem.id === structure.id ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}
                                        style={{
                                            left: structure.x,
                                            top: structure.y,
                                            width: structure.w,
                                            height: structure.h,
                                            zIndex: draggingStructureId === structure.id ? 29 : 9,
                                        }}
                                        drag={!readOnly}
                                        dragConstraints={blueprintRef}
                                        dragElastic={0}
                                        dragMomentum={false}
                                        dragSnapToOrigin
                                        transition={{ duration: 0 }}
                                        onPointerDown={readOnly ? undefined : () => setSelectedItem({ kind: "structure", id: structure.id })}
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
                                            <div className={`w-full h-full relative shadow-sm overflow-hidden select-none rounded-[1px] ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                                                <div className={`absolute inset-0 border-[2px] ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                                <div className={`absolute inset-[4px] border ${isDark ? 'border-neutral-600' : 'border-slate-300'}`}></div>
                                                <div className={`absolute inset-[10px] border rounded-[1px] ${isDark ? 'border-neutral-500' : 'border-slate-700'}`}></div>
                                                <div className={`absolute inset-x-[18%] top-[14%] bottom-[18%] flex border ${isDark ? 'border-neutral-600 bg-neutral-700/80' : 'border-slate-300 bg-slate-100'}`}>
                                                    <div className={`w-1/2 ${isDark ? 'border-r border-neutral-600' : 'border-r border-slate-300'}`}></div>
                                                    <div className="w-1/2"></div>
                                                </div>
                                                <div className={`absolute top-[8%] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${isDark ? 'bg-neutral-400' : 'bg-slate-500'}`}></div>
                                                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-blue-500"></div>
                                                <div className={`absolute bottom-[6px] left-1/2 -translate-x-1/2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                                                    <span className="material-icons-round text-[12px]">elevator</span>
                                                    <span>Elevator</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full relative overflow-hidden">
                                                <div style={getRotatedArtworkStyle(structure.w, structure.h, structure.rotation ?? 0)}>
                                                    {structure.variant === "straight" ? (
                                                        /* Straight Flight */
                                                        <div className={`w-full h-full relative shadow-sm overflow-hidden select-none rounded-[1px] ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                                                            <div className={`absolute inset-0 border-[2px] ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                                            <div className={`absolute inset-[4px] border ${isDark ? 'border-neutral-600' : 'border-slate-300'}`}></div>
                                                            {/* Steps */}
                                                            <div className="absolute left-[15%] right-[15%] top-[10%] bottom-[10%] flex flex-col justify-between">
                                                                {[...Array(12)].map((_, i) => (
                                                                    <div key={i} className={`w-full h-px ${isDark ? 'bg-neutral-500/80' : 'bg-slate-400/80'}`}></div>
                                                                ))}
                                                            </div>
                                                            {/* Arrow */}
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className={`h-[60%] w-px relative ${isDark ? 'bg-neutral-400' : 'bg-slate-400'}`}>
                                                                    <div className={`absolute -top-1 -left-1 w-2 h-2 border-t border-r rotate-[-45deg] ${isDark ? 'border-neutral-500' : 'border-slate-300'}`}></div>
                                                                </div>
                                                            </div>
                                                            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-blue-500"></div>
                                                        </div>
                                                    ) : structure.variant === "l-shape" ? (
                                                        /* L-Shape */
                                                        <div className={`w-full h-full relative shadow-sm overflow-hidden select-none rounded-[1px] ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                                                            <div className={`absolute inset-0 border-[2px] ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                                            {/* Landing - Top Right */}
                                                            <div className={`absolute top-0 right-0 w-1/2 h-1/2 border-b border-l ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                                            {/* Flight 1 - Bottom Right (Vertical) */}
                                                            <div className={`absolute bottom-0 right-0 w-1/2 h-1/2 border-l flex flex-col justify-between py-1 ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <div key={i} className={`w-full h-px ${isDark ? 'bg-neutral-500/80' : 'bg-slate-400/80'}`}></div>
                                                                ))}
                                                            </div>
                                                            {/* Flight 2 - Top Left (Horizontal) */}
                                                            <div className={`absolute top-0 left-0 w-1/2 h-1/2 border-b flex flex-row justify-between px-1 ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <div key={i} className={`h-full w-px ${isDark ? 'bg-neutral-500/80' : 'bg-slate-400/80'}`}></div>
                                                                ))}
                                                            </div>
                                                            {/* Direction Line */}
                                                            <div className="absolute top-[25%] left-[10%] right-[10%] bottom-[10%] pointer-events-none">
                                                                <svg className={`w-full h-full ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M 85 90 L 85 25 L 10 25" />
                                                                    <path d="M 15 20 L 10 25 L 15 30" />
                                                                </svg>
                                                            </div>
                                                            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-blue-500"></div>
                                                        </div>
                                                    ) : structure.variant === "u-shape" ? (
                                                        /* U-Shape */
                                                        <div className={`w-full h-full relative shadow-sm overflow-hidden select-none rounded-[1px] ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                                                            <div className={`absolute inset-0 border-[2px] ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                                            {/* Landing - Top */}
                                                            <div className={`absolute top-0 left-0 right-0 h-[30%] border-b ${isDark ? 'border-neutral-500 bg-neutral-700/50' : 'border-slate-400 bg-slate-200/60'}`}></div>
                                                            {/* Divider Wall */}
                                                            <div className={`absolute top-[30%] bottom-0 left-1/2 -translate-x-1/2 w-1 ${isDark ? 'bg-neutral-400' : 'bg-slate-500'}`}></div>
                                                            {/* Left Flight */}
                                                            <div className={`absolute top-[30%] bottom-0 left-0 right-1/2 flex flex-col justify-between py-1 border-r ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}>
                                                                {[...Array(7)].map((_, i) => (
                                                                    <div key={i} className={`w-full h-px ${isDark ? 'bg-neutral-500/80' : 'bg-slate-400/80'}`}></div>
                                                                ))}
                                                            </div>
                                                            {/* Right Flight */}
                                                            <div className={`absolute top-[30%] bottom-0 left-1/2 right-0 flex flex-col justify-between py-1 border-l ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}>
                                                                {[...Array(7)].map((_, i) => (
                                                                    <div key={i} className={`w-full h-px ${isDark ? 'bg-neutral-500/80' : 'bg-slate-400/80'}`}></div>
                                                                ))}
                                                            </div>
                                                            {/* Direction Line */}
                                                            <div className="absolute inset-0 pointer-events-none p-2">
                                                                <svg className={`w-full h-full ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M 75 90 L 75 15 L 25 15 L 25 90" />
                                                                    <path d="M 20 85 L 25 90 L 30 85" />
                                                                </svg>
                                                            </div>
                                                            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-blue-500"></div>
                                                        </div>
                                                    ) : structure.variant === "spiral" ? (
                                                        /* Spiral */
                                                        <div className={`w-full h-full relative shadow-sm overflow-hidden select-none rounded-full border-[2px] ${isDark ? 'bg-neutral-800 border-neutral-500' : 'bg-white border-slate-400'}`}>
                                                            <div className={`absolute inset-[35%] border rounded-full z-10 ${isDark ? 'border-neutral-500 bg-neutral-700/80' : 'border-slate-400 bg-slate-100'}`}></div>
                                                            {/* Radial Steps */}
                                                            {[...Array(12)].map((_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={`absolute inset-0 border-t origin-center ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}
                                                                    style={{ transform: `rotate(${i * 30}deg)` }}
                                                                ></div>
                                                            ))}
                                                            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-blue-500 rounded-full"></div>
                                                        </div>
                                                    ) : (
                                                        /* Default / Fallback */
                                                        <div className={`w-full h-full relative shadow-sm overflow-hidden select-none rounded-[1px] ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                                                            <div className={`absolute inset-0 border-[2px] ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                                            <div className="absolute inset-[4px] border border-slate-300"></div>
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
                                        className={`absolute group cursor-pointer ${selectedItem?.kind === "unit" && selectedItem.id === unit.id ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}
                                        style={{
                                            left: unit.x,
                                            top: unit.y,
                                            width: unit.w,
                                            height: unit.h,
                                            zIndex: draggingUnitId === unit.id ? 30 : 10,
                                        }}
                                        drag={!readOnly}
                                        dragConstraints={blueprintRef}
                                        dragElastic={0}
                                        dragMomentum={false}
                                        dragSnapToOrigin
                                        transition={{ duration: 0 }}
                                        onPointerDown={readOnly ? () => {
                                            if (unit.status === 'vacant') {
                                                setTransferModalUnit(unit);
                                                setTransferReason("");
                                                setTransferError(null);
                                                setTransferSuccess(false);
                                            }
                                        } : () => setSelectedItem({ kind: "unit", id: unit.id })}
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
                                        <div className={`relative h-full w-full overflow-hidden rounded-[1px] select-none ${isDark ? 'bg-neutral-800 shadow-sm' : 'bg-white shadow-sm'}`}>
                                            <div className={`absolute inset-0 border-[2px] ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                            <div className={`absolute inset-[4px] border ${isDark ? 'border-neutral-600' : 'border-slate-300'}`}></div>

                                            <div className={`absolute bottom-0 left-1/2 z-10 h-[6px] w-1/3 -translate-x-1/2 border-x-2 ${isDark ? 'border-neutral-500 bg-neutral-800' : 'border-slate-400 bg-slate-100'}`}></div>

                                            <div className={`absolute left-1/4 right-1/4 top-0 z-10 flex h-[6px] items-center justify-center border-x ${isDark ? 'border-neutral-500 bg-neutral-800' : 'border-slate-400 bg-slate-100'}`}>
                                                <div className={`h-px w-full ${isDark ? 'bg-neutral-600' : 'bg-slate-300'}`}></div>
                                            </div>

                                            <div className={`absolute bottom-1/4 left-0 top-1/4 z-10 flex w-[6px] flex-col justify-center border-y ${isDark ? 'border-neutral-500 bg-neutral-800' : 'border-slate-400 bg-slate-100'}`}>
                                                <div className={`mx-auto h-full w-px ${isDark ? 'bg-neutral-500' : 'bg-slate-400'}`}></div>
                                            </div>
                                            <div className={`absolute bottom-1/4 right-0 top-1/4 z-10 flex w-[6px] flex-col justify-center border-y ${isDark ? 'border-neutral-500 bg-neutral-800' : 'border-slate-400 bg-slate-100'}`}>
                                                <div className={`mx-auto h-full w-px ${isDark ? 'bg-neutral-500' : 'bg-slate-400'}`}></div>
                                            </div>

                                            <div className={`absolute right-[8px] top-[8px] h-5 w-5 border ${isDark ? 'border-neutral-600 bg-neutral-700/70' : 'border-slate-300 bg-slate-50/70'}`}></div>
                                            <div className={`absolute bottom-[8px] left-[8px] flex h-4 w-4 flex-col gap-0.5 border p-0.5 ${isDark ? 'border-neutral-600 bg-neutral-700/70' : 'border-slate-300 bg-slate-50/70'}`}>
                                                <div className={`h-full w-full border ${isDark ? 'border-neutral-700' : 'border-slate-400/70'}`}></div>
                                            </div>
                                            <div className={`absolute bottom-[8px] right-[8px] flex h-4 w-4 flex-col gap-0.5 border p-0.5 ${isDark ? 'border-neutral-600 bg-neutral-700/70' : 'border-slate-300 bg-slate-50/70'}`}>
                                                <div className={`h-full w-full border ${isDark ? 'border-neutral-700' : 'border-slate-400/70'}`}></div>
                                            </div>

                                            <div
                                                className="absolute inset-[8px] opacity-[0.16]"
                                                style={{ backgroundImage: isDark ? 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)' : 'linear-gradient(rgba(148,163,184,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.45) 1px, transparent 1px)', backgroundSize: '10px 10px' }}
                                            ></div>

                                            <div className={`absolute inset-0 opacity-[0.18] group-hover:opacity-[0.3] transition-opacity ${unit.status === 'occupied' ? 'bg-status-occupied' :
                                                unit.status === 'vacant' ? 'bg-status-vacant' :
                                                    unit.status === 'maintenance' ? 'bg-status-maintenance' : 'bg-status-due'
                                                }`}></div>

                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 z-20">
                                                <div className={`w-2.5 h-2.5 rounded-full mb-2 shadow-[0_0_10px_rgba(255,255,255,0.9)] ${unit.status === 'occupied' ? 'bg-status-occupied' :
                                                    unit.status === 'vacant' ? 'bg-status-vacant' :
                                                        unit.status === 'maintenance' ? 'bg-status-maintenance' : 'bg-status-due'
                                                    }`}></div>

                                                <h4 className={`text-xs font-bold drop-shadow-sm ${isDark ? 'text-neutral-200' : 'text-slate-700'}`}>{unit.name}</h4>

                                                {unit.status !== 'vacant' && unit.tenant && (
                                                    <p className={`mt-1 font-mono text-[10px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>{unit.tenant}</p>
                                                )}
                                                {unit.status === 'vacant' && (
                                                    <span className={`mt-1 rounded border px-1.5 text-[9px] font-bold uppercase tracking-wider ${isDark ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' : 'border-blue-400/60 bg-blue-100/90 text-blue-800'}`}>Vacant</span>
                                                )}
                                                {unit.status === 'maintenance' && (
                                                    <span className={`mt-1 rounded border px-1.5 text-[9px] font-bold uppercase tracking-wider ${isDark ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-red-400/60 bg-red-100/90 text-red-800'}`}>Maint</span>
                                                )}
                                            </div>

                                            <div className={`absolute bottom-0 right-0 h-3 w-3 cursor-nwse-resize rounded-br-sm border-b-2 border-r-2 opacity-0 group-hover:opacity-100 ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                        </div>
                                    </motion.div>
                                ))}

                            </div>
                        </motion.div>

                    </div>

                    {/* Legend */}
                    <div className="absolute bottom-6 right-6 flex flex-col gap-4 z-20 pointer-events-none">
                        {showLegend ? (
                            <div className={`pointer-events-auto rounded-lg p-3 shadow-xl backdrop-blur-sm ${isDark ? 'border border-slate-800 bg-surface-dark' : 'border border-border bg-card/95'}`}>
                                <div className="flex items-center justify-between mb-2 gap-2">
                                    <h4 className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Legend</h4>
                                    <button
                                        type="button"
                                        onClick={() => setShowLegend(false)}
                                        className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${isDark ? 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200' : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700'}`}
                                    >
                                        Hide
                                    </button>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-sm bg-status-vacant"></div>
                                        <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Vacant</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-sm bg-status-occupied"></div>
                                        <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Occupied</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-sm bg-status-due"></div>
                                        <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Near-due</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-sm bg-status-maintenance"></div>
                                        <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Maintenance</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowLegend(true)}
                                className={`pointer-events-auto self-end rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide shadow-xl backdrop-blur-sm transition-colors ${isDark ? 'border border-slate-800 bg-surface-dark text-slate-300 hover:border-slate-600 hover:text-slate-100' : 'border border-border bg-card/95 text-slate-600 hover:border-slate-400 hover:text-slate-800'}`}
                            >
                                Show Legend
                            </button>
                        )}

                        {/* Controls */}
                        <div className="flex gap-4 items-end pointer-events-auto">
                            {/* Minimap */}
                            <div className={`relative hidden h-32 w-48 overflow-hidden rounded-lg shadow-xl md:block ${isDark ? 'border border-slate-800 bg-surface-dark' : 'border border-border bg-card/95'}`}>
                                <div className="absolute inset-0 p-2">
                                    <div
                                        ref={minimapRef}
                                        onPointerDown={handleMinimapPointerDown}
                                        className={`relative h-full w-full cursor-pointer overflow-hidden rounded border ${isDark ? 'border-slate-700 bg-[#15181d]' : 'border-slate-200 bg-[linear-gradient(180deg,#f7faf5,#eef4ec)]'}`}
                                    >
                                        <div
                                            className={`absolute border ${isDark ? 'border-slate-600/70 bg-white/[0.03]' : 'border-slate-400/70 bg-white/25'}`}
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
                                                className={`absolute rounded-[1px] ${unit.status === 'occupied' ? 'bg-status-occupied/85' :
                                                    unit.status === 'vacant' ? 'bg-status-vacant/85' :
                                                        unit.status === 'maintenance' ? 'bg-status-maintenance/85' : 'bg-status-due/85'
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
                                                className={`absolute rounded-[1px] ${isDark ? 'bg-neutral-500/70' : 'bg-slate-400/70'}`}
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
                                                className={`absolute rounded-[1px] ${isDark ? 'bg-neutral-300/70' : 'bg-slate-500/70'}`}
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
                                            className={`absolute cursor-move border-2 ${isDark ? 'border-primary bg-primary/20 shadow-[0_0_0_1px_rgba(0,0,0,0.25)]' : 'border-primary/80 bg-primary/15 shadow-[0_0_0_1px_rgba(255,255,255,0.7)]'}`}
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

                            <div className="flex flex-col bg-card/95 border border-border rounded-lg shadow-xl overflow-hidden backdrop-blur">
                                <button onClick={handleZoomIn} className="p-2 hover:bg-muted text-slate-600 transition-colors border-b border-border"><span className="material-icons-round text-lg">add</span></button>
                                <button onClick={handleZoomOut} className="p-2 hover:bg-muted text-slate-600 transition-colors border-b border-border"><span className="material-icons-round text-lg">remove</span></button>
                                <button onClick={handleFit} className="p-2 hover:bg-muted text-slate-600 transition-colors border-b border-border"><span className="material-icons-round text-lg">aspect_ratio</span></button>
                                {!readOnly && (
                                    <button
                                        onClick={handleUndo}
                                        disabled={!undoAvailable}
                                        className={`p-2 transition-colors ${undoAvailable ? 'hover:bg-muted text-slate-600' : 'text-slate-300 cursor-not-allowed'}`}
                                        title="Undo (Ctrl+Z)"
                                    >
                                        <span className="material-icons-round text-lg">undo</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className="absolute bottom-6 left-6 bg-card/95 backdrop-blur border border-border py-2 px-4 rounded-lg shadow-lg z-20 pointer-events-auto">
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex flex-col">
                                <span className="text-slate-500">Total Units</span>
                                <span className="font-mono text-slate-900">{units.length}</span>
                            </div>
                            <div className="h-6 w-px bg-border"></div>
                            <div className="flex flex-col">
                                <span className="text-slate-500">Total Area</span>
                                <span className="font-mono text-slate-900">{totalArea.toLocaleString()} sqft</span>
                            </div>
                            <div className="h-6 w-px bg-border"></div>
                            <div className="flex flex-col">
                                <span className="text-slate-500">Cursor</span>
                                <span className="font-mono text-primary">X: {Math.round(position.x)} Y: {Math.round(position.y)}</span>
                            </div>
                        </div>
                    </div>

                    {showOverlapToast && (
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg border border-red-500/20 bg-red-50 text-red-700 text-sm font-medium shadow-lg pointer-events-none">
                            Units overlap
                        </div>
                    )}

                    {showDeleteToast && (
                        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg border border-emerald-500/20 bg-emerald-50 text-emerald-700 text-sm font-medium shadow-lg pointer-events-none">
                            Item deleted
                        </div>
                    )}

                    {!readOnly && isDraggingCanvasItem && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                            <div
                                ref={trashRef}
                                className={`w-16 h-16 rounded-full border-2 flex items-center justify-center shadow-xl transition-all ${isTrashHot ? 'border-red-400 bg-red-100 scale-110' : 'border-slate-300 bg-card/95'}`}
                            >
                                <span className={`material-icons-round text-2xl ${isTrashHot ? 'text-red-500' : 'text-slate-500'}`}>delete</span>
                            </div>
                        </div>
                    )}

                    {!readOnly && pendingDelete && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/55 backdrop-blur-sm p-4">
                            <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl">
                                <div className="p-5">
                                    <h3 className="text-sm font-semibold text-slate-900">Confirm deletion</h3>
                                    <p className="mt-2 text-xs text-slate-600">
                                        Delete {getCanvasItemLabel(pendingDelete.item)}?
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        {pendingDelete.source === "trash" ? "You dropped this item near the trash." : "You used keyboard delete."}
                                    </p>
                                </div>
                                <div className="flex items-center justify-end gap-2 border-t border-border p-3">
                                    <button
                                        onClick={cancelDeleteItem}
                                        className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDeleteItem}
                                        className="rounded-md border border-red-500/30 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {readOnly && transferModalUnit && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-white/55 backdrop-blur-sm p-4 pointer-events-auto">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl overflow-hidden relative flex flex-col"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50/70">
                                    <div className="flex items-center gap-3 text-slate-800">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <span className="material-icons-round">move_down</span>
                                        </div>
                                        <h3 className="text-lg font-semibold">Unit Transfer Request</h3>
                                    </div>
                                    <button 
                                        title="Close"
                                        onClick={() => setTransferModalUnit(null)}
                                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                                    >
                                        <span className="material-icons-round text-xl">close</span>
                                    </button>
                                </div>

                                <div className="px-6 py-6">
                                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                                        You are requesting to transfer your current lease to <span className="font-semibold text-slate-900 px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 shadow-sm">{transferModalUnit.name}</span>. This request is subject to landlord approval.
                                    </p>
                                    
                                    {transferSuccess ? (
                                        <div className="flex flex-col items-center justify-center py-6 px-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                                                <span className="material-icons-round text-2xl">check_circle</span>
                                            </div>
                                            <h4 className="text-emerald-800 font-semibold mb-1">Request Submitted!</h4>
                                            <p className="text-sm text-emerald-600">Your landlord has been notified and will review your transfer request shortly.</p>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleTransferSubmit} className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 block">
                                                    Transfer Justification <span className="text-slate-400 font-normal text-xs ml-1">(Optional)</span>
                                                </label>
                                                <div className="relative">
                                                    <textarea
                                                        value={transferReason}
                                                        onChange={(e) => setTransferReason(e.target.value)}
                                                        placeholder="e.g., Needing more space for a home office..."
                                                        className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none shadow-sm"
                                                    />
                                                    <div className="absolute bottom-3 right-3 text-[10px] text-slate-400">
                                                        {transferReason.length} chars
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {transferError && (
                                                <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
                                                    <span className="material-icons-round text-rose-500 text-lg">error_outline</span>
                                                    <div className="flex-1">
                                                        <h5 className="text-sm font-semibold text-rose-800 mb-0.5">Submission Failed</h5>
                                                        <p className="text-xs text-rose-600">{transferError}</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={() => setTransferModalUnit(null)}
                                                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isSubmittingTransfer}
                                                    className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    {isSubmittingTransfer ? (
                                                        <>
                                                            <span className="material-icons-round text-lg animate-spin cursor-not-allowed">refresh</span>
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Submit Request
                                                            <span className="material-icons-round text-lg text-white/80">arrow_forward</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </main>

                {/* Sidebar */}
                {!readOnly && (
                    <aside className={`w-[340px] shrink-0 flex flex-col z-10 ${isDark ? 'bg-surface-dark border-l border-slate-800 shadow-none' : 'bg-card border-l border-border shadow-2xl'}`}>
                        {selectedUnit ? (
                            <UnitDetailsPanel
                                key={selectedUnit.id}
                                unit={selectedUnit}
                                onUpdate={(updates) => {
                                    setUnits(prev => prev.map(u => u.id === selectedUnit.id ? { ...u, ...updates } : u));
                                }}
                                onDelete={() => {
                                    deleteCanvasItem({ kind: "unit", id: selectedUnit.id });
                                    setSelectedItem(null);
                                    triggerDeleteToast();
                                }}
                                onClose={() => setSelectedItem(null)}
                                notesOpen={isNotesPanelOpen}
                                onToggleNotes={() => setIsNotesPanelOpen((current) => !current)}
                            />
                        ) : (
                            <SidebarBlockLibrary
                                onDragStart={handleSidebarBlockDragStart}
                                styles={styles}
                                isDark={isDark}
                            />
                        )}
                    </aside>
                )}
                {!readOnly && selectedUnit && (
                    <UnitNotesPanel
                        isOpen={isNotesPanelOpen}
                        onToggle={() => setIsNotesPanelOpen((current) => !current)}
                        value={selectedUnitNote}
                        onChange={(nextValue) => {
                            setUnitNotes((current) => ({ ...current, [selectedUnit.id]: nextValue }));
                        }}
                    />
                )}
            </div>
        </div>
    );
}

const UnitDetailsPanel = ({
    unit,
    onUpdate,
    onDelete,
    onClose,
    notesOpen,
    onToggleNotes,
}: {
    unit: Unit;
    onUpdate: (updates: Partial<Unit>) => void;
    onDelete: () => void;
    onClose: () => void;
    notesOpen: boolean;
    onToggleNotes: () => void;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tenantActionMenu, setTenantActionMenu] = useState<TenantActionMenuState>({ isOpen: false });
    const [quickActionError, setQuickActionError] = useState<string | null>(null);
    const [pendingQuickAction, setPendingQuickAction] = useState<QuickActionType | null>(null);
    const [nowMs, setNowMs] = useState(() => new Date().getTime());

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setNowMs(new Date().getTime());
        }, 60_000);
        return () => window.clearInterval(intervalId);
    }, []);

    const unitAreaSqftByType: Record<Unit["type"], number> = {
        Studio: 400,
        "1BR": 650,
        "2BR": 950,
        "3BR": 1200,
    };
    const unitAreaSqm = Math.round(unitAreaSqftByType[unit.type] * 0.092903);

    // Status configuration for consistent styling
    const statusConfig = {
        occupied: { color: 'text-blue-600 dark:text-blue-300', label: 'Occupied', icon: 'check_circle' },
        vacant: { color: 'text-emerald-600 dark:text-emerald-300', label: 'Available Now', icon: 'vpn_key' },
        maintenance: { color: 'text-rose-600 dark:text-rose-300', label: 'Maintenance', icon: 'build' },
        neardue: { color: 'text-amber-600 dark:text-amber-300', label: 'Near Due', icon: 'warning' }
    };

    const currentStatus = statusConfig[unit.status] || statusConfig.vacant;

    // Helper to calculate days remaining
    const getDaysRemaining = () => {
        if (!unit.leaseEnd) return null;
        const end = new Date(unit.leaseEnd).getTime();
        const diff = end - nowMs;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    const daysRemaining = getDaysRemaining();
    const unitLayoutLabel = unit.type === '1BR'
        ? '1 Bed - 1 Bath'
        : unit.type === '2BR'
            ? '2 Bed - 2 Bath'
            : unit.type === '3BR'
                ? '3 Bed - 2.5 Bath'
                : 'Studio - 1 Bath';
    const leaseHeadline = daysRemaining === null
        ? "No lease date"
        : daysRemaining < 0
            ? `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? "" : "s"}`
            : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`;
    const leaseMilestoneText = daysRemaining === null
        ? "Set lease end date to track countdown."
        : daysRemaining <= 7
            ? "Milestone: lease action needed this week."
            : daysRemaining <= 30
                ? "Milestone: schedule tenant follow-up this month."
                : "Milestone: healthy lease runway.";
    const maintenanceOpenedDate = (() => {
        if (!unit.leaseEnd) return null;
        const parsed = new Date(unit.leaseEnd);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    })();
    const quickActions = QUICK_ACTIONS_BY_STATUS[unit.status] ?? [];
    const canViewTenantProfile = Boolean(unit.tenant && unit.tenant.trim().length > 0);
    const tenantProfileHref = `/landlord/tenants?unitId=${encodeURIComponent(unit.id)}&tenant=${encodeURIComponent(unit.tenant || "")}`;

    const executeQuickAction = (action: QuickActionType) => {
        const guard = evaluateQuickAction(unit.status, action);
        if (!guard.allowed || !guard.nextStatus) {
            setQuickActionError(guard.reason || "This action is currently unavailable.");
            return;
        }

        setQuickActionError(null);
        onUpdate({ status: guard.nextStatus });
    };

    const handleQuickAction = (action: QuickActionType) => {
        const guard = evaluateQuickAction(unit.status, action);
        if (!guard.allowed) {
            setQuickActionError(guard.reason || "This action is currently unavailable.");
            return;
        }

        if (guard.requiresConfirmation) {
            setPendingQuickAction(action);
            return;
        }

        executeQuickAction(action);
    };

    return (
        <div className="relative flex h-full flex-col overflow-hidden border-l border-white/10 bg-slate-50/50 font-sans text-foreground shadow-2xl backdrop-blur-xl dark:bg-[#0a0a0a]/90">
            {/* Glossy Overlay for that Glass look */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-30" />

            {/* Hero Header Section */}
            <div className="relative h-72 w-full shrink-0 group overflow-hidden">
                {/* Background Image / Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-slate-500/10 to-sky-500/20 z-0"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-60 z-0 grayscale-[0.2] transition-transform duration-1000 group-hover:scale-110"></div>

                {/* Depth Gradients */}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-50 via-slate-50/40 to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a]/60 dark:to-transparent"></div>
                <div className="absolute inset-0 z-10 bg-white/5 opacity-50 dark:bg-black/20"></div>

                {/* Top Actions */}
                <div className="absolute right-6 top-6 z-20 flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onToggleNotes}
                        className={`flex h-9 items-center justify-center rounded-full border px-4 text-[11px] font-bold tracking-tight transition-all shadow-lg backdrop-blur-md ${
                            notesOpen
                                ? "border-primary/50 bg-primary/20 text-primary shadow-primary/20"
                                : "border-white/40 bg-white/20 text-slate-900 shadow-black/5 hover:bg-white/40 dark:border-white/10 dark:bg-black/40 dark:text-slate-100 dark:hover:bg-black/60"
                        }`}
                    >
                        <span className="material-icons-round mr-1.5 text-sm">sticky_note_2</span>
                        VIEW NOTES
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/20 text-slate-900 shadow-lg shadow-black/5 backdrop-blur-md transition-all hover:bg-white/40 dark:border-white/10 dark:bg-black/40 dark:text-slate-100 dark:hover:bg-black/60"
                    >
                        <span className="material-icons-round text-lg">close</span>
                    </motion.button>
                </div>

                {/* Hero Info Overlay */}
                <div className="absolute bottom-8 left-8 right-8 z-20">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-1 flex items-center gap-2"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary dark:text-primary-400">UNIT {unit.id}</span>
                        <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{unit.type}</span>
                    </motion.div>
                    
                    <h1 className="mb-4 text-[3.2rem] font-black leading-[0.9] tracking-tighter text-slate-900 drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)] dark:text-white dark:drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]">
                        {unit.name}
                    </h1>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-1.5 rounded-xl border border-white/50 bg-white/40 px-3.5 py-2 backdrop-blur-lg shadow-sm dark:border-white/10 dark:bg-black/40">
                            <span className="material-icons-round text-[16px] text-primary/70">king_bed</span>
                            <span className="text-[11px] font-bold tracking-wide text-slate-800 dark:text-slate-100 uppercase">{unitLayoutLabel}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 rounded-xl border border-white/50 bg-white/40 px-3.5 py-2 backdrop-blur-lg shadow-sm dark:border-white/10 dark:bg-black/40`}>
                            <div className={`h-2 w-2 rounded-full animate-pulse ${unit.status === 'vacant' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} />
                            <span className="text-[11px] font-bold tracking-wide text-slate-800 dark:text-slate-100 uppercase">{currentStatus.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-xl border border-white/50 bg-white/40 px-3.5 py-2 backdrop-blur-lg shadow-sm dark:border-white/10 dark:bg-black/40">
                            <span className="material-icons-round text-[16px] text-cyan-400">aspect_ratio</span>
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 tracking-wide uppercase">{unitAreaSqm} m²</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-0 flex-1 space-y-6 overflow-y-auto px-8 pt-8 pb-36 custom-scrollbar">
                {!isEditing && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8"
                    >
                        {/* Tenant Spotlight Card */}
                        <section className="relative">
                            <div className="mb-4 flex items-center justify-between px-1">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">RESIDENT PROFILE</h3>
                                {unit.status === 'occupied' && (
                                    <div className="flex h-5 items-center rounded-full bg-primary/10 px-2 text-[9px] font-black uppercase text-primary">Lease Holder</div>
                                )}
                            </div>
                            
                            <motion.div 
                                className="relative overflow-visible"
                                initial={false}
                            >
                                <button
                                    type="button"
                                    onClick={() => setTenantActionMenu((current) => ({ isOpen: !current.isOpen }))}
                                    className="group relative flex w-full flex-col rounded-3xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 dark:border-white/5 dark:bg-slate-900/60 dark:hover:bg-slate-900"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="relative">
                                            <div className="relative h-16 w-16 rounded-[22px] border-2 border-primary/20 p-1 transition-transform group-hover:scale-105">
                                                <div className="h-full w-full overflow-hidden rounded-[18px] bg-slate-100 dark:bg-slate-800">
                                                    <img
                                                        src={unit.tenant ? `https://ui-avatars.com/api/?name=${encodeURIComponent(unit.tenant)}&background=random&color=fff` : "https://images.unsplash.com/photo-1529778456-9a2cf1fbe4a8?auto=format&fit=crop&w=150&q=80"}
                                                        alt="Tenant"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-white bg-emerald-500 shadow-sm dark:border-black"></div>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xl font-black tracking-tight text-slate-900 dark:text-white">{unit.tenant || "VACANT UNIT"}</p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{unit.tenant ? "Active Tenant" : "Ready for Move-in"}</span>
                                                <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                <span className="text-[11px] font-bold text-primary tracking-wide">ID-{unit.id.slice(0, 5).toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary dark:bg-black/40">
                                            <span className="material-icons-round text-xl">more_vert</span>
                                        </div>
                                    </div>
                                </button>
                                
                                <AnimatePresence>
                                    {tenantActionMenu.isOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                            className="absolute right-0 top-[90px] z-50 w-64 rounded-[28px] border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-black/90"
                                        >
                                            <Link
                                                href={`/landlord/messages?unitId=${encodeURIComponent(unit.id)}`}
                                                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black text-slate-700 transition-all hover:bg-primary/10 hover:text-primary dark:text-slate-200"
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                    <span className="material-icons-round text-base">chat_bubble</span>
                                                </div>
                                                Message Resident
                                            </Link>
                                            {canViewTenantProfile ? (
                                                <Link
                                                    href={tenantProfileHref}
                                                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black text-slate-700 transition-all hover:bg-primary/10 hover:text-primary dark:text-slate-200"
                                                >
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                                                        <span className="material-icons-round text-base">person</span>
                                                    </div>
                                                    Access Portfolio
                                                </Link>
                                            ) : (
                                                <div
                                                    title="No tenant identity available for this unit yet."
                                                    className="flex w-full cursor-not-allowed items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black text-slate-400 dark:text-slate-600"
                                                >
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-300 dark:bg-white/5">
                                                        <span className="material-icons-round text-base">person_off</span>
                                                    </div>
                                                    Access Portfolio
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </section>

                        {/* Operational Context Cards */}
                        <div className="grid grid-cols-1 gap-6">
                            {/* Maintenance Blocker (Critical Alert Style) */}
                            {unit.status === "maintenance" && (
                                <motion.div 
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="group relative overflow-hidden rounded-[32px] border border-rose-500/30 bg-rose-50 p-6 shadow-xl shadow-rose-500/5 dark:bg-rose-950/20"
                                >
                                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl transition-all group-hover:bg-rose-500/20" />
                                    <div className="flex items-start gap-5">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                                            <span className="material-icons-round animate-pulse text-2xl">warning</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">Critical Blocker</h3>
                                            <p className="mt-2 text-lg font-black leading-tight text-slate-900 dark:text-white">{unit.details?.trim() || "Unspecified Issue"}</p>
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className="text-[11px] font-bold text-rose-500/80">Reported {maintenanceOpenedDate ? maintenanceOpenedDate.toLocaleDateString() : "recently"}</span>
                                                <div className="h-1 w-1 rounded-full bg-rose-300 dark:bg-rose-700" />
                                                <span className="text-[11px] font-bold text-rose-500/80">Status: Active</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Lease Analytics & Timeline */}
                            {(unit.status === 'occupied' || unit.status === 'neardue') && (
                                <div className="group relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/20 dark:border-white/5 dark:bg-slate-900/40 dark:shadow-none">
                                    <h3 className="mb-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">LEASE ANALYTICS</h3>
                                    
                                    <div className="flex flex-col items-center">
                                        <div className="relative h-44 w-72">
                                            <svg className="h-full w-full" viewBox="0 0 200 100">
                                                <path
                                                    d="M 20 100 A 80 80 0 0 1 180 100"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="10"
                                                    strokeLinecap="round"
                                                    className="text-slate-100 dark:text-white/5"
                                                />
                                                <motion.path
                                                    initial={{ strokeDashoffset: 251.2 }}
                                                    animate={{ strokeDashoffset: 251.2 - ((() => {
                                                        if (!unit.leaseStart || !unit.leaseEnd) return 0;
                                                        const start = new Date(unit.leaseStart).getTime();
                                                        const end = new Date(unit.leaseEnd).getTime();
                                                        const total = end - start;
                                                        const elapsed = nowMs - start;
                                                        const percent = Math.min(100, Math.max(0, (elapsed / total) * 100));
                                                        return (percent / 100) * 251.2;
                                                    })()) }}
                                                    d="M 20 100 A 80 80 0 0 1 180 100"
                                                    fill="none"
                                                    stroke="url(#leaseGradient)"
                                                    strokeWidth="10"
                                                    strokeLinecap="round"
                                                    strokeDasharray="251.2"
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                />
                                                <defs>
                                                    <linearGradient id="leaseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor="#4f46e5" />
                                                        <stop offset="100%" stopColor="#c026d3" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                            
                                            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center">
                                                <p className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
                                                    {daysRemaining !== null ? `${Math.abs(daysRemaining)}` : "--"}
                                                </p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    DAYS {daysRemaining && daysRemaining < 0 ? "OVERDUE" : "REMAINING"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-8 flex w-full items-center justify-between gap-4">
                                            <div className="flex-1 space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400">Lease Commenced</p>
                                                <p className="text-xs font-black text-slate-800 dark:text-slate-100">{unit.leaseStart ? new Date(unit.leaseStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "--"}</p>
                                            </div>
                                            <div className="h-8 w-px bg-slate-100 dark:bg-white/5" />
                                            <div className="flex-1 text-right space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400">Renewal Window</p>
                                                <p className="text-xs font-black text-slate-800 dark:text-slate-100">{unit.leaseEnd ? new Date(unit.leaseEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "--"}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 w-full rounded-2xl bg-slate-50 p-4 dark:bg-black/20">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
                                                    <span className="material-icons-round text-sm text-primary">insights</span>
                                                </div>
                                                <p className="text-[11px] font-bold leading-tight text-slate-600 dark:text-slate-400">
                                                    {leaseMilestoneText}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Command Center Quick Actions */}
                        <section className="rounded-[32px] border border-slate-200 bg-slate-900 p-6 shadow-2xl dark:border-white/5">
                            <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">COMMAND CENTER</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {quickActions.map((action) => (
                                    <motion.button
                                        key={action}
                                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.15)" }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={() => handleQuickAction(action)}
                                        className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/10 p-4 text-[11px] font-black text-white transition-all hover:shadow-xl hover:shadow-black/20"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                                            <span className="material-icons-round text-xl">{QUICK_ACTION_META[action].icon}</span>
                                        </div>
                                        {QUICK_ACTION_META[action].label.toUpperCase()}
                                    </motion.button>
                                ))}
                            </div>
                            {quickActionError && (
                                <p className="mt-3 text-xs font-semibold text-rose-300">{quickActionError}</p>
                            )}
                        </section>
                    </motion.div>
                )}
            </div>

            {pendingQuickAction && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 p-6">
                    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Confirm Status Change</h4>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            {evaluateQuickAction(unit.status, pendingQuickAction).confirmMessage || "Are you sure you want to continue?"}
                        </p>
                        <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setPendingQuickAction(null)}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const action = pendingQuickAction;
                                    setPendingQuickAction(null);
                                    executeQuickAction(action);
                                }}
                                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-500"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            {isEditing ? (
                <div className="p-6 border-t border-border bg-card/95 backdrop-blur-xl absolute bottom-0 w-full z-20 flex gap-4">
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
                <div className="p-6 border-t border-border bg-card/95 backdrop-blur-xl absolute bottom-0 w-full z-20">
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

const UnitNotesPanel = ({
    isOpen,
    onToggle,
    value,
    onChange,
}: {
    isOpen: boolean;
    onToggle: () => void;
    value: string;
    onChange: (nextValue: string) => void;
}) => {
    const noteLength = value.trim().length;

    return (
        <div className={`shrink-0 border-l border-border bg-card/95 transition-[width] duration-300 ${isOpen ? "w-[320px]" : "w-[52px]"}`}>
            <div className="flex h-full">
                <button
                    type="button"
                    onClick={onToggle}
                    className="group relative flex w-[52px] items-center justify-center border-r border-border bg-gradient-to-b from-slate-100 to-slate-200 text-slate-600 transition-colors hover:from-slate-200 hover:to-slate-300 dark:from-slate-900 dark:to-slate-950 dark:text-slate-300 dark:hover:from-slate-800 dark:hover:to-slate-900"
                    title={isOpen ? "Collapse notes" : "Open notes"}
                >
                    <div className="flex flex-col items-center gap-2">
                        <span className="material-icons-round text-lg">{isOpen ? "chevron_right" : "sticky_note_2"}</span>
                        {!isOpen && (
                            <span className="rotate-180 text-[10px] font-bold uppercase tracking-[0.2em] [writing-mode:vertical-rl]">Notes</span>
                        )}
                    </div>
                </button>
                {isOpen && (
                    <div className="flex min-w-0 flex-1 flex-col bg-gradient-to-b from-white to-slate-100/80 p-4 dark:from-slate-900 dark:to-slate-950/90">
                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/70">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-primary-400">
                                        <span className="material-icons-round text-base">sticky_note_2</span>
                                        Unit Notes
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Private note for this unit. Autosaves locally.</p>
                                </div>
                                <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                                    Auto
                                </span>
                            </div>
                        </div>
                        <textarea
                            value={value}
                            onChange={(event) => onChange(event.target.value)}
                            placeholder="Add reminders, follow-ups, or move-in prep details..."
                            className="mt-3 h-full min-h-[220px] resize-none rounded-2xl border border-slate-300 bg-white/95 px-4 py-4 text-sm leading-relaxed text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                        <div className="mt-2 flex items-center justify-between px-1">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Tip: Use short action-oriented notes.</p>
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{noteLength} chars</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* Extracted Sidebar Library Component for cleaner main render */
const SidebarBlockLibrary = ({
    onDragStart,
    styles,
    isDark
}: {
    onDragStart: (type: SidebarBlockType) => (e: React.DragEvent<HTMLDivElement>) => void;
    styles: { readonly [key: string]: string; }
    isDark: boolean;
}) => {
    const handleSidebarBlockDragEnd = () => {
        // Optional cleanup if needed inside component, but parent tracks ghost
    };

    return (
        <div className="flex flex-col h-full">
            <div className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-border'}`}>
                <h2 className={`mb-4 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Building Blocks</h2>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="material-icons-round text-slate-400 text-lg">search</span>
                    </span>
                    <input className={`w-full rounded-lg border pl-10 pr-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary ${isDark ? 'border-slate-700 bg-background-dark text-slate-200' : 'border-border bg-slate-50 text-slate-700'}`} placeholder="Search components..." type="text" />
                </div>
            </div>
            <div className={`flex-1 overflow-y-auto p-4 space-y-6 ${styles['scrollbarHide'] || ''}`}>
                <div>
                    <h3 className={`mb-3 flex items-center gap-2 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        <span className="material-icons-round text-primary text-sm">bedroom_parent</span>
                        Living Units
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            className={`group flex cursor-grab flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary active:cursor-grabbing ${isDark ? 'border-slate-700 bg-background-dark hover:shadow-none' : 'border-border bg-slate-50 hover:shadow-md'}`}
                            draggable="true"
                            onDragStart={onDragStart("studio")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className={`h-8 w-10 rounded transition-colors group-hover:border-primary/50 group-hover:bg-primary/10 ${isDark ? 'border border-neutral-500 bg-neutral-700' : 'border border-slate-300 bg-slate-200'}`}></div>
                            <div className="text-center">
                                <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Studio</p>
                                <p className="text-[10px] text-slate-500">400 sqft</p>
                            </div>
                        </div>
                        <div
                            className={`group flex cursor-grab flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary active:cursor-grabbing ${isDark ? 'border-slate-700 bg-background-dark hover:shadow-none' : 'border-border bg-slate-50 hover:shadow-md'}`}
                            draggable="true"
                            onDragStart={onDragStart("1br")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className={`flex h-8 w-12 rounded ${isDark ? 'border border-neutral-500 bg-neutral-700' : 'border border-slate-300 bg-slate-200'}`}><div className={`w-1/2 ${isDark ? 'border-r border-neutral-400' : 'border-r border-slate-400'}`}></div></div>
                            <div className="text-center">
                                <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>1 BR Std</p>
                                <p className="text-[10px] text-slate-500">650 sqft</p>
                            </div>
                        </div>
                        <div
                            className={`group flex cursor-grab flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary active:cursor-grabbing ${isDark ? 'border-slate-700 bg-background-dark hover:shadow-none' : 'border-border bg-slate-50 hover:shadow-md'}`}
                            draggable="true"
                            onDragStart={onDragStart("2br")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className={`relative h-10 w-12 rounded ${isDark ? 'border border-neutral-500 bg-neutral-700' : 'border border-slate-300 bg-slate-200'}`}><div className="absolute inset-0 grid grid-cols-2 grid-rows-1"><div className={`${isDark ? 'border-r border-neutral-400' : 'border-r border-slate-400'}`}></div></div></div>
                            <div className="text-center">
                                <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>2 BR Corner</p>
                                <p className="text-[10px] text-slate-500">950 sqft</p>
                            </div>
                        </div>
                        <div
                            className={`group flex cursor-grab flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary active:cursor-grabbing ${isDark ? 'border-slate-700 bg-background-dark hover:shadow-none' : 'border-border bg-slate-50 hover:shadow-md'}`}
                            draggable="true"
                            onDragStart={onDragStart("3br")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className={`relative h-10 w-14 rounded ${isDark ? 'border border-neutral-500 bg-neutral-700' : 'border border-slate-300 bg-slate-200'}`}><div className="absolute inset-0 grid grid-cols-3 grid-rows-1"><div className={`${isDark ? 'border-r border-neutral-400' : 'border-r border-slate-400'}`}></div><div className={`${isDark ? 'border-r border-neutral-400' : 'border-r border-slate-400'}`}></div></div></div>
                            <div className="text-center">
                                <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>3 BR Suite</p>
                                <p className="text-[10px] text-slate-500">1200 sqft</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className={`mb-3 flex items-center gap-2 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        <span className="material-icons-round text-primary text-sm">architecture</span>
                        Structural
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            className={`group flex cursor-grab flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary active:cursor-grabbing ${isDark ? 'border-slate-700 bg-background-dark hover:shadow-none' : 'border-border bg-slate-50 hover:shadow-md'}`}
                            draggable="true"
                            onDragStart={onDragStart("corridor")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className={`h-8 w-14 rounded-[1px] border-y ${isDark ? 'border-neutral-500 bg-neutral-700' : 'border-slate-500 bg-slate-100'}`} />
                            <div className="text-center"><p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Corridor</p></div>
                        </div>
                        <div
                            className={`group flex cursor-grab flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary active:cursor-grabbing ${isDark ? 'border-slate-700 bg-background-dark hover:shadow-none' : 'border-border bg-slate-50 hover:shadow-md'}`}
                            draggable="true"
                            onDragStart={onDragStart("elevator")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className={`flex h-8 w-8 items-center justify-center rounded ${isDark ? 'bg-neutral-700' : 'bg-slate-200'}`}>
                                <span className={`material-icons-round text-sm ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>elevator</span>
                            </div>
                            <div className="text-center"><p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Elevator</p></div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className={`mb-3 flex items-center gap-2 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        <span className="material-icons-round text-primary text-sm">stairs</span>
                        Stairwells
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            className={`group flex cursor-grab flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary active:cursor-grabbing ${isDark ? 'border-slate-700 bg-background-dark hover:shadow-none' : 'border-border bg-slate-50 hover:shadow-md'}`}
                            draggable="true"
                            onDragStart={onDragStart("stair-straight")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className={`flex h-10 w-6 flex-col justify-evenly rounded px-0.5 ${isDark ? 'border border-neutral-500 bg-neutral-700' : 'border border-slate-400 bg-slate-200'}`}>
                                {[...Array(6)].map((_, i) => <div key={i} className={`h-px w-full ${isDark ? 'bg-neutral-400' : 'bg-slate-400'}`}></div>)}
                            </div>
                            <div className="text-center">
                                <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Straight</p>
                            </div>
                        </div>
                        <div
                            className={`group flex cursor-grab flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary active:cursor-grabbing ${isDark ? 'border-slate-700 bg-background-dark hover:shadow-none' : 'border-border bg-slate-50 hover:shadow-md'}`}
                            draggable="true"
                            onDragStart={onDragStart("stair-l")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className={`relative h-8 w-8 rounded ${isDark ? 'border border-neutral-500 bg-neutral-700' : 'border border-slate-400 bg-slate-200'}`}>
                                <div className={`absolute top-0 right-0 h-1/2 w-1/2 border-l border-b ${isDark ? 'border-neutral-400' : 'border-slate-400'}`}></div>
                                <div className={`absolute bottom-0 right-0 flex h-1/2 w-1/2 flex-col justify-evenly border-l ${isDark ? 'border-neutral-400' : 'border-slate-400'}`}>
                                    {[...Array(3)].map((_, i) => <div key={i} className={`h-px w-full ${isDark ? 'bg-neutral-400' : 'bg-slate-400'}`}></div>)}
                                </div>
                                <div className={`absolute top-0 left-0 flex h-1/2 w-1/2 flex-row justify-evenly border-b ${isDark ? 'border-neutral-400' : 'border-slate-400'}`}>
                                    {[...Array(3)].map((_, i) => <div key={i} className={`h-full w-px ${isDark ? 'bg-neutral-400' : 'bg-slate-400'}`}></div>)}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>L-Shape</p>
                            </div>
                        </div>
                        <div
                            className={`group flex cursor-grab flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary active:cursor-grabbing ${isDark ? 'border-slate-700 bg-background-dark hover:shadow-none' : 'border-border bg-slate-50 hover:shadow-md'}`}
                            draggable="true"
                            onDragStart={onDragStart("stair-u")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className={`relative h-8 w-8 rounded ${isDark ? 'border border-neutral-500 bg-neutral-700' : 'border border-slate-400 bg-slate-200'}`}>
                                <div className={`absolute top-0 left-0 right-0 h-[30%] border-b ${isDark ? 'border-neutral-400' : 'border-slate-400'}`}></div>
                                <div className={`absolute top-[30%] bottom-0 left-1/2 w-0.5 -translate-x-1/2 ${isDark ? 'bg-neutral-400' : 'bg-slate-400'}`}></div>
                                <div className={`absolute top-[30%] bottom-0 left-0 right-1/2 flex flex-col justify-evenly border-r ${isDark ? 'border-neutral-400' : 'border-slate-400'}`}>
                                    {[...Array(4)].map((_, i) => <div key={i} className={`h-px w-full ${isDark ? 'bg-neutral-400' : 'bg-slate-400'}`}></div>)}
                                </div>
                                <div className={`absolute top-[30%] bottom-0 left-1/2 right-0 flex flex-col justify-evenly border-l ${isDark ? 'border-neutral-400' : 'border-slate-400'}`}>
                                    {[...Array(4)].map((_, i) => <div key={i} className={`h-px w-full ${isDark ? 'bg-neutral-400' : 'bg-slate-400'}`}></div>)}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>U-Shape</p>
                            </div>
                        </div>
                        <div
                            className={`group flex cursor-grab flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary active:cursor-grabbing ${isDark ? 'border-slate-700 bg-background-dark hover:shadow-none' : 'border-border bg-slate-50 hover:shadow-md'}`}
                            draggable="true"
                            onDragStart={onDragStart("stair-spiral")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${isDark ? 'border border-neutral-500 bg-neutral-700' : 'border border-slate-400 bg-slate-200'}`}>
                                <div className={`h-2 w-2 rounded-full ${isDark ? 'border border-neutral-400' : 'border border-slate-400'}`}></div>
                                {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                                    <div key={deg} className={`absolute inset-0 border-t ${isDark ? 'border-neutral-400/50' : 'border-slate-400/50'}`} style={{ transform: `rotate(${deg}deg)` }}></div>
                                ))}
                            </div>
                            <div className="text-center">
                                <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Spiral</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

