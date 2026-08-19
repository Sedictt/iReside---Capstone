"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { m as motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    getOverallQuestProgress,
    type LandlordProductTourState
} from "@/lib/landlord-product-tour";

interface MissionTriggerButtonProps {
    onOpen: () => void;
    className?: string;
}

export function MissionTriggerButton({ onOpen, className }: MissionTriggerButtonProps) {
    const [state, setState] = useState<LandlordProductTourState | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const fetchState = useCallback(async () => {
        try {
            const res = await fetch("/api/landlord/tour?start=0");
            if (res.ok) {
                const data = await res.json();
                if (data?.state) {
                    setState(data.state);
                }
            }
        } catch {
            // Silently ignore network failures for background status
        }
    }, []);

    useEffect(() => {
        fetchState();

        const handleRefresh = () => {
            fetchState();
        };

        window.addEventListener("open-quest-board", handleRefresh);
        window.addEventListener("quest-progress-updated", handleRefresh);
        window.addEventListener("focus", handleRefresh);

        return () => {
            window.removeEventListener("open-quest-board", handleRefresh);
            window.removeEventListener("quest-progress-updated", handleRefresh);
            window.removeEventListener("focus", handleRefresh);
        };
    }, [fetchState]);

    // Periodic automatic flip (flips every 4 seconds)
    useEffect(() => {
        if (isHovered) return;

        const interval = setInterval(() => {
            setIsFlipped((prev) => !prev);
        }, 4000);

        return () => clearInterval(interval);
    }, [isHovered]);

    const progress = getOverallQuestProgress(state);
    const isCompleted = progress === 100;
    const showBack = isHovered ? true : isFlipped;

    return (
        <button
            onClick={onOpen}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            data-tour-id="tour-quest-trigger"
            aria-label={`Mission Control, ${progress}% completed`}
            className={cn(
                "relative group flex size-11 items-center justify-center rounded-2xl neumorphic-extruded active:scale-95 text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary/40 overflow-hidden",
                className
            )}
        >
            <AnimatePresence mode="wait" initial={false}>
                {!showBack ? (
                    <motion.div
                        key="front-icon"
                        initial={{ rotateY: -90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: 90, opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="flex size-full items-center justify-center"
                    >
                        {isCompleted ? (
                            <CheckCircle2 className="size-5 text-emerald-500 transition-transform group-hover:scale-110" />
                        ) : (
                            <AlertCircle className="size-5 text-primary transition-transform group-hover:scale-110" />
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="back-progress"
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: -90, opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="flex size-full items-center justify-center"
                    >
                        <span className={cn(
                            "text-xs font-black tracking-tight select-none",
                            isCompleted ? "text-emerald-500" : "text-primary"
                        )}>
                            {progress}%
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tooltip on Hover */}
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 scale-0 px-2.5 py-1 rounded-lg bg-surface-4 text-[10px] font-black text-foreground opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all whitespace-nowrap border border-white/5 shadow-xl pointer-events-none z-30">
                {isCompleted ? "Missions (100% Completed)" : `Missions (${progress}% Done)`}
            </span>
        </button>
    );
}
