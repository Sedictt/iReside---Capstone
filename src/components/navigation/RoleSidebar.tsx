"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { 
    ChevronDown, 
    LogOut, 
    Lock,
    AlertTriangle,
    X,
    Search,
    Megaphone
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { m as motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

export interface SidebarNavAction {
    icon: LucideIcon;
    label: string;
    href?: string;
    onClick?: (e: React.MouseEvent) => void;
    hotkey?: string;
}

export interface SidebarNavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    description?: string;
    badge?: number;
    urgent?: boolean;
    tourId?: string;
    warning?: boolean;
    warningTooltip?: string;
    action?: SidebarNavAction;
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

export type SidebarLockStage = "no_property" | "no_unit_map" | "no_billing_rails" | "no_tenant" | null;

interface RoleSidebarProps {
    sections: SidebarNavSection[];
    portalLabel?: string;
    logoutLabel?: string;
    onLogout: () => void;
    className?: string;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    onClose?: () => void;
    isLocked?: boolean;
    lockStage?: SidebarLockStage;
}

function LogoLink({ 
    children, 
    isLocked = false, 
    lockToastText 
}: { 
    children: React.ReactNode; 
    isLocked?: boolean; 
    lockToastText?: string;
}) {
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
        if (isLocked) {
            if (lockToastText) {
                toast.warning(lockToastText);
            }
            return;
        }
        push(getRedirectPath());
    };

    return (
        <a 
            href={isLocked ? undefined : getRedirectPath()} 
            onClick={handleLogoNavigation} 
            className={cn(
                "flex items-center min-w-0 flex-1 overflow-hidden",
                isLocked ? "cursor-not-allowed opacity-75" : "cursor-pointer"
            )}
        >
            {children}
        </a>
    );
}

const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 300;
const DEFAULT_SIDEBAR_WIDTH = 280;

