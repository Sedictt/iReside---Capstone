"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { 
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    MapPin,
    Users,
    Calendar,
    Clock,
    Loader2
} from "lucide-react";
import * as LucideIcons from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Amenity {
    id: string;
    name: string;
    type: string;
    description: string | null;
    price_per_unit: number;
    unit_type: string;
    capacity: number | null;
    image_url: string | null;
    icon_name: string | null;
    location_details: string | null;
    property?: { name: string } | null;
}

interface AmenityBooking {
    id: string;
    amenity_id: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    total_price: number;
    status: string;
    notes: string | null;
    amenity: {
        id: string;
        name: string;
        type: string;
        icon_name: string | null;
        image_url: string | null;
        price_per_unit: number;
        unit_type: string;
        capacity: number | null;
    };
}

// Type to color mapping
const TYPE_COLORS: Record<string, string> = {
    'Events': 'bg-blue-500',
    'Leisure': 'bg-emerald-500',
    'Creative': 'bg-purple-500',
    'Sports': 'bg-orange-500',
};

const getColorByType = (type: string): string => {
    return TYPE_COLORS[type] ?? 'bg-gray-500';
};

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    'pending': { label: 'Pending Approval', color: 'bg-amber-500/10 text-amber-600' },
    'confirmed': { label: 'Confirmed', color: 'bg-emerald-500/10 text-emerald-600' },
    'cancelled': { label: 'Cancelled', color: 'bg-red-500/10 text-red-600' },
};

// Helper to get icon component by name
const getIconByName = (name: string | null) => {
    if (!name) return LucideIcons.Zap;
    // @ts-expect-error - dynamic lookup
    const Icon = LucideIcons[name];
    return Icon || LucideIcons.Zap;
};

// Date formatting
const formatBookingDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

// Time formatting
const formatBookingTime = (start: string, end: string): string => {
    const formatTime = (t: string) => {
        const [hours, minutes] = t.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };
    return `${formatTime(start)} - ${formatTime(end)}`;
};

interface BookingModalData {
    id: string;
    name: string;
    type: string;
    description: string;
    price: number;
    unit: string;
    capacity: string;
    image: string;
    icon_name: string;
    color: string;
}

