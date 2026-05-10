"use client";

import { motion } from "framer-motion";
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {amenities.map((amenity, idx) => {
                const IconComponent = getIconByName(amenity.icon_name);
                return (
                    <motion.div
                        key={amenity.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20"
                    >
                        {/* Header/Image Area */}
                        <div className="relative h-44 w-full overflow-hidden bg-muted/30">
                            {amenity.image_url ? (
                                <Image 
                                    src={amenity.image_url} 
                                    alt={amenity.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <IconComponent className="size-16 text-primary/10" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                            
                            {/* Type Badge */}
                            <div className="absolute top-5 left-5 z-10">
                                <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-[0.15em] text-white rounded-full">
                                    {amenity.type}
                                </span>
                            </div>

                            {/* Floating Icon Container */}
                            <div className="absolute bottom-5 right-5 z-10 size-12 rounded-[1.25rem] bg-card shadow-2xl flex items-center justify-center text-primary border border-border group-hover:scale-110 transition-transform duration-300">
                                <IconComponent className="size-6" />
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-8 flex flex-col flex-1">
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                                    <LucideIcons.MapPin className="size-3.5" />
                                    {amenity.location_details || "Main Wing"}
                                </div>
                                <h4 className="text-xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors leading-tight">
                                    {amenity.name}
                                </h4>
                            </div>

                            <p className="text-[13px] text-muted-foreground/80 leading-relaxed mb-8 line-clamp-2 font-medium">
                                {amenity.description || "Premium facility provided for your residence. Access details available at concierge."}
                            </p>

                            {/* Footer Stats & Pricing */}
                            <div className="mt-auto flex items-center justify-between pt-6 border-t border-border/50">
                                <div className="flex items-center gap-5">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Capacity</span>
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-foreground">
                                            <LucideIcons.Users className="size-3.5 text-primary" />
                                            {amenity.capacity || 0} People
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Status</span>
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-500">
                                            <LucideIcons.CheckCircle2 className="size-3.5" />
                                            {amenity.status}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-end gap-0.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Usage Fee</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-foreground tracking-tight">
                                            {amenity.price_per_unit === 0 ? "Free" : `₱${amenity.price_per_unit}`}
                                        </span>
                                        {amenity.price_per_unit > 0 && <span className="text-[10px] font-bold text-muted-foreground lowercase tracking-normal">/{amenity.unit_type}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

