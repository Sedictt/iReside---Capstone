'use client';

import { useState, useEffect, useMemo, useRef, Fragment, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
    Search,
    Clock,
    AlertTriangle,
    CheckCircle2,
    X,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Wrench,
    RotateCcw,
    Info,
    User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProperty } from '@/context/PropertyContext';
import { useLanguageContext } from '@/context/LanguageContext';
import { triggerHaptic } from '@/lib/haptics';
import {
    MAINTENANCE_PRIORITY_BADGE_TEXT,
    MAINTENANCE_PRIORITY_SOFT_CLASSES,
    toPriorityLabel,
} from '@/lib/maintenance-priority';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobileConfirmModal } from '@/components/mobile/shared/MobileConfirmModal';
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector';
import { readViewCache, writeViewCache, hasViewCache, fetchJsonDeduped } from '@/lib/mobile/view-cache';

interface MaintenanceRequest {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    category?: string;
    property?: string;
    unit_id?: string;
    unit?: string | { id: string; name: string };
    tenant?: string | { id: string; full_name?: string; email?: string };
    images?: string[];
    reportedAt?: string;
    created_at?: string;
    ai_triage_notes?: string;
    triageReason?: string;
}

type TicketStatusFilter = 'all' | 'open' | 'in_progress' | 'resolved';

const TICKETS_PER_PAGE = 4;

function fillRich(text: string, nodes: Record<string, ReactNode>) {
    return text.split(/(\{\w+\})/g).map((part, i) => {
        const match = part.match(/^\{(\w+)\}$/);
        return match && nodes[match[1]] !== undefined ? (
            <Fragment key={i}>{nodes[match[1]]}</Fragment>
        ) : (
            part
        );
    });
}

function normalizeStatus(status?: string | null): 'pending' | 'in_progress' | 'resolved' | 'other' {
    if (!status) return 'other';
    const s = status.toLowerCase().replace(/[\s_-]+/g, '');
    if (s === 'open' || s === 'pending') return 'pending';
    if (s === 'inprogress' || s === 'assigned') return 'in_progress';
    if (s === 'resolved' || s === 'closed') return 'resolved';
    return 'other';
}

function resolveUnitName(unit: MaintenanceRequest['unit']): string | null {
    const raw = typeof unit === 'string' ? unit.trim() : unit?.name?.trim();
    return raw || null;
}

function resolveTenantName(tenant: MaintenanceRequest['tenant']): string | null {
    if (!tenant) return null;
    if (typeof tenant === 'string') return tenant.trim() || null;
    return tenant.full_name?.trim() || tenant.email?.trim() || null;
}

