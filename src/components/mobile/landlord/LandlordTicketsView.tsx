'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useProperty } from '@/context/PropertyContext';
import Image from 'next/image';
import { 
    Ticket, 
    Search, 
    Clock, 
    AlertTriangle, 
    CheckCircle2, 
    X, 
    ChevronDown, 
    ChevronUp,
    Wrench,
    Sparkles,
    Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';

interface MaintenanceRequest {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category?: string;
    unit_id?: string;
    unit?: { id: string; name: string };
    tenant?: { id: string; full_name?: string; email?: string };
    images?: string[];
    created_at: string;
    ai_triage_notes?: string;
}

function normalizeStatus(status?: string | null): 'pending' | 'in_progress' | 'resolved' | 'other' {
    if (!status) return 'other';
    const s = status.toLowerCase().replace(/[\s_-]+/g, '');
    if (s === 'open' || s === 'pending') return 'pending';
    if (s === 'inprogress' || s === 'assigned') return 'in_progress';
    if (s === 'resolved' || s === 'closed') return 'resolved';
    return 'other';
}

export function LandlordTicketsView() {
    const { selectedPropertyId } = useProperty();
    const [tickets, setTickets] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchTickets = async () => {
        try {
            const queryParam = selectedPropertyId && selectedPropertyId !== 'all' 
                ? `?propertyId=${selectedPropertyId}` 
                : '';
            const res = await fetch(`/api/landlord/maintenance${queryParam}`);
            if (res.ok) {
                const data = await res.json();
                setTickets(Array.isArray(data.requests) ? data.requests : []);
            }
        } catch (err) {
            console.error('[MobileTickets] Failed to fetch maintenance:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchTickets();
    }, [selectedPropertyId]);

    const handleUpdateStatus = async (ticketId: string, nextStatus: 'in_progress' | 'resolved') => {
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
                throw new Error(errData.error || 'Failed to update ticket status.');
            }

            setToast({
                type: 'success',
                message: nextStatus === 'resolved' ? 'Ticket marked as resolved!' : 'Ticket marked in progress.',
            });
            fetchTickets();
        } catch (err: any) {
            setToast({
                type: 'error',
                message: err?.message || 'Update failed.',
            });
        } finally {
            setUpdatingId(null);
        }
    };

    const openTicketsCount = useMemo(() => {
        return tickets.filter(t => normalizeStatus(t.status) === 'pending').length;
    }, [tickets]);

    const inProgressTicketsCount = useMemo(() => {
        return tickets.filter(t => normalizeStatus(t.status) === 'in_progress').length;
    }, [tickets]);

    const filteredTickets = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        const list = tickets.filter((t) => {
            const tenantName = (t.tenant?.full_name || '').toLowerCase();
            const unitName = (t.unit?.name || '').toLowerCase();
            const title = (t.title || '').toLowerCase();
            const desc = (t.description || '').toLowerCase();
            const category = (t.category || '').toLowerCase();
            const priority = (t.priority || '').toLowerCase();

            if (q) {
                const matchesSearch = 
                    title.includes(q) ||
                    desc.includes(q) ||
                    tenantName.includes(q) ||
                    unitName.includes(q) ||
                    category.includes(q) ||
                    priority.includes(q);
                if (!matchesSearch) return false;
            }

            const currentStatus = normalizeStatus(t.status);

            if (statusFilter === 'open') {
                return currentStatus === 'pending';
            }
            if (statusFilter === 'in_progress') {
                return currentStatus === 'in_progress';
            }
            if (statusFilter === 'resolved') {
                return currentStatus === 'resolved';
            }
            return true; // 'all'
        });

        // Put resolved tickets last; active (pending / in_progress) tickets first
        return list.sort((a, b) => {
            const statusA = normalizeStatus(a.status);
            const statusB = normalizeStatus(b.status);
            const isResolvedA = statusA === 'resolved' ? 1 : 0;
            const isResolvedB = statusB === 'resolved' ? 1 : 0;

            if (isResolvedA !== isResolvedB) {
                return isResolvedA - isResolvedB; // 0 (unresolved) comes before 1 (resolved)
            }

            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
        });
    }, [tickets, searchQuery, statusFilter]);

    return (
        <PullToRefresh onRefresh={fetchTickets}>
            <div className="flex flex-col gap-3 pb-3">
                {/* Sticky Search & Category Tabs Bar */}
                <div className="sticky top-[56px] z-30 bg-background/95 backdrop-blur-md pb-2.5 pt-1 flex flex-col gap-2.5 border-b border-slate-200/80 dark:border-white/10 -mt-1 shadow-xs">
                    {/* Search Bar */}
                    <div className="px-4 flex items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search maintenance, units…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 rounded-xl pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                    aria-label="Clear search"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notification Banner */}
                    {toast && (
                        <div className={cn(
                            "mx-4 p-3 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in duration-200",
                            toast.type === 'success' 
                                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400" 
                                : "bg-red-500/15 border border-red-500/30 text-red-400"
                        )}>
                            <span>{toast.message}</span>
                            <button onClick={() => setToast(null)} className="p-1">
                                <X className="size-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Status Filter Tabs */}
                    <div className="px-4 flex gap-1.5 overflow-x-auto scrollbar-none">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                                statusFilter === 'all'
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-slate-100/90 dark:bg-card/70 border border-slate-300/80 dark:border-white/15 text-muted-foreground"
                            )}
                        >
                            All
                        </button>

                        <button
                            onClick={() => setStatusFilter('open')}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5",
                                statusFilter === 'open'
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-slate-100/90 dark:bg-card/70 border border-slate-300/80 dark:border-white/15 text-muted-foreground"
                            )}
                        >
                            <span>Open</span>
                            {openTicketsCount > 0 && (
                                <span className={cn(
                                    "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                                    statusFilter === 'open' ? "bg-white text-primary" : "bg-primary/20 text-primary"
                                )}>
                                    {openTicketsCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setStatusFilter('in_progress')}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5",
                                statusFilter === 'in_progress'
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-slate-100/90 dark:bg-card/70 border border-slate-300/80 dark:border-white/15 text-muted-foreground"
                            )}
                        >
                            <span>In Progress</span>
                            {inProgressTicketsCount > 0 && (
                                <span className={cn(
                                    "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                                    statusFilter === 'in_progress' ? "bg-white text-primary" : "bg-primary/20 text-primary"
                                )}>
                                    {inProgressTicketsCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setStatusFilter('resolved')}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                                statusFilter === 'resolved'
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-slate-100/90 dark:bg-card/70 border border-slate-300/80 dark:border-white/15 text-muted-foreground"
                            )}
                        >
                            Resolved
                        </button>
                    </div>
                </div>

            {/* Tickets List */}
            <div className="px-4 flex flex-col gap-2.5">
                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
                        <span className="text-xs text-muted-foreground">Loading maintenance tickets…</span>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-card/50 p-6 text-center flex flex-col items-center justify-center shadow-xs">
                        <Wrench className="size-8 text-muted-foreground/50 mb-2" />
                        <h4 className="text-xs font-bold text-foreground">No tickets found</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            {statusFilter === 'open' ? 'All maintenance requests are resolved or in progress.' : 'No maintenance requests match filter.'}
                        </p>
                    </div>
                ) : (
                    filteredTickets.map((ticket) => {
                        const isExpanded = expandedId === ticket.id;
                        const hasImages = Boolean(ticket.images && ticket.images.length > 0);
                        const priority = ticket.priority?.toLowerCase() || 'medium';
                        const isUrgent = priority === 'urgent' || priority === 'high';
                        const normStatus = normalizeStatus(ticket.status);

                        return (
                            <div
                                key={ticket.id}
                                className="rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-card/80 p-3.5 shadow-xs flex flex-col gap-2.5 transition-all"
                            >
                                {/* Header: Priority Badge & Date */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                            priority === 'urgent' && "bg-red-500/15 text-red-400 border border-red-500/30",
                                            priority === 'high' && "bg-amber-500/15 text-amber-400 border border-amber-500/30",
                                            priority === 'medium' && "bg-blue-500/15 text-blue-400 border border-blue-500/30",
                                            priority === 'low' && "bg-muted text-muted-foreground"
                                        )}>
                                            {priority} Priority
                                        </span>

                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[9px] font-bold",
                                            normStatus === 'resolved' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                                            normStatus === 'in_progress' && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                                            normStatus === 'pending' && "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                        )}>
                                            {normStatus === 'in_progress' ? 'In Progress' : normStatus === 'resolved' ? 'Resolved' : 'Pending'}
                                        </span>
                                    </div>

                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                                    </span>
                                </div>

                                {/* Title & Unit Info */}
                                <div>
                                    <h4 className="text-xs font-bold text-foreground leading-snug">{ticket.title}</h4>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        {ticket.unit?.name ? `Unit ${ticket.unit.name}` : 'Unit N/A'}
                                        {ticket.tenant?.full_name ? ` • ${ticket.tenant.full_name}` : ''}
                                    </p>
                                </div>

                                {/* Collapsible Description */}
                                <p className={cn(
                                    "text-xs text-muted-foreground/90 leading-relaxed",
                                    !isExpanded && "line-clamp-2"
                                )}>
                                    {ticket.description}
                                </p>

                                {/* AI Triage Note (if present) */}
                                {ticket.ai_triage_notes && isExpanded && (
                                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-primary flex items-start gap-2">
                                        <Sparkles className="size-3.5 shrink-0 mt-0.5" />
                                        <p className="leading-snug">{ticket.ai_triage_notes}</p>
                                    </div>
                                )}

                                {/* Photo thumbnails */}
                                {hasImages && ticket.images && (
                                    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                                        {ticket.images.map((imgUrl, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setLightboxImage(imgUrl)}
                                                className="relative size-14 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-black/40 shrink-0 hover:opacity-80 active:scale-95 transition-all"
                                                aria-label="Inspect issue photo"
                                            >
                                                <Image src={imgUrl} alt="Issue photo" fill sizes="56px" className="object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Bottom Expand & Action Bar */}
                                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5 gap-2">
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                                        className="text-[10px] font-bold text-primary flex items-center gap-0.5"
                                    >
                                        <span>{isExpanded ? 'Less' : 'Details'}</span>
                                        {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                                    </button>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5">
                                        {normStatus === 'pending' && (
                                            <button
                                                onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                                                disabled={updatingId === ticket.id}
                                                className="px-2.5 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/25 text-blue-400 text-[10px] font-black uppercase tracking-tight flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                <Wrench className="size-3" />
                                                <span>Start Work</span>
                                            </button>
                                        )}

                                        {normStatus !== 'resolved' && (
                                            <button
                                                onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                                                disabled={updatingId === ticket.id}
                                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase tracking-tight flex items-center gap-1 shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                <CheckCircle2 className="size-3" />
                                                <span>Resolve</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Photo Lightbox */}
            {lightboxImage && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col p-4 animate-in fade-in duration-200">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setLightboxImage(null)}
                            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                            aria-label="Close photo"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                    <div className="flex-1 relative my-3 flex items-center justify-center overflow-hidden rounded-xl">
                        <Image src={lightboxImage} alt="Enlarged issue" fill sizes="100vw" className="object-contain" />
                    </div>
                </div>,
                document.body
            )}
            </div>
        </PullToRefresh>
    );
}
