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
    const variantConfig = {
        default: {
            container: "border-border/90 dark:border-zinc-700 bg-card text-card-foreground shadow-lg shadow-zinc-950/5 dark:shadow-black/50",
            glow: "bg-primary/10",
            iconBox: "bg-primary/10 text-primary border border-primary/25",
            title: "text-foreground",
            dot: "bg-primary",
            button: "bg-primary hover:bg-primary/90 active:bg-primary/95 text-primary-foreground border border-primary shadow-sm",
            buttonIconBox: "bg-primary-foreground/20 text-primary-foreground"
        },
        warning: {
            container: "border-amber-500/40 dark:border-amber-500/50 bg-card text-card-foreground shadow-lg shadow-amber-950/5 dark:shadow-black/50",
            glow: "bg-amber-500/15",
            iconBox: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80",
            title: "text-amber-800 dark:text-amber-300",
            dot: "bg-amber-500",
            button: "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white border border-amber-600 shadow-sm shadow-amber-600/20",
            buttonIconBox: "bg-white/20 text-white"
        },
        success: {
            container: "border-emerald-500/40 dark:border-emerald-500/50 bg-card text-card-foreground shadow-lg shadow-emerald-950/5 dark:shadow-black/50",
            glow: "bg-emerald-500/15",
            iconBox: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80",
            title: "text-emerald-800 dark:text-emerald-300",
            dot: "bg-emerald-500",
            button: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border border-emerald-600 shadow-sm shadow-emerald-600/20",
            buttonIconBox: "bg-white/20 text-white"
        },
        error: {
            container: "border-red-500/40 dark:border-red-500/50 bg-card text-card-foreground shadow-lg shadow-red-950/5 dark:shadow-black/50",
            glow: "bg-red-500/15",
            iconBox: "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/80",
            title: "text-red-800 dark:text-red-300",
            dot: "bg-red-500",
            button: "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border border-red-600 shadow-sm shadow-red-600/20",
            buttonIconBox: "bg-white/20 text-white"
        }
    };

    const currentVariant = variantConfig[variant] || variantConfig.default;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
                "relative group max-w-[390px] w-full transition-all duration-300 overflow-hidden",
                "border-[1.5px] rounded-2xl sm:rounded-3xl",
                currentVariant.container,
                className
            )}
        >
            {/* Subtle Ambient Glow Effect */}
            <div className={cn(
                "absolute -top-12 -right-12 size-32 rounded-full blur-[50px] opacity-25 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none",
                currentVariant.glow
            )} />

            <div className={cn(
                "relative flex flex-col",
                isCompact ? "p-3.5 gap-3" : "p-5 sm:p-6 gap-4 sm:gap-5"
            )}>
                {/* Top Section: Icon & Header */}
                <div className={cn(
                    "flex items-center",
                    isCompact ? "gap-2.5" : "gap-3.5"
                )}>
                    <div className={cn(
                        "rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105",
                        isCompact ? "size-10" : "size-12",
                        currentVariant.iconBox
                    )}>
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className={cn(
                            "font-extrabold tracking-tight leading-snug mb-0.5",
                            isCompact ? "text-sm" : "text-base sm:text-lg",
                            currentVariant.title
                        )}>
                            {title}
                        </h3>
                        <div className="flex items-center gap-1.5">
                            <span className={cn("size-2 rounded-full shrink-0", currentVariant.dot)} />
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Optional Payment Highlight Section */}
                {paymentAmount && (
                    <div className={cn(
                        "flex justify-between items-center bg-muted/60 dark:bg-zinc-800/60 border border-border/80 dark:border-zinc-700/80",
                        isCompact ? "rounded-xl p-3" : "rounded-2xl p-4"
                    )}>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Amount Paid</span>
                            <span className={cn(
                                "font-black text-primary font-mono tabular-nums tracking-tight",
                                isCompact ? "text-base" : "text-xl"
                            )}>₱{paymentAmount}</span>
                        </div>
                        <div className={cn(
                            "rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20",
                            isCompact ? "size-9" : "size-11"
                        )}>
                            <Wallet className={cn(isCompact ? "size-4" : "size-5", "text-primary")} />
                        </div>
                    </div>
                )}

                {/* Content Area */}
                {message.content && (
                    <div className={cn(
                        "bg-muted/40 dark:bg-zinc-800/40 border border-border/70 dark:border-zinc-700/60 transition-colors",
                        isCompact ? "rounded-xl p-3" : "rounded-2xl p-4"
                    )}>
                        <p className={cn(
                            "text-foreground/90 leading-relaxed font-medium",
                            isCompact ? "text-xs" : "text-sm"
                        )}>
                            {message.content}
                        </p>

                        {message.expiresAt && (
                            <div className={cn(
                                "mt-2.5 flex items-center gap-2 text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 w-fit rounded-lg border border-amber-500/25 px-2.5 py-1"
                            )}>
                                <Hammer className="size-3 shrink-0" />
                                Deadline: <ClientOnlyDate date={message.expiresAt} />
                            </div>
                        )}
                    </div>
                )}

                {/* Optional Receipt Image */}
                {receiptImg && (
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold ml-1">Proof of Payment</span>
                        <div className={cn(
                            "overflow-hidden border border-border/80 dark:border-zinc-700/80 bg-muted/40 relative cursor-pointer group/img",
                            isCompact ? "rounded-xl" : "rounded-2xl"
                        )}>
                            <Image src={receiptImg} alt="Receipt" fill sizes="(max-width: 768px) 100vw, 380px" className={cn(
                                "object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500",
                                isCompact ? "h-24" : "h-40"
                            )} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                <span className="text-[9px] text-white font-bold uppercase tracking-wider">Click to expand</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Optional Refund Image */}
                {refundImg && (
                    <div className="flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-2 ml-1">
                            <span className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold">Proof of Refund</span>
                            <div className="h-[1px] flex-1 bg-emerald-500/20" />
                        </div>
                        <div className={cn(
                            "overflow-hidden border border-emerald-500/30 dark:border-emerald-500/40 bg-muted/40 relative cursor-pointer group/img",
                            isCompact ? "rounded-xl" : "rounded-2xl"
                        )}>
                            <Image src={refundImg} alt="Refund Proof" fill sizes="(max-width: 768px) 100vw, 380px" className={cn(
                                "object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500",
                                isCompact ? "h-24" : "h-40"
                            )} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                <span className="text-[9px] text-white font-bold uppercase tracking-wider">Transaction Reconciled</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Section */}
                {actionLabel && (
                    <motion.button
                        whileHover={disabled ? undefined : { scale: 1.015, translateY: -1 }}
                        whileTap={disabled ? undefined : { scale: 0.985 }}
                        onClick={onAction}
                        disabled={disabled}
                        className={cn(
                            "w-full rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 relative overflow-hidden min-h-[44px]",
                            isCompact ? "py-2.5 px-3 min-h-[40px]" : "py-3 px-4",
                            disabled 
                                ? "bg-muted text-muted-foreground/60 border border-border cursor-not-allowed opacity-60 shadow-none" 
                                : currentVariant.button
                        )}
                    >
                        <span className="relative z-10">{actionLabel}</span>
                        <div className={cn(
                            "relative z-10 rounded-full flex items-center justify-center shrink-0",
                            isCompact ? "size-4" : "size-5",
                            disabled ? "bg-muted-foreground/15 text-muted-foreground" : currentVariant.buttonIconBox
                        )}>
                            <Zap className={cn(isCompact ? "size-2.5" : "size-3", "fill-current")} />
                        </div>
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
}

