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
    AlertTriangle,
    ChevronRight 
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
            case "payment": return <CreditCard className="size-4" />;
            case "lease": return <FileText className="size-4" />;
            case "maintenance": return <Wrench className="size-4" />;
            case "application": return <Bell className="size-4" />;
            default: return <Info className="size-4" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case "lease": return "bg-gradient-to-r from-amber-500/30 to-orange-500/30 border-amber-500/40 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.2)]";
            case "payment": return "bg-gradient-to-r from-red-500/30 to-pink-500/30 border-red-500/40 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.2)]";
            case "maintenance": return "bg-gradient-to-r from-blue-500/30 to-indigo-500/30 border-blue-500/40 text-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.2)]";
            default: return "bg-gradient-to-r from-primary/40 to-emerald-500/40 border-primary/40 text-emerald-50 shadow-[0_0_20px_rgba(109,152,56,0.2)]";
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="sticky top-4 z-[100] px-4 pointer-events-none"
            >
                <div className={cn(
                    "mx-auto max-w-4xl pointer-events-auto overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl transition-all",
                    getBgColor(current.type)
                )}>
                    <div className="flex items-center justify-between px-4 py-3 text-xs font-medium">
                        <div className="flex items-center gap-4">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-white/20 shadow-inner animate-pulse">
                                {getIcon(current.type)}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold uppercase tracking-widest text-[9px] opacity-60">
                                    {current.title}
                                </span>
                                <span className="line-clamp-1 text-sm font-bold tracking-tight">{current.message}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 ml-8">
                            <div className="flex items-center gap-1.5">
                                {activeNotifications.length > 1 && (
                                    <div className="mr-3 flex gap-1">
                                        {activeNotifications.map((_, i) => (
                                            <div 
                                                key={i} 
                                                className={cn(
                                                    "h-1 w-2.5 rounded-full transition-all",
                                                    i === currentIndex ? "bg-current" : "bg-current/20"
                                                )} 
                                            />
                                        ))}
                                    </div>
                                )}
                                
                                {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview_notifications') === 'true' && (
                                    <div className="flex items-center gap-1 mr-2 bg-black/10 p-0.5 rounded-lg border border-white/5">
                                        <button
                                            onClick={() => playSound("notification")}
                                            className="p-1 hover:bg-white/10 transition-all rounded"
                                            title="Alert"
                                        >
                                            <Bell className="size-3" />
                                        </button>
                                        <button
                                            onClick={() => playSound("message")}
                                            className="p-1 hover:bg-white/10 transition-all rounded"
                                            title="Message"
                                        >
                                            <MessageSquare className="size-3" />
                                        </button>
                                        <button
                                            onClick={() => playSound("success")}
                                            className="p-1 hover:bg-emerald-500/20 text-emerald-400 transition-all rounded"
                                            title="Success"
                                        >
                                            <CheckCircle className="size-3" />
                                        </button>
                                        <button
                                            onClick={() => playSound("error")}
                                            className="p-1 hover:bg-red-500/20 text-red-400 transition-all rounded"
                                            title="Error"
                                        >
                                            <AlertTriangle className="size-3" />
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        if (activeNotifications.length > 1) {
                                            setCurrentIndex((prev) => (prev + 1) % activeNotifications.length);
                                            playSound("notification", 0.3);
                                        } else {
                                            // Action logic based on type
                                            const data = current.data as any;
                                            if (current.type === "payment" && data?.paymentId) {
                                                window.location.href = `/tenant/payments/${data.paymentId}/checkout`;
                                            } else if (current.type === "lease" && data?.leaseId) {
                                                window.location.href = `/tenant/lease/${data.leaseId}`;
                                            }
                                        }
                                    }}
                                    className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1.5 hover:bg-white/25 transition-all font-semibold text-[10px] uppercase tracking-widest border border-white/10 shadow-sm"
                                >
                                    {activeNotifications.length > 1 ? (
                                        <>Next <ChevronRight className="size-3" /></>
                                    ) : (
                                        <>View Details <ArrowRight className="size-3" /></>
                                    )}
                                </button>
                            </div>

                            <button 
                                onClick={() => {
                                    markAsRead(current.id);
                                    playSound("success", 0.2);
                                }}
                                className="rounded-full p-2 hover:bg-white/10 transition-all text-white/50 hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Progress bar for auto-rotation */}
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
                        className="h-1 bg-white/20"
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
