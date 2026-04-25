"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import RevenueChart from "@/components/RevenueChart";
import { PropertyEnvironmentBanner } from "@/components/landlord/PropertyEnvironmentBanner";
import {
    Search,
    Plus,
    Filter,
    MapPin,
    Building2,
    Zap,
    TrendingUp,
    Settings,
    Wallet,
    Wrench,
    Users,
    X,
    Map,
    Edit3,
    Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";

type PropertyStatus = "Performing" | "Stable" | "Attention Required";

type PropertyCard = {
    id: string;
    name: string;
    address: string;
    type: string;
    needsReview?: boolean;
    capRate: string;
    noi: string;
    valuation: string;
    metrics: {
        occupied: number;
        total: number;
        maintenance: number;
    };
    recentActivity: string;
    status: PropertyStatus;
    image: string;
};

const FILTER_TABS = ["All", "Performing", "Attention Required"] as const;

const getStyleByStatus = (status: PropertyStatus) => {
    if (status === "Performing") {
        return {
            iconColor: "text-emerald-500",
            bgIcon: "bg-emerald-500/10",
        };
    }

    if (status === "Attention Required") {
        return {
            iconColor: "text-amber-500",
            bgIcon: "bg-amber-500/10",
        };
    }

    return {
        iconColor: "text-blue-500",
        bgIcon: "bg-blue-500/10",
    };
};

export function PropertiesDashboard() {
    const [properties, setProperties] = useState<PropertyCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"All" | "Performing" | "Attention Required">("All");
    const [expandedStatsId, setExpandedStatsId] = useState<string | null>(null);
    const [hubModalId, setHubModalId] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const loadProperties = async () => {
            setIsLoading(true);
            setLoadError(null);

            try {
                const response = await fetch("/api/landlord/properties/overview", {
                    method: "GET",
                    signal: controller.signal,
                });

                const payload = (await response.json()) as { properties?: PropertyCard[]; error?: string };

                if (!response.ok) {
                    throw new Error(payload.error || "Failed to load properties.");
                }

                if (!controller.signal.aborted) {
                    setProperties(payload.properties ?? []);
                }
            } catch (error) {
                if ((error as Error).name === "AbortError") return;
                if (!controller.signal.aborted) {
                    setLoadError(error instanceof Error ? error.message : "Failed to load properties.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        void loadProperties();

        return () => {
            controller.abort();
        };
    }, [reloadKey]);

    const filteredProperties = useMemo(() => {
        return properties.filter((prop) => {
            const matchesSearch =
                prop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                prop.address.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTab =
                activeTab === "All" ||
                (activeTab === "Performing" && (prop.status === "Performing" || prop.status === "Stable")) ||
                (activeTab === "Attention Required" && prop.status === "Attention Required");
            return matchesSearch && matchesTab;
        });
    }, [properties, searchQuery, activeTab]);

    return (
        <div className="min-h-screen space-y-8 px-3 pb-12 pt-6 text-foreground sm:px-4 lg:px-5 xl:px-6">
            {/* Command Center / Header */}
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-sm">
                {/* Top Accent Line */}
                <div className="absolute inset-x-0 top-0 h-px bg-border" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/75 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-md">
                            <Building2 className="h-3.5 w-3.5 text-primary" />
                            <span>Portfolio Management</span>
                        </div>
                        <h1 className="mb-2 text-4xl font-black tracking-tight text-foreground md:text-5xl">
                            Property Portfolio
                        </h1>
                        <p className="max-w-xl text-lg text-muted-foreground">
                            Real-time performance metrics and operational health for your entire real estate portfolio.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button className="flex h-12 items-center gap-2 rounded-xl border border-border bg-background/75 px-6 font-medium text-foreground transition-all hover:bg-muted/70">
                            <Filter className="h-4 w-4" />
                            Analytics
                        </button>
                        <Link href="/landlord/properties/new" className="flex h-12 items-center gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-[0_14px_30px_-18px_rgba(var(--primary-rgb),0.65)] transition-all hover:bg-primary/90">
                            <Plus className="h-5 w-5" />
                            New Asset
                        </Link>
                    </div>
                </div>


            </div>

            {/* View Controls & Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex w-full rounded-xl border border-border bg-card/95 p-1 shadow-sm sm:w-auto">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                                activeTab === tab
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search properties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 w-full rounded-xl border border-border bg-card/95 pl-11 pr-4 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary/35 focus:outline-none"
                    />
                </div>
            </div>

            {/* Assets Stack View */}
            <div className="space-y-6">
                {isLoading && (
                    <div className="space-y-6">
                        {[1, 2, 3, 4].map((i) => (
                            <PropertySkeleton key={i} />
                        ))}
                    </div>
                )}

                {!isLoading && loadError && (
                    <div className="rounded-3xl border border-red-500/20 bg-card/95 py-20 text-center shadow-sm">
                        <Building2 className="mx-auto mb-4 h-12 w-12 text-red-500 dark:text-red-400" />
                        <h3 className="mb-2 text-xl font-bold text-foreground">Failed to load portfolio</h3>
                        <p className="mb-6 text-sm text-red-600 dark:text-red-300">{loadError}</p>
                        <button
                            onClick={() => setReloadKey((value) => value + 1)}
                            className="h-11 rounded-xl border border-border bg-background px-5 font-medium text-foreground transition-colors hover:bg-muted"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!isLoading && !loadError && filteredProperties.map((property) => {
                    const style = getStyleByStatus(property.status);
                    const occupancyRatio = property.metrics.total > 0 ? property.metrics.occupied / property.metrics.total : 0;
                    const occupancyPercent = Math.round(occupancyRatio * 100);

                    return (
                        <div key={property.id} className="group relative overflow-hidden rounded-3xl border border-border bg-card/95 shadow-sm transition-all duration-500 hover:border-primary/20 hover:shadow-[0_18px_34px_-28px_rgba(15,23,42,0.35)] dark:hover:border-white/10">
                            {/* No Ambient Glow */}

                            <div className="flex flex-col lg:flex-row relative z-10 w-full">
                                {/* Left Image Section */}
                                <div className="lg:w-[320px] 2xl:w-[380px] shrink-0 min-h-[200px] h-[240px] lg:h-auto relative overflow-hidden">
                                    <Image
                                        src={property.image}
                                        alt={property.name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    {/* No Image Gradient */}
                                </div>

                                {/* Right Content Section */}
                                <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between">
                                    {/* Header: Name, Address & Status */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-2xl font-bold text-foreground leading-tight">{property.name}</h3>
                                                <div className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap",
                                                    property.status === "Performing" || property.status === "Stable"
                                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                        : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                )}>
                                                    <span className={cn(
                                                        "w-1.5 h-1.5 rounded-full animate-pulse",
                                                        property.status === "Performing" || property.status === "Stable" ? "bg-emerald-500" : "bg-amber-500"
                                                    )} />
                                                    {property.status}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                                                <MapPin className="h-3.5 w-3.5" />
                                                <span>{property.address}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Operational Metrics & Activities */}
                                    <div className="flex w-full flex-col justify-between gap-8 lg:flex-row lg:items-center">
                                        <div className="flex flex-wrap items-center gap-6 lg:gap-10">
                                            {/* Occupancy Mini-Visual */}
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-14 h-14">
                                                    <svg className="w-full h-full transform -rotate-90">
                                                        <circle cx="28" cy="28" r="24" fill="transparent" stroke="currentColor" className="text-muted/15" strokeWidth="4" />
                                                        <circle
                                                            cx="28" cy="28" r="24"
                                                            fill="transparent"
                                                            stroke="currentColor"
                                                            className="text-primary"
                                                            strokeWidth="4"
                                                            strokeDasharray="150"
                                                            strokeDashoffset={150 - (150 * occupancyRatio)}
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/95 text-primary shadow-sm dark:border-white/10 dark:bg-neutral-950/90">
                                                            <Users className="h-5 w-5 text-primary" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Occupancy</p>
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-xl font-black text-foreground">{property.metrics.occupied}</span>
                                                        <span className="text-xs font-medium text-muted-foreground">/ {property.metrics.total} Units</span>
                                                    </div>
                                                    <p className={cn(
                                                        "text-[10px] font-bold uppercase tracking-tight",
                                                        occupancyPercent > 80 ? "text-emerald-500" : "text-amber-500"
                                                    )}>{occupancyPercent}% occupied</p>
                                                </div>
                                            </div>

                                            <div className="hidden h-10 w-px bg-border/60 sm:block" />

                                            {/* Maintenance Status */}
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors",
                                                    property.metrics.maintenance > 0 
                                                        ? "border-amber-500/20 bg-amber-500/5 text-amber-500" 
                                                        : "border-border bg-muted/30 text-muted-foreground"
                                                )}>
                                                    <Wrench className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Maintenance</p>
                                                    <p className={cn(
                                                        "text-xl font-black",
                                                        property.metrics.maintenance > 3 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                                                    )}>
                                                        {property.metrics.maintenance}
                                                        <span className="ml-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Active</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3 w-full lg:w-auto">
                                            <button 
                                                onClick={() => setExpandedStatsId(expandedStatsId === property.id ? null : property.id)}
                                                className={cn(
                                                    "flex-1 lg:flex-none h-12 px-6 flex items-center justify-center gap-2 rounded-xl font-bold transition-all",
                                                    expandedStatsId === property.id
                                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                        : "bg-primary/10 text-primary hover:bg-primary/15"
                                                )}
                                            >
                                                <TrendingUp className="h-4 w-4" />
                                                <span>Stats</span>
                                            </button>
                                            <button 
                                                onClick={() => setHubModalId(property.id)}
                                                className="flex-1 lg:flex-none h-12 px-6 flex items-center justify-center gap-2 rounded-xl border border-border bg-background font-bold text-foreground transition-all hover:bg-muted"
                                            >
                                                <Settings className="h-4 w-4" />
                                                <span>Manage</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Collapsible Stats Panel */}
                            <AnimatePresence>
                                {expandedStatsId === property.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="overflow-hidden border-t border-border"
                                    >
                                        <div className="grid grid-cols-1 gap-8 bg-muted/20 p-6 lg:grid-cols-3 lg:p-8">
                                            {/* Financial Highlights */}
                                            <div className="space-y-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Wallet className="h-4 w-4 text-muted-foreground" />
                                                        <h4 className="text-sm font-medium text-muted-foreground">Financial Highlights</h4>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="flex items-end justify-between border-b border-border pb-4">
                                                            <div>
                                                                <p className="mb-1 text-xs text-muted-foreground">Net Operating Income (NOI)</p>
                                                                <p className="text-xl font-bold text-foreground">{property.noi}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                                                <TrendingUp className="h-3 w-3" /> +12% y/y
                                                            </div>
                                                        </div>
                                                        <div className="flex items-end justify-between border-b border-border pb-4">
                                                            <div>
                                                                <p className="mb-1 text-xs text-muted-foreground">Estimated Valuation</p>
                                                                <p className="text-xl font-bold text-foreground">{property.valuation}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-end">
                                                            <div>
                                                                <p className="mb-1 text-xs text-muted-foreground">Capitalization Rate</p>
                                                                <p className="text-xl font-bold text-foreground">{property.capRate}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Revenue Chart */}
                                            <div className="lg:col-span-2">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="h-4 w-4 text-muted-foreground" />
                                                        <h4 className="text-sm font-medium text-muted-foreground">Revenue Trend (YTD)</h4>
                                                    </div>
                                                </div>
                                                <div className="h-[300px] w-full rounded-xl border border-border bg-background/75 p-4">
                                                    <RevenueChart />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}

                {!isLoading && !loadError && filteredProperties.length === 0 && (
                    <div className="rounded-3xl border border-border bg-card/95 py-20 text-center shadow-sm">
                        <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-xl font-bold text-foreground">No matching assets</h3>
                        <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                    </div>
                )}
            </div>

            {/* Manage Hub Modal */}
            <AnimatePresence>
                {hubModalId && (() => {
                    const activeProperty = properties.find(p => p.id === hubModalId);
                    if (!activeProperty) return null;

                    return (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setHubModalId(null)}
                                className="absolute inset-0 bg-black/55 backdrop-blur-sm"
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card/98 p-6 shadow-2xl lg:p-8"
                            >
                                <button 
                                    onClick={() => setHubModalId(null)}
                                    className="absolute right-6 top-6 rounded-full bg-background p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                
                                <div className="mb-6 flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 relative">
                                        <Image src={activeProperty.image} fill alt="Property" className="object-cover" />
                                    </div>
                                    <div>
                                        <p className="mb-1 text-sm font-bold uppercase tracking-wider text-primary">Quick Actions</p>
                                        <h2 className="text-2xl font-bold leading-tight text-foreground">{activeProperty.name}</h2>
                                    </div>
                                </div>

                                <PropertyEnvironmentBanner environmentMode={activeProperty.type} needsReview={activeProperty.needsReview} propertyId={activeProperty.id} className="mb-6" />

                                <div className="grid grid-cols-2 gap-3">
                                    <Link href={`/landlord/properties/new?id=${activeProperty.id}&mode=edit`} className="group flex flex-col items-center justify-center rounded-2xl border border-border bg-background/75 p-4 transition-all hover:bg-muted">
                                        <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Edit3 className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground">Edit Details</span>
                                    </Link>
                                    
                                    <Link href={`/landlord/unit-map?property=${activeProperty.id}`} className="group flex flex-col items-center justify-center rounded-2xl border border-border bg-background/75 p-4 transition-all hover:bg-muted">
                                        <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Map className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground">Unit Map</span>
                                    </Link>


                                    <Link href="/landlord/tenants" className="group flex flex-col items-center justify-center rounded-2xl border border-border bg-background/75 p-4 transition-all hover:bg-muted">
                                        <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground">View Tenants</span>
                                    </Link>

                                    <Link href="/landlord/maintenance" className="group flex flex-col items-center justify-center rounded-2xl border border-border bg-background/75 p-4 transition-all hover:bg-muted">
                                        <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Wrench className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground">Maintenance</span>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
}

function PropertySkeleton() {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/95 shadow-sm flex flex-col lg:flex-row group">
            {/* Shimmer Effect */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent -translate-x-full animate-shimmer" style={{ animationDuration: '2.5s' }} />
            </div>

            {/* Left Image Section Skeleton */}
            <div className="lg:w-[320px] 2xl:w-[380px] shrink-0 h-[240px] lg:h-auto bg-muted animate-pulse" />

            {/* Content Section Skeleton */}
            <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-48 rounded-xl bg-muted animate-pulse" />
                            <div className="h-6 w-24 rounded-full bg-muted/60 animate-pulse" />
                        </div>
                        <div className="h-4 w-64 rounded-md bg-muted/50 animate-pulse" />
                    </div>
                </div>

                <div className="flex w-full flex-col justify-between gap-8 lg:flex-row lg:items-center">
                    <div className="flex flex-wrap items-center gap-8 lg:gap-12">
                        {/* Occupancy Skeleton */}
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-muted animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-3 w-16 rounded bg-muted/50 animate-pulse" />
                                <div className="h-5 w-24 rounded bg-muted animate-pulse" />
                                <div className="h-3 w-20 rounded bg-muted/40 animate-pulse" />
                            </div>
                        </div>

                        {/* Maintenance Skeleton */}
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-muted animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-3 w-16 rounded bg-muted/50 animate-pulse" />
                                <div className="h-5 w-24 rounded bg-muted animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="h-12 w-28 rounded-xl bg-muted/80 animate-pulse" />
                        <div className="h-12 w-28 rounded-xl bg-muted/80 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}
