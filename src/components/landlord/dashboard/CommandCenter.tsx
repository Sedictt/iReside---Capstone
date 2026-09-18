"use client";

import Link from "next/link";
import { Tooltip } from "@/components/ui/tooltip";
import {
    ArrowRight,
    Building2,
    ClipboardList,
    FileText,
    QrCode,
    ReceiptText,
    Settings2,
    ShieldCheck,
    TrendingUp,
    Zap,
    BarChart3,
    FolderSearch2,
    Hammer,
    RefreshCw,
    SlidersHorizontal,
    Check,
    RotateCcw,
    Plus,
    EyeOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { useQuickActions } from "@/hooks/useQuickActions";
import { SortableActionCard } from "./SortableActionCard";
import type { QuickActionId } from "@/lib/landlord/quick-actions";

type CommandCenterProps = {
    overdueCount: number;
    nearDueCount: number;
    vacantUnitsCount: number;
    activeInviteCount: number;
    loadingPayments?: boolean;
    loadingUnits?: boolean;
    loadingInvites?: boolean;
    onOpenVacantUnits?: () => void;
    onOpenOverduePayments?: () => void;
    onOpenNearDuePayments?: () => void;
    onOpenInvites?: () => void;
};

type StatCard = {
    label: string;
    value: number;
    isLoading?: boolean;
    href?: string;
    onClick?: () => void;
    toneClass: string;
    icon: LucideIcon;
};

type NextMove = {
    id: string;
    title: string;
    detail: string;
    href?: string;
    onClick?: () => void;
    cta: string;
    urgency: "high" | "medium" | "low";
};

const urgencyStyles: Record<NextMove["urgency"], string> = {
    high: "border-red-500/25 bg-red-500/12 text-red-400",
    medium: "border-amber-500/25 bg-amber-500/12 text-amber-400",
    low: "border-primary/25 bg-primary/12 text-primary",
};

export function CommandCenter({
    overdueCount,
    nearDueCount,
    vacantUnitsCount,
    activeInviteCount,
    loadingPayments = false,
    loadingUnits = false,
    loadingInvites = false,
    onOpenVacantUnits,
    onOpenOverduePayments,
    onOpenNearDuePayments,
    onOpenInvites,
}: CommandCenterProps) {
    const {
        config,
        displayedActions,
        hiddenActions,
        isCustomizing,
        startCustomizing,
        finishCustomizing,
        reorderActions,
        toggleVisibility,
        restoreAll,
        setSortMode,
        trackActionUsage,
        resetToDefaults,
    } = useQuickActions();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            reorderActions(active.id as QuickActionId, over.id as QuickActionId);
        }
    };

    const statCards: StatCard[] = [
        {
            label: "Overdue",
            value: overdueCount,
            isLoading: loadingPayments,
            href: onOpenOverduePayments ? undefined : "/landlord/invoices?tab=invoices&status=overdue",
            onClick: onOpenOverduePayments,
            toneClass: "text-red-400 cursor-pointer hover:border-red-500/40",
            icon: Zap
        },
        {
            label: "Near Due",
            value: nearDueCount,
            isLoading: loadingPayments,
            href: onOpenNearDuePayments ? undefined : "/landlord/invoices?tab=invoices&status=pending",
            onClick: onOpenNearDuePayments,
            toneClass: "text-amber-400 cursor-pointer hover:border-amber-500/40",
            icon: TrendingUp
        },
        {
            label: "Vacant",
            value: vacantUnitsCount,
            isLoading: loadingUnits,
            href: onOpenVacantUnits ? undefined : "/landlord/properties",
            onClick: onOpenVacantUnits,
            toneClass: "text-sky-400 cursor-pointer hover:border-sky-500/40",
            icon: Building2
        },
        {
            label: "Invites",
            value: activeInviteCount,
            isLoading: loadingInvites,
            href: onOpenInvites ? undefined : "/landlord/applications",
            onClick: onOpenInvites,
            toneClass: "text-primary cursor-pointer hover:border-primary/40",
            icon: QrCode
        },
    ];

    const nextMoves: NextMove[] = [
        overdueCount > 0
            ? {
                id: "overdue",
                title: "Collect overdue rent",
                detail: `${overdueCount} overdue payment${overdueCount === 1 ? "" : "s"} need follow-up.`,
                href: onOpenOverduePayments ? undefined : "/landlord/invoices?tab=invoices&status=overdue",
                onClick: onOpenOverduePayments,
                cta: onOpenOverduePayments ? "Review overdue" : "Open invoices",
                urgency: "high",
            }
            : {
                id: "health",
                title: "System check: Healthy",
                detail: "Every account is up to date. Excellent operations.",
                href: "/landlord/invoices?tab=invoices",
                cta: "Review ledger",
                urgency: "low",
            },
        vacantUnitsCount > 0
            ? {
                id: "vacancy",
                title: "Optimize occupancy",
                detail: `${vacantUnitsCount} unit${vacantUnitsCount === 1 ? "" : "s"} are awaiting new residents.`,
                href: onOpenVacantUnits ? undefined : "/landlord/properties",
                onClick: onOpenVacantUnits,
                cta: onOpenVacantUnits ? "Review vacant units" : "Open properties",
                urgency: "medium",
            }
            : {
                id: "occupancy",
                title: "Full occupancy reached",
                detail: "Maximize revenue by maintaining current satisfaction.",
                href: "/landlord/unit-map",
                cta: "View unit map",
                urgency: "low",
            },
        {
            id: "utility-billing",
            title: "Record Monthly Submeters",
            detail: "Record water and electric readings to post utility charges to invoices.",
            href: "/landlord/utility-billing",
            cta: "Record submeters",
            urgency: "low",
        },
    ];

    return (
        <section className={cn(
            "neumorphic-panel relative group/section overflow-hidden rounded-[2.5rem] p-4 sm:p-6 md:p-8",
            "dark:glass-premium dark:bg-card/40 dark:border-white/10 dark:shadow-2xl"
        )}>
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 size-64 rounded-full bg-primary/10 blur-[80px] pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-500" />
            
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between relative z-10">
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    <div className="neumorphic-inset-card flex size-12 sm:size-14 items-center justify-center rounded-[1.25rem] text-primary dark:bg-primary/10 dark:border-primary/20 dark:shadow-none shrink-0">
                        <ShieldCheck className="size-6 sm:size-7" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Intelligence Hub</h2>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground/80 leading-relaxed truncate sm:whitespace-normal">
                            Orchestrating your property ecosystem from one dashboard.
                        </p>
                    </div>
                </div>

                {/* Real-time stats pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-center gap-2 sm:gap-2.5 xl:gap-3 w-full lg:w-auto shrink-0">
                    {statCards.map((stat) => {
                        const content = (
                            <>
                                <stat.icon className="size-4 opacity-80 transition-opacity group-hover:opacity-100 shrink-0" />
                                <div className="flex flex-col text-left min-w-0">
                                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{stat.label}</span>
                                    {stat.isLoading ? (
                                        <div className="h-4 w-8 rounded bg-muted animate-pulse mt-1" />
                                    ) : (
                                        <span className="text-sm sm:text-base font-black leading-none text-foreground">{stat.value}</span>
                                    )}
                                </div>
                            </>
                        );

                        const cardClass = cn(
                            "neumorphic-extruded group relative flex items-center gap-2 sm:gap-2.5 xl:gap-3 rounded-2xl px-3 sm:px-3.5 xl:px-4 py-2 sm:py-2.5 active:scale-95 justify-start min-w-0 shrink-0",
                            "dark:bento-glass-card dark:hover:bg-white/[0.05] transition-all cursor-pointer",
                            stat.toneClass
                        );

                        if (stat.onClick) {
                            return (
                                <button
                                    key={stat.label}
                                    type="button"
                                    onClick={stat.onClick}
                                    className={cardClass}
                                    title={`View ${stat.label} details`}
                                >
                                    {content}
                                </button>
                            );
                        }

                        return (
                            <Link
                                key={stat.label}
                                href={stat.href || "#"}
                                className={cardClass}
                            >
                                {content}
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] relative z-10">
                {/* Operations Center */}
                <div className={cn(
                    "neumorphic-inset rounded-[2rem] p-4 sm:p-5 md:p-6 min-w-0",
                    "dark:bento-glass-inset"
                )}>
                    <div className="mb-5 sm:mb-6 flex items-start sm:items-center justify-between gap-3 flex-wrap">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span className="h-1.5 w-4 rounded-full bg-primary" />
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/90">
                                    Operations Center
                                </h3>
                                {isCustomizing && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                        Customizing
                                    </span>
                                )}
                            </div>
                            {isCustomizing ? (
                                <p className="text-[11px] text-muted-foreground font-medium mt-1">
                                    Drag cards to rearrange &bull; Tap eye icon to hide &bull; Click any item below to restore
                                </p>
                            ) : null}
                        </div>

                        <div className="flex items-center gap-1.5">
                            {!isCustomizing ? (
                                <>
                                    {/* Compact Segmented Sort Control */}
                                    <div className="flex items-center rounded-lg bg-muted/60 dark:bg-white/[0.05] p-0.5 text-[10.5px] font-semibold border border-border/40 shadow-inner">
                                        <button
                                            type="button"
                                            onClick={() => setSortMode("custom")}
                                            className={cn(
                                                "px-2 py-0.5 rounded-md transition-all",
                                                config.sortMode === "custom"
                                                    ? "bg-background text-foreground shadow-xs font-bold"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                            title="Sort actions in your custom drag-and-drop order"
                                        >
                                            Custom
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSortMode("frequently_used")}
                                            className={cn(
                                                "px-2 py-0.5 rounded-md transition-all flex items-center gap-1",
                                                config.sortMode === "frequently_used"
                                                    ? "bg-background text-foreground shadow-xs font-bold"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                            title="Sort actions dynamically by your usage frequency"
                                        >
                                            <TrendingUp className="size-2.5 text-amber-500" />
                                            Frequent
                                        </button>
                                    </div>

                                    {/* Compact Customize Trigger Button */}
                                    <button
                                        type="button"
                                        onClick={startCustomizing}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-border/60 hover:bg-muted/60 text-foreground transition-all shadow-xs active:scale-95"
                                        title="Customize grid layout and hidden actions"
                                    >
                                        <SlidersHorizontal className="size-3 text-muted-foreground" />
                                        <span>Customize</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Compact Edit Mode Actions */}
                                    <button
                                        type="button"
                                        onClick={resetToDefaults}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all border border-transparent hover:border-border/40 active:scale-95"
                                        title="Reset to factory layout"
                                    >
                                        <RotateCcw className="size-3" />
                                        <span>Reset</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={finishCustomizing}
                                        className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold rounded-lg bg-foreground text-background dark:bg-primary dark:text-primary-foreground hover:opacity-90 transition-all shadow-sm active:scale-95"
                                        title="Save and finish customization"
                                    >
                                        <Check className="size-3" />
                                        <span>Done</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={displayedActions.map((a) => a.id)}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                {displayedActions.map((action) => (
                                    <SortableActionCard
                                        key={action.id}
                                        action={action}
                                        isCustomizing={isCustomizing}
                                        onHide={toggleVisibility}
                                        onTrackUsage={trackActionUsage}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {/* Hidden Actions Shelf */}
                    {isCustomizing && hiddenActions.length > 0 && (
                        <div className="mt-6 pt-5 border-t border-border/50">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <EyeOff className="size-3.5 text-muted-foreground" />
                                    <h4 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                                        Hidden Actions
                                    </h4>
                                    <span className="flex items-center justify-center size-4.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-muted text-muted-foreground">
                                        {hiddenActions.length}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={restoreAll}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline hover:opacity-85 transition-all cursor-pointer"
                                    title="Restore all hidden actions to the grid"
                                >
                                    <RotateCcw className="size-3" />
                                    <span>Restore all to grid</span>
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {hiddenActions.map((action) => (
                                    <button
                                        key={action.id}
                                        type="button"
                                        onClick={() => toggleVisibility(action.id)}
                                        className={cn(
                                            "flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl transition-all group",
                                            "neumorphic-extruded hover:shadow-md hover:scale-[1.01] active:scale-98",
                                            "dark:bento-glass-card dark:hover:bg-white/[0.04]"
                                        )}
                                        title={`Restore ${action.label} to grid`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={cn(
                                                "flex size-7 items-center justify-center rounded-lg neumorphic-inset-card shrink-0",
                                                "dark:bg-white/[0.05]",
                                                action.color
                                            )}>
                                                <action.icon className="size-3.5" />
                                            </div>
                                            <span className="text-xs font-bold text-foreground/90 truncate">
                                                {action.label}
                                            </span>
                                        </div>
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                                            <Plus className="size-3.5" />
                                            Restore
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Insights Hub */}
                <div className={cn(
                    "neumorphic-inset rounded-[2rem] p-4 sm:p-5 md:p-6 min-w-0",
                    "dark:bento-glass-inset"
                )}>
                    <h3 className="mb-5 sm:mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80">
                        <span className="h-1 w-4 rounded-full bg-amber-500" />
                        Next Priorities
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                        {nextMoves.map((move) => (
                            <div key={move.id} className={cn(
                                "neumorphic-extruded group/item relative overflow-hidden rounded-2xl p-4",
                                "dark:bento-glass-card dark:hover:bg-white/[0.05] transition-all"
                            )}>
                                <div className="absolute top-0 right-0 p-2 opacity-0 -translate-y-1 translate-x-1 group-hover/item:opacity-20 transition-all">
                                    <Zap className="size-12" />
                                </div>
                                <div className="mb-2 flex items-center justify-between relative z-10">
                                    <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest", urgencyStyles[move.urgency])}>
                                        {move.urgency} Priority
                                    </span>
                                </div>
                                <h4 className="text-sm font-black text-foreground relative z-10">{move.title}</h4>
                                <p className="mt-1 text-xs font-medium text-muted-foreground/70 dark:text-white/60 leading-relaxed relative z-10">{move.detail}</p>
                                
                                {move.onClick ? (
                                    <button
                                        type="button"
                                        onClick={move.onClick}
                                        className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary transition-all hover:gap-3 group/link cursor-pointer"
                                    >
                                        {move.cta}
                                        <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-1" />
                                    </button>
                                ) : (
                                    <Link
                                        href={move.href || "#"}
                                        className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary transition-all hover:gap-3 group/link"
                                    >
                                        {move.cta}
                                        <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-1" />
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