function formatReportedLabel(
    reportedAt: string | undefined,
    createdAt: string | undefined,
    locale: string,
    fallback: string
): string {
    const raw = reportedAt?.trim() || createdAt?.trim();
    if (!raw) return fallback;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
        // Service returns humanized relative labels like "Today" or "2 days ago"
        return raw;
    }
    return parsed.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function LandlordTicketsView() {
    const { selectedPropertyId } = useProperty();
    const searchParams = useSearchParams();
    const { t, locale } = useLanguageContext();

    const ticketsCacheKey = `landlord-tickets:${selectedPropertyId || 'all'}`;
    const fetchRequestRef = useRef(0);

    const [tickets, setTickets] = useState<MaintenanceRequest[]>(
        () => readViewCache<MaintenanceRequest[]>(ticketsCacheKey) ?? []
    );
    const [loading, setLoading] = useState(() => !hasViewCache(ticketsCacheKey));
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [lightboxState, setLightboxState] = useState<{ images: string[]; index: number } | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [pendingResolveTicket, setPendingResolveTicket] = useState<MaintenanceRequest | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        const tid =
            searchParams?.get('id') ||
            searchParams?.get('ticketId') ||
            searchParams?.get('search');
        if (tid) {
            setSearchQuery(tid);
            setExpandedId(tid);
        }
    }, [searchParams]);

    // Reset pagination when filters, search, or property context change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, selectedPropertyId]);

    // Close or navigate photo lightbox via keyboard
    useEffect(() => {
        if (!lightboxState) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setLightboxState(null);
            } else if (e.key === 'ArrowRight' && lightboxState.images.length > 1) {
                setLightboxState((prev) =>
                    prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null
                );
            } else if (e.key === 'ArrowLeft' && lightboxState.images.length > 1) {
                setLightboxState((prev) =>
                    prev
                        ? {
                              ...prev,
                              index: (prev.index - 1 + prev.images.length) % prev.images.length,
                          }
                        : null
                );
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [lightboxState]);

    const fetchTickets = async () => {
        const requestId = ++fetchRequestRef.current;
        const cacheKey = ticketsCacheKey;
        setError(null);
        try {
            const queryParam =
                selectedPropertyId && selectedPropertyId !== 'all'
                    ? `?propertyId=${selectedPropertyId}`
                    : '';
            const data = await fetchJsonDeduped(`/api/landlord/maintenance${queryParam}`);
            if (requestId !== fetchRequestRef.current) return;
            const list = Array.isArray(data.requests) ? data.requests : [];
            setTickets(list);
            writeViewCache(cacheKey, list);
        } catch (err: any) {
            if (requestId !== fetchRequestRef.current) return;
            console.error('[MobileTickets] Failed to fetch maintenance:', err);
            if (!hasViewCache(cacheKey)) {
                setError(err?.message || t('Unable to load repair requests right now.'));
            }
        } finally {
            if (requestId === fetchRequestRef.current) setLoading(false);
        }
    };

    useEffect(() => {
        const snapshot = readViewCache<MaintenanceRequest[]>(ticketsCacheKey);
        if (snapshot) {
            setTickets(snapshot);
            setLoading(false);
            setError(null);
        } else {
            setLoading(true);
        }
        fetchTickets();
    }, [selectedPropertyId]);

    const handleUpdateStatus = async (
        ticketId: string,
        nextStatus: 'in_progress' | 'resolved'
    ) => {
        triggerHaptic('light');
        setUpdatingId(ticketId);
        setToast(null);
        try {
            const res = await fetch('/api/landlord/maintenance', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId: ticketId,
                    id: ticketId,
                    status: nextStatus,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || t('Failed to update ticket status.'));
            }

            triggerHaptic('success');
            setToast({
                type: 'success',
                message:
                    nextStatus === 'resolved'
                        ? t('Repair request marked as resolved.')
                        : t('Repair work started.'),
            });
            setPendingResolveTicket(null);
            await fetchTickets();
        } catch (err: any) {
            triggerHaptic('error');
            setToast({
                type: 'error',
                message: err?.message || t('Update failed. Please try again.'),
            });
            setPendingResolveTicket(null);
        } finally {
            setUpdatingId(null);
        }
    };

    const counts = useMemo(() => {
        let open = 0;
        let inProgress = 0;
        let resolved = 0;
        for (const item of tickets) {
            const st = normalizeStatus(item.status);
            if (st === 'pending') open += 1;
            else if (st === 'in_progress') inProgress += 1;
            else if (st === 'resolved') resolved += 1;
        }
        return {
            all: tickets.length,
            open,
            in_progress: inProgress,
            resolved,
        };
    }, [tickets]);

    const filteredTickets = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        const list = tickets.filter((item) => {
            const tenantName = (resolveTenantName(item.tenant) || '').toLowerCase();
            const unitName = (resolveUnitName(item.unit) || '').toLowerCase();
            const title = (item.title || '').toLowerCase();
            const desc = (item.description || '').toLowerCase();
            const category = (item.category || '').toLowerCase();
            const priority = (item.priority || '').toLowerCase();

            if (q) {
                const matchesSearch =
                    (item.id || '').toLowerCase().includes(q) ||
                    title.includes(q) ||
                    desc.includes(q) ||
                    tenantName.includes(q) ||
                    unitName.includes(q) ||
                    category.includes(q) ||
                    priority.includes(q);
                if (!matchesSearch) return false;
            }

            const currentStatus = normalizeStatus(item.status);
            if (statusFilter === 'open') return currentStatus === 'pending';
            if (statusFilter === 'in_progress') return currentStatus === 'in_progress';
            if (statusFilter === 'resolved') return currentStatus === 'resolved';
            return true;
        });

        // Keep active tickets above resolved tickets while preserving newest order
        return list.sort((a, b) => {
            const isResolvedA = normalizeStatus(a.status) === 'resolved' ? 1 : 0;
            const isResolvedB = normalizeStatus(b.status) === 'resolved' ? 1 : 0;
            if (isResolvedA !== isResolvedB) {
                return isResolvedA - isResolvedB;
            }
            if (a.created_at && b.created_at) {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            return 0;
        });
    }, [tickets, searchQuery, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredTickets.length / TICKETS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * TICKETS_PER_PAGE;
    const paginatedTickets = useMemo(
        () => filteredTickets.slice(startIndex, startIndex + TICKETS_PER_PAGE),
        [filteredTickets, startIndex]
    );

    const hasActiveFilter = statusFilter !== 'all' || searchQuery.trim().length > 0;

    const handleResetFilters = () => {
        triggerHaptic('light');
        setSearchQuery('');
        setStatusFilter('all');
        setCurrentPage(1);
    };

    const filterTabs: Array<{ id: TicketStatusFilter; label: string; count: number }> = [
        { id: 'all', label: t('All'), count: counts.all },
        { id: 'open', label: t('Open'), count: counts.open },
        { id: 'in_progress', label: t('In Progress'), count: counts.in_progress },
        { id: 'resolved', label: t('Resolved'), count: counts.resolved },
    ];

    return (
        <PullToRefresh onRefresh={fetchTickets}>
            <div className="flex flex-col gap-3 pb-6">
                {/* Property Context Switcher */}
                <div className="px-4 pt-2.5">
                    <MobilePropertySelector />
                </div>

                {/* Solid Sticky Search & Single-Row Symmetrical Segmented Filter Bar */}
                <div className="sticky top-[calc(var(--mobile-header-height,56px)+env(safe-area-inset-top,0px))] z-20 bg-background px-4 pb-3 pt-1 flex flex-col gap-2.5 border-b border-border/70">
                    {/* Accessible Search Input */}
                    <div className="relative">
                        <Search
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                            aria-hidden="true"
                        />
                        <input
                            type="text"
                            maxLength={60}
                            placeholder={t('Search by room, tenant, or repair issue...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label={t('Search repair requests')}
                            className="min-h-[44px] w-full rounded-xl border border-border/80 bg-card text-sm font-medium pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-1 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer"
                                aria-label={t('Clear search')}
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    {/* Inline Status Notification */}
                    {toast && (
                        <div
                            role="status"
                            className={cn(
                                'px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-150',
                                toast.type === 'success'
                                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-red-500/10 border-red-500/25 text-red-700 dark:text-red-400'
                            )}
                        >
                            <span>{toast.message}</span>
                            <button
                                type="button"
                                onClick={() => setToast(null)}
                                aria-label={t('Dismiss message')}
                                className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                            >
                                <X className="size-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Symmetrical 4-Column Segmented Control — zero dangling pills */}
                    <div
                        className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-muted/60 border border-border/60"
                        role="tablist"
                        aria-label={t('Filter repair status')}
                    >
                        {filterTabs.map((tab) => {
                            const isActive = statusFilter === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => {
                                        triggerHaptic('light');
                                        setStatusFilter(tab.id);
                                    }}
                                    className={cn(
                                        'flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 min-h-[48px] rounded-lg transition-all active:scale-[0.98] cursor-pointer',
                                        isActive
                                            ? 'bg-card text-foreground border border-border/80'
                                            : 'text-muted-foreground hover:text-foreground border border-transparent'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'text-xs font-black tabular-nums leading-none',
                                            isActive ? 'text-primary' : 'text-foreground/80'
                                        )}
                                    >
                                        {tab.count}
                                    </span>
                                    <span className="text-[11px] font-semibold leading-tight text-center truncate max-w-full">
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main List Container */}
                <div className="px-4 flex flex-col gap-3">
                    {loading ? (
                        /* Skeleton Cards matching the 2-zone card geometry */
                        <div className="flex flex-col gap-3" aria-label={t('Loading repair requests')}>
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="rounded-2xl border border-border/75 bg-card p-4 animate-pulse flex flex-col gap-3"
                                >
                                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/50">
                                        <div className="h-5 w-24 rounded-md bg-muted/70" />
                                        <div className="h-5 w-28 rounded-full bg-muted/60" />
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-5/6 rounded bg-muted/70" />
                                            <div className="h-3 w-full rounded bg-muted/50" />
                                        </div>
                                        <div className="size-20 rounded-xl bg-muted/60 shrink-0" />
                                    </div>
                                    <div className="h-11 w-full rounded-xl bg-muted/50" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        /* Error / Retry State */
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center flex flex-col items-center gap-3">
                            <AlertTriangle className="size-7 text-red-500" />
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-foreground">{t('Could not load requests')}</h3>
                                <p className="text-xs text-muted-foreground">{error}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setLoading(true);
                                    fetchTickets();
                                }}
                                className="min-h-[44px] px-5 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition-all cursor-pointer"
                            >
                                {t('Try Again')}
                            </button>
                        </div>
                    ) : tickets.length === 0 ? (
                        /* Zero-Data Empty State */
                        <div className="rounded-2xl border border-border/75 bg-card p-7 text-center flex flex-col items-center gap-2.5">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-6" />
                            </div>
                            <h3 className="text-base font-bold text-foreground">{t('No repair requests')}</h3>
                            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                                {t('All rooms are in good shape. Tenant repair requests will show up here when submitted.')}
                            </p>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        /* Zero-Results Search/Filter Empty State */
                        <div className="rounded-2xl border border-border/75 bg-card p-6 text-center flex flex-col items-center gap-3">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                <Wrench className="size-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-foreground">
                                    {searchQuery.trim()
                                        ? t('No requests match "{query}"', { query: searchQuery.trim() })
                                        : t('No requests in this view')}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {statusFilter === 'open'
                                        ? t('All open repair requests are resolved or already in progress.')
                                        : t('Try clearing your search or choosing another status filter.')}
                                </p>
                            </div>
                            {hasActiveFilter && (
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition-all cursor-pointer"
                                >
                                    <RotateCcw className="size-3.5" />
                                    <span>{t('Clear All Filters')}</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {paginatedTickets.map((ticket) => {
                                const isExpanded = expandedId === ticket.id;
                                const images = ticket.images ?? [];
                                const hasImages = images.length > 0;
                                const priorityLabel = toPriorityLabel(ticket.priority);
                                const normStatus = normalizeStatus(ticket.status);
                                const unitName = resolveUnitName(ticket.unit);
                                const tenantName = resolveTenantName(ticket.tenant);
                                const reportedLabel = formatReportedLabel(
                                    ticket.reportedAt,
                                    ticket.created_at,
                                    locale,
                                    t('Recently')
                                );
                                const triageNote = ticket.ai_triage_notes || ticket.triageReason;

                                const formattedUnit = unitName
                                    ? /^(room|unit)\b/i.test(unitName)
                                        ? unitName
                                        : t('Unit {unit}', { unit: unitName })
                                    : t('Property Issue');

                                return (
                                    <article
                                        key={ticket.id}
                                        className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col gap-3"
                                    >
                                        {/* Band 1: Room Anchor & Time (Left) + Status & Priority Pills (Right) */}
                                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/50">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-foreground text-xs font-bold whitespace-nowrap shrink-0">
                                                    {formattedUnit}
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground min-w-0 truncate">
                                                    <Clock className="size-3 shrink-0" aria-hidden="true" />
                                                    <span className="truncate">{reportedLabel}</span>
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap',
                                                        normStatus === 'resolved' &&
                                                            'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                                                        normStatus === 'in_progress' &&
                                                            'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
                                                        normStatus === 'pending' &&
                                                            'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                                    )}
                                                >
                                                    {normStatus === 'in_progress'
                                                        ? t('In Progress')
                                                        : normStatus === 'resolved'
                                                        ? t('Resolved')
                                                        : t('Pending')}
                                                </span>

                                                <span
                                                    className={cn(
                                                        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap',
                                                        MAINTENANCE_PRIORITY_SOFT_CLASSES[priorityLabel]
                                                    )}
                                                >
                                                    {t(MAINTENANCE_PRIORITY_BADGE_TEXT[priorityLabel])}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Band 2: Editorial Content + Side-Anchored Photo Thumbnail */}
                                        <div className="flex items-start gap-3.5">
                                            <div className="min-w-0 flex-1 flex flex-col gap-1">
                                                <h3 className="text-[15px] font-bold text-foreground leading-snug line-clamp-2">
                                                    {ticket.title}
                                                </h3>
                                                {!isExpanded && (
                                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                        {ticket.description}
                                                    </p>
                                                )}
                                            </div>

                                            {!isExpanded && hasImages && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        triggerHaptic('light');
                                                        setLightboxState({ images, index: 0 });
                                                    }}
                                                    className="relative size-[84px] rounded-xl overflow-hidden border border-border/80 bg-muted shrink-0 active:scale-95 transition-transform cursor-pointer group"
                                                    aria-label={t('Inspect issue photo {num}', { num: 1 })}
                                                >
                                                    <Image
                                                        src={images[0]}
                                                        alt={t('Issue photo {num}', { num: 1 })}
                                                        fill
                                                        sizes="84px"
                                                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                                                    />
                                                    {images.length > 1 && (
                                                        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-bold tabular-nums leading-none">
                                                            +{images.length - 1}
                                                        </span>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {/* Expanded Details Drawer (Replaces collapsed summary + single thumbnail smoothly) */}
                                        {isExpanded && (
                                            <div className="rounded-xl bg-muted/40 border border-border/60 p-3.5 flex flex-col gap-2.5 animate-in fade-in duration-150">
                                                <div className="grid grid-cols-2 gap-2.5 text-xs">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[11px] font-semibold text-muted-foreground">
                                                            {t('Room & Property')}
                                                        </span>
                                                        <span className="font-bold text-foreground truncate">
                                                            {formattedUnit}
                                                            {ticket.property ? ` • ${ticket.property}` : ''}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[11px] font-semibold text-muted-foreground">
                                                            {t('Category')}
                                                        </span>
                                                        <span className="font-bold text-foreground capitalize truncate">
                                                            {ticket.category
                                                                ? ticket.category.replace(/\|/g, ', ')
                                                                : t('General Repair')}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="pt-2 border-t border-border/50 flex flex-col gap-1">
                                                    <span className="text-[11px] font-semibold text-muted-foreground">
                                                        {t('Full Issue Details')}
                                                    </span>
                                                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                                                        {ticket.description || t('No additional description provided.')}
                                                    </p>
                                                </div>

                                                {hasImages && (
                                                    <div className="flex items-center gap-2 overflow-x-auto pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                                        {images.map((imgUrl, i) => (
                                                            <button
                                                                key={i}
                                                                type="button"
                                                                onClick={() => {
                                                                    triggerHaptic('light');
                                                                    setLightboxState({ images, index: i });
                                                                }}
                                                                className="relative size-16 rounded-xl overflow-hidden border border-border/80 bg-muted shrink-0 active:scale-95 transition-transform cursor-pointer"
                                                                aria-label={t('Inspect issue photo {num}', { num: i + 1 })}
                                                            >
                                                                <Image
                                                                    src={imgUrl}
                                                                    alt={t('Issue photo {num}', { num: i + 1 })}
                                                                    fill
                                                                    sizes="64px"
                                                                    className="object-cover"
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {triageNote && (
                                                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground flex items-start gap-2">
                                                        <Info className="size-4 text-primary shrink-0 mt-0.5" />
                                                        <div>
                                                            <span className="text-[11px] font-bold text-primary block">
                                                                {t('Priority Note')}
                                                            </span>
                                                            <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                                                                {triageNote}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Band 3: Full Un-truncated Resident Attribution + Expand Trigger */}
                                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/90 min-w-0">
                                                <User className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                                                <span className="truncate">{tenantName || t('Resident')}</span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    triggerHaptic('light');
                                                    setExpandedId(isExpanded ? null : ticket.id);
                                                }}
                                                className="inline-flex items-center gap-1 min-h-[36px] px-2.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer shrink-0"
                                            >
                                                <span>{isExpanded ? t('Hide Details') : t('View Details')}</span>
                                                {isExpanded ? (
                                                    <ChevronUp className="size-4" />
                                                ) : (
                                                    <ChevronDown className="size-4" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Preserved Action Buttons */}
                                        {normStatus !== 'resolved' && (
                                            <div
                                                className={cn(
                                                    'grid gap-2',
                                                    normStatus === 'pending' ? 'grid-cols-2' : 'grid-cols-1'
                                                )}
                                            >
                                                {normStatus === 'pending' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                                                        disabled={updatingId === ticket.id}
                                                        className="min-h-[44px] px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                                                    >
                                                        <Wrench className="size-4 shrink-0" />
                                                        <span>{t('Start Work')}</span>
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => setPendingResolveTicket(ticket)}
                                                    disabled={updatingId === ticket.id}
                                                    className="min-h-[44px] px-3 rounded-xl bg-primary hover:brightness-105 text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                                                >
                                                    <CheckCircle2 className="size-4 shrink-0" />
                                                    <span>{t('Mark Resolved')}</span>
                                                </button>
                                            </div>
                                        )}
                                    </article>
                                );
                            })}

                            {/* Explicit Pagination Bar */}
                            {totalPages > 1 && (
                                <div className="flex flex-col xs:flex-row items-center justify-between gap-2.5 pt-2 border-t border-border/50">
                                    <p className="text-xs font-medium text-muted-foreground tabular-nums">
                                        {t('Showing {start}–{end} of {total}', {
                                            start: startIndex + 1,
                                            end: Math.min(startIndex + TICKETS_PER_PAGE, filteredTickets.length),
                                            total: filteredTickets.length,
                                        })}
                                    </p>

                                    <div className="flex items-center gap-2 w-full xs:w-auto justify-between xs:justify-end">
                                        <button
                                            type="button"
                                            disabled={safePage <= 1}
                                            onClick={() => {
                                                triggerHaptic('light');
                                                setCurrentPage((p) => Math.max(1, p - 1));
                                            }}
                                            aria-label={t('Previous page')}
                                            className="inline-flex items-center justify-center gap-1 min-h-[44px] px-3.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                                        >
                                            <ChevronLeft className="size-4 shrink-0" />
                                            <span>{t('Prev')}</span>
                                        </button>

                                        <span className="text-xs font-bold text-foreground tabular-nums px-1.5 whitespace-nowrap">
                                            {t('Page {page} of {total}', { page: safePage, total: totalPages })}
                                        </span>

                                        <button
                                            type="button"
                                            disabled={safePage >= totalPages}
                                            onClick={() => {
                                                triggerHaptic('light');
                                                setCurrentPage((p) => Math.min(totalPages, p + 1));
                                            }}
                                            aria-label={t('Next page')}
                                            className="inline-flex items-center justify-center gap-1 min-h-[44px] px-3.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                                        >
                                            <span>{t('Next')}</span>
                                            <ChevronRight className="size-4 shrink-0" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Solid Photo Lightbox with Multi-Photo Navigation */}
                {lightboxState &&
                    typeof document !== 'undefined' &&
                    createPortal(
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-label={t('Issue photo viewer')}
                            onClick={() => setLightboxState(null)}
                            className="fixed inset-0 z-50 bg-black/92 flex flex-col p-4 animate-in fade-in duration-150"
                        >
                            <div className="flex items-center justify-between gap-2">
                                {lightboxState.images.length > 1 ? (
                                    <span className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold tabular-nums">
                                        {lightboxState.index + 1} / {lightboxState.images.length}
                                    </span>
                                ) : (
                                    <span />
                                )}

                                <button
                                    type="button"
                                    onClick={() => setLightboxState(null)}
                                    className="flex size-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 cursor-pointer"
                                    aria-label={t('Close photo')}
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 relative my-3 flex items-center justify-center overflow-hidden rounded-xl"
                            >
                                <Image
                                    src={lightboxState.images[lightboxState.index]}
                                    alt={t('Enlarged issue')}
                                    fill
                                    sizes="100vw"
                                    className="object-contain"
                                />
                            </div>

                            {lightboxState.images.length > 1 && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center justify-center gap-3 pt-1"
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setLightboxState((prev) =>
                                                prev
                                                    ? {
                                                          ...prev,
                                                          index:
                                                              (prev.index - 1 + prev.images.length) %
                                                              prev.images.length,
                                                      }
                                                    : null
                                            )
                                        }
                                        className="min-h-[44px] px-4 rounded-xl bg-white/15 text-white text-xs font-bold inline-flex items-center gap-1 hover:bg-white/25 cursor-pointer"
                                    >
                                        <ChevronLeft className="size-4" />
                                        <span>{t('Prev')}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setLightboxState((prev) =>
                                                prev
                                                    ? { ...prev, index: (prev.index + 1) % prev.images.length }
                                                    : null
                                            )
                                        }
                                        className="min-h-[44px] px-4 rounded-xl bg-white/15 text-white text-xs font-bold inline-flex items-center gap-1 hover:bg-white/25 cursor-pointer"
                                    >
                                        <span>{t('Next')}</span>
                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>
                            )}
                        </div>,
                        document.body
                    )}

                {/* Resolve Ticket Confirmation Modal */}
                {pendingResolveTicket && (
                    <MobileConfirmModal
                        isOpen={Boolean(pendingResolveTicket)}
                        title={t('Resolve Maintenance Request?')}
                        description={
                            <span>
                                {fillRich(
                                    t(
                                        'Are you sure you want to mark {title} for {tenant} ({unit}) as resolved?'
                                    ),
                                    {
                                        title: (
                                            <strong className="text-foreground font-bold">
                                                &quot;{pendingResolveTicket.title}&quot;
                                            </strong>
                                        ),
                                        tenant: (
                                            <strong className="text-foreground font-bold">
                                                {resolveTenantName(pendingResolveTicket.tenant) ||
                                                    t('Resident')}
                                            </strong>
                                        ),
                                        unit: resolveUnitName(pendingResolveTicket.unit) || t('Unit'),
                                    }
                                )}
                            </span>
                        }
                        confirmLabel={t('Mark Resolved')}
                        cancelLabel={t('Cancel')}
                        variant="success"
                        isLoading={updatingId === pendingResolveTicket.id}
                        icon={<CheckCircle2 className="size-5" />}
                        onConfirm={() =>
                            handleUpdateStatus(pendingResolveTicket.id, 'resolved')
                        }
                        onCancel={() => !updatingId && setPendingResolveTicket(null)}
                    />
                )}
            </div>
        </PullToRefresh>
    );
}
