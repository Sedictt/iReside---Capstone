"use client";

import React from "react";
import { m as motion } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function VisualPlannerSkeleton({ propertyName }: { propertyName?: string }) {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-background dark:bg-background-dark text-foreground antialiased select-none relative overflow-hidden">
            {/* Subtle Atmosphere */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-primary/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative flex flex-col items-center gap-6 z-10">
                <div className="relative">
                    <LoadingSpinner size="lg" className="text-primary" />
                </div>

                <div className="flex flex-col items-center gap-2 text-center">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-xs font-black uppercase tracking-[0.25em] text-foreground/80"
                    >
                        {propertyName ? `Loading ${propertyName}` : "Loading Unit Map"}
                    </motion.p>
                    <p className="text-[11px] font-medium text-muted-foreground tracking-wide">
                        Synchronizing architectural layout and units...
                    </p>
                </div>
            </div>
        </div>
    );
}
