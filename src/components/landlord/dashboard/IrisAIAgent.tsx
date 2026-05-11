"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { X, RefreshCcw, ChevronRight, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientOnlyTime } from "@/components/ui/client-only-date";

type IrisAnalysis = {
    goodThings: string[];
    toLookOutFor: string[];
    summary: string;
    timestamp: number;
    dataHash: string;
};

interface IrisAIAgentProps {
    stats: {
        primaryKpis: any[];
        extendedKpis: any[];
        operationalSnapshot: any;
        financialChart: any;
    };
    onRefresh?: () => void;
    isVisible?: boolean;
    onVisibilityChange?: (visible: boolean) => void;
    showVisibilityToggle?: boolean;
    landlordFirstName?: string | null;
}

export function IrisAIAgent({ stats, isVisible: controlledIsVisible, onVisibilityChange, showVisibilityToggle = true, landlordFirstName }: IrisAIAgentProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [internalIsVisible, setInternalIsVisible] = useState(true);
    const [analysis, setAnalysis] = useState<IrisAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<number>(0);
    const [cooldown, setCooldown] = useState(0);
    const [bubbleState, setBubbleState] = useState({
        messageIndex: 0,
        isExpanded: true,
    });
    const bubbleSwapTimeoutRef = useRef<number | null>(null);
    const safeFirstName = useMemo(() => {
        const cleaned = landlordFirstName?.trim();
        return cleaned && cleaned.length > 0 ? cleaned : "there";
    }, [landlordFirstName]);
    const bubbleMessages = useMemo(
        () => [
            `Hey ${safeFirstName}, anything worth a closer look today?`,
            `I'm IRIS — I handle the numbers so you can handle everything else.`,
            `${safeFirstName}, ready for a quick KPI check?`,
            `Tip: Use More Metrics when the top-line numbers look fine but something feels off.`,
            `Tip: Export History makes period comparisons a lot less painful.`,
            `Tip: Cross Pending Issues with revenue trends to know what to fix first.`,
            `Late payments tend to cluster. One is rarely just one.`,
            `Maintenance response time affects renewals more than most people expect.`,
            `I can help spot slow leaks before they show up on the income statement.`,
            `Vacancy streaks usually have a cause. Want me to look?`,
            `${safeFirstName}, want me to scan the latest data for anything unusual?`,
            `Revenue trends make more sense when read alongside maintenance volume.`,
            `I track what changed — not just what it changed to.`,
            `Steady occupancy, on-time payments, low open issues. That's the dream. I'll tell you how close you are.`,
            `I don't have gut feelings. I have trend lines. Close enough.`,
            `Most property surprises aren't surprising in hindsight. I try to flag them in foresight.`,
            `${safeFirstName}, the data is up to date. Your coffee situation is your own problem.`,
            `I've seen a lot of slow Mondays turn into expensive Fridays. Early checks help.`,
            `Some patterns take months to surface. I've been watching.`,
            `I don't sleep, which is either reassuring or unsettling depending on your perspective.`,
            `If everything looks clean right now — good. I'll keep watching anyway.`,
            `${safeFirstName}, I flag the issues. The fixing is still on you. Sorry.`,
            `Fun fact: I find a well-timed export deeply satisfying.`,
            `I'm not worried. But I am paying attention, which is close.`,
            `Still here. What do you need?`,
        ],
        [safeFirstName]
    );
    // Compute a simple hash of the current stats to detect changes
    const currentDataHash = useMemo(() => {
        return JSON.stringify(stats);
    }, [stats]);

    // Load persisted analysis from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("iris_stats_analysis:v1");
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as IrisAnalysis;
                // If it's the same data, use it. Otherwise, keep it but we might want to refresh.
                setAnalysis(parsed);
                setLastRefresh(parsed.timestamp);
            } catch (e) {
                console.error("Failed to parse saved analysis", e);
            }
        }
    }, []);

    useEffect(() => {
        const savedVisibility = localStorage.getItem("iris_stats_mascot_visible");
        if (savedVisibility === "false") {
            setInternalIsVisible(false);
        }
    }, []);

    // Cooldown timer logic
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setInterval(() => {
                setCooldown((prev) => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [cooldown]);

    const resolvedIsVisible = controlledIsVisible ?? internalIsVisible;

    useEffect(() => {
        localStorage.setItem("iris_stats_mascot_visible", String(resolvedIsVisible));
        if (!resolvedIsVisible) {
            setIsOpen(false);
        }
    }, [resolvedIsVisible]);

    useEffect(() => {
        if (typeof controlledIsVisible === "boolean") {
            setInternalIsVisible(controlledIsVisible);
        }
    }, [controlledIsVisible]);

    useEffect(() => {
        if (!resolvedIsVisible || isOpen) {
            setBubbleState((prev) => ({ ...prev, isExpanded: true }));
            if (bubbleSwapTimeoutRef.current !== null) {
                window.clearTimeout(bubbleSwapTimeoutRef.current);
                bubbleSwapTimeoutRef.current = null;
            }
            return;
        }

        const rotationInterval = window.setInterval(() => {
            setBubbleState((prev) => ({ ...prev, isExpanded: false }));
            bubbleSwapTimeoutRef.current = window.setTimeout(() => {
                setBubbleState((prev) => {
                    if (bubbleMessages.length <= 1) return { ...prev, messageIndex: 0 };
                    let nextIndex = prev.messageIndex;
                    while (nextIndex === prev.messageIndex) {
                        nextIndex = Math.floor(Math.random() * bubbleMessages.length);
                    }
                    return { ...prev, messageIndex: nextIndex, isExpanded: true };
                });
                bubbleSwapTimeoutRef.current = null;
            }, 260);
        }, 12000);

        return () => {
            window.clearInterval(rotationInterval);
            if (bubbleSwapTimeoutRef.current !== null) {
                window.clearTimeout(bubbleSwapTimeoutRef.current);
                bubbleSwapTimeoutRef.current = null;
            }
        };
    }, [bubbleMessages.length, resolvedIsVisible, isOpen]);

    const fetchAnalysis = async (force = false) => {
        if (isLoading) return;
        if (cooldown > 0 && force) return;

        // Token efficiency: If data hasn't changed and we have an analysis, don't re-fetch unless forced
        if (!force && analysis && analysis.dataHash === currentDataHash) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/landlord/analytics/iris-analysis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stats, dataHash: currentDataHash }),
            });

            if (!response.ok) throw new Error("Failed to fetch analysis");

            const data = await response.json();
            const newAnalysis: IrisAnalysis = {
                ...data,
                timestamp: Date.now(),
                dataHash: currentDataHash,
            };

            setAnalysis(newAnalysis);
            setLastRefresh(newAnalysis.timestamp);
            localStorage.setItem("iris_stats_analysis:v1", JSON.stringify(newAnalysis));

            if (force) {
                setCooldown(30); // 30 seconds cooldown for refresh
            }
        } catch (error) {
            console.error("iRis analysis error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-fetch if no analysis exists or if data changed and we are open
    useEffect(() => {
        if (isOpen && (!analysis || (analysis.dataHash !== currentDataHash))) {
            void fetchAnalysis();
        }
    }, [isOpen, currentDataHash]);

    return (
        <>
            {/* iRis Floating Character */}
            {resolvedIsVisible && (
                <div className="fixed bottom-[-70] left-[250px] z-[100] pointer-events-none">
                    <motion.div
                        initial={{ x: -100, y: 100, opacity: 0, rotate: 45 }}
                        animate={{
                            x: isOpen ? -150 : 0,
                            y: isOpen ? 150 : 0,
                            opacity: 1,
                            rotate: 0,
                            transition: { type: "spring", stiffness: 260, damping: 20 }
                        }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="pointer-events-auto cursor-pointer relative group px-6 pb-4"
                        onClick={() => setIsOpen(true)}
                    >
                        {/* Waving Animation Container */}
                        <motion.div
                            animate={{
                                rotate: [0, 5, -5, 5, 0],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 4,
                                ease: "easeInOut"
                            }}
                            className="relative"
                        >
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="h-40 w-auto drop-shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all group-hover:drop-shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] scale-x-[-1]"
                            >
                                <source src="https://assets.masko.ai/d223fc/homey-8511/happy-wave-a656528d.webm" type="video/webm" />
                                <source src="https://assets.masko.ai/d223fc/homey-8511/happy-wave-6358cae0.mov" type="video/mp4; codecs='hvc1'" />
                            </video>


                        </motion.div>

                        {/* Interaction Hint */}
                        <AnimatePresence>
                            {!isOpen && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20, y: 20, scale: 0.85 }}
                                    animate={
                                        bubbleState.isExpanded
                                            ? { opacity: 1, x: 0, y: 0, scale: 1, scaleY: 1, filter: "blur(0px)" }
                                            : { opacity: 0, x: 4, y: 10, scale: 0.92, scaleY: 0.7, filter: "blur(4px)" }
                                    }
                                    exit={{ opacity: 0, x: 20, y: 20, scale: 0.85 }}
                                    transition={{ duration: bubbleState.isExpanded ? 0.32 : 0.22, ease: "easeOut" }}
                                    style={{ transformOrigin: "left bottom" }}
                                    className="absolute left-[85%] ml-1 bottom-[6.25rem] whitespace-nowrap rounded-2xl border border-white/10 bg-card/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground backdrop-blur-xl shadow-2xl"
                                >
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.span
                                            key={`iris-bubble-${bubbleState.messageIndex}`}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{ duration: 0.18, ease: "easeOut" }}
                                            className="block"
                                        >
                                            {bubbleMessages[bubbleState.messageIndex % bubbleMessages.length]}
                                        </motion.span>
                                    </AnimatePresence>
                                    <motion.div
                                        animate={
                                            bubbleState.isExpanded
                                                ? { opacity: 1, scale: 1 }
                                                : { opacity: 0, scale: 0.7 }
                                        }
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute top-1/2 -left-1.5 size-3.5 -translate-y-1/2 rotate-45 border-l border-b border-white/10 bg-card/80"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}

            {showVisibilityToggle && (
                <button
                    type="button"
                    onClick={() => {
                        const nextVisible = !resolvedIsVisible;
                        if (onVisibilityChange) {
                            onVisibilityChange(nextVisible);
                        } else {
                            setInternalIsVisible(nextVisible);
                        }
                    }}
                    className="fixed left-[240px] bottom-8 z-[101] pointer-events-auto flex items-center gap-2 rounded-full border border-primary/30 bg-card/90 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-primary shadow-xl backdrop-blur-xl transition-all hover:scale-[1.03] active:scale-95"
                    aria-pressed={!resolvedIsVisible}
                    aria-label={resolvedIsVisible ? "Hide iRis assistant" : "Show iRis assistant"}
                >
                    {resolvedIsVisible ? "Hide iRis" : "Show iRis"}
                </button>
            )}

            {/* Analysis Dialog */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[110] flex items-end justify-start p-6 pl-80 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, x: -100, scale: 0.9, rotate: -5 }}
                            animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, x: -100, scale: 0.9, rotate: -5 }}
                            className="pointer-events-auto w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-card/95 p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden relative"
                        >
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 size-64 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

                            <div className="relative z-10 flex flex-col h-full">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <h3 className="text-xl font-bold tracking-tight text-foreground">iRis Property Analysis</h3>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Portfolio Intelligence</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="rounded-2xl p-3 text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground active:scale-90"
                                    >
                                        <X className="size-6" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar-premium pr-2 space-y-8 max-h-[60vh]">
                                    {isLoading ? (
                                        <div className="space-y-6 py-4">
                                            <div className="space-y-3">
                                                <div className="h-4 w-3/4 rounded-full bg-muted/40 animate-pulse" />
                                                <div className="h-3 w-full rounded-full bg-muted/20 animate-pulse" />
                                                <div className="h-3 w-5/6 rounded-full bg-muted/20 animate-pulse" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="h-24 rounded-3xl bg-muted/10 animate-pulse" />
                                                <div className="h-24 rounded-3xl bg-muted/10 animate-pulse" />
                                            </div>
                                        </div>
                                    ) : analysis ? (
                                        <>
                                            <div className="relative">
                                                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                                                <p className="text-base font-bold leading-relaxed text-foreground/90 italic">
                                                    "{analysis.summary}"
                                                </p>
                                            </div>

                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div className="space-y-4">
                                                    <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                                                        <div className="size-1.5 rounded-full bg-emerald-400" />
                                                        Good Things
                                                    </h4>
                                                    <ul className="space-y-3">
                                                        {analysis.goodThings.map((item, i) => (
                                                            <li key={item} className="flex gap-3 text-xs font-bold leading-relaxed text-foreground/80">
                                                                <div className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-400/30" />
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="space-y-4">
                                                    <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                                                        <div className="size-1.5 rounded-full bg-amber-400" />
                                                        Things to Watch
                                                    </h4>
                                                    <ul className="space-y-3">
                                                        {analysis.toLookOutFor.map((item, i) => (
                                                            <li key={item} className="flex gap-3 text-xs font-bold leading-relaxed text-foreground/80">
                                                                <div className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-400/30" />
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            <div className="rounded-3xl border border-white/5 bg-primary/5 p-6 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                        <MessageSquare className="size-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground">Need deeper insights?</p>
                                                        <p className="text-[10px] font-medium text-muted-foreground">Ask iRis in the command center.</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="size-5 text-muted-foreground/40" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <p className="text-sm font-bold text-muted-foreground">No analysis available for this period.</p>
                                            <button
                                                onClick={() => fetchAnalysis(true)}
                                                className="mt-4 text-xs font-bold uppercase tracking-widest text-primary hover:underline"
                                            >
                                                Generate Now
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                        Last Updated: {lastRefresh ? <ClientOnlyTime date={new Date(lastRefresh)} /> : "Never"}
                                    </div>
                                    <button
                                        onClick={() => fetchAnalysis(true)}
                                        disabled={isLoading || cooldown > 0}
                                        className={cn(
                                            "flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95",
                                            cooldown > 0
                                                ? "bg-muted/20 text-muted-foreground cursor-not-allowed opacity-50"
                                                : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                                        )}
                                    >
                                        <RefreshCcw className={cn("size-3.5", isLoading && "animate-spin")} />
                                        {cooldown > 0 ? `Wait ${cooldown}s` : "Refresh Analysis"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
