"use client";

import Image from "next/image";
import { m as motion } from "framer-motion";
import { Hammer, Zap, Wallet, Receipt } from "lucide-react";
import { UiMessage } from "@/components/landlord/messages/types";
import { cn } from "@/lib/utils";
import { ClientOnlyDate } from "@/components/ui/client-only-date";

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
        default: "",
        warning: "text-amber-500",
        success: "text-emerald-500",
        error: "text-red-500"
    };

    const glowVariants = {
        default: "bg-primary/10",
        warning: "bg-amber-500/20",
        success: "bg-emerald-500/20",
        error: "bg-red-500/20"
    };

    const iconVariants = {
        default: "neumorphic-inset-card text-high",
        warning: "neumorphic-inset-card text-amber-500",
        success: "neumorphic-inset-card text-emerald-500",
        error: "neumorphic-inset-card text-red-500"
    };

    const dotVariants = {
        default: "bg-primary",
        warning: "bg-amber-500",
        success: "bg-emerald-500",
        error: "bg-red-500"
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
                "relative group max-w-[380px] w-full p-[1px] transition-all duration-500 neumorphic-panel overflow-hidden",
                isCompact ? "rounded-3xl" : "rounded-[2.5rem]",
                className
            )}
        >
            {/* Ambient Neumorphic Glow Effect */}
            <div className={cn(
                "absolute -top-12 -right-12 size-32 rounded-full blur-[60px] opacity-30 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none",
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
                        "rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110",
                        isCompact ? "size-10" : "size-14",
                        iconVariants[variant]
                    )}>
                        {/* Adjust icon size if possible, though icon is passed as node */}
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className={cn(
                            "font-black tracking-tight leading-tight mb-0.5",
                            isCompact ? "text-sm" : "text-xl",
                            variants[variant] ? variants[variant] : "text-high"
                        )}>
                            {title}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className={cn("size-1.5 rounded-full animate-pulse", dotVariants[variant])} />
                            <p className="text-[10px] font-black text-medium uppercase tracking-[0.2em] opacity-40">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Optional Payment Highlight Section */}
                {paymentAmount && (
                    <div className={cn(
                        "flex justify-between items-center neumorphic-inset",
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
                            "rounded-xl flex items-center justify-center neumorphic-inset-card",
                            isCompact ? "size-9" : "size-12"
                        )}>
                            <Wallet className={cn(isCompact ? "size-4" : "size-5", "text-primary")} />
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className={cn(
                    "neumorphic-inset relative overflow-hidden transition-colors",
                    isCompact ? "rounded-2xl p-3" : "rounded-[2rem] p-5"
                )}>
                    {/* Subtle pattern or gradient inside content area */}
                    
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
                            Deadline: <ClientOnlyDate date={message.expiresAt} />
                        </div>
                    )}
                </div>

                {/* Optional Receipt Image */}
                {receiptImg && (
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] uppercase tracking-[0.2em] text-medium font-black ml-2 opacity-40">Proof of Payment</span>
                        <div className={cn(
                            "overflow-hidden neumorphic-inset-card relative cursor-pointer group/img",
                            isCompact ? "rounded-xl" : "rounded-[2rem]"
                        )}>
                            <Image src={receiptImg} alt="Receipt" fill sizes="(max-width: 768px) 100vw, 380px" className={cn(
                                "object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700",
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
                            "overflow-hidden neumorphic-inset-card relative cursor-pointer group/img",
                            isCompact ? "rounded-xl" : "rounded-[2rem]"
                        )}>
                            <Image src={refundImg} alt="Refund Proof" fill sizes="(max-width: 768px) 100vw, 380px" className={cn(
                                "object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700",
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
                            "w-full rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 relative overflow-hidden group/btn",
                            isCompact ? "py-2.5" : "py-4",
                            disabled ? "neumorphic-inset text-disabled cursor-not-allowed opacity-50" : "neumorphic-extruded",
                            !disabled && variant === "warning" && "text-amber-500",
                            !disabled && variant === "success" && "text-emerald-500",
                            !disabled && variant === "error" && "text-red-500",
                            !disabled && variant === "default" && "text-primary"
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

