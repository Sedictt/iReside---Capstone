"use client";

import { AlertCircle, CheckCircle2, User, Phone, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type ProfileSetupBannerProps = {
    hasAvatar: boolean;
    hasPhone: boolean;
    hasBio: boolean;
    role?: string;
    className?: string;
};

export function ProfileSetupBanner({
    hasAvatar,
    hasPhone,
    hasBio,
    role = "landlord",
    className
}: ProfileSetupBannerProps) {
    const isComplete = hasAvatar && hasPhone && hasBio;
    if (isComplete) return null;

    const completedCount = (hasAvatar ? 1 : 0) + (hasPhone ? 1 : 0) + (hasBio ? 1 : 0);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-[2.5rem] border border-red-500/30 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent p-6 sm:p-8 neumorphic-panel",
                className
            )}
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-4">
                    <div className="relative size-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                        <AlertCircle className="size-6 text-red-500" />
                        <span className="absolute -top-1 -right-1 flex size-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                            <span className="relative inline-flex rounded-full size-3 bg-red-500" />
                        </span>
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-display font-black text-foreground tracking-tight">
                                Profile Setup Incomplete
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-500 border border-red-500/20">
                                {completedCount} of 3 Completed
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                            To ensure trust and verify your account, please complete the fields marked with the glowing red dots. The attention-seeker badge will automatically dismiss once done.
                        </p>
                    </div>
                </div>

                {/* Status Chips */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* 1. Avatar */}
                    <button
                        type="button"
                        onClick={() => scrollToSection("profile-avatar-section")}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                            hasAvatar
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/25 shadow-sm"
                        )}
                    >
                        {hasAvatar ? (
                            <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                            <span className="relative flex size-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                                <span className="relative inline-flex rounded-full size-2 bg-red-500" />
                            </span>
                        )}
                        <span>Photo</span>
                    </button>

                    {/* 2. Phone */}
                    <button
                        type="button"
                        onClick={() => scrollToSection("profile-contact-section")}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                            hasPhone
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/25 shadow-sm"
                        )}
                    >
                        {hasPhone ? (
                            <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                            <span className="relative flex size-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                                <span className="relative inline-flex rounded-full size-2 bg-red-500" />
                            </span>
                        )}
                        <span>Phone Number</span>
                    </button>

                    {/* 3. Bio */}
                    <button
                        type="button"
                        onClick={() => scrollToSection("profile-bio-section")}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                            hasBio
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/25 shadow-sm"
                        )}
                    >
                        {hasBio ? (
                            <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                            <span className="relative flex size-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                                <span className="relative inline-flex rounded-full size-2 bg-red-500" />
                            </span>
                        )}
                        <span>Biography</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
