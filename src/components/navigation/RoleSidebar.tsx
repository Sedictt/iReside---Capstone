"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { 
    ChevronDown, 
    LogOut, 
    ChevronLeft, 
    ChevronRight, 
    PanelLeftClose, 
    PanelLeftOpen,
    Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { m as motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export interface SidebarNavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: number;
    urgent?: boolean;
    tourId?: string;
}

export interface SidebarNavSection {
    category: string;
    icon?: LucideIcon;
    items: SidebarNavItem[];
    collapsible?: boolean;
    defaultExpanded?: boolean;
    hideHeading?: boolean;
    dividerBefore?: boolean;
}

interface RoleSidebarProps {
    sections: SidebarNavSection[];
    portalLabel?: string;
    logoutLabel?: string;
    onLogout: () => void;
    className?: string;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    showCollapseToggle?: boolean;
}

function LogoLink({ children }: { children: React.ReactNode }) {
    const { push } = useRouter();
    const { user, loading } = useAuth();

    const getRedirectPath = () => {
        if (loading || !user) return "/";
        const role = user.user_metadata?.role as string | undefined;
        switch (role) {
            case "landlord":
                return "/landlord/dashboard";
            case "tenant":
                return "/tenant/dashboard";
            case "admin":
                return "/admin/dashboard";
            default:
                return "/";
        }
    };

    const handleLogoNavigation = (e: React.MouseEvent) => {
        e.preventDefault();
        push(getRedirectPath());
    };

    return (
        <a href={getRedirectPath()} onClick={handleLogoNavigation} className="cursor-pointer">
            {children}
        </a>
    );
}

