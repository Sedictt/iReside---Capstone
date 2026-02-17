"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Building2,
    FileText,
    Users,
    CreditCard,
    Wrench,
    MessageSquare,
    Settings,
    Bell,
    LogOut,
    ChevronDown
} from "lucide-react";


const NAV_ITEMS = [
    {
        category: "Main",
        items: [
            { label: "Dashboard", href: "/landlord/dashboard", icon: LayoutDashboard },
        ]
    },
    {
        category: "Management",
        items: [
            { label: "Properties", href: "/landlord/properties", icon: Building2 },
            { label: "Listings", href: "/landlord/listings", icon: FileText },
            { label: "Tenants", href: "/landlord/tenants", icon: Users },
        ]
    },
    {
        category: "Finance & Ops",
        items: [
            { label: "Invoices", href: "/landlord/invoices", icon: CreditCard },
            { label: "Maintenance", href: "/landlord/maintenance", icon: Wrench, badge: 3 },
            { label: "Messaging", href: "/landlord/messages", icon: MessageSquare },
        ]
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col">
            {/* Brand */}
            <div className="flex items-center gap-3 px-6 h-20 border-b border-white/5">
                <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-white font-bold">
                    <Building2 className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">iReside</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-8">
                {NAV_ITEMS.map((section) => (
                    <div key={section.category}>
                        <h3 className="mb-4 px-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
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
                                            "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-slate-800/50",
                                            isActive
                                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                                : "text-neutral-400 hover:text-neutral-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-neutral-500 group-hover:text-neutral-300")} />
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
        </aside>
    );
}
