import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { 
    Search, 
    Bell, 
    Settings, 
    MessageSquare, 
    CreditCard, 
    Home, 
    AlertCircle, 
    Sparkles, 
    Check, 
    FileText, 
    Wrench, 
    Users, 
    PlusCircle, 
    Activity, 
    ShieldCheck, 
    MapPin, 
    Zap, 
    Building2, 
    KeyRound, 
    QrCode,
    Compass,
    SlidersHorizontal,
    FileCheck2,
    CalendarClock,
    Palette,
    Banknote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { useNotifications } from "@/context/NotificationContext";
import { ProfileWidget } from "@/components/landlord/ProfileWidget";
import { MissionTriggerButton } from "@/components/landlord/dashboard/MissionTriggerButton";

type SearchResultType = "action" | "page" | "setting" | "property" | "unit" | "maintenance" | "tenant" | "invoice";

interface SearchResult {
    id: string;
    type: SearchResultType;
    title: string;
    subtitle: string;
    href: string;
    icon: React.ElementType;
    keywords?: string[];
    badge?: string;
}

// ─── Static Feature & Action Index ────────────────────────────────────
const FEATURE_INDEX: SearchResult[] = [
    // ── Quick Actions ──
    {
        id: "action-collect-payment",
        type: "action",
        title: "Record Rent Payment / Collect",
        subtitle: "Log cash, GCash, or bank rent and issue receipt",
        href: "/landlord/dashboard?action=collect-payment",
        icon: Banknote,
        badge: "Action",
        keywords: ["collect payment", "record payment", "cash payment", "receive rent", "pay rent", "receipt", "rent collection", "settle balance", "log payment"]
    },
    {
        id: "action-walk-in",
        type: "action",
        title: "New Lease / Walk-in Intake",
        subtitle: "Fast applicant registration and contract generation",
        href: "/landlord/applications?action=walk-in",
        icon: PlusCircle,
        badge: "Action",
        keywords: ["new lease", "create lease", "walk in", "intake", "contract", "tenant", "apply", "onboard"]
    },
    {
        id: "action-invite",
        type: "action",
        title: "Invite Prospective Tenant",
        subtitle: "Generate digital application invite link or QR",
        href: "/landlord/applications",
        icon: QrCode,
        badge: "Action",
        keywords: ["invite", "manager", "link", "qr", "onboard", "share", "applicant"]
    },
    {
        id: "action-meter-readings",
        type: "action",
        title: "Record Meter Readings",
        subtitle: "Input water and electricity measurements for units",
        href: "/landlord/utility-billing",
        icon: Zap,
        badge: "Action",
        keywords: ["meter", "water", "electricity", "readings", "kwh", "cubic", "utility", "bill"]
    },
    {
        id: "action-gcash",
        type: "action",
        title: "Configure GCash Payments",
        subtitle: "Setup GCash number and tenant payment QR code",
        href: "/landlord/settings?category=Finance",
        icon: CreditCard,
        badge: "Action",
        keywords: ["gcash", "qr", "payment", "transfer", "finance", "receive", "payout"]
    },
    {
        id: "action-new-maintenance",
        type: "action",
        title: "Log Repair Ticket",
        subtitle: "Create a new maintenance work order",
        href: "/landlord/maintenance",
        icon: Wrench,
        badge: "Action",
        keywords: ["repair", "fix", "ticket", "maintenance", "work order", "issue", "plumbing", "electrical"]
    },
    {
        id: "action-floorplan",
        type: "action",
        title: "Visual Floor Planner",
        subtitle: "Interactive blueprint editor and room arrangement",
        href: "/landlord/unit-map",
        icon: Compass,
        badge: "Action",
        keywords: ["map", "unit map", "floor", "canvas", "blueprint", "visual", "editor", "drag", "layout"]
    },

    // ── Pages & Portals ──
    {
        id: "page-dashboard",
        type: "page",
        title: "Dashboard Overview",
        subtitle: "Revenue stats, occupancy health & quick actions",
        href: "/landlord/dashboard",
        icon: Home,
        badge: "Page",
        keywords: ["dashboard", "home", "stats", "overview", "analytics", "summary", "revenue"]
    },
    {
        id: "page-properties",
        type: "page",
        title: "Properties Directory",
        subtitle: "Manage buildings, portfolio addresses & inventory",
        href: "/landlord/properties",
        icon: Building2,
        badge: "Page",
        keywords: ["properties", "buildings", "real estate", "portfolio", "units", "complex"]
    },
    {
        id: "page-unit-map",
        type: "page",
        title: "Unit Map & Blueprints",
        subtitle: "Live floor layouts, status markers & space utilization",
        href: "/landlord/unit-map",
        icon: Compass,
        badge: "Page",
        keywords: ["unit map", "floor plan", "blueprint", "rooms", "layout", "visual planner"]
    },
    {
        id: "page-leases",
        type: "page",
        title: "Lease Hub",
        subtitle: "Active leases, renewals, signing status & archives",
        href: "/landlord/leases",
        icon: FileCheck2,
        badge: "Page",
        keywords: ["leases", "lease hub", "contracts", "agreements", "tenancy", "renewals", "archive"]
    },
    {
        id: "page-applications",
        type: "page",
        title: "Rent Applications",
        subtitle: "Review prospective tenants, screening & KYC compliance",
        href: "/landlord/applications",
        icon: Users,
        badge: "Page",
        keywords: ["applications", "applicants", "screening", "intake", "kyc", "verification"]
    },
    {
        id: "page-tenants",
        type: "page",
        title: "Tenants Directory",
        subtitle: "Resident contacts, payment history & unit assignments",
        href: "/landlord/tenants",
        icon: Users,
        badge: "Page",
        keywords: ["tenants", "residents", "directory", "occupants", "contacts", "people"]
    },
    {
        id: "page-maintenance",
        type: "page",
        title: "Maintenance Operations",
        subtitle: "Track repairs, work orders, priority triage & dispatch",
        href: "/landlord/maintenance",
        icon: Wrench,
        badge: "Page",
        keywords: ["maintenance", "repairs", "tickets", "work orders", "contractors", "issues", "fixes"]
    },
    {
        id: "page-utility-billing",
        type: "page",
        title: "Utility Billing Hub",
        subtitle: "Automated utility recovery, submetering & invoice logs",
        href: "/landlord/utility-billing",
        icon: Zap,
        badge: "Page",
        keywords: ["utility billing", "utilities", "meters", "water", "electricity", "submeter", "rates"]
    },
    {
        id: "page-facilities",
        type: "page",
        title: "Property Facilities",
        subtitle: "Amenity schedules, clubhouse bookings & reservations",
        href: "/landlord/facilities",
        icon: CalendarClock,
        badge: "Page",
        keywords: ["facilities", "amenities", "pool", "gym", "clubhouse", "reservations", "bookings"]
    },
    {
        id: "page-invoices",
        type: "page",
        title: "Invoices & Payments",
        subtitle: "Track rent payments, late fees & payment ledger",
        href: "/landlord/invoices",
        icon: CreditCard,
        badge: "Page",
        keywords: ["invoices", "payments", "rent", "billing", "receipts", "collections", "ledger"]
    },
    {
        id: "page-analytics",
        type: "page",
        title: "Financial Analytics",
        subtitle: "Revenue trends, yield performance & occupancy reports",
        href: "/landlord/analytics",
        icon: Activity,
        badge: "Page",
        keywords: ["analytics", "reports", "revenue", "trends", "financials", "occupancy", "yield"]
    },
    {
        id: "page-documents",
        type: "page",
        title: "Document Vault",
        subtitle: "Signed tenancy contracts, certificates & templates",
        href: "/landlord/documents",
        icon: FileText,
        badge: "Page",
        keywords: ["documents", "vault", "files", "pdf", "contracts", "templates", "signatures"]
    },
    {
        id: "page-messages",
        type: "page",
        title: "Messages & Inbox",
        subtitle: "Tenant communication channels & announcements",
        href: "/landlord/messages",
        icon: MessageSquare,
        badge: "Page",
        keywords: ["messages", "inbox", "chat", "conversations", "support", "communication"]
    },
    {
        id: "page-community",
        type: "page",
        title: "Community Hub",
        subtitle: "Property announcements & resident social board",
        href: "/landlord/community",
        icon: Users,
        badge: "Page",
        keywords: ["community", "forum", "announcements", "bulletin", "social", "board"]
    },

    // ── Settings ──
    {
        id: "setting-identity",
        type: "setting",
        title: "Public Identity Settings",
        subtitle: "Avatar, business permit & contact details",
        href: "/landlord/settings?category=Identity",
        icon: Settings,
        badge: "Settings",
        keywords: ["profile", "identity", "name", "permit", "phone", "email", "business", "avatar"]
    },
    {
        id: "setting-personalization",
        type: "setting",
        title: "Personalization & Branding",
        subtitle: "Themes, high contrast, brand colors, property logo & banner photos",
        href: "/landlord/settings?category=Personalization",
        icon: Palette,
        badge: "Settings",
        keywords: ["personalization", "customization", "theme", "dark mode", "light mode", "high contrast", "banner", "logo", "branding", "colors"]
    },
    {
        id: "setting-finance",
        type: "setting",
        title: "Finance & Rates Configuration",
        subtitle: "GCash settings, bank accounts & default utility charges",
        href: "/landlord/settings?category=Finance",
        icon: SlidersHorizontal,
        badge: "Settings",
        keywords: ["finance", "gcash", "bank", "rates", "utility rates", "fees", "penalties"]
    },
    {
        id: "setting-security",
        type: "setting",
        title: "Security & Login",
        subtitle: "Password update, 2FA authentication & active sessions",
        href: "/landlord/settings?category=Security",
        icon: KeyRound,
        badge: "Settings",
        keywords: ["security", "password", "2fa", "two factor", "otp", "login", "auth"]
    },
    {
        id: "setting-notifications",
        type: "setting",
        title: "Notification Preferences",
        subtitle: "Email alerts, in-app sounds & dispatch triggers",
        href: "/landlord/settings?category=Notifications",
        icon: Bell,
        badge: "Settings",
        keywords: ["notifications", "alerts", "email alerts", "sounds", "push"]
    },
    {
        id: "setting-data",
        type: "setting",
        title: "Data & Privacy Controls",
        subtitle: "Data export, privacy agreements & audit logs",
        href: "/landlord/settings?category=Data",
        icon: ShieldCheck,
        badge: "Settings",
        keywords: ["data", "privacy", "export", "backup", "audit", "compliance"]
    }
];

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

interface DashboardHeaderActionsProps {
    onQuestPanelOpen: () => void;
}

export function DashboardHeaderActions({ onQuestPanelOpen }: DashboardHeaderActionsProps) {
    const router = useRouter();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const searchCacheRef = useRef<Map<string, SearchResult[]>>(new Map());
    
    const { 
        notifications, 
        unreadCount, 
        loading: notificationsLoading, 
        error: notificationsError,
        markAsRead,
        markAllAsRead,
        refresh
    } = useNotifications();

    // Fast synchronous index search
    const getLocalMatches = useCallback((query: string): SearchResult[] => {
        const cleanQuery = query.trim().toLowerCase();
        if (!cleanQuery) return [];

        const terms = cleanQuery.split(/\s+/).filter(Boolean);

        return FEATURE_INDEX.filter((item) => {
            const titleMatch = item.title.toLowerCase();
            const subtitleMatch = item.subtitle.toLowerCase();
            const keywords = item.keywords || [];

            return terms.every((term) => 
                titleMatch.includes(term) || 
                subtitleMatch.includes(term) || 
                keywords.some(k => k.toLowerCase().includes(term))
            );
        });
    }, []);

    // Perform dual-tier fast search
    const performSearch = useCallback(async (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        // 1. Instant local indexed matches (0ms response)
        const localMatches = getLocalMatches(trimmed);
        setSearchResults(localMatches);
        setSelectedIndex(0);

        // 2. Check client-side memory cache for database results
        const cacheKey = trimmed.toLowerCase();
        if (searchCacheRef.current.has(cacheKey)) {
            const cachedServerResults = searchCacheRef.current.get(cacheKey) || [];
            // Merge local and cached
            const merged = [...localMatches];
            cachedServerResults.forEach(serverItem => {
                if (!merged.some(m => m.id === serverItem.id)) {
                    merged.push(serverItem);
                }
            });
            setSearchResults(merged);
            return;
        }

        // 3. Cancel previous fetch in flight
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setSearchLoading(true);
            const res = await fetch(`/api/landlord/search?q=${encodeURIComponent(trimmed)}`, {
                signal: controller.signal
            });
            if (!res.ok) throw new Error("Search failed");
            const data = await res.json();

            if (!controller.signal.aborted && Array.isArray(data.results)) {
                const serverResults: SearchResult[] = data.results.map((p: any) => ({
                    id: p.id,
                    type: p.type as SearchResultType,
                    title: p.title,
                    subtitle: p.subtitle,
                    href: p.href,
                    badge: p.type === "property" ? "Property" : p.type === "unit" ? "Unit" : "Issue",
                    icon: p.type === "property" ? Building2 : p.type === "unit" ? MapPin : Wrench
                }));

                // Cache server results
                searchCacheRef.current.set(cacheKey, serverResults);

                // Merge without duplicates
                setSearchResults(prev => {
                    const combined = [...localMatches];
                    serverResults.forEach(item => {
                        if (!combined.some(c => c.id === item.id)) {
                            combined.push(item);
                        }
                    });
                    return combined;
                });
            }
        } catch (e: any) {
            if (e.name !== "AbortError") {
                // Keep local matches if network fails
            }
        } finally {
            if (!controller.signal.aborted) {
                setSearchLoading(false);
            }
        }
    }, [getLocalMatches]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fast keystroke handler with 100ms debounce
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        // Instant local preview on keystroke
        const instantMatches = getLocalMatches(searchQuery);
        if (instantMatches.length > 0) {
            setSearchResults(instantMatches);
        }

        const timer = setTimeout(() => {
            void performSearch(searchQuery);
        }, 100);

        return () => clearTimeout(timer);
    }, [searchQuery, getLocalMatches, performSearch]);

    const handleResultClick = (result: SearchResult) => {
        if (result.href && result.href !== "#") {
            router.push(result.href);
        }
        setIsSearchOpen(false);
        setSearchQuery("");
    };

    // Keyboard navigation (Up / Down / Enter / Esc)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isSearchOpen || searchResults.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % searchResults.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            const currentItem = searchResults[selectedIndex];
            if (currentItem) {
                handleResultClick(currentItem);
            }
        } else if (e.key === "Escape") {
            setIsSearchOpen(false);
        }
    };

    const handleClearAll = async () => {
        await markAllAsRead();
    };

    const getNotificationHref = (notification: any) => {
        const data = notification.data || {};
        const id = data.paymentId || data.applicationId || data.maintenanceId || data.conversationId || data.leaseId || data.id || notification.id;
        const type = notification.type;

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

    return (
        <>
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-8 md:right-8 z-50 flex items-center gap-1.5 sm:gap-2 md:gap-4">
                {/* Mission Control Trigger */}
                <MissionTriggerButton onOpen={onQuestPanelOpen} />

                {/* Fast Omni-Search Bar */}
                <div className="relative group hidden sm:block" ref={searchRef}>
                    <Search className="absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Looking for something specific? Search unit, tenant, or concern…"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsSearchOpen(true);
                        }}
                        onFocus={() => {
                            if (searchQuery.trim()) {
                                setIsSearchOpen(true);
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        className="w-64 rounded-2xl neumorphic-inset bg-background/50 py-2.5 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:w-80"
                    />
                    
                    {isSearchOpen && searchQuery.trim() && (
                        <div className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-3xl border border-white/10 neumorphic-panel shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
                            {/* Search Header Info */}
                            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                <span>Fast Search</span>
                                {searchLoading && <span className="text-primary animate-pulse">Scanning live records…</span>}
                            </div>

                            <div className="max-h-96 overflow-y-auto custom-scrollbar-premium p-1.5 space-y-1">
                                {searchResults.length === 0 && !searchLoading ? (
                                    <div className="px-6 py-8 text-center text-muted-foreground">
                                        <Search className="size-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-xs font-black text-foreground">No matches found</p>
                                        <p className="text-[10px] mt-0.5">Try searching for &quot;leases&quot;, &quot;walk-in&quot;, &quot;meters&quot;, or unit numbers.</p>
                                    </div>
                                ) : (
                                    searchResults.map((result, idx) => {
                                        const isSelected = idx === selectedIndex;
                                        return (
                                            <button
                                                key={`${result.type}-${result.id}-${idx}`}
                                                onClick={() => handleResultClick(result)}
                                                onMouseEnter={() => setSelectedIndex(idx)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left transition-all cursor-pointer group",
                                                    isSelected ? "neumorphic-inset bg-primary/10 text-white" : "hover:bg-white/5 text-neutral-300"
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                                                    isSelected ? "bg-primary text-primary-foreground shadow-sm" : "bg-primary/10 text-primary"
                                                )}>
                                                    <result.icon className="size-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-black text-foreground truncate">{result.title}</p>
                                                        {result.badge && (
                                                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-neutral-400">
                                                                {result.badge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground truncate">{result.subtitle}</p>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {/* Shortcut footer */}
                            <div className="border-t border-white/5 bg-white/[0.02] px-4 py-2 flex items-center justify-between text-[9px] font-bold text-neutral-500">
                                <span>Navigate with ↑ ↓</span>
                                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">↵</kbd> to jump</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => {
                            const next = !isNotificationsOpen;
                            setIsNotificationsOpen(next);
                            if (next) {
                                void refresh();
                            }
                        }}
                        className="group relative flex size-11 items-center justify-center rounded-2xl neumorphic-extruded active:scale-95"
                    >
                        <Bell className="size-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                        {unreadCount > 0 && (
                            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-black text-primary-foreground shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {isNotificationsOpen && (
                        <div className="absolute right-0 z-50 mt-4 w-[340px] overflow-hidden rounded-[2rem] neumorphic-panel animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                                <p className="text-sm font-black uppercase tracking-widest text-foreground">Notifications</p>
                                <span className="rounded-full neumorphic-inset-card border border-primary/10 bg-primary/5 px-2.5 py-0.5 text-[10px] font-black text-primary">{unreadCount} New</span>
                            </div>

                            <div className="max-h-[360px] overflow-y-auto custom-scrollbar-premium py-2">
                                {notificationsLoading ? (
                                    <div className="px-6 py-4 space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={`notif-skeleton-${i}`} className="flex items-center gap-3">
                                                <Skeleton className="size-10 rounded-2xl" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-3 w-32 rounded-full" />
                                                    <Skeleton className="h-2 w-48 rounded-full opacity-60" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="px-6 py-12 text-center text-muted-foreground">
                                        <Bell className="size-10 mx-auto mb-2 opacity-20" />
                                        <p className="text-xs font-black uppercase tracking-widest text-foreground">All Caught Up</p>
                                        <p className="text-xs">No unread notifications at this time.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {notifications.map((n) => (
                                            <div 
                                                key={n.id}
                                                onClick={() => handleNotificationClick(n)}
                                                className={cn(
                                                    "flex items-start gap-3 px-6 py-3.5 transition-colors cursor-pointer hover:bg-white/5",
                                                    !n.read && "bg-primary/[0.03]"
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                                                    n.type === "payment" ? "bg-emerald-500/10 text-emerald-500" :
                                                    n.type === "maintenance" ? "bg-amber-500/10 text-amber-500" :
                                                    n.type === "application" ? "bg-blue-500/10 text-blue-500" :
                                                    n.type === "lease" ? "bg-purple-500/10 text-purple-500" :
                                                    "bg-primary/10 text-primary"
                                                )}>
                                                    <Sparkles className="size-4" />
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-foreground truncate">{n.title}</p>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                                                    <span className="text-[10px] text-muted-foreground/60 mt-1 block font-mono">{formatTimeAgo(n.created_at || (n as any).createdAt || new Date().toISOString())}</span>
                                                </div>

                                                {!n.read && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleMarkAsRead(e, n.id)}
                                                        className="size-2 rounded-full bg-primary mt-1.5 shrink-0 hover:scale-150 transition-transform"
                                                        title="Mark as read"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {notifications.length > 0 && (
                                <div className="border-t border-white/5 p-3 bg-white/[0.02]">
                                    <button 
                                        onClick={handleClearAll}
                                        className="w-full py-2 rounded-xl text-center text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-colors"
                                    >
                                        Mark all as read
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Landlord Profile */}
                <ProfileWidget />
            </div>
        </>
    );
}