export function RoleSidebar({
    sections,
    portalLabel,
    logoutLabel = "Log Out",
    onLogout,
    className,
    header,
    footer,
    isCollapsed = false,
    onToggleCollapse,
    showCollapseToggle = false,
}: RoleSidebarProps) {
    const pathname = usePathname();
    const [expandedOverrides, setExpandedOverrides] = useState<Record<string, boolean>>({});

    const isItemActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);
    const getSectionId = (category: string) => `sidebar-section-${category.replace(/\s+/g, "-").toLowerCase()}`;

    const toggleSection = (category: string, fallbackExpanded: boolean) => {
        setExpandedOverrides((current) => ({
            ...current,
            [category]: !(current[category] ?? fallbackExpanded),
        }));
    };

    const renderNavItem = (item: SidebarNavItem, nested = false) => {
        const isActive = isItemActive(item.href);

        return (
            <Link
                key={item.href}
                href={item.href}
                data-tour-id={item.tourId}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                    "group relative flex items-center transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98]",
                    isActive
                        ? "text-primary bg-background shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.05)] border border-border/20"
                        : "text-muted-foreground hover:text-foreground bg-background shadow-[4px_4px_8px_rgba(163,177,198,0.3),-4px_-4px_8px_rgba(255,255,255,0.9)] dark:shadow-[5px_5px_10px_rgba(0,0,0,0.45),-5px_-5px_10px_rgba(255,255,255,0.04)] border border-white/20 dark:border-white/03 hover:shadow-[2px_2px_4px_rgba(163,177,198,0.2),-2px_-2px_4px_rgba(255,255,255,0.9)] dark:hover:shadow-[3px_3px_6px_rgba(0,0,0,0.4),-3px_-3px_6px_rgba(255,255,255,0.04)]",
                    nested && !isCollapsed ? "ml-4" : "",
                    isCollapsed ? "justify-center rounded-2xl px-0 size-11 mx-auto" : "justify-between rounded-2xl px-5 py-4 mx-1"
                )}
                title={isCollapsed ? item.label : undefined}
            >
                {/* Active Indicator Bar */}
                {isActive && (
                    <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-1 h-6 w-1 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    />
                )}

                <div className="flex items-center gap-3">
                    <item.icon 
                        className={cn(
                            "transition-transform duration-300", 
                            isCollapsed ? "size-6" : "size-5 shrink-0",
                            isActive ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" : "text-muted-foreground group-hover:text-foreground"
                        )} 
                        aria-hidden="true" 
                    />
                    {!isCollapsed && (
                        <span
                            className={cn(
                                "whitespace-nowrap text-[11px] uppercase tracking-widest leading-none",
                                isActive ? "font-black" : "font-black"
                            )}
                        >
                            {item.label}
                        </span>
                    )}
                </div>

                {!isCollapsed && item.badge ? (
                    <span className={cn(
                        "flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-foreground shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]",
                        item.urgent && "animate-pulse shadow-lg shadow-red-500/40"
                    )}>
                        {item.badge}
                    </span>
                ) : isCollapsed && item.badge ? (
                    <span className={cn(
                        "absolute right-2 top-2 size-2.5 rounded-full bg-red-500 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),0_0_6px_rgba(239,68,68,0.5)]",
                        item.urgent && "animate-ping"
                    )} />
                ) : null}
            </Link>
        );
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 flex h-screen flex-col bg-background text-foreground transition-all duration-300 neumorphic-panel",
                isCollapsed ? "w-[80px]" : "w-[280px]",
                className
            )}
        >
            {/* Header */}
            <div className={cn("flex h-20 items-center justify-between px-6 transition-all duration-300 mb-2", isCollapsed ? "justify-center" : "justify-between")}>
                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <LogoLink>
                            <Logo className="h-24 w-28" />
                        </LogoLink>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    {!isCollapsed && <ThemeToggle variant="sidebar" />}
                    {showCollapseToggle && !isCollapsed && (
                        <button 
                            onClick={onToggleCollapse}
                            className="flex size-8 items-center justify-center rounded-xl bg-background shadow-[3px_3px_6px_rgba(163,177,198,0.25),-3px_-3px_6px_rgba(255,255,255,0.8)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.4),-3px_-3px_6px_rgba(255,255,255,0.04)] border border-white/20 dark:border-white/03 text-muted-foreground hover:text-foreground transition-all active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] dark:active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.04)]"
                            title="Collapse sidebar"
                        >
                            <PanelLeftClose className="size-4" />
                        </button>
                    )}
                </div>
                {isCollapsed && (
                    <button 
                        onClick={onToggleCollapse}
                        className="flex size-12 items-center justify-center rounded-2xl bg-background text-primary shadow-[4px_4px_8px_rgba(163,177,198,0.3),-4px_-4px_8px_rgba(255,255,255,0.9)] dark:shadow-[5px_5px_10px_rgba(0,0,0,0.45),-5px_-5px_10px_rgba(255,255,255,0.04)] border border-white/20 dark:border-white/03 hover:scale-[1.02] transition-all active:scale-[0.98] active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] dark:active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]"
                        title="Expand sidebar"
                    >
                        <PanelLeftOpen className="size-6" />
                    </button>
                )}
            </div>

            {/* Header Content (Property Selector etc) */}
            {header && (
                <div className={cn("pb-2 pt-6 transition-all duration-300", isCollapsed ? "px-2 flex justify-center" : "px-4")}>
                    {header}
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 custom-scrollbar-premium space-y-2 overflow-y-auto px-2 py-4">
                {portalLabel && (
                    <div className="px-5 pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                        {portalLabel}
                    </div>
                )}

                <div className="space-y-1">
                    {sections.map((section) => {
                        const hasActiveItem = section.items.some((item) => isItemActive(item.href));
                        const isCollapsible = section.collapsible ?? !section.hideHeading;
                        const fallbackExpanded = section.defaultExpanded ?? hasActiveItem;
                        const isExpanded = !isCollapsible ? true : (expandedOverrides[section.category] ?? fallbackExpanded);
                        const SectionIcon = section.icon;

                        return (
                            <React.Fragment key={section.category}>
                                {section.dividerBefore && (
                                    <div className="mx-4 my-3 border-t border-border/40" />
                                )}

                                {/* Section heading (hidden when collapsed) */}
                                {!section.hideHeading && !isCollapsed && (
                                    <button
                                        type="button"
                                        suppressHydrationWarning
                                        onClick={() => toggleSection(section.category, fallbackExpanded)}
                                        className={cn(
                                            "group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all",
                                            hasActiveItem ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            {SectionIcon && (
                                                <SectionIcon className={cn("size-4", hasActiveItem ? "text-primary" : "text-muted-foreground")} />
                                            )}
                                            <span className="text-[11px] font-black uppercase tracking-wider">{section.category}</span>
                                        </div>
                                        {isCollapsible && (
                                            <ChevronDown className={cn("size-3 transition-transform duration-200", isExpanded ? "rotate-180" : "")} />
                                        )}
                                    </button>
                                )}

                                {/* Collapsed mode: divider between sections */}
                                {!section.hideHeading && isCollapsed && (
                                    <div className="mx-auto my-4 h-px w-8 bg-border/40" />
                                )}

                                {/* Section items container - sunken/inset shadow for grouped differentiation */}
                                {!section.hideHeading && !isCollapsed ? (
                                    <div className="mx-1 my-1 rounded-2xl bg-background p-1.5 shadow-[inset_2px_2px_5px_rgba(163,177,198,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.04)] border border-white/20 dark:border-white/03">
                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="space-y-1 overflow-hidden"
                                                >
                                                    {section.items.map((item) => renderNavItem(item, true))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    /* No heading or collapsed: render items directly */
                                    <div className="space-y-1">
                                        <AnimatePresence initial={false}>
                                            {(isExpanded || isCollapsed) && (
                                                <motion.div
                                                    initial={isCollapsed ? { opacity: 1 } : { height: 0, opacity: 0 }}
                                                    animate={isCollapsed ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                                                    exit={isCollapsed ? { opacity: 1 } : { height: 0, opacity: 0 }}
                                                    className="space-y-1 overflow-hidden"
                                                >
                                                    {section.items.map((item) => renderNavItem(item, !section.hideHeading && !isCollapsed))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </nav>

            {/* Footer */}
            <div className="border-t border-border/40 p-4 space-y-2">
                {footer && (
                    <div className="transition-all duration-300">
                        {footer}
                    </div>
                )}
                
                <button
                    type="button"
                    suppressHydrationWarning
                    onClick={onLogout}
                    className={cn(
                        "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all duration-300 text-muted-foreground hover:text-red-500 bg-background shadow-[3px_3px_6px_rgba(163,177,198,0.25),-3px_-3px_6px_rgba(255,255,255,0.8)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.04)] border border-white/20 dark:border-white/03 hover:shadow-[2px_2px_4px_rgba(163,177,198,0.15),-2px_-2px_4px_rgba(255,255,255,0.8)] dark:hover:shadow-[2px_2px_4px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.04)]",
                        isCollapsed ? "size-10 justify-center mx-auto" : "w-full"
                    )}
                >
                    <LogOut className="size-5 shrink-0" />
                    {!isCollapsed && <span className="text-sm font-black">{logoutLabel}</span>}
                </button>
            </div>
        </aside>
    );
}



