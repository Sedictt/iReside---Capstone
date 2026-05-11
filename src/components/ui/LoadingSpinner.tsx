"use client";

import { m as motion } from "framer-motion";
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
        sm: "size-6",
        md: "size-12",
        lg: "size-20",
        xl: "size-32",
    };

    const containerSize = sizeMap[size];

    return (
        <div className={cn("relative flex items-center justify-center", containerSize, className)}>
            <motion.svg
                viewBox="0 0 50 50"
                className="w-full h-full transform-gpu"
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                }}
            >
                <defs>
                    <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
                    </linearGradient>
                </defs>
                
                {/* Background track (extremely subtle) */}
                <circle
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="opacity-[0.03]"
                />
                
                {/* Tapered Spinner Arc */}
                <motion.path
                    d="M 25,5 A 20,20 0 0 1 45,25"
                    fill="none"
                    stroke="url(#spinner-gradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className={cn(
                        "text-primary",
                        variant === "brand" && "text-primary",
                        variant === "glass" && "text-white"
                    )}
                    animate={{ 
                        strokeDasharray: ["1, 150", "90, 150", "90, 150"],
                        strokeDashoffset: [0, -35, -125],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </motion.svg>

            {/* Subtle center core */}
            <motion.div 
                className={cn(
                    "absolute h-[12%] w-[12%] rounded-full",
                    variant === "glass" ? "bg-white/20" : "bg-primary/10"
                )}
                animate={{ 
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.1, 0.3, 0.1] 
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
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
            className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#050505]/90 backdrop-blur-2xl overflow-hidden"
        >
            {/* Elegant Background Texture/Atmosphere */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
            </div>
            
            <div className="relative flex flex-col items-center gap-10">
                <div className="relative">
                    <LoadingSpinner size="xl" variant="glass" />
                    {/* Inner pulse ring */}
                    <motion.div 
                        className="absolute inset-[-10px] rounded-full border border-white/5"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
                
                <div className="flex flex-col items-center gap-3">
                    <motion.p 
                        initial={{ opacity: 0, letterSpacing: "0.2em" }}
                        animate={{ opacity: 1, letterSpacing: "0.4em" }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="text-[11px] font-medium text-white/40 uppercase"
                    >
                        {message || "Initiating"}
                    </motion.p>
                    
                    {/* Minimalist progress trace */}
                    <div className="w-20 h-[1px] bg-white/5 relative overflow-hidden rounded-full">
                        <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>
                </div>
            </div>

            <div className="absolute bottom-16 flex flex-col items-center gap-2">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col items-center"
                >
                    <span className="text-[9px] font-light text-white/10 tracking-[0.8em] uppercase mb-1">
                        Established 2024
                    </span>
                    <span className="text-[12px] font-semibold text-white/30 tracking-[0.5em] uppercase">
                        iReside
                    </span>
                </motion.div>
            </div>
        </motion.div>
    );
}

