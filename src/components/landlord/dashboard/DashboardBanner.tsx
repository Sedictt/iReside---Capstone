"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, Bell, Wrench, Map, QrCode, UserPlus, Sparkles } from "lucide-react";
import { ProfileWidget } from "@/components/landlord/ProfileWidget";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { useNotifications } from "@/context/NotificationContext";
import { LandlordQuestBoard } from "@/components/landlord/dashboard/LandlordQuestBoard";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
    const [isQuestPanelOpen, setIsQuestPanelOpen] = useState(false);
    
    const { 
        notifications, 
        unreadCount, 
        loading: notificationsLoading, 
        error: notificationsError,
        markAllAsRead 
    } = useNotifications();

    const { profile, user, loading: authLoading } = useAuth();
    const rawName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "";
    const firstName = rawName.split(" ")[0] || "Landlord";
    
    // Replace 'Landlord' in the title if it exists, otherwise use title as is
    const displayTitle = title.includes("Landlord") ? title.replace("Landlord", firstName) : title;
    const displaySubtitle = simplifiedMode ? "Hi! Here is a quick look at your houses today." : subtitle;

    useEffect(() => {
        const getManilaTime = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
        setTime(getManilaTime());
        const timer = setInterval(() => {
            setTime(getManilaTime());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleClearAll = async () => {
        await markAllAsRead();
    };

    return (
        <div
            className={cn(
                "group relative min-h-[480px] w-full shrink-0 overflow-visible rounded-[2.5rem] border border-white/10 bg-surface-1 shadow-2xl shadow-black/30 transition-all duration-500",
                className
            )}>
            {/* Background Layer */}
            <div className="absolute inset-0 overflow-hidden rounded-[2.5rem]">
                <img
                    src={image}
                    alt="Dashboard Banner"
                    className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110 opacity-60 dark:opacity-40"
                />
                
                {/* Noise Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                {/* Progressive Gradients */}
                <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/90 to-background/20" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/95 to-transparent" />
                
                {/* Decorative Spotlight */}
                <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/5 blur-[80px] pointer-events-none" />
            </div>

            {/* Header Actions */}
            <div className="absolute top-8 right-8 z-20 flex items-center gap-4">
                {/* Mission Control Trigger - Glowing Exclamation */}
                <button
                    onClick={() => setIsQuestPanelOpen(true)}
                    className="relative group flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-xl transition-all hover:bg-primary/10 active:scale-95"
                >
                    <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-pulse blur-md pointer-events-none" />
                    <AlertCircle className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                    
                    {/* Tooltip-like label */}
                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 scale-0 px-2 py-1 rounded bg-surface-4 text-[10px] font-bold text-foreground opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all whitespace-nowrap border border-white/5 shadow-xl">
                        View Missions
                    </span>
                </button>

                {/* Search Bar - Premium Glassmorphism */}
                <div className="relative group hidden sm:block">
                    <Search className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <input
                        type="text"
                        placeholder="Search properties, tenants..."
                        className="w-64 rounded-2xl border border-white/10 bg-surface-2 py-2.5 pl-11 pr-4 text-sm text-foreground backdrop-blur-xl transition-all placeholder:text-muted-foreground/60 hover:bg-surface-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setIsNotificationsOpen((current) => !current)}
                        className="group relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-surface-2 backdrop-blur-xl transition-all hover:bg-surface-3 active:scale-95"
                    >
                        <Bell className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                        {unreadCount > 0 && (
                            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-black text-primary-foreground shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {isNotificationsOpen && (
                        <div className="absolute right-0 z-50 mt-4 w-[340px] overflow-hidden rounded-[2rem] border border-white/10 bg-surface-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                                <p className="text-sm font-black uppercase tracking-widest text-foreground">Notifications</p>
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{unreadCount} New</span>
                            </div>

                            <div className="max-h-[360px] overflow-y-auto custom-scrollbar-premium">
                                {notificationsLoading ? (
                                    <div className="px-6 py-4 space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="space-y-2">
                                                <Skeleton className="h-4 w-3/4 rounded-full" />
                                                <Skeleton className="h-3 w-full rounded-full opacity-60" />
                                                <Skeleton className="h-2 w-16 rounded-full opacity-40 mt-2" />
                                            </div>
                                        ))}
                                    </div>
                                ) : notificationsError ? (
                                    <div className="px-6 py-8 text-center text-red-400">
                                        <p className="text-sm">{notificationsError}</p>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="px-6 py-12 text-center text-muted-foreground">
                                        <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">All caught up!</p>
                                    </div>
                                ) : (
                                    notifications.map((notification) => (
                                        <div key={notification.id} className="group/item relative px-6 py-4 transition-all hover:bg-white/3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-bold text-foreground group-hover/item:text-primary transition-colors">{notification.title}</p>
                                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{notification.message}</p>
                                                    <p className="mt-2 text-[10px] font-medium uppercase tracking-tight text-muted-foreground/60">{formatTimeAgo(notification.created_at)}</p>
                                                </div>
                                                {!notification.read && (
                                                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="border-t border-white/5 p-3">
                                <button 
                                    onClick={handleClearAll}
                                    className="w-full rounded-xl py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-card hover:text-foreground"
                                >
                                    Clear all notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Widget */}
                <div className="flex items-center gap-3 border-l border-white/10 pl-4">
                    <ProfileWidget />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="absolute inset-0 z-10 flex items-center justify-between px-8 md:px-14">
                <div data-tour-id="tour-welcome-area" className="flex flex-col justify-center max-w-2xl py-12">
                    {/* Badge */}
                    <div className="mb-6 flex items-center gap-2.5 w-fit rounded-full border border-white/10 bg-card/60 px-4 py-1.5 backdrop-blur-xl">
                        <div className="relative">
                            <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                            <div className="absolute inset-0 h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
                            {time?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) || "Loading..."}
                        </span>
                    </div>

                    <h1 className="mb-4 text-4xl font-black tracking-tight text-foreground md:text-6xl leading-[1.1]">
                        {displayTitle}
                        <span className="text-primary prose-invert">.</span>
                    </h1>
                    
                    <p className="max-w-lg text-base font-medium text-muted-foreground md:text-xl leading-relaxed">
                        {displaySubtitle}
                    </p>

                    {/* Navigation Actions */}
                    <div className="flex flex-wrap items-center gap-4 mt-10">
                        {onNewWalkIn ? (
                            <button 
                                onClick={onNewWalkIn}
                                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-primary px-8 py-4 text-primary-foreground shadow-[0_8px_18px_rgba(var(--primary-rgb),0.28)] transition-all hover:brightness-105 active:scale-95"
                            >
                                <div className="absolute inset-0 bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                <UserPlus className="w-5 h-5 font-black relative z-10" />
                                <span className="text-sm font-black uppercase tracking-tight relative z-10">New Application</span>
                            </button>
                        ) : (
                            <Link href="/landlord/applications?action=tenant-application" className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-primary px-8 py-4 text-primary-foreground shadow-[0_8px_18px_rgba(var(--primary-rgb),0.28)] transition-all hover:brightness-105 active:scale-95">
                                <div className="absolute inset-0 bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                <UserPlus className="w-5 h-5 font-black relative z-10" />
                                <span className="text-sm font-black uppercase tracking-tight relative z-10">New Application</span>
                            </Link>
                        )}
                        
                        <div className="flex items-center gap-2">
                            {onCreateInvite && (
                                <button
                                    onClick={onCreateInvite}
                                    title="Create Invite link"
                                    className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl transition-all hover:bg-card"
                                >
                                    <QrCode className="w-5 h-5 text-primary" />
                                </button>
                            )}
                            <Link 
                                href="/landlord/maintenance" 
                                title="Maintenance Queue"
                                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl transition-all hover:bg-card"
                            >
                                <Wrench className="w-5 h-5 text-amber-500" />
                            </Link>
                            <Link 
                                href="/landlord/unit-map" 
                                title="Unit Map"
                                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl transition-all hover:bg-card"
                            >
                                <Map className="w-5 h-5 text-rose-500" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Side - Digital Clock */}
                {time && (
                    <div className="hidden lg:flex flex-col items-end mt-16 self-center">
                        <div className="flex items-baseline gap-2">
                            <span className="font-mono text-7xl font-black tracking-tighter text-foreground tabular-nums">
                                {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
                            </span>
                            <span className="text-2xl font-black uppercase tracking-[0.2em] text-primary">
                                {time.getHours() >= 12 ? 'PM' : 'AM'}
                            </span>
                        </div>
                        <div className="mt-2 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">
                            Local Operation Time
                        </div>
                    </div>
                )}
            </div>

            {/* Side Quest Panel */}
            <LandlordQuestBoard 
                isOpen={isQuestPanelOpen} 
                onClose={() => setIsQuestPanelOpen(false)} 
            />
        </div>
    );
}