export function RoleSidebar({
    sections,
    portalLabel,
    logoutLabel = "Log Out",
    onLogout,
    className,
    header,
    footer,
    onClose,
    isLocked = false,
    lockStage,
}: RoleSidebarProps) {
    const pathname = usePathname();
    const { t } = useLanguage();
    const prefersReducedMotion = useReducedMotion();
    const [expandedOverrides, setExpandedOverrides] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
    const [isResizing, setIsResizing] = useState(false);
    const [isUpdateCardDismissed, setIsUpdateCardDismissed] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Load persisted width and update card dismissal state
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const savedWidth = window.localStorage.getItem("ireside.sidebar_width");
            if (savedWidth) {
                const parsed = parseInt(savedWidth, 10);
                if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
                    setSidebarWidth(parsed);
                }
            }
            const dismissed = window.localStorage.getItem("ireside.sidebar_updates_dismissed");
            if (dismissed === "true") {
                setIsUpdateCardDismissed(true);
            }
        } catch {
            // Ignore localStorage read errors
        }
    }, []);

    // Global keyboard shortcut (Cmd+K or Ctrl+K) to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Resize handle logic
    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const clamped = Math.min(Math.max(e.clientX, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
            setSidebarWidth(clamped);
            if (typeof window !== "undefined") {
                window.localStorage.setItem("ireside.sidebar_width", clamped.toString());
                window.dispatchEvent(new CustomEvent("sidebar-width-changed", { detail: clamped }));
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing]);

    const isItemActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);
    const getSectionId = (category: string) => `sidebar-section-${category.replace(/\s+/g, "-").toLowerCase()}`;

    const toggleSection = (category: string, fallbackExpanded: boolean) => {
        setExpandedOverrides((current) => ({
            ...current,
            [category]: !(current[category] ?? fallbackExpanded),
        }));
    };

    const handleDismissUpdateCard = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsUpdateCardDismissed(true);
        if (typeof window !== "undefined") {
            window.localStorage.setItem("ireside.sidebar_updates_dismissed", "true");
        }
    };

    // Filter items according to search query
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredSections = sections.map((sec) => {
        if (!normalizedQuery) return sec;
        const matchingItems = sec.items.filter((item) => 
            t(item.label).toLowerCase().includes(normalizedQuery) ||
            (item.description && t(item.description).toLowerCase().includes(normalizedQuery))
        );
        return {
            ...sec,
            items: matchingItems,
        };
    }).filter((sec) => !normalizedQuery || sec.items.length > 0);

    const renderNavItem = (item: SidebarNavItem, nested = false) => {
        const isActive = isItemActive(item.href);
        const stage: SidebarLockStage = lockStage !== undefined
            ? lockStage
            : (isLocked ? "no_property" : null);

        let isItemLocked = false;
        let resolvedHref = item.href;
        let lockBadgeText = "Setup Required";
        let lockTooltipText = "";
        let lockToastText = "";

        if (stage === "no_property") {
            isItemLocked = Boolean(
                item.href !== "/landlord/properties" && 
                item.href !== "/landlord/properties/new"
            );
            resolvedHref = item.href === "/landlord/properties"
                ? "/landlord/properties/new"
                : item.href;
            lockBadgeText = "Onboarding in Progress";
            lockTooltipText = "Currently completing onboarding. Complete property setup to unlock this section.";
            lockToastText = "Onboarding in progress. Complete your property setup first to unlock portal operations.";
        } else if (stage === "no_unit_map") {
            isItemLocked = Boolean(item.href !== "/landlord/unit-map");
            resolvedHref = item.href;
            lockBadgeText = "Onboarding in Progress";
            lockTooltipText = "Currently completing onboarding. Complete property setup to unlock this section.";
            lockToastText = "Onboarding in progress. Complete your property setup first to unlock portal operations.";
        } else if (stage === "no_billing_rails") {
            const allowedHrefs = [
                "/landlord/dashboard", 
                "/landlord/properties", 
                "/landlord/properties/new", 
                "/landlord/unit-map", 
                "/landlord/utility-billing"
            ];
            isItemLocked = !allowedHrefs.includes(item.href);
            resolvedHref = item.href;
            lockBadgeText = "Billing Setup Required";
            lockTooltipText = "Currently completing onboarding. Configure payment methods and utility rates to unlock resident management.";
            lockToastText = "Configure your payment channels and utility tariffs to unlock resident management.";
        } else if (stage === "no_tenant") {
            const allowedHrefs = [
                "/landlord/dashboard", 
                "/landlord/properties", 
                "/landlord/properties/new", 
                "/landlord/unit-map", 
                "/landlord/utility-billing", 
                "/landlord/invoices", 
                "/landlord/tenants", 
                "/landlord/applications"
            ];
            isItemLocked = !allowedHrefs.includes(item.href);
            resolvedHref = item.href;
            lockBadgeText = "Tenant Setup Required";
            lockTooltipText = "Complete property setup and register your first tenant to unlock portal operations.";
            lockToastText = "Complete property setup and register your first tenant to unlock portal operations.";
        }

        const tooltipContent = (
            <div className="flex flex-col gap-1 max-w-[220px] text-left py-0.5">
                <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-foreground tracking-tight">{t(item.label)}</span>
                    {item.warning ? (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                            <AlertTriangle className="size-2.5" />
                            Action Needed
                        </span>
                    ) : isItemLocked ? (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                            <Lock className="size-2.5" />
                            {lockBadgeText}
                        </span>
                    ) : item.badge && !item.warning ? (
                        <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.2 text-[9px] font-bold text-white">
                            {item.badge > 99 ? '99+' : item.badge}
                        </span>
                    ) : item.urgent ? (
                        <span className="size-1.5 rounded-full bg-red-500 animate-ping" />
                    ) : null}
                </div>
                {item.warning ? (
                    <span className="text-[11px] font-medium text-amber-500/90 leading-snug">
                        {item.warningTooltip || "Begin setting up your tenants."}
                    </span>
                ) : isItemLocked ? (
                    <span className="text-[11px] font-medium text-amber-500/90 leading-snug">
                        {lockTooltipText}
                    </span>
                ) : item.description ? (
                    <span className="text-[11px] font-medium text-muted-foreground/90 leading-snug">
                        {t(item.description)}
                    </span>
                ) : null}
            </div>
        );

        return (
            <Tooltip
                key={item.href}
                content={isItemLocked || Boolean(item.warning) ? tooltipContent : undefined}
                side="right"
                align="center"
                sideOffset={14}
                showArrow
            >
                <div className="relative group/row flex items-center w-full">
                    <Link
                        href={resolvedHref}
                        prefetch={!isItemLocked}
                        data-tour-id={item.tourId}
                        aria-current={isActive && !isItemLocked ? "page" : undefined}
                        aria-disabled={isItemLocked}
                        onClick={(e) => {
                            if (isItemLocked) {
                                e.preventDefault();
                                toast.warning(lockToastText);
                            }
                        }}
                        className={cn(
                            "group relative flex items-center justify-between py-2 px-3 mx-1 my-0.5 rounded-xl transition-colors duration-150 ease-out cursor-pointer flex-1 min-w-0",
                            isItemLocked
                                ? "opacity-35 cursor-not-allowed text-muted-foreground hover:text-muted-foreground active:scale-100 shadow-none pointer-events-auto"
                                : cn(
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                    isActive
                                        ? "bg-primary/10 text-primary font-bold"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                )
                        )}
                    >
                        {/* Flat 2D Active Indicator Bar - vertically centered */}
                        {isActive && !isItemLocked && (
                            <span 
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary"
                                aria-hidden="true" 
                            />
                        )}

                        <div className="flex items-center gap-2.5 min-w-0">
                            <item.icon 
                                className={cn(
                                    "size-4.5 shrink-0 transition-transform duration-200", 
                                    isActive && !isItemLocked ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )} 
                                aria-hidden="true" 
                            />
                            <span
                                className={cn(
                                    "whitespace-nowrap text-xs font-medium tracking-normal truncate transition-colors",
                                    isActive ? "text-primary font-bold" : "text-foreground/90"
                                )}
                            >
                                {t(item.label)}
                            </span>
                        </div>

                        {/* Inline Badges & Status Icons */}
                        <div className="flex items-center gap-1.5 ml-auto shrink-0 pl-1">
                            {isItemLocked && (
                                <Lock className="size-3.5 text-muted-foreground/60 shrink-0" />
                            )}

                            {!isItemLocked && item.warning && (
                                <span
                                    data-testid={`warning-icon-${item.label.toLowerCase()}`}
                                    className="flex items-center justify-center text-amber-500 shrink-0"
                                    title={item.warningTooltip || "Action needed: Begin setting up your tenants"}
                                >
                                    <AlertTriangle className="size-3.5 text-amber-500 animate-pulse" />
                                </span>
                            )}

                            {!isItemLocked && item.badge && !item.warning && (
                                <span className={cn(
                                    "flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white",
                                    item.urgent && "animate-pulse"
                                )}>
                                    {item.badge > 99 ? '99+' : item.badge}
                                </span>
                            )}
                        </div>
                    </Link>

                    {/* Targeted Action Button (Guideline 10) */}
                    {item.action && !isItemLocked && (
                        <div className="opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity pr-2 shrink-0">
                            <Tooltip content={`${item.action.label}${item.action.hotkey ? ` (${item.action.hotkey})` : ''}`} side="right" sideOffset={8}>
                                {item.action.href ? (
                                    <Link
                                        href={item.action.href}
                                        className="flex size-6 items-center justify-center rounded-md hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                                        aria-label={item.action.label}
                                    >
                                        <item.action.icon className="size-3.5" />
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={item.action.onClick}
                                        className="flex size-6 items-center justify-center rounded-md hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                                        aria-label={item.action.label}
                                    >
                                        <item.action.icon className="size-3.5" />
                                    </button>
                                )}
                            </Tooltip>
                        </div>
                    )}
                </div>
            </Tooltip>
        );
    };

    return (
        <TooltipProvider delayDuration={400} skipDelayDuration={150}>
            <aside
                style={{ width: sidebarWidth }}
                className={cn(
                    "fixed left-0 top-0 z-40 flex h-screen flex-col bg-card dark:bg-zinc-900 text-foreground border-r border-border/60 shadow-xs select-none",
                    className
                )}
                aria-label="Sidebar Navigation"
            >
                {/* Header (Branding & Global Controls) */}
                <div className="flex h-16 items-center justify-between px-3.5 border-b border-border/40 gap-2 shrink-0">
                    <div className="flex items-center min-w-0 flex-1 overflow-hidden pr-1">
                        <LogoLink 
                            isLocked={Boolean((isLocked || lockStage) && lockStage !== "no_tenant")} 
                            lockToastText="Onboarding in progress. Complete your property setup first to unlock portal operations."
                        >
                            <BrandLogo size="md" className="w-full min-w-0" />
                        </LogoLink>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        {!onClose && (
                            <Tooltip content="Toggle theme" side="bottom" sideOffset={8}>
                                <ThemeToggle variant="sidebar" className="size-8 shrink-0" />
                            </Tooltip>
                        )}
                        {onClose && (
                            <Tooltip content="Close navigation" side="bottom" sideOffset={8}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    aria-label="Close navigation"
                                >
                                    <X className="size-4" />
                                </button>
                            </Tooltip>
                        )}
                    </div>
                </div>

                {/* Header Content (Account / Property Switcher - Guideline 8) */}
                {header && (
                    <div className="py-2.5 px-3 shrink-0">
                        {header}
                    </div>
                )}

                {/* Quick Search Field (Guideline 9) */}
                <div className="px-3 pb-1 shrink-0">
                    <div className="relative flex items-center">
                        <Search className="absolute left-2.5 size-3.5 text-muted-foreground/60 pointer-events-none" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={t("Quick search...")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 w-full rounded-lg border border-border/60 bg-muted/20 pl-8 pr-12 text-xs text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
                            aria-label="Search navigation menu"
                        />
                        {searchQuery ? (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 p-0.5 text-muted-foreground hover:text-foreground"
                                aria-label="Clear search"
                            >
                                <X className="size-3" />
                            </button>
                        ) : (
                            <kbd className="absolute right-2 pointer-events-none hidden sm:inline-flex h-4 select-none items-center gap-0.5 rounded border border-border/60 bg-muted/40 px-1 font-mono text-[9px] font-medium text-muted-foreground">
                                ⌘K
                            </kbd>
                        )}
                    </div>
                </div>

                {/* Navigation Items (Guideline 3 & 4) */}
                <nav className="flex-1 custom-scrollbar-premium space-y-1 overflow-y-auto px-1.5 py-1.5" aria-label="Main Navigation">
                    {portalLabel && (
                        <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                            {portalLabel}
                        </div>
                    )}

                    {filteredSections.length === 0 && searchQuery && (
                        <div className="py-6 px-3 text-center">
                            <p className="text-xs font-medium text-muted-foreground">No menu items match &quot;{searchQuery}&quot;</p>
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="mt-2 text-[11px] font-bold text-primary hover:underline"
                            >
                                Clear search
                            </button>
                        </div>
                    )}

                    <div className="space-y-1">
                        {filteredSections.map((section) => {
                            const hasActiveItem = section.items.some((item) => isItemActive(item.href));
                            const isCollapsible = section.collapsible ?? !section.hideHeading;
                            const fallbackExpanded = section.defaultExpanded ?? hasActiveItem;
                            // Auto-expand sections when user is actively searching
                            const isExpanded = normalizedQuery 
                                ? true 
                                : (!isCollapsible ? true : (expandedOverrides[section.category] ?? fallbackExpanded));
                            const SectionIcon = section.icon;
                            const sectionId = getSectionId(section.category);

                            return (
                                <React.Fragment key={section.category}>
                                    {section.dividerBefore && (
                                        <div className="mx-2 my-1.5 border-t border-border/40" />
                                    )}

                                    {/* Section heading */}
                                    {!section.hideHeading && (
                                        <button
                                            type="button"
                                            aria-expanded={isExpanded}
                                            aria-controls={sectionId}
                                            onClick={() => toggleSection(section.category, fallbackExpanded)}
                                            className={cn(
                                                "group flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                                                hasActiveItem ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground",
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                {SectionIcon && (
                                                    <SectionIcon className={cn("size-3.5", hasActiveItem ? "text-primary" : "text-muted-foreground")} />
                                                )}
                                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">{t(section.category)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {!isExpanded && section.items.some((i) => i.badge || i.urgent || i.warning) && (
                                                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                                                )}
                                                {isCollapsible && (
                                                    <ChevronDown className={cn("size-3 text-muted-foreground/70 transition-transform duration-200", isExpanded ? "rotate-180" : "")} />
                                                )}
                                            </div>
                                        </button>
                                    )}

                                    {/* Section items container */}
                                    {!section.hideHeading ? (
                                        <div id={sectionId} className="space-y-0.5">
                                            <AnimatePresence initial={false}>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={prefersReducedMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
                                                        animate={prefersReducedMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                                                        exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                                                        transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                                                        className="space-y-0.5 overflow-visible"
                                                    >
                                                        {section.items.map((item) => renderNavItem(item, true))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ) : (
                                        /* No heading: render items directly */
                                        <div id={sectionId} className="space-y-0.5">
                                            {section.items.map((item) => renderNavItem(item, false))}
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </nav>

                {/* Updates Area (Guideline 11) */}
                {!isUpdateCardDismissed && (
                    <div className="px-3 py-1.5 shrink-0">
                        <div className="relative flex flex-col gap-1 rounded-xl border border-border/70 dark:border-border/60 bg-muted/20 p-2.5 text-xs">
                            <button
                                type="button"
                                onClick={handleDismissUpdateCard}
                                className="absolute right-2 top-2 p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors"
                                aria-label="Dismiss product update"
                            >
                                <X className="size-3" />
                            </button>
                            <div className="flex items-center gap-1.5 text-primary font-bold text-[11px]">
                                <Megaphone className="size-3" />
                                <span>What&apos;s New</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug pr-4">
                                2D Room Map & Quick Actions are now live on your dashboard.
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer (Pinned Utilities - Guideline 5) */}
                <div className="border-t border-border/40 p-3 space-y-1.5 shrink-0">
                    {footer && (
                        <div className="transition-all duration-200">
                            {footer}
                        </div>
                    )}
                    
                    <div className="flex items-center justify-between gap-2 px-1 py-0.5">
                        <span className="text-xs font-bold text-muted-foreground">{t("Language")}:</span>
                        <LanguageToggle variant="compact" />
                    </div>

                    <button
                        type="button"
                        suppressHydrationWarning
                        onClick={onLogout}
                        className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={t(logoutLabel)}
                    >
                        <LogOut className="size-4.5 shrink-0" />
                        <span className="text-xs font-bold">{t(logoutLabel)}</span>
                    </button>
                </div>

                {/* Adjustable Width Drag Handle (Guideline 12) */}
                <div
                    onMouseDown={handleResizeMouseDown}
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize sidebar"
                    className={cn(
                        "absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/40 active:bg-primary z-50 transition-colors select-none group",
                        isResizing && "bg-primary w-2"
                    )}
                    title="Drag to resize sidebar (240px - 300px)"
                >
                    <div className="hidden group-hover:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-primary/60" />
                </div>
            </aside>
        </TooltipProvider>
    );
}
