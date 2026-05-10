"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import {
    Bell,
    User,
    Settings,
    LogOut,
    LayoutDashboard,
    FileText,
    CreditCard,
    MessageSquare,
    Map,
    Home,
    Wrench,
    Menu,
    X,
    LayoutGrid,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/supabase/client-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNotifications } from "@/context/NotificationContext";
import { RoleBadge } from "@/components/profile/RoleBadge";
import { ProfileCardTrigger } from "@/components/ui/ProfileCardTrigger";
import { Skeleton } from "@/components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import type { Notification, Profile } from "@/types/database";

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

const NAV_SECTIONS = [
    {
        category: "Main",
        items: [
            { label: "Dashboard", href: "/tenant/dashboard", icon: LayoutDashboard },
            { label: "Community Hub", href: "/tenant/community", icon: Home },
        ],
    },
    {
        category: "Tenant Tools",
        items: [
            { label: "Leases", href: "/tenant/lease", icon: FileText },
            { label: "Unit Map", href: "/tenant/unit-map", icon: Map },
            { label: "Building Amenities", href: "/tenant/utilities", icon: LayoutGrid },
            { label: "Maintenance", href: "/tenant/maintenance", icon: Wrench },
            { label: "Finance Hub", href: "/tenant/payments", icon: CreditCard },
            { label: "Messages", href: "/tenant/messages", icon: MessageSquare },
        ],
    },
];

