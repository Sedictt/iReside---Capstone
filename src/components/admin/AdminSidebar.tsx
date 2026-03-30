"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    LogOut,
    ChevronRight,
} from "lucide-react";
import { signOut } from "@/lib/supabase/client-auth";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, description: "Overview & stats" },
    { label: "Users", href: "/admin/users", icon: Users, description: "All platform users" },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 flex flex-col"
            style={{ background: "linear-gradient(180deg, #0d0d0d 0%, #0a0a0a 100%)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

            {/* Brand */}
            <div className="flex items-center gap-3 px-5 h-[72px] shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #e11d48 0%, #9f1239 100%)", boxShadow: "0 0 20px rgba(225,29,72,0.3)" }}>
                    <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-white tracking-tight leading-none">iReside</p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mt-0.5" style={{ color: "#f43f5e" }}>Admin Portal</p>
                </div>
            </div>

            {/* Nav label */}
            <div className="px-5 pt-6 pb-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600">Navigation</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                active
                                    ? "text-white"
                                    : "text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.04]"
                            )}
                            style={active ? {
                                background: "linear-gradient(135deg, rgba(225,29,72,0.15) 0%, rgba(159,18,57,0.08) 100%)",
                                boxShadow: "inset 0 0 0 1px rgba(225,29,72,0.2)"
                            } : {}}
                        >
                            <div className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
                                active ? "bg-rose-500/20" : "bg-white/[0.04] group-hover:bg-white/[0.07]"
                            )}>
                                <Icon className={cn("h-4 w-4", active ? "text-rose-400" : "text-neutral-500 group-hover:text-neutral-300")} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn("text-sm font-medium leading-none", active ? "text-white" : "")}>{item.label}</p>
                                <p className="text-[11px] text-neutral-600 mt-0.5 truncate">{item.description}</p>
                            </div>
                            {active && <ChevronRight className="h-3.5 w-3.5 text-rose-500 shrink-0" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section */}
            <div className="px-3 py-4 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <button
                    onClick={signOut}
                    className="group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-neutral-500 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200 w-full"
                >
                    <div className="h-8 w-8 rounded-lg bg-white/[0.04] group-hover:bg-red-500/10 flex items-center justify-center shrink-0 transition-all duration-200">
                        <LogOut className="h-4 w-4" />
                    </div>
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
