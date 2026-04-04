"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Building2,
    Users,
    CreditCard,
    Wrench,
    MessageSquare,
    LogOut,
    ClipboardList,
    Map,
    ArrowUpRight,
    Megaphone
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOut } from "@/lib/supabase/client-auth";
import { ThemeToggle } from "@/components/theme-toggle";


interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: number;
}

interface NavSection {
    category: string;
    items: NavItem[];
}

const NAV_ITEMS: NavSection[] = [
    {
        category: "Main",
        items: [
            { label: "Dashboard", href: "/landlord/dashboard", icon: LayoutDashboard },
            { label: "Statistics", href: "/landlord/statistics", icon: ArrowUpRight },
        ]
    },
    {
        category: "Management",
        items: [
            { label: "Properties", href: "/landlord/properties", icon: Building2 },
            { label: "Unit Map", href: "/landlord/unit-map", icon: Map },
            { label: "Tenant Applications", href: "/landlord/applications", icon: ClipboardList, badge: 2 },
            { label: "Tenants", href: "/landlord/tenants", icon: Users },
        ]
    },
    {
        category: "Finance & Ops",
        items: [
            { label: "Invoices", href: "/landlord/invoices", icon: CreditCard },
            { label: "Maintenance", href: "/landlord/maintenance", icon: Wrench, badge: 3 },
            { label: "Community Hub", href: "/landlord/community", icon: Megaphone },
            { label: "Messaging", href: "/landlord/messages", icon: MessageSquare },
        ]
    },
];


export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border/70 bg-card/95 text-foreground backdrop-blur-sm">
            {/* Brand */}
            <div className="flex h-20 items-center justify-between border-b border-border/70 px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-bold text-primary-foreground">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">iReside</span>
                </div>
                <ThemeToggle variant="sidebar" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-8">
                {NAV_ITEMS.map((section) => (
                    <div key={section.category}>
                        <h3 className="mb-4 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {section.category}
                        </h3>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-muted/80",
                                            isActive
                                                ? "bg-primary/10 text-foreground hover:bg-primary/15"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                            <span>{item.label}</span>
                                        </div>
                                        {item.badge && (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10 text-xs font-bold text-red-500 ring-1 ring-red-500/20">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Profile / Logout */}
            <div className="border-t border-border/70 p-4">
                <button
                    onClick={signOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Log Out</span>
                </button>
            </div>
        </aside>
    );
}
