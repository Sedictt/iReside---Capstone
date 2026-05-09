"use client";

import { useState, useEffect } from "react";
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
    image_url: string | null;
    price_per_unit: number;
    unit_type: string;
    capacity: number | null;
    icon_name: string | null;
    location_details: string | null;
    status: string;
    property?: { name: string } | null;
}

interface Booking {
    id: string;
    amenity_id: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    total_price: number;
    status: string;
    notes: string | null;
    created_at: string;
    amenity: {
        id: string;
        name: string;
        type: string;
        icon_name: string | null;
        image_url: string | null;
        price_per_unit: number;
        unit_type: string;
        capacity: number | null;
        location_details: string | null;
    } | null;
}

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

// Helper to get icon component by name
const getIconByName = (name: string | null) => {
    if (!name) return LucideIcons.Zap;
    // @ts-expect-error - dynamic lookup
    const Icon = LucideIcons[name];
    return Icon || LucideIcons.Zap;
};

// Get color based on amenity type
const getAmenityColor = (type: string | null) => {
    switch (type?.toLowerCase()) {
        case 'room':
        case 'events':
            return 'bg-blue-500';
        case 'amenity':
        case 'leisure':
            return 'bg-emerald-500';
        case 'utility':
        case 'creative':
            return 'bg-purple-500';
        case 'sports':
            return 'bg-orange-500';
        default:
            return 'bg-primary';
    }
};

// Format date for display
const formatBookingDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
        return "Today, " + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return "Tomorrow, " + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

// Format time for display
const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
};

// Convert API amenity to BookingModalData
const amenityToModalData = (amenity: Amenity): BookingModalData => ({
    id: amenity.id,
    name: amenity.name,
    type: amenity.type,
    description: amenity.description || '',
    price: amenity.price_per_unit || 0,
    unit: amenity.unit_type || 'hour',
    capacity: amenity.capacity ? `${amenity.capacity} people` : 'N/A',
    image: amenity.image_url || '/amenities/default.png',
    icon_name: amenity.icon_name || 'Zap',
    color: getAmenityColor(amenity.type),
});

// Convert API booking to display format
interface DisplayBooking {
    id: string;
    name: string;
    date: string;
    time: string;
    status: string;
    type: string;
}

const bookingToDisplay = (booking: Booking): DisplayBooking => ({
    id: booking.id,
    name: booking.amenity?.name || 'Unknown Amenity',
    date: formatBookingDate(booking.booking_date),
    time: `${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`,
    status: booking.status === 'Approved' ? 'Confirmed' : booking.status,
    type: booking.total_price > 0 ? 'Rent' : 'Borrow',
});

