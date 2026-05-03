"use client";

import { useEffect, useState, useCallback } from "react";
import { 
    LANDLORD_QUESTS, 
    getQuestProgress, 
    type LandlordProductTourState,
    type LandlordQuestId
} from "@/lib/landlord-product-tour";
import { 
    ChevronRight, 
    Map, 
    Users, 
    Home, 
    CreditCard,
    Rocket,
    X,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Layout
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const ICON_MAP: Record<string, any> = {
    map: Map,
    business: Home,
    people: Users,
    payments: CreditCard,
};

interface LandlordQuestBoardProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LandlordQuestBoard({ isOpen, onClose }: LandlordQuestBoardProps) {
    const router = useRouter();
    const [state, setState] = useState<LandlordProductTourState | null>(null);
    const [loading, setLoading] = useState(true);

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

    const handleStartQuest = async (questId: string) => {
        const quest = LANDLORD_QUESTS.find(q => q.id === questId);
        if (!quest) return;

        try {
            const res = await fetch("/api/landlord/tour/quest/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questId }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.firstStep) {
                    onClose();
                    router.push(data.firstStep.route);
                }
            }
        } catch (err) {
            console.error("Failed to start quest", err);
        }
    };

    if (loading && !state) return null;

    return (
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
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                                        <Rocket className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight text-foreground">Mission Control</h2>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Operational Roadmap</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="custom-scrollbar-premium flex-1 overflow-y-auto p-8">
                                <div className="space-y-6">
                                    {LANDLORD_QUESTS.map((quest, idx) => {
                                        const progress = state ? getQuestProgress(quest.id as LandlordQuestId, state) : 0;
                                        const Icon = ICON_MAP[quest.icon] || Rocket;
                                        const isDone = progress === 100;

                                        return (
                                            <motion.div
                                                key={quest.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={cn(
                                                    "group relative overflow-hidden rounded-[2rem] border p-6 transition-all duration-500",
                                                    isDone 
                                                        ? "border-emerald-500/20 bg-emerald-500/5" 
                                                        : "border-white/5 bg-white/3 hover:border-primary/30 hover:bg-white/5"
                                                )}
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className={cn(
                                                        "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                                                        isDone 
                                                            ? "bg-emerald-500/20 text-emerald-500" 
                                                            : "bg-surface-2 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                                    )}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    {isDone ? (
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                    ) : (
                                                        <span className="text-[10px] font-black tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-lg">
                                                            {progress}%
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-2 mb-6">
                                                    <h3 className="text-sm font-black tracking-tight text-foreground">{quest.title}</h3>
                                                    <p className="text-[10px] leading-relaxed text-muted-foreground/70">
                                                        {quest.description}
                                                    </p>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progress}%` }}
                                                            className={cn(
                                                                "absolute inset-y-0 left-0 rounded-full",
                                                                isDone ? "bg-emerald-500" : "bg-primary"
                                                            )}
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={() => handleStartQuest(quest.id)}
                                                        className={cn(
                                                            "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all",
                                                            isDone
                                                                ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                                                : "bg-white/5 text-foreground hover:bg-primary hover:text-primary-foreground"
                                                        )}
                                                    >
                                                        {isDone ? "Review" : "Start Mission"}
                                                        <ArrowRight className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-white/5 p-8 bg-white/2">
                                <div className="flex items-center gap-4 text-muted-foreground/60">
                                    <Layout className="h-4 w-4" />
                                    <p className="text-[10px] font-medium leading-relaxed">
                                        Complete all missions to unlock advanced platform capabilities and professional badges.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
