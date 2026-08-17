"use client";

import { useEffect, useState, useMemo } from "react";
import { useProperty } from "@/context/PropertyContext";
import { m as motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Users,
    CreditCard,
    Wrench,
    FileText,
    Zap,
    MapPin,
    ArrowUpRight,
    Info,
    CalendarCheck,
    MessageSquare,
    CheckCircle2,
    Clock,
    X,
    Filter,
    Layers,
    LayoutGrid,
    Home,
    Calendar
} from "lucide-react";
import Link from "next/link";

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    type: "payment" | "lease" | "maintenance" | "booking";
    status: string;
    amount?: number;
    balanceRemaining?: number;
    invoiceNumber?: string;
    description?: string;
    tenantName?: string;
    tenantAvatar?: string;
    tenantBg?: string;
    propertyName?: string;
    unitName?: string;
    detailsUrl?: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
    totalPrice?: number;
    priority?: string;
    category?: string;
}

const EVENT_TYPE_STYLES = {
    payment: {
        color: "bg-emerald-500 text-emerald-500 border-emerald-500/25",
        bg: "bg-emerald-500/10",
        dot: "bg-emerald-500",
        label: "Rent & Utilities",
        icon: Home,
        activePill: "border-emerald-500/35 bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-emerald-500/5 dark:from-[#133e24] dark:via-[#0e2a19] dark:to-[#091b10] shadow-[0_2px_12px_rgba(16,185,129,0.2),inset_0_1px_1px_rgba(255,255,255,0.15)] text-foreground dark:text-white",
        glow: "bg-emerald-500/25 blur-sm",
        iconColor: "text-emerald-500 dark:text-emerald-400",
        badge: "bg-emerald-500/15 dark:bg-black/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
    },
    lease: {
        color: "bg-violet-500 text-violet-500 border-violet-500/25",
        bg: "bg-violet-500/10",
        dot: "bg-violet-500",
        label: "Leases",
        icon: FileText,
        activePill: "border-violet-500/35 bg-gradient-to-r from-violet-500/15 via-violet-500/10 to-violet-500/5 dark:from-[#311c52] dark:via-[#201237] dark:to-[#150a26] shadow-[0_2px_12px_rgba(139,92,246,0.2),inset_0_1px_1px_rgba(255,255,255,0.15)] text-foreground dark:text-white",
        glow: "bg-violet-500/25 blur-sm",
        iconColor: "text-violet-500 dark:text-violet-400",
        badge: "bg-violet-500/15 dark:bg-black/40 border-violet-500/30 text-violet-700 dark:text-violet-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
    },
    maintenance: {
        color: "bg-red-500 text-red-500 border-red-500/25",
        bg: "bg-red-500/10",
        dot: "bg-red-500",
        label: "Maintenance",
        icon: Wrench,
        activePill: "border-rose-500/35 bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-rose-500/5 dark:from-[#44171e] dark:via-[#2e0e14] dark:to-[#1e070b] shadow-[0_2px_12px_rgba(244,63,94,0.2),inset_0_1px_1px_rgba(255,255,255,0.15)] text-foreground dark:text-white",
        glow: "bg-rose-500/25 blur-sm",
        iconColor: "text-rose-500 dark:text-rose-400",
        badge: "bg-rose-500/15 dark:bg-black/40 border-rose-500/30 text-rose-700 dark:text-rose-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
    },
    booking: {
        color: "bg-blue-500 text-blue-500 border-blue-500/25",
        bg: "bg-blue-500/10",
        dot: "bg-blue-500",
        label: "Bookings",
        icon: Calendar,
        activePill: "border-blue-500/35 bg-gradient-to-r from-blue-500/15 via-blue-500/10 to-blue-500/5 dark:from-[#132c4e] dark:via-[#0c1c34] dark:to-[#081224] shadow-[0_2px_12px_rgba(59,130,246,0.2),inset_0_1px_1px_rgba(255,255,255,0.15)] text-foreground dark:text-white",
        glow: "bg-blue-500/25 blur-sm",
        iconColor: "text-blue-500 dark:text-blue-400",
        badge: "bg-blue-500/15 dark:bg-black/40 border-blue-500/30 text-blue-700 dark:text-blue-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
    }
};

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function LandlordCalendarPage() {
    const { selectedPropertyId } = useProperty();
    
    // Calendar view states
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter toggles
    const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
        payment: true,
        lease: true,
        maintenance: true,
        booking: true
    });

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Fetch calendar events
    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/landlord/calendar/events?propertyId=${selectedPropertyId || 'all'}`);
                if (!response.ok) throw new Error("Failed to fetch calendar events");
                const data = await response.json();
                setEvents(data.events || []);
            } catch (err: any) {
                console.error("Error loading events:", err);
                setError(err.message || "Failed to load events");
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [selectedPropertyId]);

    // Handle Month Navigations
    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    // Calculate dynamic month matrix
    const calendarDays = useMemo(() => {
        const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
        const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
        const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

        const dayList = [];

        // Previous Month padding days
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            dayList.push({
                date: new Date(currentYear, currentMonth - 1, prevMonthTotalDays - i),
                isCurrentMonth: false,
                key: `prev-${prevMonthTotalDays - i}`
            });
        }

        // Current Month days
        for (let i = 1; i <= totalDays; i++) {
            dayList.push({
                date: new Date(currentYear, currentMonth, i),
                isCurrentMonth: true,
                key: `curr-${i}`
            });
        }

        // Next Month padding days (fill the rest of grid rows)
        const totalCells = Math.ceil(dayList.length / 7) * 7;
        const nextMonthPadding = totalCells - dayList.length;
        for (let i = 1; i <= nextMonthPadding; i++) {
            dayList.push({
                date: new Date(currentYear, currentMonth + 1, i),
                isCurrentMonth: false,
                key: `next-${i}`
            });
        }

        return dayList;
    }, [currentYear, currentMonth]);

    // Helper formatting function to match YYYY-MM-DD
    const formatDateKey = (date: Date) => {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - offset * 60 * 1000);
        return localDate.toISOString().split("T")[0];
    };

    // Index events by date string for high-speed lookup
    const eventsByDate = useMemo(() => {
        const index: Record<string, CalendarEvent[]> = {};
        events.forEach(e => {
            if (!activeFilters[e.type]) return;
            if (!index[e.date]) {
                index[e.date] = [];
            }
            index[e.date].push(e);
        });
        return index;
    }, [events, activeFilters]);

    // Retrieve active details for currently selected day
    const selectedDateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);
    const selectedDayEvents = useMemo(() => eventsByDate[selectedDateKey] || [], [eventsByDate, selectedDateKey]);

    const toggleFilter = (type: string) => {
        setActiveFilters(prev => ({ ...prev, [type]: !prev[type] }));
    };

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {
            payment: 0,
            lease: 0,
            maintenance: 0,
            booking: 0
        };
        events.forEach(e => {
            if (counts[e.type] !== undefined) {
                counts[e.type]++;
            }
        });
        return counts;
    }, [events]);

    const allFiltersActive = useMemo(() => Object.values(activeFilters).every(Boolean), [activeFilters]);

    const handleToggleAll = () => {
        if (allFiltersActive) {
            setActiveFilters({
                payment: false,
                lease: false,
                maintenance: false,
                booking: false
            });
        } else {
            setActiveFilters({
                payment: true,
                lease: true,
                maintenance: true,
                booking: true
            });
        }
    };

    return (
        <div className="min-h-screen w-full bg-background p-4 md:p-8 flex flex-col gap-6 select-none">
            {/* Header section with page title & today navigation */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                        <CalendarIcon className="size-6 text-primary" />
                        Operational Calendar
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Monitor tenant dues, upcoming lease dates, facility bookings, and maintenance.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleToday}
                        className="px-4 py-2 text-sm font-medium rounded-xl neumorphic-extruded active:neumorphic-inset text-foreground transition-all duration-150"
                    >
                        Today
                    </button>
                    <div className="flex items-center rounded-xl p-1 bg-card/40 border border-border/20 shadow-inner">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Previous Month"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <span className="px-3 text-sm font-medium text-foreground min-w-[120px] text-center">
                            {MONTH_NAMES[currentMonth]} {currentYear}
                        </span>
                        <button
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Next Month"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Quick-toggle category filter indicators - Compact & contextual */}
            <section className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl neumorphic-panel text-muted-foreground text-xs font-semibold select-none mr-0.5">
                    <Filter className="size-3.5 text-primary" />
                    <span>Filter Events:</span>
                </div>

                {/* 1. "All" Pill */}
                <button
                    onClick={handleToggleAll}
                    className={cn(
                        "group relative flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border text-xs font-semibold transition-all duration-200 active:scale-[0.97] cursor-pointer select-none overflow-hidden",
                        allFiltersActive
                            ? "border-purple-500/35 bg-gradient-to-r from-purple-500/15 via-purple-500/10 to-purple-500/5 dark:from-[#2e1c4a] dark:via-[#1e1335] dark:to-[#170e28] shadow-[0_2px_12px_rgba(168,85,247,0.2),inset_0_1px_1px_rgba(255,255,255,0.18)] text-foreground dark:text-white"
                            : "border-border/30 bg-surface-2/40 dark:bg-[#18181b]/50 text-muted-foreground/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] opacity-55 hover:opacity-85 hover:border-border/60"
                    )}
                    title={allFiltersActive ? "Click to deselect all category filters" : "Click to show all category events"}
                >
                    {allFiltersActive && (
                        <div className="absolute -left-1 -top-1 size-8 rounded-full bg-purple-500/25 blur-sm pointer-events-none opacity-80" />
                    )}
                    <LayoutGrid className={cn("size-3.5 shrink-0 relative z-10 transition-colors", allFiltersActive ? "text-purple-500 dark:text-purple-400" : "text-muted-foreground/60")} />
                    <span className="relative z-10 tracking-tight text-foreground dark:text-white">All</span>
                    <span className={cn(
                        "relative z-10 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold border transition-all",
                        allFiltersActive
                            ? "bg-purple-500/15 dark:bg-black/40 border-purple-500/30 text-purple-700 dark:text-purple-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
                            : "bg-black/10 dark:bg-black/30 border-border/30 text-muted-foreground/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"
                    )}>
                        {events.length}
                    </span>
                </button>

                {/* 2. Individual Category Pills */}
                {Object.entries(EVENT_TYPE_STYLES).map(([type, style]) => {
                    const Icon = style.icon;
                    const isActive = activeFilters[type];
                    const count = categoryCounts[type] || 0;

                    return (
                        <button
                            key={type}
                            onClick={() => toggleFilter(type)}
                            className={cn(
                                "group relative flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border text-xs font-semibold transition-all duration-200 active:scale-[0.97] cursor-pointer select-none overflow-hidden",
                                isActive
                                    ? style.activePill
                                    : "border-border/30 bg-surface-2/40 dark:bg-[#18181b]/50 text-muted-foreground/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] opacity-55 hover:opacity-85 hover:border-border/60"
                            )}
                            title={isActive ? `Click to hide ${style.label} events` : `Click to show ${style.label} events`}
                        >
                            {/* Ambient glowing aura behind icon */}
                            {isActive && (
                                <div className={cn("absolute -left-1 -top-1 size-8 rounded-full pointer-events-none opacity-80", style.glow)} />
                            )}
                            <Icon className={cn("size-3.5 shrink-0 relative z-10 transition-colors", isActive ? style.iconColor : "text-muted-foreground/60")} />
                            <span className="relative z-10 tracking-tight text-foreground dark:text-white">{style.label}</span>
                            <span className={cn(
                                "relative z-10 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold border transition-all",
                                isActive
                                    ? style.badge
                                    : "bg-black/10 dark:bg-black/30 border-border/30 text-muted-foreground/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"
                            )}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </section>

            {/* Main view container layout: Split between Calendar and detail drawer */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 items-start">
                
                {/* 1. Neumorphic Calendar Month Grid */}
                <div className="xl:col-span-2 neumorphic-panel rounded-3xl p-6 relative overflow-hidden flex flex-col">
                    {loading && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <span className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                <span className="text-xs font-medium text-muted-foreground animate-pulse">Syncing operations...</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Day labels header */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Month grid cells */}
                    <div className="grid grid-cols-7 gap-3 flex-1 min-h-[420px]">
                        {calendarDays.map(({ date, isCurrentMonth, key }) => {
                            const dateStr = formatDateKey(date);
                            const dayEvents = eventsByDate[dateStr] || [];
                            const isSelected = dateStr === selectedDateKey;
                            const isToday = formatDateKey(new Date()) === dateStr;

                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedDate(date)}
                                    className={cn(
                                        "neumorphic-extruded rounded-2xl p-2.5 min-h-[85px] flex flex-col items-start justify-between relative group transition-all duration-150 text-left",
                                        !isCurrentMonth && "opacity-40",
                                        isSelected
                                            ? "border-primary/60 dark:border-primary/50 ring-1 ring-primary/30 bg-primary/[0.04] dark:bg-primary/[0.06]"
                                            : "hover:scale-[1.01] active:scale-95 active:neumorphic-inset",
                                        isToday && !isSelected && "ring-1 ring-primary/30"
                                    )}
                                >
                                    {/* Day numerical label & status tag */}
                                    <div className="flex w-full items-center justify-between">
                                        <span
                                            className={cn(
                                                "text-sm font-semibold flex items-center justify-center size-6 rounded-lg transition-colors",
                                                isToday
                                                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                                                    : isSelected
                                                    ? "text-primary font-bold bg-primary/10 border border-primary/25"
                                                    : "text-foreground/80 group-hover:text-foreground"
                                            )}
                                        >
                                            {date.getDate()}
                                        </span>

                                        {/* Subtle indicator for today */}
                                        {isToday && (
                                            <span className="text-[9px] font-bold text-primary tracking-wider uppercase">
                                                TODAY
                                            </span>
                                        )}
                                    </div>

                                    {/* Render Event Overlays */}
                                    <div className="w-full flex flex-col gap-1 mt-2 overflow-hidden max-h-[50px]">
                                        {dayEvents.slice(0, 3).map((event, index) => {
                                            const styles = EVENT_TYPE_STYLES[event.type];
                                            return (
                                                <div
                                                    key={event.id}
                                                    className={cn(
                                                        "text-[10px] font-medium leading-none px-1.5 py-0.5 rounded border flex items-center gap-1 truncate w-full shadow-sm",
                                                        styles.color,
                                                        styles.bg
                                                    )}
                                                >
                                                    <span className={cn("size-1.5 rounded-full shrink-0", styles.dot)} />
                                                    <span className="truncate">{event.title}</span>
                                                </div>
                                            );
                                        })}
                                        {dayEvents.length > 3 && (
                                            <div className="text-[9px] font-bold text-muted-foreground pl-1.5 leading-none">
                                                +{dayEvents.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Interactive Details Side Drawer Panel */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                    <div className="neumorphic-panel rounded-3xl p-6 flex flex-col min-h-[500px]">
                        <header className="border-b border-border/40 pb-4 mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <Layers className="size-5 text-primary" />
                                    Agenda Details
                                </h2>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                                    <p className="text-xs font-medium text-foreground">
                                        {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
                                {selectedDayEvents.length} {selectedDayEvents.length === 1 ? "Event" : "Events"}
                            </span>
                        </header>

                        {/* List items representation */}
                        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 max-h-[480px]">
                            {selectedDayEvents.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-card/30 rounded-2xl border border-border/10 shadow-inner">
                                    <div className="size-12 rounded-2xl bg-muted/40 flex items-center justify-center mb-3 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1)]">
                                        <CalendarCheck className="size-6 text-muted-foreground/60" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-foreground">Priscilla Clean!</h3>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                                        No upcoming utility dues, maintenance requests, or lease milestones for this date.
                                    </p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {selectedDayEvents.map((event) => {
                                        const styles = EVENT_TYPE_STYLES[event.type];
                                        const Icon = styles.icon;

                                        return (
                                            <motion.div
                                                key={event.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                className="neumorphic-inset rounded-2xl p-4 flex flex-col gap-3 relative hover:shadow-md transition-shadow"
                                            >
                                                {/* Header segment of card */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("p-2.5 rounded-xl border shadow-inner shrink-0", styles.color, styles.bg)}>
                                                            <Icon className="size-4" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-foreground leading-tight">
                                                                {event.title}
                                                            </h4>
                                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                                                {styles.label}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-lg border shadow-sm capitalize",
                                                        event.status === "paid" || event.status === "Approved" || event.status === "resolved"
                                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                    )}>
                                                        {event.status}
                                                    </span>
                                                </div>

                                                {/* Body description panel */}
                                                {event.description && (
                                                    <p className="text-xs text-muted-foreground leading-relaxed px-1">
                                                        {event.description}
                                                    </p>
                                                )}

                                                {/* Meta specifications */}
                                                <div className="grid grid-cols-2 gap-2 text-[11px] bg-card/45 border border-border/10 p-2.5 rounded-xl shadow-inner mt-1">
                                                    {event.propertyName && (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                                                            <MapPin className="size-3.5 text-primary shrink-0" />
                                                            <span className="truncate">{event.propertyName} {event.unitName ? `(${event.unitName})` : ""}</span>
                                                        </div>
                                                    )}
                                                    {event.amount !== undefined && (
                                                        <div className="flex items-center gap-1.5 text-foreground font-semibold justify-end">
                                                            <span>Amount: ₱{event.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                        </div>
                                                    )}
                                                    {event.startTime && (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground justify-end col-span-2">
                                                            <Clock className="size-3.5 text-primary" />
                                                            <span>{event.startTime.slice(0, 5)} - {event.endTime?.slice(0, 5)}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tenant info bar & actions */}
                                                <div className="flex items-center justify-between border-t border-border/20 pt-3 mt-1 gap-2">
                                                    {event.tenantName ? (
                                                        <div className="flex items-center gap-2 truncate">
                                                            <div
                                                                className="size-6 rounded-lg text-[10px] font-bold flex items-center justify-center border border-border/40 shrink-0 text-foreground"
                                                                style={{ backgroundColor: event.tenantBg || "#f3f4f6" }}
                                                            >
                                                                {event.tenantAvatar ? (
                                                                    <img src={event.tenantAvatar} alt="" className="size-full object-cover rounded-lg" />
                                                                ) : (
                                                                    event.tenantName.slice(0, 2).toUpperCase()
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-medium text-foreground truncate">{event.tenantName}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                            <Info className="size-3.5 text-muted-foreground/60" />
                                                            <span>System Milestone</span>
                                                        </div>
                                                    )}

                                                    {event.detailsUrl && (
                                                        <Link
                                                            href={event.detailsUrl}
                                                            className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 active:scale-95 transition-all duration-150"
                                                        >
                                                            Inspect
                                                            <ArrowUpRight className="size-3.5" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
