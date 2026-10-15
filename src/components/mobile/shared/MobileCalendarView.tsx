'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Calendar as CalendarIcon,
    CreditCard,
    Key,
    Wrench,
    FileText,
    ChevronLeft,
    ChevronRight,
    Search,
    RefreshCw,
    X,
    Building2,
    Clock,
    AlertCircle,
    CheckCircle2,
    DollarSign,
    Sparkles,
    ChevronDown,
    ArrowUpRight,
    StickyNote,
    Plus,
    Trash2,
    CalendarCheck,
    Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProperty } from '@/context/PropertyContext';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector';
import { useCalendarNotes } from '@/hooks/useCalendarNotes';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguageContext } from '@/context/LanguageContext';

export interface CalendarEventItem {
    id: string;
    title: string;
    date: string;
    type: 'payment' | 'lease' | 'maintenance' | 'booking' | 'note';
    status?: string;
    amount?: number | null;
    balanceRemaining?: number | null;
    description?: string;
    tenantName?: string;
    propertyName?: string;
    unitName?: string;
    detailsUrl?: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
}

export function MobileCalendarView() {
    const router = useRouter();
    const { profile } = useAuth();
    const { selectedPropertyId } = useProperty();
    const { t, locale } = useLanguageContext();
    const role = (profile?.role as 'tenant' | 'landlord') || 'tenant';
    const isLandlord = role === 'landlord';

    const [events, setEvents] = useState<CalendarEventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<'all' | 'payment' | 'lease' | 'maintenance' | 'booking' | 'note'>('all');
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        return new Date().toISOString().split('T')[0];
    });

    // Week offset from today (0 = current week, 1 = next week, etc.)
    const [weekOffset, setWeekOffset] = useState(0);

    // Note Modal State
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteDesc, setNoteDesc] = useState('');
    const [noteDate, setNoteDate] = useState(selectedDate);
    const [noteSubmitting, setNoteSubmitting] = useState(false);

    // Personal Notes hook
    const { notes, addNote, deleteNote } = useCalendarNotes({
        userId: profile?.id,
        landlordId: isLandlord ? profile?.id : undefined,
    });

    // Merge notes into events list
    const noteEvents: CalendarEventItem[] = useMemo(() => {
        return notes.map(n => ({
            id: n.id,
            title: n.title,
            description: n.description,
            date: n.date,
            type: 'note' as const,
            status: 'note',
        }));
    }, [notes]);

    const allEvents = useMemo(() => {
        return [...events, ...noteEvents];
    }, [events, noteEvents]);

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const endpoint = isLandlord 
                ? '/api/landlord/calendar/events' 
                : '/api/tenant/calendar/events';

            const params = new URLSearchParams();
            if (isLandlord && selectedPropertyId && selectedPropertyId !== 'all') {
                params.set('propertyId', selectedPropertyId);
            }

            const query = params.toString() ? `?${params.toString()}` : "";
            const res = await fetch(`${endpoint}${query}`);
            if (!res.ok) throw new Error('Failed to load calendar events');
            const data = await res.json();
            setEvents(Array.isArray(data.events) ? data.events : Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching calendar events:', err);
            toast.error(t('Failed to load schedule'));
        } finally {
            setLoading(false);
        }
    }, [isLandlord, selectedPropertyId, t]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const formatCurrency = (amt?: number | null) => {
        if (typeof amt !== 'number') return '₱0.00';
        return `₱${amt.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    };

    const formatDateHeading = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const isToday = d.toDateString() === today.toDateString();
        const isTomorrow = d.toDateString() === tomorrow.toDateString();

        const formatted = d.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
        if (isToday) return t('Today ({date})', { date: formatted });
        if (isTomorrow) return t('Tomorrow ({date})', { date: formatted });
        return formatted;
    };

    // Calculate Week Days
    const weekDays = useMemo(() => {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() + weekOffset * 7);

        const dayOfWeek = start.getDay();
        const monday = new Date(start);
        monday.setDate(start.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

        const days = [];
        for (let i = 0; i < 7; i++) {
            const current = new Date(monday);
            current.setDate(monday.getDate() + i);
            const iso = current.toISOString().split('T')[0];
            const hasEvents = allEvents.some(e => e.date === iso);
            days.push({
                dateObj: current,
                iso,
                dayName: current.toLocaleDateString(locale, { weekday: 'narrow' }),
                dayNumber: current.getDate(),
                hasEvents,
            });
        }
        return days;
    }, [weekOffset, allEvents, locale]);

    // Current month/year heading based on middle of active week
    const currentWeekMonthLabel = useMemo(() => {
        if (weekDays.length === 0) return '';
        const mid = weekDays[3].dateObj;
        return mid.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    }, [weekDays, locale]);

    // Handle adding note
    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteTitle.trim()) {
            toast.error(t('Please enter a note title'));
            return;
        }

        setNoteSubmitting(true);
        triggerHaptic('medium');
        try {
            const res = await addNote(noteDate, noteTitle.trim(), noteDesc.trim());
            if (!res.success) {
                toast.error(res.error || t('Failed to save note'));
                return;
            }

            toast.success(t('Note added to schedule!'));
            setNoteTitle('');
            setNoteDesc('');
            setIsNoteModalOpen(false);
        } catch (err: any) {
            toast.error(err.message || t('Failed to save note'));
        } finally {
            setNoteSubmitting(false);
        }
    };

    const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        triggerHaptic('light');
        try {
            await deleteNote(id);
            toast.success(t('Note removed'));
        } catch (err) {
            toast.error(t('Failed to delete note'));
        }
    };

    // Filter events by selected date and category
    const filteredEvents = useMemo(() => {
        let list = allEvents;

        if (activeCategory !== 'all') {
            list = list.filter(e => e.type === activeCategory);
        }

        return list;
    }, [allEvents, activeCategory]);

    // Events grouped by date for agenda display
    const groupedEvents = useMemo(() => {
        const groups: Record<string, CalendarEventItem[]> = {};

        // Sort events chronologically
        const sorted = [...filteredEvents].sort((a, b) => a.date.localeCompare(b.date));

        // If a specific date is selected, prioritize/filter by that date
        const matchingSelected = sorted.filter(e => e.date === selectedDate);

        if (matchingSelected.length > 0) {
            groups[selectedDate] = matchingSelected;
        } else {
            // Show all upcoming events grouped by date
            sorted.forEach(event => {
                if (!groups[event.date]) {
                    groups[event.date] = [];
                }
                groups[event.date].push(event);
            });
        }

        return groups;
    }, [filteredEvents, selectedDate]);

    // Category counts for badges
    const categoryCounts = useMemo(() => {
        const counts = {
            all: allEvents.length,
            payment: allEvents.filter(e => e.type === 'payment').length,
            lease: allEvents.filter(e => e.type === 'lease').length,
            maintenance: allEvents.filter(e => e.type === 'maintenance').length,
            booking: allEvents.filter(e => e.type === 'booking').length,
            note: allEvents.filter(e => e.type === 'note').length,
        };
        return counts;
    }, [allEvents]);

    return (
        <PullToRefresh onRefresh={fetchEvents}>
            <div className="flex flex-col gap-3.5 p-4 pb-20">
                {/* Header Controls: Property Filter (Landlords) & Refresh */}
                <div className="flex items-center justify-between gap-2">
                    {isLandlord ? (
                        <MobilePropertySelector className="flex-1" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <CalendarIcon className="size-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-foreground">{t('My Schedule')}</h3>
                                <p className="text-[10px] text-muted-foreground">{t('Dues, maintenance & reminders')}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic('light');
                                setNoteDate(selectedDate);
                                setIsNoteModalOpen(true);
                            }}
                            className="p-2.5 rounded-xl border border-primary/20 bg-primary/10 text-primary active:scale-95 transition-all shadow-2xs flex items-center gap-1 text-xs font-bold"
                            aria-label={t("Add Note")}
                        >
                            <Plus className="size-4" />
                            <span className="hidden sm:inline">{t('Note')}</span>
                        </button>
                        <button
                            onClick={() => {
                                triggerHaptic('light');
                                fetchEvents();
                            }}
                            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-2xs"
                            aria-label={t("Refresh schedule")}
                        >
                            <RefreshCw className={cn("size-4", loading && "animate-spin text-primary")} />
                        </button>
                    </div>
                </div>

                {/* Week Selector Card */}
                <div className="p-3.5 rounded-2xl bg-card border border-slate-200 dark:border-white/10 shadow-xs space-y-3">
                    {/* Month Title & Week Offset Navigation */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                                {currentWeekMonthLabel}
                            </h4>
                            {weekOffset !== 0 && (
                                <button
                                    onClick={() => {
                                        triggerHaptic('light');
                                        setWeekOffset(0);
                                        setSelectedDate(new Date().toISOString().split('T')[0]);
                                    }}
                                    className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary active:scale-95 transition-all"
                                >
                                    {t('Today')}
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => {
                                    triggerHaptic('light');
                                    setWeekOffset(prev => prev - 1);
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                                aria-label={t("Previous week")}
                            >
                                <ChevronLeft className="size-3.5" />
                            </button>
                            <button
                                onClick={() => {
                                    triggerHaptic('light');
                                    setWeekOffset(prev => prev + 1);
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                                aria-label={t("Next week")}
                            >
                                <ChevronRight className="size-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* 7 Days of the Week Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {weekDays.map((day) => {
                            const isSelected = selectedDate === day.iso;
                            const isToday = day.iso === new Date().toISOString().split('T')[0];

                            return (
                                <button
                                    key={day.iso}
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic('light');
                                        setSelectedDate(day.iso);
                                    }}
                                    className={cn(
                                        "py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all relative active:scale-95",
                                        isSelected
                                            ? "bg-primary text-primary-foreground shadow-xs font-bold"
                                            : isToday
                                            ? "bg-primary/10 text-primary font-bold"
                                            : "hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    <span className="text-[10px] uppercase font-bold opacity-80">
                                        {day.dayName}
                                    </span>
                                    <span className="text-xs font-black">
                                        {day.dayNumber}
                                    </span>
                                    {day.hasEvents && (
                                        <span className={cn(
                                            "size-1.5 rounded-full",
                                            isSelected ? "bg-white" : "bg-primary"
                                        )} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Filter Category Tabs (Horizontal Scrollable) */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 overflow-x-auto [scrollbar-width:none]">
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveCategory('all');
                        }}
                        className={cn(
                            "py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap shrink-0 flex items-center gap-1",
                            activeCategory === 'all'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <span>{t('All')}</span>
                        <span className="text-[10px] opacity-70 font-semibold">({categoryCounts.all})</span>
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveCategory('payment');
                        }}
                        className={cn(
                            "py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap shrink-0 flex items-center gap-1",
                            activeCategory === 'payment'
                                ? "bg-white dark:bg-card text-emerald-600 dark:text-emerald-400 shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <span>{t('Rent Dues')}</span>
                        {categoryCounts.payment > 0 && (
                            <span className="text-[10px] opacity-80 font-bold">({categoryCounts.payment})</span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveCategory('lease');
                        }}
                        className={cn(
                            "py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap shrink-0 flex items-center gap-1",
                            activeCategory === 'lease'
                                ? "bg-white dark:bg-card text-purple-600 dark:text-purple-400 shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <span>{t('Leases')}</span>
                        {categoryCounts.lease > 0 && (
                            <span className="text-[10px] opacity-80 font-bold">({categoryCounts.lease})</span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveCategory('maintenance');
                        }}
                        className={cn(
                            "py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap shrink-0 flex items-center gap-1",
                            activeCategory === 'maintenance'
                                ? "bg-white dark:bg-card text-amber-600 dark:text-amber-400 shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <span>{t('Repairs')}</span>
                        {categoryCounts.maintenance > 0 && (
                            <span className="text-[10px] opacity-80 font-bold">({categoryCounts.maintenance})</span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveCategory('booking');
                        }}
                        className={cn(
                            "py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap shrink-0 flex items-center gap-1",
                            activeCategory === 'booking'
                                ? "bg-white dark:bg-card text-blue-600 dark:text-blue-400 shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <span>{t('Bookings')}</span>
                        {categoryCounts.booking > 0 && (
                            <span className="text-[10px] opacity-80 font-bold">({categoryCounts.booking})</span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveCategory('note');
                        }}
                        className={cn(
                            "py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap shrink-0 flex items-center gap-1",
                            activeCategory === 'note'
                                ? "bg-white dark:bg-card text-sky-600 dark:text-sky-400 shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <span>{t('Notes')}</span>
                        {categoryCounts.note > 0 && (
                            <span className="text-[10px] opacity-80 font-bold">({categoryCounts.note})</span>
                        )}
                    </button>
                </div>

                {/* Agenda Timeline List */}
                <div className="space-y-4">
                    {Object.keys(groupedEvents).length === 0 ? (
                        <div className="p-8 text-center rounded-2xl bg-card border border-slate-200 dark:border-white/10 flex flex-col items-center gap-2.5">
                            <CalendarIcon className="size-10 text-muted-foreground/40 stroke-1" />
                            <h4 className="text-sm font-bold text-foreground">{t('No Scheduled Events')}</h4>
                            <p className="text-xs text-muted-foreground max-w-xs">
                                {t('No dues, lease milestones, or personal reminders for this date.')}
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic('light');
                                    setNoteDate(selectedDate);
                                    setIsNoteModalOpen(true);
                                }}
                                className="mt-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                            >
                                <Plus className="size-3.5" />
                                <span>{t('Add a Reminder')}</span>
                            </button>
                        </div>
                    ) : (
                        Object.entries(groupedEvents).map(([date, dateEvents]) => (
                            <div key={date} className="space-y-2">
                                <div className="flex items-center gap-2 px-1">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                                        {formatDateHeading(date)}
                                    </span>
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic('light');
                                            setNoteDate(date);
                                            setIsNoteModalOpen(true);
                                        }}
                                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                                    >
                                        <Plus className="size-3" />
                                        <span>{t('Add Note')}</span>
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {dateEvents.map((event) => {
                                        const isPay = event.type === 'payment';
                                        const isLease = event.type === 'lease';
                                        const isMaint = event.type === 'maintenance';
                                        const isBooking = event.type === 'booking';
                                        const isNote = event.type === 'note';

                                        const linkHref = isPay
                                            ? isLandlord ? '/mobile/landlord/payments' : '/mobile/tenant/pay'
                                            : isLease
                                            ? isLandlord ? '/mobile/landlord/leases' : '/mobile/tenant/lease'
                                            : isMaint
                                            ? isLandlord ? '/mobile/landlord/tickets' : '/mobile/tenant/maintenance'
                                            : isBooking
                                            ? isLandlord ? '/mobile/landlord/overview' : '/mobile/tenant/home'
                                            : null;

                                        const EventWrapper = linkHref ? Link : 'div';

                                        return (
                                            <EventWrapper
                                                key={event.id}
                                                href={linkHref || '#'}
                                                onClick={() => {
                                                    if (linkHref) triggerHaptic('light');
                                                }}
                                                className={cn(
                                                    "p-3.5 rounded-2xl bg-card border shadow-xs transition-all flex items-start gap-3 relative",
                                                    linkHref && "active:scale-98 cursor-pointer",
                                                    isPay && "border-emerald-500/25 hover:border-emerald-500/40",
                                                    isLease && "border-purple-500/25 hover:border-purple-500/40",
                                                    isMaint && "border-amber-500/25 hover:border-amber-500/40",
                                                    isBooking && "border-blue-500/25 hover:border-blue-500/40",
                                                    isNote && "border-sky-500/30 bg-sky-500/5 hover:border-sky-500/50"
                                                )}
                                            >
                                                {/* Icon Badge */}
                                                <div className={cn(
                                                    "size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                                                    isPay && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                                                    isLease && "bg-purple-500/15 text-purple-600 dark:text-purple-400",
                                                    isMaint && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                                                    isBooking && "bg-blue-500/15 text-blue-600 dark:text-blue-400",
                                                    isNote && "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                                                )}>
                                                    {isPay ? (
                                                        <CreditCard className="size-5" />
                                                    ) : isLease ? (
                                                        <Key className="size-5" />
                                                    ) : isMaint ? (
                                                        <Wrench className="size-5" />
                                                    ) : isBooking ? (
                                                        <CalendarCheck className="size-5" />
                                                    ) : (
                                                        <StickyNote className="size-5" />
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <h4 className="text-xs font-black text-foreground truncate">
                                                            {event.title}
                                                        </h4>
                                                        {event.amount ? (
                                                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                                                                {formatCurrency(event.amount)}
                                                            </span>
                                                        ) : null}
                                                        {isNote && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleDeleteNote(event.id, e)}
                                                                className="p-1 rounded-lg text-muted-foreground hover:text-red-500 active:scale-90 transition-all shrink-0"
                                                                aria-label={t("Delete note")}
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                                        {event.unitName && (
                                                            <span className="font-bold text-foreground">
                                                                {t('Unit {unit}', { unit: event.unitName })}
                                                            </span>
                                                        )}
                                                        {event.propertyName && <span>•</span>}
                                                        {event.propertyName && (
                                                            <span className="truncate">{event.propertyName}</span>
                                                        )}
                                                        {event.startTime && (
                                                            <span className="font-medium text-foreground">
                                                                {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {event.description && (
                                                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                                            {event.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </EventWrapper>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ADD NOTE BOTTOM SHEET / MODAL */}
                {isNoteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                        <div className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="size-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                                        <StickyNote className="size-4" />
                                    </div>
                                    <h3 className="text-base font-black text-foreground">{t('Add Reminder Note')}</h3>
                                </div>
                                <button
                                    onClick={() => setIsNoteModalOpen(false)}
                                    className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                                    aria-label={t('Close')}
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddNote} className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        {t('Target Date')}
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={noteDate}
                                        onChange={(e) => setNoteDate(e.target.value)}
                                        className="w-full p-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        {t('Note Title')}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder={t('e.g., Aircon maintenance, Contractor visit...')}
                                        value={noteTitle}
                                        onChange={(e) => setNoteTitle(e.target.value)}
                                        maxLength={100}
                                        className="w-full p-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        {t('Description (Optional)')}
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder={t('Add extra details, contact numbers, or task checklist...')}
                                        value={noteDesc}
                                        onChange={(e) => setNoteDesc(e.target.value)}
                                        maxLength={500}
                                        className="w-full p-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        type="button"
                                        disabled={noteSubmitting}
                                        onClick={() => setIsNoteModalOpen(false)}
                                        className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-98 transition-all"
                                    >
                                        {t('Cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={noteSubmitting}
                                        className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                    >
                                        {noteSubmitting ? (
                                            <RefreshCw className="size-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Check className="size-4" />
                                                {t('Save Note')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </PullToRefresh>
    );
}
