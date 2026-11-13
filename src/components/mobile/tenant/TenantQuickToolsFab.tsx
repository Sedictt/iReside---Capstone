'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
    LayoutGrid,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Wrench,
    Zap,
    FileText,
    Calendar,
    Sparkles,
    BookOpen,
    HelpCircle,
    User,
    Settings,
    MessageSquare,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { useLanguageContext } from '@/context/LanguageContext';

export type TenantQuickToolsFabState = 'peeking' | 'revealed' | 'open';

interface TenantQuickToolsFabProps {
    onOpenAmenities?: () => void;
    /** Idle duration in milliseconds before a revealed FAB tucks back to the edge. */
    idleTimeoutMs?: number;
}

const DEFAULT_IDLE_TIMEOUT_MS = 4000;

export function TenantQuickToolsFab({
    onOpenAmenities,
    idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
}: TenantQuickToolsFabProps) {
    const { t } = useLanguageContext();
    const [fabState, setFabState] = useState<TenantQuickToolsFabState>('peeking');
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const touchStartXRef = useRef<number | null>(null);

    const clearIdleTimer = useCallback(() => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }
    }, []);

    const scheduleAutoHide = useCallback(() => {
        clearIdleTimer();
        idleTimerRef.current = setTimeout(() => {
            setFabState((prev) => (prev === 'revealed' ? 'peeking' : prev));
        }, idleTimeoutMs);
    }, [clearIdleTimer, idleTimeoutMs]);

    const revealFab = useCallback(() => {
        setFabState('revealed');
        scheduleAutoHide();
    }, [scheduleAutoHide]);

    const openDrawer = useCallback(() => {
        clearIdleTimer();
        triggerHaptic('light');
        setFabState('open');
    }, [clearIdleTimer]);

    const closeDrawer = useCallback(() => {
        clearIdleTimer();
        setFabState('peeking');
    }, [clearIdleTimer]);

    // Auto-hide lifecycle & tuck away on scroll
    useEffect(() => {
        if (fabState === 'revealed') {
            scheduleAutoHide();
            const handleScroll = () => {
                clearIdleTimer();
                setFabState('peeking');
            };
            window.addEventListener('scroll', handleScroll, true);
            return () => {
                clearIdleTimer();
                window.removeEventListener('scroll', handleScroll, true);
            };
        } else {
            clearIdleTimer();
        }
        return clearIdleTimer;
    }, [fabState, scheduleAutoHide, clearIdleTimer]);

    // Dismiss drawer on Escape
    useEffect(() => {
        if (fabState !== 'open') return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeDrawer();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [fabState, closeDrawer]);

    const handleFabClick = () => {
        triggerHaptic('light');
        if (fabState === 'peeking') {
            revealFab();
            return;
        }
        if (fabState === 'revealed') {
            openDrawer();
        }
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
        touchStartXRef.current = e.touches[0]?.clientX ?? null;
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
        if (touchStartXRef.current === null) return;
        const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
        const deltaX = endX - touchStartXRef.current;
        touchStartXRef.current = null;

        if (deltaX < -24) {
            if (fabState === 'peeking') {
                revealFab();
            } else if (fabState === 'revealed') {
                openDrawer();
            }
        } else if (deltaX > 24 && fabState === 'revealed') {
            clearIdleTimer();
            setFabState('peeking');
        }
    };

    const toolGroups = [
        {
            heading: t('Rent & Utilities'),
            items: [
                {
                    type: 'link' as const,
                    href: '/mobile/tenant/pay',
                    icon: CreditCard,
                    iconTone: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
                    title: t('Pay Rent & Bills'),
                    subtitle: t('Upload payment proof & receipts'),
                },
                {
                    type: 'link' as const,
                    href: '/mobile/utilities',
                    icon: Zap,
                    iconTone: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
                    title: t('Water & Electricity'),
                    subtitle: t('Submeter consumption & billing breakdown'),
                },
            ],
        },
        {
            heading: t('Living & Services'),
            items: [
                {
                    type: 'link' as const,
                    href: '/mobile/tenant/maintenance',
                    icon: Wrench,
                    iconTone: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
                    title: t('Request Repair'),
                    subtitle: t('Report maintenance & track status'),
                },
                ...(onOpenAmenities ? [{
                    type: 'button' as const,
                    onClick: onOpenAmenities,
                    icon: Sparkles,
                    iconTone: 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
                    title: t('Reserve Amenities'),
                    subtitle: t('Clubhouse, study lounge & facilities'),
                }] : []),
                {
                    type: 'link' as const,
                    href: '/mobile/tenant/lease',
                    icon: FileText,
                    iconTone: 'bg-blue-500/12 text-blue-600 dark:text-blue-400',
                    title: t('Lease Contract'),
                    subtitle: t('Tenancy terms, deposits & renewals'),
                },
                {
                    type: 'link' as const,
                    href: '/mobile/tenant/calendar',
                    icon: Calendar,
                    iconTone: 'bg-teal-500/12 text-teal-600 dark:text-teal-400',
                    title: t('Building Calendar'),
                    subtitle: t('Due dates & inspection schedules'),
                },
            ],
        },
        {
            heading: t('Support & Rules'),
            items: [
                {
                    type: 'link' as const,
                    href: '/mobile/tenant/manual',
                    icon: BookOpen,
                    iconTone: 'bg-indigo-500/12 text-indigo-600 dark:text-indigo-400',
                    title: t('House Rules & Guide'),
                    subtitle: t('Quiet hours, garbage & emergency safety'),
                },
                {
                    type: 'link' as const,
                    href: '/mobile/tenant/messages',
                    icon: MessageSquare,
                    iconTone: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
                    title: t('Message Landlord'),
                    subtitle: t('Direct chat with property manager'),
                },
                {
                    type: 'link' as const,
                    href: '/mobile/tenant/settings',
                    icon: Settings,
                    iconTone: 'bg-slate-500/12 text-slate-600 dark:text-slate-400',
                    title: t('Account Settings'),
                    subtitle: t('Security, notifications & preferences'),
                },
            ],
        },
    ];

    const isRevealed = fabState === 'revealed';

    return (
        <>
            {/* Instagram-Instants-style Edge FAB anchored to the mobile frame bounds */}
            <div
                className="fixed bottom-24 inset-x-0 mx-auto w-full max-w-full sm:max-w-xl md:max-w-2xl z-40 pointer-events-none flex justify-end overflow-hidden"
                aria-hidden={fabState === 'open'}
            >
                <button
                    type="button"
                    data-fab-state={fabState}
                    onClick={handleFabClick}
                    onMouseEnter={() => {
                        if (fabState === 'peeking') revealFab();
                        else if (fabState === 'revealed') scheduleAutoHide();
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onFocus={() => {
                        if (fabState === 'peeking') revealFab();
                    }}
                    aria-label={
                        isRevealed
                            ? t('Open Resident Tools')
                            : t('Show Resident Tools')
                    }
                    aria-expanded={fabState === 'open'}
                    className={cn(
                        'pointer-events-auto group flex items-center gap-2.5 h-12 pl-2.5 pr-4 rounded-l-full rounded-r-full',
                        'bg-card text-foreground border border-border/90',
                        'shadow-sm',
                        'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                        'cursor-pointer touch-manipulation select-none active:scale-95',
                        isRevealed
                            ? '-translate-x-3 opacity-100 ring-2 ring-primary/25'
                            : 'translate-x-[calc(100%-40px)] opacity-90 hover:opacity-100',
                        fabState === 'open' && 'opacity-0 pointer-events-none translate-x-full'
                    )}
                >
                    <span
                        className={cn(
                            'flex size-8 items-center justify-center rounded-full shrink-0 transition-colors',
                            isRevealed
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-primary/15 text-primary'
                        )}
                    >
                        {isRevealed ? (
                            <LayoutGrid className="size-4" aria-hidden="true" />
                        ) : (
                            <ChevronLeft className="size-4" aria-hidden="true" />
                        )}
                    </span>

                    <span className="text-xs font-bold whitespace-nowrap pr-0.5">
                        {t('Quick Tools')}
                    </span>
                </button>
            </div>

            {/* Quick Actions & Tools Bottom Sheet */}
            {fabState === 'open' && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-in fade-in duration-150"
                    onClick={closeDrawer}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('Resident Quick Tools')}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-full sm:max-w-xl md:max-w-2xl rounded-t-3xl bg-card border-t border-border p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-xl max-h-[82dvh] overflow-y-auto overscroll-y-contain animate-in slide-in-from-bottom duration-200"
                    >
                        {/* Drag Handle */}
                        <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" aria-hidden="true" />

                        {/* Sheet Header */}
                        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-border/70">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/15 shrink-0">
                                    <LayoutGrid className="size-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-foreground leading-snug">
                                        {t('Resident Quick Tools')}
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-snug">
                                        {t('Everyday shortcuts & services')}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic('light');
                                    closeDrawer();
                                }}
                                aria-label={t('Close Quick Tools')}
                                className="flex size-11 items-center justify-center rounded-full bg-muted/70 hover:bg-muted text-foreground border border-border transition-colors active:scale-95 shrink-0 cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Grouped, Un-truncated Single-Column Shortcut Sections */}
                        <div className="flex flex-col gap-4">
                            {toolGroups.map((group) => (
                                <section key={group.heading} className="flex flex-col gap-2">
                                    <h4 className="text-xs font-bold text-muted-foreground px-1">
                                        {group.heading}
                                    </h4>
                                    <div className="flex flex-col gap-2">
                                        {group.items.map((tool) => {
                                            const Icon = tool.icon;
                                            const content = (
                                                <>
                                                    <div className={cn('flex size-10 items-center justify-center rounded-xl shrink-0', tool.iconTone)}>
                                                        <Icon className="size-5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <span className="block text-sm font-bold text-foreground leading-snug">
                                                            {tool.title}
                                                        </span>
                                                        <span className="block text-xs text-muted-foreground leading-snug">
                                                            {tool.subtitle}
                                                        </span>
                                                    </div>
                                                    <ChevronRight className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                                                </>
                                            );

                                            const rowClass =
                                                'w-full px-3 py-2.5 rounded-2xl border border-border/80 bg-background hover:bg-muted/50 hover:border-primary/40 flex items-center gap-3 min-h-[58px] text-left active:scale-[0.99] transition-all cursor-pointer';

                                            if (tool.type === 'link') {
                                                return (
                                                    <Link
                                                        key={tool.title}
                                                        href={tool.href}
                                                        onClick={() => {
                                                            triggerHaptic('light');
                                                            closeDrawer();
                                                        }}
                                                        className={rowClass}
                                                    >
                                                        {content}
                                                    </Link>
                                                );
                                            }

                                            return (
                                                <button
                                                    key={tool.title}
                                                    type="button"
                                                    onClick={() => {
                                                        triggerHaptic('light');
                                                        closeDrawer();
                                                        tool.onClick();
                                                    }}
                                                    className={rowClass}
                                                >
                                                    {content}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
