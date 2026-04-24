"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "@/context/SidebarContext";

export interface SidebarNavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: number;
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
}

export function RoleSidebar({
    sections,
    portalLabel,
    logoutLabel = "Log Out",
    onLogout,
    className,
    header,
    footer,
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
                aria-current={isActive ? "page" : undefined}
                className={cn(
                    "group relative flex items-center rounded-xl transition-all duration-300 ease-in-out",
                    "justify-between px-3 py-2.5",
                    isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    nested ? "ml-4" : ""
                )}
            >
                {/* Active Indicator Bar */}
                {isActive && (
                    <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 h-6 w-1 rounded-r-full bg-primary"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    />
                )}

                <div className="flex items-center gap-3">
                    <item.icon 
                        className={cn(
                            "h-5 w-5 shrink-0 transition-transform duration-300", 
                            isActive ? "text-primary scale-110" : "text-muted-foreground group-hover:text-foreground group-hover:scale-105"
                        )} 
                        aria-hidden="true" 
                    />
                    <span
                        className={cn(
                            "whitespace-nowrap text-sm tracking-tight",
                            isActive ? "font-bold" : "font-semibold"
                        )}
                    >
                        {item.label}
                    </span>
                </div>

                {item.badge ? (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm ring-1 ring-white/20">
                        {item.badge}
                    </span>
                ) : null}
            </Link>
        );
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-border/40 bg-card/80 backdrop-blur-xl text-foreground shadow-sm transition-all duration-300",
                className
            )}
        >
            {/* Header */}
            <div className="flex h-20 items-center justify-between border-b border-border/40 px-6">
                <div className="flex items-center gap-3">
                    <Logo className="h-24 w-28" />
                </div>
                <ThemeToggle variant="sidebar" />
            </div>

            {/* Header Content (Property Selector etc) */}
            {header && (
                <div className="px-4 pb-2 pt-6">
                    {header}
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 custom-scrollbar-premium space-y-6 overflow-y-auto px-4 py-6">
                {portalLabel && (
                    <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                        {portalLabel}
                    </div>
                )}

                <div className="space-y-4">
                    {sections.map((section) => {
                        const hasActiveItem = section.items.some((item) => isItemActive(item.href));
                        const isCollapsible = section.collapsible ?? !section.hideHeading;
                        const fallbackExpanded = section.defaultExpanded ?? hasActiveItem;
                        const isExpanded = !isCollapsible ? true : (expandedOverrides[section.category] ?? fallbackExpanded);
                        const SectionIcon = section.icon;

                        return (
                            <div key={section.category} className="space-y-1">
                                {section.dividerBefore && (
                                    <div className="mx-2 mb-4 border-t border-border/40" />
                                )}

                                {!section.hideHeading ? (
                                    <button
                                        type="button"
                                        onClick={() => toggleSection(section.category, fallbackExpanded)}
                                        className={cn(
                                            "group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all",
                                            hasActiveItem ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            {SectionIcon && (
                                                <SectionIcon className={cn("h-4 w-4", hasActiveItem ? "text-primary" : "text-muted-foreground")} />
                                            )}
                                            <span className="text-[11px] font-bold uppercase tracking-wider">{section.category}</span>
                                        </div>
                                        {isCollapsible && (
                                            <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isExpanded ? "rotate-180" : "")} />
                                        )}
                                    </button>
                                ) : null}

                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="space-y-1 overflow-hidden"
                                        >
                                            {section.items.map((item) => renderNavItem(item, !section.hideHeading))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
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
                    onClick={onLogout}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-300 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                >
                    <LogOut className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-semibold">{logoutLabel}</span>
                </button>
            </div>
        </aside>
    );
}



