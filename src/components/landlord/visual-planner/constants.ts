import { Unit } from "./types";

export const INITIAL_UNITS: Unit[] = [
    // Left Wing
    { id: "demo-1", dbId: "", name: "101", type: "1BR", status: "occupied", tenant: "J. Doe", x: 100, y: 40, w: 180, h: 120, details: "1BR Standard", leaseStart: "2023-01-01", leaseEnd: "2024-01-01" },
    { id: "demo-2", dbId: "", name: "102", type: "1BR", status: "vacant", x: 280, y: 40, w: 180, h: 120, details: "Ready for Move-in" },
    { id: "demo-3", dbId: "", name: "103", type: "2BR", status: "maintenance", x: 460, y: 40, w: 220, h: 120, details: "Deep Cleaning", leaseEnd: "ETA: 6h" },
    { id: "demo-4", dbId: "", name: "104", type: "1BR", status: "occupied", tenant: "A. Smith", x: 680, y: 40, w: 180, h: 120, details: "Premium View" },
    
    // Right Wing
    { id: "demo-5", dbId: "", name: "105", type: "3BR", status: "neardue", tenant: "M. Scott", x: 100, y: 200, w: 280, h: 140, details: "Penthouse Suite", leaseEnd: "Ends in 12d" },
    { id: "demo-6", dbId: "", name: "106", type: "1BR", status: "occupied", tenant: "L. Croft", x: 380, y: 200, w: 180, h: 140, details: "Compact Studio" },
    { id: "demo-7", dbId: "", name: "107", type: "2BR", status: "vacant", x: 560, y: 200, w: 200, h: 140, details: "Renovated Unit" },
    { id: "demo-8", dbId: "", name: "108", type: "1BR", status: "occupied", tenant: "B. Wayne", x: 760, y: 200, w: 180, h: 140, details: "Corner Unit" },
];

export const LEGEND_VISIBILITY_STORAGE_KEY = "ireside.visualPlanner.legendVisible";
export const FLOOR_LAYOUTS_STORAGE_KEY = "ireside.visualPlanner.floorLayouts";
export const ACTIVE_FLOOR_STORAGE_KEY = "ireside.visualPlanner.activeFloor";
export const UNIT_NOTES_STORAGE_KEY = "ireside.visualPlanner.unitNotes";
export const EMPTY_FLOOR_LAYOUT = { units: [], corridors: [], structures: [] };
export const DEFAULT_ACTIVE_FLOOR = "ground";
export const DEFAULT_FLOOR_LAYOUTS = {
    ground: { units: [], corridors: [], structures: [] },
    floor1: { units: [], corridors: [], structures: [] },
};