export function TenantSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const mobileNotificationsRef = useRef<HTMLDivElement>(null);
    const { profile, user } = useAuth();
    const { 
        notifications, 
        unreadCount, 
        loading: notificationsLoading, 
        error: notificationsError,
        markAsRead,
        markAllAsRead,
        importantNotifications
    } = useNotifications();

    const isUrgent = (type: string) => importantNotifications.some(n => n.type === type);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
            if (mobileNotificationsRef.current && !mobileNotificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        
        const data = (notification.data || {}) as any;
        const type = notification.type;
        const id = data.paymentId || data.applicationId || data.maintenanceId || data.conversationId || data.leaseId || data.id || notification.id;

        let href = "#";
        switch (type) {
            case "payment":
                href = `/tenant/payments?id=${id}`;
                break;
            case "lease":
                href = `/tenant/lease?id=${id}`;
                break;
            case "maintenance":
                href = `/tenant/maintenance?id=${id}`;
                break;
            case "message":
                href = `/tenant/messages?conversation=${id}`;
                break;
            default:
                href = "/tenant/dashboard";
        }

        if (href !== "#") {
            router.push(href);
            setIsNotificationsOpen(false);
        }
    };

    const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
    const avatarUrl =
        profile?.avatar_url ||
        user?.user_metadata?.avatar_url ||
        "https://images.unsplash.com/photo-1529778456-9a2cf1fbe4a8?auto=format&fit=crop&w=150&q=80";
    const avatarBgColor = profile?.avatar_bg_color || "#171717";
    const renderNav = (compact = false) => (
        <nav className={cn("space-y-8", compact && "pt-2")}>
            {NAV_SECTIONS.map((section) => (
                <div key={section.category}>
                    <h3 className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {section.category}
                    </h3>
                    <div className="space-y-1">
                        {section.items.map((item) => {
                            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={cn(
                                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-muted/80",
                                        active
                                            ? "bg-primary/10 text-foreground hover:bg-primary/15"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <item.icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                    <span className="flex-1">{item.label}</span>
                                    {((item.href === '/tenant/lease' && (isUrgent('lease') || isUrgent('lease_renewal_request'))) ||
                                      (item.href === '/tenant/maintenance' && isUrgent('maintenance')) ||
                                      (item.href === '/tenant/payments' && isUrgent('payment'))) && (
                                        <span className="size-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </nav>
    );

    return (
        <>
            <header className="md:hidden sticky top-0 z-[90] h-16 border-b border-border/80 bg-background">
                <div className="h-full px-4 flex items-center justify-between">
                    <Link href="/tenant/dashboard" className="flex items-center">
                        <Logo className="h-30 w-66" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="relative" ref={mobileNotificationsRef}>
                            <button
                                type="button"
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className={cn(
                                    "relative flex size-9 items-center justify-center rounded-lg border border-border transition-all",
                                    isNotificationsOpen ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
                                )}
                                aria-label="Notifications"
                            >
                                <Bell className="size-4" />
                                {unreadCount > 0 && (
                                    <span className={cn(
                                        "absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full text-[8px] font-bold",
                                        isNotificationsOpen ? "bg-background text-primary" : "bg-primary text-primary-foreground"
                                    )}>
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </button>

                            <AnimatePresence>
                                {isNotificationsOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-xl"
                                    >
                                        <NotificationPanelContent 
                                            notifications={notifications}
                                            loading={notificationsLoading}
                                            error={notificationsError}
                                            unreadCount={unreadCount}
                                            onNotificationClick={handleNotificationClick}
                                            onMarkAllAsRead={markAllAsRead}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsMobileOpen((prev) => !prev)}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
                            aria-label="Toggle tenant navigation"
                        >
                            {isMobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                        </button>
                    </div>
                </div>
            </header>

            <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/70 bg-card flex-col text-foreground" data-tour-id="tour-tenant-navigation">
                <div className="h-20 px-6 border-b border-border/70 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Logo className="h-30 w-36" />
                    </div>
                    <ThemeToggle variant="sidebar" dataTourId="tour-theme-toggle" />
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-8">
                    {renderNav()}
                </div>

                <div className="border-t border-border/70 p-4">
                    <div className="mb-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-left">
                        <ProfileCardTrigger 
                            userId={user?.id || ""} 
                            initialData={{ full_name: displayName, avatar_url: avatarUrl, role: profile?.role as Profile["role"] }}
                            asChild
                        >
                            <div className="relative size-10 overflow-hidden rounded-full ring-2 ring-border cursor-pointer hover:ring-primary transition-all" style={{ backgroundColor: avatarBgColor }}>
                                <Image src={avatarUrl} alt="Profile" fill className="object-cover" />
                            </div>
                        </ProfileCardTrigger>
                        <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                                <ProfileCardTrigger 
                                    userId={user?.id || ""} 
                                    initialData={{ full_name: displayName, avatar_url: avatarUrl, role: profile?.role as Profile["role"] }}
                                >
                                    <p className="truncate text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer">{displayName}</p>
                                </ProfileCardTrigger>
                                <RoleBadge role={profile?.role ?? null} />
                            </div>
                            <p className="truncate text-xs text-muted-foreground">{profile?.email || user?.email || "Tenant Account"}</p>
                        </div>
                        <div className="relative" ref={notificationsRef}>
                            <button 
                                type="button" 
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className={cn(
                                    "relative rounded-full p-2 transition-all active:scale-95",
                                    isNotificationsOpen ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )} 
                                aria-label="Notifications"
                            >
                                <Bell className="size-4" />
                                {unreadCount > 0 && (
                                    <span className={cn(
                                        "absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full text-[8px] font-bold",
                                        isNotificationsOpen ? "bg-background text-primary" : "bg-primary text-primary-foreground"
                                    )}>
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </button>

                            <AnimatePresence>
                                {isNotificationsOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                        className="absolute left-full bottom-0 z-50 mb-0 ml-4 w-80 overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-xl"
                                    >
                                        <NotificationPanelContent 
                                            notifications={notifications}
                                            loading={notificationsLoading}
                                            error={notificationsError}
                                            unreadCount={unreadCount}
                                            onNotificationClick={handleNotificationClick}
                                            onMarkAllAsRead={markAllAsRead}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Link href="/tenant/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground">
                            <User className="size-4" />
                            Profile
                        </Link>
                        <Link href="/tenant/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground">
                            <Settings className="size-4" />
                            Settings
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                void signOut()
                            }}
                            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500 text-left"
                        >
                            <LogOut className="size-5" />
                            Log Out
                        </button>
                    </div>
                </div>
            </aside>

            <div className={cn("md:hidden fixed inset-0 z-[100]", isMobileOpen ? "pointer-events-auto" : "pointer-events-none")}>
                <div
                    className={cn(
                        "absolute inset-0 bg-black/40 transition-opacity duration-200",
                        isMobileOpen ? "opacity-100" : "opacity-0"
                    )}
                    onClick={() => setIsMobileOpen(false)}
                />

                <aside
                    className={cn(
                        "absolute left-0 top-0 h-full w-72 border-r border-border bg-background p-4 transition-transform duration-200",
                        isMobileOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    <div className="mb-6 flex items-center justify-between">
                        <Link href="/tenant/dashboard" className="flex items-center" onClick={() => setIsMobileOpen(false)}>
                            <Logo className="h-9 w-28" />
                        </Link>
                        <button
                            type="button"
                            onClick={() => setIsMobileOpen(false)}
                            className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-card"
                            aria-label="Close tenant navigation"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    {renderNav(true)}

                    <div className="mt-6 border-t border-border pt-4 space-y-1">
                        <Link href="/tenant/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setIsMobileOpen(false)}>
                            <User className="size-4" />
                            Profile
                        </Link>
                        <Link href="/tenant/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setIsMobileOpen(false)}>
                            <Settings className="size-4" />
                            Settings
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                void signOut()
                            }}
                            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 text-left"
                        >
                            <LogOut className="size-4" />
                            Log Out
                        </button>
                    </div>
                </aside>
            </div>
        </>
    );
}

export const TenantNavbar = TenantSidebar;

function NotificationPanelContent({ 
    notifications, 
    loading, 
    error, 
    unreadCount, 
    onNotificationClick, 
    onMarkAllAsRead 
}: { 
    notifications: Notification[], 
    loading: boolean, 
    error: string | null, 
    unreadCount: number, 
    onNotificationClick: (n: Notification) => void, 
    onMarkAllAsRead: () => void 
}) {
    return (
        <>
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Notifications</p>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{unreadCount} New</span>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar-premium">
                {loading ? (
                    <div className="px-6 py-4 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-3/4 rounded-full" />
                                <Skeleton className="h-3 w-full rounded-full opacity-60" />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="px-6 py-8 text-center text-red-500">
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="px-6 py-12 text-center text-muted-foreground">
                        <Sparkles className="size-8 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-bold">All caught up!</p>
                        <p className="text-[10px] mt-1 opacity-60">You have no notifications yet</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div 
                            key={notification.id} 
                            onClick={() => onNotificationClick(notification)}
                            className="group/item relative px-6 py-4 transition-all hover:bg-muted/50 cursor-pointer border-b border-border/30 last:border-0"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-foreground group-hover/item:text-primary transition-colors truncate">{notification.title}</p>
                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{notification.message}</p>
                                    <p className="mt-2 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">{formatTimeAgo(notification.created_at)}</p>
                                </div>
                                {!notification.read && (
                                    <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="border-t border-border/50 p-3 bg-muted/20">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onMarkAllAsRead();
                    }}
                    className="w-full rounded-xl py-2 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground transition-all hover:bg-card hover:text-primary hover:shadow-sm"
                >
                    Mark all as read
                </button>
            </div>
        </>
    );
}

