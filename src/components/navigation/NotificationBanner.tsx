"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    AlertCircle, 
    X, 
    ArrowRight, 
    Bell,
    ShieldAlert,
    Info,
    CreditCard,
    FileText,
    Wrench,
    MessageSquare,
    CheckCircle,
    AlertTriangle
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { playSound } from "@/hooks/useSound";

export function NotificationBanner() {
    const { importantNotifications, markAsRead } = useNotifications();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const activeNotifications = importantNotifications.slice(0, 3); // Only show top 3 most recent important ones

    useEffect(() => {
        if (activeNotifications.length === 0) {
            setIsVisible(false);
            return;
        }
        setIsVisible(true);
        setCurrentIndex(0);
    }, [activeNotifications.length]);

    if (!isVisible || activeNotifications.length === 0) return null;

    const current = activeNotifications[currentIndex];

    const getIcon = (type: string) => {
        switch (type) {
            case "payment": return <CreditCard className="h-4 w-4" />;
            case "lease": return <FileText className="h-4 w-4" />;
            case "maintenance": return <Wrench className="h-4 w-4" />;
            case "application": return <Bell className="h-4 w-4" />;
            default: return <Info className="h-4 w-4" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case "lease": return "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400";
            case "payment": return "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400";
            default: return "bg-primary/10 border-primary/20 text-primary";
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="relative overflow-hidden border-b bg-card/50 backdrop-blur-md"
            >
                <div className={cn(
                    "flex items-center justify-between px-4 py-2 text-xs font-medium transition-colors",
                    getBgColor(current.type)
                )}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 shadow-sm animate-pulse">
                            {getIcon(current.type)}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold uppercase tracking-wider text-[10px] opacity-70">
                                Important Update: {current.title}
                            </span>
                            <span className="line-clamp-1 opacity-90">{current.message}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            {activeNotifications.length > 1 && (
                                <div className="mr-2 flex gap-1">
                                    {activeNotifications.map((_, i) => (
                                        <div 
                                            key={i} 
                                            className={cn(
                                                "h-1 w-3 rounded-full transition-all",
                                                i === currentIndex ? "bg-current" : "bg-current/20"
                                            )} 
                                        />
                                    ))}
                                </div>
                            )}
                            
                            {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview_notifications') === 'true' && (
                                <div className="flex items-center gap-1.5 mr-2">
                                    <button
                                        onClick={() => playSound("notification")}
                                        className="flex items-center gap-1 rounded-lg bg-current/20 px-2 py-1 hover:bg-current/30 transition-all font-black text-[9px] uppercase tracking-widest"
                                        title="Test Alert"
                                    >
                                        <Bell className="h-3 w-3" />
                                        ALERT
                                    </button>
                                    <button
                                        onClick={() => playSound("message")}
                                        className="flex items-center gap-1 rounded-lg bg-current/20 px-2 py-1 hover:bg-current/30 transition-all font-black text-[9px] uppercase tracking-widest"
                                        title="Test Message"
                                    >
                                        <MessageSquare className="h-3 w-3" />
                                        MSG
                                    </button>
                                    <button
                                        onClick={() => playSound("success")}
                                        className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1 hover:bg-emerald-500/30 transition-all font-black text-[9px] uppercase tracking-widest text-emerald-400"
                                        title="Test Success"
                                    >
                                        <CheckCircle className="h-3 w-3" />
                                        OK
                                    </button>
                                    <button
                                        onClick={() => playSound("error")}
                                        className="flex items-center gap-1 rounded-lg bg-red-500/20 px-2 py-1 hover:bg-red-500/30 transition-all font-black text-[9px] uppercase tracking-widest text-red-400"
                                        title="Test Error"
                                    >
                                        <AlertTriangle className="h-3 w-3" />
                                        ERR
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    if (activeNotifications.length > 1) {
                                        setCurrentIndex((prev) => (prev + 1) % activeNotifications.length);
                                        playSound("notification", 0.3); // Subtle tick when cycling
                                    }
                                }}
                                className="flex items-center gap-1 rounded-lg bg-current/10 px-2 py-1 hover:bg-current/20 transition-all"
                            >
                                {activeNotifications.length > 1 ? "Next Alert" : "View Details"}
                                <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>

                        <button 
                            onClick={() => {
                                markAsRead(current.id);
                                playSound("success", 0.2); // Subtle success sound for dismissal
                            }}
                            className="rounded-full p-1 hover:bg-current/10 transition-all"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                
                {/* Progress bar for auto-rotation (optional) */}
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    key={current.id}
                    transition={{ duration: 8, ease: "linear" }}
                    onAnimationComplete={() => {
                        if (activeNotifications.length > 1) {
                            setCurrentIndex((prev) => (prev + 1) % activeNotifications.length);
                        }
                    }}
                    className="h-0.5 bg-current opacity-20"
                />
            </motion.div>
        </AnimatePresence>
    );
}
