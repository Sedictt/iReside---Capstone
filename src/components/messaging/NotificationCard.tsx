"use client";

import { motion } from "framer-motion";
import { Hammer } from "lucide-react";
import { UiMessage } from "@/components/landlord/messages/types";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
    message: UiMessage;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    variant?: "default" | "warning" | "success" | "error";
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function NotificationCard({
    message,
    icon,
    title,
    subtitle,
    variant = "default",
    actionLabel,
    onAction,
    className
}: NotificationCardProps) {
    const variants = {
        default: "border-divider from-surface-2 to-surface-3",
        warning: "border-amber-500/30 from-amber-500/10 to-amber-600/10",
        success: "border-emerald-500/30 from-emerald-500/10 to-emerald-600/10",
        error: "border-red-500/30 from-red-500/10 to-red-600/10"
    };

    const headerVariants = {
        default: "from-surface-2 to-surface-3 border-divider",
        warning: "from-amber-500/80 to-amber-600 border-amber-500/30",
        success: "from-emerald-500/80 to-emerald-600 border-emerald-500/30",
        error: "from-red-500/80 to-red-600 border-red-500/30"
    };

    const isSystemColor = variant !== "default";

    return (
        <div className={cn(
            "flex flex-col gap-0 bg-surface-1 overflow-hidden rounded-3xl shadow-2xl max-w-sm w-full transition-all group pb-4 border",
            variants[variant],
            className
        )}>
            {/* Header Gradient */}
            <div className={cn(
                "p-5 relative overflow-hidden h-24 flex items-center shrink-0",
                headerVariants[variant]
            )}>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-white/20 w-24 h-24 rounded-full blur-2xl"></div>
                <div className="relative z-10 flex items-center gap-3">
                    <div className={cn(
                        "p-2.5 rounded-2xl backdrop-blur-md shadow-sm border border-white/10",
                        isSystemColor ? "bg-white/20" : "bg-surface-1"
                    )}>
                        <div className={isSystemColor ? "text-white" : "text-high"}>
                            {icon}
                        </div>
                    </div>
                    <div className={cn(
                        "text-left flex flex-col justify-center",
                        isSystemColor ? "text-white" : "text-high"
                    )}>
                        <p className="text-lg font-bold leading-tight">{title}</p>
                        <p className={cn(
                            "text-[10px] font-bold tracking-wide uppercase opacity-70",
                            !isSystemColor && "text-medium"
                        )}>
                            {subtitle}
                        </p>
                    </div>
                </div>
            </div>

            {/* Details Section */}
            <div className="px-5 pt-5 pb-2 flex flex-col gap-4">
                <div className="bg-surface-2/50 rounded-2xl p-4 border border-divider flex flex-col gap-3">
                    <p className="text-xs text-high font-medium leading-relaxed">
                        {message.content}
                    </p>
                    {message.expiresAt && (
                        <div className="flex items-center gap-2 text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                            <Hammer className="w-3 h-3" />
                            <span>Deadline: {new Date(message.expiresAt).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Button */}
            {actionLabel && (
                <div className="px-5 mt-2">
                    <button
                        onClick={onAction}
                        className={cn(
                            "w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 shadow-lg",
                            variant === "warning" && "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20",
                            variant === "success" && "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20",
                            variant === "error" && "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20",
                            variant === "default" && "bg-primary hover:bg-primary/90 text-black shadow-primary/20"
                        )}
                    >
                        {actionLabel}
                    </button>
                </div>
            )}
        </div>
    );
}
