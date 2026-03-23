"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import RevenueChart from "@/components/RevenueChart";
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

const getStyleByStatus = (status: PropertyStatus) => {
    if (status === "Performing") {
        return {
            color: "from-emerald-500/20 to-emerald-500/0",
            iconColor: "text-emerald-500",
            bgIcon: "bg-emerald-500/10",
        };
    }

    if (status === "Attention Required") {
        return {
            color: "from-amber-500/20 to-amber-500/0",
            iconColor: "text-amber-500",
            bgIcon: "bg-amber-500/10",
        };
    }

    return {
        color: "from-blue-500/20 to-blue-500/0",
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

                setProperties(payload.properties ?? []);
            } catch (error) {
                if ((error as Error).name === "AbortError") return;
                setLoadError(error instanceof Error ? error.message : "Failed to load properties.");
            } finally {
                setIsLoading(false);
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
        <div className="space-y-8 min-h-screen pb-12">
            {/* Command Center / Header */}
            <div className="bg-[#0a0a0a] rounded-3xl border border-white/5 p-8 relative overflow-hidden">
                {/* Abstract Background Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 opacity-50" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 opacity-30" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-neutral-300 mb-6 backdrop-blur-md">
                            <Building2 className="h-3.5 w-3.5 text-primary" />
                            <span>Portfolio Management</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                            Property Portfolio
                        </h1>
                        <p className="text-neutral-400 text-lg max-w-xl">
                            Real-time performance metrics and operational health for your entire real estate portfolio.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button className="h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all flex items-center gap-2 backdrop-blur-md">
                            <Filter className="h-4 w-4" />
                            Analytics
                        </button>
                        <Link href="/landlord/properties/new" className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                            <Plus className="h-5 w-5" />
                            New Asset
                        </Link>
                    </div>
                </div>


            </div>

            {/* View Controls & Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex bg-[#111] p-1 rounded-xl border border-white/5 w-full sm:w-auto">
                    {["All", "Performing", "Attention Required"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={cn(
                                "flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                                activeTab === tab
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search properties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 bg-[#111] border border-white/5 rounded-xl pl-11 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-colors placeholder:text-neutral-600"
                    />
                </div>
            </div>

            {/* Assets Stack View */}
            <div className="space-y-6">
                {isLoading && (
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse flex flex-col lg:flex-row bg-[#111] border border-white/5 rounded-3xl overflow-hidden min-h-[240px]">
                                <div className="lg:w-[380px] h-[240px] lg:h-auto bg-white/5 flex flex-col justify-between p-6">
                                    <div className="h-6 w-24 bg-white/10 rounded-full" />
                                    <div className="space-y-3">
                                        <div className="h-8 w-48 bg-white/10 rounded" />
                                        <div className="h-4 w-64 bg-white/5 rounded" />
                                    </div>
                                </div>
                                <div className="flex-1 p-6 lg:p-8 flex items-center">
                                    <div className="w-full flex flex-col lg:flex-row justify-between gap-8">
                                        <div className="flex flex-wrap gap-8">
                                            <div className="flex gap-4 items-center">
                                                <div className="w-14 h-14 rounded-full bg-white/5"></div>
                                                <div className="space-y-2">
                                                    <div className="h-4 w-20 bg-white/10 rounded"></div>
                                                    <div className="h-5 w-24 bg-white/5 rounded"></div>
                                                </div>
                                            </div>
                                            <div className="py-2 space-y-2">
                                                <div className="h-4 w-20 bg-white/10 rounded"></div>
                                                <div className="h-5 w-24 bg-white/5 rounded"></div>
                                            </div>
                                            <div className="py-2 space-y-2">
                                                <div className="h-4 w-20 bg-white/10 rounded"></div>
                                                <div className="h-5 w-24 bg-white/5 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && loadError && (
                    <div className="text-center py-20 bg-[#111] rounded-3xl border border-red-500/20">
                        <Building2 className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Failed to load portfolio</h3>
                        <p className="text-red-300 mb-6">{loadError}</p>
                        <button
                            onClick={() => setReloadKey((value) => value + 1)}
                            className="h-11 px-5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!isLoading && !loadError && filteredProperties.map((property) => {
                    const style = getStyleByStatus(property.status);

                    return (
                    <div key={property.id} className="group relative bg-[#111] border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-all duration-500">
                        {/* Ambient Glow */}
                        <div className={cn("absolute top-0 left-0 w-full h-32 bg-gradient-to-b opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-40", style.color)} />

                        <div className="flex flex-col lg:flex-row relative z-10">
                            {/* Left Image Section */}
                            <div className="lg:w-[380px] shrink-0 min-h-[200px] h-[240px] lg:h-auto relative overflow-hidden">
                                <Image
                                    src={property.image}
                                    alt={property.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#111] via-[#111]/80 lg:via-[#111]/60 to-transparent" />

                                <div className="absolute top-6 left-6">
                                    <div className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border",
                                        property.status === "Performing" || property.status === "Stable"
                                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                                            : "bg-amber-500/20 text-amber-400 border-amber-500/20"
                                    )}>
                                        <span className={cn(
                                            "w-1.5 h-1.5 rounded-full animate-pulse",
                                            property.status === "Performing" || property.status === "Stable" ? "bg-emerald-400" : "bg-amber-400"
                                        )} />
                                        {property.status}
                                    </div>
                                </div>

                                <div className="absolute bottom-6 left-6 pr-6">
                                    <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{property.name}</h3>
                                    <div className="flex items-center text-neutral-300 text-sm gap-1.5">
                                        <MapPin className="h-4 w-4" />
                                        <span>{property.address}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Content Section */}
                            <div className="flex-1 p-6 lg:p-8 flex items-center">
                                {/* Operational Metrics & Activities */}
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 w-full">
                                    <div className="flex flex-wrap items-center gap-6 lg:gap-8">
                                        {/* Occupancy Mini-Visual */}
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-14 h-14">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="28" cy="28" r="24" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                                                    <circle
                                                        cx="28" cy="28" r="24"
                                                        fill="custom"
                                                        stroke="currentColor"
                                                        className="text-primary"
                                                        strokeWidth="4"
                                                        strokeDasharray="150"
                                                        strokeDashoffset={150 - (150 * (property.metrics.occupied / property.metrics.total))}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Users className="h-5 w-5 text-primary" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm text-neutral-400 font-medium">Occupancy</p>
                                                <p className="text-white text-lg font-bold">{property.metrics.occupied} <span className="text-neutral-500 text-sm font-normal">/ {property.metrics.total} Units</span></p>
                                            </div>
                                        </div>

                                        <div className="w-px h-12 bg-white/10 hidden sm:block" />

                                        {/* Maintenance Status */}
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", style.bgIcon)}>
                                                <Wrench className={cn("h-6 w-6", style.iconColor)} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-neutral-400 font-medium">Maintenance</p>
                                                <p className={cn(
                                                    "text-lg font-bold",
                                                    property.metrics.maintenance > 3 ? "text-amber-500" : "text-white"
                                                )}>
                                                    {property.metrics.maintenance} <span className="text-neutral-500 text-sm font-normal">Active Requests</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 w-full lg:w-auto self-end lg:self-auto">
                                        <button 
                                            onClick={() => setExpandedStatsId(expandedStatsId === property.id ? null : property.id)}
                                            className="flex-1 lg:flex-none h-12 px-6 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold transition-colors border border-primary/20 flex items-center justify-center gap-2"
                                        >
                                            <TrendingUp className="h-4 w-4" />
                                            {expandedStatsId === property.id ? "Hide Stats" : "View Stats"}
                                        </button>
                                        <button 
                                            onClick={() => setHubModalId(property.id)}
                                            className="flex-1 lg:flex-none h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/5 flex items-center justify-center gap-2"
                                        >
                                            <Settings className="h-4 w-4" />
                                            Manage Hub
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
                                    className="border-t border-white/5 overflow-hidden"
                                >
                                    <div className="p-6 lg:p-8 bg-[#151515] grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* Financial Highlights */}
                                        <div className="space-y-6">
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Wallet className="h-4 w-4 text-neutral-400" />
                                                    <h4 className="text-sm font-medium text-neutral-400">Financial Highlights</h4>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                                        <div>
                                                            <p className="text-xs text-neutral-500 mb-1">Net Operating Income (NOI)</p>
                                                            <p className="text-white font-bold text-xl">{property.noi}</p>
                                                        </div>
                                                        <div className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                                                            <TrendingUp className="h-3 w-3" /> +12% y/y
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                                        <div>
                                                            <p className="text-xs text-neutral-500 mb-1">Estimated Valuation</p>
                                                            <p className="text-white font-bold text-xl">{property.valuation}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-xs text-neutral-500 mb-1">Capitalization Rate</p>
                                                            <p className="text-white font-bold text-xl">{property.capRate}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Revenue Chart */}
                                        <div className="lg:col-span-2">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Zap className="h-4 w-4 text-neutral-400" />
                                                    <h4 className="text-sm font-medium text-neutral-400">Revenue Trend (YTD)</h4>
                                                </div>
                                            </div>
                                            <div className="h-[300px] w-full bg-[#111] rounded-xl border border-white/5 p-4">
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
                    <div className="text-center py-20 bg-[#111] rounded-3xl border border-white/5">
                        <Building2 className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No matching assets</h3>
                        <p className="text-neutral-500">Try adjusting your filters or search query.</p>
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
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 lg:p-8 z-10"
                            >
                                <button 
                                    onClick={() => setHubModalId(null)}
                                    className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                
                                <div className="mb-6 flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 relative">
                                        <Image src={activeProperty.image} fill alt="Property" className="object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-emerald-400 mb-1 tracking-wider uppercase">Quick Actions</p>
                                        <h2 className="text-2xl font-bold text-white leading-tight">{activeProperty.name}</h2>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Link href={`/landlord/properties/new?id=${activeProperty.id}&mode=edit`} className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group">
                                        <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Edit3 className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-white">Edit Details</span>
                                    </Link>
                                    
                                    <Link href={`/landlord/unit-map?property=${activeProperty.id}`} className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group">
                                        <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Map className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-white">Unit Map</span>
                                    </Link>

                                    <Link href={`/landlord/listings?propertyId=${activeProperty.id}`} className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group">
                                        <div className="w-12 h-12 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Megaphone className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-white">Create Listing</span>
                                    </Link>

                                    <Link href="/landlord/tenants" className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group">
                                        <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-white">View Tenants</span>
                                    </Link>

                                    <Link href="/landlord/maintenance" className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group">
                                        <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Wrench className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-white">Maintenance</span>
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

