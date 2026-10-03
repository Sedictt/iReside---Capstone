"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tooltip } from "@/components/ui/tooltip";
import { EyeOff, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import type { QuickActionItem, QuickActionId } from "@/lib/landlord/quick-actions";

interface SortableActionCardProps {
    action: QuickActionItem;
    isCustomizing: boolean;
    onHide: (id: QuickActionId) => void;
    onTrackUsage: (id: QuickActionId) => void;
    compact?: boolean;
    onSelect?: () => void;
}

const ACTION_THEME: Record<
    QuickActionId,
    { iconColor: string; iconBg: string }
> = {
    "invoice-ledger": {
        iconColor: "text-blue-500 dark:text-blue-400",
        iconBg: "bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/20",
    },
    "utility-submeters": {
        iconColor: "text-amber-500 dark:text-amber-400",
        iconBg: "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20",
    },
    "tenant-records": {
        iconColor: "text-emerald-500 dark:text-emerald-400",
        iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20",
    },
    "property-portfolio": {
        iconColor: "text-purple-500 dark:text-purple-400",
        iconBg: "bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/20",
    },
    "rental-applications": {
        iconColor: "text-violet-500 dark:text-violet-400",
        iconBg: "bg-violet-500/10 dark:bg-violet-500/15 border-violet-500/20",
    },
    "unit-visualizer": {
        iconColor: "text-amber-500 dark:text-amber-400",
        iconBg: "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20",
    },
    "maintenance-desk": {
        iconColor: "text-rose-500 dark:text-rose-400",
        iconBg: "bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/20",
    },
    "lease-lifecycle": {
        iconColor: "text-indigo-500 dark:text-indigo-400",
        iconBg: "bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500/20",
    },
    "financial-metrics": {
        iconColor: "text-teal-500 dark:text-teal-400",
        iconBg: "bg-teal-500/10 dark:bg-teal-500/15 border-teal-500/20",
    },
    "settings": {
        iconColor: "text-slate-500 dark:text-slate-400",
        iconBg: "bg-slate-500/10 dark:bg-slate-500/15 border-slate-500/20",
    },
};

export function SortableActionCard({
    action,
    isCustomizing,
    onHide,
    onTrackUsage,
    compact = false,
    onSelect,
}: SortableActionCardProps) {
    const { t } = useLanguage();
    const label = t(action.label);
    const description = t(action.description);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: action.id,
        disabled: !isCustomizing,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const theme = ACTION_THEME[action.id] || {
        iconColor: action.color,
        iconBg: "bg-muted/40 border-border/40",
    };

    // Normal View Mode
    if (!isCustomizing) {
        return (
            <Tooltip content={description}>
                <Link
                    href={action.href}
                    onClick={() => {
                        onTrackUsage(action.id);
                        onSelect?.();
                    }}
                    className={cn(
                        "group flex flex-col items-center justify-center text-center overflow-hidden transition-all duration-200 cursor-pointer w-full min-w-0 bg-card border border-border/70 hover:border-border",
                        compact
                            ? "gap-2 p-2.5 sm:p-3 min-h-[82px] sm:min-h-[88px] rounded-2xl"
                            : "gap-3.5 rounded-2xl sm:rounded-3xl p-5 sm:p-7 min-h-[120px] sm:min-h-[140px]",
                        "dark:hover:bg-primary/5 dark:hover:border-primary/20 hover:scale-[1.02] active:scale-95 shadow-2xs hover:shadow-xs"
                    )}
                    aria-label={`${label}: ${description}`}
                >
                    <div
                        className={cn(
                            "flex items-center justify-center border transition-all duration-300 group-hover:scale-110 shrink-0",
                            compact
                                ? "size-9 rounded-xl"
                                : "size-12 sm:size-14 rounded-2xl",
                            theme.iconBg,
                            theme.iconColor
                        )}
                    >
                        <action.icon className={compact ? "size-4.5" : "size-6 sm:size-7"} />
                    </div>
                    <div className="flex flex-col gap-0.5 text-center min-w-0 w-full px-0.5">
                        <span className={cn(
                            "font-bold tracking-tight text-foreground transition-colors group-hover:text-primary line-clamp-2 break-words",
                            compact ? "text-[11px] sm:text-xs leading-tight" : "text-xs sm:text-sm leading-snug"
                        )}>
                            {label}
                        </span>
                    </div>
                </Link>
            </Tooltip>
        );
    }

    // Inline Customization Mode
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative flex flex-col items-center justify-center text-center overflow-hidden transition-all select-none w-full min-w-0 bg-card border border-border/70 hover:border-border",
                compact
                    ? "gap-2 p-2.5 sm:p-3 min-h-[82px] sm:min-h-[88px] rounded-2xl"
                    : "gap-3 rounded-2xl sm:rounded-3xl p-5 sm:p-7 min-h-[120px] sm:min-h-[140px]",
                "dark:hover:bg-primary/5 hover:ring-2 hover:ring-primary/40",
                isDragging
                    ? "opacity-50 scale-95 shadow-xl ring-2 ring-primary z-50 rotate-[0.5deg]"
                    : "cursor-grab active:cursor-grabbing hover:scale-[1.02]"
            )}
            {...attributes}
            {...listeners}
            role="button"
            tabIndex={0}
            aria-label={`Reorder ${label}`}
        >
            {/* Top Row: Discreet drag indicator & hide action */}
            <div className={cn(
                "absolute flex items-center justify-center rounded-lg text-muted-foreground/50 group-hover:text-muted-foreground transition-colors pointer-events-none",
                compact ? "top-1.5 left-1.5 size-5" : "top-2.5 left-2.5 size-7"
            )}>
                <GripVertical className={compact ? "size-3" : "size-4"} />
            </div>

            <Tooltip content={`Hide "${label}"`}>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onHide(action.id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                        "absolute flex items-center justify-center rounded-lg transition-all",
                        compact ? "top-1.5 right-1.5 size-5" : "top-2.5 right-2.5 size-7",
                        "bg-muted/70 hover:bg-destructive/15 text-muted-foreground hover:text-destructive",
                        "border border-border/50 hover:border-destructive/30 shadow-2xs cursor-pointer"
                    )}
                    aria-label={`Hide ${label}`}
                >
                    <EyeOff className={compact ? "size-3" : "size-3.5"} />
                </button>
            </Tooltip>

            {/* Icon Well */}
            <div
                className={cn(
                    "flex items-center justify-center border shrink-0 mt-0.5",
                    compact
                        ? "size-9 rounded-xl"
                        : "size-12 sm:size-14 rounded-2xl",
                    theme.iconBg,
                    theme.iconColor
                )}
            >
                <action.icon className={compact ? "size-4.5" : "size-6 sm:size-7"} />
            </div>

            {/* Label */}
            <div className="flex flex-col gap-0.5 text-center min-w-0 w-full px-0.5">
                <span className={cn(
                    "font-bold tracking-tight text-foreground line-clamp-2 break-words",
                    compact ? "text-[11px] sm:text-xs leading-tight" : "text-xs sm:text-sm leading-snug"
                )}>
                    {label}
                </span>
            </div>
        </div>
    );
}
