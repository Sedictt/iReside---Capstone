"use client";

import { Bell, Building2, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/supabase/client-auth";
import { ProfileWidget } from "./ProfileWidget";
import { RoleBadge } from "@/components/profile/RoleBadge";

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
        <nav 
            className="sticky top-0 z-50 flex h-[4.5rem] items-center justify-between bg-background px-4 sm:px-6 md:px-8 text-foreground neumorphic-panel" 
            aria-label="Main Navigation"
        >
            <div className="flex items-center gap-6 md:gap-8">
                <Link 
                    href="/landlord/dashboard" 
                    className="flex items-center transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1 max-w-[220px] sm:max-w-xs overflow-hidden"
                    aria-label="Dashboard Home"
                >
                    <BrandLogo size="md" className="w-full min-w-0" />
                </Link>
                <div className="hidden md:flex items-center gap-4 pl-2 lg:pl-4" role="menubar">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                role="menuitem"
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95",
                                    isActive
                                        ? "neumorphic-inset text-primary"
                                        : "text-muted-foreground neumorphic-extruded hover:text-primary"
                                )}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
                <button 
                    aria-label="View notifications" 
                    className="group relative rounded-2xl p-3 text-muted-foreground transition-all neumorphic-extruded hover:text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                    <Bell className="size-5 transition-transform group-hover:scale-110" aria-hidden="true" />
                    <span aria-hidden="true" className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                </button>
                
                <div className="hidden sm:block mx-1 h-8 w-1.5 rounded-full neumorphic-inset" role="separator" aria-orientation="vertical" />
                
                <div className="flex items-center gap-4">
                    <div className="text-right hidden lg:block">
                        <div className="flex items-center justify-end gap-2.5 mb-1.5">
                            <p className="max-w-[150px] truncate text-sm font-black text-foreground">{displayName}</p>
                            <RoleBadge role={profile?.role ?? null} />
                        </div>
                        <p className="max-w-[150px] truncate text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">{profile?.email || user?.email}</p>
                    </div>
                    <div className="transition-transform hover:scale-105 active:scale-95 rounded-full focus-within:ring-2 focus-within:ring-primary/50">
                        <ProfileWidget />
                    </div>
                </div>
            </div>
        </nav>
    );
}
