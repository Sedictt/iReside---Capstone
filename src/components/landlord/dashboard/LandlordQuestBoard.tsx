"use client";

import { useEffect, useState, useCallback } from "react";
import { type LandlordProductTourState } from "@/lib/landlord-product-tour";
import {
    Rocket,
    X,
    CheckCircle2,
    ArrowRight,
    Layout,
    Sparkles
} from "lucide-react";
import { m as motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    MISSIONS_CONFIG,
    MISSION_ICONS,
    getCompletedMissionIds,
    type MissionConfig
} from "@/lib/missions-config";
import { MissionSlideshowModal } from "@/components/landlord/dashboard/MissionSlideshowModal";
import { useLanguageContext } from "@/context/LanguageContext";

interface LandlordQuestBoardProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LandlordQuestBoard({ isOpen, onClose }: LandlordQuestBoardProps) {
    const { t } = useLanguageContext();
    const [state, setState] = useState<LandlordProductTourState | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeMission, setActiveMission] = useState<MissionConfig | null>(null);
    const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);

    const refreshState = useCallback(async () => {
        try {
            const res = await fetch("/api/landlord/tour?start=0");
            if (res.ok) {
                const data = await res.json();
                setState(data.state);
            }
        } catch (err) {
            console.error("Failed to load quest state", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            refreshState();
        }
    }, [isOpen, refreshState]);

    const completedMissionIds = getCompletedMissionIds(state?.metadata);

    const handleStartQuest = (mission: MissionConfig) => {
        setActiveMission(mission);
        setIsSlideshowOpen(true);
    };

    const handleMissionCompleted = () => {
        refreshState();
    };

    return (
        <>
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-background/40 backdrop-blur-md"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 z-[101] w-full max-w-[420px] border-l border-white/10 bg-surface-1/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl"
                    >
                        <div className="flex h-full flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-white/5 p-8">
                                <div className="flex items-center gap-4">
                                    <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                                        <Rocket className="size-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight text-foreground">{t("Mission Control")}</h2>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t("Operational Roadmap")}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    aria-label={t("Close")}
                                    className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="custom-scrollbar-premium flex-1 overflow-y-auto p-8">
                                <div className="space-y-6">
                                    {loading && !state ? (
                                        <>
                                            {[1, 2, 3, 4].map((skeletonIdx) => (
                                                <div
                                                    key={`skeleton-${skeletonIdx}`}
                                                    className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-white/3 p-6"
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex size-10 items-center justify-center rounded-xl bg-surface-2 animate-pulse" />
                                                        <div className="h-4 w-10 rounded-lg bg-surface-2 animate-pulse" />
                                                    </div>
                                                    <div className="space-y-2 mb-6">
                                                        <div className="h-4 w-3/4 rounded bg-surface-2 animate-pulse" />
                                                        <div className="h-3 w-full rounded bg-surface-2 animate-pulse" />
                                                        <div className="h-3 w-2/3 rounded bg-surface-2 animate-pulse" />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="h-1.5 w-full rounded-full bg-white/5" />
                                                        <div className="h-9 w-full rounded-xl bg-white/5 animate-pulse" />
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        MISSIONS_CONFIG.map((mission, idx) => {
                                        const Icon = MISSION_ICONS[mission.iconName] || Sparkles;
                                        const isDone = completedMissionIds.includes(mission.id);

                                        return (
                                            <motion.div
                                                key={mission.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={cn(
                                                    "group relative overflow-hidden rounded-[2rem] border transition-all duration-500",
                                                    isDone
                                                        ? "border-emerald-500/20 bg-emerald-500/5"
                                                        : "border-white/5 bg-white/3 hover:border-primary/30 hover:bg-white/5"
                                                )}
                                            >
                                                {/* Cover: the mission's first picture */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartQuest(mission)}
                                                    aria-label={t(mission.title)}
                                                    className="relative block aspect-[16/7] w-full overflow-hidden border-b border-white/5"
                                                >
                                                    <img
                                                        src={mission.slides[0]?.image}
                                                        alt=""
                                                        loading="lazy"
                                                        className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                                                    />
                                                    {isDone && (
                                                        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                                                            <CheckCircle2 className="size-3.5" />
                                                            {t("Done")}
                                                        </span>
                                                    )}
                                                </button>

                                                <div className="p-6">
                                                    <div className="mb-4 flex items-start gap-3">
                                                        <div className={cn(
                                                            "flex size-10 shrink-0 items-center justify-center rounded-xl transition-all",
                                                            isDone
                                                                ? "bg-emerald-500/20 text-emerald-500"
                                                                : "bg-surface-2 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                                        )}>
                                                            <Icon className="size-5" />
                                                        </div>
                                                        <div className="min-w-0 space-y-1">
                                                            <h3 className="text-sm font-black tracking-tight text-foreground">{t(mission.title)}</h3>
                                                            <p className="text-[11px] leading-relaxed text-muted-foreground/80">
                                                                {t(mission.description)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mb-4 flex items-center gap-2 text-[10px] font-bold text-muted-foreground/70">
                                                        <span>{t("{count} steps", { count: mission.slides.length })}</span>
                                                        <span aria-hidden="true">•</span>
                                                        <span>{t(mission.estimatedTime)}</span>
                                                    </div>

                                                    <button
                                                        onClick={() => handleStartQuest(mission)}
                                                        className={cn(
                                                            "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all",
                                                            isDone
                                                                ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                                                : "bg-white/5 text-foreground hover:bg-primary hover:text-primary-foreground"
                                                        )}
                                                    >
                                                        {isDone ? t("Review") : t("Start Mission")}
                                                        <ArrowRight className="size-[0.875rem]" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    }))}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-white/5 p-8 bg-white/2">
                                <div className="flex items-center gap-4 text-muted-foreground/60">
                                    <Layout className="size-4" />
                                    <p className="text-[10px] font-medium leading-relaxed">
                                        {t("Each mission is a short picture guide. You can replay any mission anytime.")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>

        <MissionSlideshowModal
            mission={activeMission}
            isOpen={isSlideshowOpen}
            onClose={() => setIsSlideshowOpen(false)}
            onCompleteMission={handleMissionCompleted}
            isCompleted={activeMission ? completedMissionIds.includes(activeMission.id) : false}
        />
        </>
    );
}
