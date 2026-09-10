'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
    onRefresh: () => Promise<any> | void;
    children: React.ReactNode;
    className?: string;
    pullThreshold?: number;
}

export function PullToRefresh({
    onRefresh,
    children,
    className,
    pullThreshold = 70,
}: PullToRefreshProps) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);

    const startYRef = useRef<number | null>(null);
    const currentYRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const isAtTop = useCallback(() => {
        if (!containerRef.current) return true;
        // Check both window scroll and closest scrollable parent
        const parentScroll = containerRef.current.closest('.overflow-y-auto');
        if (parentScroll) {
            return parentScroll.scrollTop <= 0;
        }
        return window.scrollY <= 0;
    }, []);

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        if (isRefreshing) return;
        if (!isAtTop()) return;

        // Don't intercept touches or clicks on interactive elements
        const target = e.target as HTMLElement | null;
        if (target && target.closest('button, input, select, textarea, a, [role="button"]')) {
            return;
        }

        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        startYRef.current = clientY;
        currentYRef.current = clientY;
        setIsPulling(true);
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (startYRef.current === null || isRefreshing) return;
        if (!isAtTop()) {
            startYRef.current = null;
            setPullDistance(0);
            setIsPulling(false);
            return;
        }

        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        currentYRef.current = clientY;
        const deltaY = clientY - startYRef.current;

        if (deltaY > 0) {
            // Apply rubber-band damping resistance
            const damped = Math.min(Math.pow(deltaY, 0.82) * 2.2, 110);
            setPullDistance(damped);
        } else {
            setPullDistance(0);
        }
    };

    const handleTouchEnd = async () => {
        if (startYRef.current === null || isRefreshing) {
            setIsPulling(false);
            return;
        }

        const shouldRefresh = pullDistance >= pullThreshold;
        startYRef.current = null;
        currentYRef.current = null;
        setIsPulling(false);

        if (shouldRefresh) {
            setIsRefreshing(true);
            setPullDistance(52); // Keep indicator visible during refresh
            try {
                await onRefresh();
            } catch (err) {
                console.error('[PullToRefresh] Error refreshing:', err);
            } finally {
                // Short settling delay before retracting
                setTimeout(() => {
                    setIsRefreshing(false);
                    setPullDistance(0);
                }, 350);
            }
        } else {
            setPullDistance(0);
        }
    };

    const progress = Math.min(pullDistance / pullThreshold, 1);
    const isReady = pullDistance >= pullThreshold;

    return (
        <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={isPulling ? handleTouchMove : undefined}
            onMouseUp={isPulling ? handleTouchEnd : undefined}
            onMouseLeave={isPulling ? handleTouchEnd : undefined}
            className={cn('relative w-full', isPulling && 'select-none', className)}
        >
            {/* Pull Indicator Area */}
            <div
                style={{
                    height: `${pullDistance}px`,
                    transition: isPulling ? 'none' : 'height 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
                className="w-full flex items-center justify-center overflow-hidden pointer-events-none"
            >
                <div
                    className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-200',
                        isReady || isRefreshing
                            ? 'bg-primary text-primary-foreground border-primary/40 shadow-primary/20 scale-105'
                            : 'bg-card/95 text-muted-foreground border-slate-200/90 dark:border-white/10 shadow-xs scale-95'
                    )}
                >
                    {isRefreshing ? (
                        <>
                            <RefreshCw className="size-3.5 animate-spin" />
                            <span className="text-[11px] font-bold">Refreshing…</span>
                        </>
                    ) : (
                        <>
                            <ArrowDown
                                className={cn(
                                    'size-3.5 transition-transform duration-200',
                                    isReady ? 'rotate-180 text-primary-foreground' : 'text-primary'
                                )}
                                style={{
                                    transform: isReady ? 'rotate(180deg)' : `rotate(${progress * 180}deg)`,
                                }}
                            />
                            <span className="text-[11px] font-bold">
                                {isReady ? 'Release to refresh' : 'Pull to refresh'}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div
                className={cn('w-full', className?.includes('h-full') ? 'h-full flex flex-col' : '')}
                style={{
                    transform: `translateY(${pullDistance > 0 ? pullDistance * 0.15 : 0}px)`,
                    transition: isPulling ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
            >
                {children}
            </div>
        </div>
    );
}
