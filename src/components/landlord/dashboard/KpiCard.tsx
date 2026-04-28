"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
                "group relative flex flex-col justify-between overflow-visible rounded-[2rem] border border-white/10 bg-surface-2 p-1 shadow-2xl shadow-black/[0.06] dark:shadow-black/20 backdrop-blur-xl transition-all duration-300 hover:shadow-primary/5 hover:ring-1 hover:ring-primary/20", 
                className
            )}
        >
            {/* Inner Content Container */}
            <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] bg-surface-3 p-6 flex flex-col justify-between">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                
                {/* Header Content */}
                <div className="relative z-10 w-full">
                    <div className="flex items-center gap-3 mb-5">
                        <span className={cn("h-3 w-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)]", iconColor)}></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/80">{displayTitle}</span>
                    </div>

                    <h3 className="mb-2 text-4xl font-black tracking-tight text-foreground">{value}</h3>

                    <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        changeType === "positive" ? "bg-emerald-500/10 text-emerald-400" :
                            changeType === "negative" ? "bg-red-500/10 text-red-400" : "bg-muted/10 text-muted-foreground"
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
