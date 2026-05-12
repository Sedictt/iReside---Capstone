"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowUpRight } from "lucide-react";

export function LandlordQuestTriggerGuide() {
    const [isVisible, setIsVisible] = useState(false);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

    const startHighlight = useCallback(() => {
        setIsVisible(true);
    }, []);

    const stopHighlight = useCallback(() => {
        setIsVisible(false);
        localStorage.setItem("ireside_landlord_quest_guide_completed", "true");
    }, []);

    useEffect(() => {
        const handleStart = () => startHighlight();
        const handleStop = () => stopHighlight();

        window.addEventListener("start-quest-trigger-guide", handleStart);
        window.addEventListener("open-quest-board", handleStop);

        return () => {
            window.removeEventListener("start-quest-trigger-guide", handleStart);
            window.removeEventListener("open-quest-board", handleStop);
        };
    }, [startHighlight, stopHighlight]);

    useEffect(() => {
        if (!isVisible) {
            setAnchorRect(null);
            return;
        }

        const selector = `[data-tour-id="tour-quest-trigger"]`;
        const updateAnchorRect = () => {
            const target = document.querySelector<HTMLElement>(selector);
            setAnchorRect(target ? target.getBoundingClientRect() : null);
        };

        updateAnchorRect();
        const interval = window.setInterval(updateAnchorRect, 600);
        window.addEventListener("resize", updateAnchorRect);
        window.addEventListener("scroll", updateAnchorRect, true);

        return () => {
            window.clearInterval(interval);
            window.removeEventListener("resize", updateAnchorRect);
            window.removeEventListener("scroll", updateAnchorRect, true);
        };
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[120] pointer-events-none">
            {/* Highlight Mask - Blocking Pointer Events for Dimmed Area */}
            {anchorRect && (
                <>
                    <div
                        className="fixed inset-0 z-[121] bg-black/65 backdrop-blur-[2px] transition-all duration-500 ease-out pointer-events-auto"
                        style={{
                            clipPath: `polygon(
                                0% 0%, 
                                100% 0%, 
                                100% 100%, 
                                0% 100%, 
                                0% 0%, 
                                ${anchorRect.left - 8}px ${anchorRect.top - 8}px, 
                                ${anchorRect.left - 8}px ${anchorRect.bottom + 8}px, 
                                ${anchorRect.right + 8}px ${anchorRect.bottom + 8}px, 
                                ${anchorRect.right + 8}px ${anchorRect.top - 8}px, 
                                ${anchorRect.left - 8}px ${anchorRect.top - 8}px
                            )`
                        }}
                    />
                    
                    {/* Visual Highlight Border */}
                    <div
                        className="fixed z-[122] rounded-2xl border-2 border-primary transition-all duration-500 ease-out pointer-events-none"
                        style={{
                            top: anchorRect.top - 8,
                            left: anchorRect.left - 8,
                            width: anchorRect.width + 16,
                            height: anchorRect.height + 16,
                        }}
                    />
                    
                    {/* Pulsing Ring */}
                    <div 
                        className="fixed z-[122] rounded-2xl border-2 border-primary animate-ping pointer-events-none"
                        style={{
                            top: anchorRect.top - 8,
                            left: anchorRect.left - 8,
                            width: anchorRect.width + 16,
                            height: anchorRect.height + 16,
                        }}
                    />
                </>
            )}

            {/* Tooltip Content */}
            <div 
                className={cn(
                    "fixed z-[123] w-[280px] bg-card border border-white/10 rounded-[2rem] p-6 shadow-2xl backdrop-blur-xl transition-all duration-500 animate-in fade-in slide-in-from-top-4",
                    anchorRect ? "" : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                )}
                style={anchorRect ? {
                    top: anchorRect.bottom + 24,
                    right: window.innerWidth - anchorRect.right - 8,
                } : {}}
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-primary/20 text-primary">
                        <Sparkles className="size-4" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Action Required</p>
                </div>
                
                <h3 className="text-sm font-black text-foreground mb-2 leading-tight">
                    Start Your First Mission
                </h3>
                
                <p className="text-xs text-muted-foreground/90 leading-relaxed mb-4">
                    Click this glowing icon to open your <span className="font-black text-foreground text-primary">Mission Control</span> and begin your property management journey.
                </p>

                <div className="flex items-center gap-2 text-[10px] font-black text-primary animate-bounce">
                    <ArrowUpRight className="size-3" />
                    Click the icon above
                </div>
            </div>
        </div>
    );
}