export default function TenantUtilitiesPage() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [bookingModal, setBookingModal] = useState<BookingModalData | null>(null);
    
    // Data state
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [bookings, setBookings] = useState<AmenityBooking[]>([]);
    const [categories, setCategories] = useState<string[]>(["All"]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Booking form state
    const [bookingDate, setBookingDate] = useState("");
    const [bookingDuration, setBookingDuration] = useState("2 Hours");
    const [bookingNotes, setBookingNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [amenitiesRes, bookingsRes] = await Promise.all([
                    fetch("/api/tenant/amenities"),
                    fetch("/api/tenant/amenities/bookings")
                ]);

                if (!amenitiesRes.ok || !bookingsRes.ok) {
                    throw new Error("Failed to load data");
                }

                const amenitiesData = await amenitiesRes.json();
                const bookingsData = await bookingsRes.json();

                setAmenities(amenitiesData.amenities || []);
                setCategories(amenitiesData.categories || ["All"]);
                setBookings(bookingsData.bookings || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Handle booking cancellation
    const handleCancelBooking = useCallback(async (bookingId: string) => {
        try {
            const res = await fetch(`/api/tenant/amenities/bookings/${bookingId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Failed to cancel booking");
            }

            // Update local state
            setBookings(prev => 
                prev.map(b => 
                    b.id === bookingId ? { ...b, status: "cancelled" } : b
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to cancel booking");
        }
    }, []);

    // Handle booking submission
    const handleSubmitBooking = useCallback(async () => {
        if (!bookingModal || !bookingDate) return;

        setSubmitting(true);
        try {
            // Calculate times based on duration
            const startHour = 14; // Default 2 PM
            const durationHours = bookingDuration === "All Day" ? 8 : 
                                  bookingDuration === "4 Hours" ? 4 : 2;
            const endHour = startHour + durationHours;

            const start_time = `${String(startHour).padStart(2, '0')}:00:00`;
            const end_time = `${String(endHour).padStart(2, '0')}:00:00`;

            const res = await fetch("/api/tenant/amenities/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amenity_id: bookingModal.id,
                    booking_date: bookingDate,
                    start_time,
                    end_time,
                    notes: bookingNotes || undefined,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to create booking");
            }

            const { booking: newBooking } = await res.json();
            
            // Add new booking to list
            setBookings(prev => [newBooking, ...prev]);
            
            // Close modal and reset form
            setBookingModal(null);
            setBookingDate("");
            setBookingDuration("2 Hours");
            setBookingNotes("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create booking");
        } finally {
            setSubmitting(false);
        }
    }, [bookingModal, bookingDate, bookingDuration, bookingNotes]);

    // Prepare modal data from amenity
    const openBookingModal = (amenity: Amenity) => {
        const modalData: BookingModalData = {
            id: amenity.id,
            name: amenity.name,
            type: amenity.type,
            description: amenity.description || "",
            price: amenity.price_per_unit,
            unit: amenity.unit_type,
            capacity: amenity.capacity ? `${amenity.capacity} people` : "N/A",
            image: amenity.image_url || "/amenities/default.png",
            icon_name: amenity.icon_name || "Zap",
            color: getColorByType(amenity.type),
        };
        setBookingModal(modalData);
        setBookingDate("");
        setBookingNotes("");
    };

    // Filter amenities by category
    const filteredAmenities = amenities.filter(
        a => selectedCategory === "All" || a.type === selectedCategory
    );

    // Calculate estimated cost
    const estimatedCost = bookingModal 
        ? (() => {
            const hours = bookingDuration === "All Day" ? 8 : 
                          bookingDuration === "4 Hours" ? 4 : 2;
            return bookingModal.price === 0 ? "Free" : `₱${bookingModal.price * hours}`;
        })()
        : "₱0";

    return (
        <div className="flex h-full w-full flex-col gap-8 bg-background text-foreground">
            {/* Hero Header Section - High Fidelity */}
            <div className="relative overflow-hidden border-b border-border bg-card/20 px-6 py-10 md:px-12 md:py-16">
                <div className="absolute -right-24 -top-24 size-96 rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute -left-24 -bottom-24 size-96 rounded-full bg-primary/5 blur-[120px]" />
                
                <div className="relative z-10 mx-auto max-w-7xl">
                    <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <motion.span 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex h-6 items-center rounded-full bg-primary/10 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-primary"
                                >
                                    Facilities
                                </motion.span>
                                <span className="h-px w-12 bg-border" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Community Access</span>
                            </div>
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl font-black tracking-tight text-foreground md:text-6xl lg:text-7xl"
                            >
                                Building <span className="text-primary">Amenities</span>
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="max-w-xl text-lg font-medium text-muted-foreground/80 leading-relaxed"
                            >
                                Discover and manage shared facilities, equipment, and services available in your residence.
                            </motion.p>
                        </section>
                    </div>
                </div>
            </div>

            <div className="mx-auto w-full max-w-7xl space-y-12 p-6 md:p-12">
                {/* Error State */}
                {error && (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-600">
                        <p className="font-medium">{error}</p>
                        <button 
                            onClick={() => setError(null)}
                            className="mt-2 text-sm underline"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content: Discovery */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black tracking-tight">Available Facilities</h2>
                            <div className="flex gap-2 flex-wrap">
                                {categories.map(cat => (
                                    <button 
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "rounded-full px-4 py-1.5 text-xs font-bold transition-all",
                                            selectedCategory === cat 
                                                ? "bg-primary text-primary-foreground shadow-md" 
                                                : "bg-muted text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Loading Skeleton */}
                        {loading ? (
                            <div className="grid gap-6 sm:grid-cols-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-96 animate-pulse rounded-3xl bg-muted" />
                                ))}
                            </div>
                        ) : filteredAmenities.length === 0 ? (
                            /* Empty State */
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-muted-foreground">No amenities available{selectedCategory !== "All" ? ` in ${selectedCategory}` : ""}.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-2">
                                {filteredAmenities.map((amenity, i) => (
                                    <motion.div
                                        key={amenity.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                                    >
                                        <div className="relative h-48 w-full overflow-hidden">
                                            <Image 
                                                src={amenity.image_url || "/amenities/default.png"} 
                                                alt={amenity.name} 
                                                fill 
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                            <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                                <div className={cn("flex size-8 items-center justify-center rounded-lg text-white shadow-lg", getColorByType(amenity.type))}>
                                                    {(() => {
                                                        const Icon = getIconByName(amenity.icon_name);
                                                        return <Icon className="size-4" />;
                                                    })()}
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-wider text-white drop-shadow-md">{amenity.type}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-1 flex-col p-6">
                                            <h3 className="text-xl font-black text-foreground">{amenity.name}</h3>
                                            <p className="mt-2 text-sm text-muted-foreground/80 line-clamp-2">{amenity.description || "No description available."}</p>
                                            
                                            <div className="mt-4 flex items-center gap-4 border-t border-border/50 pt-4">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                                    <Users className="size-3.5" />
                                                    {amenity.capacity ? `${amenity.capacity} people` : "N/A"}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                                    <MapPin className="size-3.5" />
                                                    {amenity.location_details || "N/A"}
                                                </div>
                                            </div>

                                            <div className="mt-6 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Booking Rate</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xl font-black text-foreground">
                                                            {amenity.price_per_unit === 0 ? "Free" : `₱${amenity.price_per_unit}`}
                                                        </span>
                                                        {amenity.price_per_unit > 0 && <span className="text-xs font-bold text-muted-foreground">/{amenity.unit_type}</span>}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => openBookingModal(amenity)}
                                                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
                                                >
                                                    {amenity.price_per_unit === 0 ? "Borrow" : "Rent Now"}
                                                    <ArrowRight className="size-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar Content: My Bookings & History */}
                    <div className="flex flex-col gap-8">
                        {/* Current Reservations */}
                        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-black tracking-tight flex items-center gap-2">
                                    <Calendar className="size-5 text-primary" />
                                    My Reservations
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    <div className="space-y-4">
                                        {[1, 2].map(i => (
                                            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
                                        ))}
                                    </div>
                                ) : bookings.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-4 text-center">No reservations yet.</p>
                                ) : (
                                    bookings
                                        .filter(b => b.status !== 'cancelled')
                                        .slice(0, 5)
                                        .map(booking => {
                                            const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG['pending'];
                                            return (
                                                <div key={booking.id} className="group relative rounded-2xl bg-muted/30 p-4 transition-all hover:bg-muted/50 border border-transparent hover:border-border">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-foreground">{booking.amenity.name}</span>
                                                            <span className="mt-1 text-xs font-bold text-muted-foreground">{formatBookingDate(booking.booking_date)}</span>
                                                            <span className="text-xs text-muted-foreground/70">{formatBookingTime(booking.start_time, booking.end_time)}</span>
                                                        </div>
                                                        <div className={cn("rounded-full p-1.5", statusConfig.color)}>
                                                            {booking.status === 'confirmed' ? (
                                                                <CheckCircle2 className="size-4" />
                                                            ) : (
                                                                <AlertCircle className="size-4" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                            {booking.total_price === 0 ? "Free" : `₱${booking.total_price}`}
                                                        </span>
                                                        {booking.status === 'pending' && (
                                                            <button 
                                                                onClick={() => handleCancelBooking(booking.id)}
                                                                className="text-[10px] font-black uppercase text-red-500 opacity-0 transition-opacity group-hover:opacity-100"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </section>

                        {/* Usage History Mini */}
                        <div className="flex items-center gap-4 rounded-2xl border border-dashed border-border p-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
                            <div className="flex size-10 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                                <LucideIcons.History className="size-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold">Past Bookings</p>
                                <p className="text-xs">Review your facility usage history</p>
                            </div>
                            <LucideIcons.ChevronRight className="size-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            <AnimatePresence>
                {bookingModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setBookingModal(null)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg rounded-[2.5rem] border border-border bg-card p-8 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-black">Request Access</h3>
                                <button onClick={() => setBookingModal(null)} className="rounded-full bg-muted p-2 hover:bg-muted-foreground/10">
                                    <AlertCircle className="size-5 rotate-45" />
                                </button>
                            </div>

                            <div className="mb-6 flex items-center gap-4 rounded-2xl bg-muted/30 p-4">
                                <div className={cn("flex size-12 items-center justify-center rounded-xl text-white", bookingModal.color)}>
                                    {(() => {
                                        const Icon = getIconByName(bookingModal.icon_name);
                                        return <Icon className="size-6" />;
                                    })()}
                                </div>
                                <div>
                                    <p className="font-black text-foreground">{bookingModal.name}</p>
                                    <p className="text-xs text-muted-foreground">{bookingModal.type} • {bookingModal.capacity}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="booking-date" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Date</label>
                                        <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-3">
                                            <Calendar className="size-4 text-primary" />
                                            <input 
                                                id="booking-date"
                                                type="date" 
                                                value={bookingDate}
                                                onChange={(e) => setBookingDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="bg-transparent text-sm font-medium outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="booking-duration" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Duration</label>
                                        <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-3">
                                            <Clock className="size-4 text-primary" />
                                            <select 
                                                id="booking-duration"
                                                value={bookingDuration}
                                                onChange={(e) => setBookingDuration(e.target.value)}
                                                className="bg-transparent text-sm font-medium outline-none"
                                            >
                                                <option value="2 Hours">2 Hours</option>
                                                <option value="4 Hours">4 Hours</option>
                                                <option value="All Day">All Day</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="booking-notes" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Notes (Optional)</label>
                                    <textarea 
                                        id="booking-notes"
                                        placeholder="Tell us about your event..."
                                        value={bookingNotes}
                                        onChange={(e) => setBookingNotes(e.target.value)}
                                        className="min-h-[100px] w-full rounded-xl border border-border bg-background p-3 text-sm outline-none ring-primary/20 focus:ring-2"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Estimated Cost</span>
                                    <span className="text-2xl font-black text-foreground">
                                        {estimatedCost}
                                    </span>
                                </div>
                                <button 
                                    onClick={handleSubmitBooking}
                                    disabled={!bookingDate || submitting}
                                    className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Confirm Request"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}