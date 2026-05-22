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
    Layers
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
        icon: CreditCard
    },
    lease: {
        color: "bg-violet-500 text-violet-500 border-violet-500/25",
        bg: "bg-violet-500/10",
        dot: "bg-violet-500",
        label: "Leases",
        icon: FileText
    },
    maintenance: {
        color: "bg-red-500 text-red-500 border-red-500/25",
        bg: "bg-red-500/10",
        dot: "bg-red-500",
        label: "Maintenance",
        icon: Wrench
    },
    booking: {
        color: "bg-blue-500 text-blue-500 border-blue-500/25",
        bg: "bg-blue-500/10",
        dot: "bg-blue-500",
        label: "Bookings",
        icon: CalendarCheck
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

            {/* Quick-toggle category filter indicators */}
            <section className="neumorphic-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <Filter className="size-4 text-primary" /> Filter Categories:
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    {Object.entries(EVENT_TYPE_STYLES).map(([type, style]) => {
                        const Icon = style.icon;
                        const isActive = activeFilters[type];
                        return (
                            <button
                                key={type}
                                onClick={() => toggleFilter(type)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-150 active:scale-95",
                                    isActive
                                        ? "bg-card border-border shadow-sm text-foreground"
                                        : "bg-muted/30 border-transparent text-muted-foreground opacity-60"
                                )}
                            >
                                <span className={cn("size-2.5 rounded-full shrink-0", style.dot)} />
                                <Icon className="size-3.5" />
                                {style.label}
                            </button>
                        );
                    })}
                </div>
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
                                        "neumorphic-extruded rounded-2xl p-2.5 min-h-[85px] flex flex-col items-start justify-between relative group hover:scale-[1.02] active:scale-95 active:neumorphic-inset transition-all duration-200",
                                        !isCurrentMonth && "opacity-40",
                                        isSelected && "active border-primary/40 bg-card ring-1 ring-primary/20",
                                        isToday && "ring-2 ring-primary/40 shadow-inner"
                                    )}
                                >
                                    {/* Day numerical label */}
                                    <div className="flex w-full items-center justify-between">
                                        <span className={cn(
                                            "text-sm font-semibold flex items-center justify-center size-6 rounded-lg",
                                            isToday && "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.3)]",
                                            isSelected && !isToday && "text-primary"
                                        )}>
                                            {date.getDate()}
                                        </span>

                                        {/* Indicator for today badge */}
                                        {isToday && !isSelected && (
                                            <span className="text-[9px] font-bold text-primary tracking-wider uppercase">TODAY</span>
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
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
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
