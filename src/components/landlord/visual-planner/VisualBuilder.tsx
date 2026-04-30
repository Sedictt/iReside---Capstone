"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import Link from "next/link";
import styles from "./blueprint.module.css";
// We are using Material Icons via the CDN link in layout.tsx, so we use standard <span> tags for icons.
import { Logo } from "@/components/ui/Logo";
import { useOptionalProperty } from "@/context/PropertyContext";
import dynamic from "next/dynamic";

const WalkInApplicationModal = dynamic(() => import("@/components/landlord/applications/WalkInApplicationModal").then(mod => mod.WalkInApplicationModal), {
    ssr: false,
});

import { TenantInviteManager } from "@/components/landlord/applications/TenantInviteManager";
import { QrCode, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
interface DbUnit {
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

interface FloorConfig {
    id: string;
    floor_number: number;
    floor_key: string;
    display_name: string | null;
    sort_order: number;
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
    extraWidth?: number;
    extraHeight?: number;
}

type CorridorResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";



type SidebarBlockType = "studio" | "1br" | "2br" | "3br" | "corridor" | "elevator" | "stair-straight" | "stair-l" | "stair-u" | "stair-spiral" | "facility-function" | "facility-studio";
type CanvasItemKind = "unit" | "corridor" | "structure";

interface Structure {
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

interface SelectedCanvasItem {
    kind: CanvasItemKind;
    id: string;
}

interface PendingDeleteState {
    item: SelectedCanvasItem;
    source: "keyboard" | "trash";
}

interface DragPointerOffsetState {
    kind: CanvasItemKind;
    id: string;
    x: number;
    y: number;
}

interface DragPlacementState {
    kind: CanvasItemKind;
    id: string;
    isValid: boolean;
    isMagnetic: boolean;
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

type QuickActionType = "start-maintenance" | "manage-maintenance" | "mark-occupied" | "view-lease" | "renew-lease" | "create-invoice" | "unit-maintenance";

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
        dbId: "",
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
        dbId: "",
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
        dbId: "",
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
        dbId: "",
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
// Default layouts are empty â€” real data is loaded from DB
const DEFAULT_FLOOR_LAYOUTS: Record<FloorId, FloorLayout> = {
    ground: { units: [], corridors: [], structures: [] },
    floor1: { units: [], corridors: [], structures: [] },
};

/** Size in pixels for newly placed units by DB bed-count */
const UNIT_SIZE_BY_BEDS: Record<number, { w: number; h: number }> = {
    0: { w: 180, h: 120 }, // Studio
    1: { w: 200, h: 140 },
    2: { w: 220, h: 140 },
    3: { w: 280, h: 140 },
};

/** Derive a canvas Unit type from DB beds count */
const unitTypeFromBeds = (beds: number): Unit["type"] => {
    if (beds === 0) return "Studio";
    if (beds === 2) return "2BR";
    if (beds >= 3) return "3BR";
    return "1BR";
};

/** Convert a DbUnit (placed) into a canvas Unit */
const dbUnitToCanvasUnit = (dbUnit: DbUnit): Unit => {
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
    occupied: ["view-lease", "start-maintenance", "create-invoice", "unit-maintenance"],
    neardue: ["renew-lease", "start-maintenance", "create-invoice", "unit-maintenance"],
    vacant: ["mark-occupied", "start-maintenance", "create-invoice", "unit-maintenance"],
    maintenance: ["manage-maintenance", "mark-occupied", "create-invoice", "unit-maintenance"],
};

const QUICK_ACTION_META: Record<QuickActionType, { label: string; icon: string }> = {
    "start-maintenance": { label: "Start Repair", icon: "build" },
    "manage-maintenance": { label: "Manage Repair", icon: "engineering" },
    "mark-occupied": { label: "Mark occupied", icon: "check_circle" },
    "view-lease": { label: "View Lease", icon: "description" },
    "renew-lease": { label: "Renew Lease", icon: "history_edu" },
    "create-invoice": { label: "Create Invoice", icon: "receipt_long" },
    "unit-maintenance": { label: "Service logs", icon: "add_task" },
};

const evaluateQuickAction = (
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

/** Unit History Modal Component */
const UnitHistoryModal = ({
    isOpen,
    onClose,
    unit
}: {
    isOpen: boolean;
    onClose: () => void;
    unit: Unit | null;
}) => {
    const [activeTab, setActiveTab] = useState<"tenants" | "maintenance">("tenants");
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    if (!unit) return null;

    // Mock data for history
    const tenantHistory = [
        { id: '1', name: 'James Wilson', leaseStart: '2025-01-01', leaseEnd: '2026-01-01', rent: 1200, status: 'Completed', avatarBg: 'bg-indigo-500' },
        { id: '2', name: 'Elena Rodriguez', leaseStart: '2024-01-01', leaseEnd: '2025-01-01', rent: 1150, status: 'Completed', avatarBg: 'bg-emerald-500' },
        { id: '3', name: 'Marcus Chen', leaseStart: '2023-01-01', leaseEnd: '2024-01-01', rent: 1100, status: 'Terminated Early', avatarBg: 'bg-rose-500' },
    ];

    const maintenanceHistory = [
        { id: 'm1', title: 'AC Filter Replacement', date: '2026-02-15', status: 'Completed', cost: 45, description: 'Routine filter change and system cleaning.' },
        { id: 'm2', title: 'Leaky Faucet Repair', date: '2025-11-20', status: 'Completed', cost: 80, description: 'Kitchen sink faucet replacement due to persistent drip.' },
        { id: 'm3', title: 'Wall Repainting', date: '2025-01-05', status: 'Completed', cost: 350, description: 'Full room repainting before new tenant move-in.' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/60 backdrop-blur-md" 
                        onClick={onClose}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`relative w-full max-w-2xl h-[600px] flex flex-col rounded-3xl border border-border bg-card shadow-[0_24px_60px_-30px_rgba(0,0,0,0.3)] overflow-hidden`}
                    >
                        <div className="absolute right-6 top-6 z-10">
                            <button onClick={onClose} className={`rounded-full p-2 transition-colors hover:bg-muted text-muted-foreground`}>
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-8 pb-4">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <span className="material-icons-round text-2xl">history</span>
                                </div>
                                <div>
                                    <h2 className={`text-2xl font-black tracking-tight text-foreground`}>
                                        Unit {unit.name} History
                                    </h2>
                                    <p className={`text-sm font-medium text-muted-foreground`}>Full audit trail and historical logs</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 mb-4">
                            <div className="flex gap-2 p-1.5 rounded-2xl bg-muted w-fit">
                                <button 
                                    onClick={() => setActiveTab("tenants")}
                                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "tenants" ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Tenants
                                </button>
                                <button 
                                    onClick={() => setActiveTab("maintenance")}
                                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "maintenance" ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Maintenance
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar-premium">
                            <div className="space-y-4">
                                {activeTab === "tenants" ? (
                                    tenantHistory.map((item) => (
                                        <div key={item.id} className={`flex items-center gap-4 p-5 rounded-2xl border border-border bg-muted/30 transition-colors hover:bg-muted/50`}>
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-black ${item.avatarBg}`}>
                                                {item.name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-sm font-black text-foreground`}>{item.name}</p>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                                                        item.status === 'Completed' 
                                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-bold text-muted-foreground mt-1">
                                                    {new Date(item.leaseStart).toLocaleDateString()} &mdash; {new Date(item.leaseEnd).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xs font-black text-foreground`}>₱{item.rent.toLocaleString()}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground">Monthly Rent</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    maintenanceHistory.map((item) => (
                                        <div key={item.id} className={`flex items-center gap-4 p-5 rounded-2xl border border-border bg-muted/30 transition-colors hover:bg-muted/50`}>
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                                <span className="material-icons-round text-xl">engineering</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-sm font-black text-foreground`}>{item.title}</p>
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-bold text-muted-foreground mt-1">{new Date(item.date).toLocaleDateString()} &bull; {item.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xs font-black text-foreground`}>₱{item.cost.toLocaleString()}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground">Cost</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="p-8 border-t border-border bg-muted/20">
                            <button 
                                onClick={onClose}
                                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-[0.2em] transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-primary/20"
                            >
                                Close History View
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

/** Complaint Modal Component */
const ComplaintModal = ({
    isOpen,
    onClose,
    unit,
    isDark
}: {
    isOpen: boolean;
    onClose: () => void;
    unit: Unit | null;
    isDark: boolean;
}) => {
    const [complaintType, setComplaintType] = useState<string>("");
    const [customComplaint, setCustomComplaint] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!unit) return null;

    const predefinedComplaints = [
        "Noise Complain",
        "Bad odor",
        "Waste Complain",
        "Maintenance Issue",
        "Unauthorized Occupant",
        "Please specify"
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Mock submission
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
                setComplaintType("");
                setCustomComplaint("");
                setAttachment(null);
            }, 2000);
        }, 1500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/60 backdrop-blur-md" 
                        onClick={onClose}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`relative w-full max-w-lg flex flex-col rounded-[2.5rem] border border-border bg-card shadow-[0_32px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden`}
                    >
                        <div className="absolute right-6 top-6 z-10">
                            <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-muted text-muted-foreground">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-8 pb-4">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                                    <span className="material-icons-round text-3xl">report_problem</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight text-foreground">
                                        Submit a Complaint
                                    </h2>
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Unit {unit.name}</p>
                                </div>
                            </div>

                            {isSuccess ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-12 px-6 text-center"
                                >
                                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
                                        <span className="material-icons-round text-5xl">check_circle</span>
                                    </div>
                                    <h3 className="text-xl font-black text-foreground mb-2">Complaint Received</h3>
                                    <p className="text-muted-foreground">Thank you for your report. Our team will investigate this matter immediately.</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Nature of Complaint</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {predefinedComplaints.map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setComplaintType(type)}
                                                    className={`px-4 py-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                                                        complaintType === type 
                                                            ? 'border-primary bg-primary/5 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]' 
                                                            : 'border-border bg-muted/30 text-muted-foreground hover:border-neutral-400'
                                                    }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {complaintType === "Please specify" && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-3"
                                        >
                                            <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Details</label>
                                            <textarea
                                                required
                                                value={customComplaint}
                                                onChange={(e) => setCustomComplaint(e.target.value)}
                                                placeholder="Please describe the issue in detail..."
                                                className="w-full min-h-[120px] rounded-2xl border border-border bg-muted/20 px-5 py-4 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                            />
                                        </motion.div>
                                    )}

                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Evidence / Photos</label>
                                        <div 
                                            className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all p-8 flex flex-col items-center justify-center gap-3 ${
                                                attachment ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-muted/30'
                                            }`}
                                            onClick={() => document.getElementById('photo-upload')?.click()}
                                        >
                                            <input 
                                                id="photo-upload"
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                                            />
                                            {attachment ? (
                                                <>
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                                                        <span className="material-icons-round text-2xl">image</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-black text-foreground">{attachment.name}</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                                            {(attachment.size / 1024 / 1024).toFixed(2)} MB &bull; Click to change
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <span className="material-icons-round text-2xl">add_a_photo</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-black text-foreground">Upload Evidence</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">JPG, PNG up to 10MB</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !complaintType}
                                        className="w-full py-5 rounded-2xl bg-primary text-primary-foreground text-sm font-black uppercase tracking-[0.2em] transition-all hover:opacity-90 active:scale-[0.98] shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="material-icons-round animate-spin">refresh</span>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Submit Complaint
                                                <span className="material-icons-round">send</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                        <div className="h-4 bg-rose-500/10 w-full" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

/** Unit Tooltip Component */
const UnitTooltip = ({
    unit,
    onClose,
    onAction,
    isDark
}: {
    unit: Unit;
    onClose: () => void;
    onAction: (action: "transfer" | "complain") => void;
    isDark: boolean;
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className={`absolute z-50 min-w-[220px] rounded-2xl border border-white/10 bg-[#1a1c23]/95 backdrop-blur-xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.4)] pointer-events-auto`}
            data-tooltip="true"
            onPointerDown={(e) => e.stopPropagation()}
            style={{
                left: unit.x + unit.w / 2,
                top: unit.y - 10,
                transform: "translateX(-50%) translateY(-100%)"
            }}
        >
            <div className="flex flex-col gap-1">
                <div className="px-3 py-2 mb-1 border-b border-white/5">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Unit {unit.name}</p>
                    <p className="text-xs font-bold text-white mt-0.5">Quick Actions</p>
                </div>
                
                {unit.status === 'vacant' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAction("transfer");
                            onClose();
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all text-left"
                    >
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <span className="material-icons-round text-lg">move_down</span>
                        </div>
                        <div>
                            <p className="text-xs font-black tracking-tight">Transfer Request</p>
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Move into this unit</p>
                        </div>
                    </button>
                )}

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAction("complain");
                        onClose();
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all text-left"
                >
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                        <span className="material-icons-round text-lg">report_problem</span>
                    </div>
                    <div>
                        <p className="text-xs font-black tracking-tight">Report / Complain</p>
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Report an issue</p>
                    </div>
                </button>
            </div>

            {/* Tooltip arrow */}
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a1c23] rotate-45 border-r border-b border-white/10" />
        </motion.div>
    );
};

/** Transfer Request Modal Component */
const TransferRequestModal = ({
    isOpen,
    onClose,
    unit,
    isDark,
    onSubmit,
    isSubmitting,
    success,
    error,
    reason,
    setReason
}: {
    isOpen: boolean;
    onClose: () => void;
    unit: Unit | null;
    isDark: boolean;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
    success: boolean;
    error: string | null;
    reason: string;
    setReason: (val: string) => void;
}) => {
    if (!unit) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/60 backdrop-blur-md" 
                        onClick={onClose}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`relative w-full max-w-lg flex flex-col rounded-[2.5rem] border border-border bg-card shadow-[0_32px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden`}
                    >
                        <div className="absolute right-6 top-6 z-10">
                            <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-muted text-muted-foreground">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <span className="material-icons-round text-3xl">move_down</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight text-foreground">
                                        Transfer Request
                                    </h2>
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Target Unit {unit.name}</p>
                                </div>
                            </div>

                            {success ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-12 px-6 text-center"
                                >
                                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
                                        <span className="material-icons-round text-5xl">check_circle</span>
                                    </div>
                                    <h3 className="text-xl font-black text-foreground mb-2">Request Submitted</h3>
                                    <p className="text-muted-foreground">Your transfer request for Unit {unit.name} has been sent to the administration for review.</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={onSubmit} className="space-y-8">
                                    <div className="p-5 rounded-2xl bg-muted/30 border border-border">
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            You are requesting to transfer your current lease to <span className="font-bold text-foreground">Unit {unit.name}</span>. This request is subject to eligibility checks and landlord approval.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Transfer Justification</label>
                                        <textarea
                                            required
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="Please explain why you'd like to transfer (e.g., needing more space, preferred floor...)"
                                            className="w-full min-h-[140px] rounded-2xl border border-border bg-muted/20 px-5 py-4 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                        />
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                                            <span className="material-icons-round text-lg">error_outline</span>
                                            <p className="text-xs font-bold">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-5 rounded-2xl bg-primary text-primary-foreground text-sm font-black uppercase tracking-[0.2em] transition-all hover:opacity-90 active:scale-[0.98] shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="material-icons-round animate-spin">refresh</span>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Submit Request
                                                <span className="material-icons-round">arrow_forward</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                        <div className="h-4 bg-primary/10 w-full" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default function VisualBuilder({ readOnly = false, propertyId: externalPropertyId }: { readOnly?: boolean; propertyId?: string } = {}) {
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
    const [units, setUnits] = useState<Unit[]>([]);
    const [isPropertyMenuOpen, setIsPropertyMenuOpen] = useState(false);
    const [isHUDHidden, setIsHUDHidden] = useState(false);
    const [isLayoutLocked, setIsLayoutLocked] = useState(false);
    const [showHotkeys, setShowHotkeys] = useState(false);
    const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
    const [isMinimapDragging, setIsMinimapDragging] = useState(false);
    // DB-driven state
    const [dbUnits, setDbUnits] = useState<DbUnit[]>([]);
    const [floorConfigs, setFloorConfigs] = useState<FloorConfig[]>([]);
    const [isLoadingMap, setIsLoadingMap] = useState(false);
    const [mapLoadError, setMapLoadError] = useState<string | null>(null);
    const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
    const [placedCount, setPlacedCount] = useState(0);
    const [totalDbUnits, setTotalDbUnits] = useState(0);
    // Unplaced units: DB units not yet on the canvas
    const [unplacedDbUnits, setUnplacedDbUnits] = useState<DbUnit[]>([]);

    const [viewportSize, setViewportSize] = useState({ width: 1280, height: 900 });
    const [showOverlapToast, setShowOverlapToast] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [dragPlacement, setDragPlacement] = useState<DragPlacementState | null>(null);
    const [corridors, setCorridors] = useState<Corridor[]>([]);
    const [structures, setStructures] = useState<Structure[]>([]);
    const [selectedItem, setSelectedItem] = useState<SelectedCanvasItem | null>(null);
    const [pendingDelete, setPendingDelete] = useState<PendingDeleteState | null>(null);
    const [pendingClearFloor, setPendingClearFloor] = useState(false);
    const [presetConfirm, setPresetConfirm] = useState<{ isOpen: boolean; presetType: "double-loaded" | "u-shape" | "l-shape" | "single-loaded" | null }>({ isOpen: false, presetType: null });
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
    const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
    const [complaintUnit, setComplaintUnit] = useState<Unit | null>(null);
    const [tooltipUnit, setTooltipUnit] = useState<Unit | null>(null);
    const [tenantInvites, setTenantInvites] = useState<any[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        setHasMounted(true);
    }, []);
    // ---------------------------------------------------------------
    // Load real data from DB when a property is selected
    // ---------------------------------------------------------------
    useEffect(() => {
        const fetchInvites = async () => {
            try {
                const res = await fetch("/api/landlord/invites");
                if (res.ok) {
                    const data = await res.json();
                    setTenantInvites(data.invites || []);
                }
            } catch (err) {
                console.error("Failed to fetch invites:", err);
            }
        };
        fetchInvites();
    }, [refreshKey]);
    useEffect(() => {
        if (!selectedPropertyId || selectedPropertyId === "all") return;

        const controller = new AbortController();
        setIsLoadingMap(true);
        setMapLoadError(null);

        const load = async () => {
            try {
                const endpoint = readOnly 
                    ? "/api/tenant/unit-map" 
                    : `/api/landlord/unit-map?propertyId=${selectedPropertyId}`;
                
                const res = await fetch(endpoint, {
                    signal: controller.signal,
                });
                if (!res.ok) {
                    const err = (await res.json()) as { error?: string };
                    throw new Error(err.error ?? "Failed to load unit map");
                }
                const data = await res.json() as {
                    floorConfigs: FloorConfig[];
                    units: DbUnit[];
                    mapDecorations: Record<string, { corridors?: Corridor[]; structures?: Structure[] }>;
                    isSetupComplete: boolean;
                    placedCount: number;
                    totalUnits: number;
                };

                setDbUnits(data.units);
                setFloorConfigs(data.floorConfigs);
                setIsSetupComplete(data.isSetupComplete);
                setPlacedCount(data.placedCount);
                setTotalDbUnits(data.totalUnits);

                const unplaced = data.units.filter((u: DbUnit) => u.position === null);
                setUnplacedDbUnits(unplaced);

                const newFloorLayouts: Record<FloorId, FloorLayout> = {};
                for (const fc of data.floorConfigs) {
                    newFloorLayouts[fc.floor_key] = {
                        name: fc.display_name ?? undefined,
                        units: [],
                        corridors: (data.mapDecorations[fc.floor_key]?.corridors ?? []) as Corridor[],
                        structures: (data.mapDecorations[fc.floor_key]?.structures ?? []) as Structure[],
                    };
                }
                if (Object.keys(newFloorLayouts).length === 0) {
                    newFloorLayouts["floor1"] = { units: [], corridors: [], structures: [] };
                }
                for (const dbUnit of data.units) {
                    if (!dbUnit.position) continue;
                    const fk = dbUnit.position.floor_key;
                    if (!newFloorLayouts[fk]) newFloorLayouts[fk] = { units: [], corridors: [], structures: [] };
                    newFloorLayouts[fk].units.push(dbUnitToCanvasUnit(dbUnit));
                }
                setFloorLayouts(newFloorLayouts);
                const storedActiveFloor = typeof window !== "undefined"
                    ? window.localStorage.getItem(SCOPED_ACTIVE_FLOOR_KEY)
                    : null;
                const orderedFloorKeys = Array.from(new Set([
                    ...data.floorConfigs.map((fc) => fc.floor_key),
                    ...Object.keys(newFloorLayouts),
                ]));
                const firstPopulatedFloorKey = orderedFloorKeys.find((floorKey) => {
                    const layout = newFloorLayouts[floorKey];
                    return Boolean(layout) && (layout.units.length > 0 || layout.corridors.length > 0 || layout.structures.length > 0);
                });
                const initialFloorKey = (
                    storedActiveFloor && newFloorLayouts[storedActiveFloor]
                        ? storedActiveFloor
                        : firstPopulatedFloorKey
                            ?? data.floorConfigs[0]?.floor_key
                            ?? orderedFloorKeys[0]
                            ?? "floor1"
                );
                setActiveFloor(initialFloorKey);
                setUnits(newFloorLayouts[initialFloorKey]?.units ?? []);
                setCorridors(newFloorLayouts[initialFloorKey]?.corridors ?? []);
                setStructures(newFloorLayouts[initialFloorKey]?.structures ?? []);
                setHasHydratedFloorState(true);
            } catch (err) {
                if ((err as Error).name === "AbortError") return;
                setMapLoadError((err as Error).message);
            } finally {
                if (!controller.signal.aborted) setIsLoadingMap(false);
            }
        };
        void load();
        return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPropertyId, refreshKey]);

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
    const dragPointerOffsetRef = useRef<DragPointerOffsetState | null>(null);
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

    const flipSelectedItem = useCallback((axis: 'x' | 'y') => {
        if (!selectedItem) return;
        if (selectedItem.kind === "unit") {
            setUnits(prev => prev.map(u => u.id === selectedItem.id ? { ...u, [axis === 'x' ? 'flipX' : 'flipY']: !u[axis === 'x' ? 'flipX' : 'flipY'] } : u));
        } else if (selectedItem.kind === "structure") {
            setStructures(prev => prev.map(s => s.id === selectedItem.id ? { ...s, [axis === 'x' ? 'flipX' : 'flipY']: !s[axis === 'x' ? 'flipX' : 'flipY'] } : s));
        }
    }, [selectedItem]);

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

    const toggleFullscreen = () => {
        setIsCanvasFullscreen(prev => !prev);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            const key = e.key.toLowerCase();

            // Fullscreen toggle (F)
            if (key === 'f' && !e.ctrlKey && !e.metaKey) {
                toggleFullscreen();
            }
            // HUD toggle (H)
            if (key === 'h' && !e.ctrlKey && !e.metaKey) {
                setIsHUDHidden(prev => !prev);
            }
            // Lock toggle (L)
            if (key === 'l' && !e.ctrlKey && !e.metaKey) {
                setIsLayoutLocked(prev => !prev);
            }
            // Hotkeys hint (?)
            if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
                setShowHotkeys(prev => !prev);
            }
            // Escape to close modals/hints
            if (e.key === 'Escape') {
                setShowHotkeys(false);
                if (isHUDHidden) setIsHUDHidden(false);
                if (isCanvasFullscreen) setIsCanvasFullscreen(false);
            }
            // Undo (Ctrl+Z)
            if (e.ctrlKey && key === 'z') {
                performUndo();
            }
            // Flip Horizontal (X)
            if (key === 'x' && !e.ctrlKey && !e.metaKey) {
                flipSelectedItem('x');
            }
            // Flip Vertical (Y)
            if (key === 'y' && !e.ctrlKey && !e.metaKey) {
                flipSelectedItem('y');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isHUDHidden, isCanvasFullscreen, performUndo, flipSelectedItem]);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('hide-sidebars', { detail: isCanvasFullscreen }));
    }, [isCanvasFullscreen]);

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
    const MAGNETIC_SNAP_DISTANCE = Math.max(12, Math.round(GRID_SIZE * 0.8));
    const getSnappedRectPosition = (rawX: number, rawY: number, width: number, height: number) => {
        const snappedX = snapToGrid(rawX);
        const snappedY = snapToGrid(rawY);
        return {
            x: clampUnitAxis(snappedX, width, BLUEPRINT_WIDTH),
            y: clampUnitAxis(snappedY, height, BLUEPRINT_HEIGHT),
        };
    };
    const getWorldPointFromClientPoint = useCallback((clientX: number, clientY: number) => {
        const container = containerRef.current;
        if (!container) return null;

        const containerRect = container.getBoundingClientRect();
        
        const worldX = (clientX - containerRect.left - position.x) / scale - BLUEPRINT_MARGIN;
        const worldY = (clientY - containerRect.top - position.y) / scale - BLUEPRINT_MARGIN;
        
        return { x: worldX, y: worldY };
    }, [scale, position]);

    const setDragPointerAnchor = useCallback(
        (kind: CanvasItemKind, id: string, itemX: number, itemY: number, pointerX: number, pointerY: number) => {
            const worldPoint = getWorldPointFromClientPoint(pointerX, pointerY);
            if (!worldPoint) {
                dragPointerOffsetRef.current = null;
                return;
            }

            dragPointerOffsetRef.current = {
                kind,
                id,
                x: worldPoint.x - itemX,
                y: worldPoint.y - itemY,
            };
        },
        [getWorldPointFromClientPoint]
    );

    const getDraggedItemRawPosition = useCallback(
        (
            kind: CanvasItemKind,
            id: string,
            pointerX: number,
            pointerY: number,
            fallbackX: number,
            fallbackY: number
        ) => {
            const worldPoint = getWorldPointFromClientPoint(pointerX, pointerY);
            const dragPointerOffset = dragPointerOffsetRef.current;

            if (!worldPoint || !dragPointerOffset || dragPointerOffset.kind !== kind || dragPointerOffset.id !== id) {
                return { x: fallbackX, y: fallbackY };
            }

            return {
                x: worldPoint.x - dragPointerOffset.x,
                y: worldPoint.y - dragPointerOffset.y,
            };
        },
        [getWorldPointFromClientPoint]
    );

    const clearDragPointerAnchor = useCallback((kind: CanvasItemKind, id: string) => {
        const current = dragPointerOffsetRef.current;
        if (current && current.kind === kind && current.id === id) {
            dragPointerOffsetRef.current = null;
        }
    }, []);

    const setDragPlacementIndicator = useCallback((kind: CanvasItemKind, id: string, isValid: boolean, isMagnetic: boolean) => {
        setDragPlacement((current) => {
            if (
                current &&
                current.kind === kind &&
                current.id === id &&
                current.isValid === isValid &&
                current.isMagnetic === isMagnetic
            ) {
                return current;
            }
            return { kind, id, isValid, isMagnetic };
        });
    }, []);

    const rangesOverlapWithTolerance = (startA: number, endA: number, startB: number, endB: number, tolerance = GRID_SIZE / 2) => (
        startA < endB + tolerance && endA > startB - tolerance
    );

    const resolveDragPlacement = (
        kind: CanvasItemKind,
        id: string,
        width: number,
        height: number,
        pointerX: number,
        pointerY: number,
        fallbackX: number,
        fallbackY: number
    ) => {
        const rawPosition = getDraggedItemRawPosition(kind, id, pointerX, pointerY, fallbackX, fallbackY);
        const basePosition = getSnappedRectPosition(rawPosition.x, rawPosition.y, width, height);
        const ignoredItem = { kind, id } satisfies SelectedCanvasItem;

        const targets = [
            ...units
                .filter((unit) => !(kind === "unit" && unit.id === id))
                .map((unit) => ({ x: unit.x, y: unit.y, w: unit.w, h: unit.h })),
            ...corridors
                .filter((corridor) => !(kind === "corridor" && corridor.id === id))
                .map((corridor) => ({ x: corridor.x, y: corridor.y, w: corridor.w, h: corridor.h })),
            ...structures
                .filter((structure) => !(kind === "structure" && structure.id === id))
                .map((structure) => ({ x: structure.x, y: structure.y, w: structure.w, h: structure.h })),
        ];

        const candidateXMap = new Map<number, number>();
        const candidateYMap = new Map<number, number>();
        const movingRect = { x: basePosition.x, y: basePosition.y, w: width, h: height };
        const movingLeft = movingRect.x;
        const movingRight = movingRect.x + movingRect.w;
        const movingTop = movingRect.y;
        const movingBottom = movingRect.y + movingRect.h;

        const registerCandidate = (map: Map<number, number>, value: number, delta: number, size: number, maxSize: number) => {
            if (delta > MAGNETIC_SNAP_DISTANCE) return;
            const clampedValue = clampUnitAxis(value, size, maxSize);
            const currentBest = map.get(clampedValue);
            if (currentBest === undefined || delta < currentBest) {
                map.set(clampedValue, delta);
            }
        };

        targets.forEach((target) => {
            const targetLeft = target.x;
            const targetRight = target.x + target.w;
            const targetTop = target.y;
            const targetBottom = target.y + target.h;

            if (rangesOverlapWithTolerance(movingTop, movingBottom, targetTop, targetBottom)) {
                registerCandidate(candidateXMap, targetLeft - width, Math.abs(movingRight - targetLeft), width, BLUEPRINT_WIDTH);
                registerCandidate(candidateXMap, targetRight, Math.abs(movingLeft - targetRight), width, BLUEPRINT_WIDTH);
                registerCandidate(candidateXMap, targetLeft, Math.abs(movingLeft - targetLeft), width, BLUEPRINT_WIDTH);
                registerCandidate(candidateXMap, targetRight - width, Math.abs(movingRight - targetRight), width, BLUEPRINT_WIDTH);
            }

            if (rangesOverlapWithTolerance(movingLeft, movingRight, targetLeft, targetRight)) {
                registerCandidate(candidateYMap, targetTop - height, Math.abs(movingBottom - targetTop), height, BLUEPRINT_HEIGHT);
                registerCandidate(candidateYMap, targetBottom, Math.abs(movingTop - targetBottom), height, BLUEPRINT_HEIGHT);
                registerCandidate(candidateYMap, targetTop, Math.abs(movingTop - targetTop), height, BLUEPRINT_HEIGHT);
                registerCandidate(candidateYMap, targetBottom - height, Math.abs(movingBottom - targetBottom), height, BLUEPRINT_HEIGHT);
            }
        });

        const xCandidates = Array.from(candidateXMap.entries())
            .map(([value, distance]) => ({ value, distance }))
            .sort((a, b) => a.distance - b.distance);
        const yCandidates = Array.from(candidateYMap.entries())
            .map(([value, distance]) => ({ value, distance }))
            .sort((a, b) => a.distance - b.distance);

        const magneticCandidates = [
            ...xCandidates.map(({ value, distance }) => ({
                x: value,
                y: basePosition.y,
                distance,
                snappedAxes: 1,
            })),
            ...yCandidates.map(({ value, distance }) => ({
                x: basePosition.x,
                y: value,
                distance,
                snappedAxes: 1,
            })),
            ...xCandidates.flatMap(({ value: x, distance: xDistance }) =>
                yCandidates.map(({ value: y, distance: yDistance }) => ({
                    x,
                    y,
                    distance: xDistance + yDistance,
                    snappedAxes: 2,
                }))
            ),
        ].sort((a, b) => b.snappedAxes - a.snappedAxes || a.distance - b.distance);

        for (const candidate of magneticCandidates) {
            const hasCollision = hasCollisionWithPlacedItems(
                { x: candidate.x, y: candidate.y, w: width, h: height },
                ignoredItem
            );
            if (!hasCollision) {
                return {
                    x: candidate.x,
                    y: candidate.y,
                    isValid: true,
                    isMagnetic: true,
                };
            }
        }

        const isValid = !hasCollisionWithPlacedItems(
            { x: basePosition.x, y: basePosition.y, w: width, h: height },
            ignoredItem
        );

        return {
            x: basePosition.x,
            y: basePosition.y,
            isValid,
            isMagnetic: false,
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

    function hasCollisionWithPlacedItems(
        rect: { x: number; y: number; w: number; h: number },
        ignoredItem?: SelectedCanvasItem
    ) {
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
    }

    const handleCorridorResizeStart = (corridor: Corridor, handle: CorridorResizeHandle) => (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        setSelectedItem({ kind: "corridor", id: corridor.id });
        setResizingCorridorId(corridor.id);

        const startPointerX = e.clientX;
        const startPointerY = e.clientY;
        const startWorldPoint = getWorldPointFromClientPoint(startPointerX, startPointerY);
        const startLeft = corridor.x;
        const startTop = corridor.y;
        const startRight = corridor.x + corridor.w;
        const startBottom = corridor.y + corridor.h;
        const minSize = GRID_SIZE * 2;

        const onPointerMove = (moveEvent: PointerEvent) => {
            const moveWorldPoint = getWorldPointFromClientPoint(moveEvent.clientX, moveEvent.clientY);
            const deltaX = moveWorldPoint && startWorldPoint
                ? moveWorldPoint.x - startWorldPoint.x
                : (moveEvent.clientX - startPointerX) / scaleRef.current;
            const deltaY = moveWorldPoint && startWorldPoint
                ? moveWorldPoint.y - startWorldPoint.y
                : (moveEvent.clientY - startPointerY) / scaleRef.current;

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
        const nextUnits = nextLayout.units;
        const nextCorridors = nextLayout.corridors;
        const nextStructures = nextLayout.structures;
        const savedExtraW = nextLayout.extraWidth ?? 0;
        const savedExtraH = nextLayout.extraHeight ?? 0;

        setFloorLayouts((prev) => ({
            ...prev,
            [activeFloor]: snapshot,
        }));

        setUnits(nextUnits);
        setCorridors(nextCorridors);
        setStructures(nextStructures);
        setExtraDimensions({ width: savedExtraW, height: savedExtraH });

        setActiveFloor(nextFloor);
        setSelectedItem(null);
        setDragPlacement(null);
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
        setDragPlacement(null);
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
        if ((e.target as HTMLElement).closest('[data-tooltip="true"]')) return;

        setSelectedItem(null);
        setTooltipUnit(null);

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

    const getClientPointFromDragEvent = (event: MouseEvent | TouchEvent | PointerEvent) => {
        if ("clientX" in event && "clientY" in event) {
            return { x: event.clientX, y: event.clientY };
        }

        if ("touches" in event && event.touches.length > 0) {
            return {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
            };
        }

        if ("changedTouches" in event && event.changedTouches.length > 0) {
            return {
                x: event.changedTouches[0].clientX,
                y: event.changedTouches[0].clientY,
            };
        }

        return null;
    };

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

    const restoreUnitsToUnplaced = useCallback((unitIds: string[]) => {
        if (unitIds.length === 0) return;

        const targetIds = new Set(unitIds);
        const matchingDbUnits = dbUnits.filter((dbUnit) => targetIds.has(dbUnit.id));
        if (matchingDbUnits.length === 0) return;

        setUnplacedDbUnits((prev) => {
            const existingIds = new Set(prev.map((unit) => unit.id));
            const nextUnits = matchingDbUnits.filter((unit) => !existingIds.has(unit.id));
            return nextUnits.length > 0 ? [...prev, ...nextUnits] : prev;
        });
    }, [dbUnits]);

    const deleteCanvasItem = (item: SelectedCanvasItem) => {
        if (item.kind === "unit") {
            const unitToDelete = units.find(u => u.id === item.id);
            setUnits(prev => prev.filter(unit => unit.id !== item.id));
            
            // If it was a DB unit, return it to unplaced list
            if (unitToDelete?.dbId) {
                restoreUnitsToUnplaced([unitToDelete.dbId]);
            }
        } else if (item.kind === "corridor") {
            setCorridors(prev => prev.filter(corridor => corridor.id !== item.id));
        } else {
            setStructures(prev => prev.filter(structure => structure.id !== item.id));
        }
    };

    const executeClearCanvas = useCallback(() => {
        if (units.length === 0 && corridors.length === 0 && structures.length === 0) return;

        restoreUnitsToUnplaced(
            units
                .map((unit) => unit.dbId)
                .filter((dbId): dbId is string => Boolean(dbId))
        );

        setUnits([]);
        setCorridors([]);
        setStructures([]);
        setSelectedItem(null);
        setPendingDelete(null);
        setDragPlacement(null);
        setDraggingUnitId(null);
        setDraggingCorridorId(null);
        setDraggingStructureId(null);
        setIsTrashHot(false);
    }, [corridors.length, restoreUnitsToUnplaced, structures.length, units]);

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
        const nextIsHot = isPointerNearTrash(pointX, pointY);
        setIsTrashHot((current) => (current === nextIsHot ? current : nextIsHot));
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
        // Skip localStorage hydration when DB takes over
        if (selectedPropertyId && selectedPropertyId !== "all") return;
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
                extraWidth: extraDimensions.width,
                extraHeight: extraDimensions.height,
            },
        };

        window.localStorage.setItem(SCOPED_FLOOR_LAYOUTS_KEY, JSON.stringify(layoutsToPersist));
        window.localStorage.setItem(SCOPED_ACTIVE_FLOOR_KEY, activeFloor);
    }, [hasHydratedFloorState, floorLayouts, activeFloor, units, corridors, structures, readOnly, SCOPED_FLOOR_LAYOUTS_KEY, SCOPED_ACTIVE_FLOOR_KEY]);
    // ---------------------------------------------------------------
    // Auto-save positions + decorations to DB (debounced 1.5s)
    // ---------------------------------------------------------------
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (!selectedPropertyId || selectedPropertyId === "all" || !hasHydratedFloorState || readOnly) return;

        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
            const allLayouts = {
                ...floorLayouts,
                [activeFloor]: { ...(floorLayouts[activeFloor] || {}), units, corridors, structures },
            };
            const allPositions: Array<{ unitId: string; floorKey: string; x: number; y: number; w: number; h: number }> = [];
            const decorations: Record<string, { corridors: Corridor[]; structures: Structure[] }> = {};

            for (const [floorKey, layout] of Object.entries(allLayouts)) {
                for (const unit of layout.units) {
                    allPositions.push({ unitId: (unit as Unit).dbId ?? unit.id, floorKey, x: unit.x, y: unit.y, w: unit.w, h: unit.h });
                }
                if (layout.corridors.length > 0 || layout.structures.length > 0) {
                    decorations[floorKey] = { corridors: layout.corridors, structures: layout.structures };
                }
            }
            void fetch("/api/landlord/unit-map", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ propertyId: selectedPropertyId, positions: allPositions, decorations }),
            });
        }, 1500);
        return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [units, corridors, structures, activeFloor, hasHydratedFloorState, selectedPropertyId, readOnly]);

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

    const handleSidebarBlockDragStart = (blockType: SidebarBlockType, dbUnitId?: string) => (e: React.DragEvent<HTMLDivElement>) => {
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
                                            : blockType === "stair-spiral"
                                                ? { blockType, label: "Spiral Stair", w: 120, h: 120, variant: "spiral" }
                                                : blockType === "facility-function"
                                                    ? { blockType, label: "Function Room", w: 240, h: 180, variant: "function-room" }
                                                    : { blockType, label: "Studio Facility", w: 200, h: 160, variant: "studio" };
        e.dataTransfer.setData(SIDEBAR_BLOCK_DRAG_TYPE, JSON.stringify({ ...payload, dbUnitId }));
        e.dataTransfer.effectAllowed = "copy";
    };

    const handleSidebarBlockDragEnd = () => {
        setSidebarBlockGhost(null);
    };

    const handleUnplacedUnitClick = (dbUnit: DbUnit) => {
        if (readOnly) return;
        const w = dbUnit.beds === 0 ? 180 : dbUnit.beds === 2 ? 220 : dbUnit.beds >= 3 ? 280 : 200;
        const h = dbUnit.beds === 0 ? 120 : 140;
        let x = 50;
        let y = 50;
        const MAX_ATTEMPTS = 20;
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            if (!hasCollisionWithPlacedItems({ x, y, w, h })) break;
            x += 40;
            y += 40;
        }
        setUnits(prev => [
            ...prev,
            {
                id: dbUnit.id,
                dbId: dbUnit.id,
                name: dbUnit.name,
                type: (dbUnit.beds === 0 ? "Studio" : dbUnit.beds === 2 ? "2BR" : dbUnit.beds >= 3 ? "3BR" : "1BR") as Unit["type"],
                status: (dbUnit.status as Unit["status"]) ?? "vacant",
                x, y, w, h,
                floor: dbUnit.floor,
            },
        ]);
        setUnplacedDbUnits(prev => prev.filter(u => u.id !== dbUnit.id));
        setSelectedItem({ kind: "unit", id: dbUnit.id });
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

            const worldPoint = getWorldPointFromClientPoint(e.clientX, e.clientY);
            if (!worldPoint) {
                setSidebarBlockGhost(null);
                return;
            }
            const droppedX = worldPoint.x;
            const droppedY = worldPoint.y;
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
        const parsed = JSON.parse(serialized) as { blockType?: SidebarBlockType; label?: string; unitType?: Unit["type"]; w?: number; h?: number; variant?: string; dbUnitId?: string };
        if (!parsed.blockType || !parsed.w || !parsed.h) return;

        const worldPoint = getWorldPointFromClientPoint(e.clientX, e.clientY);
        if (!worldPoint) return;
        const droppedX = worldPoint.x;
        const droppedY = worldPoint.y;
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
            // If we have a specific DB unit being placed
            if (parsed.dbUnitId) {
                const dbUnit = dbUnits.find(u => u.id === parsed.dbUnitId);
                if (dbUnit) {
                    setUnits(prev => [
                        ...prev,
                        {
                            id: dbUnit.id,
                            dbId: dbUnit.id,
                            name: dbUnit.name,
                            type: parsed.unitType ?? "Studio",
                            status: (dbUnit.status as Unit["status"]) ?? "vacant",
                            x: clampedX,
                            y: clampedY,
                            w: blockWidth,
                            h: blockHeight,
                            floor: dbUnit.floor,
                        },
                    ]);
                    // Remove from unplaced list
                    setUnplacedDbUnits(prev => prev.filter(u => u.id !== parsed.dbUnitId));
                    return;
                }
            }

            // Fallback: place a generic unit (only if no property selected or testing)
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
                        dbId: "", // Not linked yet
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

        const structureType: Structure["type"] = parsed.blockType === "elevator" ? "elevator" : parsed.blockType?.includes("facility") ? "facility" : "stairwell";

        setStructures(prev => ([
            ...prev,
            {
                id: `structure-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                type: structureType,
                variant: parsed.variant as Structure["variant"],
                rotation: 0,
                label: parsed.label ?? (structureType === "elevator" ? "Elevator" : structureType === "facility" ? "Facility" : "Stairwell"),
                x: clampedX,
                y: clampedY,
                w: blockWidth,
                h: blockHeight,
            },
        ]));
    };

    const applyPreset = (presetType: "double-loaded" | "u-shape" | "l-shape" | "single-loaded") => {
        if (units.length > 0 || corridors.length > 0 || structures.length > 0) {
            setPresetConfirm({ isOpen: true, presetType });
            return;
        }
        confirmApplyPreset(presetType);
    };

    const confirmApplyPreset = (presetType: "double-loaded" | "u-shape" | "l-shape" | "single-loaded") => {
        setPresetConfirm({ isOpen: false, presetType: null });

        const newUnits: Unit[] = [];
        const newCorridors: Corridor[] = [];
        
        // Grab dbUnits if available or use generic IDs
        const unplacedCopy = [...unplacedDbUnits];
        let genericIdCounter = 100;
        
        const createUnit = (x: number, y: number, w: number, h: number, type: Unit["type"]): Unit => {
            const dbUnit = unplacedCopy.shift();
            if (dbUnit) {
                return {
                    id: dbUnit.id,
                    dbId: dbUnit.id,
                    name: dbUnit.name,
                    type,
                    status: (dbUnit.status as Unit["status"]) ?? "vacant",
                    x, y, w, h,
                    floor: dbUnit.floor,
                };
            }
            
            genericIdCounter++;
            const newId = String(genericIdCounter);
            return {
                id: newId,
                dbId: "",
                name: `Unit ${newId}`,
                type,
                status: "vacant",
                x, y, w, h
            };
        };

        const cx = 300;
        const cy = 200;

        if (presetType === "double-loaded") {
            newCorridors.push({ id: `corridor-${Date.now()}`, label: "Central Corridor", x: cx, y: cy + 140, w: 900, h: 80 });
            for (let i = 0; i < 4; i++) {
                newUnits.push(createUnit(cx + 40 + i * 220, cy, 200, 140, "1BR")); // Top row
                newUnits.push(createUnit(cx + 40 + i * 220, cy + 220, 200, 140, "1BR")); // Bottom row
            }
        } else if (presetType === "u-shape") {
            newCorridors.push({ id: `corridor-north-${Date.now()}`, label: "North Corridor", x: cx + 160, y: cy, w: 600, h: 80 });
            newCorridors.push({ id: `corridor-west-${Date.now()}`, label: "West Wing", x: cx + 80, y: cy, w: 80, h: 460 });
            newCorridors.push({ id: `corridor-east-${Date.now()}`, label: "East Wing", x: cx + 760, y: cy, w: 80, h: 460 });
            
            // Top row
            for (let i = 0; i < 3; i++) {
                newUnits.push(createUnit(cx + 160 + i * 200, cy - 140, 200, 140, "1BR"));
            }
            // West wing
            for (let i = 0; i < 2; i++) {
                newUnits.push(createUnit(cx - 120, cy + 100 + i * 160, 200, 140, "1BR"));
            }
            // East wing
            for (let i = 0; i < 2; i++) {
                newUnits.push(createUnit(cx + 840, cy + 100 + i * 160, 200, 140, "1BR"));
            }
        } else if (presetType === "l-shape") {
            newCorridors.push({ id: `corridor-north-${Date.now()}`, label: "North Corridor", x: cx + 160, y: cy, w: 600, h: 80 });
            newCorridors.push({ id: `corridor-west-${Date.now()}`, label: "West Wing", x: cx + 80, y: cy, w: 80, h: 460 });
            
            // Top row
            for (let i = 0; i < 3; i++) {
                newUnits.push(createUnit(cx + 160 + i * 200, cy - 140, 200, 140, "1BR"));
            }
            // West wing
            for (let i = 0; i < 2; i++) {
                newUnits.push(createUnit(cx - 120, cy + 100 + i * 160, 200, 140, "1BR"));
            }
        } else if (presetType === "single-loaded") {
            newCorridors.push({ id: `corridor-${Date.now()}`, label: "Single Corridor", x: cx, y: cy + 140, w: 900, h: 80 });
            for (let i = 0; i < 4; i++) {
                newUnits.push(createUnit(cx + 40 + i * 220, cy, 200, 140, "1BR")); // Top row only
            }
        }

        setUnits(newUnits);
        setCorridors(newCorridors);
        setStructures([]);
        setUnplacedDbUnits(unplacedCopy);
        
        isUndoingRef.current = false;
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

    const getRotatedArtworkStyle = (width: number, height: number, rotation: number, flipX?: boolean, flipY?: boolean): React.CSSProperties => {
        const normalizedRotation = ((rotation % 360) + 360) % 360;
        const isQuarterTurn = normalizedRotation % 180 !== 0;
        const scaleStr = (flipX || flipY) ? ` scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})` : '';

        if (!isQuarterTurn) {
            return {
                position: "absolute",
                inset: 0,
                transform: `rotate(${normalizedRotation}deg)${scaleStr}`,
                transformOrigin: "center",
            };
        }

        return {
            position: "absolute",
            width: height,
            height: width,
            left: (width - height) / 2,
            top: (height - width) / 2,
            transform: `rotate(${normalizedRotation}deg)${scaleStr}`,
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
    const selectedStructure = selectedItem?.kind === "structure"
        ? structures.find((s) => s.id === selectedItem.id) ?? null
        : null;
    const selectedUnitNote = selectedUnit ? (unitNotes[selectedUnit.id] ?? "") : "";

    return (
        <div className={`${isDark ? 'bg-background-dark text-slate-100' : 'bg-background text-slate-800'} h-screen flex flex-col overflow-hidden antialiased selection:bg-primary/30 ${readOnly ? 'pointer-events-auto' : ''}`}>
            {/* Header */}
            <AnimatePresence>
                {!isCanvasFullscreen && (
                    <motion.header 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 64, opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={`overflow-hidden flex items-center justify-between px-6 shrink-0 z-20 backdrop-blur ${isDark ? 'bg-surface-dark border-b border-slate-800 shadow-none' : 'bg-card/95 border-b border-border shadow-sm'}`}
                    >
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Logo className="h-6 w-auto" />
                    </div>
                    <div className={`mx-2 h-6 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                    <div>
                        <h1 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{propertyContext?.selectedProperty?.name || "All Properties"}</h1>
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
                    {selectedPropertyId !== "all" && unplacedDbUnits.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 animate-pulse">
                            <span className="material-icons-round text-amber-500 text-[16px]">warning</span>
                            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-tighter">{unplacedDbUnits.length} Unplaced Units</span>
                        </div>
                    )}
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
                                <span className="material-icons-round text-sm">save</span>
                                Save Changes
                            </button>
                        </>
                    )}
                </div>
            </motion.header>
        )}
        </AnimatePresence>

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
                                            <div className={`w-full h-full relative shadow-sm overflow-hidden select-none rounded-[1px] border ${isDark ? 'bg-neutral-800/85' : 'bg-white/85'} ${sidebarBlockGhost.isValid ? 'border-emerald-400/70' : 'border-red-400/80'}`}>
                                                <div className={`absolute inset-0 border-[2px] ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                                <div className={`absolute inset-[4px] border ${isDark ? 'border-neutral-600' : 'border-slate-300'}`}></div>
                                                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[6px] z-10 border-x-2 ${isDark ? 'bg-neutral-700 border-neutral-500' : 'bg-slate-100 border-slate-400'}`}></div>
                                                <div className={`absolute top-0 left-1/4 right-1/4 h-[6px] z-10 flex items-center justify-center border-x ${isDark ? 'bg-neutral-700 border-neutral-500' : 'bg-slate-100 border-slate-400'}`}>
                                                    <div className={`w-full h-px ${isDark ? 'bg-neutral-600' : 'bg-slate-300'}`}></div>
                                                </div>
                                                <div className={`absolute inset-0 opacity-20 ${sidebarBlockGhost.isValid ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 z-20">
                                                    <div className={`w-2 h-2 rounded-full mb-2 ${sidebarBlockGhost.isValid ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]'}`}></div>
                                                    <h4 className={`font-bold text-xs drop-shadow-md ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{sidebarBlockGhost.label}</h4>
                                                    <span className={`text-[9px] font-bold uppercase mt-1 tracking-wider px-1 rounded ${sidebarBlockGhost.isValid ? 'text-emerald-700 border border-emerald-400/40 bg-emerald-500/10' : 'text-red-700 border border-red-400/40 bg-red-500/10'}`}>{sidebarBlockGhost.isValid ? 'Preview' : 'Blocked'}</span>
                                                </div>
                                            </div>
                                        ) : sidebarBlockGhost.blockType === "corridor" ? (
                                            <div className={`w-full h-full border-y flex items-center justify-center rounded-[1px] ${sidebarBlockGhost.isValid ? 'bg-emerald-500/15 border-emerald-400/80' : 'bg-red-500/15 border-red-400/80'}`}>
                                                <div className={`absolute inset-0 opacity-15 pointer-events-none ${isDark ? 'bg-neutral-700/50' : 'bg-slate-200/50'}`}></div>
                                                <div className="relative z-10 flex flex-col items-center justify-center">
                                                    <span className={`text-xs font-bold uppercase tracking-[0.5em] ${sidebarBlockGhost.isValid ? 'text-emerald-300' : 'text-red-300'}`}>{sidebarBlockGhost.label}</span>
                                                    <span className={`mt-1 text-[9px] font-bold uppercase tracking-wider px-1 rounded ${sidebarBlockGhost.isValid ? 'text-emerald-700 border border-emerald-400/40 bg-emerald-500/10' : 'text-red-700 border border-red-400/40 bg-red-500/10'}`}>{sidebarBlockGhost.isValid ? 'Preview' : 'Blocked'}</span>
                                                </div>
                                            </div>
                                        ) : sidebarBlockGhost.blockType === "elevator" ? (
                                            <div className={`w-full h-full border rounded-sm flex items-center justify-center ${sidebarBlockGhost.isValid ? 'bg-emerald-500/15 border-emerald-400/80' : 'bg-red-500/20 border-red-400/80'}`}>
                                                <div className={`border-2 w-full h-full m-2 flex items-center justify-center relative ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}>
                                                    <span className={`material-icons-round ${sidebarBlockGhost.isValid ? 'text-emerald-400' : 'text-red-400'}`}>elevator</span>
                                                </div>
                                                <span className={`absolute bottom-1 text-[9px] font-bold uppercase tracking-wider px-1 rounded ${sidebarBlockGhost.isValid ? 'text-emerald-300 border border-emerald-400/40 bg-emerald-500/10' : 'text-red-300 border border-red-400/40 bg-red-500/10'}`}>{sidebarBlockGhost.isValid ? 'Preview' : 'Blocked'}</span>
                                            </div>
                                        ) : (
                                            <div className={`w-full h-full border rounded-sm relative overflow-hidden ${sidebarBlockGhost.isValid ? 'bg-emerald-500/15 border-emerald-400/80' : 'bg-red-500/20 border-red-400/80'}`}>
                                                <div style={getRotatedArtworkStyle(sidebarBlockGhost.w, sidebarBlockGhost.h, 0)}>
                                                    {sidebarBlockGhost.stairVariant === "straight" ? (
                                                        <>
                                                            <div className={`absolute inset-0 border-[2px] ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                                            <div className={`absolute inset-[4px] border ${isDark ? 'border-neutral-600' : 'border-slate-300'}`}></div>
                                                            <div className="absolute left-[15%] right-[15%] top-[10%] bottom-[10%] flex flex-col justify-between">
                                                                {[...Array(12)].map((_, i) => (
                                                                    <div key={`ghost-straight-${i}`} className={`w-full h-px ${isDark ? 'bg-neutral-500/80' : 'bg-slate-400/80'}`}></div>
                                                                ))}
                                                            </div>
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className={`h-[60%] w-px relative ${isDark ? 'bg-neutral-500' : 'bg-slate-400'}`}>
                                                                    <div className={`absolute -top-1 -left-1 w-2 h-2 border-t border-r rotate-[-45deg] ${isDark ? 'border-neutral-400' : 'border-slate-300'}`}></div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : sidebarBlockGhost.stairVariant === "l-shape" ? (
                                                        <>
                                                            <div className={`absolute inset-0 border-[2px] ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                                            <div className={`absolute top-0 right-0 w-1/2 h-1/2 border-b border-l ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                                            <div className={`absolute bottom-0 right-0 w-1/2 h-1/2 border-l flex flex-col justify-between py-1 ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <div key={`ghost-l-v-${i}`} className={`w-full h-px ${isDark ? 'bg-neutral-500/80' : 'bg-slate-400/80'}`}></div>
                                                                ))}
                                                            </div>
                                                            <div className={`absolute top-0 left-0 w-1/2 h-1/2 border-b flex flex-row justify-between px-1 ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <div key={`ghost-l-h-${i}`} className={`h-full w-px ${isDark ? 'bg-neutral-500/80' : 'bg-slate-400/80'}`}></div>
                                                                ))}
                                                            </div>
                                                            <div className="absolute top-[25%] left-[10%] right-[10%] bottom-[10%] pointer-events-none">
                                                                <svg className={`w-full h-full ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M 85 90 L 85 25 L 10 25" />
                                                                    <path d="M 15 20 L 10 25 L 15 30" />
                                                                </svg>
                                                            </div>
                                                        </>
                                                    ) : sidebarBlockGhost.stairVariant === "u-shape" ? (
                                                        <>
                                                            <div className={`absolute inset-0 border-[2px] ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                                            <div className={`absolute top-0 left-0 right-0 h-[30%] border-b ${isDark ? 'border-neutral-500 bg-neutral-700/60' : 'border-slate-400 bg-slate-200/60'}`}></div>
                                                            <div className={`absolute top-[30%] bottom-0 left-1/2 -translate-x-1/2 w-1 ${isDark ? 'bg-neutral-600' : 'bg-slate-500'}`}></div>
                                                            <div className={`absolute top-[30%] bottom-0 left-0 right-1/2 flex flex-col justify-between py-1 border-r ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}>
                                                                {[...Array(7)].map((_, i) => (
                                                                    <div key={`ghost-u-l-${i}`} className={`w-full h-px ${isDark ? 'bg-neutral-500/80' : 'bg-slate-400/80'}`}></div>
                                                                ))}
                                                            </div>
                                                            <div className={`absolute top-[30%] bottom-0 left-1/2 right-0 flex flex-col justify-between py-1 border-l ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}>
                                                                {[...Array(7)].map((_, i) => (
                                                                    <div key={`ghost-u-r-${i}`} className={`w-full h-px ${isDark ? 'bg-neutral-500/80' : 'bg-slate-400/80'}`}></div>
                                                                ))}
                                                            </div>
                                                            <div className="absolute inset-0 pointer-events-none p-2">
                                                                <svg className={`w-full h-full ${isDark ? 'text-neutral-400' : 'text-slate-400'}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M 75 90 L 75 15 L 25 15 L 25 90" />
                                                                    <path d="M 20 85 L 25 90 L 30 85" />
                                                                </svg>
                                                            </div>
                                                        </>
                                                    ) : sidebarBlockGhost.stairVariant === "spiral" ? (
                                                        <>
                                                            <div className={`absolute inset-0 rounded-full border-[2px] ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                                            <div className={`absolute inset-[35%] border rounded-full z-10 ${isDark ? 'border-neutral-500 bg-neutral-700/80' : 'border-slate-400 bg-slate-100'}`}></div>
                                                            {[...Array(12)].map((_, i) => (
                                                                <div
                                                                    key={`ghost-spiral-${i}`}
                                                                    className={`absolute inset-0 border-t origin-center ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}
                                                                    style={{ transform: `rotate(${i * 30}deg)` }}
                                                                ></div>
                                                            ))}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className={`absolute inset-0 border-[2px] ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                                            <div className={`absolute inset-[4px] border ${isDark ? 'border-neutral-600' : 'border-slate-300'}`}></div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className={`absolute inset-0 opacity-20 ${sidebarBlockGhost.isValid ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                <span className={`absolute top-1 right-1 text-[9px] font-bold uppercase tracking-wider px-1 rounded ${sidebarBlockGhost.isValid ? 'text-emerald-300 border border-emerald-400/40 bg-emerald-500/10' : 'text-red-300 border border-red-400/40 bg-red-500/10'}`}>{sidebarBlockGhost.isValid ? 'Preview' : 'Blocked'}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Units */}
                                {corridors.map((corridor) => (
                                    <motion.div
                                        key={corridor.id}
                                        data-corridor-card="true"
                                        className={`absolute group cursor-pointer ${
                                            draggingCorridorId === corridor.id
                                                ? dragPlacement?.kind === "corridor" && dragPlacement.id === corridor.id && !dragPlacement.isValid
                                                    ? 'ring-2 ring-red-500/80 ring-offset-2 ring-offset-background'
                                                    : 'ring-2 ring-emerald-500/80 ring-offset-2 ring-offset-background'
                                                : selectedItem?.kind === "corridor" && selectedItem.id === corridor.id
                                                    ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                                                    : ''
                                        }`}
                                        style={{
                                            left: corridor.x,
                                            top: corridor.y,
                                            width: corridor.w,
                                            height: corridor.h,
                                            zIndex: draggingCorridorId === corridor.id ? 35 : 8,
                                        }}
                                        drag={!readOnly && resizingCorridorId === null && !isLayoutLocked}
                                        dragConstraints={blueprintRef}
                                        dragElastic={0}
                                        dragMomentum={false}
                                        dragSnapToOrigin
                                        transition={{ duration: 0 }}
                                        onPointerDown={readOnly ? undefined : () => setSelectedItem({ kind: "corridor", id: corridor.id })}
                                        onDragStart={(event, info) => {
                                            const pointer = getClientPointFromDragEvent(event) ?? info.point;
                                            setSelectedItem({ kind: "corridor", id: corridor.id });
                                            setDraggingCorridorId(corridor.id);
                                            setIsTrashHot(false);
                                            setDragPointerAnchor("corridor", corridor.id, corridor.x, corridor.y, pointer.x, pointer.y);
                                            setDragPlacementIndicator("corridor", corridor.id, true, false);
                                        }}
                                        onDrag={(event, info) => {
                                            const pointer = getClientPointFromDragEvent(event) ?? info.point;
                                            const placement = resolveDragPlacement(
                                                "corridor",
                                                corridor.id,
                                                corridor.w,
                                                corridor.h,
                                                pointer.x,
                                                pointer.y,
                                                corridor.x,
                                                corridor.y
                                            );
                                            updateTrashHotState(pointer.x, pointer.y);
                                            setDragPlacementIndicator("corridor", corridor.id, placement.isValid, placement.isMagnetic);
                                        }}
                                        onDragEnd={(event, info) => {
                                            const pointer = getClientPointFromDragEvent(event) ?? info.point;
                                            const shouldDelete = isPointerNearTrash(pointer.x, pointer.y);
                                            if (shouldDelete) {
                                                requestDeleteItem({ kind: "corridor", id: corridor.id }, "trash");
                                                setDragPlacement(null);
                                                setDraggingCorridorId(current => current === corridor.id ? null : current);
                                                clearDragPointerAnchor("corridor", corridor.id);
                                                setIsTrashHot(false);
                                                return;
                                            }

                                            const placement = resolveDragPlacement(
                                                "corridor",
                                                corridor.id,
                                                corridor.w,
                                                corridor.h,
                                                pointer.x,
                                                pointer.y,
                                                corridor.x,
                                                corridor.y
                                            );
                                            if (!placement.isValid) {
                                                triggerOverlapToast();
                                            } else {
                                                setCorridors(prev => prev.map((existing) => (
                                                    existing.id === corridor.id
                                                        ? { ...existing, x: placement.x, y: placement.y }
                                                        : existing
                                                )));
                                            }
                                            setDragPlacement(null);
                                            setDraggingCorridorId(current => current === corridor.id ? null : current);
                                            clearDragPointerAnchor("corridor", corridor.id);
                                            setIsTrashHot(false);
                                        }}
                                        >
                                            <div className={`w-full h-full relative shadow-sm overflow-hidden select-none rounded-[1px] ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                                                <div className={`absolute inset-0 border-[2px] ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                                <div className={`absolute inset-[4px] border ${isDark ? 'border-neutral-600' : 'border-slate-300'}`}></div>
                                                <div className={`absolute inset-[10px] border border-dashed ${isDark ? 'border-neutral-500/80' : 'border-slate-700/80'}`}></div>
                                            {corridor.h > corridor.w ? (
                                                <div className={`absolute top-[10px] bottom-[10px] left-1/2 -translate-x-1/2 w-px ${isDark ? 'bg-neutral-500/80' : 'bg-slate-500/80'}`}></div>
                                            ) : (
                                                <div className={`absolute left-[10px] right-[10px] top-1/2 -translate-y-1/2 h-px ${isDark ? 'bg-neutral-500/80' : 'bg-slate-500/80'}`}></div>
                                            )}
                                            <div className="absolute inset-[8px] opacity-10"
                                                style={{ backgroundImage: isDark ? 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)' : 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}
                                            ></div>
                                            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-blue-500"></div>
                                            <div className="absolute inset-0 flex items-center justify-center z-20 overflow-hidden">
                                                <span className={`text-xs font-bold uppercase tracking-[0.4em] px-2 ${isDark ? 'text-slate-300' : 'text-slate-500'} ${corridor.h > corridor.w ? '-rotate-90 whitespace-nowrap' : 'whitespace-nowrap'}`}>{corridor.label}</span>
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
                                        {draggingCorridorId === corridor.id && dragPlacement?.kind === "corridor" && dragPlacement.id === corridor.id && (
                                            <>
                                                <div className={`pointer-events-none absolute inset-0 rounded-[1px] ${dragPlacement.isValid ? 'bg-emerald-500/12' : 'bg-red-500/18'}`}></div>
                                                {(!dragPlacement.isValid || dragPlacement.isMagnetic) && (
                                                    <span className={`pointer-events-none absolute left-2 top-2 z-40 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${dragPlacement.isValid ? 'border border-emerald-400/40 bg-emerald-500/15 text-emerald-300' : 'border border-red-400/40 bg-red-500/15 text-red-300'}`}>
                                                        {dragPlacement.isValid ? 'Snap' : 'Blocked'}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </motion.div>
                                ))}

                                {structures.map((structure) => (
                                    <motion.div
                                        key={structure.id}
                                        data-structure-card="true"
                                        className={`absolute group cursor-pointer ${
                                            draggingStructureId === structure.id
                                                ? dragPlacement?.kind === "structure" && dragPlacement.id === structure.id && !dragPlacement.isValid
                                                    ? 'ring-2 ring-red-500/80 ring-offset-2 ring-offset-background'
                                                    : 'ring-2 ring-emerald-500/80 ring-offset-2 ring-offset-background'
                                                : selectedItem?.kind === "structure" && selectedItem.id === structure.id
                                                    ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                                                    : ''
                                        }`}
                                        style={{
                                            left: structure.x,
                                            top: structure.y,
                                            width: structure.w,
                                            height: structure.h,
                                            zIndex: draggingStructureId === structure.id ? 35 : 9,
                                        }}
                                        drag={!readOnly && !isLayoutLocked}
                                        dragConstraints={blueprintRef}
                                        dragElastic={0}
                                        dragMomentum={false}
                                        dragSnapToOrigin
                                        transition={{ duration: 0 }}
                                        onPointerDown={readOnly ? undefined : () => setSelectedItem({ kind: "structure", id: structure.id })}
                                        onDragStart={(event, info) => {
                                            const pointer = getClientPointFromDragEvent(event) ?? info.point;
                                            setSelectedItem({ kind: "structure", id: structure.id });
                                            setDraggingStructureId(structure.id);
                                            setIsTrashHot(false);
                                            setDragPointerAnchor("structure", structure.id, structure.x, structure.y, pointer.x, pointer.y);
                                            setDragPlacementIndicator("structure", structure.id, true, false);
                                        }}
                                        onDrag={(event, info) => {
                                            const pointer = getClientPointFromDragEvent(event) ?? info.point;
                                            const placement = resolveDragPlacement(
                                                "structure",
                                                structure.id,
                                                structure.w,
                                                structure.h,
                                                pointer.x,
                                                pointer.y,
                                                structure.x,
                                                structure.y
                                            );
                                            updateTrashHotState(pointer.x, pointer.y);
                                            setDragPlacementIndicator("structure", structure.id, placement.isValid, placement.isMagnetic);
                                        }}
                                        onDragEnd={(event, info) => {
                                            const pointer = getClientPointFromDragEvent(event) ?? info.point;
                                            const shouldDelete = isPointerNearTrash(pointer.x, pointer.y);
                                            if (shouldDelete) {
                                                requestDeleteItem({ kind: "structure", id: structure.id }, "trash");
                                                setDragPlacement(null);
                                                setDraggingStructureId(current => current === structure.id ? null : current);
                                                clearDragPointerAnchor("structure", structure.id);
                                                setIsTrashHot(false);
                                                return;
                                            }

                                            const placement = resolveDragPlacement(
                                                "structure",
                                                structure.id,
                                                structure.w,
                                                structure.h,
                                                pointer.x,
                                                pointer.y,
                                                structure.x,
                                                structure.y
                                            );
                                            if (!placement.isValid) {
                                                triggerOverlapToast();
                                            } else {
                                                setStructures(prev => prev.map((existing) => (
                                                    existing.id === structure.id
                                                        ? { ...existing, x: placement.x, y: placement.y }
                                                        : existing
                                                )));
                                            }
                                            setDragPlacement(null);
                                            setDraggingStructureId(current => current === structure.id ? null : current);
                                            clearDragPointerAnchor("structure", structure.id);
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
                                                <div style={getRotatedArtworkStyle(structure.w, structure.h, structure.rotation ?? 0, structure.flipX, structure.flipY)}>
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
                                                    ) : structure.type === "facility" ? (
                                                        <div className={`w-full h-full relative shadow-sm overflow-hidden select-none rounded-[1px] flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                                                            <div className={`absolute inset-0 border-[2px] ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                                            <div className={`absolute inset-[4px] border border-dashed ${isDark ? 'border-neutral-600' : 'border-slate-300'}`}></div>
                                                            <div className="flex flex-col items-center gap-1 z-20">
                                                                <span className={`material-icons-round text-2xl ${isDark ? 'text-neutral-400' : 'text-slate-400'}`}>{structure.variant === "function-room" ? "meeting_room" : "fitness_center"}</span>
                                                                <span className={`text-[10px] uppercase font-bold text-center leading-tight px-2 ${isDark ? 'text-neutral-300' : 'text-slate-500'}`}>{structure.label}</span>
                                                            </div>
                                                            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-blue-500"></div>
                                                        </div>
                                                    ) : (
                                                        /* Default / Fallback */
                                                        <div className={`w-full h-full relative shadow-sm overflow-hidden select-none rounded-[1px] ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                                                            <div className={`absolute inset-0 border-[2px] ${isDark ? 'border-neutral-500' : 'border-slate-400'}`}></div>
                                                            <div className="absolute inset-[4px] border border-slate-300"></div>
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className={`text-[10px] uppercase ${isDark ? 'text-neutral-400' : 'text-slate-400'}`}>Stairwell</span>
                                                            </div>
                                                            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-blue-500"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {draggingStructureId === structure.id && dragPlacement?.kind === "structure" && dragPlacement.id === structure.id && (
                                            <>
                                                <div className={`pointer-events-none absolute inset-0 rounded-[1px] ${dragPlacement.isValid ? 'bg-emerald-500/12' : 'bg-red-500/18'}`}></div>
                                                {(!dragPlacement.isValid || dragPlacement.isMagnetic) && (
                                                    <span className={`pointer-events-none absolute left-2 top-2 z-40 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${dragPlacement.isValid ? 'border border-emerald-400/40 bg-emerald-500/15 text-emerald-300' : 'border border-red-400/40 bg-red-500/15 text-red-300'}`}>
                                                        {dragPlacement.isValid ? 'Snap' : 'Blocked'}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </motion.div>
                                ))}

                                {units.map((unit) => (
                                    <motion.div
                                        key={unit.id}
                                        data-unit-card="true"
                                        className={`absolute group cursor-pointer ${
                                            draggingUnitId === unit.id
                                                ? dragPlacement?.kind === "unit" && dragPlacement.id === unit.id && !dragPlacement.isValid
                                                    ? 'ring-2 ring-red-500/80 ring-offset-2 ring-offset-background'
                                                    : 'ring-2 ring-emerald-500/80 ring-offset-2 ring-offset-background'
                                                : selectedItem?.kind === "unit" && selectedItem.id === unit.id
                                                    ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                                                    : ''
                                        }`}
                                        style={{
                                            left: unit.x,
                                            top: unit.y,
                                            width: unit.w,
                                            height: unit.h,
                                            zIndex: draggingUnitId === unit.id ? 40 : 10,
                                        }}
                                        drag={!readOnly && !isLayoutLocked}
                                        dragConstraints={blueprintRef}
                                        dragElastic={0}
                                        dragMomentum={false}
                                        dragSnapToOrigin
                                        transition={{ duration: 0 }}
                                        onPointerDown={readOnly ? () => setTooltipUnit(unit) : () => setSelectedItem({ kind: "unit", id: unit.id })}
                                        onDragStart={(event, info) => {
                                             const pointer = getClientPointFromDragEvent(event) ?? info.point;
                                             setSelectedItem({ kind: "unit", id: unit.id });
                                             setDraggingUnitId(unit.id);
                                             setIsTrashHot(false);
                                             setDragPointerAnchor("unit", unit.id, unit.x, unit.y, pointer.x, pointer.y);
                                             setDragPlacementIndicator("unit", unit.id, true, false);
                                         }}
                                         onDrag={(event, info) => {
                                             const pointer = getClientPointFromDragEvent(event) ?? info.point;
                                             const placement = resolveDragPlacement(
                                                 "unit",
                                                 unit.id,
                                                 unit.w,
                                                 unit.h,
                                                 pointer.x,
                                                 pointer.y,
                                                 unit.x,
                                                 unit.y
                                             );
                                             updateTrashHotState(pointer.x, pointer.y);
                                             setDragPlacementIndicator("unit", unit.id, placement.isValid, placement.isMagnetic);
                                         }}
                                        onDragEnd={(event, info) => {
                                            const pointer = getClientPointFromDragEvent(event) ?? info.point;
                                            const shouldDelete = isPointerNearTrash(pointer.x, pointer.y);
                                            if (shouldDelete) {
                                                requestDeleteItem({ kind: "unit", id: unit.id }, "trash");
                                                setDragPlacement(null);
                                                setDraggingUnitId(current => current === unit.id ? null : current);
                                                clearDragPointerAnchor("unit", unit.id);
                                                setIsTrashHot(false);
                                                return;
                                            }

                                            flushSync(() => {
                                                setUnits(prevUnits => {
                                                    const currentUnit = prevUnits.find((u) => u.id === unit.id);
                                                    if (!currentUnit) return prevUnits;

                                                    const placement = resolveDragPlacement(
                                                        "unit",
                                                        currentUnit.id,
                                                        currentUnit.w,
                                                        currentUnit.h,
                                                        pointer.x,
                                                        pointer.y,
                                                        currentUnit.x,
                                                        currentUnit.y
                                                    );
                                                    if (!placement.isValid) {
                                                        triggerOverlapToast();
                                                        return prevUnits;
                                                    }

                                                    return prevUnits.map((existingUnit) =>
                                                        existingUnit.id === unit.id
                                                            ? {
                                                                ...existingUnit,
                                                                x: placement.x,
                                                                y: placement.y,
                                                            }
                                                            : existingUnit
                                                    );
                                                });
                                            });
                                            setDragPlacement(null);
                                            setDraggingUnitId(current => current === unit.id ? null : current);
                                            clearDragPointerAnchor("unit", unit.id);
                                            setIsTrashHot(false);
                                        }}
                                    >
                                        <div className={`relative h-full w-full overflow-hidden rounded-[1px] select-none ${isDark ? 'bg-neutral-800 shadow-sm' : 'bg-white shadow-sm'}`}>
                                            <div className="absolute inset-0" style={{ transform: `scaleX(${unit.flipX ? -1 : 1}) scaleY(${unit.flipY ? -1 : 1})` }}>
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
                                            </div>

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
                                        {draggingUnitId === unit.id && dragPlacement?.kind === "unit" && dragPlacement.id === unit.id && (
                                            <>
                                                <div className={`pointer-events-none absolute inset-0 rounded-[1px] ${dragPlacement.isValid ? 'bg-emerald-500/12' : 'bg-red-500/18'}`}></div>
                                                {(!dragPlacement.isValid || dragPlacement.isMagnetic) && (
                                                    <span className={`pointer-events-none absolute left-2 top-2 z-40 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${dragPlacement.isValid ? 'border border-emerald-400/40 bg-emerald-500/15 text-emerald-300' : 'border border-red-400/40 bg-red-500/15 text-red-300'}`}>
                                                        {dragPlacement.isValid ? 'Snap' : 'Blocked'}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </motion.div>
                                ))}

                                <AnimatePresence>
                                    {readOnly && tooltipUnit && (
                                        <UnitTooltip 
                                            unit={tooltipUnit} 
                                            onClose={() => setTooltipUnit(null)} 
                                            isDark={isDark}
                                            onAction={(action) => {
                                                if (action === "transfer") {
                                                    setTransferModalUnit(tooltipUnit);
                                                    setTransferReason("");
                                                    setTransferError(null);
                                                    setTransferSuccess(false);
                                                } else if (action === "complain") {
                                                    setComplaintUnit(tooltipUnit);
                                                    setIsComplaintModalOpen(true);
                                                }
                                            }}
                                        />
                                    )}
                                </AnimatePresence>

                            </div>
                        </motion.div>

                    </div>





                    {/* HUD Elements */}
                    <AnimatePresence>
                        {!isHUDHidden && (
                            <>
                                {/* Top Left Stats HUD */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="absolute top-6 left-6 z-30 pointer-events-none"
                                >
                                    <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-2xl shadow-2xl pointer-events-auto transition-all hover:bg-slate-900/90 hover:scale-[1.02]">
                                        <div className="flex items-center gap-4 px-2 py-1">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Live Units</span>
                                                <span className="font-mono text-lg font-black text-white leading-none mt-1">{units.length}</span>
                                            </div>
                                            <div className="h-8 w-px bg-white/10" />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Footprint</span>
                                                <span className="font-mono text-lg font-black text-white leading-none mt-1">
                                                    {totalArea.toLocaleString()} <span className="text-[10px] font-normal text-white/40">sqft</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Integrated Bottom Dock */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="absolute bottom-8 left-8 z-30 pointer-events-none"
                                >
                                    <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-1.5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
                                        <div className="flex items-center gap-8 px-6 py-1.5 whitespace-nowrap">
                                            <div className="flex items-center gap-2.5 group cursor-help transition-transform hover:scale-105">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                <span className="text-[9px] font-black text-white/90 uppercase tracking-[0.1em]">Available</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 group cursor-help transition-transform hover:scale-105">
                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                                <span className="text-[9px] font-black text-white/90 uppercase tracking-[0.1em]">Occupied</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 group cursor-help transition-transform hover:scale-105">
                                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                                                <span className="text-[9px] font-black text-white/90 uppercase tracking-[0.1em]">Maintenance</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 group cursor-help transition-transform hover:scale-105">
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                                <span className="text-[9px] font-black text-white/90 uppercase tracking-[0.1em]">Near Due</span>
                                            </div>
                                        </div>
                                        
                                        <div className="h-6 w-px bg-white/10 mx-1" />
                                        
                                        {/* Navigation Section */}
                                        <div className="flex items-center gap-3 pl-4 pr-5 py-1.5 bg-primary/20 rounded-full border border-primary/20">
                                            <span className="material-icons-round text-xs text-primary animate-pulse">navigation</span>
                                            <span className="font-mono text-[10px] font-black text-primary uppercase whitespace-nowrap">
                                                {Math.round(position.x)}<span className="mx-1 opacity-40">/</span>{Math.round(position.y)}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Controls (Legend & Minimap) */}
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute bottom-8 right-8 z-30 pointer-events-none"
                                >
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
                                            <button onClick={handleZoomIn} className="p-2 hover:bg-muted text-slate-600 transition-colors border-b border-border" title="Zoom In"><span className="material-icons-round text-lg">add</span></button>
                                            <button onClick={handleZoomOut} className="p-2 hover:bg-muted text-slate-600 transition-colors border-b border-border" title="Zoom Out"><span className="material-icons-round text-lg">remove</span></button>
                                            <button onClick={handleFit} className="p-2 hover:bg-muted text-slate-600 transition-colors border-b border-border" title="Fit to Screen"><span className="material-icons-round text-lg">aspect_ratio</span></button>
                                            {!readOnly && (
                                                <button
                                                    onClick={performUndo}
                                                    disabled={!undoAvailable}
                                                    className={`p-2 transition-colors ${undoAvailable ? 'hover:bg-muted text-slate-600' : 'text-slate-300 cursor-not-allowed'}`}
                                                    title="Undo (Ctrl+Z)"
                                                >
                                                    <span className="material-icons-round text-lg">undo</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Contextual Item Action HUD */}
                    <AnimatePresence>
                        {selectedItem && !readOnly && !isHUDHidden && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, x: "-50%" }}
                                animate={{ opacity: 1, y: 0, x: "-50%" }}
                                exit={{ opacity: 0, y: 20, x: "-50%" }}
                                className={`absolute bottom-28 left-1/2 -translate-x-1/2 z-50 flex gap-2 rounded-2xl backdrop-blur-xl border p-2 shadow-2xl ${isDark ? 'bg-slate-900/90 border-white/10' : 'bg-white/90 border-slate-200/50'}`}
                            >
                                {selectedItem.kind === "corridor" ? (
                                    <>
                                        <div className="flex items-center gap-2 px-2 py-1">
                                            <span className={`material-icons-round text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>edit</span>
                                            <input
                                                type="text"
                                                value={corridors.find(c => c.id === selectedItem.id)?.label || ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setCorridors(prev => prev.map(c => c.id === selectedItem.id ? { ...c, label: val } : c));
                                                }}
                                                placeholder="Corridor Name"
                                                className={`bg-transparent border-none outline-none text-xs font-bold uppercase tracking-wider w-40 ${isDark ? 'text-white' : 'text-slate-800'}`}
                                            />
                                        </div>
                                        <div className="w-px h-6 bg-white/10 mx-1 my-auto" />
                                        <button
                                            onClick={() => rotateSelectedItem(selectedItem)}
                                            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                                            title="Rotate (R)"
                                        >
                                            <span className="material-icons-round text-lg">rotate_right</span>
                                            Rotate <span className="text-[9px] opacity-50 ml-1">(R)</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => flipSelectedItem('x')}
                                            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                                            title="Flip Horizontal (X)"
                                        >
                                            <span className="material-icons-round text-lg">flip</span>
                                            Flip H <span className="text-[9px] opacity-50 ml-1">(X)</span>
                                        </button>
                                        <button
                                            onClick={() => flipSelectedItem('y')}
                                            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                                            title="Flip Vertical (Y)"
                                        >
                                            <span className="material-icons-round text-lg rotate-90">flip</span>
                                            Flip V <span className="text-[9px] opacity-50 ml-1">(Y)</span>
                                        </button>
                                        <div className="w-px h-6 bg-white/10 mx-1 my-auto" />
                                        <button
                                            onClick={() => rotateSelectedItem(selectedItem)}
                                            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                                            title="Rotate (R)"
                                        >
                                            <span className="material-icons-round text-lg">rotate_right</span>
                                            Rotate <span className="text-[9px] opacity-50 ml-1">(R)</span>
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Viewport System Toolbar (Always Visible) */}
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
                        <div className="flex flex-col bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-2xl">
                            {!isHUDHidden && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col"
                                >
                                    <button 
                                        onClick={() => setIsLayoutLocked(!isLayoutLocked)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isLayoutLocked ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                        title={isLayoutLocked ? "Unlock Layout" : "Lock Layout (L)"}
                                    >
                                        <span className="material-icons-round text-xl">{isLayoutLocked ? 'lock' : 'lock_open'}</span>
                                    </button>
                                    <button 
                                        onClick={toggleFullscreen}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isCanvasFullscreen ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                        title="Toggle Canvas Fullscreen (F)"
                                    >
                                        <span className="material-icons-round text-xl">{isCanvasFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
                                    </button>
                                    <div className="h-px bg-white/10 my-1 mx-2" />
                                    <button 
                                        onClick={() => setShowHotkeys(true)}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
                                        title="Hotkeys Hint (?)"
                                    >
                                        <span className="material-icons-round text-xl">help_outline</span>
                                    </button>
                                    <div className="h-px bg-white/10 my-1 mx-2" />
                                </motion.div>
                            )}
                            
                            <button 
                                onClick={() => setIsHUDHidden(!isHUDHidden)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isHUDHidden ? 'bg-primary text-white shadow-lg shadow-primary/20 animate-pulse' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                title={isHUDHidden ? "Show HUD" : "Hide HUD (H)"}
                            >
                                <span className="material-icons-round text-xl">{isHUDHidden ? 'visibility' : 'visibility_off'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Hotkeys Modal */}
                    <AnimatePresence>
                        {showHotkeys && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-6"
                                onClick={() => setShowHotkeys(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 20 }}
                                    className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="p-8 border-b border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                                                    <span className="material-icons-round">keyboard</span>
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-black text-white tracking-tight">Command Center</h2>
                                                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-0.5">Quick Access Shortcuts</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setShowHotkeys(false)}
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                                            >
                                                <span className="material-icons-round">close</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-8 grid grid-cols-1 gap-6">
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Viewport Modes</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <HotkeyItem label="Toggle Fullscreen" shortcut="F" />
                                                <HotkeyItem label="Toggle HUD Overlay" shortcut="H" />
                                                <HotkeyItem label="Lock/Unlock Layout" shortcut="L" />
                                                <HotkeyItem label="Quick Help" shortcut="?" />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Editor Actions</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <HotkeyItem label="Undo Last Action" shortcut="Ctrl + Z" />
                                                <HotkeyItem label="Delete Selection" shortcut="Delete / Backspace" />
                                                <HotkeyItem label="Flip Horiz / Vert" shortcut="X / Y" />
                                                <HotkeyItem label="Rotate Item" shortcut="R" />
                                                <HotkeyItem label="Zoom In/Out" shortcut="Scroll Wheel" />
                                                <HotkeyItem label="Pan Viewport" shortcut="Hold Middle Mouse" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-950/50 flex justify-center">
                                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">iReside Visual Planner Engine v2.0</p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

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

                    {!readOnly && pendingClearFloor && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md p-4">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className={`w-full max-w-md rounded-[32px] border shadow-2xl overflow-hidden ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}
                            >
                                <div className="p-8">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-6">
                                        <span className="material-icons-round text-3xl">ink_eraser</span>
                                    </div>
                                    <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Clear entire floor?</h3>
                                    <p className={`mt-3 text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        This will remove all units, corridors, and structures from <span className="font-bold text-primary">{floorLayouts[activeFloor]?.name || getFloorDisplayLabel(activeFloor)}</span>. 
                                        <br/><br/>
                                        <span className="italic text-xs opacity-80">Don&apos;t worry: Units will be returned to your &quot;Unplaced&quot; library and won&apos;t be deleted from the property.</span>
                                    </p>
                                </div>
                                <div className={`flex items-center justify-end gap-3 px-8 py-6 border-t ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50/50'}`}>
                                    <button
                                        onClick={() => setPendingClearFloor(false)}
                                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${isDark ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-black/5 hover:text-slate-900'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            executeClearCanvas();
                                            setPendingClearFloor(false);
                                        }}
                                        className="px-6 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-black shadow-lg shadow-rose-500/25 hover:bg-rose-600 transition-all active:scale-95"
                                    >
                                        Clear Floor
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {presetConfirm.isOpen && presetConfirm.presetType && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/40">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className={`w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl ${isDark ? 'border-amber-500/20 bg-slate-900 shadow-amber-500/10' : 'border-amber-200 bg-white shadow-amber-500/10'}`}
                            >
                                <div className="p-8 pb-6">
                                    <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                                        <span className="material-icons-round text-3xl">auto_awesome_mosaic</span>
                                    </div>
                                    <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Apply Layout Preset?</h3>
                                    <p className={`mt-3 text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Applying a preset will clear your current floor plan on <span className="font-bold text-primary">{floorLayouts[activeFloor]?.name || getFloorDisplayLabel(activeFloor)}</span> and generate a new layout.
                                        <br/><br/>
                                        <span className="italic text-xs opacity-80">Any placed units will be returned to your &quot;Unplaced&quot; library and automatically used to fill the preset.</span>
                                    </p>
                                </div>
                                <div className={`flex items-center justify-end gap-3 px-8 py-6 border-t ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50/50'}`}>
                                    <button
                                        onClick={() => setPresetConfirm({ isOpen: false, presetType: null })}
                                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${isDark ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-black/5 hover:text-slate-900'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => confirmApplyPreset(presetConfirm.presetType!)}
                                        className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-900 text-sm font-black shadow-lg shadow-amber-500/25 hover:bg-amber-400 transition-all active:scale-95"
                                    >
                                        Apply Preset
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    <TransferRequestModal
                        isOpen={!!transferModalUnit}
                        onClose={() => setTransferModalUnit(null)}
                        unit={transferModalUnit}
                        isDark={isDark}
                        onSubmit={handleTransferSubmit}
                        isSubmitting={isSubmittingTransfer}
                        success={transferSuccess}
                        error={transferError}
                        reason={transferReason}
                        setReason={setTransferReason}
                    />

                    <ComplaintModal 
                        isOpen={isComplaintModalOpen} 
                        onClose={() => setIsComplaintModalOpen(false)} 
                        unit={complaintUnit} 
                        isDark={isDark}
                    />
                </main>

                {/* Sidebar */}
                {!readOnly && !isHUDHidden && (
                    <aside className={`w-[340px] shrink-0 flex flex-col z-10 ${isDark ? 'bg-surface-dark border-l border-slate-800 shadow-none' : 'bg-card border-l border-border shadow-2xl'}`}>
                        <div className="flex flex-col h-full min-h-0">
                            <div className="min-h-0 flex-1">
                                {selectedUnit ? (
                                    <UnitDetailsPanel
                                        key={selectedUnit.id}
                                        unit={selectedUnit}
                                        onUpdate={(updates) => {
                                            setUnits(prev => prev.map(u => u.id === selectedUnit.id ? { ...u, ...updates } : u));
                                            if (updates.status && (selectedUnit.dbId ?? selectedUnit.id)) {
                                                void fetch(`/api/landlord/units/${selectedUnit.dbId ?? selectedUnit.id}/status`, {
                                                    method: "PATCH",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ status: updates.status }),
                                                });
                                            }
                                        }}
                                        onDelete={() => {
                                            deleteCanvasItem({ kind: "unit", id: selectedUnit.id });
                                            setSelectedItem(null);
                                            triggerDeleteToast();
                                        }}
                                        onClose={() => setSelectedItem(null)}
                                        notesOpen={isNotesPanelOpen}
                                        onToggleNotes={() => setIsNotesPanelOpen((current) => !current)}
                                        onOpenWalkIn={() => setIsWalkInModalOpen(true)}
                                        onOpenInvite={() => setIsInviteModalOpen(true)}
                                        onOpenHistory={() => setIsHistoryModalOpen(true)}
                                    />
                                ) : selectedStructure ? (
                                    <StructureDetailsPanel
                                        key={selectedStructure.id}
                                        structure={selectedStructure}
                                        onUpdate={(updates) => setStructures(prev => prev.map(s => s.id === selectedStructure.id ? { ...s, ...updates } : s))}
                                        onDelete={() => {
                                            deleteCanvasItem({ kind: "structure", id: selectedStructure.id });
                                            setSelectedItem(null);
                                            triggerDeleteToast();
                                        }}
                                        onClose={() => setSelectedItem(null)}
                                    />
                                ) : (
                                    <SidebarBlockLibrary
                                        onDragStart={handleSidebarBlockDragStart}
                                        onUnitClick={handleUnplacedUnitClick}
                                        styles={styles}
                                        isDark={isDark}
                                        unplacedUnits={unplacedDbUnits}
                                        isPropertyMode={selectedPropertyId !== "all"}
                                        setPendingClearFloor={setPendingClearFloor}
                                        activeFloorItemCount={activeFloorItemCount}
                                        onApplyPreset={applyPreset}
                                    />
                                )}
                            </div>
                        </div>
                    </aside>
                )}
                {!readOnly && selectedUnit && !isHUDHidden && (
                    <UnitNotesPanel
                        isOpen={isNotesPanelOpen}
                        onToggle={() => setIsNotesPanelOpen((current) => !current)}
                        value={selectedUnitNote}
                        onChange={(nextValue) => {
                            setUnitNotes((current) => ({ ...current, [selectedUnit.id]: nextValue }));
                        }}
                    />
                )}
                
                {selectedUnit && (
                    <WalkInApplicationModal
                    isOpen={isWalkInModalOpen}
                    onClose={() => setIsWalkInModalOpen(false)}
                    selectedUnitId={selectedUnit?.dbId || selectedUnit?.id}
                    units={dbUnits.map(u => ({
                        id: u.id,
                        name: u.name,
                        rent_amount: u.rent_amount,
                        property_id: selectedPropertyId,
                        property_name: selectedProperty?.name || "Property"
                    }))}
                    onSuccess={() => {
                        setRefreshKey(prev => prev + 1);
                    }}
                />
                )}

                <UnitHistoryModal 
                    isOpen={isHistoryModalOpen}
                    onClose={() => setIsHistoryModalOpen(false)}
                    unit={selectedUnit}
                />

                <AnimatePresence>
                    {isInviteModalOpen && (
                        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                                onClick={() => setIsInviteModalOpen(false)}
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-transparent scrollbar-hide"
                            >
                                <div className="absolute right-6 top-6 z-[130]">
                                    <button
                                        onClick={() => setIsInviteModalOpen(false)}
                                        className="rounded-full bg-white/10 p-2 text-white/50 backdrop-blur-xl transition-all hover:bg-white/20 hover:text-white"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                                <TenantInviteManager
                                    availableUnits={dbUnits.map(u => ({
                                        id: u.id,
                                        name: u.name,
                                        rent_amount: u.rent_amount,
                                        property_id: selectedPropertyId,
                                        property_name: selectedProperty?.name || "Property",
                                        status: u.position ? "occupied" : "vacant" // Simplified status for manager
                                    }))}
                                    invites={tenantInvites}
                                    onRefresh={() => setRefreshKey(prev => prev + 1)}
                                />
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

const StructureDetailsPanel = ({
    structure,
    onUpdate,
    onDelete,
    onClose,
}: {
    structure: Structure;
    onUpdate: (updates: Partial<Structure>) => void;
    onDelete: () => void;
    onClose: () => void;
}) => {
    return (
        <div className="relative flex h-full flex-col overflow-hidden border-l border-white/10 bg-slate-50/50 font-sans text-foreground shadow-2xl backdrop-blur-xl dark:bg-[#0a0a0a]/90">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-30" />
            <div className="relative h-48 w-full shrink-0 group overflow-hidden bg-slate-900">
                <div className="absolute right-6 top-6 z-20 flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/20 text-slate-900 shadow-lg shadow-black/5 backdrop-blur-md transition-all hover:bg-white/40 dark:border-white/10 dark:bg-black/40 dark:text-slate-100 dark:hover:bg-black/60"
                    >
                        <span className="material-icons-round text-lg">close</span>
                    </motion.button>
                </div>
                <div className="absolute bottom-8 left-8 right-8 z-20">
                    <h1 className="text-[2rem] font-black leading-tight text-white capitalize">{structure.label}</h1>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {structure.type} {structure.variant ? `• ${structure.variant}` : ''}
                    </p>
                </div>
            </div>
            <div className="relative z-0 flex-1 space-y-6 overflow-y-auto px-8 pt-8 pb-36 custom-scrollbar">
            </div>
            <div className="p-6 border-t border-border bg-card/95 backdrop-blur-xl absolute bottom-0 w-full z-20">
                <button
                    onClick={onDelete}
                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold uppercase tracking-widest text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-icons-round text-sm">delete</span>
                    Remove Structure
                </button>
            </div>
        </div>
    );
};

const UnitDetailsPanel = ({
    unit,
    onUpdate,
    onDelete,
    onClose,
    notesOpen,
    onToggleNotes,
    onOpenWalkIn,
    onOpenInvite,
    onOpenHistory,
}: {
    unit: Unit;
    onUpdate: (updates: Partial<Unit>) => void;
    onDelete: () => void;
    onClose: () => void;
    notesOpen: boolean;
    onToggleNotes: () => void;
    onOpenWalkIn?: () => void;
    onOpenInvite?: () => void;
    onOpenHistory?: () => void;
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
    const unitAreaSqm = unit.areaSqm ?? Math.round(unitAreaSqftByType[unit.type] * 0.092903);

    const beds = unit.bedrooms !== undefined ? unit.bedrooms : (unit.type === '1BR' ? 1 : unit.type === '2BR' ? 2 : unit.type === '3BR' ? 3 : 0);
    const baths = unit.baths !== undefined ? unit.baths : (unit.type === '1BR' ? 1 : unit.type === '2BR' ? 2 : unit.type === '3BR' ? 2.5 : 1);
    const unitLayoutLabel = unit.type === 'Studio' && beds === 0 ? `Studio - ${baths} Bath` : `${beds} Bed - ${baths} Bath`;

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
        if (!unit.maintenanceDate) return null;
        const parsed = new Date(unit.maintenanceDate);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    })();
    const quickActions = (QUICK_ACTIONS_BY_STATUS[unit.status] ?? []).map(action => {
        if (action === "start-maintenance" && unit.maintenanceStatus) {
            return "manage-maintenance" as QuickActionType;
        }
        return action;
    });
    const canViewTenantProfile = Boolean(unit.tenant && unit.tenant.trim().length > 0);
    const tenantProfileHref = `/landlord/tenants?unitId=${encodeURIComponent(unit.id)}&tenant=${encodeURIComponent(unit.tenant || "")}`;

    const executeQuickAction = (action: QuickActionType) => {
        const guard = evaluateQuickAction(unit, action);
        
        if (action === "manage-maintenance") {
             window.location.href = `/landlord/maintenance?unitId=${unit.id}`;
             return;
        }

        if (action === "view-lease") {
            window.location.href = `/landlord/leases?unitId=${unit.id}`;
            return;
        }

        if (action === "renew-lease") {
            window.location.href = `/landlord/leases?unitId=${unit.id}&action=renew`;
            return;
        }

        if (action === "create-invoice") {
            window.location.href = `/landlord/invoices?unitId=${unit.id}&action=create`;
            return;
        }

        if (action === "unit-maintenance") {
            window.location.href = `/landlord/maintenance?unitId=${unit.id}`;
            return;
        }

        if (!guard.allowed || !guard.nextStatus) {
            setQuickActionError(guard.reason || "This action is currently unavailable.");
            return;
        }

        setQuickActionError(null);
        onUpdate({ status: guard.nextStatus });
    };

    const handleQuickAction = (action: QuickActionType) => {
        const guard = evaluateQuickAction(unit, action);
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
                            <div className={`h-2 w-2 rounded-full animate-pulse ${
                                unit.status === 'occupied' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                                unit.status === 'vacant' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                unit.status === 'maintenance' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                            }`} />
                            <span className="text-[11px] font-bold tracking-wide text-slate-800 dark:text-slate-100 uppercase">{currentStatus.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-xl border border-white/50 bg-white/40 px-3.5 py-2 backdrop-blur-lg shadow-sm dark:border-white/10 dark:bg-black/40">
                            <span className="material-icons-round text-[16px] text-cyan-400">aspect_ratio</span>
                                                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 tracking-wide uppercase">{unitAreaSqm} m&sup2;</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-0 flex-1 space-y-6 overflow-y-auto px-8 pt-8 pb-36 custom-scrollbar">
                {isEditing ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <section className="space-y-4">
                            <h3 className="px-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">UNIT DETAILS</h3>
                            <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-6 dark:border-white/5 dark:bg-slate-900/40">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Area (sqm)</label>
                                    <input type="number" value={unit.areaSqm || ""} onChange={(e) => onUpdate({ areaSqm: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bedrooms</label>
                                        <input type="number" value={unit.bedrooms || ""} onChange={(e) => onUpdate({ bedrooms: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Baths</label>
                                        <input type="number" value={unit.baths || ""} onChange={(e) => onUpdate({ baths: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kitchens</label>
                                    <input type="number" value={unit.kitchens || ""} onChange={(e) => onUpdate({ kitchens: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800" />
                                </div>
                            </div>
                        </section>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8"
                    >
                        {/* Tenant Spotlight Card */}
                        {unit.status !== 'vacant' && (
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
                                                <div className="h-full w-full overflow-hidden rounded-[18px] bg-slate-100 dark:bg-slate-800" style={unit.tenantAvatarBgColor ? { backgroundColor: unit.tenantAvatarBgColor } : undefined}>
                                                    {unit.tenantAvatarUrl ? (
                                                        <img
                                                            src={unit.tenantAvatarUrl}
                                                            alt="Tenant"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <img
                                                            src={unit.tenant ? `https://ui-avatars.com/api/?name=${encodeURIComponent(unit.tenant)}&background=random&color=fff` : "https://images.unsplash.com/photo-1529778456-9a2cf1fbe4a8?auto=format&fit=crop&w=150&q=80"}
                                                            alt="Tenant"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    )}
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
                        )}

                        {unit.status === 'vacant' && onOpenWalkIn && (
                            <div className="flex flex-col gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.02, backgroundColor: "rgba(var(--primary), 0.1)" }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onOpenWalkIn}
                                    className="flex w-full items-center justify-center gap-3 rounded-[32px] border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-[11px] font-black tracking-[0.2em] text-primary transition-all hover:border-primary/50"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <span className="material-icons-round text-2xl">person_add</span>
                                    </div>
                                    START WALK-IN APPLICATION
                                </motion.button>

                                <div className="group relative overflow-hidden rounded-[32px] border border-indigo-500/20 bg-indigo-500/5 p-6 shadow-xl shadow-indigo-500/5 dark:bg-indigo-950/20">
                                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl transition-all group-hover:bg-indigo-500/20" />
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">INVITE RESIDENT</h3>
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500 text-white">
                                            <span className="material-icons-round text-lg">qr_code_2</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-bold leading-relaxed text-indigo-800/70 dark:text-indigo-300/70 mb-4">
                                        Share this unit's unique application link with prospective tenants to start their digital journey.
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        <button 
                                            onClick={onOpenInvite}
                                            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest transition-all hover:bg-indigo-600 active:scale-95 shadow-lg shadow-indigo-500/20"
                                        >
                                            <span className="material-icons-round text-sm">qr_code_2</span>
                                            Generate Invite Link
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Operational Context Cards */}
                        <div className="grid grid-cols-1 gap-6">
                            {/* Maintenance Blocker (Critical Alert Style) */}
                            {(unit.status === "maintenance" || unit.maintenanceStatus) && (
                                <motion.div 
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="group relative overflow-hidden rounded-[32px] border border-rose-500/30 bg-rose-50 p-6 shadow-xl shadow-rose-500/5 dark:bg-rose-950/20"
                                >
                                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl transition-all group-hover:bg-rose-500/20" />
                                    <div className="flex items-start gap-5">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                                            <span className="material-icons-round animate-pulse text-2xl">engineering</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">ACTIVE REPAIR</h3>
                                                <Link href={`/landlord/maintenance?unitId=${unit.id}`} className="text-[9px] font-black text-rose-600 hover:underline dark:text-rose-400">DETAILS</Link>
                                            </div>
                                            <p className="mt-2 text-lg font-black leading-tight text-slate-900 dark:text-white line-clamp-2">
                                                {unit.maintenanceTitle || unit.details?.trim() || "Unspecified Repair"}
                                            </p>
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className="text-[11px] font-bold text-rose-500/80">Reported {maintenanceOpenedDate ? maintenanceOpenedDate.toLocaleDateString() : "recently"}</span>
                                                <div className="h-1 w-1 rounded-full bg-rose-300 dark:bg-rose-700" />
                                                <span className="text-[11px] font-bold text-rose-500/80">Status: {unit.maintenanceStatus?.toUpperCase() || "OPEN"}</span>
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

                        {/* Recent Activity / Status */}
                        <section className="space-y-4">
                            <h3 className="px-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">RECENT ACTIVITY</h3>
                            
                            <div className="grid grid-cols-1 gap-3">
                                {unit.applicationCount && unit.applicationCount > 0 ? (
                                    <div className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white p-4 dark:border-white/5 dark:bg-slate-900/40">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                                            <span className="material-icons-round text-xl">assignment_ind</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-slate-900 dark:text-white">{unit.applicationCount} Pending Application{unit.applicationCount === 1 ? "" : "s"}</p>
                                            <p className="text-[10px] font-bold text-slate-500">Awaiting landlord review</p>
                                        </div>
                                        <Link href={`/landlord/applications?unitId=${unit.id}`} className="text-[10px] font-black text-primary hover:underline">VIEW ALL</Link>
                                    </div>
                                ) : null}

                                <div 
                                    className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white p-4 dark:border-white/5 dark:bg-slate-900/40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                                    onClick={onOpenHistory}
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                                        <span className="material-icons-round text-xl">history</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-slate-900 dark:text-white">Full Unit History</p>
                                        <p className="text-[10px] font-bold text-slate-500">View past leases & maintenance</p>
                                    </div>
                                    <span className="material-icons-round text-slate-400 text-sm">chevron_right</span>
                                </div>
                            </div>
                        </section>

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
                            {evaluateQuickAction(unit, pendingQuickAction).confirmMessage || "Are you sure you want to continue?"}
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
    onUnitClick,
    styles,
    isDark,
    unplacedUnits = [],
    isPropertyMode = false,
    setPendingClearFloor,
    activeFloorItemCount,
    onApplyPreset,
}: {
    onDragStart: (type: SidebarBlockType, dbUnitId?: string) => (e: React.DragEvent<HTMLDivElement>) => void;
    styles: { readonly [key: string]: string; }
    isDark: boolean;
    unplacedUnits?: DbUnit[];
    isPropertyMode?: boolean;
    onUnitClick?: (unit: DbUnit) => void;
    setPendingClearFloor: (pending: boolean) => void;
    activeFloorItemCount: number;
    onApplyPreset: (presetType: "double-loaded" | "u-shape" | "l-shape" | "single-loaded") => void;
}) => {
    const handleSidebarBlockDragEnd = () => {
        // Optional cleanup if needed inside component, but parent tracks ghost
    };

    return (
        <div className="flex flex-col h-full">
            {unplacedUnits.length > 0 && (
                <div className={`shrink-0 border-b px-4 py-3 ${isDark ? 'border-slate-800 bg-amber-500/5' : 'border-amber-200 bg-amber-50'}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Unplaced Units ({unplacedUnits.length})</p>
                    <p className={`text-[11px] mb-2 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>Drag these onto the canvas to place them.</p>
                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {unplacedUnits.map(u => {
                            const blockType = u.beds === 0 ? "studio" : u.beds === 2 ? "2br" : u.beds >= 3 ? "3br" : "1br";
                            return (
                                <div 
                                    key={u.id} 
                                    draggable
                                    onDragStart={onDragStart(blockType, u.id)}
                                    onClick={() => onUnitClick?.(u)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold cursor-grab active:cursor-grabbing transition-all ${isDark ? 'border-amber-500/20 bg-amber-500/10 text-amber-300 hover:border-amber-400/40' : 'border-amber-300 bg-amber-100/80 text-amber-800 hover:border-amber-400'}`}
                                >
                                    <span className="material-icons-round text-sm">apartment</span>
                                    {u.name}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
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
                        <span className="material-icons-round text-primary text-sm">auto_awesome_mosaic</span>
                        Layout Presets
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => onApplyPreset("double-loaded")}
                            className={`group flex flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary ${isDark ? 'border-slate-700 bg-background-dark hover:shadow-none' : 'border-border bg-slate-50 hover:shadow-md'}`}
                        >
                            <span className="material-icons-round text-2xl text-slate-400 group-hover:text-primary transition-colors">view_week</span>
                            <div className="text-center">
                                <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Double Loaded</p>
                                <p className="text-[10px] text-slate-500">Central corridor</p>
                            </div>
                        </button>
                        <button
                            onClick={() => onApplyPreset("u-shape")}
                            className={`group flex flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary ${isDark ? 'border-slate-700 bg-background-dark hover:shadow-none' : 'border-border bg-slate-50 hover:shadow-md'}`}
                        >
                            <span className="material-icons-round text-2xl text-slate-400 group-hover:text-primary transition-colors">view_quilt</span>
                            <div className="text-center">
                                <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>U-Shape</p>
                                <p className="text-[10px] text-slate-500">Courtyard style</p>
                            </div>
                        </button>
                        <button
                            onClick={() => onApplyPreset("l-shape")}
                            className={`group flex flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary ${isDark ? 'border-slate-700 bg-background-dark hover:shadow-none' : 'border-border bg-slate-50 hover:shadow-md'}`}
                        >
                            <span className="material-icons-round text-2xl text-slate-400 group-hover:text-primary transition-colors">filter_none</span>
                            <div className="text-center">
                                <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>L-Shape</p>
                                <p className="text-[10px] text-slate-500">Corner layout</p>
                            </div>
                        </button>
                        <button
                            onClick={() => onApplyPreset("single-loaded")}
                            className={`group flex flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary ${isDark ? 'border-slate-700 bg-background-dark hover:shadow-none' : 'border-border bg-slate-50 hover:shadow-md'}`}
                        >
                            <span className="material-icons-round text-2xl text-slate-400 group-hover:text-primary transition-colors">vertical_split</span>
                            <div className="text-center">
                                <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Single Loaded</p>
                                <p className="text-[10px] text-slate-500">One side units</p>
                            </div>
                        </button>
                    </div>
                </div>

                {!isPropertyMode && (
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
                )}
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

                <div className="pt-4 mt-4 border-t border-border">
                    <h3 className={`mb-3 flex items-center gap-2 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        <span className="material-icons-round text-primary text-sm">meeting_room</span>
                        Facilities
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            className={`group flex cursor-grab flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary active:cursor-grabbing ${isDark ? 'border-slate-700 bg-background-dark hover:shadow-none' : 'border-border bg-slate-50 hover:shadow-md'}`}
                            draggable="true"
                            onDragStart={onDragStart("facility-function")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className={`flex h-10 w-14 items-center justify-center rounded border ${isDark ? 'border-neutral-500 bg-neutral-700' : 'border-slate-400 bg-slate-200'}`}>
                                <span className={`material-icons-round text-lg ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>meeting_room</span>
                            </div>
                            <div className="text-center">
                                <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Function Rm</p>
                            </div>
                        </div>
                        <div
                            className={`group flex cursor-grab flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary active:cursor-grabbing ${isDark ? 'border-slate-700 bg-background-dark hover:shadow-none' : 'border-border bg-slate-50 hover:shadow-md'}`}
                            draggable="true"
                            onDragStart={onDragStart("facility-studio")}
                            onDragEnd={handleSidebarBlockDragEnd}
                        >
                            <div className={`flex h-10 w-14 items-center justify-center rounded border ${isDark ? 'border-neutral-500 bg-neutral-700' : 'border-slate-400 bg-slate-200'}`}>
                                <span className={`material-icons-round text-lg ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>fitness_center</span>
                            </div>
                            <div className="text-center">
                                <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Studio</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border">
                    <h3 className={`mb-3 flex items-center gap-2 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        <span className="material-icons-round text-primary text-sm">construction</span>
                        Canvas Tools
                    </h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => setPendingClearFloor(true)}
                            disabled={activeFloorItemCount === 0}
                            className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                                activeFloorItemCount === 0
                                    ? isDark ? 'border-slate-800 bg-slate-950 text-slate-600' : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : isDark ? 'border-rose-800/40 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40' : 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100'
                            }`}
                        >
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${activeFloorItemCount === 0 ? 'bg-slate-200 dark:bg-slate-800' : 'bg-rose-100 dark:bg-rose-900/40'}`}>
                                <span className="material-icons-round text-xl">layers_clear</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-black leading-tight">Clear Entire Floor</p>
                                <p className="text-[10px] opacity-70">Resets the current level canvas</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HotkeyItem = ({ label, shortcut }: { label: string; shortcut: string }) => (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
        <span className="text-xs font-bold text-white/80">{label}</span>
        <kbd className="px-2 py-1 rounded-md bg-white/10 border border-white/10 text-[10px] font-black text-primary font-mono shadow-sm">{shortcut}</kbd>
    </div>
);




















