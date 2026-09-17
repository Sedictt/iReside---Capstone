'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { MobileConfirmModal } from '@/components/mobile/shared/MobileConfirmModal';
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector';

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
    const searchParams = useSearchParams();
    const [tickets, setTickets] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [pendingResolveTicket, setPendingResolveTicket] = useState<MaintenanceRequest | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        const tid = searchParams?.get('id') || searchParams?.get('ticketId') || searchParams?.get('search');
        if (tid) {
            setSearchQuery(tid);
            setExpandedId(tid);
        }
    }, [searchParams]);

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
            setPendingResolveTicket(null);
            fetchTickets();
        } catch (err: any) {
            setToast({
                type: 'error',
                message: err?.message || 'Update failed.',
            });
            setPendingResolveTicket(null);
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
                    (t.id || '').toLowerCase().includes(q) ||
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
                {/* Property Selector */}
                <div className="px-4 pt-2.5">
                    <MobilePropertySelector />
                </div>

                {/* Sticky Search & Category Tabs Bar (Matching Payments Page Design) */}
                <div className="sticky top-[calc(var(--mobile-header-height,56px)+env(safe-area-inset-top,0px))] z-30 bg-background/95 backdrop-blur-md pb-2.5 pt-1 flex flex-col gap-2.5 border-b border-slate-200/80 dark:border-white/10 shadow-xs">
                    {/* Search Bar with Neumorphic Inset */}
                    <div className="px-4 flex items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="SEARCH MAINTENANCE, UNITS, ISSUES…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-11 w-full rounded-2xl border-none text-[11px] font-black uppercase tracking-wider pl-11 pr-8 focus:outline-none neumorphic-inset placeholder:text-muted-foreground/40 text-foreground"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/50 hover:text-foreground"
                                    aria-label="Clear search"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notification Banner */}
                    {toast && (
                        <div className="px-4">
                            <div className={cn(
                                "p-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-between neumorphic-inset animate-in fade-in duration-200",
                                toast.type === 'success' 
                                    ? "text-emerald-500" 
                                    : "text-red-500"
                            )}>
                                <span>{toast.message}</span>
                                <button onClick={() => setToast(null)} className="p-1 text-muted-foreground hover:text-foreground">
                                    <X className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Status Filter Tabs (Neumorphic Buttons matching Payments tabs) */}
                    <div className="px-4 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
                        {(['all', 'open', 'in_progress', 'resolved'] as const).map((tab) => {
                            const isActive = statusFilter === tab;
                            const label = tab === 'all' ? 'All' : tab === 'open' ? 'Open' : tab === 'in_progress' ? 'In Progress' : 'Resolved';
                            const count = tab === 'open' ? openTicketsCount : tab === 'in_progress' ? inProgressTicketsCount : 0;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setStatusFilter(tab)}
                                    className={cn(
                                        "shrink-0 flex-1 min-w-fit py-2 px-2 sm:px-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer",
                                        isActive
                                            ? "neumorphic-primary text-white shadow-xs"
                                            : "neumorphic-extruded text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <span>{label}</span>
                                    {count > 0 && (
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none flex items-center justify-center",
                                            isActive ? "bg-white text-primary" : "bg-primary/15 text-primary"
                                        )}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

            {/* Tickets List (Desktop Neumorphic Extruded Cards) */}
            <div className="px-4 flex flex-col gap-3">
                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
                        <span className="text-xs text-muted-foreground font-medium">Loading maintenance tickets…</span>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="rounded-[2rem] neumorphic-panel p-8 text-center flex flex-col items-center justify-center shadow-sm my-2">
                        <div className="neumorphic-inset-card flex size-12 items-center justify-center rounded-2xl text-muted-foreground/50 mb-3">
                            <Wrench className="size-6" />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-foreground">No tickets found</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            {statusFilter === 'open' ? 'All maintenance requests are resolved or in progress.' : 'No maintenance requests match the selected filter.'}
                        </p>
                    </div>
                ) : (
                    filteredTickets.map((ticket) => {
                        const isExpanded = expandedId === ticket.id;
                        const hasImages = Boolean(ticket.images && ticket.images.length > 0);
                        const priority = ticket.priority?.toLowerCase() || 'medium';
                        const normStatus = normalizeStatus(ticket.status);

                        return (
                            <div
                                key={ticket.id}
                                className="neumorphic-extruded rounded-[1.75rem] p-4 flex flex-col gap-3 transition-all hover:scale-[1.01]"
                            >
                                {/* Header: Title, Unit, Priority & Status */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-black text-foreground tracking-tight truncate">
                                            {ticket.title}
                                        </h4>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80 mt-0.5 block">
                                            {ticket.unit?.name ? (ticket.unit.name.toLowerCase().startsWith('unit') ? ticket.unit.name : `Unit ${ticket.unit.name}`) : 'Unit N/A'}
                                            {ticket.tenant?.full_name ? ` • ${ticket.tenant.full_name}` : ''}
                                        </span>
                                    </div>

                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span className={cn(
                                            "inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                            normStatus === 'resolved' && "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
                                            normStatus === 'in_progress' && "border-blue-500/30 bg-blue-500/10 text-blue-500",
                                            normStatus === 'pending' && "border-amber-500/30 bg-amber-500/10 text-amber-500"
                                        )}>
                                            {normStatus === 'in_progress' ? 'In Progress' : normStatus === 'resolved' ? 'Resolved' : 'Pending'}
                                        </span>

                                        <span className={cn(
                                            "inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                            priority === 'urgent' && "border-red-500/30 bg-red-500/10 text-red-500",
                                            priority === 'high' && "border-amber-500/30 bg-amber-500/10 text-amber-500",
                                            priority === 'medium' && "border-blue-500/30 bg-blue-500/10 text-blue-500",
                                            priority === 'low' && "border-border bg-muted/30 text-muted-foreground"
                                        )}>
                                            {priority} Priority
                                        </span>
                                    </div>
                                </div>

                                {/* Collapsible Description */}
                                {!isExpanded && (
                                    <p className="text-xs text-muted-foreground leading-relaxed font-normal line-clamp-2">
                                        {ticket.description}
                                    </p>
                                )}

                                {/* Expanded In-Card Neumorphic Details Drawer */}
                                {isExpanded && (
                                    <div className="rounded-2xl neumorphic-inset p-3.5 flex flex-col gap-2.5 animate-in fade-in zoom-in-98 duration-200">
                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/70">
                                                    Category
                                                </span>
                                                <span className="font-bold text-foreground capitalize truncate">
                                                    {ticket.category ? ticket.category.replace(/\|/g, ', ') : 'General Maintenance'}
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/70">
                                                    Resident
                                                </span>
                                                <span className="font-bold text-foreground truncate">
                                                    {typeof ticket.tenant === 'object' ? (ticket.tenant?.full_name || 'Resident') : (ticket.tenant || 'Resident')}
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/70">
                                                    Location
                                                </span>
                                                <span className="font-bold text-foreground truncate">
                                                    {ticket.unit?.name ? `Unit ${ticket.unit.name}` : 'Unit N/A'}
                                                    {(ticket as any).property ? ` • ${(ticket as any).property}` : ''}
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/70">
                                                    Submitted
                                                </span>
                                                <span className="font-bold text-foreground truncate">
                                                    {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Recently'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Full Description */}
                                        <div className="pt-2 border-t border-border/40 flex flex-col gap-1">
                                            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/70">
                                                Full Issue Details
                                            </span>
                                            <p className="text-[11px] text-foreground/90 leading-relaxed font-normal whitespace-pre-wrap">
                                                {ticket.description || 'No additional description provided.'}
                                            </p>
                                        </div>

                                        {/* AI Triage Note (if present) */}
                                        {(ticket.ai_triage_notes || (ticket as any).triageReason) && (
                                            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-primary flex items-start gap-2">
                                                <Sparkles className="size-3.5 shrink-0 mt-0.5" />
                                                <div>
                                                    <span className="text-[9px] font-black uppercase tracking-wider block">AI Triage Note</span>
                                                    <p className="leading-snug mt-0.5">{ticket.ai_triage_notes || (ticket as any).triageReason}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Photo Thumbnails */}
                                {hasImages && ticket.images && (
                                    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                                        {ticket.images.map((imgUrl, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setLightboxImage(imgUrl)}
                                                className="relative size-14 rounded-2xl overflow-hidden border border-border/40 shadow-xs shrink-0 hover:opacity-80 active:scale-95 transition-all"
                                                aria-label="Inspect issue photo"
                                            >
                                                <Image src={imgUrl} alt="Issue photo" fill sizes="56px" className="object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Bottom Row with Inset Date Icon and Action Buttons */}
                                <div className="flex items-center justify-between pt-2 border-t border-border/40 gap-2">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <div className="neumorphic-inset-card flex size-5 items-center justify-center rounded-md text-muted-foreground shrink-0">
                                            <Clock className="size-3" />
                                        </div>
                                        <span className="font-semibold text-[11px]">
                                            {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                                            className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
                                        >
                                            <span>{isExpanded ? 'Less' : 'Details'}</span>
                                            {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                                        </button>

                                        {normStatus === 'pending' && (
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                                                disabled={updatingId === ticket.id}
                                                className="px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                                            >
                                                <Wrench className="size-3" />
                                                <span>Start Work</span>
                                            </button>
                                        )}

                                        {normStatus !== 'resolved' && (
                                            <button
                                                type="button"
                                                onClick={() => setPendingResolveTicket(ticket)}
                                                disabled={updatingId === ticket.id}
                                                className="px-3 py-1.5 rounded-xl neumorphic-primary text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
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

            {/* Resolve Ticket Confirmation Modal */}
            {pendingResolveTicket && (
                <MobileConfirmModal
                    isOpen={Boolean(pendingResolveTicket)}
                    title="Resolve Maintenance Request?"
                    description={
                        <span>
                            Are you sure you want to mark <strong className="text-foreground font-bold">&quot;{pendingResolveTicket.title}&quot;</strong> for <strong className="text-foreground font-bold">{pendingResolveTicket.tenant?.full_name || 'Resident'}</strong> ({pendingResolveTicket.unit?.name ? `Unit ${pendingResolveTicket.unit.name}` : 'Unit'}) as resolved?
                        </span>
                    }
                    confirmLabel="Resolve Ticket"
                    cancelLabel="Cancel"
                    variant="success"
                    isLoading={updatingId === pendingResolveTicket.id}
                    icon={<CheckCircle2 className="size-5" />}
                    onConfirm={() => handleUpdateStatus(pendingResolveTicket.id, 'resolved')}
                    onCancel={() => !updatingId && setPendingResolveTicket(null)}
                />
            )}
            </div>
        </PullToRefresh>
    );
}
