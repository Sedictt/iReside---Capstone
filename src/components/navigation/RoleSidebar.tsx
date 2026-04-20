"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme-toggle";

export interface SidebarNavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: number;
}

export interface SidebarNavSection {
    category: string;
    items: SidebarNavItem[];
}

interface RoleSidebarProps {
    sections: SidebarNavSection[];
    portalLabel?: string;
    logoutLabel?: string;
    onLogout: () => void;
    className?: string;
}

export function RoleSidebar({
    sections,
    portalLabel,
    logoutLabel = "Log Out",
    onLogout,
    className,
}: RoleSidebarProps) {
    const pathname = usePathname();

    return (
        <aside aria-label="Portal Navigation" className={cn("fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border/70 bg-card text-foreground", className)}>
            <div className="flex h-20 items-center justify-between gap-3 border-b border-border/70 px-6">
                <div className="flex items-center gap-3">
                    <Logo className="h-30 w-36" aria-label="iReside Dashboard Home" />
                </div>
                <ThemeToggle variant="sidebar" />
            </div>

            <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-8" aria-label="Main Navigation">
                {portalLabel ? (
                    <div className="px-2 -mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                        {portalLabel}
                    </div>
                ) : null}
                {sections.map((section) => (
                    <div key={section.category}>
                        <h3 className="mb-4 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {section.category}
                        </h3>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        aria-current={isActive ? "page" : undefined}
                                        className={cn(
                                            "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-muted/80",
                                            isActive
                                                ? "bg-primary/10 text-foreground hover:bg-primary/15"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} aria-hidden="true" />
                                            <span>{item.label}</span>
                                        </div>
                                        {item.badge ? (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10 text-xs font-bold text-red-500 ring-1 ring-red-500/20" aria-label={`${item.badge} notifications`}>
                                                {item.badge}
                                            </span>
                                        ) : null}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="border-t border-border/70 p-4">
                <button
                    type="button"
                    onClick={onLogout}
                    aria-label="Sign out of your account"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"
                >
                    <LogOut className="h-5 w-5" aria-hidden="true" />
                    <span>{logoutLabel}</span>
                </button>
            </div>
        </aside>
    );
}
