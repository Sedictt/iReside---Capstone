"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
    variant?: "default" | "glass" | "brand";
}

export function LoadingSpinner({
    className,
    size = "md",
    variant = "default",
}: LoadingSpinnerProps) {
    const sizeMap = {
        sm: "h-6 w-6",
        md: "h-12 w-12",
        lg: "h-20 w-20",
        xl: "h-32 w-32",
    };

    const containerSize = sizeMap[size];

    return (
        <div className={cn("relative flex items-center justify-center", containerSize, className)}>
            {/* Outer Ring */}
            <motion.div
                className={cn(
                    "absolute inset-0 rounded-full border-2 border-transparent border-t-primary/80",
                    variant === "glass" && "backdrop-blur-sm border-white/5 shadow-2xl"
                )}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />

            {/* Inner Ring (Counter-rotating) */}
            <motion.div
                className="absolute inset-2 rounded-full border border-transparent border-t-emerald-500/60"
                animate={{ rotate: -360 }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />

            {/* Center Brand Mark (for larger spinners) */}
            {(size === "lg" || size === "xl") && (
                <motion.div
                    className="h-1/3 w-1/3 bg-primary rounded-[25%] shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]"
                    animate={{
                        scale: [1, 1.15, 1],
                        rotate: [0, 45, 0],
                        borderRadius: ["25%", "40%", "25%"]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            )}

            {/* Ambient Pulse Glow */}
            <motion.div
                className="absolute inset-0 rounded-full bg-primary/10 blur-xl pointer-events-none"
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
        </div>
    );
}

export function PageLoader({ message }: { message?: string }) {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-md overflow-hidden"
        >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
            
            <div className="relative flex flex-col items-center gap-12">
                <LoadingSpinner size="xl" variant="glass" />
                
                <div className="flex flex-col items-center gap-4 text-center">
                    <motion.h3 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-black text-white tracking-tight uppercase"
                    >
                        {message || "Loading iReside"}
                    </motion.h3>
                    <div className="flex items-center gap-2">
                        {[0, 0.2, 0.4].map((delay, i) => (
                            <motion.div
                                key={i}
                                className="h-1 w-4 rounded-full bg-primary/40"
                                animate={{ 
                                    backgroundColor: ["rgba(var(--primary-rgb), 0.2)", "rgba(var(--primary-rgb), 1)", "rgba(var(--primary-rgb), 0.2)"],
                                    scaleX: [1, 1.5, 1]
                                }}
                                transition={{ duration: 1.5, repeat: Infinity, delay }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <p className="absolute bottom-12 text-[10px] font-black text-white/30 tracking-[0.4em] uppercase">
                Premium Property Management
            </p>
        </motion.div>
    );
}
