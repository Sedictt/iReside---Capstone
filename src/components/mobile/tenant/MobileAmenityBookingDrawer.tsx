'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Sparkles,
    Calendar,
    Clock,
    Users,
    MapPin,
    CheckCircle2,
    ChevronLeft,
    Loader2,
    Info,
    CalendarCheck,
    Tag,
    Trash2,
    RefreshCw
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { toast } from 'sonner';

export interface Amenity {
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
    status?: string;
    property?: { name: string } | null;
}

export interface AmenityBooking {
    id: string;
    amenity_id: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    total_price: number;
    status: string;
    notes: string | null;
    created_at?: string;
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

interface MobileAmenityBookingDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initialAmenityId?: string | null;
}

const DURATION_OPTIONS = [
    { label: '1 Hr', hours: 1 },
    { label: '2 Hrs', hours: 2 },
    { label: '3 Hrs', hours: 3 },
    { label: '4 Hrs', hours: 4 },
    { label: 'Full Day (8h)', hours: 8 },
];

const TIME_SLOTS = [
    { label: '08:00 AM', value: '08:00:00' },
    { label: '10:00 AM', value: '10:00:00' },
    { label: '12:00 PM', value: '12:00:00' },
    { label: '01:00 PM', value: '13:00:00' },
    { label: '02:00 PM', value: '14:00:00' },
    { label: '04:00 PM', value: '16:00:00' },
    { label: '06:00 PM', value: '18:00:00' },
    { label: '08:00 PM', value: '20:00:00' },
];

const getAmenityIcon = (name: string | null) => {
    if (!name) return LucideIcons.Sparkles;
    // @ts-expect-error - dynamic lucide lookup
    const Icon = LucideIcons[name];
    return Icon || LucideIcons.Sparkles;
};

const formatBookingTime = (start: string, end: string): string => {
    const parse = (t: string) => {
        const [h, m] = t.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    };
    return `${parse(start)} - ${parse(end)}`;
};

const formatBookingDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

