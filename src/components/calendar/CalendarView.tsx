"use client";

import { useEffect, useState, useMemo } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    ChevronLeft,
    ChevronRight,
    Wrench,
    FileText,
    MapPin,
    ArrowUpRight,
    CalendarCheck,
    X,
    Filter,
    Layers,
    LayoutGrid,
    Home,
    Calendar as CalendarIcon,
    StickyNote,
    Plus,
    Trash2,
    Clock,
    CreditCard
} from "lucide-react";
import Link from "next/link";
import { useCalendarNotes } from "@/hooks/useCalendarNotes";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    type: "payment" | "lease" | "maintenance" | "booking" | "note";
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
    actionLabel?: string;
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
        label: "Facilities",
        icon: CalendarIcon,
        activePill: "border-blue-500/35 bg-gradient-to-r from-blue-500/15 via-blue-500/10 to-blue-500/5 dark:from-[#132c4e] dark:via-[#0c1c34] dark:to-[#081224] shadow-[0_2px_12px_rgba(59,130,246,0.2),inset_0_1px_1px_rgba(255,255,255,0.15)] text-foreground dark:text-white",
        glow: "bg-blue-500/25 blur-sm",
        iconColor: "text-blue-500 dark:text-blue-400",
        badge: "bg-blue-500/15 dark:bg-black/40 border-blue-500/30 text-blue-700 dark:text-blue-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
    },
    note: {
        color: "bg-amber-500 text-amber-500 border-amber-500/25",
        bg: "bg-amber-500/10",
        dot: "bg-amber-500",
        label: "Notes & Reminders",
        icon: StickyNote,
        activePill: "border-amber-500/35 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 dark:from-[#3a2810] dark:via-[#251908] dark:to-[#170f04] shadow-[0_2px_12px_rgba(245,158,11,0.2),inset_0_1px_1px_rgba(255,255,255,0.15)] text-foreground dark:text-white",
        glow: "bg-amber-500/25 blur-sm",
        iconColor: "text-amber-500 dark:text-amber-400",
        badge: "bg-amber-500/15 dark:bg-black/40 border-amber-500/30 text-amber-700 dark:text-amber-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
    }
};

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface CalendarViewProps {
    role: "landlord" | "tenant";
    eventsEndpoint: string;
    notesEndpoint?: string;
    propertyId?: string;
    title?: string;
    subtitle?: string;
    emptyTitle?: string;
    emptySubtitle?: string;
}

