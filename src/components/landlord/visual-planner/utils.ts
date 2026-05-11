import { Unit, DbUnit, QuickActionType, QuickActionGuardResult, FloorId } from "./types";

/** Size in pixels for newly placed units by DB bed-count */
export const UNIT_SIZE_BY_BEDS: Record<number, { w: number; h: number }> = {
    0: { w: 180, h: 120 }, // Studio
    1: { w: 200, h: 140 },
    2: { w: 220, h: 140 },
    3: { w: 280, h: 140 },
};

/** Derive a canvas Unit type from DB beds count */
export const unitTypeFromBeds = (beds: number): Unit["type"] => {
    if (beds === 0) return "Studio";
    if (beds === 2) return "2BR";
    if (beds >= 3) return "3BR";
    return "1BR";
};

/** Convert a DbUnit (placed) into a canvas Unit */
export const dbUnitToCanvasUnit = (dbUnit: DbUnit): Unit => {
    const pos = dbUnit.position!;
    const type = unitTypeFromBeds(dbUnit.beds);
    return {
        id: dbUnit.id,
        dbId: dbUnit.id,
        name: dbUnit.name,
        type,
        status: (dbUnit.status as Unit["status"]) ?? "vacant",
        tenant: dbUnit.tenant_name,
        tenantAvatarUrl: dbUnit.tenant_avatar_url,
        tenantAvatarBgColor: dbUnit.tenant_avatar_bg_color,
        x: pos.x,
        y: pos.y,
        w: pos.w,
        h: pos.h,
        details: dbUnit.maintenance_description || dbUnit.maintenance_title,
        areaSqm: dbUnit.sqft ? Math.round(dbUnit.sqft * 0.092903) : undefined,
        bedrooms: dbUnit.beds,
        baths: dbUnit.baths,
        leaseStart: dbUnit.lease_start,
        leaseEnd: dbUnit.lease_end,
        maintenanceDate: dbUnit.maintenance_created_at,
        maintenanceTitle: dbUnit.maintenance_title,
        maintenanceDescription: dbUnit.maintenance_description,
        maintenanceStatus: dbUnit.maintenance_status,
        floor: dbUnit.floor,
        applicationCount: dbUnit.application_count,
    };
};

export const parseFloorNumber = (floorId: FloorId) => {
    const match = /^floor(\d+)$/i.exec(floorId);
    if (!match) return null;
    const parsed = Number.parseInt(match[1], 10);
    return Number.isFinite(parsed) ? parsed : null;
};

export const getFloorDisplayLabel = (floorId: FloorId, customName?: string) => {
    if (customName) return customName;
    if (floorId === "ground") return "Ground";
    const floorNumber = parseFloorNumber(floorId);
    if (floorNumber !== null) return `Floor ${floorNumber}`;
    return floorId.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatFloorWatermark = (floorId: FloorId, customName?: string) => getFloorDisplayLabel(floorId, customName).toUpperCase();

export const QUICK_ACTIONS_BY_STATUS: Record<Unit["status"], QuickActionType[]> = {
    occupied: ["view-lease", "start-maintenance", "create-invoice", "unit-maintenance"],
    neardue: ["renew-lease", "start-maintenance", "create-invoice", "unit-maintenance"],
    vacant: ["mark-occupied", "start-maintenance", "create-invoice", "unit-maintenance"],
    maintenance: ["manage-maintenance", "mark-occupied", "create-invoice", "unit-maintenance"],
};

export const QUICK_ACTION_META: Record<QuickActionType, { label: string; icon: string }> = {
    "start-maintenance": { label: "Start Repair", icon: "build" },
    "manage-maintenance": { label: "Manage Repair", icon: "engineering" },
    "mark-occupied": { label: "Mark occupied", icon: "check_circle" },
    "view-lease": { label: "View Lease", icon: "description" },
    "renew-lease": { label: "Renew Lease", icon: "history_edu" },
    "create-invoice": { label: "Create Invoice", icon: "receipt_long" },
    "unit-maintenance": { label: "Service logs", icon: "add_task" },
};

export const evaluateQuickAction = (
    unit: Unit,
    action: QuickActionType
): QuickActionGuardResult => {
    const currentStatus = unit.status;
    const validActions = QUICK_ACTIONS_BY_STATUS[currentStatus] ?? [];
    if (!validActions.includes(action)) {
        return {
            allowed: false,
            requiresConfirmation: false,
            reason: `Action is not allowed while unit is ${currentStatus}.`,
        };
    }

    if (action === "start-maintenance") {
        if (unit.maintenanceStatus) {
            return { allowed: false, requiresConfirmation: false, reason: "A maintenance request is already active for this unit." };
        }
        return { allowed: true, requiresConfirmation: false, nextStatus: "maintenance" };
    }

    if (action === "manage-maintenance") {
        return { allowed: true, requiresConfirmation: false };
    }

    if (action === "mark-occupied") {
        return { allowed: true, requiresConfirmation: false, nextStatus: "occupied" };
    }

    if (action === "view-lease" || action === "renew-lease" || action === "create-invoice" || action === "unit-maintenance") {
        return { allowed: true, requiresConfirmation: false };
    }

    return { allowed: false, requiresConfirmation: false };
};
