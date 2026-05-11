"use client";

import { cn } from "@/lib/utils";
import { m as motion } from "framer-motion";

interface KpiCardProps {
    title: string;
    simplifiedTitle?: string;
    value: string;
    change: string;
    simplifiedChange?: string;
    changeType: "positive" | "negative" | "neutral";
    data: number[];
    trendlineProperties?: {
        colors: [string, string]; // Start and End colors for gradient
    };
    iconColor?: string;
    className?: string;
}

export function KpiCard({
    title,
    simplifiedTitle,
    value,
    change,
    simplifiedChange,
    changeType,
    data,
    trendlineProperties = { colors: ["#3b82f6", "#06b6d4"] }, // Default Blue to Cyan
    iconColor = "bg-blue-500",
    className,
}: KpiCardProps) {
    const displayTitle = simplifiedTitle || title;
    const displayChange = simplifiedChange || change;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className={cn(
                "group relative flex flex-col justify-between overflow-visible rounded-[2rem] border border-border bg-card p-1 shadow-lg shadow-black/[0.04] dark:shadow-black/20 transition-all duration-300 hover:shadow-primary/10 hover:ring-2 hover:ring-primary/10", 
                className
            )}
        >
            {/* Inner Content Container */}
            <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] bg-muted/30 p-6 flex flex-col justify-between dark:bg-surface-2/50">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none dark:from-white/5" />
                
                {/* Header Content */}
                <div className="relative z-10 w-full">
                    <div className="flex items-center gap-3 mb-5">
                        <span className={cn("size-2.5 rounded-full shadow-sm", iconColor)}></span>
                        <span className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">{displayTitle}</span>
                    </div>

                    <h3 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">{value}</h3>

                    <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide",
                        changeType === "positive" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                        changeType === "negative" ? "bg-red-500/10 text-red-600 dark:text-red-400" : 
                        "bg-muted text-muted-foreground"
                    )}>
                        {changeType === "positive" ? "↑" : changeType === "negative" ? "↓" : "•"}
                        {displayChange}
                    </div>
                </div>

                <div className="h-4" />
            </div>
        </motion.div>
    );
}
