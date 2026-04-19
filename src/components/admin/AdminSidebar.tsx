"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import {
    LayoutDashboard,
    Users,
    LogOut,
    ChevronRight,
    FileCheck
} from "lucide-react";
import { ThemeToggle } from '@/components/theme-toggle';
import { signOut } from "@/lib/supabase/client-auth";

const NAV_ITEMS = [
    { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard, description: "System status & metrics" },
    { label: "Registrations", href: "/admin/registrations", icon: FileCheck, description: "Pending landlord approvals" },
    { label: "User Directory", href: "/admin/users", icon: Users, description: "Manage all platforms users" },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex fixed inset-y-4 left-4 z-40 w-72 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0A0D14]/90 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.55)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-lime-400/20 via-emerald-300/8 to-transparent" />
                <div className="absolute -right-16 top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
            </div>

            <div className="relative shrink-0 border-b border-white/[0.08] px-6 pt-4 pb-3">
                <Logo theme="dark" className="h-[7.5rem] w-52 -my-5 self-start -ml-6" />
                <span className="mt-0.5 block text-left text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
                    Admin Dashboard
                </span>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/55">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
                    Secure Session
                </div>
            </div>

            <div className="relative flex-1 overflow-y-auto px-3 py-4 scrollbar-none">
                <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
                    Main Infrastructure
                </div>

                <nav className="space-y-1.5">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href || pathname.startsWith(item.href + "/");

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group relative grid grid-cols-[2.8rem_1fr_auto] items-center gap-3 rounded-2xl px-3 py-3.5 text-white/65 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300/40",
                                    active
                                        ? "bg-white/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_24px_rgba(0,0,0,0.28)]"
                                        : "hover:bg-white/[0.04] hover:text-white"
                                )}
                            >
                                {active && (
                                    <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-lime-300 shadow-[0_0_14px_rgba(163,230,53,0.8)]" />
                                )}

                                <span
                                    className={cn(
                                        "flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-300",
                                        active
                                            ? "border-lime-300/30 bg-lime-300/12 text-lime-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
                                            : "border-white/10 bg-white/[0.03] text-white/70 group-hover:border-white/20 group-hover:bg-white/[0.05]"
                                    )}
                                >
                                    <Icon className={cn("h-5 w-5 transition-transform duration-300", active ? "scale-110" : "group-hover:scale-105")} strokeWidth={active ? 2.25 : 1.9} />
                                </span>

                                <span className="min-w-0">
                                    <span className="block truncate text-[1.02rem] font-semibold leading-tight tracking-tight">{item.label}</span>
                                    <span className={cn("mt-0.5 block truncate text-xs", active ? "text-white/75" : "text-white/40 group-hover:text-white/60")}>
                                        {item.description}
                                    </span>
                                </span>

                                <span className={cn("pr-1 transition-all duration-300", active ? "translate-x-0 text-lime-200 opacity-100" : "-translate-x-1 text-white/35 opacity-0 group-hover:translate-x-0 group-hover:opacity-100")}>
                                    <ChevronRight className="h-4 w-4" />
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="relative shrink-0 border-t border-white/[0.08] bg-black/25">
                <div className="px-4 pt-3 pb-2">
                    <ThemeToggle />
                </div>

                <div className="px-4 pb-4">
                    <button
                        type="button"
                        onClick={() => void signOut()}
                        className="group flex w-full items-center gap-3 rounded-xl border border-red-400/15 bg-red-500/[0.06] px-3 py-2.5 text-left outline-none transition-all duration-300 hover:border-red-300/30 hover:bg-red-500/[0.1] focus-visible:ring-2 focus-visible:ring-red-300/40"
                    >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-300 transition-colors duration-300 group-hover:bg-red-500/25">
                            <LogOut className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" strokeWidth={2.2} />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-[13px] font-semibold text-white/85">Terminate Session</span>
                            <span className="block text-[10px] uppercase tracking-[0.18em] text-red-200/70">Secure sign out</span>
                        </span>
                    </button>
                </div>
            </div>
        </aside>
    );
}

