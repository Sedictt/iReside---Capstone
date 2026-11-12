'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CollapsiblePanelProps {
    isOpen: boolean;
    children: React.ReactNode;
    className?: string;
}

const DURATION_MS = 320;
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Smooth, fluid height + opacity + slight vertical reveal container.
 * Uses `data-no-theme-transition` and explicit inline transitions so global
 * theme-color transitions in globals.css never override height interpolation.
 */
export function CollapsiblePanel({ isOpen, children, className }: CollapsiblePanelProps) {
    const outerRef = useRef<HTMLDivElement | null>(null);
    const innerRef = useRef<HTMLDivElement | null>(null);
    const isMountedRef = useRef(false);
    const hasInitializedEffectRef = useRef(false);
    const isOpenRef = useRef(isOpen);

    useLayoutEffect(() => {
        const outer = outerRef.current;
        const inner = innerRef.current;
        if (!outer || !inner) return;

        isOpenRef.current = isOpen;

        if (!isMountedRef.current) {
            isMountedRef.current = true;
            outer.style.height = isOpen ? 'auto' : '0px';
            outer.style.opacity = isOpen ? '1' : '0';
            outer.style.visibility = isOpen ? 'visible' : 'hidden';
            inner.style.transform = isOpen ? 'translateY(0px)' : 'translateY(-6px)';
        }
    }, [isOpen]);

    useEffect(() => {
        if (!hasInitializedEffectRef.current) {
            hasInitializedEffectRef.current = true;
            return;
        }

        const outer = outerRef.current;
        const inner = innerRef.current;
        if (!outer || !inner) return;

        const prefersReduced =
            typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        if (prefersReduced) {
            outer.style.transition = 'none';
            inner.style.transition = 'none';
            outer.style.height = isOpen ? 'auto' : '0px';
            outer.style.opacity = isOpen ? '1' : '0';
            outer.style.visibility = isOpen ? 'visible' : 'hidden';
            inner.style.transform = 'translateY(0px)';
            return;
        }

        let rafId = 0;
        let timerId: number | null = null;

        if (isOpen) {
            // Opening: start from current pixel height (usually 0px) and glide to scrollHeight
            const currentHeight = outer.getBoundingClientRect().height;
            outer.style.visibility = 'visible';
            outer.style.height = `${currentHeight}px`;
            outer.style.opacity = currentHeight > 0 ? outer.style.opacity || '1' : '0';
            if (currentHeight === 0) {
                inner.style.transform = 'translateY(-6px)';
            }

            void outer.offsetHeight;

            rafId = window.requestAnimationFrame(() => {
                const targetHeight = inner.scrollHeight;
                outer.style.height = `${targetHeight}px`;
                outer.style.opacity = '1';
                inner.style.transform = 'translateY(0px)';

                timerId = window.setTimeout(() => {
                    if (isOpenRef.current && outerRef.current) {
                        outerRef.current.style.height = 'auto';
                    }
                }, DURATION_MS + 20);
            });
        } else {
            // Closing: freeze 'auto' to exact pixel height, reflow, then animate to 0px
            const currentHeight = outer.getBoundingClientRect().height;
            if (currentHeight <= 0) {
                outer.style.height = '0px';
                outer.style.opacity = '0';
                outer.style.visibility = 'hidden';
                return;
            }

            outer.style.height = `${currentHeight}px`;
            outer.style.opacity = '1';
            void outer.offsetHeight;

            rafId = window.requestAnimationFrame(() => {
                outer.style.height = '0px';
                outer.style.opacity = '0';
                inner.style.transform = 'translateY(-4px)';

                timerId = window.setTimeout(() => {
                    if (!isOpenRef.current && outerRef.current) {
                        outerRef.current.style.visibility = 'hidden';
                    }
                }, DURATION_MS + 20);
            });
        }

        return () => {
            if (rafId) window.cancelAnimationFrame(rafId);
            if (timerId !== null) window.clearTimeout(timerId);
        };
    }, [isOpen]);

    return (
        <div
            ref={outerRef}
            data-no-theme-transition
            aria-hidden={!isOpen}
            style={{
                overflow: 'hidden',
                transitionProperty: 'height, opacity',
                transitionDuration: `${DURATION_MS}ms, 240ms`,
                transitionTimingFunction: `${EASING}, ease`,
            }}
            className={cn(!isOpen && 'pointer-events-none', className)}
        >
            <div
                ref={innerRef}
                data-no-theme-transition
                style={{
                    transitionProperty: 'transform',
                    transitionDuration: `${DURATION_MS}ms`,
                    transitionTimingFunction: EASING,
                }}
            >
                {children}
            </div>
        </div>
    );
}
