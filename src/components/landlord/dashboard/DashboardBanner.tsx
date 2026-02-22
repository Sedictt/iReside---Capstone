"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, Bell } from "lucide-react";
import { ProfileWidget } from "@/components/landlord/ProfileWidget";

interface DashboardBannerProps {
    title?: string;
    subtitle?: string;
    image?: string;
    className?: string;
    simplifiedMode?: boolean;
}

export function DashboardBanner({
    title = "Welcome back, Landlord",
    subtitle = "Here's what's happening with your properties today.",
    image = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop", // City Night Architecture
    className,
    simplifiedMode = false
}: DashboardBannerProps) {
    const [time, setTime] = useState<Date | null>(null);

    const displaySubtitle = simplifiedMode ? "Hi! Here is a quick look at your houses today." : subtitle;

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div
            className={cn(
                "relative w-full h-48 md:h-64 min-h-[192px] md:min-h-[256px] shrink-0 rounded-3xl overflow-visible shadow-2xl group bg-neutral-800 border border-white/10",
                className
            )}>
            {/* Background Image */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
                <img
                    src={image}
                    alt="Dashboard Banner"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                {/* Gradient Overlay - Left heavy for text, right subtle for clock */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 via-60% to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
            </div>

            {/* Top Right Header Actions */}
            <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative group hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300 z-10 group-focus-within:text-white transition-colors" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 w-full md:w-56 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-white/40 hover:bg-black/60 shadow-lg shadow-emerald-900/10"
                    />
                </div>

                {/* Profile Widget */}
                <ProfileWidget />

                {/* Notifications */}
                <button className="relative p-2 rounded-full hover:bg-black/40 transition-colors group backdrop-blur-md border border-white/5 bg-black/20">
                    <Bell className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0a0a0a]"></span>
                </button>
            </div>

            {/* Content Container */}
            <div className="absolute inset-0 z-10 flex items-center justify-between px-8 md:px-12">
                {/* Left Side - Welcome & Info */}
                <div className="flex flex-col justify-center h-full max-w-2xl mt-8 md:mt-0">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">
                        {title}
                    </h1>
                    <p className="text-neutral-300 text-sm md:text-lg max-w-xl font-medium drop-shadow-md">
                        {displaySubtitle}
                    </p>

                    {/* Date Badge */}
                    <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 w-fit">
                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-lime-500 to-emerald-600 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        <span className="text-xs font-medium text-white tracking-wide">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>

                {/* Right Side - Real-Clock */}
                {time && (
                    <div className="hidden lg:flex flex-col items-end justify-center text-right mt-12 self-center">
                        <div className="text-6xl font-bold text-white tracking-tighter drop-shadow-2xl font-mono tabular-nums">
                            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ')[0]}
                            <span className="text-2xl ml-2 font-sans tracking-normal font-medium text-neutral-400">
                                {time.toLocaleTimeString('en-US', { hour12: true }).split(' ')[1]}
                            </span>
                        </div>
                        <div className="text-neutral-400 font-medium text-sm tracking-widest uppercase mt-1">
                            Local Time
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
