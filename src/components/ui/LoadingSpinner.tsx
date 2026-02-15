"use client";

import { motion } from "framer-motion";

export function LoadingSpinner({
    className,
    size = "md",
}: {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
}) {
    const sizeMap = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12",
        xl: "h-16 w-16",
    };

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <motion.div
                className={`rounded-full border-2 border-slate-200 border-t-blue-600 ${sizeMap[size]}`}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />
            <motion.div
                className={`absolute inset-0 rounded-full border-2 border-transparent border-b-emerald-500/50 ${sizeMap[size]}`}
                animate={{ rotate: -360 }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />
        </div>
    );
}
