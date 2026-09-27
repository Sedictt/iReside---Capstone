"use client";

import { CheckCircle2, Camera, Phone, FileText, ArrowRight, UserCheck } from "lucide-react";
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
    const progressPercent = Math.round((completedCount / 3) * 100);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    const steps = [
        {
            id: "profile-avatar-section",
            label: "Profile Photo",
            description: hasAvatar ? "Uploaded" : "Upload your photo",
            icon: Camera,
            isComplete: hasAvatar,
        },
        {
            id: "profile-contact-section",
            label: "Phone Number",
            description: hasPhone ? "Provided" : "Add contact number",
            icon: Phone,
            isComplete: hasPhone,
        },
        {
            id: "profile-bio-section",
            label: "Biography",
            description: hasBio ? "Written" : "Write a short bio",
            icon: FileText,
            isComplete: hasBio,
        },
    ];

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-[2.5rem] border border-border/80 bg-card/90 text-card-foreground p-6 sm:p-8 shadow-sm transition-all neumorphic-panel",
                className
            )}
        >
            {/* Header: Title, Description, and Progress */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-border/60">
                <div className="flex items-start sm:items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                        <UserCheck className="size-6" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="text-lg font-display font-black tracking-tight text-foreground">
                                Complete your profile
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                {completedCount} of 3 completed
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                            Complete your basic details so others can recognize and connect with you. The setup badge will automatically dismiss once done.
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3 sm:self-center shrink-0 bg-muted/40 px-4 py-2 rounded-2xl border border-border/40">
                    <div className="w-24 sm:w-28 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <span className="text-xs font-black text-foreground tabular-nums">
                        {progressPercent}%
                    </span>
                </div>
            </div>

            {/* Steps Grid: Exactly 3 balanced columns, never wrapping awkwardly */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-5">
                {steps.map((step) => {
                    const StepIcon = step.icon;
                    return (
                        <button
                            key={step.id}
                            type="button"
                            onClick={() => scrollToSection(step.id)}
                            className={cn(
                                "group relative flex items-center justify-between p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer border",
                                step.isComplete
                                    ? "bg-muted/20 border-border/60 hover:bg-muted/40"
                                    : "bg-background border-primary/30 hover:border-primary hover:shadow-md hover:scale-[1.01]"
                            )}
                        >
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div
                                    className={cn(
                                        "size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                        step.isComplete
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                            : "bg-primary/10 text-primary border border-primary/20"
                                    )}
                                >
                                    {step.isComplete ? (
                                        <CheckCircle2 className="size-5" />
                                    ) : (
                                        <StepIcon className="size-5" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p
                                        className={cn(
                                            "text-xs font-black tracking-tight truncate",
                                            step.isComplete ? "text-muted-foreground line-through opacity-75" : "text-foreground"
                                        )}
                                    >
                                        {step.label}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                        {step.description}
                                    </p>
                                </div>
                            </div>

                            {!step.isComplete ? (
                                <div className="flex items-center gap-2 shrink-0 pl-2">
                                    <span className="relative flex size-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                                        <span className="relative inline-flex rounded-full size-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                    </span>
                                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                </div>
                            ) : (
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shrink-0 pl-2">
                                    Done
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