export function CalendarView({
    role,
    eventsEndpoint,
    notesEndpoint,
    propertyId,
    title = role === "landlord" ? "Operations Calendar" : "My Schedule",
    subtitle = role === "landlord" 
        ? "Track upcoming payments, lease milestones, and maintenance events." 
        : "Keep track of your rent dues, lease dates, maintenance visits, and personal notes.",
    emptyTitle = role === "landlord" ? "Clean Schedule" : "All Clear",
    emptySubtitle = role === "landlord"
        ? "No upcoming utility dues, maintenance requests, or lease milestones for this date."
        : "No upcoming bills due, maintenance visits, or milestones for this date."
}: CalendarViewProps) {
    const { user } = useAuth();
    const effectiveNotesEndpoint = notesEndpoint || (role === "tenant" ? "/api/tenant/calendar/notes" : "/api/landlord/calendar/notes");
    const { notes, addNote, deleteNote } = useCalendarNotes({
        userId: user?.id,
        landlordId: role === "landlord" ? user?.id : undefined,
        apiEndpoint: effectiveNotesEndpoint
    });

    // Calendar view states
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Note form state
    const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
    const [noteTitle, setNoteTitle] = useState("");
    const [noteDescription, setNoteDescription] = useState("");
    const [isSavingNote, setIsSavingNote] = useState(false);

    // Filter toggles
    const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
        payment: true,
        lease: true,
        maintenance: true,
        booking: true,
        note: true
    });

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Fetch calendar events
    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            setError(null);
            try {
                const url = propertyId 
                    ? `${eventsEndpoint}${eventsEndpoint.includes("?") ? "&" : "?"}propertyId=${encodeURIComponent(propertyId)}`
                    : eventsEndpoint;

                const response = await fetch(url);
                if (!response.ok) throw new Error("Failed to fetch calendar events");
                const data = await response.json();
                setEvents(data.events || []);
            } catch (err: any) {
                console.error("Error loading calendar events:", err);
                setError(err.message || "Failed to load events");
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [eventsEndpoint, propertyId]);

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

    // Combine system events with user's personal calendar notes
    const allEvents = useMemo(() => {
        const noteEvents: CalendarEvent[] = notes.map((n) => ({
            id: n.id,
            title: n.title,
            date: n.date,
            type: "note" as const,
            status: "Note",
            description: n.description,
        }));
        return [...events, ...noteEvents];
    }, [events, notes]);

    // Pre-organize events by date for O(1) cell lookup
    const eventsByDate = useMemo(() => {
        const map: Record<string, CalendarEvent[]> = {};
        allEvents.forEach(event => {
            if (!event.date) return;
            const key = event.date.slice(0, 10);
            if (!map[key]) map[key] = [];
            map[key].push(event);
        });
        return map;
    }, [allEvents]);

    // Category count aggregates for filter buttons
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {
            payment: 0,
            lease: 0,
            maintenance: 0,
            booking: 0,
            note: 0
        };
        allEvents.forEach(e => {
            if (counts[e.type] !== undefined) counts[e.type]++;
        });
        return counts;
    }, [allEvents]);

    // Check if all filters are currently enabled
    const allFiltersActive = useMemo(() => {
        return Object.values(activeFilters).every(Boolean);
    }, [activeFilters]);

    // Toggle All filters
    const handleToggleAll = () => {
        if (allFiltersActive) {
            setActiveFilters({
                payment: false,
                lease: false,
                maintenance: false,
                booking: false,
                note: false
            });
        } else {
            setActiveFilters({
                payment: true,
                lease: true,
                maintenance: true,
                booking: true,
                note: true
            });
        }
    };

    // Toggle single category filter
    const toggleFilter = (type: string) => {
        setActiveFilters(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    // Events strictly for the selected date, sorted by priority/category
    const selectedDayEvents = useMemo(() => {
        const dateKey = formatDateKey(selectedDate);
        const dayEvents = eventsByDate[dateKey] || [];
        return dayEvents.filter(e => activeFilters[e.type]);
    }, [selectedDate, eventsByDate, activeFilters]);

    // Save personal calendar note
    const handleSaveNote = async () => {
        if (!noteTitle.trim()) return;
        setIsSavingNote(true);
        try {
            const dateKey = formatDateKey(selectedDate);
            const res = await addNote(dateKey, noteTitle, noteDescription);
            if (res.success) {
                toast.success("Personal note saved.");
                setNoteTitle("");
                setNoteDescription("");
                setIsAddNoteOpen(false);
            } else {
                toast.error(res.error || "Failed to save note.");
            }
        } catch {
            toast.error("Failed to save note.");
        } finally {
            setIsSavingNote(false);
        }
    };

    return (
        <div className={cn(
            "flex flex-col gap-6 max-w-[1600px] mx-auto min-h-[calc(100vh-5rem)]",
            role === "landlord" ? "p-4 sm:p-6 lg:p-8" : "w-full"
        )}>
            {/* Header section with month navigation and contextual info */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <CalendarIcon className="size-4.5 text-primary" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                            {title}
                        </h1>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {subtitle}
                    </p>
                </div>

                {/* Month navigation controls */}
                <div className="flex items-center gap-2 self-start md:self-auto">
                    <button
                        onClick={handleToday}
                        className="px-4 py-2 text-xs font-semibold rounded-xl neumorphic-extruded active:neumorphic-inset text-foreground transition-all duration-150"
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
                        <span className="px-3 text-sm font-semibold text-foreground min-w-[120px] text-center">
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
            <section className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl neumorphic-panel text-muted-foreground text-xs font-semibold select-none mr-0.5">
                    <Filter className="size-3.5 text-primary" />
                    <span>Filter Events:</span>
                </div>

                {/* "All" Pill */}
                <button
                    onClick={handleToggleAll}
                    className={cn(
                        "group relative flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-[0.97] cursor-pointer select-none overflow-hidden",
                        allFiltersActive
                            ? "border border-purple-500/35 bg-gradient-to-r from-purple-500/15 via-purple-500/10 to-purple-500/5 dark:from-[#2e1c4a] dark:via-[#1e1335] dark:to-[#170e28] shadow-[0_2px_12px_rgba(168,85,247,0.2),inset_0_1px_1px_rgba(255,255,255,0.18)] text-foreground dark:text-white"
                            : "neumorphic-extruded opacity-60 hover:opacity-100 text-muted-foreground"
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
                        {allEvents.length}
                    </span>
                </button>

                {/* Individual Category Pills */}
                {Object.entries(EVENT_TYPE_STYLES).map(([type, style]) => {
                    const Icon = style.icon;
                    const isActive = activeFilters[type];
                    const count = categoryCounts[type] || 0;

                    return (
                        <button
                            key={type}
                            onClick={() => toggleFilter(type)}
                            className={cn(
                                "group relative flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-[0.97] cursor-pointer select-none overflow-hidden",
                                isActive
                                    ? style.activePill
                                    : "neumorphic-extruded opacity-60 hover:opacity-100 text-muted-foreground"
                            )}
                            title={isActive ? `Click to hide ${style.label} events` : `Click to show ${style.label} events`}
                        >
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
                                <span className="text-xs font-medium text-muted-foreground animate-pulse">Syncing schedule...</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Day labels header */}
                    <div className="grid grid-cols-7 gap-3 mb-4">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="text-center text-xs font-bold text-muted-foreground uppercase tracking-wider py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Month Days Matrix */}
                    <div className="grid grid-cols-7 gap-2.5 sm:gap-3">
                        {calendarDays.map((item) => {
                            const dateKey = formatDateKey(item.date);
                            const dayEvents = (eventsByDate[dateKey] || []).filter(e => activeFilters[e.type]);
                            const isSelected = formatDateKey(selectedDate) === dateKey;
                            const isToday = formatDateKey(new Date()) === dateKey;

                            return (
                                <motion.button
                                    key={item.key}
                                    onClick={() => setSelectedDate(item.date)}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.97 }}
                                    className={cn(
                                        "neumorphic-extruded h-[80px] sm:h-[84px] xl:h-[88px] w-full rounded-2xl p-1.5 sm:p-2 flex flex-col justify-start relative group transition-all duration-150 text-left overflow-hidden hover:z-10 cursor-pointer",
                                        !item.isCurrentMonth && "opacity-35",
                                        isSelected
                                            ? "border-primary/60 dark:border-primary/50 ring-2 ring-primary/40 bg-primary/[0.08] shadow-lg"
                                            : "hover:scale-[1.01] active:scale-95 active:neumorphic-inset",
                                        isToday && !isSelected && "ring-1 ring-primary/40"
                                    )}
                                >
                                    <div className="flex items-center justify-between w-full shrink-0 mb-0.5">
                                        <span className={cn(
                                            "text-xs sm:text-sm font-semibold rounded-lg size-5 sm:size-5.5 flex items-center justify-center",
                                            isToday ? "bg-primary text-primary-foreground font-bold" : "text-foreground"
                                        )}>
                                            {item.date.getDate()}
                                        </span>

                                        {isToday && (
                                            <span className="size-1.5 rounded-full bg-primary animate-ping mr-1" />
                                        )}
                                    </div>

                                    {/* Event indicator preview pills */}
                                    <div className="flex flex-col gap-0.5 sm:gap-1 w-full min-w-0 overflow-hidden">
                                        {dayEvents.length <= 2 ? (
                                            dayEvents.map(event => {
                                                const styles = EVENT_TYPE_STYLES[event.type];
                                                return (
                                                    <div
                                                        key={event.id}
                                                        className={cn(
                                                            "text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 border shrink-0 leading-tight",
                                                            styles.color,
                                                            styles.bg
                                                        )}
                                                        title={event.title}
                                                    >
                                                        <span className={cn("size-1 rounded-full shrink-0", styles.dot)} />
                                                        <span className="truncate">{event.title}</span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <>
                                                {(() => {
                                                    const primaryEvent = dayEvents[0];
                                                    const styles = EVENT_TYPE_STYLES[primaryEvent.type];
                                                    return (
                                                        <div
                                                            className={cn(
                                                                "text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 border shrink-0 leading-tight",
                                                                styles.color,
                                                                styles.bg
                                                            )}
                                                            title={primaryEvent.title}
                                                        >
                                                            <span className={cn("size-1 rounded-full shrink-0", styles.dot)} />
                                                            <span className="truncate">{primaryEvent.title}</span>
                                                        </div>
                                                    );
                                                })()}
                                                <span
                                                    className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground/80 hover:text-foreground pl-1 transition-colors truncate block shrink-0"
                                                    title={dayEvents.slice(1).map(e => e.title).join(", ")}
                                                >
                                                    +{dayEvents.length - 1} more
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Interactive Details Side Drawer Panel */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                    <div className="neumorphic-panel rounded-3xl p-5 sm:p-6 flex flex-col min-h-[500px]">
                        <header className="border-b border-border/40 pb-4 mb-4 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                        <Layers className="size-4 text-primary" />
                                    </div>
                                    <h2 className="text-base font-semibold text-foreground tracking-tight truncate">
                                        Agenda Details
                                    </h2>
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-2/80 border border-border/50 text-muted-foreground shrink-0">
                                        {selectedDayEvents.length}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1.5 pl-0.5 text-xs text-muted-foreground">
                                    <span className="size-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
                                    <p className="truncate font-medium">
                                        {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAddNoteOpen((prev) => !prev)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 active:scale-95 shrink-0 border select-none cursor-pointer",
                                    isAddNoteOpen
                                        ? "bg-muted/70 text-foreground border-border/60 hover:bg-muted"
                                        : "bg-surface-2/70 hover:bg-surface-2 border-border/60 hover:border-amber-500/40 text-foreground hover:text-amber-500 dark:hover:text-amber-300 shadow-sm"
                                )}
                                title={isAddNoteOpen ? "Cancel note creation" : "Add note for this date"}
                            >
                                {isAddNoteOpen ? (
                                    <>
                                        <X className="size-3.5 text-muted-foreground" />
                                        <span>Cancel</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="size-3.5 text-amber-500" />
                                        <span>Add Note</span>
                                    </>
                                )}
                            </button>
                        </header>

                        {/* Inline Note Creation Form */}
                        <AnimatePresence>
                            {isAddNoteOpen && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="rounded-2xl p-3.5 sm:p-4 border border-border/60 bg-surface-2/40 dark:bg-black/30 mb-4 space-y-3 overflow-hidden shadow-inner"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                                            <StickyNote className="size-3.5 text-amber-500 shrink-0" />
                                            <span>New Note for {selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                                        </span>
                                        <button
                                            onClick={() => { setIsAddNoteOpen(false); setNoteTitle(""); setNoteDescription(""); }}
                                            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/40 transition-colors"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Note title or reminder (e.g. Schedule delivery)..."
                                        value={noteTitle}
                                        onChange={(e) => setNoteTitle(e.target.value)}
                                        maxLength={80}
                                        className="w-full rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none border border-border/50 bg-background/60 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 placeholder:text-muted-foreground/60 transition-all"
                                    />
                                    <textarea
                                        placeholder="Optional details, notes, or instructions..."
                                        value={noteDescription}
                                        onChange={(e) => setNoteDescription(e.target.value)}
                                        rows={2}
                                        maxLength={250}
                                        className="w-full rounded-xl p-3 text-xs text-foreground outline-none border border-border/50 bg-background/60 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 placeholder:text-muted-foreground/60 resize-none transition-all"
                                    />
                                    <div className="flex justify-end gap-2 pt-0.5">
                                        <button
                                            type="button"
                                            onClick={() => { setIsAddNoteOpen(false); setNoteTitle(""); setNoteDescription(""); }}
                                            className="px-3 py-1.5 text-xs font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!noteTitle.trim() || isSavingNote}
                                            onClick={handleSaveNote}
                                            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-black active:scale-95 disabled:opacity-40 shadow-sm transition-all flex items-center gap-1.5"
                                        >
                                            {isSavingNote ? "Saving..." : "Save Note"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* List items representation */}
                        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 max-h-[480px]">
                            {selectedDayEvents.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-card/25 rounded-2xl border border-border/10 shadow-inner">
                                    <div className="size-12 rounded-2xl bg-muted/30 border border-border/30 flex items-center justify-center mb-3 shadow-inner">
                                        <CalendarCheck className="size-6 text-muted-foreground/60" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-foreground">{emptyTitle}</h3>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[220px] mb-4 leading-relaxed">
                                        {emptySubtitle}
                                    </p>
                                    <button
                                        onClick={() => setIsAddNoteOpen(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-border/60 hover:border-amber-500/40 bg-surface-2/70 hover:bg-surface-2 text-foreground hover:text-amber-500 dark:hover:text-amber-300 transition-all duration-200 group active:scale-95 shadow-sm"
                                    >
                                        <Plus className="size-3.5 text-amber-500 group-hover:rotate-90 transition-transform duration-200" />
                                        <span>Add Note for this Date</span>
                                    </button>
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
                                                        event.status === "paid" || event.status === "Approved" || event.status === "resolved" || event.status === "Active"
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

                                                {/* Footer action / Note actions */}
                                                {event.type === "note" ? (
                                                    <div className="flex items-center justify-between border-t border-border/20 pt-2.5 mt-0.5">
                                                        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                                            <StickyNote className="size-3.5" />
                                                            <span>Personal Note</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                await deleteNote(event.id);
                                                                toast.success("Note removed.");
                                                            }}
                                                            className="text-xs font-medium text-muted-foreground hover:text-rose-500 flex items-center gap-1 px-2.5 py-1 rounded-xl border border-border/40 hover:border-rose-500/30 bg-surface-2/40 hover:bg-rose-500/10 active:scale-95 transition-all cursor-pointer"
                                                            title="Delete this note"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between border-t border-border/20 pt-3 mt-1 gap-2">
                                                        {role === "landlord" ? (
                                                            event.tenantName ? (
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
                                                                    <span>Milestone</span>
                                                                </div>
                                                            )
                                                        ) : (
                                                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                                <span className="font-medium">{event.unitName || "Your Home"}</span>
                                                            </div>
                                                        )}

                                                        {event.detailsUrl && (
                                                            <Link
                                                                href={event.detailsUrl}
                                                                className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 active:scale-95 transition-all duration-150 ml-auto"
                                                            >
                                                                {event.actionLabel || (role === "tenant" ? "View Details" : "Inspect")}
                                                                <ArrowUpRight className="size-3.5" />
                                                            </Link>
                                                        )}
                                                    </div>
                                                )}
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
