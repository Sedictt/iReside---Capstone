"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProperty } from "@/context/PropertyContext";
import { 
    getAmenities, 
    getAmenityBookings, 
    updateBookingStatus,
    deleteAmenity
} from "@/lib/queries/amenities";
import type { AmenityWithProperty, AmenityBookingWithDetails } from "@/types/database";
import { 
    Plus, 
    Search, 
    MoreVertical, 
    Check, 
    X, 
    Clock, 
    Calendar,
    Users,
    LayoutGrid,
    History as HistoryIcon,
    ClipboardList,
    MapPin,
    Zap,
    Filter,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { m as motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import { AddAmenityModal } from "@/components/landlord/AddAmenityModal";

import * as LucideIcons from 'lucide-react';

// Helper to get icon component by name
const getIconByName = (name: string | null) => {
    if (!name) return LucideIcons.Zap;
    // @ts-expect-error - dynamic lookup
    const Icon = LucideIcons[name];
    return Icon || LucideIcons.Zap;
};

export default function LandlordUtilitiesPage() {
    const { user } = useAuth();
    const { selectedPropertyId } = useProperty();
    const [activeTab, setActiveTab] = useState<"list" | "requests" | "history">("list");
    const [searchQuery, setSearchQuery] = useState("");
    const [amenities, setAmenities] = useState<AmenityWithProperty[]>([]);
    const [bookings, setBookings] = useState<AmenityBookingWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const [amenitiesData, bookingsData] = await Promise.all([
                getAmenities(user.id),
                getAmenityBookings(user.id)
            ]);
            setAmenities(amenitiesData);
            setBookings(bookingsData);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load facilities and bookings");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdateBookingStatus = async (id: string, status: string) => {
        try {
            await updateBookingStatus(id, status);
            toast.success(`Booking ${status.toLowerCase()} successfully`);
            fetchData();
        } catch (error) {
            console.error("Error updating booking:", error);
            toast.error("Failed to update booking status");
        }
    };

    const handleDeleteAmenity = async (id: string) => {
        if (!confirm("Are you sure you want to delete this facility? This will also remove all associated bookings.")) return;
        try {
            await deleteAmenity(id);
            toast.success("Facility deleted successfully");
            fetchData();
        } catch (error) {
            console.error("Error deleting facility:", error);
            toast.error("Failed to delete facility");
        }
    };

    // Filter by property and search query
    const filteredUtilities = amenities
        .filter(u => selectedPropertyId === 'all' || u.property_id === selectedPropertyId)
        .filter(u => 
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.type.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const filteredBookings = bookings
        .filter(b => selectedPropertyId === 'all' || b.amenity?.property_id === selectedPropertyId);

    const pendingCount = filteredBookings.filter(b => b.status === "Pending").length;

    return (
        <div className="flex min-h-full w-full flex-col bg-background text-foreground">
            {/* Hero Header Section - Improved Depth */}
            <div className="relative overflow-hidden border-b border-border bg-card/20 px-6 py-10 md:px-12 md:py-16">
                <div className="absolute -right-24 -top-24 size-96 rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute -left-24 -bottom-24 size-96 rounded-full bg-primary/5 blur-[120px]" />
                
                <div className="relative z-10 mx-auto max-w-7xl">
                    <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-6 items-center rounded-full bg-primary/10 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                    Facilities
                                </span>
                                <span className="h-px w-12 bg-border" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Property Assets</span>
                            </div>
                            <h1 className="text-5xl font-black tracking-tight text-foreground md:text-6xl lg:text-7xl">
                                Property <span className="text-primary">Facilities</span>
                            </h1>
                            <p className="max-w-xl text-lg font-medium text-muted-foreground/80 leading-relaxed">
                                Manage and monitor shared amenities, equipment, and services for your residents.
                            </p>
                        </section>
                        
                        <div className="flex flex-wrap gap-4">
                            <button 
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-3 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.05] active:scale-95"
                            >
                                <Plus className="size-5" />
                                Add Facility
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto w-full max-w-7xl space-y-12 p-6 md:p-12">
                {/* Controls & Navigation - More Breathing Room */}
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex w-full items-center gap-2 rounded-3xl bg-muted/30 p-2 sm:w-fit border border-border/40 backdrop-blur-sm">
                        {[
                            { id: "list", label: "Inventory", icon: LayoutGrid },
                            { id: "requests", label: "Bookings", icon: ClipboardList, badge: pendingCount > 0 ? pendingCount.toString() : undefined },
                            { id: "history", label: "History", icon: HistoryIcon },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as "list" | "requests" | "history")}
                                className={cn(
                                    "relative flex items-center gap-3 rounded-2xl px-6 py-3.5 text-sm font-black transition-all",
                                    activeTab === tab.id 
                                        ? "bg-card text-foreground shadow-xl ring-1 ring-border/50" 
                                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                )}
                            >
                                <tab.icon className={cn("size-4 transition-colors", activeTab === tab.id ? "text-primary" : "text-muted-foreground")} />
                                {tab.label}
                                {tab.badge && (
                                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-black text-primary-foreground">
                                        {tab.badge}
                                    </span>
                                )}
                                {activeTab === tab.id && (
                                    <motion.div 
                                        layoutId="tab-indicator-premium"
                                        className="absolute -bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/40" />
                            <input
                                type="text"
                                placeholder="Find a facility..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-[2rem] border border-border bg-card py-4 pl-14 pr-6 text-base font-medium outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-8 shadow-sm"
                            />
                        </div>
                        <button className="flex size-14 items-center justify-center rounded-[2rem] border border-border bg-card text-muted-foreground transition-all hover:bg-muted hover:text-primary active:scale-90">
                            <Filter className="size-5" />
                        </button>
                    </div>
                </div>

                {/* Content Sections */}
                <AnimatePresence mode="wait">
                    {activeTab === "list" && (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {/* Create New Card */}
                            <button 
                                onClick={() => setIsAddModalOpen(true)}
                                className="group relative flex flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed border-border/50 bg-muted/10 p-8 transition-all hover:bg-primary/[0.03] hover:border-primary/30 hover:shadow-lg min-h-[340px]"
                            >
                                <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105">
                                    <Plus className="size-8" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-lg font-black text-foreground">Add New Facility</p>
                                    <p className="text-xs text-muted-foreground/70 leading-relaxed">
                                        Register a new room, amenity, or service.
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 text-primary font-black text-xs opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                    Get started <ArrowRight className="size-3.5" />
                                </div>
                            </button>

                            {loading ? (
                                // Skeleton loader
                                [...Array(3)].map((_, i) => (
                                    <div key={`utility-skeleton-${i}`} className="h-[400px] w-full animate-pulse rounded-3xl bg-muted/50" />
                                ))
                            ) : filteredUtilities.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                                    <div className="mb-4 rounded-full bg-muted p-4">
                                        <Search className="size-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-black">No facilities found</h3>
                                    <p className="text-muted-foreground">Try adjusting your search or add a new facility.</p>
                                </div>
                            ) : (
                                filteredUtilities.map((utility, idx) => {
                                    const IconComponent = getIconByName(utility.icon_name);
                                    return (
                                        <motion.div
                                            key={utility.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-[0_18px_34px_-28px_rgba(15,23,42,0.2)] hover:-translate-y-1 hover:border-primary/20"
                                        >
                                            {/* Thumbnail Image */}
                                            <div className="relative h-44 w-full overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
                                                {utility.image_url ? (
                                                    <Image 
                                                        src={utility.image_url} 
                                                        alt={utility.name}
                                                        fill
                                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-muted">
                                                        <IconComponent className="size-12 text-muted-foreground/30" />
                                                    </div>
                                                )}
                                                {/* Status Badge */}
                                                <div className="absolute right-4 top-4 z-20">
                                                    <div className={cn(
                                                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] border shadow-lg",
                                                        utility.status === "Active" 
                                                            ? "bg-white text-emerald-600 border-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800" 
                                                            : "bg-white text-amber-600 border-amber-100 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
                                                    )}>
                                                        <span className={cn(
                                                            "size-1.5 rounded-full",
                                                            utility.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                                                        )} />
                                                        {utility.status}
                                                    </div>
                                                </div>
                                                {/* Type Icon */}
                                                <div className="absolute bottom-4 left-4 z-20 flex size-11 items-center justify-center rounded-2xl bg-white text-primary border border-border shadow-xl dark:bg-card dark:text-primary">
                                                    <IconComponent className="size-5" />
                                                </div>
                                            </div>

                                            {/* Content Area */}
                                            <div className="flex flex-1 flex-col p-5">
                                                {/* Header: Type + Name */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                                                            <Zap className="size-3" />
                                                            {utility.type}
                                                        </span>
                                                        {utility.tags?.slice(0, 2).map((tag: string) => (
                                                            <span key={tag} className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-black text-muted-foreground">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <h4 className="text-xl font-black text-foreground leading-tight group-hover:text-primary transition-colors">
                                                        {utility.name}
                                                    </h4>
                                                </div>

                                                {/* Meta: Capacity + Location */}
                                                <div className="mt-3 flex items-center gap-3 text-xs font-medium text-muted-foreground">
                                                    <span className="flex items-center gap-1.5">
                                                        <Users className="size-3.5 text-muted-foreground/50" />
                                                        {utility.capacity || 0} capacity
                                                    </span>
                                                    <span className="size-1 rounded-full bg-border/60" />
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="size-3.5 text-muted-foreground/50" />
                                                        {utility.property?.name || utility.location_details || "Main Wing"}
                                                    </span>
                                                </div>

                                                {/* Description */}
                                                <p className="mt-3 text-sm text-muted-foreground/70 leading-relaxed line-clamp-2">
                                                    {utility.description}
                                                </p>

                                                {/* Footer: Pricing + Actions */}
                                                <div className="mt-auto pt-5 flex items-center justify-between border-t border-border/40">
                                                    <div>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-2xl font-black text-foreground">
                                                                {utility.price_per_unit === 0 ? "Free" : `₱${Number(utility.price_per_unit).toLocaleString()}`}
                                                            </span>
                                                            {utility.price_per_unit > 0 && <span className="text-xs font-black text-muted-foreground">/{utility.unit_type}</span>}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => handleDeleteAmenity(utility.id)}
                                                            className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500" 
                                                            aria-label="Delete facility"
                                                        >
                                                            <X className="size-4" />
                                                        </button>
                                                        <button className="flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-black text-background transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-md hover:shadow-primary/20">
                                                            Manage
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </motion.div>
                    )}

                    {activeTab === "requests" && (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="rounded-[3rem] border border-border bg-card shadow-2xl overflow-hidden"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/40 border-b border-border">
                                            <th className="p-8 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Applicant</th>
                                            <th className="p-8 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Reservation Details</th>
                                            <th className="p-8 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Billing</th>
                                            <th className="p-8 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Status</th>
                                            <th className="p-8 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {filteredBookings.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-20 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <ClipboardList className="size-12 text-muted-foreground/20" />
                                                        <p className="text-lg font-black text-muted-foreground">No bookings found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            bookings.map((req) => (
                                                <tr key={req.id} className="group hover:bg-muted/10 transition-colors">
                                                    <td className="p-8">
                                                        <div className="flex items-center gap-5">
                                                            {req.tenant?.avatar_url ? (
                                                                <Image src={req.tenant.avatar_url} alt="" width={56} height={56} className="rounded-[1.25rem] object-cover" />
                                                            ) : (
                                                                <div className="flex size-14 items-center justify-center rounded-[1.25rem] bg-primary/10 text-primary font-black text-lg">
                                                                    {req.tenant?.full_name?.charAt(0) || "T"}
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-lg font-black text-foreground group-hover:text-primary transition-colors">{req.tenant?.full_name || "Unknown Tenant"}</span>
                                                                <span className="text-xs font-black text-muted-foreground flex items-center gap-2">
                                                                    <Zap className="size-3.5 text-primary" />
                                                                    {req.amenity?.name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex items-center gap-3 text-sm font-black text-foreground">
                                                                <Calendar className="size-4 text-primary" />
                                                                {req.booking_date}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground font-black">
                                                                <Clock className="size-4" />
                                                                {req.start_time.slice(0, 5)} - {req.end_time.slice(0, 5)}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        <div className="flex items-center gap-2 font-black text-2xl text-foreground tracking-tighter">
                                                            <span className="text-emerald-500 text-sm">₱</span>
                                                            {Number(req.total_price).toLocaleString()}
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        <span className={cn(
                                                            "inline-flex items-center rounded-2xl px-5 py-2 text-[10px] font-black uppercase tracking-widest border",
                                                            req.status === "Pending" 
                                                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20" 
                                                                : req.status === "Approved"
                                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                                    : "bg-red-500/10 text-red-600 border-red-500/20"
                                                        )}>
                                                            {req.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-8 text-right">
                                                        <div className="flex justify-end gap-3">
                                                            {req.status === "Pending" && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleUpdateBookingStatus(req.id, "Approved")}
                                                                        className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 transition-all hover:bg-emerald-500 hover:text-white shadow-lg shadow-emerald-500/10 active:scale-90"
                                                                    >
                                                                        <Check className="size-6" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleUpdateBookingStatus(req.id, "Rejected")}
                                                                        className="flex size-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 transition-all hover:bg-red-500 hover:text-white shadow-lg shadow-red-500/10 active:scale-90"
                                                                    >
                                                                        <X className="size-6" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground transition-all hover:bg-foreground hover:text-background active:scale-90">
                                                                <MoreVertical className="size-6" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "history" && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center py-32 rounded-[4rem] border-4 border-dashed border-border/40 bg-muted/5"
                        >
                            <div className="flex size-24 items-center justify-center rounded-[2.5rem] bg-muted mb-8 shadow-inner">
                                <HistoryIcon className="size-12 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-3xl font-black text-foreground tracking-tight">Archive Management</h3>
                            <p className="text-base font-medium text-muted-foreground/60 text-center max-w-md mt-4 leading-relaxed">
                                Review deep historical insights, occupancy trends, and long-term revenue analysis across all facilities.
                            </p>
                            <button className="mt-10 rounded-2xl border border-border px-10 py-4 text-sm font-black text-foreground hover:bg-muted transition-all active:scale-95 shadow-sm">
                                View Full History
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AddAmenityModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onSuccess={fetchData}
                landlordId={user?.id || ''}
            />
        </div>
    );
}