export default function TenantUtilitiesPage() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [bookingModal, setBookingModal] = useState<BookingModalData | null>(null);
    
    // Data state
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Booking form state
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedDuration, setSelectedDuration] = useState<number>(2);
    const [bookingNotes, setBookingNotes] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const categories = ["All", "Events", "Leisure", "Creative", "Sports"];

    // Fetch amenities and bookings on mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch amenities
                const amenitiesRes = await fetch('/api/tenant/amenities', { cache: 'no-store' });
                const amenitiesData = await amenitiesRes.json();

                if (!amenitiesRes.ok) {
                    throw new Error(amenitiesData.error || 'Failed to load amenities');
                }

                // Fetch bookings
                const bookingsRes = await fetch('/api/tenant/amenities/bookings', { cache: 'no-store' });
                const bookingsData = await bookingsRes.json();

                if (!bookingsRes.ok) {
                    throw new Error(bookingsData.error || 'Failed to load bookings');
                }

                setAmenities(amenitiesData.amenities || []);
                setBookings(bookingsData.bookings || []);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
    }, []);

    // Handle booking submission
    const handleConfirmBooking = async () => {
        if (!bookingModal) return;

        setSubmitting(true);
        setSubmitError(null);

        try {
            // Calculate start and end time
            const now = new Date();
            const [hours, minutes] = now.getHours().toString().padStart(2, '0').split('');
            const baseHour = parseInt(`${hours}${minutes}`) >= 1200 ? 14 : 10; // Default to 10 AM or 2 PM
            
            const start_time = `${(baseHour).toString().padStart(2, '0')}:00`;
            const endHour = baseHour + selectedDuration;
            const end_time = `${endHour.toString().padStart(2, '0')}:00`;

            const res = await fetch('/api/tenant/amenities/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amenity_id: bookingModal.id,
                    booking_date: selectedDate || new Date().toISOString().split('T')[0],
                    start_time,
                    end_time,
                    notes: bookingNotes,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create booking');
            }

            // Add new booking to the list
            if (data.booking) {
                setBookings(prev => [data.booking, ...prev]);
            }

            // Close modal and reset form
            setBookingModal(null);
            setSelectedDate('');
            setSelectedDuration(2);
            setBookingNotes('');
        } catch (err) {
            console.error('Error creating booking:', err);
            setSubmitError(err instanceof Error ? err.message : 'Failed to create booking');
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate estimated cost
    const calculateEstimatedCost = () => {
        if (!bookingModal) return 0;
        if (bookingModal.price === 0 || bookingModal.unit === 'free') return 0;
        return bookingModal.price * selectedDuration;
    };

    // Filter amenities by category
    const filteredAmenities = amenities.filter(a => 
        selectedCategory === "All" || a.type?.toLowerCase() === selectedCategory.toLowerCase()
    );

    // Convert bookings to display format
    const displayBookings = bookings.map(bookingToDisplay);

    return (
        <div className="flex h-full w-full flex-col gap-8 bg-background text-foreground">
            {/* Hero Header Section */}
            <div className="relative overflow-hidden border-b border-border bg-card/20 px-6 py-10 md:px-12 md:py-16">
                <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
                
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
                {error && (
                    <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content: Discovery */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black tracking-tight">Available Facilities</h2>
                            <div className="flex gap-2">
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

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="ml-3 text-sm font-medium text-muted-foreground">Loading amenities...</span>
                            </div>
                        ) : filteredAmenities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
                                    <LucideIcons.Home className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">No amenities found</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {selectedCategory === "All" 
                                        ? "There are no available amenities in your property yet."
                                        : `No ${selectedCategory} amenities are available.`}
                                </p>
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
                                                src={amenity.image_url || '/amenities/default.png'} 
                                                alt={amenity.name} 
                                                fill 
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                            <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-lg", getAmenityColor(amenity.type))}>
                                                    {(() => {
                                                        const Icon = getIconByName(amenity.icon_name);
                                                        return <Icon className="h-4 w-4" />;
                                                    })()}
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-wider text-white drop-shadow-md">{amenity.type}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-1 flex-col p-6">
                                            <h3 className="text-xl font-black text-foreground">{amenity.name}</h3>
                                            <p className="mt-2 text-sm text-muted-foreground/80 line-clamp-2">{amenity.description || 'No description available.'}</p>
                                            
                                            <div className="mt-4 flex items-center gap-4 border-t border-border/50 pt-4">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                                    <Users className="h-3.5 w-3.5" />
                                                    {amenity.capacity ? `${amenity.capacity} people` : 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {amenity.location_details || amenity.property?.name || 'Main Building'}
                                                </div>
                                            </div>

                                            <div className="mt-6 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Booking Rate</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xl font-black text-foreground">
                                                            {amenity.unit_type === 'free' ? "Free" : `₱${amenity.price_per_unit}`}
                                                        </span>
                                                        {amenity.unit_type !== 'free' && amenity.unit_type && (
                                                            <span className="text-xs font-bold text-muted-foreground">/{amenity.unit_type}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => setBookingModal(amenityToModalData(amenity))}
                                                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
                                                >
                                                    {amenity.unit_type === 'free' ? "Borrow" : "Rent Now"}
                                                    <ArrowRight className="h-4 w-4" />
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
                                    <Calendar className="h-5 w-5 text-primary" />
                                    My Reservations
                                </h3>
                                <button className="text-xs font-bold text-primary hover:underline">View All</button>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : displayBookings.length === 0 ? (
                                <div className="flex flex-col items-center py-8 text-center">
                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                                        <LucideIcons.Calendar className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No reservations yet</p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">Book an amenity to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {displayBookings.map(booking => (
                                        <div key={booking.id} className="group relative rounded-2xl bg-muted/30 p-4 transition-all hover:bg-muted/50 border border-transparent hover:border-border">
                                            <div className="flex items-start justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-foreground">{booking.name}</span>
                                                    <span className="mt-1 text-xs font-bold text-muted-foreground">{booking.date}</span>
                                                    <span className="text-xs text-muted-foreground/70">{booking.time}</span>
                                                </div>
                                                <div className={cn(
                                                    "rounded-full p-1.5",
                                                    booking.status === "Confirmed" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                                )}>
                                                    {booking.status === "Confirmed" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{booking.type} Request</span>
                                                <button className="text-[10px] font-black uppercase text-primary opacity-0 transition-opacity group-hover:opacity-100">Cancel</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>


                        {/* Usage History Mini */}
                        <div className="flex items-center gap-4 rounded-2xl border border-dashed border-border p-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                                <LucideIcons.History className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold">Past Bookings</p>
                                <p className="text-xs">Review your facility usage history</p>
                            </div>
                            <LucideIcons.ChevronRight className="h-4 w-4" />
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
                                    <AlertCircle className="h-5 w-5 rotate-45" />
                                </button>
                            </div>

                            <div className="mb-6 flex items-center gap-4 rounded-2xl bg-muted/30 p-4">
                                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-white", bookingModal.color)}>
                                    {(() => {
                                        const Icon = getIconByName(bookingModal.icon_name);
                                        return <Icon className="h-6 w-6" />;
                                    })()}
                                </div>
                                <div>
                                    <p className="font-black text-foreground">{bookingModal.name}</p>
                                    <p className="text-xs text-muted-foreground">{bookingModal.type} • {bookingModal.capacity}</p>
                                </div>
                            </div>

                            {submitError && (
                                <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                                    {submitError}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Date</label>
                                        <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-3">
                                            <Calendar className="h-4 w-4 text-primary" />
                                            <input 
                                                type="date" 
                                                className="flex-1 bg-transparent text-sm font-medium outline-none"
                                                value={selectedDate}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Duration</label>
                                        <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-3">
                                            <Clock className="h-4 w-4 text-primary" />
                                            <select 
                                                className="flex-1 bg-transparent text-sm font-medium outline-none"
                                                value={selectedDuration}
                                                onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
                                            >
                                                <option value={1}>1 Hour</option>
                                                <option value={2}>2 Hours</option>
                                                <option value={3}>3 Hours</option>
                                                <option value={4}>4 Hours</option>
                                                <option value={6}>6 Hours</option>
                                                <option value={8}>Full Day</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Notes (Optional)</label>
                                    <textarea 
                                        placeholder="Tell us about your event..."
                                        className="min-h-[100px] w-full rounded-xl border border-border bg-background p-3 text-sm outline-none ring-primary/20 focus:ring-2"
                                        value={bookingNotes}
                                        onChange={(e) => setBookingNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Estimated Cost</span>
                                    <span className="text-2xl font-black text-foreground">
                                        {calculateEstimatedCost() === 0 ? "Free" : `₱${calculateEstimatedCost()}`}
                                    </span>
                                </div>
                                <button 
                                    onClick={handleConfirmBooking}
                                    disabled={submitting}
                                    className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Confirm Request
                                        </>
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