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
        sm: "h-5 w-5 border-2",
        md: "h-10 w-10 border-3",
        lg: "h-16 w-16 border-4",
        xl: "h-24 w-24 border-4",
    };

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <motion.div
                className={`rounded-full border-muted/20 border-t-primary ${sizeMap[size]}`}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />
            {/* Ambient Pulse Glow */}
            <motion.div
                className={`absolute rounded-full bg-primary/20 blur-xl ${sizeMap[size]}`}
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
        </div>
    );
}
