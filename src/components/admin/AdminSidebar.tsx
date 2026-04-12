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
    FileCheck
} from "lucide-react";
import { signOut } from "@/lib/supabase/client-auth";

const NAV_ITEMS = [
    { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard, description: "System status & metrics" },
    { label: "Registrations", href: "/admin/registrations", icon: FileCheck, description: "Pending landlord approvals" },
    { label: "User Directory", href: "/admin/users", icon: Users, description: "Manage all platforms users" },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex fixed inset-y-4 left-4 z-40 w-72 flex-col overflow-hidden rounded-[2rem] border border-white/5 bg-[#0F0F12]/80 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
            
            {/* Ambient Lighting Behind Sidebar */}
            <div className="absolute top-0 left-0 h-48 w-full bg-gradient-to-b from-primary/20 to-transparent pointer-events-none"></div>

            {/* Brand Header (Gestalt: Proximate Grouping) */}
            <div className="relative flex shrink-0 items-center justify-between px-6 py-8">
                <div className="flex items-center gap-4">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary shadow-xl shadow-primary/20 ring-1 ring-white/10 overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 blur-[2px] opacity-10"></div>
                        <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[19px] font-bold tracking-tight text-white/95">iReside</span>
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">Admin Axis</span>
                    </div>
                </div>
            </div>

            {/* Navigation Block - Hick's Law (Chunking Choices) */}
            <div className="relative flex-1 overflow-y-auto px-4 py-2 pb-8 scrollbar-none">
                <div className="mb-5 px-3">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/30">Main Infrastructure</span>
                </div>
                
                <nav className="flex flex-col space-y-2">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href || pathname.startsWith(item.href + "/");

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group relative flex items-center rounded-2xl p-3 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                                    active 
                                        ? "bg-white/[0.04] shadow-[inset_0_1px_rgba(255,255,255,0.05),0_4px_16px_rgba(0,0,0,0.2)] text-white" 
                                        : "text-white/50 hover:bg-white/[0.02] hover:text-white/90"
                                )}
                            >
                                {/* Active Fitts's Law Callout Indicator */}
                                {active && (
                                    <div className="absolute inset-y-1/4 left-0 w-1 rounded-r-md bg-primary shadow-[0_0_12px_rgba(225,29,72,0.8)]"></div>
                                )}
                                
                                <div className={cn(
                                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-400 mr-4 border border-white/5",
                                    active 
                                        ? "bg-gradient-to-tr from-primary/20 to-primary/20 text-primary ring-1 ring-white/10 shadow-inner shadow-primary/20" 
                                        : "bg-white/[0.03] group-hover:bg-white/[0.05] group-hover:border-white/10"
                                )}>
                                    <Icon className={cn("h-5 w-5 transition-transform duration-400 ease-out", active ? "scale-[1.15]" : "group-hover:scale-110")} strokeWidth={active ? 2.5 : 1.5} />
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col justify-center">
                                    <span className="text-[14px] font-semibold leading-tight tracking-wide">{item.label}</span>
                                    <span className={cn(
                                        "truncate text-[11px] mt-0.5 font-medium transition-colors duration-400", 
                                        active ? "text-primary/20/60" : "text-white/30"
                                    )}>
                                        {item.description}
                                    </span>
                                </div>
                                
                                <div className={cn(
                                    "transition-all duration-400 transform ml-2",
                                    active ? "opacity-100 translate-x-0 text-primary" : "opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0"
                                )}>
                                    <ChevronRight className="h-4 w-4" />
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Footer Profile/Actions */}
            <div className="relative shrink-0 border-t border-white/[0.06] p-4 bg-black/20">
                <button
                    type="button"
                    onClick={() => void signOut()}
                    className="group flex w-full items-center gap-4 rounded-xl p-3 outline-none transition-all duration-300 hover:bg-primary/20[0.08]"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-red-500/10 text-red-400/80 transition-all duration-300 group-hover:bg-red-500/20 group-hover:text-red-400 border border-red-500/10">
                        <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-[13px] font-bold text-white/70 group-hover:text-primary/20 transition-colors">Terminate Session</span>
                        <span className="text-[10px] text-white/30 font-medium tracking-wide">Secure sign out</span>
                    </div>
                </button>
            </div>
        </aside>
    );
}

