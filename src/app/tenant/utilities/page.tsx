"use client";

import { useState } from "react";
import Image from "next/image";
import { 
    History,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    MapPin,
    Users,
    Calendar,
    Clock,
    Info,
    ChevronRight
} from "lucide-react";
import * as LucideIcons from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

// Mock Data
const AMENITIES = [
    {
        id: "1",
        name: "Grand Function Hall",
        type: "Events",
        description: "Elegant space for your special moments. Fully air-conditioned with sound system.",
        price: 500,
        unit: "hour",
        capacity: "100 guests",
        image: "/amenities/function_room.png",
        icon_name: "Users",
        color: "bg-blue-500",
    },
    {
        id: "2",
        name: "Infinity Rooftop Pool",
        type: "Leisure",
        description: "Relax with a panoramic view of the city skyline. Open daily from 6 AM to 10 PM.",
        price: 0,
        unit: "free",
        capacity: "30 people",
        image: "/amenities/pool.png",
        icon_name: "Waves",
        color: "bg-emerald-500",
    },
    {
        id: "3",
        name: "Premium Music Studio",
        type: "Creative",
        description: "Pro-grade acoustic treatment. Perfect for rehearsals or private recording sessions.",
        price: 200,
        unit: "hour",
        capacity: "5 people",
        image: "/amenities/music_studio.png",
        icon_name: "Music",
        color: "bg-purple-500",
    },
];

const MY_BOOKINGS = [
    {
        id: "b1",
        name: "Infinity Rooftop Pool",
        date: "Today, May 12",
        time: "4:00 PM - 6:00 PM",
        status: "Confirmed",
        type: "Borrow",
    },
    {
        id: "b2",
        name: "Grand Function Hall",
        date: "Sun, May 15",
        time: "2:00 PM - 6:00 PM",
        status: "Pending Approval",
        type: "Rent",
    }
];

export default function TenantUtilitiesPage() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [bookingModal, setBookingModal] = useState<BookingModalData | null>(null);

    const categories = ["All", "Events", "Leisure", "Creative", "Sports"];

    return (
        <div className="flex h-full w-full flex-col gap-8 bg-background text-foreground">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-[2.5rem] bg-[#0f172a] p-8 md:p-12 text-white shadow-2xl">
                <div className="relative z-10 max-w-2xl">
                    <motion.span 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block rounded-full bg-primary/20 px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary ring-1 ring-primary/30"
                    >
                        Building Amenities
                    </motion.span>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-4 text-4xl font-black tracking-tight md:text-5xl"
                    >
                        Elevate Your <span className="text-primary">Living Experience.</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-6 text-lg text-slate-400"
                    >
                        Access exclusive facilities, book event spaces, and enjoy the premium services available in your community.
                    </motion.p>
                </div>

                {/* Decorative background element */}
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent opacity-50" />
                <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            </section>

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

                    <div className="grid gap-6 sm:grid-cols-2">
                        {AMENITIES.filter(a => selectedCategory === "All" || a.type === selectedCategory).map((amenity, i) => (
                            <motion.div
                                key={amenity.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                            >
                                <div className="relative h-48 w-full overflow-hidden">
                                    <Image 
                                        src={amenity.image} 
                                        alt={amenity.name} 
                                        fill 
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-lg", amenity.color)}>
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
                                    <p className="mt-2 text-sm text-muted-foreground/80 line-clamp-2">{amenity.description}</p>
                                    
                                    <div className="mt-4 flex items-center gap-4 border-t border-border/50 pt-4">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                            <Users className="h-3.5 w-3.5" />
                                            {amenity.capacity}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                            <MapPin className="h-3.5 w-3.5" />
                                            Tower A, Level 4
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Booking Rate</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-black text-foreground">
                                                    {amenity.price === 0 ? "Free" : `₱${amenity.price}`}
                                                </span>
                                                {amenity.price > 0 && <span className="text-xs font-bold text-muted-foreground">/{amenity.unit}</span>}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setBookingModal(amenity)}
                                            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
                                        >
                                            {amenity.price === 0 ? "Borrow" : "Rent Now"}
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
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

                        <div className="space-y-4">
                            {MY_BOOKINGS.map(booking => (
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
                    </section>

                    {/* Quick Access / Help */}
                    <section className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-6 text-white shadow-xl shadow-primary/10">
                        <Info className="h-8 w-8 mb-4" />
                        <h3 className="text-lg font-black leading-tight">Need a customized event package?</h3>
                        <p className="mt-2 text-sm text-white/80">Contact the building admin for large scale events, decorations, and catering services.</p>
                        <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-primary transition-all hover:bg-white/90">
                            Chat with Concierge
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </section>

                    {/* Usage History Mini */}
                    <div className="flex items-center gap-4 rounded-2xl border border-dashed border-border p-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                            <History className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold">Past Bookings</p>
                            <p className="text-xs">Review your facility usage history</p>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                    </div>
                </div>
            </div>

            {/* Booking Modal (Simplified) */}
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

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Date</label>
                                        <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-3">
                                            <Calendar className="h-4 w-4 text-primary" />
                                            <span className="text-sm font-medium">Select Date</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Duration</label>
                                        <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-3">
                                            <Clock className="h-4 w-4 text-primary" />
                                            <span className="text-sm font-medium">2 Hours</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Notes (Optional)</label>
                                    <textarea 
                                        placeholder="Tell us about your event..."
                                        className="min-h-[100px] w-full rounded-xl border border-border bg-background p-3 text-sm outline-none ring-primary/20 focus:ring-2"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Estimated Cost</span>
                                    <span className="text-2xl font-black text-foreground">
                                        {bookingModal.price === 0 ? "Free" : `₱${bookingModal.price * 2}`}
                                    </span>
                                </div>
                                <button className="rounded-2xl bg-primary px-8 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
                                    Confirm Request
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
