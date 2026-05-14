export interface Unit {
    id: string;       // local canvas id (same as dbId for real units)
    dbId: string;     // real UUID from `units` table
    name: string;
    type: "Studio" | "1BR" | "2BR" | "3BR";
    status: "occupied" | "vacant" | "maintenance" | "neardue";
    tenant?: string;
    tenantAvatarUrl?: string;
    tenantAvatarBgColor?: string;
    x: number;
    y: number;
    w: number;
    h: number;
    details?: string;
    areaSqm?: number;
    bedrooms?: number;
    baths?: number;
    kitchens?: number;
    flipX?: boolean;
    flipY?: boolean;
    leaseStart?: string;
    leaseEnd?: string;
    maintenanceDate?: string;
    maintenanceTitle?: string;
    maintenanceDescription?: string;
    maintenanceStatus?: string;
    floor?: number;   // DB floor number
    applicationCount?: number;
}

/** Shape returned by GET /api/landlord/unit-map */
export interface DbUnit {
    id: string;
    name: string;
    floor: number;
    status: string;
    rent_amount: number;
    beds: number;
    baths: number;
    sqft: number | null;
    position: {
        unit_id: string;
        floor_key: string;
        x: number;
        y: number;
        w: number;
        h: number;
    } | null;
    tenant_name?: string;
    tenant_avatar_url?: string;
    tenant_avatar_bg_color?: string;
    lease_start?: string;
    lease_end?: string;
    maintenance_title?: string;
    maintenance_description?: string;
    maintenance_created_at?: string;
    maintenance_status?: string;
    application_count?: number;
}

export interface FloorConfig {
    id: string;
    floor_number: number;
    floor_key: string;
    display_name: string | null;
    sort_order: number;
}

export interface Corridor {
    id: string;
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

export type FloorId = string;

export interface FloorLayout {
    name?: string;
    units: Unit[];
    corridors: Corridor[];
    structures: Structure[];
    extraWidth?: number;
    extraHeight?: number;
}

export type CorridorResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export type SidebarBlockType = "studio" | "1br" | "2br" | "3br" | "corridor" | "elevator" | "stair-straight" | "stair-l" | "stair-u" | "stair-spiral" | "facility-function" | "facility-studio";
export type CanvasItemKind = "unit" | "corridor" | "structure";

export interface Structure {
    id: string;
    type: "elevator" | "stairwell" | "facility";
    variant?: "straight" | "l-shape" | "u-shape" | "spiral" | "function-room" | "studio";
    rotation?: number;
    flipX?: boolean;
    flipY?: boolean;
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface SelectedCanvasItem {
    kind: CanvasItemKind;
    id: string;
}

export interface PendingDeleteState {
    item: SelectedCanvasItem;
    source: "keyboard" | "trash";
}

export interface DragPointerOffsetState {
    kind: CanvasItemKind;
    id: string;
    x: number;
    y: number;
}

export interface DragPlacementState {
    kind: CanvasItemKind;
    id: string;
    isValid: boolean;
    isMagnetic: boolean;
}

export interface SidebarBlockGhost {
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

export type QuickActionType = "start-maintenance" | "manage-maintenance" | "mark-occupied" | "view-lease" | "renew-lease" | "create-invoice" | "unit-maintenance";

export interface QuickActionGuardResult {
    allowed: boolean;
    requiresConfirmation: boolean;
    nextStatus?: Unit["status"];
    reason?: string;
    confirmMessage?: string;
}

export interface TenantActionMenuState {
    isOpen: boolean;
}

export type UnitNotesState = Record<string, string>;