export function MobileAmenityBookingDrawer({
    isOpen,
    onClose,
    initialAmenityId,
}: MobileAmenityBookingDrawerProps) {
    const [activeTab, setActiveTab] = useState<'browse' | 'my-bookings'>('browse');
    const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);

    // Data state
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [bookings, setBookings] = useState<AmenityBooking[]>([]);
    const [categories, setCategories] = useState<string[]>(['All']);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    // Booking form state
    const [bookingDate, setBookingDate] = useState<string>('');
    const [startTime, setStartTime] = useState<string>('14:00:00');
    const [durationHours, setDurationHours] = useState<number>(2);
    const [bookingNotes, setBookingNotes] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    // Initialize minimum date (today)
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [amenitiesRes, bookingsRes] = await Promise.all([
                fetch('/api/tenant/amenities', { cache: 'no-store' }),
                fetch('/api/tenant/amenities/bookings', { cache: 'no-store' }),
            ]);

            if (amenitiesRes.ok) {
                const amData = await amenitiesRes.json();
                const fetchedAmenities = amData.amenities || [];
                setAmenities(fetchedAmenities);
                setCategories(amData.categories || ['All']);

                if (initialAmenityId) {
                    const match = fetchedAmenities.find((a: Amenity) => a.id === initialAmenityId);
                    if (match) setSelectedAmenity(match);
                }
            }

            if (bookingsRes.ok) {
                const bkData = await bookingsRes.json();
                setBookings(bkData.bookings || []);
            }
        } catch (err) {
            console.error('[MobileAmenityBookingDrawer] load error:', err);
            toast.error('Failed to load amenities data.');
        } finally {
            setLoading(false);
        }
    }, [initialAmenityId]);

    useEffect(() => {
        if (isOpen) {
            fetchAllData();
            if (!bookingDate) {
                setBookingDate(todayStr);
            }
        } else {
            setSelectedAmenity(null);
            setBookingNotes('');
        }
    }, [isOpen, fetchAllData, todayStr, bookingDate]);

    // Handle Quick Date Chips
    const handleSetQuickDate = (offsetDays: number) => {
        triggerHaptic('light');
        const target = new Date();
        target.setDate(target.getDate() + offsetDays);
        setBookingDate(target.toISOString().split('T')[0]);
    };

    // Calculate End Time
    const calculatedEndTime = useMemo(() => {
        const startHour = parseInt(startTime.split(':')[0], 10);
        const endHour = Math.min(23, startHour + durationHours);
        return `${String(endHour).padStart(2, '0')}:00:00`;
    }, [startTime, durationHours]);

    // Calculate Estimated Price
    const estimatedPrice = useMemo(() => {
        if (!selectedAmenity) return 0;
        return (selectedAmenity.price_per_unit || 0) * durationHours;
    }, [selectedAmenity, durationHours]);

    // Filtered Amenities
    const filteredAmenities = useMemo(() => {
        if (selectedCategory === 'All') return amenities;
        return amenities.filter((a) => a.type.toLowerCase() === selectedCategory.toLowerCase());
    }, [amenities, selectedCategory]);

    // Create Booking
    const handleConfirmBooking = async () => {
        if (!selectedAmenity) return;
        if (!bookingDate) {
            toast.error('Please choose a reservation date.');
            return;
        }

        setSubmitting(true);
        triggerHaptic('medium');

        try {
            const res = await fetch('/api/tenant/amenities/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amenity_id: selectedAmenity.id,
                    booking_date: bookingDate,
                    start_time: startTime,
                    end_time: calculatedEndTime,
                    notes: bookingNotes.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to submit reservation.');
            }

            const { booking: newBooking } = await res.json();
            setBookings((prev) => [newBooking, ...prev]);

            triggerHaptic('success');
            toast.success(`Reservation requested for ${selectedAmenity.name}!`);

            // Switch to reservations tab and clear form
            setSelectedAmenity(null);
            setBookingNotes('');
            setActiveTab('my-bookings');
        } catch (err) {
            triggerHaptic('error');
            const msg = err instanceof Error ? err.message : 'Reservation failed.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // Cancel Booking
    const handleCancelBooking = async (bookingId: string) => {
        setCancellingId(bookingId);
        triggerHaptic('light');

        try {
            const res = await fetch(`/api/tenant/amenities/bookings/${bookingId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Could not cancel booking.');
            }

            setBookings((prev) =>
                prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
            );
            triggerHaptic('success');
            toast.success('Reservation cancelled.');
        } catch (err) {
            triggerHaptic('error');
            toast.error(err instanceof Error ? err.message : 'Cancellation failed.');
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-end justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
                    />

                    {/* Bottom Sheet Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="relative z-10 w-full max-w-lg rounded-t-[2.5rem] border-t border-border/80 bg-card text-card-foreground shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                    >
                        {/* Drag Handle Indicator */}
                        <div className="pt-3 pb-1 shrink-0 flex justify-center">
                            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
                        </div>

                        {/* Sheet Header */}
                        <div className="px-5 pt-2 pb-3.5 border-b border-border/50 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                {selectedAmenity ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic('light');
                                            setSelectedAmenity(null);
                                        }}
                                        className="size-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                                        aria-label="Back to list"
                                    >
                                        <ChevronLeft className="size-5" />
                                    </button>
                                ) : (
                                    <div className="size-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                                        <Sparkles className="size-5" />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <h3 className="text-base font-black tracking-tight text-foreground truncate">
                                        {selectedAmenity ? `Reserve ${selectedAmenity.name}` : 'Property Amenities'}
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                        {selectedAmenity
                                            ? (selectedAmenity.location_details || 'Select your reservation slot')
                                            : 'Browse facilities & reserve your session'}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic('light');
                                    onClose();
                                }}
                                className="size-8 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                                aria-label="Close Drawer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Tab Switcher (Only if not in booking sub-view) */}
                        {!selectedAmenity && (
                            <div className="px-5 pt-3 pb-1 shrink-0">
                                <div className="grid grid-cols-2 p-1 rounded-2xl bg-muted/50 border border-border/50">
                                    <button
                                        type="button"
                                        data-testid="tab-browse"
                                        onClick={() => {
                                            triggerHaptic('light');
                                            setActiveTab('browse');
                                        }}
                                        className={cn(
                                            'py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                                            activeTab === 'browse'
                                                ? 'bg-card text-foreground shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        <Sparkles className="size-3.5" />
                                        <span>Browse Facilities</span>
                                        {amenities.length > 0 && (
                                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/15 text-primary font-black">
                                                {amenities.length}
                                            </span>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        data-testid="tab-my-bookings"
                                        onClick={() => {
                                            triggerHaptic('light');
                                            setActiveTab('my-bookings');
                                        }}
                                        className={cn(
                                            'py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                                            activeTab === 'my-bookings'
                                                ? 'bg-card text-foreground shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        <CalendarCheck className="size-3.5" />
                                        <span>My Bookings</span>
                                        {bookings.length > 0 && (
                                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/15 text-emerald-600 font-black">
                                                {bookings.filter((b) => b.status !== 'cancelled').length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Drawer Body Scroll Area */}
                        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
                            {/* VIEW A: BOOKING FORM FOR SELECTED AMENITY */}
                            {selectedAmenity ? (
                                <div className="space-y-4 pb-12">
                                    {/* Amenity Overview Card */}
                                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 flex items-start gap-3">
                                        <div className="relative size-16 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/40">
                                            {selectedAmenity.image_url ? (
                                                <Image
                                                    src={selectedAmenity.image_url}
                                                    alt={selectedAmenity.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-primary/40">
                                                    <Sparkles className="size-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary">
                                                <Tag className="size-3" />
                                                <span>{selectedAmenity.type}</span>
                                            </div>
                                            <h4 className="text-sm font-bold text-foreground truncate">
                                                {selectedAmenity.name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Users className="size-3 text-muted-foreground" />
                                                    {selectedAmenity.capacity || 1} pax
                                                </span>
                                                <span>•</span>
                                                <span className="font-bold text-foreground">
                                                    {selectedAmenity.price_per_unit === 0
                                                        ? 'Complimentary'
                                                        : `₱${selectedAmenity.price_per_unit} / ${selectedAmenity.unit_type || 'hr'}`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 1: Select Date */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                                <Calendar className="size-3.5 text-primary" />
                                                <span>1. Reservation Date</span>
                                            </label>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetQuickDate(0)}
                                                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-muted hover:bg-muted/80 text-foreground transition-all active:scale-95"
                                                >
                                                    Today
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetQuickDate(1)}
                                                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-muted hover:bg-muted/80 text-foreground transition-all active:scale-95"
                                                >
                                                    Tomorrow
                                                </button>
                                            </div>
                                        </div>

                                        <input
                                            type="date"
                                            min={todayStr}
                                            value={bookingDate}
                                            onChange={(e) => setBookingDate(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-2xl bg-card border border-border/70 text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>

                                    {/* Step 2: Select Start Time Slot */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                            <Clock className="size-3.5 text-primary" />
                                            <span>2. Start Time Slot</span>
                                        </label>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {TIME_SLOTS.map((slot) => {
                                                const isSelected = startTime === slot.value;
                                                return (
                                                    <button
                                                        key={slot.value}
                                                        type="button"
                                                        onClick={() => {
                                                            triggerHaptic('light');
                                                            setStartTime(slot.value);
                                                        }}
                                                        className={cn(
                                                            'py-2 px-1 rounded-xl text-[11px] font-bold border transition-all active:scale-95 text-center',
                                                            isSelected
                                                                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                                                : 'bg-card hover:bg-muted text-foreground border-border/70'
                                                        )}
                                                    >
                                                        {slot.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Step 3: Duration Selection */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                            <Clock className="size-3.5 text-primary" />
                                            <span>3. Duration</span>
                                        </label>
                                        <div className="grid grid-cols-5 gap-1.5">
                                            {DURATION_OPTIONS.map((opt) => {
                                                const isSelected = durationHours === opt.hours;
                                                return (
                                                    <button
                                                        key={opt.hours}
                                                        type="button"
                                                        onClick={() => {
                                                            triggerHaptic('light');
                                                            setDurationHours(opt.hours);
                                                        }}
                                                        className={cn(
                                                            'py-2 px-1 rounded-xl text-[11px] font-bold border transition-all active:scale-95 text-center',
                                                            isSelected
                                                                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                                                : 'bg-card hover:bg-muted text-foreground border-border/70'
                                                        )}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Step 4: Notes (Optional) */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                            <Info className="size-3.5 text-primary" />
                                            <span>4. Notes or Special Requests (Optional)</span>
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={bookingNotes}
                                            onChange={(e) => setBookingNotes(e.target.value)}
                                            placeholder="e.g., Bringing 4 guests, need extra chairs..."
                                            className="w-full px-3.5 py-2.5 rounded-2xl bg-card border border-border/70 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-muted-foreground/60"
                                        />
                                    </div>

                                    {/* Calculated Summary Callout */}
                                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground font-medium">Time window:</span>
                                            <span className="font-bold text-foreground">
                                                {formatBookingDate(bookingDate)} • {formatBookingTime(startTime, calculatedEndTime)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs pt-1 border-t border-primary/10">
                                            <span className="text-muted-foreground font-medium">Estimated Fee:</span>
                                            <span className="text-sm font-black text-primary">
                                                {estimatedPrice === 0 ? 'Complimentary (₱0.00)' : `₱${estimatedPrice.toLocaleString()}`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="button"
                                        disabled={submitting || !bookingDate}
                                        onClick={handleConfirmBooking}
                                        className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-sm tracking-wide shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                <span>Submitting Reservation...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="size-4" />
                                                <span>Confirm Facility Reservation</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : activeTab === 'browse' ? (
                                /* VIEW B: BROWSE AMENITIES */
                                <div className="space-y-3 pb-12">
                                    {/* Category Filter Pills */}
                                    {categories.length > 1 && (
                                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                            {categories.map((cat) => {
                                                const isSelected = selectedCategory === cat;
                                                return (
                                                    <button
                                                        key={cat}
                                                        type="button"
                                                        onClick={() => {
                                                            triggerHaptic('light');
                                                            setSelectedCategory(cat);
                                                        }}
                                                        className={cn(
                                                            'px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 border',
                                                            isSelected
                                                                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                                                : 'bg-muted/60 text-muted-foreground hover:text-foreground border-border/40'
                                                        )}
                                                    >
                                                        {cat}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Loading State */}
                                    {loading ? (
                                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                                            <Loader2 className="size-6 animate-spin text-primary" />
                                            <p className="text-xs text-muted-foreground font-medium">Loading facilities...</p>
                                        </div>
                                    ) : filteredAmenities.length === 0 ? (
                                        /* Empty State */
                                        <div className="py-12 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-border/70">
                                            <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
                                                <Sparkles className="size-6" />
                                            </div>
                                            <h4 className="text-sm font-bold text-foreground mb-1">No Amenities Listed</h4>
                                            <p className="text-xs text-muted-foreground max-w-xs">
                                                There are currently no active amenities available for this property under this category.
                                            </p>
                                        </div>
                                    ) : (
                                        /* Amenity Cards List */
                                        <div className="grid grid-cols-1 gap-3">
                                            {filteredAmenities.map((amenity) => {
                                                const IconComp = getAmenityIcon(amenity.icon_name);
                                                return (
                                                    <div
                                                        key={amenity.id}
                                                        className="rounded-2xl p-3.5 bg-card border border-border/70 shadow-xs hover:border-primary/40 transition-all flex flex-col gap-3 group"
                                                    >
                                                        <div className="flex items-start gap-3.5">
                                                            <div className="relative size-16 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/40">
                                                                {amenity.image_url ? (
                                                                    <Image
                                                                        src={amenity.image_url}
                                                                        alt={amenity.name}
                                                                        fill
                                                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors">
                                                                        <IconComp className="size-7" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                                                        {amenity.type}
                                                                    </span>
                                                                    <span className="text-xs font-black text-foreground shrink-0">
                                                                        {amenity.price_per_unit === 0
                                                                            ? 'Free'
                                                                            : `₱${amenity.price_per_unit} / ${amenity.unit_type || 'hr'}`}
                                                                    </span>
                                                                </div>

                                                                <h4 className="text-sm font-bold text-foreground truncate">
                                                                    {amenity.name}
                                                                </h4>

                                                                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                                                                    <span className="flex items-center gap-1 truncate">
                                                                        <MapPin className="size-3 text-muted-foreground shrink-0" />
                                                                        <span className="truncate">{amenity.location_details || 'Main Grounds'}</span>
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span className="flex items-center gap-1 shrink-0">
                                                                        <Users className="size-3 text-muted-foreground" />
                                                                        {amenity.capacity || 0} pax
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {amenity.description && (
                                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                                {amenity.description}
                                                            </p>
                                                        )}

                                                        <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-3">
                                                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                                                <CheckCircle2 className="size-3" />
                                                                <span>Available for booking</span>
                                                            </span>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    triggerHaptic('medium');
                                                                    setSelectedAmenity(amenity);
                                                                }}
                                                                className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
                                                            >
                                                                <Calendar className="size-3.5" />
                                                                <span>Reserve</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* VIEW C: MY RESERVATIONS */
                                <div className="space-y-3 pb-12">
                                    <div className="flex items-center justify-between pb-1">
                                        <span className="text-xs font-bold text-muted-foreground">
                                            {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'} recorded
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                triggerHaptic('light');
                                                fetchAllData();
                                            }}
                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                                            aria-label="Refresh bookings"
                                        >
                                            <RefreshCw className="size-3.5" />
                                        </button>
                                    </div>

                                    {bookings.length === 0 ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-border/70">
                                            <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
                                                <CalendarCheck className="size-6" />
                                            </div>
                                            <h4 className="text-sm font-bold text-foreground mb-1">No Active Bookings</h4>
                                            <p className="text-xs text-muted-foreground max-w-xs mb-4">
                                                You haven't reserved any amenities yet. Check out available facilities to book a slot.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    triggerHaptic('light');
                                                    setActiveTab('browse');
                                                }}
                                                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs active:scale-95 transition-all"
                                            >
                                                Browse Facilities
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {bookings.map((booking) => {
                                                const isCancelled = booking.status.toLowerCase() === 'cancelled';
                                                const isConfirmed = booking.status.toLowerCase() === 'confirmed';
                                                const isPending = booking.status.toLowerCase() === 'pending';

                                                return (
                                                    <div
                                                        key={booking.id}
                                                        className={cn(
                                                            'p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5',
                                                            isCancelled
                                                                ? 'bg-muted/20 border-border/40 opacity-75'
                                                                : 'bg-card border-border/70 shadow-xs'
                                                        )}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <h4 className="text-sm font-bold text-foreground truncate">
                                                                    {booking.amenity?.name || 'Amenity Booking'}
                                                                </h4>
                                                                <p className="text-[11px] text-muted-foreground">
                                                                    {booking.amenity?.type || 'Facility'}
                                                                </p>
                                                            </div>

                                                            <span
                                                                className={cn(
                                                                    'px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border shrink-0',
                                                                    isConfirmed
                                                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                                        : isPending
                                                                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                                        : 'bg-muted text-muted-foreground border-border/40'
                                                                )}
                                                            >
                                                                {isPending ? 'Pending' : booking.status}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col gap-1 p-2 rounded-xl bg-muted/40 text-[11px] text-foreground font-semibold">
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="size-3.5 text-primary shrink-0" />
                                                                <span>{formatBookingDate(booking.booking_date)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="size-3.5 text-primary shrink-0" />
                                                                <span>{formatBookingTime(booking.start_time, booking.end_time)}</span>
                                                            </div>
                                                        </div>

                                                        {booking.notes && (
                                                            <p className="text-[11px] text-muted-foreground italic">
                                                                &ldquo;{booking.notes}&rdquo;
                                                            </p>
                                                        )}

                                                        <div className="pt-1 flex items-center justify-between text-xs border-t border-border/40">
                                                            <span className="font-bold text-foreground">
                                                                {booking.total_price === 0
                                                                    ? 'Free'
                                                                    : `₱${booking.total_price.toLocaleString()}`}
                                                            </span>

                                                            {!isCancelled && (
                                                                <button
                                                                    type="button"
                                                                    disabled={cancellingId === booking.id}
                                                                    onClick={() => handleCancelBooking(booking.id)}
                                                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-destructive hover:bg-destructive/10 active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50"
                                                                >
                                                                    {cancellingId === booking.id ? (
                                                                        <Loader2 className="size-3 animate-spin" />
                                                                    ) : (
                                                                        <Trash2 className="size-3" />
                                                                    )}
                                                                    <span>Cancel</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
