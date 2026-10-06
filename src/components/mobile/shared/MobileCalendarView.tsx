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
    ArrowUpRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProperty } from '@/context/PropertyContext';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CalendarEventItem {
    id: string;
    title: string;
    date: string;
    type: 'payment' | 'lease' | 'maintenance' | 'booking';
    status?: string;
    amount?: number | null;
    balanceRemaining?: number | null;
    description?: string;
    tenantName?: string;
    propertyName?: string;
    unitName?: string;
    detailsUrl?: string;
}

export function MobileCalendarView() {
    const router = useRouter();
    const { profile } = useAuth();
    const { selectedPropertyId } = useProperty();
    const role = (profile?.role as 'tenant' | 'landlord') || 'tenant';
    const isLandlord = role === 'landlord';

    const [events, setEvents] = useState<CalendarEventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<'all' | 'payment' | 'lease' | 'maintenance'>('all');
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        return new Date().toISOString().split('T')[0];
    });

    // Week offset from today (0 = current week, 1 = next week, etc.)
    const [weekOffset, setWeekOffset] = useState(0);

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

            const res = await fetch(`${endpoint}?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to load calendar events');
            const data = await res.json();
            setEvents(Array.isArray(data.events) ? data.events : Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching calendar events:', err);
            toast.error('Failed to load schedule');
        } finally {
            setLoading(false);
        }
    }, [isLandlord, selectedPropertyId]);

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

        const formatted = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (isToday) return `Today (${formatted})`;
        if (isTomorrow) return `Tomorrow (${formatted})`;
        return formatted;
    };

    // Calculate Week Days
    const weekDays = useMemo(() => {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() + weekOffset * 7);

        // Day of week (0 = Sunday)
        const dayOfWeek = start.getDay();
        const monday = new Date(start);
        monday.setDate(start.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

        const days = [];
        for (let i = 0; i < 7; i++) {
            const current = new Date(monday);
            current.setDate(monday.getDate() + i);
            const iso = current.toISOString().split('T')[0];
            const hasEvents = events.some(e => e.date === iso);
            days.push({
                dateObj: current,
                iso,
                dayName: current.toLocaleDateString('en-US', { weekday: 'narrow' }),
                dayNumber: current.getDate(),
                hasEvents,
            });
        }
        return days;
    }, [weekOffset, events]);

    // Filter events by category and sort chronologically
    const filteredEvents = useMemo(() => {
        let list = events;

        if (activeCategory !== 'all') {
            list = list.filter(e => e.type === activeCategory);
        }

        // Sort chronologically
        return [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [events, activeCategory]);

    // Group events by date
    const groupedEvents = useMemo(() => {
        const groups: Record<string, CalendarEventItem[]> = {};
        filteredEvents.forEach(e => {
            if (!groups[e.date]) groups[e.date] = [];
            groups[e.date].push(e);
        });
        return groups;
    }, [filteredEvents]);

    return (
        <PullToRefresh onRefresh={fetchEvents}>
            <div className="flex flex-col gap-3.5 p-4 pb-24">
                {/* Scope & Refresh */}
                <div className="flex items-center justify-between gap-2">
                    {isLandlord ? (
                        <MobilePropertySelector className="flex-1" />
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                            <CalendarIcon className="size-4 text-primary" />
                            <span>My Schedule</span>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            fetchEvents();
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-2xs"
                        aria-label="Refresh events"
                    >
                        <RefreshCw className={cn("size-4", loading && "animate-spin text-primary")} />
                    </button>
                </div>

                {/* Week Strip Navigator */}
                <div className="p-3 rounded-2xl bg-card border border-slate-200 dark:border-white/10 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-foreground">
                            {weekDays[0]?.dateObj.toLocaleDateString('en-US', { month: 'short' })}{' '}
                            {weekDays[0]?.dateObj.getFullYear()}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => {
                                    triggerHaptic('light');
                                    setWeekOffset(prev => prev - 1);
                                }}
                                className="p-1 rounded-md text-muted-foreground hover:text-foreground active:scale-90"
                            >
                                <ChevronLeft className="size-4" />
                            </button>
                            <button
                                onClick={() => {
                                    triggerHaptic('light');
                                    setWeekOffset(0);
                                    setSelectedDate(new Date().toISOString().split('T')[0]);
                                }}
                                className="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded-md hover:bg-muted"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => {
                                    triggerHaptic('light');
                                    setWeekOffset(prev => prev + 1);
                                }}
                                className="p-1 rounded-md text-muted-foreground hover:text-foreground active:scale-90"
                            >
                                <ChevronRight className="size-4" />
                            </button>
                        </div>
                    </div>

                    {/* Day Pills Row */}
                    <div className="grid grid-cols-7 gap-1">
                        {weekDays.map((day) => {
                            const isSelected = selectedDate === day.iso;
                            const isToday = day.iso === new Date().toISOString().split('T')[0];

                            return (
                                <button
                                    key={day.iso}
                                    onClick={() => {
                                        triggerHaptic('light');
                                        setSelectedDate(day.iso);
                                    }}
                                    className={cn(
                                        "py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all active:scale-90 relative",
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

                {/* Filter Category Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveCategory('all');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeCategory === 'all'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        All
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveCategory('payment');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeCategory === 'payment'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Rent Dues
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveCategory('lease');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeCategory === 'lease'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Leases
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveCategory('maintenance');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeCategory === 'maintenance'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Repairs
                    </button>
                </div>

                {/* Agenda Timeline List */}
                <div className="space-y-4">
                    {Object.keys(groupedEvents).length === 0 ? (
                        <div className="p-8 text-center rounded-2xl bg-card border border-slate-200 dark:border-white/10 flex flex-col items-center gap-2.5">
                            <CalendarIcon className="size-10 text-muted-foreground/40 stroke-1" />
                            <h4 className="text-sm font-bold text-foreground">No Upcoming Events</h4>
                            <p className="text-xs text-muted-foreground max-w-xs">
                                All rent dues, lease renewals, and maintenance tickets are settled.
                            </p>
                        </div>
                    ) : (
                        Object.entries(groupedEvents).map(([date, dateEvents]) => (
                            <div key={date} className="space-y-2">
                                <div className="flex items-center gap-2 px-1">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                                        {formatDateHeading(date)}
                                    </span>
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                                </div>

                                <div className="space-y-2">
                                    {dateEvents.map((event) => {
                                        const isPay = event.type === 'payment';
                                        const isLease = event.type === 'lease';
                                        const isMaint = event.type === 'maintenance';

                                        const linkHref = isPay
                                            ? isLandlord ? '/mobile/landlord/payments' : '/mobile/tenant/pay'
                                            : isLease
                                            ? isLandlord ? '/mobile/landlord/leases' : '/mobile/tenant/lease'
                                            : isLandlord ? '/mobile/landlord/tickets' : '/mobile/tenant/maintenance';

                                        return (
                                            <Link
                                                key={event.id}
                                                href={linkHref}
                                                onClick={() => triggerHaptic('light')}
                                                className={cn(
                                                    "p-3.5 rounded-2xl bg-card border shadow-xs transition-all flex items-start gap-3 active:scale-98",
                                                    isPay
                                                        ? "border-emerald-500/25 hover:border-emerald-500/40"
                                                        : isLease
                                                        ? "border-purple-500/25 hover:border-purple-500/40"
                                                        : "border-blue-500/25 hover:border-blue-500/40"
                                                )}
                                            >
                                                {/* Icon Badge */}
                                                <div className={cn(
                                                    "size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                                                    isPay
                                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                        : isLease
                                                        ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                                                        : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                                )}>
                                                    {isPay ? <CreditCard className="size-5" /> : isLease ? <Key className="size-5" /> : <Wrench className="size-5" />}
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
                                                    </div>

                                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                                        {event.unitName && (
                                                            <span className="font-bold text-foreground">
                                                                Unit {event.unitName}
                                                            </span>
                                                        )}
                                                        {event.propertyName && <span>•</span>}
                                                        {event.propertyName && (
                                                            <span className="truncate">{event.propertyName}</span>
                                                        )}
                                                    </div>

                                                    {event.description && (
                                                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                                                            {event.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </PullToRefresh>
    );
}
