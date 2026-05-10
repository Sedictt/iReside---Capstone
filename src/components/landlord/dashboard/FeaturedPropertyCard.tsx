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
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsModalOpen(true); }}}
                tabIndex={0}
                role="button"
                className={cn(
                    "group relative flex h-full min-h-[300px] w-full cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-white/20 p-6 text-white shadow-[0_28px_60px_-30px_rgba(15,23,42,0.5)] md:p-8 dark:border-white/10 dark:shadow-xl",
                    className
                )}
            >
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
                        <h3 className="text-3xl font-semibold leading-tight max-w-[250px] text-white drop-shadow-lg">
                            {propertyName}
                        </h3>
                    </div>
                    <button className="flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white transition-all hover:bg-white hover:text-black shadow-lg border border-white/20">
                        <ArrowUpRight className="size-5" />
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
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsModalOpen(false); }}}
                        tabIndex={0}
                        role="button"
                    />
                    <div className="relative z-10 w-full max-w-md animate-in rounded-3xl border border-border bg-card p-6 shadow-2xl duration-200 fade-in zoom-in-95">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute right-4 top-4 rounded-full bg-muted/60 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <X className="size-5" />
                        </button>
                        
                        <div className="mb-6">
                            <span className="mb-3 inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                {simplifiedMode ? "Best Performing" : "Top Asset MTD"}
                            </span>
                            <h2 className="mb-1 text-2xl font-semibold text-foreground">{propertyName}</h2>
                            <p className="text-sm text-muted-foreground">
                                {simplifiedMode ? "Here is why this is your best house this month." : "Performance overview for your top property."}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
                                <div className="rounded-lg bg-emerald-500/20 p-3 text-emerald-600 dark:text-emerald-400">
                                    <DollarSign className="size-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{simplifiedMode ? "Money Made (Total)" : "Gross Revenue"}</p>
                                    <p className="text-xl font-bold text-foreground">{totalSales}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
                                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
                                    <TrendingUp className="size-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{simplifiedMode ? "Growth" : "MoM Growth"}</p>
                                    <p className="text-xl font-bold text-foreground">{momGrowth}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
                                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-lg">
                                    <Users className="size-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Occupancy</p>
                                    <p className="text-xl font-bold text-foreground">{occupancyRate}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
                                <div className="p-3 bg-orange-500/20 text-orange-400 rounded-lg">
                                    <Activity className="size-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{simplifiedMode ? "People Looking" : "Profile Views"}</p>
                                    <p className="text-xl font-bold text-foreground">{totalViews}</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="mt-6 w-full rounded-xl bg-foreground py-3 font-bold text-background transition-colors hover:opacity-90"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

