"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { m as motion, AnimatePresence } from "framer-motion";

interface ActiveTooltipState {
    text: string;
    targetRect: DOMRect;
    preferredSide: "top" | "bottom" | "left" | "right";
    align: "center" | "start" | "end";
}

let lastTooltipHideTime = 0;

export function GlobalTooltipManager() {
    const [mounted, setMounted] = useState(false);
    const [activeTooltip, setActiveTooltip] = useState<ActiveTooltipState | null>(null);
    const showTimerRef = useRef<NodeJS.Timeout | null>(null);
    const currentTargetRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const clearShowTimer = () => {
            if (showTimerRef.current) {
                clearTimeout(showTimerRef.current);
                showTimerRef.current = null;
            }
        };

        const hideTooltip = () => {
            clearShowTimer();
            if (currentTargetRef.current) {
                // Restore native title attribute if saved
                const originalTitle = currentTargetRef.current.getAttribute("data-default-title");
                if (originalTitle !== null) {
                    currentTargetRef.current.setAttribute("title", originalTitle);
                    currentTargetRef.current.removeAttribute("data-default-title");
                }
                currentTargetRef.current = null;
            }
            setActiveTooltip(null);
            lastTooltipHideTime = Date.now();
        };

        const findTooltipTarget = (target: EventTarget | null): { element: HTMLElement; text: string; side: "top" | "bottom" | "left" | "right"; align: "center" | "start" | "end" } | null => {
            if (!(target instanceof HTMLElement)) return null;

            // Don't intercept if element or parent has data-radix-tooltip-trigger (handled by Radix)
            if (target.closest("[data-radix-tooltip-trigger]")) return null;
            if (target.closest("[data-tooltip-disabled='true']")) return null;

            // Check for elements with title or data-tooltip / data-tooltip-content
            const el = target.closest<HTMLElement>(
                "[title], [data-tooltip]:not([data-tooltip='false']):not([data-tooltip='true']), [data-tooltip-content], [data-default-title]"
            );

            if (!el) return null;

            // Ignore if data-tooltip="true" (some canvas/custom nodes use true as a boolean flag)
            const rawTooltip = el.getAttribute("data-tooltip") || el.getAttribute("data-tooltip-content");
            const rawTitle = el.getAttribute("title") || el.getAttribute("data-default-title");

            const text = (rawTooltip && rawTooltip !== "true" ? rawTooltip : rawTitle) || "";
            if (!text.trim()) return null;

            const side = (el.getAttribute("data-tooltip-side") as "top" | "bottom" | "left" | "right") || "top";
            const align = (el.getAttribute("data-tooltip-align") as "center" | "start" | "end") || "center";

            return { element: el, text: text.trim(), side, align };
        };

        const handlePointerOver = (e: PointerEvent) => {
            // Ignore touch events to prevent sticky mobile tooltips
            if (e.pointerType === "touch") return;

            const info = findTooltipTarget(e.target);
            if (!info) {
                if (currentTargetRef.current && !currentTargetRef.current.contains(e.target as Node)) {
                    hideTooltip();
                }
                return;
            }

            const { element, text, side, align } = info;

            // If already targeting this element with same text, do nothing
            if (currentTargetRef.current === element) return;

            // If we had a previous element, restore its title
            if (currentTargetRef.current && currentTargetRef.current !== element) {
                const prevTitle = currentTargetRef.current.getAttribute("data-default-title");
                if (prevTitle !== null) {
                    currentTargetRef.current.setAttribute("title", prevTitle);
                    currentTargetRef.current.removeAttribute("data-default-title");
                }
            }

            currentTargetRef.current = element;

            // Suppress default browser title popup
            const currentTitle = element.getAttribute("title");
            if (currentTitle) {
                element.setAttribute("data-default-title", currentTitle);
                element.removeAttribute("title");
            }

            clearShowTimer();

            // Warm delay logic: if recently hovered another tooltip, show faster
            const isWarm = Date.now() - lastTooltipHideTime < 250;
            const delay = isWarm ? 40 : 200;

            showTimerRef.current = setTimeout(() => {
                if (!currentTargetRef.current || !document.body.contains(currentTargetRef.current)) {
                    hideTooltip();
                    return;
                }
                setActiveTooltip({
                    text,
                    targetRect: currentTargetRef.current.getBoundingClientRect(),
                    preferredSide: side,
                    align,
                });
            }, delay);
        };

        const handlePointerOut = (e: PointerEvent) => {
            if (!currentTargetRef.current) return;
            const related = e.relatedTarget as Node | null;
            if (related && currentTargetRef.current.contains(related)) return;

            hideTooltip();
        };

        const handlePointerDown = () => {
            hideTooltip();
        };

        const handleScroll = () => {
            hideTooltip();
        };

        const handleFocusIn = (e: FocusEvent) => {
            const info = findTooltipTarget(e.target);
            if (!info) return;

            const { element, text, side, align } = info;
            currentTargetRef.current = element;

            const currentTitle = element.getAttribute("title");
            if (currentTitle) {
                element.setAttribute("data-default-title", currentTitle);
                element.removeAttribute("title");
            }

            setActiveTooltip({
                text,
                targetRect: element.getBoundingClientRect(),
                preferredSide: side,
                align,
            });
        };

        const handleFocusOut = () => {
            hideTooltip();
        };

        document.addEventListener("pointerover", handlePointerOver, { passive: true });
        document.addEventListener("pointerout", handlePointerOut, { passive: true });
        document.addEventListener("pointerdown", handlePointerDown, { passive: true });
        document.addEventListener("focusin", handleFocusIn, { passive: true });
        document.addEventListener("focusout", handleFocusOut, { passive: true });
        window.addEventListener("scroll", handleScroll, { passive: true, capture: true });

        return () => {
            clearShowTimer();
            document.removeEventListener("pointerover", handlePointerOver);
            document.removeEventListener("pointerout", handlePointerOut);
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("focusin", handleFocusIn);
            document.removeEventListener("focusout", handleFocusOut);
            window.removeEventListener("scroll", handleScroll, { capture: true });
        };
    }, [mounted]);

    if (!mounted || !activeTooltip) return null;

    const { text, targetRect, preferredSide, align } = activeTooltip;

    // Calculate smart positioning with boundary detection
    const sideOffset = 8;
    const estimatedHeight = 32;
    let computedSide = preferredSide;

    // Viewport collision flipping
    if (preferredSide === "top" && targetRect.top < estimatedHeight + sideOffset + 10) {
        computedSide = "bottom";
    } else if (preferredSide === "bottom" && targetRect.bottom + estimatedHeight + sideOffset > window.innerHeight - 10) {
        computedSide = "top";
    }

    let top = 0;
    let left = 0;
    let transformOrigin = "center center";

    if (computedSide === "top") {
        top = targetRect.top - sideOffset;
        left = align === "start" ? targetRect.left : align === "end" ? targetRect.right : targetRect.left + targetRect.width / 2;
        transformOrigin = "bottom center";
    } else if (computedSide === "bottom") {
        top = targetRect.bottom + sideOffset;
        left = align === "start" ? targetRect.left : align === "end" ? targetRect.right : targetRect.left + targetRect.width / 2;
        transformOrigin = "top center";
    } else if (computedSide === "left") {
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left - sideOffset;
        transformOrigin = "right center";
    } else if (computedSide === "right") {
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.right + sideOffset;
        transformOrigin = "left center";
    }

    const translateClasses = {
        top: align === "start" ? "translate-y-[-100%]" : align === "end" ? "translate-x-[-100%] translate-y-[-100%]" : "translate-x-[-50%] translate-y-[-100%]",
        bottom: align === "start" ? "" : align === "end" ? "translate-x-[-100%]" : "translate-x-[-50%]",
        left: "translate-x-[-100%] translate-y-[-50%]",
        right: "translate-y-[-50%]",
    }[computedSide];

    return createPortal(
        <div
            className="fixed inset-0 pointer-events-none z-[999999] overflow-hidden"
            style={{ width: "100vw", height: "100vh" }}
        >
            <AnimatePresence>
                <motion.div
                    key={`${text}-${targetRect.top}-${targetRect.left}`}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                    style={{
                        position: "absolute",
                        top: `${top}px`,
                        left: `${left}px`,
                        transformOrigin,
                    }}
                    className={`pointer-events-none select-none ${translateClasses}`}
                >
                    <div className="relative flex items-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-950/95 px-3 py-1.5 text-[11px] font-semibold text-slate-100 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(0,0,0,0.4)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95 dark:text-zinc-100 max-w-xs whitespace-normal break-words leading-snug">
                        <span>{text}</span>
                        {/* Subtly styled directional arrow indicator */}
                        {computedSide === "top" && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-2 rotate-45 border-r border-b border-slate-800/80 bg-slate-950 dark:border-white/10 dark:bg-zinc-900" />
                        )}
                        {computedSide === "bottom" && (
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 size-2 rotate-45 border-l border-t border-slate-800/80 bg-slate-950 dark:border-white/10 dark:bg-zinc-900" />
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>,
        document.body
    );
}
