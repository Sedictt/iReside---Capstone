
import React from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturedPropertyCardProps {
    propertyName?: string;
    totalSales?: number;
    totalViews?: string;
    image?: string;
    className?: string;
    simplifiedMode?: boolean;
}

export function FeaturedPropertyCard({
    propertyName = "Sunset Valley Apartments",
    totalSales = 243,
    totalViews = "20K+",
    image = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1000&auto=format&fit=crop", // Modern apartment image
    className,
    simplifiedMode = false
}: FeaturedPropertyCardProps) {
    return (
        <div className={cn(
            "relative w-full h-full min-h-[300px] overflow-hidden rounded-3xl text-white p-6 md:p-8 flex flex-col justify-between group shadow-xl border border-white/10",
            className
        )}>
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src={image}
                    alt={propertyName}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-start z-20 relative">
                <div>
                    <p className="text-sm font-bold tracking-wider text-white/90 mb-1 uppercase drop-shadow-md">
                        {simplifiedMode ? "Your Best House" : "Best Performing Property"}
                    </p>
                    <h3 className="text-3xl font-bold leading-tight max-w-[250px] text-white drop-shadow-lg">
                        {propertyName}
                    </h3>
                </div>
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white transition-all hover:bg-white hover:text-black shadow-lg border border-white/20">
                    <ArrowUpRight className="h-5 w-5" />
                </button>
            </div>

            {/* Content & Stats */}
            <div className="relative z-20 mt-auto">
                <div className="flex gap-8 backdrop-blur-sm bg-black/20 p-4 rounded-2xl border border-white/10 inline-flex">
                    <div>
                        <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                            {simplifiedMode ? "Money Made" : "Total Revenue"}
                        </p>
                        <p className="text-2xl font-bold tracking-tight mt-0.5">{totalSales}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                            {simplifiedMode ? "People Looking" : "Total Views"}
                        </p>
                        <p className="text-2xl font-bold tracking-tight mt-0.5">{totalViews}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
