"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Search, Bell, Wrench, Map, QrCode, UserPlus, Sparkles, Home, Users, FileText, Settings, MessageSquare, CreditCard, AlertTriangle, X, Check, AlertCircle } from "lucide-react";
import { ProfileWidget } from "@/components/landlord/ProfileWidget";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { useNotifications } from "@/context/NotificationContext";
import { LandlordQuestBoard } from "@/components/landlord/dashboard/LandlordQuestBoard";
import { useAuth } from "@/hooks/useAuth";

type SearchResultType = "property" | "tenant" | "maintenance" | "page" | "invoice" | "document";

interface SearchResult {
    id: string;
    type: SearchResultType;
    title: string;
    subtitle: string;
    href: string;
    icon: React.ElementType;
}

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
    const router = useRouter();
    const getManilaTime = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const [time, setTime] = useState<Date>(() => getManilaTime());
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isQuestPanelOpen, setIsQuestPanelOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    const { 
        notifications, 
        unreadCount, 
        loading: notificationsLoading, 
        error: notificationsError,
        markAsRead,
        markAllAsRead 
    } = useNotifications();

    const { profile, user, loading: authLoading } = useAuth();
    const rawName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "";
    const firstName = rawName.split(" ")[0] || "Landlord";
    
    // Replace 'Landlord' in the title if it exists, otherwise use title as is
    const displayTitle = title.includes("Landlord") ? title.replace("Landlord", firstName) : title;
    const displaySubtitle = simplifiedMode ? "Hi! Here is a quick look at your houses today." : subtitle;

    useEffect(() => {
        const handleOpenQuestBoard = () => {
            setIsQuestPanelOpen(true);
        };

        window.addEventListener("open-quest-board", handleOpenQuestBoard);
        return () => window.removeEventListener("open-quest-board", handleOpenQuestBoard);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(getManilaTime());
        }, 1000);
        
        return () => clearInterval(timer);
    }, []);

    const handleClearAll = async () => {
        await markAllAsRead();
    };

    const getNotificationHref = (notification: any) => {
        const data = notification.data || {};
        const id = data.paymentId || data.applicationId || data.maintenanceId || data.conversationId || data.leaseId || data.id || notification.id;
        const type = notification.type;

        // If notification has a signing URL (for countersigning), redirect directly to signing page
        if (data.signingUrl) {
            return data.signingUrl;
        }

        switch (type) {
            case "payment":
                return `/landlord/payments?id=${id}`;
            case "application":
                return `/landlord/applications?id=${id}`;
            case "maintenance":
                return `/landlord/maintenance?id=${id}`;
            case "message":
                return `/landlord/messages?conversation=${id}`;
            case "lease":
                return `/landlord/leases?id=${id}`;
            default:
                return "#";
        }
    };

    const handleNotificationClick = async (notification: any) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        
        const href = getNotificationHref(notification);
        if (href !== "#") {
            router.push(href);
            setIsNotificationsOpen(false);
        }
    };

    const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await markAsRead(id);
    };

    const pageIndex = [
        { title: "Dashboard", href: "/landlord/dashboard", subtitle: "Overview & stats" },
        { title: "Properties", href: "/landlord/properties", subtitle: "Property management" },
        { title: "Tenants", href: "/landlord/tenants", subtitle: "Tenant management" },
        { title: "Messages", href: "/landlord/messages", subtitle: "Communications" },
        { title: "Invoices", href: "/landlord/invoices", subtitle: "Billing & payments" },
        { title: "Maintenance", href: "/landlord/maintenance", subtitle: "Repair requests" },
        { title: "Applications", href: "/landlord/applications", subtitle: "Tenant applications" },
        { title: "Unit Map", href: "/landlord/unit-map", subtitle: "Property map" },
        { title: "Documents", href: "/landlord/documents", subtitle: "File manager" },
        { title: "Analytics", href: "/landlord/analytics", subtitle: "Insights" },
        { title: "Settings", href: "/landlord/settings", subtitle: "Account settings" },
        { title: "Profile", href: "/landlord/profile", subtitle: "Your profile" },
        { title: "Utilities", href: "/landlord/utilities", subtitle: "Utility tracking" },
        { title: "Utility Billing", href: "/landlord/utility-billing", subtitle: "Billing setup" },
        { title: "Community", href: "/landlord/community", subtitle: "Landlord network" },
    ];

    const settingsIndex = [
        { title: "Public Identity", href: "/landlord/settings?category=Identity", subtitle: "Profile & public presence" },
        { title: "Finance & Utilities", href: "/landlord/settings?category=Finance", subtitle: "Payment & utility rates" },
        { title: "Security & Login", href: "/landlord/settings?category=Security", subtitle: "Password, 2FA, sessions" },
        { title: "Notifications", href: "/landlord/settings?category=Notifications", subtitle: "Alerts & communication" },
        { title: "Data & Privacy", href: "/landlord/settings?category=Data", subtitle: "Export & account deletion" },
    ];

    const performSearch = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        const results: SearchResult[] = [];

        const matchedPages = pageIndex.filter(p => 
            p.title.toLowerCase().includes(query.toLowerCase()) || p.subtitle.toLowerCase().includes(query.toLowerCase())
        );
        matchedPages.forEach(p => {
            results.push({
                id: `page-${p.title}`,
                type: "page",
                title: p.title,
                subtitle: p.subtitle,
                href: p.href,
                icon: p.title === "Settings" ? Settings : p.title === "Messages" ? MessageSquare : p.title === "Invoices" ? CreditCard : Home
            });
        });

        const matchedSettings = settingsIndex.filter(s => 
            s.title.toLowerCase().includes(query.toLowerCase()) || s.subtitle.toLowerCase().includes(query.toLowerCase())
        );
        matchedSettings.forEach(s => {
            results.push({
                id: `setting-${s.title}`,
                type: "page",
                title: s.title,
                subtitle: s.subtitle,
                href: s.href,
                icon: Settings
            });
        });

        try {
            setSearchLoading(true);
            const res = await fetch(`/api/landlord/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            
            if (data.results) {
                data.results.forEach((p: { id: string; type: string; title: string; subtitle: string; href: string }) => {
                    results.push({
                        ...p,
                        type: p.type as SearchResultType,
                        icon: Home
                    });
                });
            }
        } catch (e) {
            console.error("Search error:", e);
        } finally {
            setSearchLoading(false);
        }

        if (results.length === 0) {
            results.push({
                id: "no-results",
                type: "page",
                title: "No results found",
                subtitle: `Try a different search term for "${query}"`,
                href: "#",
                icon: Search
            });
        }

        setSearchResults(results);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            performSearch(searchQuery);
        }, 200);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    const handleResultClick = (result: SearchResult) => {
        if (result.href !== "#") {
            router.push(result.href);
        }
        setIsSearchOpen(false);
        setSearchQuery("");
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
                    onClick={() => {
                        setIsQuestPanelOpen(true);
                        window.dispatchEvent(new CustomEvent("open-quest-board"));
                    }}
                    data-tour-id="tour-quest-trigger"
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
                <div className="relative group hidden sm:block" ref={searchRef}>
                    <Search className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search properties, tenants..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsSearchOpen(true);
                        }}
                        onFocus={() => setIsSearchOpen(true)}
                        className="w-64 rounded-2xl border border-white/10 bg-surface-2 py-2.5 pl-11 pr-4 text-sm text-foreground backdrop-blur-xl transition-all placeholder:text-muted-foreground/60 hover:bg-surface-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    
                    {isSearchOpen && searchQuery.trim() && (
                        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-surface-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200">
                            <div className="max-h-80 overflow-y-auto custom-scrollbar-premium">
                                {searchLoading ? (
                                    <div className="px-4 py-4 space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <Skeleton className="h-8 w-8 rounded-lg" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-3 w-24 rounded-full" />
                                                    <Skeleton className="h-2 w-32 rounded-full opacity-60" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    searchResults.slice(0, 6).map((result) => (
                                        <button
                                            key={result.id}
                                            onClick={() => handleResultClick(result)}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/5"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                                <result.icon className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-foreground truncate">{result.title}</p>
                                                <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                            {searchResults.length > 6 && (
                                <div className="border-t border-white/5 px-4 py-2">
                                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                                        {searchResults.length} results - press enter for more
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
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
                                        <div 
                                            key={notification.id} 
                                            onClick={() => handleNotificationClick(notification)}
                                            className="group/item relative px-6 py-4 transition-all hover:bg-white/3 cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-foreground group-hover/item:text-primary transition-colors truncate">{notification.title}</p>
                                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{notification.message}</p>
                                                    <p className="mt-2 text-[10px] font-medium uppercase tracking-tight text-muted-foreground/60">{formatTimeAgo(notification.created_at)}</p>
                                                </div>
                                                <div className="flex items-center justify-center size-8 shrink-0">
                                                    {!notification.read ? (
                                                        <div className="relative flex items-center justify-center size-8">
                                                            <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)] group-hover/item:scale-0 transition-transform duration-300" />
                                                            <button
                                                                onClick={(e) => handleMarkAsRead(e, notification.id)}
                                                                title="Mark as read"
                                                                className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover/item:opacity-100 bg-primary/20 rounded-full text-primary hover:bg-primary/30 transition-all duration-300 transform scale-50 group-hover/item:scale-100"
                                                            >
                                                                <Check className="h-4 w-4 stroke-[3px]" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="h-2 w-2 rounded-full border border-white/10" />
                                                    )}
                                                </div>
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
                                    Mark all as read
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
                            {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
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
                                <UserPlus className="size-5 font-black relative z-10" />
                                <span className="text-sm font-black uppercase tracking-tight relative z-10">New Application</span>
                            </button>
                        ) : (
                            <Link href="/landlord/applications?action=tenant-application" className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-primary px-8 py-4 text-primary-foreground shadow-[0_8px_18px_rgba(var(--primary-rgb),0.28)] transition-all hover:brightness-105 active:scale-95">
                                <div className="absolute inset-0 bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                <UserPlus className="size-5 font-black relative z-10" />
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
                                    <QrCode className="size-5 text-primary" />
                                </button>
                            )}
                            <Link 
                                href="/landlord/maintenance" 
                                title="Maintenance Queue"
                                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl transition-all hover:bg-card"
                            >
                                <Wrench className="size-5 text-amber-500" />
                            </Link>
                            <Link 
                                href="/landlord/unit-map" 
                                title="Unit Map"
                                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl transition-all hover:bg-card"
                            >
                                <Map className="size-5 text-rose-500" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Side - Digital Clock */}
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
            </div>

            {/* Side Quest Panel */}
            <LandlordQuestBoard 
                isOpen={isQuestPanelOpen} 
                onClose={() => setIsQuestPanelOpen(false)} 
            />
        </div>
    );
}

