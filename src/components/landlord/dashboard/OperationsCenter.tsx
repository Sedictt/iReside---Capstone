"use client";

import React, { useState, useEffect } from "react";
import {
    LayoutGrid,
    X,
    SlidersHorizontal,
    TrendingUp,
    RotateCcw,
    Check,
    EyeOff,
    Plus,
} from "lucide-react";
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
import { m as motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useQuickActions } from "@/hooks/useQuickActions";
import { SortableActionCard } from "./SortableActionCard";
import type { QuickActionId } from "@/lib/landlord/quick-actions";

interface OperationsCenterProps {
    className?: string;
}

export function OperationsCenter({ className }: OperationsCenterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

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

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    return (
        <>
            {/* The Floating Action Button (FAB) */}
            <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.04 }}
                transition={{ type: "spring", stiffness: 420, damping: 25 }}
                onClick={() => setIsOpen((prev) => !prev)}
                className={cn(
                    "fixed bottom-6 right-6 md:right-28 z-40 group flex items-center gap-2.5 px-4 py-3 min-h-[48px] rounded-full",
                    "bg-primary text-primary-foreground font-bold shadow-[0_10px_30px_rgba(var(--primary-rgb),0.35)]",
                    "hover:bg-primary/95 hover:shadow-[0_14px_35px_rgba(var(--primary-rgb),0.5)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    "cursor-pointer select-none",
                    className
                )}
                aria-label={isOpen ? "Close Quick Actions & Tools" : "Open Quick Actions & Tools"}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
            >
                <div className="relative size-5 flex items-center justify-center shrink-0">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={isOpen ? "close-icon" : "grid-icon"}
                            initial={{ rotate: -120, opacity: 0, scale: 0.5 }}
                            animate={{ rotate: 0, opacity: 1, scale: 1 }}
                            exit={{ rotate: 120, opacity: 0, scale: 0.5 }}
                            transition={{ type: "spring", stiffness: 450, damping: 22 }}
                            className="flex items-center justify-center"
                        >
                            {isOpen ? (
                                <X className="size-5 stroke-[2.5]" aria-hidden="true" />
                            ) : (
                                <LayoutGrid className="size-5" aria-hidden="true" />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                        key={isOpen ? "close-text" : "tools-text"}
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className="text-xs sm:text-sm font-black tracking-tight pr-0.5 inline-block"
                    >
                        {isOpen ? "Close" : "Quick Tools"}
                    </motion.span>
                </AnimatePresence>
            </motion.button>

            {/* Floating Popover / Bottom Sheet with iOS Spring Physics */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* iOS-style Dimmed Backdrop */}
                        <motion.div
                            key="fab-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.24, ease: "easeOut" }}
                            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[4px]"
                            onClick={() => setIsOpen(false)}
                            aria-hidden="true"
                        />

                        {/* iOS Spring Popover / Bottom Sheet Card */}
                        <motion.div
                            key="fab-popover-card"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Quick Actions & Tools"
                            drag={isMobile ? "y" : false}
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={{ top: 0, bottom: 0.6 }}
                            onDragEnd={(_e, info) => {
                                if (info.offset.y > 100 || info.velocity.y > 400) {
                                    setIsOpen(false);
                                }
                            }}
                            style={{
                                transformOrigin: isMobile ? "bottom center" : "bottom right",
                            }}
                            initial={
                                shouldReduceMotion
                                    ? { opacity: 0 }
                                    : isMobile
                                        ? { y: "100%", opacity: 0 }
                                        : { opacity: 0, scale: 0.78, y: 16 }
                            }
                            animate={
                                shouldReduceMotion
                                    ? { opacity: 1 }
                                    : isMobile
                                        ? { y: 0, opacity: 1 }
                                        : { opacity: 1, scale: 1, y: 0 }
                            }
                            exit={
                                shouldReduceMotion
                                    ? { opacity: 0 }
                                    : isMobile
                                        ? { y: "100%", opacity: 0 }
                                        : { opacity: 0, scale: 0.8, y: 16 }
                            }
                            transition={{
                                type: "spring",
                                stiffness: isMobile ? 320 : 360,
                                damping: isMobile ? 32 : 27,
                                mass: isMobile ? 0.9 : 0.75,
                            }}
                            className={cn(
                                "fixed bottom-20 right-6 md:right-28 z-50 w-[420px] max-w-[calc(100vw-3rem)]",
                                "max-h-[calc(100vh-6.5rem)] overflow-y-auto rounded-3xl p-5 sm:p-6",
                                "neumorphic-panel bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl",
                                "space-y-4",
                                // Mobile Bottom Sheet Adaptation
                                "max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:max-h-[85vh] touch-pan-y"
                            )}
                        >
                        {/* Mobile Drag Indicator */}
                        <div className="sm:hidden flex justify-center pb-1">
                            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
                        </div>

                        {/* Header: Title, Organizing Tag & Close Button */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="h-1.5 w-5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                                <h2 className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                                    Quick Actions & Tools
                                </h2>
                                {isCustomizing && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                        Organizing
                                    </span>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="size-7 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                aria-label="Close Quick Actions & Tools"
                            >
                                <X className="size-4" aria-hidden="true" />
                            </button>
                        </div>

                        {/* Subheading / Instructions when customizing */}
                        {isCustomizing && (
                            <p className="text-[11px] text-muted-foreground font-medium">
                                Drag cards to rearrange &bull; Tap eye icon to hide &bull; Tap card below to restore
                            </p>
                        )}

                        {/* Controls Toolbar: Sort Mode & Customize */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-b border-border/50 pb-3">
                            {!isCustomizing ? (
                                <>
                                    {/* Segmented Sort Control */}
                                    <div 
                                        className="flex items-center rounded-xl bg-muted/60 dark:bg-white/[0.05] p-1 text-xs font-semibold border border-border/50 shadow-inner"
                                        role="group"
                                        aria-label="Quick action sort mode"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setSortMode("custom")}
                                            className={cn(
                                                "min-h-[28px] px-2.5 py-0.5 rounded-lg transition-all text-xs font-bold cursor-pointer",
                                                config.sortMode === "custom"
                                                    ? "bg-background text-foreground shadow-xs"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                            title="Sort cards in your custom order"
                                        >
                                            My Order
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSortMode("frequently_used")}
                                            className={cn(
                                                "min-h-[28px] px-2.5 py-0.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer",
                                                config.sortMode === "frequently_used"
                                                    ? "bg-background text-foreground shadow-xs"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                            title="Sort cards by how often you use them"
                                        >
                                            <TrendingUp className="size-3 text-amber-500" aria-hidden="true" />
                                            Most Used
                                        </button>
                                    </div>

                                    {/* Customize Trigger Button */}
                                    <button
                                        type="button"
                                        onClick={startCustomizing}
                                        className="inline-flex items-center gap-1.5 min-h-[32px] px-3 py-1 text-xs font-bold rounded-xl border border-border/60 hover:bg-muted/60 text-foreground transition-all shadow-xs active:scale-95 cursor-pointer"
                                        title="Rearrange or hide action cards"
                                    >
                                        <SlidersHorizontal className="size-3 text-muted-foreground" aria-hidden="true" />
                                        <span>Customize</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Edit Mode Actions */}
                                    <button
                                        type="button"
                                        onClick={resetToDefaults}
                                        className="inline-flex items-center gap-1 min-h-[32px] px-2.5 py-1 text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all border border-transparent hover:border-border/40 active:scale-95 cursor-pointer"
                                        title="Reset to factory layout"
                                    >
                                        <RotateCcw className="size-3" aria-hidden="true" />
                                        <span>Reset</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={finishCustomizing}
                                        className="inline-flex items-center gap-1 min-h-[32px] px-3.5 py-1 text-xs font-bold rounded-xl bg-foreground text-background dark:bg-primary dark:text-primary-foreground hover:opacity-90 transition-all shadow-sm active:scale-95 cursor-pointer"
                                        title="Save and finish customization"
                                    >
                                        <Check className="size-3.5" aria-hidden="true" />
                                        <span>Done</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* 3-Column Operations Grid in Compact Mode */}
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={displayedActions.map((a) => a.id)}
                                strategy={rectSortingStrategy}
                            >
                                <div 
                                    className="grid grid-cols-3 gap-2 sm:gap-2.5"
                                    role="list"
                                    aria-label="Operational tools"
                                >
                                    {displayedActions.map((action) => (
                                        <SortableActionCard
                                            key={action.id}
                                            action={action}
                                            compact
                                            isCustomizing={isCustomizing}
                                            onHide={toggleVisibility}
                                            onTrackUsage={trackActionUsage}
                                            onSelect={() => setIsOpen(false)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {/* Hidden Actions Drawer when Customizing */}
                        {isCustomizing && hiddenActions.length > 0 && (
                            <div className="pt-4 border-t border-border/50 animate-in fade-in duration-200">
                                <div className="mb-2.5 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <EyeOff className="size-3 text-muted-foreground" aria-hidden="true" />
                                        <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                            Hidden Actions
                                        </h3>
                                        <span className="flex items-center justify-center size-4 text-[9px] font-bold rounded-full bg-muted text-muted-foreground">
                                            {hiddenActions.length}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={restoreAll}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline transition-all cursor-pointer"
                                        title="Restore all hidden actions to the grid"
                                    >
                                        <RotateCcw className="size-2.5" aria-hidden="true" />
                                        <span>Restore all</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {hiddenActions.map((action) => (
                                        <button
                                            key={action.id}
                                            type="button"
                                            onClick={() => toggleVisibility(action.id)}
                                            className={cn(
                                                "flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition-all group min-h-[38px]",
                                                "neumorphic-extruded hover:shadow-xs active:scale-98 cursor-pointer",
                                                "dark:bento-glass-card dark:hover:bg-white/[0.04]"
                                            )}
                                            title={`Restore ${action.label} to grid`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className={cn(
                                                    "flex size-6 items-center justify-center rounded-lg neumorphic-inset-card shrink-0",
                                                    "dark:bg-white/[0.05]",
                                                    action.color
                                                )}>
                                                    <action.icon className="size-3.5" aria-hidden="true" />
                                                </div>
                                                <span className="text-xs font-bold text-foreground truncate">
                                                    {action.label}
                                                </span>
                                            </div>
                                            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-primary group-hover:underline shrink-0">
                                                <Plus className="size-3" aria-hidden="true" />
                                                Restore
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    </>
);
}

// Export QuickActionsFab as alias for clarity
export { OperationsCenter as QuickActionsFab };
