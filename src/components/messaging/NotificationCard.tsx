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
    disabled?: boolean;
    className?: string;
    isCompact?: boolean;
    // Additional fields for tenant-specific system messages
    paymentAmount?: string;
    receiptImg?: string;
    refundImg?: string;
}

export function NotificationCard({
    message,
    icon,
    title,
    subtitle,
    variant = "default",
    actionLabel,
    onAction,
    disabled = false,
    className,
    isCompact = false,
    paymentAmount,
    receiptImg,
    refundImg
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
                "relative group max-w-[380px] w-full p-[1px] overflow-hidden transition-all duration-500 shadow-2xl",
                isCompact ? "rounded-3xl" : "rounded-[2.5rem]",
                className
            )}
        >
            {/* Ambient Background Blur/Glass */}
            <div className={cn(
                "absolute inset-0 backdrop-blur-3xl border",
                isCompact ? "rounded-3xl" : "rounded-[2.5rem]",
                variants[variant]
            )} />
            
            {/* Animated Glow Effect */}
            <div className={cn(
                "absolute -top-24 -right-24 size-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
                glowVariants[variant]
            )} />

            <div className={cn(
                "relative flex flex-col",
                isCompact ? "p-4 gap-3" : "p-6 gap-6"
            )}>
                {/* Top Section: Icon & Header */}
                <div className={cn(
                    "flex items-center",
                    isCompact ? "gap-3" : "gap-4"
                )}>
                    <div className={cn(
                        "rounded-2xl flex items-center justify-center shrink-0 border border-white/10 transition-transform duration-500 group-hover:scale-110",
                        isCompact ? "size-10" : "size-14",
                        iconVariants[variant]
                    )}>
                        {/* Adjust icon size if possible, though icon is passed as node */}
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className={cn(
                            "font-black text-high tracking-tight leading-tight mb-0.5",
                            isCompact ? "text-sm" : "text-xl"
                        )}>
                            {title}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="size-1 rounded-full bg-primary animate-pulse" />
                            <p className="text-[10px] font-black text-medium uppercase tracking-[0.2em] opacity-40">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Optional Payment Highlight Section */}
                {paymentAmount && (
                    <div className={cn(
                        "flex justify-between items-center bg-primary/[0.08] border border-primary/20 group-hover:bg-primary/[0.12] transition-colors",
                        isCompact ? "rounded-2xl p-3" : "rounded-[2rem] p-5"
                    )}>
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-[0.15em] text-medium font-black mb-0.5 opacity-60">Amount Paid</span>
                            <span className={cn(
                                "font-black text-primary tracking-tighter",
                                isCompact ? "text-lg" : "text-2xl"
                            )}>₱{paymentAmount}</span>
                        </div>
                        <div className={cn(
                            "bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-inner",
                            isCompact ? "size-9" : "size-12"
                        )}>
                            <Wallet className={cn(isCompact ? "size-4" : "size-5", "text-primary")} />
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className={cn(
                    "bg-white/[0.02] backdrop-blur-md border border-white/5 relative overflow-hidden group-hover:bg-white/[0.04] transition-colors",
                    isCompact ? "rounded-2xl p-3" : "rounded-[2rem] p-5"
                )}>
                    {/* Subtle pattern or gradient inside content area */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                    
                    <p className={cn(
                        "relative z-10 text-high/80 leading-relaxed font-medium",
                        isCompact ? "text-xs" : "text-sm"
                    )}>
                        {message.content}
                    </p>

                    {message.expiresAt && (
                        <div className={cn(
                            "mt-3 flex items-center gap-2 text-[9px] text-amber-500 font-black uppercase tracking-wider bg-amber-500/10 w-fit rounded-full border border-amber-500/20",
                            isCompact ? "px-2.5 py-1" : "px-3 py-1.5"
                        )}>
                            <Hammer className="size-3" />
                            <span>Deadline: {new Date(message.expiresAt).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                {/* Optional Receipt Image */}
                {receiptImg && (
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] uppercase tracking-[0.2em] text-medium font-black ml-2 opacity-40">Proof of Payment</span>
                        <div className={cn(
                            "overflow-hidden border border-white/10 relative cursor-pointer shadow-2xl group/img",
                            isCompact ? "rounded-xl" : "rounded-[2rem]"
                        )}>
                            <img src={receiptImg} alt="Receipt" className={cn(
                                "w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700",
                                isCompact ? "h-24" : "h-40"
                            )} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                <span className="text-[8px] text-white font-black uppercase tracking-widest">Click to expand</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Optional Refund Image */}
                {refundImg && (
                    <div className="flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center gap-2 ml-2">
                            <span className="text-[8px] uppercase tracking-[0.2em] text-emerald-500 font-black">Proof of Refund</span>
                            <div className="h-[1px] flex-1 bg-emerald-500/10" />
                        </div>
                        <div className={cn(
                            "overflow-hidden border border-emerald-500/20 relative cursor-pointer shadow-2xl group/img bg-emerald-500/5",
                            isCompact ? "rounded-xl" : "rounded-[2rem]"
                        )}>
                            <img src={refundImg} alt="Refund Proof" className={cn(
                                "w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700",
                                isCompact ? "h-24" : "h-40"
                            )} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                <span className="text-[8px] text-white font-black uppercase tracking-widest">Transaction Reconciled</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Section */}
                {actionLabel && (
                    <motion.button
                        whileHover={{ scale: 1.02, translateY: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onAction}
                        disabled={disabled}
                        className={cn(
                            "w-full rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-2xl relative overflow-hidden group/btn",
                            isCompact ? "py-2.5" : "py-4",
                            disabled && "bg-disabled text-medium cursor-not-allowed shadow-none opacity-50",
                            !disabled && variant === "warning" && "bg-amber-500 text-white shadow-amber-500/30",
                            !disabled && variant === "success" && "bg-emerald-500 text-white shadow-emerald-500/30",
                            !disabled && variant === "error" && "bg-red-500 text-white shadow-red-500/30",
                            !disabled && variant === "default" && "bg-primary text-black shadow-primary/30"
                        )}
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite] pointer-events-none" />
                        
                        <span className="relative z-10">{actionLabel}</span>
                        <div className={cn(
                            "relative z-10 rounded-full bg-black/10 flex items-center justify-center",
                            isCompact ? "size-4" : "size-5"
                        )}>
                            <Zap className={cn(isCompact ? "size-3" : "size-3.5", "fill-current")} />
                        </div>
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
}

