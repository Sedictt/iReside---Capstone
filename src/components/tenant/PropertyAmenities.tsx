"use client";

import { m as motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import Image from "next/image";

interface Amenity {
    id: string;
    name: string;
    type: string;
    description: string;
    price_per_unit: number;
    unit_type: string;
    capacity: number;
    icon_name: string;
    location_details: string;
    image_url?: string;
    status: string;
}

const getIconByName = (name: string | null) => {
    if (!name) return LucideIcons.Zap;
    // @ts-expect-error - dynamic lookup
    const Icon = LucideIcons[name];
    return Icon || LucideIcons.Zap;
};

export function PropertyAmenities({ amenities }: { amenities: Amenity[] }) {
    if (!amenities || amenities.length === 0) {
        return (
            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[2.5rem] bg-muted/5 gap-3">
                <LucideIcons.Sparkle className="size-8 text-muted-foreground/20" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No active amenities listed</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {amenities.map((amenity, idx) => {
                const IconComponent = getIconByName(amenity.icon_name);
                return (
                    <motion.div
                        key={amenity.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group flex flex-col xl:flex-row gap-5 p-4 rounded-[1.5rem] border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30"
                    >
                        {/* Image/Icon Area */}
                        <div className="relative h-48 xl:h-auto xl:w-48 rounded-xl overflow-hidden bg-muted/50 shrink-0 border border-border/50">
                            {amenity.image_url ? (
                                <Image 
                                    src={amenity.image_url} 
                                    alt={amenity.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <IconComponent className="size-10 text-primary/20 group-hover:text-primary/40 transition-colors" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                            
                            <div className="absolute top-3 left-3 z-10">
                                <span className="px-2 py-1 bg-black/40 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-[0.15em] text-white rounded-md">
                                    {amenity.type}
                                </span>
                            </div>
                            
                            <div className="absolute bottom-3 right-3 z-10 size-8 rounded-lg bg-card/90 backdrop-blur-sm flex items-center justify-center text-primary shadow-sm border border-white/10 group-hover:scale-110 transition-transform">
                                <IconComponent className="size-4" />
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex flex-col flex-1 min-w-0 py-1">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">
                                        <LucideIcons.MapPin className="size-3" />
                                        <span className="truncate">{amenity.location_details || "Main Wing"}</span>
                                    </div>
                                    <h4 className="text-lg font-black text-foreground truncate group-hover:text-primary transition-colors">
                                        {amenity.name}
                                    </h4>
                                </div>
                                <div className="sm:text-right shrink-0">
                                    <span className="text-lg font-black text-foreground">
                                        {amenity.price_per_unit === 0 ? "Free" : `₱${amenity.price_per_unit}`}
                                    </span>
                                    {amenity.price_per_unit > 0 && <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mt-0.5">/ {amenity.unit_type}</span>}
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                                {amenity.description || "Premium facility provided for your residence. Access details available at concierge."}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 mt-auto pt-4 border-t border-border/50">
                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                    <LucideIcons.Users className="size-3.5 text-primary/70" />
                                    {amenity.capacity || 0} Capacity
                                </div>
                                <div className="w-1 h-1 rounded-full bg-border hidden sm:block" />
                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                    <LucideIcons.CheckCircle2 className="size-3.5" />
                                    {amenity.status}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

