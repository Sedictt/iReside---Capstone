"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ClipboardList,
    Users,
    ShieldCheck,
    LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Registrations", href: "/admin/registrations", icon: ClipboardList },
    { label: "Users", href: "/admin/users", icon: Users },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col">
            {/* Brand */}
            <div className="flex items-center gap-3 px-6 h-20 border-b border-white/5">
                <div className="h-8 w-8 rounded bg-rose-600 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                    <span className="text-base font-bold text-white tracking-tight">iReside</span>
                    <p className="text-[10px] text-rose-400 font-semibold uppercase tracking-widest">Admin Portal</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                active
                                    ? "bg-rose-600/15 text-rose-400"
                                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="px-4 py-4 border-t border-white/5">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors w-full"
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
