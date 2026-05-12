import {
    Droplets,
    Zap,
    Thermometer,
    LayoutGrid,
    Hammer,
    Bug,
    Wrench,
    type LucideIcon,
} from "lucide-react";

export const MAINTENANCE_CATEGORIES = [
    {
        id: "plumbing",
        label: "Plumbing",
        icon: Droplets,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
    },
    {
        id: "electrical",
        label: "Electrical",
        icon: Zap,
        color: "text-yellow-500",
        bg: "bg-yellow-500/10",
    },
    {
        id: "hvac",
        label: "HVAC / Cooling",
        icon: Thermometer,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
    },
    {
        id: "appliances",
        label: "Appliances",
        icon: LayoutGrid,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
    },
    {
        id: "structural",
        label: "Structural",
        icon: Hammer,
        color: "text-neutral-500",
        bg: "bg-neutral-500/10",
    },
    {
        id: "pest",
        label: "Pest Control",
        icon: Bug,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
    },
    {
        id: "other",
        label: "Other / General",
        icon: Wrench,
        color: "text-cyan-500",
        bg: "bg-cyan-500/10",
    },
] as const;

export type MaintenanceCategoryId = (typeof MAINTENANCE_CATEGORIES)[number]["id"];