"use client";

import { motion } from "framer-motion";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative flex flex-col items-center gap-8">
                {/* Brand Mark Animation */}
                <div className="relative">
                    <motion.div
                        className="h-16 w-16 bg-primary rounded-xl"
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 90, 180, 270, 360],
                            borderRadius: ["20%", "50%", "20%"]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute inset-0 h-16 w-16 bg-primary rounded-xl blur-lg"
                        animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>

                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        iReside
                    </h2>
                    <div className="flex items-center gap-1.5">
                        <motion.div
                            className="h-1 w-1 bg-primary rounded-full"
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                            className="h-1 w-1 bg-primary rounded-full"
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                            className="h-1 w-1 bg-primary rounded-full"
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Status (Optional subtle text) */}
            <p className="absolute bottom-12 text-xs font-medium text-neutral-500 tracking-widest uppercase">
                Elevating your stay
            </p>
        </div>
    );
}
