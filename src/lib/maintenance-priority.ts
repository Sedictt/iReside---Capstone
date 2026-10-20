/**
 * Single source of truth for how a maintenance ticket's priority is labelled
 * and coloured. The DB stores `low | medium | high | urgent`; every screen
 * (tenant, landlord, mobile, dashboard) shows the same label for the same
 * value, so an `urgent` ticket always reads "Critical".
 *
 * Labels are English i18n keys — pass them through `t()` at render.
 */
import type { MaintenancePriority } from "@/types/database";

export type MaintenancePriorityLabel = "Critical" | "High" | "Medium" | "Low";

/** DB values, lowest to highest. */
export const MAINTENANCE_PRIORITY_VALUES: readonly MaintenancePriority[] = ["low", "medium", "high", "urgent"];

export const MAINTENANCE_PRIORITY_LABELS: Record<MaintenancePriority, MaintenancePriorityLabel> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    urgent: "Critical",
};

const LABEL_TO_DB: Record<MaintenancePriorityLabel, MaintenancePriority> = {
    Low: "low",
    Medium: "medium",
    High: "high",
    Critical: "urgent",
};

/** Full badge text ("Critical Priority", …); each has a Filipino dictionary entry. */
export const MAINTENANCE_PRIORITY_BADGE_TEXT: Record<MaintenancePriorityLabel, string> = {
    Critical: "Critical Priority",
    High: "High Priority",
    Medium: "Medium Priority",
    Low: "Low Priority",
};

/** Solid badge colours. */
export const MAINTENANCE_PRIORITY_BADGE_CLASSES: Record<MaintenancePriorityLabel, string> = {
    Critical: "bg-red-600 border-red-700 text-white",
    High: "bg-orange-500 border-orange-600 text-white",
    Medium: "bg-blue-600 border-blue-700 text-white",
    Low: "bg-zinc-200 border-zinc-300 text-zinc-700 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-300",
};

/** Tinted badge colours, same hues, for compact/mobile chips. */
export const MAINTENANCE_PRIORITY_SOFT_CLASSES: Record<MaintenancePriorityLabel, string> = {
    Critical: "border-red-500/30 bg-red-500/10 text-red-500",
    High: "border-orange-500/30 bg-orange-500/10 text-orange-500",
    Medium: "border-blue-500/30 bg-blue-500/10 text-blue-500",
    Low: "border-border bg-muted/30 text-muted-foreground",
};

/** Sort weight, higher is more severe. */
export const MAINTENANCE_PRIORITY_RANK: Record<MaintenancePriorityLabel, number> = {
    Critical: 3,
    High: 2,
    Medium: 1,
    Low: 0,
};

/**
 * Normalises a DB value ("urgent") or an already-mapped label ("Critical"),
 * in any case, to the display label. Unknown or missing values read as "Low".
 */
export function toPriorityLabel(value: string | null | undefined): MaintenancePriorityLabel {
    const normalized = (value ?? "").trim().toLowerCase();
    if (normalized === "urgent" || normalized === "critical") return "Critical";
    if (normalized === "high") return "High";
    if (normalized === "medium") return "Medium";
    return "Low";
}

/** Maps a display label (or DB value) back to the DB enum. */
export function toDbPriority(value: string | null | undefined): MaintenancePriority {
    return LABEL_TO_DB[toPriorityLabel(value)];
}
