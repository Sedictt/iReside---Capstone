"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, Bell, Home, Users, Wrench, ClipboardList, Map, UserPlus } from "lucide-react";
import { ProfileWidget } from "@/components/landlord/ProfileWidget";
import Link from "next/link";

type BannerNotification = {
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    type: string;
};

function formatTimeAgo(value: string) {
    const timestamp = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();

    if (Number.isNaN(diffMs) || diffMs < 0) {
        return "Recently";
    }

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < hour) {
        const minutes = Math.max(1, Math.floor(diffMs / minute));
        return `${minutes}m ago`;
    }

    if (diffMs < day) {
        const hours = Math.max(1, Math.floor(diffMs / hour));
        return `${hours}h ago`;
    }

    const days = Math.floor(diffMs / day);
    if (days === 1) {
        return "Yesterday";
    }

    if (days < 7) {
        return `${days}d ago`;
    }

    return timestamp.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

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
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<BannerNotification[]>([]);
    const [notificationsLoading, setNotificationsLoading] = useState(true);
    const [notificationsError, setNotificationsError] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const displaySubtitle = simplifiedMode ? "Hi! Here is a quick look at your houses today." : subtitle;

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const loadNotifications = async () => {
            setNotificationsLoading(true);
            setNotificationsError(null);

            try {
                const response = await fetch("/api/landlord/notifications/recent", {
                    method: "GET",
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error("Failed to load notifications");
                }

                const payload = (await response.json()) as {
                    notifications?: BannerNotification[];
                    unreadCount?: number;
                };

                setNotifications(Array.isArray(payload.notifications) ? payload.notifications : []);
                setUnreadCount(typeof payload.unreadCount === "number" ? payload.unreadCount : 0);
            } catch (error) {
                if ((error as Error).name === "AbortError") {
                    return;
                }

                setNotifications([]);
                setUnreadCount(0);
                setNotificationsError("Unable to load notifications.");
            } finally {
                setNotificationsLoading(false);
            }
        };

        void loadNotifications();

        return () => {
            controller.abort();
        };
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
                <div className="relative">
                    <button
                        onClick={() => setIsNotificationsOpen((current) => !current)}
                        className="relative p-2.5 rounded-full hover:bg-black/40 transition-colors group backdrop-blur-md border border-white/5 bg-black/20"
                    >
                        <Bell className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-[#0a0a0a]">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-3 w-[320px] rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
                            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                                <p className="text-sm font-bold text-white">Notifications</p>
                                <p className="text-xs text-neutral-400">{unreadCount} unread</p>
                            </div>

                            <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                                {notificationsLoading ? (
                                    <div className="px-4 py-3 space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="animate-pulse flex items-start justify-between gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                                                <div className="space-y-2 w-full">
                                                    <div className="h-4 w-3/4 bg-white/10 rounded" />
                                                    <div className="h-3 w-full bg-white/5 rounded" />
                                                    <div className="h-3 w-5/6 bg-white/5 rounded" />
                                                    <div className="h-2 w-16 bg-white/5 rounded mt-2" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : notificationsError ? (
                                    <div className="px-4 py-6">
                                        <p className="text-sm text-red-300">{notificationsError}</p>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="px-4 py-6">
                                        <p className="text-sm text-neutral-400">No notifications yet.</p>
                                    </div>
                                ) : (
                                    notifications.map((notification) => (
                                        <div key={notification.id} className="px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{notification.title}</p>
                                                    <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{notification.message}</p>
                                                    <p className="text-[11px] text-neutral-500 mt-2">{formatTimeAgo(notification.createdAt)}</p>
                                                </div>
                                                {!notification.read && (
                                                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-lime-500" />
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
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
                    <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 w-fit mb-4">
                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-lime-500 to-emerald-600 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        <span className="text-xs font-medium text-white tracking-wide">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>

                    {/* Quick Access Links */}
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                        <Link href="/landlord/applications?action=walk-in" className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-black rounded-xl backdrop-blur-sm border border-primary transition-all group shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:scale-105 active:scale-95 cursor-pointer">
                            <UserPlus className="w-4 h-4 font-black" />
                            <span className="text-sm font-bold">New Walk-in</span>
                        </Link>
                        <Link href="/landlord/properties" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 transition-colors group">
                            <Home className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium text-white">Properties</span>
                        </Link>
                        <Link href="/landlord/tenants" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 transition-colors group">
                            <Users className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium text-white">Tenants</span>
                        </Link>
                        <Link href="/landlord/maintenance" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 transition-colors group">
                            <Wrench className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium text-white">Maintenance</span>
                        </Link>
                        <Link href="/landlord/applications" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 transition-colors group">
                            <ClipboardList className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium text-white">Applications</span>
                        </Link>
                        <Link href="/landlord/unit-map" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 transition-colors group">
                            <Map className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium text-white">Unit Map</span>
                        </Link>
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
