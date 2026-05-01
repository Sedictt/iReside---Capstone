"use client";

import { motion } from "framer-motion";
import { Hammer, Zap, Wallet, Receipt } from "lucide-react";
import { UiMessage } from "@/components/landlord/messages/types";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
    message: any; // Using any to support both Landlord and Tenant message types which are slightly different
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    variant?: "default" | "warning" | "success" | "error";
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
    // Additional fields for tenant-specific system messages
    paymentAmount?: string;
    receiptImg?: string;
}

export function NotificationCard({
    message,
    icon,
    title,
    subtitle,
    variant = "default",
    actionLabel,
    onAction,
    className,
    paymentAmount,
    receiptImg
}: NotificationCardProps) {
    const variants = {
        default: "border-white/10 bg-white/[0.03]",
        warning: "border-amber-500/30 bg-amber-500/[0.05]",
        success: "border-emerald-500/30 bg-emerald-500/[0.05]",
        error: "border-red-500/30 bg-red-500/[0.05]"
    };

    const glowVariants = {
        default: "bg-white/5",
        warning: "bg-amber-500/10",
        success: "bg-emerald-500/10",
        error: "bg-red-500/10"
    };

    const iconVariants = {
        default: "bg-surface-2 text-high",
        warning: "bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]",
        success: "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]",
        error: "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
                "relative group max-w-[380px] w-full rounded-[2.5rem] p-[1px] overflow-hidden transition-all duration-500 shadow-2xl",
                className
            )}
        >
            {/* Ambient Background Blur/Glass */}
            <div className={cn(
                "absolute inset-0 backdrop-blur-3xl rounded-[2.5rem] border",
                variants[variant]
            )} />
            
            {/* Animated Glow Effect */}
            <div className={cn(
                "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
                glowVariants[variant]
            )} />

            <div className="relative p-6 flex flex-col gap-6">
                {/* Top Section: Icon & Header */}
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 transition-transform duration-500 group-hover:scale-110",
                        iconVariants[variant]
                    )}>
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-black text-high tracking-tight leading-tight mb-0.5">
                            {title}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                            <p className="text-[10px] font-black text-medium uppercase tracking-[0.2em] opacity-40">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Optional Payment Highlight Section */}
                {paymentAmount && (
                    <div className="flex justify-between items-center bg-primary/[0.08] rounded-[2rem] p-5 border border-primary/20 group-hover:bg-primary/[0.12] transition-colors">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-[0.15em] text-medium font-black mb-1 opacity-60">Amount Paid</span>
                            <span className="text-2xl font-black text-primary tracking-tighter">₱{paymentAmount}</span>
                        </div>
                        <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-inner">
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className="bg-white/[0.02] backdrop-blur-md rounded-[2rem] p-5 border border-white/5 relative overflow-hidden group-hover:bg-white/[0.04] transition-colors">
                    {/* Subtle pattern or gradient inside content area */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                    
                    <p className="relative z-10 text-sm text-high/80 leading-relaxed font-medium">
                        {message.content}
                    </p>

                    {message.expiresAt && (
                        <div className="mt-4 flex items-center gap-2 text-[10px] text-amber-500 font-black uppercase tracking-wider bg-amber-500/10 w-fit px-3 py-1.5 rounded-full border border-amber-500/20">
                            <Hammer className="w-3.5 h-3.5" />
                            <span>Deadline: {new Date(message.expiresAt).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                {/* Optional Receipt Image */}
                {receiptImg && (
                    <div className="flex flex-col gap-2">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-medium font-black ml-4 opacity-40">Proof of Payment</span>
                        <div className="rounded-[2rem] overflow-hidden border border-white/10 relative cursor-pointer shadow-2xl group/img">
                            <img src={receiptImg} alt="Receipt" className="w-full h-40 object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                <span className="text-[10px] text-white font-black uppercase tracking-widest">Click to expand</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Section */}
                {actionLabel && (
                    <motion.button
                        whileHover={{ scale: 1.02, translateY: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onAction}
                        className={cn(
                            "w-full py-4 rounded-[1.5rem] text-sm font-black transition-all flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden group/btn",
                            variant === "warning" && "bg-amber-500 text-white shadow-amber-500/30",
                            variant === "success" && "bg-emerald-500 text-white shadow-emerald-500/30",
                            variant === "error" && "bg-red-500 text-white shadow-red-500/30",
                            variant === "default" && "bg-primary text-black shadow-primary/30"
                        )}
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite] pointer-events-none" />
                        
                        <span className="relative z-10">{actionLabel}</span>
                        <div className="relative z-10 w-5 h-5 rounded-full bg-black/10 flex items-center justify-center">
                            <Zap className="w-3.5 h-3.5 fill-current" />
                        </div>
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
}
