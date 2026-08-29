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
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { m as motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export interface SidebarNavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    description?: string;
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
        if (loading || !user) return "/login";
        const role = user.user_metadata?.role as string | undefined;
        switch (role) {
            case "tenant":
                return "/tenant/dashboard";
            case "landlord":
            case "admin":
            default:
                return "/landlord/dashboard";
        }
    };

    const handleLogoNavigation = (e: React.MouseEvent) => {
        e.preventDefault();
        push(getRedirectPath());
    };

    return (
        <a href={getRedirectPath()} onClick={handleLogoNavigation} className="cursor-pointer flex items-center min-w-0 flex-1 overflow-hidden">
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

        const tooltipContent = (
            <div className="flex flex-col gap-1 max-w-[220px] text-left py-0.5">
                <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs text-foreground tracking-tight">{item.label}</span>
                    {item.urgent && (
                        <span className="size-1.5 rounded-full bg-red-500 animate-ping" />
                    )}
                </div>
                {item.description && (
                    <span className="text-[11px] font-medium text-muted-foreground/90 leading-snug">
                        {item.description}
                    </span>
                )}
            </div>
        );

        return (
            <Tooltip
                key={item.href}
                content={tooltipContent}
                side="right"
                align="center"
                sideOffset={14}
                showArrow
            >
                <Link
                    href={item.href}
                    prefetch={true}
                    data-tour-id={item.tourId}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                        "group relative flex items-center transition-all duration-200 ease-out",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98]",
                        /* Soft shadows */
                        isActive
                            ? "text-primary neumorphic-active"
                            : "text-muted-foreground hover:text-foreground neumorphic-extruded neumorphic-extruded-hover",
                        nested && !isCollapsed ? "ml-0" : "", // Reduced margin
                        isCollapsed ? "justify-center rounded-xl px-0 size-12 mx-auto" : "justify-between px-6 py-4 mx-3 my-2 rounded-xl"
                    )}
                >
                    {/* Active Indicator removed for seamless molded aesthetic */}
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
                                    "whitespace-nowrap text-[11px] uppercase tracking-widest leading-none font-black"
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
                            {item.badge > 99 ? '99+' : item.badge}
                        </span>
                    ) : isCollapsed && item.badge ? (
                        <span className={cn(
                            "absolute right-2 top-2 size-2.5 rounded-full bg-red-500 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),0_0_6px_rgba(239,68,68,0.5)]",
                            item.urgent && "animate-ping"
                        )} />
                    ) : null}
                </Link>
            </Tooltip>
        );
    };

    return (
        <TooltipProvider delayDuration={600} skipDelayDuration={250}>
            <aside
                className={cn(
                    "fixed left-0 top-0 z-40 flex h-screen flex-col bg-background text-foreground transition-all duration-300",
                    isCollapsed ? "w-[80px]" : "w-[280px]",
                    className
                )}
            >
                {/* Header */}
                <div className={cn("flex h-20 items-center justify-between px-4 transition-all duration-300 mb-2 gap-2", isCollapsed ? "justify-center" : "justify-between")}>
                    {!isCollapsed && (
                        <div className="flex items-center min-w-0 flex-1 overflow-hidden pr-1">
                            <LogoLink>
                                <BrandLogo size="md" className="w-full min-w-0" />
                            </LogoLink>
                        </div>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                        {!isCollapsed && (
                            <Tooltip content="Toggle theme" side="bottom" sideOffset={8}>
                                <ThemeToggle variant="sidebar" className="size-8 shrink-0" />
                            </Tooltip>
                        )}
                        {showCollapseToggle && !isCollapsed && (
                            <Tooltip content="Collapse sidebar" side="bottom" sideOffset={8}>
                                <button 
                                    onClick={onToggleCollapse}
                                    className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-background shadow-[3px_3px_6px_rgba(163,177,198,0.25),-3px_-3px_6px_rgba(255,255,255,0.8)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.4),-3px_-3px_6px_rgba(255,255,255,0.04)] border border-white/20 dark:border-white/03 text-muted-foreground hover:text-foreground transition-all active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] dark:active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.04)]"
                                    aria-label="Collapse sidebar"
                                >
                                    <PanelLeftClose className="size-4" />
                                </button>
                            </Tooltip>
                        )}
                    </div>
                    {isCollapsed && (
                        <Tooltip content="Expand sidebar" side="right" sideOffset={14}>
                            <button 
                                onClick={onToggleCollapse}
                                className="flex size-12 items-center justify-center rounded-2xl bg-background text-primary shadow-[4px_4px_8px_rgba(163,177,198,0.3),-4px_-4px_8px_rgba(255,255,255,0.9)] dark:shadow-[5px_5px_10px_rgba(0,0,0,0.45),-5px_-5px_10px_rgba(255,255,255,0.04)] border border-white/20 dark:border-white/03 hover:scale-[1.02] transition-all active:scale-[0.98] active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] dark:active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]"
                                aria-label="Expand sidebar"
                            >
                                <PanelLeftOpen className="size-6" />
                            </button>
                        </Tooltip>
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
                                        <div className="neumorphic-inset mx-3 my-2 rounded-2xl overflow-hidden p-1 bg-background/50">
                                            <AnimatePresence initial={false}>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="space-y-2 overflow-visible py-2"
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
                    
                    <Tooltip content="Sign out of your session" side="right" sideOffset={14}>
                        <button
                            type="button"
                            suppressHydrationWarning
                            onClick={onLogout}
                            className={cn(
                                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-300 text-muted-foreground hover:text-red-500 neumorphic-extruded neumorphic-extruded-hover",
                                isCollapsed ? "size-10 justify-center mx-auto" : "w-full"
                            )}
                        >
                            <LogOut className="size-5 shrink-0" />
                            {!isCollapsed && <span className="text-sm font-black">{logoutLabel}</span>}
                        </button>
                    </Tooltip>
                </div>
            </aside>
        </TooltipProvider>
    );
}



