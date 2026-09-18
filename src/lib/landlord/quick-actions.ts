import type { LucideIcon } from "lucide-react";
import {
    BarChart3,
    Building2,
    ClipboardList,
    FileText,
    FolderSearch2,
    Hammer,
    ReceiptText,
    RefreshCw,
    Settings2,
    Zap,
} from "lucide-react";

export type QuickActionId =
    | "invoice-ledger"
    | "utility-submeters"
    | "tenant-records"
    | "property-portfolio"
    | "rental-applications"
    | "unit-visualizer"
    | "maintenance-desk"
    | "lease-lifecycle"
    | "financial-metrics"
    | "settings";

export type QuickActionSortMode = "custom" | "frequently_used";

export interface QuickActionItem {
    id: QuickActionId;
    label: string;
    icon: LucideIcon;
    href: string;
    color: string;
    description: string;
}

export interface QuickActionsConfig {
    order: QuickActionId[];
    hidden: QuickActionId[];
    sortMode: QuickActionSortMode;
    usageCounts: Record<string, number>;
    version: number;
    lastUpdated?: string;
}

export const DEFAULT_QUICK_ACTIONS: QuickActionItem[] = [
    {
        id: "invoice-ledger",
        label: "Invoice Ledger",
        icon: ReceiptText,
        href: "/landlord/invoices",
        color: "text-blue-400",
        description: "Track rental payments, monitor pending balances, and issue invoices.",
    },
    {
        id: "utility-submeters",
        label: "Utility Submeters",
        icon: Zap,
        href: "/landlord/utility-billing",
        color: "text-amber-400",
        description: "Record water & electric readings, calculate usage, and post invoice updates.",
    },
    {
        id: "tenant-records",
        label: "Tenant Records",
        icon: FileText,
        href: "/landlord/tenants",
        color: "text-emerald-400",
        description: "View active tenant profiles, lease status, and occupant contact details.",
    },
    {
        id: "property-portfolio",
        label: "Property Portfolio",
        icon: Building2,
        href: "/landlord/properties",
        color: "text-violet-400",
        description: "Manage properties, configure rental units, and review occupancy.",
    },
    {
        id: "rental-applications",
        label: "Rental Applications",
        icon: ClipboardList,
        href: "/landlord/applications",
        color: "text-primary",
        description: "Evaluate applicant submissions, verify screening data, and approve leases.",
    },
    {
        id: "unit-visualizer",
        label: "Unit Visualizer",
        icon: FolderSearch2,
        href: "/landlord/unit-map",
        color: "text-amber-400",
        description: "Interactive architectural layout of units, floor maps, and occupancy status.",
    },
    {
        id: "maintenance-desk",
        label: "Maintenance Desk",
        icon: Hammer,
        href: "/landlord/maintenance",
        color: "text-rose-400",
        description: "Resolve work orders, track repairs, and communicate with maintenance staff.",
    },
    {
        id: "lease-lifecycle",
        label: "Lease Lifecycle",
        icon: RefreshCw,
        href: "/landlord/tenants?tab=renewals",
        color: "text-indigo-400",
        description: "Monitor ending leases, process contract extensions, and manage renewals.",
    },
    {
        id: "financial-metrics",
        label: "Financial Metrics",
        icon: BarChart3,
        href: "/landlord/analytics",
        color: "text-teal-400",
        description: "Deep-dive cash flow, yield tracking, utility usage, and forecast projections.",
    },
    {
        id: "settings",
        label: "Settings",
        icon: Settings2,
        href: "/landlord/settings",
        color: "text-slate-400",
        description: "Configure system rules, customize utility pricing, and manage account security.",
    },
];

export const QUICK_ACTIONS_MAP: Record<QuickActionId, QuickActionItem> = DEFAULT_QUICK_ACTIONS.reduce(
    (acc, item) => {
        acc[item.id] = item;
        return acc;
    },
    {} as Record<QuickActionId, QuickActionItem>
);

export const DEFAULT_QUICK_ACTIONS_ORDER: QuickActionId[] = DEFAULT_QUICK_ACTIONS.map((a) => a.id);

