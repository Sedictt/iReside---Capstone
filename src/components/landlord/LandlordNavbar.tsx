"use client";

import { Bell, Search, Settings, Building2, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/landlord/dashboard" },
    { label: "Profile", href: "/landlord/profile" },
    { label: "Settings", href: "/landlord/settings" },
];

export function LandlordNavbar() {
    const pathname = usePathname();

    return (
        <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-[#0f172a] px-6 text-white shadow-sm">
            <div className="flex items-center gap-8">
                <Link href="/landlord/dashboard" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white hover:opacity-90">
                    <Building2 className="h-6 w-6 text-blue-500" />
                    <span>iReside</span>
                </Link>
                <div className="hidden md:flex items-center gap-6">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-white",
                                pathname === item.href ? "text-white border-b-2 border-blue-500 py-5" : "text-slate-400"
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                    <Search className="h-5 w-5" />
                </button>
                <button className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-800" />
                </button>
                <div className="h-8 w-px bg-white/10 mx-2" />
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-white">Elite Property Group</p>
                        <p className="text-xs text-slate-400">Landlord ID: #99291</p>
                    </div>
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-emerald-500/20 ring-2 ring-white/10 flex items-center justify-center">
                        {/* Placeholder Avatar */}
                        <span className="font-bold text-emerald-500">EP</span>
                    </div>
                </div>
            </div>
        </nav>
    );
}
