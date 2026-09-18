"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tooltip } from "@/components/ui/tooltip";
import { EyeOff, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuickActionItem, QuickActionId } from "@/lib/landlord/quick-actions";

interface SortableActionCardProps {
    action: QuickActionItem;
    isCustomizing: boolean;
    onHide: (id: QuickActionId) => void;
    onTrackUsage: (id: QuickActionId) => void;
}

export function SortableActionCard({
    action,
    isCustomizing,
    onHide,
    onTrackUsage,
}: SortableActionCardProps) {
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

    // Normal View Mode: Render standard clickable card linking to the feature
    if (!isCustomizing) {
        return (
            <Tooltip content={action.description}>
                <Link
                    href={action.href}
                    onClick={() => onTrackUsage(action.id)}
                    className={cn(
                        "neumorphic-extruded group flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2 rounded-[1.25rem] p-2.5 sm:p-3 xl:p-3.5 min-w-0 w-full overflow-hidden transition-all",
                        "dark:bento-glass-card dark:hover:bg-primary/5 dark:hover:border-primary/20 dark:hover:shadow-[0_0_20px_rgba(196,176,255,0.1)] active:scale-95"
                    )}
                    aria-label={`${action.label}: ${action.description}`}
                >
                    <div
                        className={cn(
                            "neumorphic-inset-card flex size-8 sm:size-9 xl:size-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 shrink-0",
                            "dark:bg-white/[0.05] dark:border-white/10 dark:shadow-none",
                            action.color
                        )}
                    >
                        <action.icon className="size-4 sm:size-5" />
                    </div>
                    <div className="flex flex-col gap-0.5 text-center min-w-0 w-full px-1">
                        <span className="text-[11px] sm:text-xs font-bold tracking-tight transition-colors text-foreground/90 group-hover:text-foreground line-clamp-2 break-words leading-tight">
                            {action.label}
                        </span>
                    </div>
                </Link>
            </Tooltip>
        );
    }

    // Inline Customization Mode: Preserves tactile neumorphic depth with refined controls
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "neumorphic-extruded group relative flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2 rounded-[1.25rem] p-2.5 sm:p-3 xl:p-3.5 min-w-0 w-full overflow-hidden transition-all select-none",
                "dark:bento-glass-card hover:ring-1 hover:ring-primary/30",
                isDragging
                    ? "opacity-50 scale-95 shadow-2xl ring-2 ring-primary z-50 rotate-[0.5deg]"
                    : "cursor-grab active:cursor-grabbing hover:scale-[1.02]"
            )}
            {...attributes}
            {...listeners}
            role="button"
            tabIndex={0}
            aria-label={`Reorder ${action.label}`}
        >
            {/* Top Row: Discreet drag indicator & hide action */}
            <div className="absolute top-2 left-2 flex items-center justify-center size-6 rounded-lg text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors pointer-events-none">
                <GripVertical className="size-3.5" />
            </div>

            <Tooltip content={`Hide "${action.label}"`}>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onHide(action.id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                        "absolute top-2 right-2 flex size-6 items-center justify-center rounded-lg transition-all",
                        "bg-muted/60 hover:bg-destructive/10 text-muted-foreground hover:text-destructive",
                        "border border-transparent hover:border-destructive/25 shadow-2xs"
                    )}
                    aria-label={`Hide ${action.label}`}
                >
                    <EyeOff className="size-3.5" />
                </button>
            </Tooltip>

            {/* Icon Well */}
            <div
                className={cn(
                    "neumorphic-inset-card flex size-8 sm:size-9 xl:size-10 items-center justify-center rounded-xl shrink-0 mt-2",
                    "dark:bg-white/[0.05] dark:border-white/10 dark:shadow-none",
                    action.color
                )}
            >
                <action.icon className="size-4 sm:size-5" />
            </div>

            {/* Label */}
            <div className="flex flex-col gap-0.5 text-center min-w-0 w-full px-1 mb-1">
                <span className="text-[11px] sm:text-xs font-bold tracking-tight text-foreground/90 line-clamp-2 break-words leading-tight">
                    {action.label}
                </span>
            </div>
        </div>
    );
}
