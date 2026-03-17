"use client";

import React, { useState } from "react";
import { ArrowUpRight, X, TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface FeaturedPropertyCardProps {
    propertyName?: string;
    totalSales?: number | string;
    totalViews?: string;
    image?: string;
    className?: string;
    simplifiedMode?: boolean;
    momGrowth?: string;
    occupancyRate?: string;
}

export function FeaturedPropertyCard({
    propertyName = "Sunset Valley Apartments",
    totalSales = "₱243,000",
    totalViews = "20K+",
    image = "/hero-images/apartment-03.png", // Temporarily using local hero-image
    className,
    simplifiedMode = false,
    momGrowth = "+12.4%",
    occupancyRate = "100%",
}: FeaturedPropertyCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div 
                onClick={() => setIsModalOpen(true)}
                className={cn(
                    "cursor-pointer relative w-full h-full min-h-[300px] overflow-hidden rounded-3xl text-white p-6 md:p-8 flex flex-col justify-between group shadow-xl border border-white/10",
                    className
                )}>
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={image}
                    alt={propertyName}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
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

            {/* Quick View Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
                        onClick={() => setIsModalOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="mb-6">
                            <span className="inline-block px-3 py-1 mb-3 text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                {simplifiedMode ? "Best Performing" : "Top Asset MTD"}
                            </span>
                            <h2 className="text-2xl font-bold text-white mb-1">{propertyName}</h2>
                            <p className="text-sm text-neutral-400">
                                {simplifiedMode ? "Here is why this is your best house this month." : "Performance overview for your top property."}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-400">{simplifiedMode ? "Money Made (Total)" : "Gross Revenue"}</p>
                                    <p className="text-xl font-bold text-white">{totalSales}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-400">{simplifiedMode ? "Growth" : "MoM Growth"}</p>
                                    <p className="text-xl font-bold text-white">{momGrowth}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-lg">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-400">Occupancy</p>
                                    <p className="text-xl font-bold text-white">{occupancyRate}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="p-3 bg-orange-500/20 text-orange-400 rounded-lg">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-400">{simplifiedMode ? "People Looking" : "Profile Views"}</p>
                                    <p className="text-xl font-bold text-white">{totalViews}</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="w-full mt-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
