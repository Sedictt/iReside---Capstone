"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
    Building2,
    Menu,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/supabase/client-auth";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_SECTIONS = [
    {
        category: "Main",
        items: [
            { label: "Home", href: "/tenant/community", icon: Home },
            { label: "Dashboard", href: "/tenant/dashboard", icon: LayoutDashboard },
        ],
    },
    {
        category: "Tenant Tools",
        items: [
            { label: "Leases", href: "/tenant/lease", icon: FileText },
            { label: "Unit Map", href: "/tenant/unit-map", icon: Map },
            { label: "Payments", href: "/tenant/payments", icon: CreditCard },
            { label: "Messages", href: "/tenant/messages", icon: MessageSquare },
        ],
    },
];

export function TenantSidebar() {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { profile, user } = useAuth();
    const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
    const avatarUrl =
        profile?.avatar_url ||
        user?.user_metadata?.avatar_url ||
        "https://images.unsplash.com/photo-1529778456-9a2cf1fbe4a8?auto=format&fit=crop&w=150&q=80";

    const renderNav = (compact = false) => (
        <nav className={cn("space-y-8", compact && "pt-2")}>
            {NAV_SECTIONS.map((section) => (
                <div key={section.category}>
                    <h3 className="mb-4 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                                    <item.icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                    <span>{item.label}</span>
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
            <header className="md:hidden sticky top-0 z-[90] h-16 border-b border-border/80 bg-background/95 backdrop-blur">
                <div className="h-full px-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-primary rounded-sm" />
                        <span className="font-bold text-lg tracking-tight">iReside</span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setIsMobileOpen((prev) => !prev)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
                        aria-label="Toggle tenant navigation"
                    >
                        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </header>

            <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/70 bg-card/95 backdrop-blur-sm flex-col text-foreground" data-tour-id="tour-tenant-navigation">
                <div className="h-20 px-6 border-b border-border/70 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-bold text-primary-foreground">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">iReside</span>
                    </div>
                    <ThemeToggle variant="sidebar" dataTourId="tour-theme-toggle" />
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-8">
                    {renderNav()}
                </div>

                <div className="border-t border-border/70 p-4">
                    <div className="mb-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-left">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-border">
                            <Image src={avatarUrl} alt="Profile" fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                            <p className="truncate text-xs text-muted-foreground">{profile?.email || user?.email || "Tenant Account"}</p>
                        </div>
                        <button type="button" className="relative rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Notifications">
                            <Bell className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="space-y-1">
                        <Link href="/tenant/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground">
                            <User className="h-4 w-4" />
                            Profile
                        </Link>
                        <Link href="/tenant/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground">
                            <Settings className="h-4 w-4" />
                            Settings
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                void signOut()
                            }}
                            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500 text-left"
                        >
                            <LogOut className="h-5 w-5" />
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
                        <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileOpen(false)}>
                            <div className="h-6 w-6 bg-primary rounded-sm" />
                            <span className="font-bold text-lg tracking-tight">iReside</span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setIsMobileOpen(false)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card"
                            aria-label="Close tenant navigation"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {renderNav(true)}

                    <div className="mt-6 border-t border-border pt-4 space-y-1">
                        <Link href="/tenant/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setIsMobileOpen(false)}>
                            <User className="h-4 w-4" />
                            Profile
                        </Link>
                        <Link href="/tenant/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setIsMobileOpen(false)}>
                            <Settings className="h-4 w-4" />
                            Settings
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                void signOut()
                            }}
                            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 text-left"
                        >
                            <LogOut className="h-4 w-4" />
                            Log Out
                        </button>
                    </div>
                </aside>
            </div>
        </>
    );
}

export const TenantNavbar = TenantSidebar;
