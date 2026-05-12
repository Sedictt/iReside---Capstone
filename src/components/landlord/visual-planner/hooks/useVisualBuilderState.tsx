"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { useOptionalProperty } from "@/context/PropertyContext";
import { 
    Unit, DbUnit, FloorConfig, Corridor, FloorId, FloorLayout, 
    SelectedCanvasItem, PendingDeleteState, DragPlacementState, 
    SidebarBlockGhost, Structure 
} from "../types";
import { 
    INITIAL_UNITS, FLOOR_LAYOUTS_STORAGE_KEY, 
    ACTIVE_FLOOR_STORAGE_KEY, UNIT_NOTES_STORAGE_KEY, 
    LEGEND_VISIBILITY_STORAGE_KEY, DEFAULT_ACTIVE_FLOOR, 
    DEFAULT_FLOOR_LAYOUTS 
} from "../constants";

interface VisualBuilderStateProps {
    readOnly?: boolean;
    propertyId?: string;
    demoMode?: boolean;
}

export function useVisualBuilderState({ 
    readOnly = false, 
    propertyId: externalPropertyId,
    demoMode = false 
}: VisualBuilderStateProps = {}) {
    const propertyContext = useOptionalProperty();
    const selectedPropertyId = externalPropertyId ?? propertyContext?.selectedPropertyId ?? "all";
    const selectedProperty = propertyContext?.selectedProperty;
    
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
    const [units, setUnits] = useState<Unit[]>(demoMode ? INITIAL_UNITS : []);
    const [isPropertyMenuOpen, setIsPropertyMenuOpen] = useState(false);
    const [isHUDHidden, setIsHUDHidden] = useState(false);
    const [isLayoutLocked, setIsLayoutLocked] = useState(false);
    const [showHotkeys, setShowHotkeys] = useState(false);
    const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "waiting" | "saving" | "saved">("idle");
    const [isMinimapDragging, setIsMinimapDragging] = useState(false);
    
    // DB-driven state
    const [dbUnits, setDbUnits] = useState<DbUnit[]>([]);
    const [floorConfigs, setFloorConfigs] = useState<FloorConfig[]>(demoMode ? [
        { id: "f1", floor_number: 1, floor_key: "ground", display_name: "Ground Floor", sort_order: 1 }
    ] : []);
    const [isLoadingMap, setIsLoadingMap] = useState(!demoMode);
    const [mapLoadError, setMapLoadError] = useState<string | null>(null);
    const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(demoMode ? true : null);
    const [placedCount, setPlacedCount] = useState(demoMode ? INITIAL_UNITS.length : 0);
    const [totalDbUnits, setTotalDbUnits] = useState(demoMode ? INITIAL_UNITS.length : 0);
    const [unplacedDbUnits, setUnplacedDbUnits] = useState<DbUnit[]>([]);

    const [viewportSize, setViewportSize] = useState({ width: 1280, height: 900 });
    const [showOverlapToast, setShowOverlapToast] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [dragPlacement, setDragPlacement] = useState<DragPlacementState | null>(null);
    const [corridors, setCorridors] = useState<Corridor[]>(demoMode ? [
        { id: "c1", label: "Main Hallway", x: 100, y: 160, w: 840, h: 40 }
    ] : []);
    const [structures, setStructures] = useState<Structure[]>(demoMode ? [
        { id: "s1", type: "elevator", label: "Lobby Elevator", x: 20, y: 150, w: 60, h: 60 },
        { id: "s2", type: "stairwell", variant: "u-shape", label: "East Stairs", x: 960, y: 150, w: 60, h: 60 }
    ] : []);
    const [selectedItem, setSelectedItem] = useState<SelectedCanvasItem | null>(null);
    const [pendingDelete, setPendingDelete] = useState<PendingDeleteState | null>(null);
    const [pendingClearFloor, setPendingClearFloor] = useState(false);
    const [presetConfirm, setPresetConfirm] = useState<{ isOpen: boolean; presetType: "double-loaded" | "u-shape" | "l-shape" | "single-loaded" | null }>({ isOpen: false, presetType: null });
    const [isTrashHot, setIsTrashHot] = useState(false);
    const [showDeleteToast, setShowDeleteToast] = useState(false);
    const [showLegend, setShowLegend] = useState(true);
    const [statusFilters, setStatusFilters] = useState<Unit["status"][]>(["occupied", "vacant", "maintenance", "neardue"]);

    const toggleStatusFilter = (status: Unit["status"]) => {
        setStatusFilters(prev => 
            prev.includes(status) 
                ? prev.filter(s => s !== status) 
                : [...prev, status]
        );
    };

    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [sidebarBlockGhost, setSidebarBlockGhost] = useState<SidebarBlockGhost | null>(null);
    const [resizingCorridorId, setResizingCorridorId] = useState<string | null>(null);
    const [floorLayouts, setFloorLayouts] = useState<Record<FloorId, FloorLayout>>(demoMode ? {
        ground: { 
            units: [],
            corridors: [],
            structures: []
        }
    } : {});

    useEffect(() => {
        setHasMounted(true);
    }, []);

    return {
        // Constants and refs
        GRID_SIZE,
        PAN_MARGIN,
        BLUEPRINT_MARGIN,
        SIDEBAR_BLOCK_DRAG_TYPE,
        containerRef,
        blueprintRef,
        minimapRef,
        minimapDragOffsetRef,
        overlapToastTimeoutRef,
        deleteToastTimeoutRef,
        isPanningRef,
        panPointerIdRef,
        panStartPointerRef,
        panStartPositionRef,
        
        // Storage keys
        SCOPED_FLOOR_LAYOUTS_KEY,
        SCOPED_ACTIVE_FLOOR_KEY,
        SCOPED_UNIT_NOTES_KEY,
        SCOPED_LEGEND_VISIBILITY_KEY,
        
        // Theme and mounting
        hasMounted,
        isDark,
        
        // View state
        scale,
        setScale,
        position,
        setPosition,
        activeFloor,
        setActiveFloor,
        viewportSize,
        setViewportSize,
        
        // Dragging state
        draggingUnitId,
        setDraggingUnitId,
        draggingCorridorId,
        setDraggingCorridorId,
        draggingStructureId,
        setDraggingStructureId,
        isPanning,
        setIsPanning,
        dragPlacement,
        setDragPlacement,
        isMinimapDragging,
        setIsMinimapDragging,
        
        // UI state
        isPropertyMenuOpen,
        setIsPropertyMenuOpen,
        isHUDHidden,
        setIsHUDHidden,
        isLayoutLocked,
        setIsLayoutLocked,
        showHotkeys,
        setShowHotkeys,
        isCanvasFullscreen,
        setIsCanvasFullscreen,
        saveStatus,
        setSaveStatus,
        showOverlapToast,
        setShowOverlapToast,
        isTrashHot,
        setIsTrashHot,
        showDeleteToast,
        setShowDeleteToast,
        showLegend,
        setShowLegend,
        isSidebarVisible,
        setIsSidebarVisible,
        
        // Data state
        units,
        setUnits,
        dbUnits,
        setDbUnits,
        floorConfigs,
        setFloorConfigs,
        isLoadingMap,
        setIsLoadingMap,
        mapLoadError,
        setMapLoadError,
        isSetupComplete,
        setIsSetupComplete,
        placedCount,
        setPlacedCount,
        totalDbUnits,
        setTotalDbUnits,
        unplacedDbUnits,
        setUnplacedDbUnits,
        corridors,
        setCorridors,
        structures,
        setStructures,
        selectedItem,
        setSelectedItem,
        pendingDelete,
        setPendingDelete,
        pendingClearFloor,
        setPendingClearFloor,
        presetConfirm,
        setPresetConfirm,
        statusFilters,
        setStatusFilters,
        toggleStatusFilter,
        sidebarBlockGhost,
        setSidebarBlockGhost,
        resizingCorridorId,
        setResizingCorridorId,
        floorLayouts,
        setFloorLayouts,
        
        // Property context
        selectedPropertyId,
        selectedProperty,
        
        // Demo mode
        demoMode,
        readOnly
    };
}
