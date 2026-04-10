"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, Bell, Wrench, Map, QrCode, UserPlus } from "lucide-react";
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
    onNewWalkIn?: () => void;
    onCreateInvite?: () => void;
}

export function DashboardBanner({
    title = "Welcome back, Landlord",
    subtitle = "Here's what's happening with your properties today.",
    image = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop", // City Night Architecture
    className,
    simplifiedMode = false,
    onNewWalkIn,
    onCreateInvite
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
                "group relative h-48 min-h-[192px] w-full shrink-0 overflow-visible rounded-3xl border border-border shadow-lg shadow-slate-200/60 md:h-64 md:min-h-[256px] dark:shadow-2xl dark:shadow-black/30",
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
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/88 via-60% to-white/20 dark:from-[#0a0a0a] dark:via-[#0a0a0a]/80 dark:to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/75 via-white/10 to-transparent dark:from-[#0a0a0a] dark:via-transparent dark:to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.95),transparent_30%)] dark:bg-none" />
            </div>

            {/* Top Right Header Actions */}
            <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative group hidden sm:block">
                    <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-slate-700 dark:text-neutral-300 dark:group-focus-within:text-white" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full rounded-full border border-white/70 bg-white/80 py-2 pl-10 pr-4 text-sm text-slate-800 shadow-md shadow-slate-200/50 backdrop-blur-md transition-all placeholder:text-slate-400 hover:bg-white md:w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/40 dark:text-white dark:shadow-emerald-900/10 dark:placeholder:text-white/40 dark:hover:bg-black/60"
                    />
                </div>

                {/* Profile Widget */}
                <ProfileWidget />

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setIsNotificationsOpen((current) => !current)}
                        className="group relative rounded-full border border-white/70 bg-white/80 p-2.5 shadow-md shadow-slate-200/50 backdrop-blur-md transition-colors hover:bg-white dark:border-white/5 dark:bg-black/20 dark:shadow-none dark:hover:bg-black/40"
                    >
                        <Bell className="h-5 w-5 text-slate-500 transition-colors group-hover:text-slate-900 dark:text-white/70 dark:group-hover:text-white" />
                        {unreadCount > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-black/60">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {isNotificationsOpen && (
                        <div className="absolute right-0 z-50 mt-3 w-[320px] overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/95">
                            <div className="flex items-center justify-between border-b border-border px-4 py-3 dark:border-white/10">
                                <p className="text-sm font-bold text-foreground dark:text-white">Notifications</p>
                                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                            </div>

                            <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                                {notificationsLoading ? (
                                    <div className="px-4 py-3 space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0 animate-pulse dark:border-white/5">
                                                <div className="space-y-2 w-full">
                                                    <div className="h-4 w-3/4 rounded bg-muted" />
                                                    <div className="h-3 w-full rounded bg-muted/80" />
                                                    <div className="h-3 w-5/6 rounded bg-muted/80" />
                                                    <div className="mt-2 h-2 w-16 rounded bg-muted/80" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : notificationsError ? (
                                    <div className="px-4 py-6">
                                        <p className="text-sm text-red-600 dark:text-red-300">{notificationsError}</p>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="px-4 py-6">
                                        <p className="text-sm text-muted-foreground">No notifications yet.</p>
                                    </div>
                                ) : (
                                    notifications.map((notification) => (
                                        <div key={notification.id} className="border-b border-border px-4 py-3 transition-colors hover:bg-muted/60 last:border-b-0 dark:border-white/5 dark:hover:bg-white/5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground dark:text-white">{notification.title}</p>
                                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground dark:text-neutral-300">{notification.message}</p>
                                                    <p className="mt-2 text-[11px] text-muted-foreground">{formatTimeAgo(notification.createdAt)}</p>
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
                    <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl dark:text-white dark:drop-shadow-lg">
                        {title}
                    </h1>
                    <p className="max-w-xl text-sm font-medium text-slate-600 md:text-lg dark:text-neutral-300 dark:drop-shadow-md">
                        {displaySubtitle}
                    </p>

                    {/* Date Badge */}
                    <div className="mb-4 mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 backdrop-blur-md dark:border-white/10 dark:bg-white/10">
                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-lime-500 to-emerald-600 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        <span className="text-xs font-medium tracking-wide text-slate-700 dark:text-white">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>

                    {/* Quick Access Links */}
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                        {onNewWalkIn ? (
                            <button 
                                onClick={onNewWalkIn}
                                className="group relative flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-2xl bg-primary px-6 py-3 text-primary-foreground shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(var(--primary-rgb),0.45)] active:scale-95"
                            >
                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <UserPlus className="w-4.5 h-4.5 font-black relative z-10" />
                                <span className="text-sm font-black tracking-tight relative z-10">New Application</span>
                            </button>
                        ) : (
                            <Link href="/landlord/applications?action=tenant-application" className="group relative flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-2xl bg-primary px-6 py-3 text-primary-foreground shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(var(--primary-rgb),0.45)] active:scale-95">
                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <UserPlus className="w-4.5 h-4.5 font-black relative z-10" />
                                <span className="text-sm font-black tracking-tight relative z-10">New Application</span>
                            </Link>
                        )}
                        {onCreateInvite && (
                            <button
                                onClick={onCreateInvite}
                                className="group flex items-center gap-2 rounded-xl border border-white/70 bg-white/75 px-4 py-2 text-slate-700 backdrop-blur-sm transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                            >
                                <QrCode className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">Invite Link</span>
                            </button>
                        )}
                        <Link href="/landlord/maintenance" className="group flex items-center gap-2 rounded-xl border border-white/70 bg-white/75 px-4 py-2 text-slate-700 backdrop-blur-sm transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                            <Wrench className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">Maintenance</span>
                        </Link>
                        <Link href="/landlord/unit-map" className="group flex items-center gap-2 rounded-xl border border-white/70 bg-white/75 px-4 py-2 text-slate-700 backdrop-blur-sm transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                            <Map className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">Unit Map</span>
                        </Link>
                    </div>
                </div>

                {/* Right Side - Real-Clock */}
                {time && (
                    <div className="hidden lg:flex flex-col items-end justify-center text-right mt-12 self-center">
                        <div className="font-mono text-6xl font-bold tracking-tighter text-slate-900 tabular-nums dark:text-white dark:drop-shadow-2xl">
                            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ')[0]}
                            <span className="ml-2 text-2xl font-sans font-medium tracking-normal text-slate-500 dark:text-neutral-400">
                                {time.toLocaleTimeString('en-US', { hour12: true }).split(' ')[1]}
                            </span>
                        </div>
                        <div className="mt-1 text-sm font-medium uppercase tracking-widest text-slate-500 dark:text-neutral-400">
                            Local Time
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
