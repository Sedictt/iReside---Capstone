import { Unit } from "./types";

export const INITIAL_UNITS: Unit[] = [
    // Top Row
    // Demo leases are open-ended (month-to-month) by default; only 105 shows a fixed term nearing its end.
    { id: "demo-1", dbId: "", name: "101", type: "1BR", status: "occupied", tenant: "J. Doe", x: 100, y: 40, w: 200, h: 140, details: "1BR Standard", leaseStart: "2023-01-01", leaseEnd: null, leaseTermType: "open_ended" },
    { id: "demo-2", dbId: "", name: "102", type: "1BR", status: "vacant", x: 320, y: 40, w: 200, h: 140, details: "Ready for Move-in" },
    { id: "demo-3", dbId: "", name: "103", type: "2BR", status: "maintenance", x: 540, y: 40, w: 200, h: 140, details: "Deep Cleaning (ETA: 6h)" },
    { id: "demo-4", dbId: "", name: "104", type: "1BR", status: "occupied", tenant: "A. Smith", x: 760, y: 40, w: 200, h: 140, details: "Premium View", leaseStart: "2024-06-15", leaseEnd: null, leaseTermType: "open_ended" },

    // Bottom Row
    { id: "demo-5", dbId: "", name: "105", type: "3BR", status: "neardue", tenant: "M. Scott", x: 100, y: 220, w: 200, h: 140, details: "Penthouse Suite", leaseStart: "2025-11-01", leaseEnd: "2026-10-31", leaseTermType: "fixed" },
    { id: "demo-6", dbId: "", name: "106", type: "1BR", status: "occupied", tenant: "L. Croft", x: 320, y: 220, w: 200, h: 140, details: "Compact Studio", leaseStart: "2025-03-01", leaseEnd: null, leaseTermType: "open_ended" },
    { id: "demo-7", dbId: "", name: "107", type: "2BR", status: "vacant", x: 540, y: 220, w: 200, h: 140, details: "Renovated Unit" },
    { id: "demo-8", dbId: "", name: "108", type: "1BR", status: "occupied", tenant: "B. Wayne", x: 760, y: 220, w: 200, h: 140, details: "Corner Unit", leaseStart: "2026-01-10", leaseEnd: null, leaseTermType: "open_ended" },
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