export function getInitialQuickActionsConfig(): QuickActionsConfig {
    return {
        order: [...DEFAULT_QUICK_ACTIONS_ORDER],
        hidden: [],
        sortMode: "custom",
        usageCounts: {},
        version: 1,
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * Validates and merges an incoming/cached config against the current catalog.
 * Guarantees all active catalog IDs are accounted for and no invalid IDs exist.
 */
export function sanitizeQuickActionsConfig(
    raw: unknown,
    catalog: QuickActionItem[] = DEFAULT_QUICK_ACTIONS
): QuickActionsConfig {
    const validIds = new Set(catalog.map((item) => item.id));
    const fallback = getInitialQuickActionsConfig();

    if (!raw || typeof raw !== "object") {
        return fallback;
    }

    const data = raw as Partial<QuickActionsConfig>;

    // 1. Sanitize sortMode
    const sortMode: QuickActionSortMode =
        data.sortMode === "frequently_used" ? "frequently_used" : "custom";

    // 2. Sanitize hidden list
    const rawHidden = Array.isArray(data.hidden) ? data.hidden : [];
    const validHidden = rawHidden.filter((id): id is QuickActionId =>
        typeof id === "string" && validIds.has(id as QuickActionId)
    );
    const hiddenSet = new Set<QuickActionId>(validHidden);

    // 3. Sanitize order list
    const rawOrder = Array.isArray(data.order) ? data.order : [];
    const sanitizedOrder: QuickActionId[] = [];
    const seenOrder = new Set<QuickActionId>();

    for (const id of rawOrder) {
        if (typeof id === "string" && validIds.has(id as QuickActionId) && !seenOrder.has(id as QuickActionId)) {
            sanitizedOrder.push(id as QuickActionId);
            seenOrder.add(id as QuickActionId);
        }
    }

    // Append any catalog IDs that were missing from order
    for (const item of catalog) {
        if (!seenOrder.has(item.id)) {
            sanitizedOrder.push(item.id);
            seenOrder.add(item.id);
        }
    }

    // Safeguard: Ensure at least one action remains visible
    if (hiddenSet.size >= sanitizedOrder.length && sanitizedOrder.length > 0) {
        // Unhide the first action in order
        hiddenSet.delete(sanitizedOrder[0]);
    }

    // 4. Sanitize usage counts
    const usageCounts: Record<string, number> = {};
    if (data.usageCounts && typeof data.usageCounts === "object") {
        for (const [key, val] of Object.entries(data.usageCounts)) {
            if (typeof val === "number" && Number.isFinite(val) && val > 0) {
                usageCounts[key] = Math.floor(val);
            }
        }
    }

    return {
        order: sanitizedOrder,
        hidden: Array.from(hiddenSet),
        sortMode,
        usageCounts,
        version: typeof data.version === "number" ? data.version : 1,
        lastUpdated: typeof data.lastUpdated === "string" ? data.lastUpdated : new Date().toISOString(),
    };
}

/**
 * Resolves the items to display in the main Quick Actions grid based on visibility and sorting mode.
 */
export function resolveDisplayedActions(
    config: QuickActionsConfig,
    catalog: QuickActionItem[] = DEFAULT_QUICK_ACTIONS
): QuickActionItem[] {
    const itemMap = new Map<QuickActionId, QuickActionItem>(catalog.map((item) => [item.id, item]));
    const hiddenSet = new Set(config.hidden);

    // Filter out hidden items preserving the custom order
    const visibleItems: QuickActionItem[] = [];
    for (const id of config.order) {
        if (!hiddenSet.has(id)) {
            const item = itemMap.get(id);
            if (item) {
                visibleItems.push(item);
            }
        }
    }

    if (config.sortMode === "frequently_used") {
        // Sort descending by usage count, using custom order index as a stable tie-breaker
        const orderIndex = new Map<QuickActionId, number>(
            config.order.map((id, idx) => [id, idx])
        );

        return [...visibleItems].sort((a, b) => {
            const countA = config.usageCounts[a.id] || 0;
            const countB = config.usageCounts[b.id] || 0;

            if (countB !== countA) {
                return countB - countA;
            }

            return (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0);
        });
    }

    return visibleItems;
}

/**
 * Returns the list of currently hidden actions.
 */
export function resolveHiddenActions(
    config: QuickActionsConfig,
    catalog: QuickActionItem[] = DEFAULT_QUICK_ACTIONS
): QuickActionItem[] {
    const itemMap = new Map<QuickActionId, QuickActionItem>(catalog.map((item) => [item.id, item]));
    const hiddenSet = new Set(config.hidden);

    const hiddenItems: QuickActionItem[] = [];
    for (const id of config.order) {
        if (hiddenSet.has(id)) {
            const item = itemMap.get(id);
            if (item) {
                hiddenItems.push(item);
            }
        }
    }
    return hiddenItems;
}
