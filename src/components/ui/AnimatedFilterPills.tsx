"use client";

import React, { useId } from "react";
import { m as motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface FilterPillItem<T extends string = string> {
    id: T;
    label: string;
    icon?: React.ReactNode;
    badge?: string | number;
}

export interface AnimatedFilterPillsProps<T extends string = string> {
    options: (FilterPillItem<T> | T)[];
    activeId: T;
    onChange: (id: T) => void;
    className?: string;
    pillClassName?: string;
    layoutGroupId?: string;
    variant?: "default" | "primary" | "amber" | "emerald" | "neumorphic";
    size?: "sm" | "md" | "lg";
}

export function AnimatedFilterPills<T extends string = string>({
    options,
    activeId,
    onChange,
    className,
    pillClassName,
    layoutGroupId,
    variant = "default",
    size = "md",
}: AnimatedFilterPillsProps<T>) {
    const defaultId = useId();
    const activeLayoutId = layoutGroupId || `animated-filter-pill-${defaultId}`;

    const normalizedOptions: FilterPillItem<T>[] = options.map((opt) => {
        if (typeof opt === "string") {
            return { id: opt as T, label: opt };
        }
        return opt;
    });

    const sizeStyles = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-xs sm:text-sm",
        lg: "px-6 py-2.5 text-sm",
    };

    const containerVariantStyles = {
        default: "flex items-center gap-1 rounded-2xl border border-white/5 bg-white/[0.02] p-1 backdrop-blur-md overflow-x-auto no-scrollbar",
        primary: "flex items-center gap-1 rounded-2xl border border-primary/20 bg-primary/5 p-1 backdrop-blur-md overflow-x-auto no-scrollbar",
        amber: "flex items-center gap-1 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-1 backdrop-blur-md overflow-x-auto no-scrollbar",
        emerald: "flex items-center gap-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-1 backdrop-blur-md overflow-x-auto no-scrollbar",
        neumorphic: "neumorphic-inset flex w-full sm:w-auto rounded-xl p-1 overflow-x-auto no-scrollbar",
    };

    const activePillStyles = {
        default: "bg-white/10 text-white border border-white/10 shadow-lg backdrop-blur-md",
        primary: "bg-primary text-black font-black shadow-lg shadow-primary/25",
        amber: "bg-amber-400 text-black font-black shadow-lg shadow-amber-400/25",
        emerald: "bg-emerald-400 text-black font-black shadow-lg shadow-emerald-400/25",
        neumorphic: "neumorphic-extruded text-foreground",
    };

    const activeTextColors = {
        default: "text-white font-bold",
        primary: "text-black font-black",
        amber: "text-black font-black",
        emerald: "text-black font-black",
        neumorphic: "text-foreground font-semibold",
    };

    const inactiveTextColors = {
        default: "text-neutral-400 hover:text-white",
        primary: "text-neutral-400 hover:text-white",
        amber: "text-neutral-400 hover:text-white",
        emerald: "text-neutral-400 hover:text-white",
        neumorphic: "text-muted-foreground hover:text-foreground",
    };

    return (
        <div className={cn(containerVariantStyles[variant], className)}>
            {normalizedOptions.map((item) => {
                const isActive = activeId === item.id;

                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onChange(item.id)}
                        className={cn(
                            "relative flex items-center justify-center gap-2 rounded-xl font-medium transition-colors shrink-0 outline-none select-none focus-visible:ring-2 focus-visible:ring-primary/50",
                            sizeStyles[size],
                            isActive ? activeTextColors[variant] : inactiveTextColors[variant],
                            pillClassName
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId={activeLayoutId}
                                className={cn(
                                    "absolute inset-0 rounded-xl",
                                    activePillStyles[variant]
                                )}
                                transition={{
                                    type: "spring",
                                    stiffness: 480,
                                    damping: 34,
                                    mass: 0.7,
                                }}
                            />
                        )}

                        {item.icon && <span className="relative z-10 shrink-0">{item.icon}</span>}
                        <span className="relative z-10 capitalize whitespace-nowrap">{item.label}</span>
                        {item.badge !== undefined && (
                            <span
                                className={cn(
                                    "relative z-10 shrink-0 rounded-full px-1.5 py-0.2 text-[9px] font-black",
                                    isActive
                                        ? "bg-black/20 text-current"
                                        : "bg-white/10 text-neutral-400"
                                )}
                            >
                                {item.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
