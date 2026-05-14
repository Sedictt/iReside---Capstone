"use client";

import React, { useState, useEffect, useRef } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    CreditCard,
    FileText,
    Wrench,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    ArrowRight
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { cn } from "@/lib/utils";
import { playSound } from "@/hooks/useSound";

const ROTATION_INTERVAL = 6000; // 6 seconds

export function NotificationBanner() {
    const { importantNotifications, markAsRead } = useNotifications();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [hasNewNotif, setHasNewNotif] = useState(false);
    
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const activeNotifications = importantNotifications.slice(0, 5);
    const totalCount = activeNotifications.length;

    // Handle auto-rotation
    useEffect(() => {
        if (totalCount <= 1 || isHovered || isExpanded === false) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % totalCount);
        }, ROTATION_INTERVAL);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [totalCount, isHovered, isExpanded]);

    // Handle manual navigation
    const handleManualNav = (direction: 'next' | 'prev') => {
        if (direction === 'next') {
            setCurrentIndex((prev) => (prev + 1) % totalCount);
        } else {
            setCurrentIndex((prev) => (prev - 1 + totalCount) % totalCount);
        }
        playSound("notification", 0.1);
    };

    useEffect(() => {
        if (totalCount > 0) {
            setHasNewNotif(true);
            const timer = setTimeout(() => setHasNewNotif(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [totalCount]);

    if (totalCount === 0) return null;

    const current = activeNotifications[currentIndex] || activeNotifications[0];

    const getStatusConfig = (type: string) => {
        switch (type) {
            case "payment": return {
                color: "red",
                icon: <CreditCard className="size-4" />,
                label: "Payment",
                bg: "bg-red-500/10",
                text: "text-red-500",
                border: "border-red-500/20"
            };
            case "lease": return {
                color: "amber",
                icon: <FileText className="size-4" />,
                label: "Lease",
                bg: "bg-amber-500/10",
                text: "text-amber-500",
                border: "border-amber-500/20"
            };
            case "maintenance": return {
                color: "blue",
                icon: <Wrench className="size-4" />,
                label: "Maintenance",
                bg: "bg-blue-500/10",
                text: "text-blue-500",
                border: "border-blue-500/20"
            };
            default: return {
                color: "emerald",
                icon: <Bell className="size-4" />,
                label: "Notice",
                bg: "bg-emerald-500/10",
                text: "text-emerald-500",
                border: "border-emerald-500/20"
            };
        }
    };

    const config = getStatusConfig(current.type);

    const springTransition = {
        type: "spring" as const,
        stiffness: 300,
        damping: 25,
        mass: 0.8
    };

    return (
        <div className="absolute top-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
            <motion.div
                initial={false}
                animate={{ 
                    y: 0,
                    width: isExpanded ? "100%" : "8rem",
                    height: isExpanded ? "5rem" : "2.5rem",
                    boxShadow: isExpanded 
                        ? "0 25px 50px -12px rgba(0,0,0,0.4)"
                        : "0 10px 15px -3px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.05)"
                }}
                transition={springTransition}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    "pointer-events-auto overflow-hidden border-x border-b bg-card/95 backdrop-blur-xl rounded-b-3xl relative",
                    isExpanded ? "max-w-4xl shadow-2xl" : "border-t-0 shadow-lg"
                )}
            >
                {/* Auto-rotation progress bar (only when expanded and multiple notifs) */}
                {isExpanded && totalCount > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-border/20 overflow-hidden">
                        <motion.div 
                            key={currentIndex}
                            className="h-full bg-primary origin-left"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ 
                                duration: ROTATION_INTERVAL / 1000,
                                ease: "linear",
                                repeat: Infinity,
                                repeatType: "loop"
                            }}
                        />
                    </div>
                )}

                <AnimatePresence mode="popLayout" initial={false}>
                    {!isExpanded ? (
                        <motion.button
                            key="bookmark"
                            layoutId="notif-content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsExpanded(true)}
                            className="w-full h-full flex items-center justify-center gap-2 group relative overflow-hidden"
                        >
                            {/* "In between papers" top shadow effect - reduced to feel more flush */}
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-black/5" />
                            
                            <motion.div 
                                layoutId="bell-icon"
                                className={cn(
                                    "flex size-7 items-center justify-center rounded-full transition-all duration-500",
                                    hasNewNotif ? "bg-primary animate-pulse" : "bg-primary/10"
                                )}
                            >
                                <Bell className={cn("size-3.5", hasNewNotif ? "text-white" : "text-primary")} />
                            </motion.div>
                            
                            <span className="font-black text-xs tracking-tighter text-foreground">
                                {totalCount} Alerts
                            </span>
                            
                            <motion.div
                                animate={{ y: [0, 2, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-foreground" />
                            </motion.div>
                        </motion.button>
                    ) : (
                        <motion.div
                            key="bar"
                            layoutId="notif-content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full flex items-center px-6 gap-6"
                        >
                            <div className="flex items-center gap-4 shrink-0">
                                <motion.div 
                                    layoutId="bell-icon"
                                    className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20"
                                >
                                    <Bell className="size-5 text-primary" />
                                </motion.div>
                                <div className="hidden md:block">
                                    <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground leading-none mb-1">
                                        Priority
                                    </h3>
                                    <p className="text-sm font-black text-foreground tabular-nums">
                                        {currentIndex + 1} / {totalCount}
                                    </p>
                                </div>
                            </div>

                            <div className="h-8 w-px bg-border/50 shrink-0" />

                            <div className="flex-1 min-w-0 flex items-center gap-4">
                                <div className={cn("hidden sm:flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm", config.bg, config.text)}>
                                    {config.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={cn("text-[10px] font-black uppercase tracking-widest", config.text)}>
                                            {config.label}
                                        </span>
                                        <div className="size-1 rounded-full bg-border" />
                                        <h4 className="font-black text-sm text-foreground truncate">
                                            {current.title}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate leading-none">
                                        {current.message}
                                    </p>
                                </div>
                            </div>

                            {totalCount > 1 && (
                                <div className="flex items-center gap-1 shrink-0 bg-muted/30 p-1 rounded-xl">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleManualNav('prev');
                                        }} 
                                        className="p-1.5 hover:bg-card rounded-lg transition-all text-muted-foreground hover:text-foreground"
                                    >
                                        <ChevronLeft className="size-4" />
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleManualNav('next');
                                        }} 
                                        className="p-1.5 hover:bg-card rounded-lg transition-all text-muted-foreground hover:text-foreground"
                                    >
                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>
                            )}

                            <div className="h-8 w-px bg-border/50 shrink-0" />

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        await markAsRead(current.id);
                                        if (totalCount > 1) {
                                            setCurrentIndex((prev) => (prev + 1) % totalCount);
                                            // Progress reset removed — progress tracking no longer implemented
                                        }
                                    }}
                                    className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => {
                                        const data = current.data as any;
                                        if (current.type === "payment" && data?.paymentId) {
                                            window.location.href = `/tenant/payments/${data.paymentId}/checkout`;
                                        } else if (current.type === "lease" && data?.leaseId) {
                                            window.location.href = `/tenant/lease/${data.leaseId}`;
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[11px] font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
                                >
                                    Take Action
                                    <ArrowRight className="size-3.5" />
                                </button>
                                <button 
                                    onClick={() => setIsExpanded(false)}
                                    className="size-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <ChevronUp className="size-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}