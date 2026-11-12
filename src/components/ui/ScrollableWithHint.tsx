'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollableWithHintProps {
    children: React.ReactNode;
    containerClassName?: string;
    className?: string;
    contentClassName?: string;
    hintText?: string;
    topFade?: boolean;
    fadeColor?: 'background' | 'card';
    resetKey?: string | number | null;
}

/**
 * Scrollable region that visually notifies users (and lets them tap to scroll)
 * whenever additional content extends below the visible viewport.
 */
export function ScrollableWithHint({
    children,
    containerClassName,
    className,
    contentClassName,
    hintText = 'More below • Scroll down',
    topFade = true,
    fadeColor = 'background',
    resetKey,
}: ScrollableWithHintProps) {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [hasMoreBelow, setHasMoreBelow] = useState(false);
    const [hasMoreAbove, setHasMoreAbove] = useState(false);

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        setHasMoreAbove(scrollTop > 14);
        setHasMoreBelow(scrollHeight - scrollTop - clientHeight > 14);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTop = 0;
        const frame = window.requestAnimationFrame(updateScrollState);
        return () => window.cancelAnimationFrame(frame);
    }, [resetKey, updateScrollState]);

    useEffect(() => {
        const scrollEl = scrollRef.current;
        const contentEl = contentRef.current;
        if (!scrollEl) return;

        const frame = window.requestAnimationFrame(updateScrollState);

        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => {
                updateScrollState();
            });
            resizeObserver.observe(scrollEl);
            if (contentEl) {
                resizeObserver.observe(contentEl);
            }
        }

        window.addEventListener('resize', updateScrollState);
        return () => {
            window.cancelAnimationFrame(frame);
            resizeObserver?.disconnect();
            window.removeEventListener('resize', updateScrollState);
        };
    }, [updateScrollState]);

    const handleScrollStepDown = () => {
        const el = scrollRef.current;
        if (!el) return;
        const prefersReduced =
            typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const step = Math.max(180, Math.round(el.clientHeight * 0.65));
        el.scrollBy({
            top: step,
            behavior: prefersReduced ? 'auto' : 'smooth',
        });
    };

    const topGradientClass =
        fadeColor === 'card'
            ? 'from-card via-card/70 to-transparent'
            : 'from-background via-background/70 to-transparent';

    const bottomGradientClass =
        fadeColor === 'card'
            ? 'from-card via-card/90 to-transparent'
            : 'from-background via-background/90 to-transparent';

    return (
        <div className={cn('relative flex-1 min-h-0 flex flex-col', containerClassName)}>
            {topFade && hasMoreAbove && (
                <div
                    aria-hidden="true"
                    className={cn(
                        'pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b',
                        topGradientClass
                    )}
                />
            )}

            <div
                ref={scrollRef}
                onScroll={updateScrollState}
                className={cn('flex-1 min-h-0 overflow-y-auto', className)}
            >
                <div ref={contentRef} className={contentClassName}>
                    {children}
                </div>
            </div>

            {hasMoreBelow && (
                <div
                    className={cn(
                        'pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center items-end pb-2.5 pt-8 bg-gradient-to-t',
                        bottomGradientClass
                    )}
                >
                    <button
                        type="button"
                        onClick={handleScrollStepDown}
                        aria-label={hintText}
                        className="pointer-events-auto inline-flex items-center gap-1.5 min-h-[36px] rounded-full border border-primary/40 bg-card/95 px-3.5 py-1.5 text-xs font-bold text-foreground shadow-lg backdrop-blur-xs hover:bg-muted active:scale-95 transition-all cursor-pointer"
                    >
                        <ChevronDown className="size-4 text-primary shrink-0" />
                        <span>{hintText}</span>
                    </button>
                </div>
            )}
        </div>
    );
}
