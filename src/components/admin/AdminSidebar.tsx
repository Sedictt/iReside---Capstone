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
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border/70 bg-card/95 text-foreground backdrop-blur-sm">

            {/* Brand */}
            <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-border/70 px-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "linear-gradient(135deg, #e11d48 0%, #9f1239 100%)", boxShadow: "0 0 20px rgba(225,29,72,0.3)" }}>
                    <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold tracking-tight leading-none text-foreground">iReside</p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mt-0.5" style={{ color: "#f43f5e" }}>Admin Portal</p>
                </div>
            </div>

            {/* Nav label */}
            <div className="px-5 pt-6 pb-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Navigation</p>
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
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                            )}
                            style={active ? {
                                background: "linear-gradient(135deg, rgba(225,29,72,0.15) 0%, rgba(159,18,57,0.08) 100%)",
                                boxShadow: "inset 0 0 0 1px rgba(225,29,72,0.2)"
                            } : {}}
                        >
                            <div className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
                                active ? "bg-rose-500/20" : "bg-muted/60 group-hover:bg-secondary"
                            )}>
                                <Icon className={cn("h-4 w-4", active ? "text-rose-400" : "text-muted-foreground group-hover:text-foreground")} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn("text-sm font-medium leading-none", active ? "text-foreground" : "")}>{item.label}</p>
                                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.description}</p>
                            </div>
                            {active && <ChevronRight className="h-3.5 w-3.5 text-rose-500 shrink-0" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section */}
            <div className="shrink-0 border-t border-border/70 px-3 py-4">
                <button
                    type="button"
                    onClick={() => {
                        void signOut()
                    }}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-red-500/[0.08] hover:text-red-400"
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 transition-all duration-200 group-hover:bg-red-500/10">
                        <LogOut className="h-4 w-4" />
                    </div>
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
