"use client";

import { Bell, Building2, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/supabase/client-auth";
import { ProfileWidget } from "./ProfileWidget";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/landlord/dashboard" },
    { label: "Profile", href: "/landlord/profile" },
    { label: "Settings", href: "/landlord/settings" },
];

export function LandlordNavbar() {
    const pathname = usePathname();
    const { profile, user } = useAuth();
    const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Landlord';

    return (
        <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/70 bg-card/95 px-6 text-foreground shadow-sm backdrop-blur">
            <div className="flex items-center gap-8">
                <Link href="/landlord/dashboard" className="flex items-center hover:opacity-90">
                    <Logo className="h-10 w-32" />
                </Link>
                <div className="hidden md:flex items-center gap-6">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "py-5 text-sm font-medium transition-colors hover:text-foreground",
                                pathname === item.href ? "border-b-2 border-blue-500 text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card" />
                </button>
                <div className="mx-2 h-8 w-px bg-border" />
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="max-w-[150px] truncate text-sm font-medium text-foreground">{displayName}</p>
                        <p className="max-w-[150px] truncate text-xs text-muted-foreground">{profile?.email || user?.email}</p>
                    </div>
                    <ProfileWidget />
                </div>
            </div>
        </nav>
    );
}
